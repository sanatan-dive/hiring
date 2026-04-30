import { log } from '@/lib/log';
import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import prisma from '@/lib/db/prisma';

/**
 * Resend webhook handler.
 *
 * Resend signs webhooks via Svix (same library as Clerk). Configure at
 * resend.com → Webhooks → add endpoint pointing at /api/webhooks/resend
 * and copy the signing secret into RESEND_WEBHOOK_SECRET.
 *
 * Captured events:
 *   - email.delivered    — successfully reached the recipient's MTA
 *   - email.opened       — recipient opened the email
 *   - email.clicked      — recipient clicked a link
 *   - email.bounced      — failed delivery (hard or soft)
 *   - email.complained   — marked as spam (CRITICAL — flip emailDigestEnabled)
 *
 * For complaints, we ALSO disable digest sends so we don't burn the
 * sender domain reputation with continued sends.
 */

interface ResendEvent {
  type: string;
  created_at: string;
  data: {
    email_id?: string;
    to?: string[] | string;
    from?: string;
    subject?: string;
    tags?: Array<{ name: string; value: string }>;
    [key: string]: unknown;
  };
}

const COMPLAINT_EVENTS = new Set(['email.complained']);
const TRACKED_EVENTS = new Set([
  'email.delivered',
  'email.opened',
  'email.clicked',
  'email.bounced',
  'email.complained',
]);

export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    log.error('RESEND_WEBHOOK_SECRET not set');
    return new NextResponse('Webhook not configured', { status: 500 });
  }

  const rawBody = await req.text();
  const svixId = req.headers.get('svix-id') ?? '';
  const svixTimestamp = req.headers.get('svix-timestamp') ?? '';
  const svixSignature = req.headers.get('svix-signature') ?? '';

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new NextResponse('Missing svix headers', { status: 400 });
  }

  let event: ResendEvent;
  try {
    const wh = new Webhook(secret);
    event = wh.verify(rawBody, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ResendEvent;
  } catch (err) {
    log.error('resend webhook signature verify failed', err);
    return new NextResponse('Invalid signature', { status: 400 });
  }

  if (!TRACKED_EVENTS.has(event.type)) {
    return NextResponse.json({ ok: true, ignored: event.type });
  }

  const data = event.data;
  const recipient = Array.isArray(data.to) ? data.to[0] : data.to;
  if (!recipient) {
    return NextResponse.json({ ok: true, ignored: 'no recipient' });
  }

  // Extract campaign tag if present
  const campaignTag = data.tags?.find((t) => t.name === 'campaign');
  const campaign = campaignTag?.value ?? null;

  try {
    await prisma.emailEvent.create({
      data: {
        resendId: data.email_id ?? svixId,
        userEmail: recipient,
        eventType: event.type,
        campaign,
        metadata: data as never,
      },
    });

    // On complaint, disable future digests to protect domain reputation
    if (COMPLAINT_EVENTS.has(event.type)) {
      await prisma.user.updateMany({
        where: { email: recipient },
        data: { emailDigestEnabled: false },
      });
      log.warn('disabled digest after spam complaint', { email: recipient });
    }
  } catch (err) {
    log.error('email event persist failed', err, { type: event.type, recipient });
    // Still return 200 — Resend will retry otherwise
  }

  return NextResponse.json({ ok: true });
}
