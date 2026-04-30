import { log } from '@/lib/log';
import { auth, currentUser } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { attributeReferral } from '@/services/referral.service';

const REF_COOKIE = 'hirin_ref';

// POST - Sync current user to database (for localhost testing without webhook)
// Also handles referral attribution on first sync if a ?ref= cookie exists.
export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json({ error: 'User not found in Clerk' }, { status: 404 });
    }

    // Upsert user in database
    const user = await prisma.user.upsert({
      where: { clerkId: userId },
      update: {
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null,
        imageUrl: clerkUser.imageUrl,
      },
      create: {
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null,
        imageUrl: clerkUser.imageUrl,
      },
    });

    // Attribute referral if cookie is present and not already attributed
    const cookieStore = await cookies();
    const refCookie = cookieStore.get(REF_COOKIE);
    if (refCookie?.value && !user.referredByUserId) {
      await attributeReferral({
        refereeUserId: user.id,
        refereeEmail: user.email,
        referralCode: refCookie.value,
      });
      // Clear the cookie so we don't re-attribute on every sync
      cookieStore.delete(REF_COOKIE);
    }

    return NextResponse.json({ user });
  } catch (error) {
    log.error('Error syncing user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
