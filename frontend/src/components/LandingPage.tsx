import React, { useState, useEffect } from "react";
import {
  Zap, Users, Target, Radio, BarChart3, Sparkles, ArrowRight,
  Shield, Brain, TrendingUp, CheckCircle, ChevronRight, Star,
  MessageSquare, Send, Database, Globe, Lock, Cpu
} from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
}

const STATS = [
  { value: "1,000+", label: "Customer Profiles", icon: Users },
  { value: "94.2%", label: "Delivery Rate", icon: Send },
  { value: "3.8×", label: "Avg ROI Lift", icon: TrendingUp },
  { value: "< 2ms", label: "AI Response Time", icon: Zap },
];

const FEATURES = [
  {
    icon: Brain,
    color: "indigo",
    title: "AI Command Center",
    description:
      "Natural language campaign planning powered by Gemini AI. Describe your goal, get a full audience strategy, message template, and predicted conversion metrics — instantly.",
    badge: "Gemini AI",
  },
  {
    icon: Users,
    color: "purple",
    title: "Customer Intelligence",
    description:
      "Unified 360° behavioral profiles with RFM scoring, health indices, lifetime value tracking, and real-time activity feeds across every customer touchpoint.",
    badge: "Real-time Sync",
  },
  {
    icon: Target,
    color: "emerald",
    title: "Audience Studio",
    description:
      "Build hyper-segmented audiences using multi-dimensional filters — spend tiers, health scores, tags, recency. Preview segment size before you spend a rupee.",
    badge: "Smart Segments",
  },
  {
    icon: Send,
    color: "pink",
    title: "Campaign Studio",
    description:
      "Design and launch omni-channel campaigns via WhatsApp, Email & SMS. Live preview, personalization tokens, and automated A/B dispatch.",
    badge: "Omni-channel",
  },
  {
    icon: Radio,
    color: "amber",
    title: "Live Monitor Stream",
    description:
      "Watch campaign events unfold in real-time — every delivery, open, click, and conversion. Adjust speed, pause, and replay any active broadcast.",
    badge: "Streaming",
  },
  {
    icon: BarChart3,
    color: "cyan",
    title: "Insights Engine",
    description:
      "Neural reports with comparative campaign analytics, algorithmic growth recommendations, churn risk alerts, and an interactive AI Q&A assistant.",
    badge: "Neural Reports",
  },
];

const TESTIMONIALS = [
  {
    name: "Aishwarya Krishnan",
    role: "VP Marketing, LumeFashion",
    avatar: "AK",
    stars: 5,
    text: "XenoPulse transformed how we segment and reach our VIP buyers. Our WhatsApp ROI tripled in the first 45 days.",
  },
  {
    name: "Rajesh Kumar",
    role: "Growth Lead, BrewCo India",
    avatar: "RK",
    stars: 5,
    text: "The AI Command Center is unreal. I typed 're-engage churned coffee buyers' and got a full campaign strategy in seconds.",
  },
  {
    name: "Meera Pillai",
    role: "CRO, StyleVault",
    avatar: "MP",
    stars: 5,
    text: "Finally a marketing OS built for DTC brands. The live campaign monitor gives us complete transparency on every message we send.",
  },
];

const PRICING_FEATURES = [
  "1,000 customer profiles",
  "AI Command Center access",
  "WhatsApp, Email & SMS campaigns",
  "Real-time live monitor",
  "Campaign insights & analytics",
  "Audience segmentation studio",
  "Admin + Marketing Manager roles",
  "API webhook integration",
];

const colorMap: Record<string, string> = {
  indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  pink: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
};

