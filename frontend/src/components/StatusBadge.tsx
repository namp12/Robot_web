import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', className }) => {
  const upperStatus = status.toUpperCase();

  const statusStyles: Record<string, { bg: string; text: string; dot: string }> = {
    ONLINE: { bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    OFFLINE: { bg: 'bg-slate-500/10 border-slate-500/30', text: 'text-slate-400', dot: 'bg-slate-400' },
    EMERGENCY_STOP: { bg: 'bg-red-500/15 border-red-500/40 shadow-glow-red', text: 'text-red-400 font-bold animate-pulse', dot: 'bg-red-500 animate-ping' },
    RUNNING: { bg: 'bg-blue-500/10 border-blue-500/30', text: 'text-blue-400', dot: 'bg-blue-400 animate-pulse' },
    COMPLETED: { bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    FAILED: { bg: 'bg-red-500/10 border-red-500/30', text: 'text-red-400', dot: 'bg-red-400' },
    AUTO: { bg: 'bg-cyan-500/10 border-cyan-500/30', text: 'text-cyan-400', dot: 'bg-cyan-400' },
    MANUAL: { bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-400', dot: 'bg-amber-400' },
  };

  const style = statusStyles[upperStatus] || {
    bg: 'bg-slate-500/10 border-slate-500/30',
    text: 'text-slate-300',
    dot: 'bg-slate-400',
  };

  const sizes = {
    sm: 'px-2.5 py-0.5 text-[11px]',
    md: 'px-3 py-1 text-xs font-mono font-semibold',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 border rounded-full font-mono tracking-wider backdrop-blur-md',
          style.bg,
          style.text,
          sizes[size],
          className
        )
      )}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', style.dot)} />
      {upperStatus.replace('_', ' ')}
    </span>
  );
};

export default StatusBadge;
