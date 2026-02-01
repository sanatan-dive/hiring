import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// GET - Get user's skills
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { skills: true },
    });

    if (!user) {
      return NextResponse.json({ skills: [] });
    }

    return NextResponse.json({ skills: user.skills });
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Update user's skills
export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { skills } = body;

    await prisma.user.update({
      where: { clerkId: userId },
      data: { skills: skills || [] },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving skills:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
