import React, { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import { Box, Calendar, Download, CheckSquare } from 'lucide-react';
import * as db from '../../../utils/db';

export default function ExportSelectionModal({ 
  isOpen, 
  onClose, 
  productTypes, 
  exportMode, // 'bom' or 'full'
  onExport, 
  onDownloadTemplate 
}) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [ptDetails, setPtDetails] = useState({});
  const [loading, setLoading] = useState(true);

  // Load details and select all by default when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(productTypes.map(pt => pt.id));
      loadDetails();
    } else {
      setSelectedIds([]);
      setPtDetails({});
    }
  }, [isOpen, productTypes, exportMode]);

  const loadDetails = async () => {
    setLoading(true);
    const details = {};
    for (const pt of productTypes) {
      const comps = await db.getAttachedComponents(pt.id);
      let schedules = [];
      
      // Only fetch schedules if we are doing a 'full' export
      if (exportMode === 'full') {
        const scheds = await db.getSchedules(pt.id);
        for (const s of scheds) {
          const milestones = await db.getMilestones(s.id);
          schedules.push({ name: s.name, milestoneCount: milestones.length });
        }
      }
      
      details[pt.id] = { components: comps, schedules };
    }
    setPtDetails(details);
    setLoading(false);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === productTypes.length) setSelectedIds([]);
    else setSelectedIds(productTypes.map(pt => pt.id));
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  if (!isOpen) return null;

  const isNoneSelected = selectedIds.length === 0;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={exportMode === 'bom' ? "Export BOM Only" : "Export All Data"} 
      maxWidth="max-w-5xl"
    >
      <div className="space-y-4 flex flex-col max-h-[75vh]">
        <div className="shrink-0">
          <p className="text-sm text-gray-600 mb-4">
            {exportMode === 'bom' 
              ? "Select the product types you want to export. The spreadsheet will contain only the Product Type names and their Bill of Materials (BOM)." 
              : "Select the product types you want to export. The spreadsheet will contain the Product Type names, BOM, Schedules, Milestones, and Procurement Lead Times."}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar border border-gray-200 rounded-lg shadow-sm">
          <table className="min-w-full text-left text-sm divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-4 py-3 w-12 text-center">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length > 0 && selectedIds.length === productTypes.length}
                    ref={input => {
                      if (input) input.indeterminate = selectedIds.length > 0 && selectedIds.length < productTypes.length;
                    }}
                    onChange={toggleSelectAll}
                    className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                  />
                </th>
                <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-wider text-xs">Product Type</th>
                <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-wider text-xs">BOM (Components)</th>
                {exportMode === 'full' && (
                  <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-wider text-xs">Schedules</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={exportMode === 'full' ? 4 : 3} className="px-4 py-12 text-center text-gray-400 font-semibold animate-pulse">
                    Loading details...
                  </td>
                </tr>
              ) : productTypes.length === 0 ? (
                <tr>
                  <td colSpan={exportMode === 'full' ? 4 : 3} className="px-4 py-12 text-center text-gray-400 font-semibold">
                    No Product Types found in database.
                  </td>
                </tr>
              ) : (
                productTypes.map(pt => {
                  const isSelected = selectedIds.includes(pt.id);
                  const details = ptDetails[pt.id] || { components: [], schedules: [] };
                  
                  return (
                    <tr 
                      key={pt.id} 
                      onClick={() => toggleSelect(pt.id)}
                      className={`cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50/30' : 'hover:bg-gray-50'} ${!isSelected && 'opacity-60'}`}
                    >
                      <td className="px-4 py-3 text-center align-top">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => {}} // Handled by tr onClick
                          className="mt-1 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                        />
                      </td>
                      <td className="px-4 py-3 align-top font-bold text-gray-900">{pt.name}</td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-wrap gap-1">
                          {details.components.length === 0 ? <span className="text-xs text-gray-400 italic">No components</span> : details.components.map(c => (
                            <span key={c.id} className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${isSelected ? 'bg-white border-indigo-200 text-indigo-700' : 'bg-gray-100 border-gray-200 text-gray-600'}`}>
                              {c.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      {exportMode === 'full' && (
                        <td className="px-4 py-3 align-top">
                          <ul className="space-y-1">
                            {details.schedules.length === 0 ? <span className="text-xs text-gray-400 italic">No schedules</span> : details.schedules.map(s => (
                              <li key={s.name} className={`flex items-center justify-between text-xs px-2 py-1 rounded border ${isSelected ? 'bg-white border-indigo-200 text-indigo-900' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                                <span className="font-bold">{s.name}</span>
                                <span className={isSelected ? 'text-indigo-500' : 'text-gray-500'}>{s.milestoneCount} milestones</span>
                              </li>
                            ))}
                          </ul>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="shrink-0 pt-4 flex items-center justify-between border-t border-gray-100">
          <div className="text-sm text-gray-500 font-semibold">
            {selectedIds.length} of {productTypes.length} selected
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
              Cancel
            </button>

            {/* Dynamic Export Button Logic based on User Requirements */}
            {exportMode === 'bom' && isNoneSelected ? (
              <button 
                onClick={() => { onDownloadTemplate(); onClose(); }}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 border border-indigo-200 rounded-lg shadow-sm transition"
              >
                <Download className="w-4 h-4" />
                <span>Download Template</span>
              </button>
            ) : (
              <button 
                onClick={() => { onExport(selectedIds); onClose(); }}
                disabled={isNoneSelected || loading}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <CheckSquare className="w-4 h-4" />
                <span>Export Selected</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}