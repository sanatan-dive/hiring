// Stub env vars so service modules can import without real keys
process.env.DATABASE_URL ||= 'postgresql://test:test@localhost:5432/test';
process.env.DODO_PAYMENTS_API_KEY ||= 'sk_test_placeholder';
process.env.DODO_PRO_PRODUCT_ID ||= 'prod_placeholder';
process.env.NEXT_PUBLIC_APP_URL ||= 'http://localhost:3000';
