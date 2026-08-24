import React, { useState, useEffect } from 'react';
import { 
  Search, Trash2, Edit2, ChevronDown, ChevronUp, Download, Calendar, 
  CheckCircle2, AlertCircle, RefreshCw, Layers, Check, X, Info, 
  ArrowRight, Shield, Clock, Plus
} from 'lucide-react';
import * as db from '../utils/db';
import { calculateMilestoneDeadlines, calculateComponentDeadlines } from '../utils/scheduler';
import { stringifyCSV } from '../utils/csv';

export default function ProjectTracker({ onRedirectToRegistry }) {
  // Global reference states
  const [projects, setProjects] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [allSchedules, setSchedules] = useState({}); // scheduleId -> schedule object
  const [allMilestones, setMilestones] = useState({}); // scheduleId -> milestones array
  const [allComponentSchedules, setComponentSchedules] = useState({}); // scheduleId -> componentSchedules array
  const [allComponents, setComponents] = useState([]); // all components array

  // UI state
  const [loading, setLoading] = useState(true);
  const [expandedProject, setExpandedProject] = useState(null); // tagNo of expanded card
  const [alert, setAlert] = useState(null);
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [ptFilter, setPtFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, overdue
  const [sortBy, setSortBy] = useState('tag_no');

  // Edit Modal State
  const [editingProject, setEditingProject] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Alert trigger
  const triggerAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  useEffect(() => {
    loadAllTrackerData();
  }, []);

  const loadAllTrackerData = async () => {
    setLoading(true);
    try {
      const projs = await db.getProjects();
      setProjects(projs);

      const pts = await db.getProductTypes();
      setProductTypes(pts);

      const comps = await db.getComponents();
      setComponents(comps);

      const schedMap = {};
      const milesMap = {};
      const compSchedMap = {};

      for (const pt of pts) {
        const scheds = await db.getSchedules(pt.id);
        for (const s of scheds) {
          schedMap[s.id] = s;
          const miles = await db.getMilestones(s.id);
          milesMap[s.id] = miles;
          const compScheds = await db.getComponentSchedules(s.id);
          compSchedMap[s.id] = compScheds;
        }
      }

      setSchedules(schedMap);
      setMilestones(milesMap);
      setComponentSchedules(compSchedMap);
    } catch (err) {
      triggerAlert('error', `Failed to load Tracker dashboards: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // PROJECT CSV EXPORTER
  // ==========================================
  const handleExportProjects = async () => {
    try {
      const headers = [
        'Tag No', 'Description', 'Product Type', 'Schedule Name', 'Customer', 
        'Contract No', 'Sales Ref', 'PM Owner', 'Engineer Owner', 'Procurement Owner', 
        'Production Owner', 'FAT Owner', 'Contract Signed Date', 'ROS Date', 'Notes', 'Actual Completion Dates'
      ];
      
      const rows = projects.map(p => [
        p.tag_no, p.description || '', p.product_type_name, p.schedule_name, p.customer,
        p.contract_no, p.sales_ref, p.pm_owner, p.engineer_owner, p.procurement_owner,
        p.production_owner, p.fat_owner, p.contract_signed_date, p.ros_date, p.notes || '', p.actual_dates || '{}'
      ]);

      const csvContent = stringifyCSV(headers, rows);

      const saveRes = await window.electronAPI.showSaveDialog({
        title: 'Export Registered Projects',
        defaultPath: 'project_registry_export.csv',
        filters: [{ name: 'CSV Files', extensions: ['csv'] }]
      });

      if (!saveRes.canceled && saveRes.filePath) {
        await window.electronAPI.writeFileContent(saveRes.filePath, csvContent);
        triggerAlert('success', 'Project records exported successfully!');
      }
    } catch (err) {
      triggerAlert('error', `Export failed: ${err.message}`);
    }
  };
  // ==========================================
  // ACTUAL DATE UPDATER & PROPAGATION TRIGGER
  // ==========================================
  const handleActualDateUpdate = async (tagNo, milestoneId, dateStr) => {
    try {
      const proj = projects.find(p => p.tag_no === tagNo);
      if (!proj) return;

      const actuals = typeof proj.actual_dates === 'string'
        ? JSON.parse(proj.actual_dates || '{}')
        : (proj.actual_dates || {});

      if (dateStr) {
        actuals[milestoneId] = dateStr;
      } else {
        delete actuals[milestoneId];
      }

      await db.updateProjectActualDates(tagNo, JSON.stringify(actuals));
      triggerAlert('success', `Actual date updated. Downstream milestone deadlines re-propagated.`);
      
      // Reload projects list to reflect updated target deadlines
      const updatedProjs = await db.getProjects();
      setProjects(updatedProjs);
    } catch (err) {
      triggerAlert('error', `Failed to update actual date: ${err.message}`);
    }
  };

  // ==========================================
  // PROJECT CRUD HANDLERS
  // ==========================================
  const handleDeleteProject = async (tagNo) => {
    if (!confirm(`Are you sure you want to delete project with Tag No "${tagNo}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await db.deleteProject(tagNo);
      triggerAlert('success', 'Project record deleted successfully.');
      loadAllTrackerData();
      if (expandedProject === tagNo) {
        setExpandedProject(null);
      }
    } catch (err) {
      triggerAlert('error', `Deletion failed: ${err.message}`);
    }
  };

  const handleOpenEditModal = (p) => {
    setEditingProject(p);
    setEditForm({
      tag_no: p.tag_no,
      description: p.description,
      product_type_id: p.product_type_id,
      schedule_id: p.schedule_id,
      customer: p.customer,
      contract_no: p.contract_no,
      sales_ref: p.sales_ref,
      pm_owner: p.pm_owner,
      engineer_owner: p.engineer_owner,
      procurement_owner: p.procurement_owner,
      production_owner: p.production_owner,
      fat_owner: p.fat_owner,
      contract_signed_date: p.contract_signed_date,
      ros_date: p.ros_date,
      notes: p.notes
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      await db.updateProject(editForm);
      setEditingProject(null);
      triggerAlert('success', 'Project modifications saved successfully.');
      loadAllTrackerData();
    } catch (err) {
      triggerAlert('error', `Failed to save changes: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // FILTERS & CALCULATIONS FOR RENDER
  // ==========================================
  const getProjectStatusSummary = (p) => {
    const milestones = allMilestones[p.schedule_id] || [];
    const milestoneDeadlines = calculateMilestoneDeadlines(p, milestones);

    // Filter milestones to check for overdues
    const today = new Date().toISOString().split('T')[0];
    const actuals = typeof p.actual_dates === 'string'
      ? JSON.parse(p.actual_dates || '{}')
      : (p.actual_dates || {});

    let overdueCount = 0;
    let totalCount = 0;
    let completedCount = 0;

    milestones.forEach(m => {
      totalCount++;
      const isCompleted = actuals[m.id] !== undefined || m.name.toLowerCase() === 'contract signed';
      if (isCompleted) {
        completedCount++;
      } else {
        const target = milestoneDeadlines[m.id];
        if (target && target < today) {
          overdueCount++;
        }
      }
    });

    if (completedCount === totalCount) return { status: 'Completed', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    if (overdueCount > 0) return { status: `${overdueCount} Overdue`, color: 'bg-red-100 text-red-800 border-red-200' };
    return { status: 'On Track', color: 'bg-teal-100 text-teal-800 border-teal-200' };
  };

  const filteredProjects = projects
    .filter(p => {
      const query = searchTerm.toLowerCase();
      const matchSearch = p.tag_no.toLowerCase().includes(query) || 
        (p.description || '').toLowerCase().includes(query) ||
        p.customer.toLowerCase().includes(query) ||
        p.pm_owner.toLowerCase().includes(query) ||
        p.engineer_owner.toLowerCase().includes(query);

      const matchPt = ptFilter === 'all' || p.product_type_id === parseInt(ptFilter);
      
      const summary = getProjectStatusSummary(p);
      const matchStatus = statusFilter === 'all' || 
        (statusFilter === 'completed' && summary.status === 'Completed') ||
        (statusFilter === 'overdue' && summary.status.includes('Overdue')) ||
        (statusFilter === 'ontrack' && summary.status === 'On Track');

      return matchSearch && matchPt && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'tag_no') {
        return a.tag_no.localeCompare(b.tag_no);
      } else if (sortBy === 'ros_date') {
        return a.ros_date.localeCompare(b.ros_date);
      } else if (sortBy === 'contract_signed_date') {
        return a.contract_signed_date.localeCompare(b.contract_signed_date);
      } else if (sortBy === 'customer') {
        return a.customer.localeCompare(b.customer);
      }
      return 0;
    });

  // ==========================================
  // VIEW RENDERERS
  // ==========================================

  return (
    <div className="space-y-6">
      {/* Tracker Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Project Tracker & Milestones Monitor</h2>
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

      {/* Floating Alert */}
      {alert && (
        <div className={`p-4 rounded-lg border flex items-center space-x-3 ${
          alert.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {alert.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-semibold">{alert.message}</span>
        </div>
      )}

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
            const summary = getProjectStatusSummary(p);
            const isExpanded = expandedProject === p.tag_no;

            return (
              <div 
                key={p.tag_no} 
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:border-gray-300"
              >
                {/* Project Summary Card Bar */}
                <div 
                  onClick={() => setExpandedProject(isExpanded ? null : p.tag_no)}
                  className="p-6 flex items-center justify-between cursor-pointer select-none bg-white hover:bg-gray-50/50 transition"
                >
                  <div className="flex items-center space-x-6">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Tag No.</span>
                      <h3 className="text-lg font-bold text-gray-900">{p.tag_no}</h3>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Customer</span>
                      <span className="text-sm font-semibold text-gray-800">{p.customer}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Product / Schedule</span>
                      <span className="text-xs font-medium text-gray-600">{p.product_type_name} ({p.schedule_name})</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">ROS Deadline</span>
                      <span className="text-xs font-bold text-indigo-600">{p.ros_date}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${summary.color}`}>
                      {summary.status.toUpperCase()}
                    </span>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditModal(p);
                        }}
                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition"
                        title="Edit Project"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
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
                </div>

                {/* Expanded Project Details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 p-6 space-y-8">
                    {/* Milestones Schedule Table */}
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-indigo-600" />
                        <span>Milestones Target Deadlines & Actual Progress</span>
                      </h4>

                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200 text-xs">
                          <thead className="bg-gray-50 font-bold text-gray-500">
                            <tr>
                              <th className="px-4 py-3 text-left">Milestone</th>
                              <th className="px-4 py-3 text-left">Anchor Basis</th>
                              <th className="px-4 py-3 text-left">Targeted Deadline</th>
                              <th className="px-4 py-3 text-left">Actual Completion Date</th>
                              <th className="px-4 py-3 text-left">Status / Countdown</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 text-gray-700">
                            {(() => {
                              const milestones = allMilestones[p.schedule_id] || [];
                              const deadlines = calculateMilestoneDeadlines(p, milestones);
                              const actuals = typeof p.actual_dates === 'string'
                                ? JSON.parse(p.actual_dates || '{}')
                                : (p.actual_dates || {});
                              const today = new Date().toISOString().split('T')[0];

                              return milestones.map(m => {
                                const target = deadlines[m.id] || '-';
                                const actual = actuals[m.id] || '';
                                const isContractSigned = m.name.toLowerCase() === 'contract signed';
                                
                                // Countdown evaluation
                                let statusText = 'On Track';
                                let statusColor = 'text-teal-600 bg-teal-50 border-teal-200';

                                if (isContractSigned || actual) {
                                  statusText = 'Completed';
                                  statusColor = 'text-emerald-600 bg-emerald-50 border-emerald-200';
                                } else if (target && target < today) {
                                  statusText = 'Overdue';
                                  statusColor = 'text-red-600 bg-red-50 border-red-200';
                                } else if (target) {
                                  const diffDays = Math.ceil((new Date(target) - new Date(today)) / (1000 * 60 * 60 * 24));
                                  if (diffDays <= 7) {
                                    statusText = `Due in ${diffDays}d (Urgent)`;
                                    statusColor = 'text-amber-600 bg-amber-50 border-amber-200';
                                  } else {
                                    statusText = `Due in ${diffDays} days`;
                                    statusColor = 'text-gray-600 bg-gray-50 border-gray-200';
                                  }
                                }

                                const anchor = milestones.find(a => a.id === m.anchor_id);

                                return (
                                  <tr key={m.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-semibold text-gray-900">{m.name}</td>
                                    <td className="px-4 py-3 text-gray-500">{isContractSigned || !anchor ? 'Root Boundary' : anchor.name}</td>
                                    <td className="px-4 py-3 font-bold text-indigo-700">{target}</td>
                                    <td className="px-4 py-3">
                                      {isContractSigned ? (
                                        <span className="font-semibold text-gray-600">{p.contract_signed_date} (Locked)</span>
                                      ) : (
                                        <input
                                          type="date"
                                          value={actual}
                                          onChange={(e) => handleActualDateUpdate(p.tag_no, m.id, e.target.value)}
                                          className="px-2 py-1 border border-gray-300 rounded text-xs focus:border-indigo-500 focus:outline-none bg-white"
                                        />
                                      )}
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusColor}`}>
                                        {statusText}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              });
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Component Order Deadlines Table */}
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-indigo-600" />
                        <span>Component Order Deadlines & Lead Times</span>
                      </h4>

                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200 text-xs">
                          <thead className="bg-gray-50 font-bold text-gray-500">
                            <tr>
                              <th className="px-4 py-3 text-left">Component Name</th>
                              <th className="px-4 py-3 text-left">Anchor Milestone</th>
                              <th className="px-4 py-3 text-left">Lead Time (Days)</th>
                              <th className="px-4 py-3 text-left">Latest Order Date</th>
                              <th className="px-4 py-3 text-left">Urgency Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 text-gray-700">
                            {(() => {
                              const milestones = allMilestones[p.schedule_id] || [];
                              const deadlines = calculateMilestoneDeadlines(p, milestones);
                              const compScheds = allComponentSchedules[p.schedule_id] || [];
                              const computedComps = calculateComponentDeadlines(deadlines, compScheds, allComponents);

                              if (computedComps.length === 0) {
                                return (
                                  <tr>
                                    <td colSpan="5" className="px-4 py-6 text-center text-gray-400">
                                      No component schedule configurations found for this schedule.
                                    </td>
                                  </tr>
                                );
                              }

                              const urgencyColors = {
                                'Overdue': 'text-red-700 bg-red-100 border-red-200',
                                'Extremely Urgent': 'text-orange-700 bg-orange-100 border-orange-200',
                                'Urgent': 'text-amber-700 bg-amber-100 border-amber-200',
                                'On Track': 'text-emerald-700 bg-emerald-100 border-emerald-200',
                                'Pending': 'text-gray-600 bg-gray-100 border-gray-200'
                              };

                              return computedComps.map(cc => {
                                const anchorM = milestones.find(m => m.id === cc.anchor_milestone_id);
                                return (
                                  <tr key={cc.component_id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-semibold text-gray-900">{cc.name}</td>
                                    <td className="px-4 py-3 text-gray-500">{anchorM ? anchorM.name : 'ROS'}</td>
                                    <td className="px-4 py-3 font-medium">{cc.lead_time} days</td>
                                    <td className="px-4 py-3 font-bold text-indigo-700">{cc.latest_order_date || 'N/A'}</td>
                                    <td className="px-4 py-3">
                                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${urgencyColors[cc.urgency] || 'bg-gray-100 text-gray-800'}`}>
                                        {cc.urgency.toUpperCase()} {cc.days_until_need !== null ? `(${cc.days_until_need}d left)` : ''}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              });
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* EDIT PROJECT MODAL */}
      {editingProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg text-gray-900 mb-4">Edit Project "{editingProject.tag_no}"</h3>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase">Description</label>
                <input
                  type="text"
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase">Customer *</label>
                  <input
                    type="text"
                    required
                    value={editForm.customer || ''}
                    onChange={(e) => setEditForm({ ...editForm, customer: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase">Contract No. *</label>
                  <input
                    type="text"
                    required
                    value={editForm.contract_no || ''}
                    onChange={(e) => setEditForm({ ...editForm, contract_no: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase">Contract Signed Date *</label>
                  <input
                    type="date"
                    required
                    value={editForm.contract_signed_date || ''}
                    onChange={(e) => setEditForm({ ...editForm, contract_signed_date: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase">ROS Date *</label>
                  <input
                    type="date"
                    required
                    value={editForm.ros_date || ''}
                    onChange={(e) => setEditForm({ ...editForm, ros_date: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase">Project Manager (PM) *</label>
                  <input
                    type="text"
                    required
                    value={editForm.pm_owner || ''}
                    onChange={(e) => setEditForm({ ...editForm, pm_owner: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase">Engineer Owner *</label>
                  <input
                    type="text"
                    required
                    value={editForm.engineer_owner || ''}
                    onChange={(e) => setEditForm({ ...editForm, engineer_owner: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase">Notes</label>
                <textarea
                  rows="2"
                  value={editForm.notes || ''}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

