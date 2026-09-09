import React from 'react';
import { Edit, Trash2 } from 'lucide-react'; // <-- Added icons

/**
 * This component renders a timeline of milestones based on their anchor relationships and offsets. 
 * It builds a tree structure of milestones and then generates a timeline for each root milestone, displaying the relative days before or after the root milestone.
 */

function buildMilestoneTree(milestoneList) {
  const roots = milestoneList.filter(milestone => !milestone.anchor_id);
  const findChildren = node => ({
    ...node,
    children: milestoneList.filter(milestone => milestone.anchor_id === node.id).map(findChildren)
  });
  return roots.map(findChildren);
}

function buildMilestoneTimeline(milestoneList, root) {
  const timeline = [];
  const visit = (milestone, relativeDays, visited = new Set()) => {
    if (visited.has(milestone.id)) return;
    const nextVisited = new Set(visited).add(milestone.id);
    timeline.push({ ...milestone, relativeDays });
    milestoneList
      .filter(child => child.anchor_id === milestone.id)
      .forEach(child => visit(child, relativeDays + Number(child.offset || 0), nextVisited));
  };
  visit(root, 0);
  return timeline.sort((a, b) => a.relativeDays - b.relativeDays || a.id - b.id);
}

// Added handler props
export default function MilestoneTimeline({ milestones, handleOpenMilestoneModal, handleDeleteMilestone }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {buildMilestoneTree(milestones).map(rootNode => {
        const timeline = buildMilestoneTimeline(milestones, rootNode);
        return (
          <div key={rootNode.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h4 className="font-bold text-sm text-indigo-900 border-b border-gray-200 pb-3 mb-4">
              {rootNode.name} timeline
            </h4>
            <div className="relative border-l-2 border-indigo-200 ml-2 space-y-2">
              {timeline.map(item => {
                const anchor = milestones.find(candidate => candidate.id === item.anchor_id);
                const directRelation = item.anchor_id
                  ? `${Math.abs(item.offset)} days ${item.offset < 0 ? 'before' : 'after'} ${anchor?.name || 'anchored milestone'}`
                  : 'Root milestone';
                const rootRelation = item.anchor_id && item.anchor_id !== rootNode.id
                  ? `\n${Math.abs(item.relativeDays)} days ${item.relativeDays < 0 ? 'before' : 'after'} ${rootNode.name}`
                  : '';
                
                // Determine if this is a locked default milestone
                const isDefault = item.name.toLowerCase() === 'contract signed' || item.name.toLowerCase() === 'ros';

                return (
                  // Added group, min-h-[64px] for uniform height, and flex layout for the buttons
                  <div key={item.id} className="relative pl-5 py-2 group flex justify-between items-start min-h-[64px] transition-colors hover:bg-gray-100/50 rounded-r-lg">
                    <span className="absolute w-2.5 h-2.5 bg-indigo-600 rounded-full -left-[7px] top-3.5" />
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500 whitespace-pre-line mt-0.5">{directRelation}{rootRelation}</p>
                    </div>
                    
                    {/* Action buttons (hidden by default, visible on hover) */}
                    {!isDefault && (
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleOpenMilestoneModal(item)}
                          className="p-1.5 text-indigo-600 hover:text-indigo-950 hover:bg-indigo-50 rounded transition"
                          title="Edit milestone"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMilestone(item.id)}
                          className="p-1.5 text-red-600 hover:text-red-950 hover:bg-red-50 rounded transition"
                          title="Delete milestone"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}