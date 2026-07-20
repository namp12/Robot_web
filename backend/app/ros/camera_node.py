import time
import logging
from typing import Generator
from app.ros.robot_status import telemetry_store

logger = logging.getLogger("ROS2CameraHandler")

try:
    import cv2
    import numpy as np
    OPENCV_AVAILABLE = True
except ImportError:
    OPENCV_AVAILABLE = False

try:
    from cv_bridge import CvBridge
    CV_BRIDGE_AVAILABLE = True
except ImportError:
    CV_BRIDGE_AVAILABLE = False


class CameraNodeHandler:
    """ROS2 Camera Image Streamer (Converts /camera/image_raw to MJPEG Stream for Web)."""

    def __init__(self):
        self._latest_frame_jpeg: bytes | None = None
        self._bridge = CvBridge() if CV_BRIDGE_AVAILABLE else None

    def handle_image_msg(self, msg):
        """Callback processing ROS2 sensor_msgs/msg/Image into JPEG bytes."""
        try:
            if CV_BRIDGE_AVAILABLE and self._bridge:
                cv_img = self._bridge.imgmsg_to_cv2(msg, desired_encoding="bgr8")
            elif OPENCV_AVAILABLE:
                # Raw numpy buffer extraction if cv_bridge not available
                cv_img = np.frombuffer(msg.data, dtype=np.uint8).reshape((msg.height, msg.width, 3))
            else:
                return

            # Encode CV2 matrix to JPEG bytes
            success, jpeg_buf = cv2.imencode('.jpg', cv_img, [int(cv2.IMWRITE_JPEG_QUALITY), 70])
            if success:
                self._latest_frame_jpeg = jpeg_buf.tobytes()
                telemetry_store.update_subsystems(camera=True)
        except Exception as e:
            logger.error(f"Error converting ROS2 image msg to JPEG: {e}")

    def generate_mjpeg_stream(self) -> Generator[bytes, None, None]:
        """Generator producing MJPEG multipart boundary stream for FastAPI StreamingResponse."""
        while True:
            if self._latest_frame_jpeg:
                frame = self._latest_frame_jpeg
            else:
                # Fallback synthetic frame with current timestamp
                frame = self._create_fallback_frame()

            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
            time.sleep(0.04)  # ~25 FPS

    def _create_fallback_frame(self) -> bytes:
        """Create synthetic placeholder frame if camera topic has no active frames yet."""
        if not OPENCV_AVAILABLE:
            return b''
        img = np.zeros((480, 640, 3), dtype=np.uint8)
        # Add subtle dark industrial background
        img[:] = (32, 17, 11)  # #0B1120 in BGR
        cv2.putText(img, "ROS2 CAMERA STREAM", (160, 220), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (235, 99, 37), 2)
        cv2.putText(img, f"Topic: /camera/image_raw [{time.strftime('%H:%M:%S')}]", (170, 260), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        _, jpeg = cv2.imencode('.jpg', img)
        return jpeg.tobytes()


camera_handler = CameraNodeHandler()
