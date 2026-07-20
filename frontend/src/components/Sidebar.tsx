import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Gamepad2,
  Camera,
  Radar,
  Boxes,
  Navigation,
  Map,
  BotMessageSquare,
  Archive,
  Activity,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bot
} from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/control', label: 'Robot Control', icon: Gamepad2 },
  { path: '/camera', label: 'Camera', icon: Camera },
  { path: '/lidar', label: 'LiDAR', icon: Radar },
  { path: '/slam', label: 'SLAM', icon: Boxes },
  { path: '/navigation', label: 'Navigation', icon: Navigation },
  { path: '/maps', label: 'Maps', icon: Map },
  { path: '/ai-assistant', label: 'AI Assistant', icon: BotMessageSquare },
  { path: '/black-box', label: 'Black Box', icon: Archive },
  { path: '/system-monitor', label: 'System Monitor', icon: Activity },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  return (
    <aside
      className={clsx(
        'fixed top-0 left-0 z-40 h-screen bg-[#111827] border-r border-slate-800 transition-all duration-300 flex flex-col',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-500 to-cyan-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-primary-500/20">
            <Bot className="w-6 h-6" />
          </div>
          {!collapsed && (
            <div className="flex flex-col whitespace-nowrap">
              <span className="font-bold text-sm tracking-wide text-white font-mono">ROBOT EXPLORER</span>
              <span className="text-[10px] text-cyan-400 font-mono font-medium">ROS2 PLATFORM</span>
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3.5 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group',
                  isActive
                    ? 'bg-primary-500/15 text-primary-500 border border-primary-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                )
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" />
              {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <div className="text-xs text-slate-400 flex items-center justify-between font-mono">
            <span>ROS2 HUMBLE</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
