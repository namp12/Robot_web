import React, { useState } from 'react';
import Card from './Card';
import Button from './Button';
import AIOverlay from './AIOverlay';
import useTelemetry from '../hooks/useTelemetry';
import { Camera as CameraIcon, Play, Square, Sparkles } from 'lucide-react';
import cameraService from '../services/camera.service';

export const CameraView: React.FC = () => {
  const { telemetry } = useTelemetry();
  const [streaming, setStreaming] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleStartStream = () => {
    setLoading(true);
    setStreaming(true);
    setLoading(false);
  };

  const handleStopStream = () => {
    setLoading(true);
    setStreaming(false);
    setLoading(false);
  };

  const streamUrl = cameraService.getStreamUrl();
  const aiDetections = telemetry?.ai_detections || [];

  return (
    <Card title="Live Stream Viewport" icon={<CameraIcon className="w-5 h-5 text-primary-500 animate-pulse" />}>
      <div className="relative aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800/80 flex items-center justify-center min-h-[340px]">
        {streaming ? (
          <>
            <img
              src={streamUrl}
              alt="ROS2 Live Camera Feed"
              className="w-full h-full object-contain bg-slate-950"
            />
            {/* Superimpose AI Detection Bounding Boxes */}
            <AIOverlay detections={aiDetections} />

            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 bg-black/70 backdrop-blur-md rounded-full text-[10px] font-mono text-emerald-400 border border-emerald-500/20 pointer-events-none z-20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              LIVE ROS2 FEED
            </div>
            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 bg-primary-600/40 backdrop-blur-md rounded-full text-[10px] font-mono text-primary-200 border border-primary-500/30 pointer-events-none z-20">
              <Sparkles className="w-3 h-3" />
              /camera/image_raw
            </div>
          </>
        ) : (
          <span className="text-sm font-mono text-slate-500">Camera Stream Stopped</span>
        )}
      </div>

      <div className="flex gap-4 mt-4">
        {streaming ? (
          <Button
            variant="danger"
            isLoading={loading}
            className="flex-1 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2"
            icon={<Square className="w-4 h-4" />}
            onClick={handleStopStream}
          >
            Stop Feed
          </Button>
        ) : (
          <Button
            variant="success"
            isLoading={loading}
            className="flex-1 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2"
            icon={<Play className="w-4 h-4" />}
            onClick={handleStartStream}
          >
            Start Feed
          </Button>
        )}
      </div>
    </Card>
  );
};

export default CameraView;
