import React, { useState, useMemo } from 'react';
import { AlertTriangle, CheckCircle2, XCircle, ArrowRight, GitMerge, Check, X } from 'lucide-react';

export default function BomMergeResolver({ conflictPts, newPts, onCancel, onConfirm }) {
  // State to track user decisions per Product Type
  // Structure: { ptName: { removeExisting: ['compA'], rejectNew: ['compB'] } }
  const [resolutions, setResolutions] = useState({});

  // Calculate the diffs only once when the component mounts
  const diffs = useMemo(() => {
    return conflictPts.map(pt => {
      const dbComps = pt.existingBOM.map(c => c.name.toLowerCase());
      const csvComps = pt.components.map(c => c.toLowerCase());

      return {
        ...pt,
        inBoth: pt.existingBOM.filter(c => csvComps.includes(c.name.toLowerCase())),
        onlyExisting: pt.existingBOM.filter(c => !csvComps.includes(c.name.toLowerCase())),
        onlyImported: pt.components.filter(c => !dbComps.includes(c.toLowerCase()))
      };
    });
  }, [conflictPts]);

  const toggleRemoveExisting = (ptName, compName) => {
    setResolutions(prev => {
      const ptRes = prev[ptName] || { removeExisting: [], rejectNew: [] };
      const isRemoving = ptRes.removeExisting.includes(compName);
      return {
        ...prev,
        [ptName]: {
          ...ptRes,
          removeExisting: isRemoving ? ptRes.removeExisting.filter(c => c !== compName) : [...ptRes.removeExisting, compName]
        }
      };
    });
  };

  const toggleRejectNew = (ptName, compName) => {
    setResolutions(prev => {
      const ptRes = prev[ptName] || { removeExisting: [], rejectNew: [] };
      const isRejecting = ptRes.rejectNew.includes(compName);
      return {
        ...prev,
        [ptName]: {
          ...ptRes,
          rejectNew: isRejecting ? ptRes.rejectNew.filter(c => c !== compName) : [...ptRes.rejectNew, compName]
        }
      };
    });
  };

  const hasAnyRemovals = Object.values(resolutions).some(res => res.removeExisting.length > 0);

  return (
    <div className="space-y-6 max-h-[75vh] flex flex-col">
      
      {/* Header & Warning */}
      <div className="shrink-0 space-y-4">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <GitMerge className="w-5 h-5 text-indigo-700" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Resolve Bill of Materials (BOM) Conflicts</h3>
            <p className="text-sm text-gray-500">Compare existing database components with the uploaded spreadsheet (.csv file).</p>
          </div>
        </div>

        {hasAnyRemovals && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex items-start gap-3 text-red-900 text-sm shadow-sm animate-in fade-in slide-in-from-top-2">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
            <p>
              <strong>Warning:</strong> You have chosen to remove existing components. Doing so will immediately make all existing Schedules for those Product Types <strong>INCOMPLETE</strong> and the Product Type <strong>INVALID</strong>.
            </p>
          </div>
        )}
      </div>

      {/* Main Diff Scroll Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 pr-2">
        {diffs.map(pt => {
          const res = resolutions[pt.name] || { removeExisting: [], rejectNew: [] };

          return (
            <div key={pt.name} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-bold text-gray-800 flex justify-between items-center">
                <span>{pt.name}</span>
                <span className="text-xs font-semibold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                  Conflict
                </span>
              </div>
              
              <div className="grid grid-cols-2 divide-x divide-gray-200">
                {/* LEFT: Current DB */}
                <div className="p-4 space-y-3 bg-white">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 text-center">Current Database</h4>
                  
                  {pt.inBoth.map(c => (
                    <div key={c.name} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded border border-gray-100 opacity-70">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="truncate">{c.name}</span>
                    </div>
                  ))}

                  {pt.onlyExisting.map(c => {
                    const isRemoving = res.removeExisting.includes(c.name);
                    return (
                      <div key={c.name} className={`flex items-center justify-between text-sm px-3 py-2 rounded border transition-colors ${isRemoving ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-gray-200 text-gray-800'}`}>
                        <span className={`truncate ${isRemoving ? 'line-through opacity-70' : ''}`}>{c.name}</span>
                        <button 
                          onClick={() => toggleRemoveExisting(pt.name, c.name)}
                          className={`text-xs font-bold px-2 py-1 rounded transition-colors ${isRemoving ? 'bg-red-200 text-red-800 hover:bg-red-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                          {isRemoving ? 'Removed' : 'Keep'}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* RIGHT: Spreadsheet Import */}
                <div className="p-4 space-y-3 bg-blue-50/30">
                  <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-4 text-center">Spreadsheet (.csv)</h4>
                  
                  {pt.inBoth.map(c => (
                    <div key={c.name} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded border border-gray-100 opacity-70">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="truncate">{c.name}</span>
                    </div>
                  ))}

                  {pt.onlyImported.map(cName => {
                    const isRejecting = res.rejectNew.includes(cName);
                    return (
                      <div key={cName} className={`flex items-center justify-between text-sm px-3 py-2 rounded border transition-colors ${isRejecting ? 'bg-gray-100 border-gray-200 text-gray-400' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                        <span className={`truncate ${isRejecting ? 'line-through' : 'font-semibold'}`}>{cName}</span>
                        <button 
                          onClick={() => toggleRejectNew(pt.name, cName)}
                          className={`text-xs font-bold px-2 py-1 rounded transition-colors ${isRejecting ? 'bg-gray-200 text-gray-600 hover:bg-gray-300' : 'bg-emerald-200 text-emerald-800 hover:bg-emerald-300'}`}
                        >
                          {isRejecting ? 'Rejected' : 'Add New'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
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