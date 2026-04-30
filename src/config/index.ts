// Environment-based configuration
export const config = {
  // App
  appName: "Hirin'",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

  // Database
  databaseUrl: process.env.DATABASE_URL,

  // Clerk Auth
  clerk: {
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
    webhookSecret: process.env.CLERK_WEBHOOK_SECRET,
  },

  // Google AI
  google: {
    apiKey: process.env.GOOGLE_API_KEY,
  },

  // Dodo Payments
  dodo: {
    apiKey: process.env.DODO_PAYMENTS_API_KEY,
    webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY,
    environment: (process.env.DODO_PAYMENTS_ENV ?? 'test_mode') as 'test_mode' | 'live_mode',
    proProductId: process.env.DODO_PRO_PRODUCT_ID,
  },

  // Email (future)
  email: {
    resendApiKey: process.env.RESEND_API_KEY,
    fromEmail: process.env.EMAIL_FROM || 'noreply@hirin.dev',
  },

  // Job APIs (future)
  jobApis: {
    adzunaAppId: process.env.ADZUNA_APP_ID,
    adzunaApiKey: process.env.ADZUNA_API_KEY,
    jsearchApiKey: process.env.JSEARCH_API_KEY,
  },

  // Feature flags
  features: {
    enableDeepScraper: process.env.ENABLE_DEEP_SCRAPER === 'true',
    enableEmailDigest: process.env.ENABLE_EMAIL_DIGEST === 'true',
    enablePayments: process.env.ENABLE_PAYMENTS === 'true',
  },
} as const;

export default config;
