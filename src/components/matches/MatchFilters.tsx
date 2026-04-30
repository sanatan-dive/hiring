'use client';

import React from 'react';

export type FilterKey = 'all' | 'remote' | 'high' | 'unviewed' | 'applied';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'remote', label: 'Remote only' },
  { key: 'high', label: '80%+ match' },
  { key: 'unviewed', label: 'New' },
  { key: 'applied', label: 'Applied' },
];

interface MatchFiltersProps {
  active: FilterKey;
  onChange: (k: FilterKey) => void;
  total?: number;
}

const MatchFilters: React.FC<MatchFiltersProps> = ({ active, onChange, total }) => {
  return (
    <div className="mb-4 flex items-center gap-2 overflow-x-auto py-2">
      {FILTERS.map((f) => (
        <button
          key={f.key}
          onClick={() => onChange(f.key)}
          className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            active === f.key
              ? 'bg-black text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {f.label}
        </button>
      ))}
      {typeof total === 'number' && (
        <span className="ml-auto text-xs text-gray-400">{total} match{total === 1 ? '' : 'es'}</span>
      )}
    </div>
  );
};

export default MatchFilters;
