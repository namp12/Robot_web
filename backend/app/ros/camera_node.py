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


class CameraNodeHandler:
    """ROS2 Camera Image Streamer (Converts /camera/image_raw into MJPEG Stream)."""

    def __init__(self):
        self._latest_frame_jpeg: bytes | None = None
        self._last_msg_time: float = 0

    def handle_image_msg(self, msg):
        """Callback processing ROS2 sensor_msgs/msg/Image into JPEG bytes."""
        try:
            if OPENCV_AVAILABLE:
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

                    success, jpeg_buf = cv2.imencode('.jpg', cv_img, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
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
                frame = self._create_bright_test_pattern()

            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
            time.sleep(0.04)  # ~25 FPS

    def _create_bright_test_pattern(self) -> bytes:
        """Create a high-visibility, high-contrast SpaceX industrial test card with color bars and live clock."""
        if not OPENCV_AVAILABLE:
            # Fallback tiny JPEG if OpenCV is missing
            return b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00\xff\xd9'

        img = np.zeros((480, 640, 3), dtype=np.uint8)

        # Deep Royal Blue background (#1E3A8A)
        img[:] = (138, 58, 30)

        # Draw Grid lines
        for x in range(0, 640, 40):
            cv2.line(img, (x, 0), (x, 480), (160, 80, 45), 1)
        for y in range(0, 480, 40):
            cv2.line(img, (0, y), (640, y), (160, 80, 45), 1)

        # Outer Frame
        cv2.rectangle(img, (15, 15), (625, 465), (255, 255, 255), 2)
        cv2.rectangle(img, (20, 20), (620, 460), (235, 99, 37), 2)

        # Main Header Text
        cv2.putText(img, "ROS2 CAMERA STREAM STANDBY", (85, 150), cv2.FONT_HERSHEY_SIMPLEX, 0.85, (255, 255, 255), 2)
        cv2.putText(img, "Topic: /camera/image_raw", (185, 195), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 215, 0), 2)

        # Ticking Live Clock & Animated Dot
        timestamp = time.strftime("%H:%M:%S")
        cv2.putText(img, f"STREAM ACTIVE [{timestamp}]", (160, 250), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)

        # Red Live Pulse Circle
        pulse = int((time.time() * 10) % 20) + 5
        cv2.circle(img, (135, 245), pulse, (0, 0, 255), 2)
        cv2.circle(img, (135, 245), 5, (0, 0, 255), -1)

        # Subtitle
        cv2.putText(img, "Waiting for Raspberry Pi Camera Node...", (125, 300), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (200, 200, 200), 1)

        # Color Bars at Bottom
        colors = [
            (255, 255, 255), # White
            (0, 255, 255),   # Yellow
            (255, 255, 0),   # Cyan
            (0, 255, 0),     # Green
            (255, 0, 255),   # Magenta
            (0, 0, 255),     # Red
            (255, 0, 0)      # Blue
        ]
        bar_w = 580 // len(colors)
        for i, col in enumerate(colors):
            x1 = 30 + i * bar_w
            x2 = x1 + bar_w
            cv2.rectangle(img, (x1, 350), (x2, 430), col, -1)

        _, jpeg = cv2.imencode('.jpg', img, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
        return jpeg.tobytes()


camera_handler = CameraNodeHandler()
