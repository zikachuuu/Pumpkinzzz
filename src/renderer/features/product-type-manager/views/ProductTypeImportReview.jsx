import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * This component renders a review interface for CSV imports of product types. 
 * It displays new and existing product types detected in the uploaded CSV, allowing users to make decisions on whether to keep existing data or import new data. 
 * The component also provides information about the import mode (partial or full) and any potential data loss warnings.
 * 
 * Props:
 * - importReview: Object containing the review data for the CSV import
 * - loading: Boolean indicating if the component is currently loading
 * - onSetDecisionForAll: Function to set the decision for all rows
 * - onSetDecision: Function to set the decision for a specific row
 * - onCancel: Function to cancel the import
 * - onConfirm: Function to confirm the import
 * 
 * The component uses a ReviewTable subcomponent to display the new and existing product types, along with their imported data and decision options.
 * 
 * @param {Object} props - The component props
 * @param {Object} props.importReview - The review data for the CSV import
 * @param {boolean} props.loading - Whether the component is currently loading
 * @param {Function} props.onSetDecisionForAll - Function to set the decision for all rows
 * @param {Function} props.onSetDecision - Function to set the decision for a specific row
 * @param {Function} props.onCancel - Function to cancel the import
 * @param {Function} props.onConfirm - Function to confirm the import
 * 
 * @returns {JSX.Element} The rendered component
 */

export default function ProductTypeImportReview({ importReview, loading, onSetDecisionForAll, onSetDecision, onCancel, onConfirm }) {
  const newRows = importReview.rows.filter(row => !row.existing);
  const existingRows = importReview.rows.filter(row => row.existing);

  const renderRows = rows => rows.map(row => {
    const importedData = importReview.mode === 'partial'
      ? [...new Set(row.rows.flatMap(sourceRow => (sourceRow[importReview.componentIndex] || '').split(';').map(name => name.trim()).filter(Boolean)))].join(', ') || 'No components'
      : `${new Set(row.rows.map(sourceRow => sourceRow[importReview.headers.indexOf('schedule name')]).filter(Boolean)).size} schedule(s)`;

    return (
      <tr key={row.name} className="border-t border-gray-100">
        <td className="px-4 py-3 font-semibold text-gray-900">{row.name}</td>
        <td className="px-4 py-3 text-xs text-gray-500">{importedData}</td>
        <td className="px-4 py-3 text-right">
          {row.existing ? (
            <select
              value={row.decision}
              onChange={event => onSetDecision(row.name, event.target.value)}
              className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs font-semibold text-gray-700 focus:border-indigo-500 focus:outline-none"
            >
              <option value="keep-existing">Keep existing</option>
              <option value="import">Keep imported</option>
            </select>
          ) : (
            <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">WILL BE ADDED</span>
          )}
        </td>
      </tr>
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Confirm CSV Import</h2>
          <p className="mt-1 text-sm text-gray-500">Review the product types detected in the uploaded CSV before anything is changed.</p>
        </div>
        {existingRows.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => onSetDecisionForAll('keep-existing')} className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">Keep all existing</button>
            <button onClick={() => onSetDecisionForAll('import')} className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100">Keep all imported</button>
          </div>
        )}
      </div>

      {importReview.mode === 'partial' ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-5 text-amber-950">
          <div className="flex items-center gap-2 font-bold"><AlertCircle className="h-5 w-5" /><span>Partial CSV import</span></div>
          <p className="mt-2 text-sm">This CSV contains only product type names and components. New product types will be created as INVALID with no schedules. Choosing Keep imported for an existing product type removes its schedules, milestones, and procurement lead times, then imports the listed components.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-5 text-indigo-950">
          <div className="flex items-center gap-2 font-bold"><CheckCircle2 className="h-5 w-5" /><span>Full CSV import</span></div>
          <p className="mt-2 text-sm">This CSV contains schedules, milestones, components, and procurement lead times. New product types receive the complete imported configuration. Choosing Keep imported replaces the existing configuration and restores the imported product type status.</p>
        </div>
      )}

      <ReviewTable title="New Product Types from the CSV Uploaded" description="These names do not currently exist and can be added without conflict." rows={newRows} headerClass="border-gray-100" tableClass="bg-gray-50" renderRows={renderRows} emptyText="No new product types found." />
      <ReviewTable title="Existing Product Types" description="Choose to keep the existing product type or replace it with the imported data." rows={existingRows} headerClass="border-amber-100" tableClass="bg-amber-50" renderRows={renderRows} emptyText="No existing product type conflicts found." warning="If the imported data only contains product type name and components, existing milestones and procurement lead times will be LOST!" />

      <div className="flex justify-end gap-3">
        <button onClick={onCancel} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel import</button>
        <button onClick={onConfirm} disabled={loading} className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300">{loading ? 'Importing...' : 'Confirm import'}</button>
      </div>
    </div>
  );
}

function ReviewTable({ title, description, rows, headerClass, tableClass, renderRows, emptyText, warning }) {
  return (
    <div className={`rounded-lg border ${headerClass === 'border-amber-100' ? 'border-amber-200' : 'border-gray-200'} bg-white shadow-sm`}>
      <div className={`border-b px-6 py-4 ${headerClass}`}>
        <h3 className="font-bold text-gray-900">{title}</h3>
        <p className="mt-1 text-xs text-gray-500">{description}</p>
        {warning && <p className="mt-1 text-xs font-semibold text-red-700">{warning}</p>}
      </div>
      {rows.length === 0 ? <p className="px-6 py-8 text-center text-sm text-gray-400">{emptyText}</p> : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className={`text-xs font-bold uppercase text-gray-500 ${tableClass}`}><tr><th className="px-4 py-3">Product type</th><th className="px-4 py-3">Imported data</th><th className="px-4 py-3 text-right">Decision</th></tr></thead>
            <tbody>{renderRows(rows)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
