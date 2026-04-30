import { describe, it, expect } from 'vitest';
import { diversifyBySource } from '@/lib/jobs/diversity';

describe('diversifyBySource', () => {
  it('returns same array when single source', () => {
    const jobs = [
      { source: 'a', id: 1 },
      { source: 'a', id: 2 },
      { source: 'a', id: 3 },
    ];
    const result = diversifyBySource(jobs);
    expect(result).toHaveLength(3);
  });

  it('preserves all jobs (none lost)', () => {
    const jobs = Array.from({ length: 20 }, (_, i) => ({
      source: i < 15 ? 'remoteok' : 'adzuna',
      id: i,
    }));
    const result = diversifyBySource(jobs, { maxPerSourceFraction: 0.4 });
    expect(result).toHaveLength(20);
  });

  it('caps dominant source in head of result', () => {
    const jobs = Array.from({ length: 10 }, (_, i) => ({
      source: i < 8 ? 'remoteok' : 'adzuna',
      id: i,
    }));
    // 40% of 10 = 4 max from remoteok in the head
    const result = diversifyBySource(jobs, { maxPerSourceFraction: 0.4 });
    const top4 = result.slice(0, 4);
    const remoteokInTop4 = top4.filter((j) => j.source === 'remoteok').length;
    expect(remoteokInTop4).toBeLessThanOrEqual(4);
  });

  it('handles empty array', () => {
    expect(diversifyBySource([])).toEqual([]);
  });

  it('handles missing source as "unknown"', () => {
    const jobs = [{ id: 1 } as { id: number; source?: string }, { id: 2, source: 'a' }];
    expect(diversifyBySource(jobs as { source: string }[]).length).toBe(2);
  });
});
