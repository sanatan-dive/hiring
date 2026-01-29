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
  placeholder = "Select options...",
  maxItems,
  className,
  allowCustom = false
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(item => item !== value));
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
    onChange(selected.filter(item => item !== value));
  };

  const filteredOptions = options.filter(option => 
    option.toLowerCase().includes(inputValue.toLowerCase()) &&
    !selected.includes(option)
  );

  return (
    <div className={cn("relative", className)}>
      {/* Selected Items */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selected.map((item) => (
          <div
            key={item}
            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
          >
            <span>{item}</span>
            <button
              onClick={() => handleRemove(item)}
              className="hover:text-blue-900 transition-colors"
            >
              <X className="w-3 h-3" />
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
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        
        {allowCustom && inputValue.trim() && !selected.includes(inputValue.trim()) && (
          <button
            onMouseDown={handleAddCustom}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-blue-600 hover:text-blue-700"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (filteredOptions.length > 0 || (allowCustom && inputValue.trim())) && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {filteredOptions.map((option) => (
            <div
              key={option}
              onMouseDown={() => handleSelect(option)}
              className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between">
                <span>{option}</span>
                {selected.includes(option) && (
                  <div className="w-4 h-4 bg-blue-600 rounded" />
                )}
              </div>
            </div>
          ))}
          
          {allowCustom && inputValue.trim() && !filteredOptions.includes(inputValue.trim()) && !selected.includes(inputValue.trim()) && (
            <div
              onMouseDown={handleAddCustom}
              className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors border-t border-gray-100"
            >
              <div className="flex items-center text-blue-600">
                <Plus className="w-4 h-4 mr-2" />
                Add &quot;{inputValue.trim()}&quot;
              </div>
            </div>
          )}
        </div>
      )}
      
      {maxItems && (
        <p className="text-xs text-gray-500 mt-1">
          {selected.length}/{maxItems} selected
        </p>
      )}
    </div>
  );
};

export default MultiSelect;