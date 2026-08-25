/**
 * RFC 4180 compliant CSV Parser and Stringifier for Pumpkinzzz
 */

/**
 * Parses a CSV string into an array of arrays.
 * Handles commas in quotes, escaped quotes (""), and multiple lines.
 * 
 * @param {string} text - Raw CSV content
 * @returns {Array<Array<string>>}
 */
export function parseCSV(text) {
  const lines = [];
  let row = [""];
  let insideQuote = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (char === '"') {
      if (insideQuote && nextChar === '"') {
        row[row.length - 1] += '"';
        i++; // Skip next quote
      } else {
        insideQuote = !insideQuote;
      }
    } else if (char === ',' && !insideQuote) {
      row.push('');
    } else if ((char === '\r' || char === '\n') && !insideQuote) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      lines.push(row);
      row = [''];
    } else {
      row[row.length - 1] += char;
    }
  }
  if (row.length > 1 || row[0] !== '') {
    lines.push(row);
  }
  return lines;
}
/**
 * Standard stringifier to turn headers and rows into CSV content.
 * 
 * @param {Array<string>} headers 
 * @param {Array<Array<any>>} rows 
 * @returns {string} CSV text
 */
export function stringifyCSV(headers, rows) {
  const escapeField = (field) => {
    if (field === null || field === undefined) return '';
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  
  const headerLine = headers.map(escapeField).join(',');
  const rowLines = rows.map(row => row.map(escapeField).join(','));
  return [headerLine, ...rowLines].join('\n');
}

/**
 * Converts Product Types list to CSV content.
 * Headers: Product Type Name, Attached Components
 * 
 * @param {Array} productTypes 
 * @param {Object} ptComponentsMap - Map of pt.id to Array of component names
 * @returns {string} CSV content
 */
export function stringifyProductTypes(productTypes, ptComponentsMap) {
  const headers = ['Product Type Name', 'Attached Components'];
  const rows = productTypes.map(pt => {
    const components = ptComponentsMap[pt.id] || [];
    const componentsStr = components.join(';');
    return [pt.name, componentsStr];
  });
  return stringifyCSV(headers, rows);
}

/**
 * Converts a Product Type's Schedules, Milestones, and Component Lead Times to CSV.
 * 
 * @param {Object} productType 
 * @param {Array} schedules 
 * @param {Object} milestonesMap - Map of scheduleId to Array of milestones
 * @param {Object} componentSchedulesMap - Map of scheduleId to Array of component schedule configurations
 * @param {Array} components - List of all components
 * @returns {string} CSV content
 */
export function stringifySchedulesAndMilestones(productType, schedules, milestonesMap, componentSchedulesMap, components) {
  const headers = [
    'Schedule Name',
    'Milestone Name',
    'Anchor Milestone Name',
    'Offset (Days)',
    'Milestone Remark',
    'Component Name',
    'Component Anchor Milestone',
    'Lead Time (Days)'
  ];

  const rows = [];

  for (const s of schedules) {
    const milestones = milestonesMap[s.id] || [];
    const compScheds = componentSchedulesMap[s.id] || [];

    // Write Milestones
    for (const m of milestones) {
      const anchor = milestones.find(a => a.id === m.anchor_id);
      rows.push([
        s.name,
        m.name,
        anchor ? anchor.name : '',
        m.offset.toString(),
        m.remark || '',
        '', // Component Name
        '', // Component Anchor Milestone
        ''  // Lead Time
      ]);
    }

    // Write Component Lead Times
    for (const cs of compScheds) {
      const component = components.find(c => c.id === cs.component_id);
      const anchorMilestone = milestones.find(m => m.id === cs.anchor_milestone_id);
      rows.push([
        s.name,
        '', // Milestone Name
        '', // Anchor Milestone Name
        '', // Offset
        '', // Remark
        component ? component.name : `Component #${cs.component_id}`,
        anchorMilestone ? anchorMilestone.name : '',
        cs.lead_time.toString()
      ]);
    }
  }

  return stringifyCSV(headers, rows);
}

/**
 * Generates a blank CSV template for Product Types import.
 */
export function stringifyProductTypesTemplate() {
  const headers = ['Product Type Name', 'Attached Components'];
  const sampleRows = [
    ['Water Chiller', 'Compressor;Condenser;Evaporator;Expansion Valve'],
    ['Air Chiller', 'Compressor;Fan Motor;Condenser Coil']
  ];
  return stringifyCSV(headers, sampleRows);
}
/**
 * Generates a blank CSV template for Schedules and Milestones import.
 */
export function stringifySchedulesTemplate() {
  const headers = [
    'Schedule Name',
    'Milestone Name',
    'Anchor Milestone Name',
    'Offset (Days)',
    'Milestone Remark',
    'Component Name',
    'Component Anchor Milestone',
    'Lead Time (Days)'
  ];
  const sampleRows = [
    ['Normal', 'Contract Signed', '', '', 'Project starts', '', '', ''],
    ['Normal', 'ROS', '', '', 'Required On Site delivery', '', '', ''],
    ['Normal', 'Production Start', 'Contract Signed', '15', 'Production begins', '', '', ''],
    ['Normal', 'Production End', 'Production Start', '30', 'Production complete', '', '', ''],
    ['Normal', '', '', '', '', 'Compressor', 'Production Start', '10'],
    ['Normal', '', '', '', '', 'Condenser', 'Production End', '5']
  ];
  return stringifyCSV(headers, sampleRows);
}
