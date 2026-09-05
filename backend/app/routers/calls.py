from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from uuid import UUID

from ..db import get_session
from ..models import CallRecord
from ..schemas import CallRecordResponse

router = APIRouter(prefix="/jobs/{job_id}/calls", tags=["Calls"])

@router.get("/", response_model=list[CallRecordResponse])
def list_calls(job_id: UUID, session: Session = Depends(get_session)):
    calls = session.exec(select(CallRecord).where(CallRecord.job_id == job_id)).all()
    return calls
