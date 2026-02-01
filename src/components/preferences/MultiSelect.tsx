import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { X, Plus } from 'lucide-react';

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  maxItems?: number;
  className?: string;
  allowCustom?: boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selected,
  onChange,
  placeholder = 'Select options...',
  maxItems,
  className,
  allowCustom = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
    } else if (!maxItems || selected.length < maxItems) {
      onChange([...selected, value]);
    }
    setInputValue('');
  };

  const handleAddCustom = () => {
    if (inputValue.trim() && !selected.includes(inputValue.trim())) {
      if (!maxItems || selected.length < maxItems) {
        onChange([...selected, inputValue.trim()]);
        setInputValue('');
      }
    }
  };

  const handleRemove = (value: string) => {
    onChange(selected.filter((item) => item !== value));
  };

  const filteredOptions = options.filter(
    (option) =>
      option.toLowerCase().includes(inputValue.toLowerCase()) && !selected.includes(option)
  );

  return (
    <div className={cn('relative', className)}>
      {/* Selected Items */}
      <div className="mb-2 flex flex-wrap gap-2">
        {selected.map((item) => (
          <div
            key={item}
            className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700"
          >
            <span>{item}</span>
            <button
              onClick={() => handleRemove(item)}
              className="transition-colors hover:text-blue-900"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />

        {allowCustom && inputValue.trim() && !selected.includes(inputValue.trim()) && (
          <button
            onMouseDown={handleAddCustom}
            className="absolute top-1/2 right-2 -translate-y-1/2 transform p-1 text-blue-600 hover:text-blue-700"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (filteredOptions.length > 0 || (allowCustom && inputValue.trim())) && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {filteredOptions.map((option) => (
            <div
              key={option}
              onMouseDown={() => handleSelect(option)}
              className="cursor-pointer px-4 py-2 text-gray-900 transition-colors hover:bg-gray-100"
            >
              <div className="flex items-center justify-between">
                <span>{option}</span>
                {selected.includes(option) && <div className="h-4 w-4 rounded bg-blue-600" />}
              </div>
            </div>
          ))}

          {allowCustom &&
            inputValue.trim() &&
            !filteredOptions.includes(inputValue.trim()) &&
            !selected.includes(inputValue.trim()) && (
              <div
                onMouseDown={handleAddCustom}
                className="cursor-pointer border-t border-gray-100 px-4 py-2 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center text-blue-600">
                  <Plus className="mr-2 h-4 w-4" />
                  Add &quot;{inputValue.trim()}&quot;
                </div>
              </div>
            )}
        </div>
      )}

      {maxItems && (
        <p className="mt-1 text-xs text-gray-500">
          {selected.length}/{maxItems} selected
        </p>
      )}
    </div>
  );
};

export default MultiSelect;
