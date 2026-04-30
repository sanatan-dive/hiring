'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Crown, ExternalLink, Loader2 } from 'lucide-react';

interface SubscriptionSectionProps {
  subscription: {
    plan: string;
    status: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  };
  onChange?: () => void;
}

const formatDate = (iso: string | null) => {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const SubscriptionSection: React.FC<SubscriptionSectionProps> = ({
  subscription,
  onChange,
}) => {
  const [busy, setBusy] = useState(false);

  const isPro = subscription.plan === 'PRO' && subscription.status === 'active';
  const cancelling = subscription.cancelAtPeriodEnd;
  const endStr = formatDate(subscription.currentPeriodEnd);

  const cancel = async () => {
    if (busy) return;
    if (!confirm('Cancel your subscription? You will keep Pro access until the period ends.'))
      return;
    setBusy(true);
    try {
      const res = await fetch('/api/payments/cancel', { method: 'POST' });
      if (!res.ok) throw new Error((await res.json())?.error ?? 'Failed');
      toast.success('Subscription cancelled. Pro stays active until period end.');
      onChange?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Cancel failed');
    } finally {
      setBusy(false);
    }
  };

  const resumeSub = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch('/api/payments/resume', { method: 'POST' });
      if (!res.ok) throw new Error((await res.json())?.error ?? 'Failed');
      toast.success('Subscription resumed.');
      onChange?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Resume failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-black">
        <Crown className="h-5 w-5 text-sky-600" />
        Subscription
      </h2>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-semibold capitalize text-gray-900">
              {subscription.plan.toLowerCase()}
            </span>
            {isPro && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                Active
              </span>
            )}
            {cancelling && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                Cancels {endStr}
              </span>
            )}
          </div>
          {isPro && endStr && !cancelling && (
            <p className="mt-1 text-sm text-gray-500">Next billing: {endStr}</p>
          )}
        </div>

        <div className="flex gap-2">
          {!isPro && (
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
            >
              Upgrade to Pro
              <ExternalLink className="h-4 w-4" />
            </Link>
          )}
          {isPro && !cancelling && (
            <button
              onClick={cancel}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Cancel subscription
            </button>
          )}
          {isPro && cancelling && (
            <button
              onClick={resumeSub}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-lg border border-green-200 bg-white px-4 py-2 text-sm font-medium text-green-600 hover:bg-green-50 disabled:opacity-50"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Resume subscription
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default SubscriptionSection;
