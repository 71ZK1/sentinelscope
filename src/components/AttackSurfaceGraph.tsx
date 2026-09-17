// src/components/AttackSurfaceGraph.tsx
import React, { useState, useMemo } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  Search,
  ShieldAlert,
  Server,
  Globe,
  Radio,
  Layers,
  Info,
  X,
  ExternalLink,
} from 'lucide-react';
import { AttackSurfaceGraphData, GraphNode, GraphLink } from '../types';
import { SeverityBadge } from './SeverityBadge';

interface AttackSurfaceGraphProps {
  data: AttackSurfaceGraphData;
  onSelectNode?: (node: GraphNode) => void;
  onInspectNode?: (node: GraphNode) => void;
}

export const AttackSurfaceGraph: React.FC<AttackSurfaceGraphProps> = ({
  data,
  onSelectNode,
  onInspectNode,
}) => {
  const [zoom, setZoom] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [activeNode, setActiveNode] = useState<GraphNode | null>(null);
  const [highlightHighRisk, setHighlightHighRisk] = useState(false);

  const filteredNodes = useMemo(() => {
    return data.nodes.filter((node) => {
      const matchType = selectedType === 'ALL' || node.type === selectedType;
      const matchSearch =
        !searchQuery ||
        node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchRisk = !highlightHighRisk || (node.riskScore && node.riskScore > 50) || node.severity === 'CRITICAL' || node.severity === 'HIGH';
      return matchType && matchSearch && matchRisk;
    });
  }, [data.nodes, selectedType, searchQuery, highlightHighRisk]);

  const visibleNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);

  const filteredLinks = useMemo(() => {
    return data.links.filter(
      (link) => visibleNodeIds.has(link.source) && visibleNodeIds.has(link.target)
    );
  }, [data.links, visibleNodeIds]);

  // Compute 2D node layout positions deterministically
  const layout = useMemo(() => {
    const positions: Record<string, { x: number; y: number; r: number; color: string; ringColor?: string }> = {};
    const width = 860;
    const height = 540;
    const centerX = width / 2;
    const centerY = height / 2;

    const domainNodes = filteredNodes.filter((n) => n.type === 'DOMAIN');
    const subNodes = filteredNodes.filter((n) => n.type === 'SUBDOMAIN');
    const ipNodes = filteredNodes.filter((n) => n.type === 'IP');
    const srvNodes = filteredNodes.filter((n) => n.type === 'SERVICE');
    const techNodes = filteredNodes.filter((n) => n.type === 'TECH');
    const fndNodes = filteredNodes.filter((n) => n.type === 'FINDING');

    // Root Domain (Center)
    domainNodes.forEach((node, i) => {
      const angle = (i / Math.max(1, domainNodes.length)) * 2 * Math.PI;
      const dist = domainNodes.length > 1 ? 40 : 0;
      positions[node.id] = {
        x: centerX + Math.cos(angle) * dist,
        y: centerY + Math.sin(angle) * dist,
        r: 24,
        color: '#06b6d4',
        ringColor: '#0891b2',
      };
    });

    // Subdomains (Ring 1, radius ~ 140)
    subNodes.forEach((node, i) => {
      const angle = (i / Math.max(1, subNodes.length)) * 2 * Math.PI;
      positions[node.id] = {
        x: centerX + Math.cos(angle) * 140,
        y: centerY + Math.sin(angle) * 140,
        r: 16,
        color: '#3b82f6',
        ringColor: node.riskScore && node.riskScore > 60 ? '#ef4444' : '#1d4ed8',
      };
    });

    // IPs (Ring 2, radius ~ 220)
    ipNodes.forEach((node, i) => {
      const angle = (i / Math.max(1, ipNodes.length)) * 2 * Math.PI + 0.3;
      positions[node.id] = {
        x: centerX + Math.cos(angle) * 220,
        y: centerY + Math.sin(angle) * 220,
        r: 12,
        color: '#64748b',
      };
    });

    // Services (Ring 3, radius ~ 290)
    srvNodes.forEach((node, i) => {
      const angle = (i / Math.max(1, srvNodes.length)) * 2 * Math.PI + 0.6;
      positions[node.id] = {
        x: centerX + Math.cos(angle) * 290,
        y: centerY + Math.sin(angle) * 290,
        r: 10,
        color: '#f59e0b',
      };
    });

    // Tech (Ring 3, radius ~ 330)
    techNodes.forEach((node, i) => {
      const angle = (i / Math.max(1, techNodes.length)) * 2 * Math.PI + 0.9;
      positions[node.id] = {
        x: centerX + Math.cos(angle) * 330,
        y: centerY + Math.sin(angle) * 330,
        r: 10,
        color: '#a855f7',
      };
    });

    // Findings (Outer Risk Cluster)
    fndNodes.forEach((node, i) => {
      const angle = (i / Math.max(1, fndNodes.length)) * 2 * Math.PI + 0.15;
      positions[node.id] = {
        x: centerX + Math.cos(angle) * 240,
        y: centerY + Math.sin(angle) * 240,
        r: 14,
        color: node.severity === 'CRITICAL' ? '#ef4444' : '#f97316',
        ringColor: '#ef4444',
      };
    });

    return positions;
  }, [filteredNodes]);

  const handleNodeClick = (node: GraphNode) => {
    setActiveNode(node);
    if (onSelectNode) onSelectNode(node);
  };

  return (
    <div className="relative rounded-2xl border border-slate-800 bg-slate-950/80 backdrop-blur-md overflow-hidden shadow-2xl flex flex-col">
      {/* Graph Toolbar */}
      <div className="p-4 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 bg-slate-900/60">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Radio className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Topology & Attack Surface Graph</h3>
            <p className="text-[11px] text-slate-400">
              Interactive relationship map: Apex Domains ➔ Subdomains ➔ IP Infrastructure ➔ Open Ports ➔ Findings
            </p>
          </div>
        </div>

        {/* Filters & Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search node..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 rounded-lg bg-slate-950 border border-slate-700/70 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors w-36 sm:w-44"
            />
          </div>

          {/* Node Type Filter */}
          <div className="flex items-center gap-1 rounded-lg bg-slate-950 border border-slate-800 p-1 text-[11px]">
            {['ALL', 'DOMAIN', 'SUBDOMAIN', 'IP', 'SERVICE', 'FINDING'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  selectedType === type
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* High Risk Toggle */}
          <button
            onClick={() => setHighlightHighRisk(!highlightHighRisk)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              highlightHighRisk
                ? 'bg-red-500/20 text-red-300 border-red-500/40 shadow-sm shadow-red-500/20'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            Critical Only
          </button>

          {/* Zoom Buttons */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1">
            <button
              onClick={() => setZoom((z) => Math.min(2, z + 0.15))}
              className="p-1 text-slate-400 hover:text-slate-200 rounded"
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <span className="text-[10px] font-mono text-slate-500 px-1">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.15))}
              className="p-1 text-slate-400 hover:text-slate-200 rounded"
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-1 text-slate-400 hover:text-slate-200 rounded"
              title="Reset Zoom"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative h-[540px] w-full cyber-grid-dense flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing">
        {/* Background Radar Effect */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25">
          <div className="h-[460px] w-[460px] rounded-full border border-cyan-500/20 flex items-center justify-center">
            <div className="h-[300px] w-[300px] rounded-full border border-cyan-500/20 flex items-center justify-center">
              <div className="h-[140px] w-[140px] rounded-full border border-cyan-500/30" />
            </div>
          </div>
        </div>

        <svg
          viewBox="0 0 860 540"
          className="w-full h-full"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.2s ease-out' }}
        >
          <defs>
            {/* High-risk link glow gradient */}
            <linearGradient id="riskLinkGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.4" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Render Links */}
          <g className="links">
            {filteredLinks.map((link) => {
              const src = layout[link.source];
              const tgt = layout[link.target];
              if (!src || !tgt) return null;

              const isRisk = link.isHighRisk || link.type === 'HAS_FINDING';

              return (
                <g key={link.id}>
                  <line
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    stroke={isRisk ? 'url(#riskLinkGlow)' : '#334155'}
                    strokeWidth={isRisk ? 2 : 1.2}
                    strokeDasharray={link.type === 'RESOLVES_TO' ? '3,3' : undefined}
                    strokeOpacity={isRisk ? 0.9 : 0.4}
                  />
                  {isRisk && (
                    <circle
                      cx={(src.x + tgt.x) / 2}
                      cy={(src.y + tgt.y) / 2}
                      r="2.5"
                      fill="#ef4444"
                      className="animate-ping"
                    />
                  )}
                </g>
              );
            })}
          </g>

          {/* Render Nodes */}
          <g className="nodes">
            {filteredNodes.map((node) => {
              const pos = layout[node.id];
              if (!pos) return null;

              const isSelected = activeNode?.id === node.id;
              const hasCritical = node.severity === 'CRITICAL' || (node.riskScore && node.riskScore > 75);

              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={() => handleNodeClick(node)}
                  className="cursor-pointer group"
                >
                  {/* Selection Ring */}
                  {isSelected && (
                    <circle
                      r={pos.r + 8}
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="2"
                      strokeDasharray="4,2"
                      className="animate-spin"
                      style={{ animationDuration: '8s' }}
                    />
                  )}

                  {/* Pulse for high risk */}
                  {hasCritical && (
                    <circle
                      r={pos.r + 6}
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="1.5"
                      opacity="0.6"
                      className="animate-ping"
                    />
                  )}

                  {/* Node Circle */}
                  <circle
                    r={pos.r}
                    fill="#0f172a"
                    stroke={pos.ringColor || pos.color}
                    strokeWidth={isSelected ? 3 : 2}
                    filter={isSelected ? 'url(#glow)' : undefined}
                  />

                  {/* Inner Core */}
                  <circle r={pos.r * 0.4} fill={pos.color} />

                  {/* Node Label */}
                  <text
                    y={pos.r + 14}
                    textAnchor="middle"
                    fill="#cbd5e1"
                    fontSize={node.type === 'DOMAIN' ? '11px' : '9px'}
                    fontWeight={node.type === 'DOMAIN' ? 'bold' : 'normal'}
                    className="font-mono select-none pointer-events-none group-hover:fill-cyan-300 transition-colors"
                  >
                    {node.label.length > 22 ? `${node.label.substring(0, 20)}...` : node.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Legend Overlay */}
        <div className="absolute bottom-3 left-3 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 backdrop-blur-md text-[10px] space-y-1.5 shadow-lg">
          <div className="text-slate-400 font-bold uppercase tracking-wider mb-1">Graph Legend</div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="h-2 w-2 rounded-full bg-[#06b6d4]" />
            <span>Apex Target Scope</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="h-2 w-2 rounded-full bg-[#3b82f6]" />
            <span>Discovered Subdomain</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="h-2 w-2 rounded-full bg-[#64748b]" />
            <span>Host IP Address</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
            <span>Open Service / Port</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="h-2 w-2 rounded-full bg-[#ef4444]" />
            <span>Security Finding (Exploitable)</span>
          </div>
        </div>

        {/* Slide-Over Drawer for Selected Node Details */}
        {activeNode && (
          <div className="absolute right-3 top-3 bottom-3 w-80 rounded-xl bg-slate-900/95 border border-slate-700/80 backdrop-blur-md p-4 shadow-2xl overflow-y-auto animate-in slide-in-from-right-4 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  {activeNode.type}
                </span>
                <h4 className="text-xs font-bold text-slate-100 line-clamp-1">{activeNode.label}</h4>
              </div>
              <button
                onClick={() => setActiveNode(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 space-y-3 text-xs">
              {activeNode.riskScore !== undefined && (
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Node Risk Score</span>
                  <span
                    className={`font-mono font-bold ${
                      activeNode.riskScore > 60
                        ? 'text-red-400'
                        : activeNode.riskScore > 30
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {activeNode.riskScore}/100
                  </span>
                </div>
              )}

              {activeNode.severity && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Severity</span>
                  <div className="mt-1">
                    <SeverityBadge severity={activeNode.severity} />
                  </div>
                </div>
              )}

              {activeNode.metadata && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Metadata</span>
                  <div className="mt-1.5 p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1.5 font-mono text-[11px] text-slate-300">
                    {Object.entries(activeNode.metadata).map(([key, val]) => (
                      <div key={key} className="flex justify-between gap-2 overflow-hidden">
                        <span className="text-slate-500 shrink-0">{key}:</span>
                        <span className="text-cyan-300 truncate">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={() => {
                    if (onInspectNode && activeNode) {
                      onInspectNode(activeNode);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-xs border border-cyan-500/40 shadow-sm shadow-cyan-500/20 transition-all cursor-pointer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Inspect In Full Inventory
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
