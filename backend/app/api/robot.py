import logging
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from app.ros.robot_status import telemetry_store
from app.ros.publishers import publishers_handler
from app.schemas.schemas import ControlCommandRequest, ModeSetRequest, HornSetRequest

logger = logging.getLogger("RobotAPI")

router = APIRouter(prefix="/robot", tags=["Robot Telemetry & Control"])


@router.get("/status")
async def get_robot_status():
    """GET /api/robot/status - Read connection status and active mode."""
    snap = telemetry_store.get_snapshot()
    return {
        "connection": "CONNECTED" if snap.get("connected") else "DISCONNECTED",
        "mode": snap.get("mode", "MANUAL")
    }


@router.get("/sensors")
async def get_robot_sensors():
    """GET /api/robot/sensors - Read latest sensor telemetry."""
    snap = telemetry_store.get_snapshot()
    return {
        "imu": snap.get("imu_raw", {
            "accel": {"x": 0.0, "y": 0.0, "z": 0.0},
            "gyro": {"x": 0.0, "y": 0.0, "z": 0.0}
        }),
        "encoder": snap.get("encoders", {"fl": 0.0, "fr": 0.0, "rl": 0.0, "rr": 0.0}),
        "distance": {
            "front": snap.get("front_distance", 0.0),
            "rear": snap.get("rear_distance", 0.0)
        },
        "battery": {
            "voltage": snap.get("voltage", 24.2),
            "current": snap.get("current", 3.5),
            "percentage": snap.get("battery", 88.0)
        }
    }


@router.get("/scan")
async def get_robot_scan():
    """GET /api/v1/robot/scan - Read latest /scan frame from RAM cache."""
    return telemetry_store.get_scan_cache()


@router.get("/odom")
async def get_robot_odom():
    """GET /api/v1/robot/odom - Read latest /odom frame from RAM cache."""
    return telemetry_store.get_odom_cache()


@router.get("/map")
async def get_robot_map():
    """GET /api/v1/robot/map - Read latest /map metadata from RAM cache."""
    return telemetry_store.get_map_cache()


@router.get("/tf")
async def get_robot_tf():
    """GET /api/v1/robot/tf - Read latest /tf frame transforms from RAM cache."""
    return telemetry_store.get_tf_cache()


@router.post("/move")
async def send_control_command(
    cmd: ControlCommandRequest
):
    """POST /api/robot/move - Publish movement command to /cmd_vel and /esp32/serial_tx."""
    # 2. Validate Command
    VALID_COMMANDS = {
        "FORWARD", "BACKWARD", "STRAFE_LEFT", "STRAFE_RIGHT",
        "DIAGONAL_FRONT_LEFT", "DIAGONAL_FRONT_RIGHT",
        "DIAGONAL_REAR_LEFT", "DIAGONAL_REAR_RIGHT",
        "ROTATE_LEFT", "ROTATE_RIGHT", "STOP"
    }
    command = cmd.command.upper()
    if command not in VALID_COMMANDS:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=f"Invalid control command: {cmd.command}")

    # 3. Handle Speed Conversion
    speed = max(0, min(255, cmd.speed))
    if speed <= 100:
        s = speed / 100.0
        pwm_val = int(s * 255)
    else:
        s = speed / 255.0
        pwm_val = int(speed)

    v_max = 1.0  # max linear speed (m/s)
    w_max = 1.5  # max angular speed (rad/s)

    linear_x = 0.0
    linear_y = 0.0
    angular_z = 0.0

    if command == "FORWARD":
        linear_x = v_max * s
    elif command == "BACKWARD":
        linear_x = -v_max * s
    elif command == "STRAFE_LEFT":
        linear_y = v_max * s
    elif command == "STRAFE_RIGHT":
        linear_y = -v_max * s
    elif command == "DIAGONAL_FRONT_LEFT":
        linear_x = v_max * s * 0.707
        linear_y = v_max * s * 0.707
    elif command == "DIAGONAL_FRONT_RIGHT":
        linear_x = v_max * s * 0.707
        linear_y = -v_max * s * 0.707
    elif command == "DIAGONAL_REAR_LEFT":
        linear_x = -v_max * s * 0.707
        linear_y = v_max * s * 0.707
    elif command == "DIAGONAL_REAR_RIGHT":
        linear_x = -v_max * s * 0.707
        linear_y = -v_max * s * 0.707
    elif command == "ROTATE_LEFT":
        angular_z = w_max * s
    elif command == "ROTATE_RIGHT":
        angular_z = -w_max * s

    # 4. Publish standard Twist to /cmd_vel
    publishers_handler.publish_cmd_vel(linear_x, linear_y, angular_z)

    # 5. Format standardized ESP32 command string: "COMMAND SPEED"
    cmd_map = {
        "FORWARD": f"tien {pwm_val}",
        "BACKWARD": f"lui {pwm_val}",
        "ROTATE_LEFT": f"xoay_trai {pwm_val}",
        "ROTATE_RIGHT": f"xoay_phai {pwm_val}",
        "STRAFE_LEFT": f"trai {pwm_val}",
        "STRAFE_RIGHT": f"phai {pwm_val}",
        "STOP": "dung"
    }
    text_cmd = cmd_map.get(command, f"{command} {pwm_val}")
    logger.info(f"🕹️ [WEB COMMAND RECEIVED] Action: '{command}' (speed {speed}%) -> Output: '{text_cmd}'")
    publishers_handler.publish_robot_move(text_cmd)

    return {
        "status": "SUCCESS",
        "command": command,
        "speed": speed,
        "twist": {
            "linear_x": linear_x,
            "linear_y": linear_y,
            "angular_z": angular_z
        },
        "esp32_command": text_cmd
    }


