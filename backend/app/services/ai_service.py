import httpx
import logging
from app.schemas.schemas import AIChatRequest, AIChatResponse
from app.database.nosql import nosql_db
from app.config.settings import settings

logger = logging.getLogger("AIService")


class AIService:
    @staticmethod
    async def chat(request: AIChatRequest) -> AIChatResponse:
        question = request.question.strip()
        answer = ""

        # 1. Try querying Ollama LLM (Qwen 2.5:3b) on Windows
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                ollama_url = "http://localhost:11434/api/generate"
                payload = {
                    "model": "qwen2.5:3b",
                    "prompt": f"Bạn là Kim Qui, trợ lý AI thông minh của Robot Giao Hàng. Hãy trả lời ngắn gọn, thân thiện bằng tiếng Việt (1-2 câu): {question}",
                    "stream": False
                }
                res = await client.post(ollama_url, json=payload)
                if res.status_code == 200:
                    answer = res.json().get("response", "").strip()
        except Exception as err:
            logger.warning(f"Ollama LLM error: {err}")

        # Fallback intelligent answer if Ollama offline
        if not answer:
            answer = f"Dạ, Kim Qui đã nhận câu hỏi: '{question}'. Hệ thống Robot Giao Hàng đang hoạt động bình thường!"

        # 2. Speak answer out loud via Raspberry Pi Speaker (Port 8001 /tts)
        try:
            pi_ip = getattr(settings, 'PI_IP', '192.168.61.135')
            tts_url = f"http://{pi_ip}:8001/tts"
            async with httpx.AsyncClient(timeout=2.0) as client:
                await client.post(tts_url, json={"text": answer})
        except Exception as err:
            logger.warning(f"Could not send TTS to Pi Speaker: {err}")

        # 3. Save conversation log in TinyDB NoSQL Database
        try:
            nosql_db.insert_conversation(1, question, answer)
        except Exception as err:
            logger.error(f"Error saving conversation to NoSQL: {err}")

        return AIChatResponse(
            question=question,
            answer=answer
        )


ai_service = AIService()
