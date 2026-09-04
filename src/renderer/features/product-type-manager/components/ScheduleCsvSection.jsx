import React from 'react';
import { ChevronDown, ChevronUp, Download, Upload, AlertTriangle, Check } from 'lucide-react';

export default function ScheduleCsvSection({ 
  open, 
  onToggle, 
  onDownloadTemplate, 
  onExportSchedules, 
  onExportMilestones, 
  onImport 
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm transition-all mb-6">
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
        aria-controls="schedule-csv-options"
      >
        <div className="flex-1 pr-4">
          <h2 className="font-bold text-gray-900 text-md mb-3 border-b border-gray-100 pb-3">
            Batch Schedule & Milestone Management with Spreadsheet (.csv file)
          </h2>
          <p className="text-sm text-gray-800 mt-3">
            Need to configure complex project timelines? You can quickly build and apply Schedules, Milestones, and Procurement Lead Times to this product type using a spreadsheet (.csv file).
          </p>
        </div>
        <div className="pt-1">
          {open ? <ChevronUp className="h-5 w-5 shrink-0 text-gray-500" /> : <ChevronDown className="h-5 w-5 shrink-0 text-gray-500" />}
        </div>
      </div>
      
      {open && (
        <div id="schedule-csv-options" className="mt-6 space-y-5 lg:ml-8" onClick={event => event.stopPropagation()}>
          
          <ActionRow 
            description={
              <>
                <p className="mb-2 font-semibold text-gray-900">
                  Download a blank spreadsheet template (.csv file) containing the required headers.
                </p>
                <ul className="list-disc list-inside text-sm text-gray-800 mb-2 ml-2 space-y-1">
                  <li>Schedule Name</li>
                  <li>Milestone configurations (Name, Anchor, Offset)</li>
                  <li>Component Lead Time configurations</li>
                </ul>
              </>
            } 
            action={
              <button onClick={onDownloadTemplate} className="flex justify-center items-center w-full lg:w-[380px] xl:w-[420px] space-x-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-semibold bg-white transition shadow-sm">
                <Download className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="truncate">Download Spreadsheet Template (.csv file)</span>
              </button>
            } 
          />

          <ActionRow 
            description={
              <>
                <p className="mb-2 font-semibold text-gray-900">
                  Export ALL existing Schedules, Milestones, and Procurement Lead Times for this specific product type as a spreadsheet (.csv file).
                </p>  
                <p className="text-sm text-gray-800 mb-2 ml-2">
                  Useful for backing up this configuration or copying it to modify for another product type.
                </p>
              </>
            } 
            action={
              <button onClick={onExportSchedules} className="flex justify-center items-center w-full lg:w-[380px] xl:w-[420px] space-x-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-semibold bg-white transition shadow-sm">
                <Download className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="truncate">Export Schedules & ALL Data (.csv file)</span>
              </button>
            } 
          />

          <ActionRow 
            description={
              <>
                <p className="mb-2 font-semibold text-gray-900">
                  Export Milestones ONLY for this specific product type.
                </p>
                <p className="text-sm text-gray-800 mb-2 ml-2">
                  Excludes component lead time configurations.
                </p>
              </>
            } 
            action={
              <button onClick={onExportMilestones} className="flex justify-center items-center w-full lg:w-[380px] xl:w-[420px] space-x-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-semibold bg-white transition shadow-sm">
                <Download className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="truncate">Export Milestones ONLY (.csv file)</span>
              </button>
            } 
          />

          <ActionRow 
            description={
              <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <p className="mb-3 font-bold text-gray-900 flex flex-wrap items-center gap-2">
                      Upload Spreadsheet (.csv file) / Import Configurations
                    </p>
                    <ul className="space-y-3 text-sm text-gray-800 mb-2">
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                        <span><span className="font-semibold">New Data:</span> Unrecognized schedules, milestones, and components will be created automatically.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                        <span><span className="font-semibold">Existing Data:</span> If an imported schedule/milestone matches an existing one, its configuration (e.g. offsets, anchors) will be <strong>overwritten</strong>.</span>
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
                    <span className="font-semibold">Note:</span> This action only updates the currently selected Product Type. It will not delete existing configurations that are omitted from your spreadsheet.
                  </p>
                </div>
              </div>
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