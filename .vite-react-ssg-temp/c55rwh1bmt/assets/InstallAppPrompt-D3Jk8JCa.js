import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Building2, X } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { u as useAuth, r as resolveBusinessVertical, d as BUSINESS_MODELS, e as getBrokerBasePath, g as getSubscriptionStatus } from "../main.mjs";
function BusinessNameWarningBanner() {
  const { tenant, profile } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  const rawName = (tenant == null ? void 0 : tenant.business_name) || "";
  const isDefaultName = !rawName || rawName.toLowerCase().trim() === "bisnis saya" || rawName.toLowerCase().trim() === "my business" || rawName.trim().length < 3;
  if (!isDefaultName || dismissed || !tenant) return null;
  const vertical = resolveBusinessVertical(profile, tenant);
  const model = BUSINESS_MODELS[vertical];
  const getAkunPath = () => {
    var _a;
    if ((model == null ? void 0 : model.category) === "peternak") {
      return `/peternak/${(tenant == null ? void 0 : tenant.sub_type) || "peternak_broiler"}/akun`;
    }
    if ((model == null ? void 0 : model.category) === "rumah_potong") {
      const rpType = ((_a = tenant == null ? void 0 : tenant.sub_type) == null ? void 0 : _a.startsWith("rpa")) ? "rpa" : "rph";
      return `/rumah_potong/${rpType}/akun`;
    }
    return `${getBrokerBasePath(tenant)}/akun`;
  };
  return /* @__PURE__ */ jsx(AnimatePresence, { children: /* @__PURE__ */ jsx(
    motion.div,
    {
      initial: { opacity: 0, y: -12, height: 0 },
      animate: { opacity: 1, y: 0, height: "auto" },
      exit: { opacity: 0, y: -12, height: 0 },
      transition: { duration: 0.3, ease: "easeOut" },
      className: "overflow-hidden",
      children: /* @__PURE__ */ jsxs("div", { className: "mx-4 md:mx-5 mb-3 relative flex items-start gap-3 p-4 rounded-2xl border border-amber-500/25 bg-amber-500/5 backdrop-blur-sm", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 rounded-2xl bg-amber-500/[0.03] pointer-events-none" }),
        /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5", children: /* @__PURE__ */ jsx(AlertTriangle, { size: 15, className: "text-amber-400" }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0 relative z-10", children: [
          /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] mb-0.5", children: "Nama Bisnis Belum Diisi" }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm font-bold text-[#F1F5F9] leading-snug", children: [
            "Bisnis kamu masih menggunakan nama default.",
            " ",
            /* @__PURE__ */ jsx("span", { className: "text-amber-400", children: "Lengkapi nama bisnis" }),
            " agar transaksi dapat tercatat dengan benar."
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mt-2.5", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => navigate(getAkunPath()),
                className: "px-3 py-1.5 rounded-xl bg-amber-500 text-[#0C1319] text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 active:scale-95 transition-all shadow-md shadow-amber-500/20",
                children: [
                  /* @__PURE__ */ jsx(Building2, { size: 10, className: "inline mr-1 -mt-0.5" }),
                  "Isi Nama Bisnis"
                ]
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setDismissed(true),
                className: "px-3 py-1.5 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-[#4B6478] hover:text-white hover:border-white/20 active:scale-95 transition-all",
                children: "Nanti Saja"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setDismissed(true),
            className: "shrink-0 w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#4B6478] hover:text-white transition-all relative z-10",
            children: /* @__PURE__ */ jsx(X, { size: 11 })
          }
        )
      ] })
    },
    "business-name-warning-banner"
  ) });
}
function PlanExpiryBanner({ tenant }) {
  const sub = getSubscriptionStatus(tenant);
  if (sub.plan === "starter" || !sub.isExpiringSoon && sub.status !== "expired") return null;
  const isExpired = sub.status === "expired";
  const bg = isExpired ? "rgba(239,68,68,0.1)" : "rgba(251,191,36,0.08)";
  const border = isExpired ? "rgba(239,68,68,0.25)" : "rgba(251,191,36,0.2)";
  const color = isExpired ? "#F87171" : "#FBBF24";
  return /* @__PURE__ */ jsxs("div", { style: {
    background: bg,
    borderBottom: `1px solid ${border}`,
    padding: "8px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px"
  }, children: [
    /* @__PURE__ */ jsx("p", { style: { fontSize: "12px", fontWeight: 700, color, margin: 0 }, children: isExpired ? "⚠️ Langganan kamu sudah berakhir. Beberapa fitur terkunci." : `⏰ Langganan berakhir dalam ${sub.daysLeft} hari.` }),
    /* @__PURE__ */ jsx(
      Link,
      {
        to: "/upgrade",
        style: {
          fontSize: "11px",
          fontWeight: 900,
          color,
          border: `1px solid ${color}`,
          borderRadius: "8px",
          padding: "3px 10px",
          whiteSpace: "nowrap",
          textDecoration: "none",
          background: isExpired ? "rgba(239,68,68,0.08)" : "rgba(251,191,36,0.08)"
        },
        children: "Perpanjang →"
      }
    )
  ] });
}
const DISMISSED_KEY = "ternakos-install-dismissed";
function InstallAppPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    if (isStandalone) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const safari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (ios && safari) {
      setIsIOS(true);
      setVisible(true);
      return;
    }
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
    if (outcome === "dismissed") {
      localStorage.setItem(DISMISSED_KEY, "1");
    }
  };
  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  };
  if (!visible) return null;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      role: "banner",
      className: "fixed bottom-[84px] left-3 right-3 lg:bottom-6 lg:left-auto lg:right-5 lg:max-w-xs z-[70]\n                 bg-[#0C1319] border border-white/10 rounded-2xl shadow-2xl p-3.5 flex items-start gap-3",
      children: [
        /* @__PURE__ */ jsx(
          "img",
          {
            src: "/icons/icon-192.png",
            alt: "TernakOS",
            className: "w-10 h-10 rounded-xl flex-shrink-0 mt-0.5"
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-white leading-tight", children: "Install TernakOS" }),
          isIOS ? /* @__PURE__ */ jsxs("p", { className: "text-xs text-[#94A3B8] mt-1 leading-relaxed", children: [
            "Buka Safari → ketuk ",
            /* @__PURE__ */ jsx("strong", { className: "text-[#CBD5E1]", children: "Share" }),
            " →",
            " ",
            /* @__PURE__ */ jsx("strong", { className: "text-[#CBD5E1]", children: "Add to Home Screen" })
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs text-[#94A3B8] mt-0.5", children: "Akses lebih cepat dari home screen" }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: handleInstall,
                className: "mt-2 px-3 py-1.5 bg-green-700 hover:bg-green-600 active:bg-green-800\n                         text-white text-xs font-medium rounded-lg transition-colors",
                children: "Install"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleDismiss,
            "aria-label": "Tutup",
            className: "flex-shrink-0 mt-0.5 text-[#64748B] hover:text-[#CBD5E1] transition-colors p-0.5",
            children: /* @__PURE__ */ jsx(X, { size: 16 })
          }
        )
      ]
    }
  );
}
export {
  BusinessNameWarningBanner as B,
  InstallAppPrompt as I,
  PlanExpiryBanner as P
};
