import { log } from '@/lib/log';
import prisma from '@/lib/db/prisma';

/**
 * Streak rules:
 * - "Active" = any activity logged today (page view, application, AI generation, etc.)
 * - Daily streak = consecutive days with at least one activity
 * - Reset when user misses a full day (>48h gap)
 *
 * The streak field is updated by:
 *   1. updateStreakOnActivity()  — called from /api/user/activity (live)
 *   2. resetExpiredStreaks() cron — called nightly to reset streaks of
 *      users who didn't show up yesterday
 */

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function startOfDayUTC(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

export async function updateStreakOnActivity(userId: string): Promise<{
  dailyStreak: number;
  longestStreak: number;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastActiveAt: true, dailyStreak: true, longestStreak: true },
  });
  if (!user) return { dailyStreak: 0, longestStreak: 0 };

  const now = new Date();
  const today = startOfDayUTC(now);
  const last = user.lastActiveAt ? startOfDayUTC(user.lastActiveAt) : null;

  let newStreak = user.dailyStreak;

  if (!last) {
    // First-ever activity
    newStreak = 1;
  } else {
    const dayGap = Math.round((today.getTime() - last.getTime()) / ONE_DAY_MS);
    if (dayGap === 0) {
      // Already counted today
      return { dailyStreak: user.dailyStreak, longestStreak: user.longestStreak };
    } else if (dayGap === 1) {
      // Yesterday → today: extend streak
      newStreak = user.dailyStreak + 1;
    } else {
      // Missed a day → reset
      newStreak = 1;
    }
  }

  const newLongest = Math.max(user.longestStreak, newStreak);

  await prisma.user.update({
    where: { id: userId },
    data: {
      lastActiveAt: now,
      dailyStreak: newStreak,
      longestStreak: newLongest,
    },
  });

  return { dailyStreak: newStreak, longestStreak: newLongest };
}

/**
 * Nightly: reset dailyStreak to 0 for users who didn't show up yesterday.
 * (We don't decrement, just reset, because partial decrements feel unfair.)
 */
export async function resetExpiredStreaks(): Promise<number> {
  const cutoff = new Date(Date.now() - 2 * ONE_DAY_MS); // anything older than 48h
  try {
    const result = await prisma.user.updateMany({
      where: {
        dailyStreak: { gt: 0 },
        OR: [
          { lastActiveAt: null },
          { lastActiveAt: { lt: cutoff } },
        ],
      },
      data: { dailyStreak: 0 },
    });
    return result.count;
  } catch (err) {
    log.error('reset expired streaks failed', err);
    return 0;
  }
}
