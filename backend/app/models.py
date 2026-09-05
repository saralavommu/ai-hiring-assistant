from datetime import datetime, timezone
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field

def utc_now():
    return datetime.now(timezone.utc)

class Job(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    title: str
    description: str
    must_have_skills: str
    location: str
    hunar_agent_id: str | None = None
    created_at: datetime = Field(default_factory=utc_now)

class Candidate(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    job_id: UUID = Field(foreign_key="job.id")
    name: str
    mobile_number: str
    resume_note: str | None = None

class CallRecord(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    candidate_id: UUID = Field(foreign_key="candidate.id")
    job_id: UUID = Field(foreign_key="job.id")
    hunar_call_id: str | None = None
    request_id: str
    status: str = "NOT_STARTED"
    lifecycle_status: str | None = None
    recording_url: str | None = None
    result_json: str | None = None
    duration_minutes: float | None = None
    engagement_status: str | None = None
    updated_at: datetime = Field(default_factory=utc_now)
