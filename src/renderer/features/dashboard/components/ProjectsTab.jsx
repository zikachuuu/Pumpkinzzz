import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BarChart3, ChevronDown, ChevronUp, Edit2, Plus, Trash2, Save, Eye, EyeOff, Search, FolderOpen, AlertTriangle } from 'lucide-react';
import { formatDate, getStartOfWeek } from '../../../utils/date';
import StatusBadge from '../../../components/ui/StatusBadge';
import Modal from '../../../components/ui/Modal'; 
import ChecklistFilter from '../../../components/ui/ChecklistFilter';

// Cross-Feature Imports
import MilestoneTable from '../../project-tracker/components/MilestoneTable';
import ComponentTable from '../../project-tracker/components/ComponentTable';

const dayMs = 1000 * 60 * 60 * 24;
const daysBetween = (start, end) => Math.round((new Date(end) - new Date(start)) / dayMs);
const GANTT_COLORS = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-purple-500', 'bg-orange-500'];
const GANTT_ACTUAL_COLORS = ['bg-indigo-300', 'bg-emerald-300', 'bg-amber-300', 'bg-rose-300', 'bg-cyan-300', 'bg-purple-300', 'bg-orange-300'];

export default function ProjectsTab({
  projects, selectedTag, setSelectedTag, selectedProject, detailedSummary, datedMilestones, dateFormat, handleOpenEditModal,
  allComponents, allMilestones, allComponentSchedules, milestoneSort, setMilestoneSort, componentSort, setComponentSort,
  urgencySettings, sortRows, toggleTableSort, handleActualDateUpdate, handleActualReceivedUpdate, getMilestoneStatus,
  // Props from Hook
  savedChartsSummary = {}, handleSaveGantt, handleLoadGantt, handleDeleteGantt,
  filteredProjects = [], searchTerm, setSearchTerm, ptFilter, setPtFilter, 
  milestoneStatusFilter, setMilestoneStatusFilter, componentStatusFilter, setComponentStatusFilter,
  milestoneStatuses, componentStatuses, productTypes
}) {
  const [showDetails, setShowDetails] = useState(true);
  
  // Gantt State
  const [ganttRows, setGanttRows] = useState([]);
  const [ganttScale, setGanttScale] = useState('days'); 
  const [showActuals, setShowActuals] = useState(false);
  const startOfWeek = getStartOfWeek(); 
  
  // Modal & Dropdown States
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [loadConfirmSlot, setLoadConfirmSlot] = useState(null);
  const [selectedSlotForSave, setSelectedSlotForSave] = useState(1);

  const addGanttRow = () => setGanttRows(rows => [...rows, { name: 'New Phase', start: '', end: '' }]);
  const updateGanttRow = (index, field, value) => setGanttRows(rows => rows.map((row, i) => i === index ? { ...row, [field]: value } : row));
  const removeGanttRow = index => setGanttRows(rows => rows.filter((_, i) => i !== index));

  const formatProjectName = (p) => `${p.tag_no} - ${p.customer} - ${p.product_type_name} (${p.schedule_name})`;

  const executeLoad = async (slotId) => {
    const loadedRows = await handleLoadGantt(slotId, setSelectedTag, setGanttRows);
    setManageModalOpen(false);
    setLoadConfirmSlot(null);
    if (loadedRows && loadedRows.length > 0) setGanttRows(loadedRows);
    else setGanttRows([]);
  };

  const confirmLoad = () => {
    if (loadConfirmSlot !== null) executeLoad(loadConfirmSlot);
  };

  const executeDelete = async (slotId) => {
    if (window.confirm(`Are you sure you want to delete the Gantt chart in Slot ${slotId}?`)) {
      await handleDeleteGantt(slotId);
    }
  };

  const confirmSave = async () => {
    await handleSaveGantt(selectedSlotForSave, selectedTag, ganttRows);
    setSaveModalOpen(false);
  };

  const projectActuals = useMemo(() => {
    if (!selectedProject || !selectedProject.actual_dates) return {};
    return typeof selectedProject.actual_dates === 'string' ? JSON.parse(selectedProject.actual_dates) : selectedProject.actual_dates;
  }, [selectedProject]);

  return (
    <div className="space-y-6">
      
      {/* --- TOP NAV: Filters & Selection --- */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:flex-wrap xl:items-end justify-between gap-4">
          
          {/* 1. Select Project (Narrower) */}
          <div className="w-full xl:w-[500px] shrink-0">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Select project</label>
            <select 
              value={selectedTag} 
              onChange={e => { setSelectedTag(e.target.value); setGanttRows([]); }} 
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">Choose a project...</option>
              {filteredProjects.map(p => (
                <option key={p.tag_no} value={p.tag_no}>{formatProjectName(p)}</option>
              ))}
            </select>
          </div>

          {/* 2. Filters (Smaller Gap, pushed right) */}
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 xl:justify-start xl:ml-3">
            <span className="text-[11px] font-semibold text-gray-600 mb-1 xl:mb-0">Filter by</span>
            <div className="flex items-end gap-1.5">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold leading-none text-gray-600">Product Type</span>
                <ChecklistFilter label="Product Type" className="w-[120px]" options={(productTypes || []).map(pt => ({ value: String(pt.id), label: pt.name }))} selected={ptFilter} onChange={setPtFilter} isOpen={activeDropdown === 'product'} onToggle={(isOpen) => setActiveDropdown(isOpen ? 'product' : null)} />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold leading-none text-gray-600">Milestone</span>
                <ChecklistFilter label="Milestone" className="w-[155px]" options={(milestoneStatuses || []).map(s => ({ value: s, label: s }))} selected={milestoneStatusFilter} onChange={setMilestoneStatusFilter} isOpen={activeDropdown === 'milestones'} onToggle={(isOpen) => setActiveDropdown(isOpen ? 'milestones' : null)} />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold leading-none text-gray-600">Procurement</span>
                <ChecklistFilter label="Procurement" className="w-[155px]" options={(componentStatuses || []).map(s => ({ value: s, label: s }))} selected={componentStatusFilter} onChange={setComponentStatusFilter} isOpen={activeDropdown === 'components'} onToggle={(isOpen) => setActiveDropdown(isOpen ? 'components' : null)} />
              </div>
            </div>
          </div>
          
          {/* 3. Manage Charts Button (Now on the same row) */}
          <button onClick={() => setManageModalOpen(true)} className="flex max-w-full items-center justify-center gap-2 px-5 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-sm font-bold transition shrink-0 h-[38px] xl:ml-4">
            <FolderOpen className="w-4 h-4" /> Manage Saved Charts
          </button>
          
        </div>
      </div>

      {selectedProject ? (
        <>
          {/* --- THE PROJECT CARD --- */}
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

          {/* --- THE GANTT CHART CONTROLS --- */}
          <section className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col">
            <div className="flex items-center justify-between gap-3 p-4 border-b border-gray-200 bg-gray-50/50 rounded-t-lg">              
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-gray-900">Project Gantt Chart</h3>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-300 p-1">
                  {['days', 'weeks', 'months', 'years'].map(scale => (
                    <button key={scale} onClick={() => setGanttScale(scale)} className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-colors ${ganttScale === scale ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'}`}>
                      {scale}
                    </button>
                  ))}
                </div>
                
                <button onClick={() => setShowActuals(!showActuals)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${showActuals ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
                  {showActuals ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  {showActuals ? 'Hide Actuals' : 'Compare Actuals'}
                </button>

                <div className="w-px h-6 bg-gray-300 mx-1"></div>

                <button onClick={addGanttRow} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-black transition text-white text-xs font-bold shadow-sm">
                  <Plus className="w-4 h-4" /> Add Row
                </button>

                <div className="relative inline-block w-max">
                  {ganttRows.length > 0 && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 flex justify-center animate-bounce pointer-events-none whitespace-nowrap z-50">
                      <div className="bg-amber-500 text-white text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded shadow-md relative">
                        Save it or lose it
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-amber-500 rotate-45 rounded-sm"></div>
                      </div>
                    </div>
                  )}
                  <button onClick={() => setSaveModalOpen(true)} disabled={ganttRows.length === 0} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition text-white text-xs font-bold shadow-sm w-full">
                    <Save className="w-4 h-4" /> Save Chart
                  </button>
                </div>              
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
          No registered projects match your search criteria.
        </div>
      )}

      {/* --- MODALS --- */}
      {/* 1. MANAGE SAVED CHARTS MODAL */}
      <Modal isOpen={manageModalOpen} onClose={() => setManageModalOpen(false)} title="Manage Saved Charts" maxWidth="max-w-2xl">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Select a saved Gantt chart to load into your workspace, or delete charts you no longer need.</p>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(slot => {
              const summary = savedChartsSummary[slot]; 
              const proj = summary ? projects.find(p => p.tag_no === summary.tag_no) : null;
              
              return (
                <div key={slot} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg transition-colors ${summary ? 'border-gray-200 bg-white shadow-sm' : 'border-gray-200 border-dashed bg-gray-50/50'}`}>
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${summary ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-500'}`}>Slot {slot}</span>
                      {summary && <span className="text-[10px] font-bold text-gray-500">{summary.row_count} Rows</span>}
                    </div>
                    {summary ? (
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {proj ? formatProjectName(proj) : `Unknown Project (${summary.tag_no})`}
                      </p>
                    ) : (
                      <p className="text-sm font-medium text-gray-400">Empty Slot</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-3 sm:mt-0">
                    <button disabled={!summary} onClick={() => setLoadConfirmSlot(slot)} className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors border border-indigo-200">
                      Load Chart
                    </button>
                    <button disabled={!summary} onClick={() => executeDelete(slot)} className="p-2 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors" title="Delete Chart">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-end pt-2">
            <button onClick={() => setManageModalOpen(false)} className="px-5 py-2 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Close</button>
          </div>
        </div>
      </Modal>

      {/* 2. LOAD CONFIRMATION MODAL */}
      <Modal isOpen={loadConfirmSlot !== null} onClose={() => setLoadConfirmSlot(null)} title="Confirm Load" maxWidth="max-w-md">
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-bold">Overwrite current chart?</p>
              <p className="mt-1 text-xs">Loading Slot {loadConfirmSlot} will replace your current unsaved Gantt configuration. This cannot be undone.</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setLoadConfirmSlot(null)} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200">Cancel</button>
            <button onClick={confirmLoad} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-indigo-700">Confirm Load</button>
          </div>
        </div>
      </Modal>

      {/* 3. SAVE CHART MODAL */}
      <Modal isOpen={saveModalOpen} onClose={() => setSaveModalOpen(false)} title="Save Gantt Chart" maxWidth="max-w-2xl">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Select a slot to save the current Gantt chart configuration for <span className="font-bold">{selectedTag}</span>.</p>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(slot => {
              const summary = savedChartsSummary[slot];
              const proj = summary ? projects.find(p => p.tag_no === summary.tag_no) : null;
              const isSelected = selectedSlotForSave === slot;
              
              return (
                <label key={slot} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${isSelected ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0 pr-4">
                    <input type="radio" name="saveSlot" checked={isSelected} onChange={() => setSelectedSlotForSave(slot)} className="mt-1 sm:mt-0 text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-extrabold uppercase text-gray-500">Slot {slot}</span>
                        {summary && <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 rounded">{summary.row_count} Rows</span>}
                      </div>
                      <p className={`text-sm truncate ${summary ? 'font-semibold text-gray-900' : 'font-medium text-gray-400'}`}>
                        {summary ? (proj ? formatProjectName(proj) : `Unknown Project (${summary.tag_no})`) : 'Empty Slot'}
                      </p>
                    </div>
                  </div>
                  {summary && isSelected && (
                    <span className="mt-2 sm:mt-0 text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded flex items-center gap-1 shrink-0">
                      <AlertTriangle className="w-3 h-3" /> Will be overwritten
                    </span>
                  )}
                </label>
              );
            })}
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <button onClick={() => setSaveModalOpen(false)} className="px-5 py-2 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancel</button>
            <button onClick={confirmSave} className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm">Save to Slot {selectedSlotForSave}</button>
          </div>
        </div>
      </Modal>

    </div>
  );
}

// --- GANTT RENDERER ENGINE ---
function GanttRenderer({ ganttRows, datedMilestones, updateGanttRow, removeGanttRow, dateFormat, ganttScale, showActuals, projectActuals, contractSignedDate, startOfWeek }) {
  // Scaling settings: how many pixels 1 day takes up on the screen
  const PIXELS_PER_DAY = ganttScale === 'days' ? 35 : ganttScale === 'weeks' ? 12 : ganttScale === 'months' ? 4 : 1;

  const processedRows = useMemo(() => {
    return ganttRows.map((row) => {
      const startNode = datedMilestones.find(m => String(m.id) === String(row.start));
      const endNode = datedMilestones.find(m => String(m.id) === String(row.end));
      
      const startStr = startNode?.target;
      const endStr = endNode?.target;
      
      const duration = (startStr && endStr) ? daysBetween(startStr, endStr) : null;
      const isValid = duration !== null && duration >= 0;

      const isStartContract = startNode?.name?.toLowerCase() === 'contract signed';
      const isEndContract = endNode?.name?.toLowerCase() === 'contract signed';
      
      const actStart = isStartContract ? contractSignedDate : (startNode ? projectActuals[startNode.id] : null);
      const actEnd = isEndContract ? contractSignedDate : (endNode ? projectActuals[endNode.id] : null);
      const actDuration = (actStart && actEnd) ? daysBetween(actStart, actEnd) : null;
      
      const hasValidActual = showActuals && actDuration !== null && actDuration >= 0;
      const rowHeightClass = !isValid ? 'h-14' : (hasValidActual ? 'h-[108px]' : 'h-[64px]');
      
      return { ...row, startStr, endStr, duration, isValid, actStart, actEnd, actDuration, hasValidActual, rowHeightClass };
    });
  }, [ganttRows, datedMilestones, projectActuals, contractSignedDate, showActuals]);

  const timelineData = useMemo(() => {
    const allStarts = [];
    const allEnds = [];
    
    processedRows.forEach(r => {
      if (r.isValid) {
        allStarts.push(new Date(r.startStr));
        allEnds.push(new Date(r.endStr));
      }
      if (r.hasValidActual) {
        allStarts.push(new Date(r.actStart));
        allEnds.push(new Date(r.actEnd));
      }
    });
    
    if (allStarts.length === 0) return null;

    let minDate = new Date(Math.min(...allStarts));
    let maxDate = new Date(Math.max(...allEnds));
    
    minDate.setDate(minDate.getDate() - 3);
    maxDate.setDate(maxDate.getDate() + 3);

    if (ganttScale === 'weeks') {
      const dayOffset = (minDate.getDay() - startOfWeek + 7) % 7;
      minDate.setDate(minDate.getDate() - dayOffset);
    } else if (ganttScale === 'months') {
      minDate.setDate(1);
    } else if (ganttScale === 'years') {
      minDate.setMonth(0, 1);
    }

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
        width, showYear, showMonth, year, month,
        day: startOfInt.getDate(),
        dow: startOfInt.toLocaleString('default', { weekday: 'narrow' }),
        isAlt: idx % 2 === 0
      });

      current = new Date(endOfInt);
      idx++;
      if (current > maxDate && intervals.length > 0) break;
    }

    return { minDate, intervals };
  }, [processedRows, ganttScale, startOfWeek]);

  return (
    <div className="flex border-t border-gray-200">
      
      {/* LEFT PANE: Fixed Controls Table */}
      <div className="w-[620px] shrink-0 border-r border-gray-200 bg-white z-20 flex flex-col shadow-[4px_0_12px_rgba(0,0,0,0.03)]">
        <div className="h-16 border-b border-gray-200 bg-gray-50 flex items-center px-4 gap-2 text-[10px] font-bold text-gray-500 uppercase">
          <div className="w-1/4">Custom Name</div>
          <div className="w-1/4">Start Milestone</div>
          <div className="w-1/4">End Milestone</div>
          <div className="w-1/4">Reference Dates</div>
          <div className="w-6 shrink-0"></div>
        </div>
        
        {processedRows.map((row, idx) => {
          const isError = row.start && row.end && row.duration !== null && !row.isValid;
          
          return (
            <div key={idx} className={`${row.rowHeightClass} border-b border-gray-100 flex items-center px-4 gap-2 text-xs group hover:bg-gray-50 transition-colors`}>
              <input type="text" value={row.name} onChange={e => updateGanttRow(idx, 'name', e.target.value)} placeholder="Row Name" className="w-1/4 border border-gray-300 rounded px-2 py-1.5 focus:border-indigo-500 focus:outline-none" />
              <select value={row.start} onChange={e => updateGanttRow(idx, 'start', e.target.value)} className="w-1/4 border border-gray-300 rounded px-2 py-1.5 focus:border-indigo-500 focus:outline-none bg-white">
                <option value="">Start...</option>
                {datedMilestones.map(m => <option key={`s-${m.id}`} value={m.id}>{m.name}</option>)}
              </select>
              
              <div className="w-1/4 flex flex-col">
                <select value={row.end} onChange={e => updateGanttRow(idx, 'end', e.target.value)} className={`border rounded px-2 py-1.5 focus:outline-none bg-white transition-colors ${isError ? 'border-red-500 text-red-700 bg-red-50 focus:border-red-600' : 'border-gray-300 focus:border-indigo-500'}`}>
                  <option value="">End...</option>
                  {datedMilestones.map(m => <option key={`e-${m.id}`} value={m.id}>{m.name}</option>)}
                </select>
                {isError && <span className="text-[9px] font-bold text-red-600 mt-1 leading-tight">End must be after start</span>}
              </div>

              <div className="w-1/4 text-gray-500 text-[10px] leading-tight flex flex-col justify-center gap-2">
                {row.isValid ? (
                  <>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-gray-700 w-10 shrink-0">Target</span>
                      <div className="flex flex-col items-center flex-1">
                        <span>{formatDate(row.startStr, dateFormat)}</span>
                        <span className="text-[8px] text-gray-400 my-[1px]">↓</span>
                        <span>{formatDate(row.endStr, dateFormat)}</span>
                      </div>
                    </div>
                    {row.hasValidActual && (
                      <div className="flex items-center gap-1 text-emerald-600">
                        <span className="font-semibold w-10 shrink-0">Actual</span>
                        <div className="flex flex-col items-center flex-1">
                          <span>{formatDate(row.actStart, dateFormat)}</span>
                          <span className="text-[8px] text-emerald-400 my-[1px]">↓</span>
                          <span>{formatDate(row.actEnd, dateFormat)}</span>
                        </div>
                      </div>
                    )}
                  </>
                ) : <span>-</span>}
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

            <div className="absolute inset-0 top-16 bottom-0 flex pointer-events-none z-0">
              {timelineData.intervals.map((int, i) => (
                <div key={`grid-${i}`} className={`border-r border-gray-100 h-full ${int.isAlt ? 'bg-indigo-50/20' : 'bg-transparent'}`} style={{ width: int.width, minWidth: int.width }} />
              ))}
            </div>

            <div className="relative z-10">
              {processedRows.map((row, idx) => {
                if (!row.isValid) return <div key={`bg-${idx}`} className={`${row.rowHeightClass} border-b border-gray-200/50`}></div>;

                const leftPos = daysBetween(timelineData.minDate, row.startStr) * PIXELS_PER_DAY;
                const barWidth = row.duration * PIXELS_PER_DAY;
                const colorClass = GANTT_COLORS[idx % GANTT_COLORS.length];
                const actualColorClass = GANTT_ACTUAL_COLORS[idx % GANTT_ACTUAL_COLORS.length];
                const isShort = row.duration * PIXELS_PER_DAY < 25;

                let actLeftPos, actBarWidth, isActShort;
                if (row.hasValidActual) {
                  actLeftPos = daysBetween(timelineData.minDate, row.actStart) * PIXELS_PER_DAY;
                  actBarWidth = row.actDuration * PIXELS_PER_DAY;
                  isActShort = row.actDuration * PIXELS_PER_DAY < 25;
                }

                return (
                  <div key={`bar-${idx}`} className={`${row.rowHeightClass} border-b border-gray-200/50 relative group`}>
                    
                    <div className={`absolute rounded shadow-sm flex items-center justify-center transition-all ${colorClass} ${row.hasValidActual ? 'top-2 bottom-1/2 mb-1' : 'top-3 bottom-3'}`} style={{ left: `${leftPos}px`, width: `${barWidth}px` }} title={`Target Duration: ${row.duration} Days`}>
                      {!isShort && <span className="text-[9px] font-extrabold text-white drop-shadow-md px-1 truncate">{row.duration} days</span>}
                    </div>
                    {isShort && <span className={`absolute flex items-center text-[9px] font-bold text-gray-500 ${row.hasValidActual ? 'top-2 bottom-1/2 mb-1' : 'top-3 bottom-3'}`} style={{ left: `${leftPos + barWidth + 4}px` }}>{row.duration} days</span>}

                    {row.hasValidActual && (
                      <>
                        <div className={`absolute rounded shadow-sm flex items-center justify-center transition-all ${actualColorClass} top-1/2 bottom-2 mt-1`} style={{ left: `${actLeftPos}px`, width: `${actBarWidth}px` }} title={`Actual Duration: ${row.actDuration} Days`}>
                          {!isActShort && <span className="text-[9px] font-extrabold text-white drop-shadow-md px-1 truncate">{row.actDuration} days</span>}
                        </div>
                        {isActShort && <span className="absolute flex items-center text-[9px] font-bold text-gray-600 top-1/2 bottom-2 mt-1" style={{ left: `${actLeftPos + actBarWidth + 4}px` }}>{row.actDuration} days</span>}
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