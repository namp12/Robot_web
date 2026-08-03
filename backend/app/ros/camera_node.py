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
    """ROS2 Camera Image Streamer (Converts /camera/image_raw or YOLO AI Port 5050 into MJPEG Stream)."""

    def __init__(self):
        self._latest_frame_jpeg: bytes | None = None
        self._last_msg_time: float = 0
        self._latest_yolo_jpeg: bytes | None = None
        self._last_yolo_time: float = 0

        # Start persistent background reader thread for YOLO AI Stream (Port 5050)
        import threading
        threading.Thread(target=self._yolo_fetch_loop, daemon=True).start()

    def _yolo_fetch_loop(self):
        """Persistent background reader thread for YOLO AI Stream on port 5050 (0ms latency, zero connection overhead)."""
        import urllib.request
        while True:
            try:
                req = urllib.request.urlopen("http://localhost:5050/video_feed", timeout=2.0)
                buffer = b''
                while True:
                    chunk = req.read(4096)
                    if not chunk:
                        break
                    buffer += chunk
                    a = buffer.find(b'\xff\xd8')
                    b = buffer.find(b'\xff\xd9', a) if a != -1 else -1
                    if a != -1 and b != -1 and b > a:
                        jpeg_frame = buffer[a:b+2]
                        buffer = buffer[b+2:]
                        self._latest_yolo_jpeg = jpeg_frame
                        self._last_yolo_time = time.time()
                    elif len(buffer) > 500000:
                        buffer = b''
            except Exception:
                time.sleep(0.5)

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
        """Generator producing MJPEG stream for Web Browser (Prioritizes YOLO AI Stream on Port 5050)."""
        import urllib.request
        from app.config.settings import settings

        while True:
            frame = None

            # 1. First priority: Fresh YOLO AI Stream from Port 5050 (has green bounding boxes & FPS)
            if self._latest_yolo_jpeg and (time.time() - self._last_yolo_time < 2.0):
                frame = self._latest_yolo_jpeg

            # 2. Second priority: ROS2 /camera/image_raw topic frame
            elif self._latest_frame_jpeg and (time.time() - self._last_msg_time < 3.0):
                frame = self._latest_frame_jpeg

            # 3. Third priority: Pi Direct Stream (Port 8080)
            else:
                pi_ip = getattr(settings, 'PI_IP', '192.168.61.135')
                for fallback_url in [f"http://{pi_ip}:8080/video_feed", "http://127.0.0.1:8080/video_feed"]:
                    try:
                        req = urllib.request.urlopen(fallback_url, timeout=0.8)
                        stream_bytes = b''
                        for _ in range(100):
                            chunk = req.read(2048)
                            if not chunk:
                                break
                            stream_bytes += chunk
                            a = stream_bytes.find(b'\xff\xd8')
                            b = stream_bytes.find(b'\xff\xd9', a) if a != -1 else -1
                            if a != -1 and b != -1 and b > a:
                                frame = stream_bytes[a:b+2]
                                try:
                                    req.close()
                                except Exception:
                                    pass
                                break
                        if frame:
                            break
                    except Exception:
                        continue

            if frame is None:
                frame = self._create_bright_test_pattern()

            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
            time.sleep(0.033)  # ~30 FPS

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
