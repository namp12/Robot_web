import logging

logger = logging.getLogger("ROS2Publishers")

try:
    from geometry_msgs.msg import Twist
    from std_msgs.msg import String, Bool
    RCLPY_AVAILABLE = True
except ImportError:
    RCLPY_AVAILABLE = False


class TopicPublishersHandler:
    """Handler for ROS2 Publishers (/cmd_vel, /camera/control, /slam/control, /robot/move, /robot/mode_cmd)."""

    def __init__(self, node=None):
        self.node = node
        self.cmd_vel_pub = None
        self.camera_ctrl_pub = None
        self.slam_ctrl_pub = None
        self.esp32_serial_tx_pub = None
        self.mode_cmd_pub = None
        self._ws_client = None

        if RCLPY_AVAILABLE and self.node:
            self.cmd_vel_pub = self.node.create_publisher(Twist, "/cmd_vel", 10)
            self.camera_ctrl_pub = self.node.create_publisher(String, "/camera/control", 10)
            self.slam_ctrl_pub = self.node.create_publisher(String, "/slam/control", 10)
            self.esp32_serial_tx_pub = self.node.create_publisher(String, "/esp32/serial_tx", 10)
            self.robot_move_pub = self.node.create_publisher(String, "/robot/move", 10)
            self.mode_cmd_pub = self.node.create_publisher(String, "/robot/mode_cmd", 10)

    def set_ws_client(self, ws):
        """Set a remote WebSocket client connection to forward commands to."""
        self._ws_client = ws
        if ws:
            logger.info("🔌 [Publishers] Remote WebSocket client registered for command forwarding.")
        else:
            logger.info("🔌 [Publishers] Remote WebSocket client cleared.")

    def publish_robot_move(self, text: str):
        # 1. Bắn HTTP POST trực tiếp tới Raspberry Pi Cổng 8001 (Đảm bảo 100% nhận lệnh)
        def _send_http():
            import os
            import requests
            env_pi = os.getenv("PI_IP", "192.168.61.135")
            candidates = [env_pi, "192.168.61.135", "192.168.60.157", "127.0.0.1", "localhost"]
            seen = set()
            hosts = [h for h in candidates if not (h in seen or seen.add(h))]
            for host in hosts:
                try:
                    res = requests.post(f"http://{host}:8001/command", json={"text": text}, timeout=0.5)
                    if res.status_code == 200:
                        break
                except Exception:
                    pass
        import threading
        threading.Thread(target=_send_http, daemon=True).start()

        # 2. Bắn song song tới WebSocket client nếu có (Cổng 8090)
        if self._ws_client:
            import json
            payload = {}
            if text == "dung":
                payload = {"type": "move", "direction": "dung", "speed": 0}
            elif text.startswith("coi"):
                payload = {"type": "beep"}
            else:
                parts = text.split()
                if len(parts) > 0:
                    direction = parts[0]
                    try:
                        speed = int(parts[1]) if len(parts) > 1 else 150
                    except ValueError:
                        speed = 150
                    payload = {"type": "move", "direction": direction, "speed": speed}
                else:
                    payload = {"type": "text", "data": text}

            self._send_ws_safe(payload)

        if RCLPY_AVAILABLE and self.esp32_serial_tx_pub:
            msg = String()
            msg.data = text
            self.esp32_serial_tx_pub.publish(msg)
            if hasattr(self, 'robot_move_pub') and self.robot_move_pub:
                self.robot_move_pub.publish(msg)

    def _send_ws_safe(self, payload_dict: dict):
        if not self._ws_client:
            return
        import json
        import asyncio
        msg_str = json.dumps(payload_dict)
        try:
            try:
                loop = asyncio.get_running_loop()
                loop.create_task(self._ws_client.send(msg_str))
            except RuntimeError:
                pass
        except Exception as e:
            logger.error(f"Failed to send WebSocket message: {e}")

    def publish_mode_cmd(self, mode: str):
        if self._ws_client:
            mode_map = {"MANUAL": "manual", "AUTO": "auto", "ROS": "ros2"}
            mapped_mode = mode_map.get(mode.upper(), "manual")
            self._send_ws_safe({"type": "mode", "mode": mapped_mode})
            return

        if not RCLPY_AVAILABLE or not self.mode_cmd_pub:
            logger.info(f"[Publishers Fallback] /robot/mode_cmd: '{mode}'")
            return
        msg = String()
        msg.data = mode
        self.mode_cmd_pub.publish(msg)

    def publish_cmd_vel(self, linear_x: float, linear_y: float, angular_z: float):
        if self._ws_client:
            self._send_ws_safe({
                "type": "cmd_vel",
                "linear_x": float(linear_x),
                "linear_y": float(linear_y),
                "angular_z": float(angular_z)
            })
            return

        if not RCLPY_AVAILABLE or not self.cmd_vel_pub:
            logger.info(f"[Publishers Fallback] CmdVel: linear_x={linear_x}, linear_y={linear_y}, angular_z={angular_z}")
            return
        msg = Twist()
        msg.linear.x = float(linear_x)
        msg.linear.y = float(linear_y)
        msg.angular.z = float(angular_z)
        self.cmd_vel_pub.publish(msg)

    def emergency_stop(self):
        self.publish_cmd_vel(0.0, 0.0, 0.0)
        logger.warning("🚨 [Publishers] Emergency stop /cmd_vel=0 published!")


publishers_handler = TopicPublishersHandler()

