// src/pages/IntruderPage.tsx
// Burp Suite-style Intruder Tool for Parameter Fuzzing, Brute-Force, and Security Audits

import React, { useState, useEffect, useRef } from 'react';
import {
  Zap,
  Play,
  Pause,
  Square,
  RefreshCw,
  Send,
  Sliders,
  FileText,
  Layers,
  Search,
  ArrowRight,
  ShieldAlert,
  Check,
  Copy,
  Download,
  Upload,
  AlertTriangle,
  Code2,
  Terminal,
  Target as TargetIcon,
  Sparkles,
  Info,
  CheckCircle2,
  Filter,
  FileUp,
  Trash2,
  Shuffle,
  FileSpreadsheet,
} from 'lucide-react';
import { api } from '../lib/api';
import { Target, Asset } from '../types';

interface IntruderPageProps {
  targets: Target[];
  selectedTargetId: string;
  assets: Asset[];
  initialRequest?: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  };
  onSendToRepeater?: (req: { url: string; method: string; headers: Record<string, string>; body?: string }) => void;
}

interface AttackResultItem {
  id: number;
  payload: string;
  payloads?: string[];
  method: string;
  url: string;
  statusCode: number;
  statusText?: string;
  bodySize: number;
  latencyMs: number;
  matched: boolean;
  matchPatterns: string[];
  requestHeaders: Record<string, string>;
  requestBody?: string;
  responseHeaders: Record<string, string>;
  responseBody?: string;
  error?: string;
}

// Built-in high-quality wordlists
const PRESET_WORDLISTS: Record<string, string[]> = {
  'Top Passwords': [
    'admin', 'password', '123456', 'admin123', 'root', 'toor', 'pass123', 'welcome', 'login', 'security',
    'secret', 'master', 'lizki', 'sentinel', 'operator', 'test1234', 'qwerty', 'support', 'service'
  ],
  'Usernames': [
    'admin', 'administrator', 'lizki', 'root', 'service_account', 'dev', 'test', 'analyst', 'support', 'guest',
    'ops', 'security_auditor', 'api_user', 'system', 'manager', 'editor', 'backup'
  ],
  'User IDs (1-20)': Array.from({ length: 20 }, (_, i) => String(i + 1)),
  'Admin Paths': [
    'admin', 'administrator', 'api/v1/admin', 'cpanel', 'dashboard', 'panel', 'manage', 'config', 'swagger', 'metrics',
    'debug', 'healthz', 'backup.sql', '.env', 'actuator', 'console', 'portal', 'server-status'
  ],
  'SQL Injection Quick Test': [
    "'", "''", "' OR '1'='1", "' OR '1'='1' --", "' OR 1=1 #", "admin' --", "1' ORDER BY 1--+", "1' UNION SELECT null,version()--+"
  ],
  'XSS Vectors': [
    "<script>alert(1)</script>", "\"><img src=x onerror=alert(1)>", "javascript:alert(1)", "<svg/onload=alert(1)>", "{{7*7}}"
  ],
  'Path Traversal / LFI': [
    "../../../../etc/passwd", "..\\..\\..\\windows\\win.ini", "/etc/passwd", "....//....//etc/passwd", "%2e%2e%2f%2e%2e%2fetc%2fpasswd"
  ],
  'Git & Sensitive Files': [
    '.git/HEAD', '.git/config', '.git/index', '.git/logs/HEAD', '.env', '.env.local', '.env.production',
    'wp-config.php.bak', 'config.json', 'docker-compose.yml', 'server.key', 'id_rsa', 'backup.zip', 'dump.sql'
  ],
  'Common Parameters': [
    'id', 'user_id', 'account_id', 'file', 'doc', 'path', 'url', 'target', 'redirect', 'query',
    'debug', 'verbose', 'role', 'admin', 'key', 'token', 'access_token', 'page', 'limit', 'format'
  ],
};

