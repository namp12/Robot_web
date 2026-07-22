// Domain Entity Types

export interface RobotStatus {
  robot_id: number;
  status: 'ONLINE' | 'OFFLINE' | 'EMERGENCY_STOP' | 'AUTONOMOUS' | 'MANUAL';
  mode: 'MANUAL' | 'AUTO';
  battery_level: number;
  voltage: number;
  current: number;
  linear_speed: number;
  angular_speed: number;
  wifi_signal: number;
  connected: boolean;
}

export interface SystemResource {
  cpu_usage: number;
  ram_usage: number;
  ram_total_gb: number;
  disk_usage: number;
  cpu_temperature: number;
  gpu_temperature: number;
  ros2_nodes_active: number;
  esp32_connected: boolean;
  timestamp: string;
}

export interface Mission {
  id: number;
  robot_id: number;
  map_id?: number;
  mission_name: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  start_time: string;
  end_time?: string;
  note?: string;
}

export interface RobotMap {
  id: number;
  map_name: string;
  yaml_path: string;
  image_path: string;
  resolution: number;
  origin_x: number;
  origin_y: number;
  origin_yaw: number;
  width: number;
  height: number;
  description?: string;
  created_at: string;
}

export interface Waypoint {
  id: number;
  map_id: number;
  name: string;
  pos_x: number;
  pos_y: number;
  yaw: number;
  description?: string;
}

export interface BlackBoxLog {
  id: number;
  mission_id: number;
  timestamp: string;
  pos_x: number;
  pos_y: number;
  yaw: number;
  linear_speed: number;
  angular_speed: number;
  battery: number;
  cpu: number;
  ram: number;
  wifi_signal: number;
  event: string;
}

export interface NavigationPose {
  current_x: number;
  current_y: number;
  current_yaw: number;
  goal_x?: number;
  goal_y?: number;
  goal_yaw?: number;
  status: 'IDLE' | 'NAVIGATING' | 'REACHED' | 'FAILED' | 'PAUSED';
}

export interface CameraStatus {
  enabled: boolean;
  streaming: boolean;
  fps: number;
  resolution: string;
  device: string;
  ai_detection_active: boolean;
}

export interface LiDARStatus {
  enabled: boolean;
  connected: boolean;
  scan_frequency_hz: number;
  port: string;
  baudrate: number;
}

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  model?: string;
  latency?: number;
}

// WebSocket Telemetry Packet
export interface TelemetryPacket {
  timestamp: string;
  robot_status: RobotStatus['status'];
  mode: RobotStatus['mode'];
  battery: number;
  cpu: number;
  ram: number;
  temperature: number;
  wifi_signal: number;
  camera_status: boolean;
  lidar_status: boolean;
  esp32_status: boolean;
  front_distance: number;
  rear_distance: number;
  imu: {
    x: number;
    y: number;
    z: number;
    w: number;
  };
  horn: boolean;
  pose: {
    x: number;
    y: number;
    yaw: number;
  };
}
