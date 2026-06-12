import React, { useState, useEffect } from "react";
import { Radio, RefreshCw, Send, CheckCircle, Eye, MousePointer, ShieldAlert, ArrowUpRight, TrendingUp, Play, Pause } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface LiveEvent {
  id: string;
  timestamp: string;
  eventType: string;
  campaignId?: string;
  campaignName?: string;
  customerName?: string;
  customerId?: string;
  channel?: string;
  state?: string;
  product?: string;
}

interface CampaignStatus {
  campaignId: string;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  readCount: number;
  clickedCount: number;
  convertedCount: number;
  failedCount: number;
  speed?: number;
  paused?: boolean;
}

interface LiveMonitorProps {
  liveLogs: LiveEvent[];
  activeCampaignStatus: CampaignStatus | null;
  activeCampaignName?: string;
  activeCampaignSize?: number;
}

export default function LiveMonitor({
  liveLogs,
  activeCampaignStatus,
  activeCampaignName = "Select a campaign to begin tracking",
  activeCampaignSize = 1000
}: LiveMonitorProps) {
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [controlLoading, setControlLoading] = useState(false);

  useEffect(() => {
    if (activeCampaignStatus) {
      setPaused(activeCampaignStatus.paused ?? false);
      setSpeed(activeCampaignStatus.speed ?? 1);
    }
  }, [activeCampaignStatus?.campaignId]);

  const handleTogglePause = async () => {
    if (!activeCampaignStatus) return;
    setControlLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${activeCampaignStatus.campaignId}/pause`, {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        setPaused(data.paused);
      }
    } catch (e) {
      console.error("Failed to toggle simulation pause state", e);
    } finally {
      setControlLoading(false);
    }
  };

  const handleSpeedChange = async (newSpeed: number) => {
    if (!activeCampaignStatus) return;
    setControlLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${activeCampaignStatus.campaignId}/speed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ speed: newSpeed })
      });
      const data = await res.json();
      if (data.success) {
        setSpeed(data.speed);
      }
    } catch (e) {
      console.error("Failed to change simulation speed multiplier", e);
    } finally {
      setControlLoading(false);
    }
  };

  // Chart data simulation
  const [chartData, setChartData] = useState<Array<{ name: string; conversions: number; sent: number }>>([
    { name: "10m", conversions: 4, sent: 20 },
    { name: "08m", conversions: 12, sent: 35 },
    { name: "06m", conversions: 24, sent: 68 },
    { name: "04m", conversions: 45, sent: 120 },
    { name: "02m", conversions: 78, sent: 231 },
    { name: "Now", conversions: 112, sent: 412 }
  ]);

  // When activeCampaignStatus updates, append new record to trend line chart to simulate dynamic growth curves
  useEffect(() => {
    if (activeCampaignStatus) {
      setChartData(curr => {
        const next = [...curr.slice(1)];
        const lastMinutes = new Date().toLocaleTimeString("en-IN", { minute: "2-digit", second: "2-digit" });
        next.push({
          name: lastMinutes,
          conversions: activeCampaignStatus.convertedCount,
          sent: activeCampaignStatus.sentCount
        });
        return next;
      });
    }
  }, [activeCampaignStatus]);

  const getStateColor = (state?: string) => {
    switch (state?.toUpperCase()) {
      case "CONVERTED": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "CLICKED": return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
      case "READ": case "OPENED": return "text-indigo-400 bg-indigo-505/10 border-indigo-500/20";
      case "DELIVERED": return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case "FAILED": return "text-red-405 bg-red-550/10 border-red-500/20";
      default: return "text-zinc-405 bg-zinc-900 border-zinc-800";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="live_monitor_block">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-white font-display-sm">Live Campaign Monitor</h2>
          </div>
          <p className="text-zinc-400 text-sm font-body-sm">Real-time telemetries connected on port 3000 callback routes.</p>
        </div>

        {/* Simulation Controls (Visible when activeCampaignStatus is active) */}
        {activeCampaignStatus && (
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between shadow-xl animate-fade-in gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleTogglePause}
                disabled={controlLoading}
                className={`p-2 px-4 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer select-none ${
                  paused
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                    : "bg-amber-600 hover:bg-amber-500 text-white"
                }`}
              >
                {paused ? (
                  <>
                    <Play size={13} />
                    <span>Resume Campaign</span>
                  </>
                ) : (
                  <>
                    <Pause size={13} />
                    <span>Pause Campaign</span>
                  </>
                )}
              </button>
              
              {paused && (
                <span className="text-[10px] text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-mono font-bold tracking-widest animate-pulse uppercase">
                  PAUSED
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-400 font-mono">Speed:</span>
              <select
                value={speed}
                disabled={controlLoading}
                onChange={(e) => handleSpeedChange(Number(e.target.value))}
                className="bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg p-2 outline-none focus:ring-1 focus:ring-indigo-500 text-xs cursor-pointer min-w-[100px]"
              >
                <option value={1}>1x (Normal)</option>
                <option value={2}>2x (Faster)</option>
                <option value={5}>5x (Turbo)</option>
                <option value={10}>10x (Hyper)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Target status header card */}
      <section className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl relative overflow-hidden shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 font-mono">Tracking Channel Flow API</span>
            <h3 className="text-lg font-bold text-white mt-1">{activeCampaignName}</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-zinc-500">Expected Audience:</span>
            <span className="font-semibold text-white font-mono">{activeCampaignSize.toLocaleString()}</span>
          </div>
        </div>

        {/* Dynamic counters grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { label: "Sent", val: activeCampaignStatus?.sentCount || 0, icon: Send, col: "text-blue-400" },
            { label: "Delivered", val: activeCampaignStatus?.deliveredCount || 0, icon: CheckCircle, col: "text-indigo-400" },
            { label: "Opened", val: activeCampaignStatus?.openedCount || 0, icon: Eye, col: "text-pink-400" },
            { label: "Read", val: activeCampaignStatus?.readCount || 0, icon: Eye, col: "text-purple-400" },
            { label: "Clicked", val: activeCampaignStatus?.clickedCount || 0, icon: MousePointer, col: "text-yellow-400" },
            { label: "Converted", val: activeCampaignStatus?.convertedCount || 0, icon: TrendingUp, col: "text-emerald-400" }
          ].map((item, id) => {
            const Icon = item.icon;
            return (
              <div key={id} className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl transition-all text-center">
                <div className="flex justify-center mb-1">
                  <Icon className={`w-3.5 h-3.5 ${item.col}`} />
                </div>
                <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">{item.label}</p>
                <p className="text-lg font-bold text-white mt-1 font-mono leading-none">{(item.val).toLocaleString()}</p>
                <p className="text-[9px] text-zinc-500 mt-1">
                  {activeCampaignStatus && activeCampaignStatus.sentCount > 0
                    ? `${((item.val / activeCampaignStatus.sentCount) * 100).toFixed(1)}%`
                    : "0%"
                  }
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Realtime Chart and Timeline logger block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recharts conversion metrics */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex flex-col justify-between shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="font-bold text-white text-sm">Conversion Progress Curves</h4>
              <p className="text-xs text-zinc-500">Simulated throughput trend intervals (conversions vs sent)</p>
            </div>
            <TrendingUp size={16} className="text-indigo-400" />
          </div>

          <div className="h-[210px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.3} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", borderRadius: "8px", color: "white" }} />
                <Area type="monotone" dataKey="conversions" stroke="#6366f1" fillOpacity={1} fill="url(#colorConversions)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Running telemetry stream event items */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex flex-col justify-between max-h-[340px] shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-1.5 text-indigo-400">
              <Radio size={14} className="animate-pulse" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-white">Callback Stream Log</h4>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono uppercase">Active</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar font-mono text-[11px]">
            {liveLogs.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-center text-zinc-650 py-8">
                <RefreshCw size={22} className="animate-spin text-indigo-500 opacity-40 mb-2" />
                <p>Awaiting campaign activation events...</p>
              </div>
            ) : (
              liveLogs.map((log) => (
                <div key={log.id} className="p-2.5 rounded bg-zinc-950 border border-zinc-850 space-y-1 animate-fade-in relative overflow-hidden">
                  <div className="flex justify-between items-start gap-1">
                    <div>
                      <span className="text-zinc-200 font-semibold">{log.customerName}</span>
                      <span className="text-zinc-500 ml-1">via {log.channel}</span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border leading-none shrink-0 ${getStateColor(log.state)}`}>
                      {log.state}
                    </span>
                  </div>
                  {log.state === "CONVERTED" && (
                    <p className="text-[10px] text-emerald-400 font-medium">🎁 Purchased {log.product}</p>
                  )}
                  <p className="text-[9px] text-zinc-600 text-right">{new Date(log.timestamp).toLocaleTimeString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
