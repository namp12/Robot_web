import React, { useState, useEffect, useRef } from 'react';
import Card from './Card';
import Button from './Button';
import { Send, XCircle, MapPin, Compass } from 'lucide-react';
import navigationService from '../services/navigation.service';
import useTelemetry from '../hooks/useTelemetry';

export const MapView: React.FC = () => {
  const { telemetry } = useTelemetry();
  const [goalX, setGoalX] = useState<number>(5.2);
  const [goalY, setGoalY] = useState<number>(1.8);
  const [loading, setLoading] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Position & Heading
  const pose = telemetry?.pose || { x: 2.45, y: -1.12, yaw: 45.0 };
  const target = telemetry?.goal || { x: 5.2, y: 1.8, yaw: 0.0 };

  const handleSendGoal = async () => {
    setLoading(true);
    try {
      await navigationService.sendGoal({ x: goalX, y: goalY });
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
    } catch (err) {
      console.error('Failed to cancel goal', err);
    } finally {
      setLoading(false);
    }
  };

  // Redraw 2D Grid & Robot Map on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear background
    ctx.fillStyle = '#020617'; // slate-950
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = '#1e293b'; // slate-800
    ctx.lineWidth = 0.5;
    const gridSize = 30;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Map origin center coordinate
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = 25; // pixels per meter

    // Draw robot path or mock walls
    ctx.strokeStyle = '#334155'; // slate-700
    ctx.lineWidth = 3;
    ctx.strokeRect(centerX - 100, centerY - 100, 200, 200);

    // Draw target goal pin
    const tX = centerX + target.x * scale;
    const tY = centerY - target.y * scale;
    ctx.fillStyle = '#f59e0b'; // amber-500
    ctx.beginPath();
    ctx.arc(tX, tY, 6, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw robot dot and heading indicator
    const rX = centerX + pose.x * scale;
    const rY = centerY - pose.y * scale;
    ctx.fillStyle = '#06b6d4'; // cyan-500
    ctx.beginPath();
    ctx.arc(rX, rY, 8, 0, 2 * Math.PI);
    ctx.fill();

    // Yaw heading vector arrow
    const arrowLength = 16;
    const angleRad = (pose.yaw * Math.PI) / 180;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(rX, rY);
    ctx.lineTo(rX + arrowLength * Math.cos(angleRad), rY - arrowLength * Math.sin(angleRad));
    ctx.stroke();

  }, [pose, target]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* 2D Canvas */}
      <div className="xl:col-span-2">
        <Card title="SLAM Map Grid" subtitle="Live synchronous 2D Occupancy Grid + Pose">
          <div className="relative bg-slate-950 rounded-xl overflow-hidden border border-slate-900 flex justify-center">
            <canvas
              ref={canvasRef}
              width={600}
              height={340}
              className="w-full max-w-[600px] h-[340px] block"
            />
            <div className="absolute bottom-4 left-4 flex flex-col gap-1 bg-black/75 backdrop-blur px-3 py-2 rounded-lg text-[10px] font-mono border border-slate-800">
              <span className="text-slate-400">Robot Pose: ({pose.x.toFixed(2)}m, {pose.y.toFixed(2)}m)</span>
              <span className="text-accent-cyan font-semibold">Yaw Heading: {pose.yaw.toFixed(1)}°</span>
            </div>
            <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 backdrop-blur px-2.5 py-1 rounded-full text-[9px] font-mono text-amber-300">
              <MapPin className="w-3 h-3" />
              <span>Goal: ({target.x.toFixed(1)}, {target.y.toFixed(1)})</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Goal Dispatcher & Info */}
      <div className="space-y-6">
        <Card title="Nav2 Goal Dispatcher" icon={<Compass className="w-5 h-5 text-accent-cyan" />}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div>
                <label className="block text-slate-500 mb-1">Target X (meters)</label>
                <input
                  type="number"
                  value={goalX}
                  step="0.1"
                  onChange={(e) => setGoalX(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-primary-500 font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Target Y (meters)</label>
                <input
                  type="number"
                  value={goalY}
                  step="0.1"
                  onChange={(e) => setGoalY(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-primary-500 font-bold"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                variant="primary"
                isLoading={loading}
                className="w-full py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2"
                icon={<Send className="w-4 h-4" />}
                onClick={handleSendGoal}
              >
                Dispatch Goal Pose
              </Button>
              <Button
                variant="outline"
                isLoading={loading}
                className="w-full py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 text-slate-300 hover:text-white"
                icon={<XCircle className="w-4 h-4" />}
                onClick={handleCancelGoal}
              >
                Abort Navigation
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MapView;
