import * as db from '../../../utils/db';
import { 
  stringifyFormatA, stringifyFormatB, 
  stringifyProductTypes, stringifyFullProductTypeBackup 
} from '../../../utils/csv';

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

export const exportBatchFormatA = async (triggerAlert, selectedIds) => {
  try {
    let productTypes = await db.getProductTypes();
    
    // Filter down to only the selected product types
    if (selectedIds && selectedIds.length > 0) {
      productTypes = productTypes.filter(pt => selectedIds.includes(pt.id));
    }

    const ptComponentsMap = {};
    
    for (const pt of productTypes) {
      const comps = await db.getAttachedComponents(pt.id);
      ptComponentsMap[pt.id] = comps;
    }
    
    const csvContent = stringifyProductTypes(productTypes, ptComponentsMap);
    
    const saveRes = await api.showSaveDialog({
      title: 'Export Selected Product Types (BOM Only)',
      defaultPath: 'Selected_Product_Types_BOM.csv',
      filters: [{ name: 'CSV Files', extensions: ['csv'] }]
    });

    if (!saveRes.canceled && saveRes.filePath) {
      await api.writeFileContent(saveRes.filePath, csvContent);
      triggerAlert('success', 'BOM export completed successfully!');
    }
  } catch (err) {
    triggerAlert('error', `Export failed: ${err.message}`);
  }
};

export const exportBatchFormatB = async (triggerAlert, selectedIds) => {
  try {
    let productTypes = await db.getProductTypes();
    
    // Filter down to only the selected product types
    if (selectedIds && selectedIds.length > 0) {
      productTypes = productTypes.filter(pt => selectedIds.includes(pt.id));
    }

    const allGlobalComponents = await db.getComponents();
    const productRows = [];

    for (const pt of productTypes) {
      const components = await db.getAttachedComponents(pt.id);
      const compString = components.map(c => c.name).join(';');
      const schedules = await db.getSchedules(pt.id);

      // Handle product types with no schedules
      if (schedules.length === 0) {
        productRows.push([pt.name, compString, '', '', '', '', '', '', '', '', '', pt.status]);
        continue;
      }

      for (const s of schedules) {
        const milestones = await db.getMilestones(s.id);
        const compScheds = await db.getComponentSchedules(s.id);

        // Handle schedules with no config yet
        if (milestones.length === 0 && compScheds.length === 0) {
          productRows.push([pt.name, compString, s.name, '', '', '', '', '', '', '', '', pt.status]);
          continue;
        }

        // Write Milestones (11 items)
        for (const m of milestones) {
          const anchor = milestones.find(a => a.id === m.anchor_id);
          productRows.push([
            pt.name, compString, s.name, m.name, anchor ? anchor.name : '',
            m.offset.toString(), m.remark || '', '', '', '', '', pt.status
          ]);
        }

        // Write Component Lead Times (11 items)
        for (const cs of compScheds) {
          const comp = allGlobalComponents.find(c => c.id === cs.component_id);
          const anchorMilestone = milestones.find(m => m.id === cs.anchor_milestone_id);
          productRows.push([
            pt.name, compString, s.name, '', '', '', '',
            comp ? comp.name : `Component #${cs.component_id}`,
            (components.find(component => component.id === cs.component_id)?.component_count ?? cs.component_count ?? 1).toString(),
            anchorMilestone ? anchorMilestone.name : '',
            cs.lead_time.toString(), pt.status
          ]);
        }
      }    
    }
    
    const csvContent = stringifyFullProductTypeBackup(productRows);
    
    const saveRes = await api.showSaveDialog({
      title: 'Export Selected Product Types & Data',
      defaultPath: 'Selected_Product_Types_Full_Data.csv',
      filters: [{ name: 'CSV Files', extensions: ['csv'] }]
    });

    if (!saveRes.canceled && saveRes.filePath) {
      await api.writeFileContent(saveRes.filePath, csvContent);
      triggerAlert('success', 'Full Data export completed successfully!');
    }
  } catch (err) {
    triggerAlert('error', `Export failed: ${err.message}`);
  }
};