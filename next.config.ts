import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  images: {
    domains: [
      'blog.waalaxy.com',
      'i0.wp.com',
      'fontslogo.com',
      'images.unsplash.com',
      'linkedin.com',
    ],
  },
  serverExternalPackages: ['pdf-parse', '@napi-rs/canvas'],
};

// Wrap with Sentry only when DSN is set. Source-map upload is also gated on
// SENTRY_AUTH_TOKEN — without it, withSentryConfig fails the Vercel build
// trying to push source maps. We still capture errors at runtime via DSN even
// when AUTH_TOKEN is missing; we just skip uploading maps.
const hasSentryDsn = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);
const hasSentryAuth = Boolean(process.env.SENTRY_AUTH_TOKEN);

const sentryConfig = hasSentryDsn
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: true,
      widenClientFileUpload: true,
      disableLogger: true,
      tunnelRoute: '/monitoring',
      sourcemaps: hasSentryAuth ? { deleteSourcemapsAfterUpload: true } : { disable: true },
    })
  : nextConfig;

export default sentryConfig;
