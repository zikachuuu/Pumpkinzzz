import React from 'react';
import { ChevronDown, ChevronUp, Download, Upload, AlertTriangle, Check } from 'lucide-react';
import StatusBadge from '../../../components/ui/StatusBadge';

export default function BatchProductTypeSection({ open, onToggle, onDownloadPtTemplate, onImport, onExportFull, onExportPartial }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm transition-all">
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
        className="flex cursor-pointer items-start justify-between gap-4 rounded-lg hover:bg-gray-50 transition-colors"
        aria-expanded={open}
        aria-controls="batch-csv-options"
      >
        <div className="flex-1 pr-4">
          <h2 className="font-bold text-gray-900 text-md mb-3 border-b border-gray-100 pb-3">
            Batch Product Type Registration with Spreadsheet (.csv file)
          </h2>
          <p className="text-sm text-gray-800 mt-3">
            Have a lot of product types to register? Instead of registering them one by one manually, consider adding them in bulk using a spreadsheet (.csv file)!
          </p>
          <p className="text-sm text-gray-800 mt-1">
            You can also share your product types easily or create a backup copy that can be accessed with your preferred spreadsheet application (e.g. Microsoft Excel, Google Sheets).
          </p>
        </div>
        <div className="pt-1">
          {open ? <ChevronUp className="h-5 w-5 shrink-0 text-gray-500" /> : <ChevronDown className="h-5 w-5 shrink-0 text-gray-500" />}
        </div>
      </div>
      
      {open && (
        <div id="batch-csv-options" className="mt-6 space-y-5 lg:ml-8" onClick={event => event.stopPropagation()}>
          
          <ActionRow 
            description={
              <>
                <p className="mb-2 font-semibold text-gray-900 flex flex-wrap items-center gap-2">
                  Download a blank spreadsheet template (.csv file) in <Tag color="blue">Format A</Tag> containing only 2 columns 
                </p>
                <ul className="list-disc list-inside text-sm text-gray-800 mb-2 ml-2 space-y-1">
                  <li>Product Type</li>
                  <li>Attached Components (BOM; separated by semicolons ";")</li>
                </ul>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  * Product types imported from this spreadsheet (.csv file) will have status <StatusBadge status="invalid" />
                </p>
              </>
            } 
            action={
              <button onClick={onDownloadPtTemplate} className="flex justify-center items-center w-full lg:w-[380px] xl:w-[420px] space-x-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-semibold bg-white transition shadow-sm">
                <Download className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="truncate">Download Spreadsheet Template (.csv file)</span>
              </button>
            } 
          />

          <ActionRow 
            description={
              <>
                <p className="mb-2 font-semibold text-gray-900 flex flex-wrap items-center gap-2">
                  Export all existing product types and ALL associated data as a spreadsheet (.csv file) in <Tag color="purple">Format B</Tag>, including:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-800 mb-2 ml-2 space-y-1">
                  <li>Schedules and Milestones</li>
                  <li>Attached Components (BOM)</li>
                  <li>Procurement Lead Times</li>
                </ul>
                <p className="text-xs text-gray-500 flex items-center flex-wrap gap-1 leading-relaxed">
                  * Product types imported from this spreadsheet (.csv file) will retain their status (<StatusBadge status="valid"/>, <StatusBadge status="sub-valid"/>, or <StatusBadge status="invalid" />)
                </p>
              </>
            } 
            action={
              <button onClick={onExportFull} className="flex justify-center items-center w-full lg:w-[380px] xl:w-[420px] space-x-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-semibold bg-white transition shadow-sm">
                <Download className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="truncate">Export Product Types & ALL Data (.csv file)</span>
              </button>
            } 
          />

          <ActionRow 
            description={
              <>
                <p className="mb-2 font-semibold text-gray-900 flex flex-wrap items-center gap-2">
                  Export all existing product types and associated BOM ONLY as a spreadsheet (.csv file) in <Tag color="blue">Format A</Tag>
                </p>
                <p className="text-sm text-gray-800 mb-2">Matches the 2-column format of the blank spreadsheet template (.csv file).</p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  * Product types imported from this spreadsheet (.csv file) will have status <StatusBadge status="invalid" />
                </p>
              </>
            } 
            action={
              <button onClick={onExportPartial} className="flex justify-center items-center w-full lg:w-[380px] xl:w-[420px] space-x-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-semibold bg-white transition shadow-sm">
                <Download className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="truncate">Export Product Types & BOM ONLY (.csv file)</span>
              </button>
            } 
          />

          <ActionRow 
            description={
              <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <p className="mb-3 font-bold text-gray-900 flex flex-wrap items-center gap-2">
                      Upload Spreadsheet (.csv file) / Import Product Types
                    </p>
                    <ul className="space-y-3 text-sm text-gray-800 mb-2">
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                        <span><span className="font-semibold">Both Format Supported:</span> You can upload either <Tag color="blue">Format A</Tag> or <Tag color="purple">Format B</Tag>.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                        <span><span className="font-semibold">New Product Types:</span> Will be created automatically.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                        <span><span className="font-semibold">Existing Product Types:</span> You can choose to either <strong>Keep Current</strong> or <strong>Overwrite</strong>.</span>
                      </li>
                    </ul>
                  </div>

                  <button onClick={onImport} className="flex items-center justify-center w-full lg:w-[355px] xl:w-[395px] space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-sm transition lg:shrink-0">
                    <Upload className="w-4 h-4 shrink-0" />
                    <span className="truncate">Upload Spreadsheet (.csv file)</span>
                  </button>
                </div>

                <div className="mt-3 bg-red-50 border border-red-200 rounded-md p-3.5 flex items-start gap-2.5 text-red-900 text-xs shadow-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <p className="leading-relaxed">
                    <span className="font-semibold">Warning:</span> If you upload <Tag color="blue">Format A</Tag> and choose to <strong>Overwrite</strong> an existing product type, its existing Schedules, Milestones, and Procurement Lead Times will be <strong>permanently deleted</strong>. Uploading <Tag color="purple">Format B</Tag> will safely overwrite all matching data.
                  </p>
                </div>
              </div>
            } 
            // We omit the right-hand action prop entirely here so it takes up the full width
          />

        </div>
      )}    
    </div>
  );
}

// --- SUB-COMPONENTS ---

function ActionRow({ description, action }) {
  return (
    // Changed to a responsive flexbox: Stacks on mobile, forms a row on large screens
    <div className="flex flex-col lg:flex-row lg:items-start xl:items-center justify-between gap-4 lg:gap-8 border-t border-gray-100 pt-5">
      <div className="text-sm text-gray-800 flex-1">
        {description}
      </div>
      {action && (
        <div className="shrink-0 flex justify-start lg:justify-end w-full lg:w-auto mt-2 lg:mt-0">
          {action}
        </div>
      )}
    </div>
  );
}

function Tag({ color, children }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200'
  };
  return (
    <span className={`inline-block border text-[9px] font-bold px-1.5 py-0 rounded uppercase tracking-wide ${colors[color]}`}>
      {children}
    </span>
  );
}