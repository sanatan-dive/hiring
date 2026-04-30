import { log } from '@/lib/log';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/db/prisma';
import {
  findSimilarJobs,
  reRankJobs,
  type ScoredJob,
  type UserSignals,
} from '@/services/matching.service';
import { generateEmbedding } from '@/lib/ai/google';

const MAX_LIMIT = 100;

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');
    const limit = Math.min(MAX_LIMIT, parseInt(searchParams.get('limit') || '20'));
    const cursor = searchParams.get('cursor'); // job id of last item
    const filter = searchParams.get('filter') || 'all'; // all | remote | high | unviewed | applied

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        resumes: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { parsedSkills: true, parsedExperiences: true },
        },
        jobPreferences: true,
      },
    });

    let embedding: number[] | null = null;

    if (query) {
      embedding = await generateEmbedding(query);
    } else if (user) {
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
      const prefs = user.jobPreferences;
      if (prefs?.desiredRoles?.length) parts.push(prefs.desiredRoles.join(', '));
      if (prefs?.experienceLevel) parts.push(prefs.experienceLevel);
      if (prefs?.workLocation) parts.push(prefs.workLocation);
      if (prefs?.locations?.length) parts.push(prefs.locations.join(', '));

      if (parts.length > 0) {
        embedding = await generateEmbedding(parts.join(' | ').substring(0, 8000));
      }
    }

    // Pull a wider candidate pool; we filter and paginate after ranking.
    const candidatePoolSize = Math.min(MAX_LIMIT * 5, 500);
    let scored: ScoredJob[];
    if (embedding) {
      scored = await findSimilarJobs(embedding, candidatePoolSize);
    } else {
      const recent = await prisma.job.findMany({
        take: candidatePoolSize,
        orderBy: { scrapedAt: 'desc' },
      });
      scored = recent.map((j) => ({ ...j, scrapedAt: j.scrapedAt, similarity: 0 }));
    }

    // Apply user-level hidden-companies filter
    const hiddenCompanies = new Set((user?.hiddenCompanies ?? []).map((c) => c.toLowerCase()));
    if (hiddenCompanies.size > 0) {
      scored = scored.filter((j) => !hiddenCompanies.has((j.company ?? '').toLowerCase()));
    }

    // Apply hidden-match filter (per-user JobMatch.status='hidden')
    if (user) {
      const hiddenMatches = await prisma.jobMatch.findMany({
        where: { userId: user.id, status: 'hidden' },
        select: { jobId: true },
      });
      const hiddenIds = new Set(hiddenMatches.map((m) => m.jobId));
      if (hiddenIds.size > 0) scored = scored.filter((j) => !hiddenIds.has(j.id));
    }

    // Server-side filter chips
    if (filter === 'remote') {
      scored = scored.filter((j) => (j.location ?? '').toLowerCase().includes('remote'));
    } else if (filter === 'high') {
      scored = scored.filter((j) => (j.similarity ?? 0) >= 0.8);
    } else if (filter === 'applied' && user) {
      const apps = await prisma.application.findMany({
        where: { userId: user.id },
        select: { jobId: true },
      });
      const ids = new Set(apps.map((a) => a.jobId));
      scored = scored.filter((j) => ids.has(j.id));
    } else if (filter === 'unviewed' && user) {
      const seen = await prisma.jobMatch.findMany({
        where: { userId: user.id, status: { in: ['viewed', 'applied', 'rejected'] } },
        select: { jobId: true },
      });
      const ids = new Set(seen.map((m) => m.jobId));
      scored = scored.filter((j) => !ids.has(j.id));
    }

    // Build user signals (applied/rejected history) and re-rank.
    if (user) {
      const history = await prisma.application.findMany({
        where: { userId: user.id, status: { in: ['applied', 'rejected'] } },
        select: { status: true, job: { select: { company: true, title: true } } },
      });
      const signals: UserSignals = {
        appliedCompanies: new Set<string>(),
        rejectedCompanies: new Set<string>(),
        appliedTitles: [],
        rejectedTitles: [],
      };
      for (const h of history) {
        const company = (h.job?.company ?? '').toLowerCase();
        const title = h.job?.title ?? '';
        if (h.status === 'applied') {
          if (company) signals.appliedCompanies.add(company);
          if (title) signals.appliedTitles.push(title);
        } else if (h.status === 'rejected') {
          if (company) signals.rejectedCompanies.add(company);
          if (title) signals.rejectedTitles.push(title);
        }
      }
      scored = reRankJobs(scored, signals);
    } else {
      scored = reRankJobs(scored, null);
    }

    // Cursor pagination over the filtered, ranked list
    let startIdx = 0;
    if (cursor) {
      const idx = scored.findIndex((j) => j.id === cursor);
      startIdx = idx >= 0 ? idx + 1 : 0;
    }
    const page = scored.slice(startIdx, startIdx + limit);
    const nextCursor =
      page.length === limit && startIdx + limit < scored.length ? page[page.length - 1].id : null;

    return NextResponse.json({
      jobs: page,
      nextCursor,
      total: scored.length,
    });
  } catch (error) {
    log.error('Matches API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}
