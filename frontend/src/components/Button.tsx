import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold tracking-wide rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-bg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer select-none';

  const variants = {
    primary: 'bg-primary-500 hover:bg-primary-600 active:scale-98 text-white focus:ring-primary-500 shadow-glow-blue border border-primary-400/30',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 focus:ring-slate-500',
    danger: 'bg-status-error hover:bg-red-600 active:scale-98 text-white focus:ring-red-500 shadow-glow-red border border-red-400/30',
    success: 'bg-status-success hover:bg-emerald-600 active:scale-98 text-white focus:ring-emerald-500 shadow-glow-green border border-emerald-400/30',
    outline: 'border border-slate-700 hover:border-slate-500 hover:bg-slate-800/80 text-slate-200 focus:ring-slate-500',
    ghost: 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-100 focus:ring-slate-500',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
};

export default Button;
