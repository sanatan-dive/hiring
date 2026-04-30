'use client';

import React from 'react';
import { Briefcase } from 'lucide-react';
import MatchCard from './MatchCard';
import type { Job } from './types';

interface UserContext {
  skills: string[];
  preferredLocations: string[];
  preferRemote: boolean;
  salaryMin?: number | null;
}

interface MatchesGridProps {
  jobs: Job[];
  savedJobs: string[];
  applications: Record<string, string>;
  userContext?: UserContext;
  onOpenJob: (job: Job) => void;
  onToggleSave: (jobId: string, e?: React.MouseEvent) => void;
  onHideJob?: (jobId: string, e?: React.MouseEvent) => void;
  onHideCompany?: (company: string, e?: React.MouseEvent) => void;
}

const MatchesGrid: React.FC<MatchesGridProps> = ({
  jobs,
  savedJobs,
  applications,
  userContext,
  onOpenJob,
  onToggleSave,
  onHideJob,
  onHideCompany,
}) => {
  return (
    <div className="space-y-4">
      {jobs && jobs.length > 0 ? (
        jobs.map((job, index) => (
          <MatchCard
            key={job.id}
            job={job}
            index={index}
            isSaved={savedJobs.includes(job.id)}
            applicationStatus={applications[job.id]}
            userContext={userContext}
            onOpen={onOpenJob}
            onToggleSave={onToggleSave}
            onHideJob={onHideJob}
            onHideCompany={onHideCompany}
          />
        ))
      ) : (
        <div className="rounded-xl border bg-white py-20 text-center">
          <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-full bg-gray-100 p-4">
              <Briefcase className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">No matches found yet</h3>
            <p className="mt-2 max-w-md text-gray-500">
              We&apos;re analyzing your profile against thousands of jobs. Check back soon for
              your personalized matches!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchesGrid;
