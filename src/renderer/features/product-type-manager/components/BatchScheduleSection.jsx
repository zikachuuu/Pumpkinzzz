import React from 'react';
import { ChevronDown, ChevronUp, Download, Upload, Check } from 'lucide-react';
import Tag from '../../../components/ui/Tag';

export default function BatchScheduleSection({ 
  open, 
  onToggle, 
  onExportBomOnly, 
  onOpenExportFullModal, 
  onImport 
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm transition-all mb-6">
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
        className="flex cursor-pointer items-start justify-between gap-4 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <div className="flex-1 pr-4">
          <h2 className="font-bold text-gray-900 text-md mb-3 border-b border-gray-100 pb-3">
            Import / Export Product Type Details with Spreadsheet (.csv file)
          </h2>
          <p className="text-sm text-gray-800 mt-3">
            Import or export the details of this product type (Schedule, Milestones, BOM, Procurement Lead Time) using spreadsheet (.csv file). 
          </p>
        </div>
        <div className="pt-1">
          {open ? <ChevronUp className="h-5 w-5 shrink-0 text-gray-500" /> : <ChevronDown className="h-5 w-5 shrink-0 text-gray-500" />}
        </div>
      </div>
      
      {open && (
        <div className="mt-6 space-y-5 lg:ml-8" onClick={e => e.stopPropagation()}>
          
          <ActionRow 
            description={
              <>
                <p className="mb-2 font-semibold text-gray-900 flex flex-wrap items-center gap-2">
                  Export Bill of Materials (BOM) ONLY 
                  <Tag color="pink">Format C</Tag>
                </p>
                <p className="text-sm text-gray-800 mb-3">
                  Downloads a spreadsheet (.csv file) containing only the list of components for this product type.
                </p>
              </>
            } 
            action={
              <button onClick={onExportBomOnly} className="flex justify-center items-center w-full lg:w-[380px] xl:w-[420px] space-x-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-semibold bg-white transition shadow-sm">
                <Download className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="truncate">Export BOM ONLY (.csv file)</span>
              </button>
            } 
          />

          <ActionRow 
            description={
              <>
                <p className="mb-2 font-semibold text-gray-900 flex flex-wrap items-center gap-2">
                  Export Schedules, Milestones, BOM, and Procurement Lead Time
                  <Tag color="indigo">Format D</Tag>
                </p>  
                <p className="text-sm text-gray-800 mb-3">
                  Downloads a spreadsheet (.csv file) containing all the details of this product type, including Schedules, Milestones, BOM, and Procurement Lead Time.
                </p>
                <p className="text-sm text-gray-800 mb-2">
                  Choose which schedules (and corresponding Procurement Lead Time) to include in the export. BOM will always be included.
                </p>
              </>
            } 
            action={
              <button onClick={onOpenExportFullModal} className="flex justify-center items-center w-full lg:w-[380px] xl:w-[420px] space-x-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-semibold bg-white transition shadow-sm">
                <Download className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="truncate">Export ALL Details (.csv file)</span>
              </button>
            } 
          />

          <ActionRow 
            description={
              <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <p className="mb-3 font-bold text-gray-900">
                      Upload Spreadsheet (.csv file) / Import Product Type Details
                    </p>
                    <ul className="space-y-3 text-sm text-gray-800">
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                        <span><span className="font-semibold">Both Format Supported:</span> You can upload either <Tag color="pink">Format C</Tag> or <Tag color="indigo">Format D</Tag>.</span>
                        <span><span className="font-semibold"></span> The uploaded file must be in CSV format.</span>
                      </li>
                    </ul>

                    <p className="mb-3 mt-4 font-semibold text-gray-900">
                      When Importing BOM ONLY - <Tag color="pink">Format C</Tag>
                    </p>

                    <ul className="space-y-3 text-sm text-gray-800 mb-2 ml-2">
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                        <span><span className="font-semibold">New Component: </span>Will be attached to the product type.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                        <span><span className="font-semibold">Existing Component: </span>Choose to either <span className="font-semibold">Keep Current</span> or <span className="font-semibold">Reject</span>.</span>
                      </li>                    
                    </ul>
                    <span className="text-xs text-gray-500 ml-1">(If the component does not exist in the database, it will be created.)</span>

                    <p className="mb-3 mt-4 font-semibold text-gray-900">
                      When Importing ALL Details - <Tag color="indigo">Format D</Tag>
                    </p>
                    
                    <ul className="space-y-3 text-sm text-gray-800 mb-2 ml-2">
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                        <span><span className="font-semibold">New Schedule: </span>Will be attached to the product type.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                        <span><span className="font-semibold">Existing Schedule: </span>Choose to either <span className="font-semibold">Keep Current</span> or <span className="font-semibold">Overwrite</span>.</span>
                      </li>
                    </ul>
                  </div>

                  <button onClick={onImport} className="flex items-center justify-center w-full lg:w-[355px] xl:w-[395px] space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-sm transition lg:shrink-0">
                    <Upload className="w-4 h-4 shrink-0" />
                    <span className="truncate">Upload Spreadsheet (.csv file)</span>
                  </button>
                </div>
              </div>
            } 
          />

        </div>
      )}    
    </div>
  );
}

function ActionRow({ description, action }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-start xl:items-center justify-between gap-4 lg:gap-8 border-t border-gray-100 pt-5">
      <div className="text-sm text-gray-800 flex-1">{description}</div>
      {action && <div className="shrink-0 flex justify-start lg:justify-end w-full lg:w-auto mt-2 lg:mt-0">{action}</div>}
    </div>
  );
}

