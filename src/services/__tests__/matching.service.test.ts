import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  findUniqueMock,
  findManyMock,
  upsertMock,
  queryRawMock,
  generateEmbeddingMock,
  updateResumeEmbeddingMock,
} = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  findManyMock: vi.fn(),
  upsertMock: vi.fn(),
  queryRawMock: vi.fn(),
  generateEmbeddingMock: vi.fn(),
  updateResumeEmbeddingMock: vi.fn(),
}));

vi.mock('@/lib/db/prisma', () => ({
  default: {
    user: { findUnique: findUniqueMock },
    jobMatch: { findMany: findManyMock, upsert: upsertMock },
    $queryRaw: queryRawMock,
  },
}));

vi.mock('@/lib/ai/google', () => ({
  generateEmbedding: generateEmbeddingMock,
}));

vi.mock('@/services/resume.service', () => ({
  updateResumeEmbedding: updateResumeEmbeddingMock,
}));

vi.mock('@/lib/log', () => ({
  log: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

import {
  parseStoredEmbedding,
  buildMatchProfileText,
  materializeMatches,
} from '../matching.service';

// findSimilarJobs uses prisma.$queryRaw — stubbed above. We'll spy by
// controlling queryRawMock return values when testing materializeMatches
// through regenerating embeddings + a second $queryRaw for job search.

describe('parseStoredEmbedding', () => {
  it('accepts a valid 768-dim vector text', () => {
    const vec = Array.from({ length: 768 }, (_, i) => i * 0.001);
    const parsed = parseStoredEmbedding(`[${vec.join(',')}]`);
    expect(parsed).toHaveLength(768);
    expect(parsed![0]).toBeCloseTo(0);
    expect(parsed![1]).toBeCloseTo(0.001);
  });

  it('rejects wrong dimensionality', () => {
    expect(parseStoredEmbedding('[1,2,3]')).toBeNull();
  });

  it('rejects null/empty/malformed', () => {
    expect(parseStoredEmbedding(null)).toBeNull();
    expect(parseStoredEmbedding('')).toBeNull();
    expect(parseStoredEmbedding('not-a-vector')).toBeNull();
  });
});

describe('buildMatchProfileText', () => {
  it('returns null when there is no profile signal', () => {
    expect(
      buildMatchProfileText({
        skills: [],
        hiddenCompanies: [],
        resumes: [],
        jobPreferences: null,
      })
    ).toBeNull();
  });

  it('joins skills, experiences, and prefs', () => {
    const text = buildMatchProfileText({
      skills: ['TypeScript'],
      hiddenCompanies: [],
      resumes: [
        {
          id: 'r1',
          rawText: null,
          parsedSkills: [{ skill: 'React' }],
          parsedExperiences: [
            { role: 'Eng', company: 'Acme', description: 'Built stuff' },
          ],
        },
      ],
      jobPreferences: {
        desiredRoles: ['Frontend'],
        experienceLevel: 'mid',
        workLocation: 'remote',
        locations: ['Remote'],
      },
    });
    expect(text).toContain('TypeScript');
    expect(text).toContain('React');
    expect(text).toContain('Eng at Acme');
    expect(text).toContain('Frontend');
  });
});

describe('materializeMatches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findManyMock.mockResolvedValue([]);
    upsertMock.mockResolvedValue({});
    updateResumeEmbeddingMock.mockResolvedValue(undefined);
  });

  it('returns none when user is missing', async () => {
    findUniqueMock.mockResolvedValue(null);
    const result = await materializeMatches('missing');
    expect(result).toEqual({ upserted: 0, skippedHidden: 0, embeddingSource: 'none' });
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it('uses stored resume embedding and upserts top matches scoped to userId', async () => {
    const stored = Array.from({ length: 768 }, () => 0.1);
    findUniqueMock.mockResolvedValue({
      id: 'user-1',
      skills: ['Go'],
      hiddenCompanies: ['EvilCorp'],
      resumes: [
        {
          id: 'resume-1',
          rawText: null,
          parsedSkills: [{ skill: 'Go' }],
          parsedExperiences: [],
        },
      ],
      jobPreferences: null,
    });

    // First $queryRaw: stored embedding; second: findSimilarJobs
    queryRawMock
      .mockResolvedValueOnce([{ embedding: `[${stored.join(',')}]` }])
      .mockResolvedValueOnce([
        {
          id: 'job-good',
          title: 'Backend',
          company: 'GoodCo',
          location: 'Remote',
          salary: null,
          description: null,
          url: 'https://example.com/1',
          source: 'adzuna',
          scrapedAt: new Date(),
          similarity: 0.9,
        },
        {
          id: 'job-evil',
          title: 'Backend',
          company: 'EvilCorp',
          location: 'Remote',
          salary: null,
          description: null,
          url: 'https://example.com/2',
          source: 'adzuna',
          scrapedAt: new Date(),
          similarity: 0.95,
        },
        {
          id: 'job-hidden',
          title: 'Backend',
          company: 'Other',
          location: 'Remote',
          salary: null,
          description: null,
          url: 'https://example.com/3',
          source: 'adzuna',
          scrapedAt: new Date(),
          similarity: 0.8,
        },
      ]);

    findManyMock.mockResolvedValue([{ jobId: 'job-hidden' }]);

    const result = await materializeMatches('user-1', { limit: 10 });

    expect(result.embeddingSource).toBe('stored');
    expect(result.skippedHidden).toBe(1);
    expect(result.upserted).toBe(1);
    expect(generateEmbeddingMock).not.toHaveBeenCalled();
    expect(upsertMock).toHaveBeenCalledTimes(1);
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_jobId: { userId: 'user-1', jobId: 'job-good' } },
        create: expect.objectContaining({
          userId: 'user-1',
          jobId: 'job-good',
          status: 'pending',
        }),
        update: expect.objectContaining({ score: expect.any(Number) }),
      })
    );
  });

  it('regenerates embedding when stored vector is missing', async () => {
    const regenerated = Array.from({ length: 768 }, () => 0.2);
    findUniqueMock.mockResolvedValue({
      id: 'user-2',
      skills: ['Rust'],
      hiddenCompanies: [],
      resumes: [
        {
          id: 'resume-2',
          rawText: null,
          parsedSkills: [{ skill: 'Rust' }],
          parsedExperiences: [],
        },
      ],
      jobPreferences: {
        desiredRoles: ['Systems'],
        experienceLevel: null,
        workLocation: null,
        locations: [],
      },
    });

    queryRawMock
      .mockResolvedValueOnce([]) // no stored embedding
      .mockResolvedValueOnce([
        {
          id: 'job-a',
          title: 'Systems Eng',
          company: 'Co',
          location: null,
          salary: null,
          description: null,
          url: 'https://example.com/a',
          source: 'jsearch',
          scrapedAt: new Date(),
          similarity: 0.7,
        },
      ]);

    generateEmbeddingMock.mockResolvedValue(regenerated);

    const result = await materializeMatches('user-2', { limit: 5 });

    expect(result.embeddingSource).toBe('regenerated');
    expect(result.upserted).toBe(1);
    expect(generateEmbeddingMock).toHaveBeenCalled();
    expect(updateResumeEmbeddingMock).toHaveBeenCalledWith(
      'resume-2',
      expect.stringContaining('Rust')
    );
  });
});

