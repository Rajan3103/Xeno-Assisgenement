import React, { useState, useEffect } from "react";
import { Search, Mail, Phone, MapPin, Database, Award, ShieldAlert, Heart, Calendar, PlusCircle, CheckCircle, ArrowRight, User } from "lucide-react";
import { Customer } from "../db/storage";

interface CustomerIntelligenceProps {
  customers: Customer[];
  selectedCustomerId: string | null;
  onSelectCustomer: (id: string | null) => void;
  user: { name: string; email: string; role: string } | null;
  onReloadCustomers: () => void;
  totalCustomers: number;
  avgHealth: number;
  pagination: { page: number; limit: number; totalPages: number; totalCount: number };
  onFilterChange: (page: number, search: string, tag: string, health: string, spend: string) => void;
}

export default function CustomerIntelligence({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  user,
  onReloadCustomers,
  totalCustomers,
  avgHealth,
  pagination,
  onFilterChange
}: CustomerIntelligenceProps) {


  const [searchTerm, setSearchString] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [healthFilter, setHealthFilter] = useState("all");
  const [spendFilter, setSpendFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pruning, setPruning] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handlePruneProfile = async () => {
    if (!selectedCustomerId) return;
    if (confirm(`Are you sure you want to delete the profile of ${selectedCustomer?.name}? This action is irreversible.`)) {
      setPruning(true);
      setActionError(null);
      try {
        const res = await fetch(`/api/customers/${selectedCustomerId}`, {
          method: "DELETE"
        });
        const data = await res.json();
        if (data.success) {
          toggleDrawer(false, null);
          onReloadCustomers();
        } else {
          setActionError(data.error || "Failed to prune profile.");
        }
      } catch (err) {
        console.error("Prune error", err);
        setActionError("Network error: failed to communicate with server.");
      } finally {
        setPruning(false);
      }
    }
  };

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  // Setup search text debounce to avoid multiple API hits during typing
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange(1, searchTerm, activeFilter, healthFilter, spendFilter);
    }, 400); // 400ms debounce delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleTagFilterClick = (filterCode: string) => {
    setActiveFilter(filterCode);
    onFilterChange(1, searchTerm, filterCode, healthFilter, spendFilter);
  };

  const handleHealthFilterChange = (val: string) => {
    setHealthFilter(val);
    onFilterChange(1, searchTerm, activeFilter, val, spendFilter);
  };

  const handleSpendFilterChange = (val: string) => {
    setSpendFilter(val);
    onFilterChange(1, searchTerm, activeFilter, healthFilter, val);
  };

  const handlePrevPage = () => {
    if (pagination.page > 1) {
      onFilterChange(pagination.page - 1, searchTerm, activeFilter, healthFilter, spendFilter);
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      onFilterChange(pagination.page + 1, searchTerm, activeFilter, healthFilter, spendFilter);
    }
  };

  useEffect(() => {
    if (selectedCustomerId) {
      setDrawerOpen(true);
    } else {
      setDrawerOpen(false);
    }
  }, [selectedCustomerId]);

  const toggleDrawer = (open: boolean, id: string | null = null) => {
    onSelectCustomer(id);
    setDrawerOpen(open);
  };

  const getHealthBadgeClass = (score: number) => {
    if (score >= 85) return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    if (score >= 60) return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
    return "bg-red-500/10 text-red-400 border-red-500/20";
  };


  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white mb-2 font-display-sm">Customer Intelligence</h2>
          <p className="text-zinc-400 text-lg font-body-lg">Unified behavioral indices and transactional profiles.</p>
        </div>
      </div>

      {/* Main Search Panel */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
            <input
              type="text"
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 rounded-xl py-3 pl-12 pr-4 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm outline-none"
              placeholder="Search customers by name, email, or city..."
              value={searchTerm}
              onChange={(e) => setSearchString(e.target.value)}
            />
          </div>
          
          <div className="flex gap-3">
            <select
              value={healthFilter}
              onChange={(e) => handleHealthFilterChange(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer min-w-[120px]"
            >
              <option value="all">All Health</option>
              <option value="good">Good Health (80-100)</option>
              <option value="average">Average Health (50-79)</option>
              <option value="poor">Poor Health (&lt;50)</option>
            </select>

            <select
              value={spendFilter}
              onChange={(e) => handleSpendFilterChange(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer min-w-[120px]"
            >
              <option value="all">All Spend Levels</option>
              <option value="high">High Spenders (&gt; ₹50k)</option>
              <option value="medium">Medium Spenders (₹20k - ₹50k)</option>
              <option value="low">Low Spenders (&lt; ₹20k)</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
          {["All Tiers", "VIP", "Inactive", "High Spender", "Frequent"].map((filter, idx) => {
            const code = filter.toLowerCase().replace("all tiers", "all");
            const isActive = activeFilter === code;
            return (
              <button
                key={idx}
                onClick={() => handleTagFilterClick(code)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                  isActive
                    ? "bg-zinc-800 text-white border-zinc-700"
                    : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>

      </div>

      {/* Stats Summary row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 font-bold">Active Intelligence Coverage</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-white">{totalCustomers.toLocaleString()} Profiles</span>
            <span className="text-[10px] text-emerald-500">Real-time Sync</span>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 font-bold">Class-A Average Health Index</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-white">
              {avgHealth}/100
            </span>
            <span className="text-[10px] text-emerald-500 font-semibold">Optimal</span>
          </div>
        </div>
      </div>


      {/* Customer List Card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/40">
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Customer</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Lifetime Value</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-center">Health Index</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-zinc-500 text-sm">
                    No active customers match your query. Try adjusting your query parameters.
                  </td>
                </tr>
              ) : (
                customers.map(customer => (
                  <tr
                    key={customer.id}
                    onClick={() => toggleDrawer(true, customer.id)}
                    className="hover:bg-zinc-800/20 transition-colors cursor-pointer active:bg-zinc-800/40"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700 shrink-0 flex items-center justify-center text-zinc-200 font-bold">
                          {customer.name.split(" ").map(w => w[0]).join("")}
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-100 text-sm leading-snug">{customer.name}</p>
                          <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                            <MapPin size={10} /> {customer.city} • {customer.tags[0] || "Standard"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <p className="font-semibold text-zinc-100">₹{customer.ltv.toLocaleString()}</p>
                      <p className="text-[10px] text-zinc-500">{(customer as any).orderCount ?? 0} orders</p>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded border text-xs font-semibold ${getHealthBadgeClass(customer.healthScore)}`}>
                        {customer.healthScore}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDrawer(true, customer.id);
                        }}
                        className="p-1 px-2.5 text-xs text-zinc-400 hover:text-white rounded border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer Dashboard Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center px-4 py-3 bg-zinc-950/80 border-t border-zinc-800/60 text-[10px] select-none gap-3">
          <div className="text-zinc-500">
            Showing <span className="text-zinc-300 font-semibold">{customers.length}</span> profiles of <span className="text-zinc-300 font-semibold">{pagination.totalCount.toLocaleString()}</span> matching entries
          </div>
          <div className="flex items-center gap-3 font-mono">
            <button
              onClick={handlePrevPage}
              disabled={pagination.page <= 1}
              className="px-2.5 py-1 rounded border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              &lt; Prev
            </button>
            <span className="text-zinc-550">
              Page <span className="text-zinc-200">{pagination.page}</span> of <span className="text-zinc-200">{pagination.totalPages}</span>
            </span>
            <button
              onClick={handleNextPage}
              disabled={pagination.page >= pagination.totalPages}
              className="px-2.5 py-1 rounded border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              Next &gt;
            </button>
          </div>
        </div>
      </div>


      {/* Customer Sliding Drawer Profile Sheet */}
      {drawerOpen && selectedCustomer && (
        <React.Fragment>
          {/* Overlay background */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] transition-opacity duration-300"
            onClick={() => toggleDrawer(false, null)}
          />
          
          <div className="fixed inset-y-0 right-0 z-[110] w-full max-w-md bg-zinc-950 shadow-2xl border-l border-zinc-800 p-6 flex flex-col justify-between overflow-y-auto no-scrollbar animate-slide-in">
            <div>
              {/* Drawer Handle / Close */}
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Customer Dossier</span>
                <button
                  onClick={() => toggleDrawer(false, null)}
                  className="px-3 py-1 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded text-xs transition-colors"
                >
                  Close
                </button>
              </div>

              {/* Avatar Metadata */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-xl bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center font-bold text-lg text-indigo-400">
                  {selectedCustomer.name.split(" ").map(w => w[0]).join("")}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white leading-tight">{selectedCustomer.name}</h3>
                  <p className="text-xs text-zinc-400 flex items-center gap-1 mt-1">
                    <Mail size={12} /> {selectedCustomer.email}
                  </p>
                  <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                    <Phone size={12} /> {selectedCustomer.phone}
                  </p>
                </div>
              </div>

              {/* Tag Row */}
              <div className="flex flex-wrap gap-1 mb-6">
                {selectedCustomer.tags.map((tag, i) => (
                  <span key={i} className="text-[10px] uppercase tracking-wider font-bold bg-zinc-900 text-indigo-400 px-2 py-0.5 rounded border border-zinc-800">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Stats bento */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-3 bg-zinc-900/40 rounded-lg border border-zinc-800">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Lifetime Value</p>
                  <p className="text-base font-bold text-zinc-100">₹{selectedCustomer.ltv.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-zinc-900/40 rounded-lg border border-zinc-800">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Health Score</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className={`text-base font-bold ${selectedCustomer.healthScore >= 80 ? "text-emerald-500" : "text-indigo-400"}`}>
                      {selectedCustomer.healthScore}
                    </p>
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedCustomer.healthScore >= 80 ? "bg-emerald-500" : "bg-indigo-400"}`}></span>
                  </div>
                </div>
                <div className="p-3 bg-zinc-900/40 rounded-lg border border-zinc-800">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Last Activity Date</p>
                  <p className="text-xs text-zinc-100 mt-1">
                    {new Date(selectedCustomer.lastActivityAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <div className="p-3 bg-zinc-900/40 rounded-lg border border-zinc-800">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Home Location</p>
                  <p className="text-xs text-zinc-100 mt-1 flex items-center gap-0.5">
                    <MapPin size={10} /> {selectedCustomer.city}
                  </p>
                </div>
              </div>

              {/* Purchase history */}
              <div className="mb-6">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Purchase Record</h4>
                <div className="space-y-2">
                  {selectedCustomer.purchaseHistory.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-zinc-900/20 border border-zinc-800 flex justify-between items-center">
                      <div>
                        <p className="text-xs text-zinc-100 font-medium">{item.items}</p>
                        <p className="text-[10px] text-zinc-500">{item.date}</p>
                      </div>
                      <p className="text-xs font-mono font-semibold text-indigo-400">
                        ₹{item.totalValue.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 font-sans">Engagement Timeline</h4>
                <div className="space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-zinc-800">
                  {selectedCustomer.campaignTimeline.map((item, idx) => (
                    <div key={idx} className="relative pl-8">
                      <div className="absolute left-[3px] top-1 w-4 h-4 rounded-full bg-zinc-950 border-2 border-indigo-400 flex items-center justify-center z-10">
                        <Award size={8} className="text-indigo-400" />
                      </div>
                      <div className="flex justify-between items-start">
                        <p className="text-xs text-zinc-100 font-medium">{item.campaignName}</p>
                        <p className="text-[10px] text-zinc-500">{item.date}</p>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        State matched: <span className="text-emerald-500 capitalize">{item.action}</span> via {item.channel}
                      </p>
                    </div>
                  ))}
                  {selectedCustomer.campaignTimeline.length === 0 && (
                    <p className="text-xs text-zinc-500 pl-8">No campaign engagement registered yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="mt-8 pt-4 border-t border-zinc-800 pb-8 space-y-4">
              {actionError && (
                <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-400 text-xs rounded-lg leading-normal">
                  ⚠️ {actionError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {user?.role === "Admin" ? (
                  <button
                    onClick={handlePruneProfile}
                    disabled={pruning}
                    className="py-2.5 rounded-lg border border-zinc-805 text-xs font-semibold text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {pruning ? "Pruning..." : "Prune Profile"}
                  </button>
                ) : (
                  <div className="py-2.5 px-3 rounded-lg border border-zinc-800/40 text-[10px] text-zinc-500 font-semibold flex items-center justify-center gap-1.5 bg-zinc-950/20">
                    <ShieldAlert size={12} className="text-zinc-650 shrink-0" />
                    <span>Pruning Restricted</span>
                  </div>
                )}
                <button className="py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-opacity hover:opacity-95">
                  Send Direct Message
                </button>
              </div>
            </div>
          </div>
        </React.Fragment>
      )}
    </div>
  );
}
