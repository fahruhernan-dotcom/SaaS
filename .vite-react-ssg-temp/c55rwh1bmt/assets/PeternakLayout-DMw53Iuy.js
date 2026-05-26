import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from "react";
import { useLocation, Outlet } from "react-router-dom";
import { u as useAuth, a as useNotificationGenerator, b as useForceDarkMode, c as useMediaQuery, S as SidebarProvider, A as AppSidebar, B as BottomNav, D as DesktopSidebarLayout } from "../main.mjs";
import { I as InstallAppPrompt, B as BusinessNameWarningBanner, P as PlanExpiryBanner } from "./InstallAppPrompt-D3Jk8JCa.js";
import "react-dom";
import "vite-react-ssg";
import "framer-motion";
import "@tanstack/react-query";
import "sonner";
import "@radix-ui/react-tooltip";
import "clsx";
import "tailwind-merge";
import "@supabase/supabase-js";
import "lucide-react";
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
import "@radix-ui/react-popover";
import "cmdk";
import "recharts";
import "@radix-ui/react-tabs";
import "@radix-ui/react-collapsible";
import "@radix-ui/react-select";
function PeternakLayout() {
  const { _profile, loading, tenant, isSuperadmin } = useAuth();
  const location = useLocation();
  useNotificationGenerator();
  useForceDarkMode();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [_rightAction, setRightAction] = useState(null);
  useEffect(() => {
    setRightAction(null);
  }, [location.pathname]);
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
            /* @__PURE__ */ jsx(Outlet, { context: { setSidebarOpen, setRightAction } }),
            /* @__PURE__ */ jsx(BottomNav, {})
          ]
        }
      );
    }
    return /* @__PURE__ */ jsxs(DesktopSidebarLayout, { children: [
      /* @__PURE__ */ jsx(BusinessNameWarningBanner, {}),
      !isSuperadmin && /* @__PURE__ */ jsx(PlanExpiryBanner, { tenant }),
      /* @__PURE__ */ jsx(Outlet, { context: { setSidebarOpen, setRightAction } })
    ] });
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    renderContent(),
    /* @__PURE__ */ jsx(InstallAppPrompt, {})
  ] });
}
export {
  PeternakLayout as default
};
