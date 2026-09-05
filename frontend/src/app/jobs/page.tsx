"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, Job } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Building2, ChevronRight, LayoutDashboard, Loader2, MapPin, Plus, Users } from "lucide-react";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getJobs().then(setJobs).finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">Active Jobs</h1>
          <p className="text-muted-foreground">Manage your hiring pipelines and AI agents.</p>
        </div>
        <Link href="/jobs/new">
          <Button className="rounded-full px-6 shadow-lg hover-glow group">
            <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
            Create New Job
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="font-medium animate-pulse">Loading jobs...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 border border-white/5 rounded-3xl bg-secondary/20 backdrop-blur-xl">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-6 border border-primary/30">
            <Briefcase className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-2">No Jobs Found</h3>
          <p className="text-muted-foreground mb-8 max-w-sm text-center text-sm">
            You haven't created any jobs yet. Set up your first role to start screening candidates with AI.
          </p>
          <Link href="/jobs/new">
            <Button className="rounded-full hover-glow">Create your first job</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <Card key={job.id} className="glass-card hover-glow flex flex-col group border-white/5 overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Briefcase className="w-24 h-24 text-primary rotate-12 translate-x-4 -translate-y-4" />
              </div>
              <CardHeader className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
                    Active Agent
                  </Badge>
                </div>
                <CardTitle className="text-xl leading-tight group-hover:text-primary transition-colors">
                  {job.title}
                </CardTitle>
                <CardDescription className="flex items-center gap-1.5 mt-2">
                  <MapPin className="w-3.5 h-3.5" /> {job.location}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 relative z-10">
                <p className="text-sm text-muted-foreground line-clamp-2 mb-6">
                  {job.description}
                </p>
                <div className="space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Required Skills</div>
                  <div className="flex flex-wrap gap-2">
                    {job.must_have_skills.split(',').slice(0, 3).map((skill, idx) => (
                      <span key={idx} className="px-2 py-1 rounded-md bg-secondary text-xs text-secondary-foreground border border-white/5">
                        {skill.trim()}
                      </span>
                    ))}
                    {job.must_have_skills.split(',').length > 3 && (
                      <span className="px-2 py-1 rounded-md bg-secondary/50 text-xs text-muted-foreground">
                        +{job.must_have_skills.split(',').length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3 relative z-10 pt-6 border-t border-white/5 bg-black/10">
                <Link href={`/jobs/${job.id}/candidates`} className="w-full">
                  <Button variant="outline" className="w-full border-white/10 hover:bg-primary/20 hover:text-primary hover:border-primary/30 transition-all rounded-xl">
                    <Users className="w-4 h-4 mr-2" />
                    Manage Candidates
                  </Button>
                </Link>
                <Link href={`/jobs/${job.id}/dashboard`} className="w-full">
                  <Button className="w-full rounded-xl hover-glow group/btn">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    View Live Dashboard
                    <ChevronRight className="w-4 h-4 ml-auto group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
