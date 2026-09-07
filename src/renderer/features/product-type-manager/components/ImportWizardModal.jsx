import React, { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import { AlertTriangle, XCircle, GitMerge, Check, Box, Calendar } from 'lucide-react';
import * as db from '../../../utils/db';
import { commitFormatA, commitFormatB } from '../services/importDbService';
import UsageCapsule from '../../../components/ui/UsageCapsule.jsx'; // <--- IMPORT THE CAPSULE

export default function ImportWizardModal({ 
  isOpen, 
  onClose, 
  importPayload, 
  existingProductTypes, 
  triggerAlert, 
  onSuccess,
  openUsageModal // <--- ACCEPT THE PROP
}) {
  const [analysis, setAnalysis] = useState(null);
  const [resolutions, setResolutions] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && importPayload) {
      analyzeData(importPayload);
    } else {
      setAnalysis(null);
      setResolutions({});
    }
  }, [isOpen, importPayload]);

  const analyzeData = async (payload) => {
    setLoading(true);
    const { format, parsedProductTypes, headers } = payload;
    
    const newPts = [];
    const conflictPts = [];

    const schedIdx = headers.indexOf('schedule name');
    const mNameIdx = headers.indexOf('milestone name');

    for (const importedPt of parsedProductTypes) {
      const existingPt = existingProductTypes.find(e => e.name.toLowerCase() === importedPt.name.toLowerCase());
      
      let importedSchedules = [];
      if (format === 'full' && schedIdx !== -1) {
        const schedMap = {};
        importedPt.rows.forEach(row => {
          const sName = row[schedIdx]?.trim();
          if (!sName) return;
          if (!schedMap[sName]) schedMap[sName] = new Set();
          const mName = mNameIdx !== -1 ? row[mNameIdx]?.trim() : null;
          if (mName) schedMap[sName].add(mName);
        });
        importedSchedules = Object.entries(schedMap).map(([name, mSet]) => ({ name, milestoneCount: mSet.size }));
      }

      const uniqueImportedComps = [];
      const seenComps = new Set();
      for (const c of importedPt.components) {
        const lower = c.toLowerCase();
        if (!seenComps.has(lower)) {
          seenComps.add(lower);
          uniqueImportedComps.push(c);
        }
      }
      importedPt.components = uniqueImportedComps;

      if (!existingPt) {
        newPts.push({ ...importedPt, importedSchedules });
        continue;
      }

      const existingBOM = await db.getAttachedComponents(existingPt.id);
      const existingSchedules = await db.getSchedules(existingPt.id);
      
      for (const s of existingSchedules) {
        const milestones = await db.getMilestones(s.id);
        s.milestoneCount = milestones.length;
      }

      const dbCompsLower = existingBOM.map(c => c.name.toLowerCase());
      const csvCompsLower = uniqueImportedComps.map(c => c.toLowerCase());
      
      const inBothComps = existingBOM.filter(c => csvCompsLower.includes(c.name.toLowerCase()));
      const onlyExistingComps = existingBOM.filter(c => !csvCompsLower.includes(c.name.toLowerCase()));
      const onlyImportedComps = uniqueImportedComps.filter(c => !dbCompsLower.includes(c.toLowerCase()));

      const dbSchedsLower = existingSchedules.map(s => s.name.toLowerCase());
      const csvSchedsLower = importedSchedules.map(s => s.name.toLowerCase());

      const inBothScheds = existingSchedules.filter(s => csvSchedsLower.includes(s.name.toLowerCase()));
      const onlyExistingScheds = existingSchedules.filter(s => !csvSchedsLower.includes(s.name.toLowerCase()));
      const onlyImportedScheds = importedSchedules.filter(s => !dbSchedsLower.includes(s.name.toLowerCase()));

      conflictPts.push({ 
        ...importedPt, 
        existingPt, 
        existingBOM, 
        existingSchedules, 
        importedSchedules,
        diffs: {
          inBothComps, onlyExistingComps, onlyImportedComps,
          inBothScheds, onlyExistingScheds, onlyImportedScheds
        }
      });
    }

    setAnalysis({ format, newPts, conflictPts });
    setLoading(false);
  };

  const setDecision = (ptName, decision) => {
    setResolutions(prev => ({ ...prev, [ptName]: decision }));
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      // SECURITY: Exclude any actively used product types from overwrites, even if state was bypassed
      const activeConflicts = analysis.conflictPts.filter(pt => {
        const isLocked = pt.existingPt.in_use_count > 0;
        const decision = isLocked ? 'keep' : (resolutions[pt.name] || 'keep');
        return decision === 'overwrite';
      });

      const activeAnalysis = { ...analysis, conflictPts: activeConflicts };
      
      const mappedRes = {};
      activeConflicts.forEach(pt => {
        const onlyExistingComps = pt.diffs.onlyExistingComps.map(c => c.name);
        const onlyExistingScheds = pt.diffs.onlyExistingScheds.map(s => s.name);
        
        mappedRes[pt.name] = { 
          isOverwrite: true, 
          removeExistingComps: onlyExistingComps,
          removeExistingScheds: onlyExistingScheds,
          overwriteSchedules: pt.importedSchedules.map(s => s.name)
        };
      });

      if (analysis.format === 'bom') {
        await commitFormatA(activeAnalysis, mappedRes);
      } else {
        await commitFormatB(activeAnalysis, mappedRes, importPayload.headers);
      }
      
      triggerAlert('success', 'Spreadsheet imported and merged successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      triggerAlert('error', `Import failed: ${err.message}`);
      setLoading(false);
    }
  };

  if (!isOpen || !importPayload) return null;

  const hasScheduleLoss = analysis?.conflictPts?.some(pt => {
    const isLocked = pt.existingPt.in_use_count > 0;
    const decision = isLocked ? 'keep' : (resolutions[pt.name] || 'keep');
    return decision === 'overwrite' && pt.existingSchedules.length > 0 && pt.importedSchedules.length === 0;
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Resolve Import Conflicts" maxWidth="max-w-5xl">
      {loading || !analysis ? (
        <div className="p-12 text-center text-gray-500 font-semibold animate-pulse">Analyzing spreadsheet data...</div>
      ) : (
        <div className="space-y-6 max-h-[75vh] flex flex-col">
          
          <div className="shrink-0 space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <GitMerge className="w-5 h-5 text-indigo-700" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Resolve Product Type Conflicts</h3>
                <p className="text-sm text-gray-500">These Product Types already exist in the database. Choose whether to keep the current data or overwrite it.</p>
              </div>
            </div>

            {hasScheduleLoss && (
              <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex items-start gap-3 text-red-900 text-sm shadow-sm animate-in fade-in slide-in-from-top-2">
                <AlertTriangle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
                <p>
                  <strong>Severe Data Loss Warning:</strong> You have chosen to overwrite an existing Product Type with a spreadsheet that contains NO schedules. Doing so will <strong>permanently delete</strong> all of its existing Schedules, Milestones, and Procurement Lead Times.
                </p>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 pr-2">
            {analysis.conflictPts.length === 0 ? (
              <div className="text-center py-8 text-gray-500 italic">No existing product type conflicts found.</div>
            ) : analysis.conflictPts.map(pt => {
              
              // --- 🔒 LOCKING LOGIC ---
              const inUseCount = pt.existingPt.in_use_count || 0;
              const isLocked = inUseCount > 0;
              const decision = isLocked ? 'keep' : (resolutions[pt.name] || 'keep');
              const isOverwrite = decision === 'overwrite';

              return (
                <div key={pt.name} className={`border rounded-lg overflow-hidden transition-colors ${isOverwrite ? 'border-red-300 shadow-md' : 'border-gray-200 shadow-sm'}`}>
                  <div className="bg-white px-4 py-3 border-b border-gray-100 flex flex-wrap gap-2 items-center justify-between">
                    
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-sm text-gray-800">Product Type: {pt.name}</span>
                      {/* --- USAGE CAPSULE ADDED --- */}
                      <UsageCapsule count={inUseCount} onClick={() => openUsageModal('product_type', pt.existingPt.id, pt.name)} />
                    </div>
                    
                    <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                      <button
                        onClick={() => !isLocked && setDecision(pt.name, 'keep')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${!isOverwrite ? 'bg-white text-gray-800 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Keep Current
                      </button>
                      <button
                        onClick={() => !isLocked && setDecision(pt.name, 'overwrite')}
                        disabled={isLocked}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                          isLocked 
                            ? 'text-gray-400 cursor-not-allowed opacity-50' 
                            : isOverwrite 
                              ? 'bg-red-100 text-red-800 shadow-sm border border-red-300' 
                              : 'text-gray-500 hover:text-gray-700'
                        }`}
                        title={isLocked ? 'Cannot overwrite product type while in use by projects' : 'Overwrite with new data'}
                      >
                        Overwrite with New
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 divide-x divide-gray-100">
                    {/* LEFT: Current Database */}
                    <div className={`p-4 space-y-4 ${!isOverwrite ? 'bg-emerald-50/30' : 'bg-gray-50'}`}>
                      <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">Current Database</h4>
                      
                      <div>
                        <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-gray-700"><Box className="w-3.5 h-3.5"/> Attached Components</div>
                        <div className="flex flex-wrap gap-1.5">
                          {pt.existingBOM.length === 0 ? <span className="text-xs text-gray-400 italic">None</span> : (
                            <>
                              {pt.diffs.inBothComps.map(c => (
                                <span key={c.name} className={`px-2 py-1 rounded text-[10px] font-medium border ${!isOverwrite ? 'bg-white border-gray-200 text-gray-700' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>{c.name}</span>
                              ))}
                              {pt.diffs.onlyExistingComps.map(c => (
                                <span key={c.name} className={`px-2 py-1 rounded text-[10px] font-medium border transition-colors ${isOverwrite ? 'bg-red-50 border-red-200 text-red-700 line-through opacity-70' : 'bg-white border-gray-200 text-gray-700'}`}>{c.name}</span>
                              ))}
                            </>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-gray-700"><Calendar className="w-3.5 h-3.5"/> Attached Schedules</div>
                        <ul className="space-y-1.5">
                          {pt.existingSchedules.length === 0 ? <span className="text-xs text-gray-400 italic">None</span> : (
                            <>
                              {pt.diffs.inBothScheds.map(s => (
                                <li key={s.id} className={`text-[11px] px-2 py-1.5 rounded flex justify-between border ${!isOverwrite ? 'bg-white border-gray-200 text-gray-700' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                                  <span className="font-semibold">{s.name}</span>
                                  <span>{s.milestoneCount} ms</span>
                                </li>
                              ))}
                              {pt.diffs.onlyExistingScheds.map(s => (
                                <li key={s.id} className={`text-[11px] px-2 py-1.5 rounded flex justify-between border transition-colors ${isOverwrite ? 'bg-red-50 border-red-200 text-red-700 line-through opacity-70' : 'bg-white border-gray-200 text-gray-700'}`}>
                                  <span className="font-semibold">{s.name}</span>
                                  <span>{s.milestoneCount} ms</span>
                                </li>
                              ))}
                            </>
                          )}
                        </ul>
                      </div>
                    </div>
                    
                    {/* RIGHT: Spreadsheet Import */}
                    <div className={`p-4 space-y-4 ${isOverwrite ? 'bg-blue-50/30' : 'bg-gray-50'}`}>
                      <h4 className="text-[10px] font-bold text-blue-800 uppercase tracking-wider text-center">Spreadsheet (.csv)</h4>
                      
                      <div>
                        <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-blue-800"><Box className="w-3.5 h-3.5"/> Imported Components</div>
                        <div className="flex flex-wrap gap-1.5">
                          {pt.components.length === 0 ? <span className="text-xs text-gray-400 italic">None</span> : (
                            <>
                              {pt.diffs.inBothComps.map(c => (
                                <span key={c.name} className={`px-2 py-1 rounded text-[10px] font-medium border ${isOverwrite ? 'bg-white border-blue-200 text-blue-800' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>{c.name}</span>
                              ))}
                              {pt.diffs.onlyImportedComps.map(c => (
                                <span key={c} className={`px-2 py-1 rounded text-[10px] font-medium border transition-colors ${isOverwrite ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold' : 'bg-gray-100 border-gray-200 text-gray-400 line-through opacity-70'}`}>{c}</span>
                              ))}
                            </>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-blue-800"><Calendar className="w-3.5 h-3.5"/> Attached Schedules</div>
                        <ul className="space-y-1.5">
                          {pt.importedSchedules.length === 0 ? (
                            <div className={`text-xs px-3 py-2 rounded font-semibold italic text-center border ${isOverwrite && pt.existingSchedules.length > 0 ? 'bg-white border-red-200 text-red-600' : 'border-gray-200 text-gray-400 bg-gray-50'}`}>
                              BLANK
                            </div>
                          ) : (
                            <>
                              {pt.diffs.inBothScheds.map(s => {
                                const impS = pt.importedSchedules.find(is => is.name.toLowerCase() === s.name.toLowerCase());
                                return (
                                  <li key={s.id} className={`text-[11px] px-2 py-1.5 rounded flex justify-between border ${isOverwrite ? 'bg-white border-blue-100 text-blue-900' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                                    <span className="font-semibold">{s.name}</span>
                                    <span>{impS?.milestoneCount} ms</span>
                                  </li>
                                );
                              })}
                              {pt.diffs.onlyImportedScheds.map(s => (
                                <li key={s.name} className={`text-[11px] px-2 py-1.5 rounded flex justify-between border transition-colors ${isOverwrite ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold' : 'bg-gray-100 border-gray-200 text-gray-400 line-through opacity-70'}`}>
                                  <span className="font-semibold">{s.name}</span>
                                  <span>{s.milestoneCount} ms</span>
                                </li>
                              ))}
                            </>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="shrink-0 pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-sm text-gray-500 font-semibold">
              + {analysis.newPts.length} brand new Product Types will be safely created.
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
                Cancel Import
              </button>
              <button 
                onClick={handleConfirm}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
              >
                <span>Confirm & Import Data</span>
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}