'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Check, Minus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { track } from '@/lib/analytics';

interface PlanFeature {
  name: string;
  included: boolean;
}

type Currency = 'USD' | 'INR';
type Period = 'monthly' | 'annual';

interface PriceMap {
  USD: { monthly: string; annual: string };
  INR: { monthly: string; annual: string };
}

interface Plan {
  name: string;
  prices: PriceMap;
  periodLabel: { monthly: string; annual: string };
  description: string;
  cta: string;
  highlight: boolean;
  features: PlanFeature[];
}

const plans: Plan[] = [
  {
    name: 'Free',
    prices: {
      USD: { monthly: '$0', annual: '$0' },
      INR: { monthly: '₹0', annual: '₹0' },
    },
    periodLabel: { monthly: 'forever', annual: 'forever' },
    description: 'For passive job searchers.',
    cta: 'Get started',
    highlight: false,
    features: [
      { name: 'Weekly email digest', included: true },
      { name: '2 free job sources', included: true },
      { name: '1 resume', included: true },
      { name: '5 active applications tracked', included: true },
      { name: '7-day match history', included: true },
      { name: 'Daily digest', included: false },
      { name: 'All 6 sources', included: false },
      { name: 'AI cover letter generator', included: false },
      { name: 'AI interview prep', included: false },
      { name: 'LinkedIn paste-URL scrapes', included: false },
    ],
  },
  {
    name: 'Pro',
    prices: {
      USD: { monthly: '$9', annual: '$86.40' },
      INR: { monthly: '₹699', annual: '₹6,699' },
    },
    periodLabel: { monthly: '/month', annual: '/year' },
    description: 'For active job switchers.',
    cta: 'Upgrade to Pro',
    highlight: true,
    features: [
      { name: 'Daily email digest', included: true },
      { name: 'All 6 job sources', included: true },
      { name: '3 resumes', included: true },
      { name: 'Unlimited application tracker', included: true },
      { name: 'Lifetime match history', included: true },
      { name: 'AI cover letter generator (20/day)', included: true },
      { name: 'AI interview prep (20/day)', included: true },
      { name: 'LinkedIn paste-URL scrapes (5/day)', included: true },
      { name: 'Hide companies and jobs', included: true },
      { name: 'Why-this-match explanations', included: true },
    ],
  },
];

const faq = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. You keep Pro access until the end of your billing period. No questions asked.',
  },
  {
    q: 'What payment methods?',
    a: 'Cards, UPI, netbanking, and most international wallets — handled by Dodo Payments.',
  },
  {
    q: 'Do you offer refunds?',
    a: 'Full refund within 14 days if you have not used Pro features. See the refund policy for detail.',
  },
  {
    q: 'Is the free tier really free?',
    a: 'Yes. Forever. No credit card to sign up. The free tier is designed to be useful on its own.',
  },
];

