import { log } from '@/lib/log';
import { NextResponse } from 'next/server';
import { fetchAndSaveJobs, buildPerUserFetchPlan } from '@/services/job.service';

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
    // Phase 1: per-user-aware fetching.
    // Build a deduped plan from JobPreferences (capped to 25 unique queries
    // to stay inside Adzuna/JSearch free tiers). Falls back to a default
    // search when no users have preferences yet.
    const plan = await buildPerUserFetchPlan(25);
    const fetchPlan =
      plan.length > 0 ? plan : [{ query: 'software engineer', location: 'remote' }];

    log.info('Cron jobs fetch starting', { uniqueQueries: fetchPlan.length });

    const results = await Promise.allSettled(
      fetchPlan.map((p) => fetchAndSaveJobs(p.query, p.location))
    );

    const total = results.reduce(
      (acc, r) => (r.status === 'fulfilled' ? acc + r.value : acc),
      0
    );
    const failures = results.filter((r) => r.status === 'rejected').length;

    return NextResponse.json({ success: true, count: total, failures, plan: fetchPlan });
  } catch (error) {
    log.error('Cron job failed:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
