import { describe, it, expect } from 'vitest';
import { isLinkedInJobUrl } from '@/lib/scrapers/linkedin';

describe('isLinkedInJobUrl', () => {
  it('accepts a valid linkedin job URL', () => {
    expect(isLinkedInJobUrl('https://www.linkedin.com/jobs/view/3812345678')).toBe(true);
  });

  it('accepts http variant', () => {
    expect(isLinkedInJobUrl('http://www.linkedin.com/jobs/view/3812345678')).toBe(true);
  });

  it('accepts URL without www', () => {
    expect(isLinkedInJobUrl('https://linkedin.com/jobs/view/12345')).toBe(true);
  });

  it('accepts URL with query params', () => {
    expect(
      isLinkedInJobUrl('https://www.linkedin.com/jobs/view/3812345678?utm_source=foo')
    ).toBe(true);
  });

  it('rejects a search URL', () => {
    expect(isLinkedInJobUrl('https://www.linkedin.com/jobs/search?keywords=engineer')).toBe(
      false
    );
  });

  it('rejects a profile URL', () => {
    expect(isLinkedInJobUrl('https://www.linkedin.com/in/someuser')).toBe(false);
  });

  it('rejects non-linkedin URLs', () => {
    expect(isLinkedInJobUrl('https://indeed.com/jobs/view/12345')).toBe(false);
    expect(isLinkedInJobUrl('https://example.com/linkedin.com/jobs/view/12345')).toBe(false);
  });

  it('rejects URLs without a numeric job id', () => {
    expect(isLinkedInJobUrl('https://www.linkedin.com/jobs/view/notanumber')).toBe(false);
    expect(isLinkedInJobUrl('https://www.linkedin.com/jobs/view/')).toBe(false);
  });

  it('handles whitespace from copy/paste', () => {
    expect(isLinkedInJobUrl('  https://www.linkedin.com/jobs/view/3812345678  ')).toBe(true);
  });
});
