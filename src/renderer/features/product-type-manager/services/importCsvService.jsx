import { parseCSV } from '../../../utils/csv';

const api = window.electronAPI;

// Standardized to match Bulk Registry
// Standardized to match Bulk Registry and Full Backup
const EXPECTED_HEADERS = [
  'Product Type', 'Attached Components', 'Schedule Name', 'Milestone Name',
  'Anchor Milestone Name', 'Offset (Days)', 'Milestone Remark', 
  'Component Name', 'Component Anchor Milestone', 'Lead Time (Days)',
  'Product Type Status' // <-- Added this!
];

export const selectAndParseImportFile = async () => {
  const openRes = await api.showOpenDialog({
    title: 'Import Product Types CSV',
    filters: [{ name: 'CSV Files', extensions: ['csv'] }],
    properties: ['openFile']
  });

  if (openRes.canceled || openRes.filePaths.length === 0) return null;

  const text = await api.readFileContent(openRes.filePaths[0]);
  const csvData = parseCSV(text);

  if (csvData.length < 2) {
    throw new Error('Spreadsheet is empty or lacks data rows.');
  }

  const rawHeaders = csvData[0].map(h => String(h).trim());
  const headers = rawHeaders.map(h => h.toLowerCase());

  // Smart Header Detection (Prioritize 'product type', fallback to 'product type name' for legacy support)
  const ptCol = headers.includes('product type') ? 'product type' : (headers.includes('product type name') ? 'product type name' : null);

  const hasAttached = headers.includes('attached components');
  const hasCompName = headers.includes('component name');
  const hasSched = headers.includes('schedule name');

  // Determine if it's BOM only or Full Data based on presence of Schedule Name
  const isBomOnly = ptCol && (hasAttached || hasCompName) && !hasSched;
  const isFullData = ptCol && hasSched;

  if (!isBomOnly && !isFullData) {
    const error = new Error('Invalid format. The uploaded spreadsheet does not match any recognized format.');
    error.isFormatError = true;
    error.uploadedHeaders = rawHeaders; 
    error.expectedHeaders = EXPECTED_HEADERS; 
    throw error;
  }

  // Use 'bom' and 'full' instead of Format A/B internally
  const format = isFullData ? 'full' : 'bom';
  const groupedData = {};
  
  const nameIdx = headers.indexOf(ptCol);
  const attachedIdx = headers.indexOf('attached components');
  const compNameIdx = headers.indexOf('component name');

  for (let i = 1; i < csvData.length; i++) {
    const row = csvData[i];
    const ptName = row[nameIdx]?.trim();
    if (!ptName) continue;

    if (!groupedData[ptName]) {
      groupedData[ptName] = { name: ptName, components: [], rows: [] };
    }

    groupedData[ptName].rows.push(row);

    // Extract components seamlessly from either column format
    if (attachedIdx !== -1 && row[attachedIdx]) {
      const comps = row[attachedIdx].split(';').map(c => c.trim()).filter(Boolean);
      comps.forEach(c => {
        if (!groupedData[ptName].components.includes(c)) groupedData[ptName].components.push(c);
      });
    }
    
    if (compNameIdx !== -1 && row[compNameIdx]) {
      const c = row[compNameIdx].trim();
      if (c && !groupedData[ptName].components.includes(c)) groupedData[ptName].components.push(c);
    }
  }

  return { format, headers, parsedProductTypes: Object.values(groupedData) };
};