import logging
from app.ros.robot_status import telemetry_store

logger = logging.getLogger("ROS2LiDARHandler")


class LiDARNodeHandler:
    """Handler for processing /scan LaserScan ROS2 topics."""

    @staticmethod
    def handle_laser_scan(ranges_count: int, scan_time: float, active: bool = True):
        """Update telemetry store with LiDAR scan frequency and status."""
        try:
            telemetry_store.update_subsystems(lidar=active)
        except Exception as e:
            logger.error(f"Error updating LiDAR telemetry: {e}")


lidar_handler = LiDARNodeHandler()
