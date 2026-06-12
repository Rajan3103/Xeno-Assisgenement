import React, { useState } from "react";
import { Terminal, Sparkles, Send, TrendingUp, Users, MessageSquare, Tag, Zap, Percent } from "lucide-react";

interface StrategyResult {
  audienceName: string;
  audienceSize: number;
  recommendedChannel: string;
  recommendedOffer: string;
  predictedOpenRate: number;
  predictedClickRate: number;
  message: string;
}

interface CommandCenterProps {
  onLaunchCampaign: (strategy: StrategyResult) => void;
}

export default function CommandCenter({ onLaunchCampaign }: CommandCenterProps) {
  const [goal, setGoal] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [strategy, setStrategy] = useState<StrategyResult | null>(null);

  const suggestions = [
    "Bring back inactive customers",
    "Launch a loyalty campaign",
    "Increase repeat purchases",
    "Promote a new coffee product",
    "Reward VIP customers"
  ];

  const handleAnalyze = async (promptText: string) => {
    const finalPrompt = promptText || goal;
    if (!finalPrompt.trim()) return;

    setAnalyzing(true);
    try {
      const res = await fetch("/api/goals/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: finalPrompt })
      });
      const data = await res.json();
      if (data.success && data.strategy) {
        setStrategy(data.strategy);
      }
    } catch (e) {
      console.error("AI Analysis error", e);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" id="command_center_block">
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-white mb-2 font-display-sm">AI Marketing Copilot</h2>
        <p className="text-zinc-400 text-lg font-body-lg">Accelerate your retail execution with autonomous intelligence.</p>
      </div>

      {/* Hero Workspace Box with Sleek Ambient Glow */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Terminal size={120} className="text-indigo-500" />
        </div>
        <div className="relative z-10 space-y-4">
          <label className="block text-xs font-bold text-indigo-400 uppercase tracking-widest font-mono">
            What marketing goal would you like to achieve?
          </label>
          
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-3 pl-4 flex items-center shadow-2xl">
              <span className="text-xl mr-3 opacity-50">✨</span>
              <input
                type="text"
                id="ai-input"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="bg-transparent border-none outline-none flex-1 text-base placeholder:text-zinc-600 text-zinc-100 focus:ring-0 py-2"
                placeholder="Type a command like 'Bring back inactive customers from Chennai'..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAnalyze("");
                }}
              />
              <button
                onClick={() => handleAnalyze("")}
                disabled={analyzing}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer"
              >
                {analyzing ? "Analyzing..." : "Generate Campaign"}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setGoal(s);
                  handleAnalyze(s);
                }}
                className="px-4 py-2 rounded-lg border border-zinc-800 bg-zinc-900/40 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/80 hover:border-zinc-700 transition-colors cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AI Strategy Results */}
      {strategy && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800">
              <Sparkles size={16} className="text-indigo-400" />
            </span>
            <h3 className="text-lg font-semibold text-white">Xeno Intelligent Action Plan</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Target Audience Size */}
            <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Users size={36} className="text-indigo-500" />
              </div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Target Audience Segment</p>
              <div className="text-xl font-semibold text-zinc-100 mb-1 truncate">{strategy.audienceName}</div>
              <p className="text-xs text-indigo-400 mt-2 flex items-center gap-1 font-mono">
                <Users size={12} /> Total Reach: {strategy.audienceSize.toLocaleString()}
              </p>
            </div>

            {/* Recommended Channel */}
            <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Sparkles size={36} className="text-indigo-500" />
              </div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Recommended Channel</p>
              <div className="text-xl font-semibold text-indigo-400 mb-1">{strategy.recommendedChannel}</div>
              <p className="text-xs text-zinc-500 mt-2">Selected for maximum response speed</p>
            </div>

            {/* Projected Metrics */}
            <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4">
              <div>
                <div className="flex justify-between text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">
                  <span>Predicted Open Rate</span>
                  <span className="text-indigo-400 font-semibold">{strategy.predictedOpenRate}%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500" style={{ width: `${strategy.predictedOpenRate}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">
                  <span>Predicted Click Rate</span>
                  <span className="text-emerald-400 font-semibold">{strategy.predictedClickRate}%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${strategy.predictedClickRate}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Recommended Offer */}
            <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-indigo-400" />
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Recommended Offer</h4>
              </div>
              <div className="bg-zinc-950/40 border border-zinc-800 rounded-lg p-4">
                <p className="font-semibold text-white text-sm">{strategy.recommendedOffer}</p>
                <p className="text-xs text-zinc-500 mt-1">Limited duration to maximize conversions.</p>
              </div>
            </div>

            {/* Generated Campaign Copy */}
            <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-indigo-400" />
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">AI Generated Message</h4>
                </div>
                <span className="text-[10px] text-indigo-400 font-mono">Tailored Preview</span>
              </div>
              <div className="bg-[#09090b]/80 p-4 rounded-lg text-xs italic text-zinc-200 leading-relaxed border border-zinc-800">
                "{strategy.message}"
              </div>
            </div>
          </div>

          {/* Launch Action */}
          <div className="flex justify-center pt-4">
            <button
              onClick={() => onLaunchCampaign(strategy)}
              className="px-10 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/20 border border-indigo-500/20 hover:scale-101 active:scale-99 cursor-pointer"
            >
              Launch Live Campaign Simulator
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
