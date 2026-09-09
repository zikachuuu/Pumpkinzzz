import React from 'react';
import { Calendar, Check, Clock, CalendarDays, RotateCcw, Megaphone } from 'lucide-react';
import { DATE_FORMATS, DEFAULT_URGENCY_SETTINGS, formatDate, getUrgencySettings, setUrgencySettings, getStartOfWeek, setStartOfWeek, resetPersistedSettings } from '../../utils/date';

export default function Settings({ dateFormat, onDateFormatChange }) {
  const [urgencySettings, setUrgencySettingsState] = React.useState(getUrgencySettings);
  const [startOfWeek, setStartOfWeekState] = React.useState(getStartOfWeek);
  const [showVersionUpdateOnLaunch, setShowVersionUpdateOnLaunch] = React.useState(false);

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
    const shouldReset = window.confirm('Reset all saved settings to the default values?');
    if (!shouldReset) return;

    const defaultSettings = resetPersistedSettings();
    setUrgencySettingsState(defaultSettings.urgencySettings);
    setStartOfWeekState(defaultSettings.startOfWeek);
    setShowVersionUpdateOnLaunch(defaultSettings.showVersionUpdateOnLaunch);
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
            <h3 className="font-bold text-gray-900">Date Display Format</h3>
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

      {/* NEW: Show Version Update on Launch Toggle */}
      <section className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <Megaphone className="w-5 h-5 text-indigo-600 mt-0.5" />
          <div>
            <h3 className="font-bold text-gray-900">Show Version Update on Launch</h3>
          </div>
          <label className="relative ml-auto inline-flex shrink-0 items-center cursor-pointer mt-1">
            <input 
              type="checkbox" 
              checked={!!urgencySettings.showVersionUpdateOnLaunch} // Or pull from general settings if managed globally
              // We'll manage this cleanly through window.electronAPI.readSettings / writeSettings
              onChange={async (e) => {
                const val = e.target.checked;
                // Quick inline handler or state updater
                const currentSettings = await window.electronAPI.readSettings();
                await window.electronAPI.writeSettings({ ...currentSettings, showVersionUpdateOnLaunch: val });
                // Force state update reload if necessary or manage via props
              }}
              className="sr-only peer"
            />
            {/* Simple Tailwind Toggle Switch UI */}
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>
      </section>

    </div>
  );
}