import React from 'react';
import { Calendar, Check } from 'lucide-react';
import { DATE_FORMATS, formatDate } from '../utils/date';

export default function Settings({ dateFormat, onDateFormatChange }) {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Manage display preferences for the local workspace.</p>
      </div>
      <section className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-indigo-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-gray-900">Date display format</h3>
            <p className="text-xs text-gray-500 mt-1">Dates shown in lists, timelines, and project details use this format.</p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(DATE_FORMATS).map(([key, format]) => (
                <button
                  key={format}
                  type="button"
                  onClick={() => onDateFormatChange(format)}
                  className={`flex items-center justify-between rounded-lg border p-3 text-left transition ${dateFormat === format ? 'border-indigo-500 bg-indigo-50 text-indigo-900' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}
                >
                  <span>
                    <span className="block text-sm font-semibold">{format}</span>
                    <span className="block text-xs text-gray-500 mt-1">Example: {formatDate('2026-08-26', format)}</span>
                  </span>
                  {dateFormat === format && <Check className="w-4 h-4 text-indigo-600" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
