import { log } from '@/lib/log';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/db/prisma';
import {
  parseSalary,
  percentile,
  detectRoleFamily,
  isRemoteLocation,
  formatSalaryRangeUSD,
} from '@/lib/jobs/salary';

/**
 * GET /api/jobs/salary-insights?jobId=...
 *
 * Returns:
 *   {
 *     jobSalary: { min, max, currency, formatted } | null,
 *     cohort: {
 *       sampleSize: number,
 *       roleFamily: string,
 *       isRemote: boolean,
 *       p25: number, p50: number, p75: number,  // USD
 *       formattedRange: string,
 *       yourPosition: number | null,            // percentile of this job's max within cohort
 *     } | null
 *   }
 */
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');
    if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 });

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { title: true, salary: true, location: true },
    });
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

    const parsed = parseSalary(job.salary);
    const family = detectRoleFamily(job.title);
    const remote = isRemoteLocation(job.location);

    // Pull cohort: jobs with parseable salary in same role family + remote bucket
    // Limit to 500 to keep this fast.
    const cohortJobs = await prisma.job.findMany({
      where: {
        salary: { not: null },
        title: family ? { contains: family, mode: 'insensitive' } : undefined,
      },
      select: { salary: true, location: true, title: true },
      take: 500,
    });

    const sameBucket = cohortJobs
      .filter((j) => isRemoteLocation(j.location) === remote)
      .filter((j) => !family || detectRoleFamily(j.title) === family)
      .map((j) => parseSalary(j.salary))
      .filter((s): s is NonNullable<ReturnType<typeof parseSalary>> => s !== null);

    if (sameBucket.length < 5) {
      // Not enough data — return job's own salary if parseable, no cohort
      return NextResponse.json({
        jobSalary: parsed
          ? {
              min: parsed.min,
              max: parsed.max,
              currency: parsed.currency,
              formatted: formatSalaryRangeUSD(parsed.min, parsed.max),
            }
          : null,
        cohort: null,
        message: parsed
          ? `Not enough comparable jobs in our DB to estimate a percentile (need ≥5, have ${sameBucket.length}).`
          : 'No salary on this listing.',
      });
    }

    const maxValues = sameBucket.map((s) => s.max);
    const sorted = [...maxValues].sort((a, b) => a - b);
    const p25 = sorted[Math.floor(sorted.length * 0.25)];
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p75 = sorted[Math.floor(sorted.length * 0.75)];

    return NextResponse.json({
      jobSalary: parsed
        ? {
            min: parsed.min,
            max: parsed.max,
            currency: parsed.currency,
            formatted: formatSalaryRangeUSD(parsed.min, parsed.max),
          }
        : null,
      cohort: {
        sampleSize: sameBucket.length,
        roleFamily: family ?? 'general engineering',
        isRemote: remote,
        p25,
        p50,
        p75,
        formattedRange: `${formatSalaryRangeUSD(p25, p25)} – ${formatSalaryRangeUSD(p75, p75)} (median ${formatSalaryRangeUSD(p50, p50)})`,
        yourPosition: parsed ? percentile(maxValues, parsed.max) : null,
      },
    });
  } catch (err) {
    log.error('salary-insights failed', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
