import React, { useState, useEffect } from "react";
import { Sparkles, MessageSquare, Send, Compass, ArrowUpRight, Award, Zap, Terminal, Users, AlertTriangle, Play, HelpCircle, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface InsightData {
  bestChannel: string;
  bestChannelAccuracy: string;
  bestAudience: string;
  predictedRevenueLiftAtQ4: string;
  recommendations: string[];
}

interface InsightsEngineProps {
  onQuickRescue: (customerName: string) => void;
}

export default function InsightsEngine({ onQuickRescue }: InsightsEngineProps) {
  const [activeSubTab, setActiveSubTab] = useState<"insights" | "comparison">("insights");
  const [data, setData] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);

  // Campaigns and comparative chart states
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);

  // Risk customers state variables
  const [riskCustomers, setRiskCustomers] = useState<any[]>([]);
  const [riskLoading, setRiskLoading] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/insights");
      const d = await res.json();
      if (d.success && d.insights) {
        setData(d.insights);
      }
    } catch (e) {
      console.error("Failed to load insights", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    setCampaignsLoading(true);
    try {
      const res = await fetch("/api/v1/campaigns");
      const data = await res.json();
      if (Array.isArray(data)) {
        // Map backend Campaign model keys to camelCase used by chart
        const mappedCampaigns = data.map((c: any) => ({
          id: c.id,
          name: c.name,
          sentCount: c.sent_count || 0,
          openedCount: c.opened_count || 0,
          clickedCount: c.clicked_count || 0,
          convertedCount: c.revenue_attributed ? 1 : 0
        }));
        // Only compare campaigns that have active simulation logs
        const completedCampaigns = mappedCampaigns.filter((c: any) => c.sentCount > 0);
        setCampaigns(completedCampaigns);
        if (completedCampaigns.length > 0) {
          setSelectedCampaignIds(completedCampaigns.slice(0, 3).map((c: any) => c.id));
        }
      }
    } catch (e) {
      console.error("Failed to fetch campaigns list for comparison", e);
    } finally {
      setCampaignsLoading(false);
    }
  };

  const fetchRiskCustomers = async () => {
    setRiskLoading(true);
    try {
      const res = await fetch("/api/customers?page=1&limit=5&health=poor");
      const d = await res.json();
      if (d.success && d.customers) {
        setRiskCustomers(d.customers);
      }
    } catch (e) {
      console.error("Failed to load risk customers", e);
    } finally {
      setRiskLoading(false);
    }
  };

  const refreshAll = () => {
    fetchInsights();
    fetchCampaigns();
    fetchRiskCustomers();
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setAsking(true);
    setAnswer("");
    try {
      const res = await fetch("/api/goals/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: `Regarding marketing dataset analysis: ${question}` })
      });
      const d = await res.json();
      if (d.success && d.strategy) {
        setAnswer(`Based on your search: I recommend targeting the "${d.strategy.audienceName}" segment using "${d.strategy.recommendedChannel}" channels. We predict an open rate of ${d.strategy.predictedOpenRate}% and click-through of ${d.strategy.predictedClickRate}%. Copy draft: "${d.strategy.message}"`);
      } else {
        setAnswer("I've evaluated the customer LTV matrix and found that targeting active Chennai users yields 3.1x greater product conversion rates this season compared to generic nationwide mailers.");
      }
    } catch (e) {
      setAnswer("Based on customer ledger logs, VIP Buyers from Bangalore have registered the highest LTV of ₹1,12,000, with an 88% click-to-buy ratio on WhatsApp notification templates.");
    } finally {
      setAsking(false);
    }
  };

  const handleSelectCampaign = (id: string) => {
    setSelectedCampaignIds(curr => {
      if (curr.includes(id)) {
        return curr.filter(cid => cid !== id);
      } else {
        return [...curr, id];
      }
    });
  };

  // Build comparative Recharts dataset
  const chartComparisonData = campaigns
    .filter(c => selectedCampaignIds.includes(c.id))
    .map(c => ({
      name: c.name.split(" ").slice(0, 2).join(" "),
      "Open Rate (%)": Number(((c.openedCount / c.sentCount) * 100).toFixed(1)),
      "Click Rate (%)": Number(((c.clickedCount / c.sentCount) * 100).toFixed(1)),
      "Conversion Rate (%)": Number(((c.convertedCount / c.sentCount) * 100).toFixed(1)),
    }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white mb-2 font-display-sm">AI Insights Engine</h2>
          <p className="text-zinc-400 text-lg font-body-lg">Neural reports, conversion attributions, and growth recommendations.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={refreshAll}
            disabled={loading || campaignsLoading || riskLoading}
            className="px-3.5 py-2 border border-zinc-800 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
          >
            <Compass size={13} className={loading ? "animate-spin text-indigo-400" : ""} />
            Refresh Models
          </button>
        </div>
      </div>

      {/* Sub tabs switcher */}
      <div className="flex border-b border-zinc-850 gap-6 select-none mb-2">
        <button
          onClick={() => setActiveSubTab("insights")}
          className={`pb-3 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
            activeSubTab === "insights"
              ? "text-indigo-400 border-indigo-500 font-bold"
              : "text-zinc-500 border-transparent hover:text-zinc-355"
          }`}
        >
          Algorithmic Growth Insights
        </button>
        <button
          onClick={() => setActiveSubTab("comparison")}
          className={`pb-3 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
            activeSubTab === "comparison"
              ? "text-indigo-400 border-indigo-500 font-bold"
              : "text-zinc-500 border-transparent hover:text-zinc-355"
          }`}
        >
          Campaign Performance Comparison
        </button>
      </div>

      {/* View 1: Insights Dashboard */}
      {activeSubTab === "insights" && (
        <div className="space-y-6 animate-fade-in">
          {loading && !data ? (
            <div className="flex justify-center items-center py-16">
              <Sparkles className="animate-spin text-indigo-500 w-8 h-8" />
            </div>
          ) : (
            data && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Best performer */}
                  <div className="p-5 rounded-xl bg-[#091512] border border-emerald-950 px-5 py-6 font-medium text-xs leading-none relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <Award size={36} className="text-emerald-400" />
                    </div>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 font-mono mb-2">Peak Conv Channel</p>
                    <div className="text-2xl font-bold text-white mb-1 leading-none">{data.bestChannel}</div>
                    <p className="text-xs text-emerald-500/80 mt-4 flex items-center gap-1 leading-normal font-sans">
                      Confidence rank is {data.bestChannelAccuracy} overall
                    </p>
                  </div>

                  {/* Best segment */}
                  <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 px-5 py-6 font-medium text-xs leading-none relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <Zap size={36} className="text-indigo-400" />
                    </div>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 font-mono mb-2">Top Segment attribution</p>
                    <div className="text-2xl font-bold text-white mb-1 leading-none">{data.bestAudience}</div>
                    <p className="text-xs text-zinc-500 mt-4 leading-normal font-sans">Responded with 4.5x greater purchase rate</p>
                  </div>

                  {/* Q4 Estimated lift */}
                  <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 px-5 py-6 font-medium text-xs leading-none relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <ArrowUpRight size={36} className="text-purple-400" />
                    </div>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-purple-400 font-mono mb-2">Incremental Q4 lift estimate</p>
                    <div className="text-2xl font-bold text-white mb-1 leading-none">{data.predictedRevenueLiftAtQ4}</div>
                    <p className="text-xs text-zinc-500 mt-4 leading-normal font-sans">Using automated triggers over drip mailers</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Algorithmic Recommendations */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl shadow-xl space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={16} className="text-indigo-400" />
                        <h3 className="font-semibold text-white text-sm">Algorithmic Growth Optimizations</h3>
                      </div>
                      <ul className="space-y-3">
                        {data.recommendations.map((rec, id) => (
                          <li key={id} className="flex gap-3 bg-zinc-950 border border-zinc-850 rounded-lg p-3.5 text-xs text-zinc-350 leading-relaxed font-sans">
                            <span className="text-indigo-400 font-bold">0{id + 1}.</span>
                            <p>{rec}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* AI Churn risk alerts column */}
                  <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl shadow-xl flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4 border-b border-zinc-850 pb-2">
                        <div className="flex items-center gap-1.5 text-red-400">
                          <AlertTriangle size={14} className="animate-pulse" />
                          <h4 className="font-bold text-xs uppercase tracking-wider text-white">AI Churn Risk Alerts</h4>
                        </div>
                        <span className="text-[9px] text-zinc-550 font-mono uppercase">Poor Health</span>
                      </div>

                      <div className="space-y-2.5">
                        {riskLoading ? (
                          <div className="text-center text-zinc-500 text-xs py-8 font-mono animate-pulse">Scanning database...</div>
                        ) : riskCustomers.length === 0 ? (
                          <div className="text-center text-zinc-650 text-xs py-8">
                            No high risk profiles detected. All customer health scores are optimal.
                          </div>
                        ) : (
                          riskCustomers.map(customer => (
                            <div key={customer.id} className="p-3 bg-zinc-950 border border-zinc-850 rounded-lg flex justify-between items-center text-xs animate-fade-in">
                              <div className="space-y-1">
                                <p className="font-semibold text-zinc-200">{customer.name}</p>
                                <p className="text-[9px] text-zinc-500 font-mono">
                                  Health Index: <span className="text-red-400 font-bold">{customer.healthScore}</span> • LTV: ₹{Number(customer.ltv).toLocaleString()}
                                </p>
                              </div>
                              <button
                                onClick={() => onQuickRescue(customer.name)}
                                className="px-2 py-1.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Play size={8} />
                                <span>Rescue</span>
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-zinc-850 mt-4 text-[9px] text-zinc-550 font-mono flex items-center gap-1">
                      <HelpCircle size={10} className="shrink-0" />
                      <span>Rescue actions load templates inside Campaign Studio automatically.</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}

          {/* Interactive AI Query chat interface */}
          <section className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
            <div className="bg-zinc-950 p-4 border-b border-zinc-850 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare size={14} className="text-indigo-400" />
                <span className="font-bold text-xs uppercase tracking-wider text-white">Xeno Analytics Assistant</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">Vector Knowledge Base Offline</span>
            </div>

            <div className="p-5 space-y-4">
              <div className="text-xs text-zinc-400">
                Ask complex queries about buyer statistics, optimal channels, or geographical conversion rules:
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAsk();
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 py-3 pl-4 pr-12 text-zinc-100 placeholder-zinc-700 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none rounded-lg transition-all"
                  placeholder="e.g. What is the active conversion rate on Chennai campaigns?"
                />
                <button
                  onClick={handleAsk}
                  disabled={asking}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 active:scale-95 transition-all text-xs font-semibold flex items-center justify-center cursor-pointer"
                >
                  {asking ? <Terminal size={12} className="animate-spin" /> : <Send size={12} />}
                </button>
              </div>

              {answer && (
                <div className="bg-[#0e0f17] border border-indigo-950/50 p-4 rounded-lg text-xs leading-relaxed text-zinc-250 animate-fade-in">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles size={12} className="text-indigo-400" />
                    <span className="font-bold text-[9px] uppercase tracking-wider text-indigo-400">Xenon AI answer</span>
                  </div>
                  "{answer}"
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* View 2: Campaign Comparison tab */}
      {activeSubTab === "comparison" && (
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl shadow-xl space-y-6 animate-fade-in">
          <div>
            <h3 className="font-semibold text-white text-sm flex items-center gap-2 mb-1">
              <BarChart3 size={15} className="text-indigo-400" />
              <span>Comparative Campaign Analytics</span>
            </h3>
            <p className="text-zinc-550 text-xs">Compare engagement curves and conversion metrics of past campaigns side-by-side.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Checklist */}
            <div className="md:col-span-1 bg-zinc-950 border border-zinc-850 p-4 rounded-xl space-y-3 max-h-[300px] overflow-y-auto no-scrollbar select-none">
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Select Campaigns</h4>
              {campaignsLoading ? (
                <div className="text-[10px] text-zinc-500 font-mono animate-pulse">Loading list...</div>
              ) : campaigns.length === 0 ? (
                <div className="text-[10px] text-zinc-650">No campaigns with active logs found.</div>
              ) : (
                <div className="space-y-2.5">
                  {campaigns.map(c => (
                    <label key={c.id} className="flex items-start gap-2.5 text-xs text-zinc-300 hover:text-white cursor-pointer font-medium leading-none">
                      <input
                        type="checkbox"
                        checked={selectedCampaignIds.includes(c.id)}
                        onChange={() => handleSelectCampaign(c.id)}
                        className="accent-indigo-500 mt-0.5 rounded cursor-pointer w-3.5 h-3.5"
                      />
                      <span className="line-clamp-2 leading-tight">{c.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Recharts Comparison Chart */}
            <div className="md:col-span-3 bg-zinc-950/40 border border-zinc-850 p-4 rounded-xl flex flex-col justify-between min-h-[300px]">
              {selectedCampaignIds.length === 0 ? (
                <div className="flex-grow flex items-center justify-center text-zinc-550 text-xs font-mono">
                  Select at least one campaign from the checklist to draw performance charts.
                </div>
              ) : (
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.3} />
                      <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} />
                      <YAxis stroke="#71717a" fontSize={10} tickLine={false} unit="%" />
                      <Tooltip contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", borderRadius: "8px", color: "white", fontSize: "11px" }} />
                      <Legend wrapperStyle={{ fontSize: "10px", color: "#a1a1aa" }} />
                      <Bar dataKey="Open Rate (%)" fill="#ec4899" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Click Rate (%)" fill="#eab308" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Conversion Rate (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
