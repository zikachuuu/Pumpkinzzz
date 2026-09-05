import * as db from '../../../utils/db';
import { stringifyFormatA, stringifyFormatB } from '../../../utils/csv';

// Standardized Electron API reference (matches db.js)
const api = window.electronAPI;

export const exportFormatA = async (productType, triggerAlert) => {
  try {
    const components = await db.getAttachedComponents(productType.id);
    const csvContent = stringifyFormatA(productType, components);
    
    const saveRes = await api.showSaveDialog({
      title: `Export BOM - ${productType.name}`,
      defaultPath: `${productType.name.replace(/\s+/g, '_')}_BOM_FormatA.csv`,
      filters: [{ name: 'CSV Files', extensions: ['csv'] }]
    });

    if (!saveRes.canceled && saveRes.filePath) {
      await api.writeFileContent(saveRes.filePath, csvContent);
      triggerAlert('success', 'Format A (BOM Only) exported successfully!');
    }
  } catch (err) {
    triggerAlert('error', `Export failed: ${err.message}`);
  }
};

export const exportFormatB = async (productType, selectedScheduleIds, triggerAlert) => {
  try {
    const components = await db.getAttachedComponents(productType.id);
    
    const allSchedules = await db.getSchedules(productType.id);
    const schedulesToExport = allSchedules.filter(s => selectedScheduleIds.includes(s.id));
    
    if (schedulesToExport.length === 0) {
      triggerAlert('error', 'No schedules selected for export.');
      return;
    }

    const milestonesMap = {};
    const componentSchedulesMap = {};
    const allGlobalComponents = await db.getComponents();

    for (const s of schedulesToExport) {
      milestonesMap[s.id] = await db.getMilestones(s.id);
      
      const compScheds = await db.getComponentSchedules(s.id);
      componentSchedulesMap[s.id] = compScheds.map(cs => {
        const comp = allGlobalComponents.find(c => c.id === cs.component_id);
        return { ...cs, component_name: comp ? comp.name : null };
      });
    }

    const csvContent = stringifyFormatB(productType, components, schedulesToExport, milestonesMap, componentSchedulesMap);
    
    const saveRes = await api.showSaveDialog({
      title: `Export Schedules & Data - ${productType.name}`,
      defaultPath: `${productType.name.replace(/\s+/g, '_')}_Schedules_FormatB.csv`,
      filters: [{ name: 'CSV Files', extensions: ['csv'] }]
    });

    if (!saveRes.canceled && saveRes.filePath) {
      await api.writeFileContent(saveRes.filePath, csvContent);
      triggerAlert('success', 'Format B (Full Data) exported successfully!');
    }
  } catch (err) {
    triggerAlert('error', `Export failed: ${err.message}`);
  }
};