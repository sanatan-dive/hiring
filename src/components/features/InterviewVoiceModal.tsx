'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  X,
  Mic,
  MicOff,
  Play,
  Pause,
  Loader2,
  Volume2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { INTERVIEWER_VOICES, type InterviewerVoice } from '@/lib/ai/voices';

interface PrepQuestion {
  question: string;
  type?: string;
  sampleAnswer?: string;
}

interface InterviewVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: PrepQuestion[];
  jobTitle: string;
  companyName: string;
}

type RecognitionResult = { transcript: string; isFinal: boolean };

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: (e: {
    results: ArrayLike<ArrayLike<{ transcript: string }>> & { length: number };
  }) => void;
  onerror: (e: { error: string }) => void;
  onend: () => void;
}

function getSpeechRecognition(): { new (): SpeechRecognitionLike } | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: { new (): SpeechRecognitionLike };
    webkitSpeechRecognition?: { new (): SpeechRecognitionLike };
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const InterviewVoiceModal: React.FC<InterviewVoiceModalProps> = ({
  isOpen,
  onClose,
  questions,
  jobTitle,
  companyName,
}) => {
  const router = useRouter();
  const [voice, setVoice] = useState<InterviewerVoice>(INTERVIEWER_VOICES[0]);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [audioLoading, setAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [recording, setRecording] = useState(false);
  const [showSampleAnswer, setShowSampleAnswer] = useState(false);
  const [error, setError] = useState('');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const currentQuestion = questions[questionIdx];
  const sttSupported = useMemo(() => getSpeechRecognition() !== null, []);

  // Reset per-question state when navigating
  useEffect(() => {
    setTranscript('');
    setInterim('');
    setShowSampleAnswer(false);
    setError('');
    setAudioUrl(null);
    setIsPlaying(false);
  }, [questionIdx, voice.id]);

  // Cleanup audio URL on unmount / change
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      recognitionRef.current?.abort();
    };
  }, [audioUrl]);

  const fetchAudio = async () => {
    if (!currentQuestion) return;
    setAudioLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ai/interview-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: currentQuestion.question, voice: voice.id }),
      });
      if (!res.ok) {
        if (res.status === 403) {
          setError('Upgrade to Pro to use voice practice.');
          return;
        }
        if (res.status === 429) {
          setError('Daily voice limit reached. Try again tomorrow.');
          return;
        }
        if (res.status === 501) {
          const data = await res.json().catch(() => ({}));
          setError(
            data.error ||
              'Voice synthesis not configured. Run `npm install msedge-tts` and redeploy.'
          );
          return;
        }
        setError('Could not generate voice. Try again.');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      // auto-play once loaded
      setTimeout(() => audioRef.current?.play().catch(() => null), 50);
    } catch {
      setError('Network error generating voice.');
    } finally {
      setAudioLoading(false);
    }
  };

  const startRecording = () => {
    const SR = getSpeechRecognition();
    if (!SR) {
      toast.error('Speech recognition not supported in this browser. Try Chrome.');
      return;
    }
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = 'en-US';
    r.onresult = (e) => {
      let finalT = '';
      let interimT = '';
      for (let i = 0; i < e.results.length; i++) {
        const result = e.results[i] as ArrayLike<RecognitionResult> & {
          isFinal: boolean;
          length: number;
        };
        const text = result[0]?.transcript ?? '';
        if (result.isFinal) finalT += text + ' ';
        else interimT += text;
      }
      if (finalT) setTranscript((prev) => (prev + ' ' + finalT).trim());
      setInterim(interimT);
    };
    r.onerror = (e) => {
      if (e.error !== 'no-speech') {
        toast.error(`Mic error: ${e.error}`);
      }
    };
    r.onend = () => {
      setRecording(false);
      setInterim('');
    };
    r.start();
    recognitionRef.current = r;
    setRecording(true);
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setRecording(false);
  };

  const goPrev = () => setQuestionIdx((i) => Math.max(0, i - 1));
  const goNext = () => setQuestionIdx((i) => Math.min(questions.length - 1, i + 1));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Voice Interview Practice</h3>
            <p className="text-xs text-gray-500">
              {jobTitle} · {companyName}
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Voice picker */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Interviewer voice
            </label>
            <div className="flex flex-wrap gap-2">
              {INTERVIEWER_VOICES.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVoice(v)}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    voice.id === v.id
                      ? 'border-sky-500 bg-sky-50 text-sky-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-sky-300'
                  }`}
                  type="button"
                >
                  <Volume2 className="h-3.5 w-3.5" />
                  <span className="font-medium">{v.name}</span>
                  <span className="text-xs text-gray-500">
                    · {v.gender === 'female' ? 'F' : 'M'}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500">{voice.vibe}</p>
          </div>

          {/* Question card */}
          {currentQuestion && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
              <div className="mb-3 flex items-center justify-between text-xs text-gray-500">
                <span>
                  Question {questionIdx + 1} of {questions.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={goPrev}
                    disabled={questionIdx === 0}
                    className="rounded p-1 hover:bg-gray-200 disabled:opacity-40"
                    aria-label="Previous question"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={goNext}
                    disabled={questionIdx === questions.length - 1}
                    className="rounded p-1 hover:bg-gray-200 disabled:opacity-40"
                    aria-label="Next question"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mb-4 text-base font-medium text-gray-900">{currentQuestion.question}</p>

              {/* Audio controls */}
              <div className="flex flex-wrap items-center gap-2">
                {!audioUrl ? (
                  <button
                    onClick={fetchAudio}
                    disabled={audioLoading}
                    className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                  >
                    {audioLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating voice…
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Hear question in {voice.name}&apos;s voice
                      </>
                    )}
                  </button>
                ) : (
                  <>
                    <audio
                      ref={audioRef}
                      src={audioUrl}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onEnded={() => setIsPlaying(false)}
                    />
                    <button
                      onClick={() => {
                        if (isPlaying) audioRef.current?.pause();
                        else audioRef.current?.play().catch(() => null);
                      }}
                      className="inline-flex items-center gap-2 rounded-lg border border-sky-300 bg-white px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="h-4 w-4" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          Replay
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>

              {error && (
                <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {error}
                  {error.includes('Upgrade') && (
                    <button
                      onClick={() => router.push('/pricing')}
                      className="ml-2 text-sm font-semibold underline"
                    >
                      View Plans
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Mic / answer */}
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900">Your answer</h4>
              <span className="text-xs text-gray-500">
                {transcript.split(/\s+/).filter(Boolean).length} words
              </span>
            </div>

            {!sttSupported && (
              <div className="mb-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                Speech-to-text not supported in this browser. Try Chrome or Edge — or just speak out
                loud and read the sample answer afterwards.
              </div>
            )}

            <div className="min-h-[88px] rounded-lg bg-gray-50 p-3 text-sm leading-relaxed text-gray-800">
              {transcript || (
                <span className="text-gray-400">
                  Press the mic and answer out loud. Your speech appears here in real time.
                </span>
              )}
              {interim && <span className="text-gray-500"> {interim}</span>}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {!recording ? (
                <button
                  onClick={startRecording}
                  disabled={!sttSupported}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Mic className="h-4 w-4" />
                  Start answering
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
                >
                  <MicOff className="h-4 w-4" />
                  Stop
                </button>
              )}
              <button
                onClick={() => {
                  setTranscript('');
                  setInterim('');
                }}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                type="button"
              >
                Clear
              </button>
              {currentQuestion?.sampleAnswer && (
                <button
                  onClick={() => setShowSampleAnswer((s) => !s)}
                  className="ml-auto rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  type="button"
                >
                  {showSampleAnswer ? 'Hide suggested approach' : 'Show suggested approach'}
                </button>
              )}
            </div>

            {showSampleAnswer && currentQuestion?.sampleAnswer && (
              <div className="mt-4 rounded-lg border border-sky-100 bg-sky-50 p-4 text-sm leading-relaxed text-gray-800">
                <p className="mb-1 text-xs font-semibold tracking-wide text-sky-700 uppercase">
                  Suggested approach
                </p>
                {currentQuestion.sampleAnswer}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t bg-gray-50 px-4 py-3 text-xs text-gray-500">
          <span>
            Powered by Microsoft Edge Neural voices · Speech-to-text via your browser&apos;s Web
            Speech API
          </span>
          <button onClick={onClose} className="text-sm font-medium text-gray-700 hover:underline">
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default InterviewVoiceModal;
