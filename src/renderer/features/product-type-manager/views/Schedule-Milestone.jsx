import React, { useState } from 'react';
import { Plus, Trash2, Calendar, Layers, Edit } from 'lucide-react';
import MilestoneTimeline from '../components/MilestoneTimeline'; 
import { stringifyProductTypesTemplate } from '../../../utils/csv';
import UsageCapsule from '../../../components/ui/UsageCapsule.jsx'; // <--- ADDED IMPORT

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
  openUsageModal, // <--- ADDED PROP
}) {

    const [scheduleSubView, setScheduleSubView] = useState('tree'); 

    const buildMilestoneTree = (milestoneList) => {
        const roots = milestoneList.filter(m => !m.anchor_id);
        const findChildren = (node) => {
          return {
              ...node,
              children: milestoneList.filter(m => m.anchor_id === node.id).map(findChildren)
          };
        };
        return roots.map(findChildren);
    };

    const renderTreeNodes = (node, milestoneList) => {
        const isDefault = node.name.toLowerCase() === 'contract signed' || node.name.toLowerCase() === 'ros';
        const relation = formatMilestoneRelation(node, milestoneList);
        
        return (
        <div key={node.id} className="ml-6 border-l border-indigo-200 pl-4 my-2 relative">
            <div className="absolute w-2 h-2 rounded-full bg-indigo-400 -left-1.5 top-5"></div>
            
            <div className={`p-3 rounded-lg border flex items-center justify-between ${
            isDefault 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-950' 
                : node.offset >= 0 
                ? 'bg-teal-50 border-teal-200 text-teal-950' 
                : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}>
            <div>
                <div className="font-semibold text-sm flex items-center">
                {node.name}
                {isDefault && (
                    <span className="ml-2 text-[10px] bg-indigo-200 text-indigo-800 px-1.5 py-0.2 rounded font-medium">
                    DEFAULT ROOT
                    </span>
                )}
                </div>
                {!isDefault && (
                <span className="text-xs text-gray-500 font-medium mt-0.5 block">
                    {relation}
                </span>
                )}
                {node.remark && (
                <p className="text-xs text-gray-500 mt-1 italic">
                    "{node.remark}"
                </p>
                )}
            </div>
            <div className="flex space-x-1.5 ml-4">
                {!isDefault && (
                <>
                    <button
                    onClick={() => handleOpenMilestoneModal(node)}
                    className="p-1 text-indigo-600 hover:text-indigo-900 hover:bg-white rounded transition"
                    title="Edit Milestone"
                    >
                    <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                    onClick={() => handleDeleteMilestone(node.id)}
                    className="p-1 text-red-600 hover:text-red-900 hover:bg-white rounded transition"
                    title="Delete Milestone"
                    >
                    <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </>
                )}
            </div>
            </div>
            
            {node.children && node.children.length > 0 && (
            <div className="mt-1">
                {node.children.map(child => renderTreeNodes(child, milestoneList))}
            </div>
            )}
        </div>
        );
    };

    const getScheduleValidity = (schedule) => scheduleValidity[schedule.id] || {
        isValid: false,
        reason: 'Lead-time status is loading.'
    };

    const formatMilestoneRelation = (m, milestoneList) => {
        const isDefault = m.name.toLowerCase() === 'contract signed' || m.name.toLowerCase() === 'ros';
        if (isDefault) return 'Default Milestone';
        const anchor = milestoneList.find(a => a.id === m.anchor_id);
        const anchorName = anchor ? anchor.name : 'Anchor';
        const absOffset = Math.abs(m.offset);
        const relation = m.offset < 0 ? 'before' : 'after';
        return `${absOffset} days ${relation} ${anchorName}`;
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
                            
                            {/* --- USAGE CAPSULE ADDED HERE --- */}
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

                            {/* --- DELETE BUTTON WRAPPED FOR TOOLTIP --- */}
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
                                {/* BULLETPROOF TOOLTIP & DISABLED STATE */}
                                <button
                                    onClick={(e) => {
                                    e.stopPropagation();
                                    if (s.in_use_count > 0) return; // Guard prevents action
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

                    {scheduleSubView === 'tree' && <div>
                        <h4 className="font-semibold text-gray-800 text-sm mb-4 flex items-center space-x-2">
                        <Layers className="w-4 h-4 text-indigo-500" />
                        <span>Milestone Relationship Tree Diagram</span>
                        </h4>
                        
                        {milestones.length === 0 ? (
                        <div className="p-6 bg-gray-50 rounded-lg text-center text-gray-400 text-xs">
                            Loading diagram...
                        </div>
                        ) : (
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 overflow-x-auto min-h-[200px]">
                            {buildMilestoneTree(milestones).map(rootNode => (
                            <div key={rootNode.id} className="mb-6 last:mb-0">
                                <div className="p-3 bg-indigo-900 text-white rounded-lg border border-indigo-950 flex items-center justify-between shadow-sm max-w-sm">
                                <div>
                                    <span className="font-bold text-sm">{rootNode.name}</span>
                                    <p className="text-[10px] text-indigo-200 mt-0.5">{rootNode.remark || 'Boundary Milestone'}</p>
                                </div>
                                <span className="text-[10px] bg-indigo-800 border border-indigo-700 text-indigo-100 px-1.5 py-0.5 rounded font-bold">
                                    DEFAULT MILESTONE
                                </span>
                                </div>
                                
                                {rootNode.children && rootNode.children.map(child => renderTreeNodes(child, milestones))}
                            </div>
                            ))}
                        </div>
                        )}
                    </div>}

                    {scheduleSubView === 'timeline' && <MilestoneTimeline milestones={milestones} />}

                    {scheduleSubView === 'records' && <div>
                        <h4 className="font-semibold text-gray-800 text-sm mb-3">Milestone Master Records</h4>
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
                    </div>}
                    </div>
                )}
                </div>
        </div>
    );
}