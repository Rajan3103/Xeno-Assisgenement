import React, { useState, useEffect } from "react";
import { Terminal, Users, Target, Send, Radio, Lightbulb, Settings, Info, Bell, Sparkles, TrendingUp, Cpu, Heart, CheckCircle } from "lucide-react";
import { Socket } from "socket.io-client";
import CommandCenter from "./components/CommandCenter.js";

class MockSocket {
  private listeners: Record<string, Function[]> = {};

  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  emit(event: string, ...args: any[]) {
    const callbacks = this.listeners[event] || [];
    callbacks.forEach(cb => cb(...args));
  }

  off(event: string, callback?: Function) {
    if (!callback) {
      delete this.listeners[event];
    } else if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  disconnect() {
    this.listeners = {};
  }
}

const io = () => {
  const mockSocket = new MockSocket();
  (window as any).mockSocket = mockSocket;
  return mockSocket;
};

import CustomerIntelligence from "./components/CustomerIntelligence.js";
import AudienceStudio from "./components/AudienceStudio.js";
import CampaignStudio from "./components/CampaignStudio.js";
import LiveMonitor from "./components/LiveMonitor.js";
import InsightsEngine from "./components/InsightsEngine.js";
import SettingsPanel from "./components/SettingsPanel.js";
import { Customer } from "./db/storage.js";
import Login from "./components/Login.js";


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

export default function App() {
  const [activeTab, setActiveTab] = useState<"command" | "customers" | "audience" | "campaign" | "live" | "insights" | "settings">(() => {
    const savedRole = localStorage.getItem("xp_role") || "Admin";
    return savedRole === "Admin" ? "insights" : "command";
  });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [liveLogs, setLiveLogs] = useState<LiveEvent[]>([]);
  const [activeCampaignStatus, setActiveCampaignStatus] = useState<CampaignStatus | null>(null);
  const [activeCampaignName, setActiveCampaignName] = useState("No campaign running");
  const [activeCampaignSize, setActiveCampaignSize] = useState(1000);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [systemAlert, setSystemAlert] = useState<string | null>(null);
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(() => {
    const savedRole = localStorage.getItem("xp_role") || "Admin";
    if (savedRole === "Admin") {
      return { name: "Alex Executive", email: "admin@xenopulse.com", role: "Admin" };
    } else {
      return { name: "Jane Manager", email: "manager@xenopulse.com", role: "MarketingManager" };
    }
  });
  const [authLoading, setAuthLoading] = useState(false);

  // Pagination and optimized state variables
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [avgHealth, setAvgHealth] = useState(100);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, totalPages: 1, totalCount: 0 });

  const [currentPage, setCurrentPage] = useState(1);
  const [currentSearch, setCurrentSearch] = useState("");
  const [currentTag, setCurrentTag] = useState("all");
  const [currentHealth, setCurrentHealth] = useState("all");
  const [currentSpend, setCurrentSpend] = useState("all");

  // References for socket listener closure contexts
  const selectedCustomerIdRef = React.useRef<string | null>(null);
  const currentPageRef = React.useRef(1);
  const currentSearchRef = React.useRef("");
  const currentTagRef = React.useRef("all");
  const currentHealthRef = React.useRef("all");
  const currentSpendRef = React.useRef("all");
  const activeCampaignStatusRef = React.useRef<CampaignStatus | null>(null);

  useEffect(() => {
    selectedCustomerIdRef.current = selectedCustomerId;
  }, [selectedCustomerId]);

  useEffect(() => {
    activeCampaignStatusRef.current = activeCampaignStatus;
  }, [activeCampaignStatus]);

  useEffect(() => {
    currentPageRef.current = currentPage;
    currentSearchRef.current = currentSearch;
    currentTagRef.current = currentTag;
    currentHealthRef.current = currentHealth;
    currentSpendRef.current = currentSpend;
  }, [currentPage, currentSearch, currentTag, currentHealth, currentSpend]);


  const handleLoginSuccess = (u: { name: string; email: string; role: string }) => {
    setUser(u);
    setActiveTab(u.role === "Admin" ? "insights" : "command");
  };

  const checkSession = async () => {
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
    } catch (e) {
      console.error("Logout failed", e);
    }
  };


  // States routed between tabs (e.g. Command Center strategy selects -> loads into Campaign Studio)
  const [transientStrategy, setTransientStrategy] = useState<{
    message: string;
    audienceName: string;
    audienceSize: number;
  } | null>(null);

  // Core socket ref
  const [socket, setSocket] = useState<Socket | null>(null);

  // Load Initial Customer Registry with Pagination
  const loadCustomers = async (page = 1, limit = 50, search = "", tag = "all", health = "all", spend = "all") => {
    try {
      const res = await fetch(`/api/customers?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&tag=${tag}&health=${health}&spend=${spend}`);
      const d = await res.json();
      if (d.success && d.customers) {
        setCustomers(d.customers);
        setTotalCustomers(d.stats.totalProfiles);
        setAvgHealth(d.stats.averageHealthScore);
        setPagination(d.pagination);
      }
    } catch (e) {
      console.error("Failed to load root customer databases", e);
    }
  };

  const handleFilterChange = (page: number, search: string, tag: string, health = "all", spend = "all") => {
    setCurrentPage(page);
    setCurrentSearch(search);
    setCurrentTag(tag);
    setCurrentHealth(health);
    setCurrentSpend(spend);
    loadCustomers(page, 50, search, tag, health, spend);
  };


  useEffect(() => {
    checkSession();
    loadCustomers();


    // Setup Socket.io client connection transparently over current host
    const socketInstance = io();
    setSocket(socketInstance);

    socketInstance.on("status", (data) => {
      console.log("WebSocket backend handshake success:", data);
    });

    // Listen to simulated micro event progressions
    socketInstance.on("live:event", (data: LiveEvent) => {
      setLiveLogs(curr => {
        // Prepend and limit size to prevent performance loss
        const next = [data, ...curr];
        return next.slice(0, 50);
      });

      // Show floating system-level broadcast alert in upper right margin
      if (data.eventType === "campaign:start") {
        setSystemAlert(`🚀 Campaign started: ${data.campaignName}`);
        setTimeout(() => setSystemAlert(null), 4000);
      }

      if (data.state === "CONVERTED") {
        setSystemAlert(`🎉 Conversion! ${data.customerName} bought a product.`);
        setTimeout(() => setSystemAlert(null), 4000);
      }

      // Live update active dossier in drawer if state transitions
      if (data.customerId && selectedCustomerIdRef.current === data.customerId) {
        loadCustomers(currentPageRef.current, 50, currentSearchRef.current, currentTagRef.current, currentHealthRef.current, currentSpendRef.current);
      }
    });

    // Listen to real-time aggregators and increment counters
    socketInstance.on("campaign:update", (status: CampaignStatus) => {
      setActiveCampaignStatus(status);
    });


    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Shared Action Callback from Command Center or Audience selection -> Loads everything into Campaign Studio
  const handleAudienceSelectedIntoCampaign = (name: string, size: number) => {
    setTransientStrategy({
      audienceName: name,
      audienceSize: size,
      message: "Hey {first_name}! Special rewards are waiting for you at our shop. Use BACK15 at checkout to claim premium perks."
    });
    setActiveTab("campaign");
  };

  const handleCommandResultToCampaignLaunch = (strategy: any) => {
    setTransientStrategy({
      audienceName: strategy.audienceName,
      audienceSize: strategy.audienceSize,
      message: strategy.message
    });
    // Set active stats tracking
    setActiveCampaignName(strategy.audienceName);
    setActiveCampaignSize(strategy.audienceSize);
    setActiveTab("campaign");
  };

  const handleCampaignLaunched = (cam: any) => {
    setActiveCampaignName(cam.name);
    setActiveCampaignSize(cam.audienceSize);
    // Reset state and jump directly to monitor
    const initialStatus = {
      campaignId: cam.id,
      sentCount: 0,
      deliveredCount: 0,
      openedCount: 0,
      readCount: 0,
      clickedCount: 0,
      convertedCount: 0,
      failedCount: 0,
      speed: 1,
      paused: false
    };
    setActiveCampaignStatus(initialStatus);
    setLiveLogs([]);
    setActiveTab("live");

    // Emit initial campaign start event
    const startEvent: LiveEvent = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      eventType: "campaign:start",
      campaignId: String(cam.id),
      campaignName: cam.name,
      state: "STARTED"
    };
    const socketToUse = socket || (window as any).mockSocket;
    if (socketToUse) {
      socketToUse.emit("live:event", startEvent);
    }
  };

  const simIntervalRef = React.useRef<any>(null);

  useEffect(() => {
    if (!activeCampaignStatus) {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }
      return;
    }

    if (activeCampaignStatus.paused) {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }
      return;
    }

    const speedMultiplier = activeCampaignStatus.speed || 1;
    const intervalMs = Math.max(100, 1500 / speedMultiplier);

    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
    }

    const mockNames = [
      "Rajesh Kumar", "Ananya Iyer", "Vijay Sharma", "Priyanka Patel", "Amit Verma",
      "Siddharth Rao", "Deepika Sen", "Arjun Mehta", "Kavita Reddy", "Vikram Singh",
      "Sunita Nair", "Rohan Gupta", "Aishwarya Krishnan", "Sanjay Joshi", "Neha Kapoor"
    ];

    simIntervalRef.current = setInterval(() => {
      const currentStatus = activeCampaignStatusRef.current;
      if (!currentStatus) return;

      const totalSize = activeCampaignSize;
      if (currentStatus.sentCount >= totalSize) {
        if (simIntervalRef.current) {
          clearInterval(simIntervalRef.current);
          simIntervalRef.current = null;
        }
        return;
      }

      // Determine batch size
      const remaining = totalSize - currentStatus.sentCount;
      const batch = Math.min(remaining, Math.ceil(totalSize / 40));

      const nextSent = currentStatus.sentCount + batch;
      const nextDelivered = Math.min(nextSent, Math.floor(nextSent * 0.95));
      const nextOpened = Math.min(nextDelivered, Math.floor(nextDelivered * 0.75));
      const nextRead = Math.min(nextOpened, Math.floor(nextOpened * 0.85));
      const nextClicked = Math.min(nextRead, Math.floor(nextRead * 0.25));
      const nextConverted = Math.min(nextClicked, Math.floor(nextClicked * 0.40));
      const nextFailed = nextSent - nextDelivered;

      const nextStatus = {
        ...currentStatus,
        sentCount: nextSent,
        deliveredCount: nextDelivered,
        openedCount: nextOpened,
        readCount: nextRead,
        clickedCount: nextClicked,
        convertedCount: nextConverted,
        failedCount: nextFailed
      };

      const socketToUse = socket || (window as any).mockSocket;
      if (socketToUse) {
        // Emit update status
        socketToUse.emit("campaign:update", nextStatus);

        // Emit 1-2 random logs
        const numEvents = Math.min(3, Math.max(1, Math.floor(Math.random() * batch)));
        for (let i = 0; i < numEvents; i++) {
          const randCustomer = customers.length > 0
            ? customers[Math.floor(Math.random() * customers.length)]
            : { id: String(Math.floor(Math.random() * 1000)), name: mockNames[Math.floor(Math.random() * mockNames.length)] };

          const randVal = Math.random();
          let state = "SENT";
          if (randVal > 0.92) state = "CONVERTED";
          else if (randVal > 0.78) state = "CLICKED";
          else if (randVal > 0.58) state = "READ";
          else if (randVal > 0.38) state = "OPENED";
          else if (randVal > 0.12) state = "DELIVERED";
          else if (randVal > 0.08) state = "FAILED";

          const products = ["Classic Espresso Blend", "Dark Roast Whole Bean", "Arabica Filter Coffee", "Cold Brew Kit", "Ceramic Mug"];
          const eventData = {
            id: Math.random().toString(36).substring(2, 9),
            timestamp: new Date().toISOString(),
            eventType: "campaign:delivery",
            campaignId: currentStatus.campaignId,
            campaignName: activeCampaignName,
            customerName: randCustomer.name,
            customerId: String(randCustomer.id),
            channel: "WhatsApp",
            state: state,
            product: state === "CONVERTED" ? products[Math.floor(Math.random() * products.length)] : undefined
          };

          socketToUse.emit("live:event", eventData);
        }
      }
    }, intervalMs);

    return () => {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }
    };
  }, [activeCampaignStatus?.campaignId, activeCampaignStatus?.paused, activeCampaignStatus?.speed, activeCampaignSize, activeCampaignName, socket, customers]);

  useEffect(() => {
    (window as any).campaignSimulation = {
      status: activeCampaignStatus,
      togglePause: () => {
        let nextPaused = false;
        setActiveCampaignStatus(curr => {
          if (!curr) return null;
          nextPaused = !curr.paused;
          const updated = { ...curr, paused: nextPaused };
          const socketToUse = socket || (window as any).mockSocket;
          if (socketToUse) {
            socketToUse.emit("campaign:update", updated);
          }
          return updated;
        });
        return nextPaused;
      },
      setSpeed: (newSpeed: number) => {
        setActiveCampaignStatus(curr => {
          if (!curr) return null;
          const updated = { ...curr, speed: newSpeed };
          const socketToUse = socket || (window as any).mockSocket;
          if (socketToUse) {
            socketToUse.emit("campaign:update", updated);
          }
          return updated;
        });
        return newSpeed;
      }
    };

    return () => {
      delete (window as any).campaignSimulation;
    };
  }, [activeCampaignStatus, socket]);

  const handleQuickRescue = (customerName: string) => {
    setTransientStrategy({
      audienceName: `Rescue campaign for ${customerName}`,
      audienceSize: 1,
      message: `Hey {first_name}! ☀️ We've missed you. To say welcome back, here's an exclusive 15% off coupon BACK15 on our premium items!`
    });
    setActiveTab("campaign");
  };

  const mainTabs = user?.role === "Admin" 
    ? [
        { id: "insights", label: "System Insights", icon: Lightbulb, bad: "IQ" },
        { id: "customers", label: "Customer Registry", icon: Users, bad: `${totalCustomers.toLocaleString()}` }
      ]
    : [
        { id: "command", label: "AI Command Center", icon: Terminal, bad: "New" },
        { id: "customers", label: "Customer Intelligence", icon: Users, bad: `${totalCustomers.toLocaleString()}` },
        { id: "audience", label: "Audience Studio", icon: Target, bad: "" },
        { id: "campaign", label: "Campaign Studio", icon: Send, bad: "" }
      ];

  const systemTabs = user?.role === "Admin"
    ? [
        { id: "live", label: "Live Monitor Stream", icon: Radio, bad: activeCampaignStatus ? "● Live" : "" },
        { id: "settings", label: "Workspace Config", icon: Settings, bad: "" }
      ]
    : [
        { id: "live", label: "Live Monitor Stream", icon: Radio, bad: activeCampaignStatus ? "● Live" : "" },
        { id: "insights", label: "Campaign Insights", icon: Lightbulb, bad: "IQ" },
        { id: "settings", label: "My Settings", icon: Settings, bad: "" }
      ];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-indigo-400 font-mono text-xs select-none">
        <Sparkles className="animate-spin mr-2" size={14} /> Decrypting workspace session...
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-white">

      
      {/* Top Banner alert logs */}
      {systemAlert && (
        <div className="fixed top-4 right-4 z-[999] bg-zinc-900 text-zinc-100 px-5 py-3 rounded-xl border border-zinc-800 shadow-2xl flex items-center gap-3 animate-slide-in font-semibold text-xs leading-none">
          <Sparkles size={14} className="text-indigo-500 animate-pulse" />
          {systemAlert}
        </div>
      )}

      {/* Main Header / Title Navbar bar */}
      <header className="border-b border-zinc-800 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-[50] h-16 flex items-center justify-between px-6 md:px-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-lg select-none text-white">
            X
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-white leading-none">
              XenoPulse
            </h1>
            <p className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 mt-1">Marketing OS</p>
          </div>
        </div>

        {/* Global summary badge states & role switcher */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-1.5 rounded-lg">
            <span className="text-[10px] uppercase font-mono px-1 text-zinc-500">Role:</span>
            <select
              value={user?.role}
              onChange={(e) => {
                const newRole = e.target.value;
                localStorage.setItem("xp_role", newRole);
                window.location.reload();
              }}
              className="bg-[#09090b] text-xs font-semibold text-zinc-200 border border-zinc-850 px-2.5 py-0.5 rounded cursor-pointer focus:outline-none focus:border-indigo-500"
            >
              <option value="Admin">Admin</option>
              <option value="MarketingManager">Marketing Manager</option>
            </select>
          </div>
          
          <div className="hidden sm:flex items-center gap-6 text-zinc-400">
            <div className="flex items-center gap-1.5 text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>LIVE SIMULATOR ACTIVE</span>
            </div>
            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-lg">
              <Cpu size={12} className="text-indigo-400" />
              <span>Chennai Core Workspace</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full min-h-0 bg-[#09090b]">
        {/* Navigation Left Sidebar Panel */}
        <aside className="w-full md:w-64 bg-[#09090b] md:border-r border-zinc-800 p-4 flex flex-col gap-4">
          <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 flex flex-col gap-2 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-750 flex-shrink-0 flex items-center justify-center text-indigo-400 font-bold text-xs">
                {user?.name ? user.name.split(" ").map(w => w[0]).join("") : "U"}
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-semibold text-zinc-100 truncate leading-tight">{user?.name}</p>
                <p className="text-[9px] font-mono text-zinc-500 truncate mt-0.5 uppercase tracking-wider">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={() => {
                const nextRole = user?.role === "Admin" ? "MarketingManager" : "Admin";
                localStorage.setItem("xp_role", nextRole);
                window.location.reload();
              }}
              className="w-full py-1.5 text-center bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-900/30 text-indigo-400 hover:text-white rounded text-[9px] font-mono font-bold tracking-wider transition-colors cursor-pointer"
            >
              SWITCH TO {user?.role === "Admin" ? "MARKETING MANAGER" : "ADMIN"}
            </button>
          </div>


          <div className="text-zinc-500 uppercase text-[10px] font-bold px-2 py-1 tracking-widest">Main</div>
          <nav className="space-y-1">
            {mainTabs.map((tab) => {
              const TabIcon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between transition-all group font-medium ${
                    isSelected
                      ? "bg-zinc-800 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <TabIcon size={14} className={isSelected ? "text-indigo-400" : "text-zinc-500 group-hover:text-indigo-400 transition-colors"} />
                    <span className="text-xs">{tab.label}</span>
                  </div>
                  {tab.bad && (
                    <span className="text-[9px] font-mono bg-zinc-900 text-zinc-300 border border-zinc-800 px-1.5 py-0.5 rounded">
                      {tab.bad}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="text-zinc-500 uppercase text-[10px] font-bold px-2 py-1 mt-4 tracking-widest">Systems</div>
          <nav className="space-y-1">
            {systemTabs.map((tab) => {
              const TabIcon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between transition-all group font-medium ${
                    isSelected
                      ? "bg-zinc-800 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <TabIcon size={14} className={isSelected ? "text-indigo-400" : "text-zinc-500 group-hover:text-indigo-400 transition-colors"} />
                    <span className="text-xs">{tab.label}</span>
                  </div>
                  {tab.bad && (
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                      tab.id === 'live' && activeCampaignStatus
                        ? "bg-red-950/40 text-red-400 animate-pulse border border-red-900/30"
                        : "bg-zinc-900 text-zinc-300 border border-zinc-800"
                    }`}>
                      {tab.bad}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Dynamic Workspace Panel Workspace */}
        <main className="flex-1 p-6 md:p-8 bg-[#09090b] overflow-hidden">
          <div className="max-w-4xl mx-auto h-full">
            {activeTab === "command" && (
              <CommandCenter
                onLaunchCampaign={handleCommandResultToCampaignLaunch}
              />
            )}
            
            {activeTab === "customers" && (
              <CustomerIntelligence
                customers={customers}
                selectedCustomerId={selectedCustomerId}
                onSelectCustomer={setSelectedCustomerId}
                user={user}
                onReloadCustomers={() => loadCustomers(currentPage, 50, currentSearch, currentTag, currentHealth, currentSpend)}
                totalCustomers={totalCustomers}
                avgHealth={avgHealth}
                pagination={pagination}
                onFilterChange={handleFilterChange}
              />
            )}



            {activeTab === "audience" && (
              <AudienceStudio
                onSelectSegment={handleAudienceSelectedIntoCampaign}
              />
            )}

            {activeTab === "campaign" && (
              <CampaignStudio
                initialAudienceName={transientStrategy?.audienceName}
                initialAudienceSize={transientStrategy?.audienceSize}
                initialMessageTemplate={transientStrategy?.message}
                onLaunchCampaign={handleCampaignLaunched}
              />
            )}

            {activeTab === "live" && (
              <LiveMonitor
                liveLogs={liveLogs}
                activeCampaignStatus={activeCampaignStatus}
                activeCampaignName={activeCampaignName}
                activeCampaignSize={activeCampaignSize}
              />
            )}

            {activeTab === "insights" && (
              <InsightsEngine onQuickRescue={handleQuickRescue} />
            )}

            {activeTab === "settings" && (
              <SettingsPanel
                user={user}
                onCompanyChanged={async () => {
                  await checkSession();
                  loadCustomers(1, 50, "", "all", "all", "all");
                }}
              />
            )}
          </div>
        </main>
      </div>

      {/* Footer bar */}
      <footer className="h-14 border-t border-zinc-800 bg-[#09090b] flex items-center justify-between px-6 text-[10px] text-zinc-500 font-mono">
        <p>© 2026 XenoPulse Platform Corporation. Retail OS Standard License.</p>
        <p className="hidden sm:block">Hardware Assisted Intelligence • Port 3000 callback</p>
      </footer>
    </div>
  );
}
