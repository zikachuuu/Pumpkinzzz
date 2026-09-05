import React from 'react';
import { ChevronDown, ChevronUp, Download, Upload, Check } from 'lucide-react';

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
            Import / Export Product Type Data with Spreadsheet (.csv file)
          </h2>
          <p className="text-sm text-gray-800 mt-3">
            Back up your configuration or rapidly configure complex project timelines using a spreadsheet (.csv file).
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
                  <Tag color="blue">Format A</Tag>
                </p>
                <p className="text-sm text-gray-800 mb-1">Downloads a blank 2-column spreadsheet (.csv file) template containing just the Product Type name and its attached components.</p>
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
                  Export BOM + Schedules, Milestones & Procurement 
                  <Tag color="purple">Format B</Tag>
                </p>  
                <p className="text-sm text-gray-800 mb-1">
                  Downloads a full spreadsheet (.csv file). You will be prompted to select which specific schedules you want to include in the export.
                </p>
              </>
            } 
            action={
              <button onClick={onOpenExportFullModal} className="flex justify-center items-center w-full lg:w-[380px] xl:w-[420px] space-x-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-semibold bg-white transition shadow-sm">
                <Download className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="truncate">Export BOM + Schedules Data (.csv file)</span>
              </button>
            } 
          />

          <ActionRow 
            description={
              <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <p className="mb-3 font-bold text-gray-900">
                      Universal Import / Merge Configuration
                    </p>
                    <ul className="space-y-3 text-sm text-gray-800">
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                        <span><span className="font-semibold">Universal:</span> Upload either <Tag color="blue">Format A</Tag> or <Tag color="purple">Format B</Tag>.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                        <span><span className="font-semibold">Merge Conflict Resolution:</span> Compare existing vs. new components side-by-side. Choose to keep or reject conflicting schedules safely.</span>
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

function Tag({ color, children }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200'
  };
  return <span className={`inline-block border text-[9px] font-bold px-1.5 py-0 rounded uppercase tracking-wide ${colors[color]}`}>{children}</span>;
}