import React from 'react';
import { X } from 'lucide-react';


/**
 * Modal (Pop-up Window) component to display content in a centered overlay.
 * Props:
 * - isOpen: Boolean indicating whether the modal is open.
 * - onClose: Function to call when the modal should be closed.
 * - title: Optional title for the modal.
 * - children: Content to display inside the modal.
 * - maxWidth: Optional maximum width for the modal (default is 'max-w-md').
 * 
 * Example usage:
 * <Modal isOpen={isModalOpen} onClose={handleClose} title="My Modal">
 *   <p>Modal content goes here.</p>
 * </Modal>
 * 
 * The component renders a semi-transparent overlay and centers the modal content.
 * It includes a close button in the top-right corner if an onClose function is provided.
 * The modal can be closed by clicking the close button or by clicking outside the modal content.
 * 
 * Styling:
 * - The overlay has a black background with 50% opacity.
 * - The modal has a white background, rounded corners, shadow, and a border.
 * - The title is displayed in bold text at the top of the modal.
 * - The close button is styled with a hover effect.
 * 
 * Note: Ensure that the 'lucide-react' package is installed for the close icon to work.
 * 
 * @param {Object} props - The component props.
 * @param {boolean} props.isOpen - Whether the modal is open.
 * @param {Function} props.onClose - Function to call when closing the modal.
 * @param {string} [props.title] - Optional title for the modal.
 * @param {React.ReactNode} props.children - Content to display inside the modal.
 * @param {string} [props.maxWidth='max-w-md'] - Optional maximum width for the modal.
 * @returns {JSX.Element|null} The rendered modal component or null if not open.
 */


export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-xl shadow-xl border border-gray-100 w-full p-6 ${maxWidth}`}>
        {(title || onClose) && (
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
            {title && <h3 className="font-bold text-lg text-gray-900">{title}</h3>}
            {onClose && (
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}