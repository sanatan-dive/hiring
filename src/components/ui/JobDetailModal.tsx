'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  ExternalLink,
  Bookmark,
  CheckCircle,
  Clock,
  X,
  BookmarkCheck,
  DollarSign,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string | null;
  salary: string | null;
  description: string | null;
  url: string;
  source: string;
  techStack?: string[];
  scrapedAt: string;
  similarity?: number;
}

interface JobDetailModalProps {
  job: Job;
  isOpen: boolean;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (e: React.MouseEvent) => void;
  applicationStatus?: string; // 'pending' | 'applied' | 'interview' | 'rejected' | null
  onUpdateStatus: (status: string) => void;
}

const statusOptions = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'applied', label: 'Applied', color: 'bg-blue-100 text-blue-800' },
  { value: 'interview', label: 'Interview', color: 'bg-purple-100 text-purple-800' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
  { value: 'offered', label: 'Offered', color: 'bg-green-100 text-green-800' },
];

export default function JobDetailModal({
  job,
  isOpen,
  onClose,
  isSaved,
  onToggleSave,
  applicationStatus,
  onUpdateStatus,
}: JobDetailModalProps) {
  const [currentStatus, setCurrentStatus] = useState(applicationStatus || 'pending');

  const handleStatusChange = (newStatus: string) => {
    setCurrentStatus(newStatus);
    onUpdateStatus(newStatus);
    toast.success(`Status updated to ${newStatus}`);
  };

  const handleApply = () => {
    window.open(job.url, '_blank');
    if (currentStatus === 'pending' || !currentStatus) {
      handleStatusChange('applied');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b p-6 pb-4">
            <div className="flex items-start gap-4">
              {/* Logo Placeholder */}
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gray-100 text-2xl font-bold text-gray-400">
                {job.company.charAt(0)}
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900">{job.title}</h2>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-medium text-blue-600">{job.company}</span>
                  <span className="text-gray-300">•</span>
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="h-3 w-3" />
                    {new Date(job.scrapedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Body - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Quick Stats Grid */}
            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="mb-1 flex items-center gap-2 text-gray-500">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm font-medium">Location</span>
                </div>
                <p className="font-semibold text-gray-900">
                  {job.location || 'Remote (Not Specified)'}
                </p>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="mb-1 flex items-center gap-2 text-gray-500">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm font-medium">Salary</span>
                </div>
                <p className="font-semibold text-gray-900">{job.salary || 'Not disclosed'}</p>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="mb-1 flex items-center gap-2 text-gray-500">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Match Score</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-green-500"
                      style={{ width: `${(job.similarity || 0) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-green-600">
                    {Math.round((job.similarity || 0) * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h3 className="mb-3 text-lg font-bold text-gray-900">About the Role</h3>
              <div className="prose prose-blue max-w-none text-gray-600">
                <p className="leading-relaxed whitespace-pre-line">{job.description}</p>
              </div>
            </div>

            {/* Tech Stack / Skills (If available) */}
            {job.techStack && job.techStack.length > 0 && (
              <div className="mb-8">
                <h3 className="mb-3 text-lg font-bold text-gray-900">Skills & Tech Stack</h3>
                <div className="flex flex-wrap gap-2">
                  {job.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer - Actions */}
          <div className="flex flex-col items-center justify-between gap-4 border-t bg-gray-50 p-4 md:flex-row md:px-6 md:py-4">
            {/* Status Dropdown */}
            <div className="flex w-full items-center gap-3 md:w-auto">
              <span className="text-sm font-medium text-gray-600">Status:</span>
              <select
                value={currentStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                className={`rounded-lg border-gray-300 py-2 pr-8 pl-3 text-sm focus:border-blue-500 focus:ring-blue-500 ${
                  statusOptions.find((o) => o.value === currentStatus)?.color
                }`}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex w-full items-center gap-3 md:w-auto">
              <button
                onClick={onToggleSave}
                className={`flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 font-medium transition-colors md:w-auto ${
                  isSaved
                    ? 'border-blue-200 bg-blue-50 text-blue-600'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {isSaved ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
                {isSaved ? 'Saved' : 'Save'}
              </button>

              <button
                onClick={handleApply}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-black px-6 py-2.5 font-medium text-white transition-opacity hover:opacity-90 md:w-auto"
              >
                Apply Now
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
