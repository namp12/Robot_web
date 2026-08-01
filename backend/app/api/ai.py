from fastapi import APIRouter
from app.schemas.schemas import AIChatRequest, AIChatResponse
from app.services.ai_service import ai_service

router = APIRouter(prefix="/ai", tags=["AI Copilot"])


@router.post("/chat", response_model=AIChatResponse)
async def ai_chat(request: AIChatRequest):
    return await ai_service.chat(request)


@router.post("/conversation")
async def save_conversation(data: dict):
    """Receive and save conversation logs directly from AI server."""
    prompt = data.get("prompt", "")
    reply = data.get("reply", "")
    mission_id = data.get("mission_id", 1)
    
    from app.database.nosql import nosql_db
    doc_id = nosql_db.insert_conversation(mission_id, prompt, reply)
    return {"status": "success", "doc_id": doc_id}


@router.post("/detection")
async def save_detection(data: dict):
    """Receive and save YOLO object detections directly from AI server."""
    detections = data.get("detections", [])
    mission_id = data.get("mission_id", 1)
    
    from app.ros.robot_status import telemetry_store
    from app.database.nosql import nosql_db
    
    # Update in-memory telemetry store cache for realtime WebSockets
    telemetry_store.update_ai_detections(detections)
    
    if detections:
        doc_id = nosql_db.insert_detection(mission_id, detections)
        return {"status": "success", "doc_id": doc_id}
    return {"status": "empty"}
