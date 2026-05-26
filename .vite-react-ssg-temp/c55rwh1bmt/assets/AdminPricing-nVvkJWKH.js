import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Loader2, Building2, Egg, ShoppingBasket, Home, Factory, Sparkles, Check, Tag, Infinity, RefreshCcw, Copy, Trash2, AlertCircle, ShieldAlert, CheckCircle2, MapPin, CalendarClock, XCircle } from "lucide-react";
import { bi as usePricingConfig, bB as useDiscountCodes, aI as usePlanConfigs, bC as useUpdatePricing, bD as useUpdatePlanConfig, bE as useCreateDiscountCode, bF as useToggleDiscountCode, bG as useDeleteDiscountCode, bH as useMarketPriceReviewQueue, bI as useApproveMarketPrice, bJ as useDeleteMarketPrice, a7 as Button, ag as Tabs, ah as TabsList, ai as TabsTrigger, aj as TabsContent, aA as Badge, aq as formatIDR, a0 as Input, aw as Card, a2 as Select, a3 as SelectTrigger, a4 as SelectValue, a5 as SelectContent, a6 as SelectItem, aB as formatDate, af as Switch } from "../main.mjs";
import { toast } from "sonner";
import { z } from "zod";
import { I as InputRupiah } from "./InputRupiah-Cjv6-Pgv.js";
import "vite-react-ssg";
import "react-router-dom";
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
const PRICING_FEATURES = [
  { label: "Multi-Tenant (1 Bisnis)", starter: true, pro: true, business: true },
  { label: "Manajemen Tim & Gaji", starter: true, pro: true, business: true },
  { label: "Laporan Dashboard Harian", starter: true, pro: true, business: true },
  { label: "Backup Cloud Gratis", starter: true, pro: true, business: true },
  { label: "Fitur Khusus RPA & RPA Buyer", starter: false, pro: true, business: true },
  { label: "Laporan Laba/Rugi Detail", starter: false, pro: true, business: true },
  { label: "Input Transaksi Tanpa Limit", starter: false, pro: true, business: true },
  { label: "Prioritas Customer Support", starter: false, pro: false, business: true },
  { label: "Audit Log Perubahan Data", starter: false, pro: false, business: true },
  { label: "Whitelist IP & Keamanan Extra", starter: false, pro: false, business: true }
];
const pricingSchema = z.object({
  price: z.number().min(0, "Harga aktif tidak boleh negatif"),
  originalPrice: z.number().min(0, "Harga asli tidak boleh negatif")
});
function AdminPricing() {
  var _a, _b, _c, _d;
  const { data: pricing, isLoading: isLoadingPricing } = usePricingConfig();
  const { data: vouchers, isLoading: isLoadingVouchers } = useDiscountCodes();
  const { data: configs = {} } = usePlanConfigs();
  const updatePricing = useUpdatePricing();
  const updateConfig = useUpdatePlanConfig();
  const createVoucher = useCreateDiscountCode();
  const toggleVoucher = useToggleDiscountCode();
  const deleteVoucher = useDeleteDiscountCode();
  const { data: reviewQueue = [], isLoading: isLoadingQueue } = useMarketPriceReviewQueue();
  const approvePrice = useApproveMarketPrice();
  const deletePrice = useDeleteMarketPrice();
  const [activeTab, setActiveTab] = useState("plans");
  const [selectedCategory, setSelectedCategory] = useState("broker");
  const [selectedPeternakType, setSelectedPeternakType] = useState("all");
  const [editingPricing, setEditingPricing] = useState(null);
  const [savingRole, setSavingRole] = useState(null);
  const [formKey, setFormKey] = useState(0);
  const [addonPricing, setAddonPricing] = useState({
    price_per_type: 99e3,
    max_addons_before_upgrade: 2,
    business_slot_price: 15e4
    // New: Default price for additional business slots
  });
  const [savingAddon, setSavingAddon] = useState(false);
  const [annualDiscount, setAnnualDiscount] = useState({
    discount_percent: 20,
    badge_text: "Hemat 2 bln!"
  });
  const [savingDiscount, setSavingDiscount] = useState(false);
  const [configsInited, setConfigsInited] = useState(false);
  useMemo(() => {
    if (pricing && !editingPricing) {
      const defaultRoles = [
        "broker_ayam",
        "broker_telur",
        "broker_distributor",
        "broker_sembako",
        "peternak_ayam_broiler",
        "peternak_ayam_layer",
        "peternak_sapi_potong_fattening",
        "peternak_sapi_potong_breeding",
        "peternak_sapi_perah",
        "peternak_kambing_potong_fattening",
        "peternak_kambing_potong_breeding",
        "peternak_kambing_perah",
        "peternak_domba_potong_fattening",
        "peternak_domba_potong_breeding",
        "rpa_buyer",
        "rpa_rph"
      ];
      const mergedPricing = { ...pricing };
      defaultRoles.forEach((role) => {
        if (!mergedPricing[role]) {
          mergedPricing[role] = {
            pro: { price: 299e3, originalPrice: 499e3 },
            business: { price: 799e3, originalPrice: 1299e3 }
          };
        }
      });
      setEditingPricing(mergedPricing);
    }
  }, [pricing, editingPricing]);
  useMemo(() => {
    if (configs && Object.keys(configs).length > 0 && !configsInited) {
      if (configs.addon_pricing) setAddonPricing((v) => ({ ...v, ...configs.addon_pricing }));
      if (configs.annual_discount) setAnnualDiscount((v) => ({ ...v, ...configs.annual_discount }));
      setConfigsInited(true);
    }
  }, [configs, configsInited]);
  const handleSaveAllPricing = async () => {
    setSavingRole("all");
    try {
      const roles = [
        "broker_ayam",
        "broker_telur",
        "broker_distributor",
        "broker_sembako",
        "peternak_ayam_broiler",
        "peternak_ayam_layer",
        "peternak_sapi_potong_fattening",
        "peternak_sapi_potong_breeding",
        "peternak_sapi_perah",
        "peternak_kambing_potong_fattening",
        "peternak_kambing_potong_breeding",
        "peternak_kambing_perah",
        "peternak_domba_potong_fattening",
        "peternak_domba_potong_breeding",
        "rpa_buyer",
        "rpa_rph"
      ];
      const promises = roles.flatMap((role) => {
        if (!editingPricing[role]) return [];
        return [
          updatePricing.mutateAsync({
            role,
            plan: "pro",
            price: editingPricing[role].pro.price,
            originalPrice: editingPricing[role].pro.originalPrice
          }),
          updatePricing.mutateAsync({
            role,
            plan: "business",
            price: editingPricing[role].business.price,
            originalPrice: editingPricing[role].business.originalPrice
          })
        ];
      });
      await Promise.all(promises);
      toast.success("Semua perubahan harga berhasil disimpan!");
    } catch (err) {
      toast.error("Gagal menyimpan sebagian harga: " + (err.message || "Error Unknown"));
    } finally {
      setSavingRole(null);
    }
  };
  const handlePriceChange = (role, plan, field, value) => {
    const numericValue = typeof value === "number" ? value : parseInt(String(value).replace(/\D/g, "")) || 0;
    setEditingPricing((prev) => {
      const prevRole = prev[role] || { pro: {}, business: {} };
      const prevPlan = prevRole[plan] || {};
      return {
        ...prev,
        [role]: {
          ...prevRole,
          [plan]: {
            ...prevPlan,
            [field]: numericValue
          }
        }
      };
    });
  };
  const handleSavePricing = async (role) => {
    setSavingRole(role);
    try {
      pricingSchema.parse(editingPricing[role].pro);
      pricingSchema.parse(editingPricing[role].business);
      await Promise.all([
        updatePricing.mutateAsync({
          role,
          plan: "pro",
          price: editingPricing[role].pro.price,
          originalPrice: editingPricing[role].pro.originalPrice
        }),
        updatePricing.mutateAsync({
          role,
          plan: "business",
          price: editingPricing[role].business.price,
          originalPrice: editingPricing[role].business.originalPrice
        })
      ]);
      toast.success(`Pricing ${role.toUpperCase()} diperbarui`);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      }
    } finally {
      setSavingRole(null);
    }
  };
  const handleCreateVoucher = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      code: formData.get("code").toUpperCase(),
      discount_type: formData.get("discount_type"),
      discount_value: parseInt(formData.get("discount_value")) || 0,
      applies_to_plan: formData.get("applies_to_plan"),
      applies_to_role: formData.get("applies_to_role"),
      expires_at: formData.get("expires_at") || null,
      max_usage: formData.get("max_usage") ? parseInt(formData.get("max_usage")) : null
    };
    if (payload.discount_type === "percentage" && payload.discount_value > 100) {
      toast.error("Persentase tidak boleh lebih dari 100%");
      return;
    }
    createVoucher.mutate(payload, {
      onSuccess: () => setFormKey((k) => k + 1)
    });
  };
  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    toast.success("Kode diskon disalin!");
  };
  const handleSaveAddon = async () => {
    setSavingAddon(true);
    try {
      await updateConfig.mutateAsync({ config_key: "addon_pricing", config_value: addonPricing });
      toast.success("Harga Add-on berhasil disimpan");
    } catch {
    } finally {
      setSavingAddon(false);
    }
  };
  const handleSaveDiscount = async () => {
    setSavingDiscount(true);
    try {
      await updateConfig.mutateAsync({ config_key: "annual_discount", config_value: annualDiscount });
      toast.success("Skema diskon tahunan berhasil disimpan");
    } catch {
    } finally {
      setSavingDiscount(false);
    }
  };
  if (isLoadingPricing || !editingPricing) {
    return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center min-h-[400px]", children: /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" }) });
  }
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 overflow-hidden pointer-events-none z-0", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full opacity-50" }),
      /* @__PURE__ */ jsx("div", { className: "absolute bottom-[10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/5 blur-[120px] rounded-full opacity-50" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-20 md:top-20 lg:top-0 z-20 bg-[#080C10]/60 backdrop-blur-xl border border-white/5 py-4 -mx-2 px-6 rounded-2xl shadow-xl", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "font-display text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("span", { className: "w-1.5 h-6 bg-emerald-500 rounded-full" }),
          "Pricing & Discounts"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mt-1 ml-4", children: "Kelola skema pendapatan & promosi platform" })
      ] }),
      activeTab === "plans" && /* @__PURE__ */ jsx(
        Button,
        {
          onClick: handleSaveAllPricing,
          disabled: savingRole === "all",
          className: "hidden md:flex bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-11 px-8 text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(2, 26, 2,0.3)] transition-all active:scale-95 border border-emerald-400/20",
          children: savingRole === "all" ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(Loader2, { size: 14, className: "animate-spin mr-2" }),
            " Menyiimpan..."
          ] }) : "Simpan Semua Perubahan"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "w-full relative z-10", children: [
      /* @__PURE__ */ jsx(TabsList, { className: "bg-white/[0.03] backdrop-blur-md border border-white/5 p-1 h-14 rounded-2xl mb-10 w-full flex overflow-x-auto overflow-y-hidden scrollbar-hide flex-nowrap sticky top-[10rem] md:top-[10rem] lg:relative lg:top-0 z-10 shadow-2xl items-center justify-start", children: [
        { id: "plans", label: "Harga Plan" },
        { id: "addons", label: "Add-on Pricing" },
        { id: "discounts", label: "Diskon Tahunan" },
        { id: "vouchers", label: "Kode Diskon" },
        { id: "review", label: "Review Harga", badge: reviewQueue.length || null }
      ].map((tab) => /* @__PURE__ */ jsxs(
        TabsTrigger,
        {
          value: tab.id,
          className: "flex-1 shrink-0 min-w-[120px] relative rounded-xl font-bold uppercase text-[10px] md:text-[11px] tracking-widest transition-colors data-[state=active]:text-white text-[#4B6478] hover:text-white/60 h-full z-10 bg-transparent",
          children: [
            activeTab === tab.id && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-white/5 rounded-xl border border-white/10 shadow-lg" }),
            /* @__PURE__ */ jsxs("span", { className: "relative z-10 flex items-center gap-1.5", children: [
              tab.label,
              tab.badge ? /* @__PURE__ */ jsx("span", { className: "bg-amber-500 text-black text-[8px] font-black rounded-full px-1.5 py-0.5 leading-none", children: tab.badge }) : null
            ] })
          ]
        },
        tab.id
      )) }),
      /* @__PURE__ */ jsxs(TabsContent, { value: "plans", className: "space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500", children: [
        /* @__PURE__ */ jsx("div", { className: "flex flex-wrap justify-center gap-2 p-1.5 bg-white/5 backdrop-blur-md rounded-2xl w-fit mx-auto border border-white/10 shadow-lg", children: [
          { id: "broker", label: "Broker & Distributor" },
          { id: "peternak", label: "Peternak" },
          { id: "rpa", label: "Rumah Potong (RPA/RPH)" }
        ].map((cat) => /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setSelectedCategory(cat.id),
            className: `px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${selectedCategory === cat.id ? "bg-emerald-500 text-white shadow-[0_0_15px_rgba(2, 26, 2,0.4)]" : "text-[#4B6478] hover:text-white hover:bg-white/10"}`,
            children: cat.label
          },
          cat.id
        )) }),
        selectedCategory === "peternak" && /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-3 mb-8 bg-white/[0.02] p-2 rounded-2xl border border-white/5", children: [
          { id: "all", label: "Semua Ternak" },
          { id: "ayam", label: "Ayam" },
          { id: "sapi", label: "Sapi" },
          { id: "kambing", label: "Kambing" },
          { id: "domba", label: "Domba" }
        ].map((t) => /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setSelectedPeternakType(t.id),
            className: `px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${selectedPeternakType === t.id ? "bg-purple-500/80 text-white shadow-lg" : "text-[#4B6478] hover:text-white hover:bg-white/10"}`,
            children: t.label
          },
          t.id
        )) }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8", children: [
          selectedCategory === "broker" && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(
              RolePricingCard,
              {
                roleName: "Broker Ayam",
                roleId: "broker_ayam",
                icon: Building2,
                color: "emerald",
                data: editingPricing.broker_ayam ?? { pro: { price: 299e3, originalPrice: 899999 }, business: { price: 599e3, originalPrice: 1499999 } },
                onChange: handlePriceChange,
                onSave: () => handleSavePricing("broker_ayam"),
                isSaving: savingRole === "broker_ayam",
                vertical: "broker_ayam"
              }
            ),
            /* @__PURE__ */ jsx(
              RolePricingCard,
              {
                roleName: "Broker Telur",
                roleId: "broker_telur",
                icon: Egg,
                color: "sky",
                data: editingPricing.broker_telur ?? { pro: { price: 299e3, originalPrice: 899999 }, business: { price: 599e3, originalPrice: 1499999 } },
                onChange: handlePriceChange,
                onSave: () => handleSavePricing("broker_telur"),
                isSaving: savingRole === "broker_telur",
                vertical: "broker_telur"
              }
            ),
            /* @__PURE__ */ jsx(
              RolePricingCard,
              {
                roleName: "Distributor Sembako",
                roleId: "broker_sembako",
                icon: ShoppingBasket,
                color: "rose",
                data: editingPricing.broker_sembako ?? { pro: { price: 249e3, originalPrice: 299e3 }, business: { price: 499e3, originalPrice: 599e3 } },
                onChange: handlePriceChange,
                onSave: () => handleSavePricing("broker_sembako"),
                isSaving: savingRole === "broker_sembako",
                vertical: "broker_sembako"
              }
            ),
            /* @__PURE__ */ jsx(
              RolePricingCard,
              {
                roleName: "Distributor Daging",
                roleId: "broker_distributor",
                icon: Building2,
                color: "sky",
                data: editingPricing.broker_distributor ?? { pro: { price: 299e3, originalPrice: 399e3 }, business: { price: 599e3, originalPrice: 899e3 } },
                onChange: handlePriceChange,
                onSave: () => handleSavePricing("broker_distributor"),
                isSaving: savingRole === "broker_distributor",
                vertical: "broker_distributor"
              }
            )
          ] }),
          selectedCategory === "peternak" && /* @__PURE__ */ jsxs(Fragment, { children: [
            (selectedPeternakType === "all" || selectedPeternakType === "ayam") && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(
                RolePricingCard,
                {
                  roleName: "Peternak Ayam Broiler",
                  roleId: "peternak_ayam_broiler",
                  icon: Home,
                  color: "purple",
                  data: editingPricing.peternak_ayam_broiler ?? { pro: { price: 149e3, originalPrice: 249e3 }, business: { price: 449e3, originalPrice: 699e3 } },
                  onChange: handlePriceChange,
                  onSave: () => handleSavePricing("peternak_ayam_broiler"),
                  isSaving: savingRole === "peternak_ayam_broiler",
                  vertical: "peternak_ayam_broiler"
                }
              ),
              /* @__PURE__ */ jsx(
                RolePricingCard,
                {
                  roleName: "Peternak Ayam Layer",
                  roleId: "peternak_ayam_layer",
                  icon: Home,
                  color: "amber",
                  data: editingPricing.peternak_ayam_layer ?? { pro: { price: 149e3, originalPrice: 249e3 }, business: { price: 449e3, originalPrice: 699e3 } },
                  onChange: handlePriceChange,
                  onSave: () => handleSavePricing("peternak_ayam_layer"),
                  isSaving: savingRole === "peternak_ayam_layer",
                  vertical: "peternak_ayam_layer"
                }
              )
            ] }),
            (selectedPeternakType === "all" || selectedPeternakType === "sapi") && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(
                RolePricingCard,
                {
                  roleName: "Sapi Potong (Fattening)",
                  roleId: "peternak_sapi_potong_fattening",
                  icon: Home,
                  color: "emerald",
                  data: editingPricing.peternak_sapi_potong_fattening ?? { pro: { price: 499e3, originalPrice: 699e3 }, business: { price: 999e3, originalPrice: 1999e3 } },
                  onChange: handlePriceChange,
                  onSave: () => handleSavePricing("peternak_sapi_potong_fattening"),
                  isSaving: savingRole === "peternak_sapi_potong_fattening",
                  vertical: "peternak_sapi_potong_fattening"
                }
              ),
              /* @__PURE__ */ jsx(
                RolePricingCard,
                {
                  roleName: "Sapi Potong (Breeding)",
                  roleId: "peternak_sapi_potong_breeding",
                  icon: Home,
                  color: "emerald",
                  data: editingPricing.peternak_sapi_potong_breeding ?? { pro: { price: 499e3, originalPrice: 699e3 }, business: { price: 999e3, originalPrice: 1999e3 } },
                  onChange: handlePriceChange,
                  onSave: () => handleSavePricing("peternak_sapi_potong_breeding"),
                  isSaving: savingRole === "peternak_sapi_potong_breeding",
                  vertical: "peternak_sapi_potong_breeding"
                }
              ),
              /* @__PURE__ */ jsx(
                RolePricingCard,
                {
                  roleName: "Sapi Perah",
                  roleId: "peternak_sapi_perah",
                  icon: Home,
                  color: "sky",
                  data: editingPricing.peternak_sapi_perah ?? { pro: { price: 499e3, originalPrice: 699e3 }, business: { price: 999e3, originalPrice: 1999e3 } },
                  onChange: handlePriceChange,
                  onSave: () => handleSavePricing("peternak_sapi_perah"),
                  isSaving: savingRole === "peternak_sapi_perah",
                  vertical: "peternak_sapi_perah"
                }
              )
            ] }),
            (selectedPeternakType === "all" || selectedPeternakType === "kambing") && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(
                RolePricingCard,
                {
                  roleName: "Kambing Potong (Fattening)",
                  roleId: "peternak_kambing_potong_fattening",
                  icon: Home,
                  color: "amber",
                  data: editingPricing.peternak_kambing_potong_fattening ?? { pro: { price: 499e3, originalPrice: 699e3 }, business: { price: 999e3, originalPrice: 1999e3 } },
                  onChange: handlePriceChange,
                  onSave: () => handleSavePricing("peternak_kambing_potong_fattening"),
                  isSaving: savingRole === "peternak_kambing_potong_fattening",
                  vertical: "peternak_kambing_potong_fattening"
                }
              ),
              /* @__PURE__ */ jsx(
                RolePricingCard,
                {
                  roleName: "Kambing Potong (Breeding)",
                  roleId: "peternak_kambing_potong_breeding",
                  icon: Home,
                  color: "amber",
                  data: editingPricing.peternak_kambing_potong_breeding ?? { pro: { price: 499e3, originalPrice: 699e3 }, business: { price: 999e3, originalPrice: 1999e3 } },
                  onChange: handlePriceChange,
                  onSave: () => handleSavePricing("peternak_kambing_potong_breeding"),
                  isSaving: savingRole === "peternak_kambing_potong_breeding",
                  vertical: "peternak_kambing_potong_breeding"
                }
              ),
              /* @__PURE__ */ jsx(
                RolePricingCard,
                {
                  roleName: "Kambing Perah",
                  roleId: "peternak_kambing_perah",
                  icon: Home,
                  color: "amber",
                  data: editingPricing.peternak_kambing_perah ?? { pro: { price: 499e3, originalPrice: 699e3 }, business: { price: 999e3, originalPrice: 1999e3 } },
                  onChange: handlePriceChange,
                  onSave: () => handleSavePricing("peternak_kambing_perah"),
                  isSaving: savingRole === "peternak_kambing_perah",
                  vertical: "peternak_kambing_perah"
                }
              )
            ] }),
            (selectedPeternakType === "all" || selectedPeternakType === "domba") && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(
                RolePricingCard,
                {
                  roleName: "Domba Potong (Fattening)",
                  roleId: "peternak_domba_potong_fattening",
                  icon: Home,
                  color: "purple",
                  data: editingPricing.peternak_domba_potong_fattening ?? { pro: { price: 499e3, originalPrice: 699e3 }, business: { price: 999e3, originalPrice: 1999e3 } },
                  onChange: handlePriceChange,
                  onSave: () => handleSavePricing("peternak_domba_potong_fattening"),
                  isSaving: savingRole === "peternak_domba_potong_fattening",
                  vertical: "peternak_domba_potong_fattening"
                }
              ),
              /* @__PURE__ */ jsx(
                RolePricingCard,
                {
                  roleName: "Domba Potong (Breeding)",
                  roleId: "peternak_domba_potong_breeding",
                  icon: Home,
                  color: "purple",
                  data: editingPricing.peternak_domba_potong_breeding ?? { pro: { price: 499e3, originalPrice: 699e3 }, business: { price: 999e3, originalPrice: 1999e3 } },
                  onChange: handlePriceChange,
                  onSave: () => handleSavePricing("peternak_domba_potong_breeding"),
                  isSaving: savingRole === "peternak_domba_potong_breeding",
                  vertical: "peternak_domba_potong_breeding"
                }
              )
            ] })
          ] }),
          selectedCategory === "rpa" && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(
              RolePricingCard,
              {
                roleName: "RPA Buyer",
                roleId: "rpa_buyer",
                icon: Factory,
                color: "amber",
                data: editingPricing.rpa_buyer ?? { pro: { price: 699e3, originalPrice: 999e3 }, business: { price: 1499e3, originalPrice: 2499e3 } },
                onChange: handlePriceChange,
                onSave: () => handleSavePricing("rpa_buyer"),
                isSaving: savingRole === "rpa_buyer",
                vertical: "rpa_buyer"
              }
            ),
            /* @__PURE__ */ jsx(
              RolePricingCard,
              {
                roleName: "Rumah Potong (RPH)",
                roleId: "rpa_rph",
                icon: Factory,
                color: "rose",
                data: editingPricing.rpa_rph ?? { pro: { price: 699e3, originalPrice: 999e3 }, business: { price: 1499e3, originalPrice: 2499e3 } },
                onChange: handlePriceChange,
                onSave: () => handleSavePricing("rpa_rph"),
                isSaving: savingRole === "rpa_rph",
                vertical: "rpa_rph"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("section", { className: "space-y-10", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-6", children: [
            /* @__PURE__ */ jsx("div", { className: "h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" }),
            /* @__PURE__ */ jsx("h2", { className: "text-[11px] font-black text-[#4B6478] uppercase tracking-[0.4em] whitespace-nowrap bg-[#080C10] px-4 py-1 rounded-full border border-white/5", children: "PREVIEW TAMPILAN PRICING" }),
            /* @__PURE__ */ jsx("div", { className: "h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white/[0.02] backdrop-blur-2xl rounded-[40px] border border-white/5 overflow-hidden shadow-[0_32px_120px_rgba(0,0,0,0.6)] max-w-5xl mx-auto group", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" }),
            /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse relative z-10", children: [
              /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-white/[0.01] border-b border-white/5", children: [
                /* @__PURE__ */ jsx("th", { className: "px-10 py-10 text-[11px] font-black uppercase text-[#4B6478] tracking-widest", children: "Fitur & Benefit" }),
                /* @__PURE__ */ jsxs("th", { className: "px-8 py-10 text-center", children: [
                  /* @__PURE__ */ jsx("div", { className: "bg-white/5 inline-flex p-1 rounded-lg mb-4", children: /* @__PURE__ */ jsx(Badge, { className: "bg-transparent text-white/40 border-none font-black uppercase tracking-widest text-[9px]", children: "STARTER" }) }),
                  /* @__PURE__ */ jsx("p", { className: "text-3xl font-display font-black text-white tracking-tight", children: "GRATIS" }),
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-[#4B6478] uppercase mt-2", children: "Selamanya" })
                ] }),
                /* @__PURE__ */ jsxs("th", { className: "px-8 py-10 text-center bg-emerald-500/[0.03] relative min-w-[200px]", children: [
                  /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 p-4", children: /* @__PURE__ */ jsx(Sparkles, { size: 16, className: "text-emerald-400 opacity-20" }) }),
                  /* @__PURE__ */ jsx("div", { className: "bg-emerald-500/10 inline-flex p-1 rounded-lg mb-4 border border-emerald-500/20", children: /* @__PURE__ */ jsx(Badge, { className: "bg-transparent text-emerald-400 border-none font-black uppercase tracking-widest text-[9px]", children: "PRO" }) }),
                  editingPricing.broker.pro.originalPrice > 0 && /* @__PURE__ */ jsx("p", { className: "line-through text-[#4B6478] text-xs mb-1 font-bold", children: formatIDR(editingPricing.broker.pro.originalPrice) }),
                  /* @__PURE__ */ jsx("p", { className: "text-3xl font-display font-black text-emerald-400 tracking-tight drop-shadow-[0_0_15px_rgba(2, 26, 2,0.3)]", children: formatIDR(editingPricing.broker.pro.price) }),
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-emerald-500/60 uppercase mt-2", children: "Per Bulan" })
                ] }),
                /* @__PURE__ */ jsxs("th", { className: "px-8 py-10 text-center bg-amber-500/[0.03] min-w-[200px]", children: [
                  /* @__PURE__ */ jsx("div", { className: "bg-amber-500/10 inline-flex p-1 rounded-lg mb-4 border border-amber-500/20", children: /* @__PURE__ */ jsx(Badge, { className: "bg-transparent text-amber-400 border-none font-black uppercase tracking-widest text-[9px]", children: "BUSINESS" }) }),
                  editingPricing.broker.business.originalPrice > 0 && /* @__PURE__ */ jsx("p", { className: "line-through text-[#4B6478] text-xs mb-1 font-bold", children: formatIDR(editingPricing.broker.business.originalPrice) }),
                  /* @__PURE__ */ jsx("p", { className: "text-3xl font-display font-black text-amber-400 tracking-tight drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]", children: formatIDR(editingPricing.broker.business.price) }),
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-amber-500/60 uppercase mt-2", children: "Per Bulan" })
                ] })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { className: "text-[14px]", children: PRICING_FEATURES.map((feature, i) => /* @__PURE__ */ jsxs("tr", { className: "border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors group/row", children: [
                /* @__PURE__ */ jsx("td", { className: "px-10 py-5 text-white/70 font-medium group-hover/row:text-white transition-colors", children: feature.label }),
                /* @__PURE__ */ jsx("td", { className: "px-8 py-5 text-center", children: feature.starter ? /* @__PURE__ */ jsx(Check, { size: 20, className: "mx-auto text-emerald-500 drop-shadow-[0_0_8px_rgba(2, 26, 2,0.4)]" }) : /* @__PURE__ */ jsx("div", { className: "w-5 h-0.5 bg-white/5 mx-auto" }) }),
                /* @__PURE__ */ jsx("td", { className: "px-8 py-5 text-center bg-emerald-500/[0.01]", children: feature.pro ? /* @__PURE__ */ jsx(Check, { size: 20, className: "mx-auto text-emerald-500 drop-shadow-[0_0_8px_rgba(2, 26, 2,0.4)]" }) : /* @__PURE__ */ jsx("div", { className: "w-5 h-0.5 bg-white/5 mx-auto" }) }),
                /* @__PURE__ */ jsx("td", { className: "px-8 py-5 text-center bg-amber-500/[0.01]", children: feature.business ? /* @__PURE__ */ jsx(Check, { size: 20, className: "mx-auto text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]" }) : /* @__PURE__ */ jsx("div", { className: "w-5 h-0.5 bg-white/5 mx-auto" }) })
              ] }, i)) })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "p-10 bg-white/[0.01] border-t border-white/5 flex justify-center", children: /* @__PURE__ */ jsx("p", { className: "text-[11px] font-bold text-[#4B6478] uppercase tracking-[0.2em]", children: "Semua paket termasuk update fitur berkelanjutan & backup harian otomatis" }) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx(TabsContent, { value: "addons", className: "space-y-10 animate-in fade-in duration-300", children: /* @__PURE__ */ jsxs("section", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center", children: /* @__PURE__ */ jsx(Tag, { size: 18, className: "text-purple-400" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-[11px] font-black uppercase tracking-[0.2em] text-[#4B6478]", children: "ADD-ON JENIS TERNAK — PETERNAK PRO" }),
            /* @__PURE__ */ jsx("p", { className: "text-[10px] text-[#4B6478] font-bold uppercase tracking-widest mt-0.5", children: "Upselling skema multi-vertical" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white/[0.02] backdrop-blur-xl rounded-[32px] p-8 border border-white/5 space-y-8 shadow-xl relative overflow-hidden group", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity" }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2.5", children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "addon_price", className: "text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1", children: "HARGA ADD-ON PER JENIS TERNAK / BULAN" }),
              /* @__PURE__ */ jsx(
                InputRupiah,
                {
                  id: "addon_price",
                  name: "addon_price",
                  value: addonPricing.price_per_type,
                  onChange: (v) => setAddonPricing((p) => ({ ...p, price_per_type: v || 0 })),
                  className: "bg-black/40 border-white/5 h-14 rounded-2xl font-black text-white text-xl focus:border-purple-500/40 focus:bg-purple-500/5 transition-all shadow-inner"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2.5", children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "max_addons", className: "text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1", children: "MAKSIMAL ADD-ON SEBELUM UPGRADE" }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    id: "max_addons",
                    name: "max_addons",
                    type: "number",
                    min: 1,
                    max: 10,
                    value: addonPricing.max_addons_before_upgrade,
                    onChange: (e) => setAddonPricing((p) => ({ ...p, max_addons_before_upgrade: parseInt(e.target.value) || 1 })),
                    className: "w-full bg-black/40 border-white/5 h-14 rounded-2xl px-4 text-lg text-white font-black focus:border-purple-500/40 focus:bg-purple-500/5 transition-all shadow-inner"
                  }
                ),
                /* @__PURE__ */ jsx("div", { className: "absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#4B6478] uppercase tracking-widest", children: "JENIS" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2.5", children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "business_slot_price", className: "text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1", children: "HARGA PER SLOT BISNIS TAMBAHAN (ONE-TIME)" }),
              /* @__PURE__ */ jsx(
                InputRupiah,
                {
                  id: "business_slot_price",
                  name: "business_slot_price",
                  value: addonPricing.business_slot_price,
                  onChange: (v) => setAddonPricing((p) => ({ ...p, business_slot_price: v || 0 })),
                  className: "bg-black/40 border-white/5 h-14 rounded-2xl font-black text-white text-xl focus:border-purple-500/40 focus:bg-purple-500/5 transition-all shadow-inner"
                }
              ),
              /* @__PURE__ */ jsx("p", { className: "text-[10px] text-[#4B6478] mt-1 ml-1 font-medium", children: "Bapak bisa jual slot bisnis tambahan sebagai add-on mandiri." })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4 relative z-10 pb-4 border-b border-white/5", children: [
            /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1", children: "TIER PENERIMA ADD-ON" }),
            /* @__PURE__ */ jsx("div", { className: "flex items-center gap-6", children: [
              { id: "cb_pro", label: "PRO", checked: true, color: "text-emerald-400" },
              { id: "cb_business", label: "BUSINESS", checked: false, color: "text-[#4B6478]" },
              { id: "cb_enterprise", label: "ENTERPRISE", checked: false, color: "text-[#4B6478]" }
            ].map((item) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: `w-2 h-2 rounded-full ${item.checked ? "bg-emerald-500 shadow-[0_0_10px_rgba(2, 26, 2,0.5)]" : "bg-white/10"}` }),
              /* @__PURE__ */ jsx("span", { className: `text-[11px] font-black tracking-widest ${item.color}`, children: item.label })
            ] }, item.id)) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "relative z-10", children: /* @__PURE__ */ jsx(
            AddonPreview,
            {
              peternakProBase: ((_b = (_a = editingPricing == null ? void 0 : editingPricing.peternak) == null ? void 0 : _a.pro) == null ? void 0 : _b.price) || 499e3,
              peternakBizBase: ((_d = (_c = editingPricing == null ? void 0 : editingPricing.peternak) == null ? void 0 : _c.business) == null ? void 0 : _d.price) || 999e3,
              addonPricing
            }
          ) }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handleSaveAddon,
              disabled: savingAddon,
              className: "relative z-10 w-full bg-white/[0.03] hover:bg-white/[0.08] text-white h-14 rounded-2xl font-black uppercase text-[11px] tracking-[0.25em] transition-all border border-white/5 flex items-center justify-center gap-3 active:scale-[0.98]",
              children: savingAddon ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Loader2, { size: 16, className: "animate-spin" }),
                " MENYIMPAN..."
              ] }) : "UPDATE KONFIGURASI ADD-ON"
            }
          )
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "discounts", className: "space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500", children: /* @__PURE__ */ jsxs("section", { className: "space-y-10", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-lg shadow-purple-500/5", children: /* @__PURE__ */ jsx(Infinity, { size: 22, className: "text-purple-400" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { className: "text-xl font-black text-white uppercase tracking-tight", children: "Diskon Billing Tahunan" }),
            /* @__PURE__ */ jsx("p", { className: "text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mt-1", children: "Incentive untuk komitmen jangka panjang" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white/[0.02] backdrop-blur-xl rounded-[40px] p-8 border border-white/5 space-y-10 shadow-2xl relative overflow-hidden group", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-50" }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "discount_percent", className: "text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1", children: "PERSENTASE POTONGAN (%)" }),
              /* @__PURE__ */ jsx("div", { className: "flex items-center gap-4", children: /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    id: "discount_percent",
                    name: "discount_percent",
                    type: "number",
                    min: 0,
                    max: 50,
                    value: annualDiscount.discount_percent,
                    onChange: (e) => setAnnualDiscount((p) => ({ ...p, discount_percent: parseInt(e.target.value) || 0 })),
                    className: "w-full bg-black/40 border-white/5 h-16 rounded-3xl px-8 text-3xl font-black text-white text-center focus:border-purple-500/40 focus:bg-purple-500/5 transition-all shadow-inner tabular-nums"
                  }
                ),
                /* @__PURE__ */ jsx("div", { className: "absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-black text-[#4B6478]", children: "%" })
              ] }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "badge_text", className: "text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1", children: "TEKS LABEL PROMO DI UI" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  id: "badge_text",
                  name: "badge_text",
                  type: "text",
                  value: annualDiscount.badge_text,
                  onChange: (e) => setAnnualDiscount((p) => ({ ...p, badge_text: e.target.value })),
                  placeholder: "Contoh: Hemat 2 bln!",
                  className: "w-full bg-black/40 border-white/5 h-16 rounded-3xl px-6 text-xl text-white font-bold focus:border-purple-500/40 focus:bg-purple-500/5 transition-all shadow-inner"
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mt-2 ml-2", children: [
                /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black text-[#4B6478] uppercase tracking-widest", children: "Live Preview:" }),
                /* @__PURE__ */ jsx("span", { className: "bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse", children: annualDiscount.badge_text || "HEMET 2 BLN!" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4 relative z-10 border-t border-white/5 pt-8", children: [
            /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black uppercase tracking-[0.3em] text-[#4B6478] ml-1", children: "PROYEKSI HARGA SETELAH DISKON" }),
            /* @__PURE__ */ jsx("div", { className: "rounded-[24px] border border-white/5 overflow-hidden shadow-inner bg-black/20", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-xs border-collapse", children: [
              /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-white/[0.04] border-b border-white/5", children: [
                /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-[#4B6478]", children: "Paket Layanan" }),
                /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-[#4B6478]", children: "Monthly" }),
                /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-emerald-400", children: "Tahunan (Eff. per bln)" }),
                /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-amber-500", children: "Hemat per Tahun" })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { className: "text-[13px]", children: [
                { roleId: "broker", roleLabel: "Broker" },
                { roleId: "peternak", roleLabel: "Peternak" },
                { roleId: "rpa", roleLabel: "RPA" }
              ].flatMap(
                ({ roleId, roleLabel }) => ["pro", "business"].map((plan) => {
                  var _a2, _b2;
                  const base = ((_b2 = (_a2 = editingPricing == null ? void 0 : editingPricing[roleId]) == null ? void 0 : _a2[plan]) == null ? void 0 : _b2.price) || 0;
                  const yearly = Math.round(base * (1 - annualDiscount.discount_percent / 100));
                  const saving = (base - yearly) * 12;
                  return /* @__PURE__ */ jsxs("tr", { className: "border-b border-white/[0.02] hover:bg-white/[0.03] transition-colors group/row", children: [
                    /* @__PURE__ */ jsxs("td", { className: "px-6 py-3.5 text-white/50 font-black tracking-tight group-hover/row:text-white transition-colors", children: [
                      roleLabel,
                      " ",
                      /* @__PURE__ */ jsx("span", { className: "text-[#4B6478] ml-1", children: plan.toUpperCase() })
                    ] }),
                    /* @__PURE__ */ jsx("td", { className: "px-6 py-3.5 text-right text-white/40 font-bold tabular-nums", children: formatIDR(base) }),
                    /* @__PURE__ */ jsx("td", { className: "px-6 py-3.5 text-right text-emerald-400 font-black tabular-nums bg-emerald-500/[0.02]", children: formatIDR(yearly) }),
                    /* @__PURE__ */ jsx("td", { className: "px-6 py-3.5 text-right text-amber-400 font-black tabular-nums", children: formatIDR(saving) })
                  ] }, `${roleId}-${plan}`);
                })
              ) })
            ] }) })
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handleSaveDiscount,
              disabled: savingDiscount,
              className: "relative z-10 w-full bg-emerald-500 hover:bg-emerald-600 text-white h-14 rounded-2xl font-black uppercase text-[11px] tracking-[0.25em] transition-all border border-emerald-400/20 flex items-center justify-center gap-3 active:scale-[0.98] shadow-[0_10px_30px_rgba(2, 26, 2,0.3)]",
              children: savingDiscount ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Loader2, { size: 16, className: "animate-spin" }),
                " MENYIMPAN DISKON..."
              ] }) : "UPDATE SKEMA DISKON TAHUNAN"
            }
          )
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "vouchers", className: "space-y-8 animate-in slide-in-from-right-4 duration-300", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8 items-start", children: [
        /* @__PURE__ */ jsxs(Card, { className: "lg:col-span-1 bg-white/[0.02] backdrop-blur-xl border-white/5 rounded-[40px] p-8 space-y-8 shadow-[0_32px_120px_rgba(0,0,0,0.5)] relative overflow-hidden group", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute -right-4 -top-4 opacity-[0.02] group-hover:opacity-[0.05] -rotate-12 transition-all duration-1000 scale-150", children: /* @__PURE__ */ jsx(Tag, { size: 120, className: "text-emerald-400" }) }),
          /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-2xl font-black text-white uppercase tracking-tight", children: "Buat Voucher" }),
            /* @__PURE__ */ jsxs("p", { className: "text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mt-2 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("span", { className: "w-1 h-1 rounded-full bg-emerald-500 block" }),
              "Loyalty & Promo Engine"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("form", { onSubmit: handleCreateVoucher, className: "space-y-4 relative z-10", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-[#4B6478] uppercase tracking-widest ml-1", children: "KODE VOUCHER" }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    name: "code",
                    placeholder: "MIS: PROMO50",
                    className: "bg-black/40 border-white/10 h-12 rounded-xl text-sm font-bold tracking-widest uppercase focus:border-emerald-500/50",
                    required: true
                  }
                ),
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    type: "button",
                    variant: "ghost",
                    className: "absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 rounded-lg hover:bg-emerald-500/20 text-emerald-400",
                    onClick: () => {
                      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
                      document.getElementsByName("code")[0].value = random;
                    },
                    children: /* @__PURE__ */ jsx(RefreshCcw, { size: 14 })
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-[#4B6478] uppercase tracking-widest ml-1", children: "TIPE" }),
                /* @__PURE__ */ jsxs(Select, { name: "discount_type", defaultValue: "percentage", children: [
                  /* @__PURE__ */ jsx(SelectTrigger, { className: "bg-black/40 border-white/10 h-12 rounded-xl text-sm", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxs(SelectContent, { className: "bg-[#111C24] border-white/10 text-white", children: [
                    /* @__PURE__ */ jsx(SelectItem, { value: "percentage", children: "Persentase (%)" }),
                    /* @__PURE__ */ jsx(SelectItem, { value: "fixed", children: "Nominal (Rp)" })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-[#4B6478] uppercase tracking-widest ml-1", children: "NILAI" }),
                /* @__PURE__ */ jsx(Input, { name: "discount_value", type: "number", placeholder: "0", className: "bg-black/40 border-white/10 h-12 rounded-xl text-sm font-bold", required: true })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-[#4B6478] uppercase tracking-widest ml-1", children: "BERLAKU UNTUK PLAN" }),
              /* @__PURE__ */ jsxs(Select, { name: "applies_to_plan", defaultValue: "all", children: [
                /* @__PURE__ */ jsx(SelectTrigger, { className: "bg-black/40 border-white/10 h-12 rounded-xl text-sm", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                /* @__PURE__ */ jsxs(SelectContent, { className: "bg-[#111C24] border-white/10 text-white", children: [
                  /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "Semua Plan" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "pro", children: "Hanya PRO" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "business", children: "Hanya BUSINESS" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-[#4B6478] uppercase tracking-widest ml-1", children: "BERLAKU UNTUK ROLE" }),
              /* @__PURE__ */ jsxs(Select, { name: "applies_to_role", defaultValue: "all", children: [
                /* @__PURE__ */ jsx(SelectTrigger, { className: "bg-black/40 border-white/10 h-12 rounded-xl text-sm", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                /* @__PURE__ */ jsxs(SelectContent, { className: "bg-[#111C24] border-white/10 text-white", children: [
                  /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "Semua Role" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "broker", children: "Khusus Broker" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "peternak", children: "Khusus Peternak" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "rpa", children: "Khusus RPA" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-[#4B6478] uppercase tracking-widest ml-1", children: "EXPIRES" }),
                /* @__PURE__ */ jsx(Input, { name: "expires_at", type: "date", className: "bg-black/40 border-white/10 h-12 rounded-xl text-sm font-medium" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-[#4B6478] uppercase tracking-widest ml-1", children: "LIMIT" }),
                /* @__PURE__ */ jsx(Input, { name: "max_usage", type: "number", placeholder: "∞", className: "bg-black/40 border-white/10 h-12 rounded-xl text-sm font-bold" })
              ] })
            ] }),
            /* @__PURE__ */ jsx(
              Button,
              {
                type: "submit",
                disabled: createVoucher.isPending,
                className: "w-full bg-emerald-500 hover:bg-emerald-600 text-white h-12 rounded-xl font-black uppercase text-[12px] tracking-widest mt-4 shadow-xl shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed",
                children: createVoucher.isPending ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(Loader2, { size: 14, className: "animate-spin mr-2" }),
                  "Menyimpan..."
                ] }) : "✓ Buat Kode Diskon"
              }
            )
          ] }, formKey)
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("h2", { className: "text-[11px] font-black text-[#4B6478] uppercase tracking-[0.4em] flex items-center gap-3", children: [
              /* @__PURE__ */ jsx(Tag, { size: 14, className: "text-emerald-500" }),
              "DAFTAR VOUCHER AKTIF"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20", children: /* @__PURE__ */ jsxs("span", { className: "text-[9px] font-black text-emerald-400 uppercase tracking-widest", children: [
              (vouchers == null ? void 0 : vouchers.length) || 0,
              " TOTAL"
            ] }) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "bg-[#0C1319] rounded-[32px] border border-white/8 overflow-hidden shadow-xl", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-white/5 bg-white/[0.02]", children: [
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-black", children: "Kode" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-black", children: "Diskon" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-black", children: "Berlaku" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-black", children: "Penggunaan" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-black text-center", children: "Status" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-black text-right", children: "Aksi" })
            ] }) }),
            /* @__PURE__ */ jsxs("tbody", { children: [
              isLoadingVouchers ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 6, className: "px-6 py-12 text-center", children: /* @__PURE__ */ jsx(Loader2, { size: 24, className: "animate-spin mx-auto text-emerald-500 opacity-50" }) }) }) : vouchers == null ? void 0 : vouchers.map((v, i) => /* @__PURE__ */ jsxs("tr", { className: `border-b border-white/5 hover:bg-white/[0.03] transition-colors ${i % 2 === 1 ? "bg-white/[0.01]" : ""}`, children: [
                /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(Badge, { className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-mono font-bold tracking-widest h-8 px-3", children: v.code }),
                  /* @__PURE__ */ jsx("button", { onClick: () => handleCopy(v.code), className: "p-1.5 rounded-lg hover:bg-white/10 text-[#4B6478] hover:text-white transition-all", children: /* @__PURE__ */ jsx(Copy, { size: 12 }) })
                ] }) }),
                /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsx("p", { className: "text-[14px] font-black text-white", children: v.discount_type === "percentage" ? `${v.discount_value}%` : formatIDR(v.discount_value) }) }),
                /* @__PURE__ */ jsxs("td", { className: "px-6 py-4 space-y-1", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex gap-1 flex-wrap", children: [
                    /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[8px] font-black uppercase tracking-tighter px-1 border-white/10 text-white/40", children: v.applies_to_role }),
                    /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[8px] font-black uppercase tracking-tighter px-1 border-white/10 text-white/40", children: v.applies_to_plan })
                  ] }),
                  /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-[#4B6478] font-bold uppercase tracking-tighter", children: [
                    "Exp: ",
                    v.expires_at ? formatDate(v.expires_at) : "Selamanya"
                  ] })
                ] }),
                /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx("div", { className: "h-1.5 flex-1 bg-white/5 rounded-full overflow-hidden min-w-[60px]", children: /* @__PURE__ */ jsx(
                    "div",
                    {
                      className: "h-full bg-emerald-500 rounded-full",
                      style: { width: v.max_usage ? `${Math.min(v.usage_count / v.max_usage * 100, 100)}%` : "5%" }
                    }
                  ) }),
                  /* @__PURE__ */ jsxs("span", { className: "text-[11px] font-black text-white", children: [
                    v.usage_count,
                    " / ",
                    v.max_usage ?? "∞"
                  ] })
                ] }) }),
                /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-center", children: /* @__PURE__ */ jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsx(
                  Switch,
                  {
                    checked: v.is_active,
                    onCheckedChange: (checked) => toggleVoucher.mutate({ id: v.id, is_active: checked }),
                    className: "data-[state=checked]:bg-emerald-500"
                  }
                ) }) }),
                /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right", children: /* @__PURE__ */ jsx(
                  Button,
                  {
                    variant: "ghost",
                    size: "sm",
                    onClick: () => {
                      if (confirm("Hapus voucher ini?")) deleteVoucher.mutate(v.id);
                    },
                    className: "h-8 w-8 p-0 rounded-lg text-[#4B6478] hover:bg-red-500/10 hover:text-red-500",
                    children: /* @__PURE__ */ jsx(Trash2, { size: 14 })
                  }
                ) })
              ] }, v.id)),
              !isLoadingVouchers && (vouchers == null ? void 0 : vouchers.length) === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsxs("td", { colSpan: 6, className: "px-6 py-12 text-center text-[#4B6478]", children: [
                /* @__PURE__ */ jsx(AlertCircle, { size: 32, className: "mx-auto mb-2 opacity-20" }),
                /* @__PURE__ */ jsx("p", { className: "text-[11px] font-bold uppercase tracking-widest opacity-30", children: "Belum ada kode diskon dibuat" })
              ] }) })
            ] })
          ] }) }) })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs(TabsContent, { value: "review", className: "space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-lg shadow-amber-500/5", children: /* @__PURE__ */ jsx(ShieldAlert, { size: 22, className: "text-amber-400" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { className: "text-xl font-black text-white uppercase tracking-tight", children: "Review Queue Harga Pasar" }),
            /* @__PURE__ */ jsx("p", { className: "text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mt-1", children: "Harga yang terdeteksi outlier (>40% deviasi) — perlu persetujuan manual" })
          ] }),
          reviewQueue.length > 0 && /* @__PURE__ */ jsx("div", { className: "ml-auto bg-amber-500/10 px-4 py-2 rounded-full border border-amber-500/20", children: /* @__PURE__ */ jsxs("span", { className: "text-[10px] font-black text-amber-400 uppercase tracking-widest", children: [
            reviewQueue.length,
            " PENDING"
          ] }) })
        ] }),
        isLoadingQueue ? /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center min-h-[200px]", children: /* @__PURE__ */ jsx(Loader2, { size: 24, className: "animate-spin text-amber-400" }) }) : reviewQueue.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "bg-white/[0.02] rounded-[32px] border border-white/5 flex flex-col items-center justify-center py-20 gap-4", children: [
          /* @__PURE__ */ jsx(CheckCircle2, { size: 40, className: "text-emerald-500 opacity-40" }),
          /* @__PURE__ */ jsx("p", { className: "text-[12px] font-black text-[#4B6478] uppercase tracking-[0.3em]", children: "Tidak ada harga yang perlu direview" })
        ] }) : /* @__PURE__ */ jsx("div", { className: "bg-[#0C1319] rounded-[32px] border border-white/5 overflow-hidden shadow-xl", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-white/5 bg-white/[0.02]", children: [
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#4B6478]", children: "Jenis" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#4B6478]", children: /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(MapPin, { size: 10 }),
              "Wilayah"
            ] }) }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#4B6478] text-right", children: "Kandang" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#4B6478] text-right", children: "Jual Rata-rata" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#4B6478]", children: "Sumber" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#4B6478]", children: /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(CalendarClock, { size: 10 }),
              "Tanggal"
            ] }) }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#4B6478] text-right", children: "Aksi" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { children: reviewQueue.map((row, i) => /* @__PURE__ */ jsxs("tr", { className: `border-b border-white/5 hover:bg-white/[0.03] transition-colors ${i % 2 === 1 ? "bg-white/[0.01]" : ""}`, children: [
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsx("span", { className: "text-[12px] font-black text-white capitalize", children: row.chicken_type ?? row.commodity_type ?? "—" }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsx("span", { className: "text-[12px] text-white/70 font-medium", children: row.region ?? "—" }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right", children: /* @__PURE__ */ jsx("span", { className: "text-[13px] font-black text-amber-400 tabular-nums", children: row.farm_gate_price != null ? formatIDR(row.farm_gate_price) : "—" }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right", children: /* @__PURE__ */ jsx("span", { className: "text-[13px] font-bold text-white/60 tabular-nums", children: row.avg_sell_price != null ? formatIDR(row.avg_sell_price) : "—" }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[9px] font-black uppercase tracking-tighter border-white/10 text-white/40", children: row.source }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsx("span", { className: "text-[11px] text-[#4B6478] font-bold", children: row.price_date ? format(new Date(row.price_date), "d MMM yyyy", { locale: id }) : "—" }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-2", children: [
              /* @__PURE__ */ jsxs(
                Button,
                {
                  size: "sm",
                  onClick: () => approvePrice.mutate(row.id),
                  disabled: approvePrice.isPending,
                  className: "h-8 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider gap-1",
                  children: [
                    /* @__PURE__ */ jsx(CheckCircle2, { size: 12 }),
                    "Setujui"
                  ]
                }
              ),
              /* @__PURE__ */ jsx(
                Button,
                {
                  size: "sm",
                  variant: "ghost",
                  onClick: () => deletePrice.mutate(row.id),
                  disabled: deletePrice.isPending,
                  className: "h-8 w-8 p-0 rounded-lg text-[#4B6478] hover:bg-red-500/10 hover:text-red-500",
                  children: /* @__PURE__ */ jsx(XCircle, { size: 14 })
                }
              )
            ] }) })
          ] }, row.id)) })
        ] }) }) })
      ] })
    ] }),
    activeTab === "plans" && /* @__PURE__ */ jsx("div", { className: "md:hidden fixed bottom-20 left-4 right-4 z-40 animate-in slide-in-from-bottom-4 duration-500 pb-[env(safe-area-inset-bottom)]", children: /* @__PURE__ */ jsx(
      Button,
      {
        onClick: handleSaveAllPricing,
        disabled: savingRole === "all",
        className: "w-full bg-emerald-500 hover:bg-emerald-600 text-white h-14 rounded-2xl font-black uppercase text-[12px] tracking-[0.2em] shadow-[0_20px_50px_rgba(2, 26, 2,0.3)] border border-emerald-400/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3",
        children: savingRole === "all" ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Loader2, { size: 18, className: "animate-spin" }),
          " MENYIMPAN DATA..."
        ] }) : /* @__PURE__ */ jsx(Fragment, { children: "SIMPAN SEMUA PERUBAHAN" })
      }
    ) })
  ] });
}
function RolePricingCard({ roleName, roleId, icon: Icon, color, data, onChange, onSave, isSaving, vertical }) {
  if (!(data == null ? void 0 : data.pro) || !(data == null ? void 0 : data.business)) return null;
  const themes = {
    emerald: {
      card: "shadow-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40",
      icon: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_20px_rgba(2, 26, 2,0.2)]",
      mesh: "from-emerald-500/10 via-transparent to-transparent",
      inputFocus: "focus:border-emerald-500/40 focus:bg-emerald-500/5 focus:shadow-[0_0_20px_rgba(2, 26, 2,0.1)]"
    },
    purple: {
      card: "shadow-purple-500/5 border-purple-500/20 hover:border-purple-500/40",
      icon: "bg-purple-500/10 border-purple-500/20 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)]",
      mesh: "from-purple-500/10 via-transparent to-transparent",
      inputFocus: "focus:border-purple-500/40 focus:bg-purple-500/5 focus:shadow-[0_0_20px_rgba(168,85,247,0.1)]"
    },
    amber: {
      card: "shadow-amber-500/5 border-amber-500/20 hover:border-amber-500/40",
      icon: "bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]",
      mesh: "from-amber-500/10 via-transparent to-transparent",
      inputFocus: "focus:border-amber-500/40 focus:bg-amber-500/5 focus:shadow-[0_0_20px_rgba(245,158,11,0.1)]"
    },
    sky: {
      card: "shadow-sky-500/5 border-sky-500/20 hover:border-sky-500/40",
      icon: "bg-sky-500/10 border-sky-500/20 text-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.2)]",
      mesh: "from-sky-500/10 via-transparent to-transparent",
      inputFocus: "focus:border-sky-500/40 focus:bg-sky-500/5 focus:shadow-[0_0_20px_rgba(14,165,233,0.1)]"
    },
    rose: {
      card: "shadow-rose-500/5 border-rose-500/20 hover:border-rose-500/40",
      icon: "bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.2)]",
      mesh: "from-rose-500/10 via-transparent to-transparent",
      inputFocus: "focus:border-rose-500/40 focus:bg-rose-500/5 focus:shadow-[0_0_20px_rgba(244,63,94,0.1)]"
    }
  }[color];
  return /* @__PURE__ */ jsxs(Card, { className: `group relative bg-[#111C24]/40 backdrop-blur-xl rounded-[40px] p-8 border ${themes.card} transition-all duration-500 overflow-hidden hover:-translate-y-2`, children: [
    /* @__PURE__ */ jsx("div", { className: `absolute inset-0 bg-gradient-to-br ${themes.mesh} opacity-50 group-hover:opacity-100 transition-opacity duration-700` }),
    /* @__PURE__ */ jsx("div", { className: "absolute -right-8 -bottom-8 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-700 scale-150 group-hover:rotate-12", children: /* @__PURE__ */ jsx(Icon, { size: 180, strokeWidth: 1 }) }),
    /* @__PURE__ */ jsxs("div", { className: "relative z-10 flex flex-col h-full", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-5 mb-10", children: [
        /* @__PURE__ */ jsx("div", { className: `w-16 h-16 rounded-[24px] flex items-center justify-center border transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 ${themes.icon}`, children: /* @__PURE__ */ jsx(Icon, { size: 28, strokeWidth: 2.5 }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black text-[#4B6478] uppercase tracking-[0.3em] mb-1 opacity-70", children: "ADMIN CONTROL" }),
          /* @__PURE__ */ jsx("h3", { className: "text-2xl font-display font-black text-white uppercase tracking-tight leading-none group-hover:tracking-wider transition-all duration-500", children: roleName }),
          vertical && /* @__PURE__ */ jsxs("p", { className: "text-[9px] text-[#2A3F52] font-mono mt-1", children: [
            "business_vertical: ",
            vertical
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-10", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-100", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx(Badge, { className: "bg-emerald-500/10 text-emerald-400 border-none font-black tracking-widest text-[9px] px-3 py-1", children: "PRO PLAN" }),
            /* @__PURE__ */ jsx("div", { className: "h-px flex-1 bg-white/5" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-5", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2 group/input", children: [
              /* @__PURE__ */ jsx("label", { className: "text-[9px] uppercase text-[#4B6478] font-black tracking-widest ml-1 transition-colors group-hover/input:text-emerald-500/60", children: "Target Harga Aktif" }),
              /* @__PURE__ */ jsx(
                InputRupiah,
                {
                  value: data.pro.price,
                  onChange: (v) => onChange(roleId, "pro", "price", v),
                  className: `bg-black/40 border-white/5 h-14 rounded-2xl text-right font-black text-white text-lg transition-all duration-300 shadow-inner ${themes.inputFocus}`
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2 opacity-60 hover:opacity-100 transition-opacity", children: [
              /* @__PURE__ */ jsx("label", { className: "text-[9px] uppercase text-[#4B6478] font-black tracking-widest ml-1", children: "Harga Semula (Coret)" }),
              /* @__PURE__ */ jsx(
                InputRupiah,
                {
                  value: data.pro.originalPrice,
                  onChange: (v) => onChange(roleId, "pro", "originalPrice", v),
                  className: "bg-black/20 border-white/5 h-12 rounded-xl text-right font-black text-white/40 text-sm focus:border-white/10 transition-all",
                  placeholder: "Opsional"
                }
              )
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-200", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx(Badge, { className: "bg-amber-500/10 text-amber-400 border-none font-black tracking-widest text-[9px] px-3 py-1", children: "BUSINESS PLAN" }),
            /* @__PURE__ */ jsx("div", { className: "h-px flex-1 bg-white/5" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-5", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2 group/input", children: [
              /* @__PURE__ */ jsx("label", { className: "text-[9px] uppercase text-[#4B6478] font-black tracking-widest ml-1 transition-colors group-hover/input:text-amber-500/60", children: "Target Harga Aktif" }),
              /* @__PURE__ */ jsx(
                InputRupiah,
                {
                  value: data.business.price,
                  onChange: (v) => onChange(roleId, "business", "price", v),
                  className: `bg-black/40 border-white/5 h-14 rounded-2xl text-right font-black text-white text-lg transition-all duration-300 shadow-inner ${themes.inputFocus}`
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2 opacity-60 hover:opacity-100 transition-opacity", children: [
              /* @__PURE__ */ jsx("label", { className: "text-[9px] uppercase text-[#4B6478] font-black tracking-widest ml-1", children: "Harga Semula (Coret)" }),
              /* @__PURE__ */ jsx(
                InputRupiah,
                {
                  value: data.business.originalPrice,
                  onChange: (v) => onChange(roleId, "business", "originalPrice", v),
                  className: "bg-black/20 border-white/5 h-12 rounded-xl text-right font-black text-white/40 text-sm focus:border-white/10 transition-all",
                  placeholder: "Opsional"
                }
              )
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-12 pt-8 border-t border-white/5 relative z-10", children: /* @__PURE__ */ jsxs(
        Button,
        {
          onClick: onSave,
          disabled: isSaving,
          className: "w-full bg-white/[0.03] hover:bg-white/[0.08] text-white h-14 rounded-[20px] text-[11px] font-black uppercase tracking-[0.25em] border border-white/5 active:scale-[0.97] transition-all duration-300 disabled:opacity-50 overflow-hidden relative group/btn shadow-xl",
          children: [
            /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" }),
            isSaving ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Loader2, { size: 16, className: "animate-spin mr-3" }),
              " Menyimpan..."
            ] }) : "Update Skema →"
          ]
        }
      ) })
    ] })
  ] });
}
function AddonPreview({ peternakProBase, peternakBizBase, addonPricing }) {
  const exampleJenis = 3;
  const extraAddons = exampleJenis - 1;
  const total = peternakProBase + extraAddons * (addonPricing.price_per_type || 0);
  const fmtIDRLocal = (n) => "Rp " + (n || 0).toLocaleString("id-ID");
  const willUpgrade = extraAddons > (addonPricing.max_addons_before_upgrade || 2);
  return /* @__PURE__ */ jsxs("div", { className: "bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-1.5", children: [
    /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-amber-400", children: "PREVIEW KALKULASI" }),
    /* @__PURE__ */ jsxs("p", { className: "text-xs text-amber-200/80", children: [
      "Contoh: Peternak PRO dengan ",
      exampleJenis,
      " jenis ternak aktif"
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "text-xs text-white font-bold", children: [
      "= ",
      fmtIDRLocal(peternakProBase),
      " + (",
      extraAddons,
      " × ",
      fmtIDRLocal(addonPricing.price_per_type),
      ")",
      " ",
      "= ",
      /* @__PURE__ */ jsxs("span", { className: "text-amber-400", children: [
        fmtIDRLocal(total),
        "/bln"
      ] })
    ] }),
    willUpgrade && /* @__PURE__ */ jsxs("p", { className: "text-xs text-amber-400", children: [
      "⚠ Melebihi cap ",
      addonPricing.max_addons_before_upgrade,
      " → suggest upgrade Business ",
      fmtIDRLocal(peternakBizBase),
      "/bln"
    ] }),
    !willUpgrade && /* @__PURE__ */ jsxs("p", { className: "text-xs text-[#4B6478]", children: [
      "Melebihi cap ",
      addonPricing.max_addons_before_upgrade,
      " add-on → suggest upgrade Business ",
      fmtIDRLocal(peternakBizBase),
      "/bln"
    ] })
  ] });
}
export {
  AdminPricing as default
};
