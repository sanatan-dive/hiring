import { log } from '@/lib/log';
import prisma from '@/lib/db/prisma';
import { jobContentHash } from '@/lib/jobs/hash';
import { searchAdzunaJobs } from '@/lib/api/adzuna';
import { searchJSearchJobs } from '@/lib/api/jsearch';
import { getRemoteOkJobs } from '@/lib/api/remoteok';
import { getWeWorkRemotelyJobs } from '@/lib/api/weworkremotely';
import { fetchYcJobs } from '@/lib/api/yc';
import { generateEmbedding } from '@/lib/ai/google';
import { publishJob } from '@/lib/queue/client';
import { scrapeLinkedIn } from '@/lib/scrapers/linkedin';
import { sendScrapeCompleteEmail } from '@/services/email.service';

// jobContentHash is now in @/lib/jobs/hash — re-export for back-compat
export { jobContentHash };

/**
 * Compute the unique fetch keys (query + location pairs) for a batch of users
 * based on their JobPreferences. Deduplicates so we make N API calls, not 1
 * per user. Also enforces a small fan-out cap to stay inside free-tier quotas.
 */
export async function buildPerUserFetchPlan(
  maxUnique = 25
): Promise<Array<{ query: string; location: string }>> {
  const users = await prisma.user.findMany({
    where: { jobPreferences: { isNot: null } },
    include: { jobPreferences: true },
    take: 500, // hard cap; chunking happens above this
  });

  const uniq = new Map<string, { query: string; location: string }>();
  for (const u of users) {
    const prefs = u.jobPreferences;
    if (!prefs) continue;
    const role = prefs.desiredRoles?.[0]?.trim();
    if (!role) continue;
    const location =
      prefs.workLocation === 'remote' ? 'remote' : (prefs.locations?.[0]?.trim() ?? 'remote');
    const key = `${role.toLowerCase()}|${location.toLowerCase()}`;
    if (!uniq.has(key)) uniq.set(key, { query: role, location });
    if (uniq.size >= maxUnique) break;
  }
  return Array.from(uniq.values());
}

// Helper interface for jobs before they are saved to DB
interface JobInput {
  title: string;
  company: string;
  location: string;
  description: string | null | undefined;
  url: string;
  salary: string | null;
  source: string;
  scrapedAt: Date;
}

export async function fetchAndSaveJobs(query: string, location: string = 'us') {
  log.info(`Fetching jobs for: ${query} in ${location}`);

  // Fetch from sources in parallel.
  // Indeed scraper removed (REVIEW §12) — Cloudflare-walled and unreliable.
  // YC's WorkAtAStartup added — high-quality startup-focused, no API key.
  const [adzunaJobs, jsearchJobs, remoteOkJobs, wwrJobs, ycJobs] = await Promise.all([
    searchAdzunaJobs(query, location).catch(() => []),
    searchJSearchJobs(`${query} in ${location}`).catch(() => []),
    getRemoteOkJobs(20).catch(() => []),
    getWeWorkRemotelyJobs(20).catch(() => []),
    fetchYcJobs(15).catch(() => []),
  ]);

  log.info(
    `Found ${adzunaJobs.length} Adzuna, ${jsearchJobs.length} JSearch, ${remoteOkJobs.length} RemoteOK, ${wwrJobs.length} WWR, ${ycJobs.length} YC jobs`
  );

  // Transform to common format
  const jobs = [
    ...adzunaJobs.map((job) => ({
      title: job.title,
      company: job.company.display_name,
      location: job.location.display_name,
      description: job.description,
      url: job.redirect_url,
      salary: job.salary_min ? `${job.salary_min} - ${job.salary_max}` : null,
      source: 'adzuna',
      scrapedAt: new Date(),
    })),
    ...jsearchJobs.map((job) => ({
      title: job.job_title,
      company: job.employer_name,
      location: `${job.job_city}, ${job.job_state}, ${job.job_country}`,
      description: job.job_description,
      url: job.job_apply_link,
      salary: job.job_min_salary ? `${job.job_min_salary} - ${job.job_max_salary}` : null,
      source: 'jsearch',
      scrapedAt: new Date(),
    })),
    ...remoteOkJobs.map((job) => ({
      title: job.position,
      company: job.company,
      location: job.location,
      description: job.description,
      url: job.url || job.apply_url,
      salary: job.salary_min
        ? `${job.salary_min} - ${job.salary_max} ${job.salary_currency || 'USD'}`
        : null,
      source: 'remoteok',
      scrapedAt: new Date(),
    })),
    ...wwrJobs.map((job) => {
      // Extract company from title if possible "Role at Company" or "Role: Company"
      let company = job.company || 'Unknown';
      let title = job.title;

      if (title.includes(' at ')) {
        const parts = title.split(' at ');
        title = parts[0];
        company = parts[1];
      } else if (title.includes(': ')) {
        const parts = title.split(': ');
        if (parts.length > 1) {
          // Usually "Company: Role" in some feeds, "Role: Company" in others.
          // WWR usually does "Role: Company" in the RSS item title depending on category?
          // Let's assume the title is the role mainly.
        }
      }

      return {
        title: title,
        company: company,
        location: 'Remote', // WWR is mostly remote
        description: job.content || job.contentSnippet,
        url: job.link,
        salary: null, // RSS doesn't usually have structured salary
        source: 'weworkremotely',
        scrapedAt: new Date(),
      };
    }),
    ...ycJobs.map((j) => ({
      title: j.title,
      company: j.company,
      location: j.location ?? 'Remote',
      description: j.description,
      url: j.url,
      salary: j.salary,
      source: 'yc',
      scrapedAt: new Date(),
    })),
  ];

  // Bulk upsert; saveJobs handles dedup via contentHash + URL upsert.
  return saveJobs(jobs);
}

