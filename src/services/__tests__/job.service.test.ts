import { describe, it, expect } from 'vitest';
import { jobContentHash } from '@/lib/jobs/hash';

describe('jobContentHash', () => {
  it('produces a stable hash for the same input', () => {
    const a = jobContentHash({ title: 'Senior Engineer', company: 'Acme', location: 'Remote' });
    const b = jobContentHash({ title: 'Senior Engineer', company: 'Acme', location: 'Remote' });
    expect(a).toBe(b);
  });

  it('is case-insensitive', () => {
    const a = jobContentHash({ title: 'Senior Engineer', company: 'Acme', location: 'Remote' });
    const b = jobContentHash({ title: 'SENIOR engineer', company: 'acme', location: 'REMOTE' });
    expect(a).toBe(b);
  });

  it('collapses whitespace', () => {
    const a = jobContentHash({ title: 'Senior   Engineer', company: ' Acme ', location: 'Remote' });
    const b = jobContentHash({ title: 'Senior Engineer', company: 'Acme', location: 'Remote' });
    expect(a).toBe(b);
  });

  it('treats null/missing location as empty', () => {
    const a = jobContentHash({ title: 'Backend Eng', company: 'Acme', location: null });
    const b = jobContentHash({ title: 'Backend Eng', company: 'Acme' });
    expect(a).toBe(b);
  });

  it('produces different hashes for different content', () => {
    const a = jobContentHash({ title: 'Senior Engineer', company: 'Acme', location: 'Remote' });
    const b = jobContentHash({ title: 'Senior Engineer', company: 'Acme', location: 'NYC' });
    const c = jobContentHash({ title: 'Junior Engineer', company: 'Acme', location: 'Remote' });
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
  });

  it('returns hex string of length 64 (sha256)', () => {
    const h = jobContentHash({ title: 'X', company: 'Y' });
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });
});
