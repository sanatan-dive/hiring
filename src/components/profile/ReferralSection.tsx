'use client';

import React, { useEffect, useState } from 'react';
import { Gift, Copy, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ReferralStats {
  code: string | null;
  link: string;
  totalSignups: number;
  upgrades: number;
  upgradesNeededFor6mo: number;
  upgradesNeededForLife: number;
}

const ReferralSection = () => {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/referrals')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && !d.error) setStats(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const copy = async () => {
    if (!stats?.link) return;
    try {
      await navigator.clipboard.writeText(stats.link);
      setCopied(true);
      toast.success('Link copied');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Couldn't copy");
    }
  };

  if (loading) {
    return (
      <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-6">
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-gray-400" />
      </section>
    );
  }

  if (!stats) return null;

  const nextMilestone =
    stats.upgradesNeededFor6mo > 0
      ? `${stats.upgradesNeededFor6mo} more upgrade${stats.upgradesNeededFor6mo === 1 ? '' : 's'} → Pro free for 6 months`
      : stats.upgradesNeededForLife > 0
        ? `${stats.upgradesNeededForLife} more upgrade${stats.upgradesNeededForLife === 1 ? '' : 's'} → Pro free for life`
        : 'You earned Pro for life';

  return (
    <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-6">
      <h2 className="mb-2 flex items-center gap-2 text-xl font-medium text-black">
        <Gift className="h-5 w-5 text-sky-500" />
        Refer friends, get Pro free
      </h2>
      <p className="mb-5 text-sm text-gray-600">
        3 friends upgrade → 6 months Pro free. 10 friends → Pro for life.
      </p>

      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          readOnly
          value={stats.link}
          className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <button
          onClick={copy}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/85"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <Stat label="Signed up" value={stats.totalSignups} />
        <Stat label="Upgraded" value={stats.upgrades} />
        <Stat label="Next reward" value={nextMilestone} small />
      </div>

      {stats.upgrades > 0 && stats.upgradesNeededFor6mo === 0 && (
        <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          🎉 You&apos;ve earned a Pro reward. We&apos;ll apply it on your next renewal — or
          email <a href="/contact" className="underline">support</a> to claim it now.
        </p>
      )}
    </section>
  );
};

const Stat = ({ label, value, small }: { label: string; value: string | number; small?: boolean }) => (
  <div className="rounded-lg bg-gray-50 p-3">
    <div className={small ? 'text-xs font-medium text-gray-900' : 'text-2xl font-medium text-black'}>
      {value}
    </div>
    <div className="mt-1 text-xs text-gray-500">{label}</div>
  </div>
);

export default ReferralSection;
