import React from 'react';
import { Calendar, Edit2 } from 'lucide-react';
import { formatDate } from '../../../../utils/date';
import { calculateMilestoneDeadlines } from '../../../../utils/scheduler';

export default function MilestoneTable({
  project, milestones, milestoneSort, setMilestoneSort, toggleTableSort,
  editingActual, setEditingActual, handleActualDateUpdate, getMilestoneStatus, sortRows, dateFormat
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h4 className="font-bold text-gray-900 text-sm flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-indigo-600" />
          <span>Milestones Target Deadlines & Actual Progress</span>
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
              const deadlines = calculateMilestoneDeadlines(project, milestones);
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
                const actual = actuals[m.id] || '';
                const isContractSigned = m.name.toLowerCase() === 'contract signed';
                
                let statusText = getMilestoneStatus(target, actual, today);
                let statusColor = 'text-teal-600 bg-teal-50 border-teal-200';

                if (isContractSigned) {
                  statusText = 'Completed';
                  statusColor = 'text-emerald-600 bg-emerald-50 border-emerald-200';
                } else if (statusText === 'Completed before deadline' || statusText === 'Completed after deadline') {
                  statusColor = statusText === 'Completed before deadline' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-orange-600 bg-orange-50 border-orange-200';
                } else if (statusText === 'Overdue') {
                  statusColor = 'text-red-600 bg-red-50 border-red-200';
                } else if (statusText === 'Very Urgent') {
                  statusColor = 'text-orange-600 bg-orange-50 border-orange-200';
                } else if (statusText === 'Urgent') {
                  statusColor = 'text-amber-600 bg-amber-50 border-amber-200';
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
                      ) : actual && editingActual !== `${project.tag_no}-${m.id}` ? (
                        <span className="inline-flex items-center gap-2 font-semibold text-emerald-700">
                          {formatDate(actual, dateFormat)}
                          <button type="button" onClick={() => setEditingActual(`${project.tag_no}-${m.id}`)} className="p-1 text-gray-500 hover:text-indigo-600" title="Edit actual completion date"><Edit2 className="w-3.5 h-3.5" /></button>
                        </span>
                      ) : (
                        <input
                          type="date"
                          value={actual}
                          onChange={(e) => handleActualDateUpdate(project.tag_no, m.id, e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-xs focus:border-indigo-500 focus:outline-none bg-white"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusColor}`}>
                        {statusText}
                      </span>
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