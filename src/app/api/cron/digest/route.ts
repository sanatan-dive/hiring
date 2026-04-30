import { log } from '@/lib/log';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { sendJobDigest } from '@/services/email.service';

// Force dynamic to ensure it runs
export const dynamic = 'force-dynamic';

function isAuthorizedCron(req: Request): boolean {
  if (req.headers.get('x-vercel-cron') === '1') return true;
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    return true;
  }
  return false;
}

export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    // 1. Get all users
    // Optimization: In a real app, you'd batch this or use a queue.
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    const results = {
      usersProcessed: 0,
      emailsSent: 0,
      errors: 0,
    };

    // 2. Process each user
    for (const user of users) {
      results.usersProcessed++;

      // Find new matches that haven't been emailed yet
      const newMatches = await prisma.jobMatch.findMany({
        where: {
          userId: user.id,
          // status could be 'pending' or 'new'. Let's assume 'pending' is the default for a match.
          // Adjust based on your match logic.
          // We also check emailedAt is null
          emailedAt: null,
        },
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
        orderBy: {
          score: 'desc',
        },
        take: 10, // Limit to top 10 for the email
      });

      if (newMatches.length > 0) {
        // Prepare data for email
        const jobsForEmail = newMatches.map((match) => ({
          ...match.job,
          score: match.score || 0,
        }));

        // Send Email
        const { success } = await sendJobDigest({
          to: user.email,
          userName: user.name || 'Job Seeker',
          jobs: jobsForEmail,
        });

        if (success) {
          results.emailsSent++;

          // Mark as emailed
          await prisma.jobMatch.updateMany({
            where: {
              id: { in: newMatches.map((m) => m.id) },
            },
            data: {
              emailedAt: new Date(),
            },
          });
        } else {
          results.errors++;
        }
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    log.error('Cron digest error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
