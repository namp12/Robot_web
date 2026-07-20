from fastapi import APIRouter
from app.schemas.schemas import RobotStatusResponse, SystemResourceResponse, BatteryStatusResponse, ControlCommandRequest, ModeSetRequest
from app.services.robot_service import robot_service

router = APIRouter(prefix="/robot", tags=["Robot"])


@router.get("/status", response_model=RobotStatusResponse)
async def get_robot_status():
    return await robot_service.get_status()


@router.get("/system", response_model=SystemResourceResponse)
async def get_system_resource():
    return await robot_service.get_system_resource()


@router.get("/battery", response_model=BatteryStatusResponse)
async def get_battery_status():
    return await robot_service.get_battery()


@router.post("/emergency-stop")
async def emergency_stop():
    return await robot_service.emergency_stop()


@router.post("/control")
async def control_robot(cmd: ControlCommandRequest):
    return {"status": "COMMAND_RECEIVED", "linear": cmd.linear, "angular": cmd.angular}


@router.post("/mode")
async def set_robot_mode(data: ModeSetRequest):
    return {"status": "MODE_UPDATED", "mode": data.mode}
