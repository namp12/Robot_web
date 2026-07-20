from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


# Robot Schemas
class RobotStatusResponse(BaseModel):
    robot_id: int = 1
    status: str = "ONLINE"
    mode: str = "MANUAL"
    battery_level: float = 88.0
    voltage: float = 24.2
    current: float = 3.5
    linear_speed: float = 0.0
    angular_speed: float = 0.0
    wifi_signal: int = 92
    connected: bool = True


class SystemResourceResponse(BaseModel):
    cpu_usage: float = 34.5
    ram_usage: float = 52.5
    ram_total_gb: float = 4.0
    disk_usage: float = 23.1
    cpu_temperature: float = 48.5
    gpu_temperature: float = 50.0
    ros2_nodes_active: int = 8
    esp32_connected: bool = True
    timestamp: str = datetime.now().isoformat()


class BatteryStatusResponse(BaseModel):
    voltage: float = 24.2
    current: float = 3.5
    percentage: int = 88
    timestamp: str = datetime.now().isoformat()


class ControlCommandRequest(BaseModel):
    linear: float = 0.0
    angular: float = 0.0


class ModeSetRequest(BaseModel):
    mode: str = "MANUAL"


# Mission Schemas
class MissionBase(BaseModel):
    mission_name: str
    robot_id: Optional[int] = 1
    map_id: Optional[int] = None
    note: Optional[str] = None


class MissionCreate(MissionBase):
    pass


class MissionUpdate(BaseModel):
    mission_name: Optional[str] = None
    status: Optional[str] = None
    note: Optional[str] = None


class MissionResponse(MissionBase):
    id: int
    status: str = "PENDING"
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# Map Schemas
class MapBase(BaseModel):
    map_name: str
    yaml_path: Optional[str] = None
    image_path: Optional[str] = None
    description: Optional[str] = None
    resolution: float = 0.05
    origin_x: float = 0.0
    origin_y: float = 0.0
    origin_yaw: float = 0.0
    width: Optional[int] = 1000
    height: Optional[int] = 1000


class MapCreate(MapBase):
    pass


class MapUpdate(BaseModel):
    map_name: Optional[str] = None
    description: Optional[str] = None


class MapResponse(MapBase):
    id: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# BlackBox Schemas
class BlackBoxResponse(BaseModel):
    id: int
    mission_id: Optional[int] = None
    timestamp: Optional[datetime] = None
    pos_x: Optional[float] = 0.0
    pos_y: Optional[float] = 0.0
    yaw: Optional[float] = 0.0
    linear_speed: Optional[float] = 0.0
    angular_speed: Optional[float] = 0.0
    battery: Optional[float] = 88.0
    cpu: Optional[float] = 34.5
    ram: Optional[float] = 52.5
    wifi_signal: Optional[int] = 92
    event: Optional[str] = "LOG"

    model_config = ConfigDict(from_attributes=True)


# AI Schemas
class AIChatRequest(BaseModel):
    question: str


class AIChatResponse(BaseModel):
    question: str
    answer: str
    model: str = "Gemini-Robot-Copilot"
    latency: float = 0.25


# Camera Schemas
class CameraStatusResponse(BaseModel):
    enabled: bool = True
    streaming: bool = True
    fps: int = 30
    resolution: str = "1920x1080"
    device: str = "/dev/video0"
    ai_detection_active: bool = True


# Navigation Schemas
class NavigationGoalRequest(BaseModel):
    x: float
    y: float
    yaw: Optional[float] = 0.0


class NavigationStatusResponse(BaseModel):
    current_x: float = 2.45
    current_y: float = -1.12
    current_yaw: float = 45.0
    goal_x: Optional[float] = 5.2
    goal_y: Optional[float] = 1.8
    goal_yaw: Optional[float] = 0.0
    status: str = "NAVIGATING"
