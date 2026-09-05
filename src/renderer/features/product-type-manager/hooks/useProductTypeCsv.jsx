import { stringifyProductTypesTemplate, stringifySchedulesTemplate } from '../../../utils/csv';

export function useProductTypeCsv({ triggerAlert }) {
  
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

  return {
    handleDownloadPtTemplate,
    handleDownloadSchedTemplate,
  };
}