export default function PricingPage() {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<Period>('monthly');
  const [currency, setCurrency] = useState<Currency>('USD');

  useEffect(() => {
    let cancelled = false;

    const detectCurrency = async () => {
      try {
        const res = await fetch('/api/geo');
        if (res.ok) {
          const data = (await res.json()) as { country?: string };
          if (!cancelled && data.country === 'IN') {
            setCurrency('INR');
            return;
          }
          if (!cancelled) return;
        }
      } catch {
        // fall through to timezone fallback
      }

      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        if (!cancelled && (tz.includes('Kolkata') || tz.includes('Calcutta'))) {
          setCurrency('INR');
        }
      } catch {
        // default USD
      }
    };

    detectCurrency();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubscribe = async () => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }

    setLoading(true);
    track('subscribe_clicked', { plan: 'PRO' });
    try {
      const response = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok || !data.checkoutUrl) {
        throw new Error(data.error || 'Failed to create checkout');
      }

      window.location.href = data.checkoutUrl;
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to initiate payment');
      setLoading(false);
    }
  };

  const comparisonLine =
    currency === 'INR' ? (
      <>
        LinkedIn Premium: ₹3,320/mo · Simplify Pro: ₹2,490/mo ·{' '}
        <span className="font-semibold text-gray-900">Hirin Pro: starting at ₹699/mo</span>
      </>
    ) : (
      <>
        LinkedIn Premium: $40/mo · Simplify Pro: $30/mo ·{' '}
        <span className="font-semibold text-gray-900">Hirin Pro: starting at $9/mo</span>
      </>
    );

  return (
    <div className="font-poppins min-h-screen bg-white">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        {/* Header */}
        <div className="mb-10 text-center sm:mb-16">
          <h1 className="text-3xl font-medium tracking-tight text-black sm:text-5xl lg:text-6xl">
            Pricing<span className="text-sky-500">.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-gray-500 sm:text-lg">
            Start free. Upgrade when daily matches become worth nine dollars.
          </p>
        </div>

        {/* Comparison anchor */}
        <div className="mb-6 text-center text-sm text-gray-500">{comparisonLine}</div>

        {/* Toggles */}
        <div className="mb-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <div className="inline-flex items-center border border-gray-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setPeriod('monthly')}
              className={`px-4 py-1.5 text-sm transition-colors ${
                period === 'monthly' ? 'bg-black text-white' : 'text-gray-600 hover:text-black'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setPeriod('annual')}
              className={`px-4 py-1.5 text-sm transition-colors ${
                period === 'annual' ? 'bg-black text-white' : 'text-gray-600 hover:text-black'
              }`}
            >
              Annual · save 20%
            </button>
          </div>

          <div className="inline-flex items-center border border-gray-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setCurrency('USD')}
              className={`px-4 py-1.5 text-sm transition-colors ${
                currency === 'USD' ? 'bg-black text-white' : 'text-gray-600 hover:text-black'
              }`}
            >
              USD
            </button>
            <button
              type="button"
              onClick={() => setCurrency('INR')}
              className={`px-4 py-1.5 text-sm transition-colors ${
                currency === 'INR' ? 'bg-black text-white' : 'text-gray-600 hover:text-black'
              }`}
            >
              INR
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="mx-auto grid max-w-4xl gap-4 sm:gap-6 md:grid-cols-2">
          {plans.map((plan) => {
            const price = plan.prices[currency][period];
            const periodLabel = plan.periodLabel[period];
            return (
              <div
                key={plan.name}
                className={`relative flex flex-col border border-gray-200 bg-white p-5 sm:p-8 ${
                  plan.highlight ? 'border-black' : ''
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-8 bg-black px-3 py-1 text-xs font-medium tracking-wider text-white uppercase">
                    Recommended
                  </span>
                )}

                <div className="mb-6">
                  <h2 className="text-2xl font-medium text-black">{plan.name}</h2>
                  <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
                </div>

                <div className="mb-8 flex items-baseline gap-1">
                  <span className="text-4xl font-medium text-black sm:text-5xl">{price}</span>
                  <span className="text-base text-gray-400">{periodLabel}</span>
                </div>

                <ul className="mb-8 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature.name} className="flex items-start gap-3 text-sm">
                      {feature.included ? (
                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-black" />
                      ) : (
                        <Minus className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-300" />
                      )}
                      <span className={feature.included ? 'text-gray-800' : 'text-gray-400'}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>

                {plan.highlight ? (
                  <button
                    onClick={handleSubscribe}
                    disabled={loading}
                    className="flex h-12 w-full items-center justify-center bg-black text-base font-light text-white transition-colors duration-300 hover:bg-black/85 disabled:opacity-60"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : plan.cta}
                  </button>
                ) : (
                  <button
                    onClick={() => (isSignedIn ? router.push('/matches') : router.push('/sign-up'))}
                    className="flex h-12 w-full items-center justify-center border border-black bg-white text-base font-light text-black transition-colors duration-300 hover:bg-gray-50"
                  >
                    {plan.cta}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="mx-auto mt-24 max-w-3xl">
          <h2 className="mb-8 text-center text-2xl font-medium text-black">Common questions</h2>
          <dl className="divide-y divide-gray-200 border-t border-b border-gray-200">
            {faq.map((item) => (
              <div key={item.q} className="py-6">
                <dt className="text-base font-medium text-black">{item.q}</dt>
                <dd className="mt-2 text-sm text-gray-600">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Trust line */}
        <p className="mt-16 text-center text-xs text-gray-400">
          Payments processed by Dodo Payments. Cancel anytime from your profile.
        </p>
      </div>
    </div>
  );
}
