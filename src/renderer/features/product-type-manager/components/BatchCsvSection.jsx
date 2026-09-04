import React from 'react';
import { ChevronDown, ChevronUp, Download, Upload } from 'lucide-react';
import StatusBadge from '../../../components/ui/StatusBadge';

export default function BatchCsvSection({ open, onToggle, onDownloadPtTemplate, onImport, onExportFull, onExportPartial }) {
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
        <div id="batch-csv-options" className="mt-6 space-y-4 ml-8" onClick={event => event.stopPropagation()}>
          
          <ActionRow 
            description={
              <>
                <p className="mb-1">Download a blank spreadsheet template (.csv file), with only 2 columns:</p>
                <ul className="list-disc list-inside text-sm text-gray-800 mb-1 ml-4 space-y-1">
                  <li>Product Type</li>
                  <li>Attached Components (i.e. BOM; semi-colon (";") separated)</li>
                </ul>
                <p className="mb-1">Product types imported using this template will have status <StatusBadge status="invalid" /></p>
              </>
            } 
            action={
              <button onClick={onDownloadPtTemplate} className="flex justify-center items-center space-x-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-semibold bg-white transition shadow-sm">
                <Download className="w-4 h-4 text-gray-500" />
                <span>Download Spreadsheet Template (.csv file)</span>
              </button>
            } 
          />

          <ActionRow 
            description={
              <>
                <p className="mb-1">Export all existing product types and ALL associated data, including:</p>  
                <ul className="list-disc list-inside text-sm text-gray-800 mb-1 ml-4 space-y-1">
                  <li>All Schedules and corresponding Milestones</li>
                  <li>BOM</li>
                  <li>Procurement Lead Times of all Schedules</li>
                </ul>
                <p className="mb-1">Product types imported using this file will retain their current status (<StatusBadge status="valid"/>, <StatusBadge status="sub-valid"/>, or <StatusBadge status="invalid" />).</p>
              </>
            } 
            action={
              <button onClick={onExportFull} className="flex justify-center items-center space-x-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-semibold bg-white transition shadow-sm">
                <Download className="w-4 h-4 text-gray-500" />
                <span>Export Existing Product Types and ALL Data as Spreadsheet (.csv file)</span>
              </button>
            } 
          />

          <ActionRow 
            description={
              <>
                <p className="mb-1">Export existing product types and BOM only.</p>
                <p className="mb-1">Product types imported using this file will have status <StatusBadge status="invalid" /></p>
              </>
            } 
            action={
              <button onClick={onExportPartial} className="flex justify-center items-center space-x-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-semibold bg-white transition shadow-sm">
                <Download className="w-4 h-4 text-gray-500" />
                <span>Export Existing Product Types and BOM ONLY as Spreadsheet (.csv file)</span>
              </button>
            } 
          />

          <ActionRow 
            description={
              <>
                <p className="mb-1">Import product types from a valid CSV file.</p>
                <p className="mb-1">Product types that do not currently exist will be created.</p>
                <p className="mb-1">Product types that already exist may be overwritten. <span className="text-red-700 font-semibold">(Existing Schedules, Milestones and Procurement Lead Times may be deleted!)</span></p>
              </>
            } 
            action={
              <button onClick={onImport} className="flex justify-center items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-sm transition">
                <Upload className="w-4 h-4" />
                <span>Upload Spreadsheet (.csv file) / Import Product Types</span>
              </button>
            } 
          />

        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENTS ---

function ActionRow({ description, action }) {
  return (
    <div className="flex items-center justify-between gap-6 border-t border-gray-100 pt-4">
      <div className="text-sm text-gray-800 flex-1">
        {description}
      </div>
      <div className="shrink-0 flex justify-end">
        {action}
      </div>
    </div>
  );
}
