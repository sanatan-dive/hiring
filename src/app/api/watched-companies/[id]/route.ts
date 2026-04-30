import { log } from '@/lib/log';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/db/prisma';

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await ctx.params;
    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const watched = await prisma.watchedCompany.findUnique({ where: { id } });
    if (!watched || watched.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.watchedCompany.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error('delete watched company failed', err);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
