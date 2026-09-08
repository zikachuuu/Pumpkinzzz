import * as db from '../../../utils/db';
const api = window.electronAPI;

// --- HELPERS ---
const getComponentByName = async (name) => {
  const allComps = await db.getComponents();
  return allComps.find(c => c.name.toLowerCase() === name.toLowerCase());
};

const ensureAndAttachComponent = async (name, ptId, count = 1) => {
  let comp = await getComponentByName(name);
  if (!comp) {
    const res = await db.addComponent(name, '');
    comp = { id: res.lastID, name };
  }
  await db.attachComponentToProductType(comp.id, ptId, count);
  return comp;
};

// --- BOM ONLY ---
export const commitFormatA = async (analysis, resolutions) => {
  for (const pt of analysis.newPts) {
    const res = await db.addProductType(pt.name);
    const ptId = res.lastID;
    for (const compName of pt.components) {
      const count = pt.componentCounts?.[compName.toLowerCase()] || 1;
      await ensureAndAttachComponent(compName, ptId, count);
    }
    await db.updateProductTypeStatus(ptId);
  }

  for (const pt of analysis.conflictPts) {
    const ptId = pt.existingPt.id;
    const res = resolutions[pt.name];
    if (!res) continue; 
    
    for (const compName of res.removeExistingComps || []) {
      const comp = await getComponentByName(compName);
      if (comp) await db.detachComponentFromProductType(comp.id, ptId);
    }

    const existingSchedules = await db.getSchedules(ptId);
    for (const schedName of res.removeExistingScheds || []) {
      const sMatch = existingSchedules.find(s => s.name.toLowerCase() === schedName.toLowerCase());
      if (sMatch) {
        await api.dbRun(`DELETE FROM component_schedules WHERE schedule_id = ?`, [sMatch.id]);
        await api.dbRun(`DELETE FROM milestones WHERE schedule_id = ?`, [sMatch.id]);
        
        const referencedProjects = await api.dbQuery(`SELECT COUNT(*) as count FROM projects WHERE schedule_id = ?`, [sMatch.id]);
        if (referencedProjects[0].count === 0) await api.dbRun(`DELETE FROM schedules WHERE id = ?`, [sMatch.id]);
      }
    }

    for (const compName of pt.components) {
      const count = pt.componentCounts?.[compName.toLowerCase()] || 1;
      await ensureAndAttachComponent(compName, ptId, count);
    }
    
    await db.updateProductTypeStatus(ptId);
  }
};

