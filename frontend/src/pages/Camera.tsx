import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import { Camera as CameraIcon, Play, Square, Camera as SnapIcon, Video, Eye, Sparkles } from 'lucide-react';
import cameraService from '../services/camera.service';

export const Camera: React.FC = () => {
  const [streaming, setStreaming] = useState(true);
  const [loading, setLoading] = useState(false);
  const [lastCapture, setLastCapture] = useState<string | null>(null);

  const handleStartStream = async () => {
    setLoading(true);
    try {
      await cameraService.startStream();
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
      await cameraService.stopStream();
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
      console.error('Failed capture image', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <CameraIcon className="w-6 h-6 text-primary-500" />
            <span>Camera Stream & AI Perception</span>
          </h1>
          <p className="text-xs text-slate-400">Live 1080p MJPEG / RTSP Stream with YOLOv8 Object Detection</p>
        </div>
        <StatusBadge status={streaming ? 'ONLINE' : 'OFFLINE'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Stream Viewport */}
        <div className="lg:col-span-2">
          <Card title="Live Stream Viewport">
            <div className="relative aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center group">
              {streaming ? (
                <div className="flex flex-col items-center gap-3 text-slate-400">
                  <Eye className="w-12 h-12 text-primary-500 animate-pulse" />
                  <span className="text-sm font-mono text-slate-300">Live Stream active (1920x1080 @ 30 FPS)</span>
                  <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 bg-black/60 backdrop-blur rounded-full text-xs font-mono text-emerald-400 border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    REC 00:14:22
                  </div>
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 bg-primary-600/30 backdrop-blur rounded-full text-xs font-mono text-primary-300 border border-primary-500/40">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Detection Active
                  </div>
                </div>
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
              <Button variant="outline" className="w-full" icon={<Video className="w-4 h-4" />}>
                Record Video Clip
              </Button>
            </div>
            {lastCapture && (
              <div className="mt-3 p-2 text-center rounded bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-400">
                Photo captured at {lastCapture}
              </div>
            )}
          </Card>

          <Card title="Stream Diagnostics">
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Device:</span>
                <span className="text-slate-200">/dev/video0</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Resolution:</span>
                <span className="text-slate-200">1920 x 1080</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">AI Model:</span>
                <span className="text-accent-cyan">YOLOv8n (Active)</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Camera;
