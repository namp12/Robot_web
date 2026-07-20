import time
import threading
from typing import Dict, Any


class RobotTelemetryStore:
    """Thread-safe data store for real-time ROS2 robot telemetry."""

    def __init__(self):
        self._lock = threading.Lock()
        self._connected: bool = False
        self._robot_status: str = "OFFLINE"
        self._mode: str = "MANUAL"

        # Battery
        self._battery_level: float = 0.0
        self._voltage: float = 0.0
        self._current: float = 0.0

        # System Metrics
        self._cpu: float = 0.0
        self._ram: float = 0.0
        self._temperature: float = 0.0
        self._wifi_signal: int = 0

        # Speeds & Pose
        self._linear_speed: float = 0.0
        self._angular_speed: float = 0.0
        self._pose: Dict[str, float] = {"x": 0.0, "y": 0.0, "yaw": 0.0}
        self._goal: Dict[str, float] = {"x": 0.0, "y": 0.0, "yaw": 0.0}
        self._navigation_status: str = "IDLE"

        # Hardware Subsystem Connection Flags
        self._camera_status: bool = False
        self._lidar_status: bool = False
        self._esp32_status: bool = False

        self._last_update: float = time.time()

    def update_connection(self, connected: bool):
        with self._lock:
            self._connected = connected
            self._robot_status = "ONLINE" if connected else "OFFLINE"
            self._last_update = time.time()

    def update_battery(self, level: float, voltage: float = 24.0, current: float = 2.0):
        with self._lock:
            self._battery_level = level
            self._voltage = voltage
            self._current = current
            self._last_update = time.time()

    def update_system(self, cpu: float, ram: float, temp: float, wifi: int = 90):
        with self._lock:
            self._cpu = cpu
            self._ram = ram
            self._temperature = temp
            self._wifi_signal = wifi
            self._last_update = time.time()

    def update_pose(self, x: float, y: float, yaw: float, linear: float = 0.0, angular: float = 0.0):
        with self._lock:
            self._pose = {"x": x, "y": y, "yaw": yaw}
            self._linear_speed = linear
            self._angular_speed = angular
            self._last_update = time.time()

    def update_navigation(self, status: str, goal_x: float = 0.0, goal_y: float = 0.0, goal_yaw: float = 0.0):
        with self._lock:
            self._navigation_status = status
            self._goal = {"x": goal_x, "y": goal_y, "yaw": goal_yaw}
            self._last_update = time.time()

    def update_subsystems(self, camera: bool = True, lidar: bool = True, esp32: bool = True):
        with self._lock:
            self._camera_status = camera
            self._lidar_status = lidar
            self._esp32_status = esp32
            self._last_update = time.time()

    def set_emergency_stop(self):
        with self._lock:
            self._robot_status = "EMERGENCY_STOP"
            self._linear_speed = 0.0
            self._angular_speed = 0.0
            self._last_update = time.time()

    def set_mode(self, mode: str):
        with self._lock:
            self._mode = mode
            self._last_update = time.time()

    def get_snapshot(self) -> Dict[str, Any]:
        """Return a thread-safe dict snapshot of current telemetry data."""
        with self._lock:
            # If no telemetry update received within 5 seconds, mark offline
            is_alive = self._connected and (time.time() - self._last_update < 5.0)
            status = self._robot_status if is_alive else "OFFLINE"

            return {
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "connected": is_alive,
                "robot_status": status,
                "mode": self._mode,
                "battery": self._battery_level,
                "voltage": self._voltage,
                "current": self._current,
                "cpu": self._cpu,
                "ram": self._ram,
                "temperature": self._temperature,
                "wifi_signal": self._wifi_signal,
                "linear_speed": self._linear_speed,
                "angular_speed": self._angular_speed,
                "pose": dict(self._pose),
                "goal": dict(self._goal),
                "navigation_status": self._navigation_status,
                "camera_status": self._camera_status,
                "lidar_status": self._lidar_status,
                "esp32_status": self._esp32_status,
            }


telemetry_store = RobotTelemetryStore()
