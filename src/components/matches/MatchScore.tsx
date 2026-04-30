'use client';

import React from 'react';

interface MatchScoreProps {
  similarity: number;
}

const MatchScore: React.FC<MatchScoreProps> = ({ similarity }) => {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold text-white uppercase ${
        similarity >= 0.8 ? 'bg-emerald-500' : similarity >= 0.65 ? 'bg-amber-500' : 'bg-rose-500'
      }`}
    >
      {Math.round(similarity * 100)}% Match
    </span>
  );
};

export default MatchScore;
