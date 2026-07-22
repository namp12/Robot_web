import time
import threading
from typing import Dict, Any, List


class RobotTelemetryStore:
    """Thread-safe RAM Cache storing ONLY the latest frame of each ROS2 topic."""

    def __init__(self):
        self._lock = threading.Lock()
        self._connected: bool = False
        self._robot_status: str = "OFFLINE"
        self._mode: str = "MANUAL"

        # Battery
        self._battery_level: float = 88.0
        self._voltage: float = 24.2
        self._current: float = 3.5

        # System Metrics
        self._cpu: float = 34.5
        self._ram: float = 52.5
        self._temperature: float = 48.5
        self._wifi_signal: int = 92

        # Speeds & Pose
        self._linear_speed: float = 0.0
        self._angular_speed: float = 0.0
        self._pose: Dict[str, float] = {"x": 2.45, "y": -1.12, "yaw": 45.0}
        self._goal: Dict[str, float] = {"x": 5.2, "y": 1.8, "yaw": 0.0}
        self._navigation_status: str = "IDLE"

        # Subsystems
        self._camera_status: bool = True
        self._lidar_status: bool = True
        self._esp32_status: bool = True

        # Topic RAM Caches (Latest frame only)
        self._scan_cache: Dict[str, Any] = {"ranges": [2.5] * 360, "angle_min": -3.14, "angle_max": 3.14}
        self._odom_cache: Dict[str, Any] = {"position": {"x": 2.45, "y": -1.12}, "yaw": 45.0, "velocity": {"linear": 0.0, "angular": 0.0}}
        self._map_cache: Dict[str, Any] = {"resolution": 0.05, "width": 1000, "height": 1000, "origin": {"x": 0.0, "y": 0.0}}
        self._tf_cache: List[Dict[str, Any]] = [{"frame_id": "map", "child_frame_id": "base_link", "tx": 2.45, "ty": -1.12}]

        self._last_update: float = time.time()

    def update_connection(self, connected: bool):
        with self._lock:
            self._connected = connected
            self._robot_status = "ONLINE" if connected else "OFFLINE"
            self._last_update = time.time()

    def update_mode(self, mode: str):
        with self._lock:
            self._mode = mode
            self._last_update = time.time()

    def update_battery(self, level: float, voltage: float = 24.2, current: float = 3.5):
        with self._lock:
            self._battery_level = level
            self._voltage = voltage
            self._current = current
            self._last_update = time.time()

    def update_system(self, cpu: float, ram: float, temp: float, wifi: int = 92):
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

    def update_scan(self, scan_data: Dict[str, Any]):
        with self._lock:
            self._scan_cache = scan_data

    def update_odom(self, odom_data: Dict[str, Any]):
        with self._lock:
            self._odom_cache = odom_data

    def update_map_metadata(self, map_data: Dict[str, Any]):
        with self._lock:
            self._map_cache = map_data

    def update_tf(self, tf_data: List[Dict[str, Any]]):
        with self._lock:
            self._tf_cache = tf_data

    def set_emergency_stop(self):
        with self._lock:
            self._robot_status = "EMERGENCY_STOP"
            self._linear_speed = 0.0
            self._angular_speed = 0.0
            self._last_update = time.time()

    def get_scan_cache(self) -> Dict[str, Any]:
        with self._lock:
            return dict(self._scan_cache)

    def get_odom_cache(self) -> Dict[str, Any]:
        with self._lock:
            return dict(self._odom_cache)

    def get_map_cache(self) -> Dict[str, Any]:
        with self._lock:
            return dict(self._map_cache)

    def get_tf_cache(self) -> List[Dict[str, Any]]:
        with self._lock:
            return list(self._tf_cache)

    def get_snapshot(self) -> Dict[str, Any]:
        with self._lock:
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
                "scan": dict(self._scan_cache),
                "odom": dict(self._odom_cache),
                "map": dict(self._map_cache),
            }


telemetry_store = RobotTelemetryStore()
