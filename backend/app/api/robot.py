from fastapi import APIRouter, Depends
from app.ros.robot_status import telemetry_store
from app.ros.publishers import publishers_handler
from app.schemas.schemas import ControlCommandRequest, ModeSetRequest, HornSetRequest
from app.utils.auth import get_current_user, TokenData

router = APIRouter(prefix="/robot", tags=["Robot Telemetry & Control"])


@router.get("/status")
async def get_robot_status():
    """GET /api/v1/robot/status - Read status snapshot from RAM cache."""
    return telemetry_store.get_snapshot()


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


@router.post("/control")
async def send_control_command(
    cmd: ControlCommandRequest,
    current_user: TokenData = Depends(get_current_user)
):
    """POST /api/v1/robot/control - Publish movement command to /cmd_vel and /esp32/serial_tx."""
    # 1. Enforce Mode Manager Restrictions
    current_mode = telemetry_store.get_snapshot().get("mode", "MANUAL")
    if current_mode == "ROS":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Manual control blocked: Robot is in ROS mode")
    elif current_mode == "AUTO":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Manual control blocked: Robot is in AUTO mode")

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
    speed = max(0, min(100, cmd.speed))
    s = speed / 100.0
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

    # 5. Translate and publish to custom /esp32/serial_tx topic
    pwm_val = int(s * 255)
    text_cmd = f"{command} {pwm_val}"
    publishers_handler.publish_esp32_serial_tx(text_cmd)

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
async def emergency_stop(current_user: TokenData = Depends(get_current_user)):
    """POST /api/v1/robot/emergency-stop - Trigger E-STOP."""
    telemetry_store.set_emergency_stop()
    publishers_handler.emergency_stop()
    # Also notify ESP32 to STOP immediately
    publishers_handler.publish_esp32_serial_tx("STOP 0")
    return {"status": "EMERGENCY_STOP_ACTIVATED"}


@router.post("/mode")
async def set_robot_mode(
    data: ModeSetRequest,
    current_user: TokenData = Depends(get_current_user)
):
    """POST /api/v1/robot/mode - Set operation mode (MANUAL/AUTO/ROS)."""
    mode = data.mode.upper()
    if mode not in ["MANUAL", "AUTO", "ROS"]:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=f"Invalid operation mode: {data.mode}")
    telemetry_store.update_mode(mode)
    return {"status": "SUCCESS", "mode": mode}


@router.post("/horn")
async def set_robot_horn(
    data: HornSetRequest,
    current_user: TokenData = Depends(get_current_user)
):
    """POST /api/v1/robot/horn - Trigger horn (còi) on/off."""
    cmd_str = "coi 1" if data.state else "coi 0"
    publishers_handler.publish_esp32_serial_tx(cmd_str)
    telemetry_store.update_horn(data.state)
    return {"status": "SUCCESS", "horn": data.state, "esp32_command": cmd_str}
