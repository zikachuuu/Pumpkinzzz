import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Check, AlertCircle } from 'lucide-react';
import * as db from '../../../utils/db';
import { formatDate } from '../../../utils/date';

// --- INLINE DATE INPUT CELL (PORTED FROM TRACKER) ---
function DateInputCell({ initialValue, onSave, hasErr, dateFormat }) {
  const [value, setValue] = useState(initialValue || '');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => { setValue(initialValue || ''); }, [initialValue]);

  const handleBlur = () => {
    setIsEditing(false);
    if (value !== (initialValue || '')) onSave(value);
  };

  if (isEditing) {
    return (
      <input
        type="date"
        value={value}
        autoFocus
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        className={`w-full px-2 py-1.5 border rounded focus:outline-none text-[11px] ${hasErr ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-gray-200 focus:border-indigo-500'}`}
      />
    );
  }

  return (
    <div
      tabIndex={0}
      onClick={() => setIsEditing(true)}
      onFocus={() => setIsEditing(true)}
      className={`w-full px-2 py-1.5 border rounded text-[11px] cursor-text transition-colors flex items-center min-h-[28px] ${
        hasErr ? 'border-red-500 bg-red-50 text-red-900' : (value ? 'border-gray-300 text-gray-700 bg-gray-50 hover:bg-gray-100' : 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50')
      }`}
    >
      <span className={!value ? 'text-gray-400' : ''}>{value ? formatDate(value, dateFormat) : 'YYYY-MM-DD'}</span>
    </div>
  );
}

