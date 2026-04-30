import { describe, it, expect } from 'vitest';
import { RATELIMIT_CONFIG } from '../ratelimit';

describe('RATELIMIT_CONFIG', () => {
  it('defines FREE and PRO tiers', () => {
    expect(RATELIMIT_CONFIG.FREE).toBeDefined();
    expect(RATELIMIT_CONFIG.PRO).toBeDefined();
  });

  it('PRO allows more requests than FREE', () => {
    expect(RATELIMIT_CONFIG.PRO.max).toBeGreaterThan(RATELIMIT_CONFIG.FREE.max);
  });

  it('each tier has a numeric max and a window string', () => {
    for (const tier of ['FREE', 'PRO'] as const) {
      expect(typeof RATELIMIT_CONFIG[tier].max).toBe('number');
      expect(typeof RATELIMIT_CONFIG[tier].window).toBe('string');
    }
  });
});
