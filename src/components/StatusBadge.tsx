// src/components/StatusBadge.tsx
import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const norm = status.toUpperCase();

  const getStyle = () => {
    switch (norm) {
      case 'LIVE':
      case 'HEALTHY':
      case 'COMPLETED':
      case 'OPEN':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 dot-emerald';
      case 'SCANNING':
      case 'RUNNING':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 dot-cyan animate-pulse';
      case 'QUEUED':
      case 'IDLE':
      case 'ACKNOWLEDGED':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30 dot-amber';
      case 'RESOLVED':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30 dot-blue';
      case 'ERROR':
      case 'FAILED':
      case 'CRITICAL':
        return 'bg-red-500/10 text-red-400 border-red-500/30 dot-red';
      case 'FILTERED':
      case 'UNRESPONSIVE':
      case 'FALSE_POSITIVE':
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30 dot-slate';
    }
  };

  const style = getStyle();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider border ${style} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status.replace(/_/g, ' ')}
    </span>
  );
};
