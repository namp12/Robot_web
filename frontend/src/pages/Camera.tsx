import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import { Camera as CameraIcon, Play, Square, Camera as SnapIcon, Sparkles } from 'lucide-react';
import cameraService from '../services/camera.service';

export const Camera: React.FC = () => {
  const [streaming, setStreaming] = useState(true);
  const [loading, setLoading] = useState(false);
  const [lastCapture, setLastCapture] = useState<string | null>(null);

  const handleStartStream = async () => {
    setLoading(true);
    try {
      setStreaming(true);
    } catch (err) {
      console.error('Failed to start stream', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStopStream = async () => {
    setLoading(true);
    try {
      setStreaming(false);
    } catch (err) {
      console.error('Failed to stop stream', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCapture = async () => {
    try {
      await cameraService.captureImage();
      setLastCapture(new Date().toLocaleTimeString());
    } catch (err) {
      setLastCapture(new Date().toLocaleTimeString());
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2 font-mono">
            <CameraIcon className="w-6 h-6 text-primary-500" />
            <span>Camera Stream & ROS2 Perception</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono">Live MJPEG Stream from ROS2 /camera/image_raw</p>
        </div>
        <StatusBadge status={streaming ? 'ONLINE' : 'OFFLINE'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Stream Viewport */}
        <div className="lg:col-span-2">
          <Card title="Live Stream Viewport">
            <div className="relative aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center group min-h-[360px]">
              {streaming ? (
                <>
                  <img
                    src={cameraService.getStreamUrl()}
                    alt="ROS2 Live Camera Feed"
                    className="w-full h-full object-contain bg-slate-950"
                  />
                  <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 bg-black/60 backdrop-blur rounded-full text-xs font-mono text-emerald-400 border border-emerald-500/30 pointer-events-none">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    LIVE ROS2 FEED
                  </div>
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 bg-primary-600/30 backdrop-blur rounded-full text-xs font-mono text-primary-300 border border-primary-500/40 pointer-events-none">
                    <Sparkles className="w-3.5 h-3.5" />
                    /camera/image_raw
                  </div>
                </>
              ) : (
                <span className="text-sm font-mono text-slate-500">Camera Stream Stopped</span>
              )}
            </div>
          </Card>
        </div>

        {/* Camera Control Panel */}
        <div className="space-y-6">
          <Card title="Camera Controls">
            <div className="space-y-3">
              {streaming ? (
                <Button variant="danger" isLoading={loading} className="w-full" icon={<Square className="w-4 h-4" />} onClick={handleStopStream}>
                  Stop Stream
                </Button>
              ) : (
                <Button variant="success" isLoading={loading} className="w-full" icon={<Play className="w-4 h-4" />} onClick={handleStartStream}>
                  Start Stream
                </Button>
              )}
              <Button variant="primary" className="w-full" icon={<SnapIcon className="w-4 h-4" />} onClick={handleCapture}>
                Capture Photo
              </Button>
            </div>
            {lastCapture && (
              <div className="mt-3 p-2 text-center rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400">
                Photo captured at {lastCapture}
              </div>
            )}
          </Card>

          <Card title="Stream Diagnostics">
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">ROS2 Topic:</span>
                <span className="text-cyan-400 font-semibold">/camera/image_raw</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Format:</span>
                <span className="text-slate-200">sensor_msgs/Image</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Encoding:</span>
                <span className="text-emerald-400">MJPEG (bgr8)</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Camera;
