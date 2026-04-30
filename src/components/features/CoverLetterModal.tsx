'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { X, Copy, Check, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface CoverLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
  companyName: string;
  jobDescription?: string;
}

type Tone = 'enthusiastic' | 'concise' | 'technical';

interface DraftEntry {
  at: number;
  text: string;
}

const HISTORY_LIMIT = 3;

const storageKey = (jobId: string) => `hirin:cover-letter:${jobId}`;

const readHistory = (jobId: string): DraftEntry[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(storageKey(jobId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeHistory = (jobId: string, entries: DraftEntry[]) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey(jobId), JSON.stringify(entries));
  } catch {
    // ignore quota errors
  }
};

const CoverLetterModal: React.FC<CoverLetterModalProps> = ({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  companyName,
  jobDescription,
}) => {
  const [loading, setLoading] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [history, setHistory] = useState<DraftEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setHistory(readHistory(jobId));
    }
  }, [isOpen, jobId]);

  const wordCount = useMemo(
    () => (coverLetter.trim() ? coverLetter.trim().split(/\s+/).length : 0),
    [coverLetter]
  );

  const persistDraft = (text: string) => {
    if (!text.trim()) return;
    const next: DraftEntry[] = [{ at: Date.now(), text }, ...history].slice(0, HISTORY_LIMIT);
    setHistory(next);
    writeHistory(jobId, next);
  };

  const generateLetter = async (opts?: { tone?: Tone; customInstructions?: string }) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ai/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          jobTitle,
          companyName,
          jobDescription: jobDescription || '',
          tone: opts?.tone,
          customInstructions: opts?.customInstructions,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          setError('Upgrade to Pro to use this feature.');
        } else {
          setError(data.error || 'Failed to generate cover letter');
        }
        return;
      }

      setCoverLetter(data.coverLetter);
      persistDraft(data.coverLetter);
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadDraft = (entry: DraftEntry) => {
    setCoverLetter(entry.text);
    setShowHistory(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-xl font-semibold text-gray-900">AI Cover Letter</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {!coverLetter ? (
            <div className="text-center">
              <p className="mb-6 text-gray-600">
                Generate a tailored cover letter for <strong>{jobTitle}</strong> at{' '}
                <strong>{companyName}</strong> based on your resume.
              </p>

              {error && (
                <div className="mb-4 flex flex-col items-center gap-2 rounded-lg bg-red-50 p-3 text-red-600">
                  <p>{error}</p>
                  {error.includes('Upgrade') && (
                    <button
                      onClick={() => router.push('/pricing')}
                      className="text-sm font-semibold underline"
                    >
                      View Plans
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={() => generateLetter()}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-sky-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>Generate Cover Letter</>
                )}
              </button>

              {history.length > 0 && (
                <div className="mt-6 text-left">
                  <button
                    type="button"
                    onClick={() => setShowHistory((v) => !v)}
                    className="text-sm font-medium text-sky-600 hover:underline"
                  >
                    Previous drafts ({history.length})
                  </button>
                  {showHistory && (
                    <ul className="mt-2 divide-y rounded-lg border bg-gray-50">
                      {history.map((entry) => (
                        <li key={entry.at} className="flex items-center justify-between gap-2 p-2">
                          <span className="truncate text-xs text-gray-600">
                            {new Date(entry.at).toLocaleString()} — {entry.text.slice(0, 60).trim()}
                            …
                          </span>
                          <button
                            type="button"
                            onClick={() => loadDraft(entry)}
                            className="shrink-0 rounded border bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                          >
                            Load
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              {error && (
                <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
              )}

              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                className="mb-1 max-h-[50vh] min-h-[260px] w-full resize-y overflow-y-auto rounded-lg border bg-gray-50 p-4 text-sm whitespace-pre-wrap text-gray-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              <div className="mb-3 flex items-center justify-between text-xs text-gray-500">
                <span>{wordCount} words</span>
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowHistory((v) => !v)}
                    className="font-medium text-sky-600 hover:underline"
                  >
                    Previous drafts ({history.length})
                  </button>
                )}
              </div>

              {showHistory && history.length > 0 && (
                <ul className="mb-3 divide-y rounded-lg border bg-gray-50">
                  {history.map((entry) => (
                    <li key={entry.at} className="flex items-center justify-between gap-2 p-2">
                      <span className="truncate text-xs text-gray-600">
                        {new Date(entry.at).toLocaleString()} — {entry.text.slice(0, 60).trim()}…
                      </span>
                      <button
                        type="button"
                        onClick={() => loadDraft(entry)}
                        className="shrink-0 rounded border bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      >
                        Load
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mb-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => generateLetter({ tone: 'enthusiastic' })}
                  disabled={loading}
                  className="rounded-lg border px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  More Enthusiastic
                </button>
                <button
                  type="button"
                  onClick={() => generateLetter({ tone: 'concise' })}
                  disabled={loading}
                  className="rounded-lg border px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  More Concise
                </button>
                <button
                  type="button"
                  onClick={() => generateLetter({ tone: 'technical' })}
                  disabled={loading}
                  className="rounded-lg border px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  More Technical
                </button>
              </div>

              <div className="mb-4 flex gap-2">
                <input
                  type="text"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Refine with custom instructions..."
                  className="flex-1 rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!customInstructions.trim()) return;
                    generateLetter({ customInstructions });
                  }}
                  disabled={loading || !customInstructions.trim()}
                  className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Regenerate'}
                </button>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setCoverLetter('')}
                  className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Start Over
                </button>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy Text'}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default CoverLetterModal;
