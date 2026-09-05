const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

export interface Job {
  id: string;
  title: string;
  description: string;
  must_have_skills: string;
  location: string;
  hunar_agent_id: string | null;
  created_at: string;
}

export interface Candidate {
  id: string;
  job_id: string;
  name: string;
  mobile_number: string;
  resume_note: string | null;
}

export interface CallRecord {
  id: string;
  candidate_id: string;
  job_id: string;
  hunar_call_id: string | null;
  request_id: string;
  status: string;
  lifecycle_status: string | null;
  recording_url: string | null;
  result_json: string | null;
  duration_minutes: number | null;
  engagement_status: string | null;
  updated_at: string;
}

export const api = {
  getJobs: async (): Promise<Job[]> => {
    const res = await fetch(`${API_BASE}/jobs/`);
    if (!res.ok) throw new Error('Failed to fetch jobs');
    return res.json();
  },
  getJob: async (id: string): Promise<Job> => {
    const res = await fetch(`${API_BASE}/jobs/${id}`);
    if (!res.ok) throw new Error('Failed to fetch job');
    return res.json();
  },
  createJob: async (data: Omit<Job, 'id' | 'hunar_agent_id' | 'created_at'>): Promise<Job> => {
    const res = await fetch(`${API_BASE}/jobs/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to create job');
    }
    return res.json();
  },
  getCandidates: async (jobId: string): Promise<Candidate[]> => {
    const res = await fetch(`${API_BASE}/jobs/${jobId}/candidates/`);
    if (!res.ok) throw new Error('Failed to fetch candidates');
    return res.json();
  },
  addCandidate: async (jobId: string, data: Omit<Candidate, 'id' | 'job_id'>): Promise<Candidate> => {
    const res = await fetch(`${API_BASE}/jobs/${jobId}/candidates/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add candidate');
    return res.json();
  },
  triggerCall: async (jobId: string, candidateId: string): Promise<CallRecord> => {
    const res = await fetch(`${API_BASE}/jobs/${jobId}/candidates/${candidateId}/call`, {
      method: 'POST',
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to trigger call');
    }
    return res.json();
  },
  getCalls: async (jobId: string): Promise<CallRecord[]> => {
    const res = await fetch(`${API_BASE}/jobs/${jobId}/calls/`);
    if (!res.ok) throw new Error('Failed to fetch calls');
    return res.json();
  },
};
