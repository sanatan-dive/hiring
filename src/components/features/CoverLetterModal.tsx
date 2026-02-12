'use client';

import React, { useState } from 'react';
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
  const router = useRouter();

  const generateLetter = async () => {
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
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
                onClick={generateLetter}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
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
            </div>
          ) : (
            <div className="relative">
              <div className="mb-4 max-h-[60vh] overflow-y-auto rounded-lg border bg-gray-50 p-4 text-sm whitespace-pre-wrap text-gray-800">
                {coverLetter}
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setCoverLetter('')}
                  className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Regenerate
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
