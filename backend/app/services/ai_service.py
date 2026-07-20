from app.schemas.schemas import AIChatRequest, AIChatResponse


class AIService:
    @staticmethod
    async def chat(request: AIChatRequest) -> AIChatResponse:
        return AIChatResponse(
            question=request.question,
            answer=f"Robot Explorer AI Copilot received command: '{request.question}'. All sub-systems operational."
        )


ai_service = AIService()
