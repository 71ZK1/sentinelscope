// src/pages/DashboardPage.tsx
import React, { useState } from 'react';
import {
  ShieldAlert,
  Server,
  Globe,
  Radio,
  Zap,
  Activity,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  ExternalLink,
  Plus,
  Play,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { DashboardStats, Target, Scan } from '../types';
import { RiskScoreGauge } from '../components/RiskScoreGauge';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { ScanLiveTerminal } from '../components/ScanLiveTerminal';

interface DashboardPageProps {
  stats: DashboardStats | null;
  activeScan?: Scan | null;
  targets: Target[];
  selectedTargetId: string;
  onNavigate: (view: string) => void;
  onOpenAddTarget: () => void;
  onOpenStartScan: (target: Target) => void;
  onSelectFinding?: (findingId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stats,
  activeScan,
  targets,
  selectedTargetId,
  onNavigate,
  onOpenAddTarget,
  onOpenStartScan,
  onSelectFinding,
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'TERMINAL'>('OVERVIEW');

  const currentTarget = targets.find((t) => t.id === selectedTargetId) || targets[0];

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <span className="text-xs font-mono text-slate-400">Loading SentinelScope SOC telemetry...</span>
        </div>
      </div>
    );
  }

  const metricCards = [
    {
      title: 'Discovered Assets',
      value: stats.totalAssets,
      subValue: `${stats.liveHosts} Live Hosts (${Math.round((stats.liveHosts / Math.max(1, stats.totalAssets)) * 100)}%)`,
      icon: Server,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
      view: 'assets',
    },
    {
      title: 'Open Network Ports',
      value: stats.openServices,
      subValue: 'Across standard scanned ports',
      icon: Radio,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      view: 'assets',
    },
    {
      title: 'Critical Vulnerabilities',
      value: stats.criticalFindings,
      subValue: 'Immediate remediation required',
      icon: ShieldAlert,
      color: stats.criticalFindings > 0 ? 'text-red-400' : 'text-emerald-400',
      bg: stats.criticalFindings > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10',
      border: stats.criticalFindings > 0 ? 'border-red-500/30' : 'border-emerald-500/30',
      view: 'findings',
    },
    {
      title: 'High Severity Exposures',
      value: stats.highFindings,
      subValue: `${stats.mediumFindings} medium / ${stats.lowFindings} low`,
      icon: AlertTriangle,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20',
      view: 'findings',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner with Scope & Action */}
      <div className="relative rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-6 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
                {selectedTargetId ? 'SCOPE: ' + currentTarget?.domain : 'ENTERPRISE ATTACK SURFACE'}
              </span>
              <span className="text-slate-500 text-xs font-mono">•</span>
              <span className="text-xs text-slate-400">
                Last Recon:{' '}
                {stats.lastScanTime
                  ? new Date(stats.lastScanTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Recent'}
              </span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-100 tracking-tight">
              Attack Surface Management Overview
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Continuous reconnaissance telemetry identifying internet-facing subdomains, open cloud services,
              leaked software repositories, and misconfigured SSL/TLS endpoints.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {currentTarget && (
              <button
                onClick={() => onOpenStartScan(currentTarget)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
              >
                <Play className="h-4 w-4 fill-current" />
                Launch Recon Scan
              </button>
            )}

            <button
              onClick={onOpenAddTarget}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Scope
            </button>
          </div>
        </div>
      </div>

      {/* Active Scan Terminal Widget if scan is in progress */}
      {activeScan && activeScan.status === 'RUNNING' && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <ScanLiveTerminal
            scan={activeScan}
            onViewAssets={() => onNavigate('assets')}
          />
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              onClick={() => onNavigate(card.view)}
              className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 hover:bg-slate-850/80 backdrop-blur-sm cursor-pointer transition-all hover:border-slate-700 group shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">{card.title}</span>
                <div className={`p-2 rounded-xl border ${card.bg} ${card.color} ${card.border}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-extrabold font-mono text-slate-100">{card.value}</span>
                <ArrowUpRight className="h-4 w-4 text-slate-600 group-hover:text-cyan-400 transition-colors" />
              </div>
              <p className="mt-1 text-[11px] text-slate-500 font-medium">{card.subValue}</p>
            </div>
          );
        })}
      </div>

      {/* Main Charts & Risk Gauge Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Score Assessment Card */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-sm flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Overall Attack Surface Risk</h3>
                <p className="text-[11px] text-slate-400">Calculated based on verified CVEs & exposures</p>
              </div>
              <Zap className="h-4 w-4 text-cyan-400" />
            </div>

            <div className="py-6 flex flex-col items-center justify-center">
              <RiskScoreGauge
                score={stats.overallRiskScore}
                level={stats.overallRiskLevel}
                size="lg"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Critical Risks</span>
              <span className="font-mono font-bold text-red-400">{stats.criticalFindings} Findings</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">High Risks</span>
              <span className="font-mono font-bold text-orange-400">{stats.highFindings} Findings</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Medium & Low</span>
              <span className="font-mono text-amber-400">{stats.mediumFindings + stats.lowFindings} Findings</span>
            </div>

            <button
              onClick={() => onNavigate('findings')}
              className="w-full mt-2 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-cyan-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              Remediate Security Findings
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Severity Distribution Pie/Donut Chart */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-sm flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Vulnerability Severity Breakdown</h3>
                <p className="text-[11px] text-slate-400">Classified finding distribution</p>
              </div>
              <ShieldAlert className="h-4 w-4 text-orange-400" />
            </div>

            <div className="h-52 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.severityDistribution.filter((d) => d.count > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {stats.severityDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Legend Items */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
            {stats.severityDistribution.map((sev) => (
              <div key={sev.severity} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: sev.color }} />
                  <span className="text-slate-400 text-[11px]">{sev.severity}</span>
                </div>
                <span className="font-mono font-bold text-slate-200">{sev.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Most Common Open Ports Bar Chart */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-sm flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Top Exposed Ports & Services</h3>
                <p className="text-[11px] text-slate-400">External listening service frequency</p>
              </div>
              <Radio className="h-4 w-4 text-cyan-400" />
            </div>

            <div className="h-52 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.portDistribution} layout="vertical" margin={{ left: 10, right: 10, top: 10, bottom: 5 }}>
                  <XAxis type="number" stroke="#475569" fontSize={10} />
                  <YAxis
                    dataKey="service"
                    type="category"
                    stroke="#94a3b8"
                    fontSize={11}
                    width={70}
                    tickFormatter={(val) => val.slice(0, 9)}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                    itemStyle={{ color: '#06b6d4' }}
                    formatter={(val, name, item) => [`${val} hosts`, `Port ${item.payload.port} (${item.payload.service})`]}
                  />
                  <Bar dataKey="count" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Total listening listeners:</span>
            <span className="font-mono font-bold text-cyan-400">{stats.openServices} ports</span>
          </div>
        </div>
      </div>

      {/* Critical Findings Table & Discovered Assets Quick View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical & High Findings List */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-sm shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-red-400" />
              <h3 className="text-sm font-bold text-slate-100">Top Priority Vulnerabilities</h3>
            </div>
            <button
              onClick={() => onNavigate('findings')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
            >
              View All ({stats.criticalFindings + stats.highFindings + stats.mediumFindings})
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-4 divide-y divide-slate-800/60">
            {stats.recentFindings.slice(0, 5).map((f) => (
              <div
                key={f.id}
                onClick={() => {
                  if (onSelectFinding) onSelectFinding(f.id);
                  onNavigate('findings');
                }}
                className="py-3 flex items-start justify-between gap-3 hover:bg-slate-850/40 px-2 rounded-lg cursor-pointer transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={f.severity} size="sm" />
                    <span className="font-mono text-[11px] text-slate-400">{f.assetHostname}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-200 truncate">{f.title}</h4>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-bold text-red-400">CVSS {f.cvssScore}</span>
                  <div className="text-[10px] text-slate-500 uppercase">{f.category}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recently Discovered Assets */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-sm shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-100">Discovered Attack Surface Hosts</h3>
            </div>
            <button
              onClick={() => onNavigate('assets')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
            >
              Inventory ({stats.totalAssets})
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-4 divide-y divide-slate-800/60">
            {stats.recentlyDiscoveredAssets.slice(0, 5).map((a) => (
              <div
                key={a.id}
                onClick={() => onNavigate('assets')}
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-850/40 px-2 rounded-lg cursor-pointer transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-200 truncate">{a.hostname}</span>
                    <StatusBadge status={a.status} />
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                    <span>IP: {a.primaryIp || 'Unresolved'}</span>
                    {a.webServer && <span>• {a.webServer}</span>}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-mono font-bold text-slate-300">
                    {a.services?.length || 0} Ports
                  </div>
                  <span className="text-[10px] text-cyan-400 font-mono">
                    SSL {a.sslGrade || 'N/A'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
