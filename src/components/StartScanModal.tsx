// src/components/StartScanModal.tsx
import React, { useState } from 'react';
import { Play, Radar, Globe, Network, ShieldCheck, Zap } from 'lucide-react';
import { Target, Scan } from '../types';
import { api } from '../lib/api';

interface StartScanModalProps {
  target: Target;
  isOpen: boolean;
  onClose: () => void;
  onScanStarted: (scan: Scan) => void;
}

export const StartScanModal: React.FC<StartScanModalProps> = ({
  target,
  isOpen,
  onClose,
  onScanStarted,
}) => {
  const [scanType, setScanType] = useState<Scan['scanType']>('FULL_RECON');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    try {
      const scan = await api.triggerScan(target.id, scanType);
      onScanStarted(scan);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch scan job');
    } finally {
      setLoading(false);
    }
  };

  const scanProfiles = [
    {
      id: 'FULL_RECON' as const,
      title: 'Full Attack Surface Recon',
      desc: 'Complete discovery pipeline: Subdomain enumeration, DNS records, reachable HTTP probes, safe port mapping, security headers, and vulnerability correlation.',
      icon: Radar,
      color: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10',
      duration: '~1-3 mins',
    },
    {
      id: 'PASSIVE_DNS' as const,
      title: 'Passive DNS & Subdomains',
      desc: 'Non-intrusive enumeration via CT logs, public MX/TXT/SPF records, and passive certificate heuristics.',
      icon: Globe,
      color: 'text-blue-400 border-blue-500/40 bg-blue-500/10',
      duration: '~30-60 secs',
    },
    {
      id: 'QUICK_PORT' as const,
      title: 'Quick Service & Port Inventory',
      desc: 'Fast non-destructive TCP probe on top authorized standard ports (80, 443, 8080, 22, 25, 3306, 6379, 9200).',
      icon: Network,
      color: 'text-purple-400 border-purple-500/40 bg-purple-500/10',
      duration: '~45-90 secs',
    },
    {
      id: 'WEB_PROBE' as const,
      title: 'Web & TLS Security Audit',
      desc: 'Evaluates HTTP security headers (HSTS, CSP, X-Frame), cookie flags, and SSL/TLS certificate validity.',
      icon: Zap,
      color: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
      duration: '~30-45 secs',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Radar className="h-5 w-5 animate-spin" style={{ animationDuration: '6s' }} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Launch Recon Scan</h3>
                <p className="text-xs text-slate-400 font-mono">Target: {target.domain}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300">
              {error}
            </div>
          )}

          <div className="mt-4 space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Select Scan Profile
            </label>

            {scanProfiles.map((p) => {
              const Icon = p.icon;
              const isSelected = scanType === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setScanType(p.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800/90 border-cyan-500 ring-1 ring-cyan-500/50 shadow-lg shadow-cyan-500/10'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg border ${p.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">{p.title}</span>
                        <span className="text-[10px] font-mono text-slate-500">{p.duration}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">{p.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Scope: {target.authorizedBy}</span>
            </div>
            <span className="font-mono text-slate-500">Rate Limit: {target.rateLimit}/min</span>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleStart}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <span className="h-3.5 w-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  Dispatching...
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Dispatch Worker Job
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
