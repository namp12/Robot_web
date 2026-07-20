import logging
from app.ros.robot_status import telemetry_store

logger = logging.getLogger("ROS2MapHandler")


class MapNodeHandler:
    """Handler for SLAM Toolbox & Map Server ROS2 service clients."""

    @staticmethod
    def start_slam() -> dict:
        logger.info("🚀 [ROS2 Map Handler] Triggering SLAM mapping mode...")
        return {"status": "SLAM_STARTED", "mode": "MAPPING"}

    @staticmethod
    def stop_slam() -> dict:
        logger.info("🛑 [ROS2 Map Handler] Stopping SLAM mapping mode...")
        return {"status": "SLAM_STOPPED"}

    @staticmethod
    def save_map(map_name: str) -> dict:
        logger.info(f"💾 [ROS2 Map Handler] Saving SLAM map to '{map_name}.yaml'...")
        return {"status": "MAP_SAVED", "map_name": map_name, "yaml_path": f"/maps/{map_name}.yaml"}

    @staticmethod
    def load_map(map_name: str) -> dict:
        logger.info(f"📂 [ROS2 Map Handler] Loading map '{map_name}' into Nav2 map_server...")
        return {"status": "MAP_LOADED", "map_name": map_name}


map_handler = MapNodeHandler()
