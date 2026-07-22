import React from 'react';
import { Wifi, WifiOff, AlertOctagon, User, Radio } from 'lucide-react';
import StatusBadge from './StatusBadge';
import Button from './Button';

interface NavbarProps {
  sidebarCollapsed: boolean;
  robotStatus?: string;
  isConnected?: boolean;
  onEmergencyStop?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  sidebarCollapsed,
  robotStatus = 'ONLINE',
  isConnected = true,
  onEmergencyStop,
}) => {
  return (
    <header
      className={`fixed top-0 right-0 z-30 h-16 bg-[#111827]/90 backdrop-blur-md border-b border-slate-800 transition-all duration-300 flex items-center justify-between px-6 ${
        sidebarCollapsed ? 'left-20' : 'left-64'
      }`}
    >
      {/* Left: Quick Status Info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800">
          <Radio className="w-4 h-4 text-primary-500 animate-pulse" />
          <span className="text-xs font-mono font-bold text-slate-200">KimQui</span>
        </div>

        <StatusBadge status={robotStatus} size="sm" />
      </div>

      {/* Right: Controls & Connections */}
      <div className="flex items-center gap-4">
        {/* Emergency Stop Button */}
        <Button
          variant="danger"
          size="sm"
          icon={<AlertOctagon className="w-4 h-4" />}
          onClick={onEmergencyStop}
        >
          E-STOP
        </Button>

        {/* Connection Status Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/80 border border-slate-800 text-xs font-mono">
          {isConnected ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">WS CONNECTED</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-red-400" />
              <span className="text-red-400 font-semibold">DISCONNECTED</span>
            </>
          )}
        </div>

        {/* Current User */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-200 border border-slate-700">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden md:flex flex-col">
            <span className="text-xs font-semibold text-slate-200">Phuong Nam</span>
            <span className="text-[10px] text-slate-400 font-mono">Operator</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
