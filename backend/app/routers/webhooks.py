import json
from fastapi import APIRouter, Depends, Request, HTTPException
from sqlmodel import Session, select
import datetime

from ..db import get_session
from ..config import settings
from ..webhook_verify import verify_hunar_webhook_signature
from ..models import CallRecord, utc_now

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

@router.post("/hunar")
async def hunar_webhook(request: Request, session: Session = Depends(get_session)):
    raw_body = await request.body()
    
    # 1. Verify signature
    is_valid = verify_hunar_webhook_signature(
        signature_header=request.headers.get("X-Hunar-Signature"),
        timestamp_header=request.headers.get("X-Hunar-Timestamp"),
        request_body=raw_body,
        trusted_api_keys=[settings.HUNAR_API_KEY],
    )
    
    if not is_valid:
        raise HTTPException(status_code=401, detail="Invalid signature")
        
    # 2. Parse payload
    payload = json.loads(raw_body)
    event_type = payload.get("event_type")
    call_id = payload.get("call_id")
    
    if not call_id:
        return {"ok": True} # Ignore invalid payloads
        
    # 3. Find record
    call_record = session.exec(select(CallRecord).where(CallRecord.hunar_call_id == call_id)).first()
    
    if not call_record:
        # Idempotent return since we might get webhooks for calls we don't know about or haven't saved yet
        return {"ok": True}
        
    # 4. Update according to event type
    if event_type == "call_status_updated":
        call_record.status = payload.get("status", call_record.status)
        call_record.lifecycle_status = payload.get("lifecycle_status", call_record.lifecycle_status)
        call_record.duration_minutes = payload.get("duration_minutes", call_record.duration_minutes)
    elif event_type == "call_recording_done":
        call_record.recording_url = payload.get("recording_url", call_record.recording_url)
    elif event_type == "call_result_done":
        call_record.result_json = json.dumps(payload.get("result", {}))
    elif event_type == "call_summary":
        call_record.status = payload.get("status", call_record.status)
        call_record.lifecycle_status = payload.get("lifecycle_status", call_record.lifecycle_status)
        call_record.duration_minutes = payload.get("duration_minutes", call_record.duration_minutes)
        if "recording_url" in payload:
            call_record.recording_url = payload.get("recording_url")
        if "result" in payload:
            call_record.result_json = json.dumps(payload.get("result"))
        call_record.engagement_status = payload.get("engagement_status", call_record.engagement_status)
        
    call_record.updated_at = utc_now()
    session.add(call_record)
    session.commit()
    
    return {"ok": True}
