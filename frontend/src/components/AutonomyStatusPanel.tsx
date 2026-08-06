import React from 'react';
import { Cpu, ShieldCheck, Activity, Eye, Compass, AlertCircle, Sparkles, Volume2, Layers } from 'lucide-react';
import useTelemetry from '../hooks/useTelemetry';

export const AutonomyStatusPanel: React.FC = () => {
  const { telemetry } = useTelemetry();

  const currentMode = telemetry?.mode || 'MANUAL';
  const runningFeature = telemetry?.running_feature || currentMode;
  const runningModules = telemetry?.running_modules || [
    currentMode === 'MANUAL' ? 'Web Joystick' : 'LiDAR 360 Navigation',
    currentMode === 'MANUAL' ? 'Direct Wheel Output' : 'Local Costmap Planner'
  ];
  const disabledModules = telemetry?.disabled_modules || [
    currentMode === 'MANUAL' ? 'Local Planner' : 'Manual Joystick'
  ];

  const sensorProfile = telemetry?.sensor_profile || {
    camera_enabled: currentMode !== 'MANUAL',
    yolo_enabled: currentMode === 'FOLLOW_PERSON' || currentMode === 'AUTO_EXPLORE',
    lidar_enabled: currentMode !== 'MANUAL',
    planner_enabled: currentMode === 'AUTO_EXPLORE' || currentMode === 'GO_TO_GOAL'
  };

  const frontDist = telemetry?.front_distance || 999;
  const decisionState = frontDist < 0.15 ? 'EMERGENCY_STOP' : frontDist < 0.8 ? 'YIELD_AND_SLOWDOWN' : 'CORRIDOR_GLIDE';

  return (
    <div className="glass-card p-5 rounded-2xl shadow-soft text-slate-100 mb-6 border border-slate-800/80">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-950/80 text-indigo-400 border border-indigo-800/50">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-wide text-white uppercase font-mono flex items-center gap-2">
              <span>HỆ THỐNG TỰ HÀNH & HỢP NHẤT 5 CẢM BIẾN V5.0</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Free-Space Corridor • DWA Curve • Smart Barrier & Obstacle Perception
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1 rounded-full bg-slate-950 border border-indigo-500/40 text-indigo-300 font-mono font-semibold">
            Feature: {runningFeature}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* State Card */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex justify-between items-center text-xs text-slate-400 font-mono mb-1">
            <span>Trạng Thái Quyết Định</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-center gap-2 my-1">
            <span className={`w-3 h-3 rounded-full animate-ping ${
              decisionState === 'EMERGENCY_STOP' ? 'bg-red-500' :
              decisionState === 'YIELD_AND_SLOWDOWN' ? 'bg-amber-400' : 'bg-emerald-400'
            }`} />
            <span className="font-mono font-bold text-sm text-white tracking-tight">
              {decisionState}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {decisionState === 'EMERGENCY_STOP' ? '🚨 Dừng phanh khẩn cấp' :
             decisionState === 'YIELD_AND_SLOWDOWN' ? '⚠️ Giảm tốc 60% & Xin nhường đường' : '🟢 Trượt mượt khoảng không'}
          </span>
        </div>

        {/* Active Modules Card */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex justify-between items-center text-xs text-slate-400 font-mono mb-1">
            <span>Modules Đang Chạy (Active)</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex flex-wrap gap-1.5 my-1">
            {runningModules.map((m: string, idx: number) => (
              <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 font-mono">
                ✓ {m}
              </span>
            ))}
          </div>
        </div>

        {/* Disabled Modules Card */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex justify-between items-center text-xs text-slate-400 font-mono mb-1">
            <span>Modules Đã Tắt (Disabled)</span>
            <AlertCircle className="w-4 h-4 text-slate-500" />
          </div>
          <div className="flex flex-wrap gap-1.5 my-1">
            {disabledModules.map((m: string, idx: number) => (
              <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 font-mono">
                ✗ {m}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Sensor Badges & Perception Matrix */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-cyan-400" />
          <span className="text-slate-300 font-bold">CẢM BIẾN:</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded ${sensorProfile.camera_enabled ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-slate-900 text-slate-500'}`}>
            Camera AI: {sensorProfile.camera_enabled ? 'ON' : 'OFF'}
          </span>
          <span className={`px-2 py-0.5 rounded ${sensorProfile.lidar_enabled ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' : 'bg-slate-900 text-slate-500'}`}>
            LiDAR 360: {sensorProfile.lidar_enabled ? 'ON' : 'OFF'}
          </span>
          <span className={`px-2 py-0.5 rounded ${sensorProfile.planner_enabled ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-900 text-slate-500'}`}>
            Planner: {sensorProfile.planner_enabled ? 'ON' : 'OFF'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AutonomyStatusPanel;
