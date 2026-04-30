import { describe, it, expect } from 'vitest';
import { detectJobUrl, parseBulkUrls } from '@/lib/jobs/url-detection';

describe('detectJobUrl', () => {
  it('detects LinkedIn job URL', () => {
    const r = detectJobUrl('https://www.linkedin.com/jobs/view/3812345678');
    expect(r?.source).toBe('linkedin');
    expect(r?.isSupported).toBe(true);
  });

  it('detects Greenhouse', () => {
    const r = detectJobUrl('https://boards.greenhouse.io/stripe/jobs/4827283');
    expect(r?.source).toBe('greenhouse');
    expect(r?.isSupported).toBe(true);
  });

  it('detects Lever', () => {
    const r = detectJobUrl('https://jobs.lever.co/figma/abc-123');
    expect(r?.source).toBe('lever');
    expect(r?.isSupported).toBe(true);
  });

  it('detects Wellfound', () => {
    const r = detectJobUrl('https://wellfound.com/jobs/12345');
    expect(r?.source).toBe('wellfound');
  });

  it('marks Indeed unsupported (Cloudflare)', () => {
    const r = detectJobUrl('https://www.indeed.com/viewjob?jk=abc');
    expect(r?.source).toBe('indeed');
    expect(r?.isSupported).toBe(false);
  });

  it('marks unknown URLs', () => {
    const r = detectJobUrl('https://example.com/job/123');
    expect(r?.source).toBe('unknown');
    expect(r?.isSupported).toBe(false);
  });

  it('strips query params from supported URLs', () => {
    const r = detectJobUrl('https://www.linkedin.com/jobs/view/3812345678?utm_source=foo');
    expect(r?.url).toBe('https://www.linkedin.com/jobs/view/3812345678');
  });

  it('rejects non-URL input', () => {
    expect(detectJobUrl('not a url')).toBeNull();
    expect(detectJobUrl('')).toBeNull();
    expect(detectJobUrl('ftp://example.com')).toBeNull();
  });
});

describe('parseBulkUrls', () => {
  it('parses multiple URLs', () => {
    const text = `
      https://www.linkedin.com/jobs/view/123
      https://boards.greenhouse.io/stripe/jobs/456
      https://jobs.lever.co/figma/789
    `;
    const r = parseBulkUrls(text);
    expect(r.detected).toHaveLength(3);
    expect(r.invalid).toHaveLength(0);
  });

  it('separates invalid lines', () => {
    const text = `
      https://www.linkedin.com/jobs/view/123
      hello
      https://boards.greenhouse.io/stripe/jobs/456
    `;
    const r = parseBulkUrls(text);
    expect(r.detected).toHaveLength(2);
    expect(r.invalid).toEqual(['hello']);
  });

  it('handles empty input', () => {
    const r = parseBulkUrls('');
    expect(r.detected).toHaveLength(0);
    expect(r.invalid).toHaveLength(0);
  });
});
