import React from 'react';
import { Clock } from 'lucide-react';
import { formatDate } from '../../../../utils/date';
import { calculateMilestoneDeadlines, calculateComponentDeadlines } from '../../../../utils/scheduler';

export default function ComponentTable({
  project, milestones, compScheds, allComponents, componentSort, setComponentSort,
  toggleTableSort, handleActualReceivedUpdate, sortRows, dateFormat, urgencySettings
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h4 className="font-bold text-gray-900 text-sm flex items-center space-x-2">
          <Clock className="w-4 h-4 text-indigo-600" />
          <span>Component Order Deadlines & Lead Times</span>
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
              const deadlines = calculateMilestoneDeadlines(project, milestones);
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
                const receivedStatus = receivedDate
                  ? receivedDate <= (anchorM ? deadlines[anchorM.id] : '')
                    ? `Received before ${anchorM ? anchorM.name : 'anchor'}`
                    : `Received after ${anchorM ? anchorM.name : 'anchor'}`
                  : cc.urgency;

                return (
                  <tr key={cc.component_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">{cc.name}</td>
                    <td className="px-4 py-3 text-gray-500">{anchorM ? anchorM.name : 'ROS'}</td>
                    <td className="px-4 py-3 font-medium">{cc.lead_time} days</td>
                    <td className="px-4 py-3 font-bold text-indigo-700">{formatDate(cc.latest_order_date, dateFormat)}</td>
                    <td className="px-4 py-3">
                      <input type="date" value={receivedDate} onChange={event => handleActualReceivedUpdate(project.tag_no, cc.component_id, event.target.value)} className="px-2 py-1 border border-gray-300 rounded text-xs" />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${urgencyColors[cc.urgency] || (receivedDate ? 'text-emerald-700 bg-emerald-100 border-emerald-200' : 'bg-gray-100 text-gray-800')}`}>
                        {receivedStatus.toUpperCase()} {cc.days_until_need !== null && !receivedDate ? `(${cc.days_until_need}d left)` : ''}
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