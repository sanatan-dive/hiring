'use client';

import React, { useEffect, useState } from 'react';
import { TrendingUp, Loader2 } from 'lucide-react';

interface InsightsData {
  jobSalary: { min: number; max: number; currency: string; formatted: string } | null;
  cohort: {
    sampleSize: number;
    roleFamily: string;
    isRemote: boolean;
    p25: number;
    p50: number;
    p75: number;
    formattedRange: string;
    yourPosition: number | null;
  } | null;
  message?: string;
}

interface Props {
  jobId: string;
}

const SalaryInsights: React.FC<Props> = ({ jobId }) => {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/jobs/salary-insights?jobId=${encodeURIComponent(jobId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [jobId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Computing salary insights…
      </div>
    );
  }

  if (!data) return null;

  if (!data.cohort) {
    if (!data.jobSalary) return null;
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
          <TrendingUp className="h-4 w-4 text-sky-500" />
          Listed: {data.jobSalary.formatted}
        </div>
        {data.message && <p className="mt-1 text-xs text-gray-500">{data.message}</p>}
      </div>
    );
  }

  const c = data.cohort;
  const positionLabel =
    c.yourPosition === null
      ? null
      : c.yourPosition >= 75
        ? 'Top 25%'
        : c.yourPosition >= 50
          ? 'Above median'
          : c.yourPosition >= 25
            ? 'Below median'
            : 'Bottom 25%';
  const positionColor =
    c.yourPosition === null
      ? 'text-gray-500'
      : c.yourPosition >= 75
        ? 'text-emerald-700'
        : c.yourPosition >= 50
          ? 'text-sky-700'
          : c.yourPosition >= 25
            ? 'text-amber-700'
            : 'text-rose-700';

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-sky-500" />
        <h3 className="text-sm font-medium text-gray-900">Salary insights</h3>
        <span className="ml-auto text-xs text-gray-400">
          based on {c.sampleSize} {c.roleFamily} {c.isRemote ? 'remote' : 'onsite'} roles
        </span>
      </div>

      {data.jobSalary && (
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs text-gray-500">This job</span>
          <span className="text-sm font-medium text-gray-900">{data.jobSalary.formatted}</span>
        </div>
      )}

      <div className="space-y-1">
        <Row label="25th percentile" value={`$${(c.p25 / 1000).toFixed(0)}k`} />
        <Row label="Median" value={`$${(c.p50 / 1000).toFixed(0)}k`} highlight />
        <Row label="75th percentile" value={`$${(c.p75 / 1000).toFixed(0)}k`} />
      </div>

      {positionLabel && (
        <div className={`mt-3 rounded-md bg-gray-50 px-3 py-2 text-xs ${positionColor}`}>
          <strong>{positionLabel}</strong> of comparable roles ({c.yourPosition}th percentile)
        </div>
      )}
    </div>
  );
};

const Row = ({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) => (
  <div
    className={`flex items-center justify-between text-sm ${highlight ? 'font-medium text-gray-900' : 'text-gray-600'}`}
  >
    <span>{label}</span>
    <span>{value}</span>
  </div>
);

export default SalaryInsights;
