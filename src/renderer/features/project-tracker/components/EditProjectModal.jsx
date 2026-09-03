import React from 'react';
import Modal from '../../../components/ui/Modal'; 
import FormattedDateInput from '../../../components/ui/FormattedDateInput';

export default function EditProjectModal({ editingProject, setEditingProject, editForm, setEditForm, handleSaveEdit, dateFormat }) {
  if (!editingProject) return null;

  return (
    <Modal
      isOpen={!!editingProject}
      onClose={() => setEditingProject(null)}
      title={`Edit Project "${editingProject.tag_no}"`}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSaveEdit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase">Description</label>
          <input type="text" value={editForm.description || ''} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-bold text-gray-700 uppercase">Customer *</label><input type="text" required value={editForm.customer || ''} onChange={(e) => setEditForm({ ...editForm, customer: e.target.value })} className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none" /></div>
          <div><label className="block text-xs font-bold text-gray-700 uppercase">Contract No. *</label><input type="text" required value={editForm.contract_no || ''} onChange={(e) => setEditForm({ ...editForm, contract_no: e.target.value })} className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none" /></div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase">Sales Ref. *</label>
          <input type="text" required value={editForm.sales_ref || ''} onChange={(e) => setEditForm({ ...editForm, sales_ref: e.target.value })} className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase">Contract Signed Date *</label>
            <FormattedDateInput 
              required 
              value={editForm.contract_signed_date || ''} 
              onChange={(e) => setEditForm({ ...editForm, contract_signed_date: e.target.value })} 
              dateFormat={dateFormat}
              className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase">ROS Date *</label>
            <FormattedDateInput 
              required 
              value={editForm.ros_date || ''} 
              onChange={(e) => setEditForm({ ...editForm, ros_date: e.target.value })} 
              dateFormat={dateFormat}
              className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none" 
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-bold text-gray-700 uppercase">Project Manager (PM) *</label><input type="text" required value={editForm.pm_owner || ''} onChange={(e) => setEditForm({ ...editForm, pm_owner: e.target.value })} className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none" /></div>
          <div><label className="block text-xs font-bold text-gray-700 uppercase">Engineer Owner *</label><input type="text" required value={editForm.engineer_owner || ''} onChange={(e) => setEditForm({ ...editForm, engineer_owner: e.target.value })} className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none" /></div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div><label className="block text-xs font-bold text-gray-700 uppercase">Procurement *</label><input type="text" required value={editForm.procurement_owner || ''} onChange={(e) => setEditForm({ ...editForm, procurement_owner: e.target.value })} className="mt-1 block w-full rounded-lg border border-gray-300 py-1.5 px-2 text-xs focus:border-indigo-500 focus:outline-none" /></div>
          <div><label className="block text-xs font-bold text-gray-700 uppercase">Production *</label><input type="text" required value={editForm.production_owner || ''} onChange={(e) => setEditForm({ ...editForm, production_owner: e.target.value })} className="mt-1 block w-full rounded-lg border border-gray-300 py-1.5 px-2 text-xs focus:border-indigo-500 focus:outline-none" /></div>
          <div><label className="block text-xs font-bold text-gray-700 uppercase">FAT Owner *</label><input type="text" required value={editForm.fat_owner || ''} onChange={(e) => setEditForm({ ...editForm, fat_owner: e.target.value })} className="mt-1 block w-full rounded-lg border border-gray-300 py-1.5 px-2 text-xs focus:border-indigo-500 focus:outline-none" /></div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase">Notes</label>
          <textarea rows="2" value={editForm.notes || ''} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none" />
        </div>

        <div className="flex justify-end space-x-2 pt-2">
          <button type="button" onClick={() => setEditingProject(null)} className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-semibold transition">Cancel</button>
          <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition">Save Changes</button>
        </div>
      </form>
    </Modal>
  );
}