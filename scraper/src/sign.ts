import { createHmac, timingSafeEqual } from 'node:crypto';

export function signCallback(body: string, secret: string): string {
  if (!secret) return '';
  return createHmac('sha256', secret).update(body).digest('hex');
}

export function verifyCallback(body: string, signature: string, secret: string): boolean {
  if (!signature || !secret) return false;
  const expected = signCallback(body, secret);
  if (expected.length !== signature.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
  } catch {
    return false;
  }
}
