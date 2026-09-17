// src/pages/ScansPage.tsx
import React, { useState } from 'react';
import {
  History,
  Play,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Terminal,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Scan, Target } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { ScanLiveTerminal } from '../components/ScanLiveTerminal';

interface ScansPageProps {
  scans: Scan[];
  targets: Target[];
  onOpenStartScan: (target: Target) => void;
  onRerunScan: (targetId: string, scanType: Scan['scanType']) => void;
  onNavigate: (view: string) => void;
}

export const ScansPage: React.FC<ScansPageProps> = ({
  scans,
  targets,
  onOpenStartScan,
  onRerunScan,
  onNavigate,
}) => {
  const [selectedScan, setSelectedScan] = useState<Scan | null>(scans[0] || null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredScans = scans.filter((s) => {
    if (statusFilter === 'ALL') return true;
    return s.status === statusFilter;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
            <History className="h-6 w-6 text-cyan-400" />
            Reconnaissance Pipeline & Job History
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Audit logs and real-time execution outputs from automated discovery and vulnerability assessment workers.
          </p>
        </div>

        {targets[0] && (
          <button
            onClick={() => onOpenStartScan(targets[0])}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer shrink-0"
          >
            <Play className="h-4 w-4 fill-current" />
            Launch Recon Job
          </button>
        )}
      </div>

      {/* Main Grid: Scan List vs Live Terminal Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Scans List (Left) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/70 backdrop-blur-md flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Scan Queue ({filteredScans.length})
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700/80 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="RUNNING">Running</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          <div className="space-y-2.5 max-h-[640px] overflow-y-auto">
            {filteredScans.map((scan) => {
              const isSelected = selectedScan?.id === scan.id;
              return (
                <div
                  key={scan.id}
                  onClick={() => setSelectedScan(scan)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-850/90 border-cyan-500 shadow-md shadow-cyan-500/10'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-100">{scan.targetDomain}</span>
                    <StatusBadge status={scan.status} />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-sans font-medium">{scan.scanType.replace(/_/g, ' ')}</span>
                    <span className="font-mono text-slate-500">
                      {new Date(scan.createdAt).toLocaleDateString()} {new Date(scan.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">
                      Found: <strong className="text-cyan-400">{scan.assetsFound}</strong> assets
                    </span>
                    <span className="text-slate-400">
                      Findings: <strong className="text-orange-400">{scan.findingsCount}</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Scan Console (Right) */}
        <div className="lg:col-span-7">
          {selectedScan ? (
            <ScanLiveTerminal
              scan={selectedScan}
              onRerunScan={() => onRerunScan(selectedScan.targetId, selectedScan.scanType)}
              onViewAssets={() => onNavigate('assets')}
            />
          ) : (
            <div className="h-96 rounded-2xl border border-slate-800 bg-slate-900/40 flex items-center justify-center text-xs text-slate-500">
              Select a scan from the left to view logs and terminal stream.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
