from fastapi import APIRouter, Depends
from app.ros.robot_status import telemetry_store
from app.ros.publishers import publishers_handler
from app.schemas.schemas import ControlCommandRequest, ModeSetRequest
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
    """POST /api/v1/robot/control - Publish movement speed command to /cmd_vel."""
    publishers_handler.publish_cmd_vel(cmd.linear, cmd.angular)
    return {"status": "SUCCESS", "linear_x": cmd.linear, "angular_z": cmd.angular}


@router.post("/emergency-stop")
async def emergency_stop(current_user: TokenData = Depends(get_current_user)):
    """POST /api/v1/robot/emergency-stop - Trigger E-STOP."""
    telemetry_store.set_emergency_stop()
    publishers_handler.emergency_stop()
    return {"status": "EMERGENCY_STOP_ACTIVATED"}


@router.post("/mode")
async def set_robot_mode(
    data: ModeSetRequest,
    current_user: TokenData = Depends(get_current_user)
):
    """POST /api/v1/robot/mode - Set operation mode (MANUAL/AUTO)."""
    telemetry_store.update_mode(data.mode)
    return {"status": "SUCCESS", "mode": data.mode}
