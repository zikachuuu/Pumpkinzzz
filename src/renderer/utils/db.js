/**
 * Database client service layer for the Pumpkinzzz React renderer.
 * Utilizes Electron IPC to perform SQLite database queries and transactions.
 */

const api = window.electronAPI;

/**
 * Executes a transaction of multiple SQL statements sequentially.
 * @param {Array<{sql: string, params: Array}>} statements 
 */
export async function dbTransaction(statements) {
  for (const stmt of statements) {
    await api.dbRun(stmt.sql, stmt.params || []);
  }
}

// ==========================================
// 1. PRODUCT TYPES
// ==========================================

export async function getProductTypes() {
  const sql = `
    SELECT pt.*, 
      (SELECT COUNT(*) FROM schedules WHERE product_type_id = pt.id) as schedule_count,
      (SELECT COUNT(*) FROM product_type_components WHERE product_type_id = pt.id) as component_count
    FROM product_types pt
    ORDER BY pt.name ASC
  `;
  return api.dbQuery(sql);
}

export async function addProductType(name) {
  const insertSql = `INSERT INTO product_types (name, status) VALUES (?, 'invalid')`;
  const result = await api.dbRun(insertSql, [name]);
  
  // Create default schedules/milestones if desired, but we let user create schedules.
  return result;
}

export async function deleteProductType(id) {
  // Cascading deletes are configured on foreign keys (schedules, milestones)
  const sql = `DELETE FROM product_types WHERE id = ?`;
  return api.dbRun(sql, [id]);
}

export async function renameProductType(id, name) {
  const sql = `UPDATE product_types SET name = ? WHERE id = ?`;
  return api.dbRun(sql, [name, id]);
}

/**
 * Checks and updates the validity status of a product type.
 * "A product type is considered valid only if it has exactly one component list (meaning >0 attached components),
 *  at least one schedule, and every schedule is associated with its variation of component list (lead times).
 *  It is sub-valid if at least one schedule is associated with its variation of component list.
 *  Otherwise, it is invalid."
 */
export async function updateProductTypeStatus(productTypeId) {
  // Get all schedules
  const schedules = await api.dbQuery(`SELECT id FROM schedules WHERE product_type_id = ?`, [productTypeId]);
  const attachedComponents = await api.dbQuery(`SELECT component_id FROM product_type_components WHERE product_type_id = ?`, [productTypeId]);
  
  if (schedules.length === 0 || attachedComponents.length === 0) {
    await api.dbRun(`UPDATE product_types SET status = 'invalid' WHERE id = ?`, [productTypeId]);
    return 'invalid';
  }

  let schedulesWithComponentsCount = 0;

  for (const schedule of schedules) {
    // Check if there is component schedule configuration for all attached components
    const componentScheds = await api.dbQuery(
      `SELECT COUNT(*) as count FROM component_schedules WHERE schedule_id = ?`, 
      [schedule.id]
    );
    // If we have configurations for all components associated with the product type
    if (componentScheds[0].count === attachedComponents.length) {
      schedulesWithComponentsCount++;
    }
  }

  let status = 'invalid';
  if (schedulesWithComponentsCount === schedules.length) {
    status = 'valid';
  } else if (schedulesWithComponentsCount > 0) {
    status = 'sub-valid';
  }

  await api.dbRun(`UPDATE product_types SET status = ? WHERE id = ?`, [status, productTypeId]);
  return status;
}


// ==========================================
// 2. SCHEDULES & MILESTONES
// ==========================================

export async function getSchedules(productTypeId) {
  const sql = `SELECT * FROM schedules WHERE product_type_id = ? ORDER BY name ASC`;
  return api.dbQuery(sql, [productTypeId]);
}

export async function getMilestones(scheduleId) {
  const sql = `SELECT * FROM milestones WHERE schedule_id = ? ORDER BY id ASC`;
  return api.dbQuery(sql, [scheduleId]);
}

/**
 * Creates a schedule and automatically seeds standard required default milestones:
 * - Contract Signed
 * - ROS
 */
export async function addSchedule(productTypeId, name) {
  const result = await api.dbRun(`INSERT INTO schedules (product_type_id, name) VALUES (?, ?)`, [productTypeId, name]);
  const scheduleId = result.lastID;

  // Insert standard required milestones
  await api.dbRun(`INSERT INTO milestones (schedule_id, name, anchor_id, offset, remark) VALUES (?, 'Contract Signed', NULL, 0, 'Project starts')`, [scheduleId]);
  await api.dbRun(`INSERT INTO milestones (schedule_id, name, anchor_id, offset, remark) VALUES (?, 'ROS', NULL, 0, 'Required On Site delivery')`, [scheduleId]);

  await updateProductTypeStatus(productTypeId);
  return scheduleId;
}

export async function deleteSchedule(scheduleId, productTypeId) {
  await api.dbRun(`DELETE FROM schedules WHERE id = ?`, [scheduleId]);
  await updateProductTypeStatus(productTypeId);
}

export async function saveMilestone(milestone) {
  // Check if adding or updating
  if (milestone.id) {
    await api.dbRun(
      `UPDATE milestones SET name = ?, anchor_id = ?, offset = ?, remark = ? WHERE id = ?`,
      [milestone.name, milestone.anchor_id, milestone.offset, milestone.remark, milestone.id]
    );
    return milestone.id;
  } else {
    const res = await api.dbRun(
      `INSERT INTO milestones (schedule_id, name, anchor_id, offset, remark) VALUES (?, ?, ?, ?, ?)`,
      [milestone.schedule_id, milestone.name, milestone.anchor_id, milestone.offset, milestone.remark]
    );
    return res.lastID;
  }
}

