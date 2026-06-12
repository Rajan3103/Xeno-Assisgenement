"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Sparkles, Cpu, Mail, MessageSquare, Phone, Save, 
  Send, RefreshCw, AlertCircle, CheckCircle, ArrowLeft, 
  Users, Terminal, Check
} from "lucide-react";

interface CampaignBlueprint {
  segment_name: string;
  sql_filter: string;
  campaign_name: string;
  channel: string;
  campaign_message: string;
  cta: string;
  audience_count: number;
}

export default function MarketingCommandCenterPage() {
  const [token, setToken] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  
  // Prompt input
  const [prompt, setPrompt] = useState("");
  
  // Loading & Pipeline execution states
  const [loading, setLoading] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0);
  const [pipelineText, setPipelineText] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [saving, setSaving] = useState(false);
  
  // Blueprint and edits states
  const [blueprint, setBlueprint] = useState<CampaignBlueprint | null>(null);
  const [editSegmentName, setEditSegmentName] = useState("");
  const [editCampaignName, setEditCampaignName] = useState("");
  const [editChannel, setEditChannel] = useState<"Email" | "SMS" | "WhatsApp">("Email");
  const [editMessage, setEditMessage] = useState("");
  const [editCta, setEditCta] = useState("");
  const [audienceCount, setAudienceCount] = useState(0);

  const pipelineIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Authenticate CRM
  useEffect(() => {
    handleConnectAndLoad();
    return () => {
      if (pipelineIntervalRef.current) clearInterval(pipelineIntervalRef.current);
    };
  }, []);

  const handleConnectAndLoad = async () => {
    setConnectionStatus("connecting");
    try {
      const authResponse = await fetch("http://localhost:8000/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          username: "admin@xenopulse.ai",
          password: "admin123",
        }),
      });

      if (!authResponse.ok) {
        throw new Error("CRM authentication failed.");
      }

      const authData = await authResponse.json();
      setToken(authData.access_token);
      setConnectionStatus("connected");
    } catch (err: any) {
      setConnectionStatus("disconnected");
      setError("Failed to establish CRM database connection. Ensure FastAPI backend is running.");
    }
  };

  const handleGenerateBlueprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    if (!token) {
      setError("CRM Connection is missing. Re-establish server connection before querying.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");
    setBlueprint(null);
    setPipelineStep(0);
    setPipelineText("Analyzing marketing command objective...");

    // Progressive step simulation to give an immersive pipeline feel
    const steps = [
      { text: "Analyzing marketing command objective...", duration: 1000 },
      { text: "Translating objective to target customer cohort segment criteria...", duration: 1200 },
      { text: "Compiling SQLite database scoping filters...", duration: 1000 },
      { text: "Choosing optimal delivery outreach channel...", duration: 1100 },
      { text: "Drafting promotional copy and personalized Call-to-Action (CTA)...", duration: 1300 },
      { text: "Evaluating database target audience reach volume...", duration: 800 }
    ];

    let currentStep = 0;
    const runPipeline = async () => {
      if (currentStep < steps.length) {
        setPipelineStep(currentStep + 1);
        setPipelineText(steps[currentStep].text);
        currentStep++;
        pipelineIntervalRef.current = setTimeout(runPipeline, steps[currentStep - 1].duration);
      } else {
        // Run the actual API call
        try {
          const response = await fetch("http://localhost:8000/api/v1/ai/command", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ prompt: prompt })
          });

          if (!response.ok) {
            throw new Error("Failed to compile AI Marketing blueprint.");
          }

          const data = await response.json();
          setBlueprint(data);
          // Set edit inputs
          setEditSegmentName(data.segment_name);
          setEditCampaignName(data.campaign_name);
          setEditChannel(data.channel);
          setEditMessage(data.campaign_message);
          setEditCta(data.cta);
          setAudienceCount(data.audience_count);
        } catch (err: any) {
          setError(err.message || "Pipeline execution failed.");
        } finally {
          setLoading(false);
        }
      }
    };

    runPipeline();
  };

  const handleCreateCampaign = async (statusType: "Draft" | "Active") => {
    if (!editCampaignName.trim()) {
      setError("Please specify a Campaign Name.");
      return;
    }
    if (!editSegmentName.trim()) {
      setError("Please specify a Target Segment.");
      return;
    }
    if (!editMessage.trim()) {
      setError("Please write outreach content.");
      return;
    }
    if (!token) {
      setError("CRM Backend server connection is missing.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMsg("");

    const fullMessage = JSON.stringify({
      title: editCampaignName,
      body: editMessage,
      cta: editCta
    });

    try {
      const response = await fetch("http://localhost:8000/api/v1/campaigns/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editCampaignName,
          segment: editSegmentName,
          message: fullMessage,
          channel: editChannel,
          status: statusType
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to create campaign.");
      }

      setSuccessMsg(
        statusType === "Active"
          ? `Campaign '${editCampaignName}' approved & launched successfully! Outreach dispatches have begun.`
          : `Campaign '${editCampaignName}' saved as draft.`
      );
      
      // Reset command interface
      setBlueprint(null);
      setPrompt("");
    } catch (err: any) {
      setError(err.message || "Failed to save outreach blueprint.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-slate-900 font-sans antialiased pb-20">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 pointer-events-none z-0" />
      <div className="absolute top-20 left-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Header navbar */}
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
              <div className="p-1.5 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-lg shadow-lg">
                <Cpu className="w-5 h-5 text-slate-50" />
              </div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
                XenoPulse AI
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full border border-slate-800 text-slate-400 font-mono">
                AI Marketing Command Center
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              href="/campaigns"
              className="text-xs text-slate-400 hover:text-indigo-400 transition-colors font-medium"
            >
              Campaigns
            </Link>
            <span className="text-slate-800">|</span>
            <Link 
              href="/segments"
              className="text-xs text-slate-400 hover:text-indigo-400 transition-colors font-medium"
            >
              Segments
            </Link>
            <span className="text-slate-800">|</span>
            <Link 
              href="/analytics"
              className="text-xs text-slate-400 hover:text-indigo-400 transition-colors font-medium"
            >
              Analytics
            </Link>
            
            {connectionStatus === "connected" ? (
              <span className="ml-2 w-2 h-2 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/50" title="Connected to CRM Backend" />
            ) : (
              <span className="ml-2 w-2 h-2 rounded-full bg-rose-500 shadow-md shadow-rose-500/50 animate-pulse" title="Disconnected" />
            )}
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="relative max-w-7xl mx-auto px-6 pt-10 z-10">
        
        {/* Status Alerts */}
        {error && (
          <div className="mb-8 flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-rose-400 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div><span className="font-bold">Error: </span>{error}</div>
          </div>
        )}
        {successMsg && (
          <div className="mb-8 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-emerald-400 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>{successMsg}</div>
          </div>
        )}

        {/* AI Console Entry block */}
        {!blueprint && !loading && (
          <div className="max-w-3xl mx-auto text-center py-16">
            <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl shadow-xl shadow-indigo-500/10 mb-6 border border-indigo-400/25">
              <Terminal className="w-7 h-7 text-slate-50" />
            </div>
            
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-b from-slate-50 via-slate-100 to-slate-400 bg-clip-text text-transparent mb-3">
              AI Marketing Command Console
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed mb-8 max-w-xl mx-auto">
              Type your high-level marketing directive below. Gemini will build the segment criteria, draft copy, select channels, and output a complete blueprint.
            </p>

            <form onSubmit={handleGenerateBlueprint} className="relative w-full max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-2.5 flex items-center gap-3 hover:border-slate-700/80 focus-within:border-indigo-500/60 shadow-xl transition-all">
              <input 
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Increase repeat purchases among premium shoppers..."
                className="flex-1 bg-transparent border-none text-slate-100 outline-none placeholder:text-slate-550 text-sm px-3 h-11"
              />
              <button
                type="submit"
                disabled={!prompt.trim() || connectionStatus !== "connected"}
                className="h-11 flex items-center justify-center gap-1.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-slate-800 disabled:to-slate-800 text-slate-50 disabled:text-slate-500 font-bold text-xs shadow-lg hover:shadow-indigo-500/10 transition-all cursor-pointer active:scale-97 disabled:scale-100"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Initialize AI Blueprint
              </button>
            </form>

            {/* Prompt presets */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-8 max-w-xl mx-auto">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Quick Prompts:</span>
              {[
                "Increase repeat purchases among premium shoppers.",
                "Re-engage inactive leads on WhatsApp.",
                "Nurture recent orders segment with custom feedback templates."
              ].map((pst, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(pst)}
                  className="text-xs px-3.5 py-1.5 rounded-full border border-slate-900 bg-slate-900/40 hover:bg-slate-900 hover:border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  "{pst}"
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pipeline Execution Loading State */}
        {loading && (
          <div className="max-w-xl mx-auto py-24 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 border-[3px] border-indigo-650 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-8 shadow-inner" />
            
            <span className="text-xs font-mono font-bold tracking-widest text-indigo-400 uppercase mb-2 animate-pulse">
              Pipeline Step {pipelineStep} / 6
            </span>
            <h3 className="text-base font-bold text-slate-200 mb-1">{pipelineText}</h3>
            <span className="text-[11px] text-slate-500 font-medium">Asassembling cohort parameters using Gemini models...</span>
          </div>
        )}

        {/* Campaign Blueprint Approval Screen */}
        {blueprint && !loading && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between gap-4 mb-8">
              <div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-indigo-400 uppercase">
                  AI Compiled Outreach Blueprint
                </span>
                <h1 className="text-2xl font-black text-slate-100 tracking-tight mt-1">
                  Campaign Approval Screen
                </h1>
              </div>
              <button
                onClick={() => setBlueprint(null)}
                className="text-xs px-3.5 py-1.5 border border-slate-850 bg-slate-900/40 hover:bg-slate-900 rounded-xl text-slate-400 hover:text-slate-200 font-semibold transition-colors"
              >
                Discard Blueprint
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Panel: Segment Definition & Scoping */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                
                {/* Cohort Scoping Criteria Card */}
                <div className="rounded-2xl border border-slate-800/80 bg-slate-900/30 backdrop-blur-xl p-6 shadow-xl">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-5 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-400" />
                    Target Segment Definition
                  </h3>

                  <div className="flex flex-col gap-5">
                    {/* Segment Name (Editable) */}
                    <div className="flex flex-col gap-2">
                      <label htmlFor="edit-segment-name" className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        Segment Name
                      </label>
                      <input 
                        type="text"
                        id="edit-segment-name"
                        value={editSegmentName}
                        onChange={(e) => setEditSegmentName(e.target.value)}
                        className="h-10 px-3 rounded-xl border border-slate-850 bg-slate-950 text-xs text-slate-200 outline-none focus:border-indigo-500/50 transition-colors"
                      />
                    </div>

                    {/* SQLite Condition (Read-only) */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        Scoping SQL filter Condition
                      </label>
                      <pre className="text-[10px] text-slate-405 text-indigo-300 font-mono bg-slate-950/70 p-3 rounded-xl border border-slate-850/80 overflow-x-auto whitespace-pre-wrap select-all">
                        {blueprint.sql_filter}
                      </pre>
                    </div>

                    {/* Projected Reach Card */}
                    <div className="p-4 rounded-xl border border-indigo-500/15 bg-indigo-550/5 bg-indigo-950/20 text-center flex flex-col justify-between items-center shadow-md">
                      <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-1">
                        Projected Reach
                      </span>
                      <span className="text-3xl font-black text-indigo-400">{audienceCount}</span>
                      <span className="text-[10px] text-slate-500 font-medium mt-1">matching database customer records</span>
                    </div>
                  </div>
                </div>

                {/* Approve triggers */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => handleCreateCampaign("Active")}
                    disabled={saving}
                    className="h-12 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-slate-50 font-bold text-sm shadow-xl shadow-indigo-600/15 transition-all cursor-pointer active:scale-98"
                  >
                    {saving ? (
                      <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Approve & Launch Campaign
                  </button>

                  <button
                    onClick={() => handleCreateCampaign("Draft")}
                    disabled={saving}
                    className="h-11 flex items-center justify-center gap-2 rounded-xl border border-slate-850 hover:border-slate-800 bg-slate-900/30 hover:bg-slate-900/60 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4 text-slate-400" />
                    Save Blueprint as Draft
                  </button>
                </div>

              </div>

              {/* Right Panel: Outreach Campaign Customizer & Previews */}
              <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                
                {/* Editor Settings Card */}
                <div className="md:col-span-6 rounded-2xl border border-slate-800/80 bg-slate-900/30 backdrop-blur-xl p-6 shadow-xl flex flex-col gap-5">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider border-b border-slate-850 pb-3">
                    Outreach Customizer
                  </h3>

                  {/* Campaign Title (Editable) */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="edit-campaign-name" className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Campaign Subject/Name
                    </label>
                    <input 
                      type="text"
                      id="edit-campaign-name"
                      value={editCampaignName}
                      onChange={(e) => setEditCampaignName(e.target.value)}
                      className="h-10 px-3 rounded-xl border border-slate-850 bg-slate-950 text-xs text-slate-200 outline-none focus:border-indigo-500/50 transition-colors"
                    />
                  </div>

                  {/* Outreach Channel selector */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Communication Channel
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { id: "Email", icon: Mail, color: "text-blue-400" },
                        { id: "SMS", icon: MessageSquare, color: "text-pink-400" },
                        { id: "WhatsApp", icon: Phone, color: "text-emerald-400" }
                      ].map((ch) => {
                        const Icon = ch.icon;
                        const active = editChannel === ch.id;
                        return (
                          <button
                            type="button"
                            key={ch.id}
                            onClick={() => setEditChannel(ch.id as any)}
                            className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-[10px] font-bold transition-all ${
                              active 
                                ? "bg-slate-900 border-indigo-500/40 text-slate-100 shadow-md shadow-indigo-550/5"
                                : "bg-slate-950 border-slate-850 text-slate-450 hover:bg-slate-900/40"
                            }`}
                          >
                            <Icon className={`w-4 h-4 ${ch.color}`} />
                            {ch.id}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Message Copy Body (Editable) */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="edit-message-body" className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Outreach promotional message
                    </label>
                    <textarea 
                      id="edit-message-body"
                      value={editMessage}
                      onChange={(e) => setEditMessage(e.target.value)}
                      rows={5}
                      className="w-full rounded-xl border border-slate-855 bg-slate-950/70 p-3 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-indigo-500/50 transition-colors resize-none"
                    />
                  </div>

                  {/* Call to Action Text */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="edit-cta-text" className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      CTA Link/Action Text
                    </label>
                    <input 
                      type="text"
                      id="edit-cta-text"
                      value={editCta}
                      onChange={(e) => setEditCta(e.target.value)}
                      className="h-10 px-3 rounded-xl border border-slate-855 bg-slate-950 text-xs text-slate-200 outline-none focus:border-indigo-500/50 transition-colors"
                    />
                  </div>
                </div>

                {/* Real-time device mockup panel */}
                <div className="md:col-span-6 flex flex-col items-center w-full">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-4 self-start">
                    Device Mockup Preview
                  </span>

                  <div className="w-full flex justify-center items-center h-[350px] rounded-2xl border border-slate-855 bg-slate-900/10 backdrop-blur-xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />

                    {/* EMAIL MOCK */}
                    {editChannel === "Email" && (
                      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 mb-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                            <Mail className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-[9px] text-slate-500 font-sans">Subject Line Preview:</div>
                            <div className="text-xs font-bold text-slate-200 mt-0.5">
                              {editCampaignName || "Exclusive Offer"}
                            </div>
                          </div>
                        </div>
                        <div className="min-h-[120px] flex flex-col justify-between">
                          <p className="text-[11px] text-slate-400 leading-relaxed font-sans select-text whitespace-pre-wrap">
                            {editMessage || "Message body preview..."}
                          </p>
                          <div className="text-center mt-4">
                            <button 
                              type="button" 
                              className="px-4 py-2 rounded-lg bg-blue-650 hover:bg-blue-600 text-slate-50 text-[10px] font-semibold cursor-default"
                            >
                              {editCta || "CTA Button"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SMS MOCK */}
                    {editChannel === "SMS" && (
                      <div className="w-[220px] h-[320px] border-[5px] border-slate-800 bg-slate-950 rounded-[25px] shadow-2xl relative overflow-hidden flex flex-col justify-between animate-in fade-in zoom-in-95 duration-200">
                        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-10 h-3 bg-slate-800 rounded-full flex items-center justify-center z-20" />
                        <div className="h-8 pt-3 bg-slate-900 border-b border-slate-850 flex items-center justify-center text-[9px] text-slate-400 font-semibold tracking-tight">
                          XenoPulse CRM
                        </div>
                        <div className="flex-1 p-3 flex flex-col justify-end bg-slate-950">
                          <div className="max-w-[90%] rounded-xl rounded-bl-sm bg-slate-900 border border-slate-800 p-2.5 text-[9px] text-slate-200 leading-relaxed font-sans relative shadow-md">
                            <p className="select-text whitespace-pre-wrap">{editMessage || "SMS text body..."}</p>
                            {editCta && (
                              <div className="mt-1 text-indigo-400 font-medium underline flex items-center gap-0.5">
                                {editCta}
                                <Send className="w-2 h-2" />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="h-4 flex items-center justify-center bg-slate-900 border-t border-slate-850">
                          <div className="w-16 h-0.5 bg-slate-700 rounded-full" />
                        </div>
                      </div>
                    )}

                    {/* WHATSAPP MOCK */}
                    {editChannel === "WhatsApp" && (
                      <div className="w-full max-w-xs bg-slate-950 border border-slate-850 rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col">
                        <div className="px-3 py-2.5 bg-emerald-900/30 border-b border-emerald-500/10 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                              <Phone className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-200">XenoPulse AI</div>
                              <div className="text-[9px] text-emerald-450 text-emerald-400 flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                Online
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="p-3 min-h-[140px] bg-slate-950 flex flex-col justify-end">
                          <div className="max-w-[90%] rounded-xl rounded-tl-sm bg-emerald-950/20 border border-emerald-500/10 p-3 shadow-md relative">
                            <h4 className="text-[10px] font-bold text-emerald-400 mb-1 tracking-tight uppercase">
                              {editCampaignName || "Notification"}
                            </h4>
                            <p className="text-[10px] text-slate-300 leading-relaxed font-sans select-text whitespace-pre-wrap">
                              {editMessage || "Outreach messaging..."}
                            </p>
                            {editCta && (
                              <div className="mt-2.5 pt-2 border-t border-emerald-500/10 text-center text-[9px] font-bold text-emerald-400 tracking-wide cursor-default">
                                {editCta}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
