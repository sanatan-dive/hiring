import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// GET - Get user's social links
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { socialLinks: true },
    });

    if (!user) {
      return NextResponse.json({ socialLinks: [] });
    }

    return NextResponse.json({
      socialLinks: user.socialLinks.map((link) => ({
        platform: link.platform,
        url: link.url,
      })),
    });
  } catch (error) {
    console.error('Error fetching social links:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Save/update social links
export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { socialLinks } = body; // Array of { platform, url }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete existing social links
    await prisma.socialLink.deleteMany({
      where: { userId: user.id },
    });

    // Create new social links
    if (socialLinks && Array.isArray(socialLinks)) {
      const validLinks = socialLinks.filter(
        (link: { platform: string; url: string }) => link.platform && link.url
      );

      if (validLinks.length > 0) {
        await prisma.socialLink.createMany({
          data: validLinks.map((link: { platform: string; url: string }) => ({
            userId: user.id,
            platform: link.platform,
            url: link.url,
          })),
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving social links:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
