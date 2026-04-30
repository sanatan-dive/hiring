'use client';

import React, { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';

interface Props {
  initialDailyStreak?: number;
  initialLongestStreak?: number;
}

const StreakWidget: React.FC<Props> = ({
  initialDailyStreak = 0,
  initialLongestStreak = 0,
}) => {
  const [daily, setDaily] = useState(initialDailyStreak);
  const [longest, setLongest] = useState(initialLongestStreak);

  // Idempotent activity ping on mount — no-op if already counted today
  useEffect(() => {
    fetch('/api/user/activity', { method: 'POST' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && typeof d.dailyStreak === 'number') {
          setDaily(d.dailyStreak);
          setLongest(d.longestStreak);
        }
      })
      .catch(() => void 0);
  }, []);

  const isHot = daily >= 7;

  return (
    <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Flame
            className={`h-6 w-6 ${isHot ? 'text-orange-500' : 'text-gray-400'}`}
            fill={isHot ? 'currentColor' : 'none'}
          />
          <div>
            <div className="text-sm text-gray-500">Current streak</div>
            <div className="text-3xl font-medium text-black">
              {daily}{' '}
              <span className="text-base font-normal text-gray-500">
                {daily === 1 ? 'day' : 'days'}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Longest</div>
          <div className="text-xl font-medium text-gray-700">{longest}</div>
        </div>
      </div>
      {daily === 0 ? (
        <p className="mt-3 text-xs text-gray-500">
          Check in daily to start a streak. Just opening Hirin&apos; counts.
        </p>
      ) : daily < 7 ? (
        <p className="mt-3 text-xs text-gray-500">
          {7 - daily} more day{7 - daily === 1 ? '' : 's'} to ignite a hot streak.
        </p>
      ) : (
        <p className="mt-3 text-xs text-orange-700">
          You&apos;re on fire. Keep showing up.
        </p>
      )}
    </section>
  );
};

export default StreakWidget;
