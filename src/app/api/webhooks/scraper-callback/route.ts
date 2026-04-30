import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';
import prisma from '@/lib/db/prisma';
import { log } from '@/lib/log';

/**
 * Railway scraper callback webhook.
 *
 * The scraper service POSTs scraped jobs back here. Body is HMAC-SHA256
 * signed with SCRAPER_CALLBACK_SECRET; signature in `x-scraper-signature`.
 *
 * On success with a `result`, upserts a Job row keyed by the unique `url`.
 * Embedding generation is intentionally skipped — handled elsewhere.
 */

type ScraperResult = {
  title: string;
  company: string;
  location: string;
  url: string;
  description?: string;
  salary?: string;
  source: string;
};

type ScraperCallbackBody = {
  jobRequestId: string;
  userId: string;
  url: string;
  result: ScraperResult | null;
  error?: string;
  durationMs: number;
};

function isString(v: unknown): v is string {
  return typeof v === 'string';
}

function isOptionalString(v: unknown): v is string | undefined {
  return v === undefined || typeof v === 'string';
}

function isNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function validateResult(r: unknown): r is ScraperResult {
  if (!r || typeof r !== 'object') return false;
  const o = r as Record<string, unknown>;
  return (
    isString(o.title) &&
    isString(o.company) &&
    isString(o.location) &&
    isString(o.url) &&
    isString(o.source) &&
    isOptionalString(o.description) &&
    isOptionalString(o.salary)
  );
}

function validateBody(b: unknown): b is ScraperCallbackBody {
  if (!b || typeof b !== 'object') return false;
  const o = b as Record<string, unknown>;
  if (!isString(o.jobRequestId)) return false;
  if (!isString(o.userId)) return false;
  if (!isString(o.url)) return false;
  if (!isNumber(o.durationMs)) return false;
  if (!isOptionalString(o.error)) return false;
  if (o.result !== null && !validateResult(o.result)) return false;
  return true;
}

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  try {
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    const a = Buffer.from(expected, 'hex');
    // Accept signatures with or without "sha256=" prefix
    const provided = signature.startsWith('sha256=') ? signature.slice(7) : signature;
    const b = Buffer.from(provided, 'hex');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.SCRAPER_CALLBACK_SECRET;
  if (!secret) {
    log.error('[scraper-callback] SCRAPER_CALLBACK_SECRET not set');
    return NextResponse.json({ ok: false, error: 'webhook not configured' }, { status: 500 });
  }

  const signature = req.headers.get('x-scraper-signature');
  if (!signature) {
    return NextResponse.json({ ok: false, error: 'missing signature' }, { status: 401 });
  }

  const rawBody = await req.text();
  if (!verifySignature(rawBody, signature, secret)) {
    log.warn('[scraper-callback] invalid signature');
    return NextResponse.json({ ok: false, error: 'invalid signature' }, { status: 401 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 });
  }

  if (!validateBody(parsed)) {
    return NextResponse.json({ ok: false, error: 'invalid body shape' }, { status: 400 });
  }

  const body = parsed;

  // Scraper reported a failure — log and ack so it doesn't retry.
  if (!body.result) {
    log.warn('[scraper-callback] scrape failed', {
      jobRequestId: body.jobRequestId,
      userId: body.userId,
      url: body.url,
      error: body.error,
      durationMs: body.durationMs,
    });
    return NextResponse.json({ ok: true, jobId: null });
  }

  const r = body.result;
  if (!r.url) {
    return NextResponse.json({ ok: false, error: 'missing result.url' }, { status: 400 });
  }

  try {
    const job = await prisma.job.upsert({
      where: { url: r.url },
      create: {
        title: r.title,
        company: r.company,
        location: r.location,
        url: r.url,
        description: r.description,
        salary: r.salary,
        source: r.source,
      },
      update: {
        title: r.title,
        company: r.company,
        location: r.location,
        description: r.description,
        salary: r.salary,
        source: r.source,
      },
    });

    log.info('[scraper-callback] job upserted', {
      jobRequestId: body.jobRequestId,
      userId: body.userId,
      jobId: job.id,
      durationMs: body.durationMs,
    });

    return NextResponse.json({ ok: true, jobId: job.id });
  } catch (err) {
    log.error('[scraper-callback] upsert failed', err, {
      jobRequestId: body.jobRequestId,
      url: r.url,
    });
    return NextResponse.json({ ok: false, error: 'database error' }, { status: 500 });
  }
}
