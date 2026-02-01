import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/db/prisma';

// GET: Fetch user applications
export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const applications = await prisma.application.findMany({
      where: { userId: user.id },
      include: { job: true },
      orderBy: { appliedAt: 'desc' },
    });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

// POST: Create application (when user clicks Apply)
export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { jobId, status = 'applied' } = await req.json();

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const application = await prisma.application.create({
      data: {
        userId: user.id,
        jobId,
        status,
      },
    });

    // Also update JobMatch status if exists
    await prisma.jobMatch.updateMany({
      where: { userId: user.id, jobId },
      data: { status: 'applied' },
    });

    return NextResponse.json({ application });
  } catch (error) {
    if ((error as { code?: string }).code === 'P2002')
      return NextResponse.json({ error: 'Already applied' }, { status: 409 });
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
  }
}

// PATCH: Update status
export async function PATCH(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { applicationId, status } = await req.json();

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const application = await prisma.application.update({
      where: { id: applicationId },
      data: { status },
    });

    return NextResponse.json({ application });
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }
}
