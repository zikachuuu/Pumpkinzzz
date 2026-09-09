import React, { useState } from 'react';
import { Plus, Trash2, Calendar, Layers } from 'lucide-react';
import MilestoneTimeline from '../components/MilestoneTimeline'; 
import MilestoneTree from '../components/MilestoneTree';
import MilestoneRecords from '../components/MilestoneRecords';
import UsageCapsule from '../../../components/ui/UsageCapsule.jsx';

export default function SchedulesTab({
  schedules,
  selectedSchedule,
  milestones,
  scheduleValidity,
  handleSelectSchedule,
  handleDeleteSchedule,
  handleDeleteMilestone,
  setShowAddScheduleModal,
  handleOpenMilestoneModal,
  openUsageModal, 
}) {

  const [scheduleSubView, setScheduleSubView] = useState('tree'); 

  const getScheduleValidity = (schedule) => scheduleValidity[schedule.id] || {
    isValid: false,
    reason: 'Lead-time status is loading.'
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm flex flex-col h-fit">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 text-md">Schedules</h3>
          <button
            onClick={() => setShowAddScheduleModal(true)}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-xs font-semibold shadow transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Schedule</span>
          </button>
        </div>

        {schedules.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            No schedules defined. Add one to get started.
          </div>
        ) : (
          <div className="space-y-2">
            {schedules.map(s => (
              <div
                key={s.id}
                onClick={() => handleSelectSchedule(s)}
                className={`p-3.5 rounded-lg border text-sm font-semibold flex items-center justify-between cursor-pointer transition ${
                  selectedSchedule && selectedSchedule.id === s.id
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                  : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span className="min-w-0 truncate">{s.name}</span>
                
                <div className="flex items-center space-x-3">
                  <UsageCapsule 
                    count={s.in_use_count} 
                    onClick={() => openUsageModal('schedule', s.id, s.name)} 
                  />

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

                  <span
                    title={s.in_use_count > 0 ? 'Currently in use schedule cannot be deleted.' : 'Delete Schedule'}
                    className={`relative inline-flex group ${s.in_use_count > 0 ? 'cursor-not-allowed' : ''}`}
                  >
                    {s.in_use_count > 0 && (
                      <span
                        role="tooltip"
                        className="pointer-events-none absolute right-0 bottom-full z-50 mb-2 hidden w-40 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-center text-[11px] font-semibold leading-tight text-red-700 shadow-lg group-hover:block"
                      >
                        Schedule is in use!
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (s.in_use_count > 0) return; 
                        handleDeleteSchedule(s.id, s.name);
                      }}
                      aria-disabled={s.in_use_count > 0}
                      title={s.in_use_count > 0 ? 'Currently in use schedule cannot be deleted.' : 'Delete Schedule'}
                      className={`p-1 rounded transition-colors ${
                      s.in_use_count > 0 
                        ? 'text-gray-300 cursor-not-allowed' 
                        : 'text-gray-400 hover:text-red-600 hover:bg-white'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>    
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        {!selectedSchedule ? (
          <div className="p-16 text-center text-gray-400">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="font-medium text-sm">Select a schedule from the list to manage milestones.</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-gray-100 pb-4">
              <div className="flex-1 md:pr-8">
                <h3 className="font-bold text-gray-900 text-lg">
                  Milestones of Schedule: {selectedSchedule.name}
                </h3>
                <p className="text-sm text-gray-800 mt-3">
                  All schedules consists of 2 default milestones: <span className="font-semibold">Contract Signed</span> and <span className="font-semibold">ROS</span>.
                </p>
                <p className="text-sm text-gray-800 mt-2">
                  Create additional milestones and define their relationships (in terms of offset days) to the default milestones or other milestones in this schedule.
                </p>
              </div>
              <button
                onClick={() => handleOpenMilestoneModal(null)}
                className="flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-xs font-bold shadow-sm transition shrink-0 whitespace-nowrap"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>New Milestone</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              {[
                ['tree', 'Relationship Tree'],
                ['timeline', 'Chronological Timeline'],
                ['records', 'Master Records']
              ].map(([view, label]) => (
                <button
                  key={view}
                  onClick={() => setScheduleSubView(view)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition ${
                    scheduleSubView === view
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {scheduleSubView === 'tree' && (
              <div>
                <h4 className="font-semibold text-gray-800 text-sm mb-4 flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  <span>Milestone Relationship Tree Diagram</span>
                </h4>
                <MilestoneTree 
                  milestones={milestones}
                  handleOpenMilestoneModal={handleOpenMilestoneModal}
                  handleDeleteMilestone={handleDeleteMilestone}
                />
              </div>
            )}

            {scheduleSubView === 'timeline' && (
              <MilestoneTimeline 
                milestones={milestones} 
                handleOpenMilestoneModal={handleOpenMilestoneModal}
                handleDeleteMilestone={handleDeleteMilestone}
              />
            )}

            {scheduleSubView === 'records' && (
              <div>
                <h4 className="font-semibold text-gray-800 text-sm mb-3">Milestone Master Records</h4>
                <MilestoneRecords 
                  milestones={milestones}
                  handleOpenMilestoneModal={handleOpenMilestoneModal}
                  handleDeleteMilestone={handleDeleteMilestone}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}