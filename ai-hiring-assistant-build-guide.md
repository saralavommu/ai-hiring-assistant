# AI Hiring Assistant — Build Guide (Hunar.AI Voice Agents)

## 0. What you're building

A web app where an HR user can:
1. Create/select a **job** (title, JD, screening criteria).
2. Upload or add **candidates** (name + phone number).
3. Trigger an **AI voice screening call** to each candidate via Hunar's Voice Agent API.
4. See a **live dashboard** of call status, recordings, and structured results (fit score, availability, notice period, salary expectation, etc.) as calls complete — pushed in real time via Hunar's webhooks.

This maps 1:1 onto Hunar's primitives:
- **Agent** = your reusable "AI recruiter" persona + screening script + result schema.
- **Call / Bulk Call** = one screening call per candidate, with `custom_data` (job title, JD summary, callee name) injected into the agent's prompt.
- **Webhooks** (`call_status_updated`, `call_result_done`, `call_recording_done`, `call_summary`) = how results land back in your dashboard without polling.

---

## 1. Architecture

```
┌─────────────────────┐        ┌──────────────────────────┐        ┌─────────────────┐
│  Next.js + TS +      │  REST  │  FastAPI backend          │  REST  │  Hunar Voice     │
│  shadcn/ui frontend  │◄──────►│  (Python)                 │◄──────►│  Agents API      │
│  - Jobs UI           │        │  - Hunar API wrapper       │        │  api.voice.hunar │
│  - Candidates UI     │        │  - Job/Candidate/Call DB   │        │  .ai/external/v1 │
│  - Live Dashboard     │        │  - Webhook receiver +      │        └─────────────────┘
│  (polling or WS)     │        │    signature verification  │
└─────────────────────┘        │  - Postgres (SQLModel)     │
                                 └──────────────────────────┘
                                            ▲
                                            │ signed webhooks (HTTPS)
                                            │ call_status_updated
                                            │ call_recording_done
                                            │ call_result_done / call_summary
                                            └─────────────
```

Why this shape: Hunar does the calling + STT/TTS/LLM conversation + structured extraction. Your app's job is (a) turn a JD into a good agent config, (b) fan out calls to candidates, (c) durably store + display whatever Hunar sends back via webhook. Never poll in a tight loop — webhooks are the intended path and are HMAC-signed.

---

## 2. Tech stack (per assignment constraints)

- **Backend**: Python 3.11+, FastAPI, SQLModel/SQLAlchemy, Postgres (or SQLite for a quick demo), `httpx` for calling Hunar, `uvicorn`.
- **Frontend**: Next.js (App Router) + TypeScript + shadcn/ui + Tailwind.
- **Realtime dashboard update**: simplest robust option is short-interval polling (`GET /jobs/{id}/candidates` every 5–10s) from the frontend; upgrade to SSE/WebSocket later if time permits.
- **Deployment**: Backend → Render/Railway/Fly.io (needs a publicly reachable HTTPS URL for webhooks — critical, see §7). Frontend → Vercel.
- **Secrets**: `.env` (gitignored) locally; platform-native secret manager in prod. **Never** put `HUNAR_API_KEY` in frontend code — it's a backend-only secret.

---

## 3. Repo structure

```
ai-hiring-assistant/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI app, routers mounted
│   │   ├── config.py                # env/settings (pydantic-settings)
│   │   ├── db.py                    # engine/session
│   │   ├── models.py                # Job, Candidate, CallRecord (SQLModel)
│   │   ├── schemas.py               # pydantic request/response models
│   │   ├── hunar_client.py          # thin wrapper around Hunar REST API
│   │   ├── webhook_verify.py        # HMAC signature verification (from docs)
│   │   ├── routers/
│   │   │   ├── jobs.py              # CRUD jobs, create/sync Hunar agent per job
│   │   │   ├── candidates.py        # add candidates, trigger single/bulk calls
│   │   │   ├── calls.py             # list/get call + results for dashboard
│   │   │   └── webhooks.py          # POST /webhooks/hunar
│   │   └── prompts.py               # agent_prompt / result_schema builder from JD
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── app/
│   │   ├── jobs/                    # create job, list jobs
│   │   ├── jobs/[id]/candidates/    # add candidates, trigger calls
│   │   ├── jobs/[id]/dashboard/     # results table, per-call drawer
│   │   └── layout.tsx
│   ├── components/ui/               # shadcn components
│   ├── lib/api.ts                   # typed fetch client to backend
│   └── .env.local.example
├── .gitignore                       # MUST include .env, *.env, backend/.env
└── README.md
```

---

## 4. Data model (backend/app/models.py)

