import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import React__default, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Globe, Bot, Building2, Shield, Info, AlertTriangle, RefreshCw, Settings2, Loader2, Infinity, RefreshCcw, Clock, PowerOff, Phone, Instagram, BarChart3, ArrowRight, Save, History } from "lucide-react";
import { bL as useSiteConfig, bM as useUpdateSiteConfig, aI as usePlanConfigs, bD as useUpdatePlanConfig, s as supabase, p as logSupabaseError, ag as Tabs, ah as TabsList, ai as TabsTrigger, aj as TabsContent, af as Switch, a0 as Input, a2 as Select, a3 as SelectTrigger, a4 as SelectValue, a5 as SelectContent, a6 as SelectItem, a7 as Button, bN as usePlanConfigHistory } from "../main.mjs";
import { format, addDays } from "date-fns";
import { id } from "date-fns/locale";
import { A as AlertDialog, a as AlertDialogContent, b as AlertDialogHeader, c as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter, f as AlertDialogCancel, g as AlertDialogAction } from "./alert-dialog-DzaJnNEE.js";
import { toast } from "sonner";
import "vite-react-ssg";
import "framer-motion";
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
import "@radix-ui/react-alert-dialog";
function AdminSettings() {
  var _a;
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("general");
  const { data: cfg = {} } = useSiteConfig();
  const updateSiteConfig = useUpdateSiteConfig();
  const [siteForm, setSiteForm] = useState({});
  const [siteSaving, setSiteSaving] = useState(false);
  React__default.useEffect(() => {
    if (Object.keys(cfg).length > 0) setSiteForm(cfg);
  }, [JSON.stringify(cfg)]);
  const [bannerText, setBannerText] = useState("");
  const [bannerActive, setBannerActive] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [aiProvider, setAiProvider] = useState("anthropic");
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState(null);
  const { data: configs = {} } = usePlanConfigs();
  const updateConfig = useUpdatePlanConfig();
  const [kandangLimits, setKandangLimits] = useState({ starter: 1, pro: 2, business: 99, enterprise: 99 });
  const [teamLimits, setTeamLimits] = useState({ starter: 1, pro: 3, business: 10, enterprise: 99 });
  const [businessLimits, setBusinessLimits] = useState({ starter: 1, pro: 3, business: 999, enterprise: 999 });
  const [ternakLimits, setTernakLimits] = useState({
    domba_kambing: { starter: 20, pro: 100, business: null },
    sapi: { starter: 10, pro: 50, business: null }
  });
  const [trxQuota, setTrxQuota] = useState({ starter: 30 });
  const [trialConfig, setTrialConfig] = useState({ starter: 14, pro: 14, business: 14 });
  const [savingLimits, setSavingLimits] = useState(false);
  const [savingQuota, setSavingQuota] = useState(false);
  const [savingTrial, setSavingTrial] = useState(false);
  const [configsInited, setConfigsInited] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    configKey: "",
    oldValue: null,
    newValue: null,
    onConfirm: null
  });
  React__default.useMemo(() => {
    if (configs && Object.keys(configs).length > 0 && !configsInited) {
      if (configs.kandang_limit) setKandangLimits((v) => ({ ...v, ...configs.kandang_limit }));
      if (configs.team_limit) setTeamLimits((v) => ({ ...v, ...configs.team_limit }));
      if (configs.business_limit) setBusinessLimits((v) => ({ ...v, ...configs.business_limit }));
      if (configs.ternak_limit) setTernakLimits((v) => ({ ...v, ...configs.ternak_limit }));
      if (configs.transaction_quota) setTrxQuota((v) => ({ ...v, ...configs.transaction_quota }));
      if (configs.trial_config) setTrialConfig((v) => ({ ...v, ...configs.trial_config }));
      if (configs.maintenance_mode !== void 0) setMaintenanceMode(!!configs.maintenance_mode);
      setConfigsInited(true);
    }
  }, [configs, configsInited]);
  const logAuditTrail = useCallback(async (configKey, oldVal, newVal) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let profileId = null;
      if (user == null ? void 0 : user.id) {
        const { data: profile } = await supabase.from("profiles").select("id").eq("auth_user_id", user.id).maybeSingle();
        profileId = (profile == null ? void 0 : profile.id) ?? null;
      }
      const { error: auditErr } = await supabase.from("global_audit_logs").insert({
        actor_profile_id: profileId,
        tenant_id: null,
        // global config = no tenant scope
        action: "CONFIG_UPDATE",
        entity_type: `plan_configs.${configKey}`,
        entity_id: null,
        old_data: oldVal ?? null,
        new_data: newVal ?? null
      });
      if (auditErr) {
        logSupabaseError(auditErr, {
          table: "global_audit_logs",
          operation: "insert",
          component: "AdminSettings",
          actionName: "admin.audit_trail.create"
        });
      }
    } catch (err) {
      logSupabaseError(err, {
        table: "global_audit_logs",
        operation: "insert",
        component: "AdminSettings",
        actionName: "admin.audit_trail.create"
      });
    }
  }, []);
  const requestConfirmSave = useCallback(({ title, configKey, oldValue, newValue, onConfirm }) => {
    setConfirmDialog({ open: true, title, configKey, oldValue, newValue, onConfirm });
  }, []);
  const [auditRetention, setAuditRetention] = useState("90");
  const [killSwitchConfirm, setKillSwitchConfirm] = useState("");
  const handleToggleMaintenance = async (val) => {
    setMaintenanceMode(val);
    try {
      await updateConfig.mutateAsync({ config_key: "maintenance_mode", config_value: val });
      await logAuditTrail("maintenance_mode", maintenanceMode, val);
      toast.success(val ? "Maintenance Mode aktif" : "Maintenance Mode dinonaktifkan");
    } catch {
      setMaintenanceMode(!val);
    }
  };
  const handleRollback = useCallback(async (configKey, oldValue) => {
    await updateConfig.mutateAsync({ config_key: configKey, config_value: oldValue });
    setConfigsInited(false);
  }, [updateConfig]);
  const executeSaveLimits = async () => {
    setSavingLimits(true);
    try {
      const oldKandang = configs == null ? void 0 : configs.kandang_limit, oldTeam = configs == null ? void 0 : configs.team_limit, oldBusiness = configs == null ? void 0 : configs.business_limit;
      await updateConfig.mutateAsync({ config_key: "kandang_limit", config_value: kandangLimits });
      await updateConfig.mutateAsync({ config_key: "team_limit", config_value: teamLimits });
      await updateConfig.mutateAsync({ config_key: "business_limit", config_value: businessLimits });
      await logAuditTrail("kandang_limit", oldKandang, kandangLimits);
      await logAuditTrail("team_limit", oldTeam, teamLimits);
      await logAuditTrail("business_limit", oldBusiness, businessLimits);
      toast.success("Konfigurasi limit berhasil disimpan");
    } catch {
    } finally {
      setSavingLimits(false);
    }
  };
  const executeSaveTernakLimits = async () => {
    setSavingLimits(true);
    try {
      const oldVal = configs == null ? void 0 : configs.ternak_limit;
      await updateConfig.mutateAsync({ config_key: "ternak_limit", config_value: ternakLimits });
      await logAuditTrail("ternak_limit", oldVal, ternakLimits);
      toast.success("Limit ternak berhasil disimpan!");
    } catch {
    } finally {
      setSavingLimits(false);
    }
  };
  const executeSaveQuota = async () => {
    const val = Number(trxQuota.starter);
    setSavingQuota(true);
    try {
      const oldVal = configs == null ? void 0 : configs.transaction_quota;
      await updateConfig.mutateAsync({ config_key: "transaction_quota", config_value: { starter: val } });
      await logAuditTrail("transaction_quota", oldVal, { starter: val });
      toast.success("Kuota transaksi berhasil disimpan");
    } catch {
    } finally {
      setSavingQuota(false);
    }
  };
  const executeSaveTrial = async () => {
    setSavingTrial(true);
    try {
      const oldVal = configs == null ? void 0 : configs.trial_config;
      await updateConfig.mutateAsync({ config_key: "trial_config", config_value: trialConfig });
      await logAuditTrail("trial_config", oldVal, trialConfig);
      toast.success("Konfigurasi trial berhasil disimpan");
    } catch {
    } finally {
      setSavingTrial(false);
    }
  };
  const handleSaveLimits = () => {
    const allValues = [
      ...Object.values(kandangLimits),
      ...Object.values(teamLimits),
      ...Object.values(businessLimits)
    ];
    if (allValues.some((v) => v !== null && (isNaN(Number(v)) || Number(v) < 1))) {
      toast.error("Semua nilai limit harus minimal 1");
      return;
    }
    requestConfirmSave({
      title: "Simpan Konfigurasi Limit",
      configKey: "kandang_limit + team_limit + business_limit",
      oldValue: { kandang: configs == null ? void 0 : configs.kandang_limit, team: configs == null ? void 0 : configs.team_limit, business: configs == null ? void 0 : configs.business_limit },
      newValue: { kandang: kandangLimits, team: teamLimits, business: businessLimits },
      onConfirm: executeSaveLimits
    });
  };
  const handleSaveTernakLimits = () => {
    requestConfirmSave({
      title: "Simpan Limit Ternak",
      configKey: "ternak_limit",
      oldValue: configs == null ? void 0 : configs.ternak_limit,
      newValue: ternakLimits,
      onConfirm: executeSaveTernakLimits
    });
  };
  const handleSaveQuota = () => {
    const val = Number(trxQuota.starter);
    if (!val || val < 1 || val > 9999) {
      toast.error("Kuota harus antara 1–9999");
      return;
    }
    requestConfirmSave({
      title: "Simpan Kuota Transaksi",
      configKey: "transaction_quota",
      oldValue: configs == null ? void 0 : configs.transaction_quota,
      newValue: { starter: val },
      onConfirm: executeSaveQuota
    });
  };
  const handleSaveTrial = () => {
    requestConfirmSave({
      title: "Simpan Konfigurasi Trial",
      configKey: "trial_config",
      oldValue: configs == null ? void 0 : configs.trial_config,
      newValue: trialConfig,
      onConfirm: executeSaveTrial
    });
  };
  const previewTrialDate = (days) => format(addDays(/* @__PURE__ */ new Date(), Number(days) || 0), "d MMMM yyyy", { locale: id });
  const handlePingSimulated = () => {
    setIsPinging(true);
    setPingResult(null);
    setTimeout(() => {
      setIsPinging(false);
      setPingResult({
        status: "Operational",
        latency: Math.floor(Math.random() * 200) + 50 + "ms",
        time: (/* @__PURE__ */ new Date()).toLocaleTimeString()
      });
      toast.success("Koneksi ke LLM Provider stabil");
    }, 1500);
  };
  const executeKillSwitch = async () => {
    if (killSwitchConfirm !== "CONFIRM") {
      toast.error("Ketik CONFIRM dengan benar");
      return;
    }
    await logAuditTrail("kill_switch", null, { executed_at: (/* @__PURE__ */ new Date()).toISOString() });
    await supabase.auth.signOut({ scope: "local" });
    navigate("/login");
  };
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(
      ConfirmSaveDialog,
      {
        open: confirmDialog.open,
        onOpenChange: (v) => setConfirmDialog((p) => ({ ...p, open: v })),
        title: confirmDialog.title,
        configKey: confirmDialog.configKey,
        oldValue: confirmDialog.oldValue,
        newValue: confirmDialog.newValue,
        onConfirm: () => {
          var _a2;
          setConfirmDialog((p) => ({ ...p, open: false }));
          (_a2 = confirmDialog.onConfirm) == null ? void 0 : _a2.call(confirmDialog);
        }
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "hidden lg:flex items-center justify-between py-4", children: /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "font-display text-2xl font-black text-white uppercase tracking-tight", children: "System Settings" }),
      /* @__PURE__ */ jsx("p", { className: "text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1", children: "Konfigurasi global platform" })
    ] }) }),
    /* @__PURE__ */ jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "w-full space-y-6", children: [
      /* @__PURE__ */ jsxs(TabsList, { className: "bg-[#111C24] border border-white/5 p-1.5 h-auto rounded-xl lg:rounded-2xl flex flex-wrap gap-1 shadow-lg w-full justify-start overflow-x-auto no-scrollbar", children: [
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "general", className: "rounded-lg lg:rounded-xl px-4 py-2.5 text-[10px] lg:text-[11px] font-black uppercase tracking-widest data-[state=active]:bg-white/10 data-[state=active]:text-emerald-400", children: [
          /* @__PURE__ */ jsx(Globe, { className: "w-4 h-4 mr-2" }),
          " General"
        ] }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "ai", className: "rounded-lg lg:rounded-xl px-4 py-2.5 text-[10px] lg:text-[11px] font-black uppercase tracking-widest data-[state=active]:bg-white/10 data-[state=active]:text-blue-400", children: [
          /* @__PURE__ */ jsx(Bot, { className: "w-4 h-4 mr-2" }),
          " AI Config"
        ] }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "limits", className: "rounded-lg lg:rounded-xl px-4 py-2.5 text-[10px] lg:text-[11px] font-black uppercase tracking-widest data-[state=active]:bg-white/10 data-[state=active]:text-purple-400", children: [
          /* @__PURE__ */ jsx(Building2, { className: "w-4 h-4 mr-2" }),
          " Limits & Quotas"
        ] }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "security", className: "rounded-lg lg:rounded-xl px-4 py-2.5 text-[10px] lg:text-[11px] font-black uppercase tracking-widest data-[state=active]:bg-white/10 data-[state=active]:text-red-400", children: [
          /* @__PURE__ */ jsx(Shield, { className: "w-4 h-4 mr-2" }),
          " Security"
        ] }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "site_info", className: "rounded-lg lg:rounded-xl px-4 py-2.5 text-[10px] lg:text-[11px] font-black uppercase tracking-widest data-[state=active]:bg-white/10 data-[state=active]:text-sky-400", children: [
          /* @__PURE__ */ jsx(Info, { className: "w-4 h-4 mr-2" }),
          " Site Info"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-[#0C1319] rounded-2xl border border-white/5 p-5 lg:p-8 shadow-xl min-h-[500px]", children: [
        /* @__PURE__ */ jsx(TabsContent, { value: "general", className: "mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500", children: /* @__PURE__ */ jsxs("section", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 border-b border-white/5 pb-4", children: [
            /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center", children: /* @__PURE__ */ jsx(Globe, { className: "text-emerald-400", size: 18 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "text-lg font-black text-white uppercase tracking-tight", children: "Platform Controls" }),
              /* @__PURE__ */ jsx("p", { className: "text-[11px] text-[#4B6478] font-bold uppercase tracking-widest mt-0.5", children: "Pengaturan tampilan & aksesibilitas platform" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "bg-white/[0.02] border border-white/5 p-5 rounded-2xl space-y-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("h3", { className: "text-[13px] font-bold text-white", children: "Global Banner" }),
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 mt-1", children: "Tampilkan pengumuman di atas layar semua user." })
                ] }),
                /* @__PURE__ */ jsx(Switch, { checked: bannerActive, onCheckedChange: setBannerActive, className: "data-[state=checked]:bg-emerald-500" })
              ] }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  placeholder: "Contoh: Maintenance besok pukul 23:00 WIB",
                  value: bannerText,
                  onChange: (e) => setBannerText(e.target.value),
                  disabled: !bannerActive,
                  className: "bg-black/40 border-white/10"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-white/[0.02] border border-white/5 p-5 rounded-2xl space-y-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsxs("h3", { className: "text-[13px] font-black text-white flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx(AlertTriangle, { size: 14, className: "text-amber-500" }),
                    "Maintenance Mode"
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 mt-1", children: "Hanya Superadmin yang dapat mengakses sistem." })
                ] }),
                /* @__PURE__ */ jsx(Switch, { checked: maintenanceMode, onCheckedChange: handleToggleMaintenance, className: "data-[state=checked]:bg-amber-500" })
              ] }),
              maintenanceMode && /* @__PURE__ */ jsx("div", { className: "p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl", children: /* @__PURE__ */ jsx("p", { className: "text-[11px] font-bold text-amber-500", children: "⚠ Sistem saat ini dalam Maintenance Mode." }) })
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx(TabsContent, { value: "ai", className: "mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500", children: /* @__PURE__ */ jsxs("section", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 border-b border-white/5 pb-4", children: [
            /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center", children: /* @__PURE__ */ jsx(Bot, { className: "text-blue-400", size: 18 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "text-lg font-black text-white uppercase tracking-tight", children: "AI & Integration" }),
              /* @__PURE__ */ jsx("p", { className: "text-[11px] text-[#4B6478] font-bold uppercase tracking-widest mt-0.5", children: "Manajemen TernakBot LLM Engine" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "bg-white/[0.02] border border-white/5 p-5 rounded-2xl space-y-4", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h3", { className: "text-[13px] font-bold text-white mb-1", children: "Primary LLM Provider" }),
                /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 mb-3", children: "Pilih AI engine mana yang menangani traffic utama." }),
                /* @__PURE__ */ jsxs(Select, { value: aiProvider, onValueChange: setAiProvider, children: [
                  /* @__PURE__ */ jsx(SelectTrigger, { className: "bg-black/40 border-white/10", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Pilih Provider" }) }),
                  /* @__PURE__ */ jsxs(SelectContent, { className: "bg-[#111C24] border-white/10 text-white", children: [
                    /* @__PURE__ */ jsx(SelectItem, { value: "anthropic", children: "Anthropic Claude (Recommended)" }),
                    /* @__PURE__ */ jsx(SelectItem, { value: "openai", children: "OpenAI GPT-4o" }),
                    /* @__PURE__ */ jsx(SelectItem, { value: "deepseek", children: "DeepSeek Coder V2 (Low Cost)" })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "p-3 bg-blue-500/5 rounded-xl border border-blue-500/10 text-[11px] text-blue-300", children: [
                "Sistem fail-over aktif. Jika ",
                aiProvider.charAt(0).toUpperCase() + aiProvider.slice(1),
                " down, TernakBot otomatis menggunakan provider cadangan."
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-white/[0.02] border border-white/5 p-5 rounded-2xl flex flex-col", children: [
              /* @__PURE__ */ jsx("h3", { className: "text-[13px] font-bold text-white mb-1", children: "API Health Status" }),
              /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 mb-4", children: "Simulated health check ping ke gateway API." }),
              /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col items-center justify-center bg-black/40 rounded-xl mb-4 p-4 border border-white/5 relative overflow-hidden", children: [
                isPinging && /* @__PURE__ */ jsx(RefreshCw, { className: "animate-spin text-blue-500 opacity-50 mb-2", size: 24 }),
                !isPinging && pingResult && /* @__PURE__ */ jsxs("div", { className: "text-center font-mono", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-emerald-400 text-sm font-bold", children: pingResult.status }),
                  /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400 mt-1", children: [
                    "Latency: ",
                    pingResult.latency
                  ] }),
                  /* @__PURE__ */ jsxs("p", { className: "text-[9px] text-[#4B6478] mt-2", children: [
                    "Checked at ",
                    pingResult.time
                  ] })
                ] }),
                !isPinging && !pingResult && /* @__PURE__ */ jsx("p", { className: "text-xs text-[#4B6478] font-mono", children: "Ready to ping" })
              ] }),
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "outline",
                  onClick: handlePingSimulated,
                  disabled: isPinging,
                  className: "w-full border-blue-500/30 text-blue-400 hover:bg-blue-500/10 uppercase tracking-widest text-[10px] font-black h-10",
                  children: "Mulai Diagnostic Ping"
                }
              )
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs(TabsContent, { value: "limits", className: "mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500", children: [
          /* @__PURE__ */ jsxs("section", { className: "space-y-5", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("p", { className: "text-[11px] font-black uppercase tracking-widest text-[#4B6478] font-display flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Settings2, { size: 13 }),
                " KANDANG LIMIT PER PLAN"
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-[#4B6478] mt-1", children: "Jumlah kandang aktif maksimal yang bisa dimiliki per plan" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: [
              /* @__PURE__ */ jsx(
                PlanLimitCard,
                {
                  planName: "STARTER",
                  badgeClass: "bg-white/10 text-white/50",
                  kandangValue: kandangLimits.starter,
                  teamValue: teamLimits.starter,
                  businessValue: businessLimits.starter,
                  onKandangChange: (v) => setKandangLimits((p) => ({ ...p, starter: v })),
                  onTeamChange: (v) => setTeamLimits((p) => ({ ...p, starter: v })),
                  onBusinessChange: (v) => setBusinessLimits((p) => ({ ...p, starter: v }))
                }
              ),
              /* @__PURE__ */ jsx(
                PlanLimitCard,
                {
                  planName: "PRO",
                  badgeClass: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
                  kandangValue: kandangLimits.pro,
                  teamValue: teamLimits.pro,
                  businessValue: businessLimits.pro,
                  onKandangChange: (v) => setKandangLimits((p) => ({ ...p, pro: v })),
                  onTeamChange: (v) => setTeamLimits((p) => ({ ...p, pro: v })),
                  onBusinessChange: (v) => setBusinessLimits((p) => ({ ...p, pro: v }))
                }
              ),
              /* @__PURE__ */ jsx(
                PlanLimitCard,
                {
                  planName: "BUSINESS",
                  badgeExtra: "MOST POPULAR",
                  badgeClass: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
                  kandangValue: kandangLimits.business,
                  teamValue: teamLimits.business,
                  businessValue: businessLimits.business,
                  onKandangChange: (v) => setKandangLimits((p) => ({ ...p, business: v })),
                  onTeamChange: (v) => setTeamLimits((p) => ({ ...p, business: v })),
                  onBusinessChange: (v) => setBusinessLimits((p) => ({ ...p, business: v }))
                }
              ),
              /* @__PURE__ */ jsx(
                PlanLimitCard,
                {
                  planName: "ENTERPRISE",
                  badgeClass: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
                  readOnly: true,
                  kandangValue: 99,
                  teamValue: 99,
                  businessValue: 999
                }
              )
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: handleSaveLimits,
                disabled: savingLimits,
                className: "w-full bg-emerald-500 hover:bg-emerald-600 text-white h-12 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(2, 26, 2,0.3)] border border-emerald-400/20 active:scale-[0.98]",
                children: savingLimits ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(Loader2, { size: 16, className: "animate-spin" }),
                  " MENYIMPAN LIMIT..."
                ] }) : "SIMPAN KONFIGURASI LIMIT"
              }
            ),
            /* @__PURE__ */ jsx(ConfigHistoryWidget, { configKey: "kandang_limit", onRollback: handleRollback })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent my-4" }),
          /* @__PURE__ */ jsxs("section", { className: "space-y-5", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("p", { className: "text-[11px] font-black uppercase tracking-widest text-[#4B6478] font-display flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Settings2, { size: 13 }),
                " LIMIT TERNAK AKTIF PER PLAN"
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-[#4B6478] mt-1", children: "Jumlah ekor ternak aktif maksimal per tenant. Business = tidak terbatas." })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "space-y-4", children: [
              { key: "domba_kambing", label: "Domba & Kambing", emoji: "🐑" },
              { key: "sapi", label: "Sapi", emoji: "🐃" }
            ].map(({ key, label, emoji }) => {
              var _a2, _b;
              return /* @__PURE__ */ jsxs("div", { className: "bg-white/[0.03] rounded-[24px] p-6 border border-white/5 space-y-4", children: [
                /* @__PURE__ */ jsxs("p", { className: "text-xs font-black uppercase tracking-widest text-white/60", children: [
                  emoji,
                  " ",
                  label
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-3", children: [
                  /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black uppercase tracking-widest text-[#4B6478]", children: "Starter" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "number",
                        min: 1,
                        value: ((_a2 = ternakLimits[key]) == null ? void 0 : _a2.starter) ?? "",
                        onChange: (e) => setTernakLimits((p) => ({
                          ...p,
                          [key]: { ...p[key], starter: parseInt(e.target.value) || 0 }
                        })),
                        className: "w-full bg-black/40 border border-white/5 h-11 rounded-2xl px-4 text-sm text-white font-black focus:outline-none focus:border-emerald-500/40 focus:bg-emerald-500/5 transition-all"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black uppercase tracking-widest text-emerald-500/60", children: "Pro" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "number",
                        min: 1,
                        value: ((_b = ternakLimits[key]) == null ? void 0 : _b.pro) ?? "",
                        onChange: (e) => setTernakLimits((p) => ({
                          ...p,
                          [key]: { ...p[key], pro: parseInt(e.target.value) || 0 }
                        })),
                        className: "w-full bg-black/40 border border-emerald-500/20 h-11 rounded-2xl px-4 text-sm text-white font-black focus:outline-none focus:border-emerald-500/40 focus:bg-emerald-500/5 transition-all"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black uppercase tracking-widest text-amber-500/60", children: "Business" }),
                    /* @__PURE__ */ jsxs("div", { className: "h-11 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-center px-4 gap-2 text-sm font-black text-amber-400", children: [
                      /* @__PURE__ */ jsx(Infinity, { size: 15 }),
                      " Unlimited"
                    ] })
                  ] })
                ] })
              ] }, key);
            }) }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: handleSaveTernakLimits,
                disabled: savingLimits,
                className: "w-full bg-emerald-500 hover:bg-emerald-600 text-white h-12 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(2, 26, 2,0.3)] border border-emerald-400/20 active:scale-[0.98]",
                children: savingLimits ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(Loader2, { size: 16, className: "animate-spin" }),
                  " MENYIMPAN..."
                ] }) : "SIMPAN LIMIT TERNAK"
              }
            ),
            /* @__PURE__ */ jsx(ConfigHistoryWidget, { configKey: "ternak_limit", onRollback: handleRollback })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent my-4" }),
          /* @__PURE__ */ jsxs("section", { className: "space-y-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center", children: /* @__PURE__ */ jsx(RefreshCcw, { size: 18, className: "text-emerald-400" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-[11px] font-black uppercase tracking-[0.2em] text-[#4B6478]", children: "KUOTA TRANSAKSI BULANAN" }),
                /* @__PURE__ */ jsx("p", { className: "text-[10px] text-[#4B6478] font-bold uppercase tracking-widest mt-0.5", children: "Berlaku untuk semua vertikal — global per plan" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "bg-white/[0.03] backdrop-blur-lg rounded-[32px] p-7 border border-white/5 space-y-5 hover:border-white/10 transition-all duration-500 group", children: [
                /* @__PURE__ */ jsx("span", { className: "inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border border-white/5 bg-white/5 text-[#94A3B8]", children: "STARTER" }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1 group-hover:text-emerald-500/60 transition-colors", children: "Kuota Transaksi / Bulan" }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "number",
                        min: 1,
                        max: 9999,
                        value: trxQuota.starter,
                        onChange: (e) => setTrxQuota((v) => ({ ...v, starter: Number(e.target.value) })),
                        className: "w-full bg-black/40 border border-white/5 h-12 rounded-2xl px-4 text-sm text-white font-black focus:outline-none focus:border-emerald-500/40 focus:bg-emerald-500/5 transition-all shadow-inner"
                      }
                    ),
                    /* @__PURE__ */ jsx("span", { className: "text-[11px] text-[#4B6478] font-bold whitespace-nowrap shrink-0", children: "trx / bln" })
                  ] }),
                  /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-[#4B6478] ml-1", children: [
                    "Tersimpan: ",
                    /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: ((_a = configs == null ? void 0 : configs.transaction_quota) == null ? void 0 : _a.starter) ?? 30 })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-white/[0.03] backdrop-blur-lg rounded-[32px] p-7 border border-white/5 space-y-5 hover:border-emerald-500/20 transition-all duration-500 group", children: [
                /* @__PURE__ */ jsx("span", { className: "inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400", children: "PRO" }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1 group-hover:text-emerald-500/60 transition-colors", children: "Kuota Transaksi / Bulan" }),
                  /* @__PURE__ */ jsxs("div", { className: "h-12 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-center px-4 gap-2 text-sm font-black text-emerald-400 shadow-[inset_0_0_20px_rgba(2, 26, 2,0.05)]", children: [
                    /* @__PURE__ */ jsx(Infinity, { size: 16 }),
                    " Unlimited"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-white/[0.03] backdrop-blur-lg rounded-[32px] p-7 border border-white/5 space-y-5 hover:border-amber-500/20 transition-all duration-500 group", children: [
                /* @__PURE__ */ jsx("span", { className: "inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400", children: "BUSINESS" }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1 group-hover:text-amber-500/60 transition-colors", children: "Kuota Transaksi / Bulan" }),
                  /* @__PURE__ */ jsxs("div", { className: "h-12 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-center px-4 gap-2 text-sm font-black text-amber-400 shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]", children: [
                    /* @__PURE__ */ jsx(Infinity, { size: 16 }),
                    " Unlimited"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: handleSaveQuota,
                disabled: savingQuota,
                className: "w-full bg-emerald-500 hover:bg-emerald-600 text-white h-12 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(2, 26, 2,0.3)] border border-emerald-400/20 active:scale-[0.98]",
                children: savingQuota ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(Loader2, { size: 16, className: "animate-spin" }),
                  " MENYIMPAN..."
                ] }) : "SIMPAN KUOTA TRANSAKSI"
              }
            ),
            /* @__PURE__ */ jsx(ConfigHistoryWidget, { configKey: "transaction_quota", onRollback: handleRollback })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent my-4" }),
          /* @__PURE__ */ jsxs("section", { className: "space-y-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center", children: /* @__PURE__ */ jsx(Clock, { size: 18, className: "text-amber-400" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-[11px] font-black uppercase tracking-[0.2em] text-[#4B6478]", children: "Durasi Trial Gratis" }),
                /* @__PURE__ */ jsx("p", { className: "text-[10px] text-[#4B6478] font-bold uppercase tracking-widest mt-0.5", children: "Konfigurasi first-user experience" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 px-5 py-4 rounded-2xl border border-white/5 bg-white/[0.02]", children: [
              /* @__PURE__ */ jsx("span", { className: "inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border bg-white/5 text-[#94A3B8] border-white/5 shrink-0", children: "STARTER" }),
              /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsx("p", { className: "text-[12px] font-bold text-[#94A3B8]", children: "Gratis Selamanya — tidak ada trial" }),
                /* @__PURE__ */ jsx("p", { className: "text-[11px] text-[#4B6478] mt-0.5", children: "Plan Starter tidak menggunakan mekanisme trial. Akses langsung tanpa batas waktu." })
              ] }),
              /* @__PURE__ */ jsx(Infinity, { size: 18, className: "text-[#2A3F52] shrink-0" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
              { key: "pro", label: "PRO", badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", hoverBorder: "hover:border-emerald-500/20", labelHover: "group-hover:text-emerald-500/60", previewColor: "text-emerald-400", inputFocus: "focus:border-emerald-500/40 focus:bg-emerald-500/5" },
              { key: "business", label: "BUSINESS", badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20", hoverBorder: "hover:border-amber-500/20", labelHover: "group-hover:text-amber-500/60", previewColor: "text-amber-400", inputFocus: "focus:border-amber-500/40 focus:bg-amber-500/5" }
            ].map((plan) => /* @__PURE__ */ jsxs("div", { className: `bg-white/[0.03] backdrop-blur-lg rounded-[32px] p-7 border border-white/5 space-y-5 ${plan.hoverBorder} transition-all duration-500 group`, children: [
              /* @__PURE__ */ jsx("span", { className: `inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border ${plan.badgeClass}`, children: plan.label }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("label", { htmlFor: `trial_${plan.key}`, className: `text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1 ${plan.labelHover} transition-colors`, children: "Durasi Trial (Hari)" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    id: `trial_${plan.key}`,
                    type: "number",
                    min: 1,
                    max: 365,
                    value: trialConfig[plan.key],
                    onChange: (e) => setTrialConfig((p) => ({ ...p, [plan.key]: parseInt(e.target.value) || 1 })),
                    className: `w-full bg-black/40 border-white/5 h-12 rounded-2xl px-4 text-sm text-white font-black shadow-inner ${plan.inputFocus} transition-all`
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-white/[0.02] rounded-2xl p-4 border border-white/5", children: [
                /* @__PURE__ */ jsx("p", { className: "text-[10px] text-[#4B6478] font-black uppercase tracking-[0.15em] mb-1.5", children: "Aktif trial sampai" }),
                /* @__PURE__ */ jsx("p", { className: `text-base font-black tracking-tight ${plan.previewColor}`, children: previewTrialDate(trialConfig[plan.key]) }),
                /* @__PURE__ */ jsx("p", { className: "text-[11px] text-[#4B6478] mt-0.5", children: "jika daftar hari ini" })
              ] })
            ] }, plan.key)) }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: handleSaveTrial,
                disabled: savingTrial,
                className: "w-full bg-emerald-500 hover:bg-emerald-600 text-white h-12 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(2, 26, 2,0.3)] border border-emerald-400/20 active:scale-[0.98]",
                children: savingTrial ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(Loader2, { size: 16, className: "animate-spin" }),
                  " MENYIMPAN..."
                ] }) : "SIMPAN KONFIGURASI TRIAL"
              }
            ),
            /* @__PURE__ */ jsx(ConfigHistoryWidget, { configKey: "trial_config", onRollback: handleRollback })
          ] })
        ] }),
        /* @__PURE__ */ jsx(TabsContent, { value: "security", className: "mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500", children: /* @__PURE__ */ jsxs("section", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 border-b border-white/5 pb-4", children: [
            /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center", children: /* @__PURE__ */ jsx(Shield, { className: "text-red-400", size: 18 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "text-lg font-black text-white uppercase tracking-tight", children: "Security & Compliance" }),
              /* @__PURE__ */ jsx("p", { className: "text-[11px] text-[#4B6478] font-bold uppercase tracking-widest mt-0.5", children: "Pengamanan ekstrim dan Logging" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "bg-white/[0.02] border border-white/5 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h3", { className: "text-[13px] font-bold text-white mb-1", children: "Audit Log Retention" }),
                /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400", children: "Berapa lama rekam jejak aksi disave di database, memenuhi SLA Compliance." })
              ] }),
              /* @__PURE__ */ jsxs(Select, { value: auditRetention, onValueChange: setAuditRetention, children: [
                /* @__PURE__ */ jsx(SelectTrigger, { className: "w-[200px] bg-black/40 border-white/10", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Pilih durasi" }) }),
                /* @__PURE__ */ jsxs(SelectContent, { className: "bg-[#111C24] border-white/10 text-white", children: [
                  /* @__PURE__ */ jsx(SelectItem, { value: "30", children: "30 Hari" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "60", children: "60 Hari" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "90", children: "90 Hari" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "custom", children: "Custom Range" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "forever", children: "Simpan Selamanya" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-red-500/5 border border-red-500/20 p-5 rounded-2xl space-y-4", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("h3", { className: "text-[13px] font-bold text-red-500 mb-1 flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(PowerOff, { size: 14 }),
                  " Force Logout All Users Phase"
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-[10px] text-red-400/70", children: "Tombol darurat ini memutus sesi login semua active user termasuk Anda sendiri. Tindakan tidak dapat diurung." })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row gap-3", children: [
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    placeholder: "Ketik CONFIRM di sini...",
                    value: killSwitchConfirm,
                    onChange: (e) => setKillSwitchConfirm(e.target.value),
                    className: "bg-black/40 border-red-500/30 text-white focus:border-red-500 placeholder:text-red-500/30"
                  }
                ),
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    variant: "destructive",
                    onClick: executeKillSwitch,
                    disabled: killSwitchConfirm !== "CONFIRM",
                    className: "bg-red-600 hover:bg-red-700 uppercase font-black tracking-widest px-8 shadow-lg shadow-red-600/20 shrink-0",
                    children: "Jalankan Kill Switch"
                  }
                )
              ] })
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx(TabsContent, { value: "site_info", className: "mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500", children: /* @__PURE__ */ jsxs("section", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 border-b border-white/5 pb-4", children: [
            /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center", children: /* @__PURE__ */ jsx(Info, { className: "text-sky-400", size: 18 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "text-lg font-black text-white uppercase tracking-tight", children: "Site Info" }),
              /* @__PURE__ */ jsx("p", { className: "text-[11px] text-[#4B6478] font-bold uppercase tracking-widest mt-0.5", children: "Metadata perusahaan & konten landing page" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxs("p", { className: "text-[11px] font-black uppercase tracking-widest text-[#4B6478] flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Building2, { size: 13 }),
              " Identitas Perusahaan"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
              { key: "company_name", label: "Nama Perusahaan", placeholder: "TernakOS" },
              { key: "company_url", label: "URL Utama", placeholder: "https://ternakos.my.id" },
              { key: "company_logo_url", label: "URL Logo", placeholder: "https://ternakos.my.id/logo.png" },
              { key: "company_description", label: "Deskripsi Singkat", placeholder: "Platform SaaS Manajemen Ternak..." }
            ].map(({ key, label, placeholder }) => /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black uppercase tracking-widest text-[#4B6478]", children: label }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  value: siteForm[key] ?? "",
                  onChange: (e) => setSiteForm((p) => ({ ...p, [key]: e.target.value })),
                  placeholder,
                  className: "bg-black/40 border-white/10 text-white text-sm"
                }
              )
            ] }, key)) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxs("p", { className: "text-[11px] font-black uppercase tracking-widest text-[#4B6478] flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Phone, { size: 13 }),
              " Kontak & Support"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
              { key: "company_phone", label: "Nomor Telepon (E.164)", placeholder: "+6281358925505" },
              { key: "contact_email", label: "Email Support", placeholder: "support@ternakos.my.id" },
              { key: "wa_url", label: "URL WhatsApp", placeholder: "https://wa.me/6281234567890" },
              { key: "business_hours", label: "Jam Operasional", placeholder: "Senin – Jumat, 08:00 – 17:00 WIB" }
            ].map(({ key, label, placeholder }) => /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black uppercase tracking-widest text-[#4B6478]", children: label }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  value: siteForm[key] ?? "",
                  onChange: (e) => setSiteForm((p) => ({ ...p, [key]: e.target.value })),
                  placeholder,
                  className: "bg-black/40 border-white/10 text-white text-sm"
                }
              )
            ] }, key)) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxs("p", { className: "text-[11px] font-black uppercase tracking-widest text-[#4B6478] flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Instagram, { size: 13 }),
              " Social Media"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
              { key: "instagram_url", label: "URL Instagram", placeholder: "https://instagram.com/ternakos.id" },
              { key: "linkedin_url", label: "URL LinkedIn", placeholder: "https://linkedin.com/company/ternakos" }
            ].map(({ key, label, placeholder }) => /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black uppercase tracking-widest text-[#4B6478]", children: label }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  value: siteForm[key] ?? "",
                  onChange: (e) => setSiteForm((p) => ({ ...p, [key]: e.target.value })),
                  placeholder,
                  className: "bg-black/40 border-white/10 text-white text-sm"
                }
              )
            ] }, key)) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxs("p", { className: "text-[11px] font-black uppercase tracking-widest text-[#4B6478] flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(BarChart3, { size: 13 }),
              " Statistik Landing Page"
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-[10px] text-[#4B6478]", children: "Tampil di StatsBar & About Us. Kosongkan untuk pakai data real dari database (diperbarui tiap jam)." }),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [
              { key: "stats_users", label: "Pengguna Aktif", placeholder: "100+" },
              { key: "stats_transactions", label: "Aktivitas Transaksi", placeholder: "1rb+" },
              { key: "stats_value", label: "Volume Penjualan", placeholder: "Rp 250M+" }
            ].map(({ key, label, placeholder }) => /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black uppercase tracking-widest text-[#4B6478]", children: label }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  value: siteForm[key] ?? "",
                  onChange: (e) => setSiteForm((p) => ({ ...p, [key]: e.target.value })),
                  placeholder,
                  className: "bg-black/40 border-white/10 text-white text-sm"
                }
              )
            ] }, key)) })
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: async () => {
                setSiteSaving(true);
                try {
                  await Promise.all(
                    Object.entries(siteForm).map(
                      ([key, value]) => updateSiteConfig.mutateAsync({ key, value })
                    )
                  );
                  toast.success("Informasi site berhasil disimpan");
                } catch {
                } finally {
                  setSiteSaving(false);
                }
              },
              disabled: siteSaving,
              className: "w-full bg-sky-500 hover:bg-sky-600 text-white h-12 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(14,165,233,0.3)] border border-sky-400/20 active:scale-[0.98]",
              children: siteSaving ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Loader2, { size: 16, className: "animate-spin" }),
                " MENYIMPAN..."
              ] }) : "SIMPAN SITE INFO"
            }
          )
        ] }) })
      ] })
    ] })
  ] });
}
function ConfirmSaveDialog({ open, onOpenChange, title, configKey, oldValue, newValue, onConfirm }) {
  const renderValue = (val) => {
    if (val == null) return /* @__PURE__ */ jsx("span", { className: "text-slate-500 italic", children: "belum diset" });
    if (typeof val === "object") {
      return /* @__PURE__ */ jsx("pre", { className: "text-[11px] bg-black/60 rounded-xl p-3 border border-white/5 overflow-auto max-h-40 text-slate-300 font-mono", children: JSON.stringify(val, null, 2) });
    }
    return /* @__PURE__ */ jsx("span", { className: "font-bold text-white", children: String(val) });
  };
  const getChanges = () => {
    if (!oldValue || !newValue || typeof oldValue !== "object" || typeof newValue !== "object") return null;
    const changes2 = [];
    const allKeys = /* @__PURE__ */ new Set([...Object.keys(oldValue), ...Object.keys(newValue)]);
    for (const k of allKeys) {
      const o = typeof oldValue[k] === "object" ? JSON.stringify(oldValue[k]) : oldValue[k];
      const n = typeof newValue[k] === "object" ? JSON.stringify(newValue[k]) : newValue[k];
      if (o !== n) changes2.push({ key: k, old: oldValue[k], new: newValue[k] });
    }
    return changes2.length > 0 ? changes2 : null;
  };
  const changes = getChanges();
  return /* @__PURE__ */ jsx(AlertDialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(AlertDialogContent, { className: "bg-[#0C1319] border border-white/10 w-[calc(100vw-2rem)] max-w-2xl overflow-hidden", children: [
    /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
      /* @__PURE__ */ jsxs(AlertDialogTitle, { className: "text-white font-black uppercase tracking-tight flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { size: 18, className: "text-amber-500" }),
        title
      ] }),
      /* @__PURE__ */ jsx(AlertDialogDescription, { asChild: true, children: /* @__PURE__ */ jsxs("div", { className: "space-y-4 pt-2", children: [
        /* @__PURE__ */ jsx("p", { className: "text-[11px] text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2", children: "⚠ Perubahan ini berdampak ke SELURUH tenant aktif secara realtime. Pastikan nilainya benar." }),
        /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-slate-500 font-mono", children: [
          "Config: ",
          configKey
        ] }),
        changes ? /* @__PURE__ */ jsxs("div", { className: "space-y-2 max-h-[45vh] overflow-y-auto overflow-x-hidden", children: [
          /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-slate-500", children: "Perubahan Terdeteksi:" }),
          changes.map((c) => /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2 text-[11px] bg-white/[0.03] rounded-lg px-3 py-2 border border-white/5 min-w-0 overflow-hidden", children: [
            /* @__PURE__ */ jsx("span", { className: "text-slate-400 font-mono shrink-0", children: c.key }),
            /* @__PURE__ */ jsx("span", { className: "text-red-400 font-bold line-through break-all min-w-0", children: JSON.stringify(c.old) }),
            /* @__PURE__ */ jsx(ArrowRight, { size: 12, className: "text-slate-600 shrink-0 hidden sm:block" }),
            /* @__PURE__ */ jsx("span", { className: "text-emerald-400 font-bold break-all min-w-0", children: JSON.stringify(c.new) })
          ] }, c.key))
        ] }) : /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-red-400/60 mb-1", children: "Sebelum (DB)" }),
            renderValue(oldValue)
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-emerald-400/60 mb-1", children: "Sesudah (Baru)" }),
            renderValue(newValue)
          ] })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs(AlertDialogFooter, { className: "mt-4", children: [
      /* @__PURE__ */ jsx(AlertDialogCancel, { className: "bg-white/5 border-white/10 text-white hover:bg-white/10 uppercase text-[10px] font-black tracking-widest", children: "Batal" }),
      /* @__PURE__ */ jsxs(
        AlertDialogAction,
        {
          onClick: onConfirm,
          className: "bg-emerald-500 hover:bg-emerald-600 text-white uppercase text-[10px] font-black tracking-widest shadow-[0_0_20px_rgba(2, 26, 2,0.3)]",
          children: [
            /* @__PURE__ */ jsx(Save, { size: 14, className: "mr-2" }),
            "Konfirmasi & Simpan"
          ]
        }
      )
    ] })
  ] }) });
}
function ConfigHistoryWidget({ configKey, onRollback }) {
  const { data: history } = usePlanConfigHistory(configKey);
  const [isOpen, setIsOpen] = useState(false);
  if (!(history == null ? void 0 : history.length)) return null;
  return /* @__PURE__ */ jsxs("div", { className: "mt-1", children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => setIsOpen((v) => !v),
        className: "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#4B6478] hover:text-white/60 transition-colors py-1",
        children: [
          /* @__PURE__ */ jsx(History, { size: 12 }),
          isOpen ? "Sembunyikan" : "Lihat",
          " riwayat (",
          history.length,
          ")"
        ]
      }
    ),
    isOpen && /* @__PURE__ */ jsx("div", { className: "mt-2 space-y-2", children: history.map((entry) => /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3 bg-white/[0.02] border border-white/5 rounded-xl p-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsx("p", { className: "text-[10px] text-[#4B6478]", children: format(new Date(entry.created_at), "d MMM yyyy HH:mm", { locale: id }) }),
        /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-white/40 truncate mt-0.5 font-mono", children: [
          JSON.stringify(entry.old_data),
          " → ",
          JSON.stringify(entry.new_data)
        ] })
      ] }),
      entry.old_data != null && /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => onRollback(configKey, entry.old_data),
          className: "text-[10px] font-black uppercase tracking-widest text-amber-400/70 hover:text-amber-400 transition-colors whitespace-nowrap shrink-0",
          children: "Rollback"
        }
      )
    ] }, entry.id)) })
  ] });
}
function PlanLimitCard({ planName, badgeClass, badgeExtra, kandangValue, teamValue, businessValue, onKandangChange, onTeamChange, onBusinessChange, readOnly }) {
  const isUnlimited = (v) => Number(v) >= 99;
  const isUnlimitedBusiness = (v) => Number(v) >= 999;
  const inputCls = "w-full bg-black/40 border border-white/5 h-12 rounded-2xl px-4 text-sm text-white font-black focus:outline-none focus:border-emerald-500/40 focus:bg-emerald-500/5 transition-all shadow-inner disabled:opacity-50";
  return /* @__PURE__ */ jsxs("div", { className: "bg-white/[0.03] backdrop-blur-lg rounded-[32px] p-7 border border-white/5 space-y-6 hover:border-white/10 transition-all duration-500 group", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 flex-wrap", children: [
      /* @__PURE__ */ jsx("span", { className: `inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border border-white/5 ${badgeClass}`, children: planName }),
      badgeExtra && /* @__PURE__ */ jsx("span", { className: "text-[9px] font-black text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/10 animate-pulse", children: badgeExtra })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx("label", { htmlFor: `bl_${planName}`, className: "text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1 group-hover:text-purple-500/60 transition-colors", children: "Business Limit (Jatah Bisnis)" }),
      isUnlimitedBusiness(businessValue) ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex-1 h-12 rounded-2xl bg-purple-500/5 border border-purple-500/20 flex items-center px-4 gap-2 text-sm font-black text-purple-400 shadow-[inset_0_0_20px_rgba(168,85,247,0.05)]", children: [
          /* @__PURE__ */ jsx(Infinity, { size: 16 }),
          " Unlimited"
        ] }),
        /* @__PURE__ */ jsx(
          "input",
          {
            id: `bl_${planName}`,
            type: "number",
            value: businessValue,
            onChange: (e) => onBusinessChange(parseInt(e.target.value) || 1),
            className: "w-16 bg-black/40 border-white/5 h-12 rounded-xl px-2 text-sm text-white/40 font-black text-center"
          }
        )
      ] }) : /* @__PURE__ */ jsx(
        "input",
        {
          id: `bl_${planName}`,
          type: "number",
          min: 1,
          max: 999,
          value: businessValue,
          onChange: (e) => onBusinessChange(parseInt(e.target.value) || 1),
          className: inputCls
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx("label", { htmlFor: `kl_${planName}`, className: "text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1 group-hover:text-emerald-500/60 transition-colors", children: "Kandang Limit" }),
      readOnly ? /* @__PURE__ */ jsxs("div", { className: "h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center px-4 gap-2 text-sm font-black text-white/30", children: [
        /* @__PURE__ */ jsx(Infinity, { size: 16 }),
        " Unlimited Access"
      ] }) : isUnlimited(kandangValue) ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex-1 h-12 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-center px-4 gap-2 text-sm font-black text-emerald-400 shadow-[inset_0_0_20px_rgba(2, 26, 2,0.05)]", children: [
          /* @__PURE__ */ jsx(Infinity, { size: 16 }),
          " Unlimited"
        ] }),
        /* @__PURE__ */ jsx(
          "input",
          {
            id: `kl_${planName}`,
            type: "number",
            value: kandangValue,
            onChange: (e) => onKandangChange(parseInt(e.target.value) || 1),
            className: "w-16 bg-black/40 border-white/5 h-12 rounded-xl px-2 text-sm text-white/40 font-black text-center"
          }
        )
      ] }) : /* @__PURE__ */ jsx(
        "input",
        {
          id: `kl_${planName}`,
          type: "number",
          min: 1,
          max: 99,
          value: kandangValue,
          onChange: (e) => onKandangChange(parseInt(e.target.value) || 1),
          className: inputCls
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx("label", { htmlFor: `tl_${planName}`, className: "text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1 group-hover:text-emerald-500/60 transition-colors", children: "Max Anggota Tim" }),
      readOnly ? /* @__PURE__ */ jsxs("div", { className: "h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center px-4 gap-2 text-sm font-black text-white/30", children: [
        /* @__PURE__ */ jsx(Infinity, { size: 16 }),
        " Unlimited Access"
      ] }) : /* @__PURE__ */ jsx(
        "input",
        {
          id: `tl_${planName}`,
          type: "number",
          min: 1,
          max: 99,
          value: teamValue,
          onChange: (e) => onTeamChange(parseInt(e.target.value) || 1),
          className: inputCls
        }
      )
    ] })
  ] });
}
export {
  AdminSettings as default
};