// --- MAIN BULK COMPONENT ---
export default function BulkRegistrySpreadsheet({ 
  initialCsvData, onClose, onSuccess, triggerAlert, 
  productTypes, existingProjects, allSchedules, scheduleValidationMap, dateFormat
}) {
  const [bulkRows, setBulkRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const headers = initialCsvData[0].map(h => h.trim().toLowerCase());
    
    const colIdx = {
      tag_no: headers.indexOf('tag no'), description: headers.indexOf('description'),
      product_type: headers.indexOf('product type'), schedule_name: headers.indexOf('schedule name'),
      customer: headers.indexOf('customer'), contract_no: headers.indexOf('contract no'),
      sales_ref: headers.indexOf('sales ref'), pm_owner: headers.indexOf('pm owner'),
      engineer_owner: headers.indexOf('engineer owner'), procurement_owner: headers.indexOf('procurement owner'),
      production_owner: headers.indexOf('production owner'), fat_owner: headers.indexOf('fat owner'),
      contract_signed_date: headers.indexOf('contract signed date'), ros_date: headers.indexOf('ros date'),
      notes: headers.indexOf('notes')
    };

    const rows = [];
    for (let i = 1; i < initialCsvData.length; i++) {
      const r = initialCsvData[i];
      if (r.length < 5) continue; 
      const tagVal = colIdx.tag_no !== -1 && r[colIdx.tag_no] ? r[colIdx.tag_no].trim() : '';
      if (!tagVal) continue;

      rows.push({
        tempId: i,
        tag_no: tagVal,
        description: colIdx.description !== -1 && r[colIdx.description] ? r[colIdx.description].trim() : '',
        product_type_name: colIdx.product_type !== -1 && r[colIdx.product_type] ? r[colIdx.product_type].trim() : '',
        schedule_name: colIdx.schedule_name !== -1 && r[colIdx.schedule_name] ? r[colIdx.schedule_name].trim() : '',
        customer: colIdx.customer !== -1 && r[colIdx.customer] ? r[colIdx.customer].trim() : '',
        contract_no: colIdx.contract_no !== -1 && r[colIdx.contract_no] ? r[colIdx.contract_no].trim() : '',
        sales_ref: colIdx.sales_ref !== -1 && r[colIdx.sales_ref] ? r[colIdx.sales_ref].trim() : '',
        pm_owner: colIdx.pm_owner !== -1 && r[colIdx.pm_owner] ? r[colIdx.pm_owner].trim() : '',
        engineer_owner: colIdx.engineer_owner !== -1 && r[colIdx.engineer_owner] ? r[colIdx.engineer_owner].trim() : '',
        procurement_owner: colIdx.procurement_owner !== -1 && r[colIdx.procurement_owner] ? r[colIdx.procurement_owner].trim() : '',
        production_owner: colIdx.production_owner !== -1 && r[colIdx.production_owner] ? r[colIdx.production_owner].trim() : '',
        fat_owner: colIdx.fat_owner !== -1 && r[colIdx.fat_owner] ? r[colIdx.fat_owner].trim() : '',
        contract_signed_date: colIdx.contract_signed_date !== -1 && r[colIdx.contract_signed_date] ? r[colIdx.contract_signed_date].trim() : '',
        ros_date: colIdx.ros_date !== -1 && r[colIdx.ros_date] ? r[colIdx.ros_date].trim() : '',
        notes: colIdx.notes !== -1 && r[colIdx.notes] ? r[colIdx.notes].trim() : '',
        selected: true
      });
    }
    
    setBulkRows(validateBulkRows(rows));
  }, []);

  // Strict Immutable Validation mapped perfectly to requested error states
  const validateBulkRows = (rows) => {
    const activeTags = rows.filter(r => r.selected).map(r => r.tag_no.toLowerCase());
    const dateRegex = /^(?:\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4})$/;

    return rows.map(r => {
      const errs = {};

      // Tag No Validation
      if (!r.tag_no) errs.tag_no = 'Required Field is Empty';
      else if (activeTags.filter(t => t === r.tag_no.toLowerCase()).length > 1) errs.tag_no = 'Duplicate Tag No in Spreadsheet';
      else if (existingProjects.some(p => p.tag_no.toLowerCase() === r.tag_no.toLowerCase())) errs.tag_no = 'Tag No exists in Database';

      // Required Standard Fields
      const requiredFields = ['customer', 'contract_no', 'sales_ref', 'pm_owner', 'engineer_owner', 'procurement_owner', 'production_owner', 'fat_owner'];
      requiredFields.forEach(field => {
        if (!r[field]) errs[field] = 'Required Field is Empty';
      });

      // Product Type Validation
      let matchedPt = null;
      if (!r.product_type_name) errs.product_type_name = 'Required Field is Empty';
      else {
        matchedPt = productTypes.find(pt => pt.name.toLowerCase() === r.product_type_name.toLowerCase());
        if (!matchedPt) errs.product_type_name = 'Product Type does not exist';
        else if (matchedPt.status === 'invalid') errs.product_type_name = 'Product Type has status INVALID';
      }

      // Schedule Name Validation
      if (!r.schedule_name) errs.schedule_name = 'Required Field is Empty';
      else if (!matchedPt) errs.schedule_name = 'Product Type does not exist'; // Cascade error
      else {
        const matchedSched = (allSchedules[matchedPt.id] || []).find(s => s.name.toLowerCase() === r.schedule_name.toLowerCase());
        if (!matchedSched) errs.schedule_name = 'Schedule does not exist';
        else if (!scheduleValidationMap[matchedSched.id]) errs.schedule_name = 'Schedule is incomplete (No Procurement)';
      }

      // Date Validation
      if (!r.contract_signed_date) errs.contract_signed_date = 'Required Field is Empty';
      else if (!dateRegex.test(r.contract_signed_date)) errs.contract_signed_date = 'Invalid Date Format';

      if (!r.ros_date) errs.ros_date = 'Required Field is Empty';
      else if (!dateRegex.test(r.ros_date)) errs.ros_date = 'Invalid Date Format';

      // Fallback (Though our specific rules catch everything)
      if (Object.keys(errs).length === 0 && r.errors && r.errors.general) errs.general = 'Some Error Occurred';

      return { ...r, errors: errs };
    });
  };

  // Safe mutation handler triggering instant re-validation
  const handleBulkCellChange = (tempId, field, value) => {
    const updated = bulkRows.map(r => r.tempId === tempId ? { ...r, [field]: value } : r);
    setBulkRows(validateBulkRows(updated));
  };

  const handleRowSelectToggle = (tempId) => {
    const updated = bulkRows.map(r => r.tempId === tempId ? { ...r, selected: !r.selected } : r);
    setBulkRows(validateBulkRows(updated));
  };

  const handleDeleteSelected = () => {
    const updated = bulkRows.filter(r => !r.selected);
    setBulkRows(validateBulkRows(updated));
  };

  const handleBulkConfirm = async () => {
    const selectedRows = bulkRows.filter(r => r.selected);
    if (selectedRows.length === 0) return triggerAlert('error', 'No rows selected.');
    if (selectedRows.some(r => Object.keys(r.errors).length > 0)) return triggerAlert('error', 'Resolve all highlighted errors first.');

    setLoading(true);
    let successCount = 0;
    try {
      for (const r of selectedRows) {
        const pt = productTypes.find(p => p.name.toLowerCase() === r.product_type_name.toLowerCase());
        const sched = (allSchedules[pt.id] || []).find(s => s.name.toLowerCase() === r.schedule_name.toLowerCase());
        const cleanDate = (d) => d.replace(/\//g, '-');

        await db.addProject({
          tag_no: r.tag_no, description: r.description, product_type_id: pt.id, schedule_id: sched.id,
          customer: r.customer, contract_no: r.contract_no, sales_ref: r.sales_ref, pm_owner: r.pm_owner,
          engineer_owner: r.engineer_owner, procurement_owner: r.procurement_owner, production_owner: r.production_owner,
          fat_owner: r.fat_owner, contract_signed_date: cleanDate(r.contract_signed_date), ros_date: cleanDate(r.ros_date),
          notes: r.notes, actual_dates: '{}'
        });
        successCount++;
      }
      triggerAlert('success', `Successfully registered ${successCount} projects.`);
      onSuccess();
    } catch (err) {
      triggerAlert('error', `Upload failed at row ${successCount + 1}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const selectedCount = bulkRows.filter(r => r.selected).length;
  const hasAnyErrors = bulkRows.filter(r => r.selected).some(r => Object.keys(r.errors).length > 0);

  return (
    <div className="space-y-6 max-w-full">
      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center space-x-4">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Batch Project Registration with Spreadsheet (.csv file)</h2>
            <p className="text-sm text-gray-800 mt-2">
                Review your uploaded spreadsheet and make the neccessary corrections before confirming the upload.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button onClick={handleDeleteSelected} disabled={selectedCount === 0} className="flex items-center space-x-1.5 px-4 py-2 border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50">
            <Trash2 className="w-4 h-4" />
            <span>Delete Selected ({selectedCount})</span>
          </button>
          <button onClick={handleBulkConfirm} disabled={loading || hasAnyErrors} className="flex items-center space-x-2 px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm transition bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed">
            <Check className="w-4 h-4" />
            <span>{loading ? 'Uploading...' : `Confirm Upload (${selectedCount} Rows)`}</span>
          </button>
        </div>
      </div>

      {hasAnyErrors && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs font-semibold flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span>Please fix the inline errors highlighted in red below before uploading.</span>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden w-full">
        <div className="overflow-x-auto w-full custom-scrollbar block">
          <table className="min-w-max divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50 font-bold text-gray-500 text-left">
              <tr>
                <th className="px-4 py-3 text-center sticky left-0 bg-gray-50 z-10 border-r border-gray-100">
                  <input type="checkbox" checked={bulkRows.length > 0 && bulkRows.every(r => r.selected)} onChange={(e) => {
                    setBulkRows(validateBulkRows(bulkRows.map(r => ({ ...r, selected: e.target.checked }))));
                  }} className="rounded text-indigo-600 w-4 h-4" />
                </th>
                <th className="px-3 py-3 w-32 min-w-[130px]">Tag No</th>
                <th className="px-3 py-3 w-40 min-w-[160px]">Description</th>
                <th className="px-3 py-3 w-36 min-w-[140px]">Product Type</th>
                <th className="px-3 py-3 w-36 min-w-[140px]">Schedule Name</th>
                <th className="px-3 py-3 w-32 min-w-[130px]">Customer</th>
                <th className="px-3 py-3 w-28 min-w-[120px]">Contract No</th>
                <th className="px-3 py-3 w-28 min-w-[120px]">Sales Ref</th>
                <th className="px-3 py-3 w-32 min-w-[130px]">PM Owner</th>
                <th className="px-3 py-3 w-32 min-w-[130px]">Engineer Owner</th>
                <th className="px-3 py-3 w-32 min-w-[130px]">Procurement Owner</th>
                <th className="px-3 py-3 w-32 min-w-[130px]">Production Owner</th>
                <th className="px-3 py-3 w-32 min-w-[130px]">FAT Owner</th>
                <th className="px-3 py-3 w-32 min-w-[130px]">Contract Signed</th>
                <th className="px-3 py-3 w-32 min-w-[130px]">ROS Date</th>
                <th className="px-3 py-3 w-40 min-w-[160px]">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bulkRows.map(r => {
                const renderCell = (field, placeholder = "") => {
                  const hasErr = r.errors[field];
                  return (
                    <td className="px-2 py-2 align-top">
                      <input type="text" value={r[field]} placeholder={placeholder} onChange={(e) => handleBulkCellChange(r.tempId, field, e.target.value)} className={`w-full px-2 py-1.5 border rounded focus:outline-none text-[11px] ${hasErr ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-gray-200 focus:border-indigo-500'}`} />
                      {hasErr && <div className="text-[9px] text-red-600 mt-1 font-semibold leading-tight">{hasErr}</div>}
                    </td>
                  );
                };

                return (
                  <tr key={r.tempId} className={`hover:bg-gray-50 transition ${r.selected ? '' : 'opacity-50'}`}>
                    <td className="px-4 py-3 text-center align-top sticky left-0 bg-white z-10 border-r border-gray-100">
                      <input type="checkbox" checked={r.selected} onChange={() => handleRowSelectToggle(r.tempId)} className="mt-1.5 rounded text-indigo-600 w-4 h-4" />
                    </td>
                    {renderCell('tag_no')}
                    {renderCell('description')}
                    {renderCell('product_type_name')}
                    {renderCell('schedule_name')}
                    {renderCell('customer')}
                    {renderCell('contract_no')}
                    {renderCell('sales_ref')}
                    {renderCell('pm_owner')}
                    {renderCell('engineer_owner')}
                    {renderCell('procurement_owner')}
                    {renderCell('production_owner')}
                    {renderCell('fat_owner')}
                    <td className="px-2 py-2 align-top">
                      <DateInputCell initialValue={r.contract_signed_date} onSave={(val) => handleBulkCellChange(r.tempId, 'contract_signed_date', val)} hasErr={r.errors.contract_signed_date} dateFormat={dateFormat} />
                      {r.errors.contract_signed_date && <div className="text-[9px] text-red-600 mt-1 font-semibold leading-tight">{r.errors.contract_signed_date}</div>}
                    </td>
                    <td className="px-2 py-2 align-top">
                      <DateInputCell initialValue={r.ros_date} onSave={(val) => handleBulkCellChange(r.tempId, 'ros_date', val)} hasErr={r.errors.ros_date} dateFormat={dateFormat} />
                      {r.errors.ros_date && <div className="text-[9px] text-red-600 mt-1 font-semibold leading-tight">{r.errors.ros_date}</div>}
                    </td>
                    {renderCell('notes')}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}