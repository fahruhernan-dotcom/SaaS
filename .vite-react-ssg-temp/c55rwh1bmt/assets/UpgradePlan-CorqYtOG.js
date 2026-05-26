import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Loader2, Building2, Clock, ArrowLeft, XCircle, AlertCircle, CheckCircle2, Crown, Star, Check, ChevronUp, ChevronDown, Infinity, Warehouse, Users, ShieldCheck, BarChart3, Headphones, FileText, Receipt, TrendingUp, Truck, Calculator } from "lucide-react";
import { u as useAuth, bi as usePricingConfig, bj as useCreateInvoice, bk as useActivateTrial, aI as usePlanConfigs, bl as useHasPendingInvoice, a_ as useLanguage, g as getSubscriptionStatus, c as useMediaQuery, aq as formatIDR, s as supabase } from "../main.mjs";
import { F as FALLBACK_TRANSACTION_QUOTA } from "./planGating-BwKbTRBv.js";
import { addMonths, format } from "date-fns";
import { enUS, id } from "date-fns/locale";
import { toast } from "sonner";
import "vite-react-ssg";
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
const BILLING_OPTIONS = [
  { months: 1, label: "1 Bln", discount: 0 },
  { months: 3, label: "3 Bln", discount: 5 },
  { months: 6, label: "6 Bln", discount: 10 },
  { months: 12, label: "1 Tahun", discount: 20 }
];
const ROLE_FEATURES = {
  broker: {
    label: "Broker Ayam",
    labelKey: "role_broker_ayam_display",
    pro: [
      { key: "feat_broker_pro_unlimited", icon: /* @__PURE__ */ jsx(Infinity, { size: 13 }), text: "Transaksi tidak terbatas (vs {{STARTER_QUOTA}}/bln)" },
      { key: "feat_broker_pro_fleet", icon: /* @__PURE__ */ jsx(Truck, { size: 13 }), text: "Armada hingga 5 kendaraan & sopir" },
      { key: "feat_broker_pro_cashflow", icon: /* @__PURE__ */ jsx(TrendingUp, { size: 13 }), text: "Cash Flow & laporan keuangan" },
      { key: "feat_broker_pro_team", icon: /* @__PURE__ */ jsx(Users, { size: 13 }), text: "Tim hingga 3 anggota" },
      { key: "feat_broker_pro_invoice", icon: /* @__PURE__ */ jsx(FileText, { size: 13 }), text: "Generate invoice & PDF profesional" },
      { key: "feat_broker_pro_simulator", icon: /* @__PURE__ */ jsx(Calculator, { size: 13 }), text: "Simulator keuntungan" }
    ],
    business: [
      { key: "feat_broker_biz_all_pro", icon: /* @__PURE__ */ jsx(Infinity, { size: 13 }), text: "Semua fitur Pro" },
      { key: "feat_broker_biz_unlimited_team", icon: /* @__PURE__ */ jsx(Users, { size: 13 }), text: "Tim tidak terbatas" },
      { key: "feat_broker_biz_unlimited_fleet", icon: /* @__PURE__ */ jsx(Truck, { size: 13 }), text: "Armada tidak terbatas" },
      { key: "feat_broker_biz_advanced_reports", icon: /* @__PURE__ */ jsx(BarChart3, { size: 13 }), text: "Laporan & analitik lanjutan" },
      { key: "feat_broker_biz_api", icon: /* @__PURE__ */ jsx(ShieldCheck, { size: 13 }), text: "Akses API & integrasi" },
      { key: "feat_broker_biz_manager", icon: /* @__PURE__ */ jsx(Headphones, { size: 13 }), text: "Dedicated account manager" }
    ]
  },
  peternak: {
    label: "Peternak",
    labelKey: "role_peternak_display",
    pro: [
      { key: "feat_peternak_pro_barns", icon: /* @__PURE__ */ jsx(Warehouse, { size: 13 }), text: "Hingga 3 kandang" },
      { key: "feat_peternak_pro_fcr", icon: /* @__PURE__ */ jsx(TrendingUp, { size: 13 }), text: "Laporan profit & FCR otomatis" },
      { key: "feat_peternak_pro_export", icon: /* @__PURE__ */ jsx(FileText, { size: 13 }), text: "Export PDF & cetak laporan" },
      { key: "feat_peternak_pro_history", icon: /* @__PURE__ */ jsx(Receipt, { size: 13 }), text: "Riwayat siklus panen lengkap" },
      { key: "feat_peternak_pro_analytics", icon: /* @__PURE__ */ jsx(BarChart3, { size: 13 }), text: "Analitik performa kandang" },
      { key: "feat_peternak_pro_support", icon: /* @__PURE__ */ jsx(Headphones, { size: 13 }), text: "Support prioritas WhatsApp" }
    ],
    business: [
      { key: "feat_peternak_biz_all_pro", icon: /* @__PURE__ */ jsx(Infinity, { size: 13 }), text: "Semua fitur Pro" },
      { key: "feat_peternak_biz_unlimited_barns", icon: /* @__PURE__ */ jsx(Warehouse, { size: 13 }), text: "Kandang tidak terbatas" },
      { key: "feat_peternak_biz_multiuser", icon: /* @__PURE__ */ jsx(Users, { size: 13 }), text: "Multi-user manajemen kandang" },
      { key: "feat_peternak_biz_api", icon: /* @__PURE__ */ jsx(ShieldCheck, { size: 13 }), text: "Akses API data produksi" },
      { key: "feat_peternak_biz_enterprise_dashboard", icon: /* @__PURE__ */ jsx(BarChart3, { size: 13 }), text: "Dashboard analitik enterprise" },
      { key: "feat_peternak_biz_manager", icon: /* @__PURE__ */ jsx(Headphones, { size: 13 }), text: "Dedicated account manager" }
    ]
  },
  rpa: {
    label: "Rumah Potong Ayam",
    labelKey: "role_rpa_display",
    pro: [
      { key: "feat_rpa_pro_unlimited", icon: /* @__PURE__ */ jsx(Infinity, { size: 13 }), text: "Order & transaksi tidak terbatas" },
      { key: "feat_rpa_pro_receivables", icon: /* @__PURE__ */ jsx(Receipt, { size: 13 }), text: "Manajemen piutang toko" },
      { key: "feat_rpa_pro_invoice", icon: /* @__PURE__ */ jsx(FileText, { size: 13 }), text: "Invoice PDF profesional" },
      { key: "feat_rpa_pro_sales", icon: /* @__PURE__ */ jsx(BarChart3, { size: 13 }), text: "Laporan penjualan & omzet" },
      { key: "feat_rpa_pro_team", icon: /* @__PURE__ */ jsx(Users, { size: 13 }), text: "Tim hingga 3 anggota" },
      { key: "feat_rpa_pro_support", icon: /* @__PURE__ */ jsx(Headphones, { size: 13 }), text: "Support prioritas WhatsApp" }
    ],
    business: [
      { key: "feat_rpa_biz_all_pro", icon: /* @__PURE__ */ jsx(Infinity, { size: 13 }), text: "Semua fitur Pro" },
      { key: "feat_rpa_biz_multilocation", icon: /* @__PURE__ */ jsx(Warehouse, { size: 13 }), text: "Multi-lokasi / multi-outlet" },
      { key: "feat_rpa_biz_unlimited_team", icon: /* @__PURE__ */ jsx(Users, { size: 13 }), text: "Tim tidak terbatas" },
      { key: "feat_rpa_biz_api", icon: /* @__PURE__ */ jsx(ShieldCheck, { size: 13 }), text: "Akses API & integrasi ERP" },
      { key: "feat_rpa_biz_enterprise_dashboard", icon: /* @__PURE__ */ jsx(BarChart3, { size: 13 }), text: "Dashboard analitik enterprise" },
      { key: "feat_rpa_biz_manager", icon: /* @__PURE__ */ jsx(Headphones, { size: 13 }), text: "Dedicated account manager" }
    ]
  },
  egg_broker: {
    label: "Broker Telur",
    labelKey: "role_egg_broker_display",
    pro: [
      { key: "feat_egg_broker_pro_unlimited", icon: /* @__PURE__ */ jsx(Infinity, { size: 13 }), text: "Penjualan & stok tidak terbatas" },
      { key: "feat_egg_broker_pro_cogs", icon: /* @__PURE__ */ jsx(BarChart3, { size: 13 }), text: "Laporan omzet & HPP otomatis" },
      { key: "feat_egg_broker_pro_invoice", icon: /* @__PURE__ */ jsx(FileText, { size: 13 }), text: "Invoice PDF profesional" },
      { key: "feat_egg_broker_pro_receivables", icon: /* @__PURE__ */ jsx(Receipt, { size: 13 }), text: "Manajemen piutang pelanggan" },
      { key: "feat_egg_broker_pro_team", icon: /* @__PURE__ */ jsx(Users, { size: 13 }), text: "Tim hingga 3 anggota" },
      { key: "feat_egg_broker_pro_support", icon: /* @__PURE__ */ jsx(Headphones, { size: 13 }), text: "Support prioritas WhatsApp" }
    ],
    business: [
      { key: "feat_egg_broker_biz_all_pro", icon: /* @__PURE__ */ jsx(Infinity, { size: 13 }), text: "Semua fitur Pro" },
      { key: "feat_egg_broker_biz_multilocation", icon: /* @__PURE__ */ jsx(Warehouse, { size: 13 }), text: "Multi-gudang / multi-lokasi" },
      { key: "feat_egg_broker_biz_unlimited_team", icon: /* @__PURE__ */ jsx(Users, { size: 13 }), text: "Tim tidak terbatas" },
      { key: "feat_egg_broker_biz_api", icon: /* @__PURE__ */ jsx(ShieldCheck, { size: 13 }), text: "Akses API & integrasi" },
      { key: "feat_egg_broker_biz_enterprise_dashboard", icon: /* @__PURE__ */ jsx(BarChart3, { size: 13 }), text: "Dashboard analitik enterprise" },
      { key: "feat_egg_broker_biz_manager", icon: /* @__PURE__ */ jsx(Headphones, { size: 13 }), text: "Dedicated account manager" }
    ]
  },
  sembako_broker: {
    label: "Distributor Sembako",
    labelKey: "role_sembako_broker_display",
    pro: [
      { key: "feat_sembako_pro_unlimited", icon: /* @__PURE__ */ jsx(Infinity, { size: 13 }), text: "Produk & transaksi tidak terbatas" },
      { key: "feat_sembako_pro_fifo", icon: /* @__PURE__ */ jsx(BarChart3, { size: 13 }), text: "FIFO stok & laporan COGS" },
      { key: "feat_sembako_pro_invoice", icon: /* @__PURE__ */ jsx(FileText, { size: 13 }), text: "Invoice & surat jalan PDF" },
      { key: "feat_sembako_pro_payroll", icon: /* @__PURE__ */ jsx(Receipt, { size: 13 }), text: "Penggajian karyawan" },
      { key: "feat_sembako_pro_team", icon: /* @__PURE__ */ jsx(Users, { size: 13 }), text: "Tim hingga 3 anggota" },
      { key: "feat_sembako_pro_support", icon: /* @__PURE__ */ jsx(Headphones, { size: 13 }), text: "Support prioritas WhatsApp" }
    ],
    business: [
      { key: "feat_sembako_biz_all_pro", icon: /* @__PURE__ */ jsx(Infinity, { size: 13 }), text: "Semua fitur Pro" },
      { key: "feat_sembako_biz_multilocation", icon: /* @__PURE__ */ jsx(Warehouse, { size: 13 }), text: "Multi-gudang / multi-outlet" },
      { key: "feat_sembako_biz_unlimited_team", icon: /* @__PURE__ */ jsx(Users, { size: 13 }), text: "Tim tidak terbatas" },
      { key: "feat_sembako_biz_api", icon: /* @__PURE__ */ jsx(ShieldCheck, { size: 13 }), text: "Akses API & integrasi ERP" },
      { key: "feat_sembako_biz_enterprise_dashboard", icon: /* @__PURE__ */ jsx(BarChart3, { size: 13 }), text: "Dashboard analitik enterprise" },
      { key: "feat_sembako_biz_manager", icon: /* @__PURE__ */ jsx(Headphones, { size: 13 }), text: "Dedicated account manager" }
    ]
  }
};
const PLAN_META = {
  pro: {
    label: "Pro",
    tagline: "Untuk bisnis yang berkembang",
    icon: /* @__PURE__ */ jsx(Zap, { size: 20 }),
    color: "#021a02",
    colorMid: "rgba(2, 26, 2,0.15)",
    colorLow: "rgba(2, 26, 2,0.08)",
    colorBorder: "rgba(2, 26, 2,0.35)",
    glow: "0 0 40px rgba(2, 26, 2,0.15)",
    badge: null
  },
  business: {
    label: "Business",
    tagline: "Untuk operasi skala besar",
    icon: /* @__PURE__ */ jsx(Crown, { size: 20 }),
    color: "#F59E0B",
    colorMid: "rgba(245,158,11,0.15)",
    colorLow: "rgba(245,158,11,0.08)",
    colorBorder: "rgba(245,158,11,0.35)",
    glow: "0 0 40px rgba(245,158,11,0.15)",
    badge: "Populer"
  }
};
const VERTICAL_TO_PRICING_ROLE = {
  poultry_broker: "broker",
  egg_broker: "egg_broker",
  peternak: "peternak",
  peternak_ayam_broiler: "peternak_ayam_broiler",
  peternak_ayam_layer: "peternak_ayam_layer",
  peternak_sapi_penggemukan: "peternak_sapi_potong_fattening",
  peternak_sapi_potong_fattening: "peternak_sapi_potong_fattening",
  peternak_sapi_potong_breeding: "peternak_sapi_potong_breeding",
  peternak_sapi_perah: "peternak_sapi_perah",
  peternak_kambing_penggemukan: "peternak_kambing_potong_fattening",
  peternak_kambing_potong_fattening: "peternak_kambing_potong_fattening",
  peternak_kambing_potong_breeding: "peternak_kambing_potong_breeding",
  peternak_kambing_perah: "peternak_kambing_perah",
  peternak_domba_penggemukan: "peternak_domba_potong_fattening",
  peternak_domba_potong_fattening: "peternak_domba_potong_fattening",
  peternak_domba_potong_breeding: "peternak_domba_potong_breeding",
  rumah_potong: "rpa",
  sembako_broker: "sembako_broker",
  distributor_sembako: "sembako_broker"
};
function getPricingRole(tenant) {
  return VERTICAL_TO_PRICING_ROLE[tenant == null ? void 0 : tenant.business_vertical] || "broker";
}
function getRoleFeatures(pricingRole, starterQuota = FALLBACK_TRANSACTION_QUOTA, t) {
  const featureKey = ROLE_FEATURES[pricingRole] ? pricingRole : (pricingRole == null ? void 0 : pricingRole.startsWith("peternak_")) ? "peternak" : "broker";
  const base = ROLE_FEATURES[featureKey];
  const mapFeature = (f) => {
    let text = t ? t(f.key, f.text) : f.text;
    if (typeof text === "string" && text.includes("{{STARTER_QUOTA}}")) {
      text = text.replace("{{STARTER_QUOTA}}", starterQuota);
    }
    return { ...f, text };
  };
  return {
    ...base,
    label: t ? t(base.labelKey, base.label) : base.label,
    pro: base.pro.map(mapFeature),
    business: base.business.map(mapFeature)
  };
}
function PlanCard({ planKey, meta, price, isSelected, onSelect, features, _billingMonths, discount }) {
  const { t, tPlan } = useLanguage();
  const monthlyDisplay = price ? formatIDR(Math.round(price * (1 - discount / 100))) : "—";
  const originalMonthly = price ? formatIDR(price) : null;
  const tagline = planKey === "pro" ? t("plan_pro_tagline", meta.tagline) : t("plan_business_tagline", meta.tagline);
  const badge = meta.badge ? t("plan_popular_badge", meta.badge) : null;
  return /* @__PURE__ */ jsxs(
    motion.button,
    {
      whileTap: { scale: 0.97 },
      onClick: () => onSelect(planKey),
      className: "relative w-full text-left rounded-2xl p-4 sm:p-5 transition-all duration-200 focus:outline-none",
      style: {
        background: isSelected ? meta.colorLow : "#0C1319",
        border: `1.5px solid ${isSelected ? meta.colorBorder : "rgba(255,255,255,0.08)"}`,
        boxShadow: isSelected ? meta.glow : "none"
      },
      children: [
        badge && /* @__PURE__ */ jsxs(
          "div",
          {
            className: "absolute -top-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
            style: { background: meta.color, color: "#000" },
            children: [
              /* @__PURE__ */ jsx(Star, { size: 8, fill: "currentColor" }),
              " ",
              badge
            ]
          }
        ),
        isSelected && /* @__PURE__ */ jsx(
          "div",
          {
            className: "absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center",
            style: { background: meta.color },
            children: /* @__PURE__ */ jsx(Check, { size: 11, color: "#000", strokeWidth: 3 })
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", style: { color: meta.color }, children: [
          meta.icon,
          /* @__PURE__ */ jsx("span", { className: "font-display font-black text-base text-white", children: tPlan(planKey) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mb-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-1.5", children: [
            /* @__PURE__ */ jsx("span", { className: "font-display font-black text-xl", style: { color: meta.color }, children: monthlyDisplay }),
            /* @__PURE__ */ jsx("span", { className: "text-[11px] text-[#4B6478]", children: t("billing_per_month", "/bln") })
          ] }),
          discount > 0 && originalMonthly && /* @__PURE__ */ jsxs("div", { className: "text-[10px] text-[#4B6478] line-through mt-0.5", children: [
            originalMonthly,
            t("billing_per_month", "/bln")
          ] })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-[11px] text-[#4B6478]", children: tagline }),
        /* @__PURE__ */ jsxs("div", { className: "mt-3 space-y-1.5", children: [
          features.slice(0, 3).map((f, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { style: { color: meta.color, flexShrink: 0 }, children: f.icon }),
            /* @__PURE__ */ jsx("span", { className: "text-[11px] text-[#64748B] leading-tight", children: f.text })
          ] }, i)),
          features.length > 3 && /* @__PURE__ */ jsx("div", { className: "text-[10px] font-semibold mt-1", style: { color: meta.color }, children: t("upgrade_more_features", "+{count} fitur lainnya ↓").replace("{count}", features.length - 3) })
        ] })
      ]
    }
  );
}
function FeatureSection({ planKey, meta, features, billingMonths, basePrice, discount, isExpanded, onToggle }) {
  const { t, tPlan } = useLanguage();
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: "rounded-2xl overflow-hidden",
      style: { border: `1px solid ${meta.colorBorder}`, background: meta.colorLow },
      children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: onToggle,
            className: "w-full flex items-center justify-between px-4 py-3 text-left",
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("div", { style: { color: meta.color }, children: meta.icon }),
                /* @__PURE__ */ jsx("span", { className: "font-display font-bold text-sm text-white", children: t("upgrade_all_features_of", "Semua fitur {label}").replace("{label}", tPlan(planKey)) })
              ] }),
              /* @__PURE__ */ jsx("div", { style: { color: meta.color }, children: isExpanded ? /* @__PURE__ */ jsx(ChevronUp, { size: 15 }) : /* @__PURE__ */ jsx(ChevronDown, { size: 15 }) })
            ]
          }
        ),
        /* @__PURE__ */ jsx(AnimatePresence, { children: isExpanded && /* @__PURE__ */ jsx(
          motion.div,
          {
            initial: { height: 0, opacity: 0 },
            animate: { height: "auto", opacity: 1 },
            exit: { height: 0, opacity: 0 },
            transition: { duration: 0.2 },
            className: "overflow-hidden",
            children: /* @__PURE__ */ jsx("div", { className: "px-4 pb-4 space-y-2.5", children: features.map((f, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
              /* @__PURE__ */ jsx(
                "div",
                {
                  className: "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                  style: { background: meta.colorMid, color: meta.color },
                  children: f.icon
                }
              ),
              /* @__PURE__ */ jsx("span", { className: "text-[12px] text-[#94A3B8] leading-snug", children: f.text })
            ] }, i)) })
          }
        ) })
      ]
    }
  );
}
function BillingSelector({ value, onChange }) {
  const { t } = useLanguage();
  return /* @__PURE__ */ jsx("div", { className: "grid grid-cols-4 gap-2", children: BILLING_OPTIONS.map((opt) => {
    const isSelected = value === opt.months;
    return /* @__PURE__ */ jsxs(
      motion.button,
      {
        whileTap: { scale: 0.95 },
        onClick: () => onChange(opt.months),
        className: "relative flex flex-col items-center justify-center py-3 rounded-xl text-center transition-all",
        style: {
          background: isSelected ? "rgba(2, 26, 2,0.1)" : "#0C1319",
          border: `1.5px solid ${isSelected ? "#021a02" : "rgba(255,255,255,0.08)"}`,
          color: isSelected ? "#021a02" : "#4B6478"
        },
        children: [
          opt.discount > 0 && /* @__PURE__ */ jsxs(
            "div",
            {
              className: "absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full text-[9px] font-black",
              style: { background: "#021a02", color: "#000" },
              children: [
                "-",
                opt.discount,
                "%"
              ]
            }
          ),
          /* @__PURE__ */ jsx("span", { className: "font-display font-bold text-[11px] sm:text-xs leading-tight", children: opt.months === 12 ? t("billing_1_year", "1 Tahun") : t("billing_months_count", `${opt.months} Bln`).replace("{months}", opt.months) })
        ]
      },
      opt.months
    );
  }) });
}
const PAYMENT_STATUS_META = {
  finish: {
    icon: /* @__PURE__ */ jsx(CheckCircle2, { size: 18 }),
    title: "Pembayaran diterima!",
    body: "Plan kamu sedang diaktifkan. Refresh halaman dalam 1–2 menit.",
    color: "#021a02",
    bg: "rgba(2, 26, 2,0.08)",
    border: "rgba(2, 26, 2,0.25)"
  },
  unfinish: {
    icon: /* @__PURE__ */ jsx(AlertCircle, { size: 18 }),
    title: "Pembayaran belum selesai",
    body: "Kamu menutup halaman pembayaran sebelum selesai. Klik tombol upgrade untuk melanjutkan.",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.25)"
  },
  error: {
    icon: /* @__PURE__ */ jsx(XCircle, { size: 18 }),
    title: "Pembayaran gagal",
    body: "Terjadi kesalahan saat memproses pembayaran. Coba lagi atau hubungi admin.",
    color: "#EF4444",
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.25)"
  }
};
function UpgradePlan() {
  var _a, _b, _c, _d, _e, _f, _g;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile, tenant } = useAuth();
  const { data: pricing } = usePricingConfig();
  const createInvoice = useCreateInvoice();
  const activateTrial = useActivateTrial();
  const { data: planConfigs = {} } = usePlanConfigs();
  const { data: hasPendingInvoice } = useHasPendingInvoice(profile == null ? void 0 : profile.tenant_id);
  const { lang, t, tPlan } = useLanguage();
  const [selectedPlan, setSelectedPlan] = useState(() => {
    const p = searchParams.get("plan");
    return p === "business" || p === "pro" ? p : "pro";
  });
  const [billingMonths, setBillingMonths] = useState(1);
  const [expandedFeature, setExpandedFeature] = useState("pro");
  const [redirecting, setRedirecting] = useState(false);
  const pricingRole = getPricingRole(tenant);
  const starterQuota = ((_a = planConfigs == null ? void 0 : planConfigs.transaction_quota) == null ? void 0 : _a.starter) ?? FALLBACK_TRANSACTION_QUOTA;
  const roleFeatures = getRoleFeatures(pricingRole, starterQuota, t);
  const sub = getSubscriptionStatus(tenant);
  const isRenewal = sub.status === "active" && (tenant == null ? void 0 : tenant.plan) === selectedPlan;
  const basePrice = ((_c = (_b = pricing == null ? void 0 : pricing[pricingRole]) == null ? void 0 : _b[selectedPlan]) == null ? void 0 : _c.price) || 0;
  const discount = ((_d = BILLING_OPTIONS.find((o) => o.months === billingMonths)) == null ? void 0 : _d.discount) || 0;
  const total = Math.round(basePrice * billingMonths * (1 - discount / 100));
  const savedAmount = Math.round(basePrice * billingMonths) - total;
  const activeLocale = lang === "en" ? enUS : id;
  const renewalBase = isRenewal && sub.expiresAt > /* @__PURE__ */ new Date() ? sub.expiresAt : /* @__PURE__ */ new Date();
  const newExpiry = addMonths(renewalBase, billingMonths);
  const newExpiryStr = format(newExpiry, "d MMM yyyy", { locale: activeLocale });
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const currentPlanMeta = PLAN_META[selectedPlan];
  const trialUsed = !!(tenant == null ? void 0 : tenant.trial_ends_at);
  const canTrial = sub.plan === "starter" && !trialUsed;
  const trialDays = selectedPlan === "business" ? ((_e = planConfigs == null ? void 0 : planConfigs.trial_config) == null ? void 0 : _e.business) ?? 7 : ((_f = planConfigs == null ? void 0 : planConfigs.trial_config) == null ? void 0 : _f.pro) ?? 7;
  const getPaymentTranslation = (status) => {
    if (status === "finish") {
      return {
        title: t("payment_success_title", "Pembayaran diterima!"),
        body: t("payment_success_body", "Plan kamu sedang diaktifkan. Refresh halaman dalam 1–2 menit.")
      };
    }
    if (status === "unfinish") {
      return {
        title: t("payment_pending_title", "Pembayaran belum selesai"),
        body: t("payment_pending_body", "Kamu menutup halaman pembayaran sebelum selesai. Klik tombol upgrade untuk melanjutkan.")
      };
    }
    if (status === "error") {
      return {
        title: t("payment_failed_title", "Pembayaran gagal"),
        body: t("payment_failed_body", "Terjadi kesalahan saat memproses pembayaran. Coba lagi atau hubungi admin.")
      };
    }
    return null;
  };
  const paymentStatus = searchParams.get("payment");
  const paymentMeta = PAYMENT_STATUS_META[paymentStatus] ?? null;
  const paymentTrans = getPaymentTranslation(paymentStatus);
  const paymentBanner = paymentMeta && paymentTrans && /* @__PURE__ */ jsxs(
    motion.div,
    {
      initial: { opacity: 0, y: -8 },
      animate: { opacity: 1, y: 0 },
      className: "flex items-start gap-3 p-4 rounded-2xl mb-6",
      style: { background: paymentMeta.bg, border: `1px solid ${paymentMeta.border}` },
      children: [
        /* @__PURE__ */ jsx("span", { style: { color: paymentMeta.color, flexShrink: 0, marginTop: 1 }, children: paymentMeta.icon }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "font-display font-black text-[13px] text-white leading-tight mb-0.5", children: paymentTrans.title }),
          /* @__PURE__ */ jsx("p", { className: "text-[12px] text-[#4B6478]", children: paymentTrans.body })
        ] })
      ]
    }
  );
  const handleSubmit = async () => {
    if (!(profile == null ? void 0 : profile.tenant_id)) return;
    if (hasPendingInvoice === true) {
      toast.warning(t("upgrade_toast_pending_invoice", "Kamu sudah memiliki invoice pending. Tunggu konfirmasi admin atau hubungi admin untuk membatalkannya terlebih dahulu."));
      return;
    }
    try {
      const { invoiceId } = await createInvoice.mutateAsync({
        tenantId: profile.tenant_id,
        plan: selectedPlan,
        billingMonths,
        amount: total,
        notes: `${isRenewal ? t("upgrade_renew", "Perpanjang") : t("upgrade_to", "Upgrade ke")} ${tPlan(selectedPlan)} — ${billingMonths} bulan`
      });
      setRedirecting(true);
      const { data: fnData, error: fnError } = await supabase.functions.invoke("midtrans-create-transaction", {
        body: { invoice_id: invoiceId }
      });
      if (fnError || !(fnData == null ? void 0 : fnData.redirect_url)) {
        toast.error(t("upgrade_toast_midtrans_failed", "Gagal menghubungi payment gateway. Silakan coba lagi atau hubungi admin."));
        setRedirecting(false);
        return;
      }
      window.location.assign(fnData.redirect_url);
    } catch (_) {
      setRedirecting(false);
    }
  };
  const planCards = /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-3", children: Object.entries(PLAN_META).map(([key, meta]) => {
    var _a2, _b2;
    return /* @__PURE__ */ jsx(
      PlanCard,
      {
        planKey: key,
        meta,
        price: (_b2 = (_a2 = pricing == null ? void 0 : pricing[pricingRole]) == null ? void 0 : _a2[key]) == null ? void 0 : _b2.price,
        isSelected: selectedPlan === key,
        onSelect: setSelectedPlan,
        features: roleFeatures[key],
        billingMonths,
        discount
      },
      key
    );
  }) });
  const trialBlock = canTrial ? /* @__PURE__ */ jsx(
    motion.div,
    {
      initial: { opacity: 0, y: 8 },
      animate: { opacity: 1, y: 0 },
      className: "rounded-2xl overflow-hidden",
      style: { border: "1px solid rgba(99,102,241,0.25)" },
      children: /* @__PURE__ */ jsxs(
        "div",
        {
          style: { background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.06))" },
          className: "p-4 flex items-center gap-4",
          children: [
            /* @__PURE__ */ jsx(
              "div",
              {
                className: "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                style: { background: "rgba(99,102,241,0.2)" },
                children: /* @__PURE__ */ jsx(Zap, { size: 18, color: "#818CF8" })
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsx("p", { className: "font-display font-black text-sm text-white leading-tight", children: t("upgrade_trial_title", "Coba {plan} {days} Hari — Gratis").replace("{plan}", tPlan(selectedPlan)).replace("{days}", trialDays) }),
              /* @__PURE__ */ jsx("p", { className: "text-[11px] text-[#64748B] mt-0.5", children: t("upgrade_trial_subtitle", "Tidak perlu kartu kredit. Batalkan kapan saja.") })
            ] }),
            /* @__PURE__ */ jsx(
              motion.button,
              {
                whileTap: { scale: 0.96 },
                onClick: () => {
                  if (!(profile == null ? void 0 : profile.tenant_id)) {
                    toast.error(t("onboarding_error_invalid_config", "Tenant ID tidak ditemukan."));
                    return;
                  }
                  activateTrial.mutate(
                    { tenantId: profile.tenant_id, plan: selectedPlan, days: trialDays },
                    {
                      onSuccess: () => {
                        navigate("/billing");
                      }
                    }
                  );
                },
                disabled: activateTrial.isPending,
                className: "flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl font-display font-black text-[12px] disabled:opacity-60",
                style: { background: "#818CF8", color: "#fff" },
                children: activateTrial.isPending ? /* @__PURE__ */ jsx(Loader2, { size: 13, className: "animate-spin" }) : t("upgrade_try_free", "Coba Gratis")
              }
            )
          ]
        }
      )
    }
  ) : trialUsed && sub.status !== "trial" ? /* @__PURE__ */ jsx("p", { className: "text-[11px] text-[#2A3F52] text-center", children: t("upgrade_trial_used", "Trial sudah pernah digunakan.") }) : null;
  const featureSections = /* @__PURE__ */ jsx("div", { className: "space-y-2.5", children: Object.entries(PLAN_META).map(([key, meta]) => {
    var _a2, _b2;
    return /* @__PURE__ */ jsx(
      FeatureSection,
      {
        planKey: key,
        meta,
        features: roleFeatures[key],
        billingMonths,
        basePrice: ((_b2 = (_a2 = pricing == null ? void 0 : pricing[pricingRole]) == null ? void 0 : _a2[key]) == null ? void 0 : _b2.price) || 0,
        discount,
        isExpanded: expandedFeature === key,
        onToggle: () => setExpandedFeature((v) => v === key ? null : key)
      },
      key
    );
  }) });
  const priceSummary = /* @__PURE__ */ jsxs(
    motion.div,
    {
      layout: true,
      className: "rounded-2xl overflow-hidden",
      style: { background: "#0C1319", border: `1px solid ${currentPlanMeta.colorBorder}` },
      children: [
        /* @__PURE__ */ jsxs("div", { className: "p-4 space-y-2.5", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-[13px]", children: [
            /* @__PURE__ */ jsx("span", { className: "text-[#4B6478]", children: t("Plan", "Plan") }),
            /* @__PURE__ */ jsx("span", { className: "font-semibold", style: { color: currentPlanMeta.color }, children: tPlan(selectedPlan) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-[13px]", children: [
            /* @__PURE__ */ jsx("span", { className: "text-[#4B6478]", children: t("upgrade_price_per_month", "Harga/bulan") }),
            /* @__PURE__ */ jsx("span", { className: "text-[#94A3B8] font-semibold", children: basePrice ? formatIDR(basePrice) : "—" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-[13px]", children: [
            /* @__PURE__ */ jsx("span", { className: "text-[#4B6478]", children: t("upgrade_duration", "Durasi") }),
            /* @__PURE__ */ jsx("span", { className: "text-[#94A3B8] font-semibold", children: billingMonths === 12 ? t("billing_1_year", "1 Tahun") : t("billing_months_count", `${billingMonths} Bln`).replace("{months}", billingMonths) })
          ] }),
          discount > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-[13px]", children: [
            /* @__PURE__ */ jsx("span", { className: "text-emerald-400 font-semibold", children: t("upgrade_discount_percent", "Diskon {discount}%").replace("{discount}", discount) }),
            /* @__PURE__ */ jsxs("span", { className: "text-emerald-400 font-semibold", children: [
              "-",
              formatIDR(savedAmount)
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-[12px]", children: [
            /* @__PURE__ */ jsx("span", { className: "text-[#4B6478]", children: t("upgrade_active_until", "Aktif hingga") }),
            /* @__PURE__ */ jsx("span", { className: "font-bold", style: { color: currentPlanMeta.color }, children: newExpiryStr })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(
          "div",
          {
            className: "px-4 py-3 flex items-center justify-between",
            style: { background: "rgba(255,255,255,0.03)", borderTop: "1px solid rgba(255,255,255,0.06)" },
            children: [
              /* @__PURE__ */ jsx("span", { className: "font-display font-black text-base text-white", children: t("upgrade_total_pay", "Total Bayar") }),
              /* @__PURE__ */ jsx(
                motion.span,
                {
                  initial: { scale: 1.1, opacity: 0.6 },
                  animate: { scale: 1, opacity: 1 },
                  className: "font-display font-black text-xl",
                  style: { color: currentPlanMeta.color },
                  children: total ? formatIDR(total) : "—"
                },
                total
              )
            ]
          }
        )
      ]
    }
  );
  const ctaButton = /* @__PURE__ */ jsx(
    motion.button,
    {
      whileTap: { scale: 0.98 },
      onClick: handleSubmit,
      disabled: createInvoice.isPending || redirecting || !basePrice,
      className: "w-full py-4 rounded-2xl font-display font-black text-[15px] transition-all disabled:opacity-60",
      style: {
        background: currentPlanMeta.color,
        color: selectedPlan === "business" ? "#000" : "#fff",
        boxShadow: `0 4px 28px ${currentPlanMeta.colorMid}`
      },
      children: redirecting ? /* @__PURE__ */ jsxs("span", { className: "flex items-center justify-center gap-2", children: [
        /* @__PURE__ */ jsx(Loader2, { size: 16, className: "animate-spin" }),
        " ",
        t("upgrade_redirecting_payment", "Mengarahkan ke pembayaran...")
      ] }) : createInvoice.isPending ? /* @__PURE__ */ jsxs("span", { className: "flex items-center justify-center gap-2", children: [
        /* @__PURE__ */ jsx(Loader2, { size: 16, className: "animate-spin" }),
        " ",
        t("auth_processing", "Memproses...")
      ] }) : /* @__PURE__ */ jsxs("span", { className: "flex items-center justify-center gap-2", children: [
        currentPlanMeta.icon,
        isRenewal ? t("upgrade_renew", "Perpanjang") : t("upgrade_to", "Upgrade ke"),
        " ",
        tPlan(selectedPlan),
        /* @__PURE__ */ jsx("span", { className: "opacity-60", children: "·" }),
        total ? formatIDR(total) : "—"
      ] })
    }
  );
  const addonLink = /* @__PURE__ */ jsxs(
    "button",
    {
      onClick: () => navigate("/dashboard/addons"),
      className: "w-full flex items-center justify-between p-3 rounded-xl",
      style: { background: "rgba(168,85,247,0.04)", border: "1px solid rgba(168,85,247,0.12)" },
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Building2, { size: 14, color: "#A855F7" }),
          /* @__PURE__ */ jsx("span", { className: "text-[12px] text-[#64748B]", children: t("upgrade_need_more_biz_slots", "Butuh slot bisnis tambahan?") })
        ] }),
        /* @__PURE__ */ jsx("span", { className: "text-[11px] font-bold text-purple-400", children: t("upgrade_start_from_idr", "Mulai Rp 150rb →") })
      ]
    }
  );
  const heroBadges = /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-3 flex-wrap", children: [
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
        style: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#4B6478" },
        children: [
          t("upgrade_active_plan", "Plan aktif:"),
          " ",
          /* @__PURE__ */ jsx("span", { className: "text-emerald-400", children: tPlan(((_g = sub.label) == null ? void 0 : _g.toLowerCase()) || "starter") })
        ]
      }
    ),
    sub.status === "trial" && /* @__PURE__ */ jsxs(
      "div",
      {
        className: "inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black",
        style: { background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#818CF8" },
        children: [
          /* @__PURE__ */ jsx(Clock, { size: 9 }),
          " ",
          t("upgrade_trial_active", "Trial aktif")
        ]
      }
    )
  ] });
  const billingSelector = /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
      /* @__PURE__ */ jsx("p", { className: "text-[11px] font-bold text-[#4B6478] uppercase tracking-widest", children: t("upgrade_sub_duration", "Durasi Berlangganan") }),
      discount > 0 && /* @__PURE__ */ jsx("span", { className: "text-[11px] font-black text-emerald-400", children: t("upgrade_save_percent", "Hemat {discount}% ✓").replace("{discount}", discount) })
    ] }),
    /* @__PURE__ */ jsx(BillingSelector, { value: billingMonths, onChange: setBillingMonths })
  ] });
  const ambientGlow = /* @__PURE__ */ jsx(
    "div",
    {
      className: "pointer-events-none fixed inset-0 transition-all duration-700",
      style: {
        background: selectedPlan === "pro" ? "radial-gradient(ellipse 60% 40% at 50% -10%, rgba(2, 26, 2,0.1) 0%, transparent 70%)" : "radial-gradient(ellipse 60% 40% at 50% -10%, rgba(245,158,11,0.1) 0%, transparent 70%)"
      }
    }
  );
  if (isDesktop) {
    return /* @__PURE__ */ jsxs("div", { className: "min-h-screen", style: { background: "#06090F" }, children: [
      ambientGlow,
      /* @__PURE__ */ jsxs("div", { className: "relative max-w-5xl mx-auto px-8 pt-8 pb-12", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-8", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => navigate(-1),
                className: "flex items-center gap-2 text-[13px] font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/5 hover:border-white/10 transition-all active:scale-[0.98]",
                children: [
                  /* @__PURE__ */ jsx(ArrowLeft, { size: 14 }),
                  " ",
                  t("common.back", "Kembali")
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => navigate("/dashboard"),
                className: "flex items-center gap-2 text-[13px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/15 px-4 py-2 rounded-xl border border-emerald-500/10 hover:border-emerald-500/20 transition-all active:scale-[0.98]",
                children: [
                  /* @__PURE__ */ jsx(Building2, { size: 14 }),
                  " ",
                  t("Dashboard", "Dashboard")
                ]
              }
            )
          ] }),
          heroBadges
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
          /* @__PURE__ */ jsx("h1", { className: "font-display font-black text-4xl text-white leading-tight mb-2", children: isRenewal ? t("upgrade_renew_plan_title", "Perpanjang Plan") : t("upgrade_upgrade_plan_title", "Upgrade Plan") }),
          /* @__PURE__ */ jsx("p", { className: "text-[14px] text-[#4B6478]", children: t("upgrade_hero_desc", "{vertical} · Pilih plan & durasi, harga berubah otomatis").replace("{vertical}", roleFeatures.label) })
        ] }),
        paymentBanner,
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[1fr_360px] gap-8 items-start", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
            billingSelector,
            planCards,
            trialBlock,
            featureSections,
            addonLink
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "sticky top-8 space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mb-3", children: t("upgrade_order_summary", "Ringkasan Pesanan") }),
              priceSummary
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              ctaButton,
              /* @__PURE__ */ jsx("p", { className: "text-center text-[10px] text-[#2A3F52] mt-2", children: t("upgrade_secure_payment_footer", "Pembayaran aman via Midtrans · Aktif hingga {date}").replace("{date}", newExpiryStr) })
            ] })
          ] })
        ] })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen", style: { background: "#06090F" }, children: [
    ambientGlow,
    /* @__PURE__ */ jsxs("div", { className: "relative max-w-lg mx-auto px-4 pt-6 pb-36", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-6", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => navigate(-1),
            className: "flex items-center gap-2 text-[13px] font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/5 hover:border-white/10 transition-all active:scale-[0.98]",
            children: [
              /* @__PURE__ */ jsx(ArrowLeft, { size: 14 }),
              " ",
              t("common.back", "Kembali")
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => navigate("/dashboard"),
            className: "flex items-center gap-2 text-[13px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/15 px-4 py-2 rounded-xl border border-emerald-500/10 hover:border-emerald-500/20 transition-all active:scale-[0.98]",
            children: [
              /* @__PURE__ */ jsx(Building2, { size: 14 }),
              " ",
              t("Dashboard", "Dashboard")
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
        heroBadges,
        /* @__PURE__ */ jsx("h1", { className: "font-display font-black text-[26px] text-white leading-tight mb-1", children: isRenewal ? t("upgrade_renew_plan_title", "Perpanjang Plan") : t("upgrade_upgrade_plan_title", "Upgrade Plan") }),
        /* @__PURE__ */ jsx("p", { className: "text-[13px] text-[#4B6478]", children: t("upgrade_hero_desc", "{vertical} · Pilih plan & durasi, harga berubah otomatis").replace("{vertical}", roleFeatures.label) })
      ] }),
      paymentBanner,
      /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
        billingSelector,
        planCards,
        trialBlock,
        featureSections,
        priceSummary,
        addonLink
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      "div",
      {
        className: "fixed bottom-0 left-0 right-0 p-4",
        style: { background: "linear-gradient(to top, #06090F 65%, transparent)", backdropFilter: "blur(12px)" },
        children: /* @__PURE__ */ jsxs("div", { className: "max-w-lg mx-auto", children: [
          ctaButton,
          /* @__PURE__ */ jsx("p", { className: "text-center text-[10px] text-[#2A3F52] mt-2", children: t("upgrade_secure_payment_footer", "Pembayaran aman via Midtrans · Aktif hingga {date}").replace("{date}", newExpiryStr) })
        ] })
      }
    )
  ] });
}
export {
  UpgradePlan as default
};
