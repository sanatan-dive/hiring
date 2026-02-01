import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// GET - Retrieve user's job preferences
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { jobPreferences: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const prefs = user.jobPreferences;

    if (!prefs) {
      return NextResponse.json({ preferences: null });
    }

    return NextResponse.json({
      preferences: {
        desiredRoles: prefs.desiredRoles,
        experienceLevel: prefs.experienceLevel,
        workLocation: prefs.workLocation,
        locations: prefs.locations,
        salaryRange: {
          min: prefs.salaryMin || 70000,
          max: prefs.salaryMax || 120000,
          currency: prefs.salaryCurrency || 'USD',
        },
        jobType: prefs.jobType,
      },
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Save/update job preferences
export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { desiredRoles, experienceLevel, workLocation, locations, salaryRange, jobType } = body;

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: '',
        },
      });
    }

    // Upsert preferences
    const preferences = await prisma.jobPreferences.upsert({
      where: { userId: user.id },
      update: {
        desiredRoles: desiredRoles || [],
        experienceLevel,
        workLocation,
        locations: locations || [],
        salaryMin: salaryRange?.min,
        salaryMax: salaryRange?.max,
        salaryCurrency: salaryRange?.currency,
        jobType,
      },
      create: {
        userId: user.id,
        desiredRoles: desiredRoles || [],
        experienceLevel,
        workLocation,
        locations: locations || [],
        salaryMin: salaryRange?.min,
        salaryMax: salaryRange?.max,
        salaryCurrency: salaryRange?.currency,
        jobType,
      },
    });

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error('Error saving preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
