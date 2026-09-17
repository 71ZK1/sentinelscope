// src/pages/AssetsPage.tsx
import React, { useState, useMemo } from 'react';
import {
  Server,
  Search,
  Filter,
  Download,
  ExternalLink,
  ShieldAlert,
  Globe,
  Radio,
  Lock,
  Layers,
  ChevronRight,
  X,
  FileCode,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Asset, Finding } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { SeverityBadge } from '../components/SeverityBadge';
import { RiskBadge } from '../components/RiskBadge';

interface AssetsPageProps {
  assets: Asset[];
  findings: Finding[];
  onSelectFinding?: (id: string) => void;
  onNavigate: (view: string) => void;
  initialSearch?: string;
}

export const AssetsPage: React.FC<AssetsPageProps> = ({
  assets,
  findings,
  onSelectFinding,
  onNavigate,
  initialSearch = '',
}) => {
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Sync initial search if changed externally
  React.useEffect(() => {
    if (initialSearch) {
      setSearch(initialSearch);
      const match = assets.find(
        (a) =>
          a.hostname.toLowerCase() === initialSearch.toLowerCase() ||
          a.primaryIp === initialSearch ||
          a.hostname.toLowerCase().includes(initialSearch.toLowerCase())
      );
      if (match) {
        setSelectedAsset(match);
      }
    }
  }, [initialSearch, assets]);

  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      const matchSearch =
        !search ||
        a.hostname.toLowerCase().includes(search.toLowerCase()) ||
        (a.primaryIp && a.primaryIp.includes(search)) ||
        (a.webServer && a.webServer.toLowerCase().includes(search.toLowerCase())) ||
        a.services?.some((s) => s.name.toLowerCase().includes(search.toLowerCase()) || String(s.port).includes(search));

      const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;
      const matchType = typeFilter === 'ALL' || a.assetType === typeFilter;

      return matchSearch && matchStatus && matchType;
    });
  }, [assets, search, statusFilter, typeFilter]);

  // Export JSON
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredAssets, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `sentinelscope-assets-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['Hostname', 'Status', 'Type', 'Primary IP', 'Risk Score', 'Risk Level', 'Web Server', 'SSL Grade', 'Open Ports'];
    const rows = filteredAssets.map((a) => [
      a.hostname,
      a.status,
      a.assetType,
      a.primaryIp || 'N/A',
      a.riskScore,
      a.riskLevel,
      `"${a.webServer || 'N/A'}"`,
      a.sslGrade || 'N/A',
      `"${a.services?.map((s) => `${s.port}/${s.name}`).join(', ') || 'None'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', `sentinelscope-assets-${Date.now()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
            <Server className="h-6 w-6 text-cyan-400" />
            Attack Surface Asset Inventory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete inventory of discovered hostnames, IP endpoints, listening services, and software stacks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
          <button
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-semibold border border-cyan-500/30 transition-colors"
          >
            <FileCode className="h-3.5 w-3.5" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search hostname, IP, port (e.g. 6379), server..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700/80 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-2 text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="LIVE">Live Endpoints</option>
              <option value="UNRESPONSIVE">Unresponsive</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-2 text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Asset Types</option>
              <option value="ROOT_DOMAIN">Root Domain</option>
              <option value="SUBDOMAIN">Subdomain</option>
              <option value="API_ENDPOINT">API Endpoint</option>
              <option value="MAIL_SERVER">Mail Server</option>
            </select>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Showing <span className="text-cyan-400 font-bold">{filteredAssets.length}</span> of {assets.length} Assets
        </div>
      </div>

      {/* Asset Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-4">Hostname & Status</th>
                <th className="py-3.5 px-4">Primary IP & ASN</th>
                <th className="py-3.5 px-4">Open Ports / Services</th>
                <th className="py-3.5 px-4">Web / SSL</th>
                <th className="py-3.5 px-4">Risk Level</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredAssets.map((asset) => {
                const assetFindings = findings.filter((f) => f.assetId === asset.id);
                const hasCritical = assetFindings.some((f) => f.severity === 'CRITICAL');

                return (
                  <tr
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset)}
                    className="hover:bg-slate-850/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-sans">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-100">{asset.hostname}</span>
                        <StatusBadge status={asset.status} />
                      </div>
                      <div className="text-[11px] text-slate-500 font-sans mt-0.5">{asset.assetType}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-slate-300">{asset.primaryIp || 'Unresolved'}</span>
                      {asset.ipAddresses && asset.ipAddresses[0]?.asn && (
                        <div className="text-[10px] text-slate-500 font-sans">{asset.ipAddresses[0].asn}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-sans">
                      <div className="flex flex-wrap gap-1">
                        {asset.services && asset.services.length > 0 ? (
                          asset.services.slice(0, 3).map((s) => (
                            <span
                              key={s.id}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                                s.port === 6379 || s.port === 3306
                                  ? 'bg-red-500/15 text-red-400 border-red-500/30'
                                  : 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}
                            >
                              {s.port}/{s.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-600 text-[11px]">No open ports</span>
                        )}
                        {asset.services && asset.services.length > 3 && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            +{asset.services.length - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-sans">
                      <div className="text-slate-300 text-xs truncate max-w-[140px]">
                        {asset.webServer || '—'}
                      </div>
                      {asset.sslGrade && (
                        <span className="text-[10px] font-mono text-cyan-400 font-bold">
                          SSL Grade {asset.sslGrade}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <RiskBadge level={asset.riskLevel} score={asset.riskScore} />
                    </td>

                    <td className="py-3.5 px-4 text-right font-sans">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAsset(asset);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Asset Detail Drawer */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 p-6 overflow-y-auto shadow-2xl flex flex-col justify-between">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-mono font-extrabold text-slate-100">
                      {selectedAsset.hostname}
                    </span>
                    <StatusBadge status={selectedAsset.status} />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Asset ID: {selectedAsset.id}</p>
                </div>
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Risk & IP Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Risk Assessment</span>
                  <div className="pt-1">
                    <RiskBadge level={selectedAsset.riskLevel} score={selectedAsset.riskScore} />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">IP & Routing</span>
                  <div className="font-mono text-xs text-slate-200 font-bold">
                    {selectedAsset.primaryIp || 'Unresolved'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {selectedAsset.ipAddresses?.[0]?.organization || 'Public ASN'}
                  </div>
                </div>
              </div>

              {/* Open Services & Ports */}
              <div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                  Open Services & Ports ({selectedAsset.services?.length || 0})
                </h3>
                <div className="space-y-2">
                  {selectedAsset.services?.map((s) => (
                    <div
                      key={s.id}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between font-mono text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-cyan-400">{s.port}/{s.protocol}</span>
                        <span className="text-slate-300 font-sans">{s.name}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-sans">{s.product || 'Standard Service'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technologies Fingerprinted */}
              {selectedAsset.technologies && selectedAsset.technologies.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                    Technologies Fingerprinted
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedAsset.technologies.map((t) => (
                      <span
                        key={t.id}
                        className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-medium"
                      >
                        {t.name} {t.version && <span className="font-mono text-[10px]">v{t.version}</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* DNS Records */}
              {selectedAsset.dnsRecords && selectedAsset.dnsRecords.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                    DNS Records
                  </h3>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5 font-mono text-[11px]">
                    {selectedAsset.dnsRecords.map((rec, i) => (
                      <div key={i} className="flex items-start gap-2 text-slate-300">
                        <span className="font-bold text-cyan-400 w-12 shrink-0">{rec.type}</span>
                        <span className="text-slate-400 truncate">{rec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Associated Findings */}
              <div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                  Correlated Security Findings
                </h3>
                {findings.filter((f) => f.assetId === selectedAsset.id).length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-500 text-center">
                    No active security findings correlated with this host.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {findings
                      .filter((f) => f.assetId === selectedAsset.id)
                      .map((f) => (
                        <div
                          key={f.id}
                          onClick={() => {
                            if (onSelectFinding) onSelectFinding(f.id);
                            onNavigate('findings');
                          }}
                          className="p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <SeverityBadge severity={f.severity} size="sm" />
                              <span className="text-xs font-bold text-slate-200">{f.title}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-1">{f.description}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-500 shrink-0 ml-2" />
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedAsset(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
