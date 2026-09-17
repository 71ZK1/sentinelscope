// src/pages/EducationPage.tsx
import React, { useState } from 'react';
import { BookOpen, Shield, Code, Radio, Terminal, ExternalLink, Lock, CheckCircle2 } from 'lucide-react';

export const EducationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'CONCEPTS' | 'METHODOLOGY' | 'API'>('CONCEPTS');

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
          <BookOpen className="h-6 w-6 text-purple-400" />
          Reconnaissance Knowledge Base & Methodology
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Educational guide covering Attack Surface Management principles, non-destructive reconnaissance, and platform APIs.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('CONCEPTS')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'CONCEPTS'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Core ASM Concepts
        </button>
        <button
          onClick={() => setActiveTab('METHODOLOGY')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'METHODOLOGY'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Scanning Methodology
        </button>
        <button
          onClick={() => setActiveTab('API')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'API'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Developer API Reference
        </button>
      </div>

      {/* Content */}
      {activeTab === 'CONCEPTS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-md space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <Shield className="h-4 w-4" />
              What is Attack Surface Management (ASM)?
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Attack Surface Management is the continuous discovery, analysis, and monitoring of all internet-facing digital assets. Organizations regularly deploy new subdomains, cloud buckets, and microservices that may drift from central IT governance.
            </p>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div>• <strong>Asset Discovery:</strong> Identifying unknown or shadow-IT subdomains.</div>
              <div>• <strong>Exposure Analysis:</strong> Pinpointing unauthenticated databases and ports.</div>
              <div>• <strong>Continuous Monitoring:</strong> Detecting newly exposed infrastructure before adversaries do.</div>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-md space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Lock className="h-4 w-4" />
              Authorized Scope & Responsible Security
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              SentinelScope enforces strict guardrails: all scans require explicit authorization confirmation. The engine performs strictly non-destructive reconnaissance (passive discovery, banner grabbing, headers verification) without exploiting vulnerabilities.
            </p>
            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-[11px] text-emerald-300 space-y-1">
              <div>✓ Safe rate-limiting enforced (default 60 req/min).</div>
              <div>✓ No credential brute forcing or exploitation payloads.</div>
              <div>✓ Strict compliance with testing scopes and owner authorization.</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'METHODOLOGY' && (
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-md space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-100">SentinelScope 5-Stage Reconnaissance Pipeline</h3>
            <p className="text-xs text-slate-400 mt-1">How raw domain targets are processed into structured findings</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <span className="font-mono text-cyan-400 font-bold">1. Discovery</span>
              <p className="text-[11px] text-slate-400">Queries Certificate Transparency logs and passive DNS records.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <span className="font-mono text-blue-400 font-bold">2. DNS Resolution</span>
              <p className="text-[11px] text-slate-400">Verifies live hosts, resolving A, AAAA, MX, TXT, SPF, DMARC.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <span className="font-mono text-purple-400 font-bold">3. Port Probing</span>
              <p className="text-[11px] text-slate-400">Safe TCP socket handshake on authorized standard service ports.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <span className="font-mono text-amber-400 font-bold">4. HTTP & Tech</span>
              <p className="text-[11px] text-slate-400">Checks HSTS, CSP, X-Frame, server banners, and software versions.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <span className="font-mono text-emerald-400 font-bold">5. Risk Scoring</span>
              <p className="text-[11px] text-slate-400">Normalizes findings into a 0-100 explainable risk score.</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'API' && (
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100">REST API Integration</h3>
              <p className="text-xs text-slate-400">Trigger scans and pull asset telemetry programmatically</p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              REST / JSON
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-xs font-mono font-bold text-slate-300">1. Trigger Recon Scan via cURL</span>
              <pre className="mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-300 overflow-x-auto">
{`curl -X POST https://your-sentinelscope.app/api/targets/tgt_acme_prod_01/scans \\
  -H "Content-Type: application/json" \\
  -d '{"scanType": "FULL_RECON"}'`}
              </pre>
            </div>

            <div>
              <span className="text-xs font-mono font-bold text-slate-300">2. Fetch Asset Inventory</span>
              <pre className="mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-300 overflow-x-auto">
{`curl https://your-sentinelscope.app/api/assets?targetId=tgt_acme_prod_01`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
