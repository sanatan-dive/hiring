import React from 'react';
import { cn } from '@/lib/utils';

interface RadioGroupProps {
  options: { value: string; label: string; description?: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
}

const RadioGroup: React.FC<RadioGroupProps> = ({
  options,
  value,
  onChange,
  className,
  orientation = 'vertical',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'text-sm p-3',
    md: 'text-base p-4',
    lg: 'text-lg p-5',
  };

  return (
    <div
      className={cn(
        'space-y-2',
        orientation === 'horizontal' && 'flex flex-wrap gap-2 space-y-0',
        className
      )}
    >
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            'relative flex cursor-pointer items-center rounded-lg border border-gray-200 transition-all duration-200 hover:border-blue-300 hover:bg-blue-100',
            sizeClasses[size],
            value === option.value && 'border-blue-500 bg-blue-100',
            orientation === 'horizontal' && 'min-w-0 flex-1'
          )}
        >
          <input
            type="radio"
            name="radio-group"
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="sr-only"
          />

          <div className="flex flex-1 items-center space-x-3">
            <div
              className={cn(
                'flex h-4 w-4 items-center justify-center rounded-full border-2 transition-colors',
                value === option.value ? 'border-blue-600' : 'border-gray-400'
              )}
            >
              {value === option.value && <div className="h-2 w-2 rounded-full bg-blue-600"></div>}
            </div>

            <div className="flex-1">
              <div
                className={cn(
                  'font-medium',
                  value === option.value ? 'text-blue-900' : 'text-gray-900'
                )}
              >
                {option.label}
              </div>
              {option.description && (
                <div
                  className={cn(
                    'mt-0.5 text-sm',
                    value === option.value ? 'text-blue-700' : 'text-gray-600'
                  )}
                >
                  {option.description}
                </div>
              )}
            </div>
          </div>
        </label>
      ))}
    </div>
  );
};

export default RadioGroup;
