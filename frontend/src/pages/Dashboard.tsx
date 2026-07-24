import React from 'react';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import {
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
  Zap,
  Volume2
} from 'lucide-react';
import useTelemetry from '../hooks/useTelemetry';
import robotService from '../services/robot.service';

// Modular Components
import BatteryMonitor from '../components/BatteryMonitor';
import SensorPanel from '../components/SensorPanel';
import CameraView from '../components/CameraView';
import MapView from '../components/MapView';
import RobotControl from '../components/RobotControl';

export const Dashboard: React.FC = () => {
  const { telemetry, isConnected } = useTelemetry();

  const cpuVal = telemetry?.cpu ?? 34.5;
  const ramVal = telemetry?.ram ?? 52.5;
  const tempVal = telemetry?.temperature ?? 48.5;
  const posX = telemetry?.pose?.x ?? 2.45;
  const posY = telemetry?.pose?.y ?? -1.12;
  const robotStatus = telemetry?.robot_status ?? 'ONLINE';
  const robotMode = telemetry?.mode ?? 'MANUAL';
  const wifiSig = telemetry?.wifi_signal ?? 92;

  const toggleMode = async () => {
    const nextMode = robotMode === 'MANUAL' ? 'AUTO' : robotMode === 'AUTO' ? 'ROS' : 'MANUAL';
    try {
      await robotService.setMode(nextMode);
    } catch (e) {
      console.error('Failed to change mode', e);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Telemetry Control Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 glass-card p-6 rounded-2xl shadow-soft">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
              <Zap className="w-6 h-6 text-primary-500" />
              <span>KimQui</span>
            </h1>
            <StatusBadge status={robotStatus} />
            <button 
              onClick={toggleMode}
              className="text-xs px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 transition border border-slate-700 font-mono text-cyan-400 font-semibold shadow-inner cursor-pointer"
            >
              MODE: {robotMode} (Switch)
            </button>
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
        {/* Battery Monitor Component */}
        <BatteryMonitor />

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

      {/* Map Grid View */}
      <MapView />

      {/* Stream & Control Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CameraView />
        <RobotControl />
      </div>

      {/* Sensor Panels */}
      <SensorPanel />

      {/* Buzzers and Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Horn Control Widget */}
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-900 text-rose-500 border border-slate-800">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">Buzzer Horn Actuator</div>
              <div className="text-[10px] text-slate-400 font-mono">ESP32 audio control</div>
            </div>
          </div>
          <div>
            <button
              onMouseDown={async () => {
                try {
                  await robotService.setHorn(true);
                } catch(e) {}
              }}
              onMouseUp={async () => {
                try {
                  await robotService.setHorn(false);
                } catch(e) {}
              }}
              onTouchStart={async () => {
                try {
                  await robotService.setHorn(true);
                } catch(e) {}
              }}
              onTouchEnd={async () => {
                try {
                  await robotService.setHorn(false);
                } catch(e) {}
              }}
              className="w-full py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/40 text-rose-400 border border-rose-800/40 font-semibold text-xs tracking-wider transition-all duration-300 active:scale-95 shadow-md flex items-center justify-center gap-2 select-none cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
              <span>BẤP CÒI (HORN)</span>
            </button>
          </div>
        </div>

        {/* Live Logs */}
        <div className="lg:col-span-2">
          <Card title="Live Telemetry Event Log" icon={<Activity className="w-5 h-5 text-cyan-400" />}>
            <div className="space-y-3 font-mono text-xs max-h-[140px] overflow-y-auto pr-1">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col gap-1">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>{telemetry?.timestamp || '15:45:00'}</span>
                  <span className="text-emerald-400 font-semibold">ROS2 OK</span>
                </div>
                <p className="text-slate-200">Telemetry packet received from ROS2 bridge</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
