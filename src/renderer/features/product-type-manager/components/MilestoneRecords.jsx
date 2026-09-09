import React from 'react';
import { Edit, Trash2 } from 'lucide-react';

export default function MilestoneRecords({ milestones, handleOpenMilestoneModal, handleDeleteMilestone }) {
  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Milestone</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Anchor Milestone</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Days</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Chronology</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Remarks</th>
            <th className="relative px-6 py-3"></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200 text-sm text-gray-600">
          {milestones.map(m => {
            const isDefault = m.name.toLowerCase() === 'contract signed' || m.name.toLowerCase() === 'ros';
            const anchor = milestones.find(a => a.id === m.anchor_id);
            return (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">{m.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {isDefault ? '-' : anchor ? anchor.name : 'Unknown Anchor'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-medium">
                  {isDefault ? '0' : Math.abs(m.offset)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-medium">
                  {isDefault ? '-' : m.offset < 0 ? 'Before Anchor' : 'After Anchor'}
                </td>
                <td className="px-6 py-4 text-xs max-w-xs truncate text-gray-500" title={m.remark}>
                  {m.remark || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right font-medium space-x-2">
                  {!isDefault && (
                    <>
                      <button
                        onClick={() => handleOpenMilestoneModal(m)}
                        className="p-1.5 text-indigo-600 hover:text-indigo-950 hover:bg-indigo-50 rounded"
                        title="Edit milestone"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMilestone(m.id)}
                        className="p-1.5 text-red-600 hover:text-red-950 hover:bg-red-50 rounded"
                        title="Delete milestone"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}