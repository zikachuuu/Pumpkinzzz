import React from 'react';
import Modal from '../../../components/ui/Modal.jsx'; 

/**
 * ModalValidityStatusGuide component displays a guide explaining the different validity statuses of product types.
 * 
 * Props:
 * - isOpen: boolean indicating if the modal is open
 * - onClose: function to call when the modal should be closed
 * 
 * The modal explains three statuses:
 * 1. INVALID: The product type has no schedules, no BOM, or no procurement lead times. It cannot be registered under new projects.
 * 2. SUB-VALID: The product type has BOM and at least one configured schedule associated with procurement lead time. It can be registered under new projects, but only with the configured schedules.
 * 3. VALID: The product type has BOM and every schedule is associated with procurement lead times. It can be registered under new projects, and all schedules will be available for selection.
 * 
 * The modal includes a "Got It" button to close the modal.
 * 
 * @param {Object} props - The component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to call when closing the modal
 * @returns {JSX.Element} The rendered component
 * 
 */

export default function ModalValidityStatusGuide({ isOpen, onClose }) {
  return (
    <Modal
      isOpen={isOpen}
      title="Product Type Validity Status Guide"
      onClose={onClose}
    >
      <div className="space-y-3 text-xs text-gray-600 leading-relaxed">
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-900">
          <strong className="block text-red-950 mb-1">🔴 INVALID (Default for new records)</strong>
          <p>The product type has no schedules, no BOM, or no procurement lead times.</p>
          <p>Invalid product types <strong>cannot</strong> be registered under new projects.</p>
        </div>

        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
          <strong className="block text-amber-950 mb-1">🟡 SUB-VALID</strong>
          <p>The product type has BOM, and at least one configured schedule associated with procurement lead time. </p>
          <p>Sub-valid product types can be registered under new projects, but only with the configured schedules.</p>
        </div>

        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
          <strong className="block text-emerald-950 mb-1">🟢 VALID (Complete)</strong>
          <p>The product type has BOM, and <strong>every</strong> schedule is associated with procurement lead times.</p>
          <p>Valid product types can be registered under new projects, and all schedules will be available for selection.</p>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={onClose}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
        >
          Got It
        </button>
      </div>
    </Modal>
  );
}