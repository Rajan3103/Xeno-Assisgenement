import React, { useState, useEffect } from "react";
import { Send, CheckCircle, Smartphone, Mail, MessageSquare, AlertCircle, Info, Sparkles, Plus, Settings } from "lucide-react";

interface CampaignStudioProps {
  initialAudienceName?: string;
  initialAudienceSize?: number;
  initialMessageTemplate?: string;
  onLaunchCampaign: (campaign: {
    name: string;
    channel: string;
    messageTemplate: string;
    audienceSegmentName: string;
    audienceSize: number;
  }) => void;
}

export default function CampaignStudio({
  initialAudienceName = "Lapsed High-Value Shoppers",
  initialAudienceSize = 12482,
  initialMessageTemplate = "",
  onLaunchCampaign
}: CampaignStudioProps) {
  const [name, setName] = useState("");
  const [channel, setChannel] = useState<'WhatsApp' | 'SMS' | 'Email' | 'RCS'>('WhatsApp');
  const [messageTemplate, setMessageTemplate] = useState("");
  const [segmentName, setSegmentName] = useState("");
  const [segmentSize, setSegmentSize] = useState(1);
  const [sending, setSending] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState("all");
  const [segmentsList, setSegmentsList] = useState<Array<{ id: string; name: string }>>([
    { id: "all", name: "All Customers" },
    { id: "VIP", name: "VIP Members" },
    { id: "High Spender", name: "High Spenders" },
    { id: "Frequent", name: "Frequent Buyers" },
    { id: "Inactive", name: "Inactive/Lapsed" },
    { id: "New", name: "New Customers" }
  ]);

  const fetchSegmentCount = async (tag: string) => {
    try {
      const res = await fetch(`/api/customers?limit=1&tag=${tag}`);
      const data = await res.json();
      if (data.success && data.pagination) {
        setSegmentSize(data.pagination.totalCount);
      }
    } catch (e) {
      console.error("Failed to fetch segment count", e);
    }
  };

  useEffect(() => {
    const defaultSegments = [
      { id: "all", name: "All Customers" },
      { id: "VIP", name: "VIP Members" },
      { id: "High Spender", name: "High Spenders" },
      { id: "Frequent", name: "Frequent Buyers" },
      { id: "Inactive", name: "Inactive/Lapsed" },
      { id: "New", name: "New Customers" }
    ];
    
    let activeTag = "all";
    if (initialAudienceName === "VIP Members") activeTag = "VIP";
    else if (initialAudienceName === "High Spenders") activeTag = "High Spender";
    else if (initialAudienceName === "Frequent Buyers") activeTag = "Frequent";
    else if (initialAudienceName === "Inactive/Lapsed") activeTag = "Inactive";
    else if (initialAudienceName === "New Customers") activeTag = "New";
    else if (initialAudienceName && initialAudienceName !== "All Customers") {
      const exists = defaultSegments.some(s => s.name === initialAudienceName);
      if (!exists) {
        defaultSegments.push({ id: "custom", name: initialAudienceName });
        activeTag = "custom";
      }
    }
    
    setSegmentsList(defaultSegments);
    setSelectedSegment(activeTag);
    setSegmentName(initialAudienceName);
    setSegmentSize(initialAudienceSize);
    setName(`Campaign ${new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric" })} - Pulse`);
    setMessageTemplate(initialMessageTemplate || "Hey {first_name}! We've missed you at XenoPulse. Use code BACK15 for 15% off coupon on premium items at checkout!");
    
    if (activeTag !== "custom") {
      fetchSegmentCount(activeTag);
    }
  }, [initialAudienceName, initialAudienceSize, initialMessageTemplate]);

  useEffect(() => {
    if (selectedSegment && selectedSegment !== "custom") {
      fetchSegmentCount(selectedSegment);
    }
  }, [selectedSegment]);

  const handleLaunch = async () => {
    if (!name.trim() || !messageTemplate.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          channel,
          messageTemplate,
          audienceSegmentName: segmentName,
          audienceSize: segmentSize
        })
      });
      const data = await res.json();
      if (data.success && data.campaign) {
        // Trigger simulated transitions callback
        await fetch(`/api/campaigns/${data.campaign.id}/send`, { method: "POST" });
        onLaunchCampaign(data.campaign);
      }
    } catch (e) {
      console.error("Failed to launch campaign", e);
    } finally {
      setSending(false);
    }
  };

  // Preview message with replaced personalization variables
  const getPersonalizedPreview = () => {
    return messageTemplate.replace(/{first_name}/g, "Alex");
  };

  // Preview message with replaced personalization variables and channel-specific elements
  const renderPreviewContent = () => {
    const text = getPersonalizedPreview();
    
    if (channel === 'Email') {
      return (
        <div className="bg-zinc-900 rounded-lg p-3 border border-zinc-800 text-[10px] text-zinc-350 space-y-2 select-none shadow-md text-left">
          <div className="border-b border-zinc-800 pb-2 space-y-1 text-zinc-500 font-mono text-[8px]">
            <div><span className="text-zinc-600">From:</span> info@xenopulse.com</div>
            <div><span className="text-zinc-600">To:</span> customer@xenopulse-client.com</div>
            <div><span className="text-zinc-600">Subject:</span> {name || "Exclusive Perks"}</div>
          </div>
          <div className="pt-2 leading-relaxed text-zinc-200 font-sans">
            {text}
          </div>
          <div className="pt-3 flex justify-center">
            <button className="bg-indigo-600 px-3 py-1.5 rounded text-[8px] font-bold text-white uppercase tracking-wider hover:bg-indigo-500 cursor-pointer">
              Redeem Code
            </button>
          </div>
        </div>
      );
    }
    
    if (channel === 'WhatsApp') {
      return (
        <div className="bg-[#0b141a] rounded-xl overflow-hidden border border-[#202c33] shadow-md flex flex-col font-sans max-w-[95%] text-left">
          <div className="bg-[#202c33] px-3 py-1.5 flex items-center gap-2 border-b border-zinc-850">
            <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[8px] font-bold text-white">XP</div>
            <div>
              <p className="text-[10px] text-zinc-200 font-semibold leading-tight">XenoPulse Support</p>
              <p className="text-[7px] text-emerald-400 font-mono">online</p>
            </div>
          </div>
          <div className="p-3 bg-[#0b141a] space-y-2">
            <div className="bg-[#005c4b] p-2.5 rounded-lg rounded-tl-none text-[11px] text-[#e9edef] leading-relaxed max-w-[90%] shadow-md select-none relative animate-fade-in">
              {text}
              <div className="mt-1 text-[7px] text-[#8696a0] text-right">Just now • WhatsApp</div>
            </div>
          </div>
        </div>
      );
    }

    if (channel === 'RCS') {
      return (
        <div className="bg-zinc-950 border border-zinc-850 rounded-xl overflow-hidden max-w-[90%] shadow-md animate-fade-in text-left">
          {/* Mock image card for RCS */}
          <div className="bg-indigo-950/30 aspect-video flex items-center justify-center border-b border-zinc-850 relative">
            <Sparkles size={24} className="text-indigo-400 animate-pulse" />
            <div className="absolute bottom-2 left-2 bg-indigo-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
              Exclusive RCS Perks
            </div>
          </div>
          <div className="p-3 space-y-2.5">
            <p className="text-[11px] text-zinc-200 leading-relaxed font-sans">{text}</p>
            <div className="flex flex-col gap-1.5 pt-1">
              <button className="w-full py-1.5 bg-zinc-900 border border-zinc-800 text-[9px] font-semibold text-indigo-400 hover:bg-zinc-850 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1">
                <span>View Details</span>
              </button>
              <button className="w-full py-1.5 bg-indigo-600 text-[9px] font-semibold text-white hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1">
                <span>Redeem offer</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Default SMS view (iMessage style)
    return (
      <div className="space-y-4 text-right">
        <div className="bg-indigo-600 border border-indigo-500 p-3 rounded-xl rounded-tr-none text-[11px] text-zinc-100 leading-relaxed max-w-[90%] ml-auto shadow-md select-none relative animate-fade-in text-left">
          {text}
          <div className="mt-2 text-[8px] text-indigo-200 text-right">Just now • SMS</div>
        </div>
      </div>
    );
  };

  const aiSuggestions = [
    {
      txt: "Hi {first_name}! We noticed you loved our premium items. Use promo code PURE10 for matching accessories today! 🎁",
      rate: "94% engagement rate"
    },
    {
      txt: "Exclusive alert for {first_name}: Double bonus reward loyalty credits valid only for the next 24 hours. Check your account! ✨",
      rate: "88% engagement rate"
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-white mb-2 font-display-sm">Campaign Studio</h2>
        <p className="text-zinc-400 text-lg font-body-lg">Design, personalize, and launch high-impact retail experiences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Configuration Column */}
        <div className="lg:col-span-8 space-y-6">
          <section className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-6 shadow-xl relative">
            <div className="flex items-center gap-3">
              <Settings size={18} className="text-indigo-400" />
              <h3 className="text-base font-semibold text-white">Campaign Configuration</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block font-mono">Campaign Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-lg p-2.5 text-zinc-100 placeholder-zinc-700 outline-none focus:ring-1 focus:ring-indigo-500 text-sm mt-1"
                  placeholder="e.g. Summer VIP Blast"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block font-mono">Primary Channel</label>
                <div className="grid grid-cols-4 gap-2 mt-1">
                  {(['WhatsApp', 'SMS', 'Email', 'RCS'] as const).map((ch, idx) => {
                    const isSelected = channel === ch;
                    return (
                      <div
                        key={idx}
                        onClick={() => setChannel(ch)}
                        className={`rounded-lg p-2 flex flex-col items-center justify-center cursor-pointer transition-all border ${
                          isSelected
                            ? "bg-indigo-600/10 border-indigo-500 text-indigo-400 font-semibold"
                            : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:bg-zinc-900 hover:text-white"
                        }`}
                      >
                        <Smartphone size={14} />
                        <span className="text-[9px] uppercase font-bold mt-1 tracking-wider">{ch}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Target segment box decoration */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block font-mono">Target Audience</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-950 border border-zinc-850 p-4 rounded-xl mt-1">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                    <Smartphone size={16} className="text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-zinc-100 text-sm">Target Segment</h4>
                    <p className="text-xs text-zinc-500 mt-1">{segmentSize.toLocaleString()} candidates</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <select
                    value={selectedSegment}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedSegment(val);
                      const matching = segmentsList.find(s => s.id === val);
                      if (matching) {
                        setSegmentName(matching.name);
                      }
                    }}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-lg p-2.5 text-zinc-100 outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                  >
                    {segmentsList.map(seg => (
                      <option key={seg.id} value={seg.id} className="bg-zinc-950 text-zinc-100">
                        {seg.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Composer Box */}
          <section className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
            <div className="bg-zinc-950 p-4 border-b border-zinc-850 flex justify-between items-center text-xs font-semibold">
              <span className="text-zinc-400 tracking-wider uppercase font-mono text-[10px]">Compose message template</span>
              <span className="text-indigo-400 font-mono text-[10px]">Dynamic personalization is active</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12">
              <div className="md:col-span-8 p-4 bg-zinc-900/50 min-h-[180px]">
                <textarea
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  className="w-full h-full bg-transparent border-none focus:ring-0 text-zinc-100 placeholder-zinc-700 resize-none text-sm outline-none"
                  placeholder="Hey {first_name}! Compose your campaign message templates..."
                />
              </div>

              {/* AI helper sidebar suggestions */}
              <div className="md:col-span-4 bg-zinc-950/80 border-l border-zinc-850 p-4 space-y-4">
                <div className="flex items-center gap-1.5 text-indigo-400">
                  <Sparkles size={13} />
                  <span className="font-bold text-[9px] uppercase tracking-widest font-mono">AI Copilot presets</span>
                </div>
                {aiSuggestions.map((item, id) => (
                  <div
                    key={id}
                    onClick={() => setMessageTemplate(item.txt)}
                    className="p-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-350 rounded-lg transition-all cursor-pointer group text-xs text-left"
                  >
                    <p className="leading-snug text-zinc-200 font-medium mb-1 line-clamp-2">"{item.txt}"</p>
                    <span className="opacity-60 text-[8px] group-hover:text-indigo-400 font-bold uppercase block tracking-wider mt-1">{item.rate}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Placeholders row handles click insertion */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setMessageTemplate(curr => curr + " {first_name}")}
              className="px-3 py-1.5 border border-zinc-800 rounded-lg text-xs font-medium text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer"
            >
              + Insert Name placeholder
            </button>
            <button
              onClick={() => setMessageTemplate(curr => curr + " code: BACK15")}
              className="px-3 py-1.5 border border-zinc-800 rounded-lg text-xs font-medium text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer"
            >
              + Insert Offer code
            </button>
          </div>
        </div>

        {/* Live device rendering mockup preview */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl space-y-4 shadow-xl select-none">
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest block font-mono">Device Canvas Preview</h4>
            
            {/* The smartphone mockup layout */}
            <div className="w-full max-w-[240px] mx-auto aspect-[9/18.5] bg-[#030303] rounded-[2rem] border-[8px] border-zinc-800 relative overflow-hidden flex flex-col justify-between shadow-2xl">
              <div className="h-4 w-1/3 bg-zinc-800 absolute top-0 left-1/2 -translate-x-1/2 rounded-b-xl z-20"></div>
              
              <div className="flex-grow pt-8 px-4 overflow-y-auto no-scrollbar space-y-3 pb-4">
                {/* Simulated message bubbles matching dynamic replacements live */}
                {renderPreviewContent()}
              </div>

              {/* Mock input field bottom element */}
              <div className="p-2 border-t border-zinc-900 bg-zinc-950 flex items-center px-3 gap-2 h-12">
                <div className="flex-grow bg-zinc-900 rounded-lg h-8 px-2 flex items-center text-[9px] text-zinc-650">
                  Simulating active channel...
                </div>
                <Send size={12} className="text-indigo-400 mr-1 shrink-0" />
              </div>
            </div>

            {/* Campaign budget and rate estimations snapshot */}
            <div className="p-4 bg-zinc-950/40 border border-zinc-800 rounded-lg space-y-3">
              <h5 className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Financial Summary</h5>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-zinc-500">Cost Per Message</p>
                  <p className="font-semibold text-zinc-200">₹0.15</p>
                </div>
                <div>
                  <p className="text-zinc-500">Target Size</p>
                  <p className="font-semibold text-zinc-200">{segmentSize.toLocaleString()}</p>
                </div>
                <div className="col-span-2 pt-2 border-t border-zinc-850">
                  <p className="text-zinc-500 font-bold">Total Estimated Budget</p>
                  <p className="text-base font-bold text-indigo-400">₹{(segmentSize * 0.15).toLocaleString(undefined, { maximumFractionDigits: 2 })} INR</p>
                </div>
              </div>
            </div>

            {/* Primary Action launches everything */}
            <button
              onClick={handleLaunch}
              disabled={sending}
              className="w-full py-3.5 text-center bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {sending ? "Initiating Simulator..." : "Launch Campaign"}
              <Send size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
