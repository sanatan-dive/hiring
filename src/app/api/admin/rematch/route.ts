import { log } from '@/lib/log';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { materializeMatches } from '@/services/matching.service';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BATCH = 25;

/**
 * Rematerialize JobMatch rows for digest-enabled users (or a single userId).
 *
 * Usage:
 *   curl -X POST "$APP_URL/api/admin/rematch" \
 *     -H "Authorization: Bearer $CRON_SECRET"
 *
 *   curl -X POST "$APP_URL/api/admin/rematch?userId=USER_CUID&limit=10" \
 *     -H "Authorization: Bearer $CRON_SECRET"
 */
export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const singleUserId = searchParams.get('userId');
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10) || 10));
  const maxUsers = Math.min(
    BATCH,
    Math.max(1, parseInt(searchParams.get('maxUsers') || String(BATCH), 10) || BATCH)
  );

  try {
    const users = singleUserId
      ? await prisma.user.findMany({
          where: { id: singleUserId },
          select: { id: true, email: true },
          take: 1,
        })
      : await prisma.user.findMany({
          where: { emailDigestEnabled: true },
          select: { id: true, email: true },
          take: maxUsers,
          orderBy: { createdAt: 'asc' },
        });

    const results: Array<{
      userId: string;
      upserted: number;
      embeddingSource: string;
      skippedHidden: number;
      error?: string;
    }> = [];

    for (const user of users) {
      try {
        const result = await materializeMatches(user.id, { limit });
        results.push({
          userId: user.id,
          upserted: result.upserted,
          embeddingSource: result.embeddingSource,
          skippedHidden: result.skippedHidden,
        });
      } catch (err) {
        log.error('admin rematch failed for user', err, { userId: user.id });
        results.push({
          userId: user.id,
          upserted: 0,
          embeddingSource: 'none',
          skippedHidden: 0,
          error: err instanceof Error ? err.message : 'unknown error',
        });
      }
    }

    return NextResponse.json({
      ok: true,
      usersProcessed: users.length,
      totalUpserted: results.reduce((sum, r) => sum + r.upserted, 0),
      results,
    });
  } catch (error) {
    log.error('admin rematch error', error);
    return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