const glowMap: Record<string, string> = {
  indigo: "shadow-indigo-500/20",
  purple: "shadow-purple-500/20",
  emerald: "shadow-emerald-500/20",
  pink: "shadow-pink-500/20",
  amber: "shadow-amber-500/20",
  cyan: "shadow-cyan-500/20",
};

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const [scrolled, setScrolled] = useState(false);
  const [typedText, setTypedText] = useState("");
  const fullText = "Re-engage churned VIP buyers in Mumbai with a WhatsApp flash offer";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Typing animation for hero
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < fullText.length) {
        setTypedText(fullText.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 45);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans overflow-x-hidden">
      {/* ── Background ambient glows ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-indigo-600/10 blur-[160px]" />
        <div className="absolute top-[60%] left-[-200px] w-[500px] h-[400px] rounded-full bg-purple-600/8 blur-[140px]" />
        <div className="absolute top-[40%] right-[-200px] w-[500px] h-[400px] rounded-full bg-indigo-500/6 blur-[140px]" />
      </div>

      {/* ── Sticky Nav ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#09090b]/90 backdrop-blur-lg border-b border-zinc-800/60 shadow-xl" : ""}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-indigo-600/30">
              X
            </div>
            <div>
              <span className="font-bold text-white text-sm tracking-tight">XenoPulse</span>
              <span className="text-[9px] font-mono text-zinc-500 ml-1.5 uppercase tracking-widest">Marketing OS</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-xs text-zinc-400 font-medium">
            <a href="#features" className="hover:text-white transition-colors cursor-pointer">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors cursor-pointer">How it Works</a>
            <a href="#testimonials" className="hover:text-white transition-colors cursor-pointer">Testimonials</a>
            <a href="#pricing" className="hover:text-white transition-colors cursor-pointer">Pricing</a>
          </div>

          <button
            onClick={onGetStarted}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            Launch Platform
            <ArrowRight size={13} />
          </button>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative z-10 pt-36 pb-24 px-6 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-widest font-mono">
            <Sparkles size={10} className="animate-pulse" />
            Powered by Gemini AI · Built for DTC Retail Brands
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-none text-white">
            The AI-Native{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent">
              Marketing OS
            </span>
            <br />
            for Modern Retail
          </h1>

          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Unify your customer intelligence, automate campaigns across WhatsApp, Email & SMS,
            and let AI craft your entire go-to-market strategy — in seconds.
          </p>

          {/* Animated AI prompt demo */}
          <div className="max-w-xl mx-auto bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-left shadow-2xl">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
              </div>
              <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest">AI Command Center</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-indigo-400 font-mono text-xs mt-0.5">❯</span>
              <p className="text-zinc-200 text-sm font-mono leading-relaxed">
                {typedText}
                <span className="animate-pulse text-indigo-400">|</span>
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-zinc-800 grid grid-cols-3 gap-2 text-[10px]">
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-2">
                <p className="text-zinc-500 font-mono">Audience</p>
                <p className="text-white font-bold mt-0.5">VIP Mumbai</p>
                <p className="text-indigo-400">247 profiles</p>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-2">
                <p className="text-zinc-500 font-mono">Channel</p>
                <p className="text-white font-bold mt-0.5">WhatsApp</p>
                <p className="text-emerald-400">91% open rate</p>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-2">
                <p className="text-zinc-500 font-mono">Est. ROI</p>
                <p className="text-white font-bold mt-0.5">4.1×</p>
                <p className="text-purple-400">₹82,000 lift</p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={onGetStarted}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-all shadow-2xl shadow-indigo-600/30 hover:shadow-indigo-600/50 flex items-center justify-center gap-2 cursor-pointer active:scale-95 group"
            >
              Get Started Free
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={onGetStarted}
              className="px-8 py-4 border border-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-white font-bold text-sm rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
            >
              <Lock size={13} />
              Sign In to Dashboard
            </button>
          </div>

          <p className="text-[10px] text-zinc-600 font-mono">
            No credit card required · Demo credentials available · Deploy in 60 seconds
          </p>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="relative z-10 py-10 border-y border-zinc-800/60 bg-zinc-900/30">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="text-center space-y-1">
                <Icon size={16} className="text-indigo-400 mx-auto mb-1" />
                <p className="text-2xl font-extrabold text-white tracking-tight">{s.value}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">{s.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Features Section ── */}
      <section id="features" className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-700 bg-zinc-900 text-zinc-400 text-[10px] font-mono uppercase tracking-widest">
              <Cpu size={10} />
              Platform Modules
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Every tool your marketing team needs
            </h2>
            <p className="text-zinc-500 max-w-xl mx-auto">
              Six deeply integrated modules — from AI strategy to live campaign monitoring — in a single unified workspace.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className={`p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700 transition-all duration-300 group shadow-xl hover:shadow-2xl ${glowMap[f.color]} space-y-3`}
                >
                  <div className="flex items-start justify-between">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${colorMap[f.color]}`}>
                      <Icon size={18} />
                    </div>
                    <span className={`text-[9px] font-mono font-bold px-2 py-1 rounded-full border ${colorMap[f.color]}`}>
                      {f.badge}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm mb-1.5 group-hover:text-indigo-300 transition-colors">{f.title}</h3>
                    <p className="text-zinc-500 text-xs leading-relaxed">{f.description}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-600 group-hover:text-indigo-400 transition-colors font-semibold cursor-pointer">
                    Explore module <ChevronRight size={11} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="relative z-10 py-24 px-6 bg-zinc-900/20 border-y border-zinc-800/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 space-y-3">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Launch a campaign in 3 steps
            </h2>
            <p className="text-zinc-500">From customer data to live dispatch — in under 5 minutes.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                color: "indigo",
                title: "Define Your Goal",
                desc: "Type your marketing objective in plain English into the AI Command Center. XenoPulse instantly segments your audience and drafts a personalized message.",
                icon: Brain,
              },
              {
                step: "02",
                color: "purple",
                title: "Customize & Schedule",
                desc: "Review the AI-generated strategy in Campaign Studio. Edit the message, adjust the audience, set channel priorities, and schedule or launch immediately.",
                icon: Target,
              },
              {
                step: "03",
                color: "emerald",
                title: "Monitor Live Results",
                desc: "Watch every delivery, open, click, and conversion stream in real-time. Get instant churn risk alerts and algorithmic growth recommendations.",
                icon: Radio,
              },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="relative">
                  {i < 2 && (
                    <div className="hidden md:block absolute top-8 left-full w-6 h-0.5 bg-zinc-700 z-10" />
                  )}
                  <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-4 hover:border-zinc-700 transition-all">
                    <div className="flex items-center gap-3">
                      <span className={`text-4xl font-black opacity-20 text-${s.color}-400 leading-none`}>{s.step}</span>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${colorMap[s.color]}`}>
                        <Icon size={16} />
                      </div>
                    </div>
                    <h3 className="font-bold text-white text-sm">{s.title}</h3>
                    <p className="text-zinc-500 text-xs leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="relative z-10 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 space-y-3">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Trusted by marketing leaders
            </h2>
            <p className="text-zinc-500">Teams across India's fastest-growing DTC brands use XenoPulse daily.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-4 hover:border-zinc-700 transition-all">
                <div className="flex gap-0.5">
                  {Array.from({ length: t.stars }).map((_, si) => (
                    <Star key={si} size={12} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-zinc-300 text-xs leading-relaxed italic">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-2 border-t border-zinc-800/60">
                  <div className="w-8 h-8 rounded-full bg-indigo-900 border border-indigo-700 flex items-center justify-center text-indigo-300 font-bold text-xs">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-zinc-200 font-semibold text-xs">{t.name}</p>
                    <p className="text-zinc-600 text-[10px] font-mono">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing CTA ── */}
      <section id="pricing" className="relative z-10 py-24 px-6 bg-zinc-900/20 border-t border-zinc-800/40">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] font-mono uppercase tracking-widest">
              <CheckCircle size={10} />
              Full Platform Access
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Everything included.
              <br />
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Zero complexity.
              </span>
            </h2>
            <p className="text-zinc-500">One workspace. All six modules. Admin and manager role access included.</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 space-y-6 shadow-2xl text-left">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-4xl font-black text-white">Free Demo</p>
                <p className="text-zinc-500 text-sm mt-1">Full platform with pre-seeded data</p>
              </div>
              <div className="px-3 py-1.5 bg-indigo-600/20 border border-indigo-500/30 rounded-lg text-indigo-400 text-xs font-bold">
                Demo Ready
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PRICING_FEATURES.map((feat, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs text-zinc-300">
                  <CheckCircle size={13} className="text-emerald-400 shrink-0" />
                  {feat}
                </div>
              ))}
            </div>

            <button
              onClick={onGetStarted}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-all shadow-2xl shadow-indigo-600/30 hover:shadow-indigo-600/50 flex items-center justify-center gap-2 cursor-pointer active:scale-95 group"
            >
              Launch the Platform Now
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </button>

            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-zinc-800">
              {[
                { icon: Shield, text: "Secure Auth" },
                { icon: Globe, text: "Cloud Deployed" },
                { icon: Database, text: "1K+ Profiles" },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[10px] text-zinc-500 justify-center">
                  <Icon size={11} className="text-zinc-600" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Demo Credentials Callout ── */}
      <section className="relative z-10 py-12 px-6 border-t border-zinc-800/60">
        <div className="max-w-3xl mx-auto">
          <div className="p-6 rounded-2xl border border-indigo-900/40 bg-indigo-950/20 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <p className="text-white font-bold text-sm">Try with demo credentials</p>
              <p className="text-zinc-500 text-xs">Explore all features without setting up an account.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="text-center px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs">
                <p className="text-zinc-500 font-mono text-[9px] uppercase mb-1">Admin</p>
                <p className="text-indigo-400 font-semibold">admin@xenopulse.com</p>
                <p className="text-zinc-500 font-mono">admin123</p>
              </div>
              <div className="text-center px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs">
                <p className="text-zinc-500 font-mono text-[9px] uppercase mb-1">Manager</p>
                <p className="text-purple-400 font-semibold">manager@xenopulse.com</p>
                <p className="text-zinc-500 font-mono">manager123</p>
              </div>
              <button
                onClick={onGetStarted}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-indigo-600/25 active:scale-95"
              >
                Go to Login
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 py-10 px-6 border-t border-zinc-800/60">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-zinc-600 font-mono">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-[9px]">X</div>
            <span>© 2026 XenoPulse Platform Corporation. Retail OS Standard License.</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              All systems operational
            </span>
            <span>v1.5.0 · Gemini AI · FastAPI · React</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
