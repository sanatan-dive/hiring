import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createOrder } from '@/services/subscription.service';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan } = await req.json();

    if (plan !== 'PRO') {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const order = await createOrder(userId, 'PRO');
    return NextResponse.json({ order });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
