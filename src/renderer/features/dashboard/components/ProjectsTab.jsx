import React, { useState, useMemo } from 'react';
import { BarChart3, ChevronDown, ChevronUp, Edit2, Plus, Trash2, Save, Eye, EyeOff } from 'lucide-react';
import { formatDate, getStartOfWeek } from '../../../utils/date';
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
  const [ganttScale, setGanttScale] = useState('days'); // days, weeks, months, years
  const [showActuals, setShowActuals] = useState(false);
  const startOfWeek = getStartOfWeek(); 
  
  const [savedCharts, setSavedCharts] = useState({ 1: null, 2: null, 3: null, 4: null, 5: null });
  const [activeSlot, setActiveSlot] = useState(null);

  const addGanttRow = () => setGanttRows(rows => [...rows, { name: 'New Phase', start: '', end: '' }]);
  const updateGanttRow = (index, field, value) => setGanttRows(rows => rows.map((row, i) => i === index ? { ...row, [field]: value } : row));
  const removeGanttRow = index => setGanttRows(rows => rows.filter((_, i) => i !== index));

  const handleSaveChart = (slotIndex) => {
    const payload = { projectTag: selectedTag, rows: ganttRows };
    setSavedCharts(prev => ({ ...prev, [slotIndex]: payload }));
    setActiveSlot(slotIndex);
  };

  const handleLoadChart = (slotIndex) => {
    const chartData = savedCharts[slotIndex];
    if (chartData) {
      setSelectedTag(chartData.projectTag);
      setGanttRows(chartData.rows);
      setActiveSlot(slotIndex);
    }
  };

  const projectActuals = useMemo(() => {
    if (!selectedProject || !selectedProject.actual_dates) return {};
    return typeof selectedProject.actual_dates === 'string' ? JSON.parse(selectedProject.actual_dates) : selectedProject.actual_dates;
  }, [selectedProject]);

  return (
    <div className="space-y-6">
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

                <MilestoneTable project={selectedProject} milestones={allMilestones[selectedProject.schedule_id] || []} milestoneSort={milestoneSort} setMilestoneSort={setMilestoneSort} toggleTableSort={toggleTableSort} handleActualDateUpdate={handleActualDateUpdate} getMilestoneStatus={getMilestoneStatus} sortRows={sortRows} dateFormat={dateFormat} />
                <ComponentTable project={selectedProject} milestones={allMilestones[selectedProject.schedule_id] || []} compScheds={allComponentSchedules[selectedProject.schedule_id] || []} allComponents={allComponents} componentSort={componentSort} setComponentSort={setComponentSort} toggleTableSort={toggleTableSort} handleActualReceivedUpdate={handleActualReceivedUpdate} sortRows={sortRows} dateFormat={dateFormat} urgencySettings={urgencySettings} />
              </div>
            )}
          </div>

          {/* THE NEW ADVANCED DUAL-PANE GANTT CHART */}
          <section className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between gap-3 p-4 border-b border-gray-200 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-gray-900">Project Gantt Chart</h3>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Scale Selector */}
                <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-300 p-1">
                  {['days', 'weeks', 'months', 'years'].map(scale => (
                    <button
                      key={scale}
                      onClick={() => setGanttScale(scale)}
                      className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-colors ${ganttScale === scale ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                      {scale}
                    </button>
                  ))}
                </div>
                
                {/* Actuals Toggle */}
                <button 
                  onClick={() => setShowActuals(!showActuals)} 
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${showActuals ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                >
                  {showActuals ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  {showActuals ? 'Hide Actuals' : 'Compare Actuals'}
                </button>

                <div className="w-px h-6 bg-gray-300 mx-1"></div>

                <button onClick={addGanttRow} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition text-white text-xs font-bold shadow-sm">
                  <Plus className="w-4 h-4" /> Add Row
                </button>
              </div>
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
                ganttScale={ganttScale}
                showActuals={showActuals}
                projectActuals={projectActuals}
                contractSignedDate={selectedProject.contract_signed_date}
                startOfWeek={startOfWeek}
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

// --- GANTT RENDERER ENGINE ---
function GanttRenderer({ ganttRows, datedMilestones, updateGanttRow, removeGanttRow, dateFormat, ganttScale, showActuals, projectActuals, contractSignedDate, startOfWeek }) {
  // Scaling settings: how many pixels 1 day takes up on the screen
  const PIXELS_PER_DAY = ganttScale === 'days' ? 35 : ganttScale === 'weeks' ? 12 : ganttScale === 'months' ? 4 : 1;

  const processedRows = useMemo(() => {
    return ganttRows.map((row) => {
      const startNode = datedMilestones.find(m => m.id === parseInt(row.start));
      const endNode = datedMilestones.find(m => m.id === parseInt(row.end));
      
      const startStr = startNode?.target;
      const endStr = endNode?.target;
      
      const duration = (startStr && endStr) ? daysBetween(startStr, endStr) : null;
      const isValid = duration !== null && duration >= 0;

      // Actuals Logic
      const isStartContract = startNode?.name?.toLowerCase() === 'contract signed';
      const isEndContract = endNode?.name?.toLowerCase() === 'contract signed';
      
      const actStart = isStartContract ? contractSignedDate : (startNode ? projectActuals[startNode.id] : null);
      const actEnd = isEndContract ? contractSignedDate : (endNode ? projectActuals[endNode.id] : null);
      const actDuration = (actStart && actEnd) ? daysBetween(actStart, actEnd) : null;
      
      return { ...row, startStr, endStr, duration, isValid, actStart, actEnd, actDuration };
    });
  }, [ganttRows, datedMilestones, projectActuals, contractSignedDate]);

  const timelineData = useMemo(() => {
    const allStarts = [];
    const allEnds = [];
    
    processedRows.forEach(r => {
      if (r.isValid) {
        allStarts.push(new Date(r.startStr));
        allEnds.push(new Date(r.endStr));
      }
      if (showActuals && r.actStart && r.actEnd && r.actDuration >= 0) {
        allStarts.push(new Date(r.actStart));
        allEnds.push(new Date(r.actEnd));
      }
    });
    
    if (allStarts.length === 0) return null;

    let minDate = new Date(Math.min(...allStarts));
    let maxDate = new Date(Math.max(...allEnds));
    
    // Add visual padding
    minDate.setDate(minDate.getDate() - 3);
    maxDate.setDate(maxDate.getDate() + 3);

    // SNAP the minDate to perfectly align with the chosen interval grid
    if (ganttScale === 'weeks') {
      const dayOffset = (minDate.getDay() - startOfWeek + 7) % 7;
      minDate.setDate(minDate.getDate() - dayOffset);
    } else if (ganttScale === 'months') {
      minDate.setDate(1);
    } else if (ganttScale === 'years') {
      minDate.setMonth(0, 1);
    }

    // Generate dynamic intervals (Cells) for the axis
    const intervals = [];
    let current = new Date(minDate);
    let prevYear = null;
    let prevMonth = null;
    let idx = 0;

    while (current <= maxDate || intervals.length === 0) {
      const startOfInt = new Date(current);
      let endOfInt = new Date(current);

      if (ganttScale === 'days') endOfInt.setDate(endOfInt.getDate() + 1);
      else if (ganttScale === 'weeks') endOfInt.setDate(endOfInt.getDate() + 7);
      else if (ganttScale === 'months') endOfInt.setMonth(endOfInt.getMonth() + 1);
      else if (ganttScale === 'years') endOfInt.setFullYear(endOfInt.getFullYear() + 1);

      const daysInInt = daysBetween(startOfInt, endOfInt);
      const width = daysInInt * PIXELS_PER_DAY;

      const year = startOfInt.getFullYear();
      const month = startOfInt.toLocaleString('default', { month: 'short' }).toUpperCase();
      const showYear = year !== prevYear;
      const showMonth = showYear || month !== prevMonth;

      prevYear = year;
      prevMonth = month;

      intervals.push({
        width,
        showYear, showMonth, year, month,
        day: startOfInt.getDate(),
        dow: startOfInt.toLocaleString('default', { weekday: 'narrow' }),
        isAlt: idx % 2 === 0
      });

      current = new Date(endOfInt);
      idx++;
      if (current > maxDate && intervals.length > 0) break;
    }

    return { minDate, intervals };
  }, [processedRows, ganttScale, startOfWeek, showActuals]);

  return (
    <div className="flex border-t border-gray-200">
      
      {/* LEFT PANE: Fixed Controls Table */}
      <div className="w-[620px] shrink-0 border-r border-gray-200 bg-white z-20 flex flex-col shadow-[4px_0_12px_rgba(0,0,0,0.03)]">
        {/* Adjusted header height to match the new 4-tier axis on the right */}
        <div className="h-16 border-b border-gray-200 bg-gray-50 flex items-center px-4 gap-2 text-[10px] font-bold text-gray-500 uppercase">
          <div className="w-1/4">Custom Name</div>
          <div className="w-1/4">Start Milestone</div>
          <div className="w-1/4">End Milestone</div>
          <div className="w-1/4">Ref. Dates</div>
          <div className="w-6 shrink-0"></div>
        </div>
        
        {processedRows.map((row, idx) => {
          const isError = row.start && row.end && row.duration !== null && !row.isValid;
          return (
            <div key={idx} className="min-h-[56px] border-b border-gray-100 flex items-center px-4 py-2 gap-2 text-xs group hover:bg-gray-50 transition-colors">
              <input 
                type="text" value={row.name} onChange={e => updateGanttRow(idx, 'name', e.target.value)} 
                placeholder="Row Name" className="w-1/4 border border-gray-300 rounded px-2 py-1.5 focus:border-indigo-500 focus:outline-none" 
              />
              <select 
                value={row.start} onChange={e => updateGanttRow(idx, 'start', e.target.value)} 
                className="w-1/4 border border-gray-300 rounded px-2 py-1.5 focus:border-indigo-500 focus:outline-none bg-white"
              >
                <option value="">Start...</option>
                {datedMilestones.map(m => <option key={`s-${m.id}`} value={m.id}>{m.name}</option>)}
              </select>
              
              <div className="w-1/4 flex flex-col">
                <select 
                  value={row.end} onChange={e => updateGanttRow(idx, 'end', e.target.value)} 
                  className={`border rounded px-2 py-1.5 focus:outline-none bg-white transition-colors ${isError ? 'border-red-500 text-red-700 bg-red-50 focus:border-red-600' : 'border-gray-300 focus:border-indigo-500'}`}
                >
                  <option value="">End...</option>
                  {datedMilestones.map(m => <option key={`e-${m.id}`} value={m.id}>{m.name}</option>)}
                </select>
                {isError && <span className="text-[9px] font-bold text-red-600 mt-1 leading-tight">End must be after start</span>}
              </div>

              <div className="w-1/4 text-gray-500 truncate text-[10px] leading-tight">
                {row.isValid ? (
                  <>
                    <span className="block font-semibold text-gray-700">Target: {formatDate(row.startStr, dateFormat).slice(0, 5)} → {formatDate(row.endStr, dateFormat).slice(0, 5)}</span>
                    {showActuals && row.actDuration !== null && row.actDuration >= 0 && (
                      <span className="block text-emerald-600 mt-0.5">Actual: {formatDate(row.actStart, dateFormat).slice(0, 5)} → {formatDate(row.actEnd, dateFormat).slice(0, 5)}</span>
                    )}
                  </>
                ) : '-'}
              </div>
              
              <button onClick={() => removeGanttRow(idx)} className="w-6 shrink-0 p-1 text-gray-400 hover:text-red-600 rounded flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* RIGHT PANE: Horizontally Scrollable Timeline */}
      <div className="flex-1 overflow-x-auto bg-white relative flex flex-col custom-scrollbar">
        {!timelineData ? (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-400 min-h-[100px]">
            Please select valid start and end milestones to generate timeline.
          </div>
        ) : (
          <div className="relative">
            
            {/* Timeline Header Axis (4-Row De-duplicated Logic) */}
            <div className="h-16 border-b border-gray-300 bg-gray-50 flex text-[9px] font-bold text-gray-500 select-none">
              {timelineData.intervals.map((interval, i) => (
                <div key={i} className="flex flex-col text-center border-r border-gray-200 h-full justify-between pb-0.5" style={{ width: interval.width, minWidth: interval.width }}>
                  <div className={`border-b border-gray-200 ${interval.showYear ? 'text-gray-700' : 'text-transparent'}`}>{interval.year}</div>
                  <div className={`border-b border-gray-100 ${interval.showMonth ? 'text-gray-600' : 'text-transparent'}`}>{interval.month}</div>
                  <div className={`${ganttScale === 'years' || ganttScale === 'months' ? 'hidden' : 'text-gray-500'}`}>{interval.day}</div>
                  <div className={`${ganttScale !== 'days' ? 'hidden' : 'text-gray-400 font-normal'}`}>{interval.dow}</div>
                </div>
              ))}
            </div>

            {/* Alternating Background Grid Colors */}
            <div className="absolute inset-0 top-16 bottom-0 flex pointer-events-none z-0">
              {timelineData.intervals.map((int, i) => (
                <div key={`grid-${i}`} className={`border-r border-gray-100 h-full ${int.isAlt ? 'bg-indigo-50/20' : 'bg-transparent'}`} style={{ width: int.width, minWidth: int.width }} />
              ))}
            </div>

            {/* Timeline Bars */}
            <div className="relative z-10">
              {processedRows.map((row, idx) => {
                if (!row.isValid) return <div key={`bg-${idx}`} className="min-h-[56px] border-b border-gray-200/50"></div>;

                const leftPos = daysBetween(timelineData.minDate, row.startStr) * PIXELS_PER_DAY;
                const barWidth = row.duration * PIXELS_PER_DAY;
                const colorClass = GANTT_COLORS[idx % GANTT_COLORS.length];
                const isShort = row.duration * PIXELS_PER_DAY < 25;

                // Actual Bar Math
                const hasValidActual = showActuals && row.actDuration !== null && row.actDuration >= 0;
                let actLeftPos, actBarWidth, isActShort;
                if (hasValidActual) {
                  actLeftPos = daysBetween(timelineData.minDate, row.actStart) * PIXELS_PER_DAY;
                  actBarWidth = row.actDuration * PIXELS_PER_DAY;
                  isActShort = row.actDuration * PIXELS_PER_DAY < 25;
                }

                return (
                  <div key={`bar-${idx}`} className="min-h-[56px] border-b border-gray-200/50 relative group py-2">
                    
                    {/* Primary Target Bar */}
                    <div 
                      className={`absolute rounded shadow-sm flex items-center justify-center transition-all ${colorClass} ${hasValidActual ? 'top-1 bottom-1/2 mt-1 mb-0.5' : 'top-2.5 bottom-2.5'}`}
                      style={{ left: `${leftPos}px`, width: `${barWidth}px` }}
                      title={`Target Duration: ${row.duration} Days`}
                    >
                      {!isShort && <span className="text-[9px] font-extrabold text-white drop-shadow-md px-1 truncate">{row.duration}D</span>}
                    </div>
                    {isShort && (
                      <span className={`absolute flex items-center text-[9px] font-bold text-gray-500 ${hasValidActual ? 'top-1 bottom-1/2 mt-1 mb-0.5' : 'top-2.5 bottom-2.5'}`} style={{ left: `${leftPos + barWidth + 4}px` }}>
                        {row.duration}D
                      </span>
                    )}

                    {/* Secondary Actuals Bar */}
                    {hasValidActual && (
                      <>
                        <div 
                          className="absolute rounded shadow-sm flex items-center justify-center transition-all bg-emerald-400 top-1/2 bottom-1 mt-0.5 mb-1"
                          style={{ left: `${actLeftPos}px`, width: `${actBarWidth}px` }}
                          title={`Actual Duration: ${row.actDuration} Days`}
                        >
                          {!isActShort && <span className="text-[9px] font-extrabold text-white drop-shadow-md px-1 truncate">{row.actDuration}D</span>}
                        </div>
                        {isActShort && (
                          <span className="absolute flex items-center text-[9px] font-bold text-emerald-600 top-1/2 bottom-1 mt-0.5 mb-1" style={{ left: `${actLeftPos + actBarWidth + 4}px` }}>
                            {row.actDuration}D
                          </span>
                        )}
                      </>
                    )}

                  </div>
                );
              })}
            </div>
            
          </div>
        )}
      </div>
      
    </div>
  );
}