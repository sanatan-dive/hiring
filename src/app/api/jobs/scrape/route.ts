import { log } from '@/lib/log';
import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/db/prisma';
import { triggerDeepScrape, saveJobs } from '@/services/job.service';
import { ratelimit } from '@/lib/ratelimit';
import { isLinkedInJobUrl, scrapeLinkedInJobUrl } from '@/lib/scrapers/linkedin';

/**
 * POST /api/jobs/scrape
 *
 * Two modes:
 *  - mode: 'url'    body: { url: '<linkedin-job-url>' }
 *      Synchronous single-page scrape; returns the job inline.
 *      Lower legal exposure (user-driven), more reliable.
 *  - mode: 'search' body: { query, location, source: 'linkedin'|'indeed' }
 *      Async deep-scrape via QStash. Email when done.
 *      DEPRECATED — kept for backwards compat with the existing UI button,
 *      will be removed once UI moves entirely to paste-URL.
 *
 * Both gated to PRO + 5/day rate limit.
 */
export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
      include: { subscription: true },
    });

    const isPro = dbUser?.subscription?.plan === 'PRO' && dbUser?.subscription?.status === 'active';
    if (!isPro) {
      return NextResponse.json({ error: 'Deep scraping is a Pro feature.' }, { status: 403 });
    }

    const { success, remaining, reset } = await ratelimit.scrape.limit(`scrape:${user.id}`);
    if (!success) {
      return NextResponse.json(
        { error: '5 deep scrapes per day max', retryAfter: reset },
        {
          status: 429,
          headers: { 'X-RateLimit-Remaining': remaining.toString() },
        }
      );
    }

    const body = await req.json().catch(() => ({}));
    const mode: 'url' | 'search' = body.url ? 'url' : (body.mode ?? 'search');

    // ---- URL mode: paste a LinkedIn job link, scrape just that page ----
    if (mode === 'url') {
      const url: string = body.url;
      if (!url || !isLinkedInJobUrl(url)) {
        return NextResponse.json(
          {
            error: 'Provide a valid LinkedIn job URL (https://www.linkedin.com/jobs/view/...)',
          },
          { status: 400 }
        );
      }

      // Prefer the off-Vercel Railway scraper when configured. Fall back to
      // in-process Playwright (works locally; unstable on Vercel).
      const scraperUrl = process.env.SCRAPER_URL;
      const scraperToken = process.env.SCRAPER_AUTH_TOKEN;
      if (scraperUrl && scraperToken) {
        const jobRequestId = `scrape_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        try {
          const r = await fetch(`${scraperUrl.replace(/\/$/, '')}/scrape`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${scraperToken}`,
            },
            body: JSON.stringify({ url, jobRequestId, userId: user.id }),
          });
          if (r.status === 202) {
            return NextResponse.json({
              success: true,
              async: true,
              jobRequestId,
              message: 'Scrape queued. The job will appear in your matches in a few seconds.',
            });
          }
          const errBody = await r.json().catch(() => ({}));
          log.warn('Railway scraper non-202', { status: r.status, errBody });
          // fall through to in-process fallback
        } catch (err) {
          log.warn('Railway scraper unreachable, falling back to in-process', err);
        }
      }

      const scraped = await scrapeLinkedInJobUrl(url);
      if (!scraped) {
        return NextResponse.json(
          { error: "Couldn't read the job page. The link may be expired or geo-blocked." },
          { status: 502 }
        );
      }

      await saveJobs([
        {
          ...scraped,
          description: scraped.description ?? null,
          salary: scraped.salary ?? null,
          scrapedAt: new Date(),
        },
      ]);

      return NextResponse.json({
        success: true,
        message: `Saved "${scraped.title}" at ${scraped.company}.`,
        job: scraped,
      });
    }

    // ---- Search mode (legacy): async deep-scrape via QStash ----
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
