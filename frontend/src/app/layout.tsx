import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import Link from "next/link";
import { Bot, Briefcase, LayoutDashboard } from "lucide-react";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Hiring Assistant | Hunar",
  description: "Premium AI-powered voice screening platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col bg-background text-foreground relative overflow-x-hidden font-sans">
        
        {/* Ambient Background Glows */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1]">
          <div className="absolute -top-[25%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[100px]" />
        </div>

        <header className="sticky top-0 z-50 glass">
          <div className="container mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between">
            <Link 
              href="/" 
              className="flex items-center gap-3 text-xl font-bold tracking-tight hover:opacity-80 transition-opacity"
            >
              <div className="p-2 bg-primary/20 rounded-xl border border-primary/30">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <span>Hunar <span className="font-light text-muted-foreground">AI</span></span>
            </Link>
            
            <nav className="flex items-center gap-2 sm:gap-6 text-sm font-medium text-muted-foreground mt-4 sm:mt-0">
              <Link href="/jobs" className="flex items-center gap-2 hover:text-primary transition-colors py-2">
                <Briefcase className="w-4 h-4" />
                Jobs
              </Link>
              <Link href="/jobs" className="flex items-center gap-2 hover:text-primary transition-colors py-2">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <div className="w-px h-5 bg-border mx-2"></div>
              <div className="px-4 py-1.5 rounded-full bg-secondary/50 text-xs border border-white/5">
                Admin
              </div>
            </nav>
          </div>
        </header>

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {children}
        </main>

        <footer className="mt-auto border-t border-white/5 py-8 bg-black/20">
          <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
            <p>Powered by <span className="text-primary font-medium">Hunar.AI Voice Agents</span> &copy; {new Date().getFullYear()}</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
