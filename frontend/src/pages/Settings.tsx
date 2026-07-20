import React from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { Settings as SettingsIcon, Save } from 'lucide-react';

export const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-primary-500" />
            <span>Platform Settings & Configuration</span>
          </h1>
          <p className="text-xs text-slate-400">Configure Robot hardware parameters, network settings & thresholds</p>
        </div>
        <Button variant="primary" icon={<Save className="w-4 h-4" />}>
          Save Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Robot Parameters">
          <div className="space-y-4 text-xs font-mono">
            <div>
              <label className="block text-slate-400 mb-1">Robot Serial Number</label>
              <input type="text" defaultValue="RBT-EXPLORER-2026-X1" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-primary-500" />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Max Speed (m/s)</label>
              <input type="number" defaultValue="1.0" step="0.1" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-primary-500" />
            </div>
          </div>
        </Card>

        <Card title="Network & ROS2 Settings">
          <div className="space-y-4 text-xs font-mono">
            <div>
              <label className="block text-slate-400 mb-1">ROS Domain ID</label>
              <input type="number" defaultValue="0" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-primary-500" />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">FastAPI Backend URL</label>
              <input type="text" defaultValue="http://localhost:8000" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-primary-500" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
