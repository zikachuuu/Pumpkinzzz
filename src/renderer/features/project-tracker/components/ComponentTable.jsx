import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { formatDate } from '../../../utils/date';
import { calculateMilestoneDeadlines, calculateComponentDeadlines } from '../../../utils/scheduler';
import StatusBadge from '../../../components/ui/StatusBadge';

export default function ComponentTable({
  project, milestones, compScheds, allComponents, componentSort, setComponentSort,
  toggleTableSort, handleActualReceivedUpdate, sortRows, dateFormat, urgencySettings
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h4 className="font-bold text-gray-900 text-sm flex items-center space-x-2">
          <Clock className="w-4 h-4 text-indigo-600" />
          <span>Component Procurement Target Deadlines</span>
        </h4>
        <select
          value={componentSort.key}
          onChange={(e) => toggleTableSort(setComponentSort, e.target.value)}
          className="rounded border border-gray-300 bg-white px-2 py-1 text-xs"
          title="Sort component table"
        >
          <option value="name">Sort: Component</option>
          <option value="anchor">Sort: Anchor</option>
          <option value="lead_time">Sort: Lead time</option>
          <option value="latest">Sort: Latest order date</option>
          <option value="urgency">Sort: Urgency</option>
        </select>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-xs">
          <thead className="bg-gray-50 font-bold text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Component Name</th>
              <th className="px-4 py-3 text-left">Anchor Milestone</th>
              <th className="px-4 py-3 text-left">Lead Time (Days)</th>
              <th className="px-4 py-3 text-left">Latest Order Date</th>
              <th className="px-4 py-3 text-left">Actual Received Date</th>
              <th className="px-4 py-3 text-left">Urgency Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-gray-700">
            {(() => {
              // 👇 FIX 1: Pass theoretical project 👇
              const theoreticalProject = { ...project, actual_dates: '{}' };
              const deadlines = calculateMilestoneDeadlines(theoreticalProject, milestones);
              
              const receivedDates = typeof project.actual_received_dates === 'string'
                ? JSON.parse(project.actual_received_dates || '{}')
                : (project.actual_received_dates || {});
              const computedComps = calculateComponentDeadlines(deadlines, compScheds, allComponents, urgencySettings);

              if (computedComps.length === 0) {
                return (
                  <tr>
                    <td colSpan="6" className="px-4 py-6 text-center text-gray-400">
                      No component schedule configurations found for this schedule.
                    </td>
                  </tr>
                );
              }

              const urgencyColors = {
                'Overdue': 'text-red-700 bg-red-100 border-red-200',
                'Very Urgent': 'text-orange-700 bg-orange-100 border-orange-200',
                'Urgent': 'text-amber-700 bg-amber-100 border-amber-200',
                'On Track': 'text-emerald-700 bg-emerald-100 border-emerald-200',
                'Pending': 'text-gray-600 bg-gray-100 border-gray-200'
              };

              const sortedComponents = sortRows(computedComps.map(cc => ({ ...cc, anchor: milestones.find(m => m.id === cc.anchor_milestone_id)?.name, latest: cc.latest_order_date })), componentSort);
              
              return sortedComponents.map(cc => {
                const anchorM = milestones.find(m => m.id === cc.anchor_milestone_id);
                const receivedDate = receivedDates[cc.component_id] || '';
                const componentDeadline = cc.latest_order_date;
                
                const receivedStatus = receivedDate
                  ? receivedDate <= componentDeadline
                    ? 'Completed before deadline'
                    : 'Completed after deadline'
                  : cc.urgency;

                let badgeText = '';
                if (receivedDate && componentDeadline && componentDeadline !== '-') {
                  const daysDiff = Math.ceil((new Date(receivedDate) - new Date(componentDeadline)) / (1000 * 60 * 60 * 24));
                  if (daysDiff > 0) {
                     badgeText = `COMPLETED (AFTER DEADLINE BY ${daysDiff} DAYS)`;
                  } else {
                     badgeText = `COMPLETED (BEFORE DEADLINE BY ${Math.abs(daysDiff)} DAYS)`;
                  }
                } else if (!receivedDate && cc.days_until_need !== null) {
                  if (cc.days_until_need < 0) {
                     badgeText = `OVERDUE (BY ${Math.abs(cc.days_until_need)} DAYS)`;
                  } else {
                     badgeText = `${receivedStatus.toUpperCase()} (${cc.days_until_need} DAYS LEFT)`;
                  }
                } else {
                  badgeText = receivedStatus.toUpperCase();
                }

                return (
                  <tr key={cc.component_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">{cc.name}</td>
                    <td className="px-4 py-3 text-gray-500">{anchorM ? anchorM.name : 'ROS'}</td>
                    <td className="px-4 py-3 font-medium">{cc.lead_time} days</td>
                    <td className="px-4 py-3 font-bold text-indigo-700">{formatDate(cc.latest_order_date, dateFormat)}</td>
                    <td className="px-4 py-3">
                      <DateInputCell 
                        initialValue={receivedDate} 
                        onSave={(val) => handleActualReceivedUpdate(project.tag_no, cc.component_id, val)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge 
                        status={receivedStatus} 
                        textOverride={badgeText} 
                      />
                    </td>
                  </tr>
                );
              });

            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DateInputCell({ initialValue, onSave }) {
  const [value, setValue] = useState(initialValue || '');

  useEffect(() => {
    setValue(initialValue || '');
  }, [initialValue]);

  return (
    <input
      type="date"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        if (value !== (initialValue || '')) {
          onSave(value);
        }
      }}
      className={`px-2 py-1 border rounded text-xs focus:outline-none transition-colors ${
        value 
          ? 'border-emerald-300 text-emerald-700 bg-emerald-50 focus:border-emerald-500' 
          : 'border-gray-300 text-gray-700 focus:border-indigo-500 bg-white'
      }`}
    />
  );
}