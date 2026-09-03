import { useState, useEffect } from 'react';
import * as db from '../../../utils/db';
import { calculateMilestoneDeadlines, calculateComponentDeadlines } from '../../../utils/scheduler';
import { getUrgencySettings } from '../../../utils/date';

// 1. Standard statuses for the strict dropdown filters
const ALL_STATUSES = [
  'Overdue', 'Very Urgent', 'Urgent', 'On Track', 
  'Completed before deadline', 'Completed after deadline'
];

export function useDashboard(triggerAlert) {
  const [projects, setProjects] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [components, setComponents] = useState([]);
  const [componentUsage, setComponentUsage] = useState({});
  const [allMilestones, setMilestones] = useState({});
  const [allComponentSchedules, setComponentSchedules] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState('');

  // 2. Search & Strict Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [ptFilter, setPtFilter] = useState([]); 
  const [milestoneStatusFilter, setMilestoneStatusFilter] = useState(ALL_STATUSES);
  const [componentStatusFilter, setComponentStatusFilter] = useState(ALL_STATUSES);
  
  const milestoneStatuses = ALL_STATUSES;
  const componentStatuses = ALL_STATUSES;

  // Table Sorting States
  const [milestoneSort, setMilestoneSort] = useState({ key: 'target', direction: 'asc' });
  const [componentSort, setComponentSort] = useState({ key: 'latest', direction: 'asc' });

  // Reusing the Edit Modal state logic
  const [editingProject, setEditingProject] = useState(null);
  const [editForm, setEditForm] = useState({});
  const urgencySettings = getUrgencySettings();

  const [savedChartsSummary, setSavedChartsSummary] = useState({ 1: null, 2: null, 3: null, 4: null, 5: null });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [projectData, typeData, componentData, ganttSummary] = await Promise.all([
        db.getProjects(), db.getProductTypes(), db.getComponents(),
        db.getSavedGanttChartsSummary()
      ]);

      const milestoneMap = {};
      const usageMap = {};
      const compSchedMap = {};

      for (const type of typeData) {
        const attachedComponents = await db.getAttachedComponents(type.id);
        attachedComponents.forEach(component => {
          usageMap[component.id] = [...(usageMap[component.id] || []), type.name];
        });

        const schedules = await db.getSchedules(type.id);
        for (const schedule of schedules) {
          milestoneMap[schedule.id] = await db.getMilestones(schedule.id);
          compSchedMap[schedule.id] = await db.getComponentSchedules(schedule.id);
        }
      }

      setProjects(projectData);
      setProductTypes(typeData);
      // Initialize Product Type filter with all IDs
      setPtFilter(typeData.map(pt => String(pt.id)));

      setComponents(componentData);
      setComponentUsage(usageMap);
      setMilestones(milestoneMap);
      setComponentSchedules(compSchedMap);
      
      setSavedChartsSummary(ganttSummary);

      if (projectData.length > 0) setSelectedTag(projectData[0].tag_no);
    } catch (err) {
      if (triggerAlert) triggerAlert('error', `Failed to load dashboard: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- TABLE HELPERS & HANDLERS ---
  const sortRows = (rows, sortState) => [...rows].sort((first, second) => {
    const firstValue = String(first[sortState.key] ?? '').toLowerCase();
    const secondValue = String(second[sortState.key] ?? '').toLowerCase();
    const result = firstValue.localeCompare(secondValue, undefined, { numeric: true });
    return sortState.direction === 'asc' ? result : -result;
  });

  const toggleTableSort = (setter, key) => setter(current => ({
    key,
    direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
  }));

  const handleActualDateUpdate = async (tagNo, milestoneId, dateStr) => {
    try {
      const proj = projects.find(p => p.tag_no === tagNo);
      if (!proj) return;
      const actuals = typeof proj.actual_dates === 'string' ? JSON.parse(proj.actual_dates || '{}') : (proj.actual_dates || {});
      if (dateStr) actuals[milestoneId] = dateStr;
      else delete actuals[milestoneId];
      await db.updateProjectActualDates(tagNo, JSON.stringify(actuals));
      const updatedProjs = await db.getProjects();
      setProjects(updatedProjs);
    } catch (err) {
      if (triggerAlert) triggerAlert('error', `Failed to update actual date: ${err.message}`);
    }
  };

  const handleActualReceivedUpdate = async (tagNo, componentId, dateStr) => {
    try {
      const project = projects.find(item => item.tag_no === tagNo);
      if (!project) return;
      const receivedDates = typeof project.actual_received_dates === 'string' ? JSON.parse(project.actual_received_dates || '{}') : (project.actual_received_dates || {});
      if (dateStr) receivedDates[componentId] = dateStr;
      else delete receivedDates[componentId];
      await db.updateProjectActualReceivedDates(tagNo, JSON.stringify(receivedDates));
      const updatedProjs = await db.getProjects();
      setProjects(updatedProjs);
    } catch (err) {
      if (triggerAlert) triggerAlert('error', `Failed to update received date: ${err.message}`);
    }
  };

  const getMilestoneStatus = (target, actual, today) => {
    if (actual) return actual <= target ? 'Completed before deadline' : 'Completed after deadline';
    if (!target || target < today) return 'Overdue';
    const daysRemaining = Math.ceil((new Date(target) - new Date(today)) / (1000 * 60 * 60 * 24));
    if (daysRemaining <= urgencySettings.milestoneVeryUrgentDays) return 'Very Urgent';
    if (daysRemaining <= urgencySettings.milestoneUrgentDays) return 'Urgent';
    return 'On Track';
  };

  const getProjectDetailedSummary = (p) => {
    if (!p) return [];
    const milestones = allMilestones[p.schedule_id] || [];
    const compScheds = allComponentSchedules[p.schedule_id] || [];
    
    const theoreticalProject = { ...p, actual_dates: '{}' };
    const deadlines = calculateMilestoneDeadlines(theoreticalProject, milestones);
    
    const actuals = typeof p.actual_dates === 'string' ? JSON.parse(p.actual_dates || '{}') : (p.actual_dates || {});
    const receivedDates = typeof p.actual_received_dates === 'string' ? JSON.parse(p.actual_received_dates || '{}') : (p.actual_received_dates || {});
    const today = new Date().toISOString().split('T')[0];

    const summaryMap = {};
    const addStatus = (status, type) => {
      if (!summaryMap[status]) summaryMap[status] = { milestones: 0, components: 0 };
      summaryMap[status][type]++;
    };

    milestones.forEach(m => {
      if (m.name.toLowerCase() === 'contract signed') return;
      const target = deadlines[m.id] || null;
      const actual = actuals[m.id] || null;
      let status = getMilestoneStatus(target, actual, today);
      addStatus(status, 'milestones');
    });

    const computedComps = calculateComponentDeadlines(deadlines, compScheds, components, urgencySettings);
    computedComps.forEach(cc => {
      const receivedDate = receivedDates[cc.component_id] || '';
      let status;
      if (receivedDate) {
        status = receivedDate <= cc.latest_order_date ? 'Completed before deadline' : 'Completed after deadline';
      } else {
        status = cc.urgency;
      }
      addStatus(status, 'components');
    });

    const statusOrder = ['Overdue', 'Very Urgent', 'Urgent', 'On Track', 'Completed before deadline', 'Completed after deadline'];
    return Object.entries(summaryMap)
      .sort((a, b) => {
        const idxA = statusOrder.indexOf(a[0]);
        const idxB = statusOrder.indexOf(b[0]);
        return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
      })
      .map(([status, counts]) => ({ status, ...counts }));
  };

  // 3. Strict Filtering Logic ported directly from Project Tracker
  const filteredProjects = projects.filter(p => {
    const query = searchTerm.toLowerCase();
    const matchSearch = p.tag_no.toLowerCase().includes(query) || 
      (p.description || '').toLowerCase().includes(query) ||
      p.customer.toLowerCase().includes(query) ||
      p.pm_owner.toLowerCase().includes(query) ||
      p.engineer_owner.toLowerCase().includes(query);

    const matchPt = ptFilter.includes(String(p.product_type_id));
    
    const detailedSummary = getProjectDetailedSummary(p);
    
    const milestoneItems = detailedSummary.filter(item => item.milestones > 0);
    const matchMilestoneStatus = milestoneItems.length === 0 || 
      milestoneItems.some(item => milestoneStatusFilter.includes(item.status));
      
    const componentItems = detailedSummary.filter(item => item.components > 0);
    const matchComponentStatus = componentItems.length === 0 || 
      componentItems.some(item => componentStatusFilter.includes(item.status));

    return matchSearch && matchPt && matchMilestoneStatus && matchComponentStatus;
  });

  const handleOpenEditModal = (p) => {
    setEditingProject(p);
    setEditForm({
      tag_no: p.tag_no, description: p.description, product_type_id: p.product_type_id,
      schedule_id: p.schedule_id, customer: p.customer, contract_no: p.contract_no,
      sales_ref: p.sales_ref, pm_owner: p.pm_owner, engineer_owner: p.engineer_owner,
      procurement_owner: p.procurement_owner, production_owner: p.production_owner,
      fat_owner: p.fat_owner, contract_signed_date: p.contract_signed_date,
      ros_date: p.ros_date, notes: p.notes
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await db.updateProject(editForm);
      setEditingProject(null);
      if (triggerAlert) triggerAlert('success', 'Project modifications saved successfully.');
      loadDashboardData();
    } catch (err) {
      if (triggerAlert) triggerAlert('error', `Failed to save changes: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGantt = async (slotId, projectTagNo, ganttRows) => {
    try {
      await db.saveGanttChart(slotId, projectTagNo, ganttRows);
      // Ensure we format the summary exactly how the UI expects it now { tag_no, row_count }
      setSavedChartsSummary(prev => ({ 
        ...prev, 
        [slotId]: { tag_no: projectTagNo, row_count: ganttRows.length }
      }));
      if (triggerAlert) triggerAlert('success', `Gantt chart saved to Slot ${slotId}`);
      return true;
    } catch (err) {
      if (triggerAlert) triggerAlert('error', `Failed to save chart: ${err.message}`);
      return false;
    }
  };

  const handleLoadGantt = async (slotId, setSelectedTag, setGanttRows) => {
    try {
      const rows = await db.getGanttChart(slotId);
      if (rows.length > 0) {
        const formattedRows = rows.map(r => ({
          name: r.custom_name || '',
          start: r.start_milestone_id != null ? String(r.start_milestone_id) : '',
          end: r.end_milestone_id != null ? String(r.end_milestone_id) : ''
        }));

        if (setSelectedTag) setSelectedTag(rows[0].project_tag_no);
        if (setGanttRows) setGanttRows(formattedRows);

        if (triggerAlert) triggerAlert('success', `Loaded chart from Slot ${slotId}`);
        return formattedRows;
      }

      if (triggerAlert) triggerAlert('warning', `Slot ${slotId} is empty.`);
      return [];
    } catch (err) {
      if (triggerAlert) triggerAlert('error', `Failed to load chart: ${err.message}`);
      return [];
    }
  };

  // 4. New Function to handle chart deletion
  const handleDeleteGantt = async (slotId) => {
    try {
      await db.deleteGanttChart(slotId);
      setSavedChartsSummary(prev => ({ ...prev, [slotId]: null }));
      if (triggerAlert) triggerAlert('success', `Deleted saved chart from Slot ${slotId}`);
      return true;
    } catch (err) {
      if (triggerAlert) triggerAlert('error', `Failed to delete chart: ${err.message}`);
      return false;
    }
  };

  return {
    projects, productTypes, components, componentUsage, allMilestones, allComponentSchedules,
    loading, selectedTag, setSelectedTag,
    editingProject, setEditingProject, editForm, setEditForm,
    milestoneSort, setMilestoneSort, componentSort, setComponentSort, urgencySettings,
    sortRows, toggleTableSort, handleActualDateUpdate, handleActualReceivedUpdate, getMilestoneStatus,
    handleOpenEditModal, handleSaveEdit, getProjectDetailedSummary,
    savedChartsSummary, handleSaveGantt, handleLoadGantt, handleDeleteGantt, // Added delete function
    
    // New Search & Filter Exports
    filteredProjects, searchTerm, setSearchTerm, 
    ptFilter, setPtFilter, milestoneStatusFilter, setMilestoneStatusFilter,
    componentStatusFilter, setComponentStatusFilter, milestoneStatuses, componentStatuses
  };
}