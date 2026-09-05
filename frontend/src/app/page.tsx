import Link from 'next/link';
import { ArrowRight, Bot, PhoneCall, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 mb-8">
        <Sparkles className="w-4 h-4" />
        <span className="text-sm font-medium">Hunar Voice AI Integration</span>
      </div>

      <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
        Hire faster with <br className="hidden md:block" />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
          AI Voice Screening
        </span>
      </h1>
      
      <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-12">
        Upload your candidates, create a customized AI Agent for your job role, and let our voice assistant conduct the first-round interviews over the phone.
      </p>
      
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Link href="/jobs/new">
          <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-lg hover-glow group">
            <Bot className="mr-2 w-5 h-5 group-hover:rotate-12 transition-transform" />
            Create AI Agent
          </Button>
        </Link>
        <Link href="/jobs">
          <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full border-white/10 hover:bg-white/5 group">
            View Jobs Dashboard
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 text-left w-full max-w-5xl">
        <div className="glass-card p-6 rounded-2xl">
          <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-4 border border-primary/30">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Custom AI Personas</h3>
          <p className="text-muted-foreground text-sm">Define exactly what your agent should ask based on the unique requirements of your job role.</p>
        </div>
        <div className="glass-card p-6 rounded-2xl">
          <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 border border-purple-500/30">
            <PhoneCall className="w-6 h-6 text-purple-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Real Phone Calls</h3>
          <p className="text-muted-foreground text-sm">The AI calls candidates on their real mobile numbers and conducts natural voice conversations.</p>
        </div>
        <div className="glass-card p-6 rounded-2xl">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4 border border-emerald-500/30">
            <Sparkles className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Instant Insights</h3>
          <p className="text-muted-foreground text-sm">Review call recordings, extracted metrics like Expected CTC, and a concise fit summary on your dashboard.</p>
        </div>
      </div>
      
    </div>
  );
}
