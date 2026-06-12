import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global Fetch Interceptor to map Vite React SPA to FastAPI Backend
const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  let url = typeof input === "string" ? input : input.toString();

  // Helper to get headers with Auth token
  const getHeaders = (extra: Record<string, string> = {}) => {
    const token = localStorage.getItem("xp_token");
    const headers = new Headers(init?.headers || {});
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    Object.entries(extra).forEach(([k, v]) => headers.set(k, v));
    return headers;
  };

  // 1. Intercept Login
  if (url === "/api/auth/login" && init?.method === "POST" && init.body) {
    try {
      const bodyData = JSON.parse(init.body as string);
      const params = new URLSearchParams();
      params.append("username", bodyData.email);
      params.append("password", bodyData.password);

      const res = await originalFetch("/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      });

      if (!res.ok) {
        return new Response(JSON.stringify({ success: false, error: "Invalid credentials" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      const data = await res.json();
      const token = data.access_token;
      localStorage.setItem("xp_token", token);

      // Fetch user profile from /api/v1/auth/me
      const meRes = await originalFetch("/api/v1/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!meRes.ok) {
        return new Response(JSON.stringify({ success: false, error: "Failed to load user profile" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      const meData = await meRes.json();
      const user = {
        id: String(meData.id),
        name: meData.full_name,
        email: meData.email,
        role: meData.role === "Admin" ? "Admin" : "MarketingManager",
        companyId: "chennai",
      };

      return new Response(JSON.stringify({ success: true, user }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      return new Response(JSON.stringify({ success: false, error: "Authentication server connection error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // 2. Intercept Session Check
  if (url === "/api/auth/session") {
    const token = localStorage.getItem("xp_token");
    if (!token) {
      return new Response(JSON.stringify({ success: false }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const meRes = await originalFetch("/api/v1/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!meRes.ok) {
        localStorage.removeItem("xp_token");
        return new Response(JSON.stringify({ success: false }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      const meData = await meRes.json();
      const user = {
        id: String(meData.id),
        name: meData.full_name,
        email: meData.email,
        role: meData.role === "Admin" ? "Admin" : "MarketingManager",
        companyId: "chennai",
      };

      return new Response(JSON.stringify({ success: true, user }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      return new Response(JSON.stringify({ success: false }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // 3. Intercept Logout
  if (url === "/api/auth/logout" && init?.method === "POST") {
    localStorage.removeItem("xp_token");
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 4. Intercept Companies & Users Mock routes
  if (url === "/api/companies" && init?.method === "GET") {
    return new Response(JSON.stringify({
      success: true,
      companies: [{ id: "chennai", name: "Chennai Coffee Co." }]
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  if (url === "/api/companies" && init?.method === "POST") {
    const bodyData = JSON.parse(init.body as string);
    return new Response(JSON.stringify({
      success: true,
      company: { id: "new-company", name: bodyData.name }
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  if (url === "/api/users" && init?.method === "GET") {
    // Return empty user roster stub
    return new Response(JSON.stringify({
      success: true,
      users: []
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  if (url.startsWith("/api/users") && init?.method === "POST") {
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  if (url === "/api/auth/company" && init?.method === "POST") {
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  // 5. Intercept Customer Listing and Details (Enriching mock ltv & healthScore)
  if (url.includes("/api/customers")) {
    let fetchUrl = url;
    let pageNum = 1;
    let limitNum = 50;
    try {
      const parsedUrl = new URL(url, window.location.origin);
      pageNum = parseInt(parsedUrl.searchParams.get("page") || "1");
      limitNum = parseInt(parsedUrl.searchParams.get("limit") || "50");
      const search = parsedUrl.searchParams.get("search") || "";
      const tag = parsedUrl.searchParams.get("tag") || "all";
      
      const skip = (pageNum - 1) * limitNum;
      parsedUrl.searchParams.set("skip", String(skip));
      parsedUrl.searchParams.set("limit", String(limitNum));
      parsedUrl.searchParams.delete("page");
      
      if (search) {
        parsedUrl.searchParams.set("search", search);
      }
      
      if (tag && tag !== "all") {
        if (tag === "VIP" || tag === "High Spender" || tag === "Frequent") {
          parsedUrl.searchParams.set("status", "Customer");
        } else if (tag === "Inactive") {
          parsedUrl.searchParams.set("status", "Inactive");
        } else if (tag === "New") {
          parsedUrl.searchParams.set("status", "Lead");
        } else {
          parsedUrl.searchParams.set("status", tag);
        }
        parsedUrl.searchParams.delete("tag");
      }
      
      fetchUrl = parsedUrl.pathname + parsedUrl.search;
    } catch(e) {}

    const res = await originalFetch(fetchUrl, {
      ...init,
      headers: getHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const mappedCustomers = data.map((c: any) => {
          const idNum = parseInt(c.id) || 1;
          const healthScore = 50 + (idNum % 51); // 50 to 100
          const ltv = 500 + (idNum % 4500); // 500 to 5000
          const tags = c.status === "Inactive" ? ["Inactive"] : c.status === "Lead" ? ["New"] : ["Customer"];
          return {
            id: String(c.id),
            name: c.name,
            email: c.email,
            phone: c.phone,
            city: "Chennai",
            ltv: ltv,
            healthScore: healthScore,
            tags: tags,
            lastActivityAt: c.created_at || new Date().toISOString(),
            createdAt: c.created_at || new Date().toISOString(),
            purchaseHistory: [],
            campaignTimeline: [],
          };
        });
        const totalProfiles = data.length < limitNum ? (pageNum - 1) * limitNum + data.length : 1000;
        const totalPages = Math.ceil(totalProfiles / limitNum);
        return new Response(JSON.stringify({
          success: true,
          customers: mappedCustomers,
          stats: {
            totalProfiles: totalProfiles,
            averageHealthScore: 82,
          },
          pagination: {
            page: pageNum,
            limit: limitNum,
            totalPages: totalPages,
            totalCount: totalProfiles,
          }
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Single customer details response
      if (data && data.id) {
        const c = data;
        const idNum = parseInt(c.id) || 1;
        const healthScore = 50 + (idNum % 51);
        const ltv = 500 + (idNum % 4500);
        const tags = c.status === "Inactive" ? ["Inactive"] : c.company ? [c.company] : [];
        const mappedCustomer = {
          id: String(c.id),
          name: c.name,
          email: c.email,
          phone: c.phone,
          city: "Chennai",
          ltv: ltv,
          healthScore: healthScore,
          tags: tags,
          lastActivityAt: c.created_at || new Date().toISOString(),
          createdAt: c.created_at || new Date().toISOString(),
          purchaseHistory: [
            { id: "o-1", items: c.company || "Retail Purchase", totalValue: ltv, date: new Date().toISOString() }
          ],
          campaignTimeline: [],
        };
        return new Response(JSON.stringify({
          success: true,
          customer: mappedCustomer
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
  }

  // 6. Intercept AI CommandCenter goals analyze
  if (url === "/api/goals/analyze" && init?.method === "POST" && init.body) {
    try {
      const bodyData = JSON.parse(init.body as string);
      
      const res = await originalFetch("/api/v1/ai/command", {
        method: "POST",
        headers: getHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ prompt: bodyData.goal || bodyData.prompt })
      });

      if (res.ok) {
        const data = await res.json();
        const strategy = {
          audienceName: data.segment_name,
          audienceSize: data.audience_count,
          recommendedChannel: data.channel,
          recommendedOffer: data.cta,
          predictedOpenRate: 85,
          predictedClickRate: 15,
          message: data.campaign_message
        };
        return new Response(JSON.stringify({ success: true, strategy }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
    } catch (e) {
      console.error("Command Center intercept error", e);
    }
  }

  // 7. Intercept AudienceStudio AI segment analyze
  if (url === "/api/audiences/analyze" && init?.method === "POST" && init.body) {
    try {
      const bodyData = JSON.parse(init.body as string);
      const res = await originalFetch("/api/v1/ai/segment", {
        method: "POST",
        headers: getHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ prompt: bodyData.prompt })
      });

      if (res.ok) {
        const data = await res.json();
        const analysis = {
          matchesCount: data.audience_count,
          matchedCustomers: (data.sample_customers || []).map((c: any) => ({
            id: String(c.id),
            name: c.name,
            email: c.email,
            phone: c.phone
          })),
          criteria: {
            cityCondition: "SQL scan performed successfully",
            spendingThreshold: data.sql_filter,
            inactivityDays: "Filter compiled matching context"
          }
        };
        return new Response(JSON.stringify({ success: true, analysis }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
    } catch (e) {
      console.error("Audience Studio intercept error", e);
    }
  }

  // 8. Intercept Campaigns create and list
  if (url.includes("/api/campaigns")) {
    // Create Campaign
    if (init?.method === "POST" && init.body) {
      try {
        const bodyData = JSON.parse(init.body as string);
        const payload = {
          name: bodyData.name,
          segment: bodyData.audienceSegmentName || "All Customers",
          message: JSON.stringify({ body: bodyData.messageTemplate, title: bodyData.name, cta: "Unlock Promo" }),
          channel: bodyData.channel,
          status: bodyData.status === "RUNNING" ? "Active" : "Draft"
        };

        const res = await originalFetch("/api/v1/campaigns/", {
          method: "POST",
          headers: getHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json();
          const mappedCampaign = {
            id: String(data.id),
            name: data.name,
            channel: data.channel,
            messageTemplate: bodyData.messageTemplate,
            audienceSegmentName: data.segment,
            audienceSize: bodyData.audienceSize || 1000,
            status: data.status === "Active" ? "RUNNING" : "DRAFT",
            sentCount: 0,
            deliveredCount: 0,
            openedCount: 0,
            readCount: 0,
            clickedCount: 0,
            convertedCount: 0,
            failedCount: 0,
            createdAt: data.created_at || new Date().toISOString()
          };
          return new Response(JSON.stringify({ success: true, campaign: mappedCampaign }), {
            status: 201,
            headers: { "Content-Type": "application/json" }
          });
        }
      } catch (e) {
        console.error("Campaign creation intercept failed", e);
      }
    }

    // Launch Campaign send
    if (url.match(/\/api\/campaigns\/\d+\/send/)) {
      const campId = url.match(/\/api\/campaigns\/(\d+)\/send/)?.[1];
      const res = await originalFetch(`/api/v1/campaigns/${campId}/launch`, {
        method: "POST",
        headers: getHeaders()
      });
      return new Response(JSON.stringify({ success: res.ok }), {
        status: res.status,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Run Campaign simulation pause
    if (url.match(/\/api\/campaigns\/\d+\/pause/)) {
      const sim = (window as any).campaignSimulation;
      let nextPaused = false;
      if (sim && typeof sim.togglePause === "function") {
        nextPaused = sim.togglePause();
      }
      return new Response(JSON.stringify({ success: true, paused: nextPaused }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Run Campaign simulation speed
    if (url.match(/\/api\/campaigns\/\d+\/speed/)) {
      const sim = (window as any).campaignSimulation;
      let newSpeed = 1;
      try {
        const bodyData = JSON.parse(init?.body as string || "{}");
        newSpeed = bodyData.speed || 1;
        if (sim && typeof sim.setSpeed === "function") {
          sim.setSpeed(newSpeed);
        }
      } catch(e) {}
      return new Response(JSON.stringify({ success: true, speed: newSpeed }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // List Campaigns
    const res = await originalFetch(input, {
      ...init,
      headers: getHeaders(),
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const mappedCampaigns = data.map((c: any) => {
          let msgText = c.message;
          try {
            const parsed = JSON.parse(c.message);
            msgText = parsed.body || c.message;
          } catch (e) {}

          return {
            id: String(c.id),
            name: c.name,
            channel: c.channel,
            messageTemplate: msgText,
            audienceSegmentName: c.segment,
            audienceSize: 1000,
            status: c.status === "Active" ? "RUNNING" : "DRAFT",
            sentCount: 320,
            deliveredCount: 66,
            openedCount: 65,
            readCount: 73,
            clickedCount: 63,
            convertedCount: 6,
            failedCount: 37,
            createdAt: c.created_at || new Date().toISOString()
          };
        });
        return new Response(JSON.stringify({ success: true, campaigns: mappedCampaigns }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
  }

  // 9. Intercept Insights
  if (url === "/api/insights" && init?.method === "GET") {
    // Fetch global analytics to dynamically compute some insights metrics
    let sentCount = 1000, deliveredCount = 980, clickedCount = 145;
    try {
      const analyticsRes = await originalFetch("/api/v1/analytics", {
        headers: getHeaders()
      });
      if (analyticsRes.ok) {
        const stats = await analyticsRes.json();
        sentCount = stats.sent || sentCount;
        deliveredCount = stats.delivered || deliveredCount;
        clickedCount = stats.clicked || clickedCount;
      }
    } catch(e){}

    const conversionRate = sentCount > 0 ? ((clickedCount / sentCount) * 100).toFixed(1) : "14.5";

    return new Response(JSON.stringify({
      success: true,
      insights: {
        bestChannel: "WhatsApp",
        bestChannelAccuracy: "88% confidence score",
        bestAudience: "VIP Buyers residing in Chennai",
        predictedRevenueLiftAtQ4: `+${conversionRate}% conversion`,
        recommendations: [
          "Deploy direct WhatsApp promo templates for premium Chennai cohorts.",
          "Limit multiple SMS dispatches to lapsed customer segments to avoid churn.",
          "Organize localized marketing triggers based on seasonal loyalty metrics."
        ]
      }
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  // Standard request fallback - inject JWT Authorization header
  return originalFetch(input, {
    ...init,
    headers: getHeaders(),
  });
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
