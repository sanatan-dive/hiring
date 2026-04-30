import { log } from '@/lib/log';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { generateEmbedding } from '@/lib/ai/google';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BATCH = 25;

/**
 * Backfill embeddings for jobs whose embedding is NULL.
 *
 * Usage:
 *   curl -X POST "$APP_URL/api/admin/reembed?limit=100" \
 *     -H "Authorization: Bearer $CRON_SECRET"
 *
 * Hit this repeatedly until `processed=0`.
 */
export async function POST(req: Request) {
  const auth = req.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(BATCH, parseInt(searchParams.get('limit') || String(BATCH)));

  // Use raw query because Prisma treats vector as Unsupported and can't filter on it
  const rows = await prisma.$queryRaw<Array<{ id: string; title: string; company: string; description: string | null; location: string | null }>>`
    SELECT id, title, company, description, location
    FROM jobs
    WHERE embedding IS NULL
    LIMIT ${limit}
  `;

  if (rows.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, message: 'all jobs embedded' });
  }

  let succeeded = 0;
  let failed = 0;

  for (const job of rows) {
    const text =
      `${job.title} ${job.company} ${job.location ?? ''} ${job.description ?? ''}`.substring(
        0,
        8000
      );
    const vector = await generateEmbedding(text);
    if (!vector) {
      failed++;
      continue;
    }
    try {
      const vectorString = `[${vector.join(',')}]`;
      await prisma.$executeRaw`
        UPDATE jobs SET embedding = ${vectorString}::vector WHERE id = ${job.id}
      `;
      succeeded++;
    } catch (err) {
      log.error('reembed write failed', err, { jobId: job.id });
      failed++;
    }
  }

  // Count remaining
  const remainingRows = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count FROM jobs WHERE embedding IS NULL
  `;
  const remaining = Number(remainingRows[0]?.count ?? 0);

  return NextResponse.json({
    ok: true,
    processed: rows.length,
    succeeded,
    failed,
    remaining,
  });
}
