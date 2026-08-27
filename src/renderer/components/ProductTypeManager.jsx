import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Edit, ChevronRight, ChevronDown, ChevronUp, ArrowLeft, Download, Upload, 
  Search, CheckCircle2, AlertCircle, Settings, Layers, Calendar, 
  Tag, Info, Check, RefreshCw, X
} from 'lucide-react';
import * as db from '../utils/db';
import BatchCsvSection from './BatchCsvSection';
import ImportReview from './ImportReview';
import MilestoneTimeline from './MilestoneTimeline';
import { 
  parseCSV, 
  stringifyProductTypes, 
  stringifySchedulesAndMilestones,
  stringifyProductTypesTemplate,
  stringifySchedulesTemplate,
  stringifyMilestonesOnly,
  stringifyFullProductTypeBackup
} from '../utils/csv';

export default function ProductTypeManager() {
  // State for Product Types Overview List
  const [productTypes, setProductTypes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Modal / Dialog States
  const [showAddPtModal, setShowAddPtModal] = useState(false);
  const [ptNameInput, setPtNameInput] = useState('');
  const [ptModalError, setPtModalError] = useState('');
  const [showValidityModal, setShowValidityModal] = useState(false);
  const [ptRenameId, setPtRenameId] = useState(null);
  const [ptRenameInput, setPtRenameInput] = useState('');
  const [importReview, setImportReview] = useState(null);
  const [showBatchCsvOptions, setShowBatchCsvOptions] = useState(false);

  // Selected Product Type detail state
  const [selectedPt, setSelectedPt] = useState(null);
  const [activeTab, setActiveTab] = useState('schedules'); // schedules, components, leadtimes

  // Detail View: Schedules & Milestones State
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [scheduleValidity, setScheduleValidity] = useState({});
  const [scheduleSubView, setScheduleSubView] = useState('tree'); // 'tree', 'timeline', 'records'
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [scheduleNameInput, setScheduleNameInput] = useState('');

  // Milestone edit/add state
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null); // null if adding
  const [milestoneForm, setMilestoneForm] = useState({
    name: '',
    anchor_id: '',
    days: 0,
    direction: 'after', // 'after' or 'before'
    remark: ''
  });

  // Components Management State
  const [attachedComponents, setAttachedComponents] = useState([]);
  const [allGlobalComponents, setAllGlobalComponents] = useState([]);
  const [componentProductTypeSearch, setComponentProductTypeSearch] = useState('');
  const [componentProductTypeId, setComponentProductTypeId] = useState('');
  const [sourceComponents, setSourceComponents] = useState([]);
  const [componentSearch, setComponentSearch] = useState('');
  const [showAddComponentModal, setShowAddComponentModal] = useState(false);
  const [componentForm, setComponentForm] = useState({ name: '', remarks: '' });
  const [selectedGlobalComponentId, setSelectedGlobalComponentId] = useState('');

  // Component Schedules Lead Times State
  const [leadTimeSettings, setLeadTimeSettings] = useState({}); // key: compId-scheduleId -> { anchorId, leadTime }

  // Initial Data Load
  useEffect(() => {
    loadProductTypes();
    loadGlobalComponents();
  }, []);

  // Alert dismiss helper
  const triggerAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const loadProductTypes = async () => {
    setLoading(true);
    try {
      const data = await db.getProductTypes();
      setProductTypes(data);
    } catch (err) {
      triggerAlert('error', `Failed to load product types: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Select Product Type Detail Handler
  const handleSelectProductType = async (pt) => {
    setSelectedPt(pt);
    setActiveTab('schedules');
    setLoading(true);
    try {
      // Load schedules and components
      const scheds = await db.getSchedules(pt.id);
      setSchedules(scheds);
      
      const attached = await db.getAttachedComponents(pt.id);
      setAttachedComponents(attached);
      setComponentProductTypeId(String(pt.id));
      await refreshScheduleValidity(scheds, attached);

      // Select first schedule by default
      if (scheds.length > 0) {
        handleSelectSchedule(scheds[0], pt.id);
      } else {
        setSelectedSchedule(null);
        setMilestones([]);
      }
    } catch (err) {
      triggerAlert('error', `Error loading details: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSchedule = async (schedule, ptId = selectedPt.id) => {
    setSelectedSchedule(schedule);
    try {
      const milestonesData = await db.getMilestones(schedule.id);
      setMilestones(milestonesData);
      
      // Load lead times for this schedule
      const componentScheds = await db.getComponentSchedules(schedule.id);
      const settingsUpdate = { ...leadTimeSettings };
      componentScheds.forEach(cs => {
        settingsUpdate[`${cs.component_id}-${schedule.id}`] = {
          anchor_id: cs.anchor_milestone_id,
          lead_time: cs.lead_time
        };
      });
      setLeadTimeSettings(settingsUpdate);
    } catch (err) {
      triggerAlert('error', `Failed to load milestones/lead times: ${err.message}`);
    }
  };

  // Refresh active details
  const refreshPtDetails = async () => {
    if (!selectedPt) return;
    try {
      const updatedPts = await db.getProductTypes();
      const currentPt = updatedPts.find(p => p.id === selectedPt.id);
      if (currentPt) {
        setSelectedPt(currentPt);
      }
      
      const scheds = await db.getSchedules(selectedPt.id);
      setSchedules(scheds);
      
      const attached = await db.getAttachedComponents(selectedPt.id);
      setAttachedComponents(attached);
      await refreshScheduleValidity(scheds, attached);

      if (selectedSchedule) {
        const stillExists = scheds.find(s => s.id === selectedSchedule.id);
        if (stillExists) {
          handleSelectSchedule(stillExists, selectedPt.id);
        } else if (scheds.length > 0) {
          handleSelectSchedule(scheds[0], selectedPt.id);
        } else {
          setSelectedSchedule(null);
          setMilestones([]);
        }
      } else if (scheds.length > 0) {
        handleSelectSchedule(scheds[0], selectedPt.id);
      }
    } catch (err) {
      console.error('Error refreshing details', err);
    }
  };

  // ==========================================
  // PRODUCT TYPE CRUD
  // ==========================================

  const handleAddProductType = async (e) => {
    e.preventDefault();
    if (!ptNameInput.trim()) return;
    setPtModalError('');

    const exists = productTypes.some(pt => pt.name.toLowerCase() === ptNameInput.trim().toLowerCase());
    if (exists) {
      setPtModalError('Product type already exists');
      return;
    }

    try {
      await db.addProductType(ptNameInput.trim());
      setPtNameInput('');
      setShowAddPtModal(false);
      setPtModalError('');
      triggerAlert('success', 'Product Type created as [INVALID]. Please configure schedules, milestones, and component lead times before use.');
      loadProductTypes();
    } catch (err) {
      setPtModalError(err.message);
    }
  };

  const handleRenameProductType = async (e) => {
    e.preventDefault();
    if (!ptRenameInput.trim() || !ptRenameId) return;

    try {
      await db.renameProductType(ptRenameId, ptRenameInput.trim());
      setPtRenameId(null);
      setPtRenameInput('');
      triggerAlert('success', 'Product Type renamed successfully!');
      loadProductTypes();
    } catch (err) {
      triggerAlert('error', `Failed to rename Product Type: ${err.message}`);
    }
  };

  const handleDeleteProductType = async (id, name) => {
    if (!confirm(`Are you sure you want to delete Product Type "${name}"? This will delete all its schedules, milestones, and project records over cascade.`)) {
      return;
    }

    try {
      await db.deleteProductType(id);
      triggerAlert('success', 'Product Type deleted successfully.');
      loadProductTypes();
      if (selectedPt && selectedPt.id === id) {
        setSelectedPt(null);
      }
    } catch (err) {
      triggerAlert('error', `Failed to delete Product Type: ${err.message}`);
    }
  };

  const handleDeleteAllProductTypes = async () => {
    if (!confirm('Delete all product types? This will remove all associated schedules and project links.')) return;
    if (!confirm('This cannot be undone. Continue deleting all product types?')) return;

    try {
      await db.deleteAllProductTypes();
      setSelectedPt(null);
      triggerAlert('success', 'All product types were deleted successfully.');
      await loadProductTypes();
    } catch (err) {
      triggerAlert('error', `Failed to delete all product types: ${err.message}`);
    }
  };

  const loadGlobalComponents = async () => {
    try {
      const data = await db.getComponents();
      setAllGlobalComponents(data);
    } catch (err) {
      console.error('Failed to load global components', err);
    }
  };

  const refreshScheduleValidity = async (scheduleList, components = attachedComponents) => {
    const validityEntries = await Promise.all(scheduleList.map(async schedule => {
      const configured = await db.getComponentSchedules(schedule.id);
      const isValid = components.length > 0 && configured.length >= components.length;
      return [schedule.id, {
        isValid,
        reason: components.length === 0
          ? 'Attach at least one component first.'
          : isValid
            ? 'All attached components have lead times for this schedule.'
            : 'Indicate lead time for every attached component.'
      }];
    }));
    setScheduleValidity(Object.fromEntries(validityEntries));
  };

  useEffect(() => {
    if (!componentProductTypeId) {
      setSourceComponents([]);
      return;
    }

    db.getAttachedComponents(parseInt(componentProductTypeId))
      .then(setSourceComponents)
      .catch(err => triggerAlert('error', `Failed to load product type components: ${err.message}`));
  }, [componentProductTypeId]);
  // ==========================================
  // SCHEDULES CRUD
  // ==========================================

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    if (!scheduleNameInput.trim() || !selectedPt) return;

    const exists = schedules.some(s => s.name.toLowerCase() === scheduleNameInput.trim().toLowerCase());
    if (exists) {
      triggerAlert('error', `A schedule named "${scheduleNameInput.trim()}" already exists for this product type.`);
      return;
    }

    try {
      await db.addSchedule(selectedPt.id, scheduleNameInput.trim());
      setScheduleNameInput('');
      setShowAddScheduleModal(false);
      triggerAlert('success', 'Schedule and standard default milestones ("Contract Signed" and "ROS") created!');
      refreshPtDetails();
    } catch (err) {
      triggerAlert('error', `Failed to create schedule: ${err.message}`);
    }
  };

  const handleDeleteSchedule = async (scheduleId, name) => {
    if (!confirm(`Are you sure you want to delete schedule "${name}"? All custom milestones and component configurations in this schedule will be lost.`)) {
      return;
    }

    try {
      await db.deleteSchedule(scheduleId, selectedPt.id);
      triggerAlert('success', 'Schedule deleted successfully.');
      refreshPtDetails();
    } catch (err) {
      triggerAlert('error', `Failed to delete schedule: ${err.message}`);
    }
  };

  // ==========================================
  // MILESTONES CRUD
  // ==========================================

  const handleOpenMilestoneModal = (milestone = null) => {
    if (milestone) {
      // Editing
      setEditingMilestone(milestone);
      setMilestoneForm({
        name: milestone.name,
        anchor_id: milestone.anchor_id || '',
        days: Math.abs(milestone.offset),
        direction: milestone.offset < 0 ? 'before' : 'after',
        remark: milestone.remark || ''
      });
    } else {
      // Adding
      setEditingMilestone(null);
      // Pick first non-ROS, non-itself milestone as anchor default
      const defaultAnchor = milestones.find(m => m.name.toLowerCase() === 'contract signed')?.id || '';
      setMilestoneForm({
        name: '',
        anchor_id: defaultAnchor,
        days: 0,
        direction: 'after',
        remark: ''
      });
    }
    setShowMilestoneModal(true);
  };

  const handleSaveMilestone = async (e) => {
    e.preventDefault();
    if (!milestoneForm.name.trim() || !selectedSchedule) return;

    const isDefault = editingMilestone && (editingMilestone.name === 'Contract Signed' || editingMilestone.name === 'ROS');

    // Name clash check
    const clashing = milestones.some(m => 
      m.name.toLowerCase() === milestoneForm.name.trim().toLowerCase() && 
      (!editingMilestone || m.id !== editingMilestone.id)
    );
    if (clashing) {
      triggerAlert('error', `A milestone named "${milestoneForm.name.trim()}" already exists in this schedule.`);
      return;
    }

    // Anchor check
    let finalAnchorId = milestoneForm.anchor_id ? parseInt(milestoneForm.anchor_id) : null;
    if (isDefault) {
      finalAnchorId = null; // Default milestones have no anchor
    }

    if (!isDefault && !finalAnchorId) {
      triggerAlert('error', 'Custom milestones must be anchored to another milestone.');
      return;
    }

    const rawDays = parseInt(milestoneForm.days) || 0;
    const computedOffset = milestoneForm.direction === 'before' ? -rawDays : rawDays;

    const payload = {
      schedule_id: selectedSchedule.id,
      name: milestoneForm.name.trim(),
      anchor_id: finalAnchorId,
      offset: isDefault ? 0 : computedOffset,
      remark: milestoneForm.remark.trim()
    };

    if (editingMilestone) {
      payload.id = editingMilestone.id;
    }

    try {
      await db.saveMilestone(payload);
      setShowMilestoneModal(false);
      triggerAlert('success', `Milestone "${payload.name}" saved successfully.`);
      refreshPtDetails();
    } catch (err) {
      triggerAlert('error', `Failed to save milestone: ${err.message}`);
    }
  };

  const handleDeleteMilestone = async (id) => {
    if (!confirm('Are you sure you want to delete this milestone? Any dependent milestones will lose their anchor relationship.')) {
      return;
    }

    try {
      await db.deleteMilestonesBulk([id]);
      triggerAlert('success', 'Milestone deleted.');
      refreshPtDetails();
    } catch (err) {
      triggerAlert('error', `Failed to delete milestone: ${err.message}`);
    }
  };

  // ==========================================
  // COMPONENTS & RELATIONSHIPS CRUD
  // ==========================================

  const handleCreateGlobalComponent = async (e) => {
    e.preventDefault();
    if (!componentForm.name.trim()) return;

    try {
      const componentName = componentForm.name.trim();
      const existingComponents = await db.getComponents();
      const existingComponent = existingComponents.find(component =>
        component.name.toLowerCase() === componentName.toLowerCase()
      );
      const componentId = existingComponent
        ? existingComponent.id
        : (await db.addComponent(componentName, componentForm.remarks.trim())).lastID;
      
      // Attach to product type immediately
      await db.attachComponentToProductType(componentId, selectedPt.id);
      
      setComponentForm({ name: '', remarks: '' });
      setShowAddComponentModal(false);
      triggerAlert('success', existingComponent
        ? 'Existing component found and attached successfully!'
        : 'New component created and attached successfully!');
      loadGlobalComponents();
      refreshPtDetails();
    } catch (err) {
      triggerAlert('error', `Failed to create component: ${err.message}`);
    }
  };

  const handleAttachExistingComponent = async () => {
    if (!selectedGlobalComponentId) return;

    try {
      await db.attachComponentToProductType(parseInt(selectedGlobalComponentId), selectedPt.id);
      setSelectedGlobalComponentId('');
      triggerAlert('success', 'Component attached successfully!');
      refreshPtDetails();
    } catch (err) {
      triggerAlert('error', `Failed to attach component: ${err.message}`);
    }
  };

  const handleDetachComponent = async (compId, compName) => {
    if (!confirm(`Are you sure you want to detach component "${compName}" from product type "${selectedPt.name}"? This deletes all its schedule lead-time configurations on this product.`)) {
      return;
    }

    try {
      await db.detachComponentFromProductType(compId, selectedPt.id);
      triggerAlert('success', 'Component detached successfully.');
      refreshPtDetails();
    } catch (err) {
      triggerAlert('error', `Failed to detach component: ${err.message}`);
    }
  };

  // ==========================================
  // COMPONENT SCHEDULE LEAD TIMES SAVE
  // ==========================================

  const handleLeadTimeChange = (compId, schedId, field, value) => {
    setLeadTimeSettings(prev => ({
      ...prev,
      [`${compId}-${schedId}`]: {
        ...prev[`${compId}-${schedId}`],
        [field]: value
      }
    }));
  };

  const handleSaveLeadTimes = async () => {
    if (!selectedPt) return;
    setLoading(true);
    try {
      // Gather all configurations
      for (const s of schedules) {
        const schedMilestones = await db.getMilestones(s.id);
        const defaultAnchorId = schedMilestones.find(m => m.name.toLowerCase() === 'ros')?.id 
                             || schedMilestones[0]?.id;

        for (const c of attachedComponents) {
          const key = `${c.id}-${s.id}`;
          const config = leadTimeSettings[key];

          const anchorId = config?.anchor_id ? parseInt(config.anchor_id) : defaultAnchorId;
          const leadTime = config?.lead_time !== undefined ? parseInt(config.lead_time) : 0;

          if (anchorId) {
            await db.saveComponentSchedule(s.id, c.id, anchorId, leadTime);
          }
        }
      }
      
      // Update validity status of the product type
      await db.updateProductTypeStatus(selectedPt.id);
      await refreshScheduleValidity(schedules, attachedComponents);
      triggerAlert('success', 'Component schedule lead times saved and status updated!');
      await refreshPtDetails();
    } catch (err) {
      triggerAlert('error', `Failed to save lead times: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLeadTimesForSchedule = async (scheduleId) => {
    if (!selectedPt) return;
    setLoading(true);
    try {
      const schedMilestones = await db.getMilestones(scheduleId);
      const defaultAnchorId = schedMilestones.find(m => m.name.toLowerCase() === 'ros')?.id
                           || schedMilestones[0]?.id;

      for (const c of attachedComponents) {
        const key = `${c.id}-${scheduleId}`;
        const config = leadTimeSettings[key];

        const anchorId = config?.anchor_id ? parseInt(config.anchor_id) : defaultAnchorId;
        const leadTime = config?.lead_time !== undefined ? parseInt(config.lead_time) : 0;

        if (anchorId) {
          await db.saveComponentSchedule(scheduleId, c.id, anchorId, leadTime);
        }
      }

      await db.updateProductTypeStatus(selectedPt.id);
      await refreshScheduleValidity(schedules, attachedComponents);
      triggerAlert('success', 'Lead times saved successfully for this schedule!');
      await refreshPtDetails();
    } catch (err) {
      triggerAlert('error', `Failed to save lead times: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // CSV IMPORT / EXPORT FUNCTIONS
  // ==========================================

  // 1. Export All Product Types
  const handleExportProductTypes = async () => {
    try {
      const allPts = await db.getProductTypes();
      const ptComponentsMap = {};
      
      for (const pt of allPts) {
        const attached = await db.getAttachedComponents(pt.id);
        ptComponentsMap[pt.id] = attached.map(c => c.name);
      }

      const csvContent = stringifyProductTypes(allPts, ptComponentsMap);
      
      const saveRes = await window.electronAPI.showSaveDialog({
        title: 'Export Product Types',
        defaultPath: 'product_types.csv',
        filters: [{ name: 'CSV Files', extensions: ['csv'] }]
      });

      if (!saveRes.canceled && saveRes.filePath) {
        await window.electronAPI.writeFileContent(saveRes.filePath, csvContent);
        triggerAlert('success', 'Product Types exported successfully!');
      }
    } catch (err) {
      triggerAlert('error', `Export failed: ${err.message}`);
    }
  };

  // 2. Import Product Types: parse and stage first; database changes happen after confirmation.
  const handleImportProductTypes = async () => {
    try {
      const openRes = await window.electronAPI.showOpenDialog({
        title: 'Import Product Types',
        filters: [{ name: 'CSV Files', extensions: ['csv'] }],
        properties: ['openFile']
      });

      if (openRes.canceled || openRes.filePaths.length === 0) return;
      
      const text = await window.electronAPI.readFileContent(openRes.filePaths[0]);
      const csvData = parseCSV(text);

      if (csvData.length < 2) {
        triggerAlert('error', 'CSV file is empty or lacks headers.');
        return;
      }

      const headers = csvData[0].map(h => h.trim().toLowerCase());
      const nameIdx = headers.indexOf('product type name');
      const compIdx = headers.indexOf('attached components');
      const isFullBackup = [
        'schedule name', 'milestone name', 'component name', 'lead time (days)'
      ].every(header => headers.includes(header));

      if (nameIdx === -1) {
        triggerAlert('error', 'Invalid CSV format. Missing required column: "Product Type Name".');
        return;
      }

      if (!isFullBackup && compIdx === -1) {
        triggerAlert('error', 'Invalid CSV format. Missing required column: "Attached Components".');
        return;
      }

      const currentPts = await db.getProductTypes();
      const importedByName = new Map();
      for (let i = 1; i < csvData.length; i++) {
        const row = csvData[i];
        const ptName = row[nameIdx]?.trim();
        if (!ptName) continue;
        if (!importedByName.has(ptName.toLowerCase())) {
          importedByName.set(ptName.toLowerCase(), { name: ptName, rows: [] });
        }
        importedByName.get(ptName.toLowerCase()).rows.push(row);
      }

      const reviewRows = [...importedByName.values()].map(item => {
        const existing = currentPts.find(pt => pt.name.toLowerCase() === item.name.toLowerCase());
        return {
          ...item,
          existing,
          decision: existing ? 'keep-existing' : 'import'
        };
      });

      if (reviewRows.length === 0) {
        triggerAlert('error', 'CSV contains no product type records.');
        return;
      }
      setImportReview({ mode: isFullBackup ? 'full' : 'partial', headers, componentIndex: compIdx, rows: reviewRows });
    } catch (err) {
      triggerAlert('error', `Import failed: ${err.message}`);
    }
  };

  const setImportDecisionForAll = (decision) => {
    setImportReview(review => review && {
      ...review,
      rows: review.rows.map(row => row.existing ? { ...row, decision } : row)
    });
  };

  const importComponent = async (name, productTypeId) => {
    const components = await db.getComponents();
    let component = components.find(item => item.name.toLowerCase() === name.toLowerCase());
    if (!component) {
      const result = await db.addComponent(name, '');
      component = { id: result.lastID, name, remarks: '' };
    }
    await db.attachComponentToProductType(component.id, productTypeId);
    return component.id;
  };

  const applyPartialImport = async (item, productTypeId, overwrite) => {
    if (overwrite) await db.clearProductTypeConfiguration(productTypeId);
    const componentNames = new Set();
    item.rows.forEach(row => (row[importReview.componentIndex] || '').split(';').map(name => name.trim()).filter(Boolean).forEach(name => componentNames.add(name)));
    for (const componentName of componentNames) await importComponent(componentName, productTypeId);
    await db.updateProductTypeStatus(productTypeId);
  };

  const applyFullImport = async (item, productTypeId, overwrite) => {
    if (overwrite) await db.clearProductTypeConfiguration(productTypeId);
    const scheduleMap = new Map();
    const milestoneRows = [];
    const componentRows = [];
    const importedComponentNames = new Set();
    const headers = importReview.headers;
    const index = header => headers.indexOf(header);

    for (const row of item.rows) {
      const scheduleName = row[index('schedule name')]?.trim();
      if (scheduleName && !scheduleMap.has(scheduleName.toLowerCase())) {
        const schedule = await db.getSchedules(productTypeId);
        const existing = schedule.find(item => item.name.toLowerCase() === scheduleName.toLowerCase());
        scheduleMap.set(scheduleName.toLowerCase(), existing ? existing.id : await db.addSchedule(productTypeId, scheduleName));
      }
      if (row[index('milestone name')]?.trim()) milestoneRows.push(row);
      const componentField = row[index('component name')]?.trim();
      if (componentField) {
        componentField.split(';').map(name => name.trim()).filter(Boolean).forEach(name => importedComponentNames.add(name));
        if (row[index('component anchor milestone')]?.trim() || row[index('lead time (days)')]?.trim()) {
          componentRows.push(row);
        }
      }
    }

    for (const row of milestoneRows) {
      const scheduleId = scheduleMap.get(row[index('schedule name')].trim().toLowerCase());
      const milestones = await db.getMilestones(scheduleId);
      const name = row[index('milestone name')].trim();
      const existing = milestones.find(item => item.name.toLowerCase() === name.toLowerCase());
      const payload = {
        schedule_id: scheduleId,
        name,
        anchor_id: null,
        offset: parseInt(row[index('offset (days)')], 10) || 0,
        remark: row[index('milestone remark')]?.trim() || ''
      };
      if (existing) payload.id = existing.id;
      await db.saveMilestone(payload);
    }

    for (const row of milestoneRows) {
      const scheduleId = scheduleMap.get(row[index('schedule name')].trim().toLowerCase());
      const anchorName = row[index('anchor milestone name')]?.trim();
      if (!anchorName) continue;
      const milestones = await db.getMilestones(scheduleId);
      const current = milestones.find(item => item.name.toLowerCase() === row[index('milestone name')].trim().toLowerCase());
      const anchor = milestones.find(item => item.name.toLowerCase() === anchorName.toLowerCase());
      if (current && anchor && !['contract signed', 'ros'].includes(current.name.toLowerCase())) {
        await db.saveMilestone({ id: current.id, schedule_id: scheduleId, name: current.name, anchor_id: anchor.id, offset: current.offset, remark: current.remark });
      }
    }

    for (const componentName of importedComponentNames) {
      await importComponent(componentName, productTypeId);
    }

    const componentRowGroups = new Map();
    for (const row of componentRows) {
      const scheduleId = scheduleMap.get(row[index('schedule name')].trim().toLowerCase());
      const componentNames = row[index('component name')]
        .split(';')
        .map(name => name.trim())
        .filter(Boolean);
      const groupKey = `${scheduleId}:${componentNames.map(name => name.toLowerCase()).sort().join(';')}`;
      const group = componentRowGroups.get(groupKey) || [];
      group.push({ row, scheduleId, componentNames });
      componentRowGroups.set(groupKey, group);
    }

    const componentImportRows = [];
    for (const group of componentRowGroups.values()) {
      const isLegacyExportGroup = group[0].componentNames.length > 1 && group.length === group[0].componentNames.length;
      group.forEach((entry, rowIndex) => componentImportRows.push({
        ...entry,
        componentNames: isLegacyExportGroup ? [entry.componentNames[rowIndex]] : entry.componentNames
      }));
    }

    for (const { row, scheduleId, componentNames } of componentImportRows) {
      const anchorName = row[index('component anchor milestone')]?.trim();
      const milestones = await db.getMilestones(scheduleId);
      const anchor = milestones.find(item => item.name.toLowerCase() === anchorName.toLowerCase());
      if (anchor) {
        for (const componentName of componentNames) {
          const componentId = await importComponent(componentName, productTypeId);
          await db.saveComponentSchedule(scheduleId, componentId, anchor.id, parseInt(row[index('lead time (days)')], 10) || 0);
        }
      }
    }
    await db.updateProductTypeStatus(productTypeId);
    const statusIndex = importReview.headers.indexOf('product type status');
    if (statusIndex !== -1 && item.rows[0]?.[statusIndex]) {
      await window.electronAPI.dbRun(`UPDATE product_types SET status = ? WHERE id = ?`, [item.rows[0][statusIndex].trim(), productTypeId]);
    }
  };

  const confirmProductTypeImport = async () => {
    if (!importReview) return;
    setLoading(true);
    try {
      for (const item of importReview.rows.filter(row => row.decision === 'import')) {
        let productType = item.existing;
        const overwrite = Boolean(productType);
        if (!productType) {
          const result = await db.addProductType(item.name);
          productType = { id: result.lastID, name: item.name };
        }
        if (importReview.mode === 'full') await applyFullImport(item, productType.id, overwrite);
        else await applyPartialImport(item, productType.id, overwrite);
      }
      setImportReview(null);
      await loadProductTypes();
      await loadGlobalComponents();
      triggerAlert('success', 'CSV import completed successfully.');
    } catch (err) {
      triggerAlert('error', `Import failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 3. Export Schedules for specific Product Type
  const handleExportSchedules = async () => {
    if (!selectedPt) return;

    try {
      const sList = (await db.getSchedules(selectedPt.id)).filter(schedule => scheduleValidity[schedule.id]?.isValid);
      const mData = {};
      const csData = {};

      for (const s of sList) {
        mData[s.id] = await db.getMilestones(s.id);
        csData[s.id] = await db.getComponentSchedules(s.id);
      }

      const allComps = await db.getComponents();

      const csvContent = stringifySchedulesAndMilestones(selectedPt, sList, mData, csData, allComps);

      const saveRes = await window.electronAPI.showSaveDialog({
        title: `Export Schedules - ${selectedPt.name}`,
        defaultPath: `${selectedPt.name.toLowerCase().replace(/\s+/g, '_')}_schedules.csv`,
        filters: [{ name: 'CSV Files', extensions: ['csv'] }]
      });

      if (!saveRes.canceled && saveRes.filePath) {
        await window.electronAPI.writeFileContent(saveRes.filePath, csvContent);
        triggerAlert('success', `Schedules exported successfully for ${selectedPt.name}!`);
      }
    } catch (err) {
      triggerAlert('error', `Export failed: ${err.message}`);
    }
  };

  const handleExportMilestonesOnly = async () => {
    if (!selectedPt) return;
    try {
      const scheduleList = await db.getSchedules(selectedPt.id);
      const milestoneMap = {};
      for (const schedule of scheduleList) milestoneMap[schedule.id] = await db.getMilestones(schedule.id);
      const saveRes = await window.electronAPI.showSaveDialog({ title: `Export Milestones - ${selectedPt.name}`, defaultPath: `${selectedPt.name.toLowerCase().replace(/\s+/g, '_')}_milestones.csv`, filters: [{ name: 'CSV Files', extensions: ['csv'] }] });
      if (!saveRes.canceled && saveRes.filePath) {
        await window.electronAPI.writeFileContent(saveRes.filePath, stringifyMilestonesOnly(selectedPt, scheduleList, milestoneMap));
        triggerAlert('success', `Milestones exported successfully for ${selectedPt.name}!`);
      }
    } catch (err) {
      triggerAlert('error', `Export failed: ${err.message}`);
    }
  };

  const handleExportFullBackup = async () => {
    try {
      const rows = [];
      for (const productType of await db.getProductTypes()) {
        const components = await db.getAttachedComponents(productType.id);
        for (const schedule of await db.getSchedules(productType.id)) {
          const scheduleMilestones = await db.getMilestones(schedule.id);
          const componentSchedules = await db.getComponentSchedules(schedule.id);
          scheduleMilestones.forEach(milestone => rows.push([productType.name, components.map(component => component.name).join(';'), schedule.name, milestone.name, scheduleMilestones.find(anchor => anchor.id === milestone.anchor_id)?.name || '', milestone.offset, milestone.remark || '', '', '', productType.status]));
          componentSchedules.forEach(config => rows.push([productType.name, components.find(component => component.id === config.component_id)?.name || `Component #${config.component_id}`, schedule.name, '', '', '', '', scheduleMilestones.find(milestone => milestone.id === config.anchor_milestone_id)?.name || '', config.lead_time, productType.status]));
        }
      }
      const saveRes = await window.electronAPI.showSaveDialog({ title: 'Export Full Product Type Backup', defaultPath: 'product_types_full_backup.csv', filters: [{ name: 'CSV Files', extensions: ['csv'] }] });
      if (!saveRes.canceled && saveRes.filePath) {
        await window.electronAPI.writeFileContent(saveRes.filePath, stringifyFullProductTypeBackup(rows));
        triggerAlert('success', 'Full Product Type backup exported successfully!');
      }
    } catch (err) {
      triggerAlert('error', `Export failed: ${err.message}`);
    }
  };

  // 4. Import Schedules for specific Product Type
  const handleImportSchedules = async () => {
    if (!selectedPt) return;

    try {
      const openRes = await window.electronAPI.showOpenDialog({
        title: `Import Schedules for ${selectedPt.name}`,
        filters: [{ name: 'CSV Files', extensions: ['csv'] }],
        properties: ['openFile']
      });

      if (openRes.canceled || openRes.filePaths.length === 0) return;

      const text = await window.electronAPI.readFileContent(openRes.filePaths[0]);
      const csvData = parseCSV(text);

      if (csvData.length < 2) {
        triggerAlert('error', 'CSV file is empty or lacks headers.');
        return;
      }

      const headers = csvData[0].map(h => h.trim().toLowerCase());
      
      const schedNameIdx = headers.indexOf('schedule name');
      const mNameIdx = headers.indexOf('milestone name');
      const mAnchorIdx = headers.indexOf('anchor milestone name');
      const mOffsetIdx = headers.indexOf('offset (days)');
      const mRemarkIdx = headers.indexOf('milestone remark');
      const cNameIdx = headers.indexOf('component name');
      const cAnchorIdx = headers.indexOf('component anchor milestone');
      const cLeadIdx = headers.indexOf('lead time (days)');

      if (schedNameIdx === -1) {
        triggerAlert('error', 'CSV structure invalid. Must contain "Schedule Name".');
        return;
      }

      setLoading(true);

      // We will perform a multi-pass parse:
      // Pass 1: Gather and create all Schedules and attach components
      // Pass 2: Create all Milestones
      // Pass 3: Resolve milestone anchors & set component schedule lead times

      // Pass 1: Schedules
      const schedNameMap = {}; // name -> scheduleId
      for (let i = 1; i < csvData.length; i++) {
        const row = csvData[i];
        if (row.length <= schedNameIdx || !row[schedNameIdx].trim()) continue;
        const sName = row[schedNameIdx].trim();

        if (!schedNameMap[sName]) {
          const sList = await db.getSchedules(selectedPt.id);
          const existing = sList.find(s => s.name.toLowerCase() === sName.toLowerCase());

          if (!existing) {
            const schedId = await db.addSchedule(selectedPt.id, sName);
            schedNameMap[sName] = schedId;
          } else {
            schedNameMap[sName] = existing.id;
          }
        }
      }

      // Pass 2: Milestones creation (with anchor_id as null initially)
      for (let i = 1; i < csvData.length; i++) {
        const row = csvData[i];
        if (row.length <= schedNameIdx || !row[schedNameIdx].trim()) continue;

        const sName = row[schedNameIdx].trim();
        const schedId = schedNameMap[sName];

        const mName = mNameIdx !== -1 && row[mNameIdx] ? row[mNameIdx].trim() : '';
        const mRemark = mRemarkIdx !== -1 && row[mRemarkIdx] ? row[mRemarkIdx].trim() : '';

        if (mName) {
          const existingMilestones = await db.getMilestones(schedId);
          const exists = existingMilestones.find(m => m.name.toLowerCase() === mName.toLowerCase());

          if (!exists) {
            // Add milestone
            await db.saveMilestone({
              schedule_id: schedId,
              name: mName,
              anchor_id: null,
              offset: 0,
              remark: mRemark
            });
          } else if (mRemark) {
            // Update remarks for existing default/custom milestones
            await db.saveMilestone({
              id: exists.id,
              schedule_id: schedId,
              name: exists.name,
              anchor_id: exists.anchor_id,
              offset: exists.offset,
              remark: mRemark
            });
          }
        }
      }

      // Pass 3: Anchor mapping and Component Lead Times
      for (let i = 1; i < csvData.length; i++) {
        const row = csvData[i];
        if (row.length <= schedNameIdx || !row[schedNameIdx].trim()) continue;

        const sName = row[schedNameIdx].trim();
        const schedId = schedNameMap[sName];

        const mName = mNameIdx !== -1 && row[mNameIdx] ? row[mNameIdx].trim() : '';
        const mAnchor = mAnchorIdx !== -1 && row[mAnchorIdx] ? row[mAnchorIdx].trim() : '';
        const mOffset = mOffsetIdx !== -1 && row[mOffsetIdx] ? parseInt(row[mOffsetIdx]) : 0;

        // Anchor updates for custom milestones
        if (mName && mAnchor) {
          const schedMilestones = await db.getMilestones(schedId);
          const currentMilestone = schedMilestones.find(m => m.name.toLowerCase() === mName.toLowerCase());
          const anchorMilestone = schedMilestones.find(m => m.name.toLowerCase() === mAnchor.toLowerCase());

          // Skip modifying anchor for standard defaults Contract Signed and ROS
          const isDefault = mName.toLowerCase() === 'contract signed' || mName.toLowerCase() === 'ros';

          if (currentMilestone && anchorMilestone && !isDefault) {
            await db.saveMilestone({
              id: currentMilestone.id,
              schedule_id: schedId,
              name: currentMilestone.name,
              anchor_id: anchorMilestone.id,
              offset: mOffset || 0,
              remark: currentMilestone.remark
            });
          }
        }

        // Components & lead times
        const cName = cNameIdx !== -1 && row[cNameIdx] ? row[cNameIdx].trim() : '';
        const cAnchor = cAnchorIdx !== -1 && row[cAnchorIdx] ? row[cAnchorIdx].trim() : '';
        const cLead = cLeadIdx !== -1 && row[cLeadIdx] ? parseInt(row[cLeadIdx]) : 0;

        if (cName) {
          const globalComps = await db.getComponents();
          let compId;
          const existingComp = globalComps.find(c => c.name.toLowerCase() === cName.toLowerCase());

          if (!existingComp) {
            const res = await db.addComponent(cName, '');
            compId = res.lastID;
            globalComps.push({ id: compId, name: cName, remarks: '' });
          } else {
            compId = existingComp.id;
          }

          // Attach to product type
          await db.attachComponentToProductType(compId, selectedPt.id);

          // Component schedules lead time
          if (cAnchor) {
            const schedMilestones = await db.getMilestones(schedId);
            const anchorMilestone = schedMilestones.find(m => m.name.toLowerCase() === cAnchor.toLowerCase());

            if (anchorMilestone) {
              await db.saveComponentSchedule(schedId, compId, anchorMilestone.id, cLead || 0);
            }
          }
        }
      }

      await db.updateProductTypeStatus(selectedPt.id);
      triggerAlert('success', 'Schedules, milestones, components, and lead times imported successfully!');
      loadGlobalComponents();
      await refreshPtDetails();
    } catch (err) {
      triggerAlert('error', `Import failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // MILESTONE TREE RENDERING LOGIC
  // ==========================================

  const buildMilestoneTree = (milestoneList) => {
    // Find top roots (milestones with no anchor_id)
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
        {/* Node Connecting Dot */}
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

  // ==========================================
  // FILTERS & SORTING ON PRODUCT TYPES
  // ==========================================

  const filteredPtList = productTypes
    .filter(pt => {
      const matchSearch = pt.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' || pt.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'status') {
        return a.status.localeCompare(b.status);
      } else if (sortBy === 'schedules') {
        return b.schedule_count - a.schedule_count;
      } else if (sortBy === 'components') {
        return b.component_count - a.component_count;
      }
      return 0;
    });

  const handleDownloadSchedTemplate = async () => {
    try {
      const csvContent = stringifySchedulesTemplate();
      const saveRes = await window.electronAPI.showSaveDialog({
        title: 'Save Schedules CSV Template',
        defaultPath: 'schedules_template.csv',
        filters: [{ name: 'CSV Files', extensions: ['csv'] }]
      });
      if (!saveRes.canceled && saveRes.filePath) {
        await window.electronAPI.writeFileContent(saveRes.filePath, csvContent);
        triggerAlert('success', 'Schedules template downloaded successfully!');
      }
    } catch (err) {
      triggerAlert('error', `Download failed: ${err.message}`);
    }
  };

  const handleDownloadPtTemplate = async () => {
    try {
      const csvContent = stringifyProductTypesTemplate();
      const saveRes = await window.electronAPI.showSaveDialog({
        title: 'Save Product Types CSV Template',
        defaultPath: 'product_types_template.csv',
        filters: [{ name: 'CSV Files', extensions: ['csv'] }]
      });
      if (!saveRes.canceled && saveRes.filePath) {
        await window.electronAPI.writeFileContent(saveRes.filePath, csvContent);
        triggerAlert('success', 'Product Types template downloaded successfully!');
      }
    } catch (err) {
      triggerAlert('error', `Download failed: ${err.message}`);
    }
  };

  const formatMilestoneRelation = (m, milestoneList) => {
    const isDefault = m.name.toLowerCase() === 'contract signed' || m.name.toLowerCase() === 'ros';
    if (isDefault) return 'Root Boundary';
    const anchor = milestoneList.find(a => a.id === m.anchor_id);
    const anchorName = anchor ? anchor.name : 'Anchor';
    const absOffset = Math.abs(m.offset);
    const relation = m.offset < 0 ? 'before' : 'after';
    return `${absOffset} days ${relation} ${anchorName}`;
  };

  const buildMilestoneTimeline = (milestoneList, root) => {
    const timeline = [];
    const visit = (milestone, relativeDays, visited = new Set()) => {
      if (visited.has(milestone.id)) return;
      const nextVisited = new Set(visited).add(milestone.id);
      timeline.push({ ...milestone, relativeDays });
      milestoneList
        .filter(child => child.anchor_id === milestone.id)
        .forEach(child => visit(child, relativeDays + Number(child.offset || 0), nextVisited));
    };
    visit(root, 0);
    return timeline.sort((a, b) => a.relativeDays - b.relativeDays || a.id - b.id);
  };

  const getScheduleValidity = (schedule) => scheduleValidity[schedule.id] || {
    isValid: false,
    reason: 'Lead-time status is loading.'
  };

  const renderImportReview = () => {
    const newRows = importReview.rows.filter(row => !row.existing);
    const existingRows = importReview.rows.filter(row => row.existing);
    const renderRows = rows => rows.map(row => (
      <tr key={row.name} className="border-t border-gray-100">
        <td className="px-4 py-3 font-semibold text-gray-900">{row.name}</td>
        <td className="px-4 py-3 text-xs text-gray-500">
          {importReview.mode === 'partial'
            ? [...new Set(row.rows.flatMap(sourceRow => (sourceRow[importReview.componentIndex] || '').split(';').map(name => name.trim()).filter(Boolean)))].join(', ') || 'No components'
            : `${new Set(row.rows.map(sourceRow => sourceRow[importReview.headers.indexOf('schedule name')]).filter(Boolean)).size} schedule(s)`}
        </td>
        <td className="px-4 py-3 text-right">
          {row.existing ? (
            <select
              value={row.decision}
              onChange={event => setImportReview(review => ({
                ...review,
                rows: review.rows.map(item => item.name === row.name ? { ...item, decision: event.target.value } : item)
              }))}
              className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs font-semibold text-gray-700 focus:border-indigo-500 focus:outline-none"
            >
              <option value="keep-existing">Keep existing</option>
              <option value="import">Keep imported</option>
            </select>
          ) : (
            <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">WILL BE ADDED</span>
          )}
        </td>
      </tr>
    ));

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Confirm CSV Import</h2>
            <p className="mt-1 text-sm text-gray-500">
              Review the product types detected in the uploaded CSV before anything is changed.
            </p>
          </div>
          {existingRows.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setImportDecisionForAll('keep-existing')} className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">Keep all existing</button>
              <button onClick={() => setImportDecisionForAll('import')} className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100">Keep all imported</button>
            </div>
          )}
        </div>

        {importReview.mode === 'partial' ? (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-5 text-amber-950">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="h-5 w-5" />
              <span>Partial CSV import</span>
            </div>
            <p className="mt-2 text-sm">
              This CSV contains only product type names and components. New product types will be created as INVALID with no schedules. Choosing Keep imported for an existing product type removes its schedules, milestones, and procurement lead times, then imports the listed components.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-5 text-indigo-950">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="h-5 w-5" />
              <span>Full CSV import</span>
            </div>
            <p className="mt-2 text-sm">
              This CSV contains schedules, milestones, components, and procurement lead times. New product types receive the complete imported configuration. Choosing Keep imported replaces the existing configuration and restores the imported product type status.
            </p>
          </div>
        )}

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h3 className="font-bold text-gray-900">New Product Types from the CSV Uploaded</h3>
            <p className="mt-1 text-xs text-gray-500">These names do not currently exist and can be added without conflict.</p>
          </div>
          {newRows.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-gray-400">No new product types found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-500"><tr><th className="px-4 py-3">Product type</th><th className="px-4 py-3">Imported data</th><th className="px-4 py-3 text-right">Result</th></tr></thead>
                <tbody>{renderRows(newRows)}</tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-amber-200 bg-white shadow-sm">
          <div className="border-b border-amber-100 px-6 py-4">
            <h3 className="font-bold text-gray-900">Existing Product Types</h3>
            <p className="mt-1 text-xs text-gray-500">Choose to keep the existing product type or replace it with the imported data.</p>
            <p className="mt-1 text-xs text-red-700 font-semibold">
            If the imported data only contains product type name and components, existing milestones and procurement lead times will be LOST!
            </p>
          </div>
          {existingRows.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-gray-400">No existing product type conflicts found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-amber-50 text-xs font-bold uppercase text-gray-500"><tr><th className="px-4 py-3">Product type</th><th className="px-4 py-3">Imported data</th><th className="px-4 py-3 text-right">Decision</th></tr></thead>
                <tbody>{renderRows(existingRows)}</tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={() => setImportReview(null)} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel import</button>
          <button onClick={confirmProductTypeImport} disabled={loading} className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300">{loading ? 'Importing...' : 'Confirm import'}</button>
        </div>
      </div>
    );
  };

  // ==========================================
  // VIEW RENDERERS
  // ==========================================

  if (importReview) return (
    <ImportReview
      importReview={importReview}
      loading={loading}
      onSetDecisionForAll={setImportDecisionForAll}
      onSetDecision={(name, decision) => setImportReview(review => ({
        ...review,
        rows: review.rows.map(item => item.name === name ? { ...item, decision } : item)
      }))}
      onCancel={() => setImportReview(null)}
      onConfirm={confirmProductTypeImport}
    />
  );

  if (selectedPt) {
    // ------------------------------------------
    // DETAIL VIEW
    // ------------------------------------------
    const statusColors = {
      'valid': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'sub-valid': 'bg-amber-100 text-amber-800 border-amber-200',
      'invalid': 'bg-red-100 text-red-800 border-red-200'
    };

    return (
      <div className="space-y-6">
        {/* Detail View Header */}
        <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                setSelectedPt(null);
                loadProductTypes();
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-2xl font-bold text-gray-900">{selectedPt.name}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColors[selectedPt.status]}`}>
                  {selectedPt.status.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Configure schedules, milestones, attachments, and component lead times.
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleDownloadSchedTemplate}
              className="flex items-center space-x-2 px-3.5 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 text-xs font-semibold bg-white transition"
            >
              <Download className="w-3.5 h-3.5 text-gray-500" />
              <span>Get Schedule Template</span>
            </button>
            <button
              onClick={handleExportSchedules}
              className="flex items-center space-x-2 px-3.5 py-2 border border-indigo-200 rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 text-xs font-semibold transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Schedules CSV</span>
            </button>
            <button
              onClick={handleExportMilestonesOnly}
              className="flex items-center space-x-2 px-3.5 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 text-xs font-semibold bg-white transition"
            >
              <Download className="w-3.5 h-3.5 text-gray-500" />
              <span>Export Milestones CSV</span>
            </button>
            <button
              onClick={handleImportSchedules}
              className="flex items-center space-x-2 px-3.5 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 text-xs font-semibold bg-white transition"
            >
              <Upload className="w-3.5 h-3.5 text-gray-500" />
              <span>Import Schedules CSV</span>
            </button>
          </div>
        </div>

        {/* Floating Alert inside detail view */}
        {alert && (
          <div className={`p-4 rounded-lg border flex items-center space-x-3 ${
            alert.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {alert.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-sm font-medium">{alert.message}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 bg-white rounded-t-lg">
          <nav className="flex px-6 space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('schedules')}
              className={`py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${
                activeTab === 'schedules'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Schedules & Milestones ({schedules.length})
            </button>
            <button
              onClick={() => setActiveTab('components')}
              className={`py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${
                activeTab === 'components'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              BOM - Bill of Materials ({attachedComponents.length})
            </button>
            <button
              onClick={() => setActiveTab('leadtimes')}
              className={`py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${
                activeTab === 'leadtimes'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Procurement Lead Times
            </button>
          </nav>
        </div>

        {/* TAB 1: SCHEDULES & MILESTONES */}
        {activeTab === 'schedules' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Schedules List */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm flex flex-col h-fit">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-md">Schedules</h3>
                <button
                  onClick={() => setShowAddScheduleModal(true)}
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-xs font-semibold shadow transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
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
                      <span
                        title={getScheduleValidity(s).reason}
                        className={`ml-2 shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          getScheduleValidity(s).isValid
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {getScheduleValidity(s).isValid ? 'VALID' : 'INCOMPLETE'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSchedule(s.id, s.name);
                        }}
                        className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-white"
                        title="Delete Schedule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Milestones Manager & Visual Diagram */}
            <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              {!selectedSchedule ? (
                <div className="p-16 text-center text-gray-400">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="font-medium text-sm">Select a schedule from the list to manage milestones.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Milestones Header */}
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">
                        Milestones of Schedule: {selectedSchedule.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Schedules require Contract Signed and ROS as boundaries. Define custom nodes and recursive attachments.
                      </p>
                    </div>
                    <button
                      onClick={() => handleOpenMilestoneModal(null)}
                      className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-xs font-bold shadow-sm transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>New Custom Milestone</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-4">
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

                  {/* VISUAL TREE DIAGRAM */}
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
                            {/* Root node directly */}
                            <div className="p-3 bg-indigo-900 text-white rounded-lg border border-indigo-950 flex items-center justify-between shadow-sm max-w-sm">
                              <div>
                                <span className="font-bold text-sm">{rootNode.name}</span>
                                <p className="text-[10px] text-indigo-200 mt-0.5">{rootNode.remark || 'Boundary Milestone'}</p>
                              </div>
                              <span className="text-[10px] bg-indigo-800 border border-indigo-700 text-indigo-100 px-1.5 py-0.5 rounded font-bold">
                                ROOT BOUNDARY
                              </span>
                            </div>
                            
                            {/* Children recursively */}
                            {rootNode.children && rootNode.children.map(child => renderTreeNodes(child, milestones))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>}

                  {scheduleSubView === 'timeline' && <MilestoneTimeline milestones={milestones} />}

                  {/* FLAT LIST TABLE */}
                  {scheduleSubView === 'records' && <div>
                    <h4 className="font-semibold text-gray-800 text-sm mb-3">Milestone Master Records</h4>
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Milestone</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Anchor Basis</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Days</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Timing</th>
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
                                  {isDefault ? 'None (Root Boundary)' : anchor ? anchor.name : 'Unknown Anchor'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap font-medium">
                                  {isDefault ? '0' : Math.abs(m.offset)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap font-medium">
                                  {isDefault ? 'Root boundary' : m.offset < 0 ? 'Before anchor' : 'After anchor'}
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
        )}

        {/* TAB 2: ATTACHED COMPONENTS */}
        {activeTab === 'components' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Form: Attach component */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm h-fit space-y-6">
              {/* Attach Existing Component */}
              <div>
                <h3 className="font-bold text-gray-900 text-md mb-3 flex items-center space-x-2">
                  <Tag className="w-4 h-4 text-indigo-500" />
                  <span>Attach Existing Component</span>
                </h3>
                <div className="space-y-3">
                  <input
                    type="search"
                    value={componentProductTypeSearch}
                    onChange={(e) => setComponentProductTypeSearch(e.target.value)}
                    placeholder="Search product types..."
                    className="block w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <select
                    value={componentProductTypeId}
                    onChange={(e) => {
                      setComponentProductTypeId(e.target.value);
                      setSelectedGlobalComponentId('');
                    }}
                    className="block w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">1. Choose a product type</option>
                    {productTypes
                      .filter(pt => pt.name.toLowerCase().includes(componentProductTypeSearch.toLowerCase()))
                      .map(pt => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
                  </select>
                  <select
                    value={selectedGlobalComponentId}
                    onChange={(e) => setSelectedGlobalComponentId(e.target.value)}
                    disabled={!componentProductTypeId}
                    className="block w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100"
                  >
                    <option value="">2. Choose a component</option>
                    {sourceComponents
                      .filter(component => !attachedComponents.some(attached => attached.id === component.id))
                      .filter(component => component.name.toLowerCase().includes(componentSearch.toLowerCase()))
                      .map(component => <option key={component.id} value={component.id}>{component.name}</option>)}
                  </select>
                  <input
                    type="search"
                    value={componentSearch}
                    onChange={(e) => setComponentSearch(e.target.value)}
                    placeholder="Search components..."
                    disabled={!componentProductTypeId}
                    className="block w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100"
                  />
                  <button
                    onClick={handleAttachExistingComponent}
                    disabled={!selectedGlobalComponentId || !componentProductTypeId}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                  >
                    Attach Component
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h3 className="font-bold text-gray-900 text-md mb-3">Or Create New Component Globally</h3>
                <form onSubmit={handleCreateGlobalComponent} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase">Component Name</label>
                    <input
                      type="text"
                      required
                      value={componentForm.name}
                      onChange={(e) => setComponentForm({ ...componentForm, name: e.target.value })}
                      placeholder="e.g. Condenser, Water Pump"
                      className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase">Remarks (Optional)</label>
                    <textarea
                      rows="2"
                      value={componentForm.remarks}
                      onChange={(e) => setComponentForm({ ...componentForm, remarks: e.target.value })}
                      placeholder="e.g. Copper coil, heavy duty"
                      className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gray-900 hover:bg-black text-white rounded-lg text-sm font-semibold shadow transition"
                  >
                    Create and Attach Component
                  </button>
                </form>
              </div>
            </div>

            {/* Right List: Attached Components Table */}
            <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 text-lg mb-2">BOM - Bill of Materials</h3>
              <p className="text-xs text-gray-500 mb-4">
                Components list of this product type. You can attach existing components from other product types or create new ones globally.
              </p>

              {attachedComponents.length === 0 ? (
                <div className="p-16 text-center text-gray-400">
                  <Info className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="font-medium text-sm">No components are currently attached to this product type.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Component Name</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Global Remarks</th>
                        <th className="relative px-6 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 text-sm text-gray-600">
                      {attachedComponents.map(c => (
                        <tr key={c.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">{c.name}</td>
                          <td className="px-6 py-4 text-xs text-gray-500 max-w-xs truncate">{c.remarks || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleDetachComponent(c.id, c.name)}
                              className="text-red-600 hover:text-red-950 flex items-center space-x-1 ml-auto"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Detach</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: COMPONENT LEAD TIMES */}
        {activeTab === 'leadtimes' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Procurement Lead Times of Each Schedules</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Specify the delivery lead time (in days) and the anchor milestone from which the countdown calculates.
                </p>
              </div>
              <button
                onClick={handleSaveLeadTimes}
                disabled={attachedComponents.length === 0 || schedules.length === 0}
                className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                <Check className="w-4 h-4" />
                <span>Save All Lead Times</span>
              </button>
            </div>

            {attachedComponents.length === 0 || schedules.length === 0 ? (
              <div className="p-16 text-center text-gray-400">
                <Info className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="font-medium text-sm">
                  Must have at least one schedule and one attached component to set lead times.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {schedules.map(s => {
                  // Fetch milestones of this schedule
                  const schedMilestones = milestones.filter(m => m.schedule_id === s.id);
                  const activeMilestones = schedMilestones.length > 0 ? schedMilestones : milestones;

                  return (
                    <div key={s.id} className="border border-gray-200 rounded-lg p-5 bg-gray-50/50 space-y-4">
                      <div className="flex items-center justify-between gap-3 border-b border-gray-200 pb-2">
                        <h4 className="font-bold text-gray-900 text-sm">
                          Schedule: <span className="text-indigo-700">{s.name}</span>
                        </h4>
                        <span
                          title={getScheduleValidity(s).reason}
                          className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            getScheduleValidity(s).isValid
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {getScheduleValidity(s).isValid ? 'VALID' : 'INCOMPLETE'}
                        </span>
                      </div>
                      {!getScheduleValidity(s).isValid && (
                        <p className="text-xs text-amber-700">{getScheduleValidity(s).reason}</p>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {attachedComponents.map(c => {
                          const key = `${c.id}-${s.id}`;
                          const setting = leadTimeSettings[key] || { anchor_id: '', lead_time: 0 };

                          return (
                            <div key={c.id} className="p-4 bg-white rounded-lg border border-gray-200 flex flex-col justify-between shadow-sm space-y-3">
                              <span className="font-bold text-sm text-gray-800">{c.name}</span>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] font-bold text-gray-500 uppercase">Anchor Milestone</label>
                                  <select
                                    value={setting.anchor_id}
                                    onChange={(e) => handleLeadTimeChange(c.id, s.id, 'anchor_id', e.target.value)}
                                    className="mt-1 block w-full rounded-md border border-gray-300 py-1.5 px-2 text-xs focus:border-indigo-500 focus:outline-none"
                                  >
                                    <option value="">Default (ROS)</option>
                                    {activeMilestones.map(m => (
                                      <option key={m.id} value={m.id}>
                                        {m.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-gray-500 uppercase">Lead Time (Days)</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={setting.lead_time}
                                    onChange={(e) => handleLeadTimeChange(c.id, s.id, 'lead_time', e.target.value)}
                                    className="mt-1 block w-full rounded-md border border-gray-300 py-1.5 px-2 text-xs focus:border-indigo-500 focus:outline-none"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MODAL: ADD SCHEDULE */}
        {showAddScheduleModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-md w-full p-6">
              <h3 className="font-bold text-lg text-gray-900 mb-4">Create New Schedule</h3>
              <form onSubmit={handleAddSchedule} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase">Schedule Name</label>
                  <input
                    type="text"
                    required
                    value={scheduleNameInput}
                    onChange={(e) => setScheduleNameInput(e.target.value)}
                    placeholder="e.g. Normal Build, Fast-track, Rush"
                    className="mt-1.5 block w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <p className="text-[10px] text-gray-500 mt-2">
                    Creating a schedule automatically spawns 'Contract Signed' and 'ROS' as anchor boundary roots.
                  </p>
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddScheduleModal(false);
                      setScheduleNameInput('');
                    }}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition"
                  >
                    Create Schedule
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: MILESTONE (ADD/EDIT) */}
        {showMilestoneModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-md w-full p-6">
              <h3 className="font-bold text-lg text-gray-900 mb-4">
                {editingMilestone ? `Edit Milestone "${editingMilestone.name}"` : 'Add Custom Milestone'}
              </h3>
              <form onSubmit={handleSaveMilestone} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase">Milestone Name</label>
                  <input
                    type="text"
                    required
                    value={milestoneForm.name}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, name: e.target.value })}
                    placeholder="e.g. Production Start, Material Delivery"
                    className="mt-1 block w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Hide Anchor/Offset editing for Default milestones */}
                {(!editingMilestone || (editingMilestone.name.toLowerCase() !== 'contract signed' && editingMilestone.name.toLowerCase() !== 'ros')) && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase">Anchor / Basis Milestone</label>
                      <select
                        value={milestoneForm.anchor_id}
                        onChange={(e) => setMilestoneForm({ ...milestoneForm, anchor_id: e.target.value })}
                        className="mt-1 block w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="">-- Choose Anchor --</option>
                        {milestones
                          .filter(m => !editingMilestone || m.id !== editingMilestone.id)
                          .map(m => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase">Deadline Happens (Days)</label>
                        <input
                          type="number"
                          min="0"
                          value={milestoneForm.days}
                          onChange={(e) => setMilestoneForm({ ...milestoneForm, days: e.target.value })}
                          placeholder="e.g. 14"
                          className="mt-1 block w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase">Timing</label>
                        <select
                          value={milestoneForm.direction}
                          onChange={(e) => setMilestoneForm({ ...milestoneForm, direction: e.target.value })}
                          className="mt-1 block w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm focus:border-indigo-500 focus:outline-none bg-white"
                        >
                          <option value="after">Days After Anchor</option>
                          <option value="before">Days Before Anchor</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase">Remarks / Description</label>
                  <textarea
                    rows="2"
                    value={milestoneForm.remark}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, remark: e.target.value })}
                    placeholder="Provide description or details"
                    className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowMilestoneModal(false)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition"
                  >
                    Save Milestone
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ------------------------------------------
  // LIST / OVERVIEW SCREEN
  // ------------------------------------------
  const statusColors = {
    'valid': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'sub-valid': 'bg-amber-100 text-amber-800 border-amber-200',
    'invalid': 'bg-red-100 text-red-800 border-red-200'
  };

  return (
    <div className="space-y-6">
      {/* Product type registration */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Register New Product Types</h2>
          <div className="mt-3">
            <p className="text-sm text-gray-800">
              Every project is affiliated with a product type. Register product types here first before registering projects. 
            </p>
            <p className="text-sm text-gray-800 mt-3">
              To register new product types:
            </p>
            <ol className="list-decimal list-inside text-sm text-gray-800 mt-2 space-y-1">
              <li>Create a new product type by clicking the <span className="font-bold">+ New Product Type</span> button. Newly created product types are initially <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-800 border border-red-200">INVALID</span>.</li>
              <li>Furnish the details (Schedules & Milestones, BOM, Procurement Lead Times) by clicking the <span className="font-bold">Manage Config</span> button.</li>
              <li>Only product types that are <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 border border-amber-200">SUB-VALID</span> and <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">VALID</span> can be registered under a project.</li>
            </ol>
            <button
              type="button"
              onClick={() => setShowValidityModal(true)}
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 transition mt-3"
              title="Learn more about Product Type status"
            >
              <span>Learn more about validity status here</span>
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold">
                <Info className="w-3.5 h-3.5" />
              </span>
            </button>
          </div>
        </div>
        <div>
          <button
            onClick={() => setShowAddPtModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Product Type</span>
          </button>
        </div>
      </div>

      {/* Bulk registration */}
      <BatchCsvSection
        open={showBatchCsvOptions}
        onToggle={() => setShowBatchCsvOptions(open => !open)}
        onDownloadPtTemplate={handleDownloadPtTemplate}
        onImport={handleImportProductTypes}
        onExportFull={handleExportFullBackup}
        onExportPartial={handleExportProductTypes}
        onDeleteAll={handleDeleteAllProductTypes}
      />

      {/* Floating global Alert */}
      {alert && (
        <div className={`p-4 rounded-lg border flex items-center space-x-3 ${
          alert.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {alert.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{alert.message}</span>
        </div>
      )}

      {/* Filters and Searches */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Product Type names..."
            className="pl-10 pr-4 py-2.5 block w-full rounded-lg border border-gray-300 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2.5 px-3 block w-full rounded-lg border border-gray-300 text-sm focus:border-indigo-500 focus:outline-none bg-white"
          >
            <option value="all">All Validity Statuses</option>
            <option value="valid">Valid (Complete)</option>
            <option value="sub-valid">Sub-Valid (Partial)</option>
            <option value="invalid">Invalid (Action Required)</option>
          </select>
        </div>
        <div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="py-2.5 px-3 block w-full rounded-lg border border-gray-300 text-sm focus:border-indigo-500 focus:outline-none bg-white"
          >
            <option value="name">Sort by Name</option>
            <option value="status">Sort by Status</option>
            <option value="schedules">Sort by Schedule Count</option>
            <option value="components">Sort by Components Count</option>
          </select>
        </div>
      </div>

      {/* Main product types listing */}
      {loading ? (
        <div className="p-16 text-center text-gray-500 bg-white rounded-lg border border-gray-200 shadow-sm flex items-center justify-center space-x-3">
          <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
          <span className="font-semibold text-sm">Loading Product Types...</span>
        </div>
      ) : filteredPtList.length === 0 ? (
        <div className="p-16 text-center text-gray-400 bg-white rounded-lg border border-gray-200 shadow-sm">
          <Layers className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="font-semibold text-sm">No product types found.</p>
          <p className="text-xs text-gray-400 mt-1">Try relaxing filters or add a new record to start.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPtList.map(pt => (
            <div
              key={pt.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all flex flex-col justify-between overflow-hidden"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  {ptRenameId === pt.id ? (
                    <form
                      onSubmit={handleRenameProductType}
                      className="flex items-center space-x-1.5 w-full mr-2"
                    >
                      <input
                        type="text"
                        value={ptRenameInput}
                        onChange={(e) => setPtRenameInput(e.target.value)}
                        className="py-1 px-2 border rounded text-xs block w-full focus:outline-none focus:border-indigo-500"
                        required
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                        title="Save Rename"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  ) : (
                    <h3 className="font-bold text-gray-950 text-lg tracking-tight truncate max-w-[160px]">
                      {pt.name}
                    </h3>
                  )}
                  
                  <span className="inline-flex items-center gap-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusColors[pt.status]}`}>
                      {pt.status.toUpperCase()}
                    </span>
                    <button type="button" onClick={() => setShowValidityModal(true)} className="p-1 text-gray-400 hover:text-indigo-600" title={`Why is this product type ${pt.status}?`}>
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-gray-600 bg-gray-50 rounded-lg p-3">
                  <div>
                    <span className="text-[10px] uppercase text-gray-400 block mb-0.5">Schedules</span>
                    <span className="text-sm font-bold text-gray-800">{pt.schedule_count}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-gray-400 block mb-0.5">Components (BOM)</span>
                    <span className="text-sm font-bold text-gray-800">{pt.component_count}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex items-center justify-between text-xs font-bold text-gray-600">
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setPtRenameId(pt.id);
                      setPtRenameInput(pt.name);
                    }}
                    className="hover:text-indigo-600 transition"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => handleDeleteProductType(pt.id, pt.name)}
                    className="hover:text-red-600 transition"
                  >
                    Delete
                  </button>
                </div>
                <button
                  onClick={() => handleSelectProductType(pt)}
                  className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 transition"
                >
                  <span>Manage Config</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: ADD PRODUCT TYPE */}
      {showAddPtModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-lg text-gray-900">Create New Product Type</h3>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-lg leading-relaxed">
              <strong>Notice:</strong> Newly created product types are initialized as <strong>[INVALID]</strong>. You must promptly configure schedules, milestones, and component lead times before this product type can be selected for projects.
            </p>

            {ptModalError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs font-bold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{ptModalError}</span>
              </div>
            )}

            <form onSubmit={handleAddProductType} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase">Product Type Name</label>
                <input
                  type="text"
                  required
                  value={ptNameInput}
                  onChange={(e) => {
                    setPtNameInput(e.target.value);
                    if (ptModalError) setPtModalError('');
                  }}
                  placeholder="e.g. Water Chiller, Air Chiller"
                  className="mt-1.5 block w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddPtModal(false);
                    setPtNameInput('');
                    setPtModalError('');
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition"
                >
                  Create Product Type
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VALIDITY STATUS GUIDE */}
      {showValidityModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-lg text-gray-900">Product Type Validity Status Guide</h3>
              <button
                onClick={() => setShowValidityModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-600 leading-relaxed">

              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-900">
                <strong className="block text-red-950 mb-1">🔴 INVALID (Default for new records)</strong>
                <p>The product type has no schedules, no BOM, or no procurement lead times.</p>
          
                <p>Invalid product types <strong>cannot</strong> be registered under new projects.</p>
              </div>

              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
                <strong className="block text-amber-950 mb-1">🟡 SUB-VALID</strong>
                <p>The product type has BOM, and at least one configured schedule associated with procurement lead time. </p>
                <p>
                  Sub-valid product types can be registered under new projects, but only with the configured schedules.</p>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
                <strong className="block text-emerald-950 mb-1">🟢 VALID (Complete)</strong>
                <p>The product type has BOM, and <strong>every</strong> schedule is associated with procurement lead times.</p>
                <p>Valid product types can be registered under new projects, and all schedules will be available for selection.</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowValidityModal(false)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

