import React from 'react';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import {
  BatteryCharging,
  Cpu,
  HardDrive,
  Thermometer,
  Radio,
  Camera,
  Radar,
  CpuIcon,
  MapPin,
  Wifi,
  Compass,
  Activity,
  Layers,
  ShieldCheck,
  Zap
} from 'lucide-react';
import useTelemetry from '../hooks/useTelemetry';

export const Dashboard: React.FC = () => {
  const { telemetry, isConnected } = useTelemetry();

  const batteryVal = telemetry?.battery ?? 88;
  const cpuVal = telemetry?.cpu ?? 34.5;
  const ramVal = telemetry?.ram ?? 52.5;
  const tempVal = telemetry?.temperature ?? 48.5;
  const voltageVal = telemetry?.voltage ?? 24.2;
  const currentVal = telemetry?.current ?? 3.5;
  const posX = telemetry?.pose?.x ?? 2.45;
  const posY = telemetry?.pose?.y ?? -1.12;
  const robotStatus = telemetry?.robot_status ?? 'ONLINE';
  const robotMode = telemetry?.mode ?? 'MANUAL';
  const wifiSig = telemetry?.wifi_signal ?? 92;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Telemetry Control Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 glass-card p-6 rounded-2xl shadow-soft">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
              <Zap className="w-6 h-6 text-primary-500" />
              <span>ROBOT-EXPLORER-01</span>
            </h1>
            <StatusBadge status={robotStatus} />
            <span className="text-xs px-3 py-1 rounded-full bg-slate-900 border border-slate-700 font-mono text-cyan-400 font-semibold shadow-inner">
              MODE: {robotMode}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            ROS2 Humble • Real-Time Telemetry & Hardware Observability System
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs font-mono bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-xl shadow-inner">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <MapPin className="w-4 h-4" />
            <span className="font-semibold">Lab_Floor_1.yaml</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <Layers className="w-3.5 h-3.5" />
            <span>Mission: Patrol_Sector_B</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5 text-slate-200">
            <Compass className="w-4 h-4 text-primary-500" />
            <span className="font-bold">Pose ({posX.toFixed(2)}, {posY.toFixed(2)})</span>
          </div>
        </div>
      </div>

      {/* 4 Metric Telemetry Gauge Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Battery Level */}
        <Card title="Battery Level" icon={<BatteryCharging className="w-5 h-5 text-emerald-400" />}>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-3xl font-extrabold font-mono text-emerald-400 tracking-tight">
              {Math.round(batteryVal)}%
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {voltageVal.toFixed(1)}V / {currentVal.toFixed(1)}A
            </span>
          </div>
          <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden mt-3 p-0.5 border border-slate-800">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-500 shadow-glow-green"
              style={{ width: `${Math.min(100, Math.max(0, batteryVal))}%` }}
            ></div>
          </div>
        </Card>

        {/* CPU Load */}
        <Card title="CPU Utilization" icon={<Cpu className="w-5 h-5 text-primary-500" />}>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-3xl font-extrabold font-mono text-primary-500 tracking-tight">
              {cpuVal.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-400 font-mono">4 Cores @ 1.5 GHz</span>
          </div>
          <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden mt-3 p-0.5 border border-slate-800">
            <div
              className="bg-primary-500 h-full rounded-full transition-all duration-500 shadow-glow-blue"
              style={{ width: `${Math.min(100, Math.max(0, cpuVal))}%` }}
            ></div>
          </div>
        </Card>

        {/* RAM Usage */}
        <Card title="RAM Memory" icon={<HardDrive className="w-5 h-5 text-cyan-400" />}>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-3xl font-extrabold font-mono text-cyan-400 tracking-tight">
              {ramVal.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-400 font-mono">2.1 / 4.0 GB</span>
          </div>
          <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden mt-3 p-0.5 border border-slate-800">
            <div
              className="bg-cyan-400 h-full rounded-full transition-all duration-500 shadow-glow-blue"
              style={{ width: `${Math.min(100, Math.max(0, ramVal))}%` }}
            ></div>
          </div>
        </Card>

        {/* Core Temperature */}
        <Card title="Core Thermal Temp" icon={<Thermometer className="w-5 h-5 text-amber-400" />}>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-3xl font-extrabold font-mono text-amber-400 tracking-tight">
              {tempVal.toFixed(1)} °C
            </span>
            <span className="text-xs text-emerald-400 font-mono font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Normal
            </span>
          </div>
          <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden mt-3 p-0.5 border border-slate-800">
            <div
              className="bg-amber-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, tempVal * 1.2)}%` }}
            ></div>
          </div>
        </Card>
      </div>

      {/* Subsystem Hardware Diagnostic Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-900 text-primary-500 border border-slate-800">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">Camera Feed</div>
              <div className="text-[10px] text-slate-400 font-mono">1080p @ 30 FPS</div>
            </div>
          </div>
          <StatusBadge status={telemetry?.camera_status ? 'ONLINE' : 'OFFLINE'} size="sm" />
        </div>

        <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-900 text-cyan-400 border border-slate-800">
              <Radar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">LiDAR 2D</div>
              <div className="text-[10px] text-slate-400 font-mono">RPLIDAR A1 @ 10 Hz</div>
            </div>
          </div>
          <StatusBadge status={telemetry?.lidar_status ? 'ONLINE' : 'OFFLINE'} size="sm" />
        </div>

        <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-900 text-emerald-400 border border-slate-800">
              <CpuIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">ESP32 Motor</div>
              <div className="text-[10px] text-slate-400 font-mono">UART Serial Connected</div>
            </div>
          </div>
          <StatusBadge status={telemetry?.esp32_status ? 'ONLINE' : 'OFFLINE'} size="sm" />
        </div>

        <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-900 text-amber-400 border border-slate-800">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">Wi-Fi Telemetry</div>
              <div className="text-[10px] text-slate-400 font-mono">{wifiSig}% Signal</div>
            </div>
          </div>
          <StatusBadge status={isConnected ? 'ONLINE' : 'OFFLINE'} size="sm" />
        </div>
      </div>

      {/* Live Pose Canvas & Log Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Live Position & Trajectory Canvas" icon={<MapPin className="w-5 h-5 text-primary-500" />}>
            <div className="aspect-video bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center justify-center relative p-6 overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-20"></div>
              
              {/* Animated Robot Node Pointer */}
              <div className="w-16 h-16 rounded-full border border-primary-500/40 bg-primary-500/10 flex items-center justify-center relative shadow-glow-blue animate-pulse">
                <Compass className="w-8 h-8 text-primary-500 animate-spin" style={{ animationDuration: '8s' }} />
                <span className="absolute -bottom-6 text-[11px] font-mono text-cyan-400 font-bold whitespace-nowrap">
                  Pose ({posX.toFixed(2)}, {posY.toFixed(2)})
                </span>
              </div>
            </div>
          </Card>
        </div>

        <Card title="Live Telemetry Event Log" icon={<Activity className="w-5 h-5 text-cyan-400" />}>
          <div className="space-y-3 font-mono text-xs max-h-[300px] overflow-y-auto pr-1">
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col gap-1">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>{telemetry?.timestamp || '15:45:00'}</span>
                <span className="text-emerald-400 font-semibold">ROS2 OK</span>
              </div>
              <p className="text-slate-200">Telemetry packet received from ROS2 bridge</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col gap-1">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>15:45:00</span>
                <span className="text-cyan-400 font-semibold">NAV2</span>
              </div>
              <p className="text-slate-200">Nav2 NavigateToPose Action Server Active</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col gap-1">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>15:44:30</span>
                <span className="text-amber-400 font-semibold">HW OK</span>
              </div>
              <p className="text-slate-200">RPLIDAR A1 scan stream running at 10.2 Hz</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
