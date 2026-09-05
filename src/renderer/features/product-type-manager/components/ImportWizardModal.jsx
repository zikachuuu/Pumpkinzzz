import React, { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import { Layers, AlertTriangle, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import * as db from '../../../utils/db';
import BomMergeResolver from './BomMergeResolver'; 
import ScheduleMergeResolver from './ScheduleMergeResolver';
import { commitFormatA, commitFormatB } from '../services/importDbService';

export default function ImportWizardModal({ isOpen, onClose, importPayload, existingProductTypes, triggerAlert, onSuccess }) {
    const [step, setStep] = useState(1);
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);

    // Analyze conflicts when the modal opens with a new payload
    useEffect(() => {
        if (isOpen && importPayload) {
        analyzeData(importPayload);
        } else {
        setStep(1);
        setAnalysis(null);
        }
    }, [isOpen, importPayload]);

    const analyzeData = async (payload) => {
        setLoading(true);
        const { format, parsedProductTypes } = payload;
        
        const newPts = [];
        const conflictPts = [];
        const hardRejectedPts = []; // Used for Format B BOM mismatches

        for (const importedPt of parsedProductTypes) {
        const existingPt = existingProductTypes.find(e => e.name.toLowerCase() === importedPt.name.toLowerCase());
        
        if (!existingPt) {
            newPts.push(importedPt);
            continue;
        }

        // If it exists, fetch its current BOM from DB to check for mismatches
        const existingBOM = await db.getAttachedComponents(existingPt.id);
        const existingCompNames = existingBOM.map(c => c.name.toLowerCase()).sort();
        const importedCompNames = [...importedPt.components].map(c => c.toLowerCase()).sort();
        
        const isBomExactMatch = JSON.stringify(existingCompNames) === JSON.stringify(importedCompNames);

        if (format === 'B' && !isBomExactMatch) {
            // Format B Strict Check: Reject immediately if BOM doesn't match perfectly
            hardRejectedPts.push({ ...importedPt, existingPt });
        } else {
            // Format A goes to BOM resolver; Format B (with matching BOM) goes to Schedule resolver
            conflictPts.push({ ...importedPt, existingPt, isBomExactMatch, existingBOM });
        }
        }

        setAnalysis({ format, newPts, conflictPts, hardRejectedPts });
        setLoading(false);
    };

    if (!isOpen || !importPayload) return null;

    const handleCommit = async (resolutions) => {
        setLoading(true);
        try {
        if (analysis.format === 'A') {
            await commitFormatA(analysis, resolutions);
        } else {
            await commitFormatB(analysis, resolutions, importPayload.headers);
        }
        triggerAlert('success', 'Spreadsheet imported and merged successfully!');
        onSuccess(); // Refresh the UI behind the modal
        onClose(); // Close the modal
        } catch (err) {
        triggerAlert('error', `Import failed: ${err.message}`);
        setLoading(false);
        }
    };

    // Render Step 1: The Analysis Summary
    const renderSummaryStep = () => {
        if (loading || !analysis) return <div className="p-8 text-center text-gray-500">Analyzing spreadsheet data...</div>;

        const { format, newPts, conflictPts, hardRejectedPts } = analysis;
        const totalProcessed = newPts.length + conflictPts.length + hardRejectedPts.length;

        return (
        <div className="space-y-6">
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg flex items-start gap-4">
            <Layers className="w-6 h-6 text-indigo-600 shrink-0 mt-0.5" />
            <div>
                <h3 className="font-bold text-indigo-900">Format {format} Detected</h3>
                <p className="text-sm text-indigo-800 mt-1">
                Successfully parsed <strong>{totalProcessed}</strong> product types from the spreadsheet.
                {format === 'A' ? ' Entering Bill of Materials (BOM) merge mode.' : ' Entering Schedule configuration merge mode.'}
                </p>
            </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
            <div className="border border-emerald-200 bg-emerald-50 rounded-lg p-4 text-center">
                <span className="block text-2xl font-black text-emerald-700">{newPts.length}</span>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">New (Safe)</span>
            </div>
            <div className="border border-amber-200 bg-amber-50 rounded-lg p-4 text-center">
                <span className="block text-2xl font-black text-amber-700">{conflictPts.length}</span>
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Conflicts</span>
            </div>
            <div className="border border-red-200 bg-red-50 rounded-lg p-4 text-center">
                <span className="block text-2xl font-black text-red-700">{hardRejectedPts.length}</span>
                <span className="text-xs font-bold text-red-800 uppercase tracking-wider">Rejected</span>
            </div>
            </div>

            {hardRejectedPts.length > 0 && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-sm text-red-900">
                <div className="flex items-center gap-2 font-bold mb-2">
                <XCircle className="w-4 h-4 text-red-600" />
                <span>Format B Constraint Violation</span>
                </div>
                <p className="mb-2">
                The following product types were skipped because their imported BOM does not perfectly match the database. 
                <strong> You cannot import schedules if the BOM does not match.</strong>
                </p>
                <ul className="list-disc list-inside text-xs font-semibold ml-2">
                {hardRejectedPts.map(pt => <li key={pt.name}>{pt.name}</li>)}
                </ul>
            </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
                Cancel Import
            </button>
            
            <button 
                onClick={() => setStep(2)}
                disabled={newPts.length === 0 && conflictPts.length === 0}
                className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
                <span>Proceed to Resolution</span>
                <ArrowRight className="w-4 h-4" />
            </button>
            </div>
        </div>
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Universal Import Wizard" maxWidth={step === 1 ? "max-w-2xl" : "max-w-4xl"}>
        {step === 1 && renderSummaryStep()}
        
        {step === 2 && analysis.format === 'A' && (
            <BomMergeResolver 
            conflictPts={analysis.conflictPts}
            newPts={analysis.newPts}
            onCancel={onClose}
            onConfirm={handleCommit} // 👈 UPDATED
            />
        )}

        {step === 2 && analysis.format === 'B' && (
            <ScheduleMergeResolver 
            conflictPts={analysis.conflictPts}
            newPts={analysis.newPts}
            importPayload={importPayload}
            onCancel={onClose}
            onConfirm={handleCommit} // 👈 UPDATED
            />
        )}       
      </Modal>
    );
}