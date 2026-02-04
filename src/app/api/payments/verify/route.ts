import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { verifyPaymentSignature, upgradeUserToPro } from '@/services/subscription.service';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    const isValid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Upgrade user
    const subscription = await upgradeUserToPro(userId, razorpay_payment_id);

    return NextResponse.json({ success: true, subscription });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 });
  }
}
