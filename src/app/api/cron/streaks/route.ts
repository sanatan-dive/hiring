import { log } from '@/lib/log';
import { NextResponse } from 'next/server';
import { resetExpiredStreaks } from '@/services/streak.service';

export const dynamic = 'force-dynamic';

function isAuthorizedCron(req: Request): boolean {
  if (req.headers.get('x-vercel-cron') === '1') return true;
  const authHeader = req.headers.get('authorization');
  return Boolean(
    process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`
  );
}

export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    const reset = await resetExpiredStreaks();
    log.info('streak reset cron complete', { reset });
    return NextResponse.json({ ok: true, reset });
  } catch (err) {
    log.error('streak cron failed', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
