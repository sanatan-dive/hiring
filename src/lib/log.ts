// Structured logger. Uses console in dev, swallows breadcrumbs in prod
// (point this at Sentry / Datadog / etc. once that infra lands).
const isDev = process.env.NODE_ENV !== 'production';

type Data = Record<string, unknown> | undefined;

export const log = {
  info: (msg: string, data?: Data) => {
    if (isDev) console.log('[info]', msg, data ?? '');
  },
  warn: (msg: string, data?: Data) => {
    if (isDev) console.warn('[warn]', msg, data ?? '');
  },
  error: (msg: string, err: unknown, data?: Data) => {
    if (isDev) console.error('[error]', msg, err, data ?? '');
    // In prod, wire up Sentry.captureException(err, { tags: { msg }, extra: data })
    // when @sentry/nextjs is configured.
  },
};
