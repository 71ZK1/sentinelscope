// src/components/RiskScoreGauge.tsx
import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, Info, ChevronRight } from 'lucide-react';
import { RiskScoreBreakdown } from '../types';

interface RiskScoreGaugeProps {
  score: number;
  level: 'LOW' | 'GUARDED' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  size?: 'sm' | 'md' | 'lg';
  breakdown?: RiskScoreBreakdown;
  showDetailsButton?: boolean;
}

export const RiskScoreGauge: React.FC<RiskScoreGaugeProps> = ({
  score,
  level,
  size = 'md',
  breakdown,
  showDetailsButton = true,
}) => {
  const [showModal, setShowModal] = useState(false);

  const getColor = (s: number) => {
    if (s >= 81) return { stroke: '#ef4444', text: 'text-red-400', label: 'CRITICAL RISK', bg: 'bg-red-500/10' };
    if (s >= 61) return { stroke: '#f97316', text: 'text-orange-400', label: 'HIGH RISK', bg: 'bg-orange-500/10' };
    if (s >= 41) return { stroke: '#eab308', text: 'text-amber-400', label: 'ELEVATED', bg: 'bg-amber-500/10' };
    if (s >= 21) return { stroke: '#3b82f6', text: 'text-blue-400', label: 'GUARDED', bg: 'bg-blue-500/10' };
    return { stroke: '#10b981', text: 'text-emerald-400', label: 'LOW RISK', bg: 'bg-emerald-500/10' };
  };

  const current = getColor(score);

  // SVG Gauge calculations
  const radius = size === 'lg' ? 60 : size === 'md' ? 44 : 28;
  const strokeWidth = size === 'lg' ? 10 : size === 'md' ? 8 : 5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center">
        <svg
          className="transform -rotate-90"
          width={radius * 2 + strokeWidth * 2}
          height={radius * 2 + strokeWidth * 2}
        >
          {/* Background circle */}
          <circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            stroke={current.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center text-center">
          <span
            className={`font-mono font-bold tracking-tight ${
              size === 'lg' ? 'text-4xl' : size === 'md' ? 'text-2xl' : 'text-sm'
            } ${current.text}`}
          >
            {score}
          </span>
          {size !== 'sm' && (
            <span className="text-[10px] text-slate-400 font-mono tracking-wider">/100</span>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        <span
          className={`px-2 py-0.5 rounded text-[11px] font-semibold tracking-wider uppercase border border-slate-700/60 ${current.bg} ${current.text}`}
        >
          {level} RISK
        </span>

        {showDetailsButton && (
          <button
            onClick={() => setShowModal(true)}
            className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
            title="View Score Calculation Breakdown"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Explainable Risk Breakdown Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-cyan-400" />
                <h3 className="text-lg font-semibold text-slate-100">
                  Risk Score Calculation ({score}/100)
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs text-slate-400">
                SentinelScope uses a deterministic, transparent risk scoring engine. Points are aggregated
                from verified attack surface exposures, severity weights, and service reachability.
              </p>

              <div className="space-y-2 mt-3">
                <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    <span className="text-xs font-medium text-slate-300">Critical Findings (+25 pts each)</span>
                  </div>
                  <span className="text-xs font-mono text-red-400 font-semibold">
                    {breakdown ? `${breakdown.criticalCount} active` : 'Active'}
                  </span>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                    <span className="text-xs font-medium text-slate-300">High Severity Findings (+15 pts each)</span>
                  </div>
                  <span className="text-xs font-mono text-orange-400 font-semibold">
                    {breakdown ? `${breakdown.highCount} active` : 'Active'}
                  </span>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <span className="text-xs font-medium text-slate-300">Medium Severity Findings (+7 pts each)</span>
                  </div>
                  <span className="text-xs font-mono text-amber-400 font-semibold">
                    {breakdown ? `${breakdown.mediumCount} active` : 'Active'}
                  </span>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cyan-500" />
                    <span className="text-xs font-medium text-slate-300">Exposed Network Services & Ports</span>
                  </div>
                  <span className="text-xs font-mono text-cyan-400 font-semibold">
                    {breakdown ? `${breakdown.exposedServicesCount} ports` : 'Indexed'}
                  </span>
                </div>
              </div>

              {breakdown?.contributors && breakdown.contributors.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Score Contributors
                  </span>
                  <div className="mt-2 space-y-1.5">
                    {breakdown.contributors.map((c, i) => (
                      <div key={i} className="text-xs text-slate-400 flex justify-between">
                        <span>• {c.description}</span>
                        <span className="font-mono text-cyan-400 font-medium">+{c.points} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/20 text-xs text-cyan-200">
                <span className="font-semibold text-cyan-300">Risk Brackets:</span> 0-20 Low | 21-40 Guarded | 41-60 Elevated | 61-80 High | 81-100 Critical
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
