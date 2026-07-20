from fastapi import APIRouter
from app.schemas.schemas import CameraStatusResponse
from app.services.camera_service import camera_service

router = APIRouter(prefix="/camera", tags=["Camera"])


@router.get("/status", response_model=CameraStatusResponse)
async def get_camera_status():
    return await camera_service.get_status()


@router.post("/start")
async def start_camera():
    return await camera_service.start_stream()


@router.post("/stop")
async def stop_camera():
    return await camera_service.stop_stream()


@router.post("/capture")
async def capture_image():
    return await camera_service.capture_image()