export async function deleteMilestonesBulk(milestoneIds) {
  if (!milestoneIds || milestoneIds.length === 0) return;
  const placeholders = milestoneIds.map(() => '?').join(',');
  await api.dbRun(`DELETE FROM milestones WHERE id IN (${placeholders})`, milestoneIds);
}


// ==========================================
// 3. COMPONENTS
// ==========================================

export async function getComponents() {
  return api.dbQuery(`SELECT * FROM components ORDER BY name ASC`);
}

export async function getAttachedComponents(productTypeId) {
  const sql = `
    SELECT c.* FROM components c
    JOIN product_type_components ptc ON c.id = ptc.component_id
    WHERE ptc.product_type_id = ?
    ORDER BY c.name ASC
  `;
  return api.dbQuery(sql, [productTypeId]);
}

export async function addComponent(name, remarks = '') {
  return api.dbRun(`INSERT INTO components (name, remarks) VALUES (?, ?)`, [name, remarks]);
}

export async function attachComponentToProductType(componentId, productTypeId) {
  await api.dbRun(
    `INSERT OR IGNORE INTO product_type_components (component_id, product_type_id) VALUES (?, ?)`,
    [componentId, productTypeId]
  );
  await updateProductTypeStatus(productTypeId);
}

export async function detachComponentFromProductType(componentId, productTypeId) {
  await api.dbRun(
    `DELETE FROM product_type_components WHERE component_id = ? AND product_type_id = ?`,
    [componentId, productTypeId]
  );
  // Also clean up any component schedule lead time settings for this component on the product's schedules
  const schedules = await getSchedules(productTypeId);
  for (const s of schedules) {
    await api.dbRun(`DELETE FROM component_schedules WHERE schedule_id = ? AND component_id = ?`, [s.id, componentId]);
  }
  await updateProductTypeStatus(productTypeId);
}


// ==========================================
// 4. COMPONENT - SCHEDULE LEAD TIMES
// ==========================================

export async function getComponentSchedules(scheduleId) {
  return api.dbQuery(`SELECT * FROM component_schedules WHERE schedule_id = ?`, [scheduleId]);
}

export async function saveComponentSchedule(scheduleId, componentId, anchorMilestoneId, leadTime) {
  await api.dbRun(
    `INSERT OR REPLACE INTO component_schedules (schedule_id, component_id, anchor_milestone_id, lead_time) VALUES (?, ?, ?, ?)`,
    [scheduleId, componentId, anchorMilestoneId, leadTime]
  );
}

// ==========================================
// 5. PROJECTS
// ==========================================

export async function getProjects() {
  const sql = `
    SELECT p.*, pt.name as product_type_name, s.name as schedule_name 
    FROM projects p
    JOIN product_types pt ON p.product_type_id = pt.id
    JOIN schedules s ON p.schedule_id = s.id
    ORDER BY p.tag_no ASC
  `;
  return api.dbQuery(sql);
}

export async function addProject(p) {
  const sql = `
    INSERT INTO projects (
      tag_no, description, product_type_id, schedule_id, customer, 
      contract_no, sales_ref, pm_owner, engineer_owner, procurement_owner, 
      production_owner, fat_owner, contract_signed_date, ros_date, notes, actual_dates, actual_received_dates
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  return api.dbRun(sql, [
    p.tag_no, p.description || '', p.product_type_id, p.schedule_id, p.customer,
    p.contract_no, p.sales_ref, p.pm_owner, p.engineer_owner, p.procurement_owner,
    p.production_owner, p.fat_owner, p.contract_signed_date, p.ros_date, p.notes || '', p.actual_dates || '{}', p.actual_received_dates || '{}'
  ]);
}

export async function updateProject(p) {
  const sql = `
    UPDATE projects SET 
      description = ?, product_type_id = ?, schedule_id = ?, customer = ?, 
      contract_no = ?, sales_ref = ?, pm_owner = ?, engineer_owner = ?, 
      procurement_owner = ?, production_owner = ?, fat_owner = ?, 
      contract_signed_date = ?, ros_date = ?, notes = ?
    WHERE tag_no = ?
  `;
  return api.dbRun(sql, [
    p.description || '', p.product_type_id, p.schedule_id, p.customer,
    p.contract_no, p.sales_ref, p.pm_owner, p.engineer_owner, 
    p.procurement_owner, p.production_owner, p.fat_owner, 
    p.contract_signed_date, p.ros_date, p.notes || '', p.tag_no
  ]);
}

export async function deleteProject(tagNo) {
  const sql = `DELETE FROM projects WHERE tag_no = ?`;
  return api.dbRun(sql, [tagNo]);
}

export async function updateProjectActualDates(tagNo, actualDatesJSON) {
  const sql = `UPDATE projects SET actual_dates = ? WHERE tag_no = ?`;
  return api.dbRun(sql, [actualDatesJSON, tagNo]);
}

export async function updateProjectActualReceivedDates(tagNo, receivedDatesJSON) {
  return api.dbRun(`UPDATE projects SET actual_received_dates = ? WHERE tag_no = ?`, [receivedDatesJSON, tagNo]);
}

