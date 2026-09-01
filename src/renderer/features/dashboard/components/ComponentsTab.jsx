import React from 'react';
import { Clock } from 'lucide-react';

export default function ComponentsTab({ components, componentUsage, projects }) {
  return (
    <section className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-indigo-600" />
        <h3 className="font-bold text-gray-900">Component Demand</h3>
      </div>
      <p className="text-xs text-gray-500 mb-4">Components currently used by registered product types.</p>
      
      <div className="divide-y divide-gray-200">
        {components.length === 0 ? (
          <p className="text-sm text-gray-500">No components available.</p>
        ) : (
          components.map(component => { 
            const typeNames = componentUsage[component.id] || []; 
            const projectCount = projects.filter(project => typeNames.includes(project.product_type_name)).length; 
            
            return (
              <div key={component.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                <span className="font-semibold">{component.name}</span>
                <span className="text-right text-gray-500">
                  {typeNames.length} product types / {projectCount} registered projects
                </span>
              </div>
            ); 
          })
        )}
      </div>
    </section>
  );
}