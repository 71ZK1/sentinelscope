// src/pages/ChangesPage.tsx
import React from 'react';
import { GitBranch, Server, ShieldAlert, CheckCircle2, Radio, Clock, AlertTriangle } from 'lucide-react';
import { HistoricalChange } from '../types';

interface ChangesPageProps {
  changes: HistoricalChange[];
  onNavigate: (view: string) => void;
}

export const ChangesPage: React.FC<ChangesPageProps> = ({ changes, onNavigate }) => {
  const getIcon = (type: HistoricalChange['changeType']) => {
    switch (type) {
      case 'NEW_ASSET':
        return <Server className="h-4 w-4 text-cyan-400" />;
      case 'NEW_PORT':
        return <Radio className="h-4 w-4 text-amber-400" />;
      case 'NEW_FINDING':
        return <ShieldAlert className="h-4 w-4 text-red-400" />;
      case 'RESOLVED_FINDING':
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case 'CERT_CHANGED':
        return <AlertTriangle className="h-4 w-4 text-orange-400" />;
      default:
        return <Clock className="h-4 w-4 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
          <GitBranch className="h-6 w-6 text-cyan-400" />
          Attack Surface Drift & Historical Timeline
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Chronological audit log tracking newly exposed subdomains, opened ports, TLS certificate renewals, and remediated CVEs.
        </p>
      </div>

      {/* Timeline List */}
      <div className="relative border-l border-slate-800 ml-4 pl-6 space-y-6">
        {changes.map((change) => (
          <div key={change.id} className="relative group">
            {/* Timeline Node Icon */}
            <div className="absolute -left-[35px] top-1 p-1.5 rounded-full bg-slate-900 border border-slate-700 shadow-md">
              {getIcon(change.changeType)}
            </div>

            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-md hover:border-slate-700 transition-colors shadow-lg space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-cyan-400 border border-slate-700">
                    {change.changeType.replace(/_/g, ' ')}
                  </span>
                  <span className="font-mono text-xs text-slate-400 font-bold">{change.targetDomain}</span>
                </div>

                <span className="text-[11px] font-mono text-slate-500">
                  {new Date(change.timestamp).toLocaleDateString()} {new Date(change.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-200">{change.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{change.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
