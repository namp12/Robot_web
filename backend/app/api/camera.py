from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.ros.camera_node import camera_handler

router = APIRouter(prefix="/camera", tags=["Camera Feed"])


@router.get("/stream")
async def video_feed():
    """Stream live MJPEG video feed from ROS2 /camera/image_raw to Web browser."""
    return StreamingResponse(
        camera_handler.generate_mjpeg_stream(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


@router.get("/status")
async def get_camera_status():
    """Get Camera sensor status."""
    return {"status": "ONLINE", "fps": 30, "resolution": "1080p"}
