import { log } from '@/lib/log';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import prisma from '@/lib/db/prisma';
import WeeklyCohortEmail from '@/lib/email/templates/WeeklyCohort';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = process.env.EMAIL_FROM ?? 'Hirin <onboarding@resend.dev>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

function isAuthorizedCron(req: Request): boolean {
  if (req.headers.get('x-vercel-cron') === '1') return true;
  const authHeader = req.headers.get('authorization');
  return Boolean(process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`);
}

/**
 * Sunday-evening "your week vs cohort" report.
 *
 * Cohort baseline: any user with at least 1 application in the last 7d
 * (i.e. actively job-hunting). We compute the average per metric and
 * compare each user to it.
 *
 * Only sends to users who:
 *   - had any activity (lastActiveAt) in the last 14d
 *   - have email digest enabled
 *   - have at least 1 application or 1 bookmark in the past week
 *     (skip empty weeks — nothing to celebrate)
 */
export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    const now = new Date();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Active users (recent activity)
    const activeUsers = await prisma.user.findMany({
      where: {
        emailDigestEnabled: true,
        lastActiveAt: { gte: fourteenDaysAgo },
      },
      select: {
        id: true,
        email: true,
        name: true,
        unsubscribeToken: true,
      },
      take: 500,
    });

    if (activeUsers.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, reason: 'no active users' });
    }

    // Cohort metrics for the same 7d window across all active users
    const cohortAggregate = {
      applications: 0,
      bookmarks: 0,
      matchesViewed: 0,
      coverLettersGenerated: 0, // proxied by # of cover letter API calls — not currently tracked, leave 0
    };
    const userStats = new Map<
      string,
      {
        applications: number;
        bookmarks: number;
        matchesViewed: number;
        coverLettersGenerated: number;
      }
    >();

    for (const u of activeUsers) {
      const [apps, bms, viewed] = await Promise.all([
        prisma.application.count({ where: { userId: u.id, appliedAt: { gte: weekStart } } }),
        prisma.bookmark.count({ where: { userId: u.id, createdAt: { gte: weekStart } } }),
        prisma.jobMatch.count({
          where: {
            userId: u.id,
            status: { in: ['viewed', 'applied'] },
            updatedAt: { gte: weekStart },
          },
        }),
      ]);
      const coverLetters = 0; // future: count from CoverLetter table once persisted

      userStats.set(u.id, {
        applications: apps,
        bookmarks: bms,
        matchesViewed: viewed,
        coverLettersGenerated: coverLetters,
      });
      cohortAggregate.applications += apps;
      cohortAggregate.bookmarks += bms;
      cohortAggregate.matchesViewed += viewed;
      cohortAggregate.coverLettersGenerated += coverLetters;
    }

    const denom = activeUsers.length || 1;
    const cohortAverage = {
      applications: cohortAggregate.applications / denom,
      bookmarks: cohortAggregate.bookmarks / denom,
      matchesViewed: cohortAggregate.matchesViewed / denom,
      coverLettersGenerated: cohortAggregate.coverLettersGenerated / denom,
    };

    let sent = 0;
    let skippedEmptyWeek = 0;
    let errors = 0;

    if (process.env.RESEND_API_KEY) {
      for (const u of activeUsers) {
        const stats = userStats.get(u.id)!;
        if (stats.applications === 0 && stats.bookmarks === 0 && stats.matchesViewed === 0) {
          skippedEmptyWeek++;
          continue;
        }

        const unsubUrl = u.unsubscribeToken
          ? `${APP_URL}/unsubscribe?token=${u.unsubscribeToken}`
          : undefined;

        try {
          await resend.emails.send({
            from: EMAIL_FROM,
            to: [u.email],
            subject: `Your week: ${stats.applications} applications, ${stats.bookmarks} bookmarks`,
            react: WeeklyCohortEmail({
              userName: u.name ?? 'there',
              weekStart,
              yourStats: stats,
              cohortAverage,
              unsubscribeUrl: unsubUrl,
            }),
            tags: [{ name: 'campaign', value: 'weekly_cohort' }],
            ...(unsubUrl
              ? {
                  headers: {
                    'List-Unsubscribe': `<${unsubUrl}>`,
                    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
                  },
                }
              : {}),
          });
          sent++;
        } catch (err) {
          errors++;
          log.error('weekly-cohort send failed', err, { userId: u.id });
        }
      }
    } else {
      log.warn('RESEND_API_KEY missing — skipping weekly-cohort sends');
    }

    return NextResponse.json({
      ok: true,
      cohortSize: activeUsers.length,
      cohortAverage,
      sent,
      skippedEmptyWeek,
      errors,
    });
  } catch (err) {
    log.error('Cron weekly-cohort failed:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
