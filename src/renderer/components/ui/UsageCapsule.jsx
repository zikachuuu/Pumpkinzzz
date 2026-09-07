import React from 'react';
import { Link2, Link2Off } from 'lucide-react';

export default function UsageCapsule({ count, onClick }) {
  const inUse = count > 0;
  
  if (!inUse) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-gray-200 bg-gray-50 text-[10px] font-bold text-gray-500 cursor-default">
        <Link2Off className="w-3 h-3" />
        Not in Use
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation(); // Prevents triggering row clicks
        onClick();
      }}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-blue-200 bg-blue-50 text-[10px] font-bold text-blue-700 hover:bg-blue-100 transition-colors shadow-sm"
      title="Click to view associated projects"
    >
      <Link2 className="w-3 h-3" />
      In Use ({count})
    </button>
  );
}