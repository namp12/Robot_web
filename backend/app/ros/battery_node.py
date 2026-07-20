import logging
from app.ros.robot_status import telemetry_store

logger = logging.getLogger("ROS2BatteryHandler")


class BatteryNodeHandler:
    """Handler for processing /battery ROS2 topics."""

    @staticmethod
    def handle_battery_state(voltage: float, current: float, percentage: float):
        """Update telemetry store with real battery readings."""
        try:
            telemetry_store.update_battery(
                level=round(percentage, 1),
                voltage=round(voltage, 2),
                current=round(current, 2)
            )
        except Exception as e:
            logger.error(f"Error updating battery telemetry: {e}")


battery_handler = BatteryNodeHandler()
