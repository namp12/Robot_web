import logging
from app.ros.robot_status import telemetry_store

logger = logging.getLogger("ROS2ESP32Handler")


class ESPNodeHandler:
    """Handler for /esp/status ROS2 topics."""

    @staticmethod
    def handle_esp_status(status_text: str):
        is_ok = status_text.upper() in ["OK", "CONNECTED", "ACTIVE"]
        telemetry_store.update_subsystems(esp32=is_ok)


esp_handler = ESPNodeHandler()
