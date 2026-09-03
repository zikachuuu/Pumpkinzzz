import { useState } from 'react';
import * as db from '../../../utils/db'; // Adjust path up to utils/

/**
 * useProductTypeConfig is a custom hook that encapsulates the logic for managing the configuration of a selected product type.
 * It provides state and functions for handling schedules, milestones, components, and lead times associated with the selected product type.
 * 
 * @param {function} triggerAlert - A function to trigger alert messages in the UI.
 * @returns {object} - An object containing state variables and functions for managing the selected product type's configuration.
 * 
 * State Variables:
 * - selectedPt: The currently selected product type object.
 * - activeTab: The currently active tab in the detail view ('schedules', 'components', 'leadtimes').
 * - schedules: Array of schedule objects associated with the selected product type.
 * - selectedSchedule: The currently selected schedule object.
 * - milestones: Array of milestone objects associated with the selected schedule.
 * - scheduleValidity: Object mapping schedule IDs to their validity status.
 * - attachedComponents: Array of components attached to the selected product type.
 * - leadTimeSettings: Object mapping component-schedule pairs to their lead time configurations.
 * - isDetailLoading: Boolean indicating whether detail data is currently being fetched.
 * 
 * Functions:
 * - handleSelectProductType: Selects a product type and loads its associated data.
 * - handleSelectSchedule: Select a schedule and loads its associated milestones and lead times.
 * - clearSelection: Clears the selected product type and resets related state.
 * - handleAddSchedule: Adds a new schedule to the selected product type.
 * - handleDeleteSchedule: Deletes a specific schedule from the selected product type.
 * - handleSaveMilestone: Saves or updates a milestone for the selected schedule.
 * - handleDeleteMilestone: Deletes a specific milestone from the selected schedule.
 * - handleDetachComponent: Detaches a component from the selected product type.
 * - handleSaveLeadTimes: Saves lead time configurations for components across schedules.
 * 
 */


