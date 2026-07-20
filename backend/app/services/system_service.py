from app.schemas.schemas import SystemResourceResponse


class SystemService:
    @staticmethod
    async def get_system_info() -> SystemResourceResponse:
        return SystemResourceResponse()

    @staticmethod
    async def get_logs() -> list:
        return [
            {"timestamp": "2026-07-20 15:45:00", "node": "/robot_state_publisher", "level": "INFO", "message": "Node initialized"},
            {"timestamp": "2026-07-20 15:45:05", "node": "/rplidar_composition", "level": "INFO", "message": "LiDAR scan stream active @ 10Hz"},
        ]


system_service = SystemService()
