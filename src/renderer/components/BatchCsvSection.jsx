import React from 'react';
import { ChevronDown, ChevronUp, Download, Trash2, Upload } from 'lucide-react';

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
          <h2 className="text-xl font-bold text-gray-900">Batch Registration with CSV</h2>
          <p className="mt-1 text-sm text-gray-500">You can also share your product types easily or create a backup copy.</p>
        </div>
        {open ? <ChevronUp className="h-5 w-5 shrink-0 text-gray-500" /> : <ChevronDown className="h-5 w-5 shrink-0 text-gray-500" />}
      </div>
      {open && (
        <div id="batch-csv-options" className="mt-3" onClick={event => event.stopPropagation()}>
          <p className="text-sm text-gray-800">Have a lot of product types to register? Instead of registering them one by one manually, consider adding them in bulk using CSV!</p>
          <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-2">
              <ActionRow description={<><p className="mb-1">Download a blank two-column product type and components template.</p><p className="mb-1">Product types imported using this template will be added as <Status>INVALID</Status></p></>} action={<button onClick={onDownloadPtTemplate} className="flex shrink-0 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"><Download className="h-3.5 w-3.5 text-gray-500" />Get Template</button>} />
              <ActionRow description={<><p className="mb-1">Import product types from a CSV file. Invalid CSV formats will be rejected.</p><p className="mb-1">Product types that do not currently exist will be created.</p><p className="mb-1">Product types that already exist may be overwritten. <span className="text-red-700">(Existing schedules and procurement lead times may be removed!)</span></p></>} action={<button onClick={onImport} className="flex shrink-0 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"><Upload className="h-3.5 w-3.5 text-gray-500" />Import CSV</button>} />
            </div>
            <div className="space-y-2">
              <ActionRow description={<><p className="mb-1">Export existing product types and ALL associated data (components, schedules, procurement lead times, etc.).</p><p className="mb-1">Product types imported using this file will retain their current status.</p></>} action={<button onClick={onExportFull} className="flex shrink-0 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"><Download className="h-3.5 w-3.5 text-gray-500" />Export Full</button>} />
              <ActionRow description={<><p className="mb-1">Export existing product types and associated components only.</p><p className="mb-1">Product types imported using this file will be added as <Status>INVALID</Status></p></>} action={<button onClick={onExportPartial} className="flex shrink-0 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"><Download className="h-3.5 w-3.5 text-gray-500" />Export Partial</button>} />
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
