import { normalizeDateValue } from './date';

/**
 * Core Scheduling & Deadline Propagation Engine for Pumpkinzzz
 */

/**
 * Calculates targeted deadlines for all milestones in a project based on anchor offsets.
 * 
 * @param {Object} project - The project object containing contract_signed_date, ros_date, and actual_dates (JSON or Object)
 * @param {Array} milestones - List of milestones belonging to the project's schedule
 * @returns {Object} A map of milestone name/ID to calculated target deadline dates (ISO strings 'YYYY-MM-DD')
 */
export function calculateMilestoneDeadlines(project, milestones) {
  const deadlines = {};
  const actualDates = typeof project.actual_dates === 'string'
    ? JSON.parse(project.actual_dates || '{}')
    : (project.actual_dates || {});

  // 1. Initialize default/root milestones
  // Contract Signed has an actual date
  const contractSignedDate = normalizeDateValue(project.contract_signed_date);
  // ROS has a targeted date
  const rosDate = normalizeDateValue(project.ros_date);

  // Helper function to add/subtract days to a date string
  function addDays(dateStr, days) {
    if (!dateStr) return null;
    const [year, month, day] = normalizeDateValue(dateStr).split('-').map(Number);
    if (!year || !month || !day) return null;
    const date = new Date(Date.UTC(year, month - 1, day + days));
    return date.toISOString().split('T')[0];
  }

  // Find milestones by default names or properties
  const contractSignedMilestone = milestones.find(m => m.name.toLowerCase() === 'contract signed');
  const rosMilestone = milestones.find(m => m.name.toLowerCase() === 'ros');

  // Track calculation to prevent infinite recursion in case of circular anchors
  const calculating = new Set();

  function getMilestoneDate(milestoneId) {
    const milestone = milestones.find(m => m.id === milestoneId);
    if (!milestone) return null;

    // If we've already calculated it, return it
    if (deadlines[milestone.id]) {
      return deadlines[milestone.id];
    }

    // Circular dependency safeguard
    if (calculating.has(milestone.id)) {
      console.warn('Circular dependency detected in milestones for ID:', milestone.id);
      return null;
    }

    calculating.add(milestone.id);

    // If actual date exists (and it's not the root contract signed which we handle specifically),
    // the actual date can optionally override for anchor calculations.
    // However, for calculation of targets, we check the rules:
    // "Date of Anchor Y is the Actual Date if Y is Contract Signed (or if marked completed with actual date), or Targeted Deadline of Y otherwise."
    const isContractSigned = milestone.name.toLowerCase() === 'contract signed';
    const isRos = milestone.name.toLowerCase() === 'ros';

    if (isContractSigned) {
      deadlines[milestone.id] = contractSignedDate;
      calculating.delete(milestone.id);
      return contractSignedDate;
    }

    if (isRos) {
      deadlines[milestone.id] = rosDate;
      calculating.delete(milestone.id);
      return rosDate;
    }

    // If actual completion date exists for this anchor, use actual date
    if (actualDates[milestone.id]) {
      deadlines[milestone.id] = normalizeDateValue(actualDates[milestone.id]);
      calculating.delete(milestone.id);
      return actualDates[milestone.id];
    }

    // Otherwise, calculate based on anchor
    if (!milestone.anchor_id) {
      calculating.delete(milestone.id);
      return null;
    }

    const anchorDate = getMilestoneDate(milestone.anchor_id);
    if (!anchorDate) {
      calculating.delete(milestone.id);
      return null;
    }

    const calculatedTarget = addDays(anchorDate, milestone.offset);
    deadlines[milestone.id] = calculatedTarget;
    calculating.delete(milestone.id);
    return calculatedTarget;
  }

  // Calculate dates for all milestones
  milestones.forEach(m => {
    getMilestoneDate(m.id);
  });

  return deadlines;
}

/**
 * Calculates the latest order dates for all components associated with a schedule.
 * 
 * @param {Object} milestoneDeadlines - Map of milestone ID to targeted deadline string
 * @param {Array} componentSchedules - List of component-schedule requirements (with lead_time and anchor_milestone_id)
 * @param {Array} components - Complete list of components
 * @returns {Array} List of components with calculated latest_order_date, days_until_need, and urgency status
 */
export function calculateComponentDeadlines(milestoneDeadlines, componentSchedules, components, urgencySettings = {}) {
  const urgentDays = urgencySettings.componentUrgentDays ?? 30;
  const veryUrgentDays = urgencySettings.componentVeryUrgentDays ?? 7;
  const today = new Date().toISOString().split('T')[0];

  function getDaysBetween(date1, date2) {
    const d1 = new Date(`${normalizeDateValue(date1)}T00:00:00Z`);
    const d2 = new Date(`${normalizeDateValue(date2)}T00:00:00Z`);
    const diffTime = d2 - d1;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  function addDays(dateStr, days) {
    if (!dateStr) return null;
    const [year, month, day] = normalizeDateValue(dateStr).split('-').map(Number);
    if (!year || !month || !day) return null;
    const date = new Date(Date.UTC(year, month - 1, day + days));
    return date.toISOString().split('T')[0];
  }

  return componentSchedules.map(cs => {
    const component = components.find(c => c.id === cs.component_id);
    const anchorDeadline = milestoneDeadlines[cs.anchor_milestone_id];

    let latestOrderDate = null;
    let daysUntilNeed = null;
    let urgency = 'Pending';

    if (anchorDeadline) {
      latestOrderDate = addDays(anchorDeadline, -cs.lead_time);
      daysUntilNeed = getDaysBetween(today, latestOrderDate);

      if (daysUntilNeed < 0) {
        urgency = 'Overdue';
      } else if (daysUntilNeed <= veryUrgentDays) {
        urgency = 'Very Urgent';
      } else if (daysUntilNeed <= urgentDays) {
        urgency = 'Urgent';
      } else {
        urgency = 'On Track';
      }
    }

    return {
      component_id: cs.component_id,
      name: component ? component.name : 'Unknown',
      anchor_milestone_id: cs.anchor_milestone_id,
      lead_time: cs.lead_time,
      latest_order_date: latestOrderDate,
      days_until_need: daysUntilNeed,
      urgency
    };
  });
}
