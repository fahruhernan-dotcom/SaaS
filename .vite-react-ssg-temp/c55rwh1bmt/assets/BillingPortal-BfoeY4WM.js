import { jsx, jsxs } from "react/jsx-runtime";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, RefreshCw, CreditCard, AlertCircle, Building2, XCircle, Clock, CheckCircle2 } from "lucide-react";
import { u as useAuth, a_ as useLanguage, aq as formatIDR, s as supabase, g as getSubscriptionStatus } from "../main.mjs";
import { format } from "date-fns";
import { enUS, id } from "date-fns/locale";
import "vite-react-ssg";
import "react";
import "framer-motion";
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
const BG = "#06090F";
const SURFACE = "rgba(255,255,255,0.04)";
const HAIRLINE = "rgba(255,255,255,0.07)";
const TEXT = "#E2E8F0";
const TEXT_DIM = "#64748B";
const TEXT_MUTE = "#2A3F52";
const INVOICE_STATUS = {
  paid: { label: "Lunas", color: "#021a02", bg: "rgba(2, 26, 2,0.12)", icon: /* @__PURE__ */ jsx(CheckCircle2, { size: 13 }) },
  pending: { label: "Menunggu", color: "#F59E0B", bg: "rgba(245,158,11,0.12)", icon: /* @__PURE__ */ jsx(Clock, { size: 13 }) },
  expired: { label: "Kedaluwarsa", color: "#64748B", bg: "rgba(100,116,139,0.12)", icon: /* @__PURE__ */ jsx(XCircle, { size: 13 }) },
  cancelled: { label: "Dibatalkan", color: "#F87171", bg: "rgba(248,113,113,0.12)", icon: /* @__PURE__ */ jsx(XCircle, { size: 13 }) }
};
function useTenantInvoices(tenantIds) {
  return useQuery({
    queryKey: ["billing-invoices", tenantIds],
    enabled: tenantIds.length > 0,
    staleTime: 3e4,
    queryFn: async () => {
      const { data, error } = await supabase.from("subscription_invoices").select("id, invoice_number, tenant_id, plan, billing_months, amount, status, provider_status, paid_at, created_at").in("tenant_id", tenantIds).order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data || [];
    }
  });
}
function PlanChip({ tenant }) {
  const { lang, tPlan, t } = useLanguage();
  const activeLocale = lang === "en" ? enUS : id;
  const sub = getSubscriptionStatus(tenant);
  const colors = {
    active: { color: "#021a02", bg: "rgba(2, 26, 2,0.12)", border: "rgba(2, 26, 2,0.25)" },
    trial: { color: "#818CF8", bg: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.25)" },
    expired: { color: "#F87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.25)" },
    unknown: { color: TEXT_DIM, bg: SURFACE, border: HAIRLINE }
  };
  const c = colors[sub.status] || colors.unknown;
  const expiryStr = sub.expiresAt ? format(sub.expiresAt, "d MMM yyyy", { locale: activeLocale }) : null;
  return /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }, children: [
    /* @__PURE__ */ jsx("span", { style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      padding: "3px 10px",
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 800,
      background: c.bg,
      border: `1px solid ${c.border}`,
      color: c.color
    }, children: tPlan(sub.label) }),
    expiryStr && /* @__PURE__ */ jsxs("span", { style: { fontSize: 10, color: TEXT_MUTE }, children: [
      sub.status === "expired" ? t("billing_expired", "Expired") : t("billing_until", "hingga"),
      " ",
      expiryStr
    ] })
  ] });
}
function TenantCard({ tenant, onUpgrade }) {
  const { t, tVertical } = useLanguage();
  return /* @__PURE__ */ jsxs("div", { style: {
    padding: "14px 16px",
    borderRadius: 14,
    background: SURFACE,
    border: `1px solid ${HAIRLINE}`,
    display: "flex",
    alignItems: "center",
    gap: 12
  }, children: [
    /* @__PURE__ */ jsx("div", { style: {
      width: 38,
      height: 38,
      borderRadius: 10,
      flexShrink: 0,
      background: "rgba(2, 26, 2,0.12)",
      border: "1px solid rgba(2, 26, 2,0.2)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }, children: /* @__PURE__ */ jsx(Building2, { size: 17, color: "#021a02" }) }),
    /* @__PURE__ */ jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
      /* @__PURE__ */ jsx("p", { style: { fontSize: 13, fontWeight: 700, color: TEXT, margin: 0, lineHeight: 1.3 }, children: tenant.business_name || t("index_fallback_biz", "Bisnis Saya") }),
      /* @__PURE__ */ jsx("p", { style: { fontSize: 11, color: TEXT_DIM, margin: 0, marginTop: 2 }, children: tVertical(tenant.business_vertical) || "—" })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }, children: [
      /* @__PURE__ */ jsx(PlanChip, { tenant }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => onUpgrade(tenant),
          style: {
            fontSize: 10,
            fontWeight: 800,
            color: "#021a02",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 0
          },
          children: t("billing_manage_btn", "Kelola →")
        }
      )
    ] })
  ] });
}
function InvoiceRow({ invoice, tenantMap }) {
  const { t, tStatus, tPlan, lang } = useLanguage();
  const activeLocale = lang === "en" ? enUS : id;
  const s = INVOICE_STATUS[invoice.status] || INVOICE_STATUS.pending;
  const dateStr = invoice.paid_at || invoice.created_at;
  const date = dateStr ? format(new Date(dateStr), "d MMM yyyy", { locale: activeLocale }) : "—";
  const tenantName = tenantMap[invoice.tenant_id] || "—";
  const statusLabel = tStatus(invoice.status);
  return /* @__PURE__ */ jsxs("div", { style: {
    padding: "12px 16px",
    borderBottom: `1px solid ${HAIRLINE}`,
    display: "flex",
    alignItems: "center",
    gap: 12
  }, children: [
    /* @__PURE__ */ jsx("div", { style: {
      width: 32,
      height: 32,
      borderRadius: 9,
      flexShrink: 0,
      background: s.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: s.color
    }, children: s.icon }),
    /* @__PURE__ */ jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
      /* @__PURE__ */ jsx("p", { style: { fontSize: 12, fontWeight: 700, color: TEXT, margin: 0 }, children: invoice.invoice_number }),
      /* @__PURE__ */ jsxs("p", { style: { fontSize: 10, color: TEXT_DIM, margin: 0, marginTop: 1 }, children: [
        tenantName,
        " · ",
        tPlan(invoice.plan),
        " ",
        t("billing_months_count_unit", "{months} bln").replace("{months}", invoice.billing_months),
        " · ",
        date
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }, children: [
      /* @__PURE__ */ jsx("span", { style: { fontSize: 12, fontWeight: 800, color: TEXT }, children: formatIDR(invoice.amount) }),
      /* @__PURE__ */ jsx("span", { style: {
        fontSize: 10,
        fontWeight: 700,
        color: s.color,
        background: s.bg,
        padding: "2px 7px",
        borderRadius: 999
      }, children: statusLabel })
    ] })
  ] });
}
function BillingPortal() {
  const navigate = useNavigate();
  const { profiles, isSuperadmin } = useAuth();
  const { t, tPlan } = useLanguage();
  const ownedTenants = profiles.filter((p) => p.role === "owner" && p.tenants).map((p) => p.tenants).filter((t2, i, arr) => arr.findIndex((x) => x.id === t2.id) === i);
  const tenantIds = ownedTenants.map((t2) => t2.id);
  const tenantMap = Object.fromEntries(ownedTenants.map((t2) => [t2.id, t2.business_name || t2("index_fallback_biz", "Bisnis Saya")]));
  const { data: invoices = [], isLoading, refetch } = useTenantInvoices(tenantIds);
  const paidInvoices = invoices.filter((i) => i.status === "paid");
  const pendingInvoices = invoices.filter((i) => i.status === "pending");
  const otherInvoices = invoices.filter((i) => !["paid", "pending"].includes(i.status));
  const orderedInvoices = [...pendingInvoices, ...paidInvoices, ...otherInvoices];
  const totalSpent = paidInvoices.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  return /* @__PURE__ */ jsx("div", { style: { minHeight: "100vh", background: BG, color: TEXT, fontFamily: "Sora, sans-serif" }, children: /* @__PURE__ */ jsxs("div", { style: { maxWidth: 560, margin: "0 auto", padding: "0 0 40px" }, children: [
    /* @__PURE__ */ jsxs("div", { style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "16px 20px",
      borderBottom: `1px solid ${HAIRLINE}`,
      position: "sticky",
      top: 0,
      zIndex: 10,
      background: BG
    }, children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => navigate(-1),
          style: { background: "none", border: "none", color: TEXT_DIM, cursor: "pointer", padding: 4, display: "flex" },
          children: /* @__PURE__ */ jsx(ArrowLeft, { size: 20 })
        }
      ),
      /* @__PURE__ */ jsxs("div", { style: { flex: 1 }, children: [
        /* @__PURE__ */ jsx("h1", { style: { margin: 0, fontSize: 16, fontWeight: 800, color: TEXT }, children: t("billing_portal_title", "Billing & Langganan") }),
        /* @__PURE__ */ jsx("p", { style: { margin: 0, fontSize: 11, color: TEXT_DIM }, children: t("billing_portal_subtitle", "Kelola paket dan riwayat pembayaran") })
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => refetch(),
          style: { background: "none", border: "none", color: TEXT_DIM, cursor: "pointer", padding: 4, display: "flex" },
          title: "Refresh",
          children: /* @__PURE__ */ jsx(RefreshCw, { size: 16 })
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { padding: "0 16px" }, children: [
      !isSuperadmin && /* @__PURE__ */ jsxs("div", { style: {
        margin: "16px 0",
        padding: "14px 16px",
        borderRadius: 14,
        background: "rgba(2, 26, 2,0.06)",
        border: "1px solid rgba(2, 26, 2,0.15)",
        display: "flex",
        gap: 0
      }, children: [
        /* @__PURE__ */ jsxs("div", { style: { flex: 1, textAlign: "center", borderRight: `1px solid ${HAIRLINE}` }, children: [
          /* @__PURE__ */ jsx("p", { style: { margin: 0, fontSize: 18, fontWeight: 900, color: "#021a02" }, children: ownedTenants.length }),
          /* @__PURE__ */ jsx("p", { style: { margin: 0, fontSize: 10, color: TEXT_DIM }, children: t("billing_business", "Bisnis") })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { flex: 1, textAlign: "center", borderRight: `1px solid ${HAIRLINE}` }, children: [
          /* @__PURE__ */ jsx("p", { style: { margin: 0, fontSize: 18, fontWeight: 900, color: TEXT }, children: paidInvoices.length }),
          /* @__PURE__ */ jsx("p", { style: { margin: 0, fontSize: 10, color: TEXT_DIM }, children: t("billing_paid_invoices", "Invoice Lunas") })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { flex: 1, textAlign: "center" }, children: [
          /* @__PURE__ */ jsx("p", { style: { margin: 0, fontSize: 14, fontWeight: 900, color: TEXT }, children: formatIDR(totalSpent) }),
          /* @__PURE__ */ jsx("p", { style: { margin: 0, fontSize: 10, color: TEXT_DIM }, children: t("billing_total_paid", "Total Dibayar") })
        ] })
      ] }),
      /* @__PURE__ */ jsx("p", { style: { fontSize: 11, fontWeight: 800, color: TEXT_MUTE, letterSpacing: "0.08em", textTransform: "uppercase", margin: "20px 0 10px" }, children: t("billing_my_businesses", "Bisnis Saya") }),
      ownedTenants.length === 0 ? /* @__PURE__ */ jsx("div", { style: { textAlign: "center", padding: "24px 0", color: TEXT_DIM, fontSize: 13 }, children: t("billing_no_business", "Tidak ada bisnis yang ditemukan") }) : /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: ownedTenants.map((t2) => /* @__PURE__ */ jsx(
        TenantCard,
        {
          tenant: t2,
          onUpgrade: () => navigate("/upgrade")
        },
        t2.id
      )) }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => navigate("/upgrade"),
          style: {
            width: "100%",
            marginTop: 12,
            padding: "12px 16px",
            borderRadius: 12,
            border: "1px dashed rgba(2, 26, 2,0.3)",
            background: "transparent",
            color: "#021a02",
            fontSize: 12,
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6
          },
          children: [
            /* @__PURE__ */ jsx(CreditCard, { size: 14 }),
            t("billing_upgrade_renew_btn", "Upgrade / Perpanjang Paket")
          ]
        }
      ),
      /* @__PURE__ */ jsx("p", { style: { fontSize: 11, fontWeight: 800, color: TEXT_MUTE, letterSpacing: "0.08em", textTransform: "uppercase", margin: "24px 0 0" }, children: t("billing_payment_history", "Riwayat Pembayaran") }),
      isLoading ? /* @__PURE__ */ jsx("div", { style: { textAlign: "center", padding: "32px 0", color: TEXT_DIM, fontSize: 13 }, children: t("billing_loading", "Memuat data...") }) : orderedInvoices.length === 0 ? /* @__PURE__ */ jsx("div", { style: { textAlign: "center", padding: "32px 0", color: TEXT_MUTE, fontSize: 13 }, children: t("billing_no_history", "Belum ada riwayat pembayaran") }) : /* @__PURE__ */ jsx("div", { style: {
        marginTop: 10,
        borderRadius: 14,
        overflow: "hidden",
        border: `1px solid ${HAIRLINE}`,
        background: SURFACE
      }, children: orderedInvoices.map((inv, i) => /* @__PURE__ */ jsx(
        InvoiceRow,
        {
          invoice: inv,
          tenantMap,
          isLast: i === orderedInvoices.length - 1
        },
        inv.id
      )) }),
      pendingInvoices.length > 0 && /* @__PURE__ */ jsxs("div", { style: {
        marginTop: 12,
        padding: "12px 14px",
        borderRadius: 12,
        background: "rgba(245,158,11,0.08)",
        border: "1px solid rgba(245,158,11,0.2)",
        display: "flex",
        gap: 10,
        alignItems: "flex-start"
      }, children: [
        /* @__PURE__ */ jsx(AlertCircle, { size: 14, color: "#F59E0B", style: { flexShrink: 0, marginTop: 1 } }),
        /* @__PURE__ */ jsxs("p", { style: { margin: 0, fontSize: 11, color: "#F59E0B", lineHeight: 1.5 }, children: [
          /* @__PURE__ */ jsx("span", { dangerouslySetInnerHTML: {
            __html: t("billing_pending_invoices_alert", "Kamu punya <strong>{count} invoice pending</strong> yang belum dibayar.").replace("{count}", pendingInvoices.length)
          } }),
          " ",
          /* @__PURE__ */ jsx(
            "span",
            {
              onClick: () => navigate("/upgrade"),
              style: { textDecoration: "underline", cursor: "pointer" },
              children: t("billing_pay_now", "Bayar sekarang →")
            }
          )
        ] })
      ] })
    ] })
  ] }) });
}
export {
  BillingPortal as default
};
