"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  ArrowLeft, Cpu, RefreshCw, Layers, Mail, MessageSquare, 
  Phone, Activity, Percent, Sparkles, AlertCircle, CheckCircle, BarChart3
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from "recharts";

interface Campaign {
  id: number;
  name: string;
  segment: string;
  message: string;
  channel: string;
  status: string;
  created_at: string;
}

interface CampaignChartData {
  name: string;
  sent: number;
  delivered: number;
  failed: number;
  opened: number;
  clicked: number;
}

interface GlobalAnalytics {
  sent: number;
  delivered: number;
  failed: number;
  opened: number;
  read: number;
  clicked: number;
  conversion_rate: number;
  engagement_rate: number;
}

const COLORS = ["#10b981", "#ef4444", "#3b82f6", "#06b6d4", "#6366f1"];

export default function AnalyticsDashboardPage() {
  const [token, setToken] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  
  // Analytics State
  const [globalAnalytics, setGlobalAnalytics] = useState<GlobalAnalytics | null>(null);
  const [campaignsChartData, setCampaignsChartData] = useState<CampaignChartData[]>([]);
  const [campaignsCount, setCampaignsCount] = useState(0);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | "">("");
  const [selectedCampaignStats, setSelectedCampaignStats] = useState<any | null>(null);

  // AI Insights State
  const [insights, setInsights] = useState<{
    summary: string;
    recommendations: string[];
    audience_insights: string;
    next_best_action: string;
  } | null>(null);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [liveUpdates, setLiveUpdates] = useState(true);
  const [error, setError] = useState("");
  const [isMounted, setIsMounted] = useState(false);


  // Interval reference for live updates polling
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Avoid hydration issues by waiting for mount
  useEffect(() => {
    setIsMounted(true);
    handleConnectAndLoad();
    return () => {
      stopPolling();
    };
  }, []);

  // Sync polling state with switch
  useEffect(() => {
    if (connectionStatus === "connected" && token) {
      if (liveUpdates) {
        startPolling();
      } else {
        stopPolling();
      }
    }
  }, [liveUpdates, connectionStatus, token]);

  const startPolling = () => {
    stopPolling();
    pollingIntervalRef.current = setInterval(() => {
      if (token) {
        fetchData(token, false); // Quiet fetch in background
      }
    }, 3000);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const handleConnectAndLoad = async () => {
    setConnectionStatus("connecting");
    setLoading(true);
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
      const accessToken = authData.access_token;
      setToken(accessToken);
      setConnectionStatus("connected");

      await fetchData(accessToken, true);

    } catch (err: any) {
      setConnectionStatus("disconnected");
      setError("Failed to establish CRM database connection. Ensure FastAPI backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async (accessToken: string, showLoadingSpinner = false) => {
    if (showLoadingSpinner) setLoading(true);
    try {
      // 1. Fetch Global Telemetry Analytics
      const globalResponse = await fetch("http://localhost:8000/api/analytics", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!globalResponse.ok) throw new Error("Failed to fetch CRM telemetry.");
      const globalData = await globalResponse.json();
      setGlobalAnalytics(globalData);

      // 2. Fetch Active/Draft Campaigns
      const campaignsResponse = await fetch("http://localhost:8000/api/v1/campaigns/?limit=100", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!campaignsResponse.ok) throw new Error("Failed to fetch campaigns listing.");
      const campaignsList: Campaign[] = await campaignsResponse.json();
      setCampaignsCount(campaignsList.length);
      setCampaigns(campaignsList);
      setSelectedCampaignId(prev => {
        if (prev !== "") return prev;
        return campaignsList.length > 0 ? campaignsList[0].id : "";
      });


      // 3. Sequentially query campaigns analytics for comparisons (only active/completed campaigns)
      const dataPromises = campaignsList.map(async (camp) => {
        try {
          const statsRes = await fetch(`http://localhost:8000/api/v1/campaigns/${camp.id}/analytics`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (statsRes.ok) {
            const stats = await statsRes.json();
            return {
              name: camp.name.length > 15 ? camp.name.substring(0, 15) + "..." : camp.name,
              sent: stats.total_sent,
              delivered: stats.delivered,
              failed: stats.failed,
              opened: stats.opened,
              clicked: stats.clicked
            };
          }
        } catch (e) {
          console.error("Failed to query stats for camp:", camp.id, e);
        }
        return null;
      });

      const rawStats = await Promise.all(dataPromises);
      const filteredStats = rawStats.filter((c): c is CampaignChartData => c !== null && c.sent > 0);
      setCampaignsChartData(filteredStats);
      setError("");

    } catch (err: any) {
      console.error(err);
      setError("Telemetry fetch failed. Reload to retry.");
    } finally {
      if (showLoadingSpinner) setLoading(false);
    }
  };

  const fetchCampaignStats = async (campaignId: number, accessToken: string) => {
    try {
      const statsRes = await fetch(`http://localhost:8000/api/v1/campaigns/${campaignId}/analytics`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (statsRes.ok) {
        const stats = await statsRes.json();
        setSelectedCampaignStats(stats);
      } else {
        setSelectedCampaignStats(null);
      }
    } catch (e) {
      console.error("Failed to fetch stats for campaign:", campaignId, e);
      setSelectedCampaignStats(null);
    }
  };

  const handleGenerateInsights = async (campaignId: number) => {
    if (!token) return;
    setGeneratingInsights(true);
    setInsightsError("");
    setInsights(null);
    try {
      const response = await fetch("http://localhost:8000/api/v1/ai/insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ campaign_id: campaignId }),
      });
      if (!response.ok) {
        throw new Error("Failed to generate AI insights from backend.");
      }
      const data = await response.json();
      setInsights(data);
    } catch (err: any) {
      console.error(err);
      setInsightsError(err.message || "Failed to generate insights.");
    } finally {
      setGeneratingInsights(false);
    }
  };

  useEffect(() => {
    if (selectedCampaignId && token) {
      fetchCampaignStats(Number(selectedCampaignId), token);
      setInsights(null);
      setInsightsError("");
    } else {
      setSelectedCampaignStats(null);
      setInsights(null);
      setInsightsError("");
    }
  }, [selectedCampaignId, token]);


  // Rates Donut Gauges Helpers
  const makeDonutData = (rate: number) => [
    { name: "Rate", value: rate },
    { name: "Unachieved", value: Math.max(0, 100 - rate) }
  ];

  // Pie chart status distribution data
  const getStatusDistributionData = () => {
    if (!globalAnalytics) return [];
    return [
      { name: "Delivered", value: globalAnalytics.delivered },
      { name: "Failed", value: globalAnalytics.failed },
      { name: "Opened", value: globalAnalytics.opened },
      { name: "Read", value: globalAnalytics.read },
      { name: "Clicked", value: globalAnalytics.clicked }
    ].filter(item => item.value > 0);
  };

  const statusData = getStatusDistributionData();
  const showCharts = isMounted && campaignsChartData.length > 0;
  const showGlobalPie = isMounted && statusData.length > 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-slate-900 font-sans antialiased pb-20">
      {/* Background Glow */}
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
                Analytics Dashboard
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
              href="/segments"
              className="text-xs text-slate-455 text-slate-400 hover:text-indigo-400 transition-colors font-medium mr-2"
            >
              Segments
            </Link>

            {/* Live Updates switch */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-850">
              <input 
                type="checkbox" 
                id="live-updates-toggle" 
                checked={liveUpdates}
                onChange={() => setLiveUpdates(!liveUpdates)}
                className="w-3.5 h-3.5 accent-indigo-500 rounded bg-slate-950 cursor-pointer"
              />
              <label htmlFor="live-updates-toggle" className="text-[10px] font-bold text-slate-400 cursor-pointer select-none">
                {liveUpdates ? "Auto-Refreshing" : "Static Mode"}
              </label>
              {liveUpdates && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />}
            </div>

            <button 
              onClick={() => token && fetchData(token, true)}
              disabled={loading || connectionStatus !== "connected"}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-indigo-400 disabled:text-slate-700 transition-all active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main dashboard content */}
      <main className="relative max-w-7xl mx-auto px-6 pt-10 z-10">
        
        {/* Status Alerts Block */}
        {error && (
          <div className="mb-8 flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-rose-400 text-sm animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {/* Global Key Stats Cards Row */}
        {globalAnalytics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { label: "Outbox Sent Volume", val: globalAnalytics.sent, sub: `${campaignsCount} campaigns registered`, color: "border-slate-800/80 bg-slate-900/10 text-slate-200", trend: "System Total" },
              { 
                label: "Average Open Rate", 
                val: `${globalAnalytics.engagement_rate}%`, 
                sub: `${globalAnalytics.opened + globalAnalytics.read + globalAnalytics.clicked} message views`, 
                color: "border-blue-500/15 bg-blue-500/5 text-blue-400",
                trend: "Engagement Level"
              },
              { 
                label: "Campaign Conversion Rate", 
                val: `${globalAnalytics.conversion_rate}%`, 
                sub: `${globalAnalytics.clicked} click actions logged`, 
                color: "border-indigo-500/15 bg-indigo-500/5 text-indigo-400",
                trend: "CTA CTR"
              },
              { 
                label: "Transmission Success", 
                val: `${globalAnalytics.sent > 0 ? (100 - roundPercent(globalAnalytics.failed / globalAnalytics.sent * 100)) : 100}%`, 
                sub: `${globalAnalytics.failed} failed delivery blocks`, 
                color: "border-emerald-500/15 bg-emerald-500/5 text-emerald-400",
                trend: "Delivery Rate"
              }
            ].map((stat, idx) => (
              <div key={idx} className={`rounded-2xl border p-5 flex flex-col justify-between shadow-xl h-[120px] ${stat.color}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-950/40 text-slate-500 font-medium">{stat.trend}</span>
                </div>
                <div className="text-3xl font-black tracking-tight">{stat.val}</div>
                <div className="text-[10px] text-slate-500 leading-tight">{stat.sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* Recharts Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-8">
          
          {/* Bar Chart comparing Campaigns Performance */}
          <div className="lg:col-span-8 rounded-2xl border border-slate-800/80 bg-slate-900/30 backdrop-blur-xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-slate-200 mb-6 flex items-center gap-2">
              <BarChart3 className="w-4.5 h-4.5 text-indigo-400" />
              Campaign Performance Comparison
            </h3>

            {showCharts ? (
              <div className="w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={campaignsChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={9} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", borderRadius: "12px" }}
                      labelStyle={{ color: "#94a3b8", fontWeight: "bold" }}
                      itemStyle={{ fontSize: 11 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                    <Bar dataKey="sent" fill="#6366f1" name="Outbox Sent" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="delivered" fill="#10b981" name="Delivered" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="opened" fill="#3b82f6" name="Opened" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="clicked" fill="#8b5cf6" name="Clicked" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[320px] flex flex-col items-center justify-center gap-3 bg-slate-950/20 border border-dashed border-slate-850 rounded-xl">
                <BarChart3 className="w-8 h-8 text-slate-700 animate-pulse" />
                <span className="text-xs text-slate-500 text-center px-4">
                  {loading ? "Fetching campaign metrics..." : "No sent campaign records located. Save and Launch a Campaign to populate comparison graphs."}
                </span>
              </div>
            )}
          </div>

          {/* Pie Chart showing global Delivery Status breakdown */}
          <div className="lg:col-span-4 rounded-2xl border border-slate-800/80 bg-slate-900/30 backdrop-blur-xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-slate-200 mb-6 flex items-center gap-2">
              <Activity className="w-4.5 h-4.5 text-indigo-400" />
              Delivery Outcomes Share
            </h3>

            {showGlobalPie ? (
              <div className="flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height={230}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", borderRadius: "12px" }}
                      itemStyle={{ fontSize: 11, color: "#cbd5e1" }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Custom Legend */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 mt-5 w-full text-[10px] text-slate-400">
                  {statusData.map((item, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="font-medium text-slate-300">{item.name}</span>
                      <span className="font-mono text-slate-500 ml-auto">({item.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center gap-3 bg-slate-950/20 border border-dashed border-slate-850 rounded-xl">
                <Activity className="w-8 h-8 text-slate-700 animate-pulse" />
                <span className="text-xs text-slate-500 text-center px-4">
                  {loading ? "Fetching status distributions..." : "No delivery events registered."}
                </span>
              </div>
            )}
          </div>

        </div>

        {/* Donut Gauges Rates Row */}
        {globalAnalytics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                title: "Overall Delivery Success", 
                rate: globalAnalytics.sent > 0 ? (100 - roundPercent(globalAnalytics.failed / globalAnalytics.sent * 100)) : 100, 
                color: "#10b981", 
                desc: "Percentage of sent notifications that did not return a Failed delivery receipt." 
              },
              { 
                title: "Overall Open & Read Rate", 
                rate: globalAnalytics.engagement_rate, 
                color: "#3b82f6", 
                desc: "Percentage of total dispatches opened or read by recipients." 
              },
              { 
                title: "Call-To-Action CTR", 
                rate: globalAnalytics.conversion_rate, 
                color: "#6366f1", 
                desc: "Percentage of total outbox dispatches that achieved click conversions." 
              }
            ].map((gauge, idx) => {
              const data = makeDonutData(gauge.rate);
              return (
                <div key={idx} className="rounded-2xl border border-slate-800/80 bg-slate-900/30 backdrop-blur-xl p-6 shadow-xl flex flex-col items-center text-center">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">{gauge.title}</h4>
                  
                  {isMounted ? (
                    <div className="relative w-[150px] h-[150px] flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={65}
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                          >
                            <Cell fill={gauge.color} />
                            <Cell fill="#1e293b" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Center Rate Text */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-black tracking-tight" style={{ color: gauge.color }}>{gauge.rate}%</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-[150px] h-[150px] bg-slate-950/20 border border-slate-850 rounded-full animate-pulse" />
                  )}

                  <p className="text-[10px] text-slate-500 leading-relaxed max-w-xs mt-4">{gauge.desc}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Campaign AI Insights Section */}
        <div className="mt-12 border-t border-slate-800/60 pt-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                Campaign AI Insights Engine
              </h2>
              <p className="text-xs text-slate-500">
                Select any campaign to view live delivery statistics and generate personalized recommendations using Gemini.
              </p>
            </div>
            
            {/* Campaign Selector */}
            <div className="flex items-center gap-3">
              <label htmlFor="campaign-selector" className="text-xs font-bold text-slate-400 shrink-0">
                Campaign:
              </label>
              <select
                id="campaign-selector"
                value={selectedCampaignId}
                onChange={(e) => setSelectedCampaignId(e.target.value ? Number(e.target.value) : "")}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-xs transition-all cursor-pointer"
              >
                {campaigns.length === 0 ? (
                  <option value="">No campaigns available</option>
                ) : (
                  <>
                    <option value="">Select a campaign...</option>
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.channel} - {c.status})
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>
          </div>

          {selectedCampaignId ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Selected Campaign Metrics Card */}
              <div className="lg:col-span-4 rounded-2xl border border-slate-800/80 bg-slate-900/30 backdrop-blur-xl p-6 shadow-xl">
                {campaigns.find(c => c.id === selectedCampaignId) ? (
                  (() => {
                    const c = campaigns.find(c => c.id === selectedCampaignId)!;
                    return (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono font-bold tracking-wide uppercase ${
                            c.status === "Draft" 
                              ? "bg-slate-900 border-slate-800 text-slate-400"
                              : c.status === "Active"
                              ? "bg-emerald-950/35 border-emerald-900/60 text-emerald-400 animate-pulse"
                              : "bg-blue-950/35 border-blue-900/60 text-blue-400"
                          }`}>
                            {c.status}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">ID: {c.id}</span>
                        </div>

                        <h3 className="font-bold text-slate-100 text-base mb-1">{c.name}</h3>
                        <p className="text-xs text-slate-400 mb-6 font-medium">Channel: <span className="text-slate-200 font-bold">{c.channel}</span></p>

                        <div className="space-y-4">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Target Segment</span>
                            <p className="text-xs text-slate-300 font-mono mt-0.5 bg-slate-950/45 p-2 rounded-lg border border-slate-850">{c.segment}</p>
                          </div>

                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Message Draft</span>
                            <p className="text-xs text-slate-300 mt-0.5 bg-slate-950/45 p-2.5 rounded-lg border border-slate-850 leading-relaxed italic">"{c.message}"</p>
                          </div>
                        </div>

                        {/* Selected Campaign Statistics */}
                        <div className="mt-8 border-t border-slate-800/60 pt-6">
                          <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-4">Delivery Metrics</h4>
                          {selectedCampaignStats ? (
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl">
                                <span className="text-[9px] text-slate-500 block">Sent</span>
                                <span className="text-lg font-black text-slate-200">{selectedCampaignStats.total_sent}</span>
                              </div>
                              <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl">
                                <span className="text-[9px] text-slate-500 block">Delivered</span>
                                <span className="text-lg font-black text-emerald-400">{selectedCampaignStats.delivered}</span>
                              </div>
                              <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl">
                                <span className="text-[9px] text-slate-500 block">Opened</span>
                                <span className="text-lg font-black text-blue-400">{selectedCampaignStats.opened}</span>
                              </div>
                              <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl">
                                <span className="text-[9px] text-slate-500 block">Clicked</span>
                                <span className="text-lg font-black text-indigo-400">{selectedCampaignStats.clicked}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-slate-500 italic py-2 text-center">No dispatch metrics recorded yet.</div>
                          )}
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-xs text-slate-500 italic">Campaign details not found.</div>
                )}
              </div>

              {/* AI Insights Card */}
              <div className="lg:col-span-8 rounded-2xl border border-slate-800/80 bg-slate-900/30 backdrop-blur-xl p-6 shadow-xl relative min-h-[380px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-indigo-400" />
                      Gemini Decision-Support Insights
                    </h3>
                    {insights && (
                      <button
                        onClick={() => handleGenerateInsights(Number(selectedCampaignId))}
                        disabled={generatingInsights}
                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${generatingInsights ? "animate-spin" : ""}`} />
                        Regenerate
                      </button>
                    )}
                  </div>

                  {generatingInsights ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <div className="text-center">
                        <span className="text-xs font-bold text-indigo-400 block animate-pulse">Running AI Analytics Pipeline...</span>
                        <span className="text-[10px] text-slate-500 mt-1 block">Compiling cohort statistics and drafting tailored action plans</span>
                      </div>
                    </div>
                  ) : insightsError ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-rose-400 text-xs">
                      <AlertCircle className="w-8 h-8 shrink-0" />
                      <div className="text-center">
                        <p className="font-bold">Failed to Generate Insights</p>
                        <p className="text-[10px] text-slate-500 mt-1">{insightsError}</p>
                      </div>
                      <button
                        onClick={() => handleGenerateInsights(Number(selectedCampaignId))}
                        className="mt-2 px-3 py-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-750 text-[10px] font-bold text-slate-200 rounded-lg transition-colors"
                      >
                        Retry Generation
                      </button>
                    </div>
                  ) : insights ? (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      
                      {/* Summary */}
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Executive Summary</span>
                        <p className="text-xs text-slate-300 leading-relaxed mt-1.5 bg-slate-950/20 p-3.5 rounded-xl border border-slate-850">{insights.summary}</p>
                      </div>

                      {/* Audience Insights */}
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Cohort & Segment Observations</span>
                        <p className="text-xs text-slate-300 leading-relaxed mt-1.5 bg-slate-950/20 p-3.5 rounded-xl border border-slate-850">{insights.audience_insights}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        {/* Recommendations */}
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-2">Tactical Recommendations</span>
                          <ul className="space-y-2">
                            {insights.recommendations.map((rec, i) => (
                              <li key={i} className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Next Best Action */}
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-2">Next Best Action</span>
                          <div className="p-4 rounded-xl border border-amber-500/15 bg-amber-500/5 text-amber-400/90 shadow-md">
                            <p className="text-xs leading-relaxed font-semibold">{insights.next_best_action}</p>
                          </div>
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 border border-dashed border-slate-850 rounded-2xl bg-slate-950/15">
                      <Cpu className="w-8 h-8 text-slate-700" />
                      <div className="text-center max-w-sm px-4">
                        <span className="text-xs font-bold text-slate-400 block">AI Insights Ready to Build</span>
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          Run Gemini's large language model to trace delivery status distributions, calculate anomalies, and write an optimization action plan.
                        </span>
                      </div>
                      <button
                        onClick={() => handleGenerateInsights(Number(selectedCampaignId))}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-slate-50 font-bold text-xs rounded-xl shadow-lg hover:shadow-indigo-500/10 active:scale-98 transition-all duration-150"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Generate AI Insights
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="h-[200px] flex flex-col items-center justify-center gap-2 bg-slate-950/20 border border-dashed border-slate-850 rounded-2xl">
              <Sparkles className="w-6 h-6 text-slate-700 animate-pulse" />
              <span className="text-xs text-slate-500">Choose a campaign from the selector above to load metrics and AI insights.</span>
            </div>
          )}
        </div>


      </main>
    </div>
  );
}

// Utility to handle rounding
function roundPercent(val: number) {
  return Math.round(val * 100) / 100;
}
