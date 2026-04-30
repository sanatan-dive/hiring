import { log } from '@/lib/log';

/**
 * Y Combinator's WorkAtAStartup public job feed.
 * High-quality, startup-focused, no API key required.
 *
 * Endpoint structure (current as of 2026):
 *   https://www.workatastartup.com/companies.json — list of YC companies
 *   https://www.workatastartup.com/companies/<slug>.json — per-company jobs
 *
 * The companies.json endpoint is heavy (~5MB). We use a curated bootstrap
 * list of well-known YC companies for the daily fetch, expanding from
 * user signal over time (companies that match many resumes).
 */

const YC_COMPANIES_BOOTSTRAP = [
  'stripe',
  'airbnb',
  'doordash',
  'instacart',
  'coinbase',
  'reddit',
  'twitch',
  'gitlab',
  'segment',
  'plaid',
  'brex',
  'ramp',
  'amplitude',
  'razorpay',
  'pulley',
  'replit',
  'rappi',
  'algolia',
  'mixpanel',
  'tally',
  'cal-com',
  'posthog',
  'modal',
  'anthropic',
  'perplexity',
  'cursor',
];

export interface YcJob {
  title: string;
  company: string;
  url: string;
  description: string | null;
  location: string | null;
  salary: string | null;
}

export async function fetchYcJobs(maxCompanies = 30): Promise<YcJob[]> {
  const companies = YC_COMPANIES_BOOTSTRAP.slice(0, maxCompanies);
  const all: YcJob[] = [];

  for (const slug of companies) {
    try {
      const res = await fetch(`https://www.workatastartup.com/api/companies/${slug}/jobs.json`, {
        headers: { Accept: 'application/json', 'User-Agent': 'Hirin/1.0' },
        // Cache for 6h on the edge to be polite
        next: { revalidate: 6 * 60 * 60 },
      });

      if (!res.ok) continue;
      const data = (await res.json()) as
        | {
            jobs?: Array<{
              title?: string;
              role?: string;
              location?: string;
              compensation?: string;
              description?: string;
              long_description?: string;
              short_description?: string;
              apply_url?: string;
              hosted_url?: string;
              slug?: string;
            }>;
            company?: { name?: string };
          }
        | undefined;

      if (!data?.jobs) continue;
      const companyName = data.company?.name ?? slug;

      for (const j of data.jobs.slice(0, 10)) {
        const title = j.title || j.role;
        const url =
          j.apply_url ||
          j.hosted_url ||
          (j.slug ? `https://www.workatastartup.com/jobs/${j.slug}` : null);
        if (!title || !url) continue;

        all.push({
          title,
          company: companyName,
          url,
          description: j.long_description || j.description || j.short_description || null,
          location: j.location ?? null,
          salary: j.compensation ?? null,
        });
      }
    } catch (err) {
      log.warn('YC fetch failed for slug', { slug, err: (err as Error).message });
    }
  }

  log.info(`YC fetch: ${all.length} jobs across ${companies.length} companies`);
  return all;
}
