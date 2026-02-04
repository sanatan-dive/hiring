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

export async function checkRateLimit(
  userId: string,
  plan: 'FREE' | 'PRO' = 'FREE'
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  // If no Redis, decide fail-open or fail-closed.
  // Fail-open (allow request) is usually safer for UX if infra is missing in dev.
  if (!redis) {
    console.warn('⚠️ Rate limiting disabled: UPSTASH_REDIS keys missing');
    return { success: true, limit: 100, remaining: 100, reset: 0 };
  }

  const config = RATELIMIT_CONFIG[plan];

  // Create a new ratelimiter, that allows {config.max} requests per {config.window}
  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.max, config.window as '1 d' | '7 d'),
    analytics: true,
    prefix: '@upstash/ratelimit',
  });

  const { success, limit, remaining, reset } = await ratelimit.limit(`job_fetch:${userId}`);

  return { success, limit, remaining, reset };
}
