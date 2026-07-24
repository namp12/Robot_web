import React from 'react';
import Card from './Card';
import useTelemetry from '../hooks/useTelemetry';
import { BatteryCharging, Zap } from 'lucide-react';

export const BatteryMonitor: React.FC = () => {
  const { telemetry } = useTelemetry();

  const batteryVal = telemetry?.battery ?? 88;
  const voltageVal = telemetry?.voltage ?? 24.2;
  const currentVal = telemetry?.current ?? 3.5;

  const getBatteryColorClass = (val: number) => {
    if (val > 50) return 'text-emerald-400 bg-emerald-400';
    if (val > 20) return 'text-amber-400 bg-amber-400';
    return 'text-rose-500 bg-rose-500';
  };

  const colorClass = getBatteryColorClass(batteryVal).split(' ');
  const textColor = colorClass[0];
  const barColor = colorClass[1];

  return (
    <Card title="Battery Level" icon={<BatteryCharging className="w-5 h-5 text-emerald-400" />}>
      <div className="flex items-baseline justify-between mt-1">
        <span className={`text-3xl font-extrabold font-mono tracking-tight ${textColor}`}>
          {Math.round(batteryVal)}%
        </span>
        <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>{voltageVal.toFixed(1)}V / {currentVal.toFixed(1)}A</span>
        </span>
      </div>

      <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden mt-3 p-0.5 border border-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.min(100, Math.max(0, batteryVal))}%` }}
        ></div>
      </div>
    </Card>
  );
};

export default BatteryMonitor;
