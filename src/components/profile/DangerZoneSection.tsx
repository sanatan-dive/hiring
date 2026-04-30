'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import toast from 'react-hot-toast';
import { AlertTriangle, Loader2 } from 'lucide-react';

const DangerZoneSection = () => {
  const router = useRouter();
  const { signOut } = useClerk();
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const canDelete = confirmText.toLowerCase() === 'delete';

  const deleteAccount = async () => {
    if (!canDelete || busy) return;
    setBusy(true);
    try {
      const res = await fetch('/api/account/delete', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed');
      toast.success('Account deleted.');
      // Sign out (Clerk session is gone too) and redirect
      await signOut(() => router.push('/'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
      setBusy(false);
    }
  };

  return (
    <section className="mb-8 rounded-2xl border-2 border-red-200 bg-red-50 p-6">
      <h2 className="mb-2 flex items-center gap-2 text-xl font-semibold text-red-900">
        <AlertTriangle className="h-5 w-5" />
        Delete account
      </h2>
      <p className="mb-4 text-sm text-red-800">
        Permanently delete your account, resumes, matches, applications, and bookmarks. If you
        have an active Pro subscription, it will be cancelled. This cannot be undone.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder='Type "delete" to confirm'
          className="flex-1 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm placeholder:text-red-300 focus:border-red-500 focus:outline-none"
        />
        <button
          onClick={deleteAccount}
          disabled={!canDelete || busy}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Delete my account
        </button>
      </div>
    </section>
  );
};

export default DangerZoneSection;
