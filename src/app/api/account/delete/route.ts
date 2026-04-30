import { log } from '@/lib/log';
import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import prisma from '@/lib/db/prisma';
import { dodo } from '@/lib/payments/dodo';

/**
 * DELETE /api/account/delete
 *
 * GDPR right-to-erasure flow:
 *  1. Cancel active Dodo subscription (so we don't keep charging the user)
 *  2. Delete the Prisma User row (cascade: Resume, JobMatch, Application,
 *     Bookmark, SocialLink, Project, Subscription, JobPreferences)
 *  3. Delete the Clerk user (so they can't sign back in to a ghost account)
 *
 * If any step fails we still try the others — best-effort. The user gets
 * back a JSON of which steps succeeded so support can clean up manually
 * if needed.
 */
export async function DELETE() {
  const result = {
    cancelledSubscription: false,
    deletedFromDb: false,
    deletedFromClerk: false,
  };

  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: { subscription: true },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // 1. Cancel Dodo subscription if active
    if (
      dodo &&
      user.subscription?.dodoSubscriptionId &&
      user.subscription.status === 'active'
    ) {
      try {
        await dodo.subscriptions.update(user.subscription.dodoSubscriptionId, {
          cancel_at_next_billing_date: true,
        });
        result.cancelledSubscription = true;
      } catch (err) {
        log.error('account delete: cancel sub failed', err, { userId: user.id });
      }
    }

    // 2. Delete user row (cascades by Prisma onDelete: Cascade relations)
    try {
      await prisma.user.delete({ where: { id: user.id } });
      result.deletedFromDb = true;
    } catch (err) {
      log.error('account delete: prisma delete failed', err, { userId: user.id });
      return NextResponse.json(
        { error: 'Failed to delete account data', result },
        { status: 500 },
      );
    }

    // 3. Delete from Clerk (best-effort; user is already gone from our DB)
    try {
      const client = await clerkClient();
      await client.users.deleteUser(clerkId);
      result.deletedFromClerk = true;
    } catch (err) {
      log.error('account delete: clerk delete failed', err, { clerkId });
    }

    return NextResponse.json({ ok: true, result });
  } catch (err) {
    log.error('account delete failed', err);
    return NextResponse.json({ error: 'Account deletion failed', result }, { status: 500 });
  }
}
