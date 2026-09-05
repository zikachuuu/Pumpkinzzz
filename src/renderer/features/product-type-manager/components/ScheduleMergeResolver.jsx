import React, { useState, useEffect } from 'react';
import { AlertTriangle, GitMerge, Check, Calendar, ArrowRight } from 'lucide-react';
import * as db from '../../../utils/db';

export default function ScheduleMergeResolver({ conflictPts, newPts, importPayload, onCancel, onConfirm }) {
  // State: { ptName: { scheduleName: 'keep' | 'overwrite' } }
  const [resolutions, setResolutions] = useState({});
  const [diffData, setDiffData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Parse CSV rows and compare against live DB to generate conflicts
  useEffect(() => {
    const buildDiffs = async () => {
      const data = [];
      const headers = importPayload.headers;
      const schedIdx = headers.indexOf('schedule name');
      const mNameIdx = headers.indexOf('milestone name');

      for (const pt of conflictPts) {
        // 1. Group imported milestones by Schedule
        const csvSchedules = {};
        pt.rows.forEach(row => {
          const sName = row[schedIdx]?.trim();
          if (!sName) return;
          if (!csvSchedules[sName]) csvSchedules[sName] = new Set();
          
          const mName = row[mNameIdx]?.trim();
          if (mName) csvSchedules[sName].add(mName);
        });

        // 2. Fetch live DB Schedules to find collisions
        const dbSchedules = await db.getSchedules(pt.existingPt.id);
        const conflicts = [];
        let newSchedulesCount = 0;
        
        for (const [sName, mSet] of Object.entries(csvSchedules)) {
          const dbMatch = dbSchedules.find(s => s.name.toLowerCase() === sName.toLowerCase());
          if (dbMatch) {
            const dbMilestones = await db.getMilestones(dbMatch.id);
            conflicts.push({
              scheduleName: dbMatch.name, // Use precise DB casing
              csvMilestones: Array.from(mSet),
              dbMilestones: dbMilestones.map(m => m.name),
            });
          } else {
            newSchedulesCount++;
          }
        }

        if (conflicts.length > 0 || newSchedulesCount > 0) {
          data.push({ ptName: pt.name, conflicts, newSchedulesCount });
        }
      }
      
      setDiffData(data);
      setLoading(false);
    };

    buildDiffs();
  }, [conflictPts, importPayload]);

  const setDecision = (ptName, schedName, decision) => {
    setResolutions(prev => ({
      ...prev,
      [ptName]: {
        ...(prev[ptName] || {}),
        [schedName]: decision
      }
    }));
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-500 font-semibold animate-pulse">Calculating Schedule Conflicts...</div>;
  }

  // Check if user has explicitly chosen to overwrite any schedule
  const hasAnyOverwrites = Object.values(resolutions).some(schedMap => 
    Object.values(schedMap).includes('overwrite')
  );

  return (
    <div className="space-y-6 max-h-[75vh] flex flex-col">
      
      {/* Header & Warning */}
      <div className="shrink-0 space-y-4">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Calendar className="w-5 h-5 text-purple-700" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Resolve Schedule Conflicts</h3>
            <p className="text-sm text-gray-500">Some schedules in your spreadsheet share the same name as existing ones in the database.</p>
          </div>
        </div>

        {hasAnyOverwrites && (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-start gap-3 text-amber-900 text-sm shadow-sm animate-in fade-in slide-in-from-top-2">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
            <p>
              <strong>Warning:</strong> You have chosen to overwrite an existing schedule. Its current milestones, offsets, and component lead times will be completely replaced by the data in your spreadsheet.
            </p>
          </div>
        )}
      </div>

      {/* Main Diff Scroll Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 pr-2">
        {diffData.map(pt => (
          <div key={pt.ptName} className="space-y-4">
            <div className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-200 font-bold text-gray-800 flex justify-between items-center shadow-sm">
              <span>{pt.ptName}</span>
              {pt.newSchedulesCount > 0 && (
                <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
                  +{pt.newSchedulesCount} New Schedule(s) will be added
                </span>
              )}
            </div>

            <div className="space-y-4 pl-4 border-l-2 border-gray-100 ml-2">
              {pt.conflicts.map(conflict => {
                const decision = resolutions[pt.ptName]?.[conflict.scheduleName] || 'keep';

                return (
                  <div key={conflict.scheduleName} className={`border rounded-lg overflow-hidden transition-colors ${decision === 'overwrite' ? 'border-amber-300 shadow-md' : 'border-gray-200 shadow-sm'}`}>
                    <div className="bg-white px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <span className="font-bold text-sm text-gray-800">Schedule: {conflict.scheduleName}</span>
                      
                      {/* Decision Toggle */}
                      <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                        <button
                          onClick={() => setDecision(pt.ptName, conflict.scheduleName, 'keep')}
                          className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${decision === 'keep' ? 'bg-white text-gray-800 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          Keep Current
                        </button>
                        <button
                          onClick={() => setDecision(pt.ptName, conflict.scheduleName, 'overwrite')}
                          className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${decision === 'overwrite' ? 'bg-amber-100 text-amber-800 shadow-sm border border-amber-300' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          Overwrite with New
                        </button>
                      </div>
                    </div>

                    {/* Milestone Comparison */}
                    <div className="grid grid-cols-2 divide-x divide-gray-100">
                      <div className={`p-4 space-y-2 ${decision === 'keep' ? 'bg-emerald-50/30' : 'bg-gray-50 opacity-60 grayscale'}`}>
                        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Current Database Milestones</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {conflict.dbMilestones.map((m, i) => (
                            <span key={i} className="bg-white border border-gray-200 text-gray-700 px-2 py-1 rounded text-xs font-medium">{m}</span>
                          ))}
                        </div>
                      </div>
                      
                      <div className={`p-4 space-y-2 ${decision === 'overwrite' ? 'bg-amber-50/30' : 'bg-blue-50/30 opacity-60 grayscale'}`}>
                        <h4 className="text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-2">Spreadsheet (.csv) Milestones</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {conflict.csvMilestones.map((m, i) => (
                            <span key={i} className="bg-white border border-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">{m}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Actions */}
      <div className="shrink-0 pt-4 border-t border-gray-100 flex items-center justify-between">
        <div className="text-sm text-gray-500 font-semibold">
          + {newPts.length} brand new Product Types will be safely created.
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
            Cancel Import
          </button>
          <button 
            onClick={() => onConfirm(resolutions)}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
          >
            <span>Confirm & Import Data</span>
            <Check className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}