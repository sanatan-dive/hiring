'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Crown, ExternalLink, Loader2, X, Heart, Briefcase, MessageSquare } from 'lucide-react';

interface SubscriptionSectionProps {
  subscription: {
    plan: string;
    status: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  };
  onChange?: () => void;
}

type Reason = 'expensive' | 'found-job' | 'not-useful' | 'other';

const formatDate = (iso: string | null) => {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const SubscriptionSection: React.FC<SubscriptionSectionProps> = ({ subscription, onChange }) => {
  const [busy, setBusy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [reason, setReason] = useState<Reason | null>(null);
  const [comment, setComment] = useState('');

  const isPro = subscription.plan === 'PRO' && subscription.status === 'active';
  const cancelling = subscription.cancelAtPeriodEnd;
  const endStr = formatDate(subscription.currentPeriodEnd);

  const openCancelModal = () => {
    if (busy) return;
    setReason(null);
    setComment('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (busy) return;
    setModalOpen(false);
  };

  const submitSurveyAndCancel = async () => {
    if (busy || !reason) return;
    setBusy(true);
    try {
      // Fire-and-forget shape: still await so we can log, but don't block on errors
      try {
        await fetch('/api/payments/cancel-survey', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason, comment: comment.trim() || undefined }),
        });
      } catch {
        // Survey logging shouldn't block cancellation
      }

      const res = await fetch('/api/payments/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error((await res.json())?.error ?? 'Failed');
      toast.success('Subscription cancelled. Pro stays active until period end.');
      setModalOpen(false);
      onChange?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Cancel failed');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveAttempt = (kind: 'discount' | 'pause' | 'feedback') => {
    if (kind === 'feedback') {
      window.location.href =
        'mailto:feedback@hirin.com?subject=What%27s%20missing%20in%20Hirin%20Pro%3F';
      return;
    }
    toast.success('Coming soon — concierge will follow up via email.');
    setModalOpen(false);
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
            <span className="text-2xl font-semibold text-gray-900 capitalize">
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
              onClick={openCancelModal}
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

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {reason === null
                  ? 'Sorry to see you go. Why are you cancelling?'
                  : 'Before you go...'}
              </h3>
              <button
                onClick={closeModal}
                disabled={busy}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {reason === null && (
              <div className="space-y-2">
                {(
                  [
                    { value: 'expensive', label: 'Too expensive' },
                    { value: 'found-job', label: 'I found a job (congrats!)' },
                    { value: 'not-useful', label: 'Not useful enough for me' },
                    { value: 'other', label: 'Other' },
                  ] as { value: Reason; label: string }[]
                ).map((opt) => (
                  <label
                    key={opt.value}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 hover:border-sky-400 hover:bg-sky-50"
                  >
                    <input
                      type="radio"
                      name="cancel-reason"
                      value={opt.value}
                      checked={false}
                      onChange={() => setReason(opt.value)}
                      className="h-4 w-4 text-sky-600 focus:ring-sky-500"
                    />
                    <span className="text-sm text-gray-800">{opt.label}</span>
                  </label>
                ))}
              </div>
            )}

            {reason === 'expensive' && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-lg bg-sky-50 p-4">
                  <Heart className="mt-0.5 h-5 w-5 flex-shrink-0 text-sky-600" />
                  <p className="text-sm text-gray-800">
                    Get <strong>50% off for 3 months</strong> — keep your match history while you
                    stabilize.
                  </p>
                </div>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    onClick={submitSurveyAndCancel}
                    disabled={busy}
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                    Cancel anyway
                  </button>
                  <button
                    onClick={() => handleSaveAttempt('discount')}
                    disabled={busy}
                    className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                  >
                    Keep at 50% off
                  </button>
                </div>
              </div>
            )}

            {reason === 'found-job' && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-lg bg-sky-50 p-4">
                  <Briefcase className="mt-0.5 h-5 w-5 flex-shrink-0 text-sky-600" />
                  <p className="text-sm text-gray-800">
                    Congratulations! 🎉 Pause instead of cancel — when you&apos;re job-hunting
                    again, your data is here. We&apos;ll auto-resume only when you reactivate.
                  </p>
                </div>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    onClick={submitSurveyAndCancel}
                    disabled={busy}
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                    Cancel anyway
                  </button>
                  <button
                    onClick={() => handleSaveAttempt('pause')}
                    disabled={busy}
                    className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                  >
                    Pause for 6 months
                  </button>
                </div>
              </div>
            )}

            {reason === 'not-useful' && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-lg bg-sky-50 p-4">
                  <MessageSquare className="mt-0.5 h-5 w-5 flex-shrink-0 text-sky-600" />
                  <p className="text-sm text-gray-800">
                    We&apos;d love to know what&apos;s missing. Your feedback shapes what we build
                    next.
                  </p>
                </div>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    onClick={submitSurveyAndCancel}
                    disabled={busy}
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                    Cancel anyway
                  </button>
                  <button
                    onClick={() => handleSaveAttempt('feedback')}
                    disabled={busy}
                    className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                  >
                    Open feedback form
                  </button>
                </div>
              </div>
            )}

            {reason === 'other' && (
              <div className="space-y-4">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us more (optional)"
                  rows={4}
                  maxLength={2000}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none"
                />
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    onClick={() => setReason(null)}
                    disabled={busy}
                    className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Go back
                  </button>
                  <button
                    onClick={submitSurveyAndCancel}
                    disabled={busy}
                    className="inline-flex items-center justify-center gap-1 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                  >
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default SubscriptionSection;
