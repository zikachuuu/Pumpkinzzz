import React, { useState } from 'react';
import { Tag, Trash2, Info } from 'lucide-react';

export default function BomTab({
    productTypes, // Needed for the dropdown
    attachedComponents,
    sourceComponents,
    handleAttachExistingComponent,
    handleCreateGlobalComponent,
    handleDetachComponent,
    setComponentProductTypeSearch,
    componentProductTypeSearch,
    componentProductTypeId,
    setComponentProductTypeId,
    selectedGlobalComponentId,
    setSelectedGlobalComponentId,
    componentForm,
    setComponentForm,
    componentSearch,
    setComponentSearch,  
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Attach component */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm h-fit space-y-6">
            {/* Attach Existing Component */}
            <div>
            <h3 className="font-bold text-gray-900 text-md mb-3 flex items-center space-x-2">
                <Tag className="w-4 h-4 text-indigo-500" />
                <span>Attach Existing Component</span>
            </h3>
            <div className="space-y-3">
                <input
                type="search"
                value={componentProductTypeSearch}
                onChange={(e) => setComponentProductTypeSearch(e.target.value)}
                placeholder="Search product types..."
                className="block w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <select
                value={componentProductTypeId}
                onChange={(e) => {
                    setComponentProductTypeId(e.target.value);
                    setSelectedGlobalComponentId('');
                }}
                className="block w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                <option value="">1. Choose a product type</option>
                {productTypes
                    .filter(pt => pt.name.toLowerCase().includes(componentProductTypeSearch.toLowerCase()))
                    .map(pt => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
                </select>
                <select
                value={selectedGlobalComponentId}
                onChange={(e) => setSelectedGlobalComponentId(e.target.value)}
                disabled={!componentProductTypeId}
                className="block w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100"
                >
                <option value="">2. Choose a component</option>
                {sourceComponents
                    .filter(component => !attachedComponents.some(attached => attached.id === component.id))
                    .filter(component => component.name.toLowerCase().includes(componentSearch.toLowerCase()))
                    .map(component => <option key={component.id} value={component.id}>{component.name}</option>)}
                </select>
                <input
                type="search"
                value={componentSearch}
                onChange={(e) => setComponentSearch(e.target.value)}
                placeholder="Search components..."
                disabled={!componentProductTypeId}
                className="block w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100"
                />
                <button
                onClick={handleAttachExistingComponent}
                disabled={!selectedGlobalComponentId || !componentProductTypeId}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                >
                Attach Component
                </button>
            </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
            <h3 className="font-bold text-gray-900 text-md mb-3">Or Create New Component Globally</h3>
            <form onSubmit={handleCreateGlobalComponent} className="space-y-4">
                <div>
                <label className="block text-xs font-bold text-gray-600 uppercase">Component Name</label>
                <input
                    type="text"
                    required
                    value={componentForm.name}
                    onChange={(e) => setComponentForm({ ...componentForm, name: e.target.value })}
                    placeholder="e.g. Condenser, Water Pump"
                    className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                </div>
                <div>
                <label className="block text-xs font-bold text-gray-600 uppercase">Remarks (Optional)</label>
                <textarea
                    rows="2"
                    value={componentForm.remarks}
                    onChange={(e) => setComponentForm({ ...componentForm, remarks: e.target.value })}
                    placeholder="e.g. Copper coil, heavy duty"
                    className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                </div>
                <button
                type="submit"
                className="w-full py-2.5 bg-gray-900 hover:bg-black text-white rounded-lg text-sm font-semibold shadow transition"
                >
                Create and Attach Component
                </button>
            </form>
            </div>
        </div>

        {/* Right List: Attached Components Table */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 text-lg mb-2">BOM - Bill of Materials</h3>
            <p className="text-xs text-gray-500 mb-4">
            Components list of this product type. You can attach existing components from other product types or create new ones globally.
            </p>

            {attachedComponents.length === 0 ? (
            <div className="p-16 text-center text-gray-400">
                <Info className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="font-medium text-sm">No components are currently attached to this product type.</p>
            </div>
            ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Component Name</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Global Remarks</th>
                    <th className="relative px-6 py-3"></th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 text-sm text-gray-600">
                    {attachedComponents.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">{c.name}</td>
                        <td className="px-6 py-4 text-xs text-gray-500 max-w-xs truncate">{c.remarks || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                            onClick={() => handleDetachComponent(c.id, c.name)}
                            className="text-red-600 hover:text-red-950 flex items-center space-x-1 ml-auto"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span>Detach</span>
                        </button>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            )}
        </div>
        </div>
  );
}