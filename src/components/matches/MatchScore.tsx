'use client';

import React from 'react';

interface MatchScoreProps {
  similarity: number;
}

const MatchScore: React.FC<MatchScoreProps> = ({ similarity }) => {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold text-white uppercase ${
        similarity > 0.85
          ? 'bg-green-600'
          : similarity > 0.7
            ? 'bg-emerald-500'
            : 'bg-blue-500'
      }`}
    >
      {Math.round(similarity * 100)}% Match
    </span>
  );
};

export default MatchScore;
