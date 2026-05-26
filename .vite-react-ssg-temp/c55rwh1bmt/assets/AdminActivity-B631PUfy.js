import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, Search, Clock, User, Database, Building2, ChevronRight, CheckCircle2, Info, AlertCircle } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { bK as useAuditLogs, c as useMediaQuery, a0 as Input, aw as Card, bg as toTitleCase, aA as Badge, a1 as cn, F as Sheet, G as SheetContent, H as SheetHeader, I as SheetTitle, J as SheetDescription, aN as ScrollArea } from "../main.mjs";
import "vite-react-ssg";
import "react-router-dom";
import "@tanstack/react-query";
import "sonner";
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
const getActionIcon = (action) => {
  if (action.startsWith("INSERT")) return /* @__PURE__ */ jsx(CheckCircle2, { size: 14, className: "text-emerald-400" });
  if (action.startsWith("UPDATE")) return /* @__PURE__ */ jsx(Info, { size: 14, className: "text-blue-400" });
  if (action.startsWith("DELETE")) return /* @__PURE__ */ jsx(AlertCircle, { size: 14, className: "text-red-400" });
  return /* @__PURE__ */ jsx(Activity, { size: 14, className: "text-slate-400" });
};
const getActionColor = (action) => {
  if (action.startsWith("INSERT")) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  if (action.startsWith("UPDATE")) return "bg-blue-500/10 text-blue-400 border-blue-500/20";
  if (action.startsWith("DELETE")) return "bg-red-500/10 text-red-400 border-red-500/20";
  return "bg-slate-500/10 text-slate-400 border-slate-500/20";
};
function LogCard({ log, onClick }) {
  var _a;
  return /* @__PURE__ */ jsxs(
    motion.button,
    {
      initial: { opacity: 0, y: 4 },
      animate: { opacity: 1, y: 0 },
      onClick,
      className: "w-full text-left bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4 active:scale-[0.98] transition-all hover:border-white/10",
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3 mb-2.5", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [
            /* @__PURE__ */ jsx(Badge, { variant: "outline", className: cn("text-[9px] font-black py-0.5 shrink-0 uppercase tracking-wider", getActionColor(log.action)), children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
              getActionIcon(log.action),
              /* @__PURE__ */ jsx("span", { children: log.action.split("_")[0] })
            ] }) }),
            /* @__PURE__ */ jsx("span", { className: "text-[11px] font-mono font-bold text-blue-400/80 truncate", children: log.entity_type })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-[#4B6478] shrink-0", children: [
            /* @__PURE__ */ jsx(Clock, { size: 10 }),
            /* @__PURE__ */ jsx("span", { className: "text-[9px] font-bold", children: formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: id }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [
            /* @__PURE__ */ jsx("div", { className: "w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(User, { size: 11, className: "text-[#94A3B8]" }) }),
            /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsx("p", { className: "text-[11px] font-bold text-[#F1F5F9] truncate leading-tight", children: toTitleCase((_a = log.actor) == null ? void 0 : _a.full_name) || "System" }),
              log.tenant && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 mt-0.5", children: [
                /* @__PURE__ */ jsx(Building2, { size: 9, className: "text-emerald-500/50 shrink-0" }),
                /* @__PURE__ */ jsx("p", { className: "text-[9px] font-bold text-[#4B6478] truncate", children: toTitleCase(log.tenant.business_name) })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-6 h-6 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(ChevronRight, { size: 12, className: "text-emerald-400/50" }) })
        ] })
      ]
    }
  );
}
function AdminActivity() {
  const [selectedLog, setSelectedLog] = useState(null);
  const [search, setSearch] = useState("");
  const { data: logs, isLoading } = useAuditLogs();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const filteredLogs = logs == null ? void 0 : logs.filter(
    (log) => {
      var _a, _b, _c, _d;
      return log.action.toLowerCase().includes(search.toLowerCase()) || log.entity_type.toLowerCase().includes(search.toLowerCase()) || ((_b = (_a = log.actor) == null ? void 0 : _a.full_name) == null ? void 0 : _b.toLowerCase().includes(search.toLowerCase())) || ((_d = (_c = log.tenant) == null ? void 0 : _c.business_name) == null ? void 0 : _d.toLowerCase().includes(search.toLowerCase()));
    }
  );
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4 p-4 lg:p-0 lg:space-y-6", children: [
    isDesktop ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-br from-[#0C1319] to-[#06090F] p-6 rounded-2xl border border-white/5 relative overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] -mr-32 -mt-32 rounded-full" }),
      /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-2xl font-display font-black text-white tracking-tight uppercase flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20", children: /* @__PURE__ */ jsx(Activity, { className: "text-emerald-400", size: 24 }) }),
          "Activity Log"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-[#4B6478] mt-1 font-medium", children: "Monitoring platform activities & administrative changes" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-[#4B6478]", size: 16 }),
        /* @__PURE__ */ jsx(
          Input,
          {
            placeholder: "Cari aktivitas...",
            value: search,
            onChange: (e) => setSearch(e.target.value),
            className: "bg-black/40 border-white/10 pl-10 pr-4 h-11 w-full md:w-64 rounded-xl text-sm"
          }
        )
      ] })
    ] }) : (
      /* Mobile compact header */
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-[#4B6478]", size: 14 }),
          /* @__PURE__ */ jsx(
            Input,
            {
              placeholder: "Cari aktivitas, actor, tenant…",
              value: search,
              onChange: (e) => setSearch(e.target.value),
              className: "bg-white/[0.04] border-white/[0.07] pl-9 pr-4 h-10 rounded-xl text-sm placeholder:text-[#4B6478]"
            }
          )
        ] }),
        filteredLogs && /* @__PURE__ */ jsxs("span", { className: "text-[10px] font-black text-[#4B6478] uppercase tracking-wider shrink-0", children: [
          filteredLogs.length,
          " log"
        ] })
      ] })
    ),
    isDesktop && /* @__PURE__ */ jsx(Card, { className: "bg-[#0C1319] border-white/5 overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-white/5 bg-white/[0.02]", children: [
        /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[10px] font-black text-[#4B6478] uppercase tracking-[0.2em]", children: "Timestamp" }),
        /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[10px] font-black text-[#4B6478] uppercase tracking-[0.2em]", children: "Actor" }),
        /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[10px] font-black text-[#4B6478] uppercase tracking-[0.2em]", children: "Action" }),
        /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[10px] font-black text-[#4B6478] uppercase tracking-[0.2em]", children: "Resource" }),
        /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[10px] font-black text-[#4B6478] uppercase tracking-[0.2em]", children: "Tenant" }),
        /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[10px] font-black text-[#4B6478] uppercase tracking-[0.2em] text-right", children: "Details" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-white/5", children: isLoading ? Array.from({ length: 5 }).map((_, i) => /* @__PURE__ */ jsx("tr", { className: "animate-pulse", children: /* @__PURE__ */ jsx("td", { colSpan: 6, className: "px-6 py-4 bg-white/[0.01]" }) }, i)) : (filteredLogs == null ? void 0 : filteredLogs.length) === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 6, className: "px-6 py-12 text-center text-[#4B6478]", children: "Tidak ada log ditemukan" }) }) : filteredLogs == null ? void 0 : filteredLogs.map((log) => {
        var _a, _b;
        return /* @__PURE__ */ jsxs(
          motion.tr,
          {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            className: "hover:bg-white/[0.02] transition-colors group cursor-pointer",
            onClick: () => setSelectedLog(log),
            children: [
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
                /* @__PURE__ */ jsx("span", { className: "text-[11px] font-bold text-white leading-tight", children: format(new Date(log.created_at), "dd MMM yyyy", { locale: id }) }),
                /* @__PURE__ */ jsxs("span", { className: "text-[10px] font-medium text-[#4B6478] flex items-center gap-1 mt-0.5", children: [
                  /* @__PURE__ */ jsx(Clock, { size: 10 }),
                  format(new Date(log.created_at), "HH:mm:ss")
                ] })
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
                /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(User, { size: 14, className: "text-[#94A3B8]" }) }),
                /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-[12px] font-bold text-[#F1F5F9] truncate max-w-[120px]", children: toTitleCase((_a = log.actor) == null ? void 0 : _a.full_name) || "System" }),
                  /* @__PURE__ */ jsx("span", { className: "text-[9px] font-black text-[#4B6478] tracking-wider", children: toTitleCase((_b = log.actor) == null ? void 0 : _b.role) || "SYSTEM" })
                ] })
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: /* @__PURE__ */ jsx(Badge, { variant: "outline", className: cn("text-[10px] font-black py-1", getActionColor(log.action)), children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 uppercase tracking-wider", children: [
                getActionIcon(log.action),
                log.action.split("_")[0]
              ] }) }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Database, { size: 12, className: "text-[#4B6478]" }),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] font-mono font-bold text-blue-400/80 tracking-tight", children: log.entity_type })
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: log.tenant ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Building2, { size: 12, className: "text-emerald-500/50" }),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] font-bold text-white transition-colors group-hover:text-emerald-400", children: toTitleCase(log.tenant.business_name) })
              ] }) : /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black text-[#4B6478] uppercase tracking-widest", children: "GLOBAL" }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right", children: /* @__PURE__ */ jsx("div", { className: "flex justify-end opacity-0 group-hover:opacity-100 transition-opacity", children: /* @__PURE__ */ jsx("div", { className: "p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20", children: /* @__PURE__ */ jsx(ChevronRight, { size: 14, className: "text-emerald-400" }) }) }) })
            ]
          },
          log.id
        );
      }) })
    ] }) }) }),
    !isDesktop && /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-2.5", children: isLoading ? Array.from({ length: 6 }).map((_, i) => /* @__PURE__ */ jsx("div", { className: "h-20 bg-white/5 rounded-2xl animate-pulse" }, i)) : (filteredLogs == null ? void 0 : filteredLogs.length) === 0 ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-3 py-16 text-center", children: [
      /* @__PURE__ */ jsx(Activity, { size: 32, className: "text-[#4B6478]" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-[#F1F5F9]", children: "Tidak ada log ditemukan" }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-[#4B6478]", children: "Coba kata kunci lain" })
    ] }) : filteredLogs == null ? void 0 : filteredLogs.map((log) => /* @__PURE__ */ jsx(LogCard, { log, onClick: () => setSelectedLog(log) }, log.id)) }),
    /* @__PURE__ */ jsx(Sheet, { open: !!selectedLog, onOpenChange: () => setSelectedLog(null), children: /* @__PURE__ */ jsxs(SheetContent, { side: "right", className: "w-full sm:max-w-xl bg-[#0C1319] border-white/8 text-white p-0 overflow-hidden flex flex-col", children: [
      /* @__PURE__ */ jsxs(SheetHeader, { className: "p-6 border-b border-white/5 space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs(SheetTitle, { className: "text-xl font-display font-black uppercase tracking-tight text-white flex items-center gap-3", children: [
            selectedLog && getActionIcon(selectedLog.action),
            "Activity Detail"
          ] }),
          /* @__PURE__ */ jsx(SheetDescription, { className: "sr-only", children: "Detail log aktivitas audit sistem." }),
          selectedLog && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: cn("text-[9px] font-black uppercase py-1", getActionColor(selectedLog.action)), children: selectedLog.action })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-3 rounded-xl bg-white/[0.03] border border-white/5", children: [
            /* @__PURE__ */ jsx("p", { className: "text-[9px] font-black text-[#4B6478] uppercase tracking-widest mb-1", children: "OCCURRED AT" }),
            /* @__PURE__ */ jsx("p", { className: "text-[11px] font-bold text-slate-200", children: selectedLog && format(new Date(selectedLog.created_at), "eeee, dd MMMM yyyy HH:mm:ss", { locale: id }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-3 rounded-xl bg-white/[0.03] border border-white/5", children: [
            /* @__PURE__ */ jsx("p", { className: "text-[9px] font-black text-[#4B6478] uppercase tracking-widest mb-1", children: "RESOURCE" }),
            /* @__PURE__ */ jsx("p", { className: "text-[11px] font-mono font-bold text-blue-400", children: selectedLog == null ? void 0 : selectedLog.entity_type })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx(ScrollArea, { className: "flex-1 p-6", children: /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs("h4", { className: "text-[11px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(2, 26, 2,0.5)]" }),
              "Updated Data Snapshot"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "rounded-2xl bg-black/40 border border-white/10 p-4 font-mono text-[11px] leading-relaxed overflow-x-auto", children: /* @__PURE__ */ jsx("pre", { className: "text-emerald-400/90 whitespace-pre-wrap", children: (selectedLog == null ? void 0 : selectedLog.new_data) ? JSON.stringify(selectedLog.new_data, null, 2) : "No new data record" }) })
          ] }),
          (selectedLog == null ? void 0 : selectedLog.old_data) && /* @__PURE__ */ jsxs("div", { className: "space-y-2 pt-2", children: [
            /* @__PURE__ */ jsxs("h4", { className: "text-[11px] font-black text-[#4B6478] uppercase tracking-widest flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-slate-600" }),
              "Previous State"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "rounded-2xl bg-black/20 border border-white/5 p-4 font-mono text-[11px] leading-relaxed overflow-x-auto opacity-60", children: /* @__PURE__ */ jsx("pre", { className: "text-slate-400 whitespace-pre-wrap", children: JSON.stringify(selectedLog.old_data, null, 2) }) })
          ] })
        ] }),
        ((selectedLog == null ? void 0 : selectedLog.ip_address) || (selectedLog == null ? void 0 : selectedLog.user_agent)) && /* @__PURE__ */ jsxs("div", { className: "pt-4 border-t border-white/5 space-y-4", children: [
          /* @__PURE__ */ jsx("h4", { className: "text-[11px] font-black text-slate-400 uppercase tracking-widest", children: "Metadata Context" }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
            selectedLog.ip_address && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5", children: [
              /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-[#4B6478]", children: "IP ADDRESS" }),
              /* @__PURE__ */ jsx("span", { className: "text-[11px] font-mono text-slate-300 font-bold", children: selectedLog.ip_address })
            ] }),
            selectedLog.user_agent && /* @__PURE__ */ jsxs("div", { className: "p-3 rounded-xl bg-white/[0.02] border border-white/5", children: [
              /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-[#4B6478] block mb-2", children: "USER AGENT" }),
              /* @__PURE__ */ jsx("span", { className: "text-[10px] font-medium text-slate-400 leading-relaxed block break-all", children: selectedLog.user_agent })
            ] })
          ] })
        ] })
      ] }) })
    ] }) })
  ] });
}
export {
  AdminActivity as default
};
