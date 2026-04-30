import { log } from '@/lib/log';
import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/db/prisma';
import { triggerDeepScrape } from '@/services/job.service';
import { ratelimit } from '@/lib/ratelimit';

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
      include: { subscription: true },
    });

    const isPro = dbUser?.subscription?.plan === 'PRO' && dbUser?.subscription?.status === 'active';
    if (!isPro) {
      return NextResponse.json({ error: 'Deep scraping is a Pro feature.' }, { status: 403 });
    }

    // Enforce 5 deep scrapes per day per Pro user.
    const { success, remaining, reset } = await ratelimit.scrape.limit(`scrape:${user.id}`);
    if (!success) {
      return NextResponse.json(
        { error: '5 deep scrapes per day max', retryAfter: reset },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': remaining.toString(),
          },
        }
      );
    }

    // Default to user preferences if not provided
    // For MVP, just use a standard query or what was passed
    // let { query } = await req.json(); // If you want dynamic query from UI

    // Hardcode or get from prefs for now to match "Deep Scraper Button" request
    // Better: Get from request body
    const body = await req.json();
    const query = body.query || 'software engineer';
    const location = body.location || 'remote';
    const source = body.source || 'linkedin';

    await triggerDeepScrape(source, query, location, user.emailAddresses[0].emailAddress);

    return NextResponse.json({
      success: true,
      message: 'Scraping started. You will be notified via email.',
    });
  } catch (error) {
    log.error('Trigger scrape error:', error);
    return NextResponse.json({ error: 'Failed to trigger scrape' }, { status: 500 });
  }
}
