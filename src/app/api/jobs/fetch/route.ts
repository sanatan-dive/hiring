import { NextResponse } from 'next/server';
import { fetchAndSaveJobs, getJobs } from '@/services/job.service';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  try {
    const { query, location } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // 1. Get User to check subscription
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // We actually need to fetch the DB user to get the plan
    const { getUserByClerkId } = await import('@/services/user.service');
    const dbUser = await getUserByClerkId(userId);

    const plan = (dbUser?.subscription?.plan as 'FREE' | 'PRO') || 'FREE';

    // 2. Check Rate Limit
    const { checkRateLimit } = await import('@/lib/ratelimit');
    const { success, limit, reset, remaining } = await checkRateLimit(userId, plan);

    if (!success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message:
            plan === 'FREE'
              ? 'Free tier is limited to 3 scrapes/week. Upgrade to Pro for unlimited.'
              : 'Rate limit exceeded.',
          reset,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          },
        }
      );
    }

    const count = await fetchAndSaveJobs(query, location);
    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error('Job fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const jobs = await getJobs(page, limit);
    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Get jobs error:', error);
    return NextResponse.json({ error: 'Failed to get jobs' }, { status: 500 });
  }
}
