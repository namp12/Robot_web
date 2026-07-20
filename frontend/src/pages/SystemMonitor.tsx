import React from 'react';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import { Activity, Cpu, HardDrive, Thermometer, CpuIcon, Radio } from 'lucide-react';

export const SystemMonitor: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary-500" />
            <span>System Resources & ROS2 Nodes</span>
          </h1>
          <p className="text-xs text-slate-400">Raspberry Pi 4 hardware metrics & active middleware nodes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card title="CPU Core Utilization" icon={<Cpu className="w-5 h-5 text-primary-400" />}>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-2">34.2 %</div>
          <div className="text-xs text-slate-400 font-mono mt-1">ARM Cortex-A72 @ 1.5 GHz</div>
        </Card>

        <Card title="RAM Consumption" icon={<HardDrive className="w-5 h-5 text-accent-cyan" />}>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-2">2.1 / 4.0 GB</div>
          <div className="text-xs text-slate-400 font-mono mt-1">LPDDR4 SDRAM</div>
        </Card>

        <Card title="Disk Storage" icon={<HardDrive className="w-5 h-5 text-emerald-400" />}>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-2">14.8 / 64.0 GB</div>
          <div className="text-xs text-slate-400 font-mono mt-1">MicroSD Class 10 U3</div>
        </Card>

        <Card title="Thermal Sensors" icon={<Thermometer className="w-5 h-5 text-accent-amber" />}>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-2">48.5 °C</div>
          <div className="text-xs text-emerald-400 font-mono mt-1">SoC Cooling Fan Active</div>
        </Card>
      </div>

      <Card title="Active ROS2 Nodes">
        <div className="space-y-2">
          {[
            { name: '/robot_state_publisher', type: 'rclcpp', status: 'RUNNING' },
            { name: '/rplidar_composition', type: 'rclcpp', status: 'RUNNING' },
            { name: '/nav2_planner', type: 'rclpy', status: 'RUNNING' },
            { name: '/esp32_serial_bridge', type: 'rclpy', status: 'RUNNING' },
          ].map((node) => (
            <div key={node.name} className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-3">
                <Radio className="w-4 h-4 text-primary-400" />
                <span className="text-xs font-mono font-semibold text-slate-200">{node.name}</span>
                <span className="text-[10px] font-mono text-slate-500">({node.type})</span>
              </div>
              <StatusBadge status={node.status} size="sm" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default SystemMonitor;
