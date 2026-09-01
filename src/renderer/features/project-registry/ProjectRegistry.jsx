import React, { useState, useEffect } from 'react';
import { 
  Download, Upload, Save, Trash2, ArrowLeft, AlertCircle, CheckCircle2, 
  RefreshCw, Check, X, Clipboard, HelpCircle, Info, ChevronDown, ChevronUp
} from 'lucide-react';
import * as db from '../../utils/db';
import { parseCSV, stringifyCSV } from '../../utils/csv';
import Alert from '../../components/ui/Alert.jsx';
import Modal from '../../components/ui/Modal.jsx';
import ModalValidityStatusGuide from '../product-type-manager/components/ValidityStatusGuide.jsx';

export default function ProjectRegistry({ onRedirectToTracker }) {
  // Global reference states
  const [productTypes         , setProductTypes]          = useState([]);
  const [existingProjects     , setExistingProjects]      = useState([]);
  const [allSchedules         , setSchedules]             = useState({}); // ptId -> schedules array
  const [scheduleValidationMap, setScheduleValidationMap] = useState({}); // scheduleId -> boolean (is valid)
  const [loading              , setLoading]               = useState(false);
  const [alert                , setAlert]                 = useState(null);
  const [showValidityModal    , setShowValidityModal]     = useState(false);

  // Manual Form States
  const [formData, setFormForm] = useState({
    tag_no: '',
    description: '',
    product_type_id: '',
    schedule_id: '',
    customer: '',
    contract_signed_date: '',
    ros_date: '',
    contract_no: '',
    sales_ref: '',
    pm_owner: '',
    engineer_owner: '',
    procurement_owner: '',
    production_owner: '',
    fat_owner: '',
    notes: ''
  });

  // Bulk Upload States
  const [bulkMode, setBulkMode] = useState(false); // true if viewing CSV verification grid
  const [bulkRows, setBulkRows] = useState([]); // array of project objects being validated

  // Alert trigger
  const triggerAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  useEffect(() => {
    loadAllReferenceData();
  }, []);

  const loadAllReferenceData = async () => {
    setLoading(true);
    try {
      const pts = await db.getProductTypes();
      setProductTypes(pts);

      const projs = await db.getProjects();
      setExistingProjects(projs);

      const schedMap = {};
      const valMap = {};

      for (const pt of pts) {
        const scheds = await db.getSchedules(pt.id);
        schedMap[pt.id] = scheds;

        const attachedComponents = await db.getAttachedComponents(pt.id);

        for (const s of scheds) {
          const compScheds = await db.getComponentSchedules(s.id);
          // A schedule is associated with its variation of component list if:
          // number of configurations in schedule matches number of attached components
          valMap[s.id] = attachedComponents.length > 0 && compScheds.length === attachedComponents.length;
        }
      }

      setSchedules(schedMap);
      setScheduleValidationMap(valMap);
    } catch (err) {
      triggerAlert('error', `Failed to load registry reference lists: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  // ==========================================
  // BLANK CSV TEMPLATE DOWNLOADER
  // ==========================================
  const handleDownloadTemplate = async () => {
    try {
      const headers = [
        'Tag No', 'Description', 'Product Type', 'Schedule Name', 'Customer', 
        'Contract No', 'Sales Ref', 'PM Owner', 'Engineer Owner', 'Procurement Owner', 
        'Production Owner', 'FAT Owner', 'Contract Signed Date', 'ROS Date', 'Notes'
      ];
      const sampleRow = [
        'TAG-101', 'High pressure water chiller', 'Water Chiller', 'Normal Build', 'Alpha Corp',
        'CON-2026-001', 'REF-99213', 'John Doe', 'Sarah Connor', 'Peter Parker',
        'Tony Stark', 'Bruce Banner', '2026-09-01', '2026-10-15', 'Urgent client requirement'
      ];

      const csvContent = stringifyCSV(headers, [sampleRow]);

      const saveRes = await window.electronAPI.showSaveDialog({
        title: 'Save Product Registry CSV Template',
        defaultPath: 'product_registry_template.csv',
        filters: [{ name: 'CSV Files', extensions: ['csv'] }]
      });

      if (!saveRes.canceled && saveRes.filePath) {
        await window.electronAPI.writeFileContent(saveRes.filePath, csvContent);
        triggerAlert('success', 'Template CSV saved successfully!');
      }
    } catch (err) {
      triggerAlert('error', `Failed to save template: ${err.message}`);
    }
  };

  // ==========================================
  // BULK UPLOAD CSV PARSER & VERIFIER
  // ==========================================
  const handleUploadCSV = async () => {
    try {
      const openRes = await window.electronAPI.showOpenDialog({
        title: 'Upload Product Registry CSV',
        filters: [{ name: 'CSV Files', extensions: ['csv'] }],
        properties: ['openFile']
      });

      if (openRes.canceled || openRes.filePaths.length === 0) return;

      const text = await window.electronAPI.readFileContent(openRes.filePaths[0]);
      const csvData = parseCSV(text);

      if (csvData.length < 2) {
        triggerAlert('error', 'CSV file is empty or lacks headers.');
        return;
      }

      const headers = csvData[0].map(h => h.trim().toLowerCase());
      
      const tagIdx = headers.indexOf('tag no');
      const descIdx = headers.indexOf('description');
      const ptIdx = headers.indexOf('product type');
      const schedIdx = headers.indexOf('schedule name');
      const custIdx = headers.indexOf('customer');
      const conIdx = headers.indexOf('contract no');
      const salesIdx = headers.indexOf('sales ref');
      const pmIdx = headers.indexOf('pm owner');
      const engIdx = headers.indexOf('engineer owner');
      const procIdx = headers.indexOf('procurement owner');
      const prodIdx = headers.indexOf('production owner');
      const fatIdx = headers.indexOf('fat owner');
      const signedIdx = headers.indexOf('contract signed date');
      const rosIdx = headers.indexOf('ros date');
      const notesIdx = headers.indexOf('notes');

      // Validate all required headers are present
      const missingHeaders = [];
      const requiredHeaderPairs = [
        { name: 'Tag No', index: tagIdx },
        { name: 'Product Type', index: ptIdx },
        { name: 'Schedule Name', index: schedIdx },
        { name: 'Customer', index: custIdx },
        { name: 'Contract No', index: conIdx },
        { name: 'Sales Ref', index: salesIdx },
        { name: 'PM Owner', index: pmIdx },
        { name: 'Engineer Owner', index: engIdx },
        { name: 'Procurement Owner', index: procIdx },
        { name: 'Production Owner', index: prodIdx },
        { name: 'FAT Owner', index: fatIdx },
        { name: 'Contract Signed Date', index: signedIdx },
        { name: 'ROS Date', index: rosIdx }
      ];

      requiredHeaderPairs.forEach(pair => {
        if (pair.index === -1) {
          missingHeaders.push(`"${pair.name}"`);
        }
      });

      if (missingHeaders.length > 0) {
        triggerAlert('error', `Rejected: CSV is missing columns: ${missingHeaders.join(', ')}`);
        return;
      }

      // Map rows into objects
      const rows = [];
      for (let i = 1; i < csvData.length; i++) {
        const r = csvData[i];
        if (r.length < requiredHeaderPairs.length) continue; // skip short empty rows
        
        const tagVal = tagIdx !== -1 && r[tagIdx] ? r[tagIdx].trim() : '';
        if (!tagVal) continue; // skip rows with no Tag No.

        rows.push({
          tempId: i,
          tag_no: tagVal,
          description: descIdx !== -1 && r[descIdx] ? r[descIdx].trim() : '',
          product_type_name: ptIdx !== -1 && r[ptIdx] ? r[ptIdx].trim() : '',
          schedule_name: schedIdx !== -1 && r[schedIdx] ? r[schedIdx].trim() : '',
          customer: custIdx !== -1 && r[custIdx] ? r[custIdx].trim() : '',
          contract_no: conIdx !== -1 && r[conIdx] ? r[conIdx].trim() : '',
          sales_ref: salesIdx !== -1 && r[salesIdx] ? r[salesIdx].trim() : '',
          pm_owner: pmIdx !== -1 && r[pmIdx] ? r[pmIdx].trim() : '',
          engineer_owner: engIdx !== -1 && r[engIdx] ? r[engIdx].trim() : '',
          procurement_owner: procIdx !== -1 && r[procIdx] ? r[procIdx].trim() : '',
          production_owner: prodIdx !== -1 && r[prodIdx] ? r[prodIdx].trim() : '',
          fat_owner: fatIdx !== -1 && r[fatIdx] ? r[fatIdx].trim() : '',
          contract_signed_date: signedIdx !== -1 && r[signedIdx] ? r[signedIdx].trim() : '',
          ros_date: rosIdx !== -1 && r[rosIdx] ? r[rosIdx].trim() : '',
          notes: notesIdx !== -1 && r[notesIdx] ? r[notesIdx].trim() : '',
          selected: true,
          errors: {}
        });
      }

      validateBulkRows(rows);
      setBulkRows(rows);
      setBulkMode(true);
    } catch (err) {
      triggerAlert('error', `CSV Parse Error: ${err.message}`);
    }
  };

  const validateBulkRows = (rows) => {
    const activeTags = rows.filter(r => r.selected).map(r => r.tag_no.toLowerCase());

    rows.forEach(r => {
      const errs = {};

      // Tag No. Compulsory
      if (!r.tag_no) {
        errs.tag_no = 'Tag No. is compulsory.';
      } else {
        // Duplicate check inside upload
        const internalDups = activeTags.filter(t => t === r.tag_no.toLowerCase()).length;
        if (internalDups > 1) {
          errs.tag_no = 'Duplicate Tag No in this upload list.';
        }
        // Clash check with database
        const dbClash = existingProjects.some(p => p.tag_no.toLowerCase() === r.tag_no.toLowerCase());
        if (dbClash) {
          errs.tag_no = 'Tag No clashes with existing database record.';
        }
      }

      // Customer and owners
      if (!r.customer) errs.customer = 'Compulsory field.';
      if (!r.contract_no) errs.contract_no = 'Compulsory field.';
      if (!r.sales_ref) errs.sales_ref = 'Compulsory field.';
      if (!r.pm_owner) errs.pm_owner = 'Compulsory field.';
      if (!r.engineer_owner) errs.engineer_owner = 'Compulsory field.';
      if (!r.procurement_owner) errs.procurement_owner = 'Compulsory field.';
      if (!r.production_owner) errs.production_owner = 'Compulsory field.';
      if (!r.fat_owner) errs.fat_owner = 'Compulsory field.';

      // Product Type Name Validation
      const matchedPt = productTypes.find(pt => pt.name.toLowerCase() === r.product_type_name.toLowerCase());
      if (!r.product_type_name) {
        errs.product_type_name = 'Compulsory field.';
      } else if (!matchedPt) {
        errs.product_type_name = 'Unrecognised Product Type.';
      } else if (matchedPt.status === 'invalid') {
        errs.product_type_name = 'This Product Type is invalid.';
      }

      // Schedule Name Validation
      if (!r.schedule_name) {
        errs.schedule_name = 'Compulsory field.';
      } else if (matchedPt) {
        const ptScheds = allSchedules[matchedPt.id] || [];
        const matchedSched = ptScheds.find(s => s.name.toLowerCase() === r.schedule_name.toLowerCase());
        if (!matchedSched) {
          errs.schedule_name = 'Schedule not found under this Product Type.';
        } else if (!scheduleValidationMap[matchedSched.id]) {
          errs.schedule_name = 'Schedule lacks component configurations.';
        }
      }

      // Dates Validation (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!r.contract_signed_date) {
        errs.contract_signed_date = 'Compulsory field.';
      } else if (!dateRegex.test(r.contract_signed_date) || isNaN(Date.parse(r.contract_signed_date))) {
        errs.contract_signed_date = 'Invalid date (use YYYY-MM-DD).';
      }

      if (!r.ros_date) {
        errs.ros_date = 'Compulsory field.';
      } else if (!dateRegex.test(r.ros_date) || isNaN(Date.parse(r.ros_date))) {
        errs.ros_date = 'Invalid date (use YYYY-MM-DD).';
      }

      r.errors = errs;
    });
  };

  // ==========================================
  // MANUAL REGISTRY SUBMISSION
  // ==========================================
  const handleManualSubmit = async (e) => {
    e.preventDefault();

    // Check Tag No clash
    const clash = existingProjects.some(p => p.tag_no.toLowerCase() === formData.tag_no.trim().toLowerCase());
    if (clash) {
      triggerAlert('error', `A project with Tag No. "${formData.tag_no.trim()}" already exists in the registry.`);
      return;
    }

    // Validation checks on Product Type
    const selectedPt = productTypes.find(pt => pt.id === parseInt(formData.product_type_id));
    if (!selectedPt || selectedPt.status === 'invalid') {
      triggerAlert('error', 'Select a valid or sub-valid Product Type.');
      return;
    }

    // Validation checks on Schedule
    if (!formData.schedule_id || !scheduleValidationMap[formData.schedule_id]) {
      triggerAlert('error', 'Select a Schedule that has complete component lead-time configurations.');
      return;
    }

    try {
      setLoading(true);
      await db.addProject({
        ...formData,
        tag_no: formData.tag_no.trim(),
        product_type_id: parseInt(formData.product_type_id),
        schedule_id: parseInt(formData.schedule_id),
        actual_dates: '{}'
      });

      triggerAlert('success', 'Project registered successfully!');
      // Reset form
      setFormForm({
        tag_no: '', description: '', product_type_id: '', schedule_id: '',
        customer: '', contract_signed_date: '', ros_date: '', contract_no: '',
        sales_ref: '', pm_owner: '', engineer_owner: '', procurement_owner: '',
        production_owner: '', fat_owner: '', notes: ''
      });
      
      // Reload reference data
      await loadAllReferenceData();
      
      // Redirect to Tracker
      if (onRedirectToTracker) {
        setTimeout(() => onRedirectToTracker(), 1000);
      }
    } catch (err) {
      triggerAlert('error', `Manual registration failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // BULK VERIFICATION EVENT HANDLERS
  // ==========================================
  const handleBulkCellChange = (tempId, field, value) => {
    const updated = bulkRows.map(r => {
      if (r.tempId === tempId) {
        return { ...r, [field]: value };
      }
      return r;
    });
    validateBulkRows(updated);
    setBulkRows(updated);
  };

  const handleRowSelectToggle = (tempId) => {
    const updated = bulkRows.map(r => {
      if (r.tempId === tempId) {
        return { ...r, selected: !r.selected };
      }
      return r;
    });
    validateBulkRows(updated);
    setBulkRows(updated);
  };

  const handleSelectAllToggle = (checked) => {
    const updated = bulkRows.map(r => ({ ...r, selected: checked }));
    validateBulkRows(updated);
    setBulkRows(updated);
  };

  const handleDeleteBulkRows = (type) => {
    let updated;
    if (type === 'selected') {
      updated = bulkRows.filter(r => !r.selected);
    } else {
      updated = bulkRows.filter(r => r.selected);
    }
    validateBulkRows(updated);
    setBulkRows(updated);
  };

  const handleBulkConfirm = async () => {
    const selectedRows = bulkRows.filter(r => r.selected);
    if (selectedRows.length === 0) {
      triggerAlert('error', 'No rows selected for upload.');
      return;
    }

    // Check if there are any errors in the selected rows
    const hasErrors = selectedRows.some(r => Object.keys(r.errors).length > 0);
    if (hasErrors) {
      triggerAlert('error', 'Cannot upload. Resolve all highlighted cell errors in selected rows first.');
      return;
    }

    setLoading(true);
    let successCount = 0;
    try {
      for (const r of selectedRows) {
        const pt = productTypes.find(p => p.name.toLowerCase() === r.product_type_name.toLowerCase());
        const ptScheds = allSchedules[pt.id] || [];
        const sched = ptScheds.find(s => s.name.toLowerCase() === r.schedule_name.toLowerCase());

        await db.addProject({
          tag_no: r.tag_no,
          description: r.description,
          product_type_id: pt.id,
          schedule_id: sched.id,
          customer: r.customer,
          contract_no: r.contract_no,
          sales_ref: r.sales_ref,
          pm_owner: r.pm_owner,
          engineer_owner: r.engineer_owner,
          procurement_owner: r.procurement_owner,
          production_owner: r.production_owner,
          fat_owner: r.fat_owner,
          contract_signed_date: r.contract_signed_date,
          ros_date: r.ros_date,
          notes: r.notes,
          actual_dates: '{}'
        });
        successCount++;
      }

      triggerAlert('success', `Bulk upload complete! Successfully registered ${successCount} projects.`);
      setBulkRows([]);
      setBulkMode(false);
      loadAllReferenceData();

      if (onRedirectToTracker) {
        setTimeout(() => onRedirectToTracker(), 1200);
      }
    } catch (err) {
      triggerAlert('error', `Bulk upload failed at ${successCount + 1}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // VIEW RENDERERS
  // ==========================================

  // 1. Render CSV Bulk Verification spreadsheet
  if (bulkMode) {
    const selectedCount = bulkRows.filter(r => r.selected).length;
    const hasAnyErrors = bulkRows.filter(r => r.selected).some(r => Object.keys(r.errors).length > 0);

    return (
      <div className="space-y-6 max-w-full">
        {/* Bulk Header */}
        <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                setBulkMode(false);
                setBulkRows([]);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Bulk Product Registry Spreadsheet</h2>
              <p className="text-xs text-gray-500 mt-1">
                Edit cells inline. Cells with invalid constraints or clashed Tag Nos are outlined in red. Select rows to upload.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleDeleteBulkRows('selected')}
              disabled={selectedCount === 0}
              className="flex items-center space-x-1.5 px-3 py-2 border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 rounded-lg text-xs font-semibold shadow-sm transition disabled:bg-gray-50 disabled:text-gray-300 disabled:border-gray-100 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Selected ({selectedCount})</span>
            </button>
            <button
              onClick={() => handleDeleteBulkRows('unselected')}
              className="flex items-center space-x-1.5 px-3 py-2 border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <span>Delete Unselected</span>
            </button>
            <button
              onClick={handleBulkConfirm}
              className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm transition ${
                hasAnyErrors 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Confirm Upload ({selectedCount} Rows)</span>
            </button>
          </div>
        </div>

        <Alert alert={alert} />

        {hasAnyErrors && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs font-semibold flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span>
              Validation Errors Identified: Some selected rows contain cell errors (clashing Tag Nos, unrecognised Product Types/Schedules, or invalid date formats). Fix these in the table before clicking Confirm Upload.
            </span>
          </div>
        )}

        {/* Spreadsheet spreadsheet grid */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden max-w-full">
          <div className="overflow-x-auto max-w-full block">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50 font-bold text-gray-500 text-left">
                <tr>
                  <th className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={bulkRows.length > 0 && bulkRows.every(r => r.selected)}
                      onChange={(e) => handleSelectAllToggle(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                  </th>
                  <th className="px-3 py-3 w-32 min-w-[120px]">Tag No</th>
                  <th className="px-3 py-3 w-40 min-w-[150px]">Product Type</th>
                  <th className="px-3 py-3 w-36 min-w-[130px]">Schedule Name</th>
                  <th className="px-3 py-3 w-32 min-w-[120px]">Customer</th>
                  <th className="px-3 py-3 w-28 min-w-[100px]">Contract Signed</th>
                  <th className="px-3 py-3 w-28 min-w-[100px]">ROS Date</th>
                  <th className="px-3 py-3 w-28 min-w-[100px]">Contract No</th>
                  <th className="px-3 py-3 w-28 min-w-[100px]">Sales Ref</th>
                  <th className="px-3 py-3 w-32 min-w-[110px]">PM Owner</th>
                  <th className="px-3 py-3 w-32 min-w-[110px]">Engineer</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">

                {bulkRows.map(r => {
                  const errorClass = (field) => r.errors[field] ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-500';

                  return (
                    <tr key={r.tempId} className={`hover:bg-gray-50 transition ${r.selected ? '' : 'opacity-50'}`}>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <input
                          type="checkbox"
                          checked={r.selected}
                          onChange={() => handleRowSelectToggle(r.tempId)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={r.tag_no}
                          onChange={(e) => handleBulkCellChange(r.tempId, 'tag_no', e.target.value)}
                          className={`w-full px-2 py-1.5 border rounded focus:outline-none text-[11px] ${errorClass('tag_no')}`}
                          title={r.errors.tag_no}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={r.product_type_name}
                          onChange={(e) => handleBulkCellChange(r.tempId, 'product_type_name', e.target.value)}
                          className={`w-full px-2 py-1.5 border rounded focus:outline-none text-[11px] ${errorClass('product_type_name')}`}
                          title={r.errors.product_type_name}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={r.schedule_name}
                          onChange={(e) => handleBulkCellChange(r.tempId, 'schedule_name', e.target.value)}
                          className={`w-full px-2 py-1.5 border rounded focus:outline-none text-[11px] ${errorClass('schedule_name')}`}
                          title={r.errors.schedule_name}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={r.customer}
                          onChange={(e) => handleBulkCellChange(r.tempId, 'customer', e.target.value)}
                          className={`w-full px-2 py-1.5 border rounded focus:outline-none text-[11px] ${errorClass('customer')}`}
                          title={r.errors.customer}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={r.contract_signed_date}
                          placeholder="YYYY-MM-DD"
                          onChange={(e) => handleBulkCellChange(r.tempId, 'contract_signed_date', e.target.value)}
                          className={`w-full px-2 py-1.5 border rounded focus:outline-none text-[11px] ${errorClass('contract_signed_date')}`}
                          title={r.errors.contract_signed_date}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={r.ros_date}
                          placeholder="YYYY-MM-DD"
                          onChange={(e) => handleBulkCellChange(r.tempId, 'ros_date', e.target.value)}
                          className={`w-full px-2 py-1.5 border rounded focus:outline-none text-[11px] ${errorClass('ros_date')}`}
                          title={r.errors.ros_date}
                        />
                      </td>

                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={r.contract_no}
                          onChange={(e) => handleBulkCellChange(r.tempId, 'contract_no', e.target.value)}
                          className={`w-full px-2 py-1.5 border rounded focus:outline-none text-[11px] ${errorClass('contract_no')}`}
                          title={r.errors.contract_no}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={r.sales_ref}
                          onChange={(e) => handleBulkCellChange(r.tempId, 'sales_ref', e.target.value)}
                          className={`w-full px-2 py-1.5 border rounded focus:outline-none text-[11px] ${errorClass('sales_ref')}`}
                          title={r.errors.sales_ref}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={r.pm_owner}
                          onChange={(e) => handleBulkCellChange(r.tempId, 'pm_owner', e.target.value)}
                          className={`w-full px-2 py-1.5 border rounded focus:outline-none text-[11px] ${errorClass('pm_owner')}`}
                          title={r.errors.pm_owner}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={r.engineer_owner}
                          onChange={(e) => handleBulkCellChange(r.tempId, 'engineer_owner', e.target.value)}
                          className={`w-full px-2 py-1.5 border rounded focus:outline-none text-[11px] ${errorClass('engineer_owner')}`}
                          title={r.errors.engineer_owner}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // 2. Render Manual Registration Form and CSV File Actions
  const selectedPt = productTypes.find(pt => pt.id === parseInt(formData.product_type_id));
  const activeSchedules = selectedPt ? (allSchedules[selectedPt.id] || []) : [];

  return (
    <div className="space-y-6">
      {/* Registry Actions Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Register New Projects</h2>
          <div className="mt-3">
            <p className="text-sm text-gray-800 mt-2">
              You can either upload a CSV file for batch registration or fill in the manual form below. Ensure that all required fields are completed and that Tag Nos are unique.
            </p>
            <p className="text-sm text-gray-800 mt-3">
              Every project is affiliated with a product type and a schedule. Only product types that are <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 border border-amber-200">SUB-VALID</span> and <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">VALID</span> can be registered under a project.
            </p>
          </div>

        {/* 👇 ADD THIS BUTTON 👇 */}
          <button
            type="button"
            onClick={() => setShowValidityModal(true)}
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 transition mt-3"
            title="Learn more about Product Type status"
          >
            <span>Learn more about validity status here</span>
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold">
              <Info className="w-3.5 h-3.5" />
            </span>
          </button>        
        </div>
      </div>

      {/* Floating Alert */}
      {alert && (
        <div className={`p-4 rounded-lg border flex items-center space-x-3 ${
          alert.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {alert.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-semibold">{alert.message}</span>
        </div>
      )}

      {/*Bulk Registration Instructions and buttons*/}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 text-md mb-3">
          Batch Project Registration with CSV
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Use the CSV template to prepare multiple project entries. Ensure all required fields are filled and that Tag Nos are unique. Upload the completed CSV to verify and register projects in bulk.
        </p>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-semibold bg-white transition"
          >
            <Download className="w-4 h-4 text-gray-500" />
            <span>Download CSV Template</span>
          </button>
          <button
            onClick={handleUploadCSV}
            className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-sm transition"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Bulk CSV</span>
          </button>
        </div>
      </div>

      {/* ---- OR ---- (lines on both sides extended to both ends) */}
      <div className="flex items-center justify-center space-x-3">
        <div className="flex-1 h-px bg-gray-300"></div>
        <span className="text-gray-400 font-semibold">OR</span>
        <div className="flex-1 h-px bg-gray-300"></div>
      </div>

      {/* Manual Entry Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 text-md border-b border-gray-100 pb-3 mb-6">
          Manual Project Registration Form
        </h3>

        <form onSubmit={handleManualSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase">Tag No. *</label>
              <input
                type="text"
                required
                value={formData.tag_no}
                onChange={(e) => setFormForm({ ...formData, tag_no: e.target.value })}
                placeholder="e.g. TAG-2301 (Must be unique)"
                className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase">Description (Optional)</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormForm({ ...formData, description: e.target.value })}
                placeholder="e.g. 500kW Water Cooled Chiller"
                className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase">Product Type *</label>
                <select
                  required
                  value={formData.product_type_id}
                  onChange={(e) => setFormForm({ ...formData, product_type_id: e.target.value, schedule_id: '' })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                >
                  <option value="">-- Select Product --</option>
                  {productTypes.map(pt => {
                    const isInvalid = pt.status === 'invalid';
                    return (
                      <option 
                        key={pt.id} 
                        value={pt.id} 
                        disabled={isInvalid}
                        className={isInvalid ? 'text-gray-400 font-normal' : 'text-gray-900 font-semibold'}
                      >
                        {pt.name} {isInvalid ? '(INVALID)' : `(${pt.status.toUpperCase()})`}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase">Schedule *</label>
                <select
                  required
                  disabled={!formData.product_type_id}
                  value={formData.schedule_id}
                  onChange={(e) => setFormForm({ ...formData, schedule_id: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white disabled:bg-gray-50 disabled:cursor-not-allowed"
                >
                  <option value="">-- Select Schedule --</option>
                  {activeSchedules.map(s => {
                    const isValid = scheduleValidationMap[s.id];
                    return (
                      <option 
                        key={s.id} 
                        value={s.id} 
                        disabled={!isValid}
                        className={!isValid ? 'text-gray-400 font-normal' : 'text-gray-900 font-semibold'}
                      >
                        {s.name} {!isValid ? '(INCOMPLETE)' : '(COMPLETE)'}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase">Contract Signed Date *</label>
                <input
                  type="date"
                  required
                  value={formData.contract_signed_date}
                  onChange={(e) => setFormForm({ ...formData, contract_signed_date: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase">ROS Date *</label>
                <input
                  type="date"
                  required
                  value={formData.ros_date}
                  onChange={(e) => setFormForm({ ...formData, ros_date: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase">Customer *</label>
              <input
                type="text"
                required
                value={formData.customer}
                onChange={(e) => setFormForm({ ...formData, customer: e.target.value })}
                placeholder="e.g. Apex Manufacturing Ltd."
                className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase">Contract No. *</label>
                <input
                  type="text"
                  required
                  value={formData.contract_no}
                  onChange={(e) => setFormForm({ ...formData, contract_no: e.target.value })}
                  placeholder="e.g. CON-2026-X1"
                  className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase">Sales Ref. *</label>
                <input
                  type="text"
                  required
                  value={formData.sales_ref}
                  onChange={(e) => setFormForm({ ...formData, sales_ref: e.target.value })}
                  placeholder="e.g. REF-1092"
                  className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase">Project Manager (PM) *</label>
                <input
                  type="text"
                  required
                  value={formData.pm_owner}
                  onChange={(e) => setFormForm({ ...formData, pm_owner: e.target.value })}
                  placeholder="e.g. Alan Smith"
                  className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase">Engineer Owner *</label>
                <input
                  type="text"
                  required
                  value={formData.engineer_owner}
                  onChange={(e) => setFormForm({ ...formData, engineer_owner: e.target.value })}
                  placeholder="e.g. Bob Vance"
                  className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase">Procurement *</label>
                <input
                  type="text"
                  required
                  value={formData.procurement_owner}
                  onChange={(e) => setFormForm({ ...formData, procurement_owner: e.target.value })}
                  placeholder="e.g. Charlie"
                  className="mt-1 block w-full rounded-lg border border-gray-300 py-1.5 px-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase">Production *</label>
                <input
                  type="text"
                  required
                  value={formData.production_owner}
                  onChange={(e) => setFormForm({ ...formData, production_owner: e.target.value })}
                  placeholder="e.g. Dave"
                  className="mt-1 block w-full rounded-lg border border-gray-300 py-1.5 px-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase">FAT Owner *</label>
                <input
                  type="text"
                  required
                  value={formData.fat_owner}
                  onChange={(e) => setFormForm({ ...formData, fat_owner: e.target.value })}
                  placeholder="e.g. Edward"
                  className="mt-1 block w-full rounded-lg border border-gray-300 py-1.5 px-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase">Notes (Optional)</label>
              <textarea
                rows="2"
                value={formData.notes}
                onChange={(e) => setFormForm({ ...formData, notes: e.target.value })}
                placeholder="Any special remarks or instructions"
                className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-md transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Registering...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Register New Project</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 👇 ADD THIS MODAL COMPONENT 👇 */}
      <ModalValidityStatusGuide
        isOpen={showValidityModal} 
        onClose={() => setShowValidityModal(false)} 
      />    
    </div>
  );
}

