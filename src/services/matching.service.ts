import { log } from '@/lib/log';
import prisma from '@/lib/db/prisma';

interface RawJobRow {
  id: string;
  title: string;
  company: string;
  location: string | null;
  salary: string | null;
  description: string | null;
  url: string;
  source: string;
  scrapedAt: Date;
  similarity: unknown; // Prisma returns BigDecimal as Decimal/string
}

export type ScoredJob = Omit<RawJobRow, 'similarity'> & {
  similarity: number;
  finalScore?: number;
};

export interface UserSignals {
  appliedCompanies: Set<string>;
  rejectedCompanies: Set<string>;
  appliedTitles: string[];
  rejectedTitles: string[];
}

export async function findSimilarJobs(embedding: number[], limit = 20): Promise<ScoredJob[]> {
  if (!embedding || embedding.length === 0) return [];

  // Use raw SQL for pgvector similarity search
  // <=> is the cosine distance operator
  // We explicitly cast the embedding to vector
  const vectorQuery = `[${embedding.join(',')}]`;

  try {
    const jobs = await prisma.$queryRaw<RawJobRow[]>`
      SELECT
        id,
        title,
        company,
        location,
        salary,
        description,
        url,
        source,
        "scrapedAt",
        1 - (embedding <=> ${vectorQuery}::vector) as similarity
      FROM jobs
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${vectorQuery}::vector
      LIMIT ${limit};
    `;

    // Prisma returns computed numeric columns as Decimal/BigDecimal strings
    // Convert to plain JS numbers for frontend consumption
    return jobs.map((job) => ({
      ...job,
      similarity: Number(job.similarity),
    }));
  } catch (error) {
    log.error('Error finding similar jobs:', error);
    return [];
  }
}

function tokenize(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 1)
  );
}

function titleOverlapRatio(a: string, b: string): number {
  const ta = tokenize(a);
  const tb = tokenize(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  const smaller = Math.min(ta.size, tb.size);
  return inter / smaller;
}

function userHistorySignal(job: ScoredJob, signals: UserSignals): number {
  const company = (job.company ?? '').toLowerCase();
  const title = job.title ?? '';

  if (signals.rejectedCompanies.has(company)) return -0.5;
  for (const t of signals.rejectedTitles) {
    if (titleOverlapRatio(title, t) >= 0.5) return -0.5;
  }

  if (signals.appliedCompanies.has(company)) return 0.3;
  for (const t of signals.appliedTitles) {
    if (titleOverlapRatio(title, t) >= 0.5) return 0.3;
  }

  return 0;
}

function isSignalsEmpty(signals: UserSignals | null | undefined): boolean {
  if (!signals) return true;
  return (
    signals.appliedCompanies.size === 0 &&
    signals.rejectedCompanies.size === 0 &&
    signals.appliedTitles.length === 0 &&
    signals.rejectedTitles.length === 0
  );
}

export function reRankJobs(
  scoredJobs: ScoredJob[],
  userSignals: UserSignals | null | undefined
): ScoredJob[] {
  if (isSignalsEmpty(userSignals)) {
    return scoredJobs.map((j) => ({ ...j, finalScore: j.similarity }));
  }
  const signals = userSignals as UserSignals;
  const now = Date.now();
  const DAY_MS = 1000 * 60 * 60 * 24;

  const reRanked = scoredJobs.map((job) => {
    const days = Math.max(0, (now - new Date(job.scrapedAt).getTime()) / DAY_MS);
    const recencyDecay = Math.max(0, 1 - days / 30);
    const history = userHistorySignal(job, signals);
    const finalScore = 0.6 * (job.similarity ?? 0) + 0.2 * recencyDecay + 0.2 * history;
    return { ...job, finalScore };
  });

  reRanked.sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0));
  return reRanked;
}
