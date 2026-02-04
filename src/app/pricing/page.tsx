'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

// Add Razorpay script type to window
declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function PricingPage() {
  const { user, isSignedIn } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const features = {
    free: ['Weekly Email Digest', '3 Job Scrapes / Week', '1 Resume Upload', 'Basic Job Matching'],
    pro: [
      'Daily Email Digest',
      'Unlimited Job Scrapes',
      '3 Resume Uploads',
      'AI Cover Letter Generator',
      'AI Interview Prep',
      'Priority Support',
    ],
  };

  const handleSubscribe = async () => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }

    setLoading(true);
    try {
      // 1. Load Razorpay SDK
      const res = await loadRazorpay();
      if (!res) {
        toast.error('Razorpay SDK failed to load');
        return;
      }

      // 2. Create Order
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'PRO' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // 3. Open Razorpay Modal
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Use NEXT_PUBLIC for client-side
        amount: data.order.amount,
        currency: data.order.currency,
        name: "Hirin'",
        description: 'Pro Subscription (monthly)',
        image: 'https://smarthire.app/logo.png', // Replace with your logo
        order_id: data.order.id,
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          // 4. Verify Payment on Server
          const verifyRes = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          // const verifyData = await verifyRes.json();
          if (verifyRes.ok) {
            toast.success('Welcome to Pro!');
            router.push('/dashboard');
          } else {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: user.fullName || '',
          email: user.primaryEmailAddress?.emailAddress || '',
        },
        theme: {
          color: '#000000',
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">Simple, Transparent Pricing</h1>
          <p className="text-xl text-gray-600">Choose the plan that fits your job search needs.</p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
          {/* Free Plan */}
          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
            <h3 className="mb-2 text-2xl font-semibold text-gray-900">Free</h3>
            <p className="mb-6 text-gray-500">For casual job seekers</p>
            <div className="mb-8 text-5xl font-bold text-gray-900">
              $0<span className="text-lg font-normal text-gray-500">/mo</span>
            </div>
            <ul className="mb-8 space-y-4">
              {features.free.map((feature, i) => (
                <li key={i} className="flex items-center text-gray-600">
                  <Check className="mr-3 h-5 w-5 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              className="w-full rounded-lg bg-gray-100 px-6 py-3 font-semibold text-gray-900 transition-colors hover:bg-gray-200"
              disabled={true}
            >
              Current Plan
            </button>
          </div>

          {/* Pro Plan */}
          <div className="border-primary-500 relative overflow-hidden rounded-2xl border-2 bg-white p-8 shadow-xl">
            <div className="absolute top-0 right-0 rounded-bl-lg bg-black px-3 py-1 text-xs font-bold text-white">
              POPULAR
            </div>
            <h3 className="mb-2 text-2xl font-semibold text-gray-900">Pro</h3>
            <p className="mb-6 text-gray-500">For serious career movers</p>
            <div className="mb-8 text-5xl font-bold text-gray-900">
              ₹800<span className="text-lg font-normal text-gray-500">/mo</span>
            </div>
            <ul className="mb-8 space-y-4">
              {features.pro.map((feature, i) => (
                <li key={i} className="flex items-center text-gray-900">
                  <Check className="mr-3 h-5 w-5 text-black" />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="p-premium-button flex w-full items-center justify-center rounded-lg bg-black px-6 py-3 font-semibold text-white transition-colors hover:bg-gray-800"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Upgrade to Pro'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