```python
class Job(SQLModel, table=True):
    id: UUID
    title: str
    description: str
    must_have_skills: str          # comma-separated, feeds prompt
    location: str
    hunar_agent_id: str | None     # set once agent is created for this job
    created_at: datetime

class Candidate(SQLModel, table=True):
    id: UUID
    job_id: UUID
    name: str
    mobile_number: str             # E.164, e.g. +91XXXXXXXXXX
    resume_note: str | None        # optional short note fed into custom_data

class CallRecord(SQLModel, table=True):
    id: UUID
    candidate_id: UUID
    job_id: UUID
    hunar_call_id: str             # Hunar's call UUID
    request_id: str                # your tracking id
    status: str                    # NOT_STARTED, RINGING, COMPLETED, ...
    lifecycle_status: str
    recording_url: str | None
    result_json: str | None        # raw JSON from call_result_done/call_summary
    duration_minutes: float | None
    engagement_status: str | None
    updated_at: datetime
```

---

## 5. Turning a JD into a Hunar Agent

One agent per job (or reuse a generic screening agent and pass JD details via `custom_data` — simpler, do this for the assignment).

**Recommended approach: one generic "Screening Agent" per job, created on the fly.**

`POST /external/v1/agents/` when a job is created:

```python
agent_payload = {
    "name": f"Screener - {job.title}"[:64],
    "language": "ENGLISH",
    "voice_persona": "NEHA",
    "persona_name": "Riya",
    "objective": f"Screen candidates for the {job.title} role and assess fit.",
    "agent_prompt": (
        "You are {persona_name}, a friendly and professional HR screening "
        "assistant calling on behalf of the hiring team. You are screening "
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
```

