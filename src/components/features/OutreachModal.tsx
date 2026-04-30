'use client';

import React, { useState } from 'react';
import { X, Loader2, Copy, Check, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { log } from '@/lib/log';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
  jobTitle?: string;
}

type Channel = 'linkedin_dm' | 'email_cold' | 'twitter_dm';
type Target = 'recruiter' | 'hiring_manager' | 'engineer' | 'founder';

const CHANNELS: { id: Channel; label: string }[] = [
  { id: 'linkedin_dm', label: 'LinkedIn DM' },
  { id: 'email_cold', label: 'Cold email' },
  { id: 'twitter_dm', label: 'X / Twitter DM' },
];

const TARGETS: { id: Target; label: string }[] = [
  { id: 'recruiter', label: 'Recruiter' },
  { id: 'hiring_manager', label: 'Hiring Manager' },
  { id: 'engineer', label: 'Engineer (coffee chat)' },
  { id: 'founder', label: 'Founder' },
];

const OutreachModal: React.FC<Props> = ({ isOpen, onClose, companyName, jobTitle }) => {
  const [channel, setChannel] = useState<Channel>('linkedin_dm');
  const [target, setTarget] = useState<Target>('recruiter');
  const [targetName, setTargetName] = useState('');
  const [customAngle, setCustomAngle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const generate = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/ai/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          jobTitle,
          channel,
          targetRole: target,
          targetName: targetName.trim() || undefined,
          customAngle: customAngle.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403) {
          toast.error('Upgrade to Pro to use outreach generator');
        } else if (res.status === 429) {
          toast.error('Daily AI limit reached');
        } else {
          toast.error(data.error || 'Failed to generate');
        }
        return;
      }
      setMessage(data.message);
    } catch (err) {
      log.error('outreach generate failed', err);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!message) return;
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Couldn't copy");
    }
  };

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
          <MessageSquare className="h-5 w-5 text-sky-500" />
          <h2 className="text-xl font-medium text-black">Outreach generator</h2>
        </div>
        <p className="mb-6 text-sm text-gray-500">
          Generate a personal cold message to{' '}
          <strong className="text-gray-900">{companyName}</strong>
          {jobTitle && (
            <>
              {' '}
              about <strong className="text-gray-900">{jobTitle}</strong>
            </>
          )}
          .
        </p>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Channel</label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as Channel)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-black focus:outline-none"
            >
              {CHANNELS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Target</label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value as Target)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-black focus:outline-none"
            >
              {TARGETS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Their name (optional)
          </label>
          <input
            type="text"
            value={targetName}
            onChange={(e) => setTargetName(e.target.value)}
            placeholder="e.g. Sarah"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-black focus:outline-none"
          />
        </div>

        <div className="mb-5">
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Personal angle (optional)
          </label>
          <input
            type="text"
            value={customAngle}
            onChange={(e) => setCustomAngle(e.target.value)}
            placeholder="e.g. We're both ex-Stripe / I read your blog post on..."
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-black focus:outline-none"
          />
        </div>

        <button
          onClick={generate}
          disabled={loading}
          className="mb-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-black text-sm font-medium text-white hover:bg-black/85 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Drafting...
            </>
          ) : (
            'Generate'
          )}
        </button>

        {message && (
          <div className="rounded-lg border border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
              <span className="text-xs font-medium text-gray-500">
                {CHANNELS.find((c) => c.id === channel)?.label} draft
              </span>
              <button
                onClick={copy}
                className="inline-flex items-center gap-1 text-xs text-gray-700 hover:text-black"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={Math.max(6, message.split('\n').length + 1)}
              className="w-full resize-none rounded-b-lg bg-gray-50 p-4 text-sm text-gray-900 focus:outline-none"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default OutreachModal;
