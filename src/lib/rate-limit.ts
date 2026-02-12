import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client
// We assume UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set in .env
const redis = Redis.fromEnv();

// Create a new ratelimiter, that allows 10 requests per 10 seconds
export const rateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
  prefix: '@upstash/ratelimit',
});

// Helper to check limit
export async function checkRateLimit(identifier: string) {
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    console.warn('UPSTASH_REDIS_REST_URL not set, skipping rate limit check.');
    return { success: true, limit: 10, remaining: 10, reset: 0 };
  }
  return await rateLimit.limit(identifier);
}
