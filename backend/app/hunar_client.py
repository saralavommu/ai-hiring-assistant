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
                    "candidate speaks in another language. You are screening the candidate "
                    "for the role: {job_title}. Key requirements: {key_requirements}. "
                    
                    "Follow the screening flow strictly and ask only ONE question at a time. "
                    "Never combine multiple questions in a single turn. Wait for the "
                    "candidate's answer before asking the next question. "
                    
                    "Follow this exact order: "
                    "1. Ask about the candidate's current role and relevant experience. "
                    "2. After the candidate answers, ask for their current CTC/salary. "
                    "3. After receiving the current CTC, ask for their expected CTC/salary. "
                    "4. After receiving the expected CTC, ask for their notice period. "
                    "5. After receiving the notice period, ask whether they are available "
                    "for an interview if shortlisted. "
                    
                    "Use natural and conversational wording for each question. For example: "
                    "'Could you tell me about your current role and relevant experience?' "
                    "'Could you please share your current CTC or salary?' "
                    "'What are your expected CTC or salary expectations?' "
                    "'What is your notice period?' "
                    "'Would you be available for an interview if shortlisted?' "
                    
                    "IMPORTANT: Ask only the question corresponding to the current step. "
                    "Do not ask current CTC, expected CTC, notice period, and interview "
                    "availability together or in the same sentence. "
                    
                    "IMPORTANT: Keep track of all information the candidate has already "
                    "provided. If the candidate has already answered a question or provided "
                    "the required information without being directly asked, consider that "
                    "information collected and move to the next unanswered step. "
                    "NEVER ask the same question again when the candidate has already "
                    "provided a clear answer. Only ask again if the previous answer was "
                    "unclear, incomplete, or unintelligible. "
                    
                    "For example, if the candidate says 'My current CTC is 3.6 LPA and I "
                    "expect 6 LPA', record both values and do not ask for either CTC again. "
                    "Move directly to the notice period question. Similarly, if the "
                    "candidate has already stated their notice period or interview "
                    "availability, do not ask for it again. "
                    
                    "Once all required information has been collected, do not restart the "
                    "screening or repeat any questions. Thank the candidate politely and "
                    "end the call. "
                    
                    "Be concise, warm, professional, and respectful of the candidate's time."
                ),
                "introduction": (
                    "Hi {callee_name}, this is {persona_name} calling regarding your "
                    "application for the {job_title} position. Do you have 3-4 minutes "
                    "for a quick screening?"
                ),
                "result_prompt": (
                    "From the conversation, extract the candidate's screening outcome. "
                    "Use only information explicitly provided by the candidate. "
                    "Do not infer, assume, or invent information. "
                    "If the candidate provided a value earlier in the conversation, use "
                    "that value and do not treat the field as missing. "
                    "If a field was not provided, leave it empty or false as appropriate. "
                    "The extracted information must reflect the final answers given by "
                    "the candidate."
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
