import { log } from '@/lib/log';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import prisma from '@/lib/db/prisma';
import ReEngagementEmail from '@/lib/email/templates/ReEngagement';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = process.env.EMAIL_FROM ?? 'Hirin <onboarding@resend.dev>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

const REENGAGE_AFTER_DAYS = 7; // user hasn't shown up in 7d
const COOLDOWN_DAYS = 14; // don't re-email same user within 14d

function isAuthorizedCron(req: Request): boolean {
  if (req.headers.get('x-vercel-cron') === '1') return true;
  const authHeader = req.headers.get('authorization');
  return Boolean(process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`);
}

/**
 * Weekly re-engagement nudge for inactive users with new matches.
 *
 * Targets users who:
 *   - haven't logged in (or had any activity ping) in 7+ days
 *   - have at least 1 unviewed match in the last 14 days
 *   - haven't received a re-engagement email in COOLDOWN_DAYS
 *   - have email digest enabled
 *
 * We use lastActiveAt as the activity proxy (set by /api/user/activity)
 * and look at email_events to find the last re-engagement send.
 */
export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    const now = new Date();
    const reengageCutoff = new Date(now.getTime() - REENGAGE_AFTER_DAYS * 24 * 60 * 60 * 1000);
    const cooldownCutoff = new Date(now.getTime() - COOLDOWN_DAYS * 24 * 60 * 60 * 1000);

    // Find inactive users with email enabled
    const inactive = await prisma.user.findMany({
      where: {
        emailDigestEnabled: true,
        OR: [
          { lastActiveAt: null, createdAt: { lt: reengageCutoff } },
          { lastActiveAt: { lt: reengageCutoff } },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        lastActiveAt: true,
        createdAt: true,
        unsubscribeToken: true,
      },
      take: 200,
    });

    let sent = 0;
    let skippedNoMatches = 0;
    let skippedRecentlyEmailed = 0;
    let errors = 0;

    if (process.env.RESEND_API_KEY) {
      for (const u of inactive) {
        // Cooldown: skip if we sent re-engagement in the last 14d
        const recent = await prisma.emailEvent.findFirst({
          where: {
            userEmail: u.email,
            campaign: 're_engagement',
            createdAt: { gt: cooldownCutoff },
          },
        });
        if (recent) {
          skippedRecentlyEmailed++;
          continue;
        }

        // How many new matches?
        const newMatches = await prisma.jobMatch.findMany({
          where: {
            userId: u.id,
            status: { in: ['pending', 'new'] },
          },
          orderBy: { score: 'desc' },
          take: 3,
          include: {
            job: { select: { id: true, title: true, company: true, url: true } },
          },
        });

        if (newMatches.length === 0) {
          skippedNoMatches++;
          continue;
        }

        const newMatchCount = await prisma.jobMatch.count({
          where: { userId: u.id, status: { in: ['pending', 'new'] } },
        });

        const daysAway = u.lastActiveAt
          ? Math.round((now.getTime() - u.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24))
          : Math.round((now.getTime() - u.createdAt.getTime()) / (1000 * 60 * 60 * 24));

        const unsubUrl = u.unsubscribeToken
          ? `${APP_URL}/unsubscribe?token=${u.unsubscribeToken}`
          : undefined;

        try {
          const result = await resend.emails.send({
            from: EMAIL_FROM,
            to: [u.email],
            subject: `${newMatchCount} matches you haven't seen`,
            react: ReEngagementEmail({
              userName: u.name ?? 'there',
              daysAway,
              newMatchCount,
              topJobs: newMatches.map((m) => ({
                id: m.job.id,
                title: m.job.title,
                company: m.job.company,
                url: m.job.url,
              })),
              unsubscribeUrl: unsubUrl,
            }),
            tags: [{ name: 'campaign', value: 're_engagement' }],
            ...(unsubUrl
              ? {
                  headers: {
                    'List-Unsubscribe': `<${unsubUrl}>`,
                    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
                  },
                }
              : {}),
          });

          // Record the send so cooldown works (in case Resend webhook is slow)
          if (result.data?.id) {
            await prisma.emailEvent.create({
              data: {
                resendId: result.data.id,
                userEmail: u.email,
                eventType: 'email.sent',
                campaign: 're_engagement',
              },
            });
          }
          sent++;
        } catch (err) {
          errors++;
          log.error('re-engagement email failed', err, { userId: u.id });
        }
      }
    } else {
      log.warn('RESEND_API_KEY missing — skipping re-engagement sends');
    }

    return NextResponse.json({
      ok: true,
      candidates: inactive.length,
      sent,
      skippedNoMatches,
      skippedRecentlyEmailed,
      errors,
    });
  } catch (err) {
    log.error('Cron re-engagement failed:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
