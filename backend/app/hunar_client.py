import httpx
from .config import settings

HUNAR_BASE_URL = "https://api.voice.hunar.ai/external/v1"

async def create_hunar_agent(job_title: str, key_requirements: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{HUNAR_BASE_URL}/agents/",
            headers={"X-API-Key": settings.HUNAR_API_KEY},
            json={
                "name": f"Screener - {job_title}"[:64],
                "language": "ENGLISH",
                "voice_persona": "NEHA",
                "persona_name": "Riya",
                "objective": f"Screen candidates for the {job_title} role and assess fit.",
                "agent_prompt": (
                    "You are {persona_name}, a friendly and professional HR screening "
                    "assistant calling on behalf of the hiring team. You must strictly "
                    "speak ONLY in English throughout the entire conversation, even if the "
                    "candidate speaks in another language. You are screening "
                    "the candidate for the role: {job_title}. Key requirements: "
                    "{key_requirements}. Ask about: current role, relevant experience, "
                    "current CTC/salary expectation, notice period, and availability for "
                    "an interview. Be concise, warm, and respectful of the candidate's time."
                ),
                "introduction": (
                    "Hi {callee_name}, this is {persona_name} calling regarding your "
                    "application for the {job_title} position. Do you have 3-4 minutes?"
                ),
                "result_prompt": (
                    "From the conversation, extract the candidate's screening outcome."
                ),
                "result_schema": {
                    "interested": "boolean",
                    "relevant_experience_years": "string",
                    "current_ctc": "string",
                    "expected_ctc": "string",
                    "notice_period": "string",
                    "available_for_interview": "boolean",
                    "fit_summary": "string"
                }
            }
        )
        response.raise_for_status()
        return response.json()

async def trigger_call(
    agent_id: str,
    callee_name: str,
    mobile_number: str,
    job_title: str,
    key_requirements: str,
    request_id: str
) -> dict:
    payload = {
        "agent_id": agent_id,
        "callee_name": callee_name,
        "mobile_number": mobile_number,
        "custom_data": {
            "job_title": job_title,
            "key_requirements": key_requirements,
            "persona_name": "Riya"
        },
        "request_id": request_id,
    }
    
    if settings.PUBLIC_BACKEND_URL:
        webhook_url = f"{settings.PUBLIC_BACKEND_URL.rstrip('/')}/webhooks/hunar"
        payload["callback_config"] = {
            "call_status_callback_url": webhook_url,
            "call_recording_callback_url": webhook_url,
            "call_result_callback_url": webhook_url,
            "call_summary_callback_url": webhook_url,
        }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{HUNAR_BASE_URL}/calls/",
            headers={"X-API-Key": settings.HUNAR_API_KEY},
            json=payload
        )
        if not response.is_success:
            raise Exception(f"API Error {response.status_code}: {response.text}")
        return response.json()
