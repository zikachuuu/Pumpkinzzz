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
 * - activeTab: The currently active tab in the UI ('schedules', 'milestones', 'components').
 * - schedules: Array of schedule objects associated with the selected product type.
 * - selectedSchedule: The currently selected schedule object.
 * - milestones: Array of milestone objects associated with the selected schedule.
 * - scheduleValidity: Object mapping schedule IDs to their validity status (true/false).
 * - attachedComponents: Array of component objects attached to the selected product type.
 * - leadTimeSettings: Object mapping component-schedule pairs to their lead time settings.
 * - isDetailLoading: Boolean indicating whether detailed data is currently being fetched.
 * 
 * Functions:
 * - handleSelectProductType: Selects a product type and loads its associated schedules, components, and milestones.
 * - handleSelectSchedule: Selects a schedule and loads its associated milestones and lead time settings.
 * - clearSelection: Clears the current selection and resets related state variables.
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
  const handleSelectProductType = async (pt) => {
    setSelectedPt(pt);
    setActiveTab('schedules');
    setIsDetailLoading(true);
    
    try {
      const scheds = await db.getSchedules(pt.id);
      setSchedules(scheds);
      
      const attached = await db.getAttachedComponents(pt.id);
      setAttachedComponents(attached);
      
      // We will move refreshScheduleValidity here too, but let's keep it simple for a second
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

  return {
    selectedPt, activeTab, setActiveTab,
    schedules, selectedSchedule, milestones,
    scheduleValidity, attachedComponents, leadTimeSettings, setLeadTimeSettings,
    isDetailLoading,
    handleSelectProductType,
    handleSelectSchedule,
    clearSelection
  };
}