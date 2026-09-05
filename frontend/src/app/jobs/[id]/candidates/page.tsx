"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, Candidate, Job } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, Phone, PhoneCall, Plus, UserPlus, Users } from "lucide-react";

export default function CandidatesPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: jobId } = use(params);
  const [job, setJob] = useState<Job | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [adding, setAdding] = useState(false);
  const [callingId, setCallingId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getJob(jobId), api.getCandidates(jobId)])
      .then(([j, c]) => {
        setJob(j);
        setCandidates(c);
      })
      .finally(() => setLoading(false));
  }, [jobId]);

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const newCand = await api.addCandidate(jobId, { name, mobile_number: phone, resume_note: null });
      setCandidates([...candidates, newCand]);
      setName("");
      setPhone("");
    } catch (err) {
      console.error(err);
      alert("Failed to add candidate");
    } finally {
      setAdding(false);
    }
  };

  const triggerCall = async (candidateId: string) => {
    setCallingId(candidateId);
    try {
      await api.triggerCall(jobId, candidateId);
      router.push(`/jobs/${jobId}/dashboard`);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to trigger call");
      setCallingId(null);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground">
      <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
      <p className="font-medium animate-pulse">Loading Candidates...</p>
    </div>
  );
  if (!job) return <div className="p-8 text-center text-destructive">Job not found.</div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      
      <Link href="/jobs" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Jobs
      </Link>
      
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/20 rounded-xl border border-primary/30">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Candidate Pipeline</h1>
          </div>
          <p className="text-muted-foreground ml-14">Role: <span className="text-foreground font-medium">{job.title}</span> &mdash; Manage and screen candidates automatically.</p>
        </div>
        <Link href={`/jobs/${job.id}/dashboard`}>
          <Button variant="secondary" className="rounded-full shadow-md border-white/5 bg-secondary/80 hover:bg-secondary">
            View Live Dashboard
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sidebar: Add Candidate */}
        <Card className="lg:col-span-1 h-fit glass-card border-white/5">
          <div className="bg-primary/5 border-b border-white/5 px-6 py-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Add Candidate</CardTitle>
          </div>
          <CardContent className="p-6">
            <form onSubmit={handleAddCandidate} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Full Name</Label>
                <Input 
                  required 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="e.g. Jane Doe" 
                  className="bg-black/20 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Mobile Number</Label>
                <Input 
                  required 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  placeholder="e.g. 9876543210" 
                  className="bg-black/20 border-white/10"
                />
                <p className="text-xs text-muted-foreground mt-1">Must be a valid 10-digit number for the AI to call.</p>
              </div>
              <Button type="submit" className="w-full hover-glow" disabled={adding}>
                {adding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Add to Pipeline
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Main Area: Candidate List */}
        <Card className="lg:col-span-2 glass-card border-white/5 overflow-hidden">
          <div className="bg-black/20 border-b border-white/5 px-6 py-4 flex justify-between items-center">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Candidate Roster
            </CardTitle>
            <span className="text-sm text-muted-foreground font-medium bg-secondary/50 px-3 py-1 rounded-full border border-white/5">
              Total: {candidates.length}
            </span>
          </div>
          <CardContent className="p-0">
            {candidates.length === 0 ? (
              <div className="text-center py-20 px-4">
                <UserPlus className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-1">Your pipeline is empty</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Add candidates using the form to start screening them with your AI Voice Agent.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-black/40">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="font-semibold text-muted-foreground">Name</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">Phone</TableHead>
                    <TableHead className="text-right font-semibold text-muted-foreground">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidates.map((c) => (
                    <TableRow key={c.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                      <TableCell className="font-medium text-base">{c.name}</TableCell>
                      <TableCell className="text-muted-foreground flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 opacity-50" />
                        {c.mobile_number}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          onClick={() => triggerCall(c.id)}
                          disabled={callingId !== null}
                          className="rounded-full shadow-lg hover-glow bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          {callingId === c.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <PhoneCall className="w-4 h-4 mr-2" />
                          )}
                          Call Now
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
