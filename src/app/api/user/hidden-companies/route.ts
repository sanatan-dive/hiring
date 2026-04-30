import { log } from '@/lib/log';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/db/prisma';

/**
 * GET    /api/user/hidden-companies         → { companies: string[] }
 * POST   /api/user/hidden-companies         → body { company } adds to list
 * DELETE /api/user/hidden-companies?company → removes from list
 */
export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { hiddenCompanies: true },
  });
  return NextResponse.json({ companies: user?.hiddenCompanies ?? [] });
}

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { company } = await req.json();
    if (!company || typeof company !== 'string') {
      return NextResponse.json({ error: 'company is required' }, { status: 400 });
    }
    const trimmed = company.trim();

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, hiddenCompanies: true },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (user.hiddenCompanies.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      return NextResponse.json({ ok: true, alreadyHidden: true });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { hiddenCompanies: { push: trimmed } },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error('hide company failed', err);
    return NextResponse.json({ error: 'Failed to hide company' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const company = searchParams.get('company');
    if (!company) {
      return NextResponse.json({ error: 'company param required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, hiddenCompanies: true },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        hiddenCompanies: user.hiddenCompanies.filter(
          (c) => c.toLowerCase() !== company.toLowerCase()
        ),
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error('unhide company failed', err);
    return NextResponse.json({ error: 'Failed to unhide company' }, { status: 500 });
  }
}
