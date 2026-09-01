import React, { useEffect, useState } from 'react';
import { AlertCircle, BarChart3, Calendar, Clock, Layers, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import * as db from '../../utils/db';
import { calculateMilestoneDeadlines } from '../../utils/scheduler';
import { formatDate } from '../../utils/date';
import Alert from '../../components/ui/Alert.jsx';

const dayMs = 1000 * 60 * 60 * 24;
const daysBetween = (start, end) => Math.round((new Date(end) - new Date(start)) / dayMs);

export default function Dashboard({ dateFormat }) {
  const [projects, setProjects] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [components, setComponents] = useState([]);
  const [componentUsage, setComponentUsage] = useState({});
  const [milestones, setMilestones] = useState({});
  const [activeTab, setActiveTab] = useState('product');
  const [selectedTag, setSelectedTag] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [comparisonRows, setComparisonRows] = useState([]);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);

  const triggerAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [projectData, typeData, componentData] = await Promise.all([db.getProjects(), db.getProductTypes(), db.getComponents()]);
        const milestoneMap = {};
        const usageMap = {};
        for (const type of typeData) {
          const attachedComponents = await db.getAttachedComponents(type.id);
          attachedComponents.forEach(component => {
            usageMap[component.id] = [...(usageMap[component.id] || []), type.name];
          });
          const schedules = await db.getSchedules(type.id);
          for (const schedule of schedules) milestoneMap[schedule.id] = await db.getMilestones(schedule.id);
        }
        setProjects(projectData);
        setProductTypes(typeData);
        setComponents(componentData);
        setComponentUsage(usageMap);
        setMilestones(milestoneMap);
        if (projectData.length > 0) setSelectedTag(projectData[0].tag_no);
      } catch (err) {
        triggerAlert('error', `Failed to load dashboard: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const selectedProject = projects.find(project => project.tag_no === selectedTag);
  const selectedMilestones = selectedProject ? milestones[selectedProject.schedule_id] || [] : [];
  const deadlines = selectedProject ? calculateMilestoneDeadlines(selectedProject, selectedMilestones) : {};
  const datedMilestones = selectedMilestones
    .map(milestone => ({ ...milestone, target: deadlines[milestone.id] }))
    .filter(milestone => milestone.target)
    .sort((first, second) => first.target.localeCompare(second.target));

  const getProjectStatusCounts = () => {
    const today = new Date().toISOString().split('T')[0];
    const actuals = selectedProject && typeof selectedProject.actual_dates === 'string' ? JSON.parse(selectedProject.actual_dates || '{}') : (selectedProject?.actual_dates || {});
    return datedMilestones.reduce((counts, milestone) => {
      const actual = actuals[milestone.id];
      if (actual) counts[actual <= milestone.target ? 'completedBefore' : 'completedAfter']++;
      else if (milestone.target < today) counts.overdue++;
      else {
        const days = daysBetween(today, milestone.target);
        counts[days <= 7 ? 'veryUrgent' : days <= 30 ? 'urgent' : 'onTrack']++;
      }
      return counts;
    }, { completedBefore: 0, completedAfter: 0, onTrack: 0, urgent: 0, veryUrgent: 0, overdue: 0 });
  };

  const dashboardCopy = {
    product: ['Project Dashboard', 'Review the schedule and current progress of a selected project.'],
    productType: ['Product Type Dashboard', 'Review the consolidated status of the projects under a selected product type.'],
    components: ['Components Dashboard', 'Review the demand of a selected component.']
  };

  const addComparisonRow = () => setComparisonRows(rows => [...rows, { start: '', end: '' }]);
  const updateComparisonRow = (index, field, value) => setComparisonRows(rows => rows.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row));
  const removeComparisonRow = index => setComparisonRows(rows => rows.filter((_, rowIndex) => rowIndex !== index));

  if (loading) return <div className="p-16 text-center text-gray-500">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{dashboardCopy[activeTab][0]}</h2>
          <p className="text-xs text-gray-500 mt-1">{dashboardCopy[activeTab][1]}</p>
        </div>
        <div className="flex gap-2">
          {['product', 'productType', 'components'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 py-2 rounded-lg text-xs font-bold ${activeTab === tab ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {tab === 'product' ? 'Projects' : tab === 'productType' ? 'Product Type' : 'Components'}
            </button>
          ))}
        </div>
      </div>

      <Alert alert={alert} />

      {activeTab === 'product' && (
        <>
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <label className="block text-xs font-bold text-gray-500 uppercase">Select project</label>
            <select value={selectedTag} onChange={event => { setSelectedTag(event.target.value); setComparisonRows([]); }} className="mt-2 w-full max-w-xl rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white">
              <option value="">Choose a registered product</option>
              {projects.map(project => <option key={project.tag_no} value={project.tag_no}>{project.tag_no} - {project.customer}</option>)}
            </select>
          </div>

          {selectedProject ? <>
            <section className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {[['Tag No', selectedProject.tag_no], ['Customer', selectedProject.customer], ['Product', selectedProject.product_type_name], ['Schedule', selectedProject.schedule_name], ['Contract Signed', formatDate(selectedProject.contract_signed_date, dateFormat)], ['ROS Deadline', formatDate(selectedProject.ros_date, dateFormat)]].map(([label, value]) => <div key={label}><span className="block text-[10px] uppercase font-bold text-gray-400">{label}</span><span className={`block mt-1 font-semibold text-gray-800 ${label === 'Tag No' ? 'text-lg' : 'text-sm'}`}>{value || '-'}</span></div>)}
              </div>
              <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap gap-2 text-[10px] font-bold">
                {Object.entries(getProjectStatusCounts()).map(([key, value]) => <span key={key} className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">{key.replace(/([A-Z])/g, ' $1')}: {value}</span>)}
              </div>
              <button onClick={() => setShowDetails(value => !value)} className="mt-4 w-full flex justify-center text-gray-500 hover:text-indigo-600" title={showDetails ? 'Collapse project details' : 'Expand project details'}>{showDetails ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}</button>
              {showDetails && <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5 border-t border-gray-100 text-xs">{[['Contract No.', selectedProject.contract_no], ['Sales Ref.', selectedProject.sales_ref], ['PM Owner', selectedProject.pm_owner], ['Engineer', selectedProject.engineer_owner], ['Procurement', selectedProject.procurement_owner], ['Production', selectedProject.production_owner], ['FAT Owner', selectedProject.fat_owner], ['Notes', selectedProject.notes]].map(([label, value]) => <div key={label}><span className="block text-[10px] uppercase font-bold text-gray-400">{label}</span><span className="block mt-1 font-semibold text-gray-700">{value || '-'}</span></div>)}</div>}
            </section>

            <section className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5"><Calendar className="w-5 h-5 text-indigo-600" /><h3 className="font-bold text-gray-900">Milestone timeline</h3></div>
              <div className="border-l-2 border-indigo-200 ml-3 space-y-5">
                {datedMilestones.map((milestone, index) => { const previous = datedMilestones[index - 1]; const actuals = typeof selectedProject.actual_dates === 'string' ? JSON.parse(selectedProject.actual_dates || '{}') : (selectedProject.actual_dates || {}); const actual = actuals[milestone.id]; const status = actual ? (actual <= milestone.target ? 'Completed before deadline' : 'Completed after deadline') : milestone.target < new Date().toISOString().split('T')[0] ? 'Overdue' : 'On track'; return <div key={milestone.id} className="relative pl-6"><span className="absolute w-3 h-3 bg-indigo-600 rounded-full -left-[7px] top-1" /><div className="grid grid-cols-1 md:grid-cols-3 gap-2"><div><p className="font-semibold text-sm text-gray-900">{milestone.name}</p>{previous && <p className="text-xs text-gray-500">{daysBetween(previous.target, milestone.target)} days since {previous.name}</p>}</div><span className="text-xs font-bold text-indigo-700">Deadline: {formatDate(milestone.target, dateFormat)}</span><span className="text-xs text-gray-600">Actual: {formatDate(actual, dateFormat)} / {status}</span></div></div>; })}
              </div>
            </section>

            <section className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-4"><div className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-indigo-600" /><h3 className="font-bold text-gray-900">Milestone Gantt Chart</h3></div><button onClick={addComparisonRow} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold"><Plus className="w-4 h-4" />Add comparison</button></div>
              {comparisonRows.length === 0 ? <p className="text-sm text-gray-500">Add a row to compare any two milestones.</p> : <div className="space-y-3">{comparisonRows.map((row, index) => { const start = datedMilestones.find(m => m.id === parseInt(row.start)); const end = datedMilestones.find(m => m.id === parseInt(row.end)); const duration = start && end ? daysBetween(start.target, end.target) : null; const valid = duration !== null && duration >= 0; const rangeStart = datedMilestones[0]?.target; const rangeEnd = datedMilestones[datedMilestones.length - 1]?.target; const rangeSpan = rangeStart && rangeEnd ? Math.max(1, daysBetween(rangeStart, rangeEnd)) : 1; const left = start && rangeStart ? Math.max(0, daysBetween(rangeStart, start.target) / rangeSpan * 100) : 0; const width = valid && start && end ? Math.max(1, daysBetween(start.target, end.target) / rangeSpan * 100) : 0; return <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 items-center"><select value={row.start} onChange={event => updateComparisonRow(index, 'start', event.target.value)} className="rounded border border-gray-300 px-2 py-2 text-xs"><option value="">Start milestone</option>{datedMilestones.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select><select value={row.end} onChange={event => updateComparisonRow(index, 'end', event.target.value)} className="rounded border border-gray-300 px-2 py-2 text-xs"><option value="">End milestone</option>{datedMilestones.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select><button onClick={() => removeComparisonRow(index)} className="p-2 text-red-600 hover:bg-red-50 rounded" title="Remove comparison"><Trash2 className="w-4 h-4" /></button><div className="md:col-span-3">{duration !== null && !valid ? <p className="text-xs text-red-600">End milestone must occur after the start milestone.</p> : duration !== null && <div className="relative h-8 bg-gray-100 rounded"><div style={{ left: `${left}%`, width: `${width}%` }} className="absolute top-1 bottom-1 bg-indigo-500 rounded" /><span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-700">{duration} days</span></div>}</div></div>; })}</div>}
            </section>
          </> : <div className="p-16 text-center text-gray-500 bg-white rounded-lg border border-gray-200">No registered products are available.</div>}
        </>
      )}

      {activeTab === 'productType' && <section className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm"><div className="flex items-center gap-2 mb-4"><Layers className="w-5 h-5 text-indigo-600" /><h3 className="font-bold text-gray-900">Product Type Health</h3></div><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{productTypes.map(type => <div key={type.id} className="border border-gray-200 rounded-lg p-4"><div className="flex justify-between gap-2"><span className="font-bold text-sm">{type.name}</span><span className={`text-[10px] font-bold px-2 py-1 rounded-full ${type.status === 'valid' ? 'bg-emerald-50 text-emerald-700' : type.status === 'sub-valid' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>{type.status}</span></div><p className="text-xs text-gray-500 mt-3">{type.schedule_count} schedules / {type.component_count} components</p><p className="text-xs text-gray-500 mt-1">{projects.filter(project => project.product_type_id === type.id).length} registered products</p></div>)}</div></section>}

      {activeTab === 'components' && <section className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm"><div className="flex items-center gap-2 mb-4"><Clock className="w-5 h-5 text-indigo-600" /><h3 className="font-bold text-gray-900">Component Demand</h3></div><p className="text-xs text-gray-500 mb-4">Components currently used by registered product types.</p><div className="divide-y divide-gray-200">{components.length === 0 ? <p className="text-sm text-gray-500">No components available.</p> : components.map(component => { const typeNames = componentUsage[component.id] || []; const projectCount = projects.filter(project => typeNames.includes(project.product_type_name)).length; return <div key={component.id} className="flex items-center justify-between gap-4 py-3 text-sm"><span className="font-semibold">{component.name}</span><span className="text-right text-gray-500">{typeNames.length} product types / {projectCount} registered projects</span></div>; })}</div></section>}
    </div>
  );
}
