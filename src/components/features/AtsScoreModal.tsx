'use client';

import React, { useState } from 'react';
import { X, Loader2, Target, AlertTriangle, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { log } from '@/lib/log';

interface AtsResult {
  score: number;
  band: 'excellent' | 'good' | 'fair' | 'weak';
  matchedKeywords: string[];
  missingKeywords: string[];
  matchedPhrases: string[];
  missingPhrases: string[];
  warnings: string[];
  suggestions: string[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
}

const BAND_COLOR: Record<AtsResult['band'], string> = {
  excellent: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  good: 'text-sky-700 bg-sky-50 border-sky-200',
  fair: 'text-amber-700 bg-amber-50 border-amber-200',
  weak: 'text-rose-700 bg-rose-50 border-rose-200',
};

const AtsScoreModal: React.FC<Props> = ({ isOpen, onClose, jobId, jobTitle }) => {
  const [result, setResult] = useState<AtsResult | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      setResult(null);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/resume/ats-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || 'Failed to compute score');
          onClose();
          return;
        }
        setResult(data);
      } catch (err) {
        log.error('ats-score fetch failed', err);
        toast.error('Failed to compute score');
        onClose();
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, jobId]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="font-poppins relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-black"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-2 flex items-center gap-2">
          <Target className="h-5 w-5 text-sky-500" />
          <h2 className="text-xl font-medium text-black">Resume vs job</h2>
        </div>
        <p className="mb-6 text-sm text-gray-500">{jobTitle}</p>

        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <p className="mt-3 text-sm text-gray-500">Scoring your resume…</p>
          </div>
        )}

        {result && (
          <>
            {/* Score header */}
            <div className={`mb-6 rounded-xl border-2 p-6 text-center ${BAND_COLOR[result.band]}`}>
              <div className="text-5xl font-medium">{result.score}</div>
              <div className="mt-1 text-sm capitalize opacity-75">{result.band} match</div>
            </div>

            {/* Matched / missing keywords */}
            <div className="mb-6 grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-900">
                  Matched ({result.matchedKeywords.length + result.matchedPhrases.length})
                </h3>
                <div className="flex flex-wrap gap-1">
                  {[...result.matchedPhrases, ...result.matchedKeywords].slice(0, 20).map((k) => (
                    <span
                      key={k}
                      className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs text-emerald-800"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-900">
                  Missing ({result.missingKeywords.length + result.missingPhrases.length})
                </h3>
                <div className="flex flex-wrap gap-1">
                  {[...result.missingPhrases, ...result.missingKeywords].slice(0, 20).map((k) => (
                    <span
                      key={k}
                      className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs text-rose-800"
                    >
                      {k}
                    </span>
                  ))}
                  {result.missingKeywords.length + result.missingPhrases.length === 0 && (
                    <span className="text-xs text-gray-400">Nothing missing</span>
                  )}
                </div>
              </div>
            </div>

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-amber-900">
                  <AlertTriangle className="h-4 w-4" />
                  Watch out
                </h3>
                <ul className="list-disc space-y-1 pl-5 text-sm text-amber-800">
                  {result.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            {result.suggestions.length > 0 && (
              <div className="rounded-lg border border-sky-200 bg-sky-50 p-4">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-sky-900">
                  <Sparkles className="h-4 w-4" />
                  Suggestions
                </h3>
                <ul className="list-disc space-y-1 pl-5 text-sm text-sky-800">
                  {result.suggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="mt-6 text-xs text-gray-400">
              This is a heuristic score, not a real ATS. Use it as a checklist of gaps to close,
              not as gospel.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default AtsScoreModal;
