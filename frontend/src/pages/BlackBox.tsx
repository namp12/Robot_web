import React from 'react';
import Card from '../components/Card';
import { Archive, Search, Filter } from 'lucide-react';

export const BlackBox: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Archive className="w-6 h-6 text-accent-amber" />
            <span>Black Box Operational Recorder</span>
          </h1>
          <p className="text-xs text-slate-400">Flight logs, sensor telemetry timeline and safety events</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search logs..."
              className="bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-primary-500"
            />
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 hover:text-white">
            <Filter className="w-3.5 h-3.5" /> Filter
          </button>
        </div>
      </div>

      <Card title="Timeline Telemetry Records">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900 text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Pose (X, Y)</th>
                <th className="px-4 py-3">Battery</th>
                <th className="px-4 py-3">CPU</th>
                <th className="px-4 py-3">RAM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              <tr className="hover:bg-slate-800/40">
                <td className="px-4 py-3 text-slate-400">2026-07-20 15:45:00</td>
                <td className="px-4 py-3 text-emerald-400">PATROL_STARTED</td>
                <td className="px-4 py-3">(0.00, 0.00)</td>
                <td className="px-4 py-3">90%</td>
                <td className="px-4 py-3">30%</td>
                <td className="px-4 py-3">2.0 GB</td>
              </tr>
              <tr className="hover:bg-slate-800/40">
                <td className="px-4 py-3 text-slate-400">2026-07-20 15:45:30</td>
                <td className="px-4 py-3 text-accent-cyan">WAYPOINT_REACHED</td>
                <td className="px-4 py-3">(2.45, -1.12)</td>
                <td className="px-4 py-3">89%</td>
                <td className="px-4 py-3">35%</td>
                <td className="px-4 py-3">2.1 GB</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default BlackBox;
