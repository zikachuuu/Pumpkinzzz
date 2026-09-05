import React, { useState, useEffect } from 'react';
import { 
  Plus, ChevronRight, ArrowLeft, Search, Check, RefreshCw, Layers, Info, AlertCircle 
} from 'lucide-react';
import * as db from '../../utils/db';

// Component Imports
import BatchProductTypeSection from './components/BatchProductTypeSection';
import BatchScheduleSection from './components/BatchScheduleSection';
import ProductTypeImportReview from './views/ProductTypeImportReview';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import ModalValidityStatusGuide from './components/ValidityStatusGuide';

// View Imports
import ScheduleMilestoneTab from './views/Schedule-Milestone';
import BomTab from './views/BOM';
import LeadTimesTab from './views/LeadTime';

// Hook Imports
import { useProductType } from './hooks/useProductType';
import { useProductTypeConfig } from './hooks/useProductTypeConfig';
import { useProductTypeCsv } from './hooks/useProductTypeCsv';

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
  const [showScheduleCsvOptions, setShowScheduleCsvOptions] = useState(false);

  // Detail View: Schedules & Milestones State
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [scheduleNameInput, setScheduleNameInput] = useState('');

  // Milestone edit/add state
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
  const [selectedGlobalComponentId, setSelectedGlobalComponentId] = useState('');

  const triggerAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  // 1. DEFINE FUNCTIONS BEFORE HOOKS TO AVOID REFERENCE ERRORS
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
    sortBy, setSortBy, loading: isOverviewLoading, filteredPtList, loadProductTypes,
    handleAddProductType, handleRenameProductType, handleDeleteProductType
  } = useProductType(triggerAlert);

  const {
    selectedPt, activeTab, setActiveTab, schedules, selectedSchedule, milestones,
    scheduleValidity, attachedComponents, leadTimeSettings, setLeadTimeSettings,
    isDetailLoading, handleSelectProductType, handleSelectSchedule, clearSelection,
    handleAddSchedule, handleDeleteSchedule, handleSaveMilestone, handleDeleteMilestone,
    handleDetachComponent, handleSaveLeadTimes, getScheduleValidity, handleLeadTimeChange,
    handleSaveLeadTimesForSchedule
  } = useProductTypeConfig(triggerAlert);    

  const {
    importReview, setImportReview, setImportDecisionForAll, setImportDecision,
    handleDownloadPtTemplate, handleDownloadSchedTemplate, handleExportProductTypes,
    handleExportSchedules, handleExportMilestonesOnly, handleExportFullBackup,
    handleImportProductTypes, handleImportSchedules, confirmProductTypeImport
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

  const handleCreateGlobalComponent = async (e) => {
    e.preventDefault();
    if (!componentForm.name.trim()) return;
    try {
      const componentName = componentForm.name.trim();
      const existingComponents = await db.getComponents();
      const existingComponent = existingComponents.find(c => c.name.toLowerCase() === componentName.toLowerCase());
      const componentId = existingComponent ? existingComponent.id : (await db.addComponent(componentName, componentForm.remarks.trim())).lastID;
      
      await db.attachComponentToProductType(componentId, selectedPt.id);
      setComponentForm({ name: '', remarks: '' });
      setShowAddComponentModal(false);
      triggerAlert('success', existingComponent ? 'Existing component attached!' : 'New component created and attached!');
      loadGlobalComponents();
      await handleSelectProductType(selectedPt, true);
    } catch (err) {
      triggerAlert('error', `Failed to create component: ${err.message}`);
    }
  };

  const handleAttachExistingComponent = async () => {
    if (!selectedGlobalComponentId) return;
    try {
      await db.attachComponentToProductType(parseInt(selectedGlobalComponentId), selectedPt.id);
      setSelectedGlobalComponentId('');
      triggerAlert('success', 'Component attached successfully!');
      await handleSelectProductType(selectedPt, true);
    } catch (err) {
      triggerAlert('error', `Failed to attach component: ${err.message}`);
    }
  };

  // --- VIEWS ---
  if (importReview) return (
    <ProductTypeImportReview
      importReview={importReview}
      loading={loading}
      onSetDecisionForAll={setImportDecisionForAll}
      onSetDecision={setImportDecision}
      onCancel={() => setImportReview(null)}
      onConfirm={confirmProductTypeImport}
    />
  );

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

        <BatchScheduleSection 
          open={showScheduleCsvOptions}
          onToggle={() => setShowScheduleCsvOptions(prev => !prev)}
          onDownloadTemplate={handleDownloadSchedTemplate}
          onExportSchedules={handleExportSchedules}
          onExportMilestones={handleExportMilestonesOnly}
          onImport={handleImportSchedules}
        />

        <Alert alert={alert} />

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
          />
        )}

        {activeTab === 'components' && (
          <BomTab
            productTypes={productTypes} attachedComponents={attachedComponents} sourceComponents={sourceComponents}
            handleAttachExistingComponent={handleAttachExistingComponent} handleCreateGlobalComponent={handleCreateGlobalComponent}
            handleDetachComponent={handleDetachComponent} componentProductTypeId={componentProductTypeId}
            setComponentProductTypeId={setComponentProductTypeId} selectedGlobalComponentId={selectedGlobalComponentId}
            setSelectedGlobalComponentId={setSelectedGlobalComponentId} componentForm={componentForm}
            setComponentForm={setComponentForm} allGlobalComponents={allGlobalComponents}
          />
        )}

        {activeTab === 'leadtimes' && (
          <LeadTimesTab 
            schedules={schedules} milestones={milestones} attachedComponents={attachedComponents}
            leadTimeSettings={leadTimeSettings} handleLeadTimeChange={handleLeadTimeChange}
            handleSaveLeadTimes={handleSaveLeadTimes} scheduleValidity={scheduleValidity}
            getScheduleValidity={getScheduleValidity} handleSaveLeadTimesForSchedule={handleSaveLeadTimesForSchedule}
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
        onDownloadPtTemplate={handleDownloadPtTemplate}
        onImport={handleImportProductTypes}
        onExportFull={handleExportFullBackup}
        onExportPartial={handleExportProductTypes}
      />

      <Alert alert={alert} />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search Product Type names..." className="pl-10 pr-4 py-2.5 block w-full rounded-lg border border-gray-300 text-sm focus:border-indigo-500 focus:outline-none" />
        </div>
        <div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="py-2.5 px-3 block w-full rounded-lg border border-gray-300 text-sm focus:border-indigo-500 focus:outline-none bg-white">
            <option value="all">All Validity Statuses</option>
            <option value="valid">Valid (Complete)</option>
            <option value="sub-valid">Sub-Valid (Partial)</option>
            <option value="invalid">Invalid (Action Required)</option>
          </select>
        </div>
        <div>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="py-2.5 px-3 block w-full rounded-lg border border-gray-300 text-sm focus:border-indigo-500 focus:outline-none bg-white">
            <option value="name">Sort by Name</option>
            <option value="status">Sort by Status</option>
            <option value="schedules">Sort by Schedule Count</option>
            <option value="components">Sort by Components Count</option>
          </select>
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
            <div key={pt.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all flex flex-col justify-between overflow-hidden">
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  {ptRenameId === pt.id ? (
                    <form onSubmit={handleRenameProductType} className="flex items-center space-x-1.5 w-full mr-2">
                      <input type="text" value={ptRenameInput} onChange={(e) => setPtRenameInput(e.target.value)} className="py-1 px-2 border rounded text-xs block w-full focus:outline-none focus:border-indigo-500" required autoFocus />
                      <button type="submit" className="p-1 text-emerald-600 hover:bg-emerald-50 rounded" title="Save Rename"><Check className="w-3.5 h-3.5" /></button>
                    </form>
                  ) : (
                    <h3 className="font-bold text-gray-950 text-lg tracking-tight truncate max-w-[160px]">{pt.name}</h3>
                  )}
                  <span className="inline-flex items-center gap-1">
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
                  <button onClick={() => handleDeleteProductType(pt.id, pt.name)} className="hover:text-red-600 transition">Delete</button>
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
    </div>
  );
}