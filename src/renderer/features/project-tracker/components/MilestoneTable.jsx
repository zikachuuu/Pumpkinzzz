import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { formatDate } from '../../../utils/date';
import { calculateMilestoneDeadlines } from '../../../utils/scheduler';
import StatusBadge from '../../../components/ui/StatusBadge';

export default function MilestoneTable({
  project, milestones, milestoneSort, setMilestoneSort, toggleTableSort,
  handleActualDateUpdate, getMilestoneStatus, sortRows, dateFormat
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h4 className="font-bold text-gray-900 text-sm flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-indigo-600" />
          <span>Milestones Target Deadlines</span>
        </h4>
        <select
          value={milestoneSort.key}
          onChange={(e) => toggleTableSort(setMilestoneSort, e.target.value)}
          className="rounded border border-gray-300 bg-white px-2 py-1 text-xs"
          title="Sort milestone table"
        >
          <option value="name">Sort: Milestone</option>
          <option value="anchor">Sort: Anchor</option>
          <option value="target">Sort: Target date</option>
          <option value="actual">Sort: Actual date</option>
          <option value="statusText">Sort: Status</option>
        </select>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-xs">
          <thead className="bg-gray-50 font-bold text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Milestone</th>
              <th className="px-4 py-3 text-left">Anchor Basis</th>
              <th className="px-4 py-3 text-left">Targeted Deadline</th>
              <th className="px-4 py-3 text-left">Actual Completion Date</th>
              <th className="px-4 py-3 text-left">Status / Countdown</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-gray-700">
            {(() => {
              // 👇 FIX 1: Pass a theoretical project to the scheduler so targets NEVER shift 👇
              const theoreticalProject = { ...project, actual_dates: '{}' };
              const deadlines = calculateMilestoneDeadlines(theoreticalProject, milestones);
              
              const actuals = typeof project.actual_dates === 'string'
                ? JSON.parse(project.actual_dates || '{}')
                : (project.actual_dates || {});
              const today = new Date().toISOString().split('T')[0];

              const sortedMilestones = sortRows(milestones.map(m => ({
                ...m,
                anchor: milestones.find(a => a.id === m.anchor_id)?.name,
                target: deadlines[m.id],
                actual: actuals[m.id],
                statusText: actuals[m.id] ? 'Completed' : deadlines[m.id] < today ? 'Overdue' : 'On Track'
              })), milestoneSort);

              return sortedMilestones.map(m => {
                const target = deadlines[m.id] || '-';
                const isContractSigned = m.name.toLowerCase() === 'contract signed';
                // Ensure Contract Signed uses the project date as its "actual" completion
                const actual = isContractSigned ? project.contract_signed_date : (actuals[m.id] || '');
                
                // Get standard base status (e.g., 'Completed before deadline')
                const statusText = getMilestoneStatus(target, actual, today);
                
                // Formulate the detailed badge string
                let badgeText = '';
                if (actual && target && target !== '-') {
                  const daysDiff = Math.ceil((new Date(actual) - new Date(target)) / (1000 * 60 * 60 * 24));
                  if (daysDiff > 0) {
                    badgeText = `COMPLETED (AFTER DEADLINE BY ${daysDiff} DAYS)`;
                  } else {
                    badgeText = `COMPLETED (BEFORE DEADLINE BY ${Math.abs(daysDiff)} DAYS)`;
                  }
                } else if (!actual && target && target !== '-') {
                  const daysDiff = Math.ceil((new Date(target) - new Date(today)) / (1000 * 60 * 60 * 24));
                  if (daysDiff < 0) {
                    badgeText = `OVERDUE (BY ${Math.abs(daysDiff)} DAYS)`;
                  } else {
                    badgeText = `${statusText.toUpperCase()} (${daysDiff} DAYS LEFT)`;
                  }
                } else {
                  badgeText = statusText.toUpperCase();
                }

                const anchor = milestones.find(a => a.id === m.anchor_id);

                return (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">{m.name}</td>
                    <td className="px-4 py-3 text-gray-500">{isContractSigned || !anchor ? 'Root Boundary' : anchor.name}</td>
                    <td className="px-4 py-3 font-bold text-indigo-700">{formatDate(target, dateFormat)}</td>
                    <td className="px-4 py-3">
                      {isContractSigned ? (
                        <span className="font-semibold text-gray-600">{formatDate(project.contract_signed_date, dateFormat)} (Locked)</span>
                      ) : (
                        <DateInputCell 
                          initialValue={actual} 
                          onSave={(val) => handleActualDateUpdate(project.tag_no, m.id, val)} 
                        />
                      )}
                    </td>
                    
                    <td className="px-4 py-3">
                      {isContractSigned ? (
                        <span className="text-xs font-semibold text-gray-400">-</span>
                      ) : (
                        <StatusBadge 
                          status={statusText} 
                          textOverride={badgeText} 
                        />
                      )}
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

// 👇 Tiny helper component that traps typing locally and only saves to DB on blur 👇
function DateInputCell({ initialValue, onSave }) {
  const [value, setValue] = useState(initialValue || '');

  // Keep local state synced if the database updates externally
  useEffect(() => {
    setValue(initialValue || '');
  }, [initialValue]);

  return (
    <input
      type="date"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        // Only hit the database if the user actually changed the date and clicked away
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