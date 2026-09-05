import { parseCSV } from '../../../utils/csv';

const api = window.electronAPI;

/**
 * Opens the file dialog, reads the CSV, detects the format (A or B), 
 * and groups the raw rows by Product Type.
 */
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

  const headers = csvData[0].map(h => h.trim().toLowerCase());

  // 1. Strict Format Detection
  const hasPt = headers.includes('product type');
  const hasBom = headers.includes('attached components');
  const hasSched = headers.includes('schedule name');

  const isFormatA = hasPt && hasBom && headers.length === 2;
  const isFormatB = hasPt && hasBom && hasSched;

  if (!isFormatA && !isFormatB) {
    throw new Error('Invalid format. The uploaded spreadsheet does not match Format A or Format B.');
  }

  const format = isFormatB ? 'B' : 'A';

  // 2. Group Rows by Product Type
  const groupedData = {};
  const nameIdx = headers.indexOf('product type');
  const compIdx = headers.indexOf('attached components');

  for (let i = 1; i < csvData.length; i++) {
    const row = csvData[i];
    const ptName = row[nameIdx]?.trim();
    if (!ptName) continue;

    if (!groupedData[ptName]) {
      groupedData[ptName] = {
        name: ptName,
        components: [],
        rows: []
      };
    }

    groupedData[ptName].rows.push(row);

    // Extract unique components for this product type
    const compString = row[compIdx];
    if (compString) {
      const comps = compString.split(';').map(c => c.trim()).filter(Boolean);
      comps.forEach(c => {
        if (!groupedData[ptName].components.includes(c)) {
          groupedData[ptName].components.push(c);
        }
      });
    }
  }

  return { 
    format, 
    headers, 
    parsedProductTypes: Object.values(groupedData) 
  };
};