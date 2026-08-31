import React from 'react';
import { ChevronDown, ChevronUp, Download, Trash2, Upload } from 'lucide-react';

/**
 * BatchCsvSection component provides a user interface for batch product type registration using CSV files. 
 * It allows users to download a template, import product types, export existing product types, and delete all product types. 
 * The component is designed to be collapsible and provides clear descriptions for each action.
 * 
 * Props:
 * - open: boolean indicating if the section is expanded
 * - onToggle: function to toggle the section's open state
 * - onDownloadPtTemplate: function to handle downloading the product type template
 * - onImport: function to handle importing product types from a CSV file
 * - onExportFull: function to handle exporting all product types and associated data
 * - onExportPartial: function to handle exporting only product types and BOM
 * - onDeleteAll: function to handle deleting all product types
 * 
 * The component uses ActionRow subcomponents for each action, providing a description and an action button.
 * It also includes a Status subcomponent to indicate the status of imported product types.
 * 
 * @param {Object} props - The component props
 * @param {boolean} props.open - Whether the section is expanded
 * @param {Function} props.onToggle - Function to toggle the section's open state
 * @param {Function} props.onDownloadPtTemplate - Function to handle downloading the product type template
 * @param {Function} props.onImport - Function to handle importing product types from a CSV file
 * @param {Function} props.onExportFull - Function to handle exporting all product types and associated data
 * @param {Function} props.onExportPartial - Function to handle exporting only product types and BOM
 * @param {Function} props.onDeleteAll - Function to handle deleting all product types
 * 
 * @returns {JSX.Element} The rendered component
 * 
 */

export default function BatchCsvSection({ open, onToggle, onDownloadPtTemplate, onImport, onExportFull, onExportPartial, onDeleteAll }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onToggle();
          }
        }}
        className="flex cursor-pointer items-center justify-between gap-4 rounded-lg p-2 hover:bg-gray-50"
        aria-expanded={open}
        aria-controls="batch-csv-options"
      >
        <div>
          <h2 className="font-bold text-gray-900 text-md mb-3">Batch Product Type Registration with CSV</h2>
          <p className="text-sm text-gray-800 mt-3">Have a lot of product types to register? Instead of registering them one by one manually, consider adding them in bulk using CSV!</p>
          <p className="text-sm text-gray-80 mt-1">You can also share your product types easily or create a backup copy.</p>
        </div>
        {open ? <ChevronUp className="h-5 w-5 shrink-0 text-gray-500" /> : <ChevronDown className="h-5 w-5 shrink-0 text-gray-500" />}
      </div>
      {open && (
        <div id="batch-csv-options" className="mt-3" onClick={event => event.stopPropagation()}>
          <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-2">
              <ActionRow description={<><p className="mb-1">Download a blank two-column product type and BOM template.</p><p className="mb-1">Product types imported using this template will be added as <Status>INVALID</Status></p></>} action={<button onClick={onDownloadPtTemplate} className="flex shrink-0 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"><Download className="h-3.5 w-3.5 text-gray-500" />Get Template</button>} />
              <ActionRow description={<><p className="mb-1">Import product types from a valid CSV file.</p><p className="mb-1">Product types that do not currently exist will be created.</p><p className="mb-1">Product types that already exist may be overwritten. <span className="text-red-700">(Existing Schedules, Milestones and Procurement Lead Times may be deleted!)</span></p></>} action={<button onClick={onImport} className="flex shrink-0 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"><Upload className="h-3.5 w-3.5 text-gray-500" />Import CSV</button>} />
            </div>
            <div className="space-y-2">
              <ActionRow description={<><p className="mb-1">Export existing product types and ALL associated data (Schedules, Milestones, BOM, Procurement Lead Times).</p><p className="mb-1">Product types imported using this file will retain their current status.</p></>} action={<button onClick={onExportFull} className="flex shrink-0 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"><Download className="h-3.5 w-3.5 text-gray-500" />Export Full</button>} />
              <ActionRow description={<><p className="mb-1">Export existing product types and BOM only.</p><p className="mb-1">Product types imported using this file will be added as <Status>INVALID</Status></p></>} action={<button onClick={onExportPartial} className="flex shrink-0 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"><Download className="h-3.5 w-3.5 text-gray-500" />Export Partial</button>} />
              <ActionRow danger description={<p className="mb-1">Delete ALL product types. This is irreversible.</p>} action={<button onClick={onDeleteAll} className="flex shrink-0 items-center gap-2 rounded-lg border border-red-200 bg-white px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" />Delete All</button>} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionRow({ description, action, danger = false }) {
  return <div className={`flex items-center justify-between gap-4 border-t pt-3 ${danger ? 'border-red-100' : 'border-gray-100'}`}><span className={`text-xs ${danger ? 'text-red-700' : 'text-gray-600'}`}>{description}</span>{action}</div>;
}

function Status({ children }) {
  return <span className="inline-flex items-center rounded-full border border-red-200 bg-red-100 px-2 py-0.5 text-xs font-bold text-red-800">{children}</span>;
}
