import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import { Navigation as NavIcon, Send, XCircle, Pause, Play, MapPin } from 'lucide-react';
import navigationService from '../services/navigation.service';

export const Navigation: React.FC = () => {
  const [navStatus, setNavStatus] = useState<'IDLE' | 'NAVIGATING' | 'PAUSED' | 'REACHED'>('IDLE');
  const [goalX, setGoalX] = useState<number>(5.2);
  const [goalY, setGoalY] = useState<number>(1.8);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSendGoal = async () => {
    setLoading(true);
    try {
      await navigationService.sendGoal({ x: goalX, y: goalY });
      setNavStatus('NAVIGATING');
    } catch (err) {
      console.error('Failed to send goal', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelGoal = async () => {
    setLoading(true);
    try {
      await navigationService.cancelGoal();
      setNavStatus('IDLE');
    } catch (err) {
      console.error('Failed to cancel goal', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    try {
      await navigationService.pause();
      setNavStatus('PAUSED');
    } catch (err) {
      console.error('Failed pause', err);
    }
  };

  const handleResume = async () => {
    try {
      await navigationService.resume();
      setNavStatus('NAVIGATING');
    } catch (err) {
      console.error('Failed resume', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <NavIcon className="w-6 h-6 text-accent-cyan" />
            <span>Autonomous Navigation (Nav2)</span>
          </h1>
          <p className="text-xs text-slate-400">Path planning, goal dispatcher & pose estimation</p>
        </div>
        <StatusBadge status={navStatus === 'NAVIGATING' ? 'RUNNING' : navStatus} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Navigation Map Viewport">
            <div className="aspect-video bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center justify-center p-6 space-y-3 relative">
              <MapPin className="w-10 h-10 text-accent-cyan animate-bounce" />
              <span className="text-sm font-mono text-slate-300">2D Occupancy Grid + Trajectory Visualizer</span>
              <div className="text-xs font-mono text-slate-500">Target Goal: ({goalX}, {goalY})</div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Goal Dispatcher">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <label className="block text-slate-400 mb-1">Goal X (m)</label>
                  <input
                    type="number"
                    value={goalX}
                    step="0.1"
                    onChange={(e) => setGoalX(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Goal Y (m)</label>
                  <input
                    type="number"
                    value={goalY}
                    step="0.1"
                    onChange={(e) => setGoalY(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Button variant="primary" isLoading={loading} className="w-full" icon={<Send className="w-4 h-4" />} onClick={handleSendGoal}>
                  Send Goal Coordinates
                </Button>
                <Button variant="danger" isLoading={loading} className="w-full" icon={<XCircle className="w-4 h-4" />} onClick={handleCancelGoal}>
                  Cancel Active Goal
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" icon={<Pause className="w-4 h-4" />} onClick={handlePause}>
                    Pause
                  </Button>
                  <Button variant="outline" icon={<Play className="w-4 h-4" />} onClick={handleResume}>
                    Resume
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Current Pose">
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Position X:</span>
                <span className="text-slate-100">2.45 m</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Position Y:</span>
                <span className="text-slate-100">-1.12 m</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Heading (Yaw):</span>
                <span className="text-accent-cyan">45.0°</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Navigation;
