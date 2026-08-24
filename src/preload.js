const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  dbQuery: (sql, params) => ipcRenderer.invoke('db-query', sql, params),
  dbRun: (sql, params) => ipcRenderer.invoke('db-run', sql, params),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  readFileContent: (filePath) => ipcRenderer.invoke('read-file-content', filePath),
  writeFileContent: (filePath, content) => ipcRenderer.invoke('write-file-content', filePath, content),
});
