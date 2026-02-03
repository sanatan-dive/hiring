import Parser from 'rss-parser';

const FEED_URLS = [
  'https://weworkremotely.com/categories/remote-programming-jobs.rss',
  'https://weworkremotely.com/categories/remote-design-jobs.rss',
  'https://weworkremotely.com/categories/remote-devops-sysadmin-jobs.rss',
  'https://weworkremotely.com/categories/remote-full-stack-programming-jobs.rss',
  'https://weworkremotely.com/categories/remote-back-end-programming-jobs.rss',
  'https://weworkremotely.com/categories/remote-front-end-programming-jobs.rss',
];

export interface WWRJob {
  title: string;
  link: string;
  pubDate: string;
  content: string;
  contentSnippet: string;
  guid: string;
  categories?: string[];
  company?: string; // Often embedded in title "Header - Company"
}

export async function getWeWorkRemotelyJobs(limit: number = 20): Promise<WWRJob[]> {
  const parser = new Parser();
  const allJobs: WWRJob[] = [];
  const seenGuids = new Set<string>();

  try {
    // Process feeds in parallel
    const feedPromises = FEED_URLS.map(async (url) => {
      try {
        const feed = await parser.parseURL(url);
        return feed.items as unknown as WWRJob[];
      } catch (err) {
        console.error(`Error fetching WWR feed ${url}:`, err);
        return [];
      }
    });

    const results = await Promise.all(feedPromises);

    // Flatten and deduplicate
    for (const items of results) {
      for (const item of items) {
        if (!seenGuids.has(item.guid)) {
          seenGuids.add(item.guid);

          // Clean up title to extract company if possible
          // Format usually: "Role: Company" or "Company: Role" or just "Role"
          // WWR RSS titles are usually "Role at Company" or similar.
          // Actually WWR RSS titles are "Role: Company" or "Role"
          // Let's keep it simple for now.

          allJobs.push(item);
        }
      }
    }

    // Sort by date descending
    allJobs.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    return allJobs.slice(0, limit);
  } catch (error) {
    console.error('Error fetching WeWorkRemotely jobs:', error);
    return [];
  }
}
