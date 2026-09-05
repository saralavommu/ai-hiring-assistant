from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class JobCreate(BaseModel):
    title: str
    description: str
    must_have_skills: str
    location: str

class JobResponse(BaseModel):
    id: UUID
    title: str
    description: str
    must_have_skills: str
    location: str
    hunar_agent_id: str | None
    created_at: datetime
    
class CandidateCreate(BaseModel):
    name: str
    mobile_number: str
    resume_note: str | None = None

class CandidateResponse(BaseModel):
    id: UUID
    job_id: UUID
    name: str
    mobile_number: str
    resume_note: str | None

class CallRecordResponse(BaseModel):
    id: UUID
    candidate_id: UUID
    job_id: UUID
    hunar_call_id: str | None
    request_id: str
    status: str
    lifecycle_status: str | None
    recording_url: str | None
    result_json: str | None
    duration_minutes: float | None
    engagement_status: str | None
    updated_at: datetime
