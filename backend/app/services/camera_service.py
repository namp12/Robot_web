from app.schemas.schemas import CameraStatusResponse


class CameraService:
    @staticmethod
    async def get_status() -> CameraStatusResponse:
        return CameraStatusResponse()

    @staticmethod
    async def start_stream() -> dict:
        return {"status": "STREAM_STARTED", "device": "/dev/video0"}

    @staticmethod
    async def stop_stream() -> dict:
        return {"status": "STREAM_STOPPED"}

    @staticmethod
    async def capture_image() -> dict:
        return {"status": "CAPTURED", "image_path": "/robot_data/images/capture_001.jpg"}


camera_service = CameraService()
