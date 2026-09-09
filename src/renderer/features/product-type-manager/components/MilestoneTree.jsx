import React from 'react';
import { Edit, Trash2 } from 'lucide-react';

export default function MilestoneTree({ milestones, handleOpenMilestoneModal, handleDeleteMilestone }) {
  
  const buildMilestoneTree = (milestoneList) => {
    const roots = milestoneList.filter(m => !m.anchor_id);
    const findChildren = (node) => ({
      ...node,
      children: milestoneList.filter(m => m.anchor_id === node.id).map(findChildren)
    });
    return roots.map(findChildren);
  };

  const formatMilestoneRelation = (m, milestoneList) => {
    const isDefault = m.name.toLowerCase() === 'contract signed' || m.name.toLowerCase() === 'ros';
    if (isDefault) return 'Default Milestone';
    const anchor = milestoneList.find(a => a.id === m.anchor_id);
    const anchorName = anchor ? anchor.name : 'Anchor';
    const absOffset = Math.abs(m.offset);
    const relation = m.offset < 0 ? 'before' : 'after';
    return `${absOffset} days ${relation} ${anchorName}`;
  };

  const renderTreeNodes = (node, milestoneList) => {
    const isDefault = node.name.toLowerCase() === 'contract signed' || node.name.toLowerCase() === 'ros';
    const relation = formatMilestoneRelation(node, milestoneList);
    
    return (
      <div key={node.id} className="ml-6 border-l border-indigo-200 pl-4 my-2 relative">
        <div className="absolute w-2 h-2 rounded-full bg-indigo-400 -left-1.5 top-5"></div>
        
        <div className={`p-3 min-h-[64px] rounded-lg border flex items-center justify-between ${
          isDefault 
            ? 'bg-indigo-50 border-indigo-200 text-indigo-950' 
            : node.offset >= 0 
            ? 'bg-teal-50 border-teal-200 text-teal-950' 
            : 'bg-amber-50 border-amber-200 text-amber-950'
        }`}>
          <div>
            <div className="font-semibold text-sm flex items-center">
              {node.name}
              {isDefault && (
                <span className="ml-2 text-[10px] bg-indigo-200 text-indigo-800 px-1.5 py-0.2 rounded font-medium">
                  DEFAULT ROOT
                </span>
              )}
            </div>
            {!isDefault && (
              <span className="text-xs text-gray-500 font-medium mt-0.5 block">
                {relation}
              </span>
            )}
            {node.remark && (
              <p className="text-xs text-gray-500 mt-1 italic">
                "{node.remark}"
              </p>
            )}
          </div>
          <div className="flex space-x-1.5 ml-4">
            {!isDefault && (
              <>
                <button
                  onClick={() => handleOpenMilestoneModal(node)}
                  className="p-1 text-indigo-600 hover:text-indigo-900 hover:bg-white rounded transition"
                  title="Edit Milestone"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteMilestone(node.id)}
                  className="p-1 text-red-600 hover:text-red-900 hover:bg-white rounded transition"
                  title="Delete Milestone"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
        
        {node.children && node.children.length > 0 && (
          <div className="mt-1">
            {node.children.map(child => renderTreeNodes(child, milestoneList))}
          </div>
        )}
      </div>
    );
  };

  if (milestones.length === 0) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg text-center text-gray-400 text-xs">
        Loading diagram...
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 overflow-x-auto min-h-[200px]">
      {buildMilestoneTree(milestones).map(rootNode => (
        <div key={rootNode.id} className="mb-6 last:mb-0">
          <div className="p-3 min-h-[64px] bg-indigo-900 text-white rounded-lg border border-indigo-950 flex items-center justify-between shadow-sm w-full">
            <div>
              <span className="font-bold text-sm">{rootNode.name}</span>
              <p className="text-[10px] text-indigo-200 mt-0.5">{rootNode.remark || 'Boundary Milestone'}</p>
            </div>
            <span className="text-[10px] bg-indigo-800 border border-indigo-700 text-indigo-100 px-1.5 py-0.5 rounded font-bold">
              DEFAULT MILESTONE
            </span>
          </div>
          {rootNode.children && rootNode.children.map(child => renderTreeNodes(child, milestones))}
        </div>
      ))}
    </div>
  );
}