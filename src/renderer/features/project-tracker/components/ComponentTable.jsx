import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { formatDate } from '../../../utils/date';
import { calculateMilestoneDeadlines, calculateComponentDeadlines } from '../../../utils/scheduler';
import StatusBadge from '../../../components/ui/StatusBadge';

export default function ComponentTable({
  project, milestones, compScheds, allComponents, componentSort, setComponentSort,
  toggleTableSort, handleActualReceivedUpdate, sortRows, dateFormat, urgencySettings
}) {
  const sortKey = componentSort.key === 'urgency' ? 'status' : componentSort.key;
  const sortValue = `${sortKey}-${componentSort.direction}`;

  const handleSortChange = (event) => {
    const [key, direction] = event.target.value.split('-');
    setComponentSort({ key, direction });
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h4 className="font-bold text-gray-900 text-sm flex items-center space-x-2">
          <Clock className="w-4 h-4 text-indigo-600" />
          <span>Component Procurement Target Deadlines</span>
        </h4>
        <div className="flex items-center gap-2">
          <label htmlFor="component-sort" className="text-xs font-semibold text-gray-600">Sort by</label>
          <select
            id="component-sort"
            value={sortValue}
            onChange={handleSortChange}
            className="rounded border border-gray-300 bg-white px-2 py-1 text-xs"
            title="Sort component table"
          >
            <option value="name-asc">Component (A → Z)</option>
            <option value="name-desc">Component (Z → A)</option>
            <option value="anchor-asc">Anchor (A → Z)</option>
            <option value="anchor-desc">Anchor (Z → A)</option>
            <option value="lead_time-asc">Lead Time (Lowest First)</option>
            <option value="lead_time-desc">Lead Time (Highest First)</option>
            <option value="latest-asc">Latest Order Date (Earliest First)</option>
            <option value="latest-desc">Latest Order Date (Latest First)</option>
            <option value="actual-asc">Actual Order Date (Earliest First)</option>
            <option value="actual-desc">Actual Order Date (Latest First)</option>
            <option value="status-asc">Status (Overdue → Complete)</option>
            <option value="status-desc">Status (Complete → Overdue)</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-xs">
          <thead className="bg-gray-50 font-bold text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Component Name</th>
              <th className="px-4 py-3 text-left">Anchor Milestone</th>
              <th className="px-4 py-3 text-left">Lead Time</th>
              <th className="px-4 py-3 text-left">Latest Order Date</th>
              <th className="px-4 py-3 text-left">Actual Order Date</th>
              <th className="px-4 py-3 text-left">Status</th>
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

              const componentRows = computedComps.map(cc => {
                const receivedDate = receivedDates[cc.component_id] || '';
                const componentDeadline = cc.latest_order_date;
                const status = receivedDate
                  ? receivedDate <= componentDeadline
                    ? 'Completed before deadline'
                    : 'Completed after deadline'
                  : cc.urgency;

                return {
                  ...cc,
                  anchor: milestones.find(m => m.id === cc.anchor_milestone_id)?.name,
                  latest: cc.latest_order_date,
                  actual: receivedDate,
                  status
                };
              });
              const sortedComponents = sortComponents(componentRows, componentSort);
              
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
                        dateFormat={dateFormat} // 👈 ADD THIS PROP
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

function sortComponents(rows, sortState) {
  const direction = sortState.direction === 'desc' ? -1 : 1;
  const statusOrder = {
    overdue: 0,
    'very urgent': 1,
    urgent: 2,
    pending: 3,
    'on track': 4,
    'completed before deadline': 5,
    'completed after deadline': 5
  };
  const compareText = (first, second) => String(first ?? '').localeCompare(String(second ?? ''), undefined, { sensitivity: 'base', numeric: true });
  const compareDate = (first, second) => {
    const firstMissing = !first;
    const secondMissing = !second;
    if (firstMissing || secondMissing) {
      if (firstMissing && secondMissing) return 0;
      return firstMissing ? 1 : -1;
    }
    return String(first).localeCompare(String(second));
  };

  return [...rows].sort((first, second) => {
    let result;
    if (sortState.key === 'lead_time') {
      result = Number(first.lead_time || 0) - Number(second.lead_time || 0);
    } else if (sortState.key === 'latest' || sortState.key === 'actual') {
      result = compareDate(first[sortState.key], second[sortState.key]);
    } else if (sortState.key === 'status' || sortState.key === 'urgency') {
      result = (statusOrder[String(first.status).toLowerCase()] ?? 99) - (statusOrder[String(second.status).toLowerCase()] ?? 99);
    } else {
      result = compareText(first[sortState.key], second[sortState.key]);
    }

    if (result === 0 && sortState.key !== 'latest') {
      result = compareDate(first.latest, second.latest);
    }
    return result * direction;
  });
}

function DateInputCell({ initialValue, onSave, dateFormat }) {
  const [value, setValue] = useState(initialValue || '');
  const [isEditing, setIsEditing] = useState(false);

  React.useEffect(() => {
    setValue(initialValue || '');
  }, [initialValue]);

  const handleBlur = () => {
    setIsEditing(false);
    if (value !== (initialValue || '')) {
      onSave(value);
    }
  };

  if (isEditing) {
    return (
      <input
        type="date"
        value={value}
        autoFocus
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        className="px-2 py-1 border border-indigo-500 rounded text-xs focus:outline-none bg-white w-full"
      />
    );
  }

  return (
    <div
      tabIndex={0}
      onClick={() => setIsEditing(true)}
      onFocus={() => setIsEditing(true)}
      className={`px-2 py-1 border rounded text-xs cursor-text transition-colors flex items-center min-w-[100px] h-[26px] ${
        value 
          ? 'border-gray-300 text-gray-700 font-semibold bg-white hover:bg-gray-50' 
          : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
      }`}
    >
      <span>{value ? formatDate(value, dateFormat) : 'Select date...'}</span>
    </div>
  );
}