@router.post("/emergency-stop")
async def emergency_stop():
    """POST /api/v1/robot/emergency-stop - Trigger E-STOP."""
    telemetry_store.set_emergency_stop()
    publishers_handler.emergency_stop()
    # Also notify ESP32 to STOP immediately
    publishers_handler.publish_robot_move("dung")
    return {"status": "EMERGENCY_STOP_ACTIVATED"}


@router.post("/mode")
async def set_robot_mode(
    data: ModeSetRequest
):
    """POST /api/robot/mode - Set operation mode (MANUAL/AUTO/ROS)."""
    mode = data.mode.upper()
    if mode not in ["MANUAL", "AUTO", "ROS"]:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=f"Invalid operation mode: {data.mode}")
    telemetry_store.update_mode(mode)
    # Publish to ROS2 /robot/mode_cmd
    publishers_handler.publish_mode_cmd(mode)
    return {"status": "SUCCESS", "mode": mode}


@router.post("/horn")
async def set_robot_horn(
    data: HornSetRequest
):
    """POST /api/v1/robot/horn - Trigger horn (còi) on/off."""
    cmd_str = "coi 1" if data.state else "coi 0"
    publishers_handler.publish_robot_move(cmd_str)
    telemetry_store.update_horn(data.state)
    return {"status": "SUCCESS", "horn": data.state, "esp32_command": cmd_str}


from pydantic import BaseModel
from app.services.tts_service import tts_service

class SpeakRequest(BaseModel):
    text: str

@router.post("/speak")
async def speak_text(data: SpeakRequest):
    """POST /api/robot/speak - Speak natural text out loud via TTS."""
    success = tts_service.speak(data.text)
    return {"status": "SUCCESS" if success else "FAILED", "text": data.text}


class DetectionsRequest(BaseModel):
    detections: List[Dict[str, Any]]

@router.post("/detections")
async def update_detections(data: DetectionsRequest):
    """POST /api/v1/robot/detections - Update AI vision detections list on Web Dashboard."""
    telemetry_store.update_ai_detections(data.detections)
    return {"status": "SUCCESS", "count": len(data.detections)}


class ConversationRequest(BaseModel):
    prompt: str
    reply: str

@router.post("/conversation")
async def record_conversation(data: ConversationRequest):
    """POST /api/v1/robot/conversation - Save voice STT & LLM conversation log into database."""
    from app.services.ai_service import ai_service
    log_entry = await ai_service.log_conversation(data.prompt, data.reply)
    return {"status": "SUCCESS", "log": log_entry}
