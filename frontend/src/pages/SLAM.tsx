import React, { useEffect, useRef, useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { Boxes, Play, Square, Save, FolderOpen, MapPin, Compass } from 'lucide-react';
import mapService from '../services/map.service';
import useTelemetry from '../hooks/useTelemetry';

export const SLAM: React.FC = () => {
  const { telemetry } = useTelemetry();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [slamActive, setSlamActive] = useState<boolean>(true);
  const [mapName, setMapName] = useState<string>('my_room_map');
  const [savePath, setSavePath] = useState<string>('/home/pi/maps');
  const [actionStatus, setActionStatus] = useState<{ type: 'SUCCESS' | 'ERROR' | 'INFO'; message: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Trigger SLAM Start
  const handleStartSLAM = async () => {
    setLoading(true);
    setActionStatus({ type: 'INFO', message: 'Starting SLAM Toolbox sync...' });
    try {
      const res = await mapService.startSLAM();
      setSlamActive(true);
      setActionStatus({ type: 'SUCCESS', message: 'SLAM online mapping node triggered successfully.' });
    } catch (err: any) {
      setActionStatus({ type: 'ERROR', message: err.message || 'Failed to start SLAM.' });
    } finally {
      setLoading(false);
    }
  };

  // Trigger SLAM Stop
  const handleStopSLAM = async () => {
    setLoading(true);
    setActionStatus({ type: 'INFO', message: 'Stopping SLAM node...' });
    try {
      await mapService.stopSLAM();
      setSlamActive(false);
      setActionStatus({ type: 'SUCCESS', message: 'SLAM online mapping node halted.' });
    } catch (err: any) {
      setActionStatus({ type: 'ERROR', message: err.message || 'Failed to stop SLAM.' });
    } finally {
      setLoading(false);
    }
  };

  // Trigger SLAM Save Map with custom path
  const handleSaveMap = async () => {
    if (!mapName.trim()) {
      setActionStatus({ type: 'ERROR', message: 'Please specify a map filename prefix.' });
      return;
    }
    setLoading(true);
    setActionStatus({ type: 'INFO', message: 'Saving SLAM map to target path...' });
    try {
      const res: any = await mapService.saveSLAMMap(mapName, savePath);
      if (res?.status === 'SUCCESS' || res?.message?.includes('success')) {
        setActionStatus({ type: 'SUCCESS', message: res.message || 'Map files saved successfully (.yaml / .pgm).' });
      } else {
        setActionStatus({ type: 'ERROR', message: res?.message || 'Error occurred while saving map.' });
      }
    } catch (err: any) {
      setActionStatus({ type: 'ERROR', message: err.message || 'Failed to trigger map saver.' });
    } finally {
      setLoading(false);
    }
  };

  // Map 2D occupancy grid rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const map = telemetry?.map;
    const width = map?.width || 0;
    const height = map?.height || 0;
    const data = map?.data || [];

    if (width === 0 || height === 0 || data.length === 0) {
      // Draw standard clean empty background grid placeholder
      ctx.fillStyle = '#050811';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      const step = 20;
      for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      ctx.fillStyle = '#64748b';
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('WAITING FOR ACTIVE SLAM /MAP TOPIC...', canvas.width / 2, canvas.height / 2);
      return;
    }

    // Render occupancy grid into offscreen buffer to support crisp scaling
    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const oCtx = offscreen.getContext('2d');
    if (!oCtx) return;

    const imgData = oCtx.createImageData(width, height);
    for (let i = 0; i < data.length; i++) {
      const val = data[i];
      // Flip vertical alignment to match ROS coordinate orientation
      const x = i % width;
      const y = height - 1 - Math.floor(i / width);
      const idx = (y * width + x) * 4;

      if (val === -1) {
        // Unknown Space: dark blue-slate
        imgData.data[idx] = 9;
        imgData.data[idx + 1] = 15;
        imgData.data[idx + 2] = 30;
        imgData.data[idx + 3] = 255;
      } else if (val === 0) {
        // Occupied / Free Space: transparent slate-800
        imgData.data[idx] = 30;
        imgData.data[idx + 1] = 41;
        imgData.data[idx + 2] = 59;
        imgData.data[idx + 3] = 255;
      } else {
        // Occupied Space (Wall / Obstacle): bright cyan neon
        imgData.data[idx] = 34;
        imgData.data[idx + 1] = 211;
        imgData.data[idx + 2] = 238;
        imgData.data[idx + 3] = 255;
      }
    }
    oCtx.putImageData(imgData, 0, 0);

    ctx.fillStyle = '#050811';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Compute sharp scaling aspect-ratio fit
    const scale = Math.min(canvas.width / width, canvas.height / height);
    const dx = (canvas.width - width * scale) / 2;
    const dy = (canvas.height - height * scale) / 2;

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(offscreen, dx, dy, width * scale, height * scale);

    // Project Robot Dot & Yaw Pose
    const origin = map?.origin || { x: 0, y: 0 };
    const resolution = map?.resolution || 0.05;
    const pose = telemetry?.pose || { x: 0, y: 0, yaw: 0 };

    const rxMap = (pose.x - origin.x) / resolution;
    const ryMap = height - 1 - (pose.y - origin.y) / resolution;

    const rxCanvas = dx + rxMap * scale;
    const ryCanvas = dy + ryMap * scale;

    if (rxCanvas >= 0 && rxCanvas <= canvas.width && ryCanvas >= 0 && ryCanvas <= canvas.height) {
      // Red robot base dot
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(rxCanvas, ryCanvas, 7, 0, 2 * Math.PI);
      ctx.fill();

      // Heading arrow pointer
      const angleRad = (pose.yaw * Math.PI) / 180;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(rxCanvas, ryCanvas);
      ctx.lineTo(rxCanvas + 14 * Math.cos(angleRad), ryCanvas - 14 * Math.sin(angleRad));
      ctx.stroke();
    }
  }, [telemetry]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2 font-mono">
            <Boxes className="w-6 h-6 text-primary-500" />
            <span>SLAM Mapping & Grid Construction</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Online Synchronous SLAM Toolbox • Construct 2D grid mapping from LiDAR ranges
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">SLAM Node:</span>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold ${slamActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
            {slamActive ? 'ACTIVE' : 'INACTIVE'}
          </span>
        </div>
      </div>

      {actionStatus && (
        <div className={`p-4 rounded-xl text-xs font-mono border ${
          actionStatus.type === 'SUCCESS'
            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20'
            : actionStatus.type === 'ERROR'
            ? 'bg-rose-950/40 text-rose-400 border-rose-500/20'
            : 'bg-cyan-950/40 text-cyan-400 border-cyan-500/20'
        }`}>
          {actionStatus.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SLAM 2D Map Canvas Visualizer */}
        <div className="lg:col-span-2">
          <Card title="Live Grid Map Canvas">
            <div className="flex justify-center items-center bg-slate-950 rounded-xl border border-slate-900 p-4">
              <canvas
                ref={canvasRef}
                width={540}
                height={400}
                className="max-w-full h-auto rounded-xl border border-slate-900"
              />
            </div>
          </Card>
        </div>

        {/* Config and Controller Actions */}
        <div className="space-y-6">
          <Card title="SLAM Mapping Actions">
            <div className="space-y-3">
              {slamActive ? (
                <Button
                  variant="danger"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold"
                  icon={<Square className="w-4 h-4" />}
                  onClick={handleStopSLAM}
                  disabled={loading}
                >
                  Stop SLAM Node
                </Button>
              ) : (
                <Button
                  variant="success"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold"
                  icon={<Play className="w-4 h-4" />}
                  onClick={handleStartSLAM}
                  disabled={loading}
                >
                  Start SLAM Node
                </Button>
              )}
            </div>
          </Card>

          <Card title="Save SLAM Map File">
            <div className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-slate-500 mb-1.5 font-bold">Map Name (Prefix):</label>
                <input
                  type="text"
                  value={mapName}
                  onChange={(e) => setMapName(e.target.value)}
                  placeholder="e.g. lab_floor_map"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 font-bold focus:outline-none focus:border-primary-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1.5 font-bold">Target Save Directory:</label>
                <input
                  type="text"
                  value={savePath}
                  onChange={(e) => setSavePath(e.target.value)}
                  placeholder="e.g. /home/pi/maps or e:/Robot_web/maps"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 font-bold focus:outline-none focus:border-primary-500 text-xs"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Saves map files (.yaml and .pgm) to this directory on the Pi.
                </span>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold shadow-md shadow-primary-950/20"
                  icon={<Save className="w-4 h-4" />}
                  onClick={handleSaveMap}
                  disabled={loading}
                >
                  Commit & Save Map
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SLAM;
