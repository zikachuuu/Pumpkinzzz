import { useState, useEffect } from 'react';
import * as db from '../../../utils/db'; 
import { stringifyCSV } from '../../../utils/csv';
import { getUrgencySettings } from '../../../utils/date';
import { calculateMilestoneDeadlines, calculateComponentDeadlines } from '../../../utils/scheduler';

// 1. Define standard statuses so dropdown options never jump around
const ALL_STATUSES = [
  'Overdue', 'Very Urgent', 'Urgent', 'On Track', 
  'Completed Before Deadline', 'Completed After Deadline'
];

export function useProjectTracker() {
  const [projects, setProjects] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [allSchedules, setSchedules] = useState({}); 
  const [allMilestones, setMilestones] = useState({}); 
  const [allComponentSchedules, setComponentSchedules] = useState({}); 
  const [allComponents, setComponents] = useState([]); 

  const [loading, setLoading] = useState(true);
  const [expandedProject, setExpandedProject] = useState(null); 
  const [alert, setAlert] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // 2. Initialize status filters with ALL options selected by default
  const [ptFilter, setPtFilter] = useState([]); 
  const [milestoneStatusFilter, setMilestoneStatusFilter] = useState(ALL_STATUSES);
  const [componentStatusFilter, setComponentStatusFilter] = useState(ALL_STATUSES);
  
  const [sortBy, setSortBy] = useState('tag_no-asc');
  const [milestoneSort, setMilestoneSort] = useState({ key: 'target', direction: 'asc' });
  const [componentSort, setComponentSort] = useState({ key: 'latest', direction: 'asc' });
  const [editingActual, setEditingActual] = useState(null);
  const urgencySettings = getUrgencySettings();

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
      // 3. Initialize Product Type filter with ALL product type IDs on load
      setPtFilter(pts.map(pt => String(pt.id))); 

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
      const actuals = typeof proj.actual_dates === 'string' ? JSON.parse(proj.actual_dates || '{}') : (proj.actual_dates || {});
      if (dateStr) actuals[milestoneId] = dateStr;
      else delete actuals[milestoneId];
      await db.updateProjectActualDates(tagNo, JSON.stringify(actuals));
      const updatedProjs = await db.getProjects();
      setProjects(updatedProjs);
    } catch (err) {
      triggerAlert('error', `Failed to update actual date: ${err.message}`);
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
      triggerAlert('success', 'Project modifications saved successfully.');
      loadAllTrackerData();
    } catch (err) {
      triggerAlert('error', `Failed to save changes: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getProjectDetailedSummary = (p) => {
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
      const isContractSigned = m.name.toLowerCase() === 'contract signed';
      if (isContractSigned) return;

      const target = deadlines[m.id] || null;
      const actual = actuals[m.id] || null;
      
      let status = getMilestoneStatus(target, actual, today);
      addStatus(status, 'milestones');
    });

    const computedComps = calculateComponentDeadlines(deadlines, compScheds, allComponents, urgencySettings);
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

  // Provide static standard options so the dropdown doesn't flicker/resize
  const milestoneStatuses = ALL_STATUSES;
  const componentStatuses = ALL_STATUSES;

  const filteredProjects = projects
    .filter(p => {
      const query = searchTerm.toLowerCase();
      const matchSearch = p.tag_no.toLowerCase().includes(query) || 
        (p.description || '').toLowerCase().includes(query) ||
        p.customer.toLowerCase().includes(query) ||
        p.pm_owner.toLowerCase().includes(query) ||
        p.engineer_owner.toLowerCase().includes(query);

      // 4. STRICT FILTERING: Removes the "length === 0" bypass
      const matchPt = ptFilter.includes(String(p.product_type_id));
      
      const detailedSummary = getProjectDetailedSummary(p);
      const selectedMilestoneStatuses = milestoneStatusFilter.map(status => status.toLowerCase());
      const selectedComponentStatuses = componentStatusFilter.map(status => status.toLowerCase());
      
      // If a project has 0 tracking items, it shouldn't fail the filter.
      // If it DOES have tracking items, at least one status must be selected in the dropdown.
      const milestoneItems = detailedSummary.filter(item => item.milestones > 0);
      const matchMilestoneStatus = milestoneItems.length === 0 || 
        milestoneItems.some(item => selectedMilestoneStatuses.includes(item.status.toLowerCase()));
        
      const componentItems = detailedSummary.filter(item => item.components > 0);
      const matchComponentStatus = componentItems.length === 0 || 
        componentItems.some(item => selectedComponentStatuses.includes(item.status.toLowerCase()));

      return matchSearch && matchPt && matchMilestoneStatus && matchComponentStatus;
    })
    .sort((a, b) => {
      const [sortKey, direction] = sortBy.split('-');
      const multiplier = direction === 'desc' ? -1 : 1;
      const compareText = (first, second) => String(first || '').localeCompare(String(second || ''), undefined, { sensitivity: 'base', numeric: true });
      const compareDate = (first, second) => String(first || '9999-12-31').localeCompare(String(second || '9999-12-31'));
      let result;

      if (sortKey === 'contract_signed_date' || sortKey === 'ros_date') {
        result = compareDate(a[sortKey], b[sortKey]);
      } else {
        result = compareText(a[sortKey], b[sortKey]);
        if (result === 0 && sortKey === 'product_type_name') {
          result = compareText(a.schedule_name, b.schedule_name);
        }
      }

      return result * multiplier;
    });

  return {
    projects, productTypes, allSchedules, allMilestones, allComponentSchedules, allComponents,
    loading, expandedProject, setExpandedProject, alert,
    searchTerm, setSearchTerm, ptFilter, setPtFilter, milestoneStatusFilter, setMilestoneStatusFilter,
    componentStatusFilter, setComponentStatusFilter, milestoneStatuses, componentStatuses,
    sortBy, setSortBy, milestoneSort, setMilestoneSort, componentSort, setComponentSort,
    editingActual, setEditingActual, editingProject, setEditingProject, editForm, setEditForm,
    urgencySettings,
    handleExportProjects, 
    handleActualDateUpdate, 
    handleActualReceivedUpdate,
    getMilestoneStatus, 
    sortRows, toggleTableSort, 
    handleDeleteProject, 
    handleOpenEditModal, 
    handleSaveEdit, 
    getProjectDetailedSummary,
    filteredProjects
  };
}