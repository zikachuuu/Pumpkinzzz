import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import * as db from '../../utils/db';

export default function UsageDetailsModal({ isOpen, onClose, type, id, name }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch the active projects whenever the modal opens
  useEffect(() => {
    if (isOpen && id && type) {
      setLoading(true);
      db.getProjectsUsing(type, id)
        .then(data => {
          setProjects(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch usage details:', err);
          setLoading(false);
        });
    } else {
      setProjects([]);
    }
  }, [isOpen, id, type]);

  if (!isOpen) return null;

  const typeLabel = type === 'schedule' ? 'Schedule' : 'Product Type';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Projects using ${typeLabel}: ${name}`} maxWidth="max-w-2xl">
      <div className="space-y-4 max-h-[60vh] flex flex-col">
        <div className="shrink-0">
          <p className="text-sm text-gray-600 leading-relaxed">
            The following registered projects are actively using this {typeLabel.toLowerCase()}. 
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            You <strong className="text-red-600">cannot delete or overwrite</strong> it via spreadsheet import until these projects are modified or removed from the registry.
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar border border-gray-200 rounded-lg shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-gray-500 animate-pulse text-sm font-semibold">Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm italic">No projects found.</div>
          ) : (
            <table className="min-w-full text-left text-sm divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-wider text-xs">Tag No</th>
                  <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-wider text-xs">Customer</th>
                  <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-wider text-xs">Description</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {projects.map(p => (
                  <tr key={p.tag_no} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-bold text-indigo-600">{p.tag_no}</td>
                    <td className="px-4 py-3 text-gray-800 font-semibold">{p.customer}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{p.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        <div className="shrink-0 pt-4 flex justify-end">
          <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition shadow-sm">
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}