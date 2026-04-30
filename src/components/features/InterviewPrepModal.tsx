'use client';

import React, { useState } from 'react';
import { X, Loader2, BookOpen, MessageCircle, Mic } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import InterviewVoiceModal from './InterviewVoiceModal';

interface InterviewPrepModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
  companyName: string;
  jobDescription?: string;
}

interface PrepData {
  questions: {
    question: string;
    type: string;
    sampleAnswer: string;
  }[];
  tips: string[];
}

const InterviewPrepModal: React.FC<InterviewPrepModalProps> = ({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  companyName,
  jobDescription,
}) => {
  const [loading, setLoading] = useState(false);
  const [prepData, setPrepData] = useState<PrepData | null>(null);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'study' | 'practice'>('study');
  const [revealedSet, setRevealedSet] = useState<Set<number>>(new Set());
  const [practicedSet, setPracticedSet] = useState<Set<number>>(new Set());
  const [voiceOpen, setVoiceOpen] = useState(false);
  const router = useRouter();

  const toggleRevealed = (i: number) => {
    setRevealedSet((prev) => {
      const next = new Set(prev);
      next.add(i);
      return next;
    });
  };

  const togglePracticed = (i: number) => {
    setPracticedSet((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const generatePrep = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ai/interview-prep', {
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
          setError(data.error || 'Failed to generate prep');
        }
        return;
      }

      setPrepData(data.prep); // Expecting { prep: { questions: [], tips: [] } } from API
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-xl font-semibold text-gray-900">AI Interview Prep</h3>
          <div className="flex items-center gap-2">
            {prepData && prepData.questions?.length > 0 && (
              <button
                onClick={() => setVoiceOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
                aria-label="Practice with voice"
              >
                <Mic className="h-3.5 w-3.5" />
                Practice with voice
              </button>
            )}
            <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {prepData && (
          <InterviewVoiceModal
            isOpen={voiceOpen}
            onClose={() => setVoiceOpen(false)}
            questions={prepData.questions || []}
            jobTitle={jobTitle}
            companyName={companyName}
          />
        )}

        <div className="flex-1 overflow-y-auto p-6">
          {!prepData ? (
            <div className="py-10 text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                <MessageCircle className="h-8 w-8" />
              </div>
              <p className="mb-6 text-gray-600">
                Get interview questions and tips tailored for <strong>{jobTitle}</strong> at{' '}
                <strong>{companyName}</strong>.
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
                onClick={generatePrep}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-sky-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Analyzing Role...
                  </>
                ) : (
                  'Start Preparation'
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Mode Toggle */}
              <div className="flex items-center justify-between">
                <div className="inline-flex rounded-lg border bg-gray-50 p-1">
                  <button
                    onClick={() => setMode('study')}
                    className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                      mode === 'study'
                        ? 'bg-white text-sky-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Study Mode
                  </button>
                  <button
                    onClick={() => setMode('practice')}
                    className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                      mode === 'practice'
                        ? 'bg-white text-sky-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Practice Mode
                  </button>
                </div>
                {mode === 'practice' && prepData.questions && (
                  <span className="text-sm font-medium text-gray-600">
                    {practicedSet.size} / {prepData.questions.length} practiced
                  </span>
                )}
              </div>

              {/* Questions */}
              <section>
                <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <MessageCircle className="h-5 w-5 text-sky-500" />
                  Likely Questions
                </h4>
                <div className="space-y-4">
                  {prepData.questions?.map((q, i) => {
                    const isRevealed = mode === 'study' || revealedSet.has(i);
                    const isPracticed = practicedSet.has(i);
                    return (
                      <div key={i} className="rounded-lg border bg-gray-50 p-4">
                        <p className="mb-2 font-medium text-gray-900">
                          {i + 1}. {q.question}
                        </p>
                        {isRevealed ? (
                          <div className="text-sm text-gray-600">
                            <span className="font-semibold text-sky-600">Suggested approach:</span>{' '}
                            {q.sampleAnswer}
                          </div>
                        ) : (
                          <button
                            onClick={() => toggleRevealed(i)}
                            className="mt-1 rounded-md border border-sky-200 bg-white px-3 py-1.5 text-sm font-medium text-sky-600 hover:bg-sky-50"
                          >
                            Reveal Answer
                          </button>
                        )}
                        {mode === 'practice' && isRevealed && (
                          <button
                            onClick={() => togglePracticed(i)}
                            className={`mt-3 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                              isPracticed
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {isPracticed ? 'Practiced ✓' : 'Mark as Practiced ✓'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Tips */}
              {mode === 'study' && (
                <section>
                  <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <BookOpen className="h-5 w-5 text-purple-500" />
                    Key Success Tips
                  </h4>
                  <ul className="list-disc space-y-2 pl-5 text-gray-700">
                    {prepData.tips?.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default InterviewPrepModal;
