// src/pages/TrafficPage.tsx
// HTTP Traffic History & Network Request Intercept Logger

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Send,
  Zap,
  Search,
  RefreshCw,
  Trash2,
  Copy,
  Check,
  Terminal,
  Code2,
  Filter,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../lib/api';
import { Target, HttpTrafficItem } from '../types';

interface TrafficPageProps {
  targets: Target[];
  selectedTargetId: string;
  onSendToRepeater: (req: { url: string; method: string; headers: Record<string, string>; body?: string }) => void;
  onSendToIntruder: (req: { url: string; method: string; headers: Record<string, string>; body?: string }) => void;
}

export const TrafficPage: React.FC<TrafficPageProps> = ({
  targets,
  selectedTargetId,
  onSendToRepeater,
  onSendToIntruder,
}) => {
  const [trafficLogs, setTrafficLogs] = useState<HttpTrafficItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<HttpTrafficItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [copiedCurl, setCopiedCurl] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'response' | 'request'>('response');

  const fetchTraffic = async () => {
    setLoading(true);
    try {
      const logs = await api.getTraffic(selectedTargetId);
      setTrafficLogs(logs);
      if (logs.length > 0 && !selectedItem) {
        setSelectedItem(logs[0]);
      }
    } catch (err) {
      console.error('Failed to fetch traffic logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTraffic();
  }, [selectedTargetId]);

  const handleClearTraffic = async () => {
    if (confirm('Clear all recorded HTTP request traffic history?')) {
      await api.clearTraffic();
      setTrafficLogs([]);
      setSelectedItem(null);
    }
  };

  const handleCopyCurl = (item: HttpTrafficItem) => {
    const headersStr = Object.entries(item.requestHeaders || {})
      .map(([k, v]) => `-H "${k}: ${v}"`)
      .join(' ');
    const bodyStr = item.requestBody ? `-d '${item.requestBody.replace(/'/g, "'\\''")}'` : '';
    const curl = `curl -X ${item.method} "${item.url}" ${headersStr} ${bodyStr}`.trim();
    navigator.clipboard.writeText(curl);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const filteredLogs = trafficLogs.filter((item) => {
    if (methodFilter !== 'ALL' && item.method !== methodFilter) return false;
    if (statusFilter !== 'ALL' && String(item.statusCode) !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.url.toLowerCase().includes(q) ||
        item.host.toLowerCase().includes(q) ||
        item.path.toLowerCase().includes(q) ||
        String(item.statusCode).includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-100 font-mono tracking-tight">
                HTTP PROXY & TRAFFIC HISTORY
              </h1>
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded font-mono">
                {trafficLogs.length} Requests
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live HTTP stream of all reconnaissance probes, automated queries, and security tests. Send any request directly into Repeater or Intruder.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTraffic}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded-lg border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleClearTraffic}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-400 text-xs font-mono rounded-lg border border-slate-700 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Logs
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Filter by URL, host, or path..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

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

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Status Codes</option>
            <option value="200">200 OK</option>
            <option value="302">302 Redirect</option>
            <option value="403">403 Forbidden</option>
            <option value="404">404 Not Found</option>
            <option value="500">500 Server Error</option>
          </select>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Showing <strong className="text-slate-200">{filteredLogs.length}</strong> of {trafficLogs.length}
        </div>
      </div>

      {/* Split Traffic Inspector View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Traffic Table */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="overflow-x-auto max-h-[520px]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/90 text-slate-400 sticky top-0 border-b border-slate-800 z-10">
                <tr>
                  <th className="py-2.5 px-3 w-16">Time</th>
                  <th className="py-2.5 px-3 w-16">Method</th>
                  <th className="py-2.5 px-3">Host & Path</th>
                  <th className="py-2.5 px-3 w-16">Status</th>
                  <th className="py-2.5 px-3 w-20">Length</th>
                  <th className="py-2.5 px-3 w-16">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      {trafficLogs.length === 0
                        ? 'No HTTP traffic recorded yet. Run a scan or send Repeater requests.'
                        : 'No requests match the active filter.'}
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((item) => {
                    const isSelected = selectedItem?.id === item.id;
                    const isSuccess = item.statusCode >= 200 && item.statusCode < 300;
                    const isRedirect = item.statusCode >= 300 && item.statusCode < 400;
                    const isClientErr = item.statusCode >= 400 && item.statusCode < 500;

                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className={`cursor-pointer transition ${
                          isSelected
                            ? 'bg-cyan-950/40 text-cyan-200 border-l-2 border-cyan-400'
                            : 'hover:bg-slate-800/50 text-slate-300'
                        }`}
                      >
                        <td className="py-2 px-3 text-slate-500 text-[10px]">{item.timestamp}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              item.method === 'GET'
                                ? 'bg-blue-500/20 text-blue-400'
                                : item.method === 'POST'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-purple-500/20 text-purple-400'
                            }`}
                          >
                            {item.method}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-200 truncate max-w-[240px]">
                          <span className="text-cyan-400 font-normal">{item.host}</span>
                          <span className="text-slate-400">{item.path}</span>
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              isSuccess
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : isRedirect
                                ? 'bg-cyan-500/20 text-cyan-400'
                                : isClientErr
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {item.statusCode || 'ERR'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-400">{item.bodySize ? `${item.bodySize} B` : '-'}</td>
                        <td className="py-2 px-3 text-slate-400">{item.latencyMs}ms</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Inspector & Action Panel */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col space-y-4">
          {selectedItem ? (
            <>
              {/* Action Buttons Top */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {selectedItem.method} {selectedItem.host}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      onSendToRepeater({
                        url: selectedItem.url,
                        method: selectedItem.method,
                        headers: selectedItem.requestHeaders,
                        body: selectedItem.requestBody,
                      })
                    }
                    className="flex items-center gap-1 px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 text-xs font-mono rounded border border-cyan-800 transition"
                    title="Send request to Repeater"
                  >
                    <Send className="w-3 h-3" />
                    Repeater
                  </button>

                  <button
                    onClick={() =>
                      onSendToIntruder({
                        url: selectedItem.url,
                        method: selectedItem.method,
                        headers: selectedItem.requestHeaders,
                        body: selectedItem.requestBody,
                      })
                    }
                    className="flex items-center gap-1 px-2.5 py-1 bg-red-950 hover:bg-red-900 text-red-300 text-xs font-mono rounded border border-red-800 transition"
                    title="Send request to Intruder"
                  >
                    <Zap className="w-3 h-3" />
                    Intruder
                  </button>

                  <button
                    onClick={() => handleCopyCurl(selectedItem)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded border border-slate-700 transition"
                    title="Copy as cURL command"
                  >
                    {copiedCurl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    cURL
                  </button>
                </div>
              </div>

              {/* Request / Response Switch Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <button
                  onClick={() => setActiveTab('response')}
                  className={`px-3 py-1 text-xs font-mono font-semibold rounded transition ${
                    activeTab === 'response'
                      ? 'bg-slate-800 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Response ({selectedItem.statusCode} {selectedItem.statusText})
                </button>
                <button
                  onClick={() => setActiveTab('request')}
                  className={`px-3 py-1 text-xs font-mono font-semibold rounded transition ${
                    activeTab === 'request'
                      ? 'bg-slate-800 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Request Headers & Body
                </button>
              </div>

              {/* Full Details Display */}
              {activeTab === 'response' ? (
                <div className="space-y-3 flex-1 flex flex-col">
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1">
                    <div>
                      HTTP/1.1 <strong className="text-emerald-400">{selectedItem.statusCode} {selectedItem.statusText}</strong>
                    </div>
                    {Object.entries(selectedItem.responseHeaders || {}).map(([k, v]) => (
                      <div key={k} className="text-slate-400">
                        <span className="text-slate-300">{k}:</span> {v}
                      </div>
                    ))}
                  </div>

                  <div className="flex-1 flex flex-col space-y-1">
                    <span className="text-[11px] font-mono text-slate-400">Response Body:</span>
                    <pre className="w-full flex-1 max-h-[260px] overflow-auto bg-slate-950 border border-slate-800 rounded p-3 font-mono text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {selectedItem.responseBody || '[No response body]'}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 flex-1 flex flex-col">
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1">
                    <div className="text-cyan-400 font-semibold">
                      {selectedItem.method} {selectedItem.path} HTTP/1.1
                    </div>
                    {Object.entries(selectedItem.requestHeaders || {}).map(([k, v]) => (
                      <div key={k} className="text-slate-400">
                        <span className="text-slate-300">{k}:</span> {v}
                      </div>
                    ))}
                  </div>

                  {selectedItem.requestBody && (
                    <div className="flex-1 flex flex-col space-y-1">
                      <span className="text-[11px] font-mono text-slate-400">Request Body:</span>
                      <pre className="w-full flex-1 max-h-[220px] overflow-auto bg-slate-950 border border-slate-800 rounded p-3 font-mono text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {selectedItem.requestBody}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-slate-500 font-mono text-xs">
              <Terminal className="w-8 h-8 text-slate-600 mb-2" />
              Select a request from the left table to inspect full headers and payload.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
