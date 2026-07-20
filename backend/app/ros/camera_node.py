import time
import logging
import io
from typing import Generator
from app.ros.robot_status import telemetry_store

logger = logging.getLogger("ROS2CameraHandler")

try:
    import cv2
    import numpy as np
    OPENCV_AVAILABLE = True
except ImportError:
    OPENCV_AVAILABLE = False

# A tiny valid pre-encoded JPEG standby frame (640x480 dark industrial card)
STANDBY_JPEG_BYTES = (
    b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00\xff\xdb\x00C\x00\x08\x06\x06'
    b'\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f'
    b'\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82<.342\xff\xc0\x00\x0b\x08\x00\x01\x00\x01'
    b'\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00'
    b'\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xbf\x00\xff\xd9'
)


class CameraNodeHandler:
    """ROS2 Camera Image Streamer (Converts /camera/image_raw into MJPEG Stream)."""

    def __init__(self):
        self._latest_frame_jpeg: bytes | None = None
        self._last_msg_time: float = 0

    def handle_image_msg(self, msg):
        """Callback processing ROS2 sensor_msgs/msg/Image into JPEG bytes."""
        try:
            if OPENCV_AVAILABLE:
                # Convert raw image bytes to numpy array
                if hasattr(msg, 'data'):
                    frame_data = np.frombuffer(msg.data, dtype=np.uint8)
                    height = getattr(msg, 'height', 480)
                    width = getattr(msg, 'width', 640)
                    encoding = getattr(msg, 'encoding', 'bgr8')

                    if 'bgr' in encoding.lower() or 'rgb' in encoding.lower():
                        cv_img = frame_data.reshape((height, width, 3))
                        if 'rgb' in encoding.lower():
                            cv_img = cv2.cvtColor(cv_img, cv2.COLOR_RGB2BGR)
                    elif 'mono' in encoding.lower() or '8uc1' in encoding.lower():
                        cv_img = frame_data.reshape((height, width))
                        cv_img = cv2.cvtColor(cv_img, cv2.COLOR_GRAY2BGR)
                    else:
                        cv_img = frame_data.reshape((height, width, 3))

                    success, jpeg_buf = cv2.imencode('.jpg', cv_img, [int(cv2.IMWRITE_JPEG_QUALITY), 75])
                    if success:
                        self._latest_frame_jpeg = jpeg_buf.tobytes()
                        self._last_msg_time = time.time()
                        telemetry_store.update_subsystems(camera=True)
        except Exception as e:
            logger.error(f"Error processing ROS2 image frame: {e}")

    def generate_mjpeg_stream(self) -> Generator[bytes, None, None]:
        """Generator producing MJPEG stream for Web Browser."""
        while True:
            # Check if frame is fresh (received in last 3 seconds)
            if self._latest_frame_jpeg and (time.time() - self._last_msg_time < 3.0):
                frame = self._latest_frame_jpeg
            else:
                frame = self._create_standby_frame()

            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
            time.sleep(0.04)  # ~25 FPS

    def _create_standby_frame(self) -> bytes:
        """Create high-visibility dark industrial test card when camera topic is standby."""
        if OPENCV_AVAILABLE:
            img = np.zeros((480, 640, 3), dtype=np.uint8)
            img[:] = (32, 17, 11)  # #0B1120 Dark Slate Navy

            # Draw outer frame
            cv2.rectangle(img, (20, 20), (620, 460), (59, 41, 30), 2)
            cv2.rectangle(img, (24, 24), (616, 456), (235, 99, 37), 1)

            # Draw status text
            timestamp = time.strftime("%H:%M:%S")
            cv2.putText(img, "ROS2 CAMERA STREAM", (160, 200), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (235, 99, 37), 2)
            cv2.putText(img, "Topic: /camera/image_raw", (185, 240), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1)
            cv2.putText(img, f"Status: WAITING FOR ROS2 FRAME [{timestamp}]", (135, 280), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (160, 160, 160), 1)

            # Draw animated radar pulse indicator
            pulse_radius = int((time.time() * 20) % 30) + 5
            cv2.circle(img, (320, 340), pulse_radius, (235, 99, 37), 1)
            cv2.circle(img, (320, 340), 3, (235, 99, 37), -1)

            _, jpeg = cv2.imencode('.jpg', img)
            return jpeg.tobytes()
        return STANDBY_JPEG_BYTES


camera_handler = CameraNodeHandler()
