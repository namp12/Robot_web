import React from 'react';
import Card from './Card';
import useTelemetry from '../hooks/useTelemetry';
import { Shield, Disc, ArrowDown, ArrowUp } from 'lucide-react';

export const SensorPanel: React.FC = () => {
  const { telemetry } = useTelemetry();

  // IMU Data
  const imuRaw = telemetry?.imu_raw || {
    accel: { x: 0.0, y: 0.0, z: 9.81 },
    gyro: { x: 0.0, y: 0.0, z: 0.0 }
  };
  const accel = imuRaw.accel;
  const gyro = imuRaw.gyro;

  // Encoder Data
  const encoders = telemetry?.encoders || { fl: 0.0, fr: 0.0, rl: 0.0, rr: 0.0 };

  // Distance Data
  const frontDist = telemetry?.front_distance ?? 0.0;
  const rearDist = telemetry?.rear_distance ?? 0.0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* IMU Card */}
      <Card title="IMU (MPU6050)" icon={<Shield className="w-5 h-5 text-indigo-400" />}>
        <div className="space-y-4 p-1">
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold font-mono">
              Linear Acceleration (m/s²)
            </div>
            <div className="grid grid-cols-3 gap-2 mt-1.5 text-xs font-mono">
              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-900">
                <span className="text-slate-500 block">Acc X</span>
                <span className="text-slate-300 font-bold">{accel.x.toFixed(4)}</span>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-900">
                <span className="text-slate-500 block">Acc Y</span>
                <span className="text-slate-300 font-bold">{accel.y.toFixed(4)}</span>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-900">
                <span className="text-slate-500 block">Acc Z</span>
                <span className="text-slate-300 font-bold">{accel.z.toFixed(4)}</span>
              </div>
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold font-mono">
              Angular Velocity (rad/s)
            </div>
            <div className="grid grid-cols-3 gap-2 mt-1.5 text-xs font-mono">
              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-900">
                <span className="text-slate-500 block">Gyro X</span>
                <span className="text-slate-300 font-bold">{gyro.x.toFixed(4)}</span>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-900">
                <span className="text-slate-500 block">Gyro Y</span>
                <span className="text-slate-300 font-bold">{gyro.y.toFixed(4)}</span>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-900">
                <span className="text-slate-500 block">Gyro Z</span>
                <span className="text-slate-300 font-bold">{gyro.z.toFixed(4)}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Wheel Encoders Card */}
      <Card title="Wheel Encoders" icon={<Disc className="w-5 h-5 text-accent-cyan" />}>
        <div className="grid grid-cols-2 gap-3 p-1 text-xs font-mono">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-900/60 relative overflow-hidden">
            <span className="text-slate-500 block">Front Left (FL)</span>
            <span className="text-lg font-bold text-slate-200 mt-1 block">{encoders.fl.toFixed(1)} <span className="text-[10px] text-slate-500">t/s</span></span>
            <div className="absolute right-2 bottom-2 w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-900/60 relative overflow-hidden">
            <span className="text-slate-500 block">Front Right (FR)</span>
            <span className="text-lg font-bold text-slate-200 mt-1 block">{encoders.fr.toFixed(1)} <span className="text-[10px] text-slate-500">t/s</span></span>
            <div className="absolute right-2 bottom-2 w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-900/60 relative overflow-hidden">
            <span className="text-slate-500 block">Rear Left (RL)</span>
            <span className="text-lg font-bold text-slate-200 mt-1 block">{encoders.rl.toFixed(1)} <span className="text-[10px] text-slate-500">t/s</span></span>
            <div className="absolute right-2 bottom-2 w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-900/60 relative overflow-hidden">
            <span className="text-slate-500 block">Rear Right (RR)</span>
            <span className="text-lg font-bold text-slate-200 mt-1 block">{encoders.rr.toFixed(1)} <span className="text-[10px] text-slate-500">t/s</span></span>
            <div className="absolute right-2 bottom-2 w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></div>
          </div>
        </div>
      </Card>

      {/* Ultrasonic Range Finder Card */}
      <Card title="Ultrasonic Distances" icon={<ArrowDown className="w-5 h-5 text-accent-amber" />}>
        <div className="space-y-4 p-1">
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowUp className="w-5 h-5 text-emerald-400" />
              <div>
                <span className="text-slate-400 block text-xs font-semibold">Front Obstacle</span>
                <span className="text-[10px] text-slate-500 font-mono">/sensor/front_distance</span>
              </div>
            </div>
            <div className="text-xl font-extrabold font-mono text-emerald-400">
              {frontDist.toFixed(2)} m
            </div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowDown className="w-5 h-5 text-rose-400" />
              <div>
                <span className="text-slate-400 block text-xs font-semibold">Rear Obstacle</span>
                <span className="text-[10px] text-slate-500 font-mono">/sensor/rear_distance</span>
              </div>
            </div>
            <div className="text-xl font-extrabold font-mono text-rose-400">
              {rearDist.toFixed(2)} m
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SensorPanel;