Store the returned `agent["id"]` as `job.hunar_agent_id`. Custom variables like `job_title`, `key_requirements` must then be supplied per-call in `custom_data` (see agent's `custom_variables` list returned by the API — every one of those keys is required in `custom_data` for a single call).

---

## 6. Triggering calls

**Single call** (`POST /candidates/{id}/call`):
```python
call_payload = {
    "agent_id": job.hunar_agent_id,
    "callee_name": candidate.name,
    "mobile_number": candidate.mobile_number,
    "custom_data": {
        "job_title": job.title,
        "key_requirements": job.must_have_skills,
    },
    "request_id": f"job-{job.id}-cand-{candidate.id}",
    "callback_config": {
        "call_status_callback_url": f"{PUBLIC_BACKEND_URL}/webhooks/hunar",
        "call_recording_callback_url": f"{PUBLIC_BACKEND_URL}/webhooks/hunar",
        "call_result_callback_url": f"{PUBLIC_BACKEND_URL}/webhooks/hunar",
        "call_summary_callback_url": f"{PUBLIC_BACKEND_URL}/webhooks/hunar",
    }
}
```
Save `call["id"]` as `CallRecord.hunar_call_id` with status `NOT_STARTED`.

**Bulk call** (`POST /jobs/{id}/call-all`): same shape, use `POST /external/v1/calls/bulk/` with `data: [...]` (up to 10,000 recipients), `remove_invalid_rows: true`, `remove_duplicate_phone_numbers: true`. One `callback_config` applies to the whole batch.

Respect **guardrails** (calling hours) — either omit and use your org default, or set an explicit window (e.g. Mon–Fri, 09:00–18:00, `Asia/Kolkata`) so you don't try to call candidates at odd hours.

---

## 7. Webhooks — the part most people get wrong

Hunar needs a **public HTTPS URL** to POST events to. This will not work against `localhost` unless tunneled.

- **Local dev**: run `ngrok http 8000`, use the ngrok HTTPS URL as your `callback_config` URLs while testing.
- **Production**: deploy backend first (Render/Railway/Fly), then use `https://your-backend.onrender.com/webhooks/hunar` as the callback URL.

`POST /webhooks/hunar` must:
1. Read the **raw** request body bytes (not the re-serialized JSON — signatures are computed over canonical UTF-8 bytes).
2. Verify `X-Hunar-Signature` + `X-Hunar-Timestamp` using the HMAC helper from the docs (SHA-256, base64, `{timestamp}.{raw_body}` as the signed message, `HUNAR_API_KEY` as the HMAC key).
3. Reject stale timestamps (>300s skew) and invalid signatures with 401 **before** touching the DB.
4. Parse `event_type` and update the matching `CallRecord` by `call_id`:
   - `call_status_updated` → update `status`, `lifecycle_status`, `duration_minutes`
   - `call_recording_done` → update `recording_url`
   - `call_result_done` → update `result_json`
   - `call_summary` → update everything at once (simplest to rely on this one alone if you don't need intermediate status updates)
5. Return `200` fast (Hunar times out ~15s and retries with backoff on non-2xx).
6. Be **idempotent** — webhooks can be delivered more than once; upsert by `call_id`, don't insert duplicates.

```python
@router.post("/webhooks/hunar")
async def hunar_webhook(request: Request):
    raw_body = await request.body()
    if not verify_hunar_webhook_signature(
        signature_header=request.headers.get("X-Hunar-Signature"),
        timestamp_header=request.headers.get("X-Hunar-Timestamp"),
        request_body=raw_body,
        trusted_api_keys=[settings.HUNAR_API_KEY],
    ):
        raise HTTPException(status_code=401)
    payload = json.loads(raw_body)
    await upsert_call_record(payload)   # keyed by payload["call_id"]
    return {"ok": True}
```

---

## 8. Dashboard (frontend)

- **Jobs page**: list jobs, "New Job" form (title, JD text, key skills) → `POST /jobs` (backend also creates the Hunar agent).
- **Candidates page** (`/jobs/[id]/candidates`): add candidates one-by-one or via CSV upload (`name,mobile_number`), "Call All" button → bulk call.
- **Dashboard page** (`/jobs/[id]/dashboard`): shadcn `<Table>` of candidates with columns: Name, Phone, Status (badge), Duration, Interested, Fit Summary, Recording (audio player / link), and a "View Transcript/Result" drawer showing the full `result_json`. Poll `GET /jobs/{id}/candidates` every ~7s while any call is not terminal; stop polling once all calls reach `COMPLETED/FAILED/NOT_CONNECTED/CANCELLED`.
- Status badges: color-code `NOT_STARTED` (gray), `RINGING/IN_PROGRESS` (blue, pulsing), `COMPLETED` (green), `NOT_CONNECTED/FAILED` (red).

---

## 9. Security checklist (they explicitly warned about this)

- `HUNAR_API_KEY` lives only in `backend/.env`, referenced via `os.environ`/pydantic-settings. Never imported into any frontend file or `NEXT_PUBLIC_*` var.
- `.gitignore` at repo root includes `.env`, `backend/.env`, `frontend/.env.local`.
- Before your first commit: `git status` to confirm no `.env` is staged. Also grep the repo for the literal key prefix `hunar_va_live_sk_` before pushing, as a safety net.
- On your deployment platform, set `HUNAR_API_KEY` as a platform secret/env var, not baked into the Docker image or committed config.
- Since the key is revoked in 3 days, do all development/testing within that window — after that, you'll need a fresh key to keep it live, but the deployed demo screenshots/recording should already exist.

---

## 10. Deployment steps

**Backend (Render, example)**
1. Push `backend/` to GitHub.
2. New Render Web Service → connect repo → root dir `backend/`.
3. Build: `pip install -r requirements.txt`. Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
4. Add env vars: `HUNAR_API_KEY`, `DATABASE_URL`, `PUBLIC_BACKEND_URL` (= the Render URL itself, used to build callback URLs).
5. Add a managed Postgres instance (Render/Neon/Supabase) and set `DATABASE_URL`.
6. Confirm `https://<service>.onrender.com/docs` (FastAPI's auto Swagger) loads.

**Frontend (Vercel)**
1. Push `frontend/` (or monorepo with root dir set) to Vercel.
2. Env var: `NEXT_PUBLIC_API_BASE_URL=https://<render-backend-url>`.
3. Deploy, confirm the Jobs page can create a job and it shows up in the backend DB.

**End-to-end smoke test before submitting**
1. Create a job with a real JD.
2. Add yourself as a candidate with your own phone number.
3. Trigger a single call, confirm your phone rings and the agent has a sensible conversation.
4. Confirm the dashboard updates to `COMPLETED` with a recording link and a populated `result_json` — this proves the webhook path works end-to-end, not just call creation.

---

## 11. Submission checklist

- [ ] Deployed frontend link (Vercel)
- [ ] Deployed backend link (Render/Railway) — or at least confirm frontend calls it successfully
- [ ] GitHub repo link, public or shared with reviewer, **with no API key in history** (check `git log -p | grep hunar_va_live_sk_` before pushing)
- [ ] `README.md` with: setup steps, env vars needed (names only, not values), architecture summary, and a short note on the design decisions from §5 (why one generic agent + per-call custom_data, etc.)
- [ ] A short demo (screen recording or screenshots) showing: job creation → candidate call → live dashboard update with a real completed call, since the API key will be dead by the time it's reviewed.

---

## 12. Stretch ideas (only if time remains)

- Auto-generate `must_have_skills` / agent prompt from a pasted full JD using an LLM call in the backend, instead of manual entry.
- CSV bulk upload of candidates with client-side validation (E.164 phone format) before hitting `/calls/bulk/`.
- Per-job guardrails/timezone picker in the UI instead of hardcoding.
- Simple auth (even a shared password) if you're deploying somewhere public, since anyone with the link could otherwise trigger real phone calls.
