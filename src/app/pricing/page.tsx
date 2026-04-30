'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Check, X, Loader2, Sparkles, Zap, Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import GlowButton from '@/components/ui/glow-button';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/mo',
    tagline: 'For casual job seekers',
    icon: Zap,
    featured: false,
    features: [
      { name: 'Weekly email digest', included: true },
      { name: 'Light scraper (3x/week)', included: true },
      { name: '1 resume upload', included: true },
      { name: 'Basic job matching', included: true },
      { name: 'Application tracker (5 jobs)', included: true },
      { name: '7-day match history', included: true },
      { name: 'Deep scraper', included: false },
      { name: 'AI Cover Letter', included: false },
      { name: 'AI Interview Prep', included: false },
      { name: 'Priority support', included: false },
    ],
  },
  {
    name: 'Pro',
    price: '$9',
    period: '/mo',
    tagline: 'For serious career movers',
    icon: Crown,
    featured: true,
    features: [
      { name: 'Daily email digest', included: true },
      { name: 'Unlimited light scrapes', included: true },
      { name: '3 resume uploads', included: true },
      { name: 'AI-powered job matching', included: true },
      { name: 'Unlimited application tracker', included: true },
      { name: 'Lifetime match history', included: true },
      { name: 'Deep scraper (2x/month)', included: true },
      { name: 'AI Cover Letter Generator', included: true },
      { name: 'AI Interview Prep', included: true },
      { name: 'Priority support', included: true },
    ],
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: 'easeOut' as const },
  },
};

export default function PricingPage() {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok || !data.checkoutUrl) {
        throw new Error(data.error || 'Failed to create checkout');
      }

      // Hand off to Dodo's hosted checkout. After payment, Dodo redirects
      // back to NEXT_PUBLIC_APP_URL/matches?upgraded=1 (set in the API route).
      window.location.href = data.checkoutUrl;
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to initiate payment');
      setLoading(false);
    }
    // Note: don't unset loading on success — we're navigating away
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      {/* Background glow effects */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 20%, rgba(18, 111, 255, 0.08), transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(18, 111, 255, 0.06), transparent 50%)
          `,
        }}
      />
      <div
        className="pointer-events-none absolute top-0 right-0 h-[500px] w-[500px] rounded-full opacity-20 blur-[100px]"
        style={{ background: 'radial-gradient(circle, rgba(18, 111, 255, 0.4), transparent 70%)' }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <motion.div
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-4 py-1.5"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Sparkles className="h-4 w-4 text-sky-600" />
            <span className="font-poppins text-sm font-medium text-sky-700">Simple Pricing</span>
          </motion.div>

          <h1 className="font-poppins mb-4 text-4xl font-bold text-black sm:text-5xl lg:text-6xl">
            Choose Your{' '}
            <span className="bg-gradient-to-r from-sky-600 to-sky-400 bg-clip-text text-transparent">
              Plan
            </span>
          </h1>
          <p className="font-poppins mx-auto max-w-2xl text-lg text-gray-500">
            Start free, upgrade when you&apos;re ready. No hidden fees, cancel anytime.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={itemVariants}
              whileHover={{ y: -6, transition: { duration: 0.3 } }}
              className={`relative rounded-2xl p-8 transition-shadow duration-300 ${
                plan.featured
                  ? 'border-2 border-sky-500 bg-white shadow-xl shadow-sky-500/10'
                  : 'border border-gray-100 bg-white shadow-sm hover:shadow-md'
              }`}
            >
              {/* Popular badge */}
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <motion.div
                    className="rounded-full bg-gradient-to-r from-sky-600 to-sky-500 px-4 py-1 text-xs font-bold tracking-wider text-white shadow-lg shadow-sky-500/30"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                  >
                    MOST POPULAR
                  </motion.div>
                </div>
              )}

              {/* Plan header */}
              <div className="mb-6">
                <div className="mb-3 flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      plan.featured ? 'bg-sky-100' : 'bg-gray-100'
                    }`}
                  >
                    <plan.icon
                      className={`h-5 w-5 ${plan.featured ? 'text-sky-600' : 'text-gray-600'}`}
                    />
                  </div>
                  <h3 className="font-poppins text-2xl font-bold text-black">{plan.name}</h3>
                </div>
                <p className="font-poppins text-sm text-gray-500">{plan.tagline}</p>
              </div>

              {/* Price */}
              <div className="mb-8">
                <span className="font-poppins text-5xl font-bold text-black">{plan.price}</span>
                <span className="font-poppins text-lg text-gray-400">{plan.period}</span>
              </div>

              {/* Features */}
              <ul className="mb-8 space-y-3">
                {plan.features.map((feature, i) => (
                  <motion.li
                    key={i}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.05, duration: 0.3 }}
                  >
                    {feature.included ? (
                      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-sky-100">
                        <Check className="h-3 w-3 text-sky-600" />
                      </div>
                    ) : (
                      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
                        <X className="h-3 w-3 text-gray-400" />
                      </div>
                    )}
                    <span
                      className={`font-poppins text-sm ${
                        feature.included ? 'text-gray-800' : 'text-gray-400'
                      }`}
                    >
                      {feature.name}
                    </span>
                  </motion.li>
                ))}
              </ul>

              {/* CTA */}
              {plan.featured ? (
                <GlowButton
                  variant="blue"
                  onClick={handleSubscribe}
                  className="font-poppins w-full justify-center py-3.5 text-center"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Upgrade to Pro'}
                </GlowButton>
              ) : (
                <button
                  className="font-poppins w-full rounded-xl border border-gray-200 bg-gray-50 px-6 py-3.5 text-sm font-semibold text-gray-700 transition-all duration-300 hover:bg-gray-100"
                  disabled
                >
                  Current Plan
                </button>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <p className="font-poppins text-sm text-gray-500">
            🔒 Payments secured by Dodo Payments • Cancel anytime • No questions asked
          </p>
        </motion.div>
      </div>
    </div>
  );
}
