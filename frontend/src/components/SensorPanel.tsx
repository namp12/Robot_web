import React from 'react';
import Card from './Card';
import useTelemetry from '../hooks/useTelemetry';
import { Shield, Route, ArrowDown, ArrowUp } from 'lucide-react';

export const SensorPanel: React.FC = () => {
  const { telemetry } = useTelemetry();

  // IMU Data
  const imuRaw = telemetry?.imu_raw || {
    accel: { x: 0.0, y: 0.0, z: 9.81 },
    gyro: { x: 0.0, y: 0.0, z: 0.0 }
  };
  const accel = imuRaw.accel;
  const gyro = imuRaw.gyro;

  // Euler Orientation angles read directly from telemetry
  const roll = telemetry?.roll ?? 0.0;
  const pitch = telemetry?.pitch ?? 0.0;
  const yaw = telemetry?.yaw ?? 0.0;

  // Travel distance
  const encoderDistance = telemetry?.encoder_distance ?? 0.0;

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

          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold font-mono">
              Orientation Angles (Euler)
            </div>
            <div className="grid grid-cols-3 gap-2 mt-1.5 text-xs font-mono">
              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-900">
                <span className="text-slate-500 block">Roll</span>
                <span className="text-slate-300 font-bold">{roll.toFixed(1)}°</span>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-900">
                <span className="text-slate-500 block">Pitch</span>
                <span className="text-slate-300 font-bold">{pitch.toFixed(1)}°</span>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-900">
                <span className="text-slate-500 block">Yaw</span>
                <span className="text-slate-300 font-bold">{yaw.toFixed(1)}°</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Odometer Card */}
      <Card title="Odometer" icon={<Route className="w-5 h-5 text-accent-cyan" />}>
        <div className="p-1 flex flex-col justify-between h-full min-h-[180px]">
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold font-mono mb-2">
              Travel Distance
            </div>
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-900/60 relative overflow-hidden flex items-center justify-between">
              <div>
                <span className="text-slate-500 block text-xs font-mono">Total Distance</span>
                <span className="text-2xl font-extrabold text-accent-cyan tracking-tight mt-1 block font-mono">
                  {encoderDistance.toFixed(2)} <span className="text-xs font-normal text-slate-400">m</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold font-mono animate-pulse">Active</span>
              </div>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-4 pt-2 border-t border-slate-900/60">
            Sensor Topic: <span className="text-slate-400">/sensor/encoder_distance</span>
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
