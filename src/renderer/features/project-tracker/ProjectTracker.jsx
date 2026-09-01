import React from 'react';
import { 
  Search, Trash2, Edit2, ChevronDown, ChevronUp, Download, 
  RefreshCw, Layers, Plus
} from 'lucide-react';
import { formatDate } from '../../utils/date';
import Alert from '../../components/ui/Alert.jsx';

// Feature-Specific Imports
import { useProjectTracker } from './hooks/useProjectTracker';
import MilestoneTable from './components/MilestoneTable';
import ComponentTable from './components/ComponentTable';
import EditProjectModal from './components/EditProjectModal';
import StatusBadge from '../../components/ui/StatusBadge.jsx';

export default function ProjectTracker({ onRedirectToRegistry, dateFormat }) {
  const {
    projects, productTypes, allMilestones, allComponentSchedules, allComponents,
    loading, expandedProject, setExpandedProject, alert,
    searchTerm, setSearchTerm, ptFilter, setPtFilter, statusFilter, setStatusFilter, 
    sortBy, setSortBy, milestoneSort, setMilestoneSort, componentSort, setComponentSort,
    editingActual, setEditingActual, editingProject, setEditingProject, editForm, setEditForm,
    urgencySettings, handleExportProjects, handleActualDateUpdate, handleActualReceivedUpdate,
    getMilestoneStatus, sortRows, toggleTableSort, handleDeleteProject, 
    handleOpenEditModal, handleSaveEdit, getProjectDetailedSummary, filteredProjects
  } = useProjectTracker();

  return (
    <div className="space-y-6">
      {/* Tracker Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Monitor the Progress of Your Projects</h2>
          <p className="text-xs text-gray-500 mt-1">
            Monitor real-time project countdowns, record actual completion dates, and track component order deadlines.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportProjects}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-semibold bg-white transition"
          >
            <Download className="w-4 h-4 text-gray-500" />
            <span>Export Projects CSV</span>
          </button>
          <button
            onClick={() => {
              if (onRedirectToRegistry) onRedirectToRegistry();
            }}
            className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Project</span>
          </button>
        </div>
      </div>

      <Alert alert={alert} />

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Tag No, Customer, PM, Engineer..."
            className="pl-10 pr-4 py-2.5 block w-full rounded-lg border border-gray-300 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <select
            value={ptFilter}
            onChange={(e) => setPtFilter(e.target.value)}
            className="py-2.5 px-3 block w-full rounded-lg border border-gray-300 text-sm focus:border-indigo-500 focus:outline-none bg-white"
          >
            <option value="all">All Product Types</option>
            {productTypes.map(pt => (
              <option key={pt.id} value={pt.id}>{pt.name}</option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2.5 px-3 block w-full rounded-lg border border-gray-300 text-sm focus:border-indigo-500 focus:outline-none bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="ontrack">On Track</option>
            <option value="overdue">Has Overdue</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="py-2.5 px-3 block w-full rounded-lg border border-gray-300 text-sm focus:border-indigo-500 focus:outline-none bg-white"
          >
            <option value="tag_no">Sort by Tag No</option>
            <option value="ros_date">Sort by ROS Date</option>
            <option value="contract_signed_date">Sort by Contract Signed</option>
            <option value="customer">Sort by Customer</option>
          </select>
        </div>
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="p-16 text-center text-gray-500 bg-white rounded-lg border border-gray-200 shadow-sm flex items-center justify-center space-x-3">
          <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
          <span className="font-semibold text-sm">Loading Project Tracker...</span>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-16 text-center text-gray-400 bg-white rounded-lg border border-gray-200 shadow-sm">
          <Layers className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="font-semibold text-sm">No registered projects found.</p>
          <p className="text-xs text-gray-400 mt-1">Register a project manually or upload via bulk CSV to begin tracking.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map(p => {
            const summary = getProjectDetailedSummary(p);
            const isExpanded = expandedProject === p.tag_no;

            return (
              <div key={p.tag_no} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:border-gray-300">
                
                {/* Project Summary Card Bar */}
                <div 
                  onClick={() => setExpandedProject(isExpanded ? null : p.tag_no)}
                  className="p-6 flex flex-col gap-4 cursor-pointer select-none bg-white hover:bg-gray-50/50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Tag No.</span>
                        <h3 className="text-xl font-bold text-gray-900">{p.tag_no}</h3>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Customer</span>
                        <span className="text-sm font-semibold text-gray-800">{p.customer}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Product Type (Schedule)</span>
                        <span className="text-xs font-medium text-gray-600">{p.product_type_name} ({p.schedule_name})</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Contract Signed</span>
                        <span className="text-xs font-medium text-gray-600">{formatDate(p.contract_signed_date, dateFormat)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">ROS Deadline</span>
                        <span className="text-sm font-semibold text-indigo-600">{formatDate(p.ros_date, dateFormat)}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(p.tag_no);
                        }}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-lg transition"
                        title="Delete Project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="p-2 text-gray-400">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>

                  {/* New 2nd Line: Dynamic Status Breakdown */}
                  <div className="flex flex-col gap-2 pt-3 border-t border-gray-100">
                    
                    {/* Milestones Row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider w-24 shrink-0">
                        Milestones
                      </span>
                      {getProjectDetailedSummary(p).filter(item => item.milestones > 0).map(item => (
                        <StatusBadge key={`m-${item.status}`} status={item.status} count={item.milestones} />
                      ))}
                      {getProjectDetailedSummary(p).filter(item => item.milestones > 0).length === 0 && (
                        <span className="text-xs font-semibold text-gray-400">None</span>
                      )}
                    </div>

                    {/* Components Row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider w-24 shrink-0">
                        Components Procurement
                      </span>
                      {getProjectDetailedSummary(p).filter(item => item.components > 0).map(item => (
                        <StatusBadge key={`c-${item.status}`} status={item.status} count={item.components} />
                      ))}
                      {getProjectDetailedSummary(p).filter(item => item.components > 0).length === 0 && (
                        <span className="text-xs font-semibold text-gray-400">None</span>
                      )}
                    </div>

                  </div>
                
                </div>


                {/* Expanded Project Details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 p-6 space-y-8">
                    
                    {/* Project Information Box */}
                    <section className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <h4 className="font-bold text-gray-900 text-sm">Project information</h4>
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                          title="Edit project information"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 text-xs">
                        {[
                          ['Description', p.description], ['Contract No.', p.contract_no],
                          ['Sales Ref.', p.sales_ref], ['Project Manager', p.pm_owner],
                          ['Engineer', p.engineer_owner], ['Procurement', p.procurement_owner],
                          ['Production', p.production_owner], ['FAT Owner', p.fat_owner]
                        ].map(([label, value]) => (
                          <div key={label}>
                            <span className="block text-[10px] uppercase font-bold text-gray-400">{label}</span>
                            <span className="block mt-1 font-semibold text-gray-700 break-words">{value || '-'}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                      {<p className="mt-4 pt-3 border-t border-gray-100 text-[10px] uppercase font-bold text-gray-400">Notes </p>}
                      {<p className="mt-1 text-xs font-semibold text-gray-700 whitespace-pre-line break-words">{p.notes || '-'}</p>}
                      </div>
                    </section>

                    {/* MODULAR COMPONENT 1: Milestone Table */}
                    <MilestoneTable 
                      project={p}
                      milestones={allMilestones[p.schedule_id] || []}
                      milestoneSort={milestoneSort}
                      setMilestoneSort={setMilestoneSort}
                      toggleTableSort={toggleTableSort}
                      editingActual={editingActual}
                      setEditingActual={setEditingActual}
                      handleActualDateUpdate={handleActualDateUpdate}
                      getMilestoneStatus={getMilestoneStatus}
                      sortRows={sortRows}
                      dateFormat={dateFormat}
                    />

                    {/* MODULAR COMPONENT 2: Component Lead Times Table */}
                    <ComponentTable 
                      project={p}
                      milestones={allMilestones[p.schedule_id] || []}
                      compScheds={allComponentSchedules[p.schedule_id] || []}
                      allComponents={allComponents}
                      componentSort={componentSort}
                      setComponentSort={setComponentSort}
                      toggleTableSort={toggleTableSort}
                      handleActualReceivedUpdate={handleActualReceivedUpdate}
                      sortRows={sortRows}
                      dateFormat={dateFormat}
                      urgencySettings={urgencySettings}
                    />

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODULAR COMPONENT 3: Edit Project Modal */}
      <EditProjectModal 
        editingProject={editingProject}
        setEditingProject={setEditingProject}
        editForm={editForm}
        setEditForm={setEditForm}
        handleSaveEdit={handleSaveEdit}
      />

    </div>
  );
}