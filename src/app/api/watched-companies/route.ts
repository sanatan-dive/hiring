import { log } from '@/lib/log';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/db/prisma';

const MAX_PER_USER = 50;

function normalize(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * GET  /api/watched-companies         → { companies: WatchedCompany[] }
 * POST /api/watched-companies         body { name, careersUrl? }
 */

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { clerkId },
    include: {
      watchedCompanies: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!user) return NextResponse.json({ companies: [] });

  return NextResponse.json({ companies: user.watchedCompanies });
}

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, careersUrl } = await req.json();
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Company name required' }, { status: 400 });
    }
    if (name.length > 100) {
      return NextResponse.json({ error: 'Company name too long (max 100)' }, { status: 400 });
    }
    if (careersUrl && typeof careersUrl === 'string') {
      try {
        const u = new URL(careersUrl);
        if (!['http:', 'https:'].includes(u.protocol)) throw new Error('bad protocol');
      } catch {
        return NextResponse.json({ error: 'Invalid careers URL' }, { status: 400 });
      }
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, _count: { select: { watchedCompanies: true } } },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (user._count.watchedCompanies >= MAX_PER_USER) {
      return NextResponse.json(
        { error: `Limit reached: max ${MAX_PER_USER} watched companies` },
        { status: 429 }
      );
    }

    try {
      const watched = await prisma.watchedCompany.create({
        data: {
          userId: user.id,
          name: name.trim(),
          normalized: normalize(name),
          careersUrl: careersUrl ?? null,
        },
      });
      return NextResponse.json({ company: watched });
    } catch (err) {
      // unique constraint on (userId, normalized) — already watching
      const code = (err as { code?: string }).code;
      if (code === 'P2002') {
        return NextResponse.json(
          { error: `Already watching "${name.trim()}"` },
          { status: 409 }
        );
      }
      throw err;
    }
  } catch (err) {
    log.error('add watched company failed', err);
    return NextResponse.json({ error: 'Failed to add company' }, { status: 500 });
  }
}
