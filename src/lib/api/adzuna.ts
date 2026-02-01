import config from '@/config';

const ADZUNA_BASE_URL = 'https://api.adzuna.com/v1/api/jobs';

export interface AdzunaJob {
  id: string;
  title: string;
  description: string;
  company: { display_name: string };
  location: { display_name: string; area: string[] };
  salary_min?: number;
  salary_max?: number;
  redirect_url: string;
  created: string;
  contract_type?: string;
}

export async function searchAdzunaJobs(
  query: string,
  location: string = 'us',
  page: number = 1
): Promise<AdzunaJob[]> {
  const { adzunaAppId, adzunaApiKey } = config.jobApis;

  if (!adzunaAppId || !adzunaApiKey) {
    console.warn('Adzuna API credentials missing');
    return [];
  }

  // Country code normalization (Adzuna uses country codes in URL)
  // Default to 'us' if not specified or strictly supported
  // Start with simple mapping
  const country = location.toLowerCase().includes('india') ? 'in' : 'us';

  try {
    const url = `${ADZUNA_BASE_URL}/${country}/search/${page}?app_id=${adzunaAppId}&app_key=${adzunaApiKey}&what=${encodeURIComponent(
      query
    )}&content-type=application/json`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Adzuna API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Failed to fetch from Adzuna:', error);
    return [];
  }
}
