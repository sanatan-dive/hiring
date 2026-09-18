import { Resend } from 'resend';

let client: Resend | null = null;

/**
 * Lazy Resend client — constructed only when sending.
 * Avoids `new Resend(undefined)` at module import time, which breaks
 * Next.js "Collecting page data" for cron routes when RESEND_API_KEY is unset.
 */
export function getResend(): Resend {
  if (!client) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error('RESEND_API_KEY is not set');
    }
    client = new Resend(key);
  }
  return client;
}
