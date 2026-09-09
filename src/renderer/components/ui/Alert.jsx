import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';


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


export default function Alert({ alert, onDismiss }) {
  const [isVisible, setIsVisible] = useState(false);
  const hideTimerRef = useRef(null);
  const dismissTimerRef = useRef(null);
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!alert) {
      setIsVisible(false);
      return undefined;
    }

    setIsVisible(true);
    hideTimerRef.current = setTimeout(() => {
      setIsVisible(false);
      dismissTimerRef.current = setTimeout(() => onDismissRef.current?.(), 250);
    }, 7000);

    return () => {
      clearTimeout(hideTimerRef.current);
      clearTimeout(dismissTimerRef.current);
    };
  }, [alert]);

  const handleDismiss = () => {
    clearTimeout(hideTimerRef.current);
    clearTimeout(dismissTimerRef.current);
    setIsVisible(false);
    dismissTimerRef.current = setTimeout(() => onDismissRef.current?.(), 250);
  };

  if (!alert) return null;
  
  const isSuccess = alert.type === 'success';
  
  return (
    <div className={`pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-6 sm:px-10 lg:px-16 ${isVisible ? 'alert-enter' : 'alert-exit'}`}>
      <div className={`pointer-events-auto relative flex w-full items-start gap-3 rounded-lg border p-4 pr-12 shadow-lg ${
        isSuccess 
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
          : 'bg-red-50 border-red-200 text-red-800'
      }`} role="alert">
        {isSuccess ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /> : <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />}
        <span className="text-sm font-medium">{alert.message}</span>
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-3 top-3 rounded-md p-1 opacity-70 transition hover:bg-black/5 hover:opacity-100"
          aria-label="Dismiss alert"
          title="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}