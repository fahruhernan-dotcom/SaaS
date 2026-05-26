import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useMemo, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { bv as useAllInvoices, bm as usePaymentSettings, bq as useAllTenants, bi as usePricingConfig, bw as useConfirmInvoice, bx as useUpsertPaymentSetting, by as useDeletePaymentSetting, bj as useCreateInvoice, bz as useDeleteInvoice, a7 as Button, ag as Tabs, ah as TabsList, ai as TabsTrigger, a1 as cn, g as getSubscriptionStatus, aj as TabsContent, aq as formatIDR, a0 as Input, aB as formatDate, bg as toTitleCase, aA as Badge, F as Sheet, G as SheetContent, I as SheetTitle, J as SheetDescription, s as supabase, p as logSupabaseError, af as Switch } from "../main.mjs";
import { useQueryClient } from "@tanstack/react-query";
import { History, Plus, Building2, Clock, CreditCard, CheckCircle2, Banknote, XCircle, Search, X, ChevronRight, CalendarDays, Globe, Download, AlertCircle, Check, Loader2, AlertTriangle, FileText, Edit2, Trash2, Home, Factory, Egg, Bird } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { T as Textarea } from "./textarea-B2JzDYgi.js";
import { A as AlertDialog, a as AlertDialogContent, b as AlertDialogHeader, c as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter, f as AlertDialogCancel, g as AlertDialogAction } from "./alert-dialog-DzaJnNEE.js";
import { I as InputRupiah } from "./InputRupiah-Cjv6-Pgv.js";
import { D as DatePicker } from "./DatePicker-BO7By-H9.js";
import { toast } from "sonner";
import "vite-react-ssg";
import "react-router-dom";
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
import "@radix-ui/react-alert-dialog";
import "react-day-picker";
function getVerticalIcon(v) {
  if (v == null ? void 0 : v.startsWith("peternak_")) return /* @__PURE__ */ jsx(Home, { size: 18 });
  if (v == null ? void 0 : v.startsWith("broker_")) return /* @__PURE__ */ jsx(Building2, { size: 18 });
  if (v == null ? void 0 : v.startsWith("rpa_")) return /* @__PURE__ */ jsx(Factory, { size: 18 });
  switch (v) {
    case "poultry_broker":
      return /* @__PURE__ */ jsx(Bird, { size: 18 });
    case "egg_broker":
      return /* @__PURE__ */ jsx(Egg, { size: 18 });
    case "peternak":
      return /* @__PURE__ */ jsx(Home, { size: 18 });
    case "rpa":
      return /* @__PURE__ */ jsx(Factory, { size: 18 });
    default:
      return /* @__PURE__ */ jsx(Building2, { size: 18 });
  }
}
function AdminSubscriptions() {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
  const queryClient = useQueryClient();
  const { data: invoices, isLoading: isLoadingInvoices } = useAllInvoices();
  const { data: bankAccounts, isLoading: isLoadingBanks } = usePaymentSettings();
  const { data: allTenants } = useAllTenants();
  const { data: pricingConfig } = usePricingConfig();
  const confirmInvoice = useConfirmInvoice();
  const upsertBank = useUpsertPaymentSetting();
  const deleteBank = useDeletePaymentSetting();
  const createInvoice = useCreateInvoice();
  const deleteInvoice = useDeleteInvoice();
  const [activeMainTab, setActiveMainTab] = useState("invoices");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceTab, setInvoiceTab] = useState("Semua");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [confirmNotes, setConfirmNotes] = useState("");
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState(null);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [genForm, setGenForm] = useState({ tenantId: "", plan: "pro", billingMonths: 1, discountPct: 0, notes: "" });
  const [manualPrice, setManualPrice] = useState(0);
  const [_confirmSuccess, setConfirmSuccess] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [deleteInvoiceDialog, setDeleteInvoiceDialog] = useState(false);
  const [deleteBankTarget, setDeleteBankTarget] = useState(null);
  const ITEMS_PER_PAGE = 20;
  (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const stats = useMemo(() => {
    if (!invoices) return { pending: 0, paidMonth: 0, totalRevenue: 0, failed: 0 };
    const now = /* @__PURE__ */ new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3);
    return invoices.reduce((acc, inv) => {
      if (inv.status === "pending") acc.pending += 1;
      if (inv.status === "paid") {
        acc.totalRevenue += inv.amount;
        const paidAt = inv.paid_at ? new Date(inv.paid_at) : null;
        if (paidAt && paidAt >= thirtyDaysAgo) acc.paidMonth += 1;
      }
      if (inv.status === "expired" || inv.status === "cancelled") acc.failed += 1;
      return acc;
    }, { pending: 0, paidMonth: 0, totalRevenue: 0, failed: 0 });
  }, [invoices]);
  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];
    return invoices.filter((inv) => {
      var _a2;
      const bizName = ((_a2 = inv.tenants) == null ? void 0 : _a2.business_name) || "";
      const invNum = inv.invoice_number || "";
      const matchesSearch = bizName.toLowerCase().includes(invoiceSearch.toLowerCase()) || invNum.toLowerCase().includes(invoiceSearch.toLowerCase());
      let matchesTab = true;
      if (invoiceTab === "Pending") matchesTab = inv.status === "pending";
      else if (invoiceTab === "Paid") matchesTab = inv.status === "paid";
      else if (invoiceTab === "Expired") matchesTab = inv.status === "expired";
      else if (invoiceTab === "Cancelled") matchesTab = inv.status === "cancelled";
      const matchesFrom = !dateFrom || inv.created_at >= dateFrom;
      const matchesTo = !dateTo || inv.created_at <= dateTo + "T23:59:59";
      return matchesSearch && matchesTab && matchesFrom && matchesTo;
    });
  }, [invoices, invoiceSearch, invoiceTab, dateFrom, dateTo]);
  useEffect(() => {
    setCurrentPage(1);
  }, [invoiceSearch, invoiceTab, dateFrom, dateTo]);
  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE));
  const pagedInvoices = filteredInvoices.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const genTenant = allTenants == null ? void 0 : allTenants.find((t) => t.id === genForm.tenantId);
  const genVertical = genTenant == null ? void 0 : genTenant.business_vertical;
  const genBaseMonthly = ((_b = (_a = pricingConfig == null ? void 0 : pricingConfig[genVertical]) == null ? void 0 : _a[genForm.plan]) == null ? void 0 : _b.price) || ((_d = (_c = pricingConfig == null ? void 0 : pricingConfig["broker"]) == null ? void 0 : _c[genForm.plan]) == null ? void 0 : _d.price) || (genForm.plan === "pro" ? 999e3 : 1499e3);
  const isPriceFromConfig = !!((_f = (_e = pricingConfig == null ? void 0 : pricingConfig[genVertical]) == null ? void 0 : _e[genForm.plan]) == null ? void 0 : _f.price);
  const effectiveMonthly = isPriceFromConfig ? genBaseMonthly : manualPrice || genBaseMonthly;
  const genSubtotal = effectiveMonthly * genForm.billingMonths;
  const genDiscount = Math.round(genSubtotal * (genForm.discountPct / 100));
  const genFinal = genSubtotal - genDiscount;
  const genHasPending = !!(genForm.tenantId && (invoices == null ? void 0 : invoices.some(
    (i) => {
      var _a2;
      return ((_a2 = i.tenants) == null ? void 0 : _a2.id) === genForm.tenantId && i.status === "pending";
    }
  )));
  const handleOpenDetail = (inv) => {
    setSelectedInvoice(inv);
    setConfirmNotes("");
    setIsSheetOpen(true);
  };
  const handleConfirm = () => {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    confirmInvoice.mutate({
      invoiceId: selectedInvoice.id,
      tenantId: selectedInvoice.tenants.id,
      plan: selectedInvoice.plan,
      billingMonths: selectedInvoice.billing_months,
      notes: confirmNotes || void 0
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries(["admin-invoices"]);
        setSelectedInvoice(
          (prev) => prev ? { ...prev, status: "paid", confirmed_at: now, paid_at: now } : null
        );
        setConfirmSuccess(true);
        setTimeout(() => {
          setIsSheetOpen(false);
          setConfirmSuccess(false);
        }, 1500);
      }
    });
  };
  const executeCancelInvoice = async () => {
    const { data: cancelledRows, error } = await supabase.from("subscription_invoices").update({ status: "cancelled" }).eq("id", selectedInvoice.id).eq("status", "pending").select("id");
    if (error) {
      logSupabaseError(error, { table: "subscription_invoices", operation: "update", component: "AdminSubscriptions", actionName: "admin.invoice.cancel" });
      toast.error("Gagal membatalkan invoice");
    } else if (!cancelledRows || cancelledRows.length === 0) {
      toast.warning("Invoice tidak dapat dibatalkan — status bukan pending.");
      setCancelDialog(false);
    } else {
      toast.success("Invoice dibatalkan");
      queryClient.invalidateQueries(["admin-invoices"]);
      setIsSheetOpen(false);
    }
  };
  const executeDeleteInvoice = () => {
    if (!selectedInvoice) return;
    deleteInvoice.mutate(selectedInvoice.id, {
      onSuccess: () => {
        setIsSheetOpen(false);
        setSelectedInvoice(null);
      }
    });
  };
  const handleSaveBank = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      bank_name: formData.get("bank_name"),
      account_number: formData.get("account_number"),
      account_name: formData.get("account_name"),
      is_active: true
    };
    if (editingBank == null ? void 0 : editingBank.id) payload.id = editingBank.id;
    upsertBank.mutate(payload, {
      onSuccess: () => {
        setIsBankModalOpen(false);
        setEditingBank(null);
      }
    });
  };
  const handleDeleteBank = (bank) => {
    setDeleteBankTarget(bank);
  };
  const handleGenerateInvoice = (e) => {
    e.preventDefault();
    if (!genForm.tenantId) {
      toast.error("Pilih tenant terlebih dahulu");
      return;
    }
    if (genFinal <= 0) {
      toast.error("Nominal harus lebih dari 0");
      return;
    }
    createInvoice.mutate({
      tenantId: genForm.tenantId,
      plan: genForm.plan,
      billingMonths: genForm.billingMonths,
      amount: genFinal,
      notes: genForm.notes || void 0
    }, {
      onSuccess: () => {
        setIsGenerateOpen(false);
        setGenForm({ tenantId: "", plan: "pro", billingMonths: 1, discountPct: 0, notes: "" });
        setManualPrice(0);
      }
    });
  };
  if (isLoadingInvoices) {
    return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center min-h-[400px]", children: /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" }) });
  }
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 overflow-hidden pointer-events-none z-0", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full animate-pulse-glow" }),
      /* @__PURE__ */ jsx("div", { className: "absolute bottom-[10%] left-[-5%] w-[400px] h-[400px] bg-blue-500/5 blur-[100px] rounded-full" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-14 lg:top-0 z-40 bg-[#080C10]/80 backdrop-blur-2xl py-4 -mx-2 px-4 rounded-2xl border border-white/5 shadow-2xl overflow-hidden group", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" }),
      /* @__PURE__ */ jsx("div", { className: "relative z-10", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center", children: /* @__PURE__ */ jsx(History, { className: "text-emerald-400", size: 20 }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h1", { className: "font-display text-2xl font-black text-white uppercase tracking-tight leading-none", children: [
            "Billing & ",
            /* @__PURE__ */ jsx("span", { className: "text-emerald-400", children: "Subscriptions" })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-[10px] font-bold text-[#4B6478] uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" }),
            "Revenue Monitoring & Invoice Management"
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs(
        Button,
        {
          onClick: () => setIsGenerateOpen(true),
          className: "relative z-10 hidden md:flex bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-12 px-6 text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_4px_20px_rgba(2, 26, 2,0.3)] shrink-0 transition-all active:scale-95 group/btn overflow-hidden",
          children: [
            /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" }),
            /* @__PURE__ */ jsx(Plus, { size: 16, className: "mr-2 relative z-10" }),
            /* @__PURE__ */ jsx("span", { className: "relative z-10", children: "Generate Invoice Manual" })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs(Tabs, { value: activeMainTab, onValueChange: setActiveMainTab, className: "w-full relative z-10 mt-6", children: [
      /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center lg:justify-start mb-8 overflow-x-auto scrollbar-hide -mx-4 px-4", children: /* @__PURE__ */ jsx(TabsList, { className: "bg-white/[0.03] backdrop-blur-3xl border border-white/5 p-1 h-14 lg:h-12 rounded-[20px] flex gap-1 shadow-2xl relative z-30", children: [
        { id: "invoices", label: "Invoices", icon: History },
        { id: "settings", label: "Bank", icon: Building2 },
        { id: "expiring", label: "Expiring", icon: Clock },
        { id: "payment", label: "Payment", icon: CreditCard }
      ].map((tab) => /* @__PURE__ */ jsxs(
        TabsTrigger,
        {
          value: tab.id,
          className: "relative flex items-center gap-2.5 px-6 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all data-[state=active]:text-white text-[#4B6478] hover:text-white/60 h-full data-[state=active]:bg-white/10 data-[state=active]:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] group/tab overflow-hidden",
          children: [
            /* @__PURE__ */ jsx(tab.icon, { size: 13, className: cn("transition-transform group-hover/tab:scale-110", activeMainTab === tab.id ? "text-emerald-400" : "text-[#4B6478]") }),
            /* @__PURE__ */ jsx("span", { className: "relative z-10", children: tab.label }),
            tab.id === "expiring" && (() => {
              const count = (allTenants ?? []).filter((t) => {
                const s = getSubscriptionStatus(t);
                return (s.status === "active" || s.status === "trial") && s.daysLeft <= 30;
              }).length;
              return count > 0 && /* @__PURE__ */ jsx("span", { className: "w-4 h-4 rounded-full bg-red-500 text-[9px] flex items-center justify-center animate-pulse shadow-lg shadow-red-500/20 text-white border border-white/10 ml-1", children: count });
            })()
          ]
        },
        tab.id
      )) }) }),
      /* @__PURE__ */ jsxs(TabsContent, { value: "invoices", className: "space-y-6 animate-in fade-in duration-300", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8 lg:mt-4", children: [
          /* @__PURE__ */ jsx(StatCard, { label: "Pending Konfirmasi", value: stats.pending, icon: Clock, color: "amber", isUrgent: stats.pending > 0 }),
          /* @__PURE__ */ jsx(StatCard, { label: "Lunas Bulan Ini", value: stats.paidMonth, icon: CheckCircle2, color: "emerald" }),
          /* @__PURE__ */ jsx(StatCard, { label: "Total Revenue", value: formatIDR(stats.totalRevenue), icon: Banknote, color: "blue" }),
          /* @__PURE__ */ jsx(StatCard, { label: "Expired / Cancelled", value: stats.failed, icon: XCircle, color: "red" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row items-center justify-between gap-4 bg-white/[0.03] backdrop-blur-md p-5 rounded-3xl border border-white/8 shadow-2xl relative overflow-hidden group", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" }),
          /* @__PURE__ */ jsx(Tabs, { value: invoiceTab, onValueChange: setInvoiceTab, className: "w-full lg:w-auto relative z-10", children: /* @__PURE__ */ jsx(TabsList, { className: "bg-black/40 border border-white/5 p-1 h-12 rounded-xl flex overflow-x-auto scrollbar-hide flex-nowrap justify-start items-center", children: ["Semua", "Pending", "Paid", "Expired", "Cancelled"].map((tab) => /* @__PURE__ */ jsxs(
            TabsTrigger,
            {
              value: tab,
              className: "relative rounded-lg px-5 h-full text-[11px] font-bold uppercase tracking-wider data-[state=active]:text-white text-[#4B6478] hover:text-white/60 transition-colors bg-transparent shrink-0",
              children: [
                invoiceTab === tab && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-white/10 rounded-lg shadow-inner" }),
                /* @__PURE__ */ jsxs("span", { className: "relative z-10 flex items-center gap-2", children: [
                  tab,
                  tab === "Pending" && stats.pending > 0 && /* @__PURE__ */ jsx("span", { className: "w-4 h-4 rounded-full bg-red-500 text-[9px] flex items-center justify-center animate-pulse shadow-lg shadow-red-500/20", children: stats.pending })
                ] })
              ]
            },
            tab
          )) }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 w-full lg:w-auto flex-wrap", children: [
            /* @__PURE__ */ jsxs("div", { className: "relative w-full lg:w-72", children: [
              /* @__PURE__ */ jsx(Search, { className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4B6478]", size: 16 }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  placeholder: "Cari No. Invoice / Bisnis...",
                  value: invoiceSearch,
                  onChange: (e) => setInvoiceSearch(e.target.value),
                  className: "bg-black/20 border-white/10 h-11 rounded-xl pl-11 text-base lg:text-sm focus:border-emerald-500/50 transition-all font-medium"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(
                DatePicker,
                {
                  id: "dateFrom",
                  value: dateFrom,
                  onChange: setDateFrom,
                  placeholder: "Mulai...",
                  className: "!h-11 !w-[130px] !rounded-xl bg-[#111C24] border-white/10 text-white/70 px-3 text-base lg:text-xs"
                }
              ),
              /* @__PURE__ */ jsx("span", { className: "text-[#4B6478] text-xs font-bold", children: "—" }),
              /* @__PURE__ */ jsx(
                DatePicker,
                {
                  id: "dateTo",
                  value: dateTo,
                  onChange: setDateTo,
                  placeholder: "Sampai...",
                  className: "!h-11 !w-[130px] !rounded-xl bg-[#111C24] border-white/10 text-white/70 px-3 text-base lg:text-xs"
                }
              ),
              (dateFrom || dateTo) && /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => {
                    setDateFrom("");
                    setDateTo("");
                  },
                  className: "w-7 h-7 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-[#4B6478] flex items-center justify-center transition-all",
                  title: "Reset filter tanggal",
                  children: /* @__PURE__ */ jsx(X, { size: 13 })
                }
              )
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white/[0.02] backdrop-blur-xl rounded-[32px] border border-white/8 overflow-hidden shadow-2xl relative group", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" }),
          /* @__PURE__ */ jsx("div", { className: "overflow-x-auto relative z-10", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-white/5 bg-white/[0.03]", children: [
              /* @__PURE__ */ jsx("th", { className: "px-8 py-6 text-[10px] uppercase tracking-[0.3em] text-[#4B6478] font-display font-black", children: "Invoice" }),
              /* @__PURE__ */ jsx("th", { className: "px-8 py-6 text-[10px] uppercase tracking-[0.3em] text-[#4B6478] font-display font-black", children: "Tenant" }),
              /* @__PURE__ */ jsx("th", { className: "px-8 py-6 text-[10px] uppercase tracking-[0.3em] text-[#4B6478] font-display font-black text-center", children: "Plan" }),
              /* @__PURE__ */ jsx("th", { className: "px-8 py-6 text-[10px] uppercase tracking-[0.3em] text-[#4B6478] font-display font-black text-center", children: "Periode" }),
              /* @__PURE__ */ jsx("th", { className: "px-8 py-6 text-[10px] uppercase tracking-[0.3em] text-[#4B6478] font-display font-black", children: "Amount" }),
              /* @__PURE__ */ jsx("th", { className: "px-8 py-6 text-[10px] uppercase tracking-[0.3em] text-[#4B6478] font-display font-black text-center", children: "Status" }),
              /* @__PURE__ */ jsx("th", { className: "px-8 py-6 text-[10px] uppercase tracking-[0.3em] text-[#4B6478] font-display font-black text-right", children: "Aksi" })
            ] }) }),
            /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-white/5", children: [
              pagedInvoices.map((inv, _i2) => {
                var _a2, _b2;
                return /* @__PURE__ */ jsxs(
                  "tr",
                  {
                    onClick: () => handleOpenDetail(inv),
                    className: cn(
                      "hover:bg-white/[0.05] transition-all group cursor-pointer border-l-4",
                      inv.status === "pending" ? "border-amber-500/40 bg-amber-500/[0.02]" : "border-transparent"
                    ),
                    children: [
                      /* @__PURE__ */ jsx("td", { className: "px-8 py-6", children: /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
                        /* @__PURE__ */ jsxs("p", { className: "text-[12px] font-mono font-black text-emerald-400 leading-none group-hover:scale-105 transition-transform origin-left inline-block", children: [
                          "#",
                          inv.invoice_number
                        ] }),
                        /* @__PURE__ */ jsx("p", { className: "text-[9px] text-[#4B6478] font-black uppercase tracking-[0.2em]", children: formatDate(inv.created_at) })
                      ] }) }),
                      /* @__PURE__ */ jsx("td", { className: "px-8 py-5", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1", children: [
                        /* @__PURE__ */ jsx("p", { className: "text-[13px] font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight", children: toTitleCase((_a2 = inv.tenants) == null ? void 0 : _a2.business_name) }),
                        ((_b2 = inv.tenants) == null ? void 0 : _b2.business_vertical) && /* @__PURE__ */ jsx("div", { className: "flex", children: /* @__PURE__ */ jsx(Badge, { className: "text-[8px] font-black tracking-[0.1em] h-4 px-1.5 border-emerald-500/20 bg-emerald-500/5 text-emerald-500/70 uppercase", children: toTitleCase(inv.tenants.business_vertical) }) })
                      ] }) }),
                      /* @__PURE__ */ jsx("td", { className: "px-8 py-5 text-center", children: /* @__PURE__ */ jsx(PlanBadge, { plan: inv.plan }) }),
                      /* @__PURE__ */ jsxs("td", { className: "px-8 py-6 text-center text-[12px] font-black text-white/80", children: [
                        inv.billing_months,
                        " BLN"
                      ] }),
                      /* @__PURE__ */ jsx("td", { className: "px-8 py-6", children: /* @__PURE__ */ jsx("p", { className: "text-[15px] font-display font-black text-white tracking-tight", children: formatIDR(inv.amount) }) }),
                      /* @__PURE__ */ jsx("td", { className: "px-8 py-6 text-center", children: /* @__PURE__ */ jsx(StatusBadge, { status: inv.status }) }),
                      /* @__PURE__ */ jsx("td", { className: "px-8 py-6 text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2", children: [
                        inv.status === "pending" && /* @__PURE__ */ jsx(
                          Button,
                          {
                            size: "sm",
                            onClick: () => handleOpenDetail(inv),
                            className: "h-9 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-all text-[10px] font-black uppercase tracking-widest px-4 shadow-[0_4px_15px_rgba(2, 26, 2,0.2)]",
                            children: "Konfirmasi"
                          }
                        ),
                        /* @__PURE__ */ jsx(
                          Button,
                          {
                            variant: "outline",
                            size: "sm",
                            onClick: () => handleOpenDetail(inv),
                            className: "h-9 w-9 p-0 rounded-xl border-white/10 text-[#4B6478] hover:bg-white/10 hover:text-white transition-all flex items-center justify-center group/btn",
                            children: /* @__PURE__ */ jsx(ChevronRight, { size: 16, className: "group-hover:translate-x-0.5 transition-transform" })
                          }
                        )
                      ] }) })
                    ]
                  },
                  inv.id
                );
              }),
              filteredInvoices.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 7, className: "px-8 py-32 text-center", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center space-y-6 max-w-sm mx-auto", children: [
                /* @__PURE__ */ jsxs("div", { className: "w-24 h-24 rounded-[32px] bg-white/[0.03] border border-white/5 flex items-center justify-center relative overflow-hidden group", children: [
                  /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-emerald-500/10 opacity-0 group-hover/btn:opacity-100 transition-opacity" }),
                  /* @__PURE__ */ jsx(History, { size: 40, className: "text-[#4B6478] group-hover:text-emerald-400 transition-all duration-500" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-[14px] font-black text-white uppercase tracking-[0.2em]", children: "Belum ada riwayat invoice" }),
                  /* @__PURE__ */ jsx("p", { className: "text-[11px] font-bold text-[#4B6478] uppercase tracking-[0.15em] leading-relaxed", children: "Data transaksi atau tagihan tenant akan muncul di sini setelah dibuat." })
                ] }),
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    variant: "outline",
                    onClick: () => setIsGenerateOpen(true),
                    className: "h-11 rounded-2xl border-white/10 text-white/50 hover:text-white hover:bg-white/5 hover:border-emerald-500/30 text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                    children: "Generate Pertama"
                  }
                )
              ] }) }) })
            ] })
          ] }) }),
          filteredInvoices.length > ITEMS_PER_PAGE && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-6 py-4 border-t border-white/5 bg-white/[0.01]", children: [
            /* @__PURE__ */ jsxs("p", { className: "text-[11px] font-bold text-[#4B6478]", children: [
              "Menampilkan",
              " ",
              /* @__PURE__ */ jsxs("span", { className: "text-white", children: [
                Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredInvoices.length),
                "–",
                Math.min(currentPage * ITEMS_PER_PAGE, filteredInvoices.length)
              ] }),
              " ",
              "dari ",
              /* @__PURE__ */ jsx("span", { className: "text-white", children: filteredInvoices.length }),
              " invoice"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setCurrentPage((p) => Math.max(1, p - 1)),
                  disabled: currentPage === 1,
                  className: "h-8 px-3 rounded-lg bg-[#111C24] border border-white/10 text-[#4B6478] text-sm font-bold disabled:opacity-30 hover:bg-white/5 transition-all",
                  children: "←"
                }
              ),
              (() => {
                const delta = 2;
                const range = [];
                const left = Math.max(1, currentPage - delta);
                const right = Math.min(totalPages, currentPage + delta);
                for (let i = left; i <= right; i++) range.push(i);
                if (left > 1) range.unshift("...");
                if (right < totalPages) range.push("...");
                if (left > 1) range.unshift(1);
                if (right < totalPages) range.push(totalPages);
                return range.map(
                  (p, idx) => p === "..." ? /* @__PURE__ */ jsx("span", { className: "px-1 text-[#4B6478] text-sm", children: "…" }, `dot-${idx}`) : /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => setCurrentPage(p),
                      className: `h-8 min-w-[32px] px-2 rounded-lg border text-sm font-bold transition-all ${currentPage === p ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "bg-[#111C24] border-white/10 text-[#4B6478] hover:bg-white/5"}`,
                      children: p
                    },
                    p
                  )
                );
              })(),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setCurrentPage((p) => Math.min(totalPages, p + 1)),
                  disabled: currentPage === totalPages,
                  className: "h-8 px-3 rounded-lg bg-[#111C24] border border-white/10 text-[#4B6478] text-sm font-bold disabled:opacity-30 hover:bg-white/5 transition-all",
                  children: "→"
                }
              )
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(TabsContent, { value: "settings", className: "space-y-6 animate-in slide-in-from-right-4 duration-300", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("h2", { className: "text-[11px] font-black text-[#4B6478] uppercase tracking-[0.3em] flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(CreditCard, { size: 14 }),
            " REKENING PEMBAYARAN"
          ] }),
          /* @__PURE__ */ jsxs(
            Button,
            {
              size: "sm",
              onClick: () => {
                setEditingBank(null);
                setIsBankModalOpen(true);
              },
              className: "bg-emerald-500 hover:bg-emerald-600 rounded-xl h-10 px-4 text-[11px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20",
              children: [
                /* @__PURE__ */ jsx(Plus, { size: 16, className: "mr-2" }),
                " Tambah Rekening"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: isLoadingBanks ? [1, 2, 3].map((i) => /* @__PURE__ */ jsx(BankSkeleton, {}, i)) : bankAccounts == null ? void 0 : bankAccounts.map((bank) => /* @__PURE__ */ jsx(
          BankCard,
          {
            bank,
            onEdit: () => {
              setEditingBank(bank);
              setIsBankModalOpen(true);
            },
            onDelete: () => handleDeleteBank(bank)
          },
          bank.id
        )) })
      ] }),
      /* @__PURE__ */ jsx(TabsContent, { value: "expiring", className: "space-y-6 animate-in fade-in duration-300", children: /* @__PURE__ */ jsx(
        ExpiringPlansTab,
        {
          allTenants,
          onRenew: (tenant) => {
            setGenForm((prev) => ({ ...prev, tenantId: tenant.id, plan: tenant.plan === "starter" ? "pro" : tenant.plan, billingMonths: 1, discountPct: 0, notes: "" }));
            setManualPrice(0);
            setIsGenerateOpen(true);
          }
        }
      ) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "payment", className: "animate-in fade-in duration-300", children: /* @__PURE__ */ jsx(PaymentGatewayTab, {}) })
    ] }),
    /* @__PURE__ */ jsx(Sheet, { open: isSheetOpen, onOpenChange: setIsSheetOpen, children: /* @__PURE__ */ jsx(SheetContent, { side: "right", className: "w-full sm:w-[460px] bg-[#0A0F14] border-l border-white/5 p-0 overflow-hidden flex flex-col", children: /* @__PURE__ */ jsx(AnimatePresence, { children: selectedInvoice && /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: { opacity: 0, x: 16 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 16 },
        className: "flex flex-col h-full",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "px-5 pt-5 pb-4 border-b border-white/5 shrink-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between mb-3", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-[#4B6478] uppercase tracking-widest mb-1", children: "Invoice Pembayaran" }),
                /* @__PURE__ */ jsxs(SheetTitle, { className: "font-display font-black text-white text-xl leading-none", children: [
                  "#",
                  selectedInvoice.invoice_number
                ] })
              ] }),
              /* @__PURE__ */ jsx(StatusBadge, { status: selectedInvoice.status })
            ] }),
            /* @__PURE__ */ jsxs(
              "div",
              {
                className: "flex items-center gap-2.5 py-2.5 px-3 rounded-xl",
                style: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" },
                children: [
                  /* @__PURE__ */ jsx(
                    "div",
                    {
                      className: "w-8 h-8 rounded-lg flex items-center justify-center text-[#4B6478]",
                      style: { background: "rgba(255,255,255,0.05)" },
                      children: getVerticalIcon((_g = selectedInvoice.tenants) == null ? void 0 : _g.business_vertical)
                    }
                  ),
                  /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                    /* @__PURE__ */ jsx("p", { className: "font-bold text-white text-sm truncate", children: toTitleCase((_h = selectedInvoice.tenants) == null ? void 0 : _h.business_name) || "—" }),
                    /* @__PURE__ */ jsx("p", { className: "text-[10px] text-[#4B6478]", children: ((_j = (_i = selectedInvoice.tenants) == null ? void 0 : _i.business_vertical) == null ? void 0 : _j.replace(/_/g, " ")) || "—" })
                  ] }),
                  /* @__PURE__ */ jsx(PlanBadge, { plan: selectedInvoice.plan })
                ]
              }
            ),
            /* @__PURE__ */ jsxs(SheetDescription, { className: "text-[11px] text-[#4B6478] mt-2 flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(CalendarDays, { size: 11 }),
              "Dibuat ",
              formatDate(selectedInvoice.created_at),
              selectedInvoice.billing_months > 1 && /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("span", { className: "opacity-30", children: "·" }),
                " ",
                selectedInvoice.billing_months,
                " bulan"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(
            "div",
            {
              className: "mx-5 mt-4 mb-1 rounded-2xl p-4 flex items-center justify-between",
              style: { background: "rgba(2, 26, 2,0.07)", border: "1px solid rgba(2, 26, 2,0.2)" },
              children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest mb-0.5", children: "Total Tagihan" }),
                  /* @__PURE__ */ jsx("p", { className: "font-display font-black text-white text-3xl leading-none", children: formatIDR(selectedInvoice.amount) })
                ] }),
                selectedInvoice.payment_method && /* @__PURE__ */ jsx(
                  "span",
                  {
                    className: "text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider",
                    style: { background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.2)", color: "#60A5FA" },
                    children: selectedInvoice.payment_method === "manual" ? "Transfer" : selectedInvoice.payment_method
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto px-5 py-4 space-y-5", children: [
            /* @__PURE__ */ jsxs("section", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-[#4B6478] uppercase tracking-widest mb-2", children: "Bukti Transfer" }),
              /* @__PURE__ */ jsx(
                "div",
                {
                  className: "rounded-2xl overflow-hidden",
                  style: { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", minHeight: "160px" },
                  children: selectedInvoice.payment_proof_url ? /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                    /* @__PURE__ */ jsx(
                      "img",
                      {
                        src: selectedInvoice.payment_proof_url,
                        alt: "Bukti Pembayaran",
                        className: "w-full object-cover max-h-48"
                      }
                    ),
                    /* @__PURE__ */ jsxs("div", { className: "flex gap-2 p-3", style: { background: "rgba(10,15,20,0.8)", backdropFilter: "blur(8px)" }, children: [
                      /* @__PURE__ */ jsxs(
                        Button,
                        {
                          size: "sm",
                          variant: "secondary",
                          onClick: () => window.open(selectedInvoice.payment_proof_url, "_blank"),
                          className: "flex-1 h-9 rounded-xl bg-white/10 hover:bg-emerald-500/20 text-white border-white/10 text-[11px] font-bold",
                          children: [
                            /* @__PURE__ */ jsx(Globe, { size: 12, className: "mr-1.5" }),
                            " Lihat Penuh"
                          ]
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        Button,
                        {
                          size: "sm",
                          variant: "outline",
                          onClick: () => {
                            const a = document.createElement("a");
                            a.href = selectedInvoice.payment_proof_url;
                            a.download = `bukti-${selectedInvoice.invoice_number}`;
                            a.click();
                          },
                          className: "h-9 rounded-xl border-white/10 bg-white/5 text-[#4B6478] hover:text-white text-[11px] font-bold px-3",
                          children: /* @__PURE__ */ jsx(Download, { size: 12 })
                        }
                      )
                    ] })
                  ] }) : /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-8 opacity-40", children: [
                    /* @__PURE__ */ jsx(AlertCircle, { size: 24, className: "text-[#4B6478] mb-2" }),
                    /* @__PURE__ */ jsx("p", { className: "text-[11px] text-[#4B6478] font-bold", children: "Belum ada bukti transfer" })
                  ] })
                }
              )
            ] }),
            selectedInvoice.notes && /* @__PURE__ */ jsxs("section", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-[#4B6478] uppercase tracking-widest mb-2", children: "Catatan" }),
              /* @__PURE__ */ jsx(
                "div",
                {
                  className: "rounded-xl px-4 py-3 text-[13px] text-[#94A3B8]",
                  style: { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" },
                  children: selectedInvoice.notes
                }
              )
            ] }),
            selectedInvoice.confirmed_at && /* @__PURE__ */ jsxs("section", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-[#4B6478] uppercase tracking-widest mb-2", children: "Riwayat Konfirmasi" }),
              /* @__PURE__ */ jsxs(
                "div",
                {
                  className: "flex items-center gap-3 p-3 rounded-xl",
                  style: { background: "rgba(2, 26, 2,0.06)", border: "1px solid rgba(2, 26, 2,0.15)" },
                  children: [
                    /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0", children: /* @__PURE__ */ jsx(Check, { size: 14, strokeWidth: 3 }) }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "text-[13px] font-bold text-white", children: "Pembayaran Dikonfirmasi" }),
                      /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-emerald-500/70", children: [
                        formatDate(selectedInvoice.confirmed_at),
                        " pukul ",
                        format(new Date(selectedInvoice.confirmed_at), "HH:mm")
                      ] })
                    ] })
                  ]
                }
              )
            ] }),
            selectedInvoice.status === "paid" && selectedInvoice.paid_at && /* @__PURE__ */ jsxs("section", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-[#4B6478] uppercase tracking-widest mb-2", children: "Tanggal Bayar" }),
              /* @__PURE__ */ jsx("p", { className: "text-[13px] text-white px-1", children: formatDate(selectedInvoice.paid_at) })
            ] })
          ] }),
          selectedInvoice.status === "pending" && (() => {
            const isMidtrans = selectedInvoice.payment_provider === "midtrans";
            return /* @__PURE__ */ jsxs("div", { className: "px-5 py-4 border-t border-white/5 bg-[#0A0F14] shrink-0 space-y-3", children: [
              isMidtrans ? /* @__PURE__ */ jsxs(
                "div",
                {
                  className: "flex items-center gap-3 p-3 rounded-xl",
                  style: { background: "rgba(2, 26, 2,0.06)", border: "1px solid rgba(2, 26, 2,0.2)" },
                  children: [
                    /* @__PURE__ */ jsx(CreditCard, { size: 16, className: "text-emerald-400 shrink-0" }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "text-[12px] font-bold text-emerald-300", children: "Midtrans Gateway" }),
                      /* @__PURE__ */ jsx("p", { className: "text-[11px] text-emerald-400/60", children: "Konfirmasi otomatis via webhook saat pembayaran berhasil." })
                    ] })
                  ]
                }
              ) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-[#4B6478] uppercase tracking-widest block mb-1.5", children: "Catatan Konfirmasi" }),
                  /* @__PURE__ */ jsx(
                    Textarea,
                    {
                      placeholder: "Contoh: Transfer BCA sudah masuk Rp 299.000...",
                      value: confirmNotes,
                      onChange: (e) => setConfirmNotes(e.target.value),
                      rows: 2,
                      className: "bg-white/[0.03] border-white/10 rounded-xl text-sm text-white placeholder:text-[#2A3F52] focus:border-emerald-500/50 resize-none"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    className: "w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[13px] gap-2",
                    onClick: handleConfirm,
                    disabled: confirmInvoice.isPending,
                    children: confirmInvoice.isPending ? /* @__PURE__ */ jsxs(Fragment, { children: [
                      /* @__PURE__ */ jsx(Loader2, { size: 15, className: "animate-spin" }),
                      " Memproses..."
                    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                      /* @__PURE__ */ jsx(Check, { size: 15, strokeWidth: 3 }),
                      " Konfirmasi Pembayaran"
                    ] })
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    variant: "outline",
                    className: "h-9 rounded-xl border-white/8 bg-white/[0.03] text-[#4B6478] hover:text-red-400 hover:bg-red-500/8 hover:border-red-500/20 text-[12px] font-bold",
                    onClick: () => setCancelDialog(true),
                    children: "Batalkan Invoice"
                  }
                ),
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    variant: "ghost",
                    className: "h-9 rounded-xl text-red-500/30 hover:text-red-500 hover:bg-red-500/5 text-[12px] font-bold",
                    onClick: () => setDeleteInvoiceDialog(true),
                    disabled: deleteInvoice.isPending,
                    children: "Hapus Data"
                  }
                )
              ] })
            ] });
          })()
        ]
      }
    ) }) }) }),
    /* @__PURE__ */ jsx(AlertDialog, { open: cancelDialog, onOpenChange: setCancelDialog, children: /* @__PURE__ */ jsxs(AlertDialogContent, { className: "bg-[#0C1319] border border-white/10 text-white", children: [
      /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsx(AlertDialogTitle, { className: "text-white", children: "Batalkan Invoice?" }),
        /* @__PURE__ */ jsxs(AlertDialogDescription, { className: "text-[#4B6478]", children: [
          "Invoice #",
          selectedInvoice == null ? void 0 : selectedInvoice.invoice_number,
          " akan diubah statusnya menjadi ",
          /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "cancelled" }),
          ". Tenant tidak akan mendapatkan akses plan."
        ] })
      ] }),
      /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsx(AlertDialogCancel, { className: "bg-white/5 border-white/10 text-white hover:bg-white/10", children: "Batal" }),
        /* @__PURE__ */ jsx(
          AlertDialogAction,
          {
            onClick: executeCancelInvoice,
            className: "bg-red-600 hover:bg-red-700 text-white font-bold",
            children: "Ya, Batalkan"
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(AlertDialog, { open: deleteInvoiceDialog, onOpenChange: setDeleteInvoiceDialog, children: /* @__PURE__ */ jsxs(AlertDialogContent, { className: "bg-[#0C1319] border border-white/10 text-white", children: [
      /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsx(AlertDialogTitle, { className: "text-red-500", children: "Hapus Permanen Invoice?" }),
        /* @__PURE__ */ jsxs(AlertDialogDescription, { className: "text-[#4B6478]", children: [
          "Invoice ",
          /* @__PURE__ */ jsxs("span", { className: "text-white font-bold", children: [
            "#",
            selectedInvoice == null ? void 0 : selectedInvoice.invoice_number
          ] }),
          " akan dihapus selamanya dan tidak bisa dikembalikan."
        ] })
      ] }),
      /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsx(AlertDialogCancel, { className: "bg-white/5 border-white/10 text-white hover:bg-white/10", children: "Batal" }),
        /* @__PURE__ */ jsx(
          AlertDialogAction,
          {
            onClick: executeDeleteInvoice,
            className: "bg-red-600 hover:bg-red-700 text-white font-bold",
            children: "Hapus Selamanya"
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(AlertDialog, { open: !!deleteBankTarget, onOpenChange: (v) => {
      if (!v) setDeleteBankTarget(null);
    }, children: /* @__PURE__ */ jsxs(AlertDialogContent, { className: "bg-[#0C1319] border border-white/10 text-white", children: [
      /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsx(AlertDialogTitle, { className: "text-white", children: "Hapus Rekening?" }),
        /* @__PURE__ */ jsxs(AlertDialogDescription, { className: "text-[#4B6478]", children: [
          "Rekening ",
          /* @__PURE__ */ jsxs("span", { className: "text-white font-bold", children: [
            deleteBankTarget == null ? void 0 : deleteBankTarget.bank_name,
            " - ",
            deleteBankTarget == null ? void 0 : deleteBankTarget.account_number
          ] }),
          " akan dihapus permanen."
        ] })
      ] }),
      /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsx(AlertDialogCancel, { className: "bg-white/5 border-white/10 text-white hover:bg-white/10", children: "Batal" }),
        /* @__PURE__ */ jsx(
          AlertDialogAction,
          {
            onClick: () => {
              deleteBank.mutate(deleteBankTarget.id);
              setDeleteBankTarget(null);
            },
            className: "bg-red-600 hover:bg-red-700 text-white font-bold",
            children: "Ya, Hapus"
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Sheet, { open: isGenerateOpen, onOpenChange: setIsGenerateOpen, children: /* @__PURE__ */ jsxs(SheetContent, { side: "right", className: "w-full sm:w-[500px] bg-[#0A0F14]/95 backdrop-blur-2xl border-l border-white/5 p-0 overflow-hidden flex flex-col shadow-2xl", children: [
      /* @__PURE__ */ jsxs("div", { className: "p-8 pb-6 border-b border-white/5 bg-white/[0.01] relative z-10", children: [
        /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-2", children: "Admin Action" }),
        /* @__PURE__ */ jsx(SheetTitle, { className: "text-3xl font-display font-black text-white tracking-tight leading-none mb-2", children: "Generate Invoice" }),
        /* @__PURE__ */ jsx(SheetDescription, { className: "text-[11px] font-bold text-[#4B6478] uppercase tracking-[0.2em]", children: "Buat invoice baru untuk tenant secara manual" })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleGenerateInvoice, className: "flex-1 overflow-y-auto relative z-10", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-8 space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "genTenantId", className: "text-[10px] font-black text-[#4B6478] uppercase tracking-[0.3em] ml-1", children: "Tenant *" }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsxs(
                "select",
                {
                  id: "genTenantId",
                  name: "genTenantId",
                  value: genForm.tenantId,
                  onChange: (e) => {
                    setGenForm((f) => ({ ...f, tenantId: e.target.value }));
                    setManualPrice(0);
                  },
                  className: `w-full h-12 bg-white/[0.02] border rounded-2xl px-4 text-sm font-medium text-white focus:border-emerald-500 focus:bg-white/[0.05] transition-all appearance-none ${genHasPending ? "border-amber-500/50 ring-1 ring-amber-500/20 shadow-amber-500/10 shadow-lg" : "border-white/10 hover:border-white/20"}`,
                  required: true,
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "", className: "bg-[#0C1319]", children: "— Pilih Tenant —" }),
                    allTenants == null ? void 0 : allTenants.map((t) => /* @__PURE__ */ jsxs("option", { value: t.id, className: "bg-[#0A0F14]", children: [
                      toTitleCase(t.business_name),
                      " (",
                      toTitleCase(t.business_vertical),
                      ")"
                    ] }, t.id))
                  ]
                }
              ),
              /* @__PURE__ */ jsx("div", { className: "absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#4B6478]", children: /* @__PURE__ */ jsx(ChevronRight, { size: 16, className: "rotate-90" }) })
            ] })
          ] }),
          genHasPending && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(AlertTriangle, { size: 18, className: "text-amber-400 shrink-0 mt-0.5" }),
            /* @__PURE__ */ jsx("p", { className: "text-[11px] font-black text-amber-300 leading-relaxed uppercase tracking-wider", children: "Tenant ini sudah punya invoice pending. Konfirmasi atau batalkan dulu sebelum generate baru." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black text-[#4B6478] uppercase tracking-[0.3em] ml-1", children: "Plan *" }),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-3", children: ["pro", "business"].map((p) => /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setGenForm((f) => ({ ...f, plan: p })),
                className: `h-14 rounded-2xl font-black uppercase text-[12px] tracking-widest border transition-all shadow-xl group ${genForm.plan === p ? p === "pro" ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-emerald-500/10 hover:bg-emerald-500/20" : "bg-amber-500/10 border-amber-500/50 text-amber-400 shadow-amber-500/10 hover:bg-amber-500/20" : "bg-white/[0.02] border-white/5 text-[#4B6478] hover:bg-white/[0.05] hover:text-white hover:border-white/20"}`,
                children: p === "pro" ? "⭐ PRO" : "👑 BUSINESS"
              },
              p
            )) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black text-[#4B6478] uppercase tracking-[0.3em] ml-1", children: "Durasi *" }),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-4 gap-2", children: [1, 3, 6, 12].map((m) => /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setGenForm((f) => ({ ...f, billingMonths: m })),
                className: `h-14 rounded-2xl border transition-all flex flex-col items-center justify-center gap-0.5 ${genForm.billingMonths === m ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-xl shadow-emerald-500/10" : "bg-white/[0.02] border-white/5 text-[#4B6478] hover:bg-white/[0.05] hover:text-white hover:border-white/20"}`,
                children: [
                  /* @__PURE__ */ jsx("span", { className: "font-display font-black text-[16px] leading-none", children: m }),
                  /* @__PURE__ */ jsx("span", { className: "text-[8px] uppercase tracking-[0.2em] font-bold opacity-70", children: "BLN" })
                ]
              },
              m
            )) })
          ] }),
          !isPriceFromConfig && genForm.tenantId && /* @__PURE__ */ jsxs("div", { className: "space-y-2 overflow-hidden rounded-2xl bg-amber-500/5 border border-amber-500/20 p-4", children: [
            /* @__PURE__ */ jsxs("label", { htmlFor: "manualPriceInput", className: "text-[10px] font-black text-amber-400 uppercase tracking-widest ml-1 flex items-center gap-1.5 mb-3", children: [
              /* @__PURE__ */ jsx(AlertTriangle, { size: 12 }),
              " HARGA DEFAULT TIDAK DITEMUKAN"
            ] }),
            /* @__PURE__ */ jsx(
              InputRupiah,
              {
                id: "manualPriceInput",
                name: "manualPriceInput",
                value: manualPrice,
                onChange: setManualPrice,
                placeholder: "Input Harga per bulan (Rp)",
                className: "bg-black/40 border-amber-500/30 h-12 rounded-xl focus:border-amber-500/60 font-display text-lg"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-4 shadow-inner", children: [
            /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black text-[#4B6478] uppercase tracking-[0.3em]", children: "Kalkulasi Total" }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-end pb-3 border-b border-white/5", children: [
              /* @__PURE__ */ jsxs("span", { className: "text-white/50 text-[11px] font-bold uppercase tracking-wider", children: [
                genForm.billingMonths,
                " BLN × ",
                formatIDR(effectiveMonthly)
              ] }),
              /* @__PURE__ */ jsx("span", { className: "font-display font-black text-white text-[14px]", children: formatIDR(genSubtotal) })
            ] }),
            genDiscount > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-end pb-3 border-b border-white/5", children: [
              /* @__PURE__ */ jsxs("span", { className: "text-red-400/70 text-[11px] font-bold uppercase tracking-wider", children: [
                "Diskon ",
                genForm.discountPct,
                "%"
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "font-display font-black text-red-500 text-[14px]", children: [
                "-",
                formatIDR(genDiscount)
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center pt-2", children: [
              /* @__PURE__ */ jsx("span", { className: "text-[12px] font-black text-[#4B6478] uppercase tracking-[0.3em]", children: "Final" }),
              /* @__PURE__ */ jsx("span", { className: "text-[24px] font-display font-black text-emerald-400 tracking-tight", children: formatIDR(genFinal) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "genDiscount", className: "text-[10px] font-black text-[#4B6478] uppercase tracking-[0.3em] ml-1", children: "Diskon %" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "genDiscount",
                name: "genDiscount",
                type: "number",
                min: 0,
                max: 100,
                value: genForm.discountPct,
                onChange: (e) => setGenForm((f) => ({ ...f, discountPct: Number(e.target.value) })),
                className: "bg-white/[0.02] border-white/10 h-12 rounded-2xl text-sm font-bold focus:border-emerald-500/50 hover:bg-white/[0.04]"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "genNotes", className: "text-[10px] font-black text-[#4B6478] uppercase tracking-[0.3em] ml-1", children: "Keterangan Internal" }),
            /* @__PURE__ */ jsx(
              Textarea,
              {
                id: "genNotes",
                name: "genNotes",
                placeholder: "Catatan tambahan (opsional)...",
                value: genForm.notes,
                onChange: (e) => setGenForm((f) => ({ ...f, notes: e.target.value })),
                rows: 3,
                className: "bg-white/[0.02] border-white/10 rounded-2xl text-sm font-medium focus:border-emerald-500/50 hover:bg-white/[0.04] resize-none"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-8 pt-0 flex gap-4 sticky bottom-0 bg-gradient-to-t from-[#0A0F14] via-[#0A0F14]/90 to-transparent", children: [
          /* @__PURE__ */ jsx(
            Button,
            {
              type: "button",
              variant: "outline",
              onClick: () => setIsGenerateOpen(false),
              className: "flex-1 h-14 rounded-2xl border-white/10 text-[#4B6478] hover:bg-white/5 hover:text-white font-black uppercase text-[11px] tracking-[0.2em] transition-all",
              children: "Batal"
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              type: "submit",
              disabled: createInvoice.isPending || !genForm.tenantId || genFinal <= 0 || genHasPending,
              className: "flex-1 h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[11px] tracking-[0.2em] shadow-[0_4px_20px_rgba(2, 26, 2,0.3)] disabled:opacity-50 transition-all active:scale-95",
              children: createInvoice.isPending ? "Proses..." : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(FileText, { size: 16, className: "mr-2" }),
                " Generate"
              ] })
            }
          )
        ] })
      ] })
    ] }) }),
    isBankModalOpen && /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-[100] flex items-center justify-center p-4", children: [
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "absolute inset-0 bg-black/60 backdrop-blur-sm",
          onClick: () => setIsBankModalOpen(false)
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "relative z-10 bg-[#111C24] border border-white/10 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" }),
        /* @__PURE__ */ jsxs("form", { onSubmit: handleSaveBank, className: "relative z-10", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-8 pb-6 border-b border-white/5", children: [
            /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-2", children: "REKENING TENANT" }),
            /* @__PURE__ */ jsx("h2", { className: "text-2xl font-display font-black text-white uppercase tracking-tight leading-none mb-1", children: editingBank ? "Edit Bank" : "Tambah Bank" }),
            /* @__PURE__ */ jsx("p", { className: "text-[11px] font-bold text-[#4B6478] uppercase tracking-[0.2em] mt-2", children: "Pengaturan mutasi bank TernakOS" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-8 space-y-5", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "bank_name", className: "text-[10px] font-black text-[#4B6478] uppercase tracking-[0.3em] ml-1", children: "Provider Bank" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  id: "bank_name",
                  name: "bank_name",
                  defaultValue: editingBank == null ? void 0 : editingBank.bank_name,
                  placeholder: "BCA / Mandiri / CIMB...",
                  className: "bg-white/[0.02] border-white/10 hover:border-white/20 h-14 rounded-2xl text-sm font-bold focus:border-emerald-500 transition-all font-display tracking-wide",
                  required: true
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "account_number", className: "text-[10px] font-black text-[#4B6478] uppercase tracking-[0.3em] ml-1", children: "No. Rekening" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  id: "account_number",
                  name: "account_number",
                  defaultValue: editingBank == null ? void 0 : editingBank.account_number,
                  placeholder: "000123456789",
                  className: "bg-white/[0.02] border-white/10 hover:border-white/20 h-14 rounded-2xl text-sm font-black text-emerald-400 focus:border-emerald-500 transition-all font-mono tracking-widest",
                  required: true
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "account_name", className: "text-[10px] font-black text-[#4B6478] uppercase tracking-[0.3em] ml-1", children: "Atas Nama" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  id: "account_name",
                  name: "account_name",
                  defaultValue: editingBank == null ? void 0 : editingBank.account_name,
                  placeholder: "PT TERNAKOS TEKNOLOGI",
                  className: "bg-white/[0.02] border-white/10 hover:border-white/20 h-14 rounded-2xl text-sm font-black focus:border-emerald-500 transition-all uppercase tracking-wider",
                  required: true
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-8 pt-0 flex gap-4", children: [
            /* @__PURE__ */ jsx(
              Button,
              {
                type: "button",
                variant: "outline",
                onClick: () => setIsBankModalOpen(false),
                className: "flex-1 h-14 rounded-2xl border-white/10 hover:border-white/20 hover:bg-white/5 text-[#4B6478] hover:text-white font-black uppercase text-[11px] tracking-[0.2em] transition-all",
                children: "Batal"
              }
            ),
            /* @__PURE__ */ jsx(
              Button,
              {
                type: "submit",
                className: "flex-1 h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[11px] tracking-[0.2em] shadow-[0_4px_20px_rgba(2, 26, 2,0.3)] transition-all active:scale-95",
                children: editingBank ? "Simpan" : "+ Tambah"
              }
            )
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "md:hidden fixed bottom-20 right-4 z-40 animate-in translate-y-4 duration-500 pb-[env(safe-area-inset-bottom)]", children: /* @__PURE__ */ jsx(
      Button,
      {
        onClick: () => setIsGenerateOpen(true),
        className: "w-14 h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_10px_30px_rgba(2, 26, 2,0.4)] border border-emerald-400/20 active:scale-90 transition-transform flex items-center justify-center p-0",
        children: /* @__PURE__ */ jsx(Plus, { size: 28 })
      }
    ) })
  ] });
}
function ExpiringPlansTab({ allTenants, onRenew }) {
  const [search, setSearch] = useState("");
  const allExpiring = useMemo(() => {
    if (!allTenants) return [];
    return allTenants.map((t) => ({ ...t, _sub: getSubscriptionStatus(t) })).filter((t) => (t._sub.status === "active" || t._sub.status === "trial") && t._sub.daysLeft <= 30).sort((a, b) => a._sub.daysLeft - b._sub.daysLeft);
  }, [allTenants]);
  const expiring = useMemo(() => {
    if (!search) return allExpiring;
    return allExpiring.filter((t) => {
      var _a;
      return (_a = t.business_name) == null ? void 0 : _a.toLowerCase().includes(search.toLowerCase());
    });
  }, [allExpiring, search]);
  const alreadyExpiredCount = useMemo(() => {
    if (!allTenants) return 0;
    return allTenants.filter((t) => getSubscriptionStatus(t).status === "expired").length;
  }, [allTenants]);
  return /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("p", { className: "text-[11px] font-black text-[#4B6478] uppercase tracking-[0.3em] flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(AlertTriangle, { size: 14, className: "text-amber-400" }),
          " PLAN AKAN BERAKHIR (≤ 30 HARI)"
        ] }),
        alreadyExpiredCount > 0 && /* @__PURE__ */ jsxs("p", { className: "text-[10px] font-bold text-red-400/70 mt-1", children: [
          "+ ",
          alreadyExpiredCount,
          " tenant sudah expired"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "relative w-full sm:w-64", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4B6478]", size: 14 }),
        /* @__PURE__ */ jsx(
          Input,
          {
            placeholder: "Cari bisnis...",
            value: search,
            onChange: (e) => setSearch(e.target.value),
            className: "bg-black/20 border-white/10 h-10 rounded-xl pl-10 text-sm focus:border-amber-500/50 transition-all font-medium"
          }
        )
      ] })
    ] }),
    expiring.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-24 space-y-4", children: [
      /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center", children: /* @__PURE__ */ jsx(CheckCircle2, { size: 28, className: "text-emerald-400" }) }),
      search ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("p", { className: "text-[13px] font-black text-white uppercase tracking-widest", children: "Tidak ditemukan" }),
        /* @__PURE__ */ jsxs("p", { className: "text-[10px] font-bold text-[#4B6478] uppercase tracking-widest", children: [
          'Tidak ada tenant yang cocok dengan pencarian "',
          search,
          '".'
        ] })
      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("p", { className: "text-[13px] font-black text-white uppercase tracking-widest", children: "Semua plan aman" }),
        /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-[#4B6478] uppercase tracking-widest", children: "Tidak ada tenant dengan plan yang akan berakhir dalam 30 hari ke depan." })
      ] })
    ] }) : /* @__PURE__ */ jsxs("div", { className: "bg-white/[0.02] backdrop-blur-xl rounded-[32px] border border-white/8 overflow-hidden shadow-2xl relative group", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" }),
      /* @__PURE__ */ jsx("div", { className: "overflow-x-auto relative z-10", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-white/5 bg-white/[0.02]", children: [
          /* @__PURE__ */ jsx("th", { className: "px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-[#4B6478] font-display font-black", children: "Bisnis" }),
          /* @__PURE__ */ jsx("th", { className: "px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-[#4B6478] font-display font-black text-center", children: "Plan" }),
          /* @__PURE__ */ jsx("th", { className: "px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-[#4B6478] font-display font-black text-center", children: "Berakhir" }),
          /* @__PURE__ */ jsx("th", { className: "px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-[#4B6478] font-display font-black text-center", children: "Sisa" }),
          /* @__PURE__ */ jsx("th", { className: "px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-[#4B6478] font-display font-black text-right", children: "Aksi" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-white/5", children: expiring.map((tenant, _i) => {
          const sub = tenant._sub;
          const isUrgent = sub.daysLeft <= 7;
          const expiryStr = sub.expiresAt ? format(sub.expiresAt, "d MMM yyyy", { locale: id }) : "—";
          return /* @__PURE__ */ jsxs(
            "tr",
            {
              className: "hover:bg-white/[0.04] transition-all group",
              children: [
                /* @__PURE__ */ jsx("td", { className: "px-8 py-5", children: /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-[13px] font-black text-white group-hover:text-amber-400 transition-colors uppercase tracking-tight truncate max-w-[200px]", children: toTitleCase(tenant.business_name) }),
                  /* @__PURE__ */ jsx("div", { className: "flex", children: /* @__PURE__ */ jsx(Badge, { className: "text-[8px] font-black tracking-[0.1em] h-4 px-1.5 border-white/10 bg-white/5 text-[#4B6478] uppercase", children: toTitleCase(tenant.business_vertical) }) })
                ] }) }),
                /* @__PURE__ */ jsx("td", { className: "px-8 py-5 text-center", children: /* @__PURE__ */ jsx(PlanBadge, { plan: sub.plan }) }),
                /* @__PURE__ */ jsx("td", { className: "px-8 py-5 text-center", children: /* @__PURE__ */ jsx("p", { className: "text-[12px] font-bold text-white/70", children: expiryStr }) }),
                /* @__PURE__ */ jsx("td", { className: "px-8 py-5 text-center", children: /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider shadow-inner ${isUrgent ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`, children: [
                  isUrgent && /* @__PURE__ */ jsx(AlertTriangle, { size: 12, className: "animate-pulse" }),
                  sub.daysLeft,
                  "h lagi"
                ] }) }),
                /* @__PURE__ */ jsx("td", { className: "px-8 py-5 text-right", children: /* @__PURE__ */ jsx(
                  Button,
                  {
                    size: "sm",
                    onClick: () => onRenew(tenant),
                    className: `h-9 rounded-xl text-[10px] font-black uppercase tracking-widest px-4 transition-all active:scale-95 shadow-xl ${isUrgent ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20" : "bg-amber-500 hover:bg-amber-600 text-black shadow-amber-500/20"}`,
                    children: "Buat Renewal"
                  }
                ) })
              ]
            },
            tenant.id
          );
        }) })
      ] }) })
    ] })
  ] });
}
function StatCard({ label, value, icon: Icon, color, isUrgent }) {
  const themes = {
    amber: {
      bg: "bg-amber-500/5",
      border: "border-amber-500/20",
      iconBg: "bg-amber-500/10",
      text: "text-amber-400",
      glow: "from-amber-400/20 to-transparent",
      shadow: "shadow-amber-500/5"
    },
    emerald: {
      bg: "bg-emerald-500/5",
      border: "border-emerald-500/20",
      iconBg: "bg-emerald-500/10",
      text: "text-emerald-400",
      glow: "from-emerald-400/20 to-transparent",
      shadow: "shadow-emerald-500/5"
    },
    blue: {
      bg: "bg-blue-500/5",
      border: "border-blue-500/20",
      iconBg: "bg-blue-500/10",
      text: "text-blue-400",
      glow: "from-blue-400/20 to-transparent",
      shadow: "shadow-blue-500/5"
    },
    red: {
      bg: "bg-red-500/5",
      border: "border-red-500/20",
      iconBg: "bg-red-500/10",
      text: "text-red-400",
      glow: "from-red-400/20 to-transparent",
      shadow: "shadow-red-500/5"
    }
  };
  const theme = themes[color] || themes.emerald;
  return /* @__PURE__ */ jsxs("div", { className: cn(
    "relative overflow-hidden rounded-[32px] border p-6 lg:p-7 group cursor-default transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl active:scale-[0.98]",
    theme.bg,
    theme.border,
    theme.shadow,
    isUrgent && "ring-1 ring-amber-500/40 animate-pulse-slow"
  ), children: [
    /* @__PURE__ */ jsx("div", { className: cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-700", theme.glow) }),
    /* @__PURE__ */ jsx("div", { className: cn("absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-1000 group-hover:scale-110", theme.text), children: /* @__PURE__ */ jsx(Icon, { size: 160, strokeWidth: 1 }) }),
    /* @__PURE__ */ jsxs("div", { className: "relative z-10 flex items-center gap-6", children: [
      /* @__PURE__ */ jsx("div", { className: cn("w-16 h-16 rounded-[24px] flex items-center justify-center shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6", theme.iconBg, theme.border), children: /* @__PURE__ */ jsx(Icon, { size: 28, className: theme.text, strokeWidth: 2.5 }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black uppercase tracking-[0.3em] text-[#4B6478] drop-shadow-sm", children: label }),
        /* @__PURE__ */ jsx("div", { className: "flex items-baseline gap-2", children: /* @__PURE__ */ jsx("p", { className: cn("text-3xl font-display font-black tracking-tight leading-none truncate max-w-[180px]", theme.text), children: value }) })
      ] })
    ] })
  ] });
}
function PlanBadge({ plan }) {
  const styles = {
    starter: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    pro: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(2, 26, 2,0.1)]",
    business: "bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
  };
  return /* @__PURE__ */ jsx(Badge, { className: cn("px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] border rounded-lg", styles[plan] || styles.starter), children: plan === "pro" ? "⭐ PRO" : plan === "business" ? "👑 BUSINESS" : plan });
}
function StatusBadge({ status }) {
  const styles = {
    pending: "bg-amber-500/15 text-amber-500 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)] animate-pulse-slow",
    paid: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30 shadow-[0_0_20px_rgba(2, 26, 2,0.15)]",
    expired: "bg-red-500/15 text-red-500 border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.15)]",
    cancelled: "bg-white/5 text-[#4B6478] border-white/10"
  };
  return /* @__PURE__ */ jsxs(Badge, { className: `px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${styles[status]}`, children: [
    status === "pending" && /* @__PURE__ */ jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" }),
    status
  ] });
}
function BankCard({ bank, onEdit, onDelete }) {
  const queryClient = useQueryClient();
  const [isToggling, setIsToggling] = useState(false);
  const handleToggleActive = async () => {
    setIsToggling(true);
    const { error } = await supabase.from("payment_settings").update({ is_active: !bank.is_active }).eq("id", bank.id);
    setIsToggling(false);
    if (error) {
      logSupabaseError(error, { table: "payment_settings", operation: "update", component: "BankCard", actionName: "admin.payment_setting.toggle_active" });
      toast.error("Gagal mengubah status rekening");
    } else {
      queryClient.invalidateQueries(["payment-settings"]);
      toast.success(bank.is_active ? "Rekening dinonaktifkan" : "Rekening diaktifkan");
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "relative overflow-hidden rounded-[24px] border border-white/8 bg-[#111C24] p-6 lg:p-7 hover:border-white/15 group cursor-default transition-all duration-500 hover:-translate-y-0.5 shadow-lg", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute -right-4 -bottom-4 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity -rotate-12 duration-700", children: /* @__PURE__ */ jsx(CreditCard, { size: 120 }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-10", children: [
      /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500 shadow-xl", children: "🏦" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 bg-black/40 px-3 py-1.5 rounded-full border border-white/5 shadow-inner", children: [
        /* @__PURE__ */ jsx("span", { className: `text-[9px] font-black uppercase tracking-[0.2em] ${bank.is_active ? "text-emerald-400" : "text-[#4B6478]"}`, children: bank.is_active ? "ACTIVE" : "INACTIVE" }),
        /* @__PURE__ */ jsx(
          Switch,
          {
            checked: bank.is_active,
            onCheckedChange: handleToggleActive,
            disabled: isToggling,
            className: "data-[state=checked]:bg-emerald-500 scale-75"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6 relative z-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black text-[#4B6478] uppercase tracking-[0.3em]", children: "Bank Provider" }),
        /* @__PURE__ */ jsx("p", { className: "text-2xl font-display font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight", children: bank.bank_name })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black text-[#4B6478] uppercase tracking-[0.3em]", children: "Account Details" }),
        /* @__PURE__ */ jsx("div", { className: "p-3 bg-black/40 border border-white/5 rounded-xl font-mono text-sm font-bold text-emerald-400/80 tracking-widest shadow-inner", children: bank.account_number })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "pt-6 border-t border-white/5 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-[9px] font-black text-[#4B6478] uppercase tracking-[0.3em] mb-1", children: "Holder" }),
          /* @__PURE__ */ jsx("p", { className: "text-[12px] font-black text-white uppercase truncate max-w-[130px] leading-tight font-display tracking-tight", children: bank.account_name })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2.5", children: [
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "outline",
              size: "sm",
              onClick: onEdit,
              className: "h-10 w-10 p-0 rounded-2xl bg-white/5 hover:bg-emerald-500 hover:text-white transition-all border border-white/10 hover:border-emerald-500 shadow-xl",
              children: /* @__PURE__ */ jsx(Edit2, { size: 14 })
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "outline",
              size: "sm",
              onClick: onDelete,
              className: "h-10 w-10 p-0 rounded-2xl bg-white/5 hover:bg-red-500 hover:text-white transition-all border border-white/10 hover:border-red-500 shadow-xl",
              children: /* @__PURE__ */ jsx(Trash2, { size: 14 })
            }
          )
        ] })
      ] })
    ] })
  ] });
}
function PaymentGatewayTab() {
  return /* @__PURE__ */ jsx("div", { className: "max-w-xl", children: /* @__PURE__ */ jsxs("div", { className: "bg-[#111C24] rounded-2xl border border-white/8 overflow-hidden", children: [
    /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-white/5 flex items-center gap-4", children: [
      /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(CreditCard, { size: 22, className: "text-emerald-400" }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black text-[#4B6478] uppercase tracking-widest mb-0.5", children: "PAYMENT GATEWAY" }),
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-display font-black text-white uppercase tracking-tight leading-none", children: "Konfigurasi Payment Gateway" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20", children: [
        /* @__PURE__ */ jsx(AlertCircle, { size: 18, className: "text-amber-400 shrink-0" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-[12px] font-black text-amber-300 mb-0.5", children: "Midtrans belum diaktifkan" }),
          /* @__PURE__ */ jsx("p", { className: "text-[11px] text-amber-400/70 leading-relaxed", children: "Integrasi Midtrans Snap sedang dalam pengembangan (Phase B4)." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-xl bg-white/[0.02] border border-white/8 space-y-2", children: [
        /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black text-[#4B6478] uppercase tracking-widest", children: "Catatan Keamanan" }),
        /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-white/50 leading-relaxed", children: [
          "Server Key Midtrans wajib disimpan di ",
          /* @__PURE__ */ jsx("span", { className: "text-emerald-400 font-bold", children: "Supabase Edge Function Secrets" }),
          ", bukan di frontend atau database."
        ] })
      ] })
    ] })
  ] }) });
}
function BankSkeleton() {
  return /* @__PURE__ */ jsxs("div", { className: "bg-[#111C24] border border-white/8 rounded-[24px] p-6 h-[240px] animate-pulse", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-6", children: [
      /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-xl bg-white/5" }),
      /* @__PURE__ */ jsx("div", { className: "w-16 h-6 rounded-full bg-white/5" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsx("div", { className: "w-24 h-3 bg-white/5 rounded" }),
      /* @__PURE__ */ jsx("div", { className: "w-32 h-6 bg-white/5 rounded" }),
      /* @__PURE__ */ jsx("div", { className: "w-24 h-3 bg-white/5 rounded" }),
      /* @__PURE__ */ jsx("div", { className: "w-48 h-5 bg-white/5 rounded" })
    ] })
  ] });
}
export {
  AdminSubscriptions as default
};
