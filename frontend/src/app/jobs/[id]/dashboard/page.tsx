"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { api, Candidate, CallRecord, Job } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Activity, ArrowLeft, BarChart3, CheckCircle2, CircleDashed, Clock, Headphones, RefreshCw, XCircle, Users, FileText } from "lucide-react";

const TERMINAL_STATUSES = ["COMPLETED", "FAILED", "NOT_CONNECTED", "CANCELLED"];

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { cls: string, icon: any }> = {
    NOT_STARTED: { cls: "bg-secondary text-secondary-foreground border-white/10", icon: CircleDashed },
    RINGING: { cls: "bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse", icon: Activity },
    IN_PROGRESS: { cls: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30 animate-pulse", icon: Activity },
    COMPLETED: { cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
    FAILED: { cls: "bg-red-500/20 text-red-400 border-red-500/30", icon: XCircle },
    NOT_CONNECTED: { cls: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: XCircle },
    CANCELLED: { cls: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: XCircle },
  };
  const config = variants[status] ?? variants["NOT_STARTED"];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`gap-1.5 py-1 ${config.cls}`}>
      <Icon className="w-3.5 h-3.5" />
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

interface CandidateWithCall extends Candidate {
  call?: CallRecord;
}

export default function DashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: jobId } = use(params);
  const [job, setJob] = useState<Job | null>(null);
  const [rows, setRows] = useState<CandidateWithCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);

  const fetchData = async () => {
    try {
      const [j, candidates, calls] = await Promise.all([
        api.getJob(jobId),
        api.getCandidates(jobId),
        api.getCalls(jobId),
      ]);
      setJob(j);

      const callMap = new Map(calls.map((c) => [c.candidate_id, c]));
      setRows(candidates.map((c) => ({ ...c, call: callMap.get(c.id) })));
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [jobId]);

  // Poll every 7s unless all calls are terminal
  useEffect(() => {
    const allTerminal =
      rows.length > 0 &&
      rows.every((r) => !r.call || TERMINAL_STATUSES.includes(r.call.status));
    
    setIsPolling(!allTerminal);
    
    if (allTerminal) return;

    const interval = setInterval(fetchData, 7000);
    return () => clearInterval(interval);
  }, [rows]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground">
      <RefreshCw className="w-10 h-10 animate-spin text-primary mb-4" />
      <p className="font-medium animate-pulse">Loading Live Dashboard...</p>
    </div>
  );

  const completedCalls = rows.filter((r) => r.call?.status === "COMPLETED").length;
  const pendingCalls = rows.filter((r) => r.call && !TERMINAL_STATUSES.includes(r.call.status)).length;
  const totalCalls = rows.filter((r) => r.call).length;
  
  const completionRate = totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      <Link href="/jobs" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Jobs
      </Link>
      
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/20 rounded-xl border border-primary/30">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Live Screening Dashboard</h1>
          </div>
          <div className="flex items-center gap-2 ml-14">
            <p className="text-muted-foreground">Role: <span className="text-foreground font-medium">{job?.title}</span></p>
            {isPolling && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 ml-2 animate-pulse">
                <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" /> Live Updates Active
              </Badge>
            )}
          </div>
        </div>
        <div className="space-x-4">
          <Link href={`/jobs/${jobId}/candidates`}>
            <Button variant="outline" className="border-white/10 hover:bg-white/5">Manage Candidates</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="glass-card border-white/5 bg-secondary/20">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium mb-1">Total Candidates</p>
              <div className="text-3xl font-bold">{rows.length}</div>
            </div>
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center border border-white/5">
              <Users className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-white/5 bg-emerald-500/5">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-emerald-400/80 text-sm font-medium mb-1">Completed Calls</p>
              <div className="text-3xl font-bold text-emerald-400">{completedCalls}</div>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5 bg-blue-500/5">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-blue-400/80 text-sm font-medium mb-1">In Progress</p>
              <div className="text-3xl font-bold text-blue-400">{pendingCalls}</div>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-white/5 bg-primary/5">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-primary/80 text-sm font-medium mb-1">Completion Rate</p>
              <div className="text-3xl font-bold text-primary">{completionRate}%</div>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card border-white/5 overflow-hidden">
        <div className="bg-black/20 border-b border-white/5 px-6 py-4">
          <CardTitle className="text-lg">AI Screening Results</CardTitle>
        </div>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="text-center py-20 px-4">
              <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-1">No data to display</h3>
              <p className="text-sm text-muted-foreground">Add candidates and trigger calls to see screening results here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-black/40">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="font-semibold text-muted-foreground w-1/6">Candidate</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Status</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Duration</TableHead>
                  <TableHead className="font-semibold text-muted-foreground w-1/3">AI Fit Summary</TableHead>
                  <TableHead className="font-semibold text-muted-foreground text-center">Audio</TableHead>
                  <TableHead className="text-right font-semibold text-muted-foreground">Full Report</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const result = row.call?.result_json ? JSON.parse(row.call.result_json) : null;
                  
                  return (
                    <TableRow key={row.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                      <TableCell>
                        <div className="font-medium text-base">{row.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{row.mobile_number}</div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={row.call?.status ?? "NOT_STARTED"} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.call?.duration_minutes ? (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 opacity-50" />
                            {row.call.duration_minutes.toFixed(1)}m
                          </div>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        {result?.fit_summary ? (
                          <Dialog>
                            <DialogTrigger render={
                              <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-primary -ml-2" />
                            }>
                              <FileText className="w-4 h-4 mr-2" />
                              Read Summary
                            </DialogTrigger>
                            <DialogContent className="max-w-md glass-card border-white/10">
                              <DialogHeader>
                                <DialogTitle>AI Fit Summary</DialogTitle>
                              </DialogHeader>
                              <div className="mt-2 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                                {result.fit_summary}
                              </div>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <span className="text-muted-foreground/50 italic text-sm">Awaiting completion...</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {row.call?.recording_url ? (
                          <a
                            href={row.call.recording_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center p-2 rounded-full bg-secondary hover:bg-primary/20 hover:text-primary transition-colors border border-white/5"
                            title="Listen to Recording"
                          >
                            <Headphones className="w-4 h-4" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground/30">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {result ? (
                          <Dialog>
                            <DialogTrigger render={
                              <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/20 rounded-full px-4" />
                            }>
                              View Report
                            </DialogTrigger>
                            <DialogContent className="max-w-xl glass-card border-white/10 p-0 overflow-hidden">
                              <div className="bg-primary/10 border-b border-white/5 p-6 flex justify-between items-start">
                                <div>
                                  <DialogTitle className="text-xl mb-1">AI Screening Report</DialogTitle>
                                  <p className="text-sm text-muted-foreground">Candidate: <span className="text-foreground font-medium">{row.name}</span></p>
                                </div>
                                <div className="text-right">
                                  <Badge variant="outline" className={`ml-auto ${result.interested ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                                    {result.interested ? 'Interested' : 'Not Interested'}
                                  </Badge>
                                </div>
                              </div>
                              <div className="p-6 space-y-4">
                                {Object.entries(result).filter(([k]) => k !== 'interested').map(([k, v]) => (
                                  <div key={k} className="flex flex-col gap-1.5 pb-4 border-b border-white/5 last:border-0 last:pb-0">
                                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{k.replace(/_/g, " ")}</span>
                                    <span className="text-sm leading-relaxed">{String(v) || "Not provided"}</span>
                                  </div>
                                ))}
                              </div>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <Button variant="ghost" size="sm" disabled className="rounded-full px-4 text-muted-foreground/30">
                            View Report
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
