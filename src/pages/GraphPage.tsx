// src/pages/GraphPage.tsx
import React from 'react';
import { Network, Info } from 'lucide-react';
import { AttackSurfaceGraphData, GraphNode } from '../types';
import { AttackSurfaceGraph } from '../components/AttackSurfaceGraph';

interface GraphPageProps {
  graphData: AttackSurfaceGraphData | null;
  onNavigate: (view: string) => void;
  onInspectNode?: (node: GraphNode) => void;
}

export const GraphPage: React.FC<GraphPageProps> = ({ graphData, onNavigate, onInspectNode }) => {
  if (!graphData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-8 w-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
            <Network className="h-6 w-6 text-cyan-400" />
            Attack Surface Topology Graph
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Visual structural graph mapping domains, host IPs, listening network ports, running technology stacks, and critical findings.
          </p>
        </div>
      </div>

      <AttackSurfaceGraph data={graphData} onInspectNode={onInspectNode} />
    </div>
  );
};
