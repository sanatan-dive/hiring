import { log } from '@/lib/log';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

function isAuthorizedCron(req: Request): boolean {
  if (req.headers.get('x-vercel-cron') === '1') return true;
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    return true;
  }
  return false;
}

/**
 * STUB cron: 7-day "no response yet?" application follow-up nudge.
 *
 * Status: stubbed pending an `Application.lastReminderAt` schema field.
 * Without that field we can't track which applications have already been
 * nudged, so actually sending mail risks repeated nudges on every cron run.
 * Instead this route logs each candidate so we can verify wiring + the
 * Vercel cron schedule end-to-end before the schema migration.
 *
 * The query window (>7d, <14d since appliedAt) is the future de-dup
 * heuristic; we keep it here so the candidate count returned matches
 * what production will eventually send.
 */
export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const candidates = await prisma.application.findMany({
      where: {
        status: 'applied',
        appliedAt: {
          lt: sevenDaysAgo,
          gt: fourteenDaysAgo,
        },
      },
      select: {
        id: true,
        appliedAt: true,
        user: { select: { email: true } },
        job: { select: { title: true, company: true } },
      },
    });

    for (const app of candidates) {
      log.info('Would send reminder', {
        appId: app.id,
        company: app.job.company,
        title: app.job.title,
        userEmail: app.user.email,
        appliedAt: app.appliedAt,
      });
    }

    return NextResponse.json({
      wouldSend: candidates.length,
      note: 'Email sending stubbed pending lastReminderAt schema field',
    });
  } catch (error) {
    log.error('Cron application-reminders failed:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
