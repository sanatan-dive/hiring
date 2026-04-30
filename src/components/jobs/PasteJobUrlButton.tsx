'use client';

import React, { useState } from 'react';
import { Link2, Loader2, X, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { detectJobUrl, parseBulkUrls } from '@/lib/jobs/url-detection';
import { log } from '@/lib/log';

interface Props {
  onComplete?: () => void;
}

interface JobResult {
  url: string;
  status: 'pending' | 'success' | 'error';
  source: string;
  message?: string;
}

const SOURCE_LABELS: Record<string, string> = {
  linkedin: 'LinkedIn',
  indeed: 'Indeed',
  wellfound: 'Wellfound',
  greenhouse: 'Greenhouse',
  lever: 'Lever',
  workday: 'Workday',
  ashby: 'Ashby',
  unknown: 'Unknown',
};

const PasteJobUrlButton: React.FC<Props> = ({ onComplete }) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [results, setResults] = useState<JobResult[]>([]);
  const [running, setRunning] = useState(false);

  const submit = async () => {
    const { detected, invalid } = parseBulkUrls(text);
    if (detected.length === 0) {
      toast.error('No valid job URLs found');
      return;
    }

    if (invalid.length > 0) {
      toast(`Skipping ${invalid.length} unrecognized line${invalid.length === 1 ? '' : 's'}`);
    }

    setRunning(true);
    setResults(
      detected.map((d) => ({
        url: d.url,
        source: SOURCE_LABELS[d.source] ?? d.source,
        status: 'pending',
      }))
    );

    // Process sequentially so we don't hammer the scraper
    for (let i = 0; i < detected.length; i++) {
      const job = detected[i];
      try {
        if (!job.isSupported) {
          setResults((prev) =>
            prev.map((r, idx) =>
              idx === i
                ? {
                    ...r,
                    status: 'error',
                    message: `${SOURCE_LABELS[job.source]} not yet supported`,
                  }
                : r
            )
          );
          continue;
        }

        const res = await fetch('/api/jobs/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: job.url }),
        });
        const data = await res.json();

        setResults((prev) =>
          prev.map((r, idx) =>
            idx === i
              ? {
                  ...r,
                  status: res.ok ? 'success' : 'error',
                  message: res.ok ? `Saved: ${data.job?.title ?? '✓'}` : (data.error ?? 'Failed'),
                }
              : r
          )
        );
      } catch (err) {
        log.error('paste-url scrape failed', err);
        setResults((prev) =>
          prev.map((r, idx) =>
            idx === i ? { ...r, status: 'error', message: 'Network error' } : r
          )
        );
      }
    }

    setRunning(false);
    onComplete?.();
  };

  const reset = () => {
    setText('');
    setResults([]);
  };

  // Live preview of detected URLs as user types
  const preview = text.trim() ? parseBulkUrls(text) : null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:border-black hover:text-black"
      >
        <Link2 className="h-4 w-4" />
        Paste job URL
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !running && setOpen(false)}
        >
          <div
            className="font-poppins relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => !running && setOpen(false)}
              disabled={running}
              className="absolute top-4 right-4 text-gray-400 hover:text-black disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="mb-2 text-xl font-medium text-black">Paste job URLs</h2>
            <p className="mb-4 text-sm text-gray-500">
              Paste one or more LinkedIn / Greenhouse / Lever / Wellfound / Ashby URLs (one per
              line). We&apos;ll scrape and add them to your matches.
            </p>

            {results.length === 0 ? (
              <>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={`https://www.linkedin.com/jobs/view/3812345678\nhttps://boards.greenhouse.io/stripe/jobs/4827283\nhttps://jobs.lever.co/figma/abc-123`}
                  rows={6}
                  className="w-full resize-none rounded-lg border border-gray-300 bg-white p-3 font-mono text-xs focus:border-black focus:outline-none"
                />

                {preview && preview.detected.length > 0 && (
                  <div className="mt-3 rounded-lg bg-gray-50 p-3 text-xs">
                    <div className="font-medium text-gray-700">
                      Detected {preview.detected.length} job URL
                      {preview.detected.length === 1 ? '' : 's'}:
                    </div>
                    <ul className="mt-1 space-y-0.5 text-gray-600">
                      {preview.detected.slice(0, 8).map((d, i) => (
                        <li key={i}>
                          {SOURCE_LABELS[d.source]}{' '}
                          {!d.isSupported && <span className="text-amber-600">(unsupported)</span>}
                        </li>
                      ))}
                    </ul>
                    {preview.invalid.length > 0 && (
                      <div className="mt-2 text-rose-600">
                        {preview.invalid.length} unrecognized line
                        {preview.invalid.length === 1 ? '' : 's'} will be skipped.
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={submit}
                  disabled={!preview || preview.detected.length === 0}
                  className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-black text-sm font-medium text-white hover:bg-black/85 disabled:opacity-50"
                >
                  {preview && preview.detected.length > 0
                    ? `Scrape ${preview.detected.length} job${preview.detected.length === 1 ? '' : 's'}`
                    : 'Paste URLs above to start'}
                </button>
              </>
            ) : (
              <>
                <ul className="space-y-2">
                  {results.map((r, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3"
                    >
                      <div className="pt-0.5">
                        {r.status === 'pending' && (
                          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        )}
                        {r.status === 'success' && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        )}
                        {r.status === 'error' && <XCircle className="h-4 w-4 text-rose-600" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="font-medium">{r.source}</span>
                          <span>·</span>
                          <span className="truncate">{r.url}</span>
                        </div>
                        {r.message && (
                          <div
                            className={`mt-1 text-sm ${
                              r.status === 'success' ? 'text-gray-900' : 'text-rose-700'
                            }`}
                          >
                            {r.message}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>

                {!running && (
                  <div className="mt-5 flex gap-2">
                    <button
                      onClick={reset}
                      className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Paste more
                    </button>
                    <button
                      onClick={() => setOpen(false)}
                      className="flex-1 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/85"
                    >
                      Done
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

// Re-export the helpers for convenience
export { detectJobUrl };

export default PasteJobUrlButton;
