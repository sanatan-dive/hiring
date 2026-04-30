import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Only initialize if env vars are present
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

export const RATELIMIT_CONFIG = {
  FREE: {
    max: 3,
    window: '7 d', // 3 requests per week
  },
  PRO: {
    max: 100,
    window: '1 d', // 100 requests per day
  },
} as const;

// Unified ratelimit object. Limiters are lazily resolved so that the module
// stays importable when Redis env vars are missing (dev / preview).
type Limiter = {
  limit: (
    identifier: string
  ) => Promise<{ success: boolean; limit: number; remaining: number; reset: number }>;
};

const noopLimiter: Limiter = {
  limit: async () => ({ success: true, limit: 0, remaining: 0, reset: 0 }),
};

function makeLimiter(
  count: number,
  window: Parameters<typeof Ratelimit.slidingWindow>[1],
  prefix: string
): Limiter {
  if (!redis) return noopLimiter;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(count, window),
    analytics: true,
    prefix,
  });
}

export const ratelimit = {
  jobsFreeWeekly: makeLimiter(3, '7 d', 'rl:jobs:free'),
  jobsProDaily: makeLimiter(100, '1 d', 'rl:jobs:pro'),
  aiPro: makeLimiter(20, '1 d', 'rl:ai'),
  scrape: makeLimiter(5, '1 d', 'rl:scrape'),
  payments: makeLimiter(10, '1 d', 'rl:pay'),
};

export async function checkRateLimit(
  userId: string,
  plan: 'FREE' | 'PRO' = 'FREE'
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  // Fail-open in dev / when Redis missing.
  if (!redis) {
    console.warn('Rate limiting disabled: UPSTASH_REDIS keys missing');
    return { success: true, limit: 100, remaining: 100, reset: 0 };
  }

  const limiter = plan === 'PRO' ? ratelimit.jobsProDaily : ratelimit.jobsFreeWeekly;
  const { success, limit, remaining, reset } = await limiter.limit(`job_fetch:${userId}`);
  return { success, limit, remaining, reset };
}
