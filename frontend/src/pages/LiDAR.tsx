import React from 'react';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import { Radar, RefreshCw } from 'lucide-react';

export const LiDAR: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Radar className="w-6 h-6 text-accent-cyan" />
            <span>LiDAR 2D Laser Scanner</span>
          </h1>
          <p className="text-xs text-slate-400">RPLIDAR A1 360-degree point cloud visualization</p>
        </div>
        <StatusBadge status="ONLINE" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Point Cloud Polar Scanner">
            <div className="aspect-square max-h-[500px] mx-auto bg-slate-950 rounded-full border border-slate-800 flex items-center justify-center relative p-8">
              <div className="absolute inset-0 rounded-full border border-slate-800/60 m-8"></div>
              <div className="absolute inset-0 rounded-full border border-slate-800/40 m-24"></div>
              <div className="absolute inset-0 rounded-full border border-slate-800/20 m-40"></div>
              <div className="w-4 h-4 rounded-full bg-accent-cyan animate-ping"></div>
              <div className="absolute text-[10px] font-mono text-slate-500 top-2">0°</div>
              <div className="absolute text-[10px] font-mono text-slate-500 bottom-2">180°</div>
              <div className="absolute text-[10px] font-mono text-slate-500 left-2">270°</div>
              <div className="absolute text-[10px] font-mono text-slate-500 right-2">90°</div>
            </div>
          </Card>
        </div>

        <Card title="LiDAR Status & Configuration">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400">Scan Frequency:</span>
              <span className="text-sm font-mono font-bold text-accent-cyan">10.2 Hz</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400">Serial Port:</span>
              <span className="text-sm font-mono text-slate-200">/dev/ttyUSB0</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400">Baudrate:</span>
              <span className="text-sm font-mono text-slate-200">115200</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LiDAR;
