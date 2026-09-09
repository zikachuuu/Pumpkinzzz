import React from 'react';
import { Info } from 'lucide-react';

export default function VersionUpdate() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Version Updates</h2>
          <p className="text-sm text-gray-500 mt-1">Review the latest features, improvements, and bug fixes.</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">beta v1.0.0</h3>
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mt-0.5">Current Version</p>
            </div>
          </div>
          <div className="text-sm font-semibold text-gray-500">
            {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
        <div className="p-6">
          <p className="text-gray-700 text-sm font-medium">Beta app launched.</p>
        </div>
      </div>
    </div>
  );
}