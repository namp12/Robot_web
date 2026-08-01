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

            await websocket.send_json(payload)
            await asyncio.sleep(1.0)  # Stream at 1Hz rate without blocking loop
    except WebSocketDisconnect:
        logger.warning(f"⚠️ WebSocket Client Disconnected: {websocket.client}")
    except Exception as e:
        logger.error(f"Error in WebSocket stream: {e}")


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

