import React, { useEffect, useRef, useState } from 'react';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import { Radar, Activity, Eye, Layers } from 'lucide-react';
import useTelemetry from '../hooks/useTelemetry';

export const LiDAR: React.FC = () => {
  const { telemetry, isConnected } = useTelemetry();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [maxRange, setMaxRange] = useState<number>(6.0); // 6m view radius
  const [colorScheme, setColorScheme] = useState<'rviz' | 'neon'>('rviz');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const scale = (width / 2 - 40) / maxRange; // Pixels per meter

    let animationFrameId: number;

    const render = () => {
      // 1. Clear background (RViz Dark Theme #0B1120 / #050811)
      ctx.fillStyle = '#050811';
      ctx.fillRect(0, 0, width, height);

      // 2. Draw RViz 1-meter Cartesian Grid
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.6)';
      ctx.lineWidth = 1;

      const gridStep = scale; // 1 meter grid
      for (let x = cx % gridStep; x < width; x += gridStep) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = cy % gridStep; y < height; y += gridStep) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw Distance Concentric Rings
      for (let m = 1; m <= maxRange; m += 1) {
        const r = m * scale;
        if (r < width / 2 - 20) {
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = '#64748B';
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.fillText(`${m}m`, cx + r - 12, cy + 14);
        }
      }

      // 3. Draw ROS2 Frame Coordinate Axes (Red = X Forward, Green = Y Left)
      const axisLen = 40;
      // Red X-Axis (Forward / Up)
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, cy - axisLen);
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Green Y-Axis (Left)
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx - axisLen, cy);
      ctx.strokeStyle = '#22C55E';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = '#EF4444';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('+X (Forward)', cx + 5, cy - axisLen - 5);
      ctx.fillStyle = '#22C55E';
      ctx.fillText('+Y (Left)', cx - axisLen - 45, cy - 5);

      // 4. Extract Real ROS2 LaserScan Ranges
      const scan = telemetry?.scan;
      const ranges: number[] = scan?.ranges || [];
      const angleMin = scan?.angle_min ?? -Math.PI;
      const angleIncrement = scan?.angle_increment ?? (Math.PI * 2) / (ranges.length || 360);

      let pointsDrawn = 0;

      if (ranges.length > 0) {
        ranges.forEach((dist, idx) => {
          if (dist > 0.05 && dist <= maxRange) {
            pointsDrawn++;
            // ROS2 standard angle offset: 0 rad = +X (Up), pi/2 = +Y (Left)
            const angle = angleMin + idx * angleIncrement;
            const px = cx - (dist * Math.sin(angle)) * scale;
            const py = cy - (dist * Math.cos(angle)) * scale;

            // RViz Rainbow Color Spectrum based on distance
            let pointColor = '#00F0FF';
            if (colorScheme === 'rviz') {
              const normDist = dist / maxRange;
              if (normDist < 0.25) pointColor = '#EF4444';       // Red (Close obstacle)
              else if (normDist < 0.5) pointColor = '#F59E0B';  // Amber
              else if (normDist < 0.75) pointColor = '#22C55E'; // Green
              else pointColor = '#3B82F6';                      // Blue (Far obstacle)
            }

            // Draw Discrete RViz Laser Point Dot (Square / Small Circle)
            ctx.fillStyle = pointColor;
            ctx.fillRect(px - 1.5, py - 1.5, 3.5, 3.5);
          }
        });
      }

      // Draw Center Robot Node (base_link)
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#2563EB';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [telemetry, maxRange, colorScheme]);

  const totalPoints = telemetry?.scan?.ranges?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2 font-mono">
            <Radar className="w-6 h-6 text-cyan-400" />
            <span>LiDAR 2D LaserScan (RViz2 Style Visualizer)</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            ROS2 Topic: /scan • Cartesian Grid (1m x 1m) • Frame: base_link
          </p>
        </div>
        <StatusBadge status={isConnected ? 'ONLINE' : 'OFFLINE'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main RViz 2D Grid Canvas Viewport */}
        <div className="lg:col-span-2">
          <Card title="RVIZ2 LASERSCAN CANVAS (+X FORWARD, +Y LEFT)">
            <div className="flex justify-center items-center p-4 bg-slate-950 rounded-xl border border-slate-800 relative">
              <canvas
                ref={canvasRef}
                width={540}
                height={540}
                className="max-w-full h-auto rounded-xl border border-slate-800"
              />

              <div className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1 bg-black/70 backdrop-blur rounded-full text-xs font-mono text-emerald-400 border border-emerald-500/30">
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                <span>RVIZ2 LASERSCAN GRID</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Control & Diagnostics Panel */}
        <div className="space-y-6">
          <Card title="Display Configuration">
            <div className="space-y-4 font-mono text-xs">
              <div>
                <label className="text-slate-400 block mb-2">Color Scheme:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setColorScheme('rviz')}
                    className={`py-2 px-3 rounded-xl border font-bold text-center transition-all ${
                      colorScheme === 'rviz'
                        ? 'bg-primary-500/20 border-primary-500 text-primary-400'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    RViz Rainbow Spectrum
                  </button>
                  <button
                    onClick={() => setColorScheme('neon')}
                    className={`py-2 px-3 rounded-xl border font-bold text-center transition-all ${
                      colorScheme === 'neon'
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    Neon Cyan
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>View Radius (Max Range):</span>
                  <span className="text-cyan-400 font-bold">{maxRange}m</span>
                </div>
                <input
                  type="range"
                  min="2.0"
                  max="12.0"
                  step="0.5"
                  value={maxRange}
                  onChange={(e) => setMaxRange(parseFloat(e.target.value))}
                  className="w-full accent-primary-500 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </Card>

          <Card title="LiDAR Diagnostics">
            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">ROS2 Topic:</span>
                <span className="text-cyan-400 font-bold">/scan</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Points Received:</span>
                <span className="text-emerald-400 font-bold">{totalPoints} pts</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Scan Frequency:</span>
                <span className="text-slate-200">10.2 Hz</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Frame ID:</span>
                <span className="text-slate-200">laser / base_link</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LiDAR;
