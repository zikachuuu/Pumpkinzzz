import React, { useState, useEffect } from 'react';
import { 
  Download, Upload, Save, ArrowLeft, AlertCircle, CheckCircle2, 
  RefreshCw, Info, Plus, Check, X
} from 'lucide-react';
import * as db from '../../utils/db';
import { parseCSV, stringifyCSV } from '../../utils/csv';
import Alert from '../../components/ui/Alert.jsx';
import ModalValidityStatusGuide from '../product-type-manager/components/ValidityStatusGuide.jsx';
import FormattedDateInput from '../../components/ui/FormattedDateInput.jsx';

// 👇 Import the new standalone spreadsheet component 👇
import BulkRegistrySpreadsheet from './components/BulkRegistrySpreadsheet.jsx';
import Modal from '../../components/ui/Modal.jsx';

const REQUIRED_HEADERS = [
  'Tag No', 'Description', 'Product Type', 'Schedule Name', 'Customer', 
  'Contract No', 'Sales Ref', 'PM Owner', 'Engineer Owner', 'Procurement Owner', 
  'Production Owner', 'FAT Owner', 'Contract Signed Date', 'ROS Date', 'Notes'
];

export default function ProjectRegistry({ onRedirectToTracker, dateFormat }) {
  // Global reference states
  const [productTypes, setProductTypes] = useState([]);
  const [existingProjects, setExistingProjects] = useState([]);
  const [allSchedules, setSchedules] = useState({}); 
  const [scheduleValidationMap, setScheduleValidationMap] = useState({}); 
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [showValidityModal, setShowValidityModal] = useState(false);

  // Manual Form States
  const [formData, setFormForm] = useState({
    tag_no: '', description: '', product_type_id: '', schedule_id: '',
    customer: '', contract_signed_date: '', ros_date: '', contract_no: '',
    sales_ref: '', pm_owner: '', engineer_owner: '', procurement_owner: '',
    production_owner: '', fat_owner: '', notes: ''
  });

  // Bulk Upload States
  const [bulkMode, setBulkMode] = useState(false); 
  const [csvData, setCsvData] = useState([]); // Holds the raw parsed CSV text array

  const [showFormatErrorModal, setShowFormatErrorModal] = useState(false);
  const [uploadedHeaders, setUploadedHeaders] = useState([]);

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
  // FILE PICKER & CSV PARSER
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
      const parsedCsv = parseCSV(text);

      if (parsedCsv.length < 2) {
        triggerAlert('error', 'Spreadsheet is empty or contains no data rows.');
        return;
      }

      // 1. Extract and normalize headers
      const uploadedH = parsedCsv[0].map(h => String(h).trim());
      const normalizedUploaded = uploadedH.map(h => h.toLowerCase());
      const normalizedRequired = REQUIRED_HEADERS.map(h => h.toLowerCase());

      // 2. Check if any required headers are missing
      const isMissingRequired = normalizedRequired.some(h => !normalizedUploaded.includes(h));

      if (isMissingRequired) {
        // Block upload, save headers to state, and trigger the modal
        setUploadedHeaders(uploadedH);
        setShowFormatErrorModal(true);
        return; 
      }

      // If validation passes, hand off to the Bulk component
      setCsvData(parsedCsv);
      setBulkMode(true);
    } catch (err) {
      triggerAlert('error', `CSV Parse Error: ${err.message}`);
    }
  };

  // ==========================================
  // MANUAL REGISTRY SUBMISSION
  // ==========================================
  const handleManualSubmit = async (e) => {
    e.preventDefault();

    const clash = existingProjects.some(p => p.tag_no.toLowerCase() === formData.tag_no.trim().toLowerCase());
    if (clash) {
      triggerAlert('error', `A project with Tag No. "${formData.tag_no.trim()}" already exists in the registry.`);
      return;
    }

    const selectedPt = productTypes.find(pt => pt.id === parseInt(formData.product_type_id));
    if (!selectedPt || selectedPt.status === 'invalid') {
      triggerAlert('error', 'Select a valid or sub-valid Product Type.');
      return;
    }

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
      setFormForm({
        tag_no: '', description: '', product_type_id: '', schedule_id: '',
        customer: '', contract_signed_date: '', ros_date: '', contract_no: '',
        sales_ref: '', pm_owner: '', engineer_owner: '', procurement_owner: '',
        production_owner: '', fat_owner: '', notes: ''
      });
      
      await loadAllReferenceData();
      
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
  // VIEW RENDERERS
  // ==========================================

  // 1. If Bulk Mode is true, render the standalone spreadsheet
  if (bulkMode) {
    return (
      <BulkRegistrySpreadsheet 
        initialCsvData={csvData}
        onClose={() => {
          setBulkMode(false);
          setCsvData([]);
        }}
        onSuccess={() => {
          setBulkMode(false);
          setCsvData([]);
          loadAllReferenceData();
          if (onRedirectToTracker) setTimeout(() => onRedirectToTracker(), 1200);
        }}
        triggerAlert={triggerAlert}
        productTypes={productTypes}
        existingProjects={existingProjects}
        allSchedules={allSchedules}
        scheduleValidationMap={scheduleValidationMap}
        dateFormat={dateFormat}
      />
    );
  }

  // 2. Render Manual Registration Form and CSV File Actions
  const selectedPt = productTypes.find(pt => pt.id === parseInt(formData.product_type_id));
  const activeSchedules = selectedPt ? (allSchedules[selectedPt.id] || []) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Register New Projects</h2>
          <div className="mt-3">
            <p className="text-sm text-gray-800 mt-2">
              You can either upload a spreadsheet (.csv file) for batch registration or fill in the manual form below. Ensure that all required fields are completed and that Tag Nos are unique.
            </p>
            <p className="text-sm text-gray-800 mt-3">
              Every project is affiliated with a product type and a schedule. Only product types that are <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 border border-amber-200">SUB-VALID</span> and <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">VALID</span> can be registered under a project.
            </p>
          </div>

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

      {alert && (
        <div className={`p-4 rounded-lg border flex items-center space-x-3 ${
          alert.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {alert.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-semibold">{alert.message}</span>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 text-md border-b border-gray-100 pb-3 mb-4">
          Batch Project Registration with Spreadsheet (.csv file)
        </h3>
        <p className="text-sm text-gray-800 mt-2">
          Download the spreadsheet template (.csv file) to prepare multiple project entries using your preferred spreadsheet application (e.g. Microsoft Excel, Google Sheets). 
        </p>
        <p className="text-sm text-gray-800 mt-2">
          Ensure that Tag No.s are unique, valid product types and schedules are selected, and all required fields are filled. 
        </p>
        <p className="text-sm text-gray-800 mt-4">
          Upload the completed spreadsheet to register projects in bulk. Invalid or incomplete entries will be highlighted for correction before submission.
        </p>
        <div className="flex items-center space-x-3 mt-5">
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-semibold bg-white transition"
          >
            <Download className="w-4 h-4 text-gray-500" />
            <span>Download Spreadsheet Template (.csv file)</span>
          </button>
          <button
            onClick={handleUploadCSV}
            className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-sm transition"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Completed Spreadsheet (.csv file)</span>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center space-x-3">
        <div className="flex-1 h-px bg-gray-300"></div>
        <span className="text-gray-400 font-semibold">OR</span>
        <div className="flex-1 h-px bg-gray-300"></div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 text-md border-b border-gray-100 pb-3 mb-6">
          Manual Project Registration Form
        </h3>

        <form onSubmit={handleManualSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase">Tag No. *</label>
              <input type="text" required value={formData.tag_no} onChange={(e) => setFormForm({ ...formData, tag_no: e.target.value })} placeholder="e.g. TAG-2301 (Must be unique)" className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase">Description (Optional)</label>
              <input type="text" value={formData.description} onChange={(e) => setFormForm({ ...formData, description: e.target.value })} placeholder="e.g. 500kW Water Cooled Chiller" className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase">Product Type *</label>
                <select required value={formData.product_type_id} onChange={(e) => setFormForm({ ...formData, product_type_id: e.target.value, schedule_id: '' })} className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white">
                  <option value="">-- Select Product --</option>
                  {productTypes.map(pt => {
                    const isInvalid = pt.status === 'invalid';
                    return (
                      <option key={pt.id} value={pt.id} disabled={isInvalid} className={isInvalid ? 'text-gray-400 font-normal' : 'text-gray-900 font-semibold'}>
                        {pt.name} {isInvalid ? '(INVALID)' : `(${pt.status.toUpperCase()})`}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase">Schedule *</label>
                <select required disabled={!formData.product_type_id} value={formData.schedule_id} onChange={(e) => setFormForm({ ...formData, schedule_id: e.target.value })} className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white disabled:bg-gray-50 disabled:cursor-not-allowed">
                  <option value="">-- Select Schedule --</option>
                  {activeSchedules.map(s => {
                    const isValid = scheduleValidationMap[s.id];
                    return (
                      <option key={s.id} value={s.id} disabled={!isValid} className={!isValid ? 'text-gray-400 font-normal' : 'text-gray-900 font-semibold'}>
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
                <FormattedDateInput required value={formData.contract_signed_date} onChange={(e) => setFormForm({ ...formData, contract_signed_date: e.target.value })} dateFormat={dateFormat} className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase">ROS Date *</label>
                <FormattedDateInput required value={formData.ros_date} onChange={(e) => setFormForm({ ...formData, ros_date: e.target.value })} dateFormat={dateFormat} className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase">Customer *</label>
              <input type="text" required value={formData.customer} onChange={(e) => setFormForm({ ...formData, customer: e.target.value })} placeholder="e.g. Apex Manufacturing Ltd." className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase">Contract No. *</label>
                <input type="text" required value={formData.contract_no} onChange={(e) => setFormForm({ ...formData, contract_no: e.target.value })} placeholder="e.g. CON-2026-X1" className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase">Sales Ref. *</label>
                <input type="text" required value={formData.sales_ref} onChange={(e) => setFormForm({ ...formData, sales_ref: e.target.value })} placeholder="e.g. REF-1092" className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase">Project Manager (PM) *</label>
                <input type="text" required value={formData.pm_owner} onChange={(e) => setFormForm({ ...formData, pm_owner: e.target.value })} placeholder="e.g. Alan Smith" className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase">Engineer Owner *</label>
                <input type="text" required value={formData.engineer_owner} onChange={(e) => setFormForm({ ...formData, engineer_owner: e.target.value })} placeholder="e.g. Bob Vance" className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase">Procurement *</label>
                <input type="text" required value={formData.procurement_owner} onChange={(e) => setFormForm({ ...formData, procurement_owner: e.target.value })} placeholder="e.g. Charlie" className="mt-1 block w-full rounded-lg border border-gray-300 py-1.5 px-2 text-xs focus:border-indigo-500 focus:outline-none" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase">Production *</label>
                <input type="text" required value={formData.production_owner} onChange={(e) => setFormForm({ ...formData, production_owner: e.target.value })} placeholder="e.g. Dave" className="mt-1 block w-full rounded-lg border border-gray-300 py-1.5 px-2 text-xs focus:border-indigo-500 focus:outline-none" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase">FAT Owner *</label>
                <input type="text" required value={formData.fat_owner} onChange={(e) => setFormForm({ ...formData, fat_owner: e.target.value })} placeholder="e.g. Edward" className="mt-1 block w-full rounded-lg border border-gray-300 py-1.5 px-2 text-xs focus:border-indigo-500 focus:outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase">Notes (Optional)</label>
              <textarea rows="2" value={formData.notes} onChange={(e) => setFormForm({ ...formData, notes: e.target.value })} placeholder="Any special remarks or instructions" className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>

            <div className="pt-4">
              <button type="submit" disabled={loading} className="w-full flex items-center justify-center space-x-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-md transition disabled:bg-gray-300 disabled:cursor-not-allowed">
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Registering...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Register New Project</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      <ModalValidityStatusGuide isOpen={showValidityModal} onClose={() => setShowValidityModal(false)} /> 

      {/* 👇 ADD THIS NEW FORMAT ERROR MODAL 👇 */}
      <Modal isOpen={showFormatErrorModal} onClose={() => setShowFormatErrorModal(false)} title="Wrong spreadsheet format uploaded" maxWidth="max-w-3xl">
        <div className="space-y-4">
          <p className="text-sm text-gray-700">The spreadsheet you uploaded is missing required columns or contains unrecognized headers. Please ensure your file matches the exact template format.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-inner">
            {/* Uploaded List */}
            <div>
              <h4 className="font-bold text-xs text-gray-500 uppercase mb-3">Columns You Uploaded:</h4>
              <ul className="text-xs space-y-2 font-medium">
                {uploadedHeaders.length === 0 ? <li className="text-gray-400 italic">No headers found</li> : uploadedHeaders.map((h, i) => {
                  const isRecognized = REQUIRED_HEADERS.map(req => req.toLowerCase()).includes(h.toLowerCase());
                  return (
                    <li key={i} className={`flex items-start space-x-2 ${isRecognized ? "text-gray-600" : "text-red-600"}`}>
                      {!isRecognized && <X className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
                      {isRecognized && <Check className="w-3.5 h-3.5 mt-0.5 text-emerald-500 shrink-0" />}
                      <span className="leading-tight">{h || '[Empty Column]'} {!isRecognized && '(Unrecognized)'}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
            
            {/* Required List */}
            <div>
              <h4 className="font-bold text-xs text-gray-500 uppercase mb-3">Required Format:</h4>
              <ul className="text-xs space-y-2 font-medium">
                {REQUIRED_HEADERS.map((h, i) => {
                  const isPresent = uploadedHeaders.map(up => up.toLowerCase()).includes(h.toLowerCase());
                  return (
                    <li key={i} className={`flex items-start space-x-2 ${isPresent ? "text-gray-600" : "text-red-600"}`}>
                      {!isPresent && <X className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
                      {isPresent && <Check className="w-3.5 h-3.5 mt-0.5 text-emerald-500 shrink-0" />}
                      <span className="leading-tight">{h} {!isPresent && '(Missing)'}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="flex justify-end pt-4 mt-2">
            <button 
              onClick={() => setShowFormatErrorModal(false)} 
              className="px-8 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 shadow-sm transition"
            >
              OK
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}   
