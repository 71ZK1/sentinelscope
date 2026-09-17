// src/pages/ReportsPage.tsx
import React, { useState } from 'react';
import {
  FileCheck,
  Printer,
  Download,
  ShieldAlert,
  ShieldCheck,
  Server,
  Globe,
  Calendar,
  Layers,
} from 'lucide-react';
import { Target, Asset, Finding, Scan } from '../types';
import { SeverityBadge } from '../components/SeverityBadge';
import { RiskScoreGauge } from '../components/RiskScoreGauge';

interface ReportsPageProps {
  targets: Target[];
  selectedTargetId: string;
  assets: Asset[];
  findings: Finding[];
  scans: Scan[];
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  targets,
  selectedTargetId,
  assets,
  findings,
  scans,
}) => {
  const [activeTargetId, setActiveTargetId] = useState(selectedTargetId || targets[0]?.id || '');

  const currentTarget = targets.find((t) => t.id === activeTargetId) || targets[0];
  const targetAssets = assets.filter((a) => a.targetId === currentTarget?.id);
  const targetFindings = findings.filter((f) => f.targetId === currentTarget?.id);

  const criticalFindings = targetFindings.filter((f) => f.severity === 'CRITICAL');
  const highFindings = targetFindings.filter((f) => f.severity === 'HIGH');
  const mediumFindings = targetFindings.filter((f) => f.severity === 'MEDIUM');
  const lowFindings = targetFindings.filter((f) => f.severity === 'LOW');

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadReportJson = () => {
    const reportData = {
      title: `SentinelScope Security Assessment Report - ${currentTarget?.domain}`,
      generatedAt: new Date().toISOString(),
      target: currentTarget,
      metrics: {
        totalAssets: targetAssets.length,
        liveHosts: targetAssets.filter((a) => a.status === 'LIVE').length,
        totalFindings: targetFindings.length,
        critical: criticalFindings.length,
        high: highFindings.length,
        medium: mediumFindings.length,
        low: lowFindings.length,
      },
      criticalFindings,
      highFindings,
      assets: targetAssets,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `sentinelscope-report-${currentTarget?.domain}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  if (!currentTarget) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        No target selected for report generation.
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
            <FileCheck className="h-6 w-6 text-cyan-400" />
            Executive Attack Surface Assessment Report
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Formal security assessment findings and attack surface inventory for leadership and audit compliance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={activeTargetId}
            onChange={(e) => setActiveTargetId(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
          >
            {targets.map((t) => (
              <option key={t.id} value={t.id}>
                {t.domain}
              </option>
            ))}
          </select>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            Print / PDF
          </button>

          <button
            onClick={handleDownloadReportJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-semibold border border-cyan-500/30 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Printable Report Document Container */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl space-y-8 print:border-none print:bg-white print:text-black print:p-0">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 print:border-gray-300 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-wider text-slate-100 print:text-black font-mono">
                SENTINELSCOPE
              </span>
              <span className="text-xs font-bold text-cyan-400 font-mono">SECURITY ASSESSMENT</span>
            </div>
            <p className="text-xs text-slate-400 print:text-gray-600 mt-1">
              Automated Attack Surface Management & Threat Reconnaissance
            </p>
          </div>

          <div className="text-right text-xs font-mono text-slate-400 print:text-gray-600 space-y-0.5">
            <div>Report ID: REP-{currentTarget.domain.toUpperCase()}-2026</div>
            <div>Generated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</div>
            <div className="text-emerald-400 print:text-emerald-700 font-bold">Scope Confirmed: {currentTarget.authorizedBy}</div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2 space-y-3">
            <h2 className="text-base font-bold text-slate-100 print:text-black uppercase tracking-wider">
              1. Executive Summary
            </h2>
            <p className="text-xs text-slate-300 print:text-gray-800 leading-relaxed">
              During this authorized security assessment of target domain <strong className="font-mono text-cyan-400 print:text-blue-700">{currentTarget.domain}</strong>,
              SentinelScope discovered <strong className="font-bold text-slate-100 print:text-black">{targetAssets.length} internet-facing assets</strong> and identified{' '}
              <strong className="font-bold text-red-400 print:text-red-700">{criticalFindings.length} Critical</strong> and{' '}
              <strong className="font-bold text-orange-400 print:text-orange-700">{highFindings.length} High</strong> priority vulnerabilities.
            </p>
            <p className="text-xs text-slate-400 print:text-gray-600 leading-relaxed">
              Immediate remediation is advised for exposed administrative endpoints, database listener bindings, and source repository disclosures to reduce public attack exposure.
            </p>
          </div>

          <div className="flex justify-center p-4 rounded-xl bg-slate-950/60 print:bg-gray-100 border border-slate-800 print:border-gray-300">
            <RiskScoreGauge score={currentTarget.riskScore} level={currentTarget.riskLevel} size="md" showDetailsButton={false} />
          </div>
        </div>

        {/* Metric Summary Boxes */}
        <div>
          <h2 className="text-base font-bold text-slate-100 print:text-black uppercase tracking-wider mb-3">
            2. Key Reconnaissance Metrics
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950 print:bg-gray-100 border border-slate-800 print:border-gray-300 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 print:text-gray-600">Total Assets</span>
              <div className="text-xl font-mono font-extrabold text-cyan-400 print:text-blue-700">{targetAssets.length}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 print:bg-gray-100 border border-slate-800 print:border-gray-300 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 print:text-gray-600">Live Endpoints</span>
              <div className="text-xl font-mono font-extrabold text-emerald-400 print:text-emerald-700">
                {targetAssets.filter((a) => a.status === 'LIVE').length}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 print:bg-gray-100 border border-slate-800 print:border-gray-300 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 print:text-gray-600">Critical Risks</span>
              <div className="text-xl font-mono font-extrabold text-red-400 print:text-red-700">{criticalFindings.length}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 print:bg-gray-100 border border-slate-800 print:border-gray-300 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 print:text-gray-600">High Risks</span>
              <div className="text-xl font-mono font-extrabold text-orange-400 print:text-orange-700">{highFindings.length}</div>
            </div>
          </div>
        </div>

        {/* Priority Findings Section */}
        <div>
          <h2 className="text-base font-bold text-slate-100 print:text-black uppercase tracking-wider mb-3">
            3. Prioritized Security Findings
          </h2>
          <div className="space-y-3">
            {[...criticalFindings, ...highFindings].map((f) => (
              <div
                key={f.id}
                className="p-4 rounded-xl bg-slate-950 print:bg-gray-50 border border-slate-800 print:border-gray-300 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={f.severity} size="sm" />
                    <span className="font-mono text-xs font-bold text-slate-200 print:text-black">{f.title}</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-red-400 print:text-red-700">
                    CVSS {f.cvssScore}
                  </span>
                </div>
                <p className="text-xs text-slate-400 print:text-gray-700 leading-relaxed">{f.description}</p>
                <div className="p-2.5 rounded-lg bg-slate-900 print:bg-gray-100 border border-slate-800 print:border-gray-200 text-xs text-slate-300 print:text-gray-800">
                  <strong className="text-emerald-400 print:text-emerald-700">Remediation:</strong> {f.recommendation}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Asset Inventory Table */}
        <div>
          <h2 className="text-base font-bold text-slate-100 print:text-black uppercase tracking-wider mb-3">
            4. Discovered Attack Surface Assets
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 print:bg-gray-100 border-b border-slate-800 print:border-gray-300 text-[10px] text-slate-400 print:text-gray-600">
                <tr>
                  <th className="p-2">Hostname</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">IP Address</th>
                  <th className="p-2">Open Ports</th>
                  <th className="p-2">SSL Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-gray-200">
                {targetAssets.map((a) => (
                  <tr key={a.id}>
                    <td className="p-2 font-bold text-slate-200 print:text-black">{a.hostname}</td>
                    <td className="p-2 text-slate-400 print:text-gray-600">{a.status}</td>
                    <td className="p-2 text-slate-400 print:text-gray-600">{a.primaryIp || '—'}</td>
                    <td className="p-2 text-slate-300 print:text-gray-800">
                      {a.services?.map((s) => s.port).join(', ') || '—'}
                    </td>
                    <td className="p-2 text-cyan-400 print:text-blue-700">{a.sslGrade || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
