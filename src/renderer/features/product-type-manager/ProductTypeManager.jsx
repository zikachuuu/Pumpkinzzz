import React, { useState, useEffect } from 'react';
import { 
  Plus, ChevronRight, ArrowLeft, Search, Check, RefreshCw, Layers, Info, AlertCircle 
} from 'lucide-react';
import * as db from '../../utils/db';

// Component Imports
import BatchProductTypeSection from './components/BatchProductTypeSection';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import ModalValidityStatusGuide from './components/ValidityStatusGuide';
import { selectAndParseImportFile } from './services/importCsvService';
import ImportWizardModal from './components/ImportWizardModal';
import CsvFormatErrorModal from '../../components/ui/CsvFormatErrorModal.jsx';
import ExportSelectionModal from './components/ExportSelectionModal';
import UsageCapsule from '../../components/ui/UsageCapsule.jsx';
import UsageDetailsModal from '../../components/ui/UsageDetailsModal.jsx';

// View Imports
import ScheduleMilestoneTab from './views/Schedule-Milestone';
import BomTab from './views/BOM';
import LeadTimesTab from './views/LeadTime';

// Hook Imports
import { useProductType } from './hooks/useProductType';
import { useProductTypeConfig } from './hooks/useProductTypeConfig';
import { useProductTypeCsv } from './hooks/useProductTypeCsv';

import { exportBatchFormatA, exportBatchFormatB } from './services/exportCsvService';

