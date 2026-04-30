import { describe, it, expect } from 'vitest';
import {
  parseSalary,
  percentile,
  detectRoleFamily,
  isRemoteLocation,
  formatSalaryRangeUSD,
} from '@/lib/jobs/salary';

describe('parseSalary', () => {
  it('parses $80k - $120k', () => {
    const r = parseSalary('$80k - $120k');
    expect(r).not.toBeNull();
    expect(r!.min).toBe(80000);
    expect(r!.max).toBe(120000);
    expect(r!.currency).toBe('USD');
  });

  it('parses raw numbers with K', () => {
    const r = parseSalary('120K to 180K USD');
    expect(r!.min).toBe(120000);
    expect(r!.max).toBe(180000);
  });

  it('parses INR LPA', () => {
    const r = parseSalary('₹15-25 LPA');
    expect(r).not.toBeNull();
    expect(r!.currency).toBe('INR');
    expect(r!.min).toBe(Math.round(15 * 100000 * 0.012));
    expect(r!.max).toBe(Math.round(25 * 100000 * 0.012));
  });

  it('parses hourly', () => {
    const r = parseSalary('$50 - $80 per hour');
    expect(r!.min).toBe(50 * 2080);
    expect(r!.max).toBe(80 * 2080);
  });

  it('parses single number', () => {
    const r = parseSalary('$100,000');
    expect(r!.min).toBe(100000);
    expect(r!.max).toBe(100000);
  });

  it('returns null for unparseable', () => {
    expect(parseSalary(null)).toBeNull();
    expect(parseSalary('competitive salary')).toBeNull();
    expect(parseSalary('')).toBeNull();
  });

  it('rejects insane values', () => {
    expect(parseSalary('$2 - $5')).toBeNull(); // too low
    expect(parseSalary('$50,000,000 - $100,000,000')).toBeNull(); // too high
  });

  it('detects EUR', () => {
    const r = parseSalary('€60k - €90k');
    expect(r!.currency).toBe('EUR');
  });
});

describe('percentile', () => {
  it('returns 100 for max value', () => {
    expect(percentile([10, 20, 30, 40, 50], 50)).toBe(100);
  });

  it('returns ~50 for median', () => {
    const result = percentile([10, 20, 30, 40, 50], 30);
    expect(result).toBeGreaterThanOrEqual(40);
    expect(result).toBeLessThanOrEqual(60);
  });

  it('returns 0 for empty', () => {
    expect(percentile([], 100)).toBe(0);
  });
});

describe('detectRoleFamily', () => {
  it('detects frontend', () => {
    expect(detectRoleFamily('Senior Frontend Engineer')).toBe('frontend');
    expect(detectRoleFamily('React Developer')).toBe('frontend');
  });

  it('detects backend', () => {
    expect(detectRoleFamily('Backend Engineer')).toBe('backend');
  });

  it('detects ml', () => {
    expect(detectRoleFamily('Machine Learning Engineer')).toBe('ml');
    expect(detectRoleFamily('Data Scientist')).toBe('ml');
  });

  it('returns null for unrecognized', () => {
    expect(detectRoleFamily('Office Manager')).toBeNull();
  });
});

describe('isRemoteLocation', () => {
  it('detects remote', () => {
    expect(isRemoteLocation('Remote')).toBe(true);
    expect(isRemoteLocation('Worldwide')).toBe(true);
    expect(isRemoteLocation('Anywhere')).toBe(true);
  });

  it('detects non-remote', () => {
    expect(isRemoteLocation('San Francisco, CA')).toBe(false);
    expect(isRemoteLocation('Bangalore, India')).toBe(false);
  });

  it('handles null', () => {
    expect(isRemoteLocation(null)).toBe(false);
  });
});

describe('formatSalaryRangeUSD', () => {
  it('formats range', () => {
    expect(formatSalaryRangeUSD(80000, 120000)).toBe('$80k–$120k');
  });
  it('formats single value', () => {
    expect(formatSalaryRangeUSD(100000, 100000)).toBe('$100k');
  });
});
