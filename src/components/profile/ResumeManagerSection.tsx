'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { FileText, Trash2, Loader2, Plus } from 'lucide-react';

interface Resume {
  id: string;
  fileName: string;
  createdAt: string;
  parsedSkillsCount: number;
  parsedExperiencesCount: number;
}

interface ResumeManagerSectionProps {
  resumes: Resume[];
  plan: string; // FREE | PRO | ...
  onChange?: () => void;
}

const PLAN_RESUME_CAP: Record<string, number> = {
  FREE: 1,
  PRO: 3,
  PRO_PLUS: 5,
};

const ResumeManagerSection: React.FC<ResumeManagerSectionProps> = ({
  resumes,
  plan,
  onChange,
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const cap = PLAN_RESUME_CAP[plan] ?? 1;
  const usage = `${resumes.length} / ${cap}`;

  const removeResume = async (id: string, fileName: string) => {
    if (deletingId) return;
    if (!confirm(`Delete ${fileName}?`)) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/resume/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      toast.success('Resume deleted');
      onChange?.();
    } catch {
      toast.error("Couldn't delete resume");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-black">
          <FileText className="h-5 w-5 text-sky-600" />
          Resumes
          <span className="ml-2 text-sm font-normal text-gray-500">({usage})</span>
        </h2>
        {resumes.length < cap && (
          <a
            href="/onboard"
            className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700"
          >
            <Plus className="h-4 w-4" />
            Upload another
          </a>
        )}
      </div>

      {resumes.length === 0 ? (
        <p className="text-sm text-gray-500">
          No resumes uploaded yet.{' '}
          <a href="/onboard" className="text-sky-600 underline">
            Upload one →
          </a>
        </p>
      ) : (
        <div className="space-y-3">
          {resumes.map((r, idx) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-4 rounded-lg border bg-gray-50 p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium text-gray-900">{r.fileName}</span>
                  {idx === 0 && (
                    <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                      Active
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {r.parsedSkillsCount} skills · {r.parsedExperiencesCount} experiences ·{' '}
                  uploaded {new Date(r.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => removeResume(r.id, r.fileName)}
                disabled={deletingId === r.id}
                className="text-red-500 hover:text-red-600 disabled:opacity-50"
                title="Delete resume"
              >
                {deletingId === r.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          ))}
          <p className="text-xs text-gray-400">
            The most recent resume is used for matching. Delete to switch which one drives your
            digest.
          </p>
        </div>
      )}
    </section>
  );
};

export default ResumeManagerSection;
