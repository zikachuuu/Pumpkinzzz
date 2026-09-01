import { useState, useEffect } from 'react';
import * as db from '../../../utils/db';
import { calculateMilestoneDeadlines, calculateComponentDeadlines } from '../../../utils/scheduler';
import { getUrgencySettings } from '../../../utils/date';

export function useDashboard(triggerAlert) {
  const [projects, setProjects] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [components, setComponents] = useState([]);
  const [componentUsage, setComponentUsage] = useState({});
  const [allMilestones, setMilestones] = useState({});
  const [allComponentSchedules, setComponentSchedules] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState('');

  // Table Sorting States
  const [milestoneSort, setMilestoneSort] = useState({ key: 'target', direction: 'asc' });
  const [componentSort, setComponentSort] = useState({ key: 'latest', direction: 'asc' });

  // Reusing the Edit Modal state logic
  const [editingProject, setEditingProject] = useState(null);
  const [editForm, setEditForm] = useState({});
  const urgencySettings = getUrgencySettings();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [projectData, typeData, componentData] = await Promise.all([
        db.getProjects(), db.getProductTypes(), db.getComponents()
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
      setComponents(componentData);
      setComponentUsage(usageMap);
      setMilestones(milestoneMap);
      setComponentSchedules(compSchedMap);

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
  // --------------------------------

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

  return {
    projects, productTypes, components, componentUsage, allMilestones, allComponentSchedules,
    loading, selectedTag, setSelectedTag,
    editingProject, setEditingProject, editForm, setEditForm,
    milestoneSort, setMilestoneSort, componentSort, setComponentSort, urgencySettings,
    sortRows, toggleTableSort, handleActualDateUpdate, handleActualReceivedUpdate, getMilestoneStatus,
    handleOpenEditModal, handleSaveEdit, getProjectDetailedSummary
  };
}