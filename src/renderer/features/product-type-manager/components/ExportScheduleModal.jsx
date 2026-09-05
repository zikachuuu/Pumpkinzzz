import React, { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import { Download, CheckSquare, Square } from 'lucide-react';

export default function ExportScheduleModal({ isOpen, onClose, schedules, onConfirmExport }) {
  const [selectedIds, setSelectedIds] = useState([]);

  // Auto-select all schedules when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(schedules.map(s => s.id));
    }
  }, [isOpen, schedules]);

  const toggleSchedule = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => setSelectedIds(schedules.map(s => s.id));
  const handleDeselectAll = () => setSelectedIds([]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Schedules to Export" maxWidth="max-w-md">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Choose which schedules you want to include in the spreadsheet (.csv file) export. The Bill of Materials (BOM) will always be included.
        </p>

        <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden flex flex-col max-h-64">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-100/50">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {selectedIds.length} of {schedules.length} Selected
            </span>
            <div className="flex gap-3 text-xs font-semibold">
              <button onClick={handleSelectAll} className="text-indigo-600 hover:text-indigo-800">Select All</button>
              <button onClick={handleDeselectAll} className="text-gray-500 hover:text-gray-700">Deselect All</button>
            </div>
          </div>
          
          <div className="overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {schedules.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4 italic">No schedules exist yet.</p>
            ) : (
              schedules.map(s => {
                const isSelected = selectedIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleSchedule(s.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-left ${
                      isSelected ? 'bg-indigo-50 text-indigo-900' : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {isSelected ? <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" /> : <Square className="w-4 h-4 text-gray-400 shrink-0" />}
                    <span className="text-sm font-semibold truncate">{s.name}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
            Cancel
          </button>
          <button 
            onClick={() => {
              onConfirmExport(selectedIds);
              onClose();
            }}
            disabled={selectedIds.length === 0}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span>Export Data</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}