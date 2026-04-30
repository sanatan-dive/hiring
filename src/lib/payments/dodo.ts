import DodoPayments from 'dodopayments';

if (!process.env.DODO_PAYMENTS_API_KEY) {
  console.warn('[dodo] DODO_PAYMENTS_API_KEY not set — payments will be disabled');
}

export const dodo = process.env.DODO_PAYMENTS_API_KEY
  ? new DodoPayments({
      bearerToken: process.env.DODO_PAYMENTS_API_KEY,
      environment: (process.env.DODO_PAYMENTS_ENV as 'test_mode' | 'live_mode') ?? 'test_mode',
    })
  : null;

export type DodoClient = NonNullable<typeof dodo>;
