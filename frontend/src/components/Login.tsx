import React, { useState } from "react";
import { Sparkles, Shield, User, Key, Lock, ArrowRight, AlertCircle } from "lucide-react";

interface LoginProps {
  onLoginSuccess: (user: { name: string; email: string; role: string }) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (data.success && data.user) {
        onLoginSuccess(data.user);
      } else {
        setError(data.error || "Invalid credentials. Please try again.");
      }
    } catch (err) {
      console.error("Login request error", err);
      setError("Server connection failure. Please verify the backend status.");
    } finally {
      setLoading(false);
    }
  };

  const autofillDemo = (type: "admin" | "manager") => {
    if (type === "admin") {
      setEmail("admin@xenopulse.com");
      setPassword("admin123");
    } else {
      setEmail("manager@xenopulse.com");
      setPassword("manager123");
    }
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col justify-center items-center p-4 font-sans select-none relative overflow-hidden">
      
      {/* Background glow animations */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] rounded-full bg-purple-500/5 blur-[100px] pointer-events-none z-0"></div>

      <div className="relative z-10 w-full max-w-[420px] space-y-6">
        
        {/* Header Logo */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-2xl text-white mx-auto shadow-lg shadow-indigo-600/30">
            X
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-4">Welcome to XenoPulse</h1>
          <p className="text-xs text-zinc-550 font-mono uppercase tracking-widest">AI-Native Marketing OS</p>
        </div>

        {/* Login Form Box */}
        <div className="bg-zinc-900/60 border border-zinc-800 backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-2xl space-y-5 relative">
          
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-800/60">
            <Lock size={15} className="text-indigo-400" />
            <h2 className="text-sm font-semibold text-zinc-200">Secure Vault Access</h2>
          </div>

          {error && (
            <div className="p-3 bg-red-950/30 border border-red-900/30 text-red-400 text-xs rounded-xl flex items-start gap-2 animate-fade-in leading-relaxed">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Email Address</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                  <User size={14} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-indigo-500 rounded-lg py-2.5 pl-10 pr-4 text-zinc-100 placeholder-zinc-700 outline-none focus:ring-1 focus:ring-indigo-500 text-xs transition-all"
                  placeholder="name@xenopulse.com"
                  required
                />
              </div>
            </div>

            {/* Password input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Secret Keyphrase</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                  <Key size={14} />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-indigo-500 rounded-lg py-2.5 pl-10 pr-4 text-zinc-100 placeholder-zinc-700 outline-none focus:ring-1 focus:ring-indigo-500 text-xs transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? "Decrypting Session..." : "Authorize Workspace"}
              <ArrowRight size={13} />
            </button>
          </form>

          {/* Quick Demo Autofill section */}
          <div className="pt-4 border-t border-zinc-800/80 space-y-3">
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono text-center">Auto-Fill Demo Credentials</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => autofillDemo("admin")}
                className="py-2 px-3 bg-zinc-950 border border-zinc-800 hover:bg-zinc-850 text-[10px] font-semibold text-indigo-400 hover:text-white rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <Shield size={10} />
                <span>Admin Space</span>
              </button>
              <button
                type="button"
                onClick={() => autofillDemo("manager")}
                className="py-2 px-3 bg-zinc-950 border border-zinc-800 hover:bg-zinc-850 text-[10px] font-semibold text-purple-400 hover:text-white rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <User size={10} />
                <span>Manager Space</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer license info */}
        <p className="text-[9px] text-center text-zinc-600 font-mono">
          Standard Hardware Cryptographic Session. Version 1.5.0
        </p>
      </div>
    </div>
  );
}
