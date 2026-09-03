import React, { useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

export default function ChecklistFilter({ label, options, selected, onChange, isOpen, onToggle, className = 'w-full' }) {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        if (isOpen) onToggle(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onToggle]);

  const selectedArray = Array.isArray(selected) ? selected : [];
  const allSelected = options.length > 0 && selectedArray.length === options.length;

  const toggleValue = (value) => {
    if (selectedArray.includes(value)) onChange(selectedArray.filter(item => item !== value));
    else onChange([...selectedArray, value]);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button type="button" onClick={() => onToggle(!isOpen)} className={`flex w-full cursor-pointer items-center justify-between rounded border bg-white px-2 py-1.5 text-xs transition-colors focus:outline-none ${isOpen ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-300 hover:border-gray-400'}`}>
        <span className="whitespace-nowrap text-gray-700">
          <span className="font-semibold">{allSelected ? 'All' : `${selectedArray.length} selected`}</span>
        </span>
        <ChevronDown className={`ml-2 h-4 w-4 shrink-0 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white p-2 shadow-xl">
          <button type="button" onClick={() => onChange(allSelected ? [] : options.map(o => o.value))} className="mb-2 w-full rounded px-2 py-1.5 text-left text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-colors">
            {allSelected ? 'Unselect all' : 'Select all'}
          </button>
          {options.length === 0 ? (
            <p className="px-2 py-2 text-xs text-gray-400">No options</p>
          ) : options.map(option => (
            <label key={option.value} className="flex cursor-pointer items-start gap-2 rounded px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
              <input type="checkbox" checked={selectedArray.includes(option.value)} onChange={() => toggleValue(option.value)} className="mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="leading-tight">{option.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}