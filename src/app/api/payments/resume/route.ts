import { log } from '@/lib/log';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { resumeSubscription } from '@/services/subscription.service';
import prisma from '@/lib/db/prisma';

/**
 * POST /api/payments/resume
 * Resumes a previously-cancelled subscription that hasn't yet expired.
 */
export async function POST() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const sub = await resumeSubscription(user.id);
    return NextResponse.json({ success: true, subscription: sub });
  } catch (err) {
    log.error('resume subscription failed', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to resume' },
      { status: 500 },
    );
  }
}
