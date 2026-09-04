import { useState } from 'react';
import * as db from '../../../utils/db';
import { 
  parseCSV, 
  stringifyProductTypes, 
  stringifySchedulesAndMilestones,
  stringifyProductTypesTemplate,
  stringifySchedulesTemplate,
  stringifyMilestonesOnly,
  stringifyFullProductTypeBackup
} from '../../../utils/csv';

export function useProductTypeCsv({
  triggerAlert,
  setLoading,
  loadProductTypes,
  loadGlobalComponents,
  selectedPt,
  scheduleValidity,
  handleSelectProductType
}) {
  const [importReview, setImportReview] = useState(null);

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
      const saveRes = await window.electronAPI.showSaveDialog({ 
        title: `Export Milestones - ${selectedPt.name}`, 
        defaultPath: `${selectedPt.name.toLowerCase().replace(/\s+/g, '_')}_milestones.csv`, 
        filters: [{ name: 'CSV Files', extensions: ['csv'] }] 
      });
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
      const saveRes = await window.electronAPI.showSaveDialog({ 
        title: 'Export Full Product Type Backup', 
        defaultPath: 'product_types_full_backup.csv', 
        filters: [{ name: 'CSV Files', extensions: ['csv'] }] 
      });
      if (!saveRes.canceled && saveRes.filePath) {
        await window.electronAPI.writeFileContent(saveRes.filePath, stringifyFullProductTypeBackup(rows));
        triggerAlert('success', 'Full Product Type backup exported successfully!');
      }
    } catch (err) {
      triggerAlert('error', `Export failed: ${err.message}`);
    }
  };

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
      const isFullBackup = ['schedule name', 'milestone name', 'component name', 'lead time (days)'].every(header => headers.includes(header));

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

      const schedNameMap = {}; 
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
            await db.saveMilestone({
              schedule_id: schedId, name: mName, anchor_id: null, offset: 0, remark: mRemark
            });
          } else if (mRemark) {
            await db.saveMilestone({
              id: exists.id, schedule_id: schedId, name: exists.name, anchor_id: exists.anchor_id, offset: exists.offset, remark: mRemark
            });
          }
        }
      }

      for (let i = 1; i < csvData.length; i++) {
        const row = csvData[i];
        if (row.length <= schedNameIdx || !row[schedNameIdx].trim()) continue;

        const sName = row[schedNameIdx].trim();
        const schedId = schedNameMap[sName];

        const mName = mNameIdx !== -1 && row[mNameIdx] ? row[mNameIdx].trim() : '';
        const mAnchor = mAnchorIdx !== -1 && row[mAnchorIdx] ? row[mAnchorIdx].trim() : '';
        const mOffset = mOffsetIdx !== -1 && row[mOffsetIdx] ? parseInt(row[mOffsetIdx]) : 0;

        if (mName && mAnchor) {
          const schedMilestones = await db.getMilestones(schedId);
          const currentMilestone = schedMilestones.find(m => m.name.toLowerCase() === mName.toLowerCase());
          const anchorMilestone = schedMilestones.find(m => m.name.toLowerCase() === mAnchor.toLowerCase());
          const isDefault = mName.toLowerCase() === 'contract signed' || mName.toLowerCase() === 'ros';

          if (currentMilestone && anchorMilestone && !isDefault) {
            await db.saveMilestone({
              id: currentMilestone.id, schedule_id: schedId, name: currentMilestone.name, anchor_id: anchorMilestone.id, offset: mOffset || 0, remark: currentMilestone.remark
            });
          }
        }

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

          await db.attachComponentToProductType(compId, selectedPt.id);

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
      await handleSelectProductType(selectedPt);
    } catch (err) {
      triggerAlert('error', `Import failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const setImportDecisionForAll = (decision) => {
    setImportReview(review => review && {
      ...review,
      rows: review.rows.map(row => row.existing ? { ...row, decision } : row)
    });
  };

  const setImportDecision = (name, decision) => {
    setImportReview(review => ({
      ...review,
      rows: review.rows.map(item => item.name === name ? { ...item, decision } : item)
    }));
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
        schedule_id: scheduleId, name, anchor_id: null, offset: parseInt(row[index('offset (days)')], 10) || 0, remark: row[index('milestone remark')]?.trim() || ''
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
      const componentNames = row[index('component name')].split(';').map(name => name.trim()).filter(Boolean);
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

  return {
    importReview,
    setImportReview,
    setImportDecisionForAll,
    setImportDecision,
    handleDownloadPtTemplate,
    handleDownloadSchedTemplate,
    handleExportProductTypes,
    handleExportSchedules,
    handleExportMilestonesOnly,
    handleExportFullBackup,
    handleImportProductTypes,
    handleImportSchedules,
    confirmProductTypeImport
  };
}