import React, { useState } from 'react';
import Alert from '../../components/ui/Alert.jsx';
import { calculateMilestoneDeadlines } from '../../utils/scheduler';

// Hooks & Sub-components
import { useDashboard } from './hooks/useDashboard';
import ProjectsTab from './components/ProjectsTab';
import ProductTypeTab from './components/ProductTypeTab';
import ComponentsTab from './components/ComponentsTab';

// Cross-Feature Import: Reusing the Tracker's Edit Modal perfectly!
import EditProjectModal from '../project-tracker/components/EditProjectModal';

export default function Dashboard({ dateFormat }) {
  const [activeTab, setActiveTab] = useState('product');
  const [alert, setAlert] = useState(null);

  const triggerAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const {
    projects, productTypes, components, componentUsage, allMilestones, allComponentSchedules,
    loading, selectedTag, setSelectedTag,
    editingProject, setEditingProject, editForm, setEditForm,
    milestoneSort, setMilestoneSort, componentSort, setComponentSort, urgencySettings,
    sortRows, toggleTableSort, handleActualDateUpdate, handleActualReceivedUpdate, getMilestoneStatus,
    handleOpenEditModal, handleSaveEdit, getProjectDetailedSummary,
    savedChartsSummary, handleSaveGantt, handleLoadGantt,

    handleDeleteGantt,
    filteredProjects, 
    searchTerm, 
    setSearchTerm, 
    ptFilter, 
    setPtFilter, 
    milestoneStatusFilter, 
    setMilestoneStatusFilter,
    componentStatusFilter, 
    setComponentStatusFilter, 
    milestoneStatuses, 
    componentStatuses  
  } = useDashboard(triggerAlert);
  
  const dashboardCopy = {
    product: ['Project Dashboard', 'Build your personalised Gantt chart for a selected project.'],
    productType: ['Product Type Dashboard', 'Review the consolidated status of the projects under a selected product type.'],
    components: ['Components Dashboard', 'Review the demand of a selected component.']
  };

  if (loading) {
    return <div className="p-16 text-center font-semibold text-sm text-gray-500 bg-white rounded-lg border border-gray-200 shadow-sm mt-6">Loading dashboard...</div>;
  }

  // Pre-calculate timelines for the active project
  const selectedProject = projects.find(project => project.tag_no === selectedTag);
  const selectedMilestones = selectedProject ? allMilestones[selectedProject.schedule_id] || [] : [];
  
  // Use theoretical project to stop targets from drifting dynamically in the Gantt chart
  const theoreticalProject = selectedProject ? { ...selectedProject, actual_dates: '{}' } : null;
  const deadlines = theoreticalProject ? calculateMilestoneDeadlines(theoreticalProject, selectedMilestones) : {};
  
  const datedMilestones = selectedMilestones
    .map(milestone => ({ ...milestone, target: deadlines[milestone.id] }))
    .filter(milestone => milestone.target)
    .sort((first, second) => first.target.localeCompare(second.target));

  return (
    <div className="space-y-6">
      {/* Header and Nav */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{dashboardCopy[activeTab][0]}</h2>
          <div className="mt-3">
            <p className="text-sm text-gray-800 mt-2">{dashboardCopy[activeTab][1]}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {['product', 'productType', 'components'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)} 
              className={`px-3 py-2 rounded-lg text-xs font-bold transition ${activeTab === tab ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {tab === 'product' ? 'Projects' : tab === 'productType' ? 'Product Type' : 'Components'}
            </button>
          ))}
        </div>
      </div>

      <Alert alert={alert} />

      {/* Render Active View */}
      {activeTab === 'product' && (
        <ProjectsTab
          projects={projects}
          productTypes={productTypes}
          selectedTag={selectedTag}
          setSelectedTag={setSelectedTag}
          selectedProject={selectedProject}
          detailedSummary={selectedProject ? getProjectDetailedSummary(selectedProject) : []}
          datedMilestones={datedMilestones}
          dateFormat={dateFormat}
          handleOpenEditModal={handleOpenEditModal}
          
          allComponents={components}
          allMilestones={allMilestones}
          allComponentSchedules={allComponentSchedules}
          milestoneSort={milestoneSort}
          setMilestoneSort={setMilestoneSort}
          componentSort={componentSort}
          setComponentSort={setComponentSort}
          urgencySettings={urgencySettings}
          sortRows={sortRows}
          toggleTableSort={toggleTableSort}
          handleActualDateUpdate={handleActualDateUpdate}
          handleActualReceivedUpdate={handleActualReceivedUpdate}
          getMilestoneStatus={getMilestoneStatus}

          savedChartsSummary={savedChartsSummary}
          handleSaveGantt={handleSaveGantt}
          handleLoadGantt={handleLoadGantt}    
          
          handleDeleteGantt={handleDeleteGantt}
          filteredProjects={filteredProjects}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          ptFilter={ptFilter}
          setPtFilter={setPtFilter}
          milestoneStatusFilter={milestoneStatusFilter}
          setMilestoneStatusFilter={setMilestoneStatusFilter}
          componentStatusFilter={componentStatusFilter}
          setComponentStatusFilter={setComponentStatusFilter}
          milestoneStatuses={milestoneStatuses}
          componentStatuses={componentStatuses}        
        />
      )}

      {activeTab === 'productType' && (
        <ProductTypeTab 
          productTypes={productTypes} 
          projects={projects} 
        />
      )}

      {activeTab === 'components' && (
        <ComponentsTab 
          components={components} 
          componentUsage={componentUsage} 
          projects={projects} 
        />
      )}

      {/* Cross-Feature Component Reuse */}
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