export function useProductTypeConfig(triggerAlert) {
  const [selectedPt, setSelectedPt] = useState(null);
  const [activeTab, setActiveTab] = useState('schedules');
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [scheduleValidity, setScheduleValidity] = useState({});
  
  // Components & Lead Times State
  const [attachedComponents, setAttachedComponents] = useState([]);
  const [leadTimeSettings, setLeadTimeSettings] = useState({});
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // 1. Select a Product Type and load its specific data
  const handleSelectProductType = async (pt, preserveActiveTab = false) => {
    setSelectedPt(pt);
    if (!preserveActiveTab) setActiveTab('schedules');
    setIsDetailLoading(true);
    
    try {
      const scheds = await db.getSchedules(pt.id);
      setSchedules(scheds);
      
      const attached = await db.getAttachedComponents(pt.id);
      setAttachedComponents(attached);
      
      // 👇 ADD THIS LINE to calculate validity 👇
      await refreshScheduleValidity(scheds, attached);
      
      if (scheds.length > 0) {
        await handleSelectSchedule(scheds[0], pt.id);
      } else {
        setSelectedSchedule(null);
        setMilestones([]);
      }
    } catch (err) {
      triggerAlert('error', `Error loading details: ${err.message}`);
    } finally {
      setIsDetailLoading(false);
    }
  };

  // 2. Select a Schedule and load its Milestones & Lead Times
  const handleSelectSchedule = async (schedule, ptId) => {
    setSelectedSchedule(schedule);
    try {
      const milestonesData = await db.getMilestones(schedule.id);
      setMilestones(milestonesData);
      
      const componentScheds = await db.getComponentSchedules(schedule.id);
      const settingsUpdate = {};
      componentScheds.forEach(cs => {
        settingsUpdate[`${cs.component_id}-${schedule.id}`] = {
          anchor_id: cs.anchor_milestone_id,
          lead_time: cs.lead_time
        };
      });
      setLeadTimeSettings(prev => ({ ...prev, ...settingsUpdate }));
    } catch (err) {
      triggerAlert('error', `Failed to load milestones: ${err.message}`);
    }
  };

  // 3. Close the detail view
  const clearSelection = () => {
    setSelectedPt(null);
    setSchedules([]);
    setMilestones([]);
    setAttachedComponents([]);
  };

  // --- SCHEDULES CRUD ---
  const handleAddSchedule = async (scheduleNameInput) => {
    if (!selectedPt) return;
    const exists = schedules.some(s => s.name.toLowerCase() === scheduleNameInput.trim().toLowerCase());
    if (exists) throw new Error(`A schedule named "${scheduleNameInput.trim()}" already exists.`);
    
    await db.addSchedule(selectedPt.id, scheduleNameInput.trim());
    triggerAlert('success', 'Schedule and standard default milestones created!');
    // Refresh the view
    await handleSelectProductType(selectedPt); 
  };

  const handleDeleteSchedule = async (scheduleId, name) => {
    if (!confirm(`Are you sure you want to delete schedule "${name}"?`)) return false;
    
    await db.deleteSchedule(scheduleId, selectedPt.id);
    triggerAlert('success', 'Schedule deleted successfully.');
    await handleSelectProductType(selectedPt, true);
    return true;
  };

  // --- MILESTONES CRUD ---
  const handleSaveMilestone = async (milestoneForm, editingMilestone) => {
    if (!selectedSchedule) return;
    const isDefault = editingMilestone && (editingMilestone.name === 'Contract Signed' || editingMilestone.name === 'ROS');
    
    const clashing = milestones.some(m => m.name.toLowerCase() === milestoneForm.name.trim().toLowerCase() && (!editingMilestone || m.id !== editingMilestone.id));
    if (clashing) throw new Error(`A milestone named "${milestoneForm.name.trim()}" already exists.`);

    let finalAnchorId = milestoneForm.anchor_id ? parseInt(milestoneForm.anchor_id) : null;
    if (!isDefault && !finalAnchorId) throw new Error('Custom milestones must be anchored.');

    const computedOffset = milestoneForm.direction === 'before' ? -Math.abs(milestoneForm.days) : Math.abs(milestoneForm.days);
    
    const payload = {
      schedule_id: selectedSchedule.id,
      name: milestoneForm.name.trim(),
      anchor_id: isDefault ? null : finalAnchorId,
      offset: isDefault ? 0 : computedOffset,
      remark: milestoneForm.remark.trim(),
      ...(editingMilestone && { id: editingMilestone.id })
    };

    await db.saveMilestone(payload);
    triggerAlert('success', `Milestone "${payload.name}" saved successfully.`);
    await handleSelectSchedule(selectedSchedule, selectedPt.id); // Refresh milestones
  };

  const handleDeleteMilestone = async (id) => {
    if (!confirm('Are you sure you want to delete this milestone?')) return false;
    await db.deleteMilestonesBulk([id]);
    triggerAlert('success', 'Milestone deleted.');
    await handleSelectSchedule(selectedSchedule, selectedPt.id);
    return true;
  };

  // --- COMPONENTS CRUD ---
  const handleDetachComponent = async (compId, compName) => {
    if (!confirm(`Are you sure you want to detach component "${compName}"?`)) return false;
    await db.detachComponentFromProductType(compId, selectedPt.id);
    triggerAlert('success', 'Component detached successfully.');
    await handleSelectProductType(selectedPt, true);
    return true;
  };

  const handleSaveLeadTimes = async () => {
    if (!selectedPt) return;
    setIsDetailLoading(true);
    try {
      for (const s of schedules) {
        const schedMilestones = await db.getMilestones(s.id);
        const defaultAnchorId = schedMilestones.find(m => m.name.toLowerCase() === 'ros')?.id || schedMilestones[0]?.id;

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
      await db.updateProductTypeStatus(selectedPt.id);
      triggerAlert('success', 'Component schedule lead times saved and status updated!');
      await handleSelectProductType(selectedPt, true);
    } catch (err) {
      triggerAlert('error', `Failed to save lead times: ${err.message}`);
    } finally {
      setIsDetailLoading(false);
    }
  };

  // 1. Calculate Validity
  const refreshScheduleValidity = async (scheduleList, components) => {
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

  const getScheduleValidity = (schedule) => scheduleValidity[schedule.id] || {
    isValid: false,
    reason: 'Lead-time status is loading.'
  };

  // 2. Handle Lead Time Input Changes
  const handleLeadTimeChange = (compId, schedId, field, value) => {
    setLeadTimeSettings(prev => ({
      ...prev,
      [`${compId}-${schedId}`]: {
        ...prev[`${compId}-${schedId}`],
        [field]: value
      }
    }));
  };

  const handleSaveLeadTimesForSchedule = async (scheduleId) => {
    if (!selectedPt) return;
    setIsDetailLoading(true);
    
    try {
      const schedMilestones = await db.getMilestones(scheduleId);
      const defaultAnchorId = schedMilestones.find(m => m.name.toLowerCase() === 'ros')?.id || schedMilestones[0]?.id;

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
    } catch (err) {
      triggerAlert('error', `Failed to save lead times: ${err.message}`);
    } finally {
      setIsDetailLoading(false);
    }
  };

  return {
    selectedPt, 
    activeTab, 
    setActiveTab,
    schedules, 
    selectedSchedule, 
    milestones,
    scheduleValidity, 
    attachedComponents, 
    leadTimeSettings, 
    setLeadTimeSettings,
    isDetailLoading,
    handleSelectProductType,
    handleSelectSchedule,
    clearSelection,
    handleAddSchedule,
    handleDeleteSchedule,
    handleSaveMilestone,
    handleDeleteMilestone,
    handleDetachComponent,
    handleSaveLeadTimes,
    refreshScheduleValidity,
    getScheduleValidity,
    handleLeadTimeChange,
    handleSaveLeadTimesForSchedule
  };
}