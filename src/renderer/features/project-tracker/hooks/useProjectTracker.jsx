import { useState, useEffect } from 'react';
import * as db from '../../../utils/db'; 
import { calculateMilestoneDeadlines } from '../../../utils/scheduler';
import { stringifyCSV } from '../../../utils/csv';
import { getUrgencySettings } from '../../../utils/date';

/**
 * useProjectTracker
 *
 * This custom React hook manages the project tracker data used by the Project Tracker feature.
 * Its job is to keep the UI in sync with data stored in the app database,
 * while also providing functions for searching, filtering, sorting, and common CRUD actions.
 * 
 * Why this exists:
 * - The component that displays project tracker data does not need to know how to fetch or update data directly.
 * - This hook centralizes all project tracker logic in one place.
 * - It makes components simpler and easier to reuse.
 * 
 * What it returns:
 * An object containing state values and functions that the UI can use:
 * 
 * State values:
 * - projects: all projects loaded from the database
 * - productTypes: all product types loaded from the database
 * - allSchedules: map of scheduleId to schedule objects
 * - allMilestones: map of scheduleId to array of milestone objects
 * - allComponentSchedules: map of scheduleId to array of component schedule configurations
 * - allComponents: list of all components
 * - loading: true while the data is being fetched
 * - expandedProject: tag_no of the currently expanded project in the UI
 * - alert: current alert message to display in the UI
 * 
 * Search and filter states:
 * - searchTerm: current search text entered by the user
 * - ptFilter: current selected product type filter
 * - statusFilter: current selected project status filter
 * - sortBy: current sorting option for projects
 * - milestoneSort: current sorting option for milestones
 * - componentSort: current sorting option for components
 * - editingActual: milestoneId of the currently editing actual date
 * 
 * Edit Modal State:
 * - editingProject: project object currently being edited
 * - editForm: form data for editing a project
 * 
 * Functions:
 * - triggerAlert(type, message): shows an alert message in the UI
 * - loadAllTrackerData(): fetches all tracker data from the database
 * - handleExportProjects(): exports project data to a CSV file
 * - handleActualDateUpdate(tagNo, milestoneId, dateStr): updates the actual date for a milestone
 * - handleActualReceivedUpdate(tagNo, componentId, dateStr): updates the actual received date for a component
 * - getMilestoneStatus(target, actual, today): returns the status of a milestone based on its target and actual dates
 * - sortRows(rows, sortState): sorts an array of rows based on the given sort state
 * - toggleTableSort(setter, key): toggles the sorting direction for a given key
 * 
 */

export default function useProjectTracker() {
  // Global reference states
  const [projects, setProjects] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [allSchedules, setSchedules] = useState({}); 
  const [allMilestones, setMilestones] = useState({}); 
  const [allComponentSchedules, setComponentSchedules] = useState({}); 
  const [allComponents, setComponents] = useState([]); 

  // UI state
  const [loading, setLoading] = useState(true);
  const [expandedProject, setExpandedProject] = useState(null); 
  const [alert, setAlert] = useState(null);
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [ptFilter, setPtFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); 
  const [sortBy, setSortBy] = useState('tag_no');
  const [milestoneSort, setMilestoneSort] = useState({ key: 'target', direction: 'asc' });
  const [componentSort, setComponentSort] = useState({ key: 'latest', direction: 'asc' });
  const [editingActual, setEditingActual] = useState(null);
  const urgencySettings = getUrgencySettings();

  // Edit Modal State
  const [editingProject, setEditingProject] = useState(null);
  const [editForm, setEditForm] = useState({});

  const triggerAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  useEffect(() => {
    loadAllTrackerData();
  }, []);

  const loadAllTrackerData = async () => {
    setLoading(true);
    try {
      const projs = await db.getProjects();
      setProjects(projs);

      const pts = await db.getProductTypes();
      setProductTypes(pts);

      const comps = await db.getComponents();
      setComponents(comps);

      const schedMap = {};
      const milesMap = {};
      const compSchedMap = {};

      for (const pt of pts) {
        const scheds = await db.getSchedules(pt.id);
        for (const s of scheds) {
          schedMap[s.id] = s;
          const miles = await db.getMilestones(s.id);
          milesMap[s.id] = miles;
          const compScheds = await db.getComponentSchedules(s.id);
          compSchedMap[s.id] = compScheds;
        }
      }

      setSchedules(schedMap);
      setMilestones(milesMap);
      setComponentSchedules(compSchedMap);
    } catch (err) {
      triggerAlert('error', `Failed to load Tracker dashboards: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportProjects = async () => {
    try {
      const headers = [
        'Tag No', 'Description', 'Product Type', 'Schedule Name', 'Customer', 
        'Contract No', 'Sales Ref', 'PM Owner', 'Engineer Owner', 'Procurement Owner', 
        'Production Owner', 'FAT Owner', 'Contract Signed Date', 'ROS Date', 'Notes', 'Actual Completion Dates'
      ];
      
      const rows = projects.map(p => [
        p.tag_no, p.description || '', p.product_type_name, p.schedule_name, p.customer,
        p.contract_no, p.sales_ref, p.pm_owner, p.engineer_owner, p.procurement_owner,
        p.production_owner, p.fat_owner, p.contract_signed_date, p.ros_date, p.notes || '', p.actual_dates || '{}'
      ]);

      const csvContent = stringifyCSV(headers, rows);

      const saveRes = await window.electronAPI.showSaveDialog({
        title: 'Export Registered Projects',
        defaultPath: 'project_registry_export.csv',
        filters: [{ name: 'CSV Files', extensions: ['csv'] }]
      });

      if (!saveRes.canceled && saveRes.filePath) {
        await window.electronAPI.writeFileContent(saveRes.filePath, csvContent);
        triggerAlert('success', 'Project records exported successfully!');
      }
    } catch (err) {
      triggerAlert('error', `Export failed: ${err.message}`);
    }
  };

  const handleActualDateUpdate = async (tagNo, milestoneId, dateStr) => {
    try {
      const proj = projects.find(p => p.tag_no === tagNo);
      if (!proj) return;

      const actuals = typeof proj.actual_dates === 'string'
        ? JSON.parse(proj.actual_dates || '{}')
        : (proj.actual_dates || {});

      if (dateStr) {
        actuals[milestoneId] = dateStr;
      } else {
        delete actuals[milestoneId];
      }

      await db.updateProjectActualDates(tagNo, JSON.stringify(actuals));
      triggerAlert('success', `Actual date updated. Downstream milestone deadlines re-propagated.`);
      
      const updatedProjs = await db.getProjects();
      setProjects(updatedProjs);
      setEditingActual(null);
    } catch (err) {
      triggerAlert('error', `Failed to update actual date: ${err.message}`);
    }
  };

  const handleActualReceivedUpdate = async (tagNo, componentId, dateStr) => {
    try {
      const project = projects.find(item => item.tag_no === tagNo);
      if (!project) return;
      const receivedDates = typeof project.actual_received_dates === 'string'
        ? JSON.parse(project.actual_received_dates || '{}')
        : (project.actual_received_dates || {});
      if (dateStr) receivedDates[componentId] = dateStr;
      else delete receivedDates[componentId];
      await db.updateProjectActualReceivedDates(tagNo, JSON.stringify(receivedDates));
      setProjects(await db.getProjects());
    } catch (err) {
      triggerAlert('error', `Failed to update received date: ${err.message}`);
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

  const handleDeleteProject = async (tagNo) => {
    if (!confirm(`Are you sure you want to delete project with Tag No "${tagNo}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await db.deleteProject(tagNo);
      triggerAlert('success', 'Project record deleted successfully.');
      loadAllTrackerData();
      if (expandedProject === tagNo) {
        setExpandedProject(null);
      }
    } catch (err) {
      triggerAlert('error', `Deletion failed: ${err.message}`);
    }
  };

  const handleOpenEditModal = (p) => {
    setEditingProject(p);
    setEditForm({
      tag_no: p.tag_no,
      description: p.description,
      product_type_id: p.product_type_id,
      schedule_id: p.schedule_id,
      customer: p.customer,
      contract_no: p.contract_no,
      sales_ref: p.sales_ref,
      pm_owner: p.pm_owner,
      engineer_owner: p.engineer_owner,
      procurement_owner: p.procurement_owner,
      production_owner: p.production_owner,
      fat_owner: p.fat_owner,
      contract_signed_date: p.contract_signed_date,
      ros_date: p.ros_date,
      notes: p.notes
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await db.updateProject(editForm);
      setEditingProject(null);
      triggerAlert('success', 'Project modifications saved successfully.');
      loadAllTrackerData();
    } catch (err) {
      triggerAlert('error', `Failed to save changes: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getProjectStatusSummary = (p) => {
    const milestones = allMilestones[p.schedule_id] || [];
    const milestoneDeadlines = calculateMilestoneDeadlines(p, milestones);
    const today = new Date().toISOString().split('T')[0];
    const actuals = typeof p.actual_dates === 'string'
      ? JSON.parse(p.actual_dates || '{}')
      : (p.actual_dates || {});

    let overdueCount = 0;
    let totalCount = 0;
    let completedCount = 0;

    milestones.forEach(m => {
      totalCount++;
      const isCompleted = actuals[m.id] !== undefined || m.name.toLowerCase() === 'contract signed';
      if (isCompleted) {
        completedCount++;
      } else {
        const target = milestoneDeadlines[m.id];
        if (target && target < today) overdueCount++;
      }
    });

    if (completedCount === totalCount && totalCount > 0) return { status: 'Completed', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    if (overdueCount > 0) return { status: `${overdueCount} Overdue`, color: 'bg-red-100 text-red-800 border-red-200' };
    return { status: 'On Track', color: 'bg-teal-100 text-teal-800 border-teal-200' };
  };

  const filteredProjects = projects
    .filter(p => {
      const query = searchTerm.toLowerCase();
      const matchSearch = p.tag_no.toLowerCase().includes(query) || 
        (p.description || '').toLowerCase().includes(query) ||
        p.customer.toLowerCase().includes(query) ||
        p.pm_owner.toLowerCase().includes(query) ||
        p.engineer_owner.toLowerCase().includes(query);

      const matchPt = ptFilter === 'all' || p.product_type_id === parseInt(ptFilter);
      
      const summary = getProjectStatusSummary(p);
      const matchStatus = statusFilter === 'all' || 
        (statusFilter === 'completed' && summary.status === 'Completed') ||
        (statusFilter === 'overdue' && summary.status.includes('Overdue')) ||
        (statusFilter === 'ontrack' && summary.status === 'On Track');

      return matchSearch && matchPt && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'tag_no') return a.tag_no.localeCompare(b.tag_no);
      if (sortBy === 'ros_date') return a.ros_date.localeCompare(b.ros_date);
      if (sortBy === 'contract_signed_date') return a.contract_signed_date.localeCompare(b.contract_signed_date);
      if (sortBy === 'customer') return a.customer.localeCompare(b.customer);
      return 0;
    });

  return {
    projects, productTypes, allSchedules, allMilestones, allComponentSchedules, allComponents,
    loading, expandedProject, setExpandedProject, alert,
    searchTerm, setSearchTerm, ptFilter, setPtFilter, statusFilter, setStatusFilter, 
    sortBy, setSortBy, milestoneSort, setMilestoneSort, componentSort, setComponentSort,
    editingActual, setEditingActual, editingProject, setEditingProject, editForm, setEditForm,
    urgencySettings,
    handleExportProjects, handleActualDateUpdate, handleActualReceivedUpdate,
    getMilestoneStatus, sortRows, toggleTableSort, handleDeleteProject, 
    handleOpenEditModal, handleSaveEdit, getProjectStatusSummary, filteredProjects
  };
}