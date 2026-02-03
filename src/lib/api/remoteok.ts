export interface RemoteOkJob {
  slug: string;
  id: string;
  epoch: number;
  date: string;
  company: string;
  company_logo: string;
  position: string;
  tags: string[];
  description: string;
  location: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  url: string;
  apply_url: string;
}

export async function getRemoteOkJobs(limit: number = 20): Promise<RemoteOkJob[]> {
  try {
    const response = await fetch('https://remoteok.com/api', {
      next: { revalidate: 3600 }, // Cache for 1 hour
      headers: {
        'User-Agent': 'Smarthire/1.0 (smarthire.app)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch RemoteOK jobs: ${response.statusText}`);
    }

    const data = await response.json();

    // RemoteOK returns metadata as the first element, so we filter it out
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const jobs = data.filter((item: any) => item.slug && item.company);

    return jobs.slice(0, limit);
  } catch (error) {
    console.error('Error fetching RemoteOK jobs:', error);
    return [];
  }
}
