const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

let mainWindow;
let db;

// Locate or create SQLite Database file in the project directory for portability
const dbPath = path.join(__dirname, '..', 'pumpkinzzz.db');
const settingsPath = path.join(__dirname, '..', 'settings.json');
const defaultSettings = {
  dateFormat: 'yyyy-mm-dd',
  startOfWeek: 1,
  urgencySettings: {
    milestoneUrgentDays: 30,
    milestoneVeryUrgentDays: 7,
    componentUrgentDays: 30,
    componentVeryUrgentDays: 7,
  },
};

function ensureSettingsFile() {
  try {
    if (!fs.existsSync(settingsPath)) {
      fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2), 'utf-8');
      return;
    }

    const content = fs.readFileSync(settingsPath, 'utf-8').trim();
    if (!content) {
      fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2), 'utf-8');
    }
  } catch (error) {
    console.error('Error ensuring settings file:', error);
  }
}

function initDb() {
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error connecting to the local database:', err.message);
    } else {
      console.log('Connected to the local SQLite database at:', dbPath);
      // Enable foreign keys and set up tables
      db.serialize(() => {
        db.run('PRAGMA foreign_keys = ON;', (err) => {
          if (err) console.error('Error enabling foreign keys:', err.message);
        });

        // 1. product_types table
        db.run(`CREATE TABLE IF NOT EXISTS product_types (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          status TEXT NOT NULL DEFAULT 'invalid'
        );`);

        // 2. schedules table
        db.run(`CREATE TABLE IF NOT EXISTS schedules (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_type_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          UNIQUE(product_type_id, name),
          FOREIGN KEY(product_type_id) REFERENCES product_types(id) ON DELETE CASCADE
        );`);

        // 3. milestones table
        db.run(`CREATE TABLE IF NOT EXISTS milestones (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          schedule_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          anchor_id INTEGER,
          offset INTEGER NOT NULL DEFAULT 0,
          remark TEXT,
          UNIQUE(schedule_id, name),
          FOREIGN KEY(schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
          FOREIGN KEY(anchor_id) REFERENCES milestones(id) ON DELETE SET NULL
        );`);

        // 4. components table
        db.run(`CREATE TABLE IF NOT EXISTS components (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          remarks TEXT
        );`);

        // 5. product_type_components table
        db.run(`CREATE TABLE IF NOT EXISTS product_type_components (
          component_id INTEGER NOT NULL,
          product_type_id INTEGER NOT NULL,
          PRIMARY KEY(component_id, product_type_id),
          FOREIGN KEY(component_id) REFERENCES components(id) ON DELETE CASCADE,
          FOREIGN KEY(product_type_id) REFERENCES product_types(id) ON DELETE CASCADE
        );`);

        // 6. component_schedules table
        db.run(`CREATE TABLE IF NOT EXISTS component_schedules (
          schedule_id INTEGER NOT NULL,
          component_id INTEGER NOT NULL,
          anchor_milestone_id INTEGER NOT NULL,
          lead_time INTEGER NOT NULL DEFAULT 0,
          PRIMARY KEY(schedule_id, component_id),
          FOREIGN KEY(schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
          FOREIGN KEY(component_id) REFERENCES components(id) ON DELETE CASCADE,
          FOREIGN KEY(anchor_milestone_id) REFERENCES milestones(id) ON DELETE CASCADE
        );`);

        // 7. projects table
        db.run(`CREATE TABLE IF NOT EXISTS projects (
          tag_no TEXT PRIMARY KEY,
          description TEXT,
          product_type_id INTEGER NOT NULL,
          schedule_id INTEGER NOT NULL,
          customer TEXT NOT NULL,
          contract_no TEXT NOT NULL,
          sales_ref TEXT NOT NULL,
          pm_owner TEXT NOT NULL,
          engineer_owner TEXT NOT NULL,
          procurement_owner TEXT NOT NULL,
          production_owner TEXT NOT NULL,
          fat_owner TEXT NOT NULL,
          contract_signed_date TEXT NOT NULL,
          ros_date TEXT NOT NULL,
          notes TEXT,
          actual_dates TEXT,
          actual_received_dates TEXT DEFAULT '{}',
          FOREIGN KEY(product_type_id) REFERENCES product_types(id),
          FOREIGN KEY(schedule_id) REFERENCES schedules(id)
        );`);
        db.run(`ALTER TABLE projects ADD COLUMN actual_received_dates TEXT DEFAULT '{}'`, (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.error('Error adding actual received dates column:', err.message);
          }
        });

        // 8. saved_gantt_chart table
        db.run(`CREATE TABLE IF NOT EXISTS saved_gantt_chart (
          row_id INTEGER PRIMARY KEY AUTOINCREMENT,
          slot_id INTEGER NOT NULL CHECK(slot_id >= 1 AND slot_id <= 5),
          project_tag_no TEXT NOT NULL,
          custom_name TEXT,
          start_milestone_id INTEGER,
          end_milestone_id INTEGER,
          display_order INTEGER NOT NULL DEFAULT 0,
          FOREIGN KEY(project_tag_no) REFERENCES projects(tag_no) ON DELETE CASCADE,
          FOREIGN KEY(start_milestone_id) REFERENCES milestones(id) ON DELETE SET NULL,
          FOREIGN KEY(end_milestone_id) REFERENCES milestones(id) ON DELETE SET NULL
        );`);

        console.log('Database tables initialized successfully.');
      });
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: "Pumpkinzzz",
  });

  // Check if running in development (we will pass an environment variable or default to dev)
  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  ensureSettingsFile();
  initDb();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Clean up DB connection on exit
app.on('will-quit', () => {
  if (db) {
    db.close((err) => {
      if (err) console.error('Error closing database:', err.message);
      else console.log('Database connection closed.');
    });
  }
});

// IPC Handler placeholder for Database queries and operations
ipcMain.handle('db-query', async (event, sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('Database query error:', err.message);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
});

ipcMain.handle('db-run', async (event, sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        console.error('Database execution error:', err.message);
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
});

// Dialog for File Open/Save (used for importing/exporting CSVs)
ipcMain.handle('show-open-dialog', async (event, options) => {
  return dialog.showOpenDialog(mainWindow, options);
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  return dialog.showSaveDialog(mainWindow, options);
});

// Read and write files directly for CSV export/import
ipcMain.handle('read-file-content', async (event, filePath) => {
  return fs.promises.readFile(filePath, 'utf-8');
});

ipcMain.handle('write-file-content', async (event, filePath, content) => {
  return fs.promises.writeFile(filePath, content, 'utf-8');
});

ipcMain.handle('read-settings', async () => {
  try {
    const raw = await fs.promises.readFile(settingsPath, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      ...defaultSettings,
      ...parsed,
      urgencySettings: {
        ...defaultSettings.urgencySettings,
        ...(parsed.urgencySettings || {}),
      },
    };
  } catch (error) {
    console.error('Error reading settings file:', error);
    return defaultSettings;
  }
});

ipcMain.handle('write-settings', async (event, settings) => {
  try {
    const nextSettings = {
      ...defaultSettings,
      ...settings,
      urgencySettings: {
        ...defaultSettings.urgencySettings,
        ...(settings?.urgencySettings || {}),
      },
    };

    await fs.promises.writeFile(settingsPath, JSON.stringify(nextSettings, null, 2), 'utf-8');
    return nextSettings;
  } catch (error) {
    console.error('Error writing settings file:', error);
    throw error;
  }
});
