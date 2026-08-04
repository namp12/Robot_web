import httpx
import logging
from app.schemas.schemas import AIChatRequest, AIChatResponse
from app.database.nosql import nosql_db
from app.config.settings import settings

logger = logging.getLogger("AIService")


class AIService:
    KNOWLEDGE_BASE = [
        (["bạn tên gì", "tên bạn là gì", "bạn tên là gì", "tên là gì", "cậu tên gì"], "Chào bạn, tôi tên là Kim Qui, được nhóm Galacticos phát triển, thuộc Khoa Công nghệ Thông tin, Đại học Đại Nam."),
        (["ai tạo ra", "ai làm ra", "tác giả", "thầy thơ", "đỗ quang thơ", "phương nam", "hoàng dương", "duy a", "duy văn"], "Tôi được sáng tạo bởi các sinh viên Khoa Công nghệ Thông tin, Trường Đại học Đại Nam, gồm: Nguyễn Thế Phương Nam, Nguyễn Hoàng Dương, Lê Duy A, Đỗ Duy Văn, dưới sự mentor của thầy Đỗ Quang Thơ.")
    ]

    @staticmethod
    async def chat(request: AIChatRequest) -> AIChatResponse:
        question = request.question.strip()
        question_lower = question.lower()
        answer = ""

        # Ưu tiên 1: Tra cứu Tri thức Exact Match (0ms)
        for keywords, kb_reply in AIService.KNOWLEDGE_BASE:
            if any(kw in question_lower for kw in keywords):
                answer = kb_reply
                logger.info(f"[AIService] Knowledge Base exact match for: '{question}'")
                break

        # Ưu tiên 2: Truy vấn ShopAIKey Cloud API (gpt-4o-mini)
        if not answer:
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    headers = {
                        "Authorization": f"Bearer {settings.SHOPAIKEY_API_KEY}",
                        "Content-Type": "application/json"
                    }
                    payload = {
                        "model": settings.SHOPAIKEY_MODEL,
                        "messages": [
                            {
                                "role": "system",
                                "content": (
                                    "Bạn tên là Kim Qui, một Trợ lý Robot AI cực kỳ thông minh, duyên dáng và hóm hỉnh. "
                                    "Bạn được sáng tạo bởi nhóm sinh viên Galacticos thuộc Khoa CNTT Trường Đại học Đại Nam, gồm: Nguyễn Thế Phương Nam, Nguyễn Hoàng Dương, Lê Duy A, Đỗ Duy Văn, dưới sự mentor của thầy Đỗ Quang Thơ. "
                                    "Trả lời ngắn gọn 1-2 câu tiếng Việt (dưới 30 từ), lịch sự, ngọt ngào, xưng Kim Qui."
                                )
                            },
                            {"role": "user", "content": question}
                        ],
                        "temperature": 0.5,
                        "max_tokens": 150
                    }
                    res = await client.post(f"{settings.SHOPAIKEY_BASE_URL}/chat/completions", headers=headers, json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        answer = data["choices"][0]["message"]["content"].strip()
                        logger.info(f"[AIService] ShopAIKey Cloud API ({settings.SHOPAIKEY_MODEL}) success: '{answer}'")
            except Exception as err:
                logger.warning(f"[AIService] ShopAIKey Cloud API error: {err}")

        # Ưu tiên 3: Ollama Local (Fallback)
        if not answer:
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    ollama_url = "http://localhost:11434/api/generate"
                    payload = {
                        "model": "qwen2.5:3b",
                        "prompt": f"Bạn tên là Kim Qui. Trả lời ngắn gọn 1 câu bằng tiếng Việt: {question}",
                        "stream": False
                    }
                    res = await client.post(ollama_url, json=payload)
                    if res.status_code == 200:
                        answer = res.json().get("response", "").strip()
            except Exception as err:
                logger.warning(f"[AIService] Ollama LLM error: {err}")

        if not answer:
            answer = f"Dạ, Kim Qui đã nhận câu hỏi: '{question}'. Kim Qui luôn sẵn sàng đồng hành cùng bạn nè!"

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
