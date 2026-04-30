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

const LINKEDIN_RE = /^https?:\/\/(www\.)?linkedin\.com\/jobs\/view\//i;
const INDEED_RE = /^https?:\/\/(www\.)?(in\.)?indeed\.com\//i;

function randomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function detectSource(url: string): string {
  if (LINKEDIN_RE.test(url)) return 'linkedin';
  if (INDEED_RE.test(url)) return 'indeed';
  if (url.includes('greenhouse.io')) return 'greenhouse';
  if (url.includes('lever.co')) return 'lever';
  if (url.includes('workatastartup.com')) return 'yc';
  return 'generic';
}

export async function scrapeJob(url: string): Promise<ScrapedJob> {
  const source = detectSource(url);

  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({
      userAgent: randomUA(),
      viewport: {
        width: 1280 + Math.floor(Math.random() * 200),
        height: 720 + Math.floor(Math.random() * 100),
      },
      locale: 'en-US',
    });
    const page = await ctx.newPage();

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // LinkedIn-tuned selectors first; fall back to generic Open Graph metadata.
    if (source === 'linkedin') {
      return await extractLinkedIn(page, url);
    }

    return await extractGeneric(page, url, source);
  } finally {
    if (browser) await browser.close();
  }
}

async function extractLinkedIn(page: import('playwright').Page, url: string): Promise<ScrapedJob> {
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
      .locator(
        '.topcard__org-name-link, a.topcard__org-name-link, .top-card-layout__second-subline a'
      )
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

  if (!title) throw new Error('linkedin: could not find title');

  return {
    title,
    company: company || 'Unknown',
    location: loc || 'Not specified',
    url: url.split('?')[0],
    description: description || undefined,
    source: 'linkedin',
  };
}

async function extractGeneric(
  page: import('playwright').Page,
  url: string,
  source: string
): Promise<ScrapedJob> {
  // Use Open Graph + JSON-LD where available — most ATS providers emit these.
  const meta = await page.evaluate(() => {
    const og = (prop: string) =>
      document.querySelector(`meta[property="og:${prop}"]`)?.getAttribute('content') ?? '';
    const ld = document.querySelector('script[type="application/ld+json"]')?.textContent ?? '';
    let parsed: Record<string, unknown> | null = null;
    try {
      parsed = ld ? (JSON.parse(ld) as Record<string, unknown>) : null;
    } catch {
      parsed = null;
    }
    return {
      ogTitle: og('title'),
      ogDescription: og('description'),
      ld: parsed,
      h1: document.querySelector('h1')?.textContent ?? '',
      bodyText: document.body.innerText.slice(0, 5000),
    };
  });

  const ld = meta.ld as Record<string, unknown> | null;
  const title =
    (typeof ld?.title === 'string' ? ld.title : '') || meta.ogTitle || meta.h1 || 'Unknown role';
  const hiringOrg = ld?.hiringOrganization as Record<string, unknown> | undefined;
  const company = (typeof hiringOrg?.name === 'string' ? hiringOrg.name : '') || 'Unknown';
  const jobLocation = ld?.jobLocation as Record<string, unknown> | undefined;
  const address = jobLocation?.address as Record<string, unknown> | undefined;
  const location =
    (typeof address?.addressLocality === 'string' ? address.addressLocality : '') ||
    'Not specified';
  const description =
    (typeof ld?.description === 'string' ? ld.description : '') ||
    meta.ogDescription ||
    meta.bodyText.slice(0, 2000);

  return {
    title: title.trim(),
    company: company.trim(),
    location: location.trim(),
    url: url.split('?')[0],
    description: description?.trim() || undefined,
    source,
  };
}
