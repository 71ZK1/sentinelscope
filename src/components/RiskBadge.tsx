// src/components/RiskBadge.tsx
import React from 'react';

interface RiskBadgeProps {
  level: 'LOW' | 'GUARDED' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  score?: number;
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, score, className = '' }) => {
  const styles = {
    CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/30',
    HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    ELEVATED: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    GUARDED: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    LOW: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  };

  const style = styles[level] || styles.LOW;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${style} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {level} {score !== undefined && <span className="font-mono text-[11px] font-normal">({score})</span>}
    </span>
  );
};
