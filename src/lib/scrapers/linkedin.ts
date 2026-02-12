import { chromium } from 'playwright';

export interface ScrapedJob {
  title: string;
  company: string;
  location: string;
  url: string;
  description?: string;
  salary?: string;
  source: string;
}

export async function scrapeLinkedIn(query: string, location: string): Promise<ScrapedJob[]> {
  console.log(`Starting LinkedIn scrape for ${query} in ${location}`);
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
    console.log(`Found ${jobCards.length} potential job cards on LinkedIn`);

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
        console.error('Error parsing a LinkedIn job card:', e);
      }
    }

    // Step 2: Fetch details for each job
    console.log(`Fetching details for ${jobs.length} jobs...`);
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
        console.warn(`Failed to fetch details for ${job.url}`, err);
        job.description = 'View job post for details.';
      }
    }
  } catch (error) {
    console.error('LinkedIn scrape failed:', error);
  } finally {
    await browser.close();
  }

  return jobs;
}
