import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Users, Shield, Sparkles, Search, User, ArrowRight, Trash2, Clock, Activity, Factory, Home, Egg, Bird, ChevronRight, AlertTriangle, Loader2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { c as useMediaQuery, bq as useAllTenants, bp as useAdminUpdateTenant, br as useDeleteUser, bs as useDeleteTenant, bt as useAllUsers, g as getSubscriptionStatus, aA as Badge, ag as Tabs, ah as TabsList, ai as TabsTrigger, a0 as Input, bg as toTitleCase, af as Switch, a7 as Button, F as Sheet, G as SheetContent, I as SheetTitle, J as SheetDescription, a2 as Select, a3 as SelectTrigger, a4 as SelectValue, a5 as SelectContent, a6 as SelectItem, bu as getStatusColor, aw as Card } from "../main.mjs";
import { A as Avatar, b as AvatarImage, a as AvatarFallback } from "./avatar-DpMZtSUS.js";
import { toast } from "sonner";
import "vite-react-ssg";
import "framer-motion";
import "@tanstack/react-query";
import "@radix-ui/react-tooltip";
import "clsx";
import "tailwind-merge";
import "@supabase/supabase-js";
import "animejs";
import "canvas-confetti";
import "@radix-ui/react-switch";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "@radix-ui/react-label";
import "@radix-ui/react-separator";
import "react-hook-form";
import "@hookform/resolvers/zod";
import "zod";
import "@radix-ui/react-dialog";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-scroll-area";
import "react-dom";
import "@radix-ui/react-popover";
import "cmdk";
import "recharts";
import "@radix-ui/react-tabs";
import "@radix-ui/react-collapsible";
import "@radix-ui/react-select";
import "@radix-ui/react-avatar";
function renderVerticalIcon(v, size = 18) {
  switch (v) {
    case "poultry_broker":
      return /* @__PURE__ */ jsx(Bird, { size });
    case "egg_broker":
      return /* @__PURE__ */ jsx(Egg, { size });
    case "peternak":
      return /* @__PURE__ */ jsx(Home, { size });
    case "rpa":
      return /* @__PURE__ */ jsx(Factory, { size });
    default:
      return /* @__PURE__ */ jsx(Building2, { size });
  }
}
function AdminUsers() {
  var _a, _b, _c, _d;
  const navigate = useNavigate();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const { data: tenants, isLoading } = useAllTenants();
  const updateTenant = useAdminUpdateTenant();
  const deleteUser = useDeleteUser();
  const deleteTenant = useDeleteTenant();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tenantsPage, setTenantsPage] = useState(0);
  const TENANTS_PAGE_SIZE = 50;
  const [viewMode, setViewMode] = useState("tenants");
  const [activeTab, setActiveTab] = useState("Semua");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);
  useEffect(() => {
    setTenantsPage(0);
  }, [debouncedSearch, activeTab]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserSheetOpen, setIsUserSheetOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isTenantDeleteModalOpen, setIsTenantDeleteModalOpen] = useState(false);
  const [tenantDeleteConfirmText, setTenantDeleteConfirmText] = useState("");
  const { data: allUsers, isLoading: isUsersLoading } = useAllUsers();
  const stats = useMemo(() => {
    const totalTenants = (tenants == null ? void 0 : tenants.length) || 0;
    let totalUsers = 0;
    let activePro = 0;
    let activeBusiness = 0;
    if (tenants) {
      tenants.forEach((t) => {
        if (t.is_active) {
          if (t.plan === "pro") activePro += 1;
          if (t.plan === "business") activeBusiness += 1;
        }
      });
    }
    if (allUsers) {
      const uniqueIds = /* @__PURE__ */ new Set();
      allUsers.forEach((u) => {
        uniqueIds.add(u.auth_user_id || u.full_name);
      });
      totalUsers = uniqueIds.size;
    } else if (tenants) {
      const uniqueIds = /* @__PURE__ */ new Set();
      tenants.forEach((t) => {
        var _a2;
        (_a2 = t.profiles) == null ? void 0 : _a2.forEach((p) => uniqueIds.add(p.auth_user_id || p.full_name));
      });
      totalUsers = uniqueIds.size;
    }
    return { totalTenants, totalUsers, activePro, activeBusiness };
  }, [tenants, allUsers]);
  const filteredTenants = useMemo(() => {
    if (!tenants) return [];
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1e3;
    const q = debouncedSearch.toLowerCase();
    const filtered = tenants.filter((t) => {
      var _a2, _b2;
      const ownerName = ((_b2 = (_a2 = t.profiles) == null ? void 0 : _a2.find((p) => p.role === "owner")) == null ? void 0 : _b2.full_name) || "";
      const matchesSearch = (t.business_name || "").toLowerCase().includes(q) || ownerName.toLowerCase().includes(q);
      const sub = getSubscriptionStatus(t);
      let matchesTab = true;
      if (activeTab === "Starter") matchesTab = t.plan === "starter";
      else if (activeTab === "Pro") matchesTab = t.plan === "pro";
      else if (activeTab === "Business") matchesTab = t.plan === "business";
      else if (activeTab === "Trial") matchesTab = sub.status === "trial";
      return matchesSearch && matchesTab;
    });
    return filtered.sort(
      (a, b) => (a.business_name || "").toLowerCase().localeCompare((b.business_name || "").toLowerCase())
    ).map((t) => ({ ...t, _refTime: fiveMinutesAgo }));
  }, [tenants, debouncedSearch, activeTab]);
  const paginatedTenants = useMemo(() => {
    const start = tenantsPage * TENANTS_PAGE_SIZE;
    return filteredTenants.slice(start, start + TENANTS_PAGE_SIZE);
  }, [filteredTenants, tenantsPage]);
  const groupedUsers = useMemo(() => {
    if (!allUsers) return [];
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1e3;
    const q = debouncedSearch.toLowerCase();
    const groups = {};
    allUsers.forEach((u) => {
      const key = u.auth_user_id || u.full_name;
      if (!groups[key]) {
        groups[key] = {
          name: u.full_name,
          id: key,
          auth_user_id: u.auth_user_id,
          email: u.email,
          avatar: u.avatar_url,
          profiles: [],
          uniqueTenants: /* @__PURE__ */ new Set(),
          last_active: u.last_seen_at,
          created_at: u.created_at,
          _refTime: fiveMinutesAgo
        };
      }
      if (!groups[key].name && u.full_name) groups[key].name = u.full_name;
      if (!groups[key].avatar && u.avatar_url) groups[key].avatar = u.avatar_url;
      if (!groups[key].email && u.email) groups[key].email = u.email;
      if (!groups[key].created_at && u.created_at) groups[key].created_at = u.created_at;
      if (u.tenant_id && !groups[key].uniqueTenants.has(u.tenant_id)) {
        groups[key].uniqueTenants.add(u.tenant_id);
        groups[key].profiles.push(u);
      }
      if (u.last_seen_at && (!groups[key].last_active || new Date(u.last_seen_at) > new Date(groups[key].last_active))) {
        groups[key].last_active = u.last_seen_at;
      }
    });
    return Object.values(groups).filter((user) => {
      const matchesSearch = (user.name || "").toLowerCase().includes(q) || (user.email || "").toLowerCase().includes(q) || user.profiles.some((p) => {
        var _a2;
        return (((_a2 = p.tenants) == null ? void 0 : _a2.business_name) || "").toLowerCase().includes(q);
      });
      return matchesSearch;
    });
  }, [allUsers, debouncedSearch]);
  const handleDeleteUser = () => {
    if (!selectedUser) return;
    if (deleteConfirmText !== (selectedUser.name || "HAPUS")) {
      toast.error("Teks konfirmasi tidak sesuai");
      return;
    }
    deleteUser.mutate(selectedUser.id, {
      onSuccess: () => {
        setIsDeleteModalOpen(false);
        setIsUserSheetOpen(false);
        setSelectedUser(null);
      }
    });
  };
  const handleDeleteTenant = () => {
    if (!selectedTenant) return;
    if (tenantDeleteConfirmText !== (selectedTenant.business_name || "HAPUS")) {
      toast.error("Teks konfirmasi tidak sesuai");
      return;
    }
    deleteTenant.mutate(selectedTenant.id, {
      onSuccess: () => {
        setIsTenantDeleteModalOpen(false);
        setIsSheetOpen(false);
        setSelectedTenant(null);
      }
    });
  };
  const handleOpenDetail = (tenant) => {
    setSelectedTenant(tenant);
    setIsSheetOpen(true);
  };
  const handleUpdateStatus = (tenantId, isActive) => {
    updateTenant.mutate({ tenantId, updates: { is_active: isActive } });
  };
  const handleExtendTrial = (tenant) => {
    const currentEnd = tenant.trial_ends_at ? new Date(tenant.trial_ends_at) : /* @__PURE__ */ new Date();
    const newEnd = new Date(currentEnd.getTime() + 14 * 24 * 60 * 60 * 1e3).toISOString();
    updateTenant.mutate({ tenantId: tenant.id, updates: { trial_ends_at: newEnd } });
  };
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center min-h-[400px]", children: /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-3 p-4 lg:p-0 lg:space-y-6 overflow-x-hidden", children: [
    /* @__PURE__ */ jsxs("div", { className: "hidden lg:flex items-center justify-between py-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "font-display text-2xl font-black text-white uppercase tracking-tight", children: "Users & Tenant Management" }),
        /* @__PURE__ */ jsx("p", { className: "text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1", children: "Kelola akses dan paket langganan seluruh bisnis" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsxs(Badge, { className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-black uppercase px-3 py-1", children: [
        stats.totalTenants,
        " Tenants"
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-4 lg:grid-cols-4 gap-2 lg:gap-4", children: [
      /* @__PURE__ */ jsx(StatCard, { label: isDesktop ? "Total Tenant" : "Tenant", value: stats.totalTenants, icon: Building2, color: "emerald", compact: !isDesktop }),
      /* @__PURE__ */ jsx(StatCard, { label: isDesktop ? "Total User" : "User", value: stats.totalUsers, icon: Users, color: "blue", compact: !isDesktop }),
      /* @__PURE__ */ jsx(StatCard, { label: isDesktop ? "Active Pro" : "Pro", value: stats.activePro, icon: Shield, color: "amber", compact: !isDesktop }),
      /* @__PURE__ */ jsx(StatCard, { label: isDesktop ? "Active Business" : "Biz", value: stats.activeBusiness, icon: Sparkles, color: "purple", compact: !isDesktop })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#111C24] p-3 lg:p-4 rounded-2xl border border-white/8 shadow-lg", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row gap-3 w-full lg:w-auto", children: [
        /* @__PURE__ */ jsx(Tabs, { value: viewMode, onValueChange: setViewMode, className: "w-full md:w-auto", children: /* @__PURE__ */ jsxs(TabsList, { className: "bg-black/40 border border-white/5 p-1 h-10 lg:h-12 rounded-xl lg:rounded-2xl", children: [
          /* @__PURE__ */ jsx(
            TabsTrigger,
            {
              value: "tenants",
              className: "rounded-lg lg:rounded-xl px-4 lg:px-6 text-[9px] lg:text-[11px] font-black uppercase tracking-widest data-[state=active]:bg-emerald-500 data-[state=active]:text-white shadow-emerald-500/10",
              children: "Tenant"
            }
          ),
          /* @__PURE__ */ jsx(
            TabsTrigger,
            {
              value: "users",
              className: "rounded-lg lg:rounded-xl px-4 lg:px-6 text-[9px] lg:text-[11px] font-black uppercase tracking-widest data-[state=active]:bg-blue-500 data-[state=active]:text-white shadow-blue-500/10",
              children: "User"
            }
          )
        ] }) }),
        viewMode === "tenants" && /* @__PURE__ */ jsx("div", { className: "overflow-x-auto no-scrollbar -mx-1 px-1", children: /* @__PURE__ */ jsx(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "w-fit", children: /* @__PURE__ */ jsx(TabsList, { className: "bg-white/[0.03] border border-white/5 p-1 h-9 rounded-xl space-x-1", children: ["Semua", "Starter", "Pro", "Business", "Trial"].map((tab) => /* @__PURE__ */ jsx(
          TabsTrigger,
          {
            value: tab,
            className: "rounded-lg px-3 text-[9px] font-bold uppercase tracking-wider data-[state=active]:bg-white/10 data-[state=active]:text-emerald-400",
            children: tab
          },
          tab
        )) }) }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "relative w-full lg:w-72", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500", size: 16 }),
        /* @__PURE__ */ jsx(
          Input,
          {
            id: "search-user-tenant",
            name: "search-user-tenant",
            "aria-label": "Cari nama bisnis atau user",
            placeholder: viewMode === "tenants" ? "Cari nama bisnis..." : "Cari user atau bisnis...",
            value: searchQuery,
            onChange: (e) => setSearchQuery(e.target.value),
            className: "bg-black/20 border-white/5 h-10 lg:h-11 rounded-xl pl-10 text-base lg:text-sm text-white focus:ring-1 focus:ring-emerald-500/30"
          }
        )
      ] })
    ] }),
    viewMode === "tenants" ? isDesktop ? /* @__PURE__ */ jsxs("div", { className: "bg-[#0C1319] rounded-2xl border border-white/8 overflow-hidden shadow-xl", children: [
      /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-white/5 bg-white/[0.02]", children: [
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-display font-black", children: "Bisnis" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-display font-black text-center", children: "Plan" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-display font-black text-center", children: "Sisa Waktu" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-display font-black text-center", children: "Users" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-display font-black", children: "Daftar" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-display font-black text-center", children: "Status" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-display font-black text-right", children: "Aksi" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: paginatedTenants.map((t, i) => {
          var _a2;
          return /* @__PURE__ */ jsxs(
            "tr",
            {
              className: `border-b border-white/5 hover:bg-white/[0.03] transition-colors group ${i % 2 === 1 ? "bg-white/[0.01]" : ""}`,
              children: [
                /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400", children: renderVerticalIcon(t.business_vertical) }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "text-[14px] font-black text-white leading-tight mb-1", children: toTitleCase(t.business_name) || "(Tanpa Nama)" }),
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                      /* @__PURE__ */ jsx("span", { className: "text-[9px] font-bold text-[#4B6478] tracking-[0.2em] border border-white/5 px-1.5 py-0.5 rounded bg-white/[0.02]", children: toTitleCase(t.business_vertical) || "-" }),
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/5", children: [
                        /* @__PURE__ */ jsx(User, { size: 10, className: "text-[#4B6478]" }),
                        /* @__PURE__ */ jsx("span", { className: "text-[10px] font-medium text-slate-400", children: (() => {
                          var _a3, _b2;
                          const owner = (_a3 = t.profiles) == null ? void 0 : _a3.find((p) => p.role === "owner");
                          if (owner) return toTitleCase(owner.full_name);
                          const firstMember = (_b2 = t.profiles) == null ? void 0 : _b2[0];
                          if (firstMember) return `${toTitleCase(firstMember.full_name)} (Member)`;
                          return "Belum ada owner";
                        })() })
                      ] })
                    ] })
                  ] })
                ] }) }),
                /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-center", children: /* @__PURE__ */ jsx(PlanBadge, { tenant: t }) }),
                /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-center", children: /* @__PURE__ */ jsx(TrialDisplay, { tenant: t }) }),
                /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-center", children: /* @__PURE__ */ jsx("span", { className: "text-[13px] font-bold text-white", children: ((_a2 = t.profiles) == null ? void 0 : _a2.length) || 0 }) }),
                /* @__PURE__ */ jsxs("td", { className: "px-6 py-4", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-[12px] text-white font-medium", children: t.created_at ? format(new Date(t.created_at), "dd MMM yyyy") : "-" }),
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] text-[#4B6478] font-medium mt-0.5", children: t.created_at ? format(new Date(t.created_at), "HH:mm") : "-" })
                ] }),
                /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-center", children: /* @__PURE__ */ jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsx(
                  Switch,
                  {
                    id: `status-toggle-${t.id}`,
                    name: `status-toggle-${t.id}`,
                    checked: t.is_active,
                    onCheckedChange: (val) => handleUpdateStatus(t.id, val),
                    className: "data-[state=checked]:bg-emerald-500"
                  }
                ) }) }),
                /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right", children: /* @__PURE__ */ jsx(
                  Button,
                  {
                    variant: "outline",
                    size: "sm",
                    onClick: () => handleOpenDetail(t),
                    className: "h-8 rounded-lg border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 transition-all text-[11px] font-bold uppercase tracking-wider px-3",
                    children: "Detail"
                  }
                ) })
              ]
            },
            t.id
          );
        }) })
      ] }) }),
      filteredTenants.length > TENANTS_PAGE_SIZE && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-6 py-4 border-t border-white/5", children: [
        /* @__PURE__ */ jsxs("span", { className: "text-[11px] text-[#4B6478] font-bold", children: [
          tenantsPage * TENANTS_PAGE_SIZE + 1,
          "–",
          Math.min((tenantsPage + 1) * TENANTS_PAGE_SIZE, filteredTenants.length),
          " dari ",
          filteredTenants.length
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", onClick: () => setTenantsPage((p) => p - 1), disabled: tenantsPage === 0, className: "h-8 px-3 text-[11px] border-white/10", children: "← Prev" }),
          /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", onClick: () => setTenantsPage((p) => p + 1), disabled: (tenantsPage + 1) * TENANTS_PAGE_SIZE >= filteredTenants.length, className: "h-8 px-3 text-[11px] border-white/10", children: "Next →" })
        ] })
      ] })
    ] }) : /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-3 pb-8", children: [
      paginatedTenants.map((t) => /* @__PURE__ */ jsx(
        TenantMobileCard,
        {
          tenant: t,
          onDetail: handleOpenDetail,
          onStatusChange: handleUpdateStatus
        },
        t.id
      )),
      filteredTenants.length === 0 && /* @__PURE__ */ jsxs("div", { className: "py-12 text-center opacity-30", children: [
        /* @__PURE__ */ jsx(Building2, { size: 32, className: "mx-auto mb-2" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs font-black uppercase tracking-widest text-[#4B6478]", children: "Tidak ada tenant" })
      ] }),
      filteredTenants.length > TENANTS_PAGE_SIZE && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between py-3", children: [
        /* @__PURE__ */ jsxs("span", { className: "text-[11px] text-[#4B6478] font-bold", children: [
          tenantsPage * TENANTS_PAGE_SIZE + 1,
          "–",
          Math.min((tenantsPage + 1) * TENANTS_PAGE_SIZE, filteredTenants.length),
          " / ",
          filteredTenants.length
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", onClick: () => setTenantsPage((p) => p - 1), disabled: tenantsPage === 0, className: "h-9 px-4 text-[12px] border-white/10", children: "←" }),
          /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", onClick: () => setTenantsPage((p) => p + 1), disabled: (tenantsPage + 1) * TENANTS_PAGE_SIZE >= filteredTenants.length, className: "h-9 px-4 text-[12px] border-white/10", children: "→" })
        ] })
      ] })
    ] }) : isDesktop ? /* @__PURE__ */ jsx("div", { className: "bg-[#0C1319] rounded-2xl border border-white/8 overflow-hidden shadow-xl", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-white/5 bg-white/[0.02]", children: [
        /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-display font-black", children: "User" }),
        /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-display font-black", children: "Role" }),
        /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-display font-black", children: "Bisnis / Tenant" }),
        /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-display font-black text-center", children: "Aktif" }),
        /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-display font-black", children: "Bergabung" }),
        /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-display font-black text-right", children: "Aksi" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: isUsersLoading ? Array.from({ length: 5 }).map((_, i) => /* @__PURE__ */ jsx("tr", { className: "animate-pulse", children: /* @__PURE__ */ jsx("td", { colSpan: 6, className: "px-6 py-6 bg-white/[0.01]" }) }, i)) : groupedUsers.map((u, i) => {
        var _a2, _b2;
        return /* @__PURE__ */ jsxs(
          "tr",
          {
            className: `border-b border-white/5 hover:bg-white/[0.03] transition-colors group cursor-pointer ${i % 2 === 1 ? "bg-white/[0.01]" : ""}`,
            onClick: () => {
              setSelectedUser(u);
              setIsUserSheetOpen(true);
            },
            children: [
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                /* @__PURE__ */ jsxs(Avatar, { className: "h-10 w-10 border border-white/10 ring-2 ring-transparent group-hover:ring-blue-500/20 shadow-xl", children: [
                  /* @__PURE__ */ jsx(AvatarImage, { src: u.avatar }),
                  /* @__PURE__ */ jsx(AvatarFallback, { className: "bg-[#1C2C38] text-blue-400 text-[11px] font-black uppercase", children: ((_a2 = u.name) == null ? void 0 : _a2.substring(0, 2)) || "??" })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-[14px] font-black text-white leading-tight", children: toTitleCase(u.name) || "(Tanpa Nama)" }),
                  u.email && /* @__PURE__ */ jsx("p", { className: "text-[11px] font-medium text-emerald-400/80 lowercase mt-0.5", children: u.email }),
                  /* @__PURE__ */ jsxs("p", { className: "text-[9px] font-bold text-[#4B6478] uppercase mt-1 tracking-widest", children: [
                    "UID: ",
                    u.id.substring(0, 8)
                  ] })
                ] })
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: Array.from(new Set(u.profiles.map((p) => p.user_type))).filter(Boolean).map((cat) => /* @__PURE__ */ jsx(CategoryBadge, { category: cat }, cat)) }),
                /* @__PURE__ */ jsx("div", { className: "w-[1px] h-4 bg-white/10 hidden lg:block" }),
                u.profiles.some((p) => p.app_role === "superadmin" || p.role === "superadmin") && /* @__PURE__ */ jsx(AppRoleBadge, { appRole: "superadmin" }),
                /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: Array.from(new Set(u.profiles.map((p) => p.role === "superadmin" ? "owner" : p.role))).filter(Boolean).map((role) => /* @__PURE__ */ jsx(RoleBadge, { role }, role)) })
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsxs("span", { className: "text-[12px] font-bold text-slate-400", children: [
                "Terdaftar di ",
                ((_b2 = u.uniqueTenants) == null ? void 0 : _b2.size) || 0,
                " Bisnis"
              ] }) }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-center", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center", children: [
                /* @__PURE__ */ jsx("div", { className: `w-1.5 h-1.5 rounded-full mb-1 ${u.last_active && new Date(u.last_active).getTime() > u._refTime ? "bg-emerald-500" : "bg-slate-600"}` }),
                /* @__PURE__ */ jsx("span", { className: "text-[9px] font-bold text-[#4B6478] uppercase", children: u.last_active ? formatDistanceToNow(new Date(u.last_active), { addSuffix: true, locale: id }) : "Baru" })
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsx("p", { className: "text-[12px] text-white font-medium", children: u.created_at ? format(new Date(u.created_at), "dd MMM yyyy") : "-" }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right", children: /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", className: "h-8 w-8 p-0 rounded-lg text-[#4B6478] hover:text-white", children: /* @__PURE__ */ jsx(ArrowRight, { size: 16 }) }) })
            ]
          },
          u.id
        );
      }) })
    ] }) }) }) : /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-3 pb-8", children: [
      groupedUsers.map((u) => /* @__PURE__ */ jsx(
        UserMobileCard,
        {
          user: u,
          onClick: () => {
            setSelectedUser(u);
            setIsUserSheetOpen(true);
          }
        },
        u.id
      )),
      groupedUsers.length === 0 && /* @__PURE__ */ jsxs("div", { className: "py-12 text-center opacity-30", children: [
        /* @__PURE__ */ jsx(Users, { size: 32, className: "mx-auto mb-2" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs font-black uppercase tracking-widest text-[#4B6478]", children: "Tidak ada user" })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Sheet, { open: isUserSheetOpen, onOpenChange: setIsUserSheetOpen, children: /* @__PURE__ */ jsx(SheetContent, { side: "right", className: "w-full sm:w-[480px] bg-[#0C1319] border-l border-white/8 p-0 overflow-hidden flex flex-col", children: selectedUser && /* @__PURE__ */ jsxs(
      "div",
      {
        initial: { x: 20, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: 20, opacity: 0 },
        className: "flex flex-col h-full",
        children: [
          /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-white/5 bg-white/[0.02]", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsxs(Avatar, { className: "h-14 w-14 border border-white/10 ring-4 ring-emerald-500/10", children: [
              /* @__PURE__ */ jsx(AvatarImage, { src: selectedUser.avatar }),
              /* @__PURE__ */ jsx(AvatarFallback, { className: "bg-emerald-500/10 text-emerald-400 text-xl font-black", children: ((_a = selectedUser.name) == null ? void 0 : _a.substring(0, 2)) || "??" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(SheetTitle, { className: "text-xl font-black text-white uppercase tracking-tight", children: selectedUser.name || "User Tanpa Nama" }),
              selectedUser.email && /* @__PURE__ */ jsx("p", { className: "text-[13px] font-bold text-emerald-400/90 lowercase mt-1", children: selectedUser.email }),
              /* @__PURE__ */ jsxs(SheetDescription, { className: "text-[11px] font-bold text-[#4B6478] uppercase mt-1 tracking-[0.15em] flex items-center gap-2", children: [
                /* @__PURE__ */ jsxs("span", { children: [
                  "User ID: ",
                  selectedUser.id
                ] }),
                selectedUser.profiles.some((p) => p.app_role === "superadmin" || p.role === "superadmin") && /* @__PURE__ */ jsx(AppRoleBadge, { appRole: "superadmin" })
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto p-6 space-y-8", children: [
            /* @__PURE__ */ jsxs("section", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxs("h3", { className: "text-[11px] font-black text-[#4B6478] uppercase tracking-[0.2em] flex items-center justify-between", children: [
                "BISNIS TERKAIT",
                /* @__PURE__ */ jsx(Badge, { className: "bg-emerald-500/10 text-emerald-500 border-none font-black", children: ((_b = selectedUser.uniqueTenants) == null ? void 0 : _b.size) || 0 })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "space-y-3", children: selectedUser.profiles.map((p, idx) => {
                var _a2, _b2, _c2;
                return /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: "group relative bg-white/[0.03] p-4 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer",
                    onClick: () => {
                      const fullTenant = tenants.find((t) => t.id === p.tenant_id);
                      if (fullTenant) {
                        handleOpenDetail(fullTenant);
                        setIsUserSheetOpen(false);
                      }
                    },
                    children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                        /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400", children: renderVerticalIcon((_a2 = p.tenants) == null ? void 0 : _a2.business_vertical) }),
                        /* @__PURE__ */ jsxs("div", { children: [
                          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                            /* @__PURE__ */ jsx("p", { className: "text-[13px] font-bold text-white group-hover:text-emerald-400 transition-colors", children: ((_b2 = p.tenants) == null ? void 0 : _b2.business_name) || "Tanpa Nama" }),
                            /* @__PURE__ */ jsx("span", { className: `text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${p.is_membership ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}`, children: p.is_membership ? "TIM" : "OWN" })
                          ] }),
                          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mt-0.5", children: [
                            /* @__PURE__ */ jsx(RoleBadge, { role: p.role === "superadmin" ? "owner" : p.role }),
                            /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-[#4B6478] uppercase", children: toTitleCase((_c2 = p.tenants) == null ? void 0 : _c2.business_vertical) })
                          ] })
                        ] })
                      ] }),
                      /* @__PURE__ */ jsx(ArrowRight, { size: 14, className: "text-[#4B6478] group-hover:text-white transition-all transform group-hover:translate-x-1" })
                    ] })
                  },
                  idx
                );
              }) })
            ] }),
            /* @__PURE__ */ jsxs("section", { className: "space-y-4", children: [
              /* @__PURE__ */ jsx("h3", { className: "text-[11px] font-black text-[#4B6478] uppercase tracking-[0.2em]", children: "INFORMASI AKUN" }),
              /* @__PURE__ */ jsxs("div", { className: "bg-white/[0.03] p-5 rounded-2xl border border-white/5 space-y-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-[12px]", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-[#4B6478] font-bold", children: "Terdaftar Sejak" }),
                  /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: format(new Date(selectedUser.created_at), "dd MMMM yyyy", { locale: id }) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-[12px]", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-[#4B6478] font-bold", children: "Aktivitas Terakhir" }),
                  /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: selectedUser.last_active ? formatDistanceToNow(new Date(selectedUser.last_active), { addSuffix: true, locale: id }) : "Belum ada" })
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-6 border-t border-white/5 bg-white/[0.02] flex flex-col gap-3", children: [
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "ghost",
                className: "w-full text-[#4B6478] hover:text-white",
                onClick: () => setIsUserSheetOpen(false),
                children: "Tutup"
              }
            ),
            /* @__PURE__ */ jsxs(
              Button,
              {
                variant: "outline",
                className: "w-full h-11 rounded-xl border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all text-[12px] font-bold uppercase tracking-widest",
                onClick: () => {
                  setDeleteConfirmText("");
                  setIsDeleteModalOpen(true);
                },
                children: [
                  /* @__PURE__ */ jsx(Trash2, { size: 16, className: "mr-2" }),
                  " Hapus Akun User"
                ]
              }
            )
          ] })
        ]
      }
    ) }) }),
    /* @__PURE__ */ jsx(Sheet, { open: isSheetOpen, onOpenChange: setIsSheetOpen, children: /* @__PURE__ */ jsx(SheetContent, { side: "right", className: "w-full sm:w-[480px] bg-[#0C1319] border-l border-white/8 p-0 overflow-hidden flex flex-col", children: selectedTenant && /* @__PURE__ */ jsxs(
      "div",
      {
        initial: { x: 20, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: 20, opacity: 0 },
        className: "flex flex-col h-full",
        children: [
          /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-white/5 bg-white/[0.02]", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/5", children: renderVerticalIcon(selectedTenant.business_vertical, 24) }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(SheetTitle, { className: "text-xl font-black text-white uppercase tracking-tight", children: toTitleCase(selectedTenant.business_name) || "(Tanpa Nama)" }),
                /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[9px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border-emerald-500/20", children: toTitleCase(selectedTenant.business_vertical) || "-" })
              ] }),
              /* @__PURE__ */ jsxs(SheetDescription, { className: "text-[11px] font-bold text-[#4B6478] uppercase mt-1 tracking-widest", children: [
                "Tenant ID: ",
                selectedTenant.id
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto p-6 space-y-8", children: [
            /* @__PURE__ */ jsxs("section", { className: "space-y-4", children: [
              /* @__PURE__ */ jsx("h3", { className: "text-[11px] font-black text-[#4B6478] uppercase tracking-[0.2em]", children: "PENGATURAN TENANT" }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-4 bg-white/[0.03] p-5 rounded-2xl border border-white/5", children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-[#4B6478] uppercase tracking-widest ml-1", children: "Nama Bisnis" }),
                  /* @__PURE__ */ jsx("div", { className: "flex gap-2", children: /* @__PURE__ */ jsx(
                    Input,
                    {
                      value: selectedTenant.business_name,
                      onChange: (e) => setSelectedTenant({ ...selectedTenant, business_name: e.target.value }),
                      onBlur: () => {
                        if ((selectedTenant.business_name || "").length < 3) {
                          toast.error("Nama bisnis terlalu pendek");
                          return;
                        }
                        updateTenant.mutate({ tenantId: selectedTenant.id, updates: { business_name: selectedTenant.business_name } });
                      },
                      className: "bg-black/40 border-white/10 h-11 rounded-xl text-sm font-bold focus:border-emerald-500/50"
                    }
                  ) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-muted-foreground uppercase tracking-wider", children: "Paket Langganan" }),
                  /* @__PURE__ */ jsxs(
                    Select,
                    {
                      value: selectedTenant.plan,
                      onValueChange: (val) => {
                        const kandangLimit = val === "starter" ? 1 : val === "pro" ? 2 : 99;
                        updateTenant.mutate({
                          tenantId: selectedTenant.id,
                          updates: { plan: val, kandang_limit: kandangLimit }
                        });
                        setSelectedTenant({ ...selectedTenant, plan: val });
                      },
                      children: [
                        /* @__PURE__ */ jsx(SelectTrigger, { className: "bg-black/40 border-white/10 h-10 rounded-xl text-sm", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Pilih paket" }) }),
                        /* @__PURE__ */ jsxs(SelectContent, { className: "bg-[#111C24] border-white/10 text-white", children: [
                          /* @__PURE__ */ jsx(SelectItem, { value: "starter", children: "Starter" }),
                          /* @__PURE__ */ jsx(SelectItem, { value: "pro", children: "Pro" }),
                          /* @__PURE__ */ jsx(SelectItem, { value: "business", children: "Business" })
                        ] })
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pt-2", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-white", children: "Status Bisnis" }),
                    /* @__PURE__ */ jsx("p", { className: "text-[11px] text-[#4B6478] font-bold uppercase mt-0.5", children: "Aktif / Nonaktifkan akses" })
                  ] }),
                  /* @__PURE__ */ jsx(
                    Switch,
                    {
                      checked: selectedTenant.is_active,
                      onCheckedChange: (val) => {
                        setSelectedTenant({ ...selectedTenant, is_active: val });
                        handleUpdateStatus(selectedTenant.id, val);
                      },
                      className: "data-[state=checked]:bg-emerald-500"
                    }
                  )
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("section", { className: "space-y-4", children: [
              /* @__PURE__ */ jsx("h3", { className: "text-[11px] font-black text-[#4B6478] uppercase tracking-[0.2em]", children: "STATUS LANGGANAN" }),
              /* @__PURE__ */ jsxs("div", { className: "bg-white/[0.03] p-5 rounded-2xl border border-white/5 flex flex-col gap-4", children: [
                /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsx("div", { className: "flex items-center gap-4", children: (() => {
                  const detailSub = getSubscriptionStatus(selectedTenant);
                  const isPro = detailSub.plan === "pro";
                  const isBusiness = detailSub.plan === "business";
                  const isTrial = detailSub.status === "trial";
                  const bg = isTrial ? "rgba(245,158,11,0.1)" : isPro ? "rgba(2, 26, 2,0.1)" : isBusiness ? "rgba(99,102,241,0.1)" : "rgba(255,255,255,0.05)";
                  const border = isTrial ? "rgba(245,158,11,0.2)" : isPro ? "rgba(2, 26, 2,0.2)" : isBusiness ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.1)";
                  const color = isTrial ? "#F59E0B" : isPro ? "#021a02" : isBusiness ? "#6366F1" : "#4B6478";
                  return /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl flex items-center justify-center shrink-0", style: { background: bg, border: `1px solid ${border}` }, children: /* @__PURE__ */ jsx(Clock, { size: 18, style: { color } }) }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-[#4B6478] uppercase tracking-wider mb-1", children: detailSub.status === "trial" ? "Masa Trial" : "Status Plan" }),
                      /* @__PURE__ */ jsx("p", { className: "text-[13px] font-bold text-white", children: detailSub.expiresAt ? format(new Date(detailSub.expiresAt), "dd MMMM yyyy", { locale: id }) : "Gratis Selamanya" }),
                      /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold uppercase mt-0.5 tracking-wider", style: { color: getStatusColor(detailSub.status).color }, children: detailSub.status === "trial" ? `Trial Berakhir (${detailSub.daysLeft} Hari)` : detailSub.status === "expired" ? "Expired — Perlu Renewal" : "Aktif" })
                    ] })
                  ] });
                })() }) }),
                /* @__PURE__ */ jsxs("div", { className: "flex gap-2 pt-4 border-t border-white/5", children: [
                  /* @__PURE__ */ jsx(
                    Button,
                    {
                      variant: "outline",
                      size: "sm",
                      onClick: () => handleExtendTrial(selectedTenant),
                      className: "flex-1 h-9 rounded-xl border-white/10 hover:bg-white/5 text-[10px] font-black uppercase tracking-widest text-[#4B6478] hover:text-white",
                      children: "+14 Hari Trial"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    Button,
                    {
                      size: "sm",
                      onClick: () => {
                        const newDate = /* @__PURE__ */ new Date();
                        newDate.setFullYear(newDate.getFullYear() + 1);
                        updateTenant.mutate({
                          tenantId: selectedTenant.id,
                          updates: { plan_expires_at: newDate.toISOString(), trial_ends_at: null }
                        });
                        setSelectedTenant({ ...selectedTenant, plan_expires_at: newDate.toISOString(), trial_ends_at: null });
                      },
                      className: `${selectedTenant.plan === "starter" ? "hidden" : "flex-1"} h-9 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/10 transition-all`,
                      children: "Aktivasi 1 Tahun"
                    }
                  )
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("section", { className: "space-y-4", children: [
              /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxs("h3", { className: "text-[11px] font-black text-[#4B6478] uppercase tracking-[0.2em]", children: [
                "ANGGOTA TIM (",
                ((_c = selectedTenant.profiles) == null ? void 0 : _c.length) || 0,
                ")"
              ] }) }),
              /* @__PURE__ */ jsx("div", { className: "space-y-3", children: (_d = selectedTenant.profiles) == null ? void 0 : _d.map((p) => {
                var _a2;
                return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all", children: [
                  /* @__PURE__ */ jsx(Avatar, { className: "h-9 w-9 border border-white/10", children: /* @__PURE__ */ jsx(AvatarFallback, { className: "bg-emerald-500/10 text-emerald-400 text-[11px] font-black uppercase", children: ((_a2 = p.full_name) == null ? void 0 : _a2.substring(0, 2)) || "??" }) }),
                  /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                      /* @__PURE__ */ jsx("p", { className: "text-[12px] font-bold text-white truncate", children: toTitleCase(p.full_name) || "-" }),
                      (p.app_role === "superadmin" || p.role === "superadmin") && /* @__PURE__ */ jsx(AppRoleBadge, { appRole: "superadmin" }),
                      /* @__PURE__ */ jsx(RoleBadge, { role: p.role === "superadmin" ? "owner" : p.role })
                    ] }),
                    /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-[#4B6478] font-bold uppercase mt-0.5 tracking-tighter", children: [
                      "Aktif ",
                      p.last_seen_at ? formatDistanceToNow(new Date(p.last_seen_at), { addSuffix: true, locale: id }) : "Baru-baru ini"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: `w-2 h-2 rounded-full ${p.is_active ? "bg-emerald-500 shadow-[0_0_8px_rgba(2, 26, 2,1)]" : "bg-gray-600"}` })
                ] }, p.id);
              }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-6 border-t border-white/5 bg-white/[0.02] flex flex-col gap-3", children: [
            /* @__PURE__ */ jsxs(
              Button,
              {
                variant: "outline",
                className: "w-full h-11 rounded-xl border-white/10 text-white hover:bg-white/5 transition-all text-[12px] font-bold uppercase tracking-widest flex items-center justify-center gap-2",
                onClick: () => {
                  navigate(`/admin/activity?tenantId=${selectedTenant.id}`);
                  setIsSheetOpen(false);
                },
                children: [
                  /* @__PURE__ */ jsx(Activity, { size: 16 }),
                  "Lihat Log Aktivitas"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              Button,
              {
                variant: "outline",
                className: "w-full h-11 rounded-xl border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all text-[12px] font-bold uppercase tracking-widest",
                onClick: () => {
                  setTenantDeleteConfirmText("");
                  setIsTenantDeleteModalOpen(true);
                },
                children: [
                  /* @__PURE__ */ jsx(Trash2, { size: 16, className: "mr-2" }),
                  " Hapus Permanen Bisnis"
                ]
              }
            )
          ] })
        ]
      }
    ) }) }),
    /* @__PURE__ */ jsx(
      ConfirmDeleteModal,
      {
        isOpen: isDeleteModalOpen,
        onClose: () => setIsDeleteModalOpen(false),
        onConfirm: handleDeleteUser,
        user: selectedUser,
        confirmText: deleteConfirmText,
        setConfirmText: setDeleteConfirmText,
        isDeleting: deleteUser.isPending,
        allTenants: tenants
      }
    ),
    /* @__PURE__ */ jsx(
      ConfirmDeleteTenantModal,
      {
        isOpen: isTenantDeleteModalOpen,
        onClose: () => setIsTenantDeleteModalOpen(false),
        onConfirm: handleDeleteTenant,
        tenantName: (selectedTenant == null ? void 0 : selectedTenant.business_name) || "",
        confirmText: tenantDeleteConfirmText,
        setConfirmText: setTenantDeleteConfirmText,
        isDeleting: deleteTenant.isPending
      }
    )
  ] });
}
function TenantMobileCard({ tenant, onDetail, onStatusChange }) {
  const getOwnerDisplay = () => {
    var _a, _b;
    const owner2 = (_a = tenant.profiles) == null ? void 0 : _a.find((p) => p.role === "owner" || p.role === "superadmin");
    if (owner2) return toTitleCase(owner2.full_name);
    const firstMember = (_b = tenant.profiles) == null ? void 0 : _b[0];
    if (firstMember) return `${toTitleCase(firstMember.full_name)} (Member)`;
    return "Belum ada owner";
  };
  const owner = getOwnerDisplay();
  return /* @__PURE__ */ jsxs("div", { className: "bg-[#111C24] border border-white/8 rounded-2xl p-4 shadow-lg active:scale-[0.98] transition-all", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400", children: renderVerticalIcon(tenant.business_vertical, 20) }),
        /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsx("p", { className: "text-[14px] font-black text-white leading-tight truncate", children: toTitleCase(tenant.business_name) || "(Tanpa Nama)" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mt-1", children: [
            /* @__PURE__ */ jsx("span", { className: "text-[8px] font-black text-[#4B6478] uppercase tracking-widest bg-white/5 px-1.5 py-0.5 rounded", children: toTitleCase(tenant.business_vertical) }),
            /* @__PURE__ */ jsx(PlanBadge, { tenant })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        Switch,
        {
          checked: tenant.is_active,
          onCheckedChange: (val) => onStatusChange(tenant.id, val),
          className: "data-[state=checked]:bg-emerald-500 scale-90"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/5", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx("p", { className: "text-[9px] font-bold text-[#4B6478] uppercase tracking-widest", children: "Owner / Pengelola" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-white", children: [
          /* @__PURE__ */ jsx(User, { size: 10, className: "text-[#4B6478]" }),
          /* @__PURE__ */ jsx("span", { className: "text-[11px] font-bold truncate", children: owner })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1 text-right", children: [
        /* @__PURE__ */ jsx("p", { className: "text-[9px] font-bold text-[#4B6478] uppercase tracking-widest", children: "Sisa Aktif" }),
        /* @__PURE__ */ jsx(TrialDisplay, { tenant })
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      Button,
      {
        onClick: () => onDetail(tenant),
        className: "w-full mt-4 h-10 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-black text-[10px] uppercase tracking-[0.2em] rounded-xl",
        children: "Konfigurasi Tenant"
      }
    )
  ] });
}
function UserMobileCard({ user, onClick }) {
  var _a, _b;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      onClick,
      className: "bg-[#111C24] border border-white/8 rounded-2xl p-4 shadow-lg active:scale-[0.98] transition-all flex items-center justify-between gap-3",
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 min-w-0", children: [
          /* @__PURE__ */ jsxs(Avatar, { className: "h-10 w-10 border border-white/10 ring-2 ring-transparent", children: [
            /* @__PURE__ */ jsx(AvatarImage, { src: user.avatar }),
            /* @__PURE__ */ jsx(AvatarFallback, { className: "bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase", children: ((_a = user.name) == null ? void 0 : _a.substring(0, 2)) || "??" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsx("p", { className: "text-[14px] font-black text-white leading-tight truncate", children: toTitleCase(user.name) || "(Tanpa Nama)" }),
            user.email && /* @__PURE__ */ jsx("p", { className: "text-[10px] font-medium text-emerald-400/80 lowercase mt-0.5 truncate", children: user.email }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mt-1.5 flex-wrap", children: [
              user.profiles.some((p) => p.app_role === "superadmin" || p.role === "superadmin") && /* @__PURE__ */ jsx(AppRoleBadge, { appRole: "superadmin" }),
              Array.from(new Set(user.profiles.map((p) => p.role === "superadmin" ? "owner" : p.role))).filter(Boolean).slice(0, 2).map((role) => /* @__PURE__ */ jsx(RoleBadge, { role }, role)),
              /* @__PURE__ */ jsxs("span", { className: "text-[9px] font-bold text-[#4B6478] uppercase", children: [
                ((_b = user.uniqueTenants) == null ? void 0 : _b.size) || 0,
                " Bisnis"
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx(ChevronRight, { size: 16, className: "text-[#4B6478] shrink-0" })
      ]
    }
  );
}
function StatCard({ label, value, icon: Icon, color, compact = false }) {
  const themes = {
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    amber: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    purple: "bg-purple-500/10 border-purple-500/20 text-purple-400"
  };
  if (compact) {
    return /* @__PURE__ */ jsxs("div", { className: `flex flex-col items-center justify-center py-3 rounded-2xl bg-[#111C24] border border-white/8 ${themes[color]}`, children: [
      /* @__PURE__ */ jsx("div", { className: `w-7 h-7 rounded-lg flex items-center justify-center border mb-2 ${themes[color]}`, children: /* @__PURE__ */ jsx(Icon, { size: 12 }) }),
      /* @__PURE__ */ jsx("p", { className: "text-[16px] font-black text-white leading-none font-display", children: value }),
      /* @__PURE__ */ jsx("p", { className: "text-[8px] lg:text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1.5 text-center leading-tight", children: label })
    ] });
  }
  return /* @__PURE__ */ jsxs(Card, { className: `bg-[#111C24] border-white/8 rounded-2xl p-5 relative overflow-hidden group hover:border-white/15 transition-all shadow-lg ${themes[color]}`, children: [
    /* @__PURE__ */ jsx("div", { className: "absolute -right-2 -bottom-2 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity", children: /* @__PURE__ */ jsx(Icon, { size: 70 }) }),
    /* @__PURE__ */ jsxs("div", { className: "relative z-10 space-y-3", children: [
      /* @__PURE__ */ jsx("div", { className: `w-9 h-9 rounded-xl flex items-center justify-center border ${themes[color]}`, children: /* @__PURE__ */ jsx(Icon, { size: 16 }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2", children: label }),
        /* @__PURE__ */ jsx("p", { className: "font-display text-2xl lg:text-3xl font-black text-white leading-none", children: value })
      ] })
    ] })
  ] });
}
function PlanBadge({ tenant }) {
  if (!tenant) return null;
  const sub = getSubscriptionStatus(tenant);
  const isTrial = sub.status === "trial";
  const plan = tenant.plan || "starter";
  const styles = {
    starter: "bg-white/[0.03] text-slate-400 border-white/10",
    pro: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    business: "bg-amber-500/10 text-amber-400 border-amber-500/20"
  };
  const trialStyle = "bg-amber-500/10 text-amber-500 border-amber-500/30 shadow-amber-500/10";
  return /* @__PURE__ */ jsx(Badge, { className: `px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm ${isTrial ? trialStyle : styles[plan] || styles.starter}`, children: isTrial ? `TRIAL ${toTitleCase(plan)}` : toTitleCase(plan) });
}
function AppRoleBadge({ appRole }) {
  if (appRole !== "superadmin") return null;
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 shadow-sm shadow-amber-500/5", children: [
    /* @__PURE__ */ jsx(Shield, { size: 10, className: "text-amber-400" }),
    /* @__PURE__ */ jsx("span", { className: "text-[9px] font-bold uppercase tracking-widest leading-none text-amber-400", children: "Superadmin" })
  ] });
}
function RoleBadge({ role }) {
  const styles = {
    superadmin: "text-amber-400",
    owner: "text-slate-400",
    staff: "text-slate-500",
    view_only: "text-slate-600",
    sopir: "text-slate-500"
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 px-1 py-1", children: [
    /* @__PURE__ */ jsx("div", { className: `w-1 h-1 rounded-full ${role === "superadmin" ? "bg-amber-500" : role === "owner" ? "bg-emerald-500/40" : "bg-slate-600"}` }),
    /* @__PURE__ */ jsx("span", { className: `text-[9px] font-bold uppercase tracking-widest leading-none ${styles[role] || styles.view_only}`, children: toTitleCase(role) })
  ] });
}
function CategoryBadge({ category }) {
  const themes = {
    peternak: {
      style: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/5",
      icon: Home
    },
    broker: {
      style: "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-blue-500/5",
      icon: Users
    },
    rumah_potong: {
      style: "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-rose-500/5",
      icon: Factory
    },
    rpa: {
      style: "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-rose-500/5",
      icon: Factory
    }
  };
  const labels = {
    peternak: "Peternak",
    broker: "Broker",
    rumah_potong: "RPA",
    rpa: "RPA"
  };
  const theme = themes[category] || { style: "bg-white/5 text-slate-400 border-white/10", icon: Building2 };
  const Icon = theme.icon;
  return /* @__PURE__ */ jsxs("div", { className: `flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest shadow-lg ${theme.style}`, children: [
    /* @__PURE__ */ jsx(Icon, { size: 11, className: "opacity-70" }),
    /* @__PURE__ */ jsx("span", { children: labels[category] || category })
  ] });
}
function TrialDisplay({ tenant }) {
  const sub = getSubscriptionStatus(tenant);
  const color = getStatusColor(sub.status).color;
  if (sub.plan === "starter" && sub.status === "active") {
    return /* @__PURE__ */ jsx("span", { className: "text-slate-500 text-[13px]", children: "—" });
  }
  if (sub.status === "expired") {
    return /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center", children: [
      /* @__PURE__ */ jsx("span", { className: "text-[13px] font-black text-red-400", children: "Expired" }),
      /* @__PURE__ */ jsx("span", { className: "text-[8px] text-red-400/60 font-bold uppercase tracking-tighter mt-1", children: sub.plan === "starter" ? "Trial Habis" : "Perlu Renewal" })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center", children: [
    /* @__PURE__ */ jsx("span", { className: "text-[13px] font-black", style: { color }, children: sub.daysLeft === 999 ? "∞" : `${sub.daysLeft} Hari` }),
    /* @__PURE__ */ jsx("span", { className: "text-[8px] text-slate-500 font-bold uppercase tracking-tighter mt-1 leading-none", children: sub.status === "trial" ? "Sisa Trial" : `Sisa ${toTitleCase(sub.plan)}` })
  ] });
}
function ConfirmDeleteModal({ isOpen, onClose, onConfirm, user, confirmText, setConfirmText, isDeleting, allTenants }) {
  var _a, _b;
  if (!isOpen) return null;
  const userName = (user == null ? void 0 : user.name) || "";
  const lonelyTenants = ((_a = user == null ? void 0 : user.profiles) == null ? void 0 : _a.filter((p) => {
    var _a2;
    if (p.role !== "owner") return false;
    const tenant = allTenants == null ? void 0 : allTenants.find((t) => t.id === p.tenant_id);
    return ((_a2 = tenant == null ? void 0 : tenant.profiles) == null ? void 0 : _a2.length) === 1;
  }).map((p) => {
    var _a2;
    return (_a2 = p.tenants) == null ? void 0 : _a2.business_name;
  })) || [];
  const sharedTenants = (_b = user == null ? void 0 : user.profiles) == null ? void 0 : _b.filter((p) => {
    const tenant = allTenants == null ? void 0 : allTenants.find((t) => t.id === p.tenant_id);
    return !lonelyTenants.includes(tenant == null ? void 0 : tenant.business_name);
  }).map((p) => {
    var _a2;
    return {
      name: (_a2 = p.tenants) == null ? void 0 : _a2.business_name,
      role: p.role === "superadmin" ? "owner" : p.role
    };
  });
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200", children: /* @__PURE__ */ jsxs(
    "div",
    {
      initial: { scale: 0.95, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      className: "w-full max-w-md bg-[#111C24] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6",
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center text-center space-y-4", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500", children: /* @__PURE__ */ jsx(AlertTriangle, { size: 32 }) }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-xl font-black text-white uppercase tracking-tight", children: "Hapus Akun Permanen?" }),
            /* @__PURE__ */ jsxs("p", { className: "text-[13px] text-slate-400 font-medium leading-relaxed", children: [
              "Tindakan ini akan menghapus profil ",
              /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: userName }),
              " secara total."
            ] })
          ] })
        ] }),
        (lonelyTenants.length > 0 || sharedTenants.length > 0) && /* @__PURE__ */ jsxs("div", { className: "bg-black/20 rounded-2xl p-4 border border-white/5 space-y-3", children: [
          /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black text-[#4B6478] uppercase tracking-widest", children: "Dampak Penghapusan (Wiring Cleanup):" }),
          lonelyTenants.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxs("p", { className: "text-[10px] font-bold text-red-400 uppercase tracking-tight flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(Trash2, { size: 10 }),
              " BISNIS DIHAPUS PERMANEN (DATA LENGKAP):"
            ] }),
            lonelyTenants.map((t, idx) => /* @__PURE__ */ jsx("div", { className: "text-[12px] font-black text-white pl-4 border-l border-red-500/30", children: toTitleCase(t) }, idx))
          ] }),
          sharedTenants.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-1.5 pt-2 border-t border-white/5", children: [
            /* @__PURE__ */ jsxs("p", { className: "text-[10px] font-bold text-blue-400 uppercase tracking-tight flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(Shield, { size: 10 }),
              " DIKELUARKAN DARI TEAM (BISNIS TETAP ADA):"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2 pl-4", children: sharedTenants.map((t, idx) => /* @__PURE__ */ jsxs("div", { className: "text-[11px] font-bold text-slate-300", children: [
              toTitleCase(t.name),
              " ",
              /* @__PURE__ */ jsxs("span", { className: "text-[9px] text-slate-500", children: [
                "(",
                toTitleCase(t.role),
                ")"
              ] }),
              idx < sharedTenants.length - 1 && ","
            ] }, idx)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxs("label", { className: "text-[10px] font-black text-[#4B6478] uppercase tracking-widest ml-1", children: [
            'Ketik "',
            userName || "HAPUS",
            '" untuk mengonfirmasi'
          ] }),
          /* @__PURE__ */ jsx(
            Input,
            {
              value: confirmText,
              onChange: (e) => setConfirmText(e.target.value),
              placeholder: "Ketik nama user di sini...",
              className: "bg-black/20 border-white/10 h-12 rounded-xl text-center font-bold text-white focus:border-red-500/50"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "ghost",
              className: "flex-1 h-12 rounded-xl text-[#4B6478] hover:text-white",
              onClick: onClose,
              children: "Batal"
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              disabled: confirmText !== (userName || "HAPUS") || isDeleting,
              className: "flex-1 h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest text-[11px] disabled:opacity-30",
              onClick: onConfirm,
              children: isDeleting ? /* @__PURE__ */ jsx(Loader2, { className: "animate-spin", size: 18 }) : "YA, HAPUS AKUN"
            }
          )
        ] })
      ]
    }
  ) });
}
function ConfirmDeleteTenantModal({ isOpen, onClose, onConfirm, tenantName, confirmText, setConfirmText, isDeleting }) {
  if (!isOpen) return null;
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200", children: /* @__PURE__ */ jsxs(
    "div",
    {
      initial: { scale: 0.95, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      className: "w-full max-w-md bg-[#111C24] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6",
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center text-center space-y-4", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500", children: /* @__PURE__ */ jsx(Trash2, { size: 32 }) }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-xl font-black text-white uppercase tracking-tight", children: "Hapus Bisnis Permanen?" }),
            /* @__PURE__ */ jsxs("p", { className: "text-[13px] text-slate-400 font-medium leading-relaxed", children: [
              "Tindakan ini akan menghapus ",
              /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: tenantName }),
              " beserta SELURUH data kandang, siklus, dan transaksi di dalamnya."
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxs("label", { className: "text-[10px] font-black text-[#4B6478] uppercase tracking-widest ml-1", children: [
            'Ketik "',
            tenantName || "HAPUS",
            '" untuk mengonfirmasi'
          ] }),
          /* @__PURE__ */ jsx(
            Input,
            {
              value: confirmText,
              onChange: (e) => setConfirmText(e.target.value),
              placeholder: "Ketik nama bisnis di sini...",
              className: "bg-black/20 border-white/10 h-12 rounded-xl text-center font-bold text-white focus:border-red-500/50"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "ghost",
              className: "flex-1 h-12 rounded-xl text-[#4B6478] hover:text-white",
              onClick: onClose,
              children: "Batal"
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              disabled: confirmText !== (tenantName || "HAPUS") || isDeleting,
              className: "flex-1 h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest text-[11px] disabled:opacity-30 shadow-lg shadow-red-500/20",
              onClick: onConfirm,
              children: isDeleting ? /* @__PURE__ */ jsx(Loader2, { className: "animate-spin", size: 18 }) : "HAPUS SEKARANG"
            }
          )
        ] })
      ]
    }
  ) });
}
export {
  AdminUsers as default
};
