import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// GET - Get user's projects
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { projects: { orderBy: { createdAt: 'desc' } } },
    });

    if (!user) {
      return NextResponse.json({ projects: [] });
    }

    return NextResponse.json({
      projects: user.projects.map((project) => ({
        id: project.id,
        name: project.name,
        description: project.description,
        url: project.url,
        techUsed: project.techUsed,
      })),
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Save/update projects
export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { projects } = body; // Array of { name, description, url, techUsed }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete existing projects
    await prisma.project.deleteMany({
      where: { userId: user.id },
    });

    // Create new projects
    if (projects && Array.isArray(projects)) {
      const validProjects = projects.filter((p: { name: string }) => p.name);

      if (validProjects.length > 0) {
        await prisma.project.createMany({
          data: validProjects.map(
            (p: { name: string; description?: string; url?: string; techUsed?: string[] }) => ({
              userId: user.id,
              name: p.name,
              description: p.description || null,
              url: p.url || null,
              techUsed: p.techUsed || [],
            })
          ),
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