export async function saveJobs(jobs: JobInput[]) {
  let savedCount = 0;
  for (const job of jobs) {
    if (!job.url) continue;
    try {
      const contentHash = jobContentHash(job);

      // Skip if a different URL already represents this exact title+company+location
      const existing = await prisma.job.findUnique({ where: { contentHash } });
      if (existing && existing.url !== job.url) {
        // Don't insert a duplicate, but freshen the salary if missing
        if (!existing.salary && job.salary) {
          await prisma.job.update({
            where: { id: existing.id },
            data: { salary: job.salary },
          });
        }
        continue;
      }

      await prisma.job.upsert({
        where: { url: job.url },
        update: {
          title: job.title,
          description: job.description,
          salary: job.salary,
          contentHash,
        },
        create: {
          title: job.title,
          company: job.company,
          location: job.location,
          description: job.description,
          url: job.url,
          contentHash,
          salary: job.salary,
          source: job.source,
          techStack: [],
        },
      });

      // Generate embedding for the new job
      const textToEmbed =
        `${job.title} ${job.description} ${job.company} ${job.location}`.substring(0, 8000);
      const vector = await generateEmbedding(textToEmbed);

      if (vector) {
        // Update vector using raw query
        const vectorString = `[${vector.join(',')}]`;
        await prisma.$executeRaw`
          UPDATE jobs 
          SET embedding = ${vectorString}::vector 
          WHERE url = ${job.url}
        `;
      }

      savedCount++;
    } catch (err) {
      log.error(`Failed to save job ${job.url}:`, err);
    }
  }
  return savedCount;
}

export async function triggerDeepScrape(
  source: 'linkedin' | 'indeed',
  query: string,
  location: string,
  email?: string
) {
  const destinationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/queue/process-job`;

  if (
    destinationUrl.includes('localhost') ||
    destinationUrl.includes('::1') ||
    process.env.NODE_ENV === 'development'
  ) {
    log.warn(
      '⚠️ Localhost detected. Bypassing QStash and running deep scrape directly in background.'
    );

    // Fire and forget (don't await) to simulate queue behavior
    (async () => {
      try {
        const jobs = await performDeepScrape(source, query, location);
        if (email) {
          await sendScrapeCompleteEmail(email, jobs, source);
        }
      } catch (err) {
        log.error('Background scrape failed (Local Mode):', err);
      }
    })();
    return;
  }

  await publishJob(destinationUrl, { source, query, location, email });
}

export async function performDeepScrape(source: string, query: string, location: string) {
  let jobs: JobInput[] = [];

  if (source === 'linkedin') {
    const scraped = await scrapeLinkedIn(query, location);
    jobs = scraped.map((j) => ({
      ...j,
      description: j.description || null,
      salary: j.salary || null,
      scrapedAt: new Date(),
    }));
  }
  // Indeed scraper removed (REVIEW §12) — Cloudflare-walled, unreliable.
  // For Indeed coverage, route through Bright Data Web Unlocker if you
  // commit to a paid scraper service.

  await saveJobs(jobs);
  return jobs;
}

export async function getJobs(page: number = 1, limit: number = 10, filters?: { source?: string }) {
  const skip = (page - 1) * limit;
  return prisma.job.findMany({
    where: filters,
    orderBy: { scrapedAt: 'desc' },
    skip,
    take: limit,
  });
}

export async function updateJobEmbeddings() {
  // Find jobs without embeddings using raw query
  // const jobs = await prisma.$queryRaw<{ id: string; title: string; description: string; company: string; location: string }[]>`
  //   SELECT id, title, description, company, location
  //   FROM jobs
  //   WHERE embedding IS NULL
  //   LIMIT 50
  // `;
  // Process them (placeholder for now, as we moved logic to fetchAndSave)
  // Logic to update these would go here if needed
}
