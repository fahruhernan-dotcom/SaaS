import { jsx, jsxs } from "react/jsx-runtime";
import "react";
import { AlertTriangle, RefreshCw, DollarSign, Clock, CheckCircle, ChevronRight, Bird, Egg, Home, Factory } from "lucide-react";
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area, PieChart, Pie, Cell } from "recharts";
import { bo as useGlobalStats, bp as useAdminUpdateTenant, a7 as Button, aq as formatIDR, aw as Card, aA as Badge, g as getSubscriptionStatus, bg as toTitleCase } from "../main.mjs";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import "vite-react-ssg";
import "framer-motion";
import "sonner";
import "@radix-ui/react-tooltip";
import "clsx";
import "tailwind-merge";
import "@supabase/supabase-js";
import "animejs";
import "date-fns";
import "date-fns/locale";
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
import "@radix-ui/react-tabs";
import "@radix-ui/react-collapsible";
import "@radix-ui/react-select";
function DarkTooltip({ active, payload, label }) {
  if (!active || !(payload == null ? void 0 : payload.length)) return null;
  return /* @__PURE__ */ jsxs("div", { className: "bg-[#111C24] border border-white/10 rounded-xl px-3 py-2 shadow-xl", children: [
    /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black text-[#4B6478] uppercase tracking-widest mb-1", children: label }),
    /* @__PURE__ */ jsxs("p", { className: "text-[13px] font-black text-white", children: [
      payload[0].value,
      " tenant"
    ] })
  ] });
}
function PieTooltip({ active, payload }) {
  if (!active || !(payload == null ? void 0 : payload.length)) return null;
  return /* @__PURE__ */ jsx("div", { className: "bg-[#111C24] border border-white/10 rounded-xl px-3 py-2 shadow-xl", children: /* @__PURE__ */ jsxs("p", { className: "text-[13px] font-black text-white", children: [
    payload[0].name,
    ": ",
    payload[0].value
  ] }) });
}
function LoadingSkeleton() {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4 pb-12 animate-pulse", children: [
    /* @__PURE__ */ jsx("div", { className: "h-28 lg:h-32 bg-white/5 rounded-2xl w-full" }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 lg:grid-cols-3 gap-3", children: Array.from({ length: 4 }).map((_, i) => /* @__PURE__ */ jsx("div", { className: "h-24 bg-white/5 rounded-2xl" }, i)) }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-5 gap-4", children: [
      /* @__PURE__ */ jsx("div", { className: "lg:col-span-3 h-64 bg-white/5 rounded-2xl" }),
      /* @__PURE__ */ jsx("div", { className: "lg:col-span-2 h-64 bg-white/5 rounded-2xl" })
    ] })
  ] });
}
function AdminBeranda() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: stats, isLoading, isError } = useGlobalStats();
  const updateTenant = useAdminUpdateTenant();
  const handleExtendTrial = (tenantId) => {
    const newEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1e3).toISOString();
    updateTenant.mutate(
      { tenantId, updates: { trial_ends_at: newEnd } },
      { onSuccess: () => queryClient.invalidateQueries(["admin-global-stats"]) }
    );
  };
  if (isLoading || !stats) return /* @__PURE__ */ jsx(LoadingSkeleton, {});
  if (isError) {
    return /* @__PURE__ */ jsx("div", { className: "flex flex-col items-center justify-center min-h-[400px] gap-4", children: /* @__PURE__ */ jsxs("div", { className: "bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center max-w-sm", children: [
      /* @__PURE__ */ jsx(AlertTriangle, { size: 32, className: "text-red-500 mx-auto mb-3 opacity-70" }),
      /* @__PURE__ */ jsx("p", { className: "text-white font-bold text-sm mb-1", children: "Gagal memuat data" }),
      /* @__PURE__ */ jsx("p", { className: "text-[#4B6478] text-xs mb-4", children: "Coba refresh halaman atau periksa koneksi." }),
      /* @__PURE__ */ jsxs(
        Button,
        {
          size: "sm",
          variant: "outline",
          onClick: () => queryClient.invalidateQueries(["admin-global-stats"]),
          className: "border-white/10 text-white hover:bg-white/5 text-xs font-black uppercase tracking-widest",
          children: [
            /* @__PURE__ */ jsx(RefreshCw, { size: 13, className: "mr-2" }),
            " Refresh"
          ]
        }
      )
    ] }) });
  }
  const pieData = [
    { name: "Starter", value: stats.tenants.starter, color: "#4B6478" },
    { name: "Pro", value: stats.tenants.pro, color: "#021a02" },
    { name: "Business", value: stats.tenants.business, color: "#F59E0B" }
  ];
  const pendingCount = stats.revenue.pendingList.length;
  const expiringCount = stats.tenants.trialExpiringSoon.length;
  const planExpiringCount = stats.tenants.planExpiringSoon.length;
  const planExpiredCount = stats.tenants.planAlreadyExpired.length;
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between py-2 -mx-2 px-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "hidden lg:block", children: [
        /* @__PURE__ */ jsx("h1", { className: "font-display text-2xl font-black text-white uppercase tracking-tight", children: "PLATFORM OVERVIEW" }),
        /* @__PURE__ */ jsx("p", { className: "text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1", children: "Platform health & business metrics" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 ml-auto", children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            size: "sm",
            variant: "ghost",
            onClick: () => queryClient.invalidateQueries(["admin-global-stats"]),
            className: "h-9 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 text-[10px] font-black uppercase tracking-widest px-4",
            children: [
              /* @__PURE__ */ jsx(RefreshCw, { size: 13, className: "mr-2" }),
              " Sync"
            ]
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 shrink-0", children: [
          /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" }),
          /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black text-emerald-400 uppercase tracking-widest", children: "LIVE" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-3 lg:space-y-4", children: [
      /* @__PURE__ */ jsx(
        KPICard,
        {
          label: "REVENUE BULAN INI",
          value: formatIDR(stats.revenue.thisMonth),
          sub: `Total Akumulasi: ${formatIDR(stats.revenue.total)}`,
          icon: DollarSign,
          iconColor: "text-emerald-400 bg-emerald-500/10",
          accentLeft: expiringCount > 0 ? "border-l-2 border-red-500" : "",
          pulse: expiringCount > 0
        }
      ),
      /* @__PURE__ */ jsx(
        KPICard,
        {
          label: "Plan Akan Expired",
          value: planExpiringCount > 0 ? planExpiringCount : planExpiredCount > 0 ? planExpiredCount : "0",
          sub: planExpiredCount > 0 ? `${planExpiredCount} sudah expired — belum downgrade` : planExpiringCount > 0 ? "Pro/Business dalam 30 hari" : "Semua plan aktif ✓",
          icon: Clock,
          iconColor: planExpiredCount > 0 ? "text-red-400 bg-red-500/10" : planExpiringCount > 0 ? "text-amber-400 bg-amber-500/10" : "text-[#4B6478] bg-white/5",
          valueColor: planExpiredCount > 0 ? "text-red-400" : planExpiringCount > 0 ? "text-amber-400" : "text-white",
          accentLeft: planExpiredCount > 0 ? "border-l-2 border-red-500" : planExpiringCount > 0 ? "border-l-2 border-amber-500" : "",
          pulse: planExpiredCount > 0
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-5 gap-4", children: [
      /* @__PURE__ */ jsxs(Card, { className: "lg:col-span-3 bg-[#111C24] border-white/8 rounded-2xl p-5 shadow-2xl overflow-hidden", children: [
        /* @__PURE__ */ jsx("p", { className: "text-[11px] font-black text-[#4B6478] uppercase tracking-[0.3em] font-display mb-3", children: "PERTUMBUHAN TENANT — 6 BULAN" }),
        /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 220, children: /* @__PURE__ */ jsxs(AreaChart, { data: stats.tenants.growthData, margin: { top: 10, right: 25, bottom: 0, left: 0 }, children: [
          /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: "emeraldGradient", x1: "0", y1: "0", x2: "0", y2: "1", children: [
            /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: "rgba(2, 26, 2,0.2)" }),
            /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: "rgba(2, 26, 2,0)" })
          ] }) }),
          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false, stroke: "rgba(255,255,255,0.05)" }),
          /* @__PURE__ */ jsx(
            XAxis,
            {
              dataKey: "month",
              axisLine: false,
              tickLine: false,
              tick: { fill: "#4B6478", fontSize: 10, fontWeight: 700 },
              dy: 8
            }
          ),
          /* @__PURE__ */ jsx(
            YAxis,
            {
              allowDecimals: false,
              axisLine: false,
              tickLine: false,
              tick: { fill: "#4B6478", fontSize: 10, fontWeight: 700 }
            }
          ),
          /* @__PURE__ */ jsx(Tooltip, { content: /* @__PURE__ */ jsx(DarkTooltip, {}) }),
          /* @__PURE__ */ jsx(
            Area,
            {
              type: "monotone",
              dataKey: "count",
              stroke: "#021a02",
              strokeWidth: 2.5,
              fillOpacity: 1,
              fill: "url(#emeraldGradient)"
            }
          )
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { className: "lg:col-span-2 bg-[#111C24] border-white/8 rounded-2xl p-5 shadow-2xl flex flex-col", children: [
        /* @__PURE__ */ jsx("p", { className: "text-[11px] font-black text-[#4B6478] uppercase tracking-[0.3em] font-display mb-3", children: "DISTRIBUSI PLAN" }),
        /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
          /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 220, children: /* @__PURE__ */ jsxs(PieChart, { children: [
            /* @__PURE__ */ jsx(
              Pie,
              {
                data: pieData,
                cx: "50%",
                cy: "50%",
                innerRadius: 60,
                outerRadius: 90,
                paddingAngle: 4,
                dataKey: "value",
                children: pieData.map((entry, i) => /* @__PURE__ */ jsx(Cell, { fill: entry.color, stroke: "none" }, i))
              }
            ),
            /* @__PURE__ */ jsx(Tooltip, { content: /* @__PURE__ */ jsx(PieTooltip, {}) })
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center pointer-events-none", children: [
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-display font-black text-white", children: stats.tenants.total }),
            /* @__PURE__ */ jsx("p", { className: "text-[9px] font-black text-[#4B6478] uppercase tracking-widest mt-0.5", children: "Total" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex justify-center gap-5 mt-2", children: pieData.map((p) => {
          const pct = stats.tenants.total > 0 ? Math.round(p.value / stats.tenants.total * 100) : 0;
          return /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-0.5", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx("div", { className: "w-2 h-2 rounded-full", style: { backgroundColor: p.color } }),
              /* @__PURE__ */ jsx("span", { className: "text-[9px] font-black text-[#4B6478] uppercase tracking-widest", children: p.name })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-black text-white", children: p.value }),
            /* @__PURE__ */ jsxs("p", { className: "text-[9px] text-[#4B6478] font-bold", children: [
              pct,
              "%"
            ] })
          ] }, p.name);
        }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsxs(Card, { className: "bg-[#111C24] border-white/8 rounded-2xl p-5 shadow-xl space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("p", { className: "text-[11px] font-black text-[#4B6478] uppercase tracking-[0.2em]", children: "TRIAL AKAN HABIS" }),
          expiringCount > 0 ? /* @__PURE__ */ jsxs(Badge, { className: "bg-red-500/10 text-red-400 border-red-500/20 text-[9px] font-black uppercase", children: [
            expiringCount,
            " tenant"
          ] }) : /* @__PURE__ */ jsx(CheckCircle, { size: 14, className: "text-emerald-500/40" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar", children: stats.tenants.trialExpiringSoon.length > 0 ? stats.tenants.trialExpiringSoon.map((t) => {
          const sub = getSubscriptionStatus(t);
          const daysLeft = sub.daysLeft;
          const urgency = daysLeft <= 3 ? "text-red-400" : "text-amber-400";
          return /* @__PURE__ */ jsxs(
            "div",
            {
              className: "flex items-center justify-between p-3 rounded-xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all",
              children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-[12px] font-bold text-white leading-tight", children: toTitleCase(t.business_name) }),
                  /* @__PURE__ */ jsxs("p", { className: `text-[9px] font-black uppercase mt-1 tracking-wider ${urgency}`, children: [
                    "Expires in ",
                    daysLeft,
                    " days"
                  ] })
                ] }),
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    size: "sm",
                    variant: "outline",
                    disabled: updateTenant.isPending,
                    onClick: () => handleExtendTrial(t.id),
                    className: "h-7 rounded-lg border-white/10 text-white/40 text-[9px] font-black uppercase tracking-widest px-3 hover:bg-emerald-500 hover:text-white",
                    children: "Extend"
                  }
                )
              ]
            },
            t.id
          );
        }) : /* @__PURE__ */ jsx("div", { className: "text-center py-6 flex flex-col items-center gap-2 opacity-30", children: /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold uppercase tracking-widest", children: "Antrian Bersih" }) }) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { className: "bg-[#111C24] border-white/8 rounded-2xl p-5 shadow-xl space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("p", { className: "text-[11px] font-black text-[#4B6478] uppercase tracking-[0.2em]", children: "PENDING INVOICES" }),
          pendingCount > 0 ? /* @__PURE__ */ jsxs(Badge, { className: "bg-amber-500/10 text-amber-400 border-amber-500/20 text-[9px] font-black uppercase", children: [
            pendingCount,
            " pending"
          ] }) : /* @__PURE__ */ jsx(CheckCircle, { size: 14, className: "text-emerald-500/40" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar", children: stats.revenue.pendingList.length > 0 ? stats.revenue.pendingList.map((inv) => {
          var _a, _b;
          return /* @__PURE__ */ jsxs(
            "div",
            {
              className: "flex items-center justify-between p-3 rounded-xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                  /* @__PURE__ */ jsxs("p", { className: "text-emerald-400 font-mono text-xs font-bold leading-tight uppercase", children: [
                    "#",
                    (_a = inv.invoice_number) == null ? void 0 : _a.substring(0, 8)
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "text-[#4B6478] text-[10px] font-bold mt-0.5 truncate", children: toTitleCase((_b = inv.tenants) == null ? void 0 : _b.business_name) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 shrink-0 ml-3", children: [
                  /* @__PURE__ */ jsx("p", { className: "font-display text-[12px] font-black text-white", children: formatIDR(inv.amount) }),
                  /* @__PURE__ */ jsx(
                    Button,
                    {
                      size: "sm",
                      variant: "outline",
                      onClick: () => navigate("/admin/subscriptions"),
                      className: "h-7 w-7 p-0 rounded-lg border-white/10 text-[#4B6478] hover:text-amber-400 transition-colors",
                      children: /* @__PURE__ */ jsx(ChevronRight, { size: 14 })
                    }
                  )
                ] })
              ]
            },
            inv.id
          );
        }) : /* @__PURE__ */ jsx("div", { className: "text-center py-6 flex flex-col items-center gap-2 opacity-30", children: /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold uppercase tracking-widest", children: "Semua Lunas" }) }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [
      /* @__PURE__ */ jsx(VerticalCard, { label: "Broker Ayam", value: stats.tenants.byVertical.poultry_broker, icon: Bird, color: "emerald" }),
      /* @__PURE__ */ jsx(VerticalCard, { label: "Broker Telur", value: stats.tenants.byVertical.egg_broker, icon: Egg, color: "blue" }),
      /* @__PURE__ */ jsx(VerticalCard, { label: "Peternak", value: stats.tenants.byVertical.peternak, icon: Home, color: "purple" }),
      /* @__PURE__ */ jsx(VerticalCard, { label: "RPA", value: stats.tenants.byVertical.rpa, icon: Factory, color: "amber" })
    ] })
  ] });
}
function KPICard({ label, value, sub, icon: Icon, iconColor, valueColor = "text-white", accentLeft = "", pulse = false, compact = false, hero = false }) {
  if (hero) {
    return /* @__PURE__ */ jsxs("div", { className: `bg-gradient-to-br from-[#111C24] to-[#0A0F14] rounded-2xl p-6 border border-white/8 relative overflow-hidden shadow-2xl ${accentLeft}`, children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -mr-10 -mt-10" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between relative z-10", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] mb-4 font-display", children: label }),
          /* @__PURE__ */ jsx("p", { className: "text-3xl lg:text-4xl font-display font-black text-white leading-none mb-3", children: value }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20", children: /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black text-emerald-400 uppercase", children: "Bulan Berjalan" }) }),
            /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-slate-500", children: sub })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: `w-14 h-14 rounded-2xl flex items-center justify-center border shadow-xl ${iconColor}`, children: /* @__PURE__ */ jsx(Icon, { size: 24 }) })
      ] })
    ] });
  }
  if (compact) {
    return /* @__PURE__ */ jsxs("div", { className: `bg-[#111C24] rounded-xl p-3 lg:p-4 border border-white/8 flex flex-col items-center justify-center text-center shadow-lg active:scale-95 transition-transform ${pulse ? "animate-pulse-subtle" : ""}`, children: [
      /* @__PURE__ */ jsx("div", { className: `w-7 h-7 lg:w-9 lg:h-9 rounded-lg lg:rounded-xl flex items-center justify-center mb-2 ${iconColor}`, children: /* @__PURE__ */ jsx(Icon, { size: 14, className: "lg:size-16" }) }),
      /* @__PURE__ */ jsx("p", { className: `text-sm lg:text-lg font-display font-black leading-none ${valueColor}`, children: value }),
      /* @__PURE__ */ jsx("p", { className: "text-[8px] lg:text-[10px] uppercase tracking-wider text-slate-400 font-black mt-2", children: label })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: `bg-[#111C24] rounded-2xl p-5 border border-white/8 ${accentLeft} ${pulse ? "animate-pulse-subtle" : ""}`, children: [
    /* @__PURE__ */ jsx("p", { className: "text-[11px] uppercase tracking-widest text-slate-400 font-display font-black mb-4", children: label }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-end justify-between gap-2", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: `text-2xl font-display font-bold leading-none ${valueColor}`, children: value }),
        sub && /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 font-bold mt-2 leading-tight", children: sub })
      ] }),
      /* @__PURE__ */ jsx("div", { className: `w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`, children: /* @__PURE__ */ jsx(Icon, { size: 18 }) })
    ] })
  ] });
}
function VerticalCard({ label, value, icon: Icon, color }) {
  const themes = {
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    blue: "bg-blue-500/10    text-blue-400    border-blue-500/20",
    purple: "bg-purple-500/10  text-purple-400  border-purple-500/20",
    amber: "bg-amber-500/10   text-amber-400   border-amber-500/20"
  };
  return /* @__PURE__ */ jsxs("div", { className: "bg-[#111C24] rounded-xl p-4 border border-white/8 flex items-center gap-3 hover:border-white/15 transition-all", children: [
    /* @__PURE__ */ jsx("div", { className: `w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${themes[color]}`, children: /* @__PURE__ */ jsx(Icon, { size: 16 }) }),
    /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
      /* @__PURE__ */ jsx("p", { className: "text-[15px] font-black text-white leading-none", children: value }),
      /* @__PURE__ */ jsx("p", { className: "text-[9px] font-bold text-[#4B6478] uppercase tracking-widest mt-1 leading-none truncate", children: label })
    ] })
  ] });
}
export {
  AdminBeranda as default
};
