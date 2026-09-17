// src/pages/EndpointsPage.tsx
// Catalog of Discovered API Endpoints & Dedicated Parameterized URLs View

import React, { useState, useEffect } from 'react';
import {
  Globe,
  Code2,
  Sliders,
  Send,
  Zap,
  Search,
  Filter,
  Check,
  Copy,
  AlertTriangle,
  Layers,
  ArrowRight,
  ShieldAlert,
  Terminal,
  ExternalLink,
  Lock,
  Sparkles,
  Info,
  RefreshCw,
} from 'lucide-react';
import { api } from '../lib/api';
import { Target, DiscoveredEndpoint, EndpointParameter } from '../types';

interface EndpointsPageProps {
  targets: Target[];
  selectedTargetId: string;
  onSendToRepeater: (req: { url: string; method: string; headers: Record<string, string>; body?: string }) => void;
  onSendToIntruder: (req: { url: string; method: string; headers: Record<string, string>; body?: string }) => void;
}

export const EndpointsPage: React.FC<EndpointsPageProps> = ({
  targets,
  selectedTargetId,
  onSendToRepeater,
  onSendToIntruder,
}) => {
  const activeTarget = targets.find((t) => t.id === selectedTargetId) || targets[0];
  const [endpoints, setEndpoints] = useState<DiscoveredEndpoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<'parameters' | 'apis' | 'all'>('parameters');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [paramCategoryFilter, setParamCategoryFilter] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchEndpoints = async () => {
    setLoading(true);
    try {
      const data = await api.getEndpoints({ targetId: selectedTargetId });
      setEndpoints(data);
    } catch (err) {
      console.error('Failed to load endpoints', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEndpoints();
  }, [selectedTargetId]);

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered lists
  const parameterizedEndpoints = endpoints.filter((e) => e.hasParameters);
  const apiEndpoints = endpoints.filter((e) => e.isApi);

  const currentList = selectedTab === 'parameters'
    ? parameterizedEndpoints
    : selectedTab === 'apis'
    ? apiEndpoints
    : endpoints;

  const filteredEndpoints = currentList.filter((ep) => {
    if (methodFilter !== 'ALL' && ep.method !== methodFilter) return false;
    if (paramCategoryFilter !== 'ALL') {
      const hasCat = ep.parameters.some((p) => p.category === paramCategoryFilter);
      if (!hasCat) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const inPath = ep.path.toLowerCase().includes(q);
      const inUrl = ep.url.toLowerCase().includes(q);
      const inHost = ep.hostname.toLowerCase().includes(q);
      const inParams = ep.parameters.some((p) => p.name.toLowerCase().includes(q));
      const inTags = ep.tags.some((t) => t.toLowerCase().includes(q));
      return inPath || inUrl || inHost || inParams || inTags;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Overview */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-100 font-mono tracking-tight">
                API & PARAMETER DISCOVERY
              </h1>
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded font-mono">
                {endpoints.length} Endpoints
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated surface mapping of REST/GraphQL APIs, OAuth endpoints, and parameterized URLs for security audits.
            </p>
          </div>
        </div>

        {/* Quick Stats Banner */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-center">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">URLs w/ Parameters</span>
            <span className="text-sm font-bold font-mono text-amber-400">{parameterizedEndpoints.length}</span>
          </div>
          <div className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-center">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">REST & GraphQL</span>
            <span className="text-sm font-bold font-mono text-cyan-400">{apiEndpoints.length}</span>
          </div>
          <button
            onClick={fetchEndpoints}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
            title="Refresh endpoints"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Tabs Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedTab('parameters')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-semibold rounded-lg transition ${
              selectedTab === 'parameters'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            URLs with Parameters (Dedicated)
            <span className="px-1.5 py-0.2 bg-amber-500/30 text-amber-300 rounded text-[10px]">
              {parameterizedEndpoints.length}
            </span>
          </button>

          <button
            onClick={() => setSelectedTab('apis')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-semibold rounded-lg transition ${
              selectedTab === 'apis'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            REST & GraphQL APIs
            <span className="px-1.5 py-0.2 bg-cyan-500/30 text-cyan-300 rounded text-[10px]">
              {apiEndpoints.length}
            </span>
          </button>

          <button
            onClick={() => setSelectedTab('all')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-semibold rounded-lg transition ${
              selectedTab === 'all'
                ? 'bg-slate-800 text-slate-200 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            All Endpoints ({endpoints.length})
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search URLs, params, hosts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* HTTP Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Methods</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>

          {/* Parameter Category Filter */}
          {selectedTab === 'parameters' && (
            <select
              value={paramCategoryFilter}
              onChange={(e) => setParamCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-amber-300 focus:outline-none"
            >
              <option value="ALL">All Parameter Types</option>
              <option value="ID">ID / IDOR</option>
              <option value="AUTH_TOKEN">Auth / Token</option>
              <option value="REDIRECT_URL">Redirect URL / SSRF</option>
              <option value="FILE_PATH">File Path / LFI</option>
              <option value="SEARCH_QUERY">Search / Reflection</option>
              <option value="DEBUG_FLAG">Debug Flags</option>
            </select>
          )}
        </div>
      </div>

      {/* Endpoints List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400 font-mono text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
            Scanning and cataloging target endpoint surfaces...
          </div>
        ) : filteredEndpoints.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500 font-mono text-xs">
            No endpoints discovered matching the current filter.
          </div>
        ) : (
          filteredEndpoints.map((ep) => {
            const isGet = ep.method === 'GET';
            const isPost = ep.method === 'POST';

            return (
              <div
                key={ep.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 transition space-y-3"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Endpoint URI & Host */}
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                        isGet
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : isPost
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      }`}
                    >
                      {ep.method}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-semibold text-slate-200 break-all">
                          {ep.url}
                        </span>
                        <button
                          onClick={() => handleCopyUrl(ep.url, ep.id)}
                          className="text-slate-500 hover:text-slate-300 transition"
                          title="Copy full URL"
                        >
                          {copiedId === ep.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-slate-400 flex-wrap">
                        <span>Host: <strong className="text-cyan-400">{ep.hostname}</strong></span>
                        <span>•</span>
                        <span>Type: <strong className="text-slate-300">{ep.apiType || 'HTTP'}</strong></span>
                        {ep.statusCode && (
                          <>
                            <span>•</span>
                            <span>Status: <strong className={ep.statusCode === 200 ? 'text-emerald-400' : 'text-amber-400'}>{ep.statusCode}</strong></span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 1-Click Action Buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() =>
                        onSendToRepeater({
                          url: ep.url,
                          method: ep.method,
                          headers: {
                            Host: ep.hostname,
                            'User-Agent': 'SentinelScope-Probe/2.4',
                            Accept: ep.isApi ? 'application/json' : '*/*',
                          },
                          body: ep.method === 'POST' ? '{\n  "query": "probe"\n}' : undefined,
                        })
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-700/60 rounded-lg text-xs font-mono font-semibold transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Send to Repeater
                    </button>

                    <button
                      onClick={() =>
                        onSendToIntruder({
                          url: ep.url,
                          method: ep.method,
                          headers: {
                            Host: ep.hostname,
                            'User-Agent': 'SentinelScope-Intruder/2.4',
                            Accept: ep.isApi ? 'application/json' : '*/*',
                          },
                          body: ep.method === 'POST' ? '{\n  "payload": "§test§"\n}' : undefined,
                        })
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/80 hover:bg-red-900/80 text-red-300 border border-red-700/60 rounded-lg text-xs font-mono font-semibold transition"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Send to Intruder
                    </button>
                  </div>
                </div>

                {/* Parameter Badges / Risk Indicators */}
                {ep.parameters.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2">
                    <span className="text-[11px] font-mono text-slate-400">
                      Discovered Parameters ({ep.parameters.length}):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {ep.parameters.map((p, idx) => {
                        const isSensitive = p.isSensitive || p.category === 'REDIRECT_URL' || p.category === 'FILE_PATH' || p.category === 'AUTH_TOKEN';
                        return (
                          <div
                            key={idx}
                            className={`px-2.5 py-1 rounded-lg border text-xs font-mono flex items-center gap-1.5 ${
                              isSensitive
                                ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                                : 'bg-slate-950 border-slate-800 text-slate-300'
                            }`}
                          >
                            <span className="text-slate-400">{p.type === 'QUERY' ? '?' : '$'}{p.name}</span>
                            {p.exampleValue && <span className="text-slate-500">={p.exampleValue}</span>}
                            <span className="px-1 py-0.2 rounded text-[10px] bg-slate-800 text-slate-400 ml-1">
                              {p.category}
                            </span>
                            {p.riskNote && (
                              <span className="text-[10px] text-amber-400 flex items-center gap-1 ml-1">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                {p.riskNote}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
