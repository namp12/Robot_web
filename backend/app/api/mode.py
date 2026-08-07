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
    from app.ros.robot_status import telemetry_store
    telemetry_store.update_mode(mode_name)

    try:
        import os
        pi_ip = os.getenv("PI_IP", "10.68.9.203")
        target_urls = ["http://localhost:8001/command", f"http://{pi_ip}:8001/command"]
        payload = {"text": f"mode {mode_name}", "command": f"mode {mode_name}"}
        resp_json = "OK"
        for url in target_urls:
            try:
                resp = requests.post(url, json=payload, timeout=1.0)
                if resp.status_code == 200:
                    resp_json = resp.json()
                    break
            except Exception:
                continue

        return {
            "status": "success",
            "requested_mode": mode_name,
            "bridge_response": resp_json
        }
    except Exception as e:
        return {
            "status": "partial_success",
            "requested_mode": mode_name,
            "message": f"Mode request accepted locally: {e}"
        }
