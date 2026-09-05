from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db import create_db_and_tables

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(title="AI Hiring Assistant", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from .routers import jobs, candidates, calls, webhooks

app.include_router(jobs.router)
app.include_router(candidates.router)
app.include_router(calls.router)
app.include_router(webhooks.router)

@app.get("/")
def read_root():
    return {"message": "AI Hiring Assistant Backend is running"}
