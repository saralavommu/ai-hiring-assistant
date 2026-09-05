"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, Bot, Briefcase, Globe, Loader2, Sparkles, Target } from "lucide-react";
import Link from "next/link";

export default function NewJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    must_have_skills: "",
    location: "Remote"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createJob(formData);
      router.push(`/jobs`);
    } catch (err: any) {
      console.error(err);
      alert(`Failed to create job: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <Link href="/jobs" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Jobs
      </Link>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="glass-card border-white/5 overflow-hidden">
            <div className="bg-primary/5 border-b border-white/5 px-6 py-4">
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" /> Create New Role
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Define the requirements to automatically generate a custom AI Screener.
              </p>
            </div>
            
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5" /> Job Title
                    </Label>
                    <Input
                      id="title"
                      required
                      className="bg-black/20 border-white/10 focus-visible:ring-primary h-11"
                      placeholder="e.g. Senior Frontend Engineer"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="location" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5" /> Location
                    </Label>
                    <Input
                      id="location"
                      required
                      className="bg-black/20 border-white/10 focus-visible:ring-primary h-11"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="must_have_skills" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Target className="w-3.5 h-3.5" /> Key Requirements (Comma separated)
                  </Label>
                  <Input
                    id="must_have_skills"
                    required
                    className="bg-black/20 border-white/10 focus-visible:ring-primary h-11"
                    placeholder="e.g. React, Next.js, 3+ years experience"
                    value={formData.must_have_skills}
                    onChange={(e) => setFormData({ ...formData, must_have_skills: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">The AI will specifically ask candidates if they possess these skills.</p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" /> Context & Description
                  </Label>
                  <textarea
                    id="description"
                    className="flex min-h-[120px] w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                    required
                    placeholder="Provide background information about the role for the AI's context."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="pt-6 border-t border-white/5 flex gap-4 justify-end">
                  <Button type="button" variant="outline" className="border-white/10" onClick={() => router.back()}>Cancel</Button>
                  <Button type="submit" disabled={loading} className="px-8 hover-glow">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating AI Agent...
                      </>
                    ) : (
                      <>
                        <Bot className="w-4 h-4 mr-2" />
                        Create Job & Agent
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
        
        {/* Informational Sidebar */}
        <div className="hidden lg:block space-y-6">
          <Card className="glass-card border-white/5 bg-primary/5">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4 border border-primary/30">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">What happens next?</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                When you create a job, our system automatically communicates with the Hunar Voice API to instantiate a customized AI agent ("Riya").
              </p>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="min-w-4 mt-1"><div className="w-1.5 h-1.5 rounded-full bg-primary"></div></div>
                  <span>The AI is prompted strictly with your <strong className="text-foreground">Key Requirements</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="min-w-4 mt-1"><div className="w-1.5 h-1.5 rounded-full bg-primary"></div></div>
                  <span>It is instructed to ask about current CTC, expected CTC, and notice periods.</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
