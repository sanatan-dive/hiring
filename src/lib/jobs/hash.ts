import crypto from 'node:crypto';

/**
 * Stable hash of (title|company|location) for duplicate detection across
 * UTM-tagged URLs. Same job from two sources collapses to one row.
 *
 * Pure helper (no side effects, no heavy imports) — safe to unit-test.
 */
export function jobContentHash(input: {
  title: string;
  company: string;
  location?: string | null;
}): string {
  const norm = (s: string) => s.toLowerCase().trim().replace(/\s+/g, ' ');
  return crypto
    .createHash('sha256')
    .update(`${norm(input.title)}|${norm(input.company)}|${norm(input.location ?? '')}`)
    .digest('hex');
}
