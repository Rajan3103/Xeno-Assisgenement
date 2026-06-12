"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Sparkles, Cpu, Mail, MessageSquare, Phone, Save, 
  Send, RefreshCw, AlertCircle, CheckCircle, ArrowLeft, 
  Users, Layers, Clock
} from "lucide-react";

interface Campaign {
  id: number;
  name: string;
  segment: string;
  message: string;
  channel: string;
  status: string;
  created_at: string;
}

const SEGMENT_PRESETS = [
  { name: "VIP Customers", prompt: "Customers who spent above ₹5000 last month" },
  { name: "Inactive Leads", prompt: "Dormant customers with status Inactive" },
  { name: "Active Buyers", prompt: "VIP buyers with status Customer" }
];

export default function CampaignBuilderPage() {
  const [token, setToken] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  
  // Form State
  const [campaignName, setCampaignName] = useState("");
  const [segmentText, setSegmentText] = useState("");
  const [channel, setChannel] = useState<"Email" | "SMS" | "WhatsApp">("Email");
  const [status, setStatus] = useState<"Draft" | "Active">("Draft");

  // AI Generated Output State
  const [aiTitle, setAiTitle] = useState("");
  const [aiMessage, setAiMessage] = useState("");
  const [aiCta, setAiCta] = useState("");

  // Loading/Status State
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Saved campaigns list
  const [savedCampaigns, setSavedCampaigns] = useState<Campaign[]>([]);

  // Selected Campaign for Analytics
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [selectedCampaignAnalytics, setSelectedCampaignAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [launchLoadingCampaignId, setLaunchLoadingCampaignId] = useState<number | null>(null);

  const fetchCampaignAnalytics = async (campaignId: number, accessToken: string) => {
    setAnalyticsLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/v1/campaigns/${campaignId}/analytics`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedCampaignAnalytics(data);
      }
    } catch (err) {
      console.error("Failed to fetch campaign analytics:", err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleLaunchCampaign = async (e: React.MouseEvent, campaignId: number) => {
    e.stopPropagation(); // Prevent row selection trigger
    if (!token) {
      setError("CRM Backend server connection is missing.");
      return;
    }
    
    setLaunchLoadingCampaignId(campaignId);
    setError("");
    setSuccessMsg("");
    
    try {
      const response = await fetch(`http://localhost:8000/api/v1/campaigns/${campaignId}/launch`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to trigger campaign launch.");
      }
      
      const updatedCampaign = await response.json();
      setSuccessMsg(`Campaign successfully launched! Audience segment messages are dispatching.`);
      
      // Update locally
      setSavedCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status: "Active" } : c));
      
      // If the launched campaign is the selected one, refresh its analytics
      if (selectedCampaign && selectedCampaign.id === campaignId) {
        setSelectedCampaign({ ...selectedCampaign, status: "Active" });
        fetchCampaignAnalytics(campaignId, token);
      }
    } catch (err: any) {
      setError(err.message || "Failed to launch campaign.");
    } finally {
      setLaunchLoadingCampaignId(null);
    }
  };

  const handleSelectCampaign = (camp: Campaign) => {
    if (selectedCampaign && selectedCampaign.id === camp.id) {
      setSelectedCampaign(null);
      setSelectedCampaignAnalytics(null);
    } else {
      setSelectedCampaign(camp);
      setSelectedCampaignAnalytics(null);
      if (token) {
        fetchCampaignAnalytics(camp.id, token);
      }
    }
  };

  // Auto connect and load campaigns on mount
  useEffect(() => {
    handleConnectAndLoad();
  }, []);


  const handleConnectAndLoad = async () => {
    setConnectionStatus("connecting");
    try {
      // 1. Authenticate to backend
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
      const accessToken = authData.access_token;
      setToken(accessToken);
      setConnectionStatus("connected");

      // 2. Fetch saved campaigns list
      fetchCampaigns(accessToken);

    } catch (err: any) {
      setConnectionStatus("disconnected");
      setError("Failed to establish CRM database connection. Ensure FastAPI backend is running.");
    }
  };

  const fetchCampaigns = async (accessToken: string) => {
    try {
      const response = await fetch("http://localhost:8000/api/v1/campaigns/?limit=10", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSavedCampaigns(data);
      }
    } catch (err) {
      console.error("Failed to fetch campaigns list:", err);
    }
  };

  const handleGenerateAI = async () => {
    if (!segmentText.trim()) {
      setError("Please select or describe a target audience segment first.");
      return;
    }
    if (!token) {
      setError("Not connected to backend CRM server.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const response = await fetch("http://localhost:8000/api/v1/ai/draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ audience_profile: segmentText }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "AI copy generation request failed.");
      }

      const data = await response.json();
      setAiTitle(data.campaign_title);
      setAiMessage(data.campaign_message);
      setAiCta(data.cta);
    } catch (err: any) {
      setError(err.message || "An error occurred while compiling AI draft copies.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName.trim()) {
      setError("Please enter a campaign name.");
      return;
    }
    if (!segmentText.trim()) {
      setError("Please select or specify a target segment.");
      return;
    }
    if (!aiMessage.trim()) {
      setError("Please generate campaign copy with AI first before saving.");
      return;
    }
    if (!token) {
      setError("CRM Backend server connection is missing.");
      return;
    }

    setSaveLoading(true);
    setError("");
    setSuccessMsg("");

    // Package message body with title & cta for comprehensive database logging
    const fullMessage = JSON.stringify({
      title: aiTitle,
      body: aiMessage,
      cta: aiCta
    });

    try {
      const response = await fetch("http://localhost:8000/api/v1/campaigns/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: campaignName,
          segment: segmentText,
          message: fullMessage,
          channel: channel,
          status: status
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to save campaign.");
      }

      setSuccessMsg(`Campaign '${campaignName}' successfully saved to database!`);
      // Reset form variables
      setCampaignName("");
      setSegmentText("");
      setAiTitle("");
      setAiMessage("");
      setAiCta("");
      
      // Refresh list
      fetchCampaigns(token);
    } catch (err: any) {
      setError(err.message || "Failed to persist campaign record.");
    } finally {
      setSaveLoading(false);
    }
  };

  const parseMessage = (msgStr: string) => {
    try {
      const parsed = JSON.parse(msgStr);
      return parsed.body || msgStr;
    } catch {
      return msgStr;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-slate-900 font-sans antialiased pb-20">
      {/* Visual radial lighting overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 pointer-events-none z-0" />
      <div className="absolute top-20 left-20 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none z-0" />

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
                Campaign Builder
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
              href="/segments"
              className="text-xs text-slate-455 text-slate-400 hover:text-indigo-400 transition-colors font-medium"
            >
              Segments
            </Link>
            <span className="text-slate-800">|</span>
            <Link 
              href="/analytics"
              className="text-xs text-slate-455 text-slate-400 hover:text-indigo-400 transition-colors font-medium mr-2"
            >
              Analytics
            </Link>

            {connectionStatus === "connected" ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <CheckCircle className="w-3.5 h-3.5" />
                CRM Connected
              </div>
            ) : connectionStatus === "connecting" ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Connecting...
              </div>
            ) : (
              <button 
                onClick={handleConnectAndLoad}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium"
              >
                Reconnect CRM
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Layout Grid */}
      <main className="relative max-w-7xl mx-auto px-6 pt-10 z-10">
        
        {/* Status Alerts Block */}
        {error && (
          <div className="mb-8 flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-rose-400 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div><span className="font-semibold">Error: </span>{error}</div>
          </div>
        )}
        {successMsg && (
          <div className="mb-8 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-emerald-400 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>{successMsg}</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Hand: Campaign Configuration Form */}
          <section className="lg:col-span-6 rounded-2xl border border-slate-800/80 bg-slate-900/30 backdrop-blur-xl p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2 mb-6 border-b border-slate-800/50 pb-3">
              <Sparkles className="w-4.5 h-4.5 text-indigo-400" />
              Configure Campaign
            </h2>

            <form onSubmit={handleSaveCampaign} className="flex flex-col gap-6">
              
              {/* Campaign Name */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g., Summer VIP discount outreach..."
                  className="h-10 px-3.5 rounded-xl border border-slate-800 bg-slate-950/70 text-sm text-slate-100 outline-none focus:border-indigo-500/55 focus:ring-1 focus:ring-indigo-500/55 transition-all"
                />
              </div>

              {/* Segment Dropdown */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                  Target Segment Query
                </label>
                <div className="flex flex-col gap-2.5">
                  <select
                    onChange={(e) => setSegmentText(e.target.value)}
                    value={segmentText}
                    className="h-10 px-3 rounded-xl border border-slate-800 bg-slate-950 text-sm text-slate-300 outline-none focus:border-indigo-500/55 focus:ring-1 focus:ring-indigo-500/55 transition-all"
                  >
                    <option value="">-- Select Target Audience --</option>
                    {SEGMENT_PRESETS.map((preset, index) => (
                      <option key={index} value={preset.prompt}>
                        {preset.name} ({preset.prompt})
                      </option>
                    ))}
                    <option value="Custom prompt">Custom Segment Filter</option>
                  </select>
                  
                  {/* Textarea for custom queries or adjustments */}
                  <textarea
                    value={segmentText}
                    onChange={(e) => setSegmentText(e.target.value)}
                    placeholder="Describe segment criteria (e.g. Customers who spent above ₹5000 last month)..."
                    rows={2}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-indigo-500/55 focus:ring-1 focus:ring-indigo-500/55 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Channel Select Radio Cards */}
              <div className="flex flex-col gap-2.5">
                <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                  Marketing Channel
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "Email", icon: Mail, color: "text-blue-400", bg: "hover:bg-blue-500/5 hover:border-blue-500/30" },
                    { id: "SMS", icon: MessageSquare, color: "text-pink-400", bg: "hover:bg-pink-500/5 hover:border-pink-500/30" },
                    { id: "WhatsApp", icon: Phone, color: "text-emerald-400", bg: "hover:bg-emerald-500/5 hover:border-emerald-500/30" }
                  ].map((ch) => {
                    const Icon = ch.icon;
                    const active = channel === ch.id;
                    return (
                      <button
                        type="button"
                        key={ch.id}
                        onClick={() => setChannel(ch.id as any)}
                        className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border text-xs font-semibold transition-all active:scale-[0.97] ${
                          active 
                            ? "bg-slate-900 border-indigo-500/50 shadow-md text-slate-100 shadow-indigo-500/10" 
                            : `bg-slate-950/40 border-slate-800 text-slate-400 ${ch.bg}`
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${ch.color}`} />
                        {ch.id}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-800/50 pt-6 mt-2">
                <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={loading || !segmentText.trim() || connectionStatus !== "connected"}
                  className="h-11 flex items-center justify-center gap-2 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 disabled:border-slate-900 text-slate-300 disabled:text-slate-600 disabled:cursor-not-allowed transition-all font-semibold text-sm active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-500" />
                      Drafting Copy...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      Write with Gemini
                    </>
                  )}
                </button>

                <button
                  type="submit"
                  disabled={saveLoading || !campaignName.trim() || !aiMessage.trim() || connectionStatus !== "connected"}
                  className="h-11 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-slate-800 disabled:to-slate-800 text-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed font-semibold text-sm shadow-lg shadow-indigo-600/10 disabled:shadow-none transition-all active:scale-[0.98]"
                >
                  {saveLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Campaign
                    </>
                  )}
                </button>
              </div>

              {/* Status Selector */}
              <div className="flex items-center gap-4 justify-end text-xs text-slate-500 font-medium font-sans">
                <span>Status when saved:</span>
                <div className="flex rounded-lg border border-slate-850 p-0.5 bg-slate-950">
                  {["Draft", "Active"].map((st) => (
                    <button
                      type="button"
                      key={st}
                      onClick={() => setStatus(st as any)}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        status === st 
                          ? "bg-slate-900 text-slate-200 border border-slate-800 font-semibold" 
                          : "text-slate-500 hover:text-slate-400"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

            </form>
          </section>

          {/* Right Hand: Dynamic Layout Mockup Preview */}
          <section className="lg:col-span-6 flex flex-col gap-6 items-center w-full">
            <h3 className="text-xs font-semibold tracking-wider text-slate-500 uppercase self-start">
              Outreach Channel Live Preview
            </h3>

            {/* Dynamic Card Previews */}
            <div className="w-full flex justify-center items-center h-[420px] rounded-2xl border border-slate-800/80 bg-slate-900/10 backdrop-blur-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />

              {/* EMAIL CHANNEL PREVIEW */}
              {channel === "Email" && (
                <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl p-5 animate-in fade-in zoom-in-95 duration-200">
                  {/* Top Header Mock */}
                  <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-4 mb-4">
                    <div className="w-9 h-9 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <Mail className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-sans">Subject Line Preview:</div>
                      <div className="text-sm font-bold text-slate-200 mt-0.5">
                        {aiTitle || "Exclusive Offer Inside"}
                      </div>
                    </div>
                  </div>
                  {/* Body Content */}
                  <div className="min-h-[160px] flex flex-col justify-between">
                    <p className="text-xs text-slate-400 leading-relaxed font-sans select-text whitespace-pre-wrap">
                      {aiMessage || "Your AI generated message layout will render here. Choose a target segment and trigger Gemini content compilation."}
                    </p>
                    {/* CTA Button */}
                    <div className="text-center mt-6">
                      <button 
                        type="button" 
                        className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-slate-50 text-xs font-semibold shadow-md cursor-default"
                      >
                        {aiCta || "Outreach CTA Link"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SMS CHANNEL PREVIEW (iPhone Mockup) */}
              {channel === "SMS" && (
                <div className="w-[260px] h-[400px] border-[6px] border-slate-800 bg-slate-950 rounded-[30px] shadow-2xl relative overflow-hidden flex flex-col justify-between animate-in fade-in zoom-in-95 duration-200">
                  {/* Phone Speaker Mock */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-14 h-4 bg-slate-800 rounded-full flex items-center justify-center z-20">
                    <div className="w-8 h-1 bg-slate-950 rounded-full" />
                  </div>
                  {/* Phone Header screen */}
                  <div className="h-10 pt-4 bg-slate-900 border-b border-slate-850 flex items-center justify-center text-[10px] text-slate-400 font-semibold tracking-tight">
                    XenoPulse CRM
                  </div>
                  {/* Chat Message Window */}
                  <div className="flex-1 p-3 flex flex-col justify-end bg-slate-950 overflow-y-auto">
                    {/* SMS bubble */}
                    <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-slate-900 border border-slate-800 p-3 text-[10px] text-slate-200 leading-relaxed font-sans relative shadow-md">
                      <p className="select-text whitespace-pre-wrap">{aiMessage || "Click generate to draft custom copy."}</p>
                      {aiCta && (
                        <div className="mt-2 text-indigo-400 font-medium underline flex items-center gap-0.5">
                          {aiCta}
                          <Send className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Phone Footer bar */}
                  <div className="h-6 flex items-center justify-center bg-slate-900 border-t border-slate-850">
                    <div className="w-20 h-1 bg-slate-700 rounded-full" />
                  </div>
                </div>
              )}

              {/* WHATSAPP PREVIEW (Android Style) */}
              {channel === "WhatsApp" && (
                <div className="w-full max-w-sm bg-slate-950 border border-slate-850 rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col">
                  {/* WhatsApp Header bar */}
                  <div className="px-4 py-3 bg-emerald-900/30 border-b border-emerald-500/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-200">XenoPulse AI</div>
                        <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Online
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Chat Room Area */}
                  <div className="p-4 min-h-[180px] bg-slate-950 flex flex-col justify-end">
                    <div className="max-w-[90%] rounded-xl rounded-tl-sm bg-emerald-950/20 border border-emerald-500/10 p-3.5 shadow-md relative">
                      <h4 className="text-[11px] font-bold text-emerald-400 mb-1.5 tracking-tight uppercase">
                        {aiTitle || "Marketing Notification"}
                      </h4>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-sans select-text whitespace-pre-wrap">
                        {aiMessage || "Select segments and compile copies."}
                      </p>
                      {aiCta && (
                        <div className="mt-3 pt-2.5 border-t border-emerald-500/10 text-center text-[10px] font-bold text-emerald-400 tracking-wide hover:underline cursor-default">
                          {aiCta}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </section>

        </div>

        {/* Real-time Campaign Analytics Dashboard */}
        <section className="mt-12 rounded-2xl border border-slate-800/80 bg-slate-900/30 backdrop-blur-xl p-6 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800/50 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-200">
                Campaign Performance Analytics
              </h3>
            </div>
            {selectedCampaign && (
              <button
                onClick={() => token && fetchCampaignAnalytics(selectedCampaign.id, token)}
                disabled={analyticsLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 disabled:text-slate-600 disabled:cursor-not-allowed transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${analyticsLoading ? "animate-spin text-slate-500" : "text-indigo-400"}`} />
                Refresh Statistics
              </button>
            )}
          </div>

          {selectedCampaign ? (
            <div className="animate-in fade-in duration-200">
              {/* Campaign Header details */}
              <div className="flex flex-wrap items-center gap-3 mb-6 bg-slate-950/45 p-3 rounded-xl border border-slate-850/60">
                <span className="text-xs text-slate-400 font-medium font-sans">Active Campaign:</span>
                <span className="text-xs font-bold text-slate-100">{selectedCampaign.name}</span>
                <span className="text-slate-700">|</span>
                <span className="text-xs text-slate-400 font-sans">Channel:</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-indigo-300 font-medium font-sans flex items-center gap-1 flex-row">
                  {selectedCampaign.channel === "Email" ? <Mail className="w-3 h-3 text-blue-400" /> : selectedCampaign.channel === "SMS" ? <MessageSquare className="w-3 h-3 text-pink-400" /> : <Phone className="w-3 h-3 text-emerald-400" />}
                  {selectedCampaign.channel}
                </span>
                <span className="text-slate-700">|</span>
                <span className="text-xs text-slate-400 font-sans">Status:</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${selectedCampaign.status === "Active" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-slate-500/10 border-slate-500/20 text-slate-400"}`}>
                  {selectedCampaign.status}
                </span>
              </div>

              {analyticsLoading && !selectedCampaignAnalytics ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                  <span className="text-xs text-slate-500 font-medium">Fetching real-time aggregates...</span>
                </div>
              ) : selectedCampaignAnalytics ? (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  {/* Left part: Progress Rates */}
                  <div className="md:col-span-6 grid grid-cols-1 gap-5">
                    {/* Delivery Rate */}
                    <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-850">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-slate-400">Audience Delivery Rate</span>
                        <span className="text-sm font-bold text-emerald-400">{selectedCampaignAnalytics.delivery_rate}%</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${selectedCampaignAnalytics.delivery_rate}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1.5 block">Successfully dispatched without transmission failure.</span>
                    </div>

                    {/* Open Rate */}
                    <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-850">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-slate-400">Interaction Open Rate</span>
                        <span className="text-sm font-bold text-blue-400">{selectedCampaignAnalytics.open_rate}%</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                        <div 
                          className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${selectedCampaignAnalytics.open_rate}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1.5 block">Recipient read or opened the marketing message payload.</span>
                    </div>

                    {/* Click Rate */}
                    <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-850">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-slate-400">Call-To-Action Click-through (CTR)</span>
                        <span className="text-sm font-bold text-indigo-400">{selectedCampaignAnalytics.click_rate}%</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                        <div 
                          className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${selectedCampaignAnalytics.click_rate}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1.5 block">Audience members clicking CTA button or link.</span>
                    </div>
                  </div>

                  {/* Right part: Count Badges */}
                  <div className="md:col-span-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[
                      { label: "Total Sent", val: selectedCampaignAnalytics.total_sent, desc: "Messages sent", color: "border-slate-800/80 bg-slate-900/10 text-slate-200" },
                      { label: "Delivered", val: selectedCampaignAnalytics.delivered, desc: "Mock receipt confirmation", color: "border-emerald-500/15 bg-emerald-500/5 text-emerald-400" },
                      { label: "Failed", val: selectedCampaignAnalytics.failed, desc: "Failed dispatch", color: "border-rose-500/15 bg-rose-500/5 text-rose-400" },
                      { label: "Opened", val: selectedCampaignAnalytics.opened, desc: "Message viewed", color: "border-blue-500/15 bg-blue-500/5 text-blue-400" },
                      { label: "Read", val: selectedCampaignAnalytics.read, desc: "Confirmed read status", color: "border-cyan-500/15 bg-cyan-500/5 text-cyan-400" },
                      { label: "Clicked", val: selectedCampaignAnalytics.clicked, desc: "Interaction click event", color: "border-indigo-500/15 bg-indigo-500/5 text-indigo-400" }
                    ].map((card, idx) => (
                      <div key={idx} className={`p-4 rounded-xl border flex flex-col justify-between h-[100px] shadow-sm ${card.color}`}>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{card.label}</span>
                        <span className="text-2xl font-black tracking-tight">{card.val}</span>
                        <span className="text-[9px] text-slate-500 leading-tight">{card.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500 text-xs font-sans">
                  No performance statistics compiled. Make sure the campaign is active and dispatched.
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 border border-dashed border-slate-800/85 rounded-xl flex flex-col items-center justify-center gap-3 bg-slate-950/10">
              <Cpu className="w-8 h-8 text-slate-700 animate-pulse" />
              <div className="text-center">
                <h4 className="text-xs font-semibold text-slate-400">No Campaign Selected</h4>
                <p className="text-[10px] text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                  Select any campaign row in the outreach registry below to inspect real-time performance analytics, conversion rates, and delivery aggregates.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Database saved campaigns table section */}
        <section className="mt-16 rounded-2xl border border-slate-800/80 bg-slate-900/30 backdrop-blur-xl p-6 shadow-xl overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/50 pb-4 mb-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Layers className="w-4.5 h-4.5 text-indigo-400" />
              Existing CRM Outreach Campaigns
            </h3>
            <span className="text-[11px] font-mono text-slate-500">
              Showing top {savedCampaigns.length} campaigns
            </span>
          </div>

          <div className="overflow-x-auto">
            {savedCampaigns.length > 0 ? (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/40 text-slate-400 bg-slate-950/20 font-medium">
                    <th className="px-6 py-3">Campaign Name</th>
                    <th className="px-6 py-3">Target Segment</th>
                    <th className="px-6 py-3">Message Preview</th>
                    <th className="px-6 py-3">Channel</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Created At</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {savedCampaigns.map((camp) => (
                    <tr 
                      key={camp.id} 
                      onClick={() => handleSelectCampaign(camp)}
                      className={`hover:bg-slate-900/40 text-slate-300 transition-colors cursor-pointer ${
                        selectedCampaign?.id === camp.id ? "bg-indigo-950/20 border-l-2 border-indigo-500" : ""
                      }`}
                    >
                      <td className="px-6 py-3.5 font-bold text-slate-100">{camp.name}</td>
                      <td className="px-6 py-3.5 font-sans text-slate-400 max-w-[150px] truncate" title={camp.segment}>
                        {camp.segment}
                      </td>
                      <td className="px-6 py-3.5 text-slate-400 max-w-[200px] truncate" title={parseMessage(camp.message)}>
                        {parseMessage(camp.message)}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="flex items-center gap-1.5">
                          {camp.channel === "Email" ? (
                            <Mail className="w-3.5 h-3.5 text-blue-400" />
                          ) : camp.channel === "SMS" ? (
                            <MessageSquare className="w-3.5 h-3.5 text-pink-400" />
                          ) : (
                            <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                          {camp.channel}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                          camp.status === "Active" 
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                            : "bg-slate-500/10 border-slate-500/20 text-slate-400"
                        }`}>
                          {camp.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-sans text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(camp.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        {camp.status === "Draft" ? (
                          <button
                            onClick={(e) => handleLaunchCampaign(e, camp.id)}
                            disabled={launchLoadingCampaignId === camp.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-slate-100 text-xs font-semibold shadow-md active:scale-[0.97] transition-all"
                          >
                            {launchLoadingCampaignId === camp.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin text-slate-400" />
                            ) : (
                              <Send className="w-3 h-3" />
                            )}
                            Launch
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium px-2 py-1 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Running
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-slate-500 text-sm">
                No outreach campaigns compiled in database. Add details above and click save to register campaigns.
              </div>
            )}
          </div>
        </section>


      </main>
    </div>
  );
}
