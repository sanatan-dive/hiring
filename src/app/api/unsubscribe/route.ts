import { log } from '@/lib/log';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

/**
 * Unsubscribe endpoint — handles BOTH:
 *   GET /api/unsubscribe?token=...    (link in email body, redirects to UX page)
 *   POST /api/unsubscribe              (Gmail one-click via List-Unsubscribe-Post)
 *
 * The POST flow doesn't have a UX response — we just return 200 once the flag
 * is flipped. Gmail expects this within ~10s; we keep it minimal.
 */

async function unsubscribeByToken(token: string): Promise<boolean> {
  if (!token || typeof token !== 'string') return false;
  try {
    const result = await prisma.user.updateMany({
      where: { unsubscribeToken: token },
      data: { emailDigestEnabled: false },
    });
    return result.count > 0;
  } catch (err) {
    log.error('unsubscribe failed', err);
    return false;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token') ?? '';
  const ok = await unsubscribeByToken(token);

  // Always redirect to the UX page so the user gets feedback whether the
  // token was valid or not. The UX page reads the result from a query param.
  const url = new URL('/unsubscribe', req.url);
  url.searchParams.set('result', ok ? 'ok' : 'invalid');
  return NextResponse.redirect(url, 303);
}

export async function POST(req: Request) {
  let token: string | null = null;

  // Gmail one-click sends `List-Unsubscribe=One-Click` as form-urlencoded; the
  // token comes from our List-Unsubscribe header URL params.
  const url = new URL(req.url);
  token = url.searchParams.get('token');

  if (!token) {
    // Some clients send the token in the body
    try {
      const body = await req.json();
      token = body?.token ?? null;
    } catch {
      // also try formdata
      try {
        const fd = await req.formData();
        token = (fd.get('token') as string) ?? null;
      } catch {
        // give up
      }
    }
  }

  const ok = token ? await unsubscribeByToken(token) : false;
  return NextResponse.json({ ok });
}
