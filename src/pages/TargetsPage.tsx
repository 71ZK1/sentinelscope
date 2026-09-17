// src/pages/TargetsPage.tsx
import React, { useState } from 'react';
import {
  Target as TargetIcon,
  Plus,
  Play,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Tag,
  Clock,
  Radio,
  Server,
  AlertTriangle,
  Layers,
  RotateCcw,
  ShieldAlert,
  Flame,
} from 'lucide-react';
import { Target, Scan } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { RiskBadge } from '../components/RiskBadge';

interface TargetsPageProps {
  targets: Target[];
  onOpenAddTarget: () => void;
  onOpenStartScan: (target: Target) => void;
  onDeleteTarget: (id: string) => void;
  onSelectTarget: (id: string) => void;
  onNavigate: (view: string) => void;
  onPurgeAll?: () => void;
  onResetDemo?: () => void;
}

export const TargetsPage: React.FC<TargetsPageProps> = ({
  targets,
  onOpenAddTarget,
  onOpenStartScan,
  onDeleteTarget,
  onSelectTarget,
  onNavigate,
  onPurgeAll,
  onResetDemo,
}) => {
  const [search, setSearch] = useState('');
  const [deleteTargetModal, setDeleteTargetModal] = useState<Target | null>(null);
  const [isPurgeAllModalOpen, setIsPurgeAllModalOpen] = useState<boolean>(false);

  const filteredTargets = targets.filter(
    (t) =>
      t.domain.toLowerCase().includes(search.toLowerCase()) ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
            <TargetIcon className="h-6 w-6 text-cyan-400" />
            Authorized Target Scopes
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage authorized root domains, perimeter targets, and automated reconnaissance policies.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {targets.length > 0 && onPurgeAll && (
            <button
              onClick={() => setIsPurgeAllModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-mono text-xs border border-red-500/30 transition-all cursor-pointer"
              title="Delete all targets, demo websites, and associated findings"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Purge All Scopes
            </button>
          )}

          {onResetDemo && (
            <button
              onClick={onResetDemo}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs border border-slate-700 transition-all cursor-pointer"
              title="Restore demo target websites"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Demo Data
            </button>
          )}

          <button
            onClick={onOpenAddTarget}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add Authorized Target
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md flex items-center justify-between gap-4">
        <input
          type="text"
          placeholder="Filter targets by domain, tag, or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700/80 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
        />

        <div className="text-xs font-mono text-slate-400">
          Showing <span className="text-cyan-400 font-bold">{filteredTargets.length}</span> of {targets.length} Target Scopes
        </div>
      </div>

      {/* No targets state */}
      {filteredTargets.length === 0 && (
        <div className="p-12 rounded-2xl border border-slate-800 bg-slate-900/40 text-center space-y-3">
          <TargetIcon className="h-10 w-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-200">No Target Scopes in Inventory</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {targets.length === 0
              ? 'All target scopes and demo websites have been purged. Add your authorized target domain to begin scanning, or restore demo data.'
              : 'No targets matched your search criteria.'}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenAddTarget}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add Target
            </button>
            {onResetDemo && targets.length === 0 && (
              <button
                onClick={onResetDemo}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs border border-slate-700 transition cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Restore Demo Data
              </button>
            )}
          </div>
        </div>
      )}

      {/* Target Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTargets.map((target) => (
          <div
            key={target.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md p-6 shadow-xl hover:border-slate-700 transition-all space-y-4"
          >
            {/* Target Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-extrabold text-slate-100">{target.domain}</span>
                  <StatusBadge status={target.status} />
                </div>
                <p className="text-xs text-slate-400">{target.name}</p>
              </div>

              <RiskBadge level={target.riskLevel} score={target.riskScore} />
            </div>

            {/* Scope Authorization Stamp */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="truncate">Authorized by: <strong className="text-slate-300">{target.authorizedBy}</strong></span>
              </div>
              <span className="text-[11px] font-mono text-slate-500 shrink-0">
                {target.rateLimit} req/min
              </span>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 py-2 border-y border-slate-800/60">
              <div className="text-center p-2 rounded-lg bg-slate-950/40">
                <span className="text-[10px] uppercase font-bold text-slate-500">Subdomains</span>
                <div className="text-base font-mono font-bold text-cyan-400">{target.subdomainCount || 0}</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-slate-950/40">
                <span className="text-[10px] uppercase font-bold text-slate-500">Live Hosts</span>
                <div className="text-base font-mono font-bold text-emerald-400">{target.liveHostCount || 0}</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-slate-950/40">
                <span className="text-[10px] uppercase font-bold text-slate-500">Findings</span>
                <div className="text-base font-mono font-bold text-orange-400">{target.findingsCount || 0}</div>
              </div>
            </div>

            {/* Tags & Notes */}
            <div className="flex flex-wrap items-center gap-1.5">
              {target.tags.map((t, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-medium border border-slate-700/60"
                >
                  #{t}
                </span>
              ))}
            </div>

            {target.notes && (
              <p className="text-[11px] text-slate-400 italic bg-slate-950/40 p-2 rounded border border-slate-850">
                "{target.notes}"
              </p>
            )}

            {/* Actions Bar */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenStartScan(target)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Run Recon Scan
                </button>

                <button
                  onClick={() => {
                    onSelectTarget(target.id);
                    onNavigate('assets');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                >
                  View Assets
                </button>
              </div>

              <button
                onClick={() => setDeleteTargetModal(target)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-xs font-mono transition-colors"
                title="Delete Target Scope & All Associated Data"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Single Target Confirmation Modal */}
      {deleteTargetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Delete Target Scope?</h3>
                <p className="text-xs font-mono text-red-300">{deleteTargetModal.domain}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
              <p className="font-semibold text-amber-300">
                Warning: This is a cascading permanent deletion.
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[11px]">
                <li>All discovered subdomains & host assets</li>
                <li>All security vulnerability findings & CVE reports</li>
                <li>All scan job history and pipeline execution logs</li>
                <li>All discovered API endpoints and parameter dictionaries</li>
                <li>All HTTP proxy and repeater traffic history for this domain</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteTargetModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteTarget(deleteTargetModal.id);
                  setDeleteTargetModal(null);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/20 transition flex items-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Purge Scope & All Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Purge All Targets / Clean Slate Modal */}
      {isPurgeAllModalOpen && onPurgeAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30">
                <Flame className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Purge All Scopes & Clean Slate?</h3>
                <p className="text-xs text-slate-400">Delete all demo websites & targets</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
              <p className="text-slate-300">
                This will wipe out <strong className="text-red-400">all target scopes</strong> (including Acme Corp demo websites), all discovered assets, scans, findings, and traffic logs, leaving a completely clean environment for your personal targets.
              </p>
              <p className="text-[11px] text-slate-500">
                (You can restore the demo dataset at any time using "Reset Demo Data".)
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsPurgeAllModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onPurgeAll();
                  setIsPurgeAllModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/20 transition flex items-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Purge Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
