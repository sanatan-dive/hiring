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

type Data = Record<string, unknown> | undefined;

export const log = {
  info(msg: string, data?: Data) {
    if (isDev) {
      console.log(`[info] ${msg}`, data ?? '');
      return;
    }
    Sentry.addBreadcrumb({ category: 'app', level: 'info', message: msg, data });
  },

  warn(msg: string, data?: Data) {
    if (isDev) {
      console.warn(`[warn] ${msg}`, data ?? '');
      return;
    }
    Sentry.addBreadcrumb({ category: 'app', level: 'warning', message: msg, data });
  },

  error(msg: string, err: unknown, data?: Data) {
    if (isDev) {
      console.error(`[error] ${msg}`, err, data ?? '');
      return;
    }
    Sentry.captureException(err, {
      tags: { msg: msg.slice(0, 100) },
      extra: data,
    });
  },
};
