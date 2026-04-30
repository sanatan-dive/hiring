import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createProCheckoutSession } from '@/services/subscription.service';
import prisma from '@/lib/db/prisma';

export async function POST() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return NextResponse.json({ error: 'User not synced' }, { status: 404 });
    }

    const clerkUser = await currentUser();
    const email = clerkUser?.primaryEmailAddress?.emailAddress ?? user.email;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const session = await createProCheckoutSession({
      userId: user.id,
      email,
      name: user.name ?? clerkUser?.fullName,
      returnUrl: `${appUrl}/matches?upgraded=1`,
    });

    // Optimistically mark the subscription as pending so the UI can show state.
    await prisma.subscription.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        plan: 'FREE',
        status: 'pending',
      },
      update: { status: 'pending' },
    });

    return NextResponse.json({
      sessionId: session.sessionId,
      checkoutUrl: session.checkoutUrl,
    });
  } catch (err) {
    console.error('[create-checkout] failed', err);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
