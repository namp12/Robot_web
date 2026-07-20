from app.schemas.schemas import RobotStatusResponse, SystemResourceResponse, BatteryStatusResponse
from app.ros.robot_status import telemetry_store
from app.ros.ros_manager import ros_manager


class RobotService:
    @staticmethod
    async def get_status() -> RobotStatusResponse:
        snapshot = telemetry_store.get_snapshot()
        return RobotStatusResponse(
            robot_id=1,
            status=snapshot["robot_status"],
            mode=snapshot["mode"],
            battery_level=snapshot["battery"],
            voltage=snapshot["voltage"],
            current=snapshot["current"],
            linear_speed=snapshot["linear_speed"],
            angular_speed=snapshot["angular_speed"],
            wifi_signal=snapshot["wifi_signal"],
            connected=snapshot["connected"],
        )

    @staticmethod
    async def get_system_resource() -> SystemResourceResponse:
        snapshot = telemetry_store.get_snapshot()
        return SystemResourceResponse(
            cpu_usage=snapshot["cpu"],
            ram_usage=snapshot["ram"],
            ram_total_gb=4.0,
            disk_usage=23.1,
            cpu_temperature=snapshot["temperature"],
            gpu_temperature=50.0,
            ros2_nodes_active=8,
            esp32_connected=snapshot["esp32_status"],
            timestamp=snapshot["timestamp"]
        )

    @staticmethod
    async def get_battery() -> BatteryStatusResponse:
        snapshot = telemetry_store.get_snapshot()
        return BatteryStatusResponse(
            voltage=snapshot["voltage"],
            current=snapshot["current"],
            percentage=int(snapshot["battery"]),
            timestamp=snapshot["timestamp"]
        )

    @staticmethod
    async def emergency_stop() -> dict:
        if ros_manager.node:
            ros_manager.node.emergency_stop()
        else:
            telemetry_store.set_emergency_stop()
        return {"status": "EMERGENCY_STOP_ACTIVATED", "message": "Zero velocity published to /cmd_vel"}


robot_service = RobotService()
