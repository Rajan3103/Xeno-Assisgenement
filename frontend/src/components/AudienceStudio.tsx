import React, { useState } from "react";
import { Sparkles, Users, Award, Target, Landmark, AlertCircle, ShoppingCart, ArrowRight } from "lucide-react";
import { Customer } from "../db/storage";

interface AudienceStudioProps {
  onSelectSegment: (segmentName: string, matchedCount: number) => void;
}

export default function AudienceStudio({ onSelectSegment }: AudienceStudioProps) {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{
    matchesCount: number;
    matchedCustomers: Customer[];
    criteria: Record<string, string>;
  } | null>(null);

  const prebuiltSegments = [
    {
      name: "VIP Members",
      tag: "VIP",
      desc: "Top customers with highest lifetime spend (> ₹50,000) and premium loyalty tier.",
      icon: Award,
      color: "text-tertiary bg-tertiary/10 border-tertiary/30",
      activeCount: 2401
    },
    {
      name: "High Spenders",
      tag: "High Spender",
      desc: "Customers who consistently make large premium transactions.",
      icon: Landmark,
      color: "text-primary bg-primary/10 border-primary/30",
      activeCount: 8920
    },
    {
      name: "Frequent Buyers",
      tag: "Frequent",
      desc: "Retained users with more than 3 repeat orders this seasonal cycle.",
      icon: ShoppingCart,
      color: "text-secondary bg-secondary/10 border-secondary/30",
      activeCount: 15602
    },
    {
      name: "Inactive/Lapsed",
      tag: "Inactive",
      desc: "Previously highly active buyers who have not purchased in over 60 days.",
      icon: AlertCircle,
      color: "text-error bg-error/10 border-error/30",
      activeCount: 34119
    }
  ];

  const handleAISegmentGen = async (customPrompt?: string) => {
    const finalPrompt = customPrompt || prompt;
    if (!finalPrompt.trim()) return;

    setGenerating(true);
    try {
      const res = await fetch("/api/audiences/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: finalPrompt })
      });
      const data = await res.json();
      if (data.success && data.analysis) {
        setResult(data.analysis);
      }
    } catch (e) {
      console.error("AI segment criteria fetch error", e);
    } finally {
      setGenerating(false);
    }
  };

  const fillPromptVal = (txt: string) => {
    setPrompt(txt);
    handleAISegmentGen(txt);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-white mb-2 font-display-sm">Audience Studio</h2>
        <p className="text-zinc-400 text-lg font-body-lg">Neural segmentation filters acting live over real-time buyer registries.</p>
      </div>

      {/* Interactive AI Generator Form with Sleek Glow */}
      <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Target size={120} className="text-indigo-500" />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-indigo-400 animate-pulse" />
            <h3 className="font-semibold text-base text-white">Neural Segment Generator</h3>
          </div>
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col pt-8">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-sm text-zinc-100 placeholder-zinc-650 min-h-[140px] resize-none focus:ring-0"
                placeholder="Describe your target rules (e.g. Find customers in Chennai with high-spend)..."
              />
              <div className="absolute top-3 left-4 flex items-center gap-1.5 pointer-events-none">
                <span className="text-indigo-400 font-bold text-[10px] uppercase tracking-widest opacity-80">PROMPT CRITERIA</span>
              </div>
              <div className="flex justify-end pt-3 mt-2 border-t border-zinc-800/60">
                <button
                  disabled={generating}
                  onClick={() => handleAISegmentGen()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg font-medium text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/20"
                >
                  {generating ? "Analyzing..." : "Analyze Intent Pattern"}
                  <Sparkles size={13} />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-zinc-500 font-bold">Try:</span>
            <button
              onClick={() => fillPromptVal("Customers from Chennai who spent more than 3000 and have not purchased in last 60 days.")}
              className="bg-zinc-900/50 hover:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-800 text-xs text-zinc-400 transition-colors"
            >
              "Customers in Chennai, spend &gt; 3000, 60-day inactive"
            </button>
            <button
              onClick={() => fillPromptVal("VIP Members residing in Bangalore.")}
              className="bg-zinc-900/50 hover:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-800 text-xs text-zinc-400 transition-colors"
            >
              "VIP Members in Bangalore"
            </button>
          </div>
        </div>

        {/* Results Panel */}
        {result && (
          <div className="mt-6 pt-6 border-t border-zinc-800 animate-fade-in block">
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Live Analysis Metrics</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Estimated reach size */}
              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1">Identified Reach</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold text-white">{result.matchesCount} matches</h3>
                  <span className="text-xs text-emerald-500 font-semibold">100% matched</span>
                </div>
              </div>

              {/* Parsed conditions */}
              <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800 md:col-span-2">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2 font-mono">Target Rules Parsed</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-zinc-350">
                  <div>• {result.criteria.cityCondition}</div>
                  <div>• {result.criteria.spendingThreshold}</div>
                  <div>• {result.criteria.inactivityDays}</div>
                </div>
              </div>
            </div>

            {/* List Matched Members */}
            {result.matchedCustomers.length > 0 && (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-xs text-zinc-400 font-semibold">Matched Segment Preview</p>
                  <button
                    onClick={() => onSelectSegment(prompt || "AI Guided Segment", result.matchesCount)}
                    className="text-xs text-indigo-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Load into Campaign Studio <ArrowRight size={12} />
                  </button>
                </div>
                <div className="flex -space-x-2 overflow-hidden p-1">
                  {result.matchedCustomers.map((user, idx) => (
                    <div
                      key={idx}
                      title={user.name}
                      className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-indigo-400 shrink-0"
                    >
                      {user.name.split(" ").map(w => w[0]).join("")}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Prebuilt Segments Grid */}
      <section>
        <div className="pb-4">
          <h2 className="text-lg font-semibold text-white">Prebuilt Audiences</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {prebuiltSegments.map((seg, idx) => {
            const IconComp = seg.icon;
            return (
              <div
                key={idx}
                onClick={() => onSelectSegment(seg.name, seg.activeCount)}
                className="group bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col hover:border-indigo-505 transition-all cursor-pointer active:scale-[0.98] relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform bg-zinc-800 border border-zinc-750 text-indigo-400`}>
                    <IconComp size={18} />
                  </div>
                  <div className="bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest text-[#c7c4d7]">
                    Active
                  </div>
                </div>
                <h3 className="text-zinc-150 font-bold text-sm mb-2 group-hover:text-indigo-400 transition-colors">{seg.name}</h3>
                <p className="text-xs text-zinc-400 font-body-sm flex-1 leading-relaxed">{seg.desc}</p>
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800/80">
                  <div className="flex items-baseline gap-1">
                    <span className="font-bold text-white text-base">{seg.activeCount.toLocaleString()}</span>
                    <span className="text-[9px] text-zinc-500">members</span>
                  </div>
                  <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Select <ArrowRight size={11} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
