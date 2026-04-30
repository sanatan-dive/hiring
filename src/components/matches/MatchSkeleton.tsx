'use client';

import React from 'react';

const MatchSkeleton: React.FC = () => {
  return (
    <div className="flex justify-center py-20">
      <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600"></div>
    </div>
  );
};

export default MatchSkeleton;
