'use client';

import React, { useEffect, useState } from 'react';
import { Building2, Trash2, Plus, Loader2, ExternalLink, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { log } from '@/lib/log';

interface WatchedCompany {
  id: string;
  name: string;
  careersUrl: string | null;
  lastCheckedAt: string | null;
  createdAt: string;
}

const SUGGESTED = [
  'Stripe',
  'Anthropic',
  'OpenAI',
  'Vercel',
  'Linear',
  'Notion',
  'Figma',
  'Ramp',
  'Plaid',
  'Cloudflare',
];

export default function WatchedCompaniesPage() {
  const [companies, setCompanies] = useState<WatchedCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [careersUrl, setCareersUrl] = useState('');
  const [showCareersUrl, setShowCareersUrl] = useState(false);

  const fetchAll = async () => {
    try {
      const r = await fetch('/api/watched-companies');
      if (r.ok) {
        const data = await r.json();
        setCompanies(data.companies ?? []);
      }
    } catch (err) {
      log.error('fetch watched companies failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const addCompany = async (companyName: string, url?: string) => {
    if (busy) return;
    if (!companyName.trim()) return;
    setBusy(true);
    try {
      const res = await fetch('/api/watched-companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: companyName, careersUrl: url || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success(`Watching ${companyName}`);
      setName('');
      setCareersUrl('');
      setShowCareersUrl(false);
      await fetchAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string, companyName: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/watched-companies/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      toast.success(`Removed ${companyName}`);
      await fetchAll();
    } catch {
      toast.error("Couldn't remove");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="font-poppins min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-medium text-black">
            Watched companies<span className="text-sky-500">.</span>
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Get an email when a company you&apos;re watching posts a new role. Add the careers
            URL (Greenhouse or Lever) for faster detection — otherwise we match against the
            jobs we already aggregate.
          </p>
        </div>

        {/* Add form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addCompany(name, careersUrl);
          }}
          className="mb-8 rounded-xl border border-gray-200 bg-white p-5"
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Company name (e.g., Stripe)"
              className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-black focus:outline-none"
              required
            />
            <button
              type="submit"
              disabled={busy || !name.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-5 py-2 text-sm font-medium text-white hover:bg-black/85 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Watch
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowCareersUrl((v) => !v)}
            className="mt-2 text-xs text-gray-500 hover:text-black"
          >
            {showCareersUrl ? '− Hide' : '+ Add'} a Greenhouse / Lever careers URL (optional, faster)
          </button>
          {showCareersUrl && (
            <input
              type="url"
              value={careersUrl}
              onChange={(e) => setCareersUrl(e.target.value)}
              placeholder="https://boards.greenhouse.io/stripe or https://jobs.lever.co/figma"
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-black focus:outline-none"
            />
          )}
        </form>

        {/* Suggestions */}
        {companies.length === 0 && !loading && (
          <div className="mb-8">
            <p className="mb-2 text-xs font-medium text-gray-500 uppercase">Suggested</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED.filter(
                (s) => !companies.some((c) => c.name.toLowerCase() === s.toLowerCase())
              ).map((s) => (
                <button
                  key={s}
                  onClick={() => addCompany(s)}
                  disabled={busy}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700 hover:border-black hover:text-black disabled:opacity-50"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : companies.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <Building2 className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-600">
              No watched companies yet. Add one above to get email alerts when they post new
              roles.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 bg-white">
            {companies.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-gray-50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-sky-500" />
                    <span className="font-medium text-black">{c.name}</span>
                    {c.careersUrl && (
                      <a
                        href={c.careersUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-sky-600 hover:underline"
                      >
                        careers <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Added {new Date(c.createdAt).toLocaleDateString()}
                    {c.lastCheckedAt && (
                      <> · Last checked {new Date(c.lastCheckedAt).toLocaleDateString()}</>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => remove(c.id, c.name)}
                  disabled={busy}
                  className="text-gray-400 hover:text-red-600 disabled:opacity-50"
                  title={`Stop watching ${c.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-8 text-center text-xs text-gray-400">
          Watching up to 50 companies. We check daily and email you when new roles appear.
        </p>
      </div>
    </div>
  );
}
