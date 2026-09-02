import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { formatDate } from '../../../utils/date';
import { calculateMilestoneDeadlines } from '../../../utils/scheduler';
import StatusBadge from '../../../components/ui/StatusBadge';

export default function MilestoneTable({
  project, milestones, milestoneSort, setMilestoneSort, toggleTableSort,
  handleActualDateUpdate, getMilestoneStatus, sortRows, dateFormat
}) {
  const sortKey = milestoneSort.key === 'statusText' ? 'status' : milestoneSort.key;
  const sortValue = `${sortKey}-${milestoneSort.direction}`;

  const handleSortChange = (event) => {
    const [key, direction] = event.target.value.split('-');
    setMilestoneSort({ key, direction });
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h4 className="font-bold text-gray-900 text-sm flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-indigo-600" />
          <span>Milestones Target Deadlines</span>
        </h4>
        <div className="flex items-center gap-2">
          <label htmlFor="milestone-sort" className="text-xs font-semibold text-gray-600">Sort by</label>
          <select
            id="milestone-sort"
            value={sortValue}
            onChange={handleSortChange}
            className="rounded border border-gray-300 bg-white px-2 py-1 text-xs"
            title="Sort milestone table"
          >
            <option value="name-asc">Milestone (A → Z)</option>
            <option value="name-desc">Milestone (Z → A)</option>
            <option value="anchor-asc">Anchor (A → Z)</option>
            <option value="anchor-desc">Anchor (Z → A)</option>
            <option value="target-asc">Targeted Deadline (Earliest First)</option>
            <option value="target-desc">Targeted Deadline (Latest First)</option>
            <option value="actual-asc">Actual Completion (Earliest First)</option>
            <option value="actual-desc">Actual Completion (Latest First)</option>
            <option value="status-asc">Status (Overdue → Complete)</option>
            <option value="status-desc">Status (Complete → Overdue)</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-xs">
          <thead className="bg-gray-50 font-bold text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Milestone</th>
              <th className="px-4 py-3 text-left">Anchor Milestone</th>
              <th className="px-4 py-3 text-left">Targeted Deadline</th>
              <th className="px-4 py-3 text-left">Actual Completion Date</th>
              <th className="px-4 py-3 text-left">Status</th>
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

              const sortedMilestones = sortMilestones(milestones.map(m => ({
                ...m,
                anchor: milestones.find(a => a.id === m.anchor_id)?.name,
                target: deadlines[m.id],
                actual: actuals[m.id],
                status: actuals[m.id] ? 'Complete' : deadlines[m.id] < today ? 'Overdue' : 'On Track'
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
                    <td className="px-4 py-3 text-gray-500">{isContractSigned || !anchor ? '-' : anchor.name}</td>
                    <td className="px-4 py-3 font-bold text-indigo-700">{formatDate(target, dateFormat)}</td>
                    <td className="px-4 py-3">
                      {isContractSigned ? (
                        <span className="font-semibold text-gray-600">{formatDate(project.contract_signed_date, dateFormat)} (Locked)</span>
                      ) : (
                        <DateInputCell 
                          initialValue={actual} 
                          onSave={(val) => handleActualDateUpdate(project.tag_no, m.id, val)} 
                          dateFormat={dateFormat} // 👈 ADD THIS PROP
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

function sortMilestones(rows, sortState) {
  const direction = sortState.direction === 'desc' ? -1 : 1;
  const statusOrder = {
    overdue: 0,
    'very urgent': 1,
    urgent: 2,
    'on track': 3,
    complete: 4
  };

  const compareText = (first, second) => String(first ?? '').localeCompare(String(second ?? ''), undefined, { sensitivity: 'base' });
  const compareDate = (first, second) => String(first ?? '9999-12-31').localeCompare(String(second ?? '9999-12-31'));

  return [...rows].sort((first, second) => {
    let result;

    if (sortState.key === 'status' || sortState.key === 'statusText') {
      result = (statusOrder[String(first.status).toLowerCase()] ?? 99) - (statusOrder[String(second.status).toLowerCase()] ?? 99);
      if (result === 0) result = compareDate(first.target, second.target);
    } else if (sortState.key === 'actual') {
      result = compareDate(first.actual || first.target, second.actual || second.target);
    } else if (sortState.key === 'target') {
      result = compareDate(first.target, second.target);
    } else if (sortState.key === 'name' || sortState.key === 'anchor') {
      result = compareText(first[sortState.key], second[sortState.key]);
    } else {
      result = compareText(first[sortState.key], second[sortState.key]);
    }

    return result === 0 ? compareDate(first.target, second.target) * direction : result * direction;
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
          ? 'border-gray-300 text-gray-700 font-semibold bg-gray-50 hover:bg-gray-50' 
          : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
      }`}
    >
      <span>{value ? formatDate(value, dateFormat) : 'Select date...'}</span>
    </div>
  );
}