import Razorpay from 'razorpay';
import crypto from 'crypto';
import prisma from '@/lib/db/prisma';

// Initialize Razorpay
const razorpay =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      })
    : null;

export const PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    features: ['Weekly Digest', '3 Scrapes/Week', '1 Resume'],
  },
  PRO: {
    name: 'Pro',
    price: 800, // INR 800 (approx $9-10) for simplicity, or stick to USD if Razorpay supports international well. Let's assume INR for Razorpay standard.
    currency: 'INR',
    features: [
      'Daily Digest',
      'Unlimited Scrapes',
      '3 Resumes',
      'AI Cover Letter',
      'AI Interview Prep',
    ],
  },
};

export async function createOrder(userId: string, plan: 'PRO') {
  if (!razorpay) {
    throw new Error('Razorpay not initialized');
  }

  const options = {
    amount: PLANS[plan].price * 100, // amount in smallest currency unit (paise)
    currency: PLANS[plan].currency,
    receipt: `receipt_${userId}_${Date.now()}`,
    notes: {
      userId,
      plan,
    },
  };

  try {
    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error('Razorpay create order error:', error);
    throw error;
  }
}

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  if (!process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay secret not found');
  }

  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(orderId + '|' + paymentId)
    .digest('hex');

  return generatedSignature === signature;
}

export async function upgradeUserToPro(userId: string, razorpayPaymentId: string) {
  // Update or create subscription
  // We'll set expiry to 30 days from now for this one-time payment MVP
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  return prisma.subscription.upsert({
    where: { userId },
    update: {
      plan: 'PRO',
      status: 'active',
      razorpayId: razorpayPaymentId, // Storing last payment ID for reference or order ID
      expiresAt,
      updatedAt: new Date(),
    },
    create: {
      userId,
      plan: 'PRO',
      status: 'active',
      razorpayId: razorpayPaymentId,
      expiresAt,
    },
  });
}
