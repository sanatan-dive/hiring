import { describe, it, expect } from 'vitest';
import { computeAtsScore } from '@/lib/jobs/ats-score';

describe('computeAtsScore', () => {
  it('high score when resume matches JD heavily', () => {
    const result = computeAtsScore({
      resumeText: `
        Senior Software Engineer with 8 years experience.
        Skills: TypeScript, React, Node.js, Postgres, AWS, Docker, Kubernetes.
        Experience: Led backend at Stripe building payment infrastructure with TypeScript and Postgres.
        Education: BS Computer Science, MIT.
      `,
      jobDescription: `
        Looking for a Senior Software Engineer skilled in TypeScript, React, Node.js, Postgres, AWS.
        Experience with Docker and Kubernetes required.
      `,
    });
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(['good', 'excellent']).toContain(result.band);
  });

  it('low score when resume is way off the JD', () => {
    const result = computeAtsScore({
      resumeText: `
        Marketing manager with 5 years in B2C ecommerce.
        Skills: Brand strategy, content marketing, ad campaigns.
        Experience: Marketing at Acme.
        Education: MBA.
      `,
      jobDescription: `
        Senior Backend Engineer. TypeScript, Postgres, Kafka, microservices, distributed systems.
      `,
    });
    expect(result.score).toBeLessThan(50);
    expect(['weak', 'fair']).toContain(result.band);
  });

  it('flags resume too short', () => {
    const result = computeAtsScore({
      resumeText: 'Engineer. Likes code.',
      jobDescription: 'Senior engineer needed for backend work.',
    });
    expect(result.warnings.some((w) => w.toLowerCase().includes('words'))).toBe(true);
  });

  it('flags missing experience section', () => {
    const result = computeAtsScore({
      resumeText: 'TypeScript React Node.js Postgres '.repeat(80),
      jobDescription: 'TypeScript and Postgres for backend.',
    });
    expect(result.warnings.some((w) => w.toLowerCase().includes('experience'))).toBe(true);
  });

  it('returns score between 0 and 100', () => {
    const result = computeAtsScore({
      resumeText: 'Lorem ipsum dolor sit amet '.repeat(50),
      jobDescription: 'TypeScript React Node Postgres AWS Docker',
    });
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('matched + missing phrases are mutually exclusive', () => {
    const result = computeAtsScore({
      resumeText: 'TypeScript and React experience. Postgres expert.',
      jobDescription: 'TypeScript React Postgres Kafka required.',
    });
    const matchedSet = new Set(result.matchedPhrases);
    for (const m of result.missingPhrases) {
      expect(matchedSet.has(m)).toBe(false);
    }
  });
});
