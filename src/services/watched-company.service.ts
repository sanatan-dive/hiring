import { log } from '@/lib/log';
import prisma from '@/lib/db/prisma';
import { generateEmbedding } from '@/lib/ai/google';
import { jobContentHash } from '@/lib/jobs/hash';

/**
 * For each watched company, find any new jobs in our DB that match by name
 * (case-insensitive). New = not in the last_job_ids snapshot.
 *
 * Returns a per-user map of { companyName: newJobs[] } so the digest can
 * compose a single per-user email.
 */
export async function findNewJobsForWatchedCompanies(): Promise<
  Map<string, { user: { id: string; email: string; name: string | null }; alerts: Map<string, Array<{ id: string; title: string; url: string; location: string | null }>> }>
> {
  const watched = await prisma.watchedCompany.findMany({
    include: {
      user: { select: { id: true, email: true, name: true } },
    },
  });

  const perUser = new Map<
    string,
    {
      user: { id: string; email: string; name: string | null };
      alerts: Map<string, Array<{ id: string; title: string; url: string; location: string | null }>>;
    }
  >();

  for (const w of watched) {
    // Find jobs matching this company name (case-insensitive).
    const jobs = await prisma.job.findMany({
      where: {
        company: { equals: w.normalized, mode: 'insensitive' },
      },
      orderBy: { scrapedAt: 'desc' },
      take: 50,
      select: { id: true, title: true, url: true, location: true },
    });

    if (jobs.length === 0) continue;

    const knownIds = new Set(w.lastJobIds);
    const newJobs = jobs.filter((j) => !knownIds.has(j.id));

    if (newJobs.length === 0) {
      // Nothing new — still update lastCheckedAt
      await prisma.watchedCompany.update({
        where: { id: w.id },
        data: { lastCheckedAt: new Date() },
      });
      continue;
    }

    // Update snapshot
    await prisma.watchedCompany.update({
      where: { id: w.id },
      data: {
        lastCheckedAt: new Date(),
        lastJobIds: jobs.map((j) => j.id),
      },
    });

    let bucket = perUser.get(w.user.id);
    if (!bucket) {
      bucket = { user: w.user, alerts: new Map() };
      perUser.set(w.user.id, bucket);
    }
    bucket.alerts.set(w.name, newJobs);
  }

  return perUser;
}

/**
 * Scrape a careers page and try to extract job listings. Best-effort —
 * most companies use Greenhouse / Lever / Workday and have predictable URLs:
 *   - https://boards.greenhouse.io/<slug>
 *   - https://jobs.lever.co/<slug>
 *
 * For now we just do simple URL detection + delegate scraping to whatever
 * Playwright runner is available. If a careers URL is set, we can call the
 * external scraper service (Phase A9) to fetch + persist new listings.
 *
 * This is a STUB — real implementation lives in scraper-service/ once
 * deployed. Kept here so the cron has a single entry point.
 */
export async function refreshFromCareersPage(careersUrl: string): Promise<number> {
  // Greenhouse boards expose JSON: https://boards-api.greenhouse.io/v1/boards/<slug>/jobs
  const greenhouseSlug = careersUrl.match(/boards\.greenhouse\.io\/([\w-]+)/)?.[1];
  if (greenhouseSlug) {
    try {
      const res = await fetch(
        `https://boards-api.greenhouse.io/v1/boards/${greenhouseSlug}/jobs?content=true`
      );
      if (!res.ok) return 0;
      const data = (await res.json()) as {
        jobs: Array<{
          id: number;
          title: string;
          absolute_url: string;
          location: { name: string };
          content: string;
          updated_at: string;
        }>;
      };

      let saved = 0;
      for (const j of data.jobs.slice(0, 50)) {
        const company = greenhouseSlug.replace(/-/g, ' ');
        const contentHash = jobContentHash({
          title: j.title,
          company,
          location: j.location.name,
        });

        try {
          await prisma.job.upsert({
            where: { url: j.absolute_url },
            update: { description: j.content, contentHash },
            create: {
              title: j.title,
              company,
              location: j.location.name,
              description: j.content,
              url: j.absolute_url,
              contentHash,
              source: 'greenhouse',
              techStack: [],
            },
          });

          // Embed in background — don't block on this
          const text = `${j.title} ${company} ${j.location.name} ${j.content}`.substring(0, 8000);
          const vector = await generateEmbedding(text);
          if (vector) {
            const vectorString = `[${vector.join(',')}]`;
            await prisma.$executeRaw`
              UPDATE jobs SET embedding = ${vectorString}::vector WHERE url = ${j.absolute_url}
            `;
          }
          saved++;
        } catch (err) {
          log.warn('refresh greenhouse upsert failed', { url: j.absolute_url, err });
        }
      }
      return saved;
    } catch (err) {
      log.error('greenhouse refresh failed', err, { careersUrl });
      return 0;
    }
  }

  // Lever: https://jobs.lever.co/<slug>  → API: https://api.lever.co/v0/postings/<slug>?mode=json
  const leverSlug = careersUrl.match(/jobs\.lever\.co\/([\w-]+)/)?.[1];
  if (leverSlug) {
    try {
      const res = await fetch(`https://api.lever.co/v0/postings/${leverSlug}?mode=json`);
      if (!res.ok) return 0;
      const postings = (await res.json()) as Array<{
        id: string;
        text: string;
        hostedUrl: string;
        categories: { location: string };
        descriptionPlain: string;
      }>;

      let saved = 0;
      for (const p of postings.slice(0, 50)) {
        const company = leverSlug.replace(/-/g, ' ');
        const contentHash = jobContentHash({
          title: p.text,
          company,
          location: p.categories.location,
        });
        try {
          await prisma.job.upsert({
            where: { url: p.hostedUrl },
            update: { description: p.descriptionPlain, contentHash },
            create: {
              title: p.text,
              company,
              location: p.categories.location,
              description: p.descriptionPlain,
              url: p.hostedUrl,
              contentHash,
              source: 'lever',
              techStack: [],
            },
          });
          const text = `${p.text} ${company} ${p.categories.location} ${p.descriptionPlain}`.substring(0, 8000);
          const vector = await generateEmbedding(text);
          if (vector) {
            const vectorString = `[${vector.join(',')}]`;
            await prisma.$executeRaw`
              UPDATE jobs SET embedding = ${vectorString}::vector WHERE url = ${p.hostedUrl}
            `;
          }
          saved++;
        } catch (err) {
          log.warn('refresh lever upsert failed', { url: p.hostedUrl, err });
        }
      }
      return saved;
    } catch (err) {
      log.error('lever refresh failed', err, { careersUrl });
      return 0;
    }
  }

  // Unknown ATS — would require Playwright (delegated to scraper-service).
  return 0;
}
