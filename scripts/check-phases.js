/**
 * Automated Verification Script for Phases 1-3
 * 
 * This script auto-checks:
 * 1. File Structure & Configuration Files (Phase 1)
 * 2. SQLite Database Existence & Schema/Table Integrities (Phase 2)
 * 3. Business Logic Calculations (Phase 3)
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Core utility definitions for calculation checking
const schedulerPath = path.join(__dirname, '..', 'src', 'renderer', 'utils', 'scheduler.js');

function logResult(name, success, message = '') {
  const status = success ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} - ${name} ${message ? `(${message})` : ''}`);
}

async function runChecks() {
  console.log('==================================================');
  console.log('     PUMPKINZZZ PHASES 1-3 AUTOMATED VERIFIER      ');
  console.log('==================================================\n');

  // ==========================================
  // CHECK 1: File Structure (Phase 1)
  // ==========================================
  console.log('--- CHECK 1: File Structure & Core Configurations ---');
  const requiredFiles = [
    'package.json',
    'vite.config.js',
    'tailwind.config.js',
    'postcss.config.js',
    'index.html',
    'plan.md',
    'changelog.md',
    'README.md',
    'src/main.js',
    'src/preload.js',
    'src/renderer/main.jsx',
    'src/renderer/App.jsx',
    'src/renderer/index.css',
    'src/renderer/utils/scheduler.js',
    'src/renderer/utils/csv.js',
    'src/renderer/components/ProductTypeManager.jsx',
    'src/renderer/components/ProductRegistry.jsx',
    'src/renderer/components/ProjectTracker.jsx'
  ];

  let filesOk = true;
  for (const relPath of requiredFiles) {
    const fullPath = path.join(__dirname, '..', relPath);
    const exists = fs.existsSync(fullPath);
    logResult(`File: ${relPath}`, exists);
    if (!exists) filesOk = false;
  }
  console.log();

  // ==========================================
  // CHECK 2: Database Integrity (Phase 2)
  // ==========================================
  console.log('--- CHECK 2: SQLite Database Schema & Tables ---');
  const dbPath = path.join(__dirname, '..', 'pumpkinzzz.db');
  const dbExists = fs.existsSync(dbPath);
  logResult('Database File Existence (pumpkinzzz.db)', dbExists);

  if (dbExists) {
    await new Promise((resolve) => {
      const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          logResult('Database Connection', false, err.message);
          resolve();
          return;
        }

        const requiredTables = [
          'product_types',
          'schedules',
          'milestones',
          'components',
          'product_type_components',
          'component_schedules',
          'projects'
        ];

        db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
          if (err) {
            logResult('Database Table Query', false, err.message);
            db.close();
            resolve();
            return;
          }

          const existingTables = rows.map(r => r.name);
          let allTablesOk = true;

          for (const table of requiredTables) {
            const tableExists = existingTables.includes(table);
            logResult(`Table Presence: ${table}`, tableExists);
            if (!tableExists) allTablesOk = false;
          }

          db.close(() => {
            resolve();
          });
        });
      });
    });
  }
  console.log();

  // ==========================================
  // CHECK 3: Business Logic / Propagation Engine (Phase 3)
  // ==========================================
  console.log('--- CHECK 3: Core Calculations & Propagation Logic ---');
  try {
    // Dynamic import simulation of ESM in CJS
    const fsContent = fs.readFileSync(schedulerPath, 'utf-8');
    
    // Convert ES export into CommonJS dynamically for evaluation in Node check
    const cjsContent = fsContent
      .replace(/export function/g, 'function')
      .replace(/export default/g, '') + 
      '\nmodule.exports = { calculateMilestoneDeadlines, calculateComponentDeadlines };';
    
    const tempModulePath = path.join(__dirname, 'temp-scheduler.js');
    fs.writeFileSync(tempModulePath, cjsContent, 'utf-8');
    
    const { calculateMilestoneDeadlines, calculateComponentDeadlines } = require(tempModulePath);

    // Mock project data
    const mockProject = {
      contract_signed_date: '2026-03-01',
      ros_date: '2026-03-15',
      actual_dates: JSON.stringify({
        2: '2026-03-05' // actual completion date for milestone 2
      })
    };

    // Mock milestones data
    const mockMilestones = [
      { id: 1, name: 'Contract Signed', anchor_id: null, offset: 0 },
      { id: 2, name: 'Milestone A', anchor_id: 1, offset: 3 }, // Forward anchored to Contract Signed (Calculated as Contract Signed + 3 = 2026-03-04, overridden by actual 2026-03-05)
      { id: 3, name: 'Milestone B', anchor_id: 2, offset: 5 }, // Chained milestone: 2026-03-05 + 5 = 2026-03-10
      { id: 4, name: 'ROS', anchor_id: null, offset: 0 },             // ROS deadline = 2026-03-15
      { id: 5, name: 'Milestone C', anchor_id: 4, offset: -2 }  // Backward anchored: 2026-03-15 - 2 = 2026-03-13
    ];

    const computedMilestones = calculateMilestoneDeadlines(mockProject, mockMilestones);

    const m1_ok = computedMilestones[1] === '2026-03-01'; // Contract Signed
    const m2_ok = computedMilestones[2] === '2026-03-05'; // Actual date override
    const m3_ok = computedMilestones[3] === '2026-03-10'; // Chained calculation correctly based on Milestone A actual date (2026-03-05 + 5 days)
    const m4_ok = computedMilestones[4] === '2026-03-15'; // ROS deadline
    const m5_ok = computedMilestones[5] === '2026-03-13'; // ROS relative negative offset (2026-03-15 - 2 days)

    logResult('Milestone calculation: Contract Signed Root Date', m1_ok, `Expected: 2026-03-01, Got: ${computedMilestones[1]}`);
    logResult('Milestone calculation: Actual Date Override', m2_ok, `Expected: 2026-03-05, Got: ${computedMilestones[2]}`);
    logResult('Milestone calculation: Recursive Chained Propagation', m3_ok, `Expected: 2026-03-10, Got: ${computedMilestones[3]}`);
    logResult('Milestone calculation: ROS Target Root Date', m4_ok, `Expected: 2026-03-15, Got: ${computedMilestones[4]}`);
    logResult('Milestone calculation: Target Negative Offset', m5_ok, `Expected: 2026-03-13, Got: ${computedMilestones[5]}`);

    // Mock component schedules & component listings
    const mockComponentSchedules = [
      { component_id: 10, anchor_milestone_id: 3, lead_time: 4 } // Anchored to Milestone B (Target: 2026-03-10, Lead time: 4 days) -> Latest Order: 2026-03-06
    ];
    const mockComponents = [
      { id: 10, name: 'Compressor' }
    ];

    const computedComponents = calculateComponentDeadlines(computedMilestones, mockComponentSchedules, mockComponents);
    const comp_ok = computedComponents[0] && computedComponents[0].latest_order_date === '2026-03-06';
    logResult('Component Order Deadline: Anchor Target - Lead Time', comp_ok, `Expected: 2026-03-06, Got: ${computedComponents[0] ? computedComponents[0].latest_order_date : 'N/A'}`);

    // Clean up temporary module
    fs.unlinkSync(tempModulePath);

    // ==========================================
    // CHECK 4: CSV Import/Export & Phase 4 Config
    // ==========================================
    console.log('--- CHECK 4: CSV Parsing, Product Type & Schedule Configuration ---');
    
    // Import CSV utilities
    const csvPath = path.join(__dirname, '..', 'src', 'renderer', 'utils', 'csv.js');
    const csvContentRaw = fs.readFileSync(csvPath, 'utf-8');
    
    // Convert ES export to CommonJS dynamically for evaluation in Node check
    const csvCjsContent = csvContentRaw
      .replace(/export function/g, 'function')
      .replace(/export default/g, '') + 
      '\nmodule.exports = { parseCSV, stringifyCSV, stringifyProductTypes, stringifySchedulesAndMilestones };';
    
    const tempCsvModulePath = path.join(__dirname, 'temp-csv.js');
    fs.writeFileSync(tempCsvModulePath, csvCjsContent, 'utf-8');
    
    const { parseCSV, stringifyCSV, stringifyProductTypes, stringifySchedulesAndMilestones } = require(tempCsvModulePath);

    // Test CSV Parsing and Stringification
    const testHeaders = ['Header A', 'Header B', 'Header C'];
    const testRows = [
      ['Val A,1', 'Val "B"', 'Val C\nNew line'],
      ['Row2A', 'Row2B', 'Row2C']
    ];
    
    const generatedCSV = stringifyCSV(testHeaders, testRows);
    const parsedCSV = parseCSV(generatedCSV);
    
    const csv_roundtrip_ok = parsedCSV.length === 3 && 
      parsedCSV[0][0] === 'Header A' &&
      parsedCSV[1][0] === 'Val A,1' &&
      parsedCSV[1][1] === 'Val "B"' &&
      parsedCSV[1][2] === 'Val C\nNew line' &&
      parsedCSV[2][1] === 'Row2B';
      
    logResult('CSV Engine RFC 4180 parsing round-trip verification', csv_roundtrip_ok);

    // Test Product Types CSV structure
    const mockPtList = [
      { id: 1, name: 'Water Chiller' },
      { id: 2, name: 'Air Chiller' }
    ];
    const mockPtComponentsMap = {
      1: ['Compressor', 'Condenser'],
      2: ['Fan Motor']
    };
    const ptCSV = stringifyProductTypes(mockPtList, mockPtComponentsMap);
    const parsedPtCSV = parseCSV(ptCSV);
    const pt_csv_ok = parsedPtCSV.length === 3 && 
      parsedPtCSV[1][0] === 'Water Chiller' && 
      parsedPtCSV[1][1] === 'Compressor;Condenser' &&
      parsedPtCSV[2][0] === 'Air Chiller' &&
      parsedPtCSV[2][1] === 'Fan Motor';
      
    logResult('CSV Export: Product Types & Components alignment', pt_csv_ok);

    // Clean up temp-csv.js
    fs.unlinkSync(tempCsvModulePath);
  } catch (err) {
    logResult('Calculation Verification Engine', false, err.message);
  }
  console.log('==================================================\n');
}

runChecks();
