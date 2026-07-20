import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  icon,
  action,
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          'glass-card rounded-2xl p-5 shadow-soft transition-all duration-300',
          className
        )
      )}
      {...props}
    >
      {(title || icon || action) && (
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            {icon && <div className="text-primary-500 p-2 rounded-xl bg-slate-900 border border-slate-800">{icon}</div>}
            <div>
              {title && <h3 className="text-sm font-bold tracking-wide uppercase text-slate-200">{title}</h3>}
              {subtitle && <p className="text-[11px] text-slate-400 font-mono mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};

export default Card;
