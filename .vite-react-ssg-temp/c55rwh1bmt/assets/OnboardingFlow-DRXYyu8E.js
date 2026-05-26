import { jsx } from "react/jsx-runtime";
import React__default from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { u as useAuth, bd as LoadingScreen, K as logError } from "../main.mjs";
import { B as BusinessModelOverlay } from "./BusinessModelOverlay-CcSVlwix.js";
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
import "react-dom";
import "@radix-ui/react-popover";
import "cmdk";
import "recharts";
import "@radix-ui/react-tabs";
import "@radix-ui/react-collapsible";
import "@radix-ui/react-select";
import "./DatePicker-BO7By-H9.js";
import "react-day-picker";
const KEY_TO_PATH = {
  poultry_broker: "/broker/broker_ayam/beranda",
  broker: "/broker/broker_ayam/beranda",
  egg_broker: "/broker/broker_telur/beranda",
  distributor_sembako: "/broker/distributor_sembako/beranda",
  sembako_broker: "/broker/distributor_sembako/beranda",
  peternak: "/peternak/peternak_broiler/beranda",
  peternak_layer: "/peternak/peternak_layer/beranda",
  peternak_domba_penggemukan: "/peternak/peternak_domba_penggemukan/beranda",
  peternak_domba_breeding: "/peternak/peternak_domba_breeding/beranda",
  peternak_kambing_penggemukan: "/peternak/peternak_kambing_penggemukan/beranda",
  peternak_kambing_breeding: "/peternak/peternak_kambing_breeding/beranda",
  peternak_kambing_perah: "/peternak/peternak_kambing_perah/beranda",
  peternak_kambing_domba_penggemukan: "/peternak/peternak_domba_penggemukan/beranda",
  peternak_kambing_domba_breeding: "/peternak/peternak_domba_breeding/beranda",
  peternak_sapi_penggemukan: "/peternak/peternak_sapi_penggemukan/beranda",
  peternak_sapi_breeding: "/peternak/peternak_sapi_breeding/beranda",
  rumah_potong_rpa: "/rumah_potong/rpa/beranda",
  rumah_potong_rph: "/rumah_potong/rph/beranda"
};
function OnboardingFlow() {
  const { user, profile, loading, refetchProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isNewBusiness = searchParams.get("mode") === "new_business";
  const redirectHandledRef = React__default.useRef(false);
  React__default.useEffect(() => {
    var _a, _b, _c, _d;
    if (loading) return;
    if (redirectHandledRef.current) return;
    if (!isNewBusiness && (profile == null ? void 0 : profile.onboarded)) {
      const vertical = ((_a = profile.tenants) == null ? void 0 : _a.business_vertical) || ((_b = profile.tenants) == null ? void 0 : _b.sub_type);
      const resolvedPath = vertical && KEY_TO_PATH[vertical] || KEY_TO_PATH[profile.user_type];
      if (resolvedPath) {
        navigate(resolvedPath, { replace: true });
        return;
      }
      if (profile.user_type === "peternak") {
        navigate(`/peternak/${((_c = profile.tenants) == null ? void 0 : _c.sub_type) || "peternak_broiler"}/beranda`, { replace: true });
        return;
      }
      if (profile.user_type === "rumah_potong") {
        navigate(`/rumah_potong/rpa/beranda`, { replace: true });
        return;
      }
      navigate(`/broker/${((_d = profile.tenants) == null ? void 0 : _d.sub_type) || "broker_ayam"}/beranda`, { replace: true });
    }
  }, [profile, loading, navigate, isNewBusiness]);
  if (loading) return /* @__PURE__ */ jsx(LoadingScreen, {});
  if (!isNewBusiness && (profile == null ? void 0 : profile.onboarded)) return /* @__PURE__ */ jsx(LoadingScreen, {});
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-[#06090F]", children: /* @__PURE__ */ jsx(
    BusinessModelOverlay,
    {
      user,
      profile,
      isNewBusiness,
      onComplete: async (selectedKey) => {
        if (!selectedKey) {
          if (isNewBusiness) {
            navigate(-1);
          } else if (!(profile == null ? void 0 : profile.onboarded)) {
            navigate("/welcome", { replace: true });
          }
          return;
        }
        redirectHandledRef.current = true;
        await refetchProfile();
        const path = KEY_TO_PATH[selectedKey];
        if (path) {
          if (isNewBusiness) {
            window.location.href = path;
          } else {
            navigate(path, { replace: true });
          }
        } else {
          logError({
            level: "error",
            source: "route_guard",
            component: "OnboardingFlow",
            actionName: "onboarding.redirect_failed",
            error: { message: `No KEY_TO_PATH mapping for vertical "${selectedKey}"`, code: "unmapped_vertical" },
            metadata: {
              vertical: selectedKey,
              role: (profile == null ? void 0 : profile.user_type) || (profile == null ? void 0 : profile.role) || null,
              hasTenant: !!(profile == null ? void 0 : profile.tenant_id),
              isNewBusiness
            }
          });
          navigate("/", { replace: true });
        }
      }
    }
  ) });
}
export {
  OnboardingFlow as default
};
