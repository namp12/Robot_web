import asyncio
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.ros.robot_status import telemetry_store

router = APIRouter()
logger = logging.getLogger("WebSocketServer")


@router.websocket("/ws")
@router.websocket("/ws/status")
async def websocket_endpoint(websocket: WebSocket):
    """Real-time WebSocket endpoint streaming ROS2 RAM cache JSON payload."""
    await websocket.accept()
    logger.info(f"🔌 WebSocket Client Connected: {websocket.client}")

    try:
        while True:
            snapshot = telemetry_store.get_snapshot()

            # Construct realtime JSON payload
            payload = {
                "scan": snapshot.get("scan", {}),
                "odom": snapshot.get("odom", {}),
                "map": snapshot.get("map", {}),
                "battery": snapshot.get("battery", 88.0),
                "voltage": snapshot.get("voltage", 24.2),
                "current": snapshot.get("current", 3.5),
                "status": "connected" if snapshot.get("connected") else "disconnected",
                # Include standard telemetry fields for React Dashboard compatibility
                "timestamp": snapshot.get("timestamp"),
                "robot_status": snapshot.get("robot_status", "ONLINE"),
                "mode": snapshot.get("mode", "MANUAL"),
                "cpu": snapshot.get("cpu", 34.5),
                "ram": snapshot.get("ram", 52.5),
                "temperature": snapshot.get("temperature", 48.5),
                "wifi_signal": snapshot.get("wifi_signal", 92),
                "pose": snapshot.get("pose", {"x": 2.45, "y": -1.12, "yaw": 45.0}),
                "goal": snapshot.get("goal", {"x": 5.2, "y": 1.8, "yaw": 0.0}),
                "camera_status": snapshot.get("camera_status", True),
                "lidar_status": snapshot.get("lidar_status", True),
                "esp32_status": snapshot.get("esp32_status", True),
                "front_distance": snapshot.get("front_distance", 0.0),
                "rear_distance": snapshot.get("rear_distance", 0.0),
                "imu": snapshot.get("imu", {"x": 0.0, "y": 0.0, "z": 0.0, "w": 1.0}),
                "imu_raw": snapshot.get("imu_raw", {
                    "accel": {"x": 0.0, "y": 0.0, "z": 0.0},
                    "gyro": {"x": 0.0, "y": 0.0, "z": 0.0}
                }),
                "roll": snapshot.get("roll", 0.0),
                "pitch": snapshot.get("pitch", 0.0),
                "yaw": snapshot.get("yaw", 0.0),
                "encoder_distance": snapshot.get("encoder_distance", 0.0),
                "encoders": snapshot.get("encoders", {"fl": 0.0, "fr": 0.0, "rl": 0.0, "rr": 0.0}),
                "ai_detections": snapshot.get("ai_detections", []),
                "horn": snapshot.get("horn", False),
            }

            # Check for incoming WebSocket control commands from Web Client
            try:
                data_text = await asyncio.wait_for(websocket.receive_text(), timeout=0.1)
                if data_text:
                    import json
                    msg = json.loads(data_text)
                    msg_type = msg.get("type")
                    if msg_type == "move":
                        cmd = msg.get("command", "STOP").upper()
                        raw_spd = max(0, min(255, int(msg.get("speed", 70))))
                        if cmd == "STOP" or raw_spd == 0:
                            pwm_val = 0
                            s = 0.0
                            speed = 0
                        else:
                            spd_pct = max(20, min(100, raw_spd if raw_spd <= 100 else int(raw_spd * 100 / 255)))
                            pwm_val = int(65 + (spd_pct - 20) * (255 - 65) / 80.0)
                            s = spd_pct / 100.0
                            speed = spd_pct

                        v_max = 1.0  # max linear speed (m/s)
                        w_max = 1.5  # max angular speed (rad/s)

                        linear_x = 0.0
                        linear_y = 0.0
                        angular_z = 0.0

                        if cmd == "FORWARD":
                            linear_x = v_max * s
                        elif cmd == "BACKWARD":
                            linear_x = -v_max * s
                        elif cmd == "STRAFE_LEFT":
                            linear_y = v_max * s
                        elif cmd == "STRAFE_RIGHT":
                            linear_y = -v_max * s
                        elif cmd == "DIAGONAL_FRONT_LEFT":
                            linear_x = v_max * s * 0.707
                            linear_y = v_max * s * 0.707
                        elif cmd == "DIAGONAL_FRONT_RIGHT":
                            linear_x = v_max * s * 0.707
                            linear_y = -v_max * s * 0.707
                        elif cmd == "DIAGONAL_REAR_LEFT":
                            linear_x = -v_max * s * 0.707
                            linear_y = v_max * s * 0.707
                        elif cmd == "DIAGONAL_REAR_RIGHT":
                            linear_x = -v_max * s * 0.707
                            linear_y = -v_max * s * 0.707
                        elif cmd == "ROTATE_LEFT":
                            angular_z = w_max * s
                        elif cmd == "ROTATE_RIGHT":
                            angular_z = -w_max * s

                        cmd_map = {
                            "FORWARD": f"tien {speed}",
                            "BACKWARD": f"lui {speed}",
                            "ROTATE_LEFT": f"xoay_trai {speed}",
                            "ROTATE_RIGHT": f"xoay_phai {speed}",
                            "STRAFE_LEFT": f"trai {speed}",
                            "STRAFE_RIGHT": f"phai {speed}",
                            "STOP": "dung"
                        }
                        text_cmd = cmd_map.get(cmd, f"{cmd} {speed}")
                        from app.ros.publishers import publishers_handler
                        publishers_handler.publish_cmd_vel(linear_x, linear_y, angular_z)
                        publishers_handler.publish_robot_move(text_cmd)
                        logger.info(f"⚡ [WS 0ms COMMAND] Action: '{cmd}' ({speed}%) -> Output: '{text_cmd}', Twist: ({linear_x}, {linear_y}, {angular_z})")
                    elif msg_type in ["speed", "speed_limit"]:
                        spd_val = max(20, min(100, int(msg.get("speed", 70))))
                        from app.ros.publishers import publishers_handler
                        publishers_handler.publish_robot_move(f"speed {spd_val}")
                        logger.info(f"⚡ [WS SPEED LIMIT] Published speed limit {spd_val}% to system")
            except asyncio.TimeoutError:
                pass
            except Exception as e:
                logger.error(f"WebSocket move error: {e}")

            await websocket.send_json(payload)
    except WebSocketDisconnect:
        logger.info(f"WebSocket client disconnected: {websocket.client}")
    except RuntimeError as e:
        logger.info(f"WebSocket closed before send: {e}")
    except Exception as e:
        logger.exception("Error in WebSocket stream")


class BlackBoxConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"🔌 BlackBox WebSocket Client Connected: {websocket.client}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"⚠️ BlackBox WebSocket Client Disconnected: {websocket.client}")

    async def broadcast_log(self, log_data: dict):
        if not self.active_connections:
            return
        
        # Broadcast the JSON payload to all connected clients
        tasks = []
        for connection in self.active_connections:
            tasks.append(connection.send_json(log_data))
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)


blackbox_manager = BlackBoxConnectionManager()


@router.websocket("/ws/blackbox")
async def blackbox_websocket_endpoint(websocket: WebSocket):
    """Real-time WebSocket endpoint broadcasting new BlackBox entries instantly."""
    await blackbox_manager.connect(websocket)
    try:
        while True:
            # Keep the socket open, read client heartbeats or dummy messages
            await websocket.receive_text()
    except WebSocketDisconnect:
        blackbox_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"Error in BlackBox WebSocket stream: {e}")
        blackbox_manager.disconnect(websocket)

