// src/pages/FindingsPage.tsx
import React, { useState, useMemo } from 'react';
import {
  AlertOctagon,
  Search,
  Filter,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  X,
  FileCode,
  Tag,
  Clock,
  CheckCircle,
  XCircle,
  HelpCircle,
  Copy,
  Check,
  Send,
  Terminal,
  AlertTriangle,
  FileWarning,
} from 'lucide-react';
import { Finding, Severity } from '../types';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusBadge } from '../components/StatusBadge';

interface FindingsPageProps {
  findings: Finding[];
  onUpdateFindingStatus: (id: string, status: Finding['status']) => Promise<void>;
  initialSelectedId?: string;
  onNavigate: (view: string) => void;
}

export const FindingsPage: React.FC<FindingsPageProps> = ({
  findings,
  onUpdateFindingStatus,
  initialSelectedId,
  onNavigate,
}) => {
  const [search, setSearch] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [activeFinding, setActiveFinding] = useState<Finding | null>(
    initialSelectedId ? findings.find((f) => f.id === initialSelectedId) || null : null
  );
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const extractUrls = (text: string): string[] => {
    if (!text) return [];
    const urlRegex = /(https?:\/\/[^\s"',\)]+)/g;
    const matches = text.match(urlRegex) || [];
    return Array.from(new Set(matches));
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      const matchSearch =
        !search ||
        f.title.toLowerCase().includes(search.toLowerCase()) ||
        f.description.toLowerCase().includes(search.toLowerCase()) ||
        f.assetHostname.toLowerCase().includes(search.toLowerCase()) ||
        (f.cve && f.cve.toLowerCase().includes(search.toLowerCase()));

      const matchSeverity = selectedSeverity === 'ALL' || f.severity === selectedSeverity;
      const matchStatus = selectedStatus === 'ALL' || f.status === selectedStatus;

      return matchSearch && matchSeverity && matchStatus;
    });
  }, [findings, search, selectedSeverity, selectedStatus]);

  const handleStatusChange = async (id: string, newStatus: Finding['status']) => {
    setUpdatingId(id);
    try {
      await onUpdateFindingStatus(id, newStatus);
      if (activeFinding && activeFinding.id === id) {
        setActiveFinding({ ...activeFinding, status: newStatus });
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const severityCounts = useMemo(() => {
    return {
      CRITICAL: findings.filter((f) => f.severity === 'CRITICAL' && f.status !== 'RESOLVED').length,
      HIGH: findings.filter((f) => f.severity === 'HIGH' && f.status !== 'RESOLVED').length,
      MEDIUM: findings.filter((f) => f.severity === 'MEDIUM' && f.status !== 'RESOLVED').length,
      LOW: findings.filter((f) => f.severity === 'LOW' && f.status !== 'RESOLVED').length,
    };
  }, [findings]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
            <AlertOctagon className="h-6 w-6 text-red-400" />
            Security Findings & Vulnerability Manager
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Prioritized inventory of exposed services, missing security headers, leaked credentials, and CVE risks.
          </p>
        </div>
      </div>

      {/* Severity Tabs Pill Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <button
          onClick={() => setSelectedSeverity('ALL')}
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
            selectedSeverity === 'ALL'
              ? 'bg-slate-800 border-slate-600 text-slate-100 shadow-md'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>All Findings</span>
          <span className="font-mono font-bold">{findings.length}</span>
        </button>

        <button
          onClick={() => setSelectedSeverity('CRITICAL')}
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
            selectedSeverity === 'CRITICAL'
              ? 'bg-red-500/20 border-red-500/50 text-red-300 shadow-md shadow-red-500/10'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-red-400'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Critical
          </span>
          <span className="font-mono font-bold text-red-400">{severityCounts.CRITICAL}</span>
        </button>

        <button
          onClick={() => setSelectedSeverity('HIGH')}
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
            selectedSeverity === 'HIGH'
              ? 'bg-orange-500/20 border-orange-500/50 text-orange-300 shadow-md shadow-orange-500/10'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-orange-400'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            High
          </span>
          <span className="font-mono font-bold text-orange-400">{severityCounts.HIGH}</span>
        </button>

        <button
          onClick={() => setSelectedSeverity('MEDIUM')}
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
            selectedSeverity === 'MEDIUM'
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-md shadow-amber-500/10'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-amber-400'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Medium
          </span>
          <span className="font-mono font-bold text-amber-400">{severityCounts.MEDIUM}</span>
        </button>

        <button
          onClick={() => setSelectedSeverity('LOW')}
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
            selectedSeverity === 'LOW'
              ? 'bg-blue-500/20 border-blue-500/50 text-blue-300 shadow-md shadow-blue-500/10'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-blue-400'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            Low
          </span>
          <span className="font-mono font-bold text-blue-400">{severityCounts.LOW}</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div className="relative min-w-[260px] flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search findings by CVE, vulnerability name, or target host..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700/80 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-2 text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open Only</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="FALSE_POSITIVE">False Positive</option>
          </select>
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-3">
        {filteredFindings.length === 0 ? (
          <div className="p-12 rounded-2xl border border-slate-800 bg-slate-900/40 text-center space-y-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-200">No matching security findings</h3>
            <p className="text-xs text-slate-500">
              No vulnerabilities match the specified filters for this scope.
            </p>
          </div>
        ) : (
          filteredFindings.map((f) => (
            <div
              key={f.id}
              onClick={() => setActiveFinding(f)}
              className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 hover:bg-slate-850/80 backdrop-blur-md cursor-pointer transition-all hover:border-slate-700 shadow-xl space-y-3 group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <SeverityBadge severity={f.severity} size="md" />
                  <span className="font-mono text-xs text-cyan-400">{f.assetHostname}</span>
                  {f.cve && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {f.cve}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <StatusBadge status={f.status} />
                  <span className="font-mono text-xs font-bold text-red-400">CVSS {f.cvssScore}</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                  {f.title}
                </h3>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed line-clamp-2">
                  {f.description}
                </p>
              </div>

              {/* Direct Open Data URLs on Card */}
              {extractUrls(`${f.description} ${f.evidence}`).length > 0 && (
                <div
                  className="p-2 rounded-lg bg-red-950/30 border border-red-500/30 flex flex-wrap items-center gap-2 text-[11px] font-mono text-red-300"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-red-400 font-bold flex items-center gap-1">
                    <FileWarning className="w-3.5 h-3.5" />
                    Open Data URL:
                  </span>
                  {extractUrls(`${f.description} ${f.evidence}`).slice(0, 2).map((url) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-0.5 rounded bg-slate-900 border border-red-500/40 text-cyan-300 hover:text-cyan-200 hover:underline flex items-center gap-1 truncate max-w-xs"
                      title={url}
                    >
                      <span className="truncate">{url}</span>
                      <ExternalLink className="w-3 h-3 shrink-0 text-cyan-400" />
                    </a>
                  ))}
                  {extractUrls(`${f.description} ${f.evidence}`).length > 2 && (
                    <span className="text-slate-400 text-[10px]">
                      +{extractUrls(`${f.description} ${f.evidence}`).length - 2} more
                    </span>
                  )}
                </div>
              )}

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500 font-sans">
                <div className="flex items-center gap-2">
                  <span className="uppercase text-[10px] font-bold text-slate-400">Category:</span>
                  <span className="text-slate-300">{f.category}</span>
                </div>

                <span className="text-cyan-400 group-hover:underline flex items-center gap-1">
                  Inspect & Remediate <ChevronRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Finding Detail Modal */}
      {activeFinding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={activeFinding.severity} size="md" />
                  <span className="font-mono text-xs text-cyan-400">{activeFinding.assetHostname}</span>
                  {activeFinding.cve && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {activeFinding.cve}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-100 mt-1">{activeFinding.title}</h3>
              </div>
              <button
                onClick={() => setActiveFinding(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500">CVSS v3.1</span>
                <div className="text-base font-mono font-extrabold text-red-400">
                  {activeFinding.cvssScore} / 10.0
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500">Remediation Effort</span>
                <div className="text-base font-mono font-bold text-cyan-400">
                  {activeFinding.remediationEffort}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500">Status</span>
                <div className="mt-1">
                  <StatusBadge status={activeFinding.status} />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Vulnerability Overview
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800 whitespace-pre-line">
                {activeFinding.description}
              </p>
            </div>

            {/* Leaked Open Data URLs Section */}
            {extractUrls(`${activeFinding.description} ${activeFinding.evidence}`).length > 0 && (
              <div className="space-y-2 p-3.5 rounded-xl bg-red-950/30 border border-red-500/30">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <FileWarning className="h-4 w-4 text-red-400" />
                    Direct Leaked Open Data URLs & Target Files
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">
                    Exact paths to find and audit open repository data
                  </span>
                </div>
                <div className="space-y-2">
                  {extractUrls(`${activeFinding.description} ${activeFinding.evidence}`).map((url) => (
                    <div
                      key={url}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs"
                    >
                      <div className="flex items-center gap-2 truncate text-cyan-300">
                        <span className="text-red-400 font-bold text-[10px] uppercase shrink-0">Open Path:</span>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline text-cyan-300 font-semibold truncate"
                          title="Open URL in new tab"
                        >
                          {url}
                        </a>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleCopyUrl(url)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition"
                        >
                          {copiedUrl === url ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-slate-400" />
                              <span>Copy URL</span>
                            </>
                          )}
                        </button>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[11px] border border-cyan-500/40 transition"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Evidence Snippet */}
            {activeFinding.evidence && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCode className="h-3.5 w-3.5 text-cyan-400" />
                  Scanner Technical Evidence
                </h4>
                <pre className="text-[11px] font-mono text-emerald-300 bg-slate-950 p-3 rounded-xl border border-slate-800 overflow-x-auto whitespace-pre-wrap">
                  {activeFinding.evidence}
                </pre>
              </div>
            )}

            {/* Remediation Guide */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                Recommended Remediation Steps
              </h4>
              <p className="text-xs text-slate-200 leading-relaxed bg-emerald-950/20 border border-emerald-500/30 p-3 rounded-xl">
                {activeFinding.recommendation}
              </p>
            </div>

            {/* Status Change Buttons */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-400">Update Finding Status:</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={updatingId === activeFinding.id}
                  onClick={() => handleStatusChange(activeFinding.id, 'IN_PROGRESS')}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-colors"
                >
                  In Progress
                </button>
                <button
                  disabled={updatingId === activeFinding.id}
                  onClick={() => handleStatusChange(activeFinding.id, 'RESOLVED')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition-colors"
                >
                  Mark Resolved
                </button>
                <button
                  disabled={updatingId === activeFinding.id}
                  onClick={() => handleStatusChange(activeFinding.id, 'FALSE_POSITIVE')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  False Positive
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
