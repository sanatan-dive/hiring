import config from '@/config';

const JSEARCH_BASE_URL = 'https://jsearch.p.rapidapi.com/search';

export interface JSearchJob {
  job_id: string;
  employer_name: string;
  job_title: string;
  job_description: string;
  job_apply_link: string;
  job_city: string;
  job_state: string;
  job_country: string;
  job_min_salary?: number;
  job_max_salary?: number;
  job_posted_at_datetime_utc: string;
  job_employment_type: string;
}

export async function searchJSearchJobs(query: string, page: number = 1): Promise<JSearchJob[]> {
  const { jsearchApiKey } = config.jobApis;

  if (!jsearchApiKey) {
    console.warn('JSearch API key missing');
    return [];
  }

  try {
    const response = await fetch(
      `${JSEARCH_BASE_URL}?query=${encodeURIComponent(query)}&page=${page}&num_pages=1`,
      {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': jsearchApiKey,
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`JSearch API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Failed to fetch from JSearch:', error);
    return [];
  }
}
