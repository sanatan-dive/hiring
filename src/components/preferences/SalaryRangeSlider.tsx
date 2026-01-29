import React from 'react';
import { cn } from '@/lib/utils';

interface SalaryRangeSliderProps {
  min: number;
  max: number;
  value: { min: number; max: number };
  onChange: (value: { min: number; max: number }) => void;
  currency?: string;
  step?: number;
  className?: string;
}

const SalaryRangeSlider: React.FC<SalaryRangeSliderProps> = ({
  min,
  max,
  value,
  onChange,
  currency = '$',
  step = 5000,
  className
}) => {
  const [localMin, setLocalMin] = React.useState(value.min);
  const [localMax, setLocalMax] = React.useState(value.max);

  React.useEffect(() => {
    setLocalMin(value.min);
    setLocalMax(value.max);
  }, [value.min, value.max]);

  const handleMinChange = (newMin: number) => {
    const clampedMin = Math.max(min, Math.min(newMin, localMax - step));
    setLocalMin(clampedMin);
    onChange({ min: clampedMin, max: localMax });
  };

  const handleMaxChange = (newMax: number) => {
    const clampedMax = Math.min(max, Math.max(newMax, localMin + step));
    setLocalMax(clampedMax);
    onChange({ min: localMin, max: clampedMax });
  };

  const formatCurrency = (amount: number) => {
    return `${currency}${(amount / 1000).toFixed(0)}k`;
  };

  const minPercent = ((localMin - min) / (max - min)) * 100;
  const maxPercent = ((localMax - min) / (max - min)) * 100;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Display */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-700">
          <span className="text-gray-500">Min:</span> {formatCurrency(localMin)}
        </div>
        <div className="text-sm font-medium text-gray-700">
          <span className="text-gray-500">Max:</span> {formatCurrency(localMax)}
        </div>
      </div>

      {/* Slider */}
      <div className="relative pt-6">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 rounded -translate-y-1/2"></div>
        <div
          className="absolute top-1/2 h-1 bg-blue-600 rounded -translate-y-1/2"
          style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
        ></div>

        {/* Min Slider */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localMin}
          onChange={(e) => handleMinChange(parseInt(e.target.value))}
          className="absolute top-1/2 w-full h-5 opacity-0 cursor-pointer -translate-y-1/2 z-20"
          style={{ zIndex: 30 }}
        />

        {/* Max Slider */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localMax}
          onChange={(e) => handleMaxChange(parseInt(e.target.value))}
          className="absolute top-1/2 w-full h-5 opacity-0 cursor-pointer -translate-y-1/2 z-10"
        />

        {/* Thumb Handles */}
        <div
          className="absolute top-1/2 w-4 h-4 bg-white border-2 border-blue-600 rounded-full shadow -translate-y-1/2 z-30 pointer-events-none"
          style={{ left: `${minPercent}%` }}
        ></div>
        <div
          className="absolute top-1/2 w-4 h-4 bg-white border-2 border-blue-600 rounded-full shadow -translate-y-1/2 z-30 pointer-events-none"
          style={{ left: `${maxPercent}%` }}
        ></div>
      </div>

      {/* Quick Select Buttons */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Entry Level', range: { min: 40000, max: 70000 } },
          { label: 'Mid Level', range: { min: 70000, max: 120000 } },
          { label: 'Senior Level', range: { min: 120000, max: 180000 } },
          { label: 'Lead Level', range: { min: 180000, max: 250000 } }
        ].map(({ label, range }) => (
          <button
            key={label}
            onClick={() => onChange(range)}
            className="px-3 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SalaryRangeSlider;