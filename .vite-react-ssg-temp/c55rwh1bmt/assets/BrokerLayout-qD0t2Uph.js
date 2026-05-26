import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useState, useRef, useEffect, useMemo, useCallback, Component } from "react";
import { useLocation, Link, Outlet } from "react-router-dom";
import { u as useAuth, g as getSubscriptionStatus, c as useMediaQuery, a as useNotificationGenerator, b as useForceDarkMode, r as resolveBusinessVertical, S as SidebarProvider, A as AppSidebar, B as BottomNav, D as DesktopSidebarLayout, s as supabase } from "../main.mjs";
import { B as BusinessModelOverlay } from "./BusinessModelOverlay-CcSVlwix.js";
import { useMotionValue, animate, AnimatePresence, motion } from "framer-motion";
import { Bot, RotateCcw, X, HelpCircle, AlertCircle, RefreshCw, CheckCircle2, Loader2, Send } from "lucide-react";
import { u as useAIAssistant, A as AGENT_STATE, a as AISuccessCard, b as AIConfirmCard } from "./AISuccessCard-NFM3YrKV.js";
import { toast } from "sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { I as InstallAppPrompt, B as BusinessNameWarningBanner, P as PlanExpiryBanner } from "./InstallAppPrompt-D3Jk8JCa.js";
import { u as useSembakoDashboardStats, a as useSembakoSales, b as useSembakoProducts, c as useSembakoAllBatches, d as useSembakoSuppliers, e as useSembakoCustomers, f as useSembakoEmployees, g as useSembakoDeliveries, h as useSembakoSalesPendingDelivery, i as useSembakoStockOut } from "./useSembakoData-Bxb06e4k.js";
import "vite-react-ssg";
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
import "recharts";
import "@radix-ui/react-tabs";
import "@radix-ui/react-collapsible";
import "@radix-ui/react-select";
import "./DatePicker-BO7By-H9.js";
import "react-day-picker";
import "./planGating-BwKbTRBv.js";
const WELCOME_MESSAGE = {
  role: "assistant",
  content: "Halo! Ceritakan transaksimu — beli, jual, bayar, atau kirim ayam.\nAku yang catat ke sistem.",
  timestamp: (/* @__PURE__ */ new Date()).toISOString()
};
function AIChatBubble() {
  const { tenant } = useAuth();
  const sub = getSubscriptionStatus(tenant);
  const isAILocked = !(sub.status === "trial" || sub.status === "active" && sub.plan === "business");
  const location = useLocation();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [hasOpened, setHasOpened] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const panelRef = useRef(null);
  const isMobile = !useMediaQuery("(min-width: 1024px)");
  const FAB_SIZE = 44;
  const FAB_MARGIN = 16;
  const BOTTOM_CLEAR = 80;
  const TOP_CLEAR = 72;
  const fabX = useMotionValue(0);
  const fabY = useMotionValue(0);
  const [fabReady, setFabReady] = useState(false);
  useEffect(() => {
    if (!isMobile) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    fabX.set(vw - FAB_SIZE - FAB_MARGIN);
    fabY.set(vh - FAB_SIZE - BOTTOM_CLEAR);
    setFabReady(true);
  }, [isMobile]);
  const dragConstraints = useMemo(() => {
    if (typeof window === "undefined") return {};
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return { left: FAB_MARGIN, top: TOP_CLEAR, right: vw - FAB_SIZE - FAB_MARGIN, bottom: vh - FAB_SIZE - BOTTOM_CLEAR };
  }, []);
  const snapToCorner = useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cx = fabX.get();
    const cy = fabY.get();
    const tx = cx > vw / 2 ? vw - FAB_SIZE - FAB_MARGIN : FAB_MARGIN;
    const ty = cy > vh / 2 ? vh - FAB_SIZE - BOTTOM_CLEAR : TOP_CLEAR;
    animate(fabX, tx, { type: "spring", stiffness: 400, damping: 30 });
    animate(fabY, ty, { type: "spring", stiffness: 400, damping: 30 });
  }, [fabX, fabY]);
  const {
    messages,
    agentState,
    isLoading,
    sendMessage,
    pendingEntries,
    pendingEntry,
    pendingCount,
    confirmEntry,
    rejectEntry,
    confirmAll,
    editEntryField,
    unresolvedEntities,
    resolveEntity,
    undoEntry,
    undoLastConfirm,
    undoTimeoutMs,
    lastFailedMessage,
    retryLastMessage,
    isEntryLocked,
    getEntryParent,
    resetConversation,
    cancelAI,
    // Add this
    error
  } = useAIAssistant({
    userType: "broker",
    contextPage: location.pathname
  });
  const displayMessages = messages.length === 0 && hasOpened ? [WELCOME_MESSAGE] : messages;
  const [undoCountdown, setUndoCountdown] = useState(0);
  useEffect(() => {
    if (!undoEntry) {
      setUndoCountdown(0);
      return;
    }
    setUndoCountdown(Math.ceil(undoTimeoutMs / 1e3));
    const interval = setInterval(() => {
      setUndoCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1e3);
    return () => clearInterval(interval);
  }, [undoEntry, undoTimeoutMs]);
  const handleOpen = useCallback(() => {
    setIsOpen(true);
    if (!hasOpened) setHasOpened(true);
  }, [hasOpened]);
  const handleClose = useCallback(() => setIsOpen(false), []);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [displayMessages, isLoading, pendingEntry, undoEntry]);
  useEffect(() => {
    if (isOpen && inputRef.current) setTimeout(() => {
      var _a;
      return (_a = inputRef.current) == null ? void 0 : _a.focus();
    }, 300);
  }, [isOpen]);
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "40px";
      const scrollHeight = inputRef.current.scrollHeight;
      inputRef.current.style.height = Math.min(scrollHeight, 200) + "px";
    }
  }, [input]);
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) handleClose();
    };
    const timer = setTimeout(() => document.addEventListener("mousedown", handler), 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handler);
    };
  }, [isOpen, handleClose]);
  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    sendMessage(trimmed);
  }, [input, isLoading, sendMessage]);
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);
  const getStatusText = () => {
    switch (agentState) {
      case AGENT_STATE.PRE_CHECKING:
        return "Memeriksa...";
      case AGENT_STATE.THINKING:
        return "Berpikir...";
      case AGENT_STATE.AWAITING_CLARIFICATION:
        return "Perlu detail...";
      case AGENT_STATE.AWAITING_CONFIRMATION:
        return pendingCount > 1 ? `${pendingCount} transaksi menunggu` : "Menunggu konfirmasi";
      case AGENT_STATE.ERROR:
        return "Gangguan";
      default:
        return "Online";
    }
  };
  useCallback(async () => {
    if (!pendingEntry) return;
    const data = await confirmEntry(pendingEntry.id);
    if (data) {
      toast.success("Data disimpan! (Undo tersedia 8 detik)");
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["cashflow"] });
      queryClient.invalidateQueries({ queryKey: ["broker-stats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-redesign"] });
    }
  }, [pendingEntry, confirmEntry, queryClient]);
  useCallback(async () => {
    if (!pendingEntry) return;
    await rejectEntry(pendingEntry.id);
  }, [pendingEntry, rejectEntry]);
  const handleConfirmAll = useCallback(async () => {
    const results = await confirmAll();
    if (results.success > 0) {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["cashflow"] });
      queryClient.invalidateQueries({ queryKey: ["broker-stats"] });
    }
  }, [confirmAll, queryClient]);
  const formatTime = (ts) => {
    try {
      return new Date(ts).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(AnimatePresence, { children: !isOpen && (!isMobile || fabReady) && /* @__PURE__ */ jsxs(
      motion.button,
      {
        initial: { scale: 0, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 0, opacity: 0 },
        transition: { type: "spring", stiffness: 400, damping: 22 },
        onClick: handleOpen,
        "aria-label": "Buka AI Assistant",
        ...isMobile ? {
          drag: true,
          dragMomentum: false,
          dragElastic: 0,
          dragConstraints,
          onDragEnd: snapToCorner,
          style: { position: "fixed", left: 0, top: 0, x: fabX, y: fabY, zIndex: 60, touchAction: "none" },
          className: "w-11 h-11 rounded-2xl bg-emerald-500 text-white shadow-xl shadow-emerald-500/30 flex items-center justify-center cursor-grab active:cursor-grabbing"
        } : {
          className: "fixed bottom-8 right-8 z-[60] w-12 h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/30 flex items-center justify-center transition-colors active:scale-95"
        },
        children: [
          /* @__PURE__ */ jsx(Bot, { size: isMobile ? 18 : 20 }),
          pendingCount > 0 && /* @__PURE__ */ jsx("span", { className: "absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 border-2 border-[#06090F] flex items-center justify-center text-[9px] font-black text-white", children: pendingCount })
        ]
      },
      "fab"
    ) }),
    /* @__PURE__ */ jsx(AnimatePresence, { children: isOpen && /* @__PURE__ */ jsxs(
      motion.div,
      {
        ref: panelRef,
        initial: { y: 40, opacity: 0, scale: 0.97 },
        animate: { y: 0, opacity: 1, scale: 1 },
        exit: { y: 40, opacity: 0, scale: 0.97 },
        transition: { type: "spring", stiffness: 350, damping: 28 },
        className: "fixed bottom-4 right-4 lg:bottom-8 lg:right-8 z-[70] w-[calc(100vw-32px)] sm:w-[460px] flex flex-col rounded-[24px] overflow-hidden border border-white/8",
        style: { height: "min(560px, 82vh)", background: "#06090F", boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)" },
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-5 py-4 border-b border-white/5 bg-[#0C1319]/80 backdrop-blur-sm shrink-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center", children: /* @__PURE__ */ jsx(Bot, { size: 17, className: "text-emerald-400" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h3", { className: "font-display text-[14px] font-black text-white tracking-tight leading-none", children: "TernakBot" }),
                /* @__PURE__ */ jsxs("p", { className: "text-[10px] font-bold text-[#4B6478] uppercase tracking-widest mt-0.5 flex items-center gap-1.5 transition-all", children: [
                  isLoading && /* @__PURE__ */ jsx("span", { className: "w-1 h-1 rounded-full bg-emerald-400 animate-pulse" }),
                  getStatusText()
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: resetConversation,
                  className: "w-8 h-8 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/10 transition-colors flex items-center justify-center",
                  "aria-label": "Mulai chat baru",
                  title: "Chat Baru",
                  children: /* @__PURE__ */ jsx(RotateCcw, { size: 13, className: "text-[#4B6478]" })
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: handleClose,
                  className: "w-8 h-8 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/10 transition-colors flex items-center justify-center",
                  "aria-label": "Tutup chat",
                  children: /* @__PURE__ */ jsx(X, { size: 15, className: "text-[#4B6478]" })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { ref: scrollRef, className: "flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin", children: [
            displayMessages.map((msg, i) => /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("div", { className: `flex ${msg.role === "user" ? "justify-end" : "justify-start"}`, children: /* @__PURE__ */ jsx("div", { className: `max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[13px] font-medium leading-relaxed whitespace-pre-wrap ${msg.role === "user" ? "bg-emerald-500/20 text-emerald-50 rounded-br-md" : "bg-[#0C1319] border border-white/5 text-[#F1F5F9] rounded-bl-md"}`, children: msg.content }) }),
              /* @__PURE__ */ jsxs("p", { className: `text-[9px] font-bold text-[#4B6478]/60 mt-1 ${msg.role === "user" ? "text-right pr-1" : "pl-1 flex items-center justify-between"}`, children: [
                /* @__PURE__ */ jsx("span", { children: formatTime(msg.timestamp) }),
                msg.role === "assistant" && msg.usage && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2 text-[8px] opacity-70", children: [
                  /* @__PURE__ */ jsx("span", { className: "px-1.5 py-0.5 rounded-md bg-white/5 border border-white/5", children: msg.provider || "AI" }),
                  /* @__PURE__ */ jsxs("span", { children: [
                    msg.usage.prompt_tokens,
                    "p + ",
                    msg.usage.completion_tokens,
                    "c = ",
                    /* @__PURE__ */ jsx("b", { className: "text-[#F1F5F9]", children: msg.usage.total_tokens })
                  ] })
                ] })
              ] })
            ] }, i)),
            (agentState === AGENT_STATE.THINKING || agentState === AGENT_STATE.PRE_CHECKING) && !error && /* @__PURE__ */ jsx("div", { className: "flex justify-start", children: /* @__PURE__ */ jsxs("div", { className: "bg-[#1e293b]/50 border border-[#4B6478]/20 rounded-2xl px-3 py-2 flex items-center gap-3 backdrop-blur-sm shadow-xl", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex gap-1.5 h-full items-center", children: [
                /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" }),
                /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 bg-emerald-500/60 rounded-full animate-bounce [animation-delay:-0.15s]" }),
                /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 bg-emerald-500/30 rounded-full animate-bounce" })
              ] }),
              /* @__PURE__ */ jsx("span", { className: "text-[11px] font-bold text-[#4B6478] uppercase tracking-wider ml-1", children: agentState === AGENT_STATE.PRE_CHECKING ? "Routing data..." : "Lagi mikir..." }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: cancelAI,
                  className: "ml-2 px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-[9px] font-black text-red-400 uppercase tracking-widest hover:bg-red-500/20 transition-all",
                  children: "Batal"
                }
              )
            ] }) }),
            agentState === AGENT_STATE.AWAITING_CLARIFICATION && !pendingEntry && /* @__PURE__ */ jsxs("div", { className: "mx-2 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 flex gap-3", children: [
              /* @__PURE__ */ jsx(HelpCircle, { size: 18, className: "text-orange-400 shrink-0 mt-0.5" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-[12px] font-bold text-orange-100", children: "Bisa jelaskan lebih detail?" }),
                /* @__PURE__ */ jsx("p", { className: "text-[11px] text-orange-200/60 mt-0.5", children: "Data kurang lengkap atau meragukan." })
              ] })
            ] }),
            agentState === AGENT_STATE.ERROR && /* @__PURE__ */ jsxs("div", { className: "mx-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3", children: [
              /* @__PURE__ */ jsx(AlertCircle, { size: 18, className: "text-red-400 shrink-0 mt-0.5" }),
              /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsx("p", { className: "text-[12px] text-red-200/80", children: "Gagal memproses. Coba lagi?" }),
                lastFailedMessage && /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: retryLastMessage,
                    className: "mt-2 flex items-center gap-1.5 text-[11px] font-black text-red-300 hover:text-red-200 uppercase tracking-widest transition-colors",
                    children: [
                      /* @__PURE__ */ jsx(RefreshCw, { size: 12 }),
                      " Coba Ulang"
                    ]
                  }
                )
              ] })
            ] }),
            undoEntry && undoCountdown > 0 && /* @__PURE__ */ jsx("div", { className: "mb-4", children: /* @__PURE__ */ jsx(
              AISuccessCard,
              {
                entry: undoEntry.entry,
                onUndo: undoLastConfirm,
                onClose: () => setUndoCountdown(0),
                undoCountdown
              }
            ) }),
            pendingCount > 1 && /* @__PURE__ */ jsx("div", { className: "mx-2", children: /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: handleConfirmAll,
                disabled: isLoading,
                className: "w-full h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-[11px] font-black text-emerald-400 uppercase tracking-widest hover:bg-emerald-500/25 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5",
                children: [
                  /* @__PURE__ */ jsx(CheckCircle2, { size: 12 }),
                  " Konfirmasi Semua (",
                  pendingCount,
                  ")"
                ]
              }
            ) }),
            pendingCount > 1 && /* @__PURE__ */ jsx("div", { className: "mx-4 mb-2 flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/5 overflow-x-auto no-scrollbar", children: pendingEntries.map((entry, idx) => /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => {
                  var _a;
                  (_a = document.getElementById(`confirm-card-${entry.id}`)) == null ? void 0 : _a.scrollIntoView({ behavior: "smooth", block: "center" });
                },
                className: "flex-1 min-w-[32px] h-7 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all flex items-center justify-center gap-1 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white",
                children: [
                  /* @__PURE__ */ jsx("span", { className: "opacity-50", children: idx + 1 }),
                  /* @__PURE__ */ jsx("span", { className: "truncate max-w-[40px] lowercase font-bold", children: entry.intent.split("_")[1] })
                ]
              },
              `step-${entry.id}`
            )) }),
            /* @__PURE__ */ jsx("div", { className: "flex overflow-x-auto snap-x snap-mandatory no-scrollbar pb-6 gap-4 px-4 scroll-smooth", children: pendingEntries.map((entry, idx) => {
              var _a;
              return /* @__PURE__ */ jsx(
                "div",
                {
                  id: `confirm-card-${entry.id}`,
                  className: "snap-center shrink-0 w-[calc(100%-20px)] sm:w-[360px]",
                  children: /* @__PURE__ */ jsx(
                    AIConfirmCard,
                    {
                      pendingEntry: entry,
                      queuePosition: idx + 1,
                      queueTotal: pendingCount,
                      onConfirm: () => confirmEntry(entry.id),
                      onReject: () => rejectEntry(entry.id),
                      onEdit: editEntryField,
                      isLoading,
                      unresolvedEntities,
                      onResolveEntity: resolveEntity,
                      isLocked: isEntryLocked(entry),
                      parentIntent: (_a = getEntryParent(entry)) == null ? void 0 : _a.intent
                    }
                  )
                },
                entry.id || idx
              );
            }) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "shrink-0 border-t border-white/5 bg-[#0C1319]/60 backdrop-blur-sm px-4 py-3", children: isAILocked ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center p-3 mb-1 rounded-xl bg-amber-500/10 border border-amber-500/20", children: [
            /* @__PURE__ */ jsxs("p", { className: "text-[11px] font-medium text-amber-200/90 text-center leading-relaxed", children: [
              "TernakBot AI Assistant eksklusif untuk ",
              /* @__PURE__ */ jsx("strong", { className: "text-amber-400", children: "Plan Business" }),
              " dan ",
              /* @__PURE__ */ jsx("strong", { className: "text-amber-400", children: "Trial" }),
              ". Mulai upgrade untuk otomatisasi AI tanpa ribet."
            ] }),
            /* @__PURE__ */ jsx(Link, { to: "/upgrade", className: "mt-2.5 h-8 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 text-[#06090F] font-black text-[11px] uppercase tracking-widest flex items-center justify-center transition-colors shadow-lg shadow-amber-500/20 active:scale-95", children: "Upgrade Sekarang" })
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-end gap-2", children: [
              /* @__PURE__ */ jsx(
                "textarea",
                {
                  ref: inputRef,
                  value: input,
                  onChange: (e) => setInput(e.target.value),
                  onKeyDown: handleKeyDown,
                  placeholder: "Ketik atau ceritakan transaksimu...",
                  rows: 1,
                  spellCheck: false,
                  className: "flex-1 resize-none bg-[#111C24] border border-white/8 rounded-xl px-3.5 py-2.5 text-[13px] font-medium text-white placeholder:text-[#4B6478] focus:outline-none focus:border-emerald-500/40 transition-colors leading-relaxed",
                  style: { maxHeight: "200px", minHeight: "40px" },
                  disabled: isLoading
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: handleSend,
                  disabled: !input.trim() || isLoading,
                  className: "w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/30 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors shrink-0 shadow-lg shadow-emerald-500/15 active:scale-95",
                  "aria-label": "Kirim pesan",
                  children: isLoading ? /* @__PURE__ */ jsx(Loader2, { size: 16, className: "animate-spin" }) : /* @__PURE__ */ jsx(Send, { size: 16 })
                }
              )
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-[9px] font-bold text-[#4B6478]/50 text-center mt-2 uppercase tracking-widest", children: "AI bisa salah · Selalu cek data · Undo tersedia 8 detik" })
          ] }) })
        ]
      },
      "panel"
    ) })
  ] });
}
class AIErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { crashed: false };
  }
  static getDerivedStateFromError() {
    return { crashed: true };
  }
  componentDidCatch(error) {
    console.error("[AIErrorBoundary] AI widget crashed:", error);
  }
  render() {
    if (this.state.crashed) {
      return /* @__PURE__ */ jsx("div", { className: "fixed bottom-24 right-4 lg:bottom-8 lg:right-8 z-[60] w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center", title: "AI sementara tidak tersedia", children: /* @__PURE__ */ jsx("span", { className: "text-red-400 text-lg", children: "!" }) });
    }
    return this.props.children;
  }
}
function SembakoPrefetcher() {
  useSembakoDashboardStats();
  useSembakoSales();
  useSembakoProducts();
  useSembakoAllBatches();
  useSembakoSuppliers();
  useSembakoCustomers();
  useSembakoEmployees();
  useSembakoDeliveries();
  useSembakoSalesPendingDelivery();
  useSembakoStockOut();
  return null;
}
function PoultryBrokerPrefetcher() {
  const { tenant } = useAuth();
  const tid = tenant == null ? void 0 : tenant.id;
  useQuery({
    queryKey: ["sales", tid],
    queryFn: async () => {
      const { data, error } = await supabase.from("sales").select(`*, rpa_clients(rpa_name,phone), purchases(*,farms(farm_name,location)), deliveries(*,vehicles(brand,vehicle_plate),drivers(full_name)), payments(*)`).eq("tenant_id", tid).eq("is_deleted", false).order("transaction_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!tid
  });
  useQuery({
    queryKey: ["deliveries", tid],
    queryFn: async () => {
      const { data, error } = await supabase.from("deliveries").select(`*, drivers(full_name), vehicles(brand,vehicle_plate), sales!inner(id,is_deleted,total_revenue,quantity,total_weight_kg,price_per_kg,delivery_cost,rpa_clients(rpa_name,phone),purchases(total_cost,transport_cost,other_cost,price_per_kg,farms(farm_name)))`).eq("tenant_id", tid).eq("is_deleted", false).eq("sales.is_deleted", false).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!tid
  });
  useQuery({
    queryKey: ["loss-reports", tid],
    queryFn: async () => {
      const { data, error } = await supabase.from("loss_reports").select(`*, delivery:deliveries(*,sales(price_per_kg,rpa_clients(rpa_name)))`).eq("tenant_id", tid).eq("is_deleted", false).order("report_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!tid
  });
  useQuery({
    queryKey: ["vehicles", tid],
    queryFn: async () => {
      const { data, error } = await supabase.from("vehicles").select("*, deliveries(id,created_at,is_deleted)").eq("tenant_id", tid).eq("is_deleted", false).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!tid
  });
  useQuery({
    queryKey: ["drivers", tid],
    queryFn: async () => {
      const { data, error } = await supabase.from("drivers").select("*, deliveries(id,created_at,is_deleted)").eq("tenant_id", tid).eq("is_deleted", false).order("full_name", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!tid
  });
  return null;
}
function BrokerLayout() {
  const { profile, tenant, loading, isSuperadmin, refetchProfile } = useAuth();
  useNotificationGenerator();
  useForceDarkMode();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
    const openHandler = () => setSidebarOpen(true);
    window.addEventListener("open-mobile-sidebar", openHandler);
    return () => window.removeEventListener("open-mobile-sidebar", openHandler);
  }, []);
  const swipeStartX = useRef(null);
  const handleTouchStart = (e) => {
    swipeStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    if (swipeStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - swipeStartX.current;
    if (!sidebarOpen && swipeStartX.current < 40 && dx > 60) {
      setSidebarOpen(true);
    } else if (sidebarOpen && dx < -50) {
      setSidebarOpen(false);
    }
    swipeStartX.current = null;
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { style: { minHeight: "100vh", padding: 24, color: "#F1F5F9", background: "#06090F" }, children: "Memuat dashboard..." });
  }
  if (!isSuperadmin && !(profile == null ? void 0 : profile.business_model_selected)) {
    return /* @__PURE__ */ jsx(BusinessModelOverlay, { profile, onComplete: refetchProfile });
  }
  const vertical = resolveBusinessVertical(profile, tenant);
  const isSembako = vertical === "distributor_sembako" || vertical === "sembako_broker";
  const renderContent = () => {
    if (!isDesktop) {
      return /* @__PURE__ */ jsxs(
        "div",
        {
          onTouchStart: handleTouchStart,
          onTouchEnd: handleTouchEnd,
          style: {
            background: "#06090F",
            minHeight: "100vh",
            maxWidth: "480px",
            margin: "0 auto",
            paddingBottom: "calc(90px + env(safe-area-inset-bottom, 0px))",
            position: "relative",
            overflowX: "hidden",
            overscrollBehaviorX: "none"
          },
          children: [
            /* @__PURE__ */ jsx(SidebarProvider, { style: { minHeight: 0 }, children: /* @__PURE__ */ jsx(AppSidebar, { open: sidebarOpen, onClose: () => setSidebarOpen(false) }) }),
            /* @__PURE__ */ jsx(BusinessNameWarningBanner, {}),
            !isSuperadmin && /* @__PURE__ */ jsx(PlanExpiryBanner, { tenant }),
            /* @__PURE__ */ jsx(Outlet, { context: { setSidebarOpen, setRightAction: () => {
            } } }),
            /* @__PURE__ */ jsx(BottomNav, {})
          ]
        }
      );
    }
    return /* @__PURE__ */ jsxs(DesktopSidebarLayout, { children: [
      /* @__PURE__ */ jsx(BusinessNameWarningBanner, {}),
      !isSuperadmin && /* @__PURE__ */ jsx(PlanExpiryBanner, { tenant }),
      /* @__PURE__ */ jsx(Outlet, { context: { setSidebarOpen } })
    ] });
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    isSembako && /* @__PURE__ */ jsx(SembakoPrefetcher, {}),
    vertical === "poultry_broker" && /* @__PURE__ */ jsx(PoultryBrokerPrefetcher, {}),
    renderContent(),
    /* @__PURE__ */ jsx(AIErrorBoundary, { children: /* @__PURE__ */ jsx(AIChatBubble, {}) }),
    /* @__PURE__ */ jsx(InstallAppPrompt, {})
  ] });
}
export {
  BrokerLayout as default
};
