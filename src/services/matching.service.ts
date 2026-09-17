import { log } from '@/lib/log';
import prisma from '@/lib/db/prisma';
import { generateEmbedding } from '@/lib/ai/google';
import { updateResumeEmbedding } from '@/services/resume.service';

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


const EMBEDDING_DIMS = 768;
const DEFAULT_MATERIALIZE_LIMIT = 10;

export type MaterializeMatchesOptions = {
  /** Top-N JobMatch rows to upsert (default 10). */
  limit?: number;
  /** Candidate pool size for pgvector search (default max(limit*5, 50), capped at 500). */
  candidatePoolSize?: number;
  /** When regenerating an embedding, also persist it on the latest resume (default true). */
  persistResumeEmbedding?: boolean;
};

export type MaterializeMatchesResult = {
  upserted: number;
  skippedHidden: number;
  embeddingSource: 'stored' | 'regenerated' | 'none';
};

type MatchProfileUser = {
  skills: string[];
  hiddenCompanies: string[];
  resumes: Array<{
    id: string;
    rawText: string | null;
    parsedSkills: Array<{ skill: string }>;
    parsedExperiences: Array<{
      role: string | null;
      company: string | null;
      description: string | null;
    }>;
  }>;
  jobPreferences: {
    desiredRoles: string[];
    experienceLevel: string | null;
    workLocation: string | null;
    locations: string[];
  } | null;
};

/** Parse pgvector `::text` output into a usable 768-dim vector, or null if unusable. */
export function parseStoredEmbedding(raw: string | null | undefined): number[] | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) return null;
  const inner = trimmed.slice(1, -1).trim();
  if (!inner) return null;
  const nums = inner.split(',').map((s) => Number(s.trim()));
  if (nums.length !== EMBEDDING_DIMS || nums.some((n) => Number.isNaN(n))) return null;
  return nums;
}

/** Build the same profile text the live /api/matches route uses for embedding. */
export function buildMatchProfileText(user: MatchProfileUser): string | null {
  const parts: string[] = [];
  if (user.skills?.length) parts.push(user.skills.join(', '));

  const resume = user.resumes[0];
  if (resume?.parsedSkills?.length) {
    parts.push(resume.parsedSkills.map((s) => s.skill).join(', '));
  }
  if (resume?.parsedExperiences?.length) {
    const expText = resume.parsedExperiences
      .map(
        (e) =>
          `${e.role || ''} at ${e.company || ''} ${(e.description || '').substring(0, 200)}`
      )
      .join('. ');
    parts.push(expText);
  }
  if (resume?.rawText?.trim()) {
    parts.push(resume.rawText.trim().substring(0, 4000));
  }

  const prefs = user.jobPreferences;
  if (prefs?.desiredRoles?.length) parts.push(prefs.desiredRoles.join(', '));
  if (prefs?.experienceLevel) parts.push(prefs.experienceLevel);
  if (prefs?.workLocation) parts.push(prefs.workLocation);
  if (prefs?.locations?.length) parts.push(prefs.locations.join(', '));

  if (parts.length === 0) return null;
  return parts.join(' | ').substring(0, 8000);
}

async function loadStoredResumeEmbedding(resumeId: string): Promise<number[] | null> {
  try {
    const rows = await prisma.$queryRaw<Array<{ embedding: string | null }>>`
      SELECT embedding::text AS embedding
      FROM resumes
      WHERE id = ${resumeId} AND embedding IS NOT NULL
      LIMIT 1
    `;
    return parseStoredEmbedding(rows[0]?.embedding ?? null);
  } catch (error) {
    log.error('Failed to load stored resume embedding:', error);
    return null;
  }
}

/**
 * Materialize top-N JobMatch rows for a single user via pgvector similarity.
 * Tenant-scoped: only reads/writes rows for the given userId.
 * Prefer a stored resume embedding when present and usable; otherwise regenerate
 * from skills / experience / prefs (same profile text as GET /api/matches).
 */
export async function materializeMatches(
  userId: string,
  options: MaterializeMatchesOptions = {}
): Promise<MaterializeMatchesResult> {
  const limit = options.limit ?? DEFAULT_MATERIALIZE_LIMIT;
  const candidatePoolSize = Math.min(
    500,
    options.candidatePoolSize ?? Math.max(limit * 5, 50)
  );
  const persistResumeEmbedding = options.persistResumeEmbedding !== false;

  const empty: MaterializeMatchesResult = {
    upserted: 0,
    skippedHidden: 0,
    embeddingSource: 'none',
  };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      skills: true,
      hiddenCompanies: true,
      resumes: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          id: true,
          rawText: true,
          parsedSkills: { select: { skill: true } },
          parsedExperiences: {
            select: { role: true, company: true, description: true },
          },
        },
      },
      jobPreferences: {
        select: {
          desiredRoles: true,
          experienceLevel: true,
          workLocation: true,
          locations: true,
        },
      },
    },
  });

  if (!user) return empty;

  const resume = user.resumes[0];
  let embedding: number[] | null = null;
  let embeddingSource: MaterializeMatchesResult['embeddingSource'] = 'none';

  if (resume) {
    embedding = await loadStoredResumeEmbedding(resume.id);
    if (embedding) embeddingSource = 'stored';
  }

  if (!embedding) {
    const profileText = buildMatchProfileText(user);
    if (profileText) {
      embedding = await generateEmbedding(profileText);
      if (embedding) {
        embeddingSource = 'regenerated';
        if (persistResumeEmbedding && resume) {
          try {
            await updateResumeEmbedding(resume.id, profileText);
          } catch (error) {
            log.error('Failed to persist regenerated resume embedding:', error, {
              userId,
              resumeId: resume.id,
            });
          }
        }
      }
    }
  }

  if (!embedding) return { ...empty, embeddingSource };

  let scored = await findSimilarJobs(embedding, candidatePoolSize);

  const hiddenCompanies = new Set(
    (user.hiddenCompanies ?? []).map((c) => c.toLowerCase())
  );
  if (hiddenCompanies.size > 0) {
    scored = scored.filter((j) => !hiddenCompanies.has((j.company ?? '').toLowerCase()));
  }

  const hiddenMatches = await prisma.jobMatch.findMany({
    where: { userId, status: 'hidden' },
    select: { jobId: true },
  });
  const hiddenJobIds = new Set(hiddenMatches.map((m) => m.jobId));
  const skippedHidden = scored.filter((j) => hiddenJobIds.has(j.id)).length;
  if (hiddenJobIds.size > 0) {
    scored = scored.filter((j) => !hiddenJobIds.has(j.id));
  }

  const top = scored.slice(0, limit);
  let upserted = 0;

  for (const job of top) {
    const score = job.finalScore ?? job.similarity;
    try {
      await prisma.jobMatch.upsert({
        where: { userId_jobId: { userId, jobId: job.id } },
        create: {
          userId,
          jobId: job.id,
          score,
          status: 'pending',
        },
        // Score only — never clobber status / emailedAt for this user.
        update: { score },
      });
      upserted++;
    } catch (error) {
      log.error('JobMatch upsert failed during materializeMatches:', error, {
        userId,
        jobId: job.id,
      });
    }
  }

  return { upserted, skippedHidden, embeddingSource };
}
