'use client';

import React from 'react';
import { Search, RefreshCw } from 'lucide-react';

interface MatchesHeaderProps {
  query: string;
  isRefreshing: boolean;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  onRefresh: () => void;
  onDeepScrape: () => void;
}

const MatchesHeader: React.FC<MatchesHeaderProps> = ({
  query,
  isRefreshing,
  onQueryChange,
  onSearch,
  onRefresh,
  onDeepScrape,
}) => {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Job Matches</h1>
        <p className="mt-1 text-gray-500">Jobs that match your preferences</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 shadow-sm">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            placeholder="Job role..."
            className="w-32 text-sm outline-none md:w-48"
          />
        </div>
        <button
          onClick={onSearch}
          className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          Search
        </button>
        <button
          onClick={onRefresh}
          disabled={isRefreshing || !query}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Finding...' : 'Find New Jobs'}
        </button>
        <button
          onClick={onDeepScrape}
          className="flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-4 py-2 text-purple-700 hover:bg-purple-100"
        >
          <div className="flex h-2 w-2 animate-pulse rounded-full bg-purple-500" />
          Deep Scrape
        </button>
      </div>
    </div>
  );
};

export default MatchesHeader;
