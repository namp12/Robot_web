import { useEffect, useState } from 'react';
import wsService from '../services/websocket.service';
import { TelemetryPacket } from '../types';

const defaultTelemetry: TelemetryPacket = {
  timestamp: new Date().toISOString(),
  robot_status: 'ONLINE',
  mode: 'MANUAL',
  battery: 88,
  voltage: 24.2,
  current: 3.5,
  cpu: 34.5,
  ram: 52.5,
  temperature: 48.5,
  wifi_signal: 92,
  camera_status: true,
  lidar_status: true,
  esp32_status: true,
  pose: { x: 2.45, y: -1.12, yaw: 45.0 }
};

export const useTelemetry = () => {
  const [telemetry, setTelemetry] = useState<TelemetryPacket>(defaultTelemetry);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    wsService.connect();

    const unsubscribeMessage = wsService.subscribe((data) => {
      if (data && typeof data === 'object') {
        setTelemetry((prev) => ({
          ...prev,
          ...data,
          pose: {
            x: data.pose?.x ?? prev.pose?.x ?? 2.45,
            y: data.pose?.y ?? prev.pose?.y ?? -1.12,
            yaw: data.pose?.yaw ?? prev.pose?.yaw ?? 45.0,
          },
        }));
      }
    });

    const unsubscribeConnection = wsService.onConnectionChange((connected) => {
      setIsConnected(connected);
    });

    return () => {
      unsubscribeMessage();
      unsubscribeConnection();
    };
  }, []);

  return { telemetry, isConnected };
};

export default useTelemetry;
