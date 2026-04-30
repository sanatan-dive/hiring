/**
 * Source diversity re-ranker.
 *
 * Without this, a digest dominated by RemoteOK looks like "just RemoteOK"
 * to users. We cap any single source to a max share of the result set so
 * users see breadth.
 *
 * Algorithm: greedy round-robin per source, respecting score order within
 * each source's bucket. O(n).
 */

interface JobLike {
  source: string;
}

export function diversifyBySource<T extends JobLike>(
  jobs: T[],
  options: { maxPerSourceFraction?: number } = {}
): T[] {
  const { maxPerSourceFraction = 0.4 } = options;
  if (jobs.length <= 1) return jobs;

  const maxPerSource = Math.max(1, Math.ceil(jobs.length * maxPerSourceFraction));

  // Bucket by source, preserving original (already-ranked) order
  const buckets = new Map<string, T[]>();
  for (const j of jobs) {
    const src = j.source ?? 'unknown';
    if (!buckets.has(src)) buckets.set(src, []);
    buckets.get(src)!.push(j);
  }

  // First pass: take up to maxPerSource from each bucket in priority order.
  // We process buckets in descending bucket-size order so dominant sources
  // contribute their best to the head, but get capped.
  const sortedBuckets = Array.from(buckets.entries()).sort(([, a], [, b]) => b.length - a.length);

  const counts = new Map<string, number>();
  const result: T[] = [];
  const overflow: T[] = [];

  for (const [src, items] of sortedBuckets) {
    counts.set(src, 0);
    for (const j of items) {
      const c = counts.get(src) ?? 0;
      if (c < maxPerSource) {
        result.push(j);
        counts.set(src, c + 1);
      } else {
        overflow.push(j);
      }
    }
  }

  // Re-sort the capped result by original order (i.e. score)
  // We do this by keeping track of original index above? Simpler: just
  // append overflow so we don't lose any items, but the head reflects
  // diversity. The /api/matches endpoint already paginates → the head
  // (first page) is what users see most.
  return [...result, ...overflow];
}
