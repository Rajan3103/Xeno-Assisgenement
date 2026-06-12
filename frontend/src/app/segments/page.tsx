"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Sparkles, Cpu, Users, Database, ChevronRight, 
  RefreshCw, AlertCircle, Check, Lock, ArrowLeft 
} from "lucide-react";

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: string;
  created_at: string;
}

const PRESETS = [
  "Customers who spent above ₹5000 last month",
  "Dormant customers with status Inactive",
  "New leads created recently",
  "VIP buyers with status Customer"
];

export default function SegmentsPage() {
  const [prompt, setPrompt] = useState("");
  const [token, setToken] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sqlFilter, setSqlFilter] = useState("");
  const [audienceCount, setAudienceCount] = useState<number | null>(null);
  const [sampleCustomers, setSampleCustomers] = useState<Customer[]>([]);

  // Attempt automatic auth on mount for seamless local developer testing
  useEffect(() => {
    handleConnect();
  }, []);

  const handleConnect = async () => {
    setConnectionStatus("connecting");
    setError("");
    try {
      const response = await fetch("http://localhost:8000/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          username: "admin@xenopulse.ai",
          password: "admin123",
        }),
      });

      if (!response.ok) {
        throw new Error("Credentials connection failed. Ensure FastAPI is running on port 8000.");
      }

      const data = await response.json();
      setToken(data.access_token);
      setConnectionStatus("connected");
    } catch (err: any) {
      setConnectionStatus("disconnected");
      setError(err.message || "Failed to establish database backend connection.");
    }
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;
    if (!token) {
      setError("Please connect/authenticate to the backend CRM first.");
      return;
    }

    setLoading(true);
    setError("");
    setSqlFilter("");
    setAudienceCount(null);
    setSampleCustomers([]);

    try {
      const response = await fetch("http://localhost:8000/api/v1/ai/segment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "AI segment translation request failed.");
      }

      const data = await response.json();
      setSqlFilter(data.sql_filter);
      setAudienceCount(data.audience_count);
      setSampleCustomers(data.sample_customers);
    } catch (err: any) {
      setError(err.message || "An error occurred while compiling AI segment.");
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (preset: string) => {
    setPrompt(preset);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-slate-900 font-sans antialiased pb-20">
      {/* Background radial overlay for rich aesthetic gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 pointer-events-none z-0" />
      <div className="absolute top-10 left-10 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Header */}
      <header className="relative border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-slate-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-lg shadow-lg shadow-indigo-500/20">
                <Cpu className="w-5 h-5 text-slate-50" />
              </div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
                XenoPulse AI
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full border border-slate-800 text-slate-400 font-mono">
                Segment Engine
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              href="/command"
              className="text-xs text-slate-450 hover:text-indigo-400 transition-colors font-medium"
            >
              Command Center
            </Link>
            <span className="text-slate-800">|</span>
            <Link 
              href="/campaigns"
              className="text-xs text-slate-455 text-slate-400 hover:text-indigo-400 transition-colors font-medium"
            >
              Campaigns
            </Link>
            <span className="text-slate-800">|</span>
            <Link 
              href="/analytics"
              className="text-xs text-slate-455 text-slate-400 hover:text-indigo-400 transition-colors font-medium mr-2"
            >
              Analytics
            </Link>

            {/* Authentication Badge */}
            {connectionStatus === "connected" ? (

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium font-sans">
                <Check className="w-3.5 h-3.5" />
                CRM Connected
              </div>
            ) : connectionStatus === "connecting" ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Connecting...
              </div>
            ) : (
              <button 
                onClick={handleConnect}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 text-xs font-medium transition-all active:scale-95"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                Connect CRM Admin
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative max-w-7xl mx-auto px-6 pt-12 z-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Hand Input Panel */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/30 backdrop-blur-xl p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Build with AI
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              Enter a description of the target customer segment. Our AI translator generates database queries instantly.
            </p>

            <form onSubmit={handleGenerate} className="flex flex-col gap-4">
              <div className="relative group">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., Customers who spent above ₹5000 last month..."
                  rows={4}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/60 transition-all resize-none shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !prompt.trim() || connectionStatus !== "connected"}
                className="w-full flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-slate-800 disabled:to-slate-800 text-slate-50 text-sm font-semibold shadow-lg shadow-indigo-600/15 disabled:shadow-none transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:text-slate-500"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                    Analyzing Data...
                  </>
                ) : (
                  <>
                    Generate Segment
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Preset Prompts */}
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/10 p-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Preset Quick-Starts
            </h3>
            <div className="flex flex-col gap-2.5">
              {PRESETS.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => applyPreset(preset)}
                  className="w-full text-left text-xs text-slate-400 hover:text-indigo-400 p-2.5 rounded-lg border border-slate-800/40 hover:border-indigo-500/20 bg-slate-900/20 hover:bg-indigo-950/10 transition-all active:scale-[0.99] truncate"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Right Hand Output Panel */}
        <section className="lg:col-span-7 flex flex-col gap-8">
          
          {/* Error Banner */}
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-rose-400 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Request Error: </span>
                {error}
              </div>
            </div>
          )}

          {/* Results State */}
          {sqlFilter || audienceCount !== null ? (
            <div className="flex flex-col gap-8 animate-in fade-in duration-300">
              
              {/* Audience Preview & SQL Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
                
                {/* Count Card */}
                <div className="sm:col-span-4 rounded-2xl border border-slate-800/80 bg-slate-900/30 backdrop-blur-xl p-6 flex flex-col justify-center shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-2xl" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    Audience Size
                  </span>
                  <div className="text-3xl font-extrabold text-slate-50 tracking-tight flex items-baseline gap-1">
                    {audienceCount !== null ? audienceCount.toLocaleString() : "—"}
                    <span className="text-xs font-normal text-slate-500">matches</span>
                  </div>
                </div>

                {/* SQL Code Block */}
                <div className="sm:col-span-8 rounded-2xl border border-slate-800/80 bg-slate-900/30 backdrop-blur-xl p-6 shadow-lg flex flex-col">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2">
                    <Database className="w-3.5 h-3.5 text-indigo-400" />
                    SQL Query Filter
                  </span>
                  <div className="flex-1 rounded-lg bg-slate-950/80 border border-slate-900 p-3.5 font-mono text-[11px] text-indigo-300 overflow-x-auto select-all shadow-inner leading-relaxed break-all max-h-36 overflow-y-auto">
                    <span className="text-slate-500">SELECT * FROM customers WHERE owner_id = X AND (</span>
                    <span className="text-indigo-200">{sqlFilter}</span>
                    <span className="text-slate-500">)</span>
                  </div>
                </div>

              </div>

              {/* Sample Customers Grid Table */}
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/30 backdrop-blur-xl shadow-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-400" />
                    Sample Audience Matches
                  </h3>
                  <span className="text-[11px] font-mono text-slate-500">
                    Showing top {sampleCustomers.length} records
                  </span>
                </div>
                
                <div className="overflow-x-auto">
                  {sampleCustomers.length > 0 ? (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800/40 text-slate-400 bg-slate-950/20 font-medium">
                          <th className="px-6 py-3">Customer Name</th>
                          <th className="px-6 py-3">Email</th>
                          <th className="px-6 py-3">Company</th>
                          <th className="px-6 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/30">
                        {sampleCustomers.map((cust) => (
                          <tr 
                            key={cust.id} 
                            className="hover:bg-slate-900/40 text-slate-300 transition-colors"
                          >
                            <td className="px-6 py-3.5 font-medium text-slate-100">{cust.name}</td>
                            <td className="px-6 py-3.5 font-mono text-slate-400">{cust.email}</td>
                            <td className="px-6 py-3.5 text-slate-400">{cust.company || "—"}</td>
                            <td className="px-6 py-3.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                                cust.status === "Customer" 
                                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                                  : cust.status === "Proposal"
                                  ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                                  : cust.status === "Contacted"
                                  ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                                  : cust.status === "Lead"
                                  ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                                  : "bg-slate-500/10 border-slate-500/20 text-slate-400"
                              }`}>
                                {cust.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-8 text-center text-slate-500 text-sm">
                      No customer matches found for this query filter.
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            // Empty State view placeholder before generating
            <div className="flex-1 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800/80 bg-slate-900/10 p-12 text-center h-[350px]">
              <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 mb-4 shadow-md">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-200 mb-1">
                Audience Preview Screen
              </h4>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                Provide a prompt and click generate to preview audience segments, query structures, and sample matches.
              </p>
            </div>
          )}

        </section>

      </main>
    </div>
  );
}
