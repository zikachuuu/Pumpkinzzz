import React from 'react';

// Single source of truth for status colors across the entire app
export const STATUS_COLORS = {
  'valid': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'sub-valid': 'bg-amber-100 text-amber-800 border-amber-200',
  'invalid': 'bg-red-100 text-red-800 border-red-200',
  'completed': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'completed before deadline': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'completed after deadline': 'bg-orange-100 text-orange-700 border-orange-200',
  'on track': 'bg-teal-100 text-teal-700 border-teal-200',
  'urgent': 'bg-amber-100 text-amber-700 border-amber-200',
  'very urgent': 'bg-orange-100 text-orange-700 border-orange-200',
  'overdue': 'bg-red-100 text-red-700 border-red-200'
};

export default function StatusBadge({ status, count, typeLabel, textOverride }) {
  const normalizedStatus = status.toLowerCase();
  
  // Match color, default to gray if unknown
  const colorClass = STATUS_COLORS[normalizedStatus] || 'bg-gray-100 text-gray-600 border-gray-200';
  
  // Determine what text to display inside the capsule
  let displayText = textOverride || status.toUpperCase();
  if (count !== undefined) {
     displayText = `${count} ${typeLabel ? typeLabel.toUpperCase() + ' ' : ''}${status.toUpperCase()}`;
  }

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border inline-flex items-center whitespace-nowrap ${colorClass}`}>
      {displayText}
    </span>
  );
}