import React from 'react';

export interface Detection {
  class_name: string;
  score: number;
  bbox: [number, number, number, number]; // normalized coordinates [ymin, xmin, ymax, xmax] (0.0 to 1.0)
}

interface AIOverlayProps {
  detections: Detection[];
}

export const AIOverlay: React.FC<AIOverlayProps> = ({ detections }) => {
  if (!detections || detections.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 font-mono text-[10px]">
      {detections.map((det, index) => {
        const [ymin, xmin, ymax, xmax] = det.bbox;
        
        // Convert to percentage values for overlay scaling
        const left = `${Math.min(100, Math.max(0, xmin * 100))}%`;
        const top = `${Math.min(100, Math.max(0, ymin * 100))}%`;
        const width = `${Math.min(100, Math.max(0, (xmax - xmin) * 100))}%`;
        const height = `${Math.min(100, Math.max(0, (ymax - ymin) * 100))}%`;

        return (
          <div
            key={index}
            className="absolute border-2 border-primary-500 rounded bg-primary-500/10 flex flex-col justify-start transition-all duration-300 shadow-md shadow-primary-950/20"
            style={{ left, top, width, height }}
          >
            <div className="absolute -top-5 left-0 bg-primary-600 text-slate-100 px-1.5 py-0.5 rounded font-bold whitespace-nowrap shadow-sm border border-primary-500/50">
              {det.class_name} ({Math.round(det.score * 100)}%)
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AIOverlay;
