import { chromium } from 'playwright';
import { ScrapedJob } from './linkedin';

export async function scrapeIndeed(query: string, location: string): Promise<ScrapedJob[]> {
  console.log(`Starting Indeed scrape for ${query} in ${location}`);
  const browser = await chromium.launch({ headless: true });
  // Indeed has strong bot detection, so we need a convincing user agent
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();
  const jobs: ScrapedJob[] = [];

  try {
    const searchUrl = `https://www.indeed.com/jobs?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}`;
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    try {
      await page.waitForSelector('.job_seen_beacon', { timeout: 10000 });
    } catch {
      console.log('Indeed selector wait failed, might be blocked or no results.');
    }

    const jobCards = await page.$$('.job_seen_beacon');
    console.log(`Found ${jobCards.length} potential job cards on Indeed`);

    for (const card of jobCards.slice(0, 10)) {
      try {
        const titleElement = await card.$('h2.jobTitle span[title]');
        const companyElement = await card.$('[data-testid="company-name"]');
        const locationElement = await card.$('[data-testid="text-location"]');
        const linkElement = await card.$('a.jcs-JobTitle');

        const title = titleElement ? await titleElement.getAttribute('title') : '';
        const company = companyElement ? (await companyElement.innerText()).trim() : '';
        const loc = locationElement ? (await locationElement.innerText()).trim() : '';
        const href = linkElement ? await linkElement.getAttribute('href') : '';

        let url = '';
        if (href) {
          url = href.startsWith('http') ? href : `https://www.indeed.com${href}`;
        }

        if (title && url) {
          jobs.push({
            title: title || '',
            company,
            location: loc,
            url: url.split('&')[0], // Clean URL partially
            source: 'indeed',
          });
        }
      } catch (e) {
        console.error('Error parsing an Indeed job card:', e);
      }
    }
  } catch (error) {
    console.error('Indeed scrape failed:', error);
  } finally {
    await browser.close();
  }

  return jobs;
}
