from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from uuid import UUID

from ..db import get_session
from ..models import CallRecord
from ..schemas import CallRecordResponse

router = APIRouter(prefix="/jobs/{job_id}/calls", tags=["Calls"])

import requests
import json
from ..config import settings
from ..models import utc_now

@router.get("/", response_model=list[CallRecordResponse])
def list_calls(job_id: UUID, session: Session = Depends(get_session)):
    # Fetch all calls for this job
    calls = session.exec(select(CallRecord).where(CallRecord.job_id == job_id)).all()
    
    # Sync any active calls with Hunar
    updated_any = False
    for call in calls:
        needs_sync = call.status in ('NOT_STARTED', 'IN_PROGRESS', 'RINGING', 'SCHEDULED')
        missing_result = call.status == 'COMPLETED' and not call.result_json
        
        if (needs_sync or missing_result) and call.hunar_call_id:
            try:
                resp = requests.get(
                    f"https://api.voice.hunar.ai/external/v1/calls/{call.hunar_call_id}/",
                    headers={"X-API-Key": settings.HUNAR_API_KEY}
                )
                if resp.status_code == 200:
                    data = resp.json()
                    call.status = data.get("status", call.status)
                    call.lifecycle_status = data.get("lifecycle_status", call.lifecycle_status)
                    
                    if data.get("recording_url"):
                        call.recording_url = data.get("recording_url")
                        
                    if data.get("engagement_status"):
                        call.engagement_status = data.get("engagement_status")
                        
                    if data.get("duration_minutes") is not None:
                        call.duration_minutes = data.get("duration_minutes")
                        
                    if "result" in data and data["result"]:
                        call.result_json = json.dumps(data["result"])
                        
                    call.updated_at = utc_now()
                    session.add(call)
                    updated_any = True
            except Exception as e:
                print(f"Failed to sync call {call.hunar_call_id}: {e}")
                
    if updated_any:
        session.commit()
        
        # Re-fetch after commit to ensure fresh data is returned
        calls = session.exec(select(CallRecord).where(CallRecord.job_id == job_id)).all()
        
    return calls
