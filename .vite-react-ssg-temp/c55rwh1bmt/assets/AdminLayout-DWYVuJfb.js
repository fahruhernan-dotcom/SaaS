import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useLocation, Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import { c as useMediaQuery, b as useForceDarkMode, bn as ErrorBoundary, u as useAuth, a1 as cn, s as supabase, aH as getXBasePath } from "../main.mjs";
import { Home, Users, CreditCard, Tag, Activity, Settings, Info, HelpCircle, Shield, ArrowLeft, LogOut, Bird, LayoutGrid, ChevronRight } from "lucide-react";
import "vite-react-ssg";
import "framer-motion";
import "@tanstack/react-query";
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
import "recharts";
import "@radix-ui/react-tabs";
import "@radix-ui/react-collapsible";
import "@radix-ui/react-select";
const PRIMARY_NAV = [
  { label: "Overview", shortLabel: "Overview", icon: Home, path: "/admin" },
  { label: "Users & Tenant", shortLabel: "Users", icon: Users, path: "/admin/users" },
  { label: "Subscriptions", shortLabel: "Billing", icon: CreditCard, path: "/admin/subscriptions" },
  { label: "Pricing", shortLabel: "Pricing", icon: Tag, path: "/admin/pricing" }
];
const SECONDARY_NAV = [
  { label: "Activity Log", shortLabel: "Activity", icon: Activity, path: "/admin/activity" },
  { label: "Settings", shortLabel: "Settings", icon: Settings, path: "/admin/settings" },
  { label: "System Info", shortLabel: "Info", icon: Info, path: "/admin/info" },
  { label: "Support", shortLabel: "Help", icon: HelpCircle, path: "/admin/help" }
];
const ALL_NAV_ITEMS = [...PRIMARY_NAV, ...SECONDARY_NAV];
function useAdminNav() {
  const { user, switchTenant } = useAuth();
  const navigate = useNavigate();
  const handleBackToDashboard = async () => {
    var _a;
    try {
      const { data } = await supabase.from("profiles").select("tenant_id, tenants(id, sub_type, business_name, business_vertical)").eq("auth_user_id", user.id);
      const target = (_a = data == null ? void 0 : data.find((p) => p.tenants)) == null ? void 0 : _a.tenants;
      if (!target) {
        navigate("/broker/broker_ayam/beranda");
        return;
      }
      localStorage.setItem("ternakos_active_tenant_id", target.id);
      switchTenant(target.id);
      await new Promise((r) => setTimeout(r, 100));
      navigate(getXBasePath(target, null) + "/beranda");
    } catch {
      navigate("/broker/broker_ayam/beranda");
    }
  };
  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: "local" });
    navigate("/login");
  };
  return { handleBackToDashboard, handleLogout };
}
function AdminSidebar() {
  var _a;
  const { profile } = useAuth();
  const location = useLocation();
  const { handleBackToDashboard, handleLogout } = useAdminNav();
  return /* @__PURE__ */ jsxs("aside", { className: "fixed top-0 left-0 bottom-0 w-[240px] bg-[#0C1319] border-r border-white/8 flex flex-col z-50", children: [
    /* @__PURE__ */ jsx("div", { className: "p-6 pb-4 border-b border-white/5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsx("img", { src: "/logo.png", alt: "TernakOS", className: "w-8 h-8 rounded-lg" }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "font-display font-black text-sm text-white tracking-tight uppercase leading-none", children: "TernakOS" }),
        /* @__PURE__ */ jsx("p", { className: "text-[9px] font-bold text-emerald-400 uppercase tracking-[0.2em] mt-0.5", children: "Admin Panel" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("nav", { className: "flex-1 p-3 space-y-1 overflow-y-auto", children: [
      /* @__PURE__ */ jsx("p", { className: "text-[9px] font-black text-[#4B6478] uppercase tracking-[0.2em] px-3 pt-3 pb-2", children: "Menu" }),
      ALL_NAV_ITEMS.map((item) => {
        const isActive = item.path === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(item.path);
        return /* @__PURE__ */ jsxs(
          NavLink,
          {
            to: item.path,
            className: cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-[12px] font-black uppercase tracking-[0.15em] transition-all group relative overflow-hidden",
              isActive ? "bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent text-emerald-400" : "text-[#4B6478] hover:text-white hover:bg-white/[0.03]"
            ),
            children: [
              isActive && /* @__PURE__ */ jsx("div", { className: "absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-emerald-400 rounded-full" }),
              /* @__PURE__ */ jsx(
                item.icon,
                {
                  size: 18,
                  strokeWidth: isActive ? 3 : 2,
                  className: cn(
                    "transition-all duration-300",
                    isActive ? "scale-110 drop-shadow-[0_0_8px_rgba(2, 26, 2,0.4)]" : "opacity-50 group-hover:opacity-100"
                  )
                }
              ),
              /* @__PURE__ */ jsx("span", { className: "relative z-10", children: item.label })
            ]
          },
          item.path
        );
      })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "p-4 border-t border-white/5 space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 px-2", children: [
        /* @__PURE__ */ jsx(Shield, { size: 14, className: "text-emerald-400 shrink-0" }),
        /* @__PURE__ */ jsx("span", { className: "text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em]", children: "Superadmin" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 px-2", children: [
        /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center", children: /* @__PURE__ */ jsx("span", { className: "font-display font-black text-emerald-400 text-[11px] uppercase", children: ((_a = profile == null ? void 0 : profile.full_name) == null ? void 0 : _a.substring(0, 2)) || "SA" }) }),
        /* @__PURE__ */ jsx("div", { className: "flex-1 min-w-0", children: /* @__PURE__ */ jsx("p", { className: "text-[11px] font-bold text-white truncate", children: (profile == null ? void 0 : profile.full_name) || "Superadmin" }) })
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: handleBackToDashboard,
          className: "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold bg-white/5 text-[#94A3B8] hover:text-white hover:bg-white/10 transition-all uppercase tracking-wider",
          children: [
            /* @__PURE__ */ jsx(ArrowLeft, { size: 14 }),
            /* @__PURE__ */ jsx("span", { children: "Kembali ke Dashboard" })
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: handleLogout,
          className: "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold text-[#4B6478] hover:text-red-400 hover:bg-red-500/5 transition-all uppercase tracking-wider",
          children: [
            /* @__PURE__ */ jsx(LogOut, { size: 14 }),
            /* @__PURE__ */ jsx("span", { children: "Logout" })
          ]
        }
      )
    ] })
  ] });
}
function AdminTopBar({ onOpenMenu }) {
  var _a;
  const { profile } = useAuth();
  const location = useLocation();
  const currentPage = ALL_NAV_ITEMS.find(
    (item) => item.path === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(item.path)
  );
  return /* @__PURE__ */ jsx("header", { className: "fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[1440px] z-50 transition-all duration-500 pt-[env(safe-area-inset-top)]", children: /* @__PURE__ */ jsx("div", { className: "mx-2 lg:mx-6 mt-2", children: /* @__PURE__ */ jsxs("div", { className: "h-14 lg:h-16 bg-[#0B1218]/80 backdrop-blur-xl border border-white/8 rounded-2xl lg:rounded-3xl flex items-center justify-between px-3 lg:px-6 shadow-2xl shadow-black/50", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 lg:gap-4", children: [
      /* @__PURE__ */ jsx("div", { className: "w-9 h-9 lg:w-11 lg:h-11 rounded-xl lg:rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform", children: /* @__PURE__ */ jsx(Bird, { className: "text-white w-5 h-5 lg:w-6 lg:h-6" }) }),
      /* @__PURE__ */ jsxs("div", { className: "hidden lg:block", children: [
        /* @__PURE__ */ jsx("p", { className: "font-display font-black text-[10px] text-emerald-400 uppercase tracking-[0.2em] leading-none mb-1", children: "TernakOS" }),
        /* @__PURE__ */ jsxs("p", { className: "font-display font-bold text-lg text-white leading-none tracking-tight", children: [
          "Admin",
          /* @__PURE__ */ jsx("span", { className: "text-emerald-500", children: "Suite" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "lg:hidden pr-4 border-r border-white/5", children: [
        /* @__PURE__ */ jsx("p", { className: "font-display font-black text-[8px] text-emerald-500/60 uppercase tracking-[0.18em] leading-none", children: "Admin Panel" }),
        /* @__PURE__ */ jsx("p", { className: "font-display font-bold text-[13px] text-white leading-tight mt-0.5 tracking-tight", children: (currentPage == null ? void 0 : currentPage.label) || "Dashboard" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 shrink-0", children: [
        /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" }),
        /* @__PURE__ */ jsx("span", { className: "text-[9px] font-black text-emerald-400 uppercase tracking-widest", children: "LIVE" })
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: onOpenMenu,
          className: "w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center active:scale-90 transition-transform relative overflow-hidden group shadow-lg",
          children: [
            /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-600/10 opacity-0 group-hover:opacity-100 transition-opacity" }),
            /* @__PURE__ */ jsx("span", { className: "font-display font-black text-emerald-400 text-[10px] uppercase relative z-10", children: ((_a = profile == null ? void 0 : profile.full_name) == null ? void 0 : _a.substring(0, 2)) || "SA" })
          ]
        }
      )
    ] })
  ] }) }) });
}
function AdminBottomNav({ onOpenMenu }) {
  const location = useLocation();
  return /* @__PURE__ */ jsx("nav", { className: "fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[1440px] z-40 p-2 lg:p-6 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:pb-6 pointer-events-none", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md mx-auto h-16 bg-[#0B1218]/90 backdrop-blur-2xl border border-white/10 rounded-2xl flex items-center justify-between px-2 shadow-2xl pointer-events-auto", children: [
    PRIMARY_NAV.map((item) => {
      const isActive = location.pathname === item.path;
      const Icon = item.icon;
      return /* @__PURE__ */ jsxs(
        Link,
        {
          to: item.path,
          className: `flex flex-col items-center justify-center flex-1 h-full rounded-xl transition-all duration-300 gap-1.5 ${isActive ? "text-emerald-400 bg-emerald-500/5" : "text-slate-500 hover:text-white"}`,
          children: [
            /* @__PURE__ */ jsx(Icon, { size: isActive ? 20 : 18, className: isActive ? "drop-shadow-[0_0_8px_rgba(2, 26, 2,0.5)]" : "" }),
            /* @__PURE__ */ jsx("span", { className: `text-[8px] font-black uppercase tracking-[0.1em] ${isActive ? "opacity-100" : "opacity-60"}`, children: item.shortLabel })
          ]
        },
        item.path
      );
    }),
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: onOpenMenu,
        className: "flex flex-col items-center justify-center flex-1 h-full rounded-xl transition-all duration-300 gap-1.5 text-slate-500 hover:text-emerald-400",
        children: /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center active:scale-90 transition-transform", children: /* @__PURE__ */ jsx(LayoutGrid, { size: 18 }) })
      }
    )
  ] }) });
}
function AdminMenuHub({ isOpen, onClose }) {
  var _a, _b;
  const { profile } = useAuth();
  const { handleBackToDashboard, handleLogout } = useAdminNav();
  return /* @__PURE__ */ jsx(Fragment, { children: isOpen && /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-[100] flex flex-col items-center justify-end", children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        className: "absolute inset-0 bg-black/60 backdrop-blur-sm",
        onClick: onClose
      }
    ),
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: "relative mt-auto bg-[#080C10] rounded-t-[2.5rem] border-t border-white/[0.08] p-4 lg:p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] max-w-[480px] w-full mx-auto shadow-[0_-20px_50px_rgba(0,0,0,0.5)]",
        children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-1.5 rounded-full bg-white/10 mx-auto mb-6 active:bg-white/20 transition-colors" }),
          /* @__PURE__ */ jsxs("div", { className: "px-2 mb-6", children: [
            /* @__PURE__ */ jsx("p", { className: "text-[11px] font-black text-emerald-500 uppercase tracking-[0.25em] mb-3", children: "Pusat Navigasi" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/5 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-inner", children: /* @__PURE__ */ jsx("span", { className: "font-display font-black text-emerald-400 text-lg uppercase", children: ((_a = profile == null ? void 0 : profile.full_name) == null ? void 0 : _a.substring(0, 2)) || "SA" }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsxs("h2", { className: "font-display font-black text-xl text-white leading-tight", children: [
                    "Halo, ",
                    ((_b = profile == null ? void 0 : profile.full_name) == null ? void 0 : _b.split(" ")[0]) || "Admin",
                    "!"
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 mt-1 opacity-60", children: [
                    /* @__PURE__ */ jsx(Shield, { size: 10, className: "text-emerald-400" }),
                    /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black text-emerald-400 uppercase tracking-[0.1em]", children: "Superadmin Access" })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsx("button", { onClick: onClose, className: "w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400", children: /* @__PURE__ */ jsx(ChevronRight, { size: 20, className: "rotate-90" }) })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-3 mb-6", children: SECONDARY_NAV.map((item) => /* @__PURE__ */ jsxs(
            Link,
            {
              to: item.path,
              onClick: onClose,
              className: "flex flex-col items-center justify-center p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all group",
              children: [
                /* @__PURE__ */ jsx("div", { className: "w-11 h-11 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20 transition-all duration-300", children: /* @__PURE__ */ jsx(item.icon, { size: 22, className: "text-slate-400 group-hover:text-emerald-400 transition-colors" }) }),
                /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors", children: item.label })
              ]
            },
            item.path
          )) }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => {
                  handleBackToDashboard();
                  onClose();
                },
                className: "w-full flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5 active:scale-[0.98] transition-all",
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(ArrowLeft, { size: 16, className: "text-slate-400" }) }),
                    /* @__PURE__ */ jsxs("div", { className: "text-left", children: [
                      /* @__PURE__ */ jsx("p", { className: "text-sm font-black text-white leading-none", children: "Ke Dashboard" }),
                      /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-500 font-bold mt-1.5 uppercase tracking-wider", children: "Beranda Peternak" })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx(ChevronRight, { size: 16, className: "text-slate-700" })
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => {
                  handleLogout();
                  onClose();
                },
                className: "w-full flex items-center justify-between p-4 rounded-2xl bg-red-500/5 border border-red-500/10 active:scale-[0.98] transition-all group",
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0 group-hover:bg-red-500/20 transition-colors", children: /* @__PURE__ */ jsx(LogOut, { size: 16, className: "text-red-400" }) }),
                    /* @__PURE__ */ jsxs("div", { className: "text-left", children: [
                      /* @__PURE__ */ jsx("p", { className: "text-sm font-black text-red-400 leading-none", children: "Logout Keluar" }),
                      /* @__PURE__ */ jsx("p", { className: "text-[10px] text-red-500/40 font-bold mt-1.5 uppercase tracking-wider", children: "Akhiri Sesi Admin" })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center", children: /* @__PURE__ */ jsx(ChevronRight, { size: 14, className: "text-red-500/30" }) })
                ]
              }
            )
          ] })
        ]
      }
    )
  ] }) });
}
function AdminLayout({ children }) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  useForceDarkMode();
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-[#06090F] selection:bg-emerald-500/30 selection:text-emerald-200 overflow-x-hidden relative", children: [
    /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 overflow-hidden pointer-events-none z-0", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" }),
      /* @__PURE__ */ jsx("div", { className: "absolute bottom-[20%] left-[-5%] w-[30%] h-[30%] bg-purple-500/5 blur-[100px] rounded-full" }),
      /* @__PURE__ */ jsx("div", { className: "absolute top-[40%] left-[10%] w-[20%] h-[20%] bg-blue-500/3 blur-[80px] rounded-full" })
    ] }),
    isDesktop ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(AdminSidebar, {}),
      /* @__PURE__ */ jsx("main", { className: "lg:pl-[240px] pt-[calc(2rem+env(safe-area-inset-top))] pb-[calc(5rem+env(safe-area-inset-bottom))] relative z-10 transition-all duration-500", children: /* @__PURE__ */ jsx("div", { className: "max-w-[1440px] mx-auto px-4 lg:px-8", children: /* @__PURE__ */ jsx("div", { className: "px-2 lg:px-0", children: /* @__PURE__ */ jsx(ErrorBoundary, { children: children || /* @__PURE__ */ jsx(Outlet, {}) }, location.key) }) }) })
    ] }) : /* @__PURE__ */ jsxs("div", { className: "max-w-[480px] mx-auto shadow-2xl relative z-10", children: [
      /* @__PURE__ */ jsx(AdminTopBar, { onOpenMenu: () => setMenuOpen(true) }),
      /* @__PURE__ */ jsx("main", { className: "pt-20 pb-28", children: /* @__PURE__ */ jsx("div", { className: "px-4", children: /* @__PURE__ */ jsx(ErrorBoundary, { children: children || /* @__PURE__ */ jsx(Outlet, {}) }, location.key) }) }),
      /* @__PURE__ */ jsx(AdminBottomNav, { onOpenMenu: () => setMenuOpen(true) }),
      /* @__PURE__ */ jsx(AdminMenuHub, { isOpen: menuOpen, onClose: () => setMenuOpen(false) })
    ] })
  ] });
}
export {
  AdminLayout as default
};
