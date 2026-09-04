import React from 'react';
import { Layers } from 'lucide-react';
import StatusBadge from '../../../components/ui/StatusBadge';

export default function ProductTypeTab({ productTypes, projects }) {
  return (
    <section className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-5 h-5 text-indigo-600" />
        <h3 className="font-bold text-gray-900">Product Type Health</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {productTypes.map(type => (
          <div key={type.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between gap-2">
              <span className="font-bold text-sm">{type.name}</span>
              <StatusBadge status={type.status} />
            </div>
            <p className="text-xs text-gray-500 mt-3">{type.schedule_count} schedules / {type.component_count} components</p>
            <p className="text-xs text-gray-500 mt-1">
              {projects.filter(project => project.product_type_id === type.id).length} registered products
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}