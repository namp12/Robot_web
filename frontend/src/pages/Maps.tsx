import React from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { Map, Plus, Edit, Trash2, Download, Upload } from 'lucide-react';

export const Maps: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Map className="w-6 h-6 text-primary-500" />
            <span>Map Management</span>
          </h1>
          <p className="text-xs text-slate-400">Manage, import/export, and edit SLAM YAML maps</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<Upload className="w-4 h-4" />}>Import</Button>
          <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>Create Map</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card title="Lab_Floor_1.yaml" subtitle="Resolution: 0.05 m/px">
          <div className="aspect-video bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-center my-3">
            <span className="text-xs font-mono text-slate-500">Map Preview Thumbnail</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
            <span className="text-emerald-400 font-semibold font-mono">Active Map</span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" icon={<Edit className="w-3.5 h-3.5" />}>Edit</Button>
              <Button variant="ghost" size="sm" icon={<Download className="w-3.5 h-3.5" />}>Export</Button>
              <Button variant="ghost" size="sm" className="text-rose-400" icon={<Trash2 className="w-3.5 h-3.5" />}>Delete</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Maps;