// --- FULL DATA (Includes Merge Logic) ---
export const commitFormatB = async (analysis, resolutions, headers) => {
  const processPtRows = async (ptId, ptData, ptResolutions = null) => {
    
    if (ptResolutions) {
      for (const compName of ptResolutions.removeExistingComps || []) {
        const comp = await getComponentByName(compName);
        if (comp) await db.detachComponentFromProductType(comp.id, ptId);
      }
      
      const existingSchedules = await db.getSchedules(ptId);
      for (const schedName of ptResolutions.removeExistingScheds || []) {
        const sMatch = existingSchedules.find(s => s.name.toLowerCase() === schedName.toLowerCase());
        if (sMatch) {
          await api.dbRun(`DELETE FROM component_schedules WHERE schedule_id = ?`, [sMatch.id]);
          await api.dbRun(`DELETE FROM milestones WHERE schedule_id = ?`, [sMatch.id]);
          const referencedProjects = await api.dbQuery(`SELECT COUNT(*) as count FROM projects WHERE schedule_id = ?`, [sMatch.id]);
          if (referencedProjects[0].count === 0) await api.dbRun(`DELETE FROM schedules WHERE id = ?`, [sMatch.id]);
        }
      }
    }

    // Attach all components with their proper counts
    for (const compName of ptData.components) {
      const count = ptData.componentCounts?.[compName.toLowerCase()] || 1;
      await ensureAndAttachComponent(compName, ptId, count);
    }

    const schedIdx = headers.indexOf('schedule name');
    const rowsBySchedule = {};
    for (const row of ptData.rows) {
      const sName = row[schedIdx]?.trim();
      if (!sName) continue;
      if (!rowsBySchedule[sName]) rowsBySchedule[sName] = [];
      rowsBySchedule[sName].push(row);
    }

    const currentSchedules = await db.getSchedules(ptId);

    for (const [sName, rows] of Object.entries(rowsBySchedule)) {
      
      // MERGE GUARD: If user explicitly deselected this schedule in the Merge UI, skip importing it entirely
      if (ptResolutions && !ptResolutions.processSchedules.includes(sName)) {
        continue;
      }

      let schedId;

      // RE-USE existing schedule_id if overwriting, just wipe configurations
      if (ptResolutions) {
        const existingMatch = currentSchedules.find(s => s.name.toLowerCase() === sName.toLowerCase());
        if (existingMatch) {
           schedId = existingMatch.id;
           await api.dbRun(`DELETE FROM component_schedules WHERE schedule_id = ?`, [schedId]);
           await api.dbRun(`DELETE FROM milestones WHERE schedule_id = ? AND LOWER(name) NOT IN ('contract signed', 'ros')`, [schedId]);
        }
      }

      if (!schedId) {
        schedId = await db.addSchedule(ptId, sName);
      }
      
      const mNameIdx = headers.indexOf('milestone name');
      const mRemarkIdx = headers.indexOf('milestone remark');
      
      for (const row of rows) {
        const mName = row[mNameIdx]?.trim();
        const mRemark = row[mRemarkIdx]?.trim();
        if (mName) {
          const currentMiles = await db.getMilestones(schedId);
          const exists = currentMiles.find(m => m.name.toLowerCase() === mName.toLowerCase());
          if (!exists) {
            await db.saveMilestone({ schedule_id: schedId, name: mName, anchor_id: null, offset: 0, remark: mRemark });
          } else if (mRemark) {
            await db.saveMilestone({ id: exists.id, schedule_id: schedId, name: exists.name, anchor_id: exists.anchor_id, offset: exists.offset, remark: mRemark });
          }
        }
      }

      const mAnchorIdx = headers.indexOf('anchor milestone name');
      const mOffsetIdx = headers.indexOf('offset (days)');
      const cNameIdx = headers.indexOf('component name');
      const cAnchorIdx = headers.indexOf('component anchor milestone');
      const cLeadIdx = headers.indexOf('lead time (days)');

      for (const row of rows) {
        const mName = row[mNameIdx]?.trim();
        const mAnchor = row[mAnchorIdx]?.trim();
        const mOffset = row[mOffsetIdx] ? parseInt(row[mOffsetIdx]) : 0;

        if (mName && mAnchor) {
          const currentMiles = await db.getMilestones(schedId);
          const cm = currentMiles.find(m => m.name.toLowerCase() === mName.toLowerCase());
          const am = currentMiles.find(m => m.name.toLowerCase() === mAnchor.toLowerCase());
          const isDefault = mName.toLowerCase() === 'contract signed' || mName.toLowerCase() === 'ros';
          if (cm && am && !isDefault) {
            await db.saveMilestone({ id: cm.id, schedule_id: schedId, name: cm.name, anchor_id: am.id, offset: mOffset, remark: cm.remark });
          }
        }

        const cName = row[cNameIdx]?.trim();
        const cAnchor = row[cAnchorIdx]?.trim();
        const cLead = row[cLeadIdx] ? parseInt(row[cLeadIdx]) : 0;

        if (cName && cAnchor) {
          const comp = await getComponentByName(cName);
          if (comp) {
            const currentMiles = await db.getMilestones(schedId);
            const am = currentMiles.find(m => m.name.toLowerCase() === cAnchor.toLowerCase());
            if (am) {
              await db.saveComponentSchedule(schedId, comp.id, am.id, cLead);
            }
          }
        }
      }
    }
    await db.updateProductTypeStatus(ptId);
  };

  for (const pt of analysis.newPts) {
    const res = await db.addProductType(pt.name);
    const ptId = res.lastID;
    await processPtRows(ptId, pt, null);
  }

  for (const pt of analysis.conflictPts) {
    const ptId = pt.existingPt.id;
    const resolutionsForPt = resolutions[pt.name];
    if (resolutionsForPt) {
      await processPtRows(ptId, pt, resolutionsForPt);
    }
  }
};