export default function ProductTypeManager() {
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Modal / Dialog States
  const [showAddPtModal, setShowAddPtModal] = useState(false);
  const [ptNameInput, setPtNameInput] = useState('');
  const [ptModalError, setPtModalError] = useState('');
  const [showValidityModal, setShowValidityModal] = useState(false);
  const [ptRenameId, setPtRenameId] = useState(null);
  const [ptRenameInput, setPtRenameInput] = useState('');
  
  // CSV Section Toggle States
  const [showBatchCsvOptions, setShowBatchCsvOptions] = useState(false);
  const [wizardPayload, setWizardPayload] = useState(null);
  const [showFormatErrorModal, setShowFormatErrorModal] = useState(false);
  const [uploadedHeaders, setUploadedHeaders] = useState([]);
  const [expectedHeaders, setExpectedHeaders] = useState([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportMode, setExportMode] = useState('bom');
  
  const [usageModal, setUsageModal] = useState({ isOpen: false, type: '', id: null, name: '' });
  const openUsageModal = (type, id, name) => setUsageModal({ isOpen: true, type, id, name });

  const handleUniversalImportClick = async () => {
    try {
      const payload = await selectAndParseImportFile();
      if (payload) {
        setWizardPayload(payload);
      }
    } catch (err) {
      if (err.isFormatError) {
        setUploadedHeaders(err.uploadedHeaders);
        setExpectedHeaders(err.expectedHeaders);
        setShowFormatErrorModal(true);
      } else {
        triggerAlert('error', err.message);
      }
    }
  };

  // Detail View: Schedules & Milestones State
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [scheduleNameInput, setScheduleNameInput] = useState('');

  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null); 
  const [milestoneForm, setMilestoneForm] = useState({
    name: '', anchor_id: '', days: 0, direction: 'after', remark: ''
  });

  // Components Management State
  const [allGlobalComponents, setAllGlobalComponents] = useState([]);
  const [componentProductTypeId, setComponentProductTypeId] = useState('');
  const [sourceComponents, setSourceComponents] = useState([]);
  const [showAddComponentModal, setShowAddComponentModal] = useState(false);
  const [componentForm, setComponentForm] = useState({ name: '', remarks: '' });
  const [componentCount, setComponentCount] = useState(1);
  const [selectedGlobalComponentId, setSelectedGlobalComponentId] = useState('');

  const triggerAlert = (type, message) => {
    setAlert({ type, message });
  };

  const loadGlobalComponents = async () => {
    try {
      setAllGlobalComponents(await db.getComponents());
    } catch (err) {
      console.error('Failed to load global components', err);
    }
  };

  // --- HOOKS ---
  const {
    productTypes, setProductTypes, searchTerm, setSearchTerm, statusFilter, setStatusFilter,
    inUseFilter, setInUseFilter,
    sortBy, setSortBy, loading: isOverviewLoading, filteredPtList, loadProductTypes,
    handleAddProductType, handleRenameProductType, handleDeleteProductType
  } = useProductType(triggerAlert);

  const {
    selectedPt, activeTab, setActiveTab, schedules, selectedSchedule, milestones,
    scheduleValidity, attachedComponents, leadTimeSettings, setLeadTimeSettings,
    isDetailLoading, handleSelectProductType, handleSelectSchedule, clearSelection,
    handleAddSchedule, handleDeleteSchedule, handleSaveMilestone, handleDeleteMilestone,
    handleDetachComponent, handleSaveLeadTimes, getScheduleValidity, handleLeadTimeChange,
    handleSaveLeadTimesForSchedule,
    highlightComponentId, setHighlightComponentId
  } = useProductTypeConfig(triggerAlert);    

  const {
    handleDownloadPtTemplate
  } = useProductTypeCsv({
    triggerAlert, setLoading, loadProductTypes, loadGlobalComponents,
    selectedPt, scheduleValidity, handleSelectProductType
  });

  // --- EFFECTS ---
  useEffect(() => {
    loadProductTypes();
    loadGlobalComponents();
  }, []);

  useEffect(() => {
    if (!componentProductTypeId) {
      setSourceComponents([]);
      return;
    }
    db.getAttachedComponents(parseInt(componentProductTypeId))
      .then(setSourceComponents)
      .catch(err => triggerAlert('error', `Failed to load product type components: ${err.message}`));
  }, [componentProductTypeId]);

  // --- CRUD HANDLERS ---
  const handleOpenMilestoneModal = (milestone = null) => {
    if (milestone) {
      setEditingMilestone(milestone);
      setMilestoneForm({
        name: milestone.name, anchor_id: milestone.anchor_id || '',
        days: Math.abs(milestone.offset), direction: milestone.offset < 0 ? 'before' : 'after',
        remark: milestone.remark || ''
      });
    } else {
      setEditingMilestone(null);
      const defaultAnchor = milestones.find(m => m.name.toLowerCase() === 'contract signed')?.id || '';
      setMilestoneForm({ name: '', anchor_id: defaultAnchor, days: 0, direction: 'after', remark: '' });
    }
    setShowMilestoneModal(true);
  };

  const onAddSubmit = async (e) => {
    e.preventDefault(); 
    if (!ptNameInput.trim()) return;
    try {
      await handleAddProductType(ptNameInput.trim());
      setShowAddPtModal(false);
      setPtNameInput('');
      setPtModalError('');
    } catch (err) {
      setPtModalError(err.message);
    }
  };

  const onAddScheduleSubmit = async (e) => {
    e.preventDefault(); 
    if (!scheduleNameInput.trim()) return;
    try {
      await handleAddSchedule(scheduleNameInput);
      setScheduleNameInput('');
      setShowAddScheduleModal(false);
    } catch (err) {
      triggerAlert('error', err.message);
    }
  };

  const onSaveMilestoneSubmit = async (e) => {
    e.preventDefault(); 
    if (!milestoneForm.name.trim()) return;
    try {
      await handleSaveMilestone(milestoneForm, editingMilestone);
      setShowMilestoneModal(false);
      setEditingMilestone(null);
    } catch (err) {
      triggerAlert('error', err.message);
    }
  };

  const onRenameProductTypeSubmit = async (e, productType) => {
    e.preventDefault();
    try {
      await handleRenameProductType(productType.id, ptRenameInput);
      setPtRenameId(null);
      setPtRenameInput('');
    } catch (err) {
      triggerAlert('error', err.message);
    }
  };

  const handleCreateGlobalComponent = async (e) => {
    e.preventDefault();
    if (!componentForm.name.trim()) return;
    try {
      const componentName = componentForm.name.trim();
      const existingComponents = await db.getComponents();
      const existingComponent = existingComponents.find(c => c.name.toLowerCase() === componentName.toLowerCase());
      const componentId = existingComponent ? existingComponent.id : (await db.addComponent(componentName, componentForm.remarks.trim())).lastID;
      
      await db.attachComponentToProductType(componentId, selectedPt.id, componentCount);
      setComponentForm({ name: '', remarks: '' });
      setComponentCount(1);
      setShowAddComponentModal(false);
      triggerAlert('success', existingComponent ? 'Existing component attached!' : 'New component created and attached!');
      loadGlobalComponents();
      await handleSelectProductType(selectedPt, true);

      setHighlightComponentId(componentId);
      setActiveTab('leadtimes');

    } catch (err) {
      triggerAlert('error', `Failed to create component: ${err.message}`);
    }
  };

  const handleAttachExistingComponent = async () => {
    if (!selectedGlobalComponentId) return;
    try {
      const compIdToAttach = await db.attachComponentToProductType(parseInt(selectedGlobalComponentId), selectedPt.id, componentCount);
      setSelectedGlobalComponentId('');
      setComponentCount(1);
      triggerAlert('success', 'Component attached successfully!');
      await handleSelectProductType(selectedPt, true);

      setHighlightComponentId(compIdToAttach);
      setActiveTab('leadtimes');

    } catch (err) {
      triggerAlert('error', `Failed to attach component: ${err.message}`);
    }
  };


  if (selectedPt) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center space-x-4">
            <button onClick={() => { clearSelection(); loadProductTypes(); }} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-2xl font-bold text-gray-900">{selectedPt.name}</h2>
                <StatusBadge status={selectedPt.status} />
              </div>
              <p className="text-sm text-gray-800 mt-2">
                Set the Schedules, Milestones, BOM, and Procurement Lead Times for this product type. 
              </p>            
            </div>
          </div>
        </div>

        <Alert alert={alert} onDismiss={() => setAlert(null)} />

        <div className="border-b border-gray-200 bg-white rounded-t-lg">
          <nav className="flex px-6 space-x-8" aria-label="Tabs">
            <button onClick={() => setActiveTab('schedules')} className={`py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${activeTab === 'schedules' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              Schedules & Milestones ({schedules.length})
            </button>
            <button onClick={() => setActiveTab('components')} className={`py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${activeTab === 'components' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              BOM - Bill of Materials ({attachedComponents.length})
            </button>
            <button onClick={() => setActiveTab('leadtimes')} className={`py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${activeTab === 'leadtimes' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              Procurement Lead Times
            </button>
          </nav>
        </div>

        {activeTab === 'schedules' && (
          <ScheduleMilestoneTab 
            schedules={schedules} selectedSchedule={selectedSchedule} milestones={milestones}
            scheduleValidity={scheduleValidity} handleSelectSchedule={handleSelectSchedule}
            handleDeleteSchedule={handleDeleteSchedule} handleDeleteMilestone={handleDeleteMilestone}
            setShowAddScheduleModal={setShowAddScheduleModal} handleOpenMilestoneModal={handleOpenMilestoneModal}
            openUsageModal={openUsageModal}
          />
        )}

        {activeTab === 'components' && (
          <BomTab
            productTypes={productTypes} productTypeId={selectedPt.id} attachedComponents={attachedComponents} sourceComponents={sourceComponents}
            handleAttachExistingComponent={handleAttachExistingComponent} handleCreateGlobalComponent={handleCreateGlobalComponent}
            handleDetachComponent={handleDetachComponent} componentProductTypeId={componentProductTypeId}
            setComponentProductTypeId={setComponentProductTypeId} selectedGlobalComponentId={selectedGlobalComponentId}
            setSelectedGlobalComponentId={setSelectedGlobalComponentId} componentForm={componentForm}
            setComponentForm={setComponentForm} allGlobalComponents={allGlobalComponents}
            componentCount={componentCount} setComponentCount={setComponentCount}
          />
        )}

        {activeTab === 'leadtimes' && (
          <LeadTimesTab 
            schedules={schedules} milestones={milestones} attachedComponents={attachedComponents}
            leadTimeSettings={leadTimeSettings} handleLeadTimeChange={handleLeadTimeChange}
            handleSaveLeadTimes={handleSaveLeadTimes} scheduleValidity={scheduleValidity}
            getScheduleValidity={getScheduleValidity} handleSaveLeadTimesForSchedule={handleSaveLeadTimesForSchedule}
            highlightComponentId={highlightComponentId} setHighlightComponentId={setHighlightComponentId}
          />
        )}

        {/* MODAL: ADD SCHEDULE */}
        <Modal isOpen={showAddScheduleModal} onClose={() => { setShowAddScheduleModal(false); setScheduleNameInput(''); }} title="Create New Schedule" maxWidth="max-w-md">
          <form onSubmit={onAddScheduleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase">Schedule Name</label>
              <input type="text" required value={scheduleNameInput} onChange={(e) => setScheduleNameInput(e.target.value)} placeholder ="e.g. Normal Build, Fast-track, Rush" className="mt-1.5 block w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              <p className="text-[10px] text-gray-500 mt-2">Creating a schedule automatically spawns 'Contract Signed' and 'ROS' as anchor boundary roots.</p>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button type="button" onClick={() => { setShowAddScheduleModal(false); setScheduleNameInput(''); }} className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-semibold transition">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition">Create Schedule</button>
            </div>
          </form>
        </Modal>

        {/* MODAL: MILESTONE */}
        <Modal isOpen={showMilestoneModal} onClose={() => { setShowMilestoneModal(false); setEditingMilestone(null); setMilestoneForm({ name: '', anchor_id: '', days: 0, direction: 'after', remark: '' }); }} title={editingMilestone ? `Edit Milestone "${editingMilestone.name}"` : 'Add Custom Milestone'} maxWidth="max-w-md">
          <form onSubmit={onSaveMilestoneSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase">Milestone Name</label>
              <input type="text" required value={milestoneForm.name} onChange={(e) => setMilestoneForm({ ...milestoneForm, name: e.target.value })} placeholder="e.g. Production Start, Material Delivery" className="mt-1 block w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>

            {(!editingMilestone || (editingMilestone.name.toLowerCase() !== 'contract signed' && editingMilestone.name.toLowerCase() !== 'ros')) && (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase">Anchor Milestone</label>
                  <select value={milestoneForm.anchor_id} onChange={(e) => setMilestoneForm({ ...milestoneForm, anchor_id: e.target.value })} className="mt-1 block w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                    <option value="">-- Choose Anchor --</option>
                    {milestones.filter(m => !editingMilestone || m.id !== editingMilestone.id).map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase">Offset (Days)</label>
                    <input type="number" min="0" value={milestoneForm.days} onChange={(e) => setMilestoneForm({ ...milestoneForm, days: e.target.value })} placeholder="e.g. 14" className="mt-1 block w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase">Chronology</label>
                    <select value={milestoneForm.direction} onChange={(e) => setMilestoneForm({ ...milestoneForm, direction: e.target.value })} className="mt-1 block w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white">
                      <option value="after">After Anchor</option>
                      <option value="before">Before Anchor</option>
                    </select>
                  </div>
                </div>
              </>
            )}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase">Remarks / Description</label>
              <textarea rows="2" value={milestoneForm.remark} onChange={(e) => setMilestoneForm({ ...milestoneForm, remark: e.target.value })} placeholder="Provide description or details" className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button type="button" onClick={() => { setShowMilestoneModal(false); setEditingMilestone(null); setMilestoneForm({ name: '', anchor_id: '', days: 0, direction: 'after', remark: '' }); }} className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-semibold transition">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition">Save Milestone</button>
            </div>
          </form>
        </Modal>

        <ImportWizardModal 
          isOpen={!!wizardPayload} 
          importPayload={wizardPayload}
          existingProductTypes={productTypes}
          onClose={() => setWizardPayload(null)}
          triggerAlert={triggerAlert}
          openUsageModal={openUsageModal}
          onSuccess={() => {          
            loadProductTypes();
            loadGlobalComponents();
          }}
        />

        <CsvFormatErrorModal 
          isOpen={showFormatErrorModal} 
          onClose={() => setShowFormatErrorModal(false)} 
          uploadedHeaders={uploadedHeaders} 
          expectedHeaders={expectedHeaders} 
        />

        <UsageDetailsModal 
          isOpen={usageModal.isOpen} 
          onClose={() => setUsageModal(prev => ({ ...prev, isOpen: false }))} 
          type={usageModal.type} 
          id={usageModal.id} 
          name={usageModal.name} 
        />
      </div>
    );
  }

  // ------------------------------------------
  // LIST / OVERVIEW SCREEN
  // ------------------------------------------
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Register New Product Types</h2>
          <div className="mt-3">
            <p className="text-sm text-gray-800">Every project is affiliated with a product type. Register product types here first before registering projects.</p>
            <p className="text-sm text-gray-800 mt-3">To register new product types:</p>
            <ol className="list-decimal list-inside text-sm text-gray-800 mt-2 space-y-1 ml-4">
              <li>Create a new product type by clicking the <span className="font-bold"> + Register New Product Type</span> button. Newly created product types are initially <StatusBadge status="invalid" />.</li>
              <li>Furnish the details (Schedules & Milestones, BOM, Procurement Lead Times) by clicking the <span className="font-bold">Manage Config</span> button.</li>
              <li>Only product types that are <StatusBadge status="sub-valid" /> and <StatusBadge status="valid" /> can be registered under a project.</li>
            </ol>
            <button type="button" onClick={() => setShowValidityModal(true)} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 transition mt-3" title="Learn more about Product Type status">
              <span>Learn more about validity status here</span>
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold"><Info className="w-3.5 h-3.5" /></span>
            </button>
          </div>
        </div>
        <div>
          <button onClick={() => setShowAddPtModal(true)} className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-sm transition">
            <Plus className="w-4 h-4" />
            <span>Register New Product Type</span>
          </button>
        </div>
      </div>

      <BatchProductTypeSection
        open={showBatchCsvOptions}
        onToggle={() => setShowBatchCsvOptions(open => !open)}
        onOpenExportBomModal={() => {
          setExportMode('bom');
          setShowExportModal(true);
        }}
        onOpenExportFullModal={() => {
          setExportMode('full');
          setShowExportModal(true);
        }}
        onImport={handleUniversalImportClick} 
      />

      <Alert alert={alert} onDismiss={() => setAlert(null)} />

      {/* Search, Filters, and Sort */}
      <div className="flex flex-col xl:flex-row xl:items-center gap-4 xl:gap-8 bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
        
        {/* Search */}
        <div className="relative min-w-0 flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Product Type names..."
            className="pl-10 pr-4 py-2.5 block w-full rounded-lg border border-gray-300 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors"
          />
        </div>
        
{/* Filters & Sort */}
        <div className="flex flex-wrap items-center justify-end gap-3 xl:flex-nowrap">
          
          <span className="shrink-0 text-[11px] font-semibold text-gray-600">Filter by</span>
          
          {/* Changed items-center to items-end to perfectly match ProjectTracker */}
          <div className="flex items-end gap-2">
            
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold leading-none text-gray-600">Validity Status</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-[160px] rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-700 transition-colors focus:border-indigo-500 focus:outline-none cursor-pointer font-semibold"
              >
                <option value="all">All</option>
                <option value="valid">Valid</option>
                <option value="sub-valid">Sub-Valid</option>
                <option value="invalid">Invalid</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold leading-none text-gray-600">Usage</span>
              <select
                value={inUseFilter}
                onChange={(e) => setInUseFilter(e.target.value)}
                className="block w-[110px] rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-700 transition-colors focus:border-indigo-500 focus:outline-none cursor-pointer font-semibold"
              >
                <option value="all">All</option>
                <option value="in-use">In Use</option>
                <option value="not-in-use">Not In Use</option>
              </select>
            </div>

          </div>

          <div className="ml-3 flex items-center gap-2">
            <span className="shrink-0 text-[11px] font-semibold text-gray-600">Sort by</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="block w-[185px] rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-700 transition-colors focus:border-indigo-500 focus:outline-none cursor-pointer font-semibold"
            >
              <option value="name-asc">Name (A → Z)</option>
              <option value="name-desc">Name (Z → A)</option>
              <option value="status-asc">Status (Invalid → Valid)</option>
              <option value="status-desc">Status (Valid → Invalid)</option>
              <option value="schedules-desc">Schedules (Most)</option>
              <option value="schedules-asc">Schedules (Least)</option>
              <option value="components-desc">Components (Most)</option>
              <option value="components-asc">Components (Least)</option>
            </select>
          </div>
        </div>

      </div>

      {isOverviewLoading ? (
        <div className="p-16 text-center text-gray-500 bg-white rounded-lg border border-gray-200 shadow-sm flex items-center justify-center space-x-3">
          <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
          <span className="font-semibold text-sm">Loading Product Types...</span>
        </div>
      ) : filteredPtList.length === 0 ? (
        <div className="p-16 text-center text-gray-400 bg-white rounded-lg border border-gray-200 shadow-sm">
          <Layers className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="font-semibold text-sm">No product types found.</p>
          <p className="text-xs text-gray-400 mt-1">Try relaxing filters or add a new record to start.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPtList.map(pt => (
            <div key={pt.id} className="relative bg-white rounded-xl border border-gray-200 shadow-sm hover:z-20 hover:shadow-md hover:border-gray-300 transition-all flex flex-col justify-between">
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  {ptRenameId === pt.id ? (
                    <form onSubmit={(e) => onRenameProductTypeSubmit(e, pt)} className="flex min-w-0 flex-1 items-center space-x-1.5 mr-2">
                      <input type="text" value={ptRenameInput} onChange={(e) => setPtRenameInput(e.target.value)} className="block min-w-0 flex-1 max-w-[220px] rounded border px-2 py-1 text-xs focus:outline-none focus:border-indigo-500" required autoFocus />
                      <button type="submit" className="p-1 text-emerald-600 hover:bg-emerald-50 rounded" title="Save Rename"><Check className="w-3.5 h-3.5" /></button>
                    </form>
                  ) : (
                    <h3 className="font-bold text-gray-950 text-lg tracking-tight truncate max-w-[160px]">{pt.name}</h3>
                  )}
                  
                  <span className="inline-flex shrink-0 items-center gap-1">
                    <UsageCapsule count={pt.in_use_count} onClick={() => openUsageModal('product_type', pt.id, pt.name)} />

                    <StatusBadge status={pt.status} />
                    <button type="button" onClick={() => setShowValidityModal(true)} className="p-1 text-gray-400 hover:text-indigo-600" title={`Why is this product type ${pt.status}?`}><Info className="w-3.5 h-3.5" /></button>
                  </span>

                </div>
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-gray-600 bg-gray-50 rounded-lg p-3">
                  <div><span className="text-[10px] uppercase text-gray-400 block mb-0.5">Schedules</span><span className="text-sm font-bold text-gray-800">{pt.schedule_count}</span></div>
                  <div><span className="text-[10px] uppercase text-gray-400 block mb-0.5">Components (BOM)</span><span className="text-sm font-bold text-gray-800">{pt.component_count}</span></div>
                </div>
              </div>
              <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex items-center justify-between text-xs font-bold text-gray-600">
                
              <div className="flex space-x-3">
                  <button onClick={() => { setPtRenameId(pt.id); setPtRenameInput(pt.name); }} className="hover:text-indigo-600 transition">Rename</button>
                  
                  <span className={`relative inline-flex group ${pt.in_use_count > 0 ? 'cursor-not-allowed' : ''}`}>
                    {pt.in_use_count > 0 && (
                      <span
                        role="tooltip"
                        className="pointer-events-none absolute right-0 bottom-full z-50 mb-2 hidden w-40 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-center text-[11px] font-semibold leading-tight text-red-700 shadow-lg group-hover:block"
                      >
                        Product type is in use!
                      </span>
                    )}
                    <button 
                      onClick={(e) => {
                        if (pt.in_use_count > 0) return; 
                        handleDeleteProductType(pt.id, pt.name);
                      }} 
                      aria-disabled={pt.in_use_count > 0}
                      title={pt.in_use_count > 0 ? 'Product type is in use!' : 'Delete Product Type'}
                      className={`transition ${pt.in_use_count > 0 ? 'text-gray-300 cursor-not-allowed' : 'hover:text-red-600'}`}
                    >
                      Delete
                    </button>
                  </span>
              </div>  

                <button type="button" onClick={(event) => { event.currentTarget.blur(); handleSelectProductType(pt); }} className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 transition">
                  <span>Manage Config</span><ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: ADD PRODUCT TYPE */}
      <Modal isOpen={showAddPtModal} title="Create New Product Type" onClose={() => { setShowAddPtModal(false); setPtNameInput(''); setPtModalError(''); }}>
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-lg leading-relaxed mb-4">
          <strong>Notice:</strong> Newly created product types are initialized as <StatusBadge status="invalid" />. 
          You must promptly configure schedules, milestones, BOM, and procurement lead times before this product type can be selected for projects.
        </p>
        {ptModalError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs font-bold flex items-center space-x-2 mb-4">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" /><span>{ptModalError}</span>
          </div>
        )}
        <form onSubmit={onAddSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase">Product Type Name</label>
            <input type="text" required value={ptNameInput} onChange={(e) => { setPtNameInput(e.target.value); if (ptModalError) setPtModalError(''); }} placeholder="e.g. Water Chiller, Air Chiller" className="mt-1.5 block w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button type="button" onClick={() => { setShowAddPtModal(false); setPtNameInput(''); setPtModalError(''); }} className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-semibold transition">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition">Create Product Type</button>
          </div>
        </form>
      </Modal>

      <ModalValidityStatusGuide isOpen={showValidityModal} onClose={() => setShowValidityModal(false)} />

      <ImportWizardModal 
        isOpen={!!wizardPayload} 
        importPayload={wizardPayload}
        existingProductTypes={productTypes}
        onClose={() => setWizardPayload(null)}
        triggerAlert={triggerAlert} 
        openUsageModal={openUsageModal}
        onSuccess={() => {          
          loadProductTypes();
          loadGlobalComponents();
        }}
      />

      <CsvFormatErrorModal 
        isOpen={showFormatErrorModal} 
        onClose={() => setShowFormatErrorModal(false)} 
        uploadedHeaders={uploadedHeaders} 
        expectedHeaders={expectedHeaders} 
      />

      <ExportSelectionModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        productTypes={productTypes}
        exportMode={exportMode}
        onExport={(selectedIds) => {
          if (exportMode === 'bom') {
            exportBatchFormatA(triggerAlert, selectedIds);
          } else {
            exportBatchFormatB(triggerAlert, selectedIds);
          }
        }}
        onDownloadTemplate={handleDownloadPtTemplate}
      />

      <UsageDetailsModal 
        isOpen={usageModal.isOpen} 
        onClose={() => setUsageModal(prev => ({ ...prev, isOpen: false }))} 
        type={usageModal.type} 
        id={usageModal.id} 
        name={usageModal.name} 
      />

    </div>
  );
}