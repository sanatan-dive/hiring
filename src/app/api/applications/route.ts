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

// POST: Create or Update Application (Upsert)
export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { jobId, status = 'applied' } = await req.json();

    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: { subscription: true },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Check if application already exists
    const existingApp = await prisma.application.findUnique({
      where: {
        userId_jobId: {
          userId: user.id,
          jobId,
        },
      },
    });

    // Enforce limits for creating NEW applications
    if (!existingApp) {
      const isPro = user.subscription?.plan === 'PRO' && user.subscription.status === 'active';
      if (!isPro) {
        const appCount = await prisma.application.count({
          where: { userId: user.id },
        });

        if (appCount >= 5) {
          return NextResponse.json(
            { error: 'Application limit reached. Upgrade to Pro for unlimited tracking.' },
            { status: 403 }
          );
        }
      }
    }

    // Upsert Application
    const application = await prisma.application.upsert({
      where: {
        userId_jobId: {
          userId: user.id,
          jobId,
        },
      },
      update: {
        status,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        jobId,
        status,
      },
    });

    // Also update JobMatch status if exists (to keep them in sync if you use that field)
    /*
    await prisma.jobMatch.updateMany({
      where: { userId: user.id, jobId },
      data: { status },
    });
    */

    return NextResponse.json({ application });
  } catch (error) {
    console.error('Error creating/updating application:', error);
    return NextResponse.json({ error: 'Failed to save application' }, { status: 500 });
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
