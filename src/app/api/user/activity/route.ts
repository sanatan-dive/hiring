import { log } from '@/lib/log';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/db/prisma';
import { updateStreakOnActivity } from '@/services/streak.service';

/**
 * POST /api/user/activity
 *
 * Idempotent ping called by the client on page load (or any meaningful
 * action). Updates lastActiveAt and bumps dailyStreak if it's a new day.
 *
 * Returns the current streak so the UI can show it.
 */
export async function POST() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const result = await updateStreakOnActivity(user.id);
    return NextResponse.json(result);
  } catch (err) {
    log.error('activity ping failed', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
