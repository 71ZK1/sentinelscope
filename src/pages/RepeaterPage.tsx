// src/pages/RepeaterPage.tsx
// High-Efficiency Burp Suite-style HTTP Security Repeater & Parameter Auditor

import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Send,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Code2,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  ArrowRight,
  Layers,
  FileText,
  Lock,
  Globe,
  Sliders,
  Sparkles,
  Info,
  Plus,
  X,
  Zap,
  ExternalLink,
  Download,
  Binary,
} from 'lucide-react';
import { api } from '../lib/api';
import { Target, Asset } from '../types';

interface RepeaterTab {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'PATCH';
  url: string;
  headersText: string;
  bodyText: string;
  responseResult: any;
  loading: boolean;
}

interface RepeaterPageProps {
  targets: Target[];
  selectedTargetId: string;
  assets: Asset[];
  initialRequest?: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  };
  onSendToIntruder?: (req: { url: string; method: string; headers: Record<string, string>; body?: string }) => void;
}

export const RepeaterPage: React.FC<RepeaterPageProps> = ({
  targets,
  selectedTargetId,
  assets,
  initialRequest,
  onSendToIntruder,
}) => {
  const activeTarget = targets.find((t) => t.id === selectedTargetId) || targets[0];
  const targetDomain = activeTarget ? activeTarget.domain : 'example.com';

  // Multi-Tab Repeater Workspace
  const [tabs, setTabs] = useState<RepeaterTab[]>([
    {
      id: 'tab_1',
      name: 'Req #1 (Users API)',
      method: (initialRequest?.method as any) || 'GET',
      url: initialRequest?.url || `https://${targetDomain}/api/v1/users?id=1042&role=admin`,
      headersText: initialRequest?.headers
        ? Object.entries(initialRequest.headers).map(([k, v]) => `${k}: ${v}`).join('\n')
        : 'User-Agent: SentinelScope-Probe/2.4\nAccept: application/json\nCache-Control: no-cache',
      bodyText: initialRequest?.body || '',
      responseResult: null,
      loading: false,
    },
  ]);

  const [activeTabId, setActiveTabId] = useState<string>('tab_1');
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  // Request & Response Sub-views
  const [requestSubTab, setRequestSubTab] = useState<'raw' | 'params' | 'headers' | 'body'>('raw');
  const [responseSubTab, setResponseSubTab] = useState<'response' | 'security' | 'raw' | 'history'>('response');

  // Payload Encoder / Decoder Tool
  const [showEncoder, setShowEncoder] = useState<boolean>(false);
  const [encodeInput, setEncodeInput] = useState<string>('admin\'; --');
  const [copiedCurl, setCopiedCurl] = useState<boolean>(false);
  const [copiedResponse, setCopiedResponse] = useState<boolean>(false);

  // Tab Manager Helpers
  const handleAddTab = (urlOverride?: string) => {
    const newId = `tab_${Date.now()}`;
    const newTab: RepeaterTab = {
      id: newId,
      name: `Req #${tabs.length + 1}`,
      method: 'GET',
      url: urlOverride || `https://${targetDomain}/api/v1/status`,
      headersText: 'User-Agent: SentinelScope-Probe/2.4\nAccept: application/json, */*\nCache-Control: no-cache',
      bodyText: '',
      responseResult: null,
      loading: false,
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
  };

  const handleCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const nextTabs = tabs.filter((t) => t.id !== id);
    setTabs(nextTabs);
    if (activeTabId === id) {
      setActiveTabId(nextTabs[0].id);
    }
  };

  const updateActiveTab = (updates: Partial<RepeaterTab>) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, ...updates } : t))
    );
  };

  // Sync initial request prop into tab if changed
  useEffect(() => {
    if (initialRequest && initialRequest.url) {
      updateActiveTab({
        url: initialRequest.url,
        method: (initialRequest.method as any) || 'GET',
        headersText: initialRequest.headers
          ? Object.entries(initialRequest.headers).map(([k, v]) => `${k}: ${v}`).join('\n')
          : activeTab.headersText,
        bodyText: initialRequest.body || '',
      });
    }
  }, [initialRequest]);

  // Execute Probe
  const handleSend = async () => {
    if (!activeTab.url) return;
    updateActiveTab({ loading: true });

    const parsedHeaders: Record<string, string> = {};
    activeTab.headersText.split('\n').forEach((line) => {
      const parts = line.split(':');
      if (parts.length >= 2) {
        const k = parts[0].trim();
        const v = parts.slice(1).join(':').trim();
        if (k) parsedHeaders[k] = v;
      }
    });

    try {
      const res = await api.sendRepeaterProbe({
        url: activeTab.url,
        method: activeTab.method,
        headers: parsedHeaders,
        body: ['POST', 'PUT', 'PATCH'].includes(activeTab.method) ? activeTab.bodyText : undefined,
      });

      updateActiveTab({
        responseResult: res,
        loading: false,
      });
    } catch (err: any) {
      updateActiveTab({
        responseResult: {
          success: false,
          error: err.message || 'Request failed',
          latencyMs: 0,
        },
        loading: false,
      });
    }
  };

  // Preset Template Actions
  const handleApplyTemplate = (type: 'headers' | 'options' | 'api' | 'disclosure') => {
    if (type === 'headers') {
      updateActiveTab({
        method: 'GET',
        headersText: 'User-Agent: SentinelScope-SecurityAuditor/2.4\nAccept: text/html, application/xhtml+xml\nSec-Fetch-Dest: document',
        bodyText: '',
      });
    } else if (type === 'options') {
      updateActiveTab({
        method: 'OPTIONS',
        headersText: `User-Agent: SentinelScope-Probe/2.4\nOrigin: https://${targetDomain}\nAccess-Control-Request-Method: POST`,
        bodyText: '',
      });
    } else if (type === 'api') {
      updateActiveTab({
        method: 'POST',
        headersText: 'User-Agent: SentinelScope-Probe/2.4\nContent-Type: application/json\nAccept: application/json',
        bodyText: '{\n  "query": "status_probe",\n  "format": "json"\n}',
      });
    } else if (type === 'disclosure') {
      updateActiveTab({
        method: 'GET',
        url: `https://${targetDomain}/non-existent-audit-probe-${Date.now()}`,
        headersText: 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)\nAccept: */*',
        bodyText: '',
      });
    }
  };

  // Copy as cURL
  const handleCopyCurl = () => {
    const headersList: string[] = [];
    activeTab.headersText.split('\n').forEach((l) => {
      if (l.includes(':')) headersList.push(`-H "${l.trim()}"`);
    });
    const bodyPart = activeTab.bodyText ? `-d '${activeTab.bodyText.replace(/'/g, "'\\''")}'` : '';
    const curl = `curl -X ${activeTab.method} "${activeTab.url}" ${headersList.join(' ')} ${bodyPart}`.trim();
    navigator.clipboard.writeText(curl);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  // Copy Response Body
  const handleCopyResponseBody = () => {
    if (activeTab.responseResult?.body) {
      navigator.clipboard.writeText(activeTab.responseResult.body);
      setCopiedResponse(true);
      setTimeout(() => setCopiedResponse(false), 2000);
    }
  };

  // Extract query parameters for interactive parameter editor
  const getQueryParams = (): { key: string; value: string }[] => {
    try {
      const u = new URL(activeTab.url);
      const list: { key: string; value: string }[] = [];
      u.searchParams.forEach((v, k) => {
        list.push({ key: k, value: v });
      });
      return list;
    } catch {
      return [];
    }
  };

  const handleUpdateQueryParam = (key: string, newValue: string) => {
    try {
      const u = new URL(activeTab.url);
      u.searchParams.set(key, newValue);
      updateActiveTab({ url: u.toString() });
    } catch {
      // url parse error
    }
  };

  const handleDeleteQueryParam = (key: string) => {
    try {
      const u = new URL(activeTab.url);
      u.searchParams.delete(key);
      updateActiveTab({ url: u.toString() });
    } catch {
      // url parse error
    }
  };

  const handleAddQueryParam = () => {
    try {
      const u = new URL(activeTab.url);
      u.searchParams.append('new_param', 'value');
      updateActiveTab({ url: u.toString() });
    } catch {
      // url parse error
    }
  };

  // Encodings computed
  const encodedUrl = encodeURIComponent(encodeInput);
  const encodedBase64 = (() => {
    try {
      return btoa(encodeInput);
    } catch {
      return 'Invalid Base64 string';
    }
  })();
  const decodedBase64 = (() => {
    try {
      return atob(encodeInput);
    } catch {
      return '[Invalid Base64 decode]';
    }
  })();
  const encodedHex = Array.from(new TextEncoder().encode(encodeInput))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(' ');

  return (
    <div className="space-y-6">
      {/* Top Header & Overview */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-100 font-mono tracking-tight">HTTP REPEATER & PROBE</h1>
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded uppercase font-mono">
                Burp Suite Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live HTTP/HTTPS request builder, parameter tampering, response inspection, and security header compliance engine.
            </p>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowEncoder(!showEncoder)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono border transition ${
              showEncoder
                ? 'bg-purple-950/60 text-purple-300 border-purple-500/50'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Binary className="w-3.5 h-3.5" />
            Encoder / Decoder
          </button>

          {onSendToIntruder && (
            <button
              onClick={() => {
                const parsedHeaders: Record<string, string> = {};
                activeTab.headersText.split('\n').forEach((l) => {
                  const parts = l.split(':');
                  if (parts.length >= 2) parsedHeaders[parts[0].trim()] = parts.slice(1).join(':').trim();
                });
                onSendToIntruder({
                  url: activeTab.url,
                  method: activeTab.method,
                  headers: parsedHeaders,
                  body: activeTab.bodyText,
                });
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-950/80 hover:bg-red-900/80 text-red-300 text-xs font-mono rounded-lg border border-red-700/60 transition"
              title="Send active request into Intruder for brute forcing"
            >
              <Zap className="w-3.5 h-3.5" />
              Send to Intruder
            </button>
          )}

          <button
            onClick={handleCopyCurl}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-lg border border-slate-700 transition"
            title="Copy as cURL"
          >
            {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            Copy cURL
          </button>
        </div>
      </div>

      {/* Payload Encoder / Decoder Drawer */}
      {showEncoder && (
        <div className="bg-slate-900 border border-purple-500/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-300 font-mono flex items-center gap-1.5">
              <Binary className="w-4 h-4 text-purple-400" />
              PAYLOAD ENCODER / DECODER TOOLBOX
            </span>
            <button
              onClick={() => setShowEncoder(false)}
              className="text-slate-500 hover:text-slate-300 text-xs font-mono"
            >
              Close ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Input Text:</label>
              <textarea
                value={encodeInput}
                onChange={(e) => setEncodeInput(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-purple-500/50"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">URL Encoded:</label>
              <div className="bg-slate-950 border border-slate-800 rounded p-2 text-xs font-mono text-cyan-300 break-all max-h-[72px] overflow-auto select-all">
                {encodedUrl}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Base64 Encoded:</label>
              <div className="bg-slate-950 border border-slate-800 rounded p-2 text-xs font-mono text-emerald-300 break-all max-h-[72px] overflow-auto select-all">
                {encodedBase64}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Hex Format:</label>
              <div className="bg-slate-950 border border-slate-800 rounded p-2 text-xs font-mono text-amber-300 break-all max-h-[72px] overflow-auto select-all">
                {encodedHex}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Tab Bar */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-mono font-semibold rounded-t-lg cursor-pointer border-t border-x transition ${
                isActive
                  ? 'bg-slate-900 text-cyan-400 border-slate-700 shadow-sm'
                  : 'bg-slate-950/60 text-slate-400 border-transparent hover:bg-slate-900/60 hover:text-slate-300'
              }`}
            >
              <span
                className={`text-[10px] font-bold ${
                  tab.method === 'GET' ? 'text-blue-400' : tab.method === 'POST' ? 'text-emerald-400' : 'text-purple-400'
                }`}
              >
                {tab.method}
              </span>
              <span className="truncate max-w-[140px]">{tab.name}</span>
              {tabs.length > 1 && (
                <button
                  onClick={(e) => handleCloseTab(tab.id, e)}
                  className="hover:text-red-400 p-0.5 text-slate-500 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        <button
          onClick={() => handleAddTab()}
          className="flex items-center gap-1 px-2.5 py-1.5 text-slate-400 hover:text-cyan-400 text-xs font-mono hover:bg-slate-900 rounded transition"
          title="New Request Tab"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Tab
        </button>
      </div>

      {/* Request Address Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-2">
          {/* Method Select */}
          <select
            value={activeTab.method}
            onChange={(e) => updateActiveTab({ method: e.target.value as any })}
            className="w-full md:w-32 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold font-mono text-cyan-400 focus:outline-none focus:border-cyan-500"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="HEAD">HEAD</option>
            <option value="OPTIONS">OPTIONS</option>
            <option value="PATCH">PATCH</option>
          </select>

          {/* URL Input */}
          <div className="relative flex-1 w-full">
            <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={activeTab.url}
              onChange={(e) => updateActiveTab({ url: e.target.value })}
              placeholder="https://api.example.com/v1/resource"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={activeTab.loading || !activeTab.url}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-mono text-xs font-bold rounded-lg shadow-lg shadow-cyan-500/20 transition cursor-pointer"
          >
            <Send className={`w-3.5 h-3.5 ${activeTab.loading ? 'animate-pulse' : ''}`} />
            {activeTab.loading ? 'PROBING...' : 'SEND'}
          </button>
        </div>

        {/* Quick Presets Line */}
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-mono pt-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-500 text-[11px]">Audit Presets:</span>
            <button
              onClick={() => handleApplyTemplate('headers')}
              className="px-2 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 text-[11px]"
            >
              Browser Headers
            </button>
            <button
              onClick={() => handleApplyTemplate('options')}
              className="px-2 py-1 bg-slate-950 hover:bg-slate-800 text-purple-300 rounded border border-slate-800 text-[11px]"
            >
              CORS Preflight
            </button>
            <button
              onClick={() => handleApplyTemplate('api')}
              className="px-2 py-1 bg-slate-950 hover:bg-slate-800 text-cyan-300 rounded border border-slate-800 text-[11px]"
            >
              JSON API POST
            </button>
            <button
              onClick={() => handleApplyTemplate('disclosure')}
              className="px-2 py-1 bg-slate-950 hover:bg-slate-800 text-amber-300 rounded border border-slate-800 text-[11px]"
            >
              404 Error Probe
            </button>
          </div>

          <div className="text-[11px] text-slate-500">
            Target Assets: {assets.length} hosts mapped
          </div>
        </div>
      </div>

      {/* Split Request / Response Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: REQUEST EDITOR */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              Request Configuration
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setRequestSubTab('raw')}
                className={`px-2.5 py-1 text-xs font-mono rounded ${
                  requestSubTab === 'raw' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Headers Text
              </button>
              <button
                onClick={() => setRequestSubTab('params')}
                className={`px-2.5 py-1 text-xs font-mono rounded ${
                  requestSubTab === 'params' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Params ({getQueryParams().length})
              </button>
              {['POST', 'PUT', 'PATCH'].includes(activeTab.method) && (
                <button
                  onClick={() => setRequestSubTab('body')}
                  className={`px-2.5 py-1 text-xs font-mono rounded ${
                    requestSubTab === 'body' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Body Payload
                </button>
              )}
            </div>
          </div>

          {/* Sub Tab: Raw Headers */}
          {requestSubTab === 'raw' && (
            <div className="flex-1 flex flex-col space-y-2">
              <span className="text-[11px] font-mono text-slate-400">HTTP Request Headers:</span>
              <textarea
                value={activeTab.headersText}
                onChange={(e) => updateActiveTab({ headersText: e.target.value })}
                rows={12}
                className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                placeholder="User-Agent: SentinelScope-Probe/2.4&#10;Accept: application/json"
              />
            </div>
          )}

          {/* Sub Tab: Interactive Query Parameters */}
          {requestSubTab === 'params' && (
            <div className="flex-1 flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">Interactive Query Parameter Tampering:</span>
                <button
                  onClick={handleAddQueryParam}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-[11px] font-mono"
                >
                  + Add Parameter
                </button>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-auto pr-1">
                {getQueryParams().length === 0 ? (
                  <div className="text-center py-8 text-slate-500 font-mono text-xs bg-slate-950 rounded p-4 border border-slate-800">
                    No query parameters currently in URL. Add <code>?key=value</code> or click Add Parameter.
                  </div>
                ) : (
                  getQueryParams().map((p, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-950 p-2 rounded border border-slate-800">
                      <span className="text-xs font-mono text-cyan-400 font-semibold w-28 truncate">{p.key}</span>
                      <input
                        type="text"
                        value={p.value}
                        onChange={(e) => handleUpdateQueryParam(p.key, e.target.value)}
                        className="flex-1 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-slate-200 focus:outline-none"
                      />
                      <button
                        onClick={() => handleDeleteQueryParam(p.key)}
                        className="text-slate-500 hover:text-red-400 p-1"
                        title="Delete parameter"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Sub Tab: Body */}
          {requestSubTab === 'body' && (
            <div className="flex-1 flex flex-col space-y-2">
              <span className="text-[11px] font-mono text-slate-400">POST / PUT Request Body:</span>
              <textarea
                value={activeTab.bodyText}
                onChange={(e) => updateActiveTab({ bodyText: e.target.value })}
                rows={12}
                className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                placeholder="{\n  &quot;key&quot;: &quot;value&quot;\n}"
              />
            </div>
          )}
        </div>

        {/* RIGHT: RESPONSE INSPECTOR & SECURITY AUDIT */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                Response Inspector
              </span>
              {activeTab.responseResult && (
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                    activeTab.responseResult.statusCode >= 200 && activeTab.responseResult.statusCode < 300
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : activeTab.responseResult.statusCode >= 300 && activeTab.responseResult.statusCode < 400
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  {activeTab.responseResult.statusCode || 'ERR'} {activeTab.responseResult.statusText || ''}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setResponseSubTab('response')}
                className={`px-2.5 py-1 text-xs font-mono rounded ${
                  responseSubTab === 'response' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Body
              </button>
              <button
                onClick={() => setResponseSubTab('security')}
                className={`px-2.5 py-1 text-xs font-mono rounded ${
                  responseSubTab === 'security' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Headers & Security Audit
              </button>
            </div>
          </div>

          {activeTab.responseResult ? (
            activeTab.responseResult.error ? (
              <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-lg text-red-300 text-xs font-mono space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  Probe Execution Failed
                </div>
                <p>{activeTab.responseResult.error}</p>
                <div className="text-[11px] text-slate-400">
                  Latency: {activeTab.responseResult.latencyMs} ms
                </div>
              </div>
            ) : responseSubTab === 'response' ? (
              <div className="flex-1 flex flex-col space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 bg-slate-950 p-2 rounded border border-slate-800">
                  <span>Size: <strong className="text-slate-200">{activeTab.responseResult.bodySize} bytes</strong></span>
                  <span>Latency: <strong className="text-slate-200">{activeTab.responseResult.latencyMs} ms</strong></span>
                  <button
                    onClick={handleCopyResponseBody}
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    {copiedResponse ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    Copy Body
                  </button>
                </div>

                <pre className="flex-1 max-h-[380px] overflow-auto bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {activeTab.responseResult.body || '[Empty Response Body]'}
                </pre>
              </div>
            ) : (
              /* Security Header Audit Tab */
              <div className="flex-1 space-y-3 overflow-auto max-h-[420px] pr-1">
                {activeTab.responseResult.securityAudit && (
                  <div className="space-y-2.5">
                    <span className="text-xs font-bold font-mono text-slate-300 block">
                      Security Headers Evaluation:
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                      {/* HSTS */}
                      <div className="p-2.5 bg-slate-950 rounded border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Strict-Transport-Security</span>
                          {activeTab.responseResult.securityAudit.hasHsts ? (
                            <span className="text-emerald-400 font-bold">✓ Enabled</span>
                          ) : (
                            <span className="text-red-400 font-bold">✗ Missing</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">{activeTab.responseResult.securityAudit.hstsValue}</p>
                      </div>

                      {/* CSP */}
                      <div className="p-2.5 bg-slate-950 rounded border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Content-Security-Policy</span>
                          {activeTab.responseResult.securityAudit.hasCsp ? (
                            <span className="text-emerald-400 font-bold">✓ Enabled</span>
                          ) : (
                            <span className="text-red-400 font-bold">✗ Missing</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">{activeTab.responseResult.securityAudit.cspValue}</p>
                      </div>

                      {/* X-Frame-Options */}
                      <div className="p-2.5 bg-slate-950 rounded border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">X-Frame-Options</span>
                          {activeTab.responseResult.securityAudit.hasXFrameOptions ? (
                            <span className="text-emerald-400 font-bold">✓ Enabled</span>
                          ) : (
                            <span className="text-amber-400 font-bold">✗ Missing</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">{activeTab.responseResult.securityAudit.xFrameOptionsValue}</p>
                      </div>

                      {/* X-Content-Type-Options */}
                      <div className="p-2.5 bg-slate-950 rounded border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">X-Content-Type-Options</span>
                          {activeTab.responseResult.securityAudit.hasXContentTypeOptions ? (
                            <span className="text-emerald-400 font-bold">✓ nosniff</span>
                          ) : (
                            <span className="text-amber-400 font-bold">✗ Missing</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500">MIME type sniffing protection</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Raw Response Headers List */}
                <div className="space-y-1 pt-2 border-t border-slate-800">
                  <span className="text-[11px] font-mono text-slate-400">Raw Response Headers:</span>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
                    {Object.entries(activeTab.responseResult.headers || {}).map(([k, v]) => (
                      <div key={k} className="break-all">
                        <span className="text-cyan-400 font-semibold">{k}:</span> {v as string}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-24 text-slate-500 font-mono text-xs">
              <Terminal className="w-8 h-8 text-slate-600 mb-2" />
              Configure your request parameters and click SEND to audit response.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
