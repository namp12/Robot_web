import math
import logging
from app.ros.robot_status import telemetry_store

logger = logging.getLogger("ROS2SystemHandler")


class SystemNodeHandler:
    """Handler for /system and /odom ROS2 topics."""

    @staticmethod
    def handle_odometry(x: float, y: float, orientation_z: float, orientation_w: float, linear_v: float, angular_v: float):
        """Convert quaternion orientation to Yaw angle and update telemetry pose."""
        try:
            # Calculate Yaw from Quaternion orientation (z, w)
            siny_cosp = 2 * (orientation_w * orientation_z)
            cosy_cosp = 1 - 2 * (orientation_z * orientation_z)
            yaw_rad = math.atan2(siny_cosp, cosy_cosp)
            yaw_deg = round(math.degrees(yaw_rad), 1)

            telemetry_store.update_pose(
                x=round(x, 2),
                y=round(y, 2),
                yaw=yaw_deg,
                linear=round(linear_v, 2),
                angular=round(angular_v, 2)
            )
        except Exception as e:
            logger.error(f"Error handling odometry: {e}")

    @staticmethod
    def handle_system_metrics(cpu: float, ram: float, temp: float, wifi: int = 90):
        telemetry_store.update_system(cpu=cpu, ram=ram, temp=temp, wifi=wifi)


system_handler = SystemNodeHandler()
