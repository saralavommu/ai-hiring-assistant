from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from uuid import UUID

from ..db import get_session
from ..models import Job
from ..schemas import JobCreate, JobResponse
from ..hunar_client import create_hunar_agent

router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.post("/", response_model=JobResponse)
async def create_job(job_data: JobCreate, session: Session = Depends(get_session)):
    # 1. Create agent in Hunar
    try:
        agent_resp = await create_hunar_agent(job_data.title, job_data.must_have_skills)
        hunar_agent_id = agent_resp.get("id")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create Hunar agent: {str(e)}")

    # 2. Save job to DB
    job = Job(
        title=job_data.title,
        description=job_data.description,
        must_have_skills=job_data.must_have_skills,
        location=job_data.location,
        hunar_agent_id=hunar_agent_id
    )
    session.add(job)
    session.commit()
    session.refresh(job)
    
    return job

@router.get("/", response_model=list[JobResponse])
def list_jobs(session: Session = Depends(get_session)):
    jobs = session.exec(select(Job)).all()
    return jobs

@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: UUID, session: Session = Depends(get_session)):
    job = session.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
