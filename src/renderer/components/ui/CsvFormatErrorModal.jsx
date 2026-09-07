import React from 'react';
import { Check, X } from 'lucide-react';
import Modal from './Modal';

export default function CsvFormatErrorModal({ 
  isOpen, 
  onClose, 
  uploadedHeaders = [], 
  expectedHeaders = [] 
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Wrong Spreadsheet Format Uploaded" maxWidth="max-w-3xl">
      <div className="space-y-4">
        <p className="text-sm text-gray-700">
          The spreadsheet you uploaded is missing required columns or contains unrecognized headers. Please ensure your file matches the exact template format.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-inner">
          {/* Uploaded List */}
          <div>
            <h4 className="font-bold text-xs text-gray-500 uppercase mb-3">Columns You Uploaded:</h4>
            <ul className="text-xs space-y-2 font-medium">
              {uploadedHeaders.length === 0 ? (
                <li className="text-gray-400 italic">No headers found</li>
              ) : (
                uploadedHeaders.map((h, i) => {
                  const isRecognized = expectedHeaders.map(req => req.toLowerCase()).includes(h.toLowerCase());
                  return (
                    <li key={i} className={`flex items-start space-x-2 ${isRecognized ? "text-gray-600" : "text-red-600"}`}>
                      {!isRecognized && <X className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
                      {isRecognized && <Check className="w-3.5 h-3.5 mt-0.5 text-emerald-500 shrink-0" />}
                      <span className="leading-tight">{h || '[Empty Column]'} {!isRecognized && '(Unrecognized)'}</span>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
          
          {/* Required List */}
          <div>
            <h4 className="font-bold text-xs text-gray-500 uppercase mb-3">Required Format:</h4>
            <ul className="text-xs space-y-2 font-medium">
              {expectedHeaders.map((h, i) => {
                const isPresent = uploadedHeaders.map(up => up.toLowerCase()).includes(h.toLowerCase());
                return (
                  <li key={i} className={`flex items-start space-x-2 ${isPresent ? "text-gray-600" : "text-red-600"}`}>
                    {!isPresent && <X className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
                    {isPresent && <Check className="w-3.5 h-3.5 mt-0.5 text-emerald-500 shrink-0" />}
                    <span className="leading-tight">{h} {!isPresent && '(Missing)'}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="flex justify-end pt-4 mt-2">
          <button 
            onClick={onClose} 
            className="px-8 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 shadow-sm transition"
          >
            OK
          </button>
        </div>
      </div>
    </Modal>
  );
}