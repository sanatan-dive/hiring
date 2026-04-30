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

// Only wrap with Sentry when DSN is available
const sentryConfig = process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: true,
      widenClientFileUpload: true,
      disableLogger: true,
      tunnelRoute: '/monitoring',
      sourcemaps: {
        deleteSourcemapsAfterUpload: true,
      },
    })
  : nextConfig;

export default sentryConfig;
