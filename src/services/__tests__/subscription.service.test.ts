import { describe, it, expect, vi } from 'vitest';

// subscription.service imports prisma at module top-level. Stub it so the test
// runs without a real database connection.
vi.mock('@/lib/db/prisma', () => ({
  default: {},
}));

import { PLANS } from '../subscription.service';

describe('PLANS', () => {
  it('FREE plan is priced at 0', () => {
    expect(PLANS.FREE.price).toBe(0);
  });

  it('FREE plan has a name and non-empty features list', () => {
    expect(PLANS.FREE.name).toBe('Free');
    expect(Array.isArray(PLANS.FREE.features)).toBe(true);
    expect(PLANS.FREE.features.length).toBeGreaterThan(0);
  });

  it('PRO plan has a positive price', () => {
    expect(typeof PLANS.PRO.price).toBe('number');
    expect(PLANS.PRO.price).toBeGreaterThan(0);
  });

  it('PRO plan exposes a currency and non-empty features list', () => {
    expect(PLANS.PRO.currency).toBeTypeOf('string');
    expect(PLANS.PRO.features.length).toBeGreaterThan(0);
  });
});
