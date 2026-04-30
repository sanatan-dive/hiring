import { log } from '@/lib/log';
import { chromium, type Browser } from 'playwright';

export interface ScrapedJob {
  title: string;
  company: string;
  location: string;
  url: string;
  description?: string;
  salary?: string;
  source: string;
}

const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

function randomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

const LINKEDIN_JOB_URL_RE = /^https?:\/\/(www\.)?linkedin\.com\/jobs\/view\/(\d+)/i;

export function isLinkedInJobUrl(url: string): boolean {
  return LINKEDIN_JOB_URL_RE.test(url.trim());
}

/**
 * Scrape a single LinkedIn job by URL — the user-driven, lower-legal-risk
 * flow. The user pastes the URL they're already looking at; we scrape only
 * that one page, with rotating UAs and randomized viewports.
 */
export async function scrapeLinkedInJobUrl(url: string): Promise<ScrapedJob | null> {
  if (!isLinkedInJobUrl(url)) {
    log.warn('scrapeLinkedInJobUrl: not a LinkedIn job URL', { url });
    return null;
  }

  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: randomUA(),
      viewport: {
        width: 1280 + Math.floor(Math.random() * 200),
        height: 720 + Math.floor(Math.random() * 100),
      },
      locale: 'en-US',
    });
    const page = await context.newPage();

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('h1, .top-card-layout__title', { timeout: 10000 });

    const title = (
      await page
        .locator('h1, .top-card-layout__title')
        .first()
        .innerText()
        .catch(() => '')
    ).trim();

    const company = (
      await page
        .locator('.topcard__org-name-link, a.topcard__org-name-link, .top-card-layout__second-subline a')
        .first()
        .innerText()
        .catch(() => '')
    ).trim();

    const loc = (
      await page
        .locator('.topcard__flavor--bullet, .top-card-layout__second-subline span')
        .first()
        .innerText()
        .catch(() => '')
    ).trim();

    const description = (
      await page
        .locator('.show-more-less-html__markup, .description__text')
        .first()
        .innerText()
        .catch(() => '')
    ).trim();

    if (!title) {
      log.warn('scrapeLinkedInJobUrl: could not find title', { url });
      return null;
    }

    return {
      title,
      company: company || 'Unknown',
      location: loc || 'Not specified',
      url: url.split('?')[0],
      description: description || undefined,
      source: 'linkedin',
    };
  } catch (err) {
    log.error('scrapeLinkedInJobUrl failed', err, { url });
    return null;
  } finally {
    if (browser) await browser.close();
  }
}

export async function scrapeLinkedIn(query: string, location: string): Promise<ScrapedJob[]> {
  log.info(`Starting LinkedIn scrape for ${query} in ${location}`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();
  const jobs: ScrapedJob[] = [];

  try {
    // Visit LinkedIn guest jobs search
    const searchUrl = `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`;
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for job cards to load
    await page.waitForSelector('.jobs-search__results-list li', { timeout: 10000 });

    // Scroll to load more (basic scroll)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);

    const jobCards = await page.$$('.jobs-search__results-list li');
    log.info(`Found ${jobCards.length} potential job cards on LinkedIn`);

    for (const card of jobCards.slice(0, 10)) {
      // Limit to 10 for safety/speed in this phase
      try {
        const titleElement = await card.$('.base-search-card__title');
        const companyElement = await card.$('.base-search-card__subtitle');
        const locationElement = await card.$('.job-search-card__location');
        const linkElement = await card.$('a.base-card__full-link');

        const title = titleElement ? (await titleElement.innerText()).trim() : '';
        const company = companyElement ? (await companyElement.innerText()).trim() : '';
        const loc = locationElement ? (await locationElement.innerText()).trim() : '';
        const url = linkElement ? await linkElement.getAttribute('href') : '';

        if (title && url) {
          jobs.push({
            title,
            company,
            location: loc,
            url: url.split('?')[0], // Clean URL
            source: 'linkedin',
          });
        }
      } catch (e) {
        log.error('Error parsing a LinkedIn job card:', e);
      }
    }

    // Step 2: Fetch details for each job
    log.info(`Fetching details for ${jobs.length} jobs...`);
    for (const job of jobs) {
      try {
        await page.goto(job.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        // LinkedIn guest view description selector
        const descriptionElement = await page.$('.description__text');
        const altDescriptionElement = await page.$('.show-more-less-html__markup');

        if (descriptionElement) {
          job.description = (await descriptionElement.innerText()).trim();
        } else if (altDescriptionElement) {
          job.description = (await altDescriptionElement.innerText()).trim();
        }

        // Random delay to be polite
        await page.waitForTimeout(1000 + Math.random() * 2000);
      } catch (err) {
        log.warn(`Failed to fetch details for ${job.url}`, err);
        job.description = 'View job post for details.';
      }
    }
  } catch (error) {
    log.error('LinkedIn scrape failed:', error);
  } finally {
    await browser.close();
  }

  return jobs;
}
