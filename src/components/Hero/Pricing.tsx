'use client';

import { Check, X, Sparkles, Zap, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import GlowButton from '@/components/ui/glow-button';
import { useRouter } from 'next/navigation';

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

export default function PricingSection() {
  const router = useRouter();

  return (
    <section className="relative overflow-hidden bg-white py-20">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(18, 111, 255, 0.06), transparent 50%),
            radial-gradient(circle at 80% 50%, rgba(18, 111, 255, 0.06), transparent 50%)
          `,
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-14 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span className="font-poppins text-sm font-medium text-blue-700">Simple Pricing</span>
          </div>

          <h2 className="font-poppins mb-4 text-4xl font-bold text-black sm:text-5xl">
            Choose Your{' '}
            <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              Plan
            </span>
          </h2>
          <p className="font-poppins mx-auto max-w-2xl text-lg text-gray-500">
            Start free, upgrade when you&apos;re ready. No hidden fees, cancel anytime.
          </p>
        </motion.div>

        {/* Cards */}
        <motion.div
          className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={itemVariants}
              whileHover={{ y: -6, transition: { duration: 0.3 } }}
              className={`relative rounded-2xl p-8 transition-shadow duration-300 ${
                plan.featured
                  ? 'border-2 border-blue-500 bg-white shadow-xl shadow-blue-500/10'
                  : 'border border-gray-100 bg-white shadow-sm hover:shadow-md'
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="rounded-full bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-1 text-xs font-bold tracking-wider text-white shadow-lg shadow-blue-500/30">
                    MOST POPULAR
                  </div>
                </div>
              )}

              <div className="mb-6">
                <div className="mb-3 flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      plan.featured ? 'bg-blue-100' : 'bg-gray-100'
                    }`}
                  >
                    <plan.icon
                      className={`h-5 w-5 ${plan.featured ? 'text-blue-600' : 'text-gray-600'}`}
                    />
                  </div>
                  <h3 className="font-poppins text-2xl font-bold text-black">{plan.name}</h3>
                </div>
                <p className="font-poppins text-sm text-gray-500">{plan.tagline}</p>
              </div>

              <div className="mb-8">
                <span className="font-poppins text-5xl font-bold text-black">{plan.price}</span>
                <span className="font-poppins text-lg text-gray-400">{plan.period}</span>
              </div>

              <ul className="mb-8 space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    {feature.included ? (
                      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                        <Check className="h-3 w-3 text-blue-600" />
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
                  </li>
                ))}
              </ul>

              {plan.featured ? (
                <GlowButton
                  variant="blue"
                  onClick={() => router.push('/pricing')}
                  className="font-poppins w-full justify-center py-3.5 text-center"
                >
                  Upgrade to Pro
                </GlowButton>
              ) : (
                <button
                  className="font-poppins w-full rounded-xl border border-gray-200 bg-gray-50 px-6 py-3.5 text-sm font-semibold text-gray-700 transition-all duration-300 hover:bg-gray-100"
                  onClick={() => router.push('/sign-up')}
                >
                  Get Started Free
                </button>
              )}
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          viewport={{ once: true }}
        >
          <p className="font-poppins text-sm text-gray-500">
            🔒 Payments secured by Dodo Payments · Cancel anytime · No questions asked
          </p>
        </motion.div>
      </div>
    </section>
  );
}
