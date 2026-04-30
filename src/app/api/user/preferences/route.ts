import { log } from '@/lib/log';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/db/prisma';

/**
 * GET  /api/user/preferences         → { timezone, slackWebhookUrl, emailDigestEnabled }
 * POST /api/user/preferences         body { timezone?, slackWebhookUrl?, emailDigestEnabled? }
 *
 * Validates: timezone must be a valid IANA tz; slackWebhookUrl must be a
 * https://hooks.slack.com/... URL.
 */

function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { timezone: true, slackWebhookUrl: true, emailDigestEnabled: true },
  });
  return NextResponse.json(user ?? { timezone: 'UTC', slackWebhookUrl: null, emailDigestEnabled: true });
}

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await req.json()) as {
      timezone?: string;
      slackWebhookUrl?: string | null;
      emailDigestEnabled?: boolean;
    };

    const data: Record<string, unknown> = {};

    if (typeof body.timezone === 'string') {
      if (!isValidTimezone(body.timezone)) {
        return NextResponse.json({ error: 'Invalid IANA timezone' }, { status: 400 });
      }
      data.timezone = body.timezone;
    }

    if ('slackWebhookUrl' in body) {
      const url = body.slackWebhookUrl;
      if (url === null || url === '') {
        data.slackWebhookUrl = null;
      } else if (typeof url === 'string') {
        if (!url.startsWith('https://hooks.slack.com/')) {
          return NextResponse.json({ error: 'Slack webhook URL must start with https://hooks.slack.com/' }, { status: 400 });
        }
        data.slackWebhookUrl = url;
      }
    }

    if (typeof body.emailDigestEnabled === 'boolean') {
      data.emailDigestEnabled = body.emailDigestEnabled;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { clerkId },
      data,
      select: { timezone: true, slackWebhookUrl: true, emailDigestEnabled: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    log.error('preferences update failed', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
