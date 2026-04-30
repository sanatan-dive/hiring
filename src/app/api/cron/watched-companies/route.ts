import { log } from '@/lib/log';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { findNewJobsForWatchedCompanies, refreshFromCareersPage } from '@/services/watched-company.service';
import WatchedCompanyAlertEmail from '@/lib/email/templates/WatchedCompanyAlert';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = process.env.EMAIL_FROM ?? 'Hirin <onboarding@resend.dev>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

function isAuthorizedCron(req: Request): boolean {
  if (req.headers.get('x-vercel-cron') === '1') return true;
  const authHeader = req.headers.get('authorization');
  return Boolean(
    process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`
  );
}

export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    // 1. For any watched companies that have a careersUrl, refresh listings
    //    from Greenhouse/Lever public APIs.
    const withCareers = await prisma.watchedCompany.findMany({
      where: { careersUrl: { not: null } },
      select: { id: true, careersUrl: true },
      take: 100,
    });
    let refreshed = 0;
    for (const w of withCareers) {
      if (!w.careersUrl) continue;
      refreshed += await refreshFromCareersPage(w.careersUrl);
    }

    // 2. Diff the watched-company snapshot vs current jobs and send alerts.
    const perUser = await findNewJobsForWatchedCompanies();
    let emailsSent = 0;
    let errors = 0;

    if (process.env.RESEND_API_KEY) {
      for (const [, bucket] of perUser) {
        const alerts = Array.from(bucket.alerts.entries()).map(([company, jobs]) => ({
          company,
          jobs,
        }));
        if (alerts.length === 0) continue;

        try {
          // Skip users who opted out of digest emails entirely
          const u = await prisma.user.findUnique({
            where: { id: bucket.user.id },
            select: { emailDigestEnabled: true, unsubscribeToken: true },
          });
          if (!u?.emailDigestEnabled) continue;
          const unsubUrl = u.unsubscribeToken
            ? `${APP_URL}/unsubscribe?token=${u.unsubscribeToken}`
            : undefined;

          const totalJobs = alerts.reduce((acc, a) => acc + a.jobs.length, 0);
          await resend.emails.send({
            from: EMAIL_FROM,
            to: [bucket.user.email],
            subject: `${totalJobs} new role${totalJobs === 1 ? '' : 's'} at ${alerts[0].company}${alerts.length > 1 ? ` and ${alerts.length - 1} more` : ''}`,
            react: WatchedCompanyAlertEmail({
              userName: bucket.user.name ?? 'there',
              alerts,
              unsubscribeUrl: unsubUrl,
            }),
            ...(unsubUrl
              ? {
                  headers: {
                    'List-Unsubscribe': `<${unsubUrl}>`,
                    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
                  },
                }
              : {}),
          });
          emailsSent++;
        } catch (err) {
          errors++;
          log.error('watched-company alert failed', err, { userId: bucket.user.id });
        }
      }
    } else {
      log.warn('RESEND_API_KEY missing — skipping watched-company alerts');
    }

    return NextResponse.json({
      ok: true,
      careersPagesChecked: withCareers.length,
      newJobsFromCareersPages: refreshed,
      usersAlerted: emailsSent,
      errors,
    });
  } catch (err) {
    log.error('watched-companies cron failed', err);
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
  }
}
