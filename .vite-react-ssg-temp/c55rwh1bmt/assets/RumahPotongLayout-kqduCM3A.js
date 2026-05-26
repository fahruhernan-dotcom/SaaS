import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { u as useAuth, a as useNotificationGenerator, b as useForceDarkMode, c as useMediaQuery, S as SidebarProvider, A as AppSidebar, B as BottomNav, D as DesktopSidebarLayout } from "../main.mjs";
import { Menu } from "lucide-react";
import { I as InstallAppPrompt, B as BusinessNameWarningBanner, P as PlanExpiryBanner } from "./InstallAppPrompt-D3Jk8JCa.js";
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
function RumahPotongLayout() {
  const { _profile, loading, tenant, isSuperadmin } = useAuth();
  useNotificationGenerator();
  useForceDarkMode();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
    const openHandler = () => setSidebarOpen(true);
    const toggleHandler = () => setSidebarOpen((prev) => !prev);
    window.addEventListener("open-mobile-sidebar", openHandler);
    window.addEventListener("toggleMobileSidebar", toggleHandler);
    return () => {
      window.removeEventListener("open-mobile-sidebar", openHandler);
      window.removeEventListener("toggleMobileSidebar", toggleHandler);
    };
  }, []);
  if (loading) {
    return /* @__PURE__ */ jsx("div", { style: { minHeight: "100vh", padding: 24, color: "#F1F5F9", background: "#06090F" }, children: "Memuat dashboard..." });
  }
  const renderContent = () => {
    if (!isDesktop) {
      return /* @__PURE__ */ jsxs("div", { style: {
        background: "#06090F",
        minHeight: "100vh",
        maxWidth: "480px",
        margin: "0 auto",
        paddingBottom: "80px",
        position: "relative",
        overflowX: "hidden",
        overscrollBehaviorX: "none"
      }, children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            className: "md:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-[#0C1319] border border-white/10 rounded-xl flex items-center justify-center shadow-lg",
            onClick: () => setSidebarOpen(true),
            children: /* @__PURE__ */ jsx(Menu, { className: "w-5 h-5 text-[#94A3B8]" })
          }
        ),
        /* @__PURE__ */ jsx(SidebarProvider, { style: { minHeight: 0 }, children: /* @__PURE__ */ jsx(AppSidebar, { open: sidebarOpen, onClose: () => setSidebarOpen(false) }) }),
        /* @__PURE__ */ jsx(BusinessNameWarningBanner, {}),
        !isSuperadmin && /* @__PURE__ */ jsx(PlanExpiryBanner, { tenant }),
        /* @__PURE__ */ jsx(Outlet, {}),
        /* @__PURE__ */ jsx(BottomNav, {})
      ] });
    }
    return /* @__PURE__ */ jsxs(DesktopSidebarLayout, { children: [
      /* @__PURE__ */ jsx(BusinessNameWarningBanner, {}),
      !isSuperadmin && /* @__PURE__ */ jsx(PlanExpiryBanner, { tenant }),
      /* @__PURE__ */ jsx(Outlet, {})
    ] });
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    renderContent(),
    /* @__PURE__ */ jsx(InstallAppPrompt, {})
  ] });
}
export {
  RumahPotongLayout as default
};
