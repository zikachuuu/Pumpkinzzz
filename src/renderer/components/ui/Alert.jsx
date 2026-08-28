import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';


/**
 * Alert component to display success or error messages.
 * Props:
 * - alert: An object containing the alert type ('success' or 'error') and message.
 * 
 * Example usage:
 * <Alert alert={{ type: 'success', message: 'Operation completed successfully.' }} />
 * <Alert alert={{ type: 'error', message: 'An error occurred.' }} />
 * 
 * The component renders a styled alert box with an icon and message based on the alert type.
 * If no alert is provided, it returns null and renders nothing.
 * 
 * Styling:
 * - Success alerts have a green background and border.
 * - Error alerts have a red background and border.
 * 
 * Icons:
 * - Success alerts display a check circle icon.
 * - Error alerts display an alert circle icon.
 * 
 * The component uses Tailwind CSS classes for styling and layout.
 * 
 * Note: Ensure that the 'lucide-react' package is installed for the icons to work.
 * 
 * @param {Object} props - The component props.
 * @param {Object} props.alert - The alert object containing type and message.
 * @returns {JSX.Element|null} The rendered alert component or null if no alert is provided.
**/


export default function Alert({ alert }) {
  if (!alert) return null;
  
  const isSuccess = alert.type === 'success';
  
  return (
    <div className={`p-4 rounded-lg border flex items-center space-x-3 ${
      isSuccess 
        ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
        : 'bg-red-50 border-red-200 text-red-800'
    }`}>
      {isSuccess ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
      <span className="text-sm font-medium">{alert.message}</span>
    </div>
  );
}