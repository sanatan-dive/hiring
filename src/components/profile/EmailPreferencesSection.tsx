'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Mail } from 'lucide-react';

interface EmailPreferencesSectionProps {
  initialEnabled: boolean;
}

const EmailPreferencesSection: React.FC<EmailPreferencesSectionProps> = ({
  initialEnabled,
}) => {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (busy) return;
    const next = !enabled;
    setEnabled(next); // optimistic
    setBusy(true);
    try {
      const res = await fetch('/api/user/email-prefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailDigestEnabled: next }),
      });
      if (!res.ok) throw new Error('Failed to update');
      toast.success(next ? 'Daily digest enabled' : 'Daily digest disabled');
    } catch {
      setEnabled(!next); // revert
      toast.error("Couldn't update preference");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-black">
        <Mail className="h-5 w-5 text-indigo-600" />
        Email preferences
      </h2>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium text-gray-900">Job digest emails</p>
          <p className="mt-1 text-sm text-gray-500">
            We send your top matches to your inbox (weekly on free, daily on Pro).
          </p>
        </div>
        <button
          onClick={toggle}
          disabled={busy}
          aria-pressed={enabled}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 ${
            enabled ? 'bg-indigo-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
              enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </section>
  );
};

export default EmailPreferencesSection;
