// src/components/SeverityBadge.tsx
import React from 'react';
import { Severity } from '../types';

interface SeverityBadgeProps {
  severity: Severity;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  size = 'sm',
  className = '',
}) => {
  const styles: Record<Severity, { bg: string; text: string; border: string; dot: string }> = {
    CRITICAL: {
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      border: 'border-red-500/30',
      dot: 'bg-red-500',
    },
    HIGH: {
      bg: 'bg-orange-500/10',
      text: 'text-orange-400',
      border: 'border-orange-500/30',
      dot: 'bg-orange-500',
    },
    MEDIUM: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      dot: 'bg-amber-500',
    },
    LOW: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
      dot: 'bg-blue-500',
    },
    INFO: {
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-400',
      border: 'border-cyan-500/30',
      dot: 'bg-cyan-400',
    },
  };

  const style = styles[severity] || styles.INFO;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1 font-medium',
    lg: 'text-sm px-3 py-1.5 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border ${style.bg} ${style.text} ${style.border} ${sizeClasses[size]} tracking-wide uppercase ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot} animate-pulse`} />
      {severity}
    </span>
  );
};
