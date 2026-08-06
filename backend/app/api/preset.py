from fastapi import APIRouter
from pydantic import BaseModel
import requests

router = APIRouter(prefix="/preset", tags=["Quick Preset System V1"])


class PresetSwitchRequest(BaseModel):
    preset: int
    source: str = "REST_API"


@router.post("", summary="Switch Robot Operating Mode via Preset Number (1-14)")
def switch_preset(req: PresetSwitchRequest):
    """
    POST /api/v1/preset
    Body: {"preset": 2}
    Maps Preset 1-14 to corresponding RobotMode and forwards request to Pi HTTP Bridge.
    """
    preset_id = req.preset

    # Map Preset 1-14 to mode name
    preset_mode_map = {
        1: "FOLLOW_PERSON",
        2: "AUTO_EXPLORE",
        3: "MANUAL",
        4: "SAFE_MANUAL",
        5: "GO_TO_GOAL",
        6: "PATROL",
        7: "DELIVERY",
        8: "RETURN_HOME",
        9: "INSPECTION",
        10: "VOICE_ASSISTANT",
        11: "FOLLOW_TARGET",
        12: "DOCKING",
        13: "SIMULATION",
        14: "EMERGENCY_STOP"
    }

    target_mode = preset_mode_map.get(preset_id, "MANUAL")
    from app.ros.robot_status import telemetry_store
    telemetry_store.update_mode(target_mode)

    try:
        import os
        pi_ip = os.getenv("PI_IP", "192.168.61.135")
        target_urls = ["http://localhost:8001/command", f"http://{pi_ip}:8001/command"]
        payload = {"text": f"mode {target_mode}", "command": f"mode {target_mode}"}
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
            "preset_id": preset_id,
            "mapped_mode": target_mode,
            "bridge_response": resp_json
        }
    except Exception as e:
        return {
            "status": "partial_success",
            "preset_id": preset_id,
            "mapped_mode": target_mode,
            "message": f"Preset request accepted locally: {e}"
        }
