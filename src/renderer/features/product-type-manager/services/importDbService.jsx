import * as db from '../../../utils/db';

// --- HELPERS ---
const getComponentByName = async (name) => {
  const allComps = await db.getComponents();
  return allComps.find(c => c.name.toLowerCase() === name.toLowerCase());
};

const ensureAndAttachComponent = async (name, ptId) => {
  let comp = await getComponentByName(name);
  if (!comp) {
    const res = await db.addComponent(name, '');
    comp = { id: res.lastID, name };
  }
  await db.attachComponentToProductType(comp.id, ptId);
  return comp;
};


// --- FORMAT A (BOM ONLY) ---
export const commitFormatA = async (analysis, resolutions) => {
  // 1. Process Brand New Product Types
  for (const pt of analysis.newPts) {
    const res = await db.addProductType(pt.name);
    const ptId = res.lastID;
    for (const compName of pt.components) {
      await ensureAndAttachComponent(compName, ptId);
    }
    await db.updateProductTypeStatus(ptId);
  }

  // 2. Process Conflicts based on Resolutions
  for (const pt of analysis.conflictPts) {
    const ptId = pt.existingPt.id;
    const res = resolutions[pt.name] || { removeExisting: [], rejectNew: [] };
    
    // Removals
    for (const compName of res.removeExisting) {
      const comp = await getComponentByName(compName);
      if (comp) await db.detachComponentFromProductType(comp.id, ptId);
    }

    // Additions (Only components in 'onlyImported' that were NOT rejected)
    for (const compName of pt.onlyImported) {
      if (!res.rejectNew.includes(compName)) {
        await ensureAndAttachComponent(compName, ptId);
      }
    }
    await db.updateProductTypeStatus(ptId);
  }
};


// --- FORMAT B (FULL DATA) ---
export const commitFormatB = async (analysis, resolutions, headers) => {
  
  // Shared logic for both New and Conflict PTs
  const processPtRows = async (ptId, ptData, ptResolutions = {}) => {
    // 1. Ensure all components in the CSV for this PT are attached
    for (const compName of ptData.components) {
      await ensureAndAttachComponent(compName, ptId);
    }

    // 2. Group rows by Schedule Name
    const schedIdx = headers.indexOf('schedule name');
    const rowsBySchedule = {};
    for (const row of ptData.rows) {
      const sName = row[schedIdx]?.trim();
      if (!sName) continue;
      if (!rowsBySchedule[sName]) rowsBySchedule[sName] = [];
      rowsBySchedule[sName].push(row);
    }

    const existingSchedules = await db.getSchedules(ptId);

    // 3. Process each schedule
    for (const [sName, rows] of Object.entries(rowsBySchedule)) {
      const existingMatch = existingSchedules.find(s => s.name.toLowerCase() === sName.toLowerCase());
      
      if (existingMatch) {
        const decision = ptResolutions[existingMatch.name] || 'keep';
        if (decision === 'keep') continue; // Skip importing this schedule entirely
        if (decision === 'overwrite') {
          // Delete old schedule to start completely fresh
          await db.deleteSchedule(existingMatch.id, ptId);
        }
      }

      // Create new schedule (automatically creates 'Contract Signed' and 'ROS')
      const schedId = await db.addSchedule(ptId, sName);
      
      // Pass 1: Parse and create all Milestones
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

      // Pass 2: Anchor mapping & Component Lead Times
      const mAnchorIdx = headers.indexOf('anchor milestone name');
      const mOffsetIdx = headers.indexOf('offset (days)');
      const cNameIdx = headers.indexOf('component name');
      const cAnchorIdx = headers.indexOf('component anchor milestone');
      const cLeadIdx = headers.indexOf('lead time (days)');

      for (const row of rows) {
        // Milestone Anchors
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

        // Component Schedules
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

  // 1. Process Brand New Product Types
  for (const pt of analysis.newPts) {
    const res = await db.addProductType(pt.name);
    const ptId = res.lastID;
    await processPtRows(ptId, pt, {});
  }

  // 2. Process Conflicts based on Resolutions
  for (const pt of analysis.conflictPts) {
    const ptId = pt.existingPt.id;
    const resolutionsForPt = resolutions[pt.name] || {};
    await processPtRows(ptId, pt, resolutionsForPt);
  }
};