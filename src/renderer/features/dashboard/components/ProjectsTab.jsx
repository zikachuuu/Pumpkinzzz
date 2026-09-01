import React, { useState } from 'react';
import { BarChart3, ChevronDown, ChevronUp, Edit2, Plus, Trash2 } from 'lucide-react';
import { formatDate } from '../../../utils/date';
import StatusBadge from '../../../components/ui/StatusBadge';

// Cross-Feature Imports: Reusing the exact tables from the Tracker!
import MilestoneTable from '../../project-tracker/components/MilestoneTable';
import ComponentTable from '../../project-tracker/components/ComponentTable';

const dayMs = 1000 * 60 * 60 * 24;
const daysBetween = (start, end) => Math.round((new Date(end) - new Date(start)) / dayMs);

export default function ProjectsTab({
  projects, selectedTag, setSelectedTag, selectedProject, detailedSummary, datedMilestones, dateFormat, handleOpenEditModal,
  // Table Props
  allComponents, allMilestones, allComponentSchedules, milestoneSort, setMilestoneSort, componentSort, setComponentSort,
  urgencySettings, sortRows, toggleTableSort, handleActualDateUpdate, handleActualReceivedUpdate, getMilestoneStatus
}) {
  const [showDetails, setShowDetails] = useState(true);
  const [comparisonRows, setComparisonRows] = useState([]);

  const addComparisonRow = () => setComparisonRows(rows => [...rows, { start: '', end: '' }]);
  const updateComparisonRow = (index, field, value) => setComparisonRows(rows => rows.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row));
  const removeComparisonRow = index => setComparisonRows(rows => rows.filter((_, rowIndex) => rowIndex !== index));

  return (
    <div className="space-y-6">
      {/* Dropdown Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <label className="block text-xs font-bold text-gray-500 uppercase">Select project</label>
        <select 
          value={selectedTag} 
          onChange={event => { 
            setSelectedTag(event.target.value); 
            setComparisonRows([]); 
          }} 
          className="mt-2 w-full max-w-xl rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white focus:border-indigo-500 focus:outline-none"
        >
          <option value="">Choose a registered project...</option>
          {projects.map(project => (
            <option key={project.tag_no} value={project.tag_no}>{project.tag_no} - {project.customer}</option>
          ))}
        </select>
      </div>

      {selectedProject ? (
        <>
          {/* THE EXACT PROJECT CARD FROM THE TRACKER */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:border-gray-300">
            <div 
              onClick={() => setShowDetails(!showDetails)}
              className="p-6 flex flex-col gap-4 cursor-pointer select-none bg-white hover:bg-gray-50/50 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div><span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Tag No.</span><h3 className="text-xl font-bold text-gray-900">{selectedProject.tag_no}</h3></div>
                  <div><span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Customer</span><span className="text-sm font-semibold text-gray-800">{selectedProject.customer}</span></div>
                  <div><span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Product Type (Schedule)</span><span className="text-xs font-medium text-gray-600">{selectedProject.product_type_name} ({selectedProject.schedule_name})</span></div>
                  <div><span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Contract Signed</span><span className="text-xs font-medium text-gray-600">{formatDate(selectedProject.contract_signed_date, dateFormat)}</span></div>
                  <div><span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">ROS Deadline</span><span className="text-sm font-semibold text-indigo-600">{formatDate(selectedProject.ros_date, dateFormat)}</span></div>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="p-2 text-gray-400">{showDetails ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}</div>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-3 border-t border-gray-100">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider w-24 shrink-0">Milestones:</span>
                  {detailedSummary.filter(item => item.milestones > 0).map(item => <StatusBadge key={`m-${item.status}`} status={item.status} count={item.milestones} />)}
                  {detailedSummary.filter(item => item.milestones > 0).length === 0 && <span className="text-xs font-semibold text-gray-400">None</span>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider w-24 shrink-0">Components:</span>
                  {detailedSummary.filter(item => item.components > 0).map(item => <StatusBadge key={`c-${item.status}`} status={item.status} count={item.components} />)}
                  {detailedSummary.filter(item => item.components > 0).length === 0 && <span className="text-xs font-semibold text-gray-400">None</span>}
                </div>
              </div>
            </div>

            {showDetails && (
              <div className="border-t border-gray-100 bg-gray-50/50 p-6 space-y-8">
                
                <section className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <h4 className="font-bold text-gray-900 text-sm">Project information</h4>
                    <button onClick={() => handleOpenEditModal(selectedProject)} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Edit project information">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 text-xs">
                    {[
                      ['Description', selectedProject.description], ['Contract No.', selectedProject.contract_no],
                      ['Sales Ref.', selectedProject.sales_ref], ['Project Manager', selectedProject.pm_owner],
                      ['Engineer', selectedProject.engineer_owner], ['Procurement', selectedProject.procurement_owner],
                      ['Production', selectedProject.production_owner], ['FAT Owner', selectedProject.fat_owner]
                    ].map(([label, value]) => (
                      <div key={label}><span className="block text-[10px] uppercase font-bold text-gray-400">{label}</span><span className="block mt-1 font-semibold text-gray-700 break-words">{value || '-'}</span></div>
                    ))}
                  </div>
                  <div>
                    <p className="mt-4 pt-3 border-t border-gray-100 text-[10px] uppercase font-bold text-gray-400">Notes </p>
                    <p className="mt-1 text-xs font-semibold text-gray-700 whitespace-pre-line break-words">{selectedProject.notes || '-'}</p>
                  </div>
                </section>

                {/* MODULAR REUSE: Drop in the Tracker Tables exactly as they are! */}
                <MilestoneTable 
                  project={selectedProject}
                  milestones={allMilestones[selectedProject.schedule_id] || []}
                  milestoneSort={milestoneSort}
                  setMilestoneSort={setMilestoneSort}
                  toggleTableSort={toggleTableSort}
                  handleActualDateUpdate={handleActualDateUpdate}
                  getMilestoneStatus={getMilestoneStatus}
                  sortRows={sortRows}
                  dateFormat={dateFormat}
                />

                <ComponentTable 
                  project={selectedProject}
                  milestones={allMilestones[selectedProject.schedule_id] || []}
                  compScheds={allComponentSchedules[selectedProject.schedule_id] || []}
                  allComponents={allComponents}
                  componentSort={componentSort}
                  setComponentSort={setComponentSort}
                  toggleTableSort={toggleTableSort}
                  handleActualReceivedUpdate={handleActualReceivedUpdate}
                  sortRows={sortRows}
                  dateFormat={dateFormat}
                  urgencySettings={urgencySettings}
                />
              </div>
            )}
          </div>

          {/* THE GANTT CHART - Placed entirely outside the Project Card */}
          <section className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-indigo-600" /><h3 className="font-bold text-gray-900">Milestone Gantt Chart</h3></div>
              <button onClick={addComparisonRow} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition text-white text-xs font-bold"><Plus className="w-4 h-4" />Add comparison</button>
            </div>
            {comparisonRows.length === 0 ? (
              <p className="text-sm text-gray-500">Add a row to compare any two milestones.</p>
            ) : (
              <div className="space-y-3">
                {comparisonRows.map((row, index) => { 
                  const start = datedMilestones.find(m => m.id === parseInt(row.start)); 
                  const end = datedMilestones.find(m => m.id === parseInt(row.end)); 
                  const duration = start && end ? daysBetween(start.target, end.target) : null; 
                  const valid = duration !== null && duration >= 0; 
                  const rangeStart = datedMilestones[0]?.target; 
                  const rangeEnd = datedMilestones[datedMilestones.length - 1]?.target; 
                  const rangeSpan = rangeStart && rangeEnd ? Math.max(1, daysBetween(rangeStart, rangeEnd)) : 1; 
                  const left = start && rangeStart ? Math.max(0, daysBetween(rangeStart, start.target) / rangeSpan * 100) : 0; 
                  const width = valid && start && end ? Math.max(1, daysBetween(start.target, end.target) / rangeSpan * 100) : 0; 
                  
                  return (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 items-center">
                      <select value={row.start} onChange={event => updateComparisonRow(index, 'start', event.target.value)} className="rounded border border-gray-300 px-2 py-2 text-xs focus:border-indigo-500 focus:outline-none"><option value="">Start milestone</option>{datedMilestones.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
                      <select value={row.end} onChange={event => updateComparisonRow(index, 'end', event.target.value)} className="rounded border border-gray-300 px-2 py-2 text-xs focus:border-indigo-500 focus:outline-none"><option value="">End milestone</option>{datedMilestones.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
                      <button onClick={() => removeComparisonRow(index)} className="p-2 text-red-600 hover:bg-red-50 rounded transition" title="Remove comparison"><Trash2 className="w-4 h-4" /></button>
                      <div className="md:col-span-3">
                        {duration !== null && !valid ? (
                          <p className="text-xs text-red-600">End milestone must occur after the start milestone.</p>
                        ) : duration !== null && (
                          <div className="relative h-8 bg-gray-100 rounded overflow-hidden">
                            <div style={{ left: `${left}%`, width: `${width}%` }} className="absolute top-1 bottom-1 bg-indigo-500 rounded" />
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-md z-10">{duration} days</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ); 
                })}
              </div>
            )}
          </section>
        </>
      ) : (
        <div className="p-16 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
          No registered projects are available.
        </div>
      )}
    </div>
  );
}