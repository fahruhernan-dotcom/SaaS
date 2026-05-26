import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useCallback } from "react";
import { Shield, AlertCircle, AlertTriangle, Zap, Search, CheckCircle2, Clock, X, Check, Copy, Info, Globe, Route } from "lucide-react";
import { subHours, formatDistanceToNow, format } from "date-fns";
import { id } from "date-fns/locale";
import { aA as Badge, a0 as Input, a1 as cn, s as supabase, aw as Card, F as Sheet, G as SheetContent, H as SheetHeader, I as SheetTitle, p as logSupabaseError } from "../main.mjs";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import "vite-react-ssg";
import "react-router-dom";
import "framer-motion";
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
const PAGE_SIZE = 50;
const LEVEL_STYLES = {
  error: { cls: "bg-red-500/10 text-red-400 border-red-500/20", icon: /* @__PURE__ */ jsx(AlertCircle, { size: 11 }) },
  warning: { cls: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: /* @__PURE__ */ jsx(AlertTriangle, { size: 11 }) },
  info: { cls: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: /* @__PURE__ */ jsx(Info, { size: 11 }) }
};
const SOURCE_STYLES = {
  frontend: { cls: "bg-purple-500/10 text-purple-400 border-purple-500/20", icon: /* @__PURE__ */ jsx(Globe, { size: 10 }) },
  supabase: { cls: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: /* @__PURE__ */ jsx(Shield, { size: 10 }) },
  react_error_boundary: { cls: "bg-red-500/10 text-red-400 border-red-500/20", icon: /* @__PURE__ */ jsx(Zap, { size: 10 }) },
  unhandled_rejection: { cls: "bg-orange-500/10 text-orange-400 border-orange-500/20", icon: /* @__PURE__ */ jsx(AlertCircle, { size: 10 }) },
  route: { cls: "bg-slate-500/10 text-slate-400 border-slate-500/20", icon: /* @__PURE__ */ jsx(Route, { size: 10 }) },
  action: { cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: /* @__PURE__ */ jsx(Zap, { size: 10 }) }
};
async function fetchLogs({ level, source, resolved, search, page }) {
  let q = supabase.from("system_error_logs").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
  if (level && level !== "all") q = q.eq("level", level);
  if (source && source !== "all") q = q.eq("source", source);
  if (resolved === "unresolved") q = q.eq("resolved", false);
  if (resolved === "resolved") q = q.eq("resolved", true);
  if (search) q = q.ilike("error_message", `%${search}%`);
  const { data, error, count } = await q;
  if (error) throw error;
  return { data: data || [], count: count || 0 };
}
async function fetchSummary() {
  const since = subHours(/* @__PURE__ */ new Date(), 24).toISOString();
  const { data, error } = await supabase.from("system_error_logs").select("level, source, resolved, created_at").gte("created_at", since);
  if (error) throw error;
  const rows = data || [];
  return {
    total24h: rows.length,
    unresolved: rows.filter((r) => !r.resolved).length,
    policyErrors: rows.filter((r) => r.source === "supabase").length,
    frontendCrashes: rows.filter((r) => ["react_error_boundary", "frontend", "unhandled_rejection"].includes(r.source)).length
  };
}
function SummaryCard({ label, value, colorCls, icon }) {
  return /* @__PURE__ */ jsxs(Card, { className: "bg-white/[0.02] border-white/[0.06] p-4 flex flex-col gap-1", children: [
    /* @__PURE__ */ jsx("div", { className: cn("w-8 h-8 rounded-lg flex items-center justify-center mb-1", colorCls + "/10"), children: /* @__PURE__ */ jsx("span", { className: colorCls, children: icon }) }),
    /* @__PURE__ */ jsx("div", { className: "text-2xl font-black text-white", children: value ?? "—" }),
    /* @__PURE__ */ jsx("div", { className: "text-[11px] font-bold text-[#4B6478] uppercase tracking-wider", children: label })
  ] });
}
function LevelBadge({ level }) {
  const s = LEVEL_STYLES[level] || LEVEL_STYLES.info;
  return /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: cn("text-[9px] font-black py-0.5 uppercase tracking-wider gap-1 shrink-0", s.cls), children: [
    s.icon,
    " ",
    level
  ] });
}
function SourceBadge({ source }) {
  const s = SOURCE_STYLES[source] || { cls: "bg-slate-500/10 text-slate-400 border-slate-500/20", icon: /* @__PURE__ */ jsx(Globe, { size: 10 }) };
  return /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: cn("text-[9px] font-black py-0.5 uppercase tracking-wider gap-1 shrink-0", s.cls), children: [
    s.icon,
    " ",
    source == null ? void 0 : source.replace("_", " ")
  ] });
}
function LogRow({ log, onClick }) {
  return /* @__PURE__ */ jsxs(
    "button",
    {
      onClick,
      className: "w-full text-left bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3 hover:border-white/10 hover:bg-white/[0.04] transition-all active:scale-[0.99]",
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2 mb-1.5", children: [
          /* @__PURE__ */ jsx(LevelBadge, { level: log.level }),
          /* @__PURE__ */ jsx(SourceBadge, { source: log.source }),
          log.resolved && /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-[9px] font-black py-0.5 uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border-emerald-500/20", children: [
            /* @__PURE__ */ jsx(CheckCircle2, { size: 9 }),
            " resolved"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "ml-auto flex items-center gap-1 text-[#4B6478] shrink-0", children: [
            /* @__PURE__ */ jsx(Clock, { size: 9 }),
            /* @__PURE__ */ jsx("span", { className: "text-[9px] font-bold", children: formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: id }) })
          ] })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-[12px] text-[#94A3B8] font-medium leading-snug line-clamp-2 text-left", children: log.error_message || "(no message)" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mt-1.5", children: [
          log.page_path && /* @__PURE__ */ jsx("span", { className: "text-[10px] font-mono text-[#4B6478] truncate", children: log.page_path }),
          log.component && /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-[#4B6478]", children: [
            "· ",
            log.component
          ] }),
          log.vertical && /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-[#4B6478]", children: [
            "· ",
            log.vertical
          ] })
        ] })
      ]
    }
  );
}
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return /* @__PURE__ */ jsx(
    "button",
    {
      onClick: () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2e3);
      },
      className: "p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#4B6478] hover:text-white transition-colors",
      children: copied ? /* @__PURE__ */ jsx(Check, { size: 13, className: "text-emerald-400" }) : /* @__PURE__ */ jsx(Copy, { size: 13 })
    }
  );
}
function DetailSheet({ log, onClose, onResolved }) {
  const [note, setNote] = useState((log == null ? void 0 : log.note) || "");
  const [saving, setSaving] = useState(false);
  if (!log) return null;
  const handleResolve = async () => {
    setSaving(true);
    const { error } = await supabase.from("system_error_logs").update({ resolved: !log.resolved, resolved_at: !log.resolved ? (/* @__PURE__ */ new Date()).toISOString() : null, note: note || null }).eq("id", log.id);
    setSaving(false);
    if (error) {
      logSupabaseError(error, { table: "system_error_logs", operation: "update", component: "AdminInfo", actionName: "admin.error_log.resolve" });
      toast.error("Gagal update: " + error.message);
      return;
    }
    toast.success(!log.resolved ? "Ditandai resolved." : "Dibuka kembali.");
    onResolved();
  };
  const stack = log.stack || log.error_details || null;
  const meta = log.metadata && Object.keys(log.metadata).length > 0 ? JSON.stringify(log.metadata, null, 2) : null;
  return /* @__PURE__ */ jsx(Sheet, { open: true, onOpenChange: (open) => {
    if (!open) onClose();
  }, children: /* @__PURE__ */ jsxs(SheetContent, { side: "right", className: "w-full sm:max-w-xl bg-[#0D1117] border-white/[0.08] overflow-y-auto", children: [
    /* @__PURE__ */ jsx(SheetHeader, { className: "mb-4", children: /* @__PURE__ */ jsxs(SheetTitle, { className: "text-white flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(LevelBadge, { level: log.level }),
      "Detail Log"
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-4 text-sm", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
        /* @__PURE__ */ jsx(SourceBadge, { source: log.source }),
        log.vertical && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[9px] font-black uppercase bg-white/5 text-[#94A3B8] border-white/10", children: log.vertical }),
        log.resolved && /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-400 border-emerald-500/20", children: [
          /* @__PURE__ */ jsx(CheckCircle2, { size: 9 }),
          " resolved"
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "text-[#4B6478] text-xs", children: format(new Date(log.created_at), "dd MMM yyyy HH:mm:ss", { locale: id }) }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white/[0.03] border border-white/[0.06] rounded-xl p-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-1.5", children: [
          /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-[#4B6478] uppercase tracking-wider", children: "Error Message" }),
          log.error_message && /* @__PURE__ */ jsx(CopyButton, { text: log.error_message })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-[#F1F5F9] text-[13px] leading-relaxed", children: log.error_message || "—" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-2 text-[11px]", children: [
        ["Page", log.page_path],
        ["Component", log.component],
        ["Action", log.action_name],
        ["Error Code", log.error_code],
        ["Role", log.role],
        ["Tenant ID", log.tenant_id],
        ["User ID", log.user_id],
        ["App Version", log.app_version]
      ].filter(([, v]) => v).map(([label, val]) => /* @__PURE__ */ jsxs("div", { className: "bg-white/[0.02] border border-white/[0.05] rounded-lg p-2", children: [
        /* @__PURE__ */ jsx("div", { className: "text-[#4B6478] font-bold uppercase tracking-wider text-[9px] mb-1", children: label }),
        /* @__PURE__ */ jsx("div", { className: "text-[#94A3B8] font-mono break-all", children: val })
      ] }, label)) }),
      stack && /* @__PURE__ */ jsxs("div", { className: "bg-white/[0.03] border border-white/[0.06] rounded-xl p-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-1.5", children: [
          /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-[#4B6478] uppercase tracking-wider", children: "Stack / Details" }),
          /* @__PURE__ */ jsx(CopyButton, { text: stack })
        ] }),
        /* @__PURE__ */ jsx("pre", { className: "text-[11px] text-[#4B6478] font-mono whitespace-pre-wrap break-all overflow-auto max-h-48", children: stack })
      ] }),
      meta && /* @__PURE__ */ jsxs("div", { className: "bg-white/[0.03] border border-white/[0.06] rounded-xl p-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-1.5", children: [
          /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-[#4B6478] uppercase tracking-wider", children: "Metadata" }),
          /* @__PURE__ */ jsx(CopyButton, { text: meta })
        ] }),
        /* @__PURE__ */ jsx("pre", { className: "text-[11px] text-[#4B6478] font-mono whitespace-pre-wrap break-all overflow-auto max-h-40", children: meta })
      ] }),
      log.user_agent && /* @__PURE__ */ jsx("div", { className: "text-[10px] text-[#4B6478] font-mono break-all", children: log.user_agent }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-[#4B6478] uppercase tracking-wider block mb-1.5", children: "Catatan" }),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            value: note,
            onChange: (e) => setNote(e.target.value),
            placeholder: "Tambah catatan internal...",
            rows: 2,
            className: "w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 text-[13px] text-[#F1F5F9] placeholder:text-[#4B6478] resize-none outline-none focus:border-white/20"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2 pb-4", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleResolve,
            disabled: saving,
            className: cn(
              "flex-1 py-3 rounded-xl font-bold text-[13px] transition-all",
              log.resolved ? "bg-white/[0.06] text-[#4B6478] hover:bg-white/[0.10]" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
            ),
            children: saving ? "Menyimpan…" : log.resolved ? "Buka Kembali" : "Tandai Resolved"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: onClose,
            className: "px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[#4B6478] hover:text-white transition-colors",
            children: /* @__PURE__ */ jsx(X, { size: 14 })
          }
        )
      ] })
    ] })
  ] }) });
}
function AdminInfo() {
  const qc = useQueryClient();
  const [level, setLevel] = useState("all");
  const [source, setSource] = useState("all");
  const [resolved, setResolved] = useState("unresolved");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selectedLog, setSelectedLog] = useState(null);
  const handleSearch = useCallback((val) => {
    setSearch(val);
    clearTimeout(window._logSearchTimer);
    window._logSearchTimer = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(0);
    }, 400);
  }, []);
  const { data: summary, isError: summaryError } = useQuery({
    queryKey: ["admin-log-summary"],
    queryFn: fetchSummary,
    staleTime: 6e4,
    retry: 1
  });
  const { data: logsData, isLoading, isError: logsError } = useQuery({
    queryKey: ["admin-logs", level, source, resolved, debouncedSearch, page],
    queryFn: () => fetchLogs({ level, source, resolved, search: debouncedSearch, page }),
    staleTime: 3e4,
    retry: 1
  });
  const logs = (logsData == null ? void 0 : logsData.data) || [];
  const totalCount = (logsData == null ? void 0 : logsData.count) || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const handleResolved = () => {
    qc.invalidateQueries({ queryKey: ["admin-logs"] });
    qc.invalidateQueries({ queryKey: ["admin-log-summary"] });
    setSelectedLog(null);
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-[#080D0F] px-4 py-6 pb-20 space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-xl font-black text-white tracking-tight", children: "System Info" }),
        /* @__PURE__ */ jsx("p", { className: "text-[12px] text-[#4B6478] mt-0.5", children: "Error log & debugging center" })
      ] }),
      /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-[9px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-400 border-purple-500/20", children: [
        /* @__PURE__ */ jsx(Shield, { size: 9 }),
        " Superadmin"
      ] })
    ] }),
    !summaryError && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsx(SummaryCard, { label: "Error 24 jam", value: summary == null ? void 0 : summary.total24h, colorCls: "text-red-400", icon: /* @__PURE__ */ jsx(AlertCircle, { size: 14 }) }),
      /* @__PURE__ */ jsx(SummaryCard, { label: "Unresolved", value: summary == null ? void 0 : summary.unresolved, colorCls: "text-amber-400", icon: /* @__PURE__ */ jsx(AlertTriangle, { size: 14 }) }),
      /* @__PURE__ */ jsx(SummaryCard, { label: "Supabase errors", value: summary == null ? void 0 : summary.policyErrors, colorCls: "text-blue-400", icon: /* @__PURE__ */ jsx(Shield, { size: 14 }) }),
      /* @__PURE__ */ jsx(SummaryCard, { label: "Frontend crashes", value: summary == null ? void 0 : summary.frontendCrashes, colorCls: "text-purple-400", icon: /* @__PURE__ */ jsx(Zap, { size: 14 }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(Search, { size: 13, className: "absolute left-3 top-1/2 -translate-y-1/2 text-[#4B6478]" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            value: search,
            onChange: (e) => handleSearch(e.target.value),
            placeholder: "Cari pesan error...",
            className: "pl-8 bg-white/[0.03] border-white/[0.08] text-[#F1F5F9] placeholder:text-[#4B6478] focus:border-white/20 text-[13px]"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2 overflow-x-auto pb-1", children: [
        ["all", "error", "warning", "info"].map((l) => /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => {
              setLevel(l);
              setPage(0);
            },
            className: cn(
              "shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors uppercase tracking-wide",
              level === l ? "bg-white/10 text-white border-white/20" : "bg-white/[0.02] text-[#4B6478] border-white/[0.06] hover:bg-white/[0.05]"
            ),
            children: l
          },
          l
        )),
        /* @__PURE__ */ jsx("div", { className: "w-px bg-white/10 shrink-0" }),
        ["all", "frontend", "supabase", "react_error_boundary", "unhandled_rejection", "action"].map((s) => /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => {
              setSource(s);
              setPage(0);
            },
            className: cn(
              "shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors",
              source === s ? "bg-white/10 text-white border-white/20" : "bg-white/[0.02] text-[#4B6478] border-white/[0.06] hover:bg-white/[0.05]"
            ),
            children: s.replace("_", " ")
          },
          s
        )),
        /* @__PURE__ */ jsx("div", { className: "w-px bg-white/10 shrink-0" }),
        [["unresolved", "Unresolved"], ["resolved", "Resolved"], ["all", "Semua"]].map(([v, label]) => /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => {
              setResolved(v);
              setPage(0);
            },
            className: cn(
              "shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors",
              resolved === v ? "bg-white/10 text-white border-white/20" : "bg-white/[0.02] text-[#4B6478] border-white/[0.06] hover:bg-white/[0.05]"
            ),
            children: label
          },
          v
        ))
      ] })
    ] }),
    logsError && /* @__PURE__ */ jsxs("div", { className: "bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center", children: [
      /* @__PURE__ */ jsx(AlertCircle, { size: 20, className: "text-red-400 mx-auto mb-2" }),
      /* @__PURE__ */ jsx("p", { className: "text-[13px] text-red-400 font-bold", children: "Gagal memuat log." }),
      /* @__PURE__ */ jsx("p", { className: "text-[11px] text-[#4B6478] mt-1", children: "Pastikan tabel system_error_logs sudah dibuat dan RLS dikonfigurasi." })
    ] }),
    !logsError && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("div", { className: "space-y-2", children: isLoading ? Array.from({ length: 5 }).map((_, i) => /* @__PURE__ */ jsx("div", { className: "h-20 bg-white/[0.02] border border-white/[0.05] rounded-xl animate-pulse" }, i)) : logs.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-12", children: [
        /* @__PURE__ */ jsx(CheckCircle2, { size: 28, className: "text-emerald-400 mx-auto mb-3" }),
        /* @__PURE__ */ jsx("p", { className: "text-[14px] font-bold text-white", children: "Belum ada error tercatat." }),
        /* @__PURE__ */ jsx("p", { className: "text-[12px] text-[#4B6478] mt-1", children: "Error akan muncul di sini setelah logger aktif." })
      ] }) : logs.map((log) => /* @__PURE__ */ jsx(LogRow, { log, onClick: () => setSelectedLog(log) }, log.id)) }),
      totalPages > 1 && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pt-2", children: [
        /* @__PURE__ */ jsxs("span", { className: "text-[11px] text-[#4B6478]", children: [
          totalCount,
          " total · halaman ",
          page + 1,
          "/",
          totalPages
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              disabled: page === 0,
              onClick: () => setPage((p) => p - 1),
              className: "px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white/[0.04] border border-white/[0.06] text-[#4B6478] disabled:opacity-30 hover:bg-white/[0.08]",
              children: "← Prev"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              disabled: page >= totalPages - 1,
              onClick: () => setPage((p) => p + 1),
              className: "px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white/[0.04] border border-white/[0.06] text-[#4B6478] disabled:opacity-30 hover:bg-white/[0.08]",
              children: "Next →"
            }
          )
        ] })
      ] })
    ] }),
    selectedLog && /* @__PURE__ */ jsx(
      DetailSheet,
      {
        log: selectedLog,
        onClose: () => setSelectedLog(null),
        onResolved: handleResolved
      }
    )
  ] });
}
export {
  AdminInfo as default
};
