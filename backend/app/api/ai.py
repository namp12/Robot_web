from fastapi import APIRouter
from app.schemas.schemas import AIChatRequest, AIChatResponse
from app.services.ai_service import ai_service

router = APIRouter(prefix="/ai", tags=["AI Copilot"])


@router.post("/chat", response_model=AIChatResponse)
async def ai_chat(request: AIChatRequest):
    return await ai_service.chat(request)