export const IntruderPage: React.FC<IntruderPageProps> = ({
  targets,
  selectedTargetId,
  assets,
  initialRequest,
  onSendToRepeater,
}) => {
  const activeTarget = targets.find((t) => t.id === selectedTargetId) || targets[0];
  const targetDomain = activeTarget ? activeTarget.domain : 'example.com';

  // Sub-tabs
  const [activeTab, setActiveTab] = useState<'positions' | 'payloads' | 'options' | 'results'>('positions');

  // Attack Type
  const [attackType, setAttackType] = useState<'Sniper' | 'Battering Ram' | 'Pitchfork' | 'Cluster Bomb'>('Sniper');

  // Target Settings
  const [targetUrl, setTargetUrl] = useState<string>(
    initialRequest?.url || `https://${targetDomain}/api/v1/users?id=§1042§`
  );

  // Raw Request with § markers
  const [requestText, setRequestText] = useState<string>(() => {
    if (initialRequest) {
      const headersStr = Object.entries(initialRequest.headers || {})
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n');
      return `${initialRequest.method || 'GET'} ${initialRequest.url || `https://${targetDomain}/api/v1/users?id=§1042§`} HTTP/1.1\n${headersStr || 'Host: ' + targetDomain + '\nUser-Agent: SentinelScope-Intruder/2.4\nAccept: */*'}\n\n${initialRequest.body || ''}`;
    }
    return `GET https://${targetDomain}/api/v1/users?id=§1042§ HTTP/1.1\nHost: ${targetDomain}\nUser-Agent: SentinelScope-Intruder/2.4\nAccept: application/json, */*\nAuthorization: Bearer §sec_token_984§\n\n`;
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Payloads Settings
  const [selectedWordlistPreset, setSelectedWordlistPreset] = useState<string>('User IDs (1-20)');
  const [customPayloads, setCustomPayloads] = useState<string>(PRESET_WORDLISTS['User IDs (1-20)'].join('\n'));
  const [urlEncodePayloads, setUrlEncodePayloads] = useState<boolean>(true);
  const [base64EncodePayloads, setBase64EncodePayloads] = useState<boolean>(false);
  const [payloadPrefix, setPayloadPrefix] = useState<string>('');
  const [payloadSuffix, setPayloadSuffix] = useState<string>('');

  // Uploaded wordlist metadata
  const [uploadedFileInfo, setUploadedFileInfo] = useState<{
    name: string;
    size: string;
    count: number;
  } | null>(null);
  const [uploadMode, setUploadMode] = useState<'replace' | 'append'>('replace');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);

  // Options Settings
  const [threads, setThreads] = useState<number>(5);
  const [delayMs, setDelayMs] = useState<number>(100);
  const [grepMatchPatterns, setGrepMatchPatterns] = useState<string>('admin\nroot\nsuccess\nerror\nInvalid\nForbidden');

  // Attack Execution State
  const [isAttacking, setIsAttacking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [attackProgress, setAttackProgress] = useState<number>(0);
  const [results, setResults] = useState<AttackResultItem[]>([]);
  const [selectedResult, setSelectedResult] = useState<AttackResultItem | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [matchOnlyFilter, setMatchOnlyFilter] = useState<boolean>(false);

  const abortControllerRef = useRef<boolean>(false);

  // Sync preset to custom payloads
  const handleSelectPreset = (name: string) => {
    setSelectedWordlistPreset(name);
    if (PRESET_WORDLISTS[name]) {
      setCustomPayloads(PRESET_WORDLISTS[name].join('\n'));
      setUploadedFileInfo(null);
      setUploadFeedback(null);
    }
  };

  // Wordlist File Upload Handler
  const parseWordlistText = (text: string): string[] => {
    // Support newline-delimited or comma-separated lists
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'));
    return lines;
  };

  const handleProcessFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) {
          setUploadFeedback('Error: File is empty.');
          return;
        }
        const lines = parseWordlistText(text);
        if (lines.length === 0) {
          setUploadFeedback('Warning: No valid payload lines found in file.');
          return;
        }

        const formattedSize = file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
          : `${(file.size / 1024).toFixed(1)} KB`;

        if (uploadMode === 'append') {
          const currentList = customPayloads.split('\n').filter(Boolean);
          const merged = [...currentList, ...lines];
          setCustomPayloads(merged.join('\n'));
          setUploadedFileInfo({
            name: file.name,
            size: formattedSize,
            count: lines.length,
          });
          setUploadFeedback(`Appended ${lines.length} items from "${file.name}" (Total: ${merged.length})`);
        } else {
          setCustomPayloads(lines.join('\n'));
          setUploadedFileInfo({
            name: file.name,
            size: formattedSize,
            count: lines.length,
          });
          setSelectedWordlistPreset(`Custom: ${file.name}`);
          setUploadFeedback(`Loaded ${lines.length} items from "${file.name}" (${formattedSize})`);
        }
      } catch (err: any) {
        setUploadFeedback(`Failed to parse file: ${err.message || 'Unknown error'}`);
      }
    };
    reader.onerror = () => {
      setUploadFeedback('Failed to read file.');
    };
    reader.readAsText(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleProcessFile(files[0]);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleProcessFile(files[0]);
    }
  };

  const handleExportPayloads = () => {
    const blob = new Blob([customPayloads], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `intruder_wordlist_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeduplicate = () => {
    const list = customPayloads.split('\n').map((s) => s.trim()).filter(Boolean);
    const unique = Array.from(new Set(list));
    setCustomPayloads(unique.join('\n'));
    setUploadFeedback(`Deduplicated wordlist: ${unique.length} unique items (removed ${list.length - unique.length} duplicates).`);
  };

  const handleShuffle = () => {
    const list = customPayloads.split('\n').map((s) => s.trim()).filter(Boolean);
    const shuffled = [...list].sort(() => Math.random() - 0.5);
    setCustomPayloads(shuffled.join('\n'));
    setUploadFeedback('Wordlist randomized and shuffled.');
  };

  // Position manipulation helpers
  const handleAddMarker = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = requestText;

    if (start === end) {
      // Insert § at cursor
      const next = current.slice(0, start) + '§§' + current.slice(end);
      setRequestText(next);
    } else {
      // Wrap selection in §
      const selected = current.slice(start, end);
      const next = current.slice(0, start) + '§' + selected + '§' + current.slice(end);
      setRequestText(next);
    }
  };

  const handleClearMarkers = () => {
    const cleaned = requestText.replace(/§/g, '');
    setRequestText(cleaned);
  };

  const handleAutoMarkers = () => {
    // Auto find query params and numbers to wrap in §
    let modified = requestText.replace(/§/g, '');
    // Auto wrap parameter values in query strings
    modified = modified.replace(/([?&][a-zA-Z0-9_-]+=)([^&\s\n]+)/g, '$1§$2§');
    // Auto wrap JSON values
    modified = modified.replace(/(:\s*")([^"\n]+)(")/g, ':$1§$2§$3');
    setRequestText(modified);
  };

  const handleApplyPresetAttack = (preset: 'idor' | 'login' | 'lfi' | 'sqli') => {
    if (preset === 'idor') {
      setRequestText(`GET https://${targetDomain}/api/v1/users?id=§1042§ HTTP/1.1\nHost: ${targetDomain}\nUser-Agent: SentinelScope-Intruder/2.4\nAccept: application/json`);
      handleSelectPreset('User IDs (1-20)');
    } else if (preset === 'login') {
      setRequestText(`POST https://${targetDomain}/api/v1/auth/login HTTP/1.1\nHost: ${targetDomain}\nContent-Type: application/json\n\n{\n  "username": "admin",\n  "password": "§password§"\n}`);
      handleSelectPreset('Top Passwords');
    } else if (preset === 'lfi') {
      setRequestText(`GET https://${targetDomain}/download?file=§security_report_2026.pdf§&format=pdf HTTP/1.1\nHost: ${targetDomain}\nAccept: */*`);
      handleSelectPreset('Path Traversal / LFI');
    } else if (preset === 'sqli') {
      setRequestText(`GET https://${targetDomain}/api/v2/search?q=§test§ HTTP/1.1\nHost: ${targetDomain}\nAccept: application/json`);
      handleSelectPreset('SQL Injection Quick Test');
    }
  };

  // Count positions
  const positionCount = (requestText.match(/§/g) || []).length / 2;

  // Process payload
  const processPayload = (raw: string): string => {
    let p = raw;
    if (payloadPrefix) p = payloadPrefix + p;
    if (payloadSuffix) p = p + payloadSuffix;
    if (base64EncodePayloads) {
      try {
        p = btoa(p);
      } catch {
        // fallback
      }
    }
    if (urlEncodePayloads) {
      p = encodeURIComponent(p);
    }
    return p;
  };

  // Run the Intruder Attack
  const handleStartAttack = async () => {
    const rawPayloadList = customPayloads
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    if (rawPayloadList.length === 0) {
      alert('Please configure at least one payload in the Payloads tab.');
      setActiveTab('payloads');
      return;
    }

    if (!requestText.includes('§')) {
      alert('No payload positions (§) defined. Use "Add §" or "Auto §" in the Positions tab.');
      setActiveTab('positions');
      return;
    }

    setIsAttacking(true);
    setIsPaused(false);
    abortControllerRef.current = false;
    setActiveTab('results');
    setResults([]);
    setSelectedResult(null);
    setAttackProgress(0);

    const matchPatterns = grepMatchPatterns
      .split('\n')
      .map((p) => p.trim())
      .filter(Boolean);

    // Extract first line
    const lines = requestText.split('\n');
    const firstLine = lines[0] || 'GET / HTTP/1.1';
    const firstParts = firstLine.trim().split(/\s+/);
    const defaultMethod = firstParts[0] || 'GET';
    const rawUrlOrPath = firstParts[1] || `https://${targetDomain}/`;

    // Extract headers and body template
    const headerLines: string[] = [];
    let isBody = false;
    const bodyLines: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!isBody && line.trim() === '') {
        isBody = true;
        continue;
      }
      if (isBody) {
        bodyLines.push(line);
      } else {
        headerLines.push(line);
      }
    }

    const rawHeadersTemplate = headerLines.join('\n');
    const rawBodyTemplate = bodyLines.join('\n');

    const totalPayloads = rawPayloadList.length;
    const executedResults: AttackResultItem[] = [];

    for (let index = 0; index < totalPayloads; index++) {
      if (abortControllerRef.current) break;

      const rawPayload = rawPayloadList[index];
      const processed = processPayload(rawPayload);

      // Replace §...§ pairs with processed payload
      // For Sniper, replace all marked positions with this payload
      let replacedUrl = rawUrlOrPath.replace(/§[^§]*§/g, processed);
      if (!replacedUrl.startsWith('http')) {
        replacedUrl = `https://${targetDomain}${replacedUrl.startsWith('/') ? '' : '/'}${replacedUrl}`;
      }

      const replacedHeadersStr = rawHeadersTemplate.replace(/§[^§]*§/g, processed);
      const replacedBody = rawBodyTemplate ? rawBodyTemplate.replace(/§[^§]*§/g, processed) : undefined;

      const parsedHeaders: Record<string, string> = {};
      replacedHeadersStr.split('\n').forEach((l) => {
        const parts = l.split(':');
        if (parts.length >= 2) {
          const k = parts[0].trim();
          const v = parts.slice(1).join(':').trim();
          if (k) parsedHeaders[k] = v;
        }
      });

      let resItem: AttackResultItem;
      const startTime = Date.now();

      try {
        const probeRes = await api.sendRepeaterProbe({
          url: replacedUrl,
          method: defaultMethod,
          headers: parsedHeaders,
          body: replacedBody,
        });

        const latency = Date.now() - startTime;
        const responseBody = probeRes.body || '';

        // Grep Match Checking
        const matches: string[] = [];
        for (const pattern of matchPatterns) {
          if (
            responseBody.toLowerCase().includes(pattern.toLowerCase()) ||
            (probeRes.headers && Object.values(probeRes.headers).some((h) => h.toLowerCase().includes(pattern.toLowerCase())))
          ) {
            matches.push(pattern);
          }
        }

        resItem = {
          id: index + 1,
          payload: rawPayload,
          method: defaultMethod,
          url: replacedUrl,
          statusCode: probeRes.statusCode || (probeRes.success ? 200 : 500),
          statusText: probeRes.statusText || (probeRes.success ? 'OK' : 'Error'),
          bodySize: probeRes.bodySize || responseBody.length,
          latencyMs: probeRes.latencyMs || latency,
          matched: matches.length > 0,
          matchPatterns: matches,
          requestHeaders: parsedHeaders,
          requestBody: replacedBody,
          responseHeaders: probeRes.headers || {},
          responseBody,
          error: probeRes.error,
        };
      } catch (err: any) {
        resItem = {
          id: index + 1,
          payload: rawPayload,
          method: defaultMethod,
          url: replacedUrl,
          statusCode: 0,
          statusText: 'Failed',
          bodySize: 0,
          latencyMs: Date.now() - startTime,
          matched: false,
          matchPatterns: [],
          requestHeaders: parsedHeaders,
          requestBody: replacedBody,
          responseHeaders: {},
          responseBody: '',
          error: err.message || 'Request network failure',
        };
      }

      executedResults.push(resItem);
      setResults([...executedResults]);
      setAttackProgress(Math.round(((index + 1) / totalPayloads) * 100));

      if (index === 0) {
        setSelectedResult(resItem);
      }

      if (delayMs > 0 && index < totalPayloads - 1) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }

    setIsAttacking(false);
  };

  const handleStopAttack = () => {
    abortControllerRef.current = true;
    setIsAttacking(false);
  };

  // Filtered Results
  const filteredResults = results.filter((r) => {
    if (statusFilter !== 'ALL' && String(r.statusCode) !== statusFilter) return false;
    if (matchOnlyFilter && !r.matched) return false;
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      return (
        r.payload.toLowerCase().includes(q) ||
        r.url.toLowerCase().includes(q) ||
        String(r.statusCode).includes(q) ||
        (r.responseBody && r.responseBody.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Export Results
  const handleExportCSV = () => {
    if (results.length === 0) return;
    const headers = ['Request #', 'Payload', 'Status Code', 'Length (bytes)', 'Latency (ms)', 'Matches', 'URL'];
    const rows = results.map((r) => [
      r.id,
      `"${r.payload.replace(/"/g, '""')}"`,
      r.statusCode,
      r.bodySize,
      r.latencyMs,
      `"${r.matchPatterns.join(', ')}"`,
      `"${r.url.replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sentinelscope_intruder_results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Attack Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-100 font-mono tracking-tight">HTTP INTRUDER</h1>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-red-500/20 text-red-400 border border-red-500/30 rounded uppercase font-mono">
                  Payload Fuzzer & Brute-Force
                </span>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded font-mono">
                  Target: {targetDomain}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated request fuzzing, parameter brute-forcing, rate testing, and regex pattern matching.
              </p>
            </div>
          </div>
        </div>

        {/* Attack Control Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {!isAttacking ? (
            <button
              onClick={handleStartAttack}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-red-500/20 transition cursor-pointer font-mono"
            >
              <Play className="w-4 h-4 fill-white" />
              START ATTACK
            </button>
          ) : (
            <button
              onClick={handleStopAttack}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-red-400 border border-red-500/30 text-sm font-semibold rounded-lg transition cursor-pointer font-mono"
            >
              <Square className="w-4 h-4 fill-red-400" />
              STOP ATTACK
            </button>
          )}

          {results.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-lg border border-slate-700 transition"
              title="Export results to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Attack Progress Bar */}
      {isAttacking && (
        <div className="bg-slate-900 border border-red-500/30 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-red-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              Intruder Attack in Progress...
            </span>
            <span className="text-slate-300 font-semibold">{attackProgress}% ({results.length} requests completed)</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-red-500 to-orange-500 h-full transition-all duration-150"
              style={{ width: `${attackProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('positions')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-semibold rounded-lg transition ${
              activeTab === 'positions'
                ? 'bg-slate-800 text-cyan-400 border border-cyan-500/30 shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            1. Positions
            {positionCount > 0 && (
              <span className="px-1.5 py-0.2 bg-cyan-500/20 text-cyan-400 rounded text-[10px]">
                {Math.floor(positionCount)} position(s)
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('payloads')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-semibold rounded-lg transition ${
              activeTab === 'payloads'
                ? 'bg-slate-800 text-cyan-400 border border-cyan-500/30 shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            2. Payloads
            <span className="px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded text-[10px]">
              {customPayloads.split('\n').filter((p) => p.trim()).length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('options')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-semibold rounded-lg transition ${
              activeTab === 'options'
                ? 'bg-slate-800 text-cyan-400 border border-cyan-500/30 shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            3. Options & Grep Match
          </button>

          <button
            onClick={() => setActiveTab('results')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-semibold rounded-lg transition ${
              activeTab === 'results'
                ? 'bg-slate-800 text-orange-400 border border-orange-500/30 shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            4. Attack Results
            {results.length > 0 && (
              <span className="px-1.5 py-0.2 bg-orange-500/20 text-orange-400 rounded text-[10px]">
                {results.length}
              </span>
            )}
          </button>
        </div>

        {/* Quick Presets Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400">Quick Template:</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleApplyPresetAttack('idor')}
              className="px-2 py-1 text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded border border-slate-700"
            >
              IDOR Fuzz
            </button>
            <button
              onClick={() => handleApplyPresetAttack('login')}
              className="px-2 py-1 text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-amber-300 rounded border border-slate-700"
            >
              Auth Brute
            </button>
            <button
              onClick={() => handleApplyPresetAttack('lfi')}
              className="px-2 py-1 text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-red-300 rounded border border-slate-700"
            >
              LFI Probe
            </button>
            <button
              onClick={() => handleApplyPresetAttack('sqli')}
              className="px-2 py-1 text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-purple-300 rounded border border-slate-700"
            >
              SQLi Check
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: POSITIONS */}
      {activeTab === 'positions' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Request Editor */}
          <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-200 font-mono">REQUEST TEMPLATE & PAYLOAD POSITIONS</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select text and click <code className="text-cyan-400 bg-slate-950 px-1 py-0.5 rounded">Add §</code> to mark insertion points for payload substitution.
                </p>
              </div>

              {/* Attack Type Selector */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400 font-mono">Attack Type:</label>
                <select
                  value={attackType}
                  onChange={(e) => setAttackType(e.target.value as any)}
                  className="px-3 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-cyan-300 font-mono focus:outline-none"
                >
                  <option value="Sniper">Sniper (Single set, tests each position)</option>
                  <option value="Battering Ram">Battering Ram (Same payload into all positions)</option>
                  <option value="Pitchfork">Pitchfork (Parallel payload lists)</option>
                  <option value="Cluster Bomb">Cluster Bomb (Matrix permutation)</option>
                </select>
              </div>
            </div>

            {/* Request Text Area */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={requestText}
                onChange={(e) => setRequestText(e.target.value)}
                rows={16}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-cyan-500/50 resize-y"
                placeholder="GET /api/v1/resource?param=§value§ HTTP/1.1"
                spellCheck={false}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Markers Detected: <strong className="text-cyan-400">{Math.floor(positionCount)}</strong></span>
              <span className="text-[11px] text-slate-500">Shortcut: Select parameter value and click 'Add §'</span>
            </div>
          </div>

          {/* Position Tools Sidebar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">Position Tools</h3>

            <div className="space-y-2">
              <button
                onClick={handleAddMarker}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-700/50 text-xs font-mono rounded-lg transition font-semibold"
              >
                Add § (Mark Selection)
              </button>

              <button
                onClick={handleAutoMarkers}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded-lg transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Auto § (Find Params)
              </button>

              <button
                onClick={handleClearMarkers}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 text-xs font-mono rounded-lg transition"
              >
                Clear All § Markers
              </button>
            </div>

            <div className="border-t border-slate-800 pt-4 space-y-3">
              <h4 className="text-xs font-semibold text-slate-300 font-mono">Quick Injections</h4>
              <p className="text-[11px] text-slate-400">
                Load a target asset from your attack surface into the Intruder position editor:
              </p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {assets.slice(0, 6).map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() => {
                      setRequestText(`GET https://${asset.hostname}/api/v1/status?id=§1§ HTTP/1.1\nHost: ${asset.hostname}\nUser-Agent: SentinelScope-Intruder/2.4\nAccept: */*`);
                    }}
                    className="w-full text-left px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800/80 rounded text-[11px] font-mono text-slate-300 truncate transition"
                  >
                    {asset.hostname}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PAYLOADS */}
      {activeTab === 'payloads' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Preset Wordlists & Custom List */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-200 font-mono">PAYLOAD SETS & WORDLISTS</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure the dictionary of values or upload custom wordlists to inject into marked positions.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-400 font-bold">
                  {customPayloads.split('\n').filter((p) => p.trim()).length} Payloads
                </span>
                <button
                  onClick={handleExportPayloads}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700 transition"
                  title="Export wordlist as .txt"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export
                </button>
              </div>
            </div>

            {/* Wordlist Upload Section */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-slate-200 flex items-center gap-1.5">
                  <FileUp className="w-4 h-4 text-cyan-400" />
                  Upload Custom Wordlist (.txt, .lst, .csv, .dict)
                </span>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <label className="text-[11px] text-slate-400">Mode:</label>
                  <select
                    value={uploadMode}
                    onChange={(e) => setUploadMode(e.target.value as any)}
                    className="bg-slate-900 border border-slate-700 text-slate-200 text-[11px] rounded px-2 py-0.5"
                  >
                    <option value="replace">Replace Current</option>
                    <option value="append">Append to List</option>
                  </select>
                </div>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.lst,.csv,.dict,.json,.wordlist,text/plain"
                onChange={handleFileInputChange}
                className="hidden"
              />

              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 ${
                  isDragOver
                    ? 'border-cyan-400 bg-cyan-500/10'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/70'
                }`}
              >
                <Upload className="w-5 h-5 text-cyan-400" />
                <p className="text-xs text-slate-300 font-mono">
                  <span className="text-cyan-400 font-semibold underline underline-offset-2">Click to browse file</span> or drag & drop wordlist here
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  Supports SecLists, custom fuzzing dictionaries, user lists, and path wordlists (Line-by-line)
                </p>
              </div>

              {/* Uploaded File Info Banner */}
              {uploadedFileInfo && (
                <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2 text-cyan-300 truncate">
                    <FileSpreadsheet className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="font-semibold truncate">{uploadedFileInfo.name}</span>
                    <span className="text-[10px] text-cyan-500">({uploadedFileInfo.size} &bull; {uploadedFileInfo.count} entries)</span>
                  </div>
                  <button
                    onClick={() => {
                      setUploadedFileInfo(null);
                      setUploadFeedback(null);
                    }}
                    className="text-slate-400 hover:text-red-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Upload Feedback Notice */}
              {uploadFeedback && (
                <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{uploadFeedback}</span>
                </div>
              )}
            </div>

            {/* Wordlist Presets Buttons */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-mono">Or Choose a Built-in Preset Dictionary:</label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(PRESET_WORDLISTS).map((presetKey) => (
                  <button
                    key={presetKey}
                    onClick={() => handleSelectPreset(presetKey)}
                    className={`px-3 py-1.5 text-xs font-mono rounded-lg transition ${
                      selectedWordlistPreset === presetKey
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {presetKey}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Payloads Box & List Tools */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 flex-wrap gap-2">
                <span>Payload Items (one item per line):</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDeduplicate}
                    className="text-slate-400 hover:text-cyan-400 text-[11px] px-2 py-0.5 bg-slate-950 border border-slate-800 rounded transition"
                    title="Remove duplicate lines"
                  >
                    Deduplicate
                  </button>
                  <button
                    onClick={handleShuffle}
                    className="text-slate-400 hover:text-cyan-400 text-[11px] px-2 py-0.5 bg-slate-950 border border-slate-800 rounded flex items-center gap-1 transition"
                    title="Shuffle order of lines"
                  >
                    <Shuffle className="w-3 h-3" />
                    Shuffle
                  </button>
                  <button
                    onClick={() => {
                      setCustomPayloads('');
                      setUploadedFileInfo(null);
                      setUploadFeedback('Wordlist cleared.');
                    }}
                    className="text-slate-500 hover:text-red-400 text-[11px] px-2 py-0.5 bg-slate-950 border border-slate-800 rounded transition"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              <textarea
                value={customPayloads}
                onChange={(e) => setCustomPayloads(e.target.value)}
                rows={12}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                placeholder="Enter custom payloads, one per line..."
              />
            </div>
          </div>

          {/* Payload Processing & Encoding */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">Payload Encoding Rules</h3>

            <div className="space-y-3">
              <label className="flex items-center gap-2.5 text-xs font-mono text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={urlEncodePayloads}
                  onChange={(e) => setUrlEncodePayloads(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>URL-encode payload characters</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs font-mono text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={base64EncodePayloads}
                  onChange={(e) => setBase64EncodePayloads(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>Base64-encode payload values</span>
              </label>
            </div>

            <div className="border-t border-slate-800 pt-4 space-y-3">
              <h4 className="text-xs font-semibold text-slate-300 font-mono">Prefix & Suffix Rules</h4>
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Add Prefix:</label>
                <input
                  type="text"
                  value={payloadPrefix}
                  onChange={(e) => setPayloadPrefix(e.target.value)}
                  placeholder="e.g. bearer "
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs font-mono text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Add Suffix:</label>
                <input
                  type="text"
                  value={payloadSuffix}
                  onChange={(e) => setPayloadSuffix(e.target.value)}
                  placeholder="e.g. --"
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs font-mono text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-[11px] font-mono text-slate-400 space-y-1">
              <span className="text-cyan-400 font-semibold">Example Output:</span>
              <div className="text-slate-200 break-all">
                {processPayload(customPayloads.split('\n')[0] || 'test_payload')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: OPTIONS & GREP MATCH */}
      {activeTab === 'options' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Concurrency & Rate Limiting */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 font-mono">REQUEST CONCURRENCY & TIMING</h2>
            <p className="text-xs text-slate-400">
              Control the rate of requests sent during the attack.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1.5">
                  Concurrency Threads: <strong className="text-cyan-400">{threads}</strong>
                </label>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={threads}
                  onChange={(e) => setThreads(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>1 (Sequential)</span>
                  <span>5 (Balanced)</span>
                  <span>20 (Fast)</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1.5">
                  Request Delay (ms): <strong className="text-cyan-400">{delayMs} ms</strong>
                </label>
                <input
                  type="number"
                  min={0}
                  max={5000}
                  step={50}
                  value={delayMs}
                  onChange={(e) => setDelayMs(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs font-mono text-slate-200 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Grep Match Rules */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 font-mono">GREP - MATCH STRINGS</h2>
            <p className="text-xs text-slate-400">
              Flag responses containing specific text (one string per line). Intruder highlights matched responses in the results table.
            </p>

            <textarea
              value={grepMatchPatterns}
              onChange={(e) => setGrepMatchPatterns(e.target.value)}
              rows={6}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-200 focus:outline-none"
              placeholder="e.g. admin&#10;root&#10;success&#10;password_hash"
            />
          </div>
        </div>
      )}

      {/* TAB 4: RESULTS */}
      {activeTab === 'results' && (
        <div className="space-y-4">
          {/* Results Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search Box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter payload or response..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              {/* Status Code Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Status Codes</option>
                <option value="200">200 OK</option>
                <option value="302">302 Found / Redirect</option>
                <option value="401">401 Unauthorized</option>
                <option value="403">403 Forbidden</option>
                <option value="404">404 Not Found</option>
                <option value="500">500 Server Error</option>
              </select>

              {/* Match Only Checkbox */}
              <label className="flex items-center gap-1.5 text-xs font-mono text-slate-300 cursor-pointer ml-2">
                <input
                  type="checkbox"
                  checked={matchOnlyFilter}
                  onChange={(e) => setMatchOnlyFilter(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500"
                />
                <span>Show Matches Only</span>
              </label>
            </div>

            <div className="text-xs font-mono text-slate-400">
              Showing <strong className="text-slate-200">{filteredResults.length}</strong> of {results.length} requests
            </div>
          </div>

          {/* Results Split View: Table on Top / Left, Detailed Request/Response on Bottom / Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Attack Table */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
              <div className="overflow-x-auto max-h-[420px]">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950/80 text-slate-400 sticky top-0 border-b border-slate-800 z-10">
                    <tr>
                      <th className="py-2.5 px-3 w-12">#</th>
                      <th className="py-2.5 px-3">Payload</th>
                      <th className="py-2.5 px-3 w-20">Status</th>
                      <th className="py-2.5 px-3 w-24">Length</th>
                      <th className="py-2.5 px-3 w-20">Time</th>
                      <th className="py-2.5 px-3 w-24">Matches</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredResults.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          {results.length === 0 ? 'No attack executed yet. Click "START ATTACK" above.' : 'No results matching active filter.'}
                        </td>
                      </tr>
                    ) : (
                      filteredResults.map((item) => {
                        const isSelected = selectedResult?.id === item.id;
                        const isSuccess = item.statusCode >= 200 && item.statusCode < 300;
                        const isRedirect = item.statusCode >= 300 && item.statusCode < 400;
                        const isClientErr = item.statusCode >= 400 && item.statusCode < 500;
                        const isServerErr = item.statusCode >= 500;

                        return (
                          <tr
                            key={item.id}
                            onClick={() => setSelectedResult(item)}
                            className={`cursor-pointer transition ${
                              isSelected
                                ? 'bg-cyan-950/40 text-cyan-200 border-l-2 border-cyan-400'
                                : 'hover:bg-slate-800/50 text-slate-300'
                            }`}
                          >
                            <td className="py-2 px-3 text-slate-500 font-semibold">{item.id}</td>
                            <td className="py-2 px-3 font-semibold text-slate-200 truncate max-w-[180px]">
                              {item.payload}
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
                            <td className="py-2 px-3 text-slate-400">{item.bodySize.toLocaleString()} B</td>
                            <td className="py-2 px-3 text-slate-400">{item.latencyMs}ms</td>
                            <td className="py-2 px-3">
                              {item.matched ? (
                                <span className="px-1.5 py-0.5 bg-red-500/20 text-red-300 rounded text-[10px] font-bold border border-red-500/40 flex items-center gap-1 w-fit">
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  {item.matchPatterns.join(', ')}
                                </span>
                              ) : (
                                <span className="text-slate-600">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Inspector Panel for Selected Attack Result */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col space-y-3">
              {selectedResult ? (
                <>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-200">
                        Request #{selectedResult.id} Inspector
                      </span>
                      <span className="text-[11px] font-mono text-cyan-400">
                        [{selectedResult.payload}]
                      </span>
                    </div>

                    {onSendToRepeater && (
                      <button
                        onClick={() =>
                          onSendToRepeater({
                            url: selectedResult.url,
                            method: selectedResult.method,
                            headers: selectedResult.requestHeaders,
                            body: selectedResult.requestBody,
                          })
                        }
                        className="flex items-center gap-1 px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 text-[11px] font-mono rounded border border-cyan-800 transition"
                      >
                        <Send className="w-3 h-3" />
                        Send to Repeater
                      </button>
                    )}
                  </div>

                  {/* Inspector Tabs */}
                  <div className="space-y-3 flex-1 flex flex-col">
                    {/* Response Header Summary */}
                    <div className="flex items-center justify-between text-[11px] font-mono bg-slate-950 p-2 rounded border border-slate-800">
                      <span className="text-slate-400">Status: <strong className="text-emerald-400">{selectedResult.statusCode} {selectedResult.statusText}</strong></span>
                      <span className="text-slate-400">Size: <strong className="text-slate-200">{selectedResult.bodySize} bytes</strong></span>
                      <span className="text-slate-400">Time: <strong className="text-slate-200">{selectedResult.latencyMs} ms</strong></span>
                    </div>

                    {/* Response Body Box with match highlights */}
                    <div className="flex-1 flex flex-col space-y-1">
                      <span className="text-[11px] font-mono text-slate-400">Response Body:</span>
                      <pre className="w-full flex-1 max-h-[300px] overflow-auto bg-slate-950 border border-slate-800 rounded p-3 font-mono text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {selectedResult.responseBody || '[Empty Response]'}
                      </pre>
                    </div>

                    {/* Request Sent Details */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-mono text-slate-400">Target Probed:</span>
                      <div className="p-2 bg-slate-950 rounded border border-slate-800 text-[11px] font-mono text-cyan-300 break-all">
                        {selectedResult.method} {selectedResult.url}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500 font-mono text-xs">
                  <Terminal className="w-8 h-8 text-slate-600 mb-2" />
                  Select an attack row from the left table to inspect request & response
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
