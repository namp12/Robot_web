import logging
from app.ros.robot_status import telemetry_store

logger = logging.getLogger("ROS2CameraHandler")


class CameraNodeHandler:
    """Handler for processing camera status and control commands."""

    @staticmethod
    def handle_camera_status(status_str: str):
        active = status_str.upper() in ["ACTIVE", "STREAMING", "ONLINE"]
        telemetry_store.update_subsystems(camera=active)

    @staticmethod
    def get_control_payload(command: str) -> dict:
        logger.info(f"Generated Camera Control payload: {command}")
        return {"action": command, "device": "/dev/video0"}


camera_handler = CameraNodeHandler()
