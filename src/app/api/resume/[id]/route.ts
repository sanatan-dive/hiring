import { log } from '@/lib/log';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/db/prisma';

/**
 * DELETE /api/resume/:id
 * Deletes a single resume (and cascades parsedSkills + parsedExperiences).
 * User-scoped — can only delete their own.
 */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await ctx.params;

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const resume = await prisma.resume.findUnique({ where: { id } });
    if (!resume || resume.userId !== user.id) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    await prisma.resume.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error('delete resume failed', err);
    return NextResponse.json({ error: 'Failed to delete resume' }, { status: 500 });
  }
}
