// src/components/ScanLiveTerminal.tsx
import React, { useEffect, useRef } from 'react';
import { Terminal, ShieldCheck, CheckCircle2, AlertCircle, Clock, Play, RotateCcw } from 'lucide-react';
import { Scan } from '../types';
import { StatusBadge } from './StatusBadge';

interface ScanLiveTerminalProps {
  scan: Scan;
  onRerunScan?: () => void;
  onViewAssets?: () => void;
}

export const ScanLiveTerminal: React.FC<ScanLiveTerminalProps> = ({
  scan,
  onRerunScan,
  onViewAssets,
}) => {
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [scan.logs]);

  const stages = [
    { name: 'Scope Validation', min: 5 },
    { name: 'Subdomain Discovery', min: 20 },
    { name: 'DNS & Live Hosts', min: 40 },
    { name: 'Port & Service Probe', min: 60 },
    { name: 'Vulnerability Analysis', min: 75 },
    { name: 'Risk Scoring & Complete', min: 95 },
  ];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/90 backdrop-blur-md overflow-hidden shadow-2xl">
      {/* Terminal Title Bar */}
      <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 mr-2">
            <span className="h-3 w-3 rounded-full bg-red-500/80" />
            <span className="h-3 w-3 rounded-full bg-amber-500/80" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
          </div>
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-cyan-400" />
            <span className="font-mono text-xs font-bold text-slate-200">
              SCAN_JOB://{scan.targetDomain} ({scan.id})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={scan.status} />
          {scan.durationSeconds > 0 && (
            <div className="flex items-center gap-1 text-xs font-mono text-slate-400">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              <span>{scan.durationSeconds}s</span>
            </div>
          )}
          {onRerunScan && (
            <button
              onClick={onRerunScan}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Rerun
            </button>
          )}
        </div>
      </div>

      {/* Live Progress Bar & Stepper */}
      <div className="p-4 bg-slate-900/40 border-b border-slate-800/80">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-slate-300 font-semibold flex items-center gap-2">
            {scan.status === 'RUNNING' && <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />}
            {scan.currentStage || 'Reconnaissance pipeline active...'}
          </span>
          <span className="font-mono font-bold text-cyan-400">{scan.progress}%</span>
        </div>

        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 transition-all duration-500 ease-out"
            style={{ width: `${Math.max(4, scan.progress)}%` }}
          />
        </div>

        {/* Stage Checklist */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {stages.map((st, i) => {
            const isDone = scan.progress >= st.min + 15 || scan.status === 'COMPLETED';
            const isCurrent = scan.progress >= st.min && scan.progress < st.min + 20 && scan.status === 'RUNNING';

            return (
              <div
                key={i}
                className={`p-2 rounded-lg border text-[11px] flex items-center gap-2 transition-all ${
                  isDone
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : isCurrent
                    ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 shadow-sm shadow-cyan-500/10'
                    : 'bg-slate-900/60 border-slate-800/60 text-slate-500'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                ) : isCurrent ? (
                  <div className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-slate-700 shrink-0" />
                )}
                <span className="truncate">{st.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Terminal Log Console */}
      <div className="p-4 bg-slate-950 font-mono text-xs max-h-72 overflow-y-auto space-y-2 select-text">
        {scan.logs.map((log) => {
          const isError = log.level === 'ERROR';
          const isSuccess = log.level === 'SUCCESS';
          const isWarn = log.level === 'WARN';

          return (
            <div key={log.id} className="flex items-start gap-2.5 leading-relaxed">
              <span className="text-slate-600 shrink-0 text-[10px]">
                {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span
                className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase shrink-0 ${
                  isError
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : isSuccess
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : isWarn
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                }`}
              >
                {log.level}
              </span>
              <span className="text-slate-500 shrink-0">[{log.stage}]</span>
              <span
                className={`flex-1 ${
                  isError
                    ? 'text-red-300 font-semibold'
                    : isSuccess
                    ? 'text-emerald-300'
                    : isWarn
                    ? 'text-amber-300'
                    : 'text-slate-300'
                }`}
              >
                {log.message}
              </span>
            </div>
          );
        })}
        <div ref={terminalEndRef} />
      </div>

      {/* Terminal Footer Summary */}
      {scan.status === 'COMPLETED' && (
        <div className="p-3.5 bg-cyan-950/20 border-t border-cyan-500/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3 text-slate-300">
            <span>
              Assets Discovered: <strong className="text-cyan-400">{scan.assetsFound}</strong>
            </span>
            <span>•</span>
            <span>
              Findings Correlated: <strong className="text-orange-400">{scan.findingsCount}</strong>
            </span>
          </div>

          {onViewAssets && (
            <button
              onClick={onViewAssets}
              className="px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all"
            >
              Explore Assets & Findings
            </button>
          )}
        </div>
      )}
    </div>
  );
};
