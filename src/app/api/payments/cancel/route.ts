import { log } from '@/lib/log';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { cancelSubscription } from '@/services/subscription.service';
import prisma from '@/lib/db/prisma';

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let reason: string | undefined;
    try {
      const body = await req.json();
      reason = body?.reason;
    } catch {
      // body is optional
    }

    const sub = await cancelSubscription(user.id, reason);
    return NextResponse.json({ success: true, subscription: sub });
  } catch (err) {
    log.error('[cancel-subscription] failed', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to cancel' },
      { status: 500 }
    );
  }
}
