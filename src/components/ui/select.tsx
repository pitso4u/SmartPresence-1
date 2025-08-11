import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value?: SelectOption | null;
  defaultValue?: SelectOption | null;
  onChange?: (option: SelectOption) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const Select: React.FC<SelectProps> = ({
  options = [],
  value: controlledValue,
  defaultValue,
  onChange,
  placeholder = 'Select an option',
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState<SelectOption | null>(defaultValue || null);
  const selectRef = useRef<HTMLDivElement>(null);
  
  // Use controlled value if provided, otherwise use internal state
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleSelect = (option: SelectOption) => {
    if (onChange) {
      onChange(option);
    }
    if (controlledValue === undefined) {
      setInternalValue(option);
    }
    setIsOpen(false);
  };
  
  const displayValue = value ? value.label : placeholder;
  
  return (
    <div className={`relative ${className}`} ref={selectRef}>
      <button
        type="button"
        className={`w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-left focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-400'
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span className={`block truncate ${!value ? 'text-gray-500' : ''}`}>
          {displayValue}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm max-h-60 overflow-auto">
          {options.map((option) => (
            <div
              key={String(option.value)}
              className={`px-4 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                value && value.value === option.value ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
              }`}
              onClick={() => handleSelect(option)}
            >
              {option.label}
            </div>
          ))}
          {options.length === 0 && (
            <div className="px-4 py-2 text-sm text-gray-500">No options available</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Select;
