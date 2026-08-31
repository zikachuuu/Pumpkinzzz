import React from 'react';
import { Check, Info } from 'lucide-react';

export default function LeadTimesTab({
    schedules,
    milestones,
    attachedComponents,
    leadTimeSettings,
    handleLeadTimeChange,
    handleSaveLeadTimes,
    scheduleValidity,
    getScheduleValidity,
    handleSaveLeadTimesForSchedule
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
            <h3 className="font-bold text-gray-900 text-lg">Procurement Lead Times of Each Schedules</h3>
            <p className="text-xs text-gray-500 mt-1">
                Specify the delivery lead time (in days) and the anchor milestone from which the countdown calculates.
            </p>
            </div>
            <button
            onClick={handleSaveLeadTimes}
                disabled={attachedComponents.length === 0 || schedules.length === 0}
                className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                >
                <Check className="w-4 h-4" />
                <span>Save for All Schedules</span>
            </button>
        </div>

        {attachedComponents.length === 0 || schedules.length === 0 ? (
            <div className="p-16 text-center text-gray-400">
            <Info className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="font-medium text-sm">
                Must have at least one schedule and one attached component to set lead times.
            </p>
            </div>
        ) : (
            <div className="space-y-8">
            {schedules.map(s => {
                // Fetch milestones of this schedule
                const schedMilestones = milestones.filter(m => m.schedule_id === s.id);
                const activeMilestones = schedMilestones.length > 0 ? schedMilestones : milestones;

                return (
                <div key={s.id} className="border border-gray-200 rounded-lg p-5 bg-gray-50/50 space-y-4">
                    <div className="flex items-center justify-between gap-3 border-b border-gray-200 pb-2">
                      <h4 className="font-bold text-gray-900 text-sm">
                          Schedule: <span className="text-indigo-700">{s.name}</span>
                      </h4>
                      
                      {/* 👇 Wrapped Badge and Button together 👇 */}
                      <div className="flex items-center space-x-3">
                        <span
                            title={getScheduleValidity(s).reason}
                            className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            getScheduleValidity(s).isValid
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}
                        >
                            {getScheduleValidity(s).isValid ? 'COMPLETE' : 'INCOMPLETE'}
                        </span>
                        
                        <button
                            onClick={() => handleSaveLeadTimesForSchedule(s.id)}
                            className="flex items-center space-x-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded text-xs font-bold transition"
                        >
                            <Check className="w-3.5 h-3.5" />
                            <span>Save for {s.name}</span>
                        </button>
                      </div>
                    </div>

                    {!getScheduleValidity(s).isValid && (
                    <p className="text-xs text-red-700">{getScheduleValidity(s).reason}</p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {attachedComponents.map(c => {
                        const key = `${c.id}-${s.id}`;
                        const setting = leadTimeSettings[key] || { anchor_id: '', lead_time: 0 };

                        return (
                        <div key={c.id} className="p-4 bg-white rounded-lg border border-gray-200 flex flex-col justify-between shadow-sm space-y-3">
                            <span className="font-bold text-sm text-gray-800">{c.name}</span>
                            <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase">Anchor Milestone</label>
                                <select
                                value={setting.anchor_id}
                                onChange={(e) => handleLeadTimeChange(c.id, s.id, 'anchor_id', e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 py-1.5 px-2 text-xs focus:border-indigo-500 focus:outline-none"
                                >
                                <option value="">ROS</option>
                                {activeMilestones.map(m => (
                                    <option key={m.id} value={m.id}>
                                    {m.name}
                                    </option>
                                ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase">Lead Time (Days)</label>
                                <input
                                type="number"
                                min="0"
                                value={setting.lead_time}
                                onChange={(e) => handleLeadTimeChange(c.id, s.id, 'lead_time', e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 py-1.5 px-2 text-xs focus:border-indigo-500 focus:outline-none"
                                />
                            </div>
                            </div>
                        </div>
                        );
                    })}
                    </div>
                </div>
                );
            })}
            </div>
        )}
    </div>
  );
}