import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Calendar, Clock, AlertTriangle, CheckCircle2, 
  TrendingUp, Layers, RefreshCw, Filter, Download, ArrowRight
} from 'lucide-react';
import * as db from '../utils/db';
import { calculateMilestoneDeadlines, calculateComponentDeadlines } from '../utils/scheduler';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [allMilestones, setMilestones] = useState({});
  const [allComponentSchedules, setComponentSchedules] = useState({});
  const [allComponents, setComponents] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [selectedPtId, setSelectedPtId] = useState('all');
  const [alert, setAlert] = useState(null);

  const triggerAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const projs = await db.getProjects();
      setProjects(projs);

      const pts = await db.getProductTypes();
      setProductTypes(pts);

      const comps = await db.getComponents();
      setComponents(comps);

      const milesMap = {};
      const compSchedMap = {};

      for (const pt of pts) {
        const scheds = await db.getSchedules(pt.id);
        for (const s of scheds) {
          const miles = await db.getMilestones(s.id);
          milesMap[s.id] = miles;
          const compScheds = await db.getComponentSchedules(s.id);
          compSchedMap[s.id] = compScheds;
        }
      }

      setMilestones(milesMap);
      setComponentSchedules(compSchedMap);
    } catch (err) {
      triggerAlert('error', `Failed to load dashboard metrics: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter projects
  const filteredProjects = selectedPtId === 'all' 
    ? projects 
    : projects.filter(p => p.product_type_id === parseInt(selectedPtId));

  // Compute KPI metrics
  const today = new Date().toISOString().split('T')[0];
  let totalActive = filteredProjects.length;
  let overdueMilestonesCount = 0;
  let extremelyUrgentCompsCount = 0;
  let upcomingRosCount = 0;

  filteredProjects.forEach(p => {
    const milestones = allMilestones[p.schedule_id] || [];
    const deadlines = calculateMilestoneDeadlines(p, milestones);
    const actuals = typeof p.actual_dates === 'string'
      ? JSON.parse(p.actual_dates || '{}')
      : (p.actual_dates || {});

    milestones.forEach(m => {
      const isCompleted = actuals[m.id] !== undefined || m.name.toLowerCase() === 'contract signed';
      if (!isCompleted) {
        const target = deadlines[m.id];
        if (target && target < today) {
          overdueMilestonesCount++;
        }
      }
    });

    // Check ROS in next 30 days
    if (p.ros_date >= today) {
      const diffTime = new Date(p.ros_date) - new Date(today);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 30) {
        upcomingRosCount++;
      }
    }

    const compScheds = allComponentSchedules[p.schedule_id] || [];
    const computedComps = calculateComponentDeadlines(deadlines, compScheds, allComponents);
    computedComps.forEach(cc => {
      if (cc.urgency === 'Extremely Urgent' || cc.urgency === 'Overdue') {
        extremelyUrgentCompsCount++;
      }
    });
  });
  return (
    <div className="space-y-6">
      {/* Dashboard Top Filter Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Executive Operations Dashboard</h2>
          <p className="text-xs text-gray-500 mt-1">
            Real-time analytics, milestone health metrics, and interactive Gantt timeline visualization.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-gray-500">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span>Product Type Filter:</span>
          </div>
          <select
            value={selectedPtId}
            onChange={(e) => setSelectedPtId(e.target.value)}
            className="py-2 px-3 rounded-lg border border-gray-300 text-xs font-semibold focus:border-indigo-500 focus:outline-none bg-white"
          >
            <option value="all">All Product Types ({projects.length} Projects)</option>
            {productTypes.map(pt => (
              <option key={pt.id} value={pt.id}>{pt.name}</option>
            ))}
          </select>
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

      {/* KPI Summary Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex items-center space-x-4">
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Active Projects</span>
            <span className="text-2xl font-black text-gray-900">{totalActive}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex items-center space-x-4">
          <div className="p-3.5 bg-red-50 text-red-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Overdue Milestones</span>
            <span className={`text-2xl font-black ${overdueMilestonesCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {overdueMilestonesCount}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex items-center space-x-4">
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Urgent Component Orders</span>
            <span className={`text-2xl font-black ${extremelyUrgentCompsCount > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
              {extremelyUrgentCompsCount}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex items-center space-x-4">
          <div className="p-3.5 bg-teal-50 text-teal-600 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">ROS Due (Next 30 Days)</span>
            <span className="text-2xl font-black text-gray-900">{upcomingRosCount}</span>
          </div>
        </div>
      </div>

      {/* Custom Gantt Chart Timeline View */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-900 text-lg">Interactive Gantt Chart & Timeline View</h3>
          </div>
          <span className="text-xs text-gray-400 font-medium">Visualizing project lifecycles from Contract Signed to ROS delivery</span>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="p-16 text-center text-gray-400">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="font-medium text-sm">No projects available for Gantt visualization.</p>
          </div>
        ) : (
          <div className="space-y-6 overflow-x-auto pb-4">
            {filteredProjects.map(p => {
              const milestones = allMilestones[p.schedule_id] || [];
              const deadlines = calculateMilestoneDeadlines(p, milestones);
              
              // Calculate span duration
              const startDt = new Date(p.contract_signed_date);
              const endDt = new Date(p.ros_date);
              const totalSpanDays = Math.max(1, Math.ceil((endDt - startDt) / (1000 * 60 * 60 * 24)));

              return (
                <div key={p.tag_no} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3 min-w-[700px]">
                  {/* Project Bar Header */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3">
                      <span className="font-black text-gray-900 text-sm">{p.tag_no}</span>
                      <span className="text-gray-500 font-medium">({p.customer})</span>
                      <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-bold text-[10px]">
                        {p.product_type_name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-gray-500 font-semibold">
                      <span>Start: {p.contract_signed_date}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                      <span>ROS: {p.ros_date}</span>
                    </div>
                  </div>

                  {/* Visual Timeline Track */}
                  <div className="relative pt-6 pb-2">
                    {/* Background Track Bar */}
                    <div className="w-full h-3 bg-gray-200 rounded-full relative overflow-hidden">
                      <div className="absolute top-0 bottom-0 left-0 bg-indigo-600 rounded-full opacity-80 w-full"></div>
                    </div>

                    {/* Milestone Markers */}
                    {milestones.map(m => {
                      const targetDate = deadlines[m.id];
                      if (!targetDate) return null;

                      // Compute percentage position along timeline track
                      const mDt = new Date(targetDate);
                      const daysFromStart = Math.ceil((mDt - startDt) / (1000 * 60 * 60 * 24));
                      let pct = (daysFromStart / totalSpanDays) * 100;
                      if (pct < 0) pct = 0;
                      if (pct > 100) pct = 100;

                      const isDefault = m.name.toLowerCase() === 'contract signed' || m.name.toLowerCase() === 'ros';

                      return (
                        <div
                          key={m.id}
                          style={{ left: `${pct}%` }}
                          className="absolute top-1 transform -translate-x-1/2 flex flex-col items-center group cursor-pointer"
                        >
                          <div className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow ${
                            isDefault ? 'bg-indigo-900' : 'bg-teal-500'
                          }`}></div>
                          <span className="text-[10px] font-bold text-gray-700 mt-1 whitespace-nowrap bg-white px-1.5 py-0.5 rounded shadow-sm border border-gray-100">
                            {m.name} ({targetDate})
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

