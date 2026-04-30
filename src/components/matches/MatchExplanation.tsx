'use client';

import React from 'react';
import { Check } from 'lucide-react';
import type { Job } from './types';

interface UserContext {
  skills: string[]; // user.skills + parsedSkills, lowercased
  preferredLocations: string[]; // lowercased
  preferRemote: boolean;
  salaryMin?: number | null;
}

interface MatchExplanationProps {
  job: Job;
  user: UserContext;
}

function parseSalaryFloor(salary: string | null | undefined): number | null {
  if (!salary) return null;
  const m = salary.match(/(\d{2,7})/);
  return m ? parseInt(m[1], 10) : null;
}

const MatchExplanation: React.FC<MatchExplanationProps> = ({ job, user }) => {
  const desc = (job.description ?? '').toLowerCase();
  const title = (job.title ?? '').toLowerCase();
  const haystack = `${title} ${desc}`;

  const skillOverlap = Array.from(
    new Set(user.skills.filter((s) => s && haystack.includes(s)))
  ).slice(0, 5);

  const jobLocation = (job.location ?? '').toLowerCase();
  const isRemote = jobLocation.includes('remote');
  const locationMatch =
    (user.preferRemote && isRemote) ||
    user.preferredLocations.some((loc) => loc && jobLocation.includes(loc));

  const salaryFloor = parseSalaryFloor(job.salary);
  const salaryMatch =
    user.salaryMin && salaryFloor ? salaryFloor >= user.salaryMin : Boolean(job.salary);

  // Show only if we have at least one signal — keeps the UI clean
  const signals = [
    skillOverlap.length > 0 && (
      <span key="s">
        ✓ Skills match: <b>{skillOverlap.join(', ')}</b>
      </span>
    ),
    locationMatch && <span key="l">✓ Location matches your preferences</span>,
    salaryMatch && <span key="$">✓ Salary in your range</span>,
  ].filter(Boolean);

  if (signals.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
      {signals.map((s, i) => (
        <span key={i} className="inline-flex items-center gap-1">
          <Check className="h-3 w-3 text-green-600" />
          {s}
        </span>
      ))}
    </div>
  );
};

export default MatchExplanation;
