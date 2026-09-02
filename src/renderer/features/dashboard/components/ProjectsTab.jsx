import React, { useState, useMemo } from 'react';
import { BarChart3, ChevronDown, ChevronUp, Edit2, Plus, Trash2, Save, FolderOpen } from 'lucide-react';
import { formatDate } from '../../../utils/date';
import StatusBadge from '../../../components/ui/StatusBadge';

import MilestoneTable from '../../project-tracker/components/MilestoneTable';
import ComponentTable from '../../project-tracker/components/ComponentTable';

const dayMs = 1000 * 60 * 60 * 24;
const daysBetween = (start, end) => Math.round((new Date(end) - new Date(start)) / dayMs);
const GANTT_COLORS = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-purple-500', 'bg-orange-500'];

export default function ProjectsTab({
  projects, selectedTag, setSelectedTag, selectedProject, detailedSummary, datedMilestones, dateFormat, handleOpenEditModal,
  allComponents, allMilestones, allComponentSchedules, milestoneSort, setMilestoneSort, componentSort, setComponentSort,
  urgencySettings, sortRows, toggleTableSort, handleActualDateUpdate, handleActualReceivedUpdate, getMilestoneStatus
}) {
  const [showDetails, setShowDetails] = useState(true);
  
  // Upgraded Gantt State
  const [ganttRows, setGanttRows] = useState([]);
  
  // Mock State for the 5 Save Slots (Until DB is ready)
  const [savedCharts, setSavedCharts] = useState({ 1: null, 2: null, 3: null, 4: null, 5: null });
  const [activeSlot, setActiveSlot] = useState(null);

  // --- GANTT ACTIONS ---
  const addGanttRow = () => setGanttRows(rows => [...rows, { name: 'New Phase', start: '', end: '' }]);
  const updateGanttRow = (index, field, value) => setGanttRows(rows => rows.map((row, i) => i === index ? { ...row, [field]: value } : row));
  const removeGanttRow = index => setGanttRows(rows => rows.filter((_, i) => i !== index));

  // --- DATABASE HANDLES FOR LATER ---
  const handleSaveChart = (slotIndex) => {
    const payload = { projectTag: selectedTag, rows: ganttRows };
    // TODO: Await DB save here once table is ready
    setSavedCharts(prev => ({ ...prev, [slotIndex]: payload }));
    setActiveSlot(slotIndex);
    console.log(`Saved to slot ${slotIndex}:`, payload);
  };

  const handleLoadChart = (slotIndex) => {
    const chartData = savedCharts[slotIndex];
    if (chartData) {
      // TODO: Await DB load here once table is ready
      setSelectedTag(chartData.projectTag);
      setGanttRows(chartData.rows);
      setActiveSlot(slotIndex);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dropdown Selector & Save Slots */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-500 uppercase">Select project</label>
          <select 
            value={selectedTag} 
            onChange={event => { 
              setSelectedTag(event.target.value); 
              setGanttRows([]); 
              setActiveSlot(null);
            }} 
            className="mt-2 w-full max-w-xl rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Choose a registered project...</option>
            {projects.map(project => (
              <option key={project.tag_no} value={project.tag_no}>{project.tag_no} - {project.customer}</option>
            ))}
          </select>
        </div>
        
        {/* The 5 Save Slots */}
        <div className="flex flex-col gap-2">
          <label className="block text-[10px] font-bold text-gray-400 uppercase text-right">Saved Gantt Charts</label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map(slot => {
              const isFilled = !!savedCharts[slot];
              const isActive = activeSlot === slot;
              return (
                <div key={slot} className="flex flex-col gap-1 items-center">
                  <button
                    onClick={() => isFilled ? handleLoadChart(slot) : handleSaveChart(slot)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all border ${
                      isActive ? 'bg-indigo-600 text-white border-indigo-700 shadow-inner' :
                      isFilled ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' :
                      'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100 border-dashed'
                    }`}
                    title={isFilled ? `Load Slot ${slot}` : `Save to empty Slot ${slot}`}
                  >
                    {slot}
                  </button>
                  {isFilled && isActive && (
                    <button onClick={() => handleSaveChart(slot)} className="text-[9px] font-bold text-indigo-600 hover:text-indigo-900 flex items-center gap-0.5">
                      <Save className="w-3 h-3"/> Save
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
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

          {/* THE NEW DUAL-PANE GANTT CHART */}
          <section className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between gap-3 p-4 border-b border-gray-200 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-gray-900">Project Gantt Chart</h3>
              </div>
              <button onClick={addGanttRow} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition text-white text-xs font-bold shadow-sm">
                <Plus className="w-4 h-4" /> Add Row
              </button>
            </div>

            {ganttRows.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <p className="text-sm">Click "Add Row" to start building your Gantt chart.</p>
              </div>
            ) : (
              <GanttRenderer 
                ganttRows={ganttRows}
                datedMilestones={datedMilestones}
                updateGanttRow={updateGanttRow}
                removeGanttRow={removeGanttRow}
                dateFormat={dateFormat}
              />
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


// --- GANTT ENGINE ---
function GanttRenderer({ ganttRows, datedMilestones, updateGanttRow, removeGanttRow, dateFormat }) {
  const PIXELS_PER_DAY = 35; // Controls horizontal scale

  // 1. Process rows and calculate global timeline bounds
  const processedRows = useMemo(() => {
    return ganttRows.map((row) => {
      const startNode = datedMilestones.find(m => m.id === parseInt(row.start));
      const endNode = datedMilestones.find(m => m.id === parseInt(row.end));
      
      const startStr = startNode?.target;
      const endStr = endNode?.target;
      
      const duration = (startStr && endStr) ? daysBetween(startStr, endStr) : null;
      const isValid = duration !== null && duration >= 0;

      return { ...row, startStr, endStr, duration, isValid };
    });
  }, [ganttRows, datedMilestones]);

  const validBounds = useMemo(() => {
    const validStarts = processedRows.filter(r => r.isValid).map(r => new Date(r.startStr));
    const validEnds = processedRows.filter(r => r.isValid).map(r => new Date(r.endStr));
    
    if (validStarts.length === 0) return null;

    const minDate = new Date(Math.min(...validStarts));
    const maxDate = new Date(Math.max(...validEnds));
    
    // Add 3 days padding on both sides for visual breathing room
    minDate.setDate(minDate.getDate() - 3);
    maxDate.setDate(maxDate.getDate() + 3);

    const totalDays = daysBetween(minDate, maxDate);
    return { minDate, maxDate, totalDays };
  }, [processedRows]);

  // Generate Axis Labels
  const axisDates = useMemo(() => {
    if (!validBounds) return [];
    const dates = [];
    let current = new Date(validBounds.minDate);
    for (let i = 0; i <= validBounds.totalDays; i++) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }, [validBounds]);

  return (
    <div className="flex border-t border-gray-200">
      
      {/* LEFT PANE: Fixed Controls Table */}
      <div className="w-[600px] shrink-0 border-r border-gray-200 bg-white z-10 flex flex-col">
        <div className="h-12 border-b border-gray-200 bg-gray-50 flex items-center px-4 gap-2 text-xs font-bold text-gray-500 uppercase">
          <div className="w-1/4">Custom Name</div>
          <div className="w-1/4">Start Milestone</div>
          <div className="w-1/4">End Milestone</div>
          <div className="w-1/4">Ref. Dates</div>
          <div className="w-8 shrink-0"></div>
        </div>
        
        {processedRows.map((row, idx) => (
          <div key={idx} className="h-14 border-b border-gray-100 flex items-center px-4 gap-2 text-xs group hover:bg-gray-50 transition-colors">
            <input 
              type="text" value={row.name} onChange={e => updateGanttRow(idx, 'name', e.target.value)} 
              placeholder="Row Name" className="w-1/4 border border-gray-300 rounded px-2 py-1.5 focus:border-indigo-500 focus:outline-none" 
            />
            <select 
              value={row.start} onChange={e => updateGanttRow(idx, 'start', e.target.value)} 
              className="w-1/4 border border-gray-300 rounded px-2 py-1.5 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Start...</option>
              {datedMilestones.map(m => <option key={`s-${m.id}`} value={m.id}>{m.name}</option>)}
            </select>
            <select 
              value={row.end} onChange={e => updateGanttRow(idx, 'end', e.target.value)} 
              className="w-1/4 border border-gray-300 rounded px-2 py-1.5 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">End...</option>
              {datedMilestones.map(m => <option key={`e-${m.id}`} value={m.id}>{m.name}</option>)}
            </select>
            <div className="w-1/4 text-gray-500 truncate text-[10px]">
              {row.isValid ? `${formatDate(row.startStr, dateFormat).slice(0, 5)} → ${formatDate(row.endStr, dateFormat).slice(0, 5)}` : '-'}
            </div>
            <button onClick={() => removeGanttRow(idx)} className="w-8 shrink-0 p-1.5 text-gray-400 hover:text-red-600 rounded flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* RIGHT PANE: Horizontally Scrollable Timeline */}
      <div className="flex-1 overflow-x-auto bg-gray-50 relative flex flex-col custom-scrollbar">
        {!validBounds ? (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-400 min-h-[100px]">
            Please select valid start and end milestones to generate timeline.
          </div>
        ) : (
          <div style={{ width: `${validBounds.totalDays * PIXELS_PER_DAY}px` }}>
            {/* Timeline Header Axis */}
            <div className="h-12 border-b border-gray-200 bg-white flex text-[10px] font-bold text-gray-400">
              {axisDates.map((date, i) => (
                <div key={i} className="flex flex-col items-center justify-center border-r border-gray-100" style={{ width: PIXELS_PER_DAY }}>
                  <span className="uppercase">{date.toLocaleString('default', { month: 'short' })}</span>
                  <span className="text-gray-700">{date.getDate()}</span>
                </div>
              ))}
            </div>

            {/* Timeline Bars */}
            {processedRows.map((row, idx) => {
              if (!row.isValid) return <div key={`bg-${idx}`} className="h-14 border-b border-gray-200/50"></div>;

              const offsetDays = daysBetween(validBounds.minDate, row.startStr);
              const leftPos = offsetDays * PIXELS_PER_DAY;
              const barWidth = row.duration * PIXELS_PER_DAY;
              const colorClass = GANTT_COLORS[idx % GANTT_COLORS.length];
              const isShort = row.duration < 3; // Text overflows if bar is too short

              return (
                <div key={`bar-${idx}`} className="h-14 border-b border-gray-200/50 relative group">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex">
                    {axisDates.map((_, i) => <div key={`grid-${i}`} className="border-r border-gray-200/30 h-full" style={{ width: PIXELS_PER_DAY }} />)}
                  </div>
                  
                  {/* The Bar */}
                  <div 
                    className={`absolute top-2.5 bottom-2.5 rounded shadow-sm flex items-center justify-center transition-all hover:brightness-110 ${colorClass}`}
                    style={{ left: `${leftPos}px`, width: `${barWidth}px` }}
                  >
                    {!isShort && <span className="text-[10px] font-bold text-white drop-shadow-md z-10 px-1 truncate">{row.duration}D</span>}
                  </div>
                  {/* Text rendered outside for short bars */}
                  {isShort && (
                    <span 
                      className="absolute top-2.5 bottom-2.5 flex items-center text-[10px] font-bold text-gray-600"
                      style={{ left: `${leftPos + barWidth + 6}px` }}
                    >
                      {row.duration}D
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
    </div>
  );
}