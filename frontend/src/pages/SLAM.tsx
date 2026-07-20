import React from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { Boxes, Play, Square, Save, FolderOpen } from 'lucide-react';

export const SLAM: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Boxes className="w-6 h-6 text-primary-500" />
            <span>SLAM Mapping & Grid Construction</span>
          </h1>
          <p className="text-xs text-slate-400">ROS2 SLAM Toolbox synchronous mapping mode</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Live Grid Map Canvas">
            <div className="aspect-video bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center">
              <span className="text-sm font-mono text-slate-400">SLAM Grid Map Visualizer (2D Occupancy Grid)</span>
            </div>
          </Card>
        </div>

        <Card title="SLAM Mapping Actions">
          <div className="space-y-3">
            <Button variant="success" className="w-full" icon={<Play className="w-4 h-4" />}>
              Start SLAM
            </Button>
            <Button variant="danger" className="w-full" icon={<Square className="w-4 h-4" />}>
              Stop SLAM
            </Button>
            <Button variant="primary" className="w-full" icon={<Save className="w-4 h-4" />}>
              Save Current Map
            </Button>
            <Button variant="outline" className="w-full" icon={<FolderOpen className="w-4 h-4" />}>
              Load Existing Map
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SLAM;
