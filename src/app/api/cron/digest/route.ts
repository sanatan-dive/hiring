import { log } from '@/lib/log';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { sendJobDigest, newUnsubscribeToken } from '@/services/email.service';

export const dynamic = 'force-dynamic';
// Vercel cron timeout safety: process in chunks
const BATCH_SIZE = 25;

function isAuthorizedCron(req: Request): boolean {
  if (req.headers.get('x-vercel-cron') === '1') return true;
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    return true;
  }
  return false;
}

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  emailDigestEnabled: boolean;
  unsubscribeToken: string | null;
  subscription: { plan: string } | null;
}

export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    // Frequency gating: free = weekly (Mondays only), pro = daily.
    // We send to PRO every day; we send to FREE only if today is Monday (UTC).
    const today = new Date();
    const isMonday = today.getUTCDay() === 1;

    const users: UserRow[] = await prisma.user.findMany({
      where: { emailDigestEnabled: true },
      select: {
        id: true,
        email: true,
        name: true,
        emailDigestEnabled: true,
        unsubscribeToken: true,
        subscription: { select: { plan: true } },
      },
    });

    const eligible = users.filter((u) => {
      const plan = u.subscription?.plan ?? 'FREE';
      return plan === 'PRO' || isMonday;
    });

    const results = {
      usersSeen: users.length,
      usersEligible: eligible.length,
      emailsSent: 0,
      emailsSkippedNoMatches: 0,
      errors: 0,
    };

    for (let i = 0; i < eligible.length; i += BATCH_SIZE) {
      const batch = eligible.slice(i, i + BATCH_SIZE);
      await Promise.allSettled(
        batch.map(async (user) => {
          try {
            const newMatches = await prisma.jobMatch.findMany({
              where: { userId: user.id, emailedAt: null, status: { not: 'hidden' } },
              include: {
                job: {
                  select: {
                    id: true,
                    title: true,
                    company: true,
                    location: true,
                    salary: true,
                    url: true,
                  },
                },
              },
              orderBy: { score: 'desc' },
              take: 10,
            });

            if (newMatches.length === 0) {
              results.emailsSkippedNoMatches++;
              return;
            }

            // Lazy-create the unsubscribe token on first send
            let token = user.unsubscribeToken;
            if (!token) {
              token = newUnsubscribeToken();
              await prisma.user.update({
                where: { id: user.id },
                data: { unsubscribeToken: token },
              });
            }

            const jobsForEmail = newMatches.map((m) => ({
              ...m.job,
              score: m.score || 0,
            }));

            const { success } = await sendJobDigest({
              to: user.email,
              userName: user.name || 'Job Seeker',
              unsubscribeToken: token,
              jobs: jobsForEmail,
            });

            if (success) {
              results.emailsSent++;
              await prisma.jobMatch.updateMany({
                where: { id: { in: newMatches.map((m) => m.id) } },
                data: { emailedAt: new Date() },
              });
            } else {
              results.errors++;
            }
          } catch (err) {
            results.errors++;
            log.error('digest user failed', err, { userId: user.id });
          }
        })
      );
    }

    return NextResponse.json({ success: true, isMonday, results });
  } catch (error) {
    log.error('Cron digest error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
