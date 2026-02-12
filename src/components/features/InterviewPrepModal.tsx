'use client';

import React, { useState } from 'react';
import { X, Loader2, BookOpen, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();

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
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
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
          <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!prepData ? (
            <div className="py-10 text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
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
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
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
              {/* Questions */}
              <section>
                <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <MessageCircle className="h-5 w-5 text-blue-500" />
                  Likely Questions
                </h4>
                <div className="space-y-4">
                  {prepData.questions?.map((q, i) => (
                    <div key={i} className="rounded-lg border bg-gray-50 p-4">
                      <p className="mb-2 font-medium text-gray-900">
                        {i + 1}. {q.question}
                      </p>
                      <div className="text-sm text-gray-600">
                        <span className="font-semibold text-blue-600">Tip:</span> {q.sampleAnswer}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Tips */}
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
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default InterviewPrepModal;
