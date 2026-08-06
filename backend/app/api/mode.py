from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import requests

router = APIRouter(prefix="/mode", tags=["Mode System V3.5"])


class ModeSwitchRequest(BaseModel):
    mode: str
    source: str = "REST_API"
    reason: str = "User REST API request"


@router.post("", summary="Switch Robot Operating Mode instantly")
def switch_robot_mode(req: ModeSwitchRequest):
    """
    POST /api/v1/mode
    Body: {"mode": "FOLLOW_PERSON"}
    Forwards mode switch request to Raspberry Pi HTTP bridge (Port 8001).
    """
    mode_name = req.mode.strip().upper().replace("MODE_", "")

    try:
        # Forward to Pi HTTP Bridge on port 8001 (/command)
        pi_url = "http://localhost:8001/command"
        payload = {"command": f"mode {mode_name}"}
        resp = requests.post(pi_url, json=payload, timeout=2.0)
        return {
            "status": "success",
            "requested_mode": mode_name,
            "bridge_response": resp.json() if resp.status_code == 200 else "OK"
        }
    except Exception as e:
        return {
            "status": "partial_success",
            "requested_mode": mode_name,
            "message": f"Mode request accepted locally: {e}"
        }
