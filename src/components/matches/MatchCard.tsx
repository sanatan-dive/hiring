'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Clock,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  DollarSign,
} from 'lucide-react';
import MatchScore from './MatchScore';
import type { Job } from './types';

interface MatchCardProps {
  job: Job;
  index: number;
  isSaved: boolean;
  applicationStatus?: string;
  onOpen: (job: Job) => void;
  onToggleSave: (jobId: string, e?: React.MouseEvent) => void;
}

const MatchCard: React.FC<MatchCardProps> = ({
  job,
  index,
  isSaved,
  applicationStatus,
  onOpen,
  onToggleSave,
}) => {
  return (
    <motion.div
      key={job.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => onOpen(job)}
      className="group cursor-pointer rounded-xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
              {job.title}
            </h3>
            <div className="flex gap-2">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 uppercase">
                {job.source}
              </span>
              {/* Application Status Badge */}
              {applicationStatus && (
                <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700 uppercase">
                  {applicationStatus}
                </span>
              )}
              {job.similarity !== undefined && <MatchScore similarity={job.similarity} />}
            </div>
          </div>
          <p className="mt-1 font-medium text-blue-600">{job.company}</p>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {job.location || 'Remote (Not Specified)'}
            </span>
            {job.salary && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                {job.salary}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {new Date(job.scrapedAt).toLocaleDateString()}
            </span>
          </div>

          <p className="mt-4 line-clamp-2 text-sm text-gray-600">
            {job.description ? job.description.replace(/<[^>]*>?/gm, '') : ''}
          </p>
        </div>

        <div className="ml-4 flex flex-col gap-2">
          <button
            onClick={(e) => onToggleSave(job.id, e)}
            className={`rounded-lg p-2 transition-colors ${
              isSaved
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {isSaved ? (
              <BookmarkCheck className="h-5 w-5" />
            ) : (
              <Bookmark className="h-5 w-5" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(job.url, '_blank');
            }}
            className="flex justify-center rounded-lg bg-blue-600 p-2 text-white transition-colors hover:bg-blue-700"
          >
            <ExternalLink className="h-5 w-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default MatchCard;
