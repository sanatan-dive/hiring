import * as Sentry from '@sentry/nextjs';

/**
 * Structured logger.
 *
 * In dev: writes to console for fast iteration.
 * In prod: emits Sentry breadcrumbs (info/warn) and captures exceptions (error).
 *
 * Usage:
 *   log.info('Resume parsed', { userId, skills: 12 });
 *   log.warn('Rate limit hit', { userId, plan });
 *   log.error('Failed to parse resume', err, { userId, fileName });
 */
const isDev = process.env.NODE_ENV !== 'production';

function toBreadcrumbData(extras: unknown[]): Record<string, unknown> | undefined {
  if (extras.length === 0) return undefined;
  if (extras.length === 1 && extras[0] && typeof extras[0] === 'object') {
    return extras[0] as Record<string, unknown>;
  }
  return { args: extras };
}

export const log = {
  info(msg: string, ...extras: unknown[]) {
    if (isDev) {
      console.log(`[info] ${msg}`, ...extras);
      return;
    }
    Sentry.addBreadcrumb({
      category: 'app',
      level: 'info',
      message: msg,
      data: toBreadcrumbData(extras),
    });
  },

  warn(msg: string, ...extras: unknown[]) {
    if (isDev) {
      console.warn(`[warn] ${msg}`, ...extras);
      return;
    }
    Sentry.addBreadcrumb({
      category: 'app',
      level: 'warning',
      message: msg,
      data: toBreadcrumbData(extras),
    });
  },

  error(msg: string, err?: unknown, ...extras: unknown[]) {
    if (isDev) {
      console.error(`[error] ${msg}`, err, ...extras);
      return;
    }
    Sentry.captureException(err ?? new Error(msg), {
      tags: { msg: msg.slice(0, 100) },
      extra: toBreadcrumbData(extras),
    });
  },
};
