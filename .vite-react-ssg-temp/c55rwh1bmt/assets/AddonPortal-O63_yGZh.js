import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Copy, ArrowLeft, Sparkles, Building2, Zap, Rocket, Loader2, Plus, ShieldCheck } from "lucide-react";
import { u as useAuth, aI as usePlanConfigs, bm as usePaymentSettings, bj as useCreateInvoice, aq as formatIDR, bh as checkQuotaUsage } from "../main.mjs";
import { toast } from "sonner";
import "vite-react-ssg";
import "@tanstack/react-query";
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
function AddonPortal() {
  const navigate = useNavigate();
  const { profile, profiles, tenant, isSuperadmin } = useAuth();
  const { data: configs } = usePlanConfigs();
  const { data: banks } = usePaymentSettings();
  const createInvoice = useCreateInvoice();
  const [invoiceResult, setInvoiceResult] = useState(null);
  const [copied, setCopied] = useState(null);
  const [quota, setQuota] = useState({ usage: 0, limit: 0, canAdd: false });
  const [fetching, setFetching] = useState(true);
  useEffect(() => {
    async function loadQuota() {
      if (!tenant || !profile) return;
      const res = await checkQuotaUsage(tenant, profile, "business");
      setQuota(res);
      setFetching(false);
    }
    loadQuota();
  }, [tenant, profile, profiles]);
  const slotPrice = useMemo(() => {
    var _a;
    return ((_a = configs == null ? void 0 : configs.addon_pricing) == null ? void 0 : _a.business_slot_price) || 15e4;
  }, [configs]);
  const currentPlan = isSuperadmin ? "business" : (tenant == null ? void 0 : tenant.plan) || "starter";
  const totalLimit = quota.limit;
  const currentUsage = quota.usage;
  const hasQuota = quota.canAdd;
  const activeBanks = (banks == null ? void 0 : banks.filter((b) => b.is_active && b.bank_name !== "xendit_config")) || [];
  const handlePurchase = async () => {
    if (!(profile == null ? void 0 : profile.tenant_id)) return;
    try {
      const { invoiceNumber } = await createInvoice.mutateAsync({
        tenantId: profile.tenant_id,
        plan: "addon_business_slot",
        billingMonths: 1,
        amount: slotPrice,
        notes: `Pembelian 1 Slot Bisnis Tambahan (Add-on Multi-Tenant)`
      });
      setInvoiceResult(invoiceNumber);
    } catch (_) {
    }
  };
  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success("Disalin!");
    setTimeout(() => setCopied(null), 2e3);
  };
  if (invoiceResult) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center p-6 bg-[#06090F]", children: /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: { scale: 0.95, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        className: "w-full max-w-md bg-[#0C1319] border border-white/10 rounded-[40px] p-8 shadow-2xl relative overflow-hidden",
        children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-50" }),
          /* @__PURE__ */ jsxs("div", { className: "relative z-10 text-center mb-8", children: [
            /* @__PURE__ */ jsx("div", { className: "w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(2, 26, 2,0.2)]", children: /* @__PURE__ */ jsx(CheckCircle2, { size: 40, className: "text-emerald-500" }) }),
            /* @__PURE__ */ jsx("h2", { className: "text-2xl font-black text-white uppercase tracking-tight", children: "Tagihan Dibuat!" }),
            /* @__PURE__ */ jsx("p", { className: "text-[#4B6478] text-sm mt-2", children: "Segera selesaikan pembayaran untuk menambah slot bisnis bapak." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "relative z-10 space-y-4 mb-8", children: [
            /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black text-[#4B6478] uppercase tracking-widest mb-1", children: "Invoice" }),
                /* @__PURE__ */ jsx("p", { className: "font-mono font-bold text-emerald-400", children: invoiceResult })
              ] }),
              /* @__PURE__ */ jsx("button", { onClick: () => copyToClipboard(invoiceResult, "inv"), className: "p-2 text-[#4B6478] hover:text-white", children: /* @__PURE__ */ jsx(Copy, { size: 16 }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-4", children: [
                /* @__PURE__ */ jsx("span", { className: "text-sm text-[#4B6478]", children: "Total Transfer:" }),
                /* @__PURE__ */ jsx("span", { className: "text-xl font-black text-white", children: formatIDR(slotPrice) })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "space-y-3", children: activeBanks.map((bank) => /* @__PURE__ */ jsxs("div", { className: "p-3 rounded-xl bg-black/20 border border-white/5 flex items-center justify-between", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-[#4B6478] uppercase", children: bank.bank_name }),
                  /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-white", children: bank.account_number })
                ] }),
                /* @__PURE__ */ jsx("button", { onClick: () => copyToClipboard(bank.account_number, bank.id), className: "p-2 text-[#4B6478]", children: copied === bank.id ? /* @__PURE__ */ jsx(CheckCircle2, { size: 14, className: "text-emerald-400" }) : /* @__PURE__ */ jsx(Copy, { size: 14 }) })
              ] }, bank.id)) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("button", { onClick: () => navigate(-1), className: "w-full py-4 text-[#4B6478] hover:text-white text-sm font-bold flex items-center justify-center gap-2", children: [
            /* @__PURE__ */ jsx(ArrowLeft, { size: 16 }),
            " Kembali ke Dashboard"
          ] })
        ]
      }
    ) });
  }
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-[#06090F] pt-8 px-4 pb-20", children: /* @__PURE__ */ jsxs("div", { className: "max-w-2xl mx-auto", children: [
    /* @__PURE__ */ jsxs("button", { onClick: () => navigate(-1), className: "flex items-center gap-2 text-[#4B6478] hover:text-white transition-colors mb-8", children: [
      /* @__PURE__ */ jsx(ArrowLeft, { size: 18 }),
      " Kembali"
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-12", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest mb-4", children: [
          /* @__PURE__ */ jsx(Sparkles, { size: 12 }),
          " Multi-Tenant Add-on"
        ] }),
        /* @__PURE__ */ jsxs("h1", { className: "text-4xl font-black text-white uppercase tracking-tighter leading-none mb-4", children: [
          "Tambah Bisnis ",
          /* @__PURE__ */ jsx("br", {}),
          " Tanpa Batas."
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-[#94A3B8] text-lg leading-relaxed", children: "Kelola berbagai unit usaha bapak dalam satu akun TernakOS. Setiap bisnis terpisah, profesional, dan rapi." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "relative bg-[#0C1319] border border-white/10 rounded-[40px] p-8 shadow-2xl overflow-hidden", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 p-4", children: /* @__PURE__ */ jsxs("div", { className: "px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-black text-[#4B6478] uppercase tracking-widest", children: [
          "Status: ",
          fetching ? "..." : `${currentUsage}/${totalLimit}`,
          " Slot"
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-8", children: [
          /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400 border border-purple-500/30", children: /* @__PURE__ */ jsx(Building2, { size: 28 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black text-[#4B6478] uppercase tracking-widest", children: "Harga Per Slot" }),
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-black text-white", children: formatIDR(slotPrice) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-4 mb-8", children: [
          hasQuota ? /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex gap-3 items-start", children: [
            /* @__PURE__ */ jsx(Zap, { size: 18, className: "shrink-0 mt-0.5" }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs font-bold leading-relaxed", children: [
              "Bapak masih punya jatah **",
              totalLimit - currentUsage,
              " bisnis gratis** dari paket ",
              currentPlan.toUpperCase(),
              " Bapak."
            ] })
          ] }) : /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex gap-3 items-start animate-pulse", children: [
            /* @__PURE__ */ jsx(Rocket, { size: 18, className: "shrink-0 mt-0.5" }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs font-bold leading-relaxed", children: [
              "Jatah bisnis paket ",
              currentPlan.toUpperCase(),
              " bapak sudah penuh (",
              currentUsage,
              "/",
              totalLimit,
              "). Beli slot tambahan untuk lanjut."
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-sm text-[#94A3B8]", children: [
            /* @__PURE__ */ jsx(CheckCircle2, { size: 18, className: "text-emerald-400 shrink-0" }),
            /* @__PURE__ */ jsx("span", { children: "Satu Akun, Banyak Dashboard Bisnis" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-sm text-[#94A3B8]", children: [
            /* @__PURE__ */ jsx(CheckCircle2, { size: 18, className: "text-emerald-400 shrink-0" }),
            /* @__PURE__ */ jsx("span", { children: "Data & Laporan Terpisah Tiap Bisnis" })
          ] })
        ] }),
        hasQuota ? /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => navigate("/onboarding?mode=new_business"),
            className: "w-full bg-emerald-500 hover:bg-emerald-600 text-white h-16 rounded-[24px] font-black uppercase text-sm tracking-widest transition-all shadow-[0_10px_30px_rgba(2, 26, 2,0.3)] flex items-center justify-center gap-3 active:scale-[0.98]",
            children: [
              /* @__PURE__ */ jsx(Rocket, { size: 20 }),
              " Pakai Jatah Gratis"
            ]
          }
        ) : /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handlePurchase,
            disabled: createInvoice.isPending,
            className: "w-full bg-purple-500 hover:bg-purple-600 text-white h-16 rounded-[24px] font-black uppercase text-sm tracking-widest transition-all shadow-[0_10px_30px_rgba(168,85,247,0.3)] flex items-center justify-center gap-3 disabled:opacity-50",
            children: createInvoice.isPending ? /* @__PURE__ */ jsx(Loader2, { className: "animate-spin" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Plus, { size: 20 }),
              " Beli Slot Sekarang"
            ] })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-3xl bg-white/[0.02] border border-white/5", children: [
        /* @__PURE__ */ jsx(ShieldCheck, { className: "text-emerald-400 mb-4" }),
        /* @__PURE__ */ jsx("h3", { className: "font-bold text-white mb-2 uppercase text-sm", children: "Keamanan Data" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-[#4B6478] leading-relaxed", children: "Data antar bisnis bapak dijamin terisolasi dan tidak akan bercampur satu sama lain." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-3xl bg-white/[0.02] border border-white/5", children: [
        /* @__PURE__ */ jsx(Rocket, { className: "text-amber-400 mb-4" }),
        /* @__PURE__ */ jsx("h3", { className: "font-bold text-white mb-2 uppercase text-sm", children: "Cepat & Ringan" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-[#4B6478] leading-relaxed", children: "Pindah dashboard antar bisnis hanya butuh 1 klik, tanpa perlu login ulang." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-3xl bg-white/[0.02] border border-white/5", children: [
        /* @__PURE__ */ jsx(Zap, { className: "text-purple-400 mb-4" }),
        /* @__PURE__ */ jsx("h3", { className: "font-bold text-white mb-2 uppercase text-sm", children: "Sistem Add-on" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-[#4B6478] leading-relaxed", children: "Beli sesuai kebutuhan. Tidak perlu bayar paket mahal jika bapak hanya butuh slot baru." })
      ] })
    ] })
  ] }) });
}
export {
  AddonPortal as default
};
