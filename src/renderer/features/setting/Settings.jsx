import React from 'react';
import { Calendar, Check, Clock, CalendarDays, RotateCcw } from 'lucide-react';
import { DATE_FORMATS, DEFAULT_URGENCY_SETTINGS, formatDate, getUrgencySettings, setUrgencySettings, getStartOfWeek, setStartOfWeek, resetPersistedSettings } from '../../utils/date';

export default function Settings({ dateFormat, onDateFormatChange }) {
  const [urgencySettings, setUrgencySettingsState] = React.useState(getUrgencySettings);
  const [startOfWeek, setStartOfWeekState] = React.useState(getStartOfWeek);

  const updateUrgencySetting = (key, value) => {
    const nextSettings = { ...urgencySettings, [key]: Math.max(0, Number(value) || 0) };
    setUrgencySettingsState(nextSettings);
    setUrgencySettings(nextSettings);
  };

  const handleStartOfWeekChange = (val) => {
    setStartOfWeekState(val);
    setStartOfWeek(val);
  };

  const handleResetSettings = () => {
    const defaultSettings = resetPersistedSettings();
    setUrgencySettingsState(defaultSettings.urgencySettings);
    setStartOfWeekState(defaultSettings.startOfWeek);
    onDateFormatChange(defaultSettings.dateFormat);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Settings</h2>
          <p className="text-sm text-gray-500 mt-1">Manage display preferences for the local workspace.</p>
        </div>
        <button
          type="button"
          onClick={handleResetSettings}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          <RotateCcw className="w-4 h-4" />
          Reset settings
        </button>
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

      {/* NEW: Start of Week Setting */}
      <section className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <CalendarDays className="w-5 h-5 text-indigo-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-gray-900">Start of Week</h3>
            <p className="text-xs text-gray-500 mt-1">Choose which day the week begins on for your Gantt Charts and Calendars.</p>
            <div className="mt-4 flex gap-3">
              {[
                { label: 'Sunday', value: 0 },
                { label: 'Monday', value: 1 }
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleStartOfWeekChange(opt.value)}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold transition ${startOfWeek === opt.value ? 'border-indigo-500 bg-indigo-50 text-indigo-900' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}
                >
                  {opt.label}
                  {startOfWeek === opt.value && <Check className="w-4 h-4 text-indigo-600" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-indigo-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-gray-900">Urgency</h3>
            <p className="text-xs text-gray-500 mt-1">Set the number of days remaining that marks a milestone or component procurement as urgent.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
              {[['Milestones', 'milestoneUrgentDays', 'milestoneVeryUrgentDays'], ['Components Procurement', 'componentUrgentDays', 'componentVeryUrgentDays']].map(([label, urgentKey, veryUrgentKey]) => (
                <div key={label} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-gray-800 mb-3">{label}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-xs font-semibold text-gray-600">Urgent (days)
                      <input type="number" min="0" value={urgencySettings[urgentKey] ?? DEFAULT_URGENCY_SETTINGS[urgentKey]} onChange={event => updateUrgencySetting(urgentKey, event.target.value)} className="mt-1 w-full rounded border border-gray-300 px-2 py-2 text-sm" />
                    </label>
                    <label className="text-xs font-semibold text-gray-600">Very urgent (days)
                      <input type="number" min="0" value={urgencySettings[veryUrgentKey] ?? DEFAULT_URGENCY_SETTINGS[veryUrgentKey]} onChange={event => updateUrgencySetting(veryUrgentKey, event.target.value)} className="mt-1 w-full rounded border border-gray-300 px-2 py-2 text-sm" />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}