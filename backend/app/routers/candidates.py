from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from uuid import UUID

from ..db import get_session
from ..models import Job, Candidate, CallRecord
from ..schemas import CandidateCreate, CandidateResponse, CallRecordResponse
from ..hunar_client import trigger_call

router = APIRouter(prefix="/jobs/{job_id}/candidates", tags=["Candidates"])

@router.post("/", response_model=CandidateResponse)
def add_candidate(job_id: UUID, candidate_data: CandidateCreate, session: Session = Depends(get_session)):
    job = session.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    candidate = Candidate(
        job_id=job_id,
        name=candidate_data.name,
        mobile_number=candidate_data.mobile_number,
        resume_note=candidate_data.resume_note
    )
    session.add(candidate)
    session.commit()
    session.refresh(candidate)
    return candidate

@router.get("/", response_model=list[CandidateResponse])
def list_candidates(job_id: UUID, session: Session = Depends(get_session)):
    candidates = session.exec(select(Candidate).where(Candidate.job_id == job_id)).all()
    return candidates

@router.post("/{candidate_id}/call", response_model=CallRecordResponse)
async def trigger_single_call(job_id: UUID, candidate_id: UUID, session: Session = Depends(get_session)):
    job = session.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    candidate = session.get(Candidate, candidate_id)
    if not candidate or candidate.job_id != job_id:
        raise HTTPException(status_code=404, detail="Candidate not found for this job")
        
    if not job.hunar_agent_id:
        raise HTTPException(status_code=400, detail="Job does not have an active agent configured")
        
    request_id = f"call-{candidate.id}"
    
    # Check if a call record already exists to prevent duplicate
    existing_record = session.exec(select(CallRecord).where(CallRecord.request_id == request_id)).first()
    
    if existing_record and existing_record.status not in ["FAILED", "CANCELLED", "NOT_CONNECTED"]:
         raise HTTPException(status_code=400, detail="Call already exists and is active")
         
    try:
        call_resp = await trigger_call(
            agent_id=job.hunar_agent_id,
            callee_name=candidate.name,
            mobile_number=candidate.mobile_number,
            job_title=job.title,
            key_requirements=job.must_have_skills,
            request_id=request_id
        )
        hunar_call_id = call_resp.get("id")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to trigger call: {str(e)}")

    if not existing_record:
        call_record = CallRecord(
            candidate_id=candidate.id,
            job_id=job.id,
            request_id=request_id,
            hunar_call_id=hunar_call_id,
            status="NOT_STARTED"
        )
        session.add(call_record)
    else:
        existing_record.hunar_call_id = hunar_call_id
        existing_record.status = "NOT_STARTED"
        call_record = existing_record
        
    session.commit()
    session.refresh(call_record)
    
    return call_record
