import Link from "next/link";
import { Cpu, Database, MessageSquare, ArrowRight, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-slate-900 font-sans antialiased overflow-hidden flex flex-col justify-between">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-950/20 via-slate-950 to-slate-950 pointer-events-none z-0" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Navigation Branding */}
      <nav className="relative max-w-7xl mx-auto w-full px-6 h-20 flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl shadow-lg shadow-indigo-500/25">
            <Cpu className="w-5 h-5 text-slate-50" />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            XenoPulse AI
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[11px] font-mono px-3 py-1 rounded-full border border-slate-800 text-slate-400 bg-slate-900/40">
            v1.0.0 Stable
          </span>
        </div>
      </nav>

      {/* Main Content / Hero Section */}
      <main className="relative max-w-7xl mx-auto w-full px-6 py-20 z-10 flex flex-col items-center justify-center flex-1 text-center">
        
        {/* Sparkle Tagline */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          Next-Gen AI CRM Segments
        </div>

        {/* Hero Title */}
        <h1 className="max-w-4xl text-4xl sm:text-6xl font-extrabold leading-[1.15] tracking-tight bg-gradient-to-b from-slate-50 via-slate-100 to-slate-400 bg-clip-text text-transparent mb-6">
          Query Databases in <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Natural Language</span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl text-base sm:text-lg text-slate-400 leading-relaxed mb-10">
          Unlock instant customer segment translations, compiled SQL filter previews, and multi-tenant database lookups powered by Gemini 2.5 Flash.
        </p>

        {/* Call-to-action */}
        <div className="flex flex-wrap gap-4 items-center justify-center mb-20 max-w-4xl">
          <Link
            href="/command"
            className="flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-8 text-slate-50 font-bold tracking-tight shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
          >
            AI Command Center
            <Sparkles className="w-4 h-4 text-slate-50" />
          </Link>
          <Link
            href="/segments"
            className="flex h-12 items-center justify-center gap-2 rounded-full bg-slate-900 hover:bg-slate-850 border border-slate-800 px-8 text-slate-200 font-bold tracking-tight shadow-lg transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
          >
            Segment Builder
            <ArrowRight className="w-4 h-4 text-slate-200" />
          </Link>
          <Link
            href="/campaigns"
            className="flex h-12 items-center justify-center gap-2 rounded-full bg-slate-900 hover:bg-slate-850 border border-slate-800 px-8 text-slate-200 font-bold tracking-tight shadow-lg transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
          >
            Campaign Builder
            <ArrowRight className="w-4 h-4 text-slate-200" />
          </Link>
          <Link
            href="/analytics"
            className="flex h-12 items-center justify-center gap-2 rounded-full bg-indigo-950/45 hover:bg-indigo-900/30 border border-indigo-500/35 px-8 text-indigo-400 font-bold tracking-tight shadow-lg shadow-indigo-950/20 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
          >
            Analytics Dashboard
            <ArrowRight className="w-4 h-4 text-indigo-400" />
          </Link>
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            className="flex h-12 items-center justify-center rounded-full border border-slate-800 bg-slate-900/30 hover:bg-slate-900/60 px-6 text-slate-300 font-semibold tracking-tight transition-all active:scale-95 cursor-pointer"
          >
            Swagger Docs
          </a>
        </div>


        {/* Features Matrix Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl text-left">
          
          {/* Card 1: AI Segment Generator */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/20 backdrop-blur-md p-6 hover:border-indigo-500/30 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-center text-indigo-400 mb-4 group-hover:bg-indigo-600/20 transition-all">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-200 mb-2">Gemini 2.5 Segmenting</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Instantly converts plain text audience queries into optimized, execution-safe SQLite filters.
            </p>
          </div>

          {/* Card 2: CRM Core */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/20 backdrop-blur-md p-6 hover:border-indigo-500/30 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-600/20 flex items-center justify-center text-violet-400 mb-4 group-hover:bg-violet-600/20 transition-all">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-200 mb-2">Robust SQLite Core</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              FastAPI-backed schema with precompiled relational indexes supporting multi-tenant access boundaries.
            </p>
          </div>

          {/* Card 3: Broker */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/20 backdrop-blur-md p-6 hover:border-indigo-500/30 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-pink-600/10 border border-pink-600/20 flex items-center justify-center text-pink-400 mb-4 group-hover:bg-pink-600/20 transition-all">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-200 mb-2">Multichannel Broker</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Stand-alone notification service ready to deliver trigger-based Email, SMS, and WhatsApp alerts.
            </p>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="relative border-t border-slate-900 py-6 text-center text-xs text-slate-600 z-10 font-mono">
        &copy; {new Date().getFullYear()} XenoPulse AI. Built with Next.js 15, FastAPI, and Gemini.
      </footer>
    </div>
  );
}
