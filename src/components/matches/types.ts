export interface Job {
  id: string;
  title: string;
  company: string;
  location: string | null;
  salary: string | null;
  description: string | null;
  url: string;
  source: string;
  scrapedAt: string;
  matches: unknown[];
  similarity?: number;
}
