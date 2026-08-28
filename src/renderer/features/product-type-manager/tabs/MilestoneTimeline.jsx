import React from 'react';

/**
 * This component renders a timeline of milestones based on their anchor relationships and offsets. 
 * It builds a tree structure of milestones and then generates a timeline for each root milestone, displaying the relative days before or after the root milestone.
 * 
 * @param {Array} milestones - An array of milestone objects, each containing id, name, anchor_id, and offset properties.
 * @returns {JSX.Element} A grid of milestone timelines for each root milestone.
 * 
 * Milestone Object Structure:
 * - id: Unique identifier for the milestone.
 * - name: Name of the milestone.
 * - anchor_id: ID of the milestone this one is anchored to (null if it's a root milestone).
 * - offset: Number of days before or after the anchor milestone (can be negative).
 * 
 * Timeline Generation:
 * - The component first builds a tree of milestones based on their anchor relationships.
 * - For each root milestone, it generates a timeline by traversing its children and calculating their relative days.
 * - The timeline is sorted by relative days and then by milestone ID for consistent ordering.
 * 
 * Display:
 * - Each root milestone's timeline is displayed in a bordered box with a title.
 * - Each milestone in the timeline shows its name and its relationship to its anchor and root milestones, including the number of days before or after.
 * 
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

export default function MilestoneTimeline({ milestones }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {buildMilestoneTree(milestones).map(rootNode => {
        const timeline = buildMilestoneTimeline(milestones, rootNode);
        return (
          <div key={rootNode.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h4 className="font-bold text-sm text-indigo-900 border-b border-gray-200 pb-3 mb-4">
              {rootNode.name} timeline
            </h4>
            <div className="relative border-l-2 border-indigo-200 ml-2 space-y-4">
              {timeline.map(item => {
                const anchor = milestones.find(candidate => candidate.id === item.anchor_id);
                const directRelation = item.anchor_id
                  ? `${Math.abs(item.offset)} days ${item.offset < 0 ? 'before' : 'after'} ${anchor?.name || 'anchored milestone'}`
                  : 'Root milestone';
                const rootRelation = item.anchor_id && item.anchor_id !== rootNode.id
                  ? `\n${Math.abs(item.relativeDays)} days ${item.relativeDays < 0 ? 'before' : 'after'} ${rootNode.name}`
                  : '';

                return (
                  <div key={item.id} className="relative pl-5">
                    <span className="absolute w-2.5 h-2.5 bg-indigo-600 rounded-full -left-[7px] top-1.5" />
                    <p className="font-semibold text-sm text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500 whitespace-pre-line">{directRelation}{rootRelation}</p>
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
