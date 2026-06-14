import React, { useState, useEffect } from "react";
import { Settings, User, Building, Shield, Bell, Key, Sparkles, Sliders, Plus, Users, ShieldAlert, Trash2 } from "lucide-react";

interface SettingsPanelProps {
  onCompanyChanged: () => void;
  user: { id?: string; name: string; email: string; role: string; companyId?: string | null } | null;
}

export default function SettingsPanel({ onCompanyChanged, user }: SettingsPanelProps) {
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [orgName, setOrgName] = useState("Acme Retail Brand Co.");
  const [modelType, setModelType] = useState("gemini-3.5-flash");
  const [temperature, setTemperature] = useState(0.7);
  const [theme, setTheme] = useState("dark");
  const [notifWhatsapp, setNotifWhatsapp] = useState(true);
  const [notifEmail, setNotifEmail] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Workshop toggles
  const [activeCustomerWorkshop, setActiveCustomerWorkshop] = useState(false);
  const [activeShopWorkshop, setActiveShopWorkshop] = useState(true);

  // Product Catalog
  const [productName, setProductName] = useState("");
  const [productCategory, setProductCategory] = useState("Store");
  const [productPrice, setProductPrice] = useState("50.0");
  const [addingProduct, setAddingProduct] = useState(false);

  // Tab management & user administration states
  const [activeSection, setActiveSection] = useState(0);
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string; role: string; company?: { name: string } | null; createdAt: string }>>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Add User Modal State variables
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addRole, setAddRole] = useState("MarketingManager");
  const [addCompanyId, setAddCompanyId] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);

  const [confirmDeleteUser, setConfirmDeleteUser] = useState<{ id: string; name: string } | null>(null);
  const [customAlert, setCustomAlert] = useState<{ title: string; message: string; type?: "error" | "warning" } | null>(null);

  const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/companies");
      const data = await res.json();
      if (data.success && data.companies) {
        setCompanies(data.companies);
        const activeComp = data.companies.find((c: any) => c.id === user?.companyId);
        if (activeComp) {
          setOrgName(activeComp.name);
        }
      }
    } catch (e) {
      console.error("Failed to fetch companies list", e);
    }
  };

  const fetchUsers = async () => {
    if (user?.role !== "Admin") return;
    setUsersLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.success && data.users) {
        setUsers(data.users);
      }
    } catch (e) {
      console.error("Failed to fetch users list", e);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
    if (user?.role === "Admin") {
      fetchUsers();
    }
  }, [user?.companyId, user?.role]);

  const handleSwitchCompany = async (companyId: string) => {
    if (!companyId) return;
    setSwitching(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/auth/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId })
      });
      const data = await res.json();
      if (data.success) {
        onCompanyChanged();
      } else {
        setErrorMsg(data.error || "Failed to switch company context.");
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("Network error trying to switch company context.");
    } finally {
      setSwitching(false);
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;
    setCreating(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCompanyName.trim() })
      });
      const data = await res.json();
      if (data.success && data.company) {
        setNewCompanyName("");
        await fetchCompanies();
        // Automatically switch to the newly created company
        await handleSwitchCompany(data.company.id);
      } else {
        setErrorMsg(data.error || "Failed to register new company.");
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("Network error: failed to create company.");
    } finally {
      setCreating(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim() || !productCategory.trim() || !productPrice.trim()) return;
    setAddingProduct(true);
    try {
      await fetch("/api/v1/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: productName.trim(),
          category: productCategory.trim(),
          price: parseFloat(productPrice)
        })
      });
      setProductName("");
      saveSettings(); // Show success banner
    } catch (err) {
      console.error("Failed to add product", err);
    } finally {
      setAddingProduct(false);
    }
  };

  const saveSettings = () => {
    // Elegant localized feedback alert
    const banner = document.getElementById("settings-save-alert");
    if (banner) {
      banner.classList.remove("hidden");
      setTimeout(() => {
        banner.classList.add("hidden");
      }, 3000);
    }
  };

  // User Administration Handlers
  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !addEmail.trim() || !addPassword.trim() || !addRole) return;
    setAddLoading(true);
    setAddError(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addName.trim(),
          email: addEmail.trim(),
          password: addPassword.trim(),
          role: addRole,
          companyId: addCompanyId || null
        })
      });
      const data = await res.json();
      if (data.success) {
        setAddName("");
        setAddEmail("");
        setAddPassword("");
        setAddRole("MarketingManager");
        setAddCompanyId("");
        setShowAddModal(false);
        fetchUsers();
      } else {
        setAddError(data.error || "Failed to provision new user.");
      }
    } catch (err: any) {
      console.error(err);
      setAddError(err.message || "Network error provisioning user.");
    } finally {
      setAddLoading(false);
    }
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    if (userId === user?.id) {
      setCustomAlert({
        title: "Action Restricted",
        message: "You cannot change your own administrator role.",
        type: "warning"
      });
      return;
    }
    const nextRole = currentRole === "Admin" ? "MarketingManager" : "Admin";
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole })
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      } else {
        setCustomAlert({
          title: "Update Failed",
          message: data.error || "Failed to update user role.",
          type: "error"
        });
      }
    } catch (e: any) {
      console.error(e);
      setCustomAlert({
        title: "Network Error",
        message: "Network error updating user role. Please try again.",
        type: "error"
      });
    }
  };

  const handleDeleteUserClick = (userId: string, userName: string) => {
    if (userId === user?.id) {
      setCustomAlert({
        title: "Action Restricted",
        message: "You cannot delete your own administrator session.",
        type: "warning"
      });
      return;
    }
    setConfirmDeleteUser({ id: userId, name: userName });
  };

  const executeDeleteUser = async () => {
    if (!confirmDeleteUser) return;
    const { id: userId } = confirmDeleteUser;
    setConfirmDeleteUser(null);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      } else {
        setCustomAlert({
          title: "Deletion Failed",
          message: data.error || "Failed to delete user.",
          type: "error"
        });
      }
    } catch (e: any) {
      console.error(e);
      setCustomAlert({
        title: "Network Error",
        message: "Network error deleting user. Please try again.",
        type: "error"
      });
    }
  };

  const settingItems = user?.role === "Admin"
    ? [
        { label: "Profile & Brand Workspace", icon: User },
        { label: "AI Models & Weights", icon: Sliders },
        { label: "Developer Keys & Webhooks", icon: Key },
        { label: "Workspace User Roster", icon: Users },
        { label: "Notification Channels", icon: Bell },
        { label: "Product Catalog", icon: Plus }
      ]
    : [
        { label: "Profile & Brand Workspace", icon: User },
        { label: "AI Models & Weights", icon: Sliders },
        { label: "Developer Keys & Webhooks", icon: Key },
        { label: "Notification Channels", icon: Bell },
        { label: "Product Catalog", icon: Plus }
      ];

  return (
    <div className="space-y-6 animate-fade-in" id="settings_block">
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-white mb-2 font-display-sm">
          {user?.role === "Admin" ? "Workspace Config & Administration" : "Settings & Configurations"}
        </h2>
        <p className="text-zinc-400 text-lg font-body-lg">
          {user?.role === "Admin" ? "Manage tenants, view active workspace roster, and adjust neural settings." : "Configure brand systems, webhook credentials, and model architectures."}
        </p>
      </div>

      <div id="settings-save-alert" className="hidden p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold animate-fade-in">
        ✓ Brand configurations and core webhook callbacks saved successfully!
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Navigation panel */}
        <div className="space-y-2">
          {settingItems.map((item, idx) => {
            const Icon = item.icon;
            const isSelected = activeSection === idx;
            return (
              <div
                key={idx}
                onClick={() => setActiveSection(idx)}
                className={`p-3.5 rounded-xl flex items-center gap-3 cursor-pointer transition-colors border ${
                  isSelected
                    ? "bg-indigo-600/10 border-indigo-500 text-indigo-400"
                    : "bg-zinc-900 border border-zinc-805 hover:bg-zinc-850 hover:text-white text-zinc-400"
                }`}
              >
                <Icon size={14} />
                <span className="text-xs font-semibold">{item.label}</span>
              </div>
            );
          })}
        </div>

        {/* Configuration sheets */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Brand */}
          {activeSection === 0 && (
            <section className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl space-y-4 shadow-xl animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Building size={16} className="text-indigo-400" />
                  <h3 className="font-semibold text-white text-sm">Brand & Organization Switcher</h3>
                </div>
                {switching && <span className="text-[10px] text-zinc-500 font-mono animate-pulse">Switching context...</span>}
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg font-mono">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block font-mono">Active Brand Workspace</label>
                  <select
                    value={user?.companyId || ""}
                    onChange={(e) => handleSwitchCompany(e.target.value)}
                    disabled={switching}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm mt-1 cursor-pointer disabled:opacity-50"
                  >
                    <option value="" disabled>Select brand workspace...</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.id === user?.companyId ? " (Active)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block font-mono">Primary Target Region</label>
                  <select className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm mt-1 cursor-pointer">
                    <option value="chennai">Chennai (Primary Roastery)</option>
                    <option value="bangalore">Bangalore (Tech Sector)</option>
                    <option value="mumbai">Mumbai (West Sourcing)</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-zinc-850 pt-4 mt-2">
                <form onSubmit={handleCreateCompany} className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block font-mono">Provision New Brand Workspace</label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="text"
                      placeholder="e.g. Chennai Coffee Co."
                      value={newCompanyName}
                      onChange={(e) => setNewCompanyName(e.target.value)}
                      disabled={creating}
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 placeholder-zinc-700 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs"
                    />
                    <button
                      type="submit"
                      disabled={creating || !newCompanyName.trim()}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Plus size={14} />
                      {creating ? "Creating..." : "Provision"}
                    </button>
                  </div>
                </form>
              </div>

              <div className="border-t border-zinc-850 pt-4 mt-2 space-y-4">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest block font-mono">Administrative Workshops</h4>
                
                <label className="flex items-center justify-between p-3.5 bg-zinc-950 border border-zinc-850 rounded-xl cursor-pointer hover:border-zinc-800 transition-colors">
                  <div>
                    <span className="text-xs font-semibold text-zinc-200 block">Active Customer Workshop</span>
                    <span className="text-[10px] text-zinc-500 font-mono mt-0.5">Enable deep customer analytics training workshop</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={activeCustomerWorkshop}
                    onChange={(e) => setActiveCustomerWorkshop(e.target.checked)}
                    className="accent-indigo-500 w-4 h-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 bg-zinc-950 border border-zinc-850 rounded-xl cursor-pointer hover:border-zinc-800 transition-colors">
                  <div>
                    <span className="text-xs font-semibold text-zinc-200 block">Active Shop Workshop</span>
                    <span className="text-[10px] text-zinc-500 font-mono mt-0.5">Enable retail flow optimization tools</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={activeShopWorkshop}
                    onChange={(e) => setActiveShopWorkshop(e.target.checked)}
                    className="accent-indigo-500 w-4 h-4 cursor-pointer"
                  />
                </label>
              </div>
            </section>
          )}

          {/* Section 2: AI weights */}
          {activeSection === 1 && (
            <section className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl space-y-4 shadow-xl animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-indigo-400" />
                <h3 className="font-semibold text-white text-sm">Neural Model Hyperparameters</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block font-mono">Active Generation Model</label>
                  <select
                    value={modelType}
                    onChange={(e) => setModelType(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm mt-1 cursor-pointer"
                  >
                    <option value="gemini-3.5-flash">Gemini 3.5 Flash (Default)</option>
                    <option value="gemini-3.5-pro">Gemini 3.5 Pro (Precision Context)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-zinc-400">
                    <span>Temperature Offset ({temperature})</span>
                    <span>More Creative</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.5"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 bg-zinc-950 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </section>
          )}

          {/* Section 3: Integrations */}
          {activeSection === 2 && (
            <section className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl space-y-4 shadow-xl animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Key size={16} className="text-indigo-400" />
                  <h3 className="font-semibold text-white text-sm">Developer Webhooks</h3>
                </div>
                <span className="text-[9px] text-emerald-400 bg-emerald-505/10 border border-emerald-950 px-2 py-0.5 rounded font-mono font-bold uppercase">ACTIVE</span>
              </div>
              
              <div className="space-y-3">
                <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-lg flex justify-between items-center text-xs">
                  <div>
                    <p className="font-semibold text-white">WhatsApp Sandbox Hook URL</p>
                    <p className="text-zinc-500 font-mono text-[10px] mt-0.5">https://ais-dev-jwxoczhxi3o5kkormjr2y2-3000.run.app/api/callbacks</p>
                  </div>
                  <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono px-2 py-0.5 rounded cursor-pointer hover:bg-zinc-850 transition-colors">TEST</span>
                </div>

                <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-lg flex justify-between items-center text-xs">
                  <div>
                    <p className="font-semibold text-white">VDI Encryption Certificate State</p>
                    <p className="text-zinc-500 font-mono text-[10px] mt-0.5">RSA-4096 Self-attested developer key active</p>
                  </div>
                  <Shield size={14} className="text-indigo-400" />
                </div>
              </div>
            </section>
          )}

          {/* Section 4: Workspace User Roster (Admin Only) */}
          {activeSection === 3 && user?.role === "Admin" && (
            <section className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl space-y-4 shadow-xl animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-indigo-400" />
                  <h3 className="font-semibold text-white text-sm">Workspace User Roster</h3>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setAddError(null);
                      setShowAddModal(true);
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-505 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={11} />
                    <span>Create User</span>
                  </button>
                  <span className="text-[9px] text-indigo-400 bg-indigo-500/10 border border-indigo-900/30 px-2 py-0.5 rounded font-mono font-bold uppercase">ADMIN VIEW</span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/60">
                      <th className="p-3 font-semibold text-zinc-400">User</th>
                      <th className="p-3 font-semibold text-zinc-400">Role</th>
                      <th className="p-3 font-semibold text-zinc-400">Assigned Company</th>
                      <th className="p-3 font-semibold text-zinc-400">Created At</th>
                      <th className="p-3 font-semibold text-zinc-400 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {usersLoading ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-zinc-550 font-mono">
                          Loading user records...
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-zinc-550">
                          No users registered.
                        </td>
                      </tr>
                    ) : (
                      users.map(u => (
                        <tr key={u.id} className="hover:bg-zinc-900/40 transition-colors">
                          <td className="p-3">
                            <div className="font-semibold text-zinc-200">{u.name}</div>
                            <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{u.email}</div>
                          </td>
                          <td className="p-3">
                            <select
                              value={u.role}
                              disabled={u.id === user?.id}
                              onChange={() => handleToggleRole(u.id, u.role)}
                              className="bg-zinc-950 border border-zinc-800 text-zinc-150 rounded px-2 py-1 text-[10px] cursor-pointer outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                              <option value="Admin">Admin</option>
                              <option value="MarketingManager">MarketingManager</option>
                            </select>
                          </td>
                          <td className="p-3 text-zinc-400">
                            {u.company?.name || "System Global"}
                          </td>
                          <td className="p-3 text-zinc-500 font-mono text-[10px]">
                            {new Date(u.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                          </td>
                          <td className="p-3 text-center">
                            {u.id !== user?.id ? (
                              <button
                                onClick={() => handleDeleteUserClick(u.id, u.name)}
                                className="p-1.5 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 rounded-lg transition-colors border border-transparent hover:border-red-500/20 cursor-pointer"
                                title="Delete user"
                              >
                                <Trash2 size={12} />
                              </button>
                            ) : (
                              <span className="text-[9px] text-zinc-650 font-mono">Current Session</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Section 5: Notification Channels */}
          {activeSection === (user?.role === "Admin" ? 4 : 3) && (
            <section className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl space-y-4 shadow-xl animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <Bell size={16} className="text-indigo-400" />
                <h3 className="font-semibold text-white text-sm">Notification Channels Toggle</h3>
              </div>
              <p className="text-zinc-555 text-xs">Configure where alert notifications should be broadcasted.</p>
              
              <div className="space-y-3 pt-2">
                <label className="flex items-center justify-between p-3.5 bg-zinc-950 border border-zinc-850 rounded-xl cursor-pointer hover:border-zinc-800 transition-colors">
                  <div>
                    <span className="text-xs font-semibold text-zinc-200 block">WhatsApp Alerts</span>
                    <span className="text-[10px] text-zinc-500 font-mono mt-0.5">Real-time socket campaigns events</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifWhatsapp}
                    onChange={(e) => setNotifWhatsapp(e.target.checked)}
                    className="accent-indigo-500 w-4 h-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 bg-zinc-950 border border-zinc-850 rounded-xl cursor-pointer hover:border-zinc-800 transition-colors">
                  <div>
                    <span className="text-xs font-semibold text-zinc-200 block">Email Digest Alerts</span>
                    <span className="text-[10px] text-zinc-500 font-mono mt-0.5">Daily summary reports</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifEmail}
                    onChange={(e) => setNotifEmail(e.target.checked)}
                    className="accent-indigo-500 w-4 h-4 cursor-pointer"
                  />
                </label>
              </div>
            </section>
          )}

          {/* Section: Product Catalog */}
          {activeSection === settingItems.length - 1 && (
            <section className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl space-y-4 shadow-xl animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Plus size={16} className="text-indigo-400" />
                  <h3 className="font-semibold text-white text-sm">Product Catalog</h3>
                </div>
              </div>
              <p className="text-zinc-555 text-xs">Add new products to your store catalog. These will be available for customers to purchase during campaigns.</p>
              
              <div className="border-t border-zinc-850 pt-4 mt-2">
                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block font-mono">Product Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Premium Blend Coffee"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        disabled={addingProduct}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 placeholder-zinc-700 outline-none focus:ring-1 focus:ring-indigo-500 text-sm mt-1 disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block font-mono">Category</label>
                      <input
                        type="text"
                        placeholder="e.g. Store"
                        value={productCategory}
                        onChange={(e) => setProductCategory(e.target.value)}
                        disabled={addingProduct}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 placeholder-zinc-700 outline-none focus:ring-1 focus:ring-indigo-500 text-sm mt-1 disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div className="space-y-1 w-full md:w-1/2 pr-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block font-mono">Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="50.00"
                      value={productPrice}
                      onChange={(e) => setProductPrice(e.target.value)}
                      disabled={addingProduct}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 placeholder-zinc-700 outline-none focus:ring-1 focus:ring-indigo-500 text-sm mt-1 disabled:opacity-50"
                    />
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={addingProduct || !productName.trim() || !productCategory.trim() || !productPrice.trim()}
                      className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-all shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      {addingProduct ? "Adding..." : "Add Product"}
                    </button>
                  </div>
                </form>
              </div>
            </section>
          )}

          {/* Save panel */}
          <div className="flex justify-end pt-2">
            <button
              onClick={saveSettings}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-all shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer"
            >
              Committed Sandbox Parameters
            </button>
          </div>
        </div>
      </div>

      {/* Add User Modal Dialog */}
      {showAddModal && (
        <React.Fragment>
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[200] transition-opacity animate-fade-in"
            onClick={() => setShowAddModal(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[210] w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
              <div className="flex items-center gap-2">
                <Users size={15} className="text-indigo-400" />
                <h3 className="font-semibold text-white text-xs">Provision New User Account</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-500 hover:text-white font-mono text-[10px] cursor-pointer"
              >
                Close
              </button>
            </div>

            {addError && (
              <div className="p-2.5 bg-red-950/20 border border-red-900/30 text-red-400 text-[10px] rounded-lg font-mono leading-relaxed">
                ⚠️ {addError}
              </div>
            )}

            <form onSubmit={handleCreateUserSubmit} className="space-y-3.5 text-[11px]">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">User Display Name</label>
                <input
                  type="text"
                  required
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-150 placeholder-zinc-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Email Address</label>
                <input
                  type="email"
                  required
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="e.g. rahul@xenopulse.com"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-150 placeholder-zinc-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Secret Keyphrase</label>
                <input
                  type="password"
                  required
                  value={addPassword}
                  onChange={(e) => setAddPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-150 placeholder-zinc-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Access Role</label>
                  <select
                    value={addRole}
                    onChange={(e) => setAddRole(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-150 outline-none focus:border-indigo-500 text-xs cursor-pointer"
                  >
                    <option value="MarketingManager">MarketingManager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Brand Space</label>
                  <select
                    value={addCompanyId}
                    onChange={(e) => setAddCompanyId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-150 outline-none focus:border-indigo-500 text-xs cursor-pointer"
                  >
                    <option value="">System Global</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Plus size={12} />
                  {addLoading ? "Provisioning..." : "Provision Account"}
                </button>
              </div>
            </form>
          </div>
        </React.Fragment>
      )}

      {/* Custom Alert/Warning Modal */}
      {customAlert && (
        <React.Fragment>
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[300] transition-opacity animate-fade-in"
            onClick={() => setCustomAlert(null)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[310] w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4 animate-fade-in text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                <ShieldAlert className="w-6 h-6 text-amber-500 animate-pulse" />
              </div>
              <h3 className="text-base font-bold text-white font-display-sm">{customAlert.title}</h3>
              <p className="text-zinc-400 text-xs leading-relaxed font-sans mt-1">
                {customAlert.message}
              </p>
            </div>
            <div className="pt-2 flex justify-center">
              <button
                onClick={() => setCustomAlert(null)}
                className="w-full py-2.5 bg-zinc-850 hover:bg-zinc-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border border-zinc-800"
              >
                Dismiss
              </button>
            </div>
          </div>
        </React.Fragment>
      )}

      {/* Custom Delete Confirmation Modal */}
      {confirmDeleteUser && (
        <React.Fragment>
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[300] transition-opacity animate-fade-in"
            onClick={() => setConfirmDeleteUser(null)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[310] w-full max-w-sm bg-zinc-900 border border-zinc-805 rounded-2xl p-6 shadow-2xl space-y-4 animate-fade-in text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-base font-bold text-white font-display-sm">Confirm Account Deletion</h3>
              <p className="text-zinc-400 text-xs leading-relaxed font-sans mt-1 text-center">
                Are you sure you want to permanently delete the user account of <strong className="text-white font-semibold">{confirmDeleteUser.name}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="pt-2 flex gap-3">
              <button
                onClick={() => setConfirmDeleteUser(null)}
                className="flex-1 py-2.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border border-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={executeDeleteUser}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-lg shadow-red-600/10"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </React.Fragment>
      )}
    </div>
  );
}
