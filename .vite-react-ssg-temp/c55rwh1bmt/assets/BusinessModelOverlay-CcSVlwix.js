import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Warehouse, Hash, Calendar, PawPrint, Scale, BadgePercent, Calculator, Sparkles, Check, Info, X, Key, ChevronRight, ArrowLeft, Building2, MapPin, ChevronDown, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ao as Label, a0 as Input, af as Switch, a1 as cn, a_ as useLanguage, be as ANIMAL_GROUPS, d as BUSINESS_MODELS, y as isSuperadmin, bf as BUSINESS_CATEGORIES, r as resolveBusinessVertical, n as PROVINCES, bg as toTitleCase, s as supabase, bh as checkQuotaUsage, p as logSupabaseError, K as logError } from "../main.mjs";
import { toast } from "sonner";
import { D as DatePicker } from "./DatePicker-BO7By-H9.js";
function PeternakSapiForm({ data, onChange, t }) {
  const set = (key, val) => onChange({ ...data, [key]: val });
  const [templateEnabled, setTemplateEnabled] = useState(false);
  const packages = [
    { key: "150", label: t("setup_sapi_temp_150_title", "150 Hari — Intensif"), desc: t("setup_sapi_temp_150_desc", "Konsentrat penuh, target ADG ~1 kg/hari") },
    { key: "180", label: t("setup_sapi_temp_180_title", "180 Hari — Semi-Intensif"), desc: t("setup_sapi_temp_180_desc", "Hijauan + konsentrat, target ADG ~0.8 kg/hari") }
  ];
  const fieldLabelStyle = "flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-amber-500/80 mb-1.5 ml-1";
  const inputContainerStyle = "relative transition-all duration-300";
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500", children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: inputContainerStyle, children: [
        /* @__PURE__ */ jsxs(Label, { className: fieldLabelStyle, children: [
          /* @__PURE__ */ jsx(Warehouse, { size: 12, className: "text-amber-500" }),
          t("setup_kandang_label", "Nama Kandang"),
          " ",
          /* @__PURE__ */ jsx("span", { className: "text-amber-500/50 ml-0.5", children: "*" })
        ] }),
        /* @__PURE__ */ jsx(
          Input,
          {
            type: "text",
            value: data.kandang_name || "",
            onChange: (e) => set("kandang_name", e.target.value),
            placeholder: "Kandang A",
            className: "h-11 rounded-xl bg-[#111C24] border-white/5 px-4 font-bold text-sm focus:bg-[#15232d] transition-all"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: inputContainerStyle, children: [
        /* @__PURE__ */ jsxs(Label, { className: fieldLabelStyle, children: [
          /* @__PURE__ */ jsx(Hash, { size: 12, className: "text-amber-500" }),
          t("setup_batch_name_label", "Nama Batch"),
          " ",
          /* @__PURE__ */ jsx("span", { className: "text-amber-500/50 ml-0.5", children: "*" })
        ] }),
        /* @__PURE__ */ jsx(
          Input,
          {
            type: "text",
            value: data.batch_name || "",
            onChange: (e) => set("batch_name", e.target.value),
            placeholder: "Batch April 2024",
            className: "h-11 rounded-xl bg-[#111C24] border-white/5 px-4 font-bold text-sm focus:bg-[#15232d] transition-all"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: inputContainerStyle, children: [
        /* @__PURE__ */ jsxs(Label, { className: fieldLabelStyle, children: [
          /* @__PURE__ */ jsx(Calendar, { size: 12, className: "text-amber-500" }),
          t("setup_tanggal_mulai_label", "Tanggal Mulai"),
          " ",
          /* @__PURE__ */ jsx("span", { className: "text-amber-500/50 ml-0.5", children: "*" })
        ] }),
        /* @__PURE__ */ jsx(
          DatePicker,
          {
            value: data.start_date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
            onChange: (val) => set("start_date", val),
            allowClear: false,
            className: "h-11 rounded-xl bg-[#111C24] border-white/5"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: inputContainerStyle, children: [
        /* @__PURE__ */ jsxs(Label, { className: fieldLabelStyle, children: [
          /* @__PURE__ */ jsx(PawPrint, { size: 12, className: "text-amber-500" }),
          t("setup_populasi_label", "Populasi (Ekor)"),
          " ",
          /* @__PURE__ */ jsx("span", { className: "text-amber-500/50 ml-0.5", children: "*" })
        ] }),
        /* @__PURE__ */ jsx(
          Input,
          {
            type: "number",
            min: "1",
            value: data.initial_count || "",
            onChange: (e) => set("initial_count", e.target.value),
            placeholder: "0",
            className: "h-11 rounded-xl bg-[#111C24] border-white/5 px-4 font-bold text-sm focus:bg-[#15232d]"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: inputContainerStyle, children: [
        /* @__PURE__ */ jsxs(Label, { className: fieldLabelStyle, children: [
          /* @__PURE__ */ jsx(Scale, { size: 12, className: "text-amber-500" }),
          t("setup_berat_avg_label", "Berat Avg (kg)")
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(
            Input,
            {
              type: "number",
              min: "50",
              step: "0.1",
              value: data.initial_avg_weight || "",
              onChange: (e) => set("initial_avg_weight", e.target.value),
              placeholder: "350",
              className: "h-11 rounded-xl bg-[#111C24] border-white/5 pl-4 pr-10 font-bold text-sm focus:bg-[#15232d]"
            }
          ),
          /* @__PURE__ */ jsx("span", { className: "absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-white/20 uppercase tracking-widest pointer-events-none", children: "kg" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: inputContainerStyle, children: [
        /* @__PURE__ */ jsxs(Label, { className: fieldLabelStyle, children: [
          /* @__PURE__ */ jsx(BadgePercent, { size: 12, className: "text-amber-500" }),
          t("setup_harga_beli_label", "Harga Beli (Rp/kg)")
        ] }),
        /* @__PURE__ */ jsx(
          Input,
          {
            type: "number",
            min: "0",
            step: "500",
            value: data.purchase_price_per_kg || "",
            onChange: (e) => set("purchase_price_per_kg", e.target.value),
            placeholder: "52000",
            className: "h-11 rounded-xl bg-[#111C24] border-white/5 px-4 font-bold text-sm focus:bg-[#15232d]"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute -inset-0.5 bg-gradient-to-r from-amber-500/10 to-emerald-500/10 rounded-xl blur-sm opacity-50 transition duration-1000" }),
      /* @__PURE__ */ jsxs("div", { className: "relative flex items-center gap-3 bg-[#0F171F] border border-white/5 rounded-xl p-3 overflow-hidden", children: [
        /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 text-amber-500 shadow-inner", children: /* @__PURE__ */ jsx(Calculator, { size: 16 }) }),
        /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 font-medium leading-relaxed italic", children: t("setup_sapi_info_text", "Untuk menghitung ADG & profit secara otomatis.") })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "border border-[#7C3AED]/20 rounded-2xl overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-4 bg-[#7C3AED]/[0.06]", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center", children: /* @__PURE__ */ jsx(Sparkles, { size: 15, className: "text-[#A78BFA]" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-black text-white", children: t("setup_sapi_template_title", "Mulai dengan Template TernakOS") }),
            /* @__PURE__ */ jsx("p", { className: "text-[10px] text-[#4B6478] font-medium mt-0.5", children: t("setup_sapi_template_desc", "Jadwal tugas otomatis sesuai SNI feedlot") })
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          Switch,
          {
            checked: templateEnabled,
            onCheckedChange: (v) => {
              setTemplateEnabled(v);
              if (!v) set("templateType", null);
            }
          }
        )
      ] }),
      templateEnabled && /* @__PURE__ */ jsx("div", { className: "p-4 space-y-2 border-t border-[#7C3AED]/10 bg-[#7C3AED]/[0.03]", children: packages.map((pkg) => {
        const active = data.templateType === pkg.key;
        return /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => set("templateType", pkg.key),
            className: cn(
              "w-full text-left p-3 rounded-xl border transition-all duration-150",
              active ? "bg-[#7C3AED]/15 border-[#7C3AED]/50" : "bg-white/[0.02] border-white/5 hover:border-white/10"
            ),
            children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: cn("text-xs font-black", active ? "text-white" : "text-slate-300"), children: pkg.label }),
                /* @__PURE__ */ jsx("p", { className: "text-[10px] text-[#4B6478] font-medium mt-0.5", children: pkg.desc })
              ] }),
              /* @__PURE__ */ jsx("div", { className: cn(
                "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                active ? "border-[#7C3AED] bg-[#7C3AED]" : "border-white/20"
              ), children: active && /* @__PURE__ */ jsx(Check, { size: 10, className: "text-white" }) })
            ] })
          },
          pkg.key
        );
      }) })
    ] })
  ] });
}
const VERTICAL_SETUP_CONFIG = {
  peternak_sapi_penggemukan: {
    component: "sapi",
    // handled by dedicated PeternakSapiForm (has template feature)
    accent: "#D97706",
    label: "Sapi Penggemukan",
    emoji: "🐄",
    infoText: "Untuk menghitung ADG & profit secara otomatis."
  },
  peternak_domba_penggemukan: {
    component: "fattening",
    accent: "#16A34A",
    label: "Domba Penggemukan",
    emoji: "🐑",
    infoText: "Untuk menghitung ADG & estimasi profit per ekor.",
    weightPlaceholder: "25",
    weightMin: 1,
    countPlaceholder: "20",
    batchPlaceholder: "Batch Domba April 2025",
    kandangPlaceholder: "Kandang Domba A"
  },
  peternak_kambing_penggemukan: {
    component: "fattening",
    accent: "#16A34A",
    label: "Kambing Penggemukan",
    emoji: "🐐",
    infoText: "Untuk menghitung ADG & estimasi profit per ekor.",
    weightPlaceholder: "20",
    weightMin: 1,
    countPlaceholder: "20",
    batchPlaceholder: "Batch Kambing April 2025",
    kandangPlaceholder: "Kandang Kambing A"
  },
  peternak_kambing_domba_penggemukan: {
    component: "fattening",
    accent: "#16A34A",
    label: "Domba & Kambing Penggemukan",
    emoji: "🐑",
    infoText: "Untuk menghitung ADG & estimasi profit per ekor.",
    weightPlaceholder: "22",
    weightMin: 1,
    countPlaceholder: "30",
    batchPlaceholder: "Batch April 2025",
    kandangPlaceholder: "Kandang Utama A"
  }
};
function GenericFatteningSetup({ data, onChange, config, t }) {
  const set = (key, val) => onChange({ ...data, [key]: val });
  const { accent } = config;
  const accentBg = `${accent}18`;
  const accentBorder = `${accent}30`;
  const labelCls = "flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] mb-1.5 ml-1";
  const inputCls = "h-11 rounded-xl bg-[#111C24] border-white/5 px-4 font-bold text-sm focus:bg-[#15232d] transition-all";
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs(Label, { className: labelCls, style: { color: accent }, children: [
        /* @__PURE__ */ jsx(Warehouse, { size: 12, style: { color: accent } }),
        t("setup_kandang_label", "Nama Kandang"),
        " ",
        /* @__PURE__ */ jsx("span", { className: "ml-0.5 opacity-50", children: "*" })
      ] }),
      /* @__PURE__ */ jsx(
        Input,
        {
          type: "text",
          value: data.kandang_name || "",
          onChange: (e) => set("kandang_name", e.target.value),
          placeholder: config.kandangPlaceholder || "Kandang Utama A",
          className: inputCls
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-3", children: /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs(Label, { className: labelCls, style: { color: accent }, children: [
        /* @__PURE__ */ jsx(PawPrint, { size: 12, style: { color: accent } }),
        t("setup_populasi_label", "Populasi (Ekor)"),
        " ",
        /* @__PURE__ */ jsx("span", { className: "ml-0.5 opacity-50", children: "*" })
      ] }),
      /* @__PURE__ */ jsx(
        Input,
        {
          type: "number",
          min: "1",
          value: data.initial_count || "",
          onChange: (e) => set("initial_count", e.target.value),
          placeholder: config.countPlaceholder || "0",
          className: inputCls
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs(Label, { className: labelCls, style: { color: accent }, children: [
          /* @__PURE__ */ jsx(Calendar, { size: 12, style: { color: accent } }),
          t("setup_tanggal_masuk_label", "Tanggal Masuk"),
          " ",
          /* @__PURE__ */ jsx("span", { className: "ml-0.5 opacity-50", children: "*" })
        ] }),
        /* @__PURE__ */ jsx(
          DatePicker,
          {
            value: data.start_date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
            onChange: (val) => set("start_date", val),
            allowClear: false,
            className: "h-11 rounded-xl bg-[#111C24] border-white/5"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs(Label, { className: labelCls, style: { color: accent }, children: [
          /* @__PURE__ */ jsx(Scale, { size: 12, style: { color: accent } }),
          t("setup_berat_avg_label", "Berat Avg (kg)")
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(
            Input,
            {
              type: "number",
              min: config.weightMin ?? 1,
              step: "0.1",
              value: data.initial_avg_weight || "",
              onChange: (e) => set("initial_avg_weight", e.target.value),
              placeholder: config.weightPlaceholder || "25",
              className: `${inputCls} pr-10`
            }
          ),
          /* @__PURE__ */ jsx("span", { className: "absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-white/20 uppercase tracking-widest pointer-events-none", children: "kg" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: "flex items-center gap-3 rounded-xl p-3 border",
        style: { background: accentBg, borderColor: accentBorder },
        children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border",
              style: { background: accentBg, borderColor: accentBorder, color: accent },
              children: /* @__PURE__ */ jsx(Info, { size: 14 })
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 font-medium leading-relaxed italic", children: t("setup_info_text", "Data ini digunakan untuk menghitung performa batch secara otomatis.") })
        ]
      }
    )
  ] });
}
function StepSetup({ selectedModel, setupData, setSetupData, t }) {
  const config = VERTICAL_SETUP_CONFIG[selectedModel];
  if (selectedModel === "peternak_sapi_penggemukan") {
    return /* @__PURE__ */ jsx(PeternakSapiForm, { data: setupData, onChange: setSetupData, t });
  }
  if ((config == null ? void 0 : config.component) === "fattening") {
    return /* @__PURE__ */ jsx(GenericFatteningSetup, { data: setupData, onChange: setSetupData, config, t });
  }
  return /* @__PURE__ */ jsx("div", { className: "p-6 text-center rounded-xl border border-white/5 bg-white/[0.02]", children: /* @__PURE__ */ jsx("p", { className: "text-[13px] text-slate-500 italic", children: t("setup_no_config", "Tidak ada konfigurasi tambahan untuk tipe bisnis ini.") }) });
}
const SETUP_REQUIRED_VERTICALS = new Set(Object.keys(VERTICAL_SETUP_CONFIG));
const STEP_LABELS_PETERNAK = ["Kategori", "Hewan", "Spesialisasi", "Nama Farm", "Setup Awal"];
const STEP_LABELS_PETERNAK_SHORT = ["Kategori", "Hewan", "Spesialisasi", "Nama Farm"];
const STEP_LABELS_BROKER = ["Kategori", "Spesialisasi", "Nama Bisnis"];
function BusinessModelOverlay({ user, profile, isNewBusiness, onComplete }) {
  var _a, _b;
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState(null);
  const [animalGroup, setAnimalGroup] = useState(null);
  const [selected, setSelected] = useState(null);
  const [businessName, setBusinessName] = useState("");
  const [nameChecking, setNameChecking] = useState(false);
  const [nameTaken, setNameTaken] = useState(false);
  const [province, setProvince] = useState("");
  const [provinceSearch, setProvinceSearch] = useState("");
  const [provinceOpen, setProvinceOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();
  const [isSuccess, setIsSuccess] = useState(false);
  const [setupData, setSetupData] = useState({
    batch_name: "",
    start_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    initial_count: "",
    initial_avg_weight: "",
    purchase_price_per_kg: ""
  });
  const debounceRef = useRef(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteInput, setInviteInput] = useState("");
  const nav = useNavigate();
  const needsSetupStep = SETUP_REQUIRED_VERTICALS.has(selected);
  const isPeternak = category === "peternak";
  const isAnimalStep = isPeternak && step === 2;
  const isSubRoleStep = isPeternak ? step === 3 : step === 2;
  const isNameStep = isPeternak ? step === 4 : step === 3;
  const isSetupStep = needsSetupStep && step === 5;
  const subRoles = useMemo(() => {
    if (!category) return [];
    if (isPeternak && animalGroup) {
      const group = ANIMAL_GROUPS.find((g) => g.key === animalGroup);
      if (group) return Object.values(BUSINESS_MODELS).filter((m) => m.category === "peternak" && group.filter(m));
    }
    return Object.values(BUSINESS_MODELS).filter((m) => m.category === category);
  }, [category, animalGroup, isPeternak]);
  const isRoleLocked = useMemo(() => {
    if (isSuperadmin(profile)) return false;
    if (isNewBusiness && (profile == null ? void 0 : profile.user_type)) return true;
    return !isNewBusiness && (profile == null ? void 0 : profile.business_model_selected) === true;
  }, [isNewBusiness, profile]);
  const primaryRoleInfo = useMemo(() => {
    if (!isRoleLocked || !profile) return null;
    const userType = profile.user_type;
    const validCategory = BUSINESS_CATEGORIES.find((c) => c.key === userType);
    if (validCategory) {
      return {
        category: userType,
        label: validCategory.label || "Bisnis"
      };
    }
    const verticalKey = resolveBusinessVertical(profile, profile.tenants);
    const model = BUSINESS_MODELS[verticalKey];
    return {
      category: (model == null ? void 0 : model.category) || "broker",
      label: (model == null ? void 0 : model.categoryLabel) || "Bisnis"
    };
  }, [profile, isRoleLocked]);
  const stepLabelMap = {
    "Kategori": t("onboarding_step_category", "Kategori"),
    "Hewan": t("onboarding_step_animal", "Hewan"),
    "Spesialisasi": t("onboarding_step_specialization", "Spesialisasi"),
    "Nama Farm": t("onboarding_step_farm_name", "Nama Farm"),
    "Nama Bisnis": t("onboarding_step_business_name", "Nama Bisnis"),
    "Setup Awal": t("onboarding_step_initial_setup", "Setup Awal")
  };
  useEffect(() => {
    if (isRoleLocked && primaryRoleInfo && step === 1) {
      setCategory(primaryRoleInfo.category);
      setStep(2);
    }
  }, [isRoleLocked, primaryRoleInfo, step]);
  const filteredProvinces = useMemo(() => {
    if (!provinceSearch) return PROVINCES;
    return PROVINCES.filter(
      (p) => p.toLowerCase().includes(provinceSearch.toLowerCase())
    );
  }, [provinceSearch]);
  if ((profile == null ? void 0 : profile.onboarded) && !isNewBusiness) return null;
  const handleNameChange = (val) => {
    setBusinessName(val);
    setNameTaken(false);
    setNameChecking(val.trim().length >= 3);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 3) {
      setNameChecking(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const formatted = toTitleCase(val.trim());
      let query = supabase.from("tenants").select("id").ilike("business_name", formatted);
      if ((profile == null ? void 0 : profile.tenant_id) && profile.tenant_id !== "undefined") {
        query = query.neq("id", profile.tenant_id);
      }
      const { data } = await query.limit(1);
      setNameChecking(false);
      setNameTaken(data && data.length > 0);
    }, 600);
  };
  const handleNameConfirm = async () => {
    if (!selected || !businessName.trim() || businessName.trim().length < 3) return;
    if (nameTaken || nameChecking) return;
    if (!province) return;
    const model = BUSINESS_MODELS[selected];
    if (!model) return;
    const formattedName = toTitleCase(businessName.trim());
    let uniqueQuery = supabase.from("tenants").select("id").ilike("business_name", formattedName);
    if ((profile == null ? void 0 : profile.tenant_id) && profile.tenant_id !== "undefined") {
      uniqueQuery = uniqueQuery.neq("id", profile.tenant_id);
    }
    const { data: existing } = await uniqueQuery.limit(1);
    if (existing && existing.length > 0) {
      setNameTaken(true);
      return;
    }
    if (needsSetupStep) {
      setStep(5);
      return;
    }
    await saveAndComplete();
  };
  const saveAndComplete = async () => {
    var _a2, _b2, _c, _d, _e;
    const model = BUSINESS_MODELS[selected];
    if (!model) {
      console.error("[Onboarding] saveAndComplete: model not found for selected key:", selected);
      return;
    }
    const formattedName = toTitleCase(businessName.trim());
    if (!model.user_type) {
      console.error("[Onboarding] model.user_type is missing for model:", model.key, model);
      toast.error(t("onboarding_error_invalid_config", "Konfigurasi bisnis tidak valid. Silakan coba lagi."));
      return;
    }
    setLoading(true);
    try {
      const targetAuthId = (profile == null ? void 0 : profile.auth_user_id) || (user == null ? void 0 : user.id);
      const isUUID = (str) => typeof str === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
      if (!targetAuthId || targetAuthId === "undefined" || !isUUID(targetAuthId)) {
        console.error("[Onboarding] targetAuthId is missing or invalid. profile:", profile, "user:", user);
        throw new Error("User session missing or invalid auth ID");
      }
      let resolvedTenantId = (profile == null ? void 0 : profile.tenant_id) === "undefined" ? null : profile == null ? void 0 : profile.tenant_id;
      const isFirstTimeOnboarding = !(profile == null ? void 0 : profile.onboarded) || !(profile == null ? void 0 : profile.business_model_selected);
      const canReuseExistingTenant = isFirstTimeOnboarding && resolvedTenantId && !isNewBusiness;
      const userTypeMismatch = Boolean(
        (profile == null ? void 0 : profile.user_type) && model.user_type && profile.user_type !== model.user_type
      );
      let shouldCreateViRPC = false;
      if (canReuseExistingTenant) {
        shouldCreateViRPC = false;
      } else if (isNewBusiness || !resolvedTenantId || userTypeMismatch) {
        shouldCreateViRPC = true;
      }
      console.log("[Onboarding] saveAndComplete start:", {
        selectedKey: selected,
        modelKey: model.key,
        user_type: model.user_type,
        isNewBusiness,
        isFirstTimeOnboarding,
        canReuseExistingTenant,
        userTypeMismatch,
        shouldCreateViRPC,
        profile_tenant_id: profile == null ? void 0 : profile.tenant_id,
        targetAuthId
      });
      if (shouldCreateViRPC) {
        if (isNewBusiness) {
          const quota = await checkQuotaUsage(null, profile, "business");
          if (!quota.canAdd) {
            toast.error(t("onboarding_error_quota_full", "Jatah bisnis bapak sudah penuh ({usage}/{limit}). Silakan beli slot tambahan di Portal Add-on.").replace("{usage}", quota.usage).replace("{limit}", quota.limit));
            setLoading(false);
            return;
          }
        }
        console.log("[Onboarding] Calling create_new_business RPC with:", {
          p_business_name: formattedName,
          p_business_vertical: model.key,
          p_location: province || null,
          p_phone: (profile == null ? void 0 : profile.phone) || ((_a2 = user == null ? void 0 : user.user_metadata) == null ? void 0 : _a2.phone) || ""
        });
        const { data: rpcData, error: rpcError } = await supabase.rpc("create_new_business", {
          p_business_name: formattedName,
          p_business_vertical: model.key,
          p_location: province || null,
          p_phone: (profile == null ? void 0 : profile.phone) || ((_b2 = user == null ? void 0 : user.user_metadata) == null ? void 0 : _b2.phone) || null
        });
        if (rpcError) {
          console.error("[Onboarding] create_new_business RPC failed:", rpcError);
          logSupabaseError(rpcError, {
            table: "rpc:create_new_business",
            operation: "rpc",
            component: "BusinessModelOverlay",
            actionName: "onboarding.create_new_business"
          });
          throw rpcError;
        }
        if (!rpcData || rpcData === "undefined" || !isUUID(rpcData)) {
          console.error("[Onboarding] create_new_business RPC returned invalid tenant_id:", rpcData);
          throw new Error("RPC returned invalid tenant_id");
        }
        console.log("[Onboarding] RPC create_new_business success, returned tenant_id:", rpcData);
        resolvedTenantId = rpcData;
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("ternakos_active_tenant_id", rpcData);
          } catch {
          }
        }
        toast.success(isNewBusiness ? t("onboarding_toast_new_biz_success", "Bisnis baru berhasil dibuat!") : t("onboarding_toast_profile_success", "Profil bisnis berhasil dibuat!"));
      }
      if (!resolvedTenantId || resolvedTenantId === "undefined" || !isUUID(resolvedTenantId)) {
        console.error("[Onboarding] resolvedTenantId is invalid before profile update:", resolvedTenantId);
        logError({
          level: "error",
          source: "action",
          component: "BusinessModelOverlay",
          actionName: "onboarding.missing_tenant_id",
          error: { message: "resolvedTenantId is invalid before profile update", code: "missing_tenant_id" },
          metadata: {
            vertical: selected || null,
            isNewBusiness: !!isNewBusiness,
            shouldCreateViRPC,
            hasProfile: !!profile
          }
        });
        throw new Error("Tenant ID is invalid/undefined");
      }
      console.log("[Onboarding] Updating profile and tenant details:", {
        targetAuthId,
        tenant_id: resolvedTenantId,
        user_type: model.user_type,
        sub_type: model.sub_type,
        business_vertical: model.key
      });
      const profilePayload = {
        user_type: model.user_type,
        business_model_selected: true,
        onboarded: true
      };
      if (profile && "sub_type" in profile) {
        profilePayload.sub_type = model.sub_type || null;
      }
      const { error: profError } = await supabase.from("profiles").update(profilePayload).eq("auth_user_id", targetAuthId).eq("tenant_id", resolvedTenantId);
      if (profError) {
        console.error("[Onboarding] profiles PATCH failed:", {
          code: profError.code,
          message: profError.message,
          details: profError.details,
          hint: profError.hint,
          payload: { user_type: model.user_type, auth_user_id: targetAuthId, tenant_id: resolvedTenantId }
        });
        logSupabaseError(profError, {
          table: "profiles",
          operation: "update",
          component: "BusinessModelOverlay",
          actionName: "onboarding.update_profile"
        });
        throw profError;
      }
      console.log("[Onboarding] profiles PATCH success");
      if (resolvedTenantId) {
        const subType = model.sub_type || "";
        const baseType = subType.includes("sapi") ? "sapi" : subType.includes("domba") && !subType.includes("kambing") ? "domba" : subType.includes("kambing") && !subType.includes("domba") ? "kambing" : subType.includes("bebek") ? "bebek" : subType.includes("babi") ? "babi" : ["peternak_broiler", "peternak_layer", "broker_ayam", "broker_telur", "rpa_ayam", "rph"].includes(subType) ? "ayam" : null;
        const { error: tenError } = await supabase.from("tenants").update({
          sub_type: model.sub_type || null,
          business_vertical: model.key,
          business_name: formattedName,
          province: province || null,
          base_livestock_type: baseType,
          owner_name: (profile == null ? void 0 : profile.full_name) || ((_c = user == null ? void 0 : user.user_metadata) == null ? void 0 : _c.full_name) || null,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        }).eq("id", resolvedTenantId);
        if (tenError) {
          console.error("[Onboarding] tenants UPDATE failed:", {
            code: tenError.code,
            message: tenError.message,
            details: tenError.details,
            tenant_id: resolvedTenantId
          });
          logSupabaseError(tenError, {
            table: "tenants",
            operation: "update",
            component: "BusinessModelOverlay",
            actionName: "onboarding.update_tenant"
          });
          throw tenError;
        }
        console.log("[Onboarding] tenants UPDATE success");
        const intendedPlan = sessionStorage.getItem("intended_trial_plan");
        if (intendedPlan && (intendedPlan === "pro" || intendedPlan === "business") && resolvedTenantId) {
          console.log("[Onboarding] Auto-activating trial for plan:", intendedPlan);
          try {
            const { error: trialError } = await supabase.rpc("activate_plan_trial", {
              p_tenant_id: resolvedTenantId,
              p_plan: intendedPlan,
              p_days: 14
              // default trial days
            });
            if (trialError) {
              console.error("[Onboarding] Auto trial activation failed:", trialError.message);
            } else {
              console.log("[Onboarding] Auto trial activation success");
              toast.success(t("onboarding_toast_trial_success", "Trial {plan} 14 hari gratis berhasil diaktifkan!").replace("{plan}", intendedPlan === "business" ? "Business" : "Pro"));
            }
          } catch (trialErr) {
            console.error("[Onboarding] Auto trial activation exception:", trialErr);
          } finally {
            sessionStorage.removeItem("intended_trial_plan");
          }
        }
      }
      const BATCH_TABLE_MAP = {
        peternak_sapi_penggemukan: "sapi_penggemukan_batches",
        peternak_domba_penggemukan: "domba_penggemukan_batches",
        peternak_kambing_penggemukan: "kambing_penggemukan_batches",
        peternak_kambing_domba_penggemukan: "domba_penggemukan_batches"
      };
      const batchTable = BATCH_TABLE_MAP[selected];
      if (batchTable && setupData.initial_count && resolvedTenantId) {
        const batchCode = `BATCH-${(/* @__PURE__ */ new Date()).getFullYear()}-${String((/* @__PURE__ */ new Date()).getMonth() + 1).padStart(2, "0")}-001`;
        const batchPayload = {
          tenant_id: resolvedTenantId,
          batch_code: ((_d = setupData.batch_name) == null ? void 0 : _d.trim()) || batchCode,
          kandang_name: ((_e = setupData.kandang_name) == null ? void 0 : _e.trim()) || "Kandang Utama",
          start_date: setupData.start_date,
          total_animals: parseInt(setupData.initial_count) || 0,
          avg_entry_weight_kg: parseFloat(setupData.initial_avg_weight) || null,
          status: "active"
        };
        if (selected === "peternak_sapi_penggemukan") {
          batchPayload.batch_purpose = "potong";
          if (setupData.purchase_price_per_kg) {
            batchPayload.notes = `Harga beli: Rp ${parseInt(setupData.purchase_price_per_kg).toLocaleString("id-ID")}/kg`;
          }
        }
        const { error: batchError } = await supabase.from(batchTable).insert(batchPayload);
        if (batchError) {
          console.warn("[Onboarding] Batch insert failed, continuing:", batchError.message);
          logSupabaseError(batchError, {
            table: batchTable,
            operation: "insert",
            component: "BusinessModelOverlay",
            actionName: "onboarding.insert_initial_batch"
          });
        }
      }
      setIsSuccess(true);
      setTimeout(() => {
        if (onComplete) onComplete(selected);
      }, 1800);
    } catch (err) {
      console.error("[Onboarding] saveAndComplete FATAL error:", {
        message: err == null ? void 0 : err.message,
        code: err == null ? void 0 : err.code,
        details: err == null ? void 0 : err.details,
        hint: err == null ? void 0 : err.hint,
        stack: err == null ? void 0 : err.stack
      });
      logError({
        level: "error",
        source: "action",
        component: "BusinessModelOverlay",
        actionName: "onboarding.saveAndComplete_fatal",
        error: err,
        metadata: { vertical: selected || null, isNewBusiness: !!isNewBusiness }
      });
      const isUserTypeLocked = (err == null ? void 0 : err.code) === "P0001" && typeof (err == null ? void 0 : err.message) === "string" && err.message.toLowerCase().includes("cannot change user_type");
      if (isUserTypeLocked) {
        toast.error(t("onboarding_error_cannot_change_type", 'Tidak bisa mengubah tipe bisnis akun ini. Buat bisnis baru lewat menu "Tambah Bisnis".'));
      } else {
        toast.error(t("onboarding_error_save_failed", "Gagal menyimpan pilihan. Silakan coba lagi."));
      }
      setLoading(false);
    }
  };
  const handleConfirm = handleNameConfirm;
  const handleInviteSubmit = () => {
    if (inviteInput.length !== 6) return;
    nav(`/invite?code=${inviteInput.trim().toUpperCase()}`);
  };
  const handleCategorySelect = (key) => {
    setCategory(key);
    setAnimalGroup(null);
    setSelected(null);
    setStep(2);
  };
  const handleAnimalGroupSelect = (key) => {
    setAnimalGroup(key);
    setSelected(null);
    setStep(3);
  };
  const handleSubRoleSelect = (key) => {
    setSelected(key);
    setStep(isPeternak ? 4 : 3);
    setSetupData({
      batch_name: "",
      start_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      initial_count: "",
      initial_avg_weight: "",
      purchase_price_per_kg: ""
    });
  };
  const handleBack = () => {
    if (isSetupStep) {
      setStep(4);
    } else if (isNameStep) {
      setStep(step - 1);
      setProvinceSearch("");
    } else if (isSubRoleStep) {
      if (isPeternak) {
        setStep(2);
        setSelected(null);
      } else {
        if (isRoleLocked) return;
        setStep(1);
        setCategory(null);
        setSelected(null);
      }
    } else if (isAnimalStep) {
      if (isRoleLocked) return;
      setStep(1);
      setCategory(null);
      setAnimalGroup(null);
      setSelected(null);
    } else {
      if (isRoleLocked) return;
      setStep(1);
      setCategory(null);
      setSelected(null);
    }
  };
  if (isSuccess) {
    const successModel = BUSINESS_MODELS[selected];
    const emoji = ((_a = VERTICAL_SETUP_CONFIG[selected]) == null ? void 0 : _a.emoji) || (successModel == null ? void 0 : successModel.icon) || "🎉";
    return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4", children: /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: { scale: 0.85, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: { type: "spring", stiffness: 200, damping: 20 },
        className: "flex flex-col items-center text-center gap-6 max-w-xs w-full",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(
              motion.div,
              {
                initial: { scale: 0 },
                animate: { scale: 1 },
                transition: { delay: 0.1, type: "spring", stiffness: 260, damping: 18 },
                className: "w-28 h-28 rounded-full flex items-center justify-center",
                style: {
                  background: "radial-gradient(ellipse at 40% 30%, rgba(2, 26, 2,0.25), rgba(2, 26, 2,0.06))",
                  border: "2px solid rgba(2, 26, 2,0.35)",
                  boxShadow: "0 0 40px rgba(2, 26, 2,0.2)"
                },
                children: /* @__PURE__ */ jsx("span", { className: "text-5xl select-none", children: emoji })
              }
            ),
            /* @__PURE__ */ jsx(
              motion.div,
              {
                animate: { scale: [1, 1.5], opacity: [0.4, 0] },
                transition: { duration: 1.4, repeat: Infinity },
                className: "absolute inset-0 rounded-full border border-emerald-500/30"
              }
            ),
            /* @__PURE__ */ jsx(
              motion.div,
              {
                animate: { scale: [1, 1.8], opacity: [0.2, 0] },
                transition: { duration: 1.4, repeat: Infinity, delay: 0.4 },
                className: "absolute inset-0 rounded-full border border-emerald-500/15"
              }
            ),
            /* @__PURE__ */ jsx(
              motion.div,
              {
                initial: { scale: 0 },
                animate: { scale: 1 },
                transition: { delay: 0.35, type: "spring", stiffness: 300, damping: 18 },
                className: "absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/40",
                children: /* @__PURE__ */ jsx(Check, { size: 18, strokeWidth: 3, className: "text-white" })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(
              motion.p,
              {
                initial: { opacity: 0, y: 8 },
                animate: { opacity: 1, y: 0 },
                transition: { delay: 0.3 },
                className: "text-xs font-black uppercase tracking-widest text-emerald-400 mb-1",
                children: t("onboarding_success_title", "Bisnis Berhasil Dibuat!")
              }
            ),
            /* @__PURE__ */ jsx(
              motion.h2,
              {
                initial: { opacity: 0, y: 8 },
                animate: { opacity: 1, y: 0 },
                transition: { delay: 0.4 },
                className: "text-2xl font-black text-white leading-tight",
                children: toTitleCase(businessName.trim())
              }
            ),
            /* @__PURE__ */ jsx(
              motion.p,
              {
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                transition: { delay: 0.55 },
                className: "text-[13px] text-slate-500 mt-2",
                children: t("onboarding_success_redirecting", "Mengarahkan ke dashboard...")
              }
            )
          ] }),
          /* @__PURE__ */ jsx(
            motion.div,
            {
              initial: { opacity: 0 },
              animate: { opacity: 1 },
              transition: { delay: 0.6 },
              className: "flex gap-1.5",
              children: [0, 1, 2].map((i) => /* @__PURE__ */ jsx(
                motion.div,
                {
                  animate: { opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] },
                  transition: { duration: 0.9, repeat: Infinity, delay: i * 0.2 },
                  className: "w-1.5 h-1.5 rounded-full bg-emerald-500"
                },
                i
              ))
            }
          )
        ]
      }
    ) });
  }
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 overflow-y-auto custom-scrollbar", children: /* @__PURE__ */ jsxs(
    motion.div,
    {
      initial: { scale: 0.9, opacity: 0, y: 20 },
      animate: { scale: 1, opacity: 1, y: 0 },
      className: "relative w-full max-w-[460px] m-auto bg-[#0C1319]/80 border border-white/5 rounded-[28px] p-6 sm:p-8 shadow-2xl backdrop-blur-md overflow-hidden",
      children: [
        /* @__PURE__ */ jsx("div", { className: "absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" }),
        /* @__PURE__ */ jsx("div", { className: "absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => onComplete == null ? void 0 : onComplete(),
            className: "absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer z-30 active:scale-90",
            children: /* @__PURE__ */ jsx(X, { size: 18 })
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent shadow-[0_0_15px_rgba(2, 26, 2,0.3)]" }),
        /* @__PURE__ */ jsxs("div", { className: "text-center mb-6 relative z-10", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2 mb-4", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20 shadow-inner", children: /* @__PURE__ */ jsx("img", { src: "/logo.png", alt: "TernakOS", className: "w-7 h-7 rounded-md object-cover" }) }),
            /* @__PURE__ */ jsx("span", { className: "font-display font-black text-lg tracking-tight text-white", children: "TernakOS" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex items-start justify-center gap-1 mb-6 relative z-10", children: (() => {
            const labels = isPeternak ? needsSetupStep ? STEP_LABELS_PETERNAK : STEP_LABELS_PETERNAK_SHORT : STEP_LABELS_BROKER;
            return labels.map((label, i) => {
              const s = i + 1;
              const isActive = step === s;
              const isDone = step > s;
              return /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-1", style: { minWidth: 52 }, children: [
                /* @__PURE__ */ jsx("div", { className: cn(
                  "h-1 w-full rounded-full transition-all duration-500",
                  isDone || isActive ? "bg-emerald-500 shadow-[0_0_8px_rgba(2, 26, 2,0.35)]" : "bg-white/10"
                ) }),
                /* @__PURE__ */ jsx("span", { className: cn(
                  "text-[8px] font-black uppercase tracking-wider transition-colors duration-300 leading-none",
                  isActive ? "text-emerald-400" : isDone ? "text-emerald-600" : "text-white/15"
                ), children: stepLabelMap[label] || label })
              ] }, s);
            });
          })() }),
          /* @__PURE__ */ jsx(AnimatePresence, { mode: "wait", children: /* @__PURE__ */ jsx(
            motion.div,
            {
              initial: { opacity: 0, y: 10 },
              animate: { opacity: 1, y: 0 },
              exit: { opacity: 0, y: -10 },
              className: "relative z-10",
              children: step === 1 ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("h2", { className: "font-display text-xl sm:text-2xl font-black text-white mb-2 leading-tight", children: t("onboarding_cat_title", "Kamu berbisnis sebagai?") }),
                /* @__PURE__ */ jsx("p", { className: "text-[13px] text-slate-400 font-medium", children: t("onboarding_cat_subtitle", "Pilih kategori bisnis utama kamu.") })
              ] }) : isAnimalStep ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("h2", { className: "font-display text-xl sm:text-2xl font-black text-white mb-2 leading-tight", children: t("onboarding_animal_title", "Jenis hewan apa? 🐄") }),
                /* @__PURE__ */ jsx("p", { className: "text-[13px] text-slate-400 font-medium", children: t("onboarding_animal_subtitle", "Pilih jenis ternak utama bapak.") })
              ] }) : isSubRoleStep ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("h2", { className: "font-display text-xl sm:text-2xl font-black text-white mb-1.5 leading-tight", children: isNewBusiness ? t("onboarding_title_new_business_type", "Bisnis {type}").replace("{type}", primaryRoleInfo ? t("biz_cat_" + primaryRoleInfo.category + "_label", primaryRoleInfo.label) : t("onboarding_title_new_business_fallback", "Baru")) : t("onboarding_title_specialization", "Spesialisasi Bisnis") }),
                /* @__PURE__ */ jsx("p", { className: "text-[13px] text-slate-400 font-medium leading-relaxed max-w-[320px] mx-auto", children: isNewBusiness ? t("onboarding_desc_new_business", "Pilih spesialisasi unit bisnis tambahan.") : t("onboarding_desc_specialization", "Lengkapi profil agar dashboard sesuai kebutuhanmu.") })
              ] }) : isNameStep ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("h2", { className: "font-display text-xl sm:text-2xl font-black text-white mb-1.5 leading-tight", children: category === "peternak" ? t("onboarding_name_title_farm", "Nama farm bapak?") : t("onboarding_name_title_biz", "Nama bisnis bapak?") }),
                /* @__PURE__ */ jsx("p", { className: "text-[13px] text-slate-400 font-medium leading-relaxed", children: category === "peternak" ? t("onboarding_name_desc_farm", "Berikan nama yang unik untuk lokasi farm ini.") : t("onboarding_name_desc_biz", "Nama ini akan tampil di seluruh laporan dan invoice.") })
              ] }) : isSetupStep ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsxs("h2", { className: "font-display text-xl sm:text-2xl font-black text-white mb-1.5 flex items-center justify-center gap-2.5 leading-tight", children: [
                  t("onboarding_setup_batch_title", "Setup Batch Pertama"),
                  " ",
                  /* @__PURE__ */ jsx("span", { className: "animate-bounce-slow", children: ((_b = VERTICAL_SETUP_CONFIG[selected]) == null ? void 0 : _b.emoji) || "🐄" })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-[13px] text-slate-400 font-medium leading-relaxed", children: "Data awal untuk mendukung performa ternak." })
              ] }) : null
            },
            step
          ) })
        ] }),
        /* @__PURE__ */ jsx(AnimatePresence, { mode: "wait", children: step === 1 ? /* @__PURE__ */ jsxs(
          motion.div,
          {
            initial: { opacity: 0, x: -20 },
            animate: { opacity: 1, x: 0 },
            exit: { opacity: 0, x: -20 },
            className: "flex flex-col gap-3 relative z-10",
            children: [
              BUSINESS_CATEGORIES.map((cat) => /* @__PURE__ */ jsx(CategoryCard, { cat, onClick: () => handleCategorySelect(cat.key) }, cat.key)),
              /* @__PURE__ */ jsxs("div", { className: "mt-1", children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: () => setInviteOpen((v) => !v),
                    className: "w-full flex items-center justify-between gap-2 px-4 py-3 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all active:scale-[0.99]",
                    children: [
                      /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2 text-[13px] font-medium", children: [
                        /* @__PURE__ */ jsx(Key, { size: 14 }),
                        t("onboarding_invite_button", "Punya kode undangan?")
                      ] }),
                      /* @__PURE__ */ jsx(
                        ChevronRight,
                        {
                          size: 14,
                          className: cn("transition-transform duration-200", inviteOpen && "rotate-90")
                        }
                      )
                    ]
                  }
                ),
                /* @__PURE__ */ jsx(AnimatePresence, { children: inviteOpen && /* @__PURE__ */ jsxs(
                  motion.div,
                  {
                    initial: { height: 0, opacity: 0 },
                    animate: { height: "auto", opacity: 1 },
                    exit: { height: 0, opacity: 0 },
                    transition: { duration: 0.2 },
                    className: "overflow-hidden",
                    children: [
                      /* @__PURE__ */ jsxs("div", { className: "pt-2 flex gap-2", children: [
                        /* @__PURE__ */ jsx(
                          "input",
                          {
                            type: "text",
                            maxLength: 6,
                            value: inviteInput,
                            onChange: (e) => setInviteInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")),
                            placeholder: t("onboarding_invite_placeholder", "KODE6X"),
                            className: "flex-1 h-11 rounded-xl bg-[#111C24] border border-white/8 px-4 font-mono font-black text-base tracking-[0.25em] text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-colors uppercase",
                            onKeyDown: (e) => {
                              if (e.key === "Enter" && inviteInput.length === 6) handleInviteSubmit();
                            },
                            autoFocus: true
                          }
                        ),
                        /* @__PURE__ */ jsx(
                          "button",
                          {
                            type: "button",
                            disabled: inviteInput.length !== 6,
                            onClick: handleInviteSubmit,
                            className: "h-11 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-[#052c1e] font-black text-sm transition-all",
                            children: t("onboarding_invite_submit", "Masuk")
                          }
                        )
                      ] }),
                      /* @__PURE__ */ jsx("p", { className: "text-[11px] text-[#4B6478] mt-1.5 px-1", children: t("onboarding_invite_note", "Kode diberikan oleh pemilik bisnis / farm yang mengundangmu.") })
                    ]
                  }
                ) })
              ] })
            ]
          },
          "step1"
        ) : isAnimalStep ? /* @__PURE__ */ jsxs(
          motion.div,
          {
            initial: { opacity: 0, x: 20 },
            animate: { opacity: 1, x: 0 },
            exit: { opacity: 0, x: 20 },
            className: "relative z-10",
            children: [
              /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-3 max-h-[45vh] overflow-y-auto pr-1 custom-scrollbar", children: ANIMAL_GROUPS.map((group) => /* @__PURE__ */ jsx(
                ModelCard,
                {
                  model: {
                    key: group.key,
                    label: group.label,
                    icon: group.icon,
                    description: group.description,
                    comingSoon: group.comingSoon
                  },
                  selected: animalGroup === group.key,
                  onClick: () => !group.comingSoon && handleAnimalGroupSelect(group.key)
                },
                group.key
              )) }),
              isRoleLocked ? null : /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: handleBack,
                  className: "flex items-center justify-center gap-2 w-full mt-6 py-2 text-slate-500 hover:text-white transition-colors text-sm font-bold",
                  children: [
                    /* @__PURE__ */ jsx(ArrowLeft, { size: 16 }),
                    t("common.back", "Kembali")
                  ]
                }
              )
            ]
          },
          "step-animal"
        ) : isSubRoleStep ? /* @__PURE__ */ jsxs(
          motion.div,
          {
            initial: { opacity: 0, x: 20 },
            animate: { opacity: 1, x: 0 },
            exit: { opacity: 0, x: 20 },
            className: "relative z-10",
            children: [
              /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-3 max-h-[45vh] overflow-y-auto pr-1 custom-scrollbar", children: subRoles.map((model) => /* @__PURE__ */ jsx(
                ModelCard,
                {
                  model: {
                    key: model.key,
                    label: model.name,
                    icon: model.icon,
                    description: model.description,
                    comingSoon: model.comingSoon
                  },
                  selected: selected === model.key,
                  onClick: () => !model.comingSoon && handleSubRoleSelect(model.key)
                },
                model.key
              )) }),
              isRoleLocked && !isPeternak ? null : /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: handleBack,
                  className: "flex items-center justify-center gap-2 w-full mt-6 py-2 text-slate-500 hover:text-white transition-colors text-sm font-bold",
                  children: [
                    /* @__PURE__ */ jsx(ArrowLeft, { size: 16 }),
                    t("common.back", "Kembali")
                  ]
                }
              )
            ]
          },
          "step-sub"
        ) : isNameStep ? /* @__PURE__ */ jsxs(
          motion.div,
          {
            initial: { opacity: 0, x: 20 },
            animate: { opacity: 1, x: 0 },
            exit: { opacity: 0, x: 20 },
            className: "relative z-10",
            children: [
              /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
                /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2.5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1", children: [
                  /* @__PURE__ */ jsx(Building2, { size: 12, className: "text-slate-500" }),
                  category === "peternak" ? t("onboarding_name_label_farm", "Nama Farm") : t("onboarding_name_label_biz", "Nama Bisnis"),
                  " ",
                  /* @__PURE__ */ jsx("span", { className: "text-emerald-500/50", children: "*" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
                  /* @__PURE__ */ jsx("div", { className: "absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      value: businessName,
                      onChange: (e) => handleNameChange(e.target.value),
                      onBlur: (e) => handleNameChange(toTitleCase(e.target.value)),
                      placeholder: t("onboarding_name_placeholder", "Contoh: Poultry Farm Jaya"),
                      maxLength: 80,
                      autoFocus: true,
                      className: cn(
                        "relative w-full h-14 px-5 bg-[#111C24] border rounded-2xl text-white font-display font-bold text-lg outline-none transition-all duration-300",
                        nameTaken ? "border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]" : businessName.trim().length >= 3 && !nameChecking ? "border-emerald-500/30 focus:border-emerald-500/60" : "border-white/5 focus:border-white/10"
                      )
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "min-h-[24px] mt-2.5 px-1", children: [
                  businessName.trim().length > 0 && businessName.trim().length < 3 && /* @__PURE__ */ jsx("p", { className: "text-[12px] text-red-400 font-medium", children: category === "peternak" ? t("onboarding_name_min_farm", "Nama farm minimal 3 karakter") : t("onboarding_name_min_biz", "Nama bisnis minimal 3 karakter") }),
                  businessName.trim().length >= 3 && nameChecking && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5 text-[12px] text-slate-500 font-medium font-display", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-3 h-3 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" }),
                    t("onboarding_name_checking", "Mengecek ketersediaan...")
                  ] }),
                  businessName.trim().length >= 3 && !nameChecking && nameTaken && /* @__PURE__ */ jsx("p", { className: "text-[12px] text-red-500 font-medium animate-in fade-in slide-in-from-left-2 duration-300", children: t("onboarding_name_taken", '❌ Nama "{name}" sudah terpakai.').replace("{name}", toTitleCase(businessName)) }),
                  businessName.trim().length >= 3 && !nameChecking && !nameTaken && /* @__PURE__ */ jsx("p", { className: "text-[12px] text-emerald-500 font-bold animate-in fade-in slide-in-from-left-2 duration-300", children: t("onboarding_name_available", "✅ {name} tersedia").replace("{name}", toTitleCase(businessName)) })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "mb-8 relative", children: [
                /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2.5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1", children: [
                  /* @__PURE__ */ jsx(MapPin, { size: 12, className: "text-slate-500" }),
                  t("onboarding_province_label", "Provinsi"),
                  " ",
                  /* @__PURE__ */ jsx("span", { className: "text-emerald-500/50", children: "*" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
                  /* @__PURE__ */ jsx("div", { className: "absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      value: provinceOpen ? provinceSearch : province,
                      onChange: (e) => {
                        setProvinceSearch(e.target.value);
                        if (!provinceOpen) setProvinceOpen(true);
                      },
                      onFocus: () => {
                        setProvinceSearch("");
                        setProvinceOpen(true);
                      },
                      placeholder: province || t("onboarding_province_placeholder", "Ketik nama provinsi..."),
                      className: cn(
                        "relative w-full h-14 pl-5 pr-12 bg-[#111C24] border rounded-2xl text-white font-medium text-[15px] outline-none transition-all duration-300",
                        province ? "border-emerald-500/30 shadow-[0_0_15px_rgba(2, 26, 2,0.05)]" : "border-white/5 focus:border-white/10"
                      )
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "div",
                    {
                      onClick: () => setProvinceOpen((v) => !v),
                      className: "absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-white/5 rounded-full cursor-pointer transition-all z-10",
                      children: /* @__PURE__ */ jsx(ChevronDown, { size: 16, className: cn("text-slate-500 transition-transform duration-300", provinceOpen && "rotate-180") })
                    }
                  )
                ] }),
                /* @__PURE__ */ jsx(AnimatePresence, { children: provinceOpen && /* @__PURE__ */ jsx(
                  motion.div,
                  {
                    initial: { opacity: 0, scale: 0.98, y: -4 },
                    animate: { opacity: 1, scale: 1, y: 0 },
                    exit: { opacity: 0, scale: 0.98, y: -4 },
                    className: "absolute top-[calc(100%+8px)] left-0 right-0 bg-[#111C24]/95 border border-white/10 rounded-2xl max-h-[220px] overflow-y-auto z-[100] p-2 shadow-2xl backdrop-blur-xl custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200",
                    children: filteredProvinces.length > 0 ? filteredProvinces.map((p) => /* @__PURE__ */ jsxs(
                      "button",
                      {
                        type: "button",
                        onClick: () => {
                          setProvince(p);
                          setProvinceSearch("");
                          setProvinceOpen(false);
                        },
                        className: cn(
                          "w-full px-4 py-3.5 text-left rounded-xl text-[14px] font-medium transition-all mb-1 flex items-center justify-between",
                          province === p ? "bg-emerald-500/10 text-emerald-400 font-bold" : "text-slate-300 hover:bg-white/5 hover:text-white"
                        ),
                        children: [
                          /* @__PURE__ */ jsx("span", { children: p }),
                          province === p && /* @__PURE__ */ jsx(Check, { size: 14, className: "text-emerald-400 font-black" })
                        ]
                      },
                      p
                    )) : /* @__PURE__ */ jsx("div", { className: "py-8 text-center", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 italic", children: t("onboarding_province_not_found", "Provinsi tidak ditemukan") }) })
                  }
                ) })
              ] }),
              /* @__PURE__ */ jsx(
                motion.button,
                {
                  onClick: handleConfirm,
                  disabled: loading || businessName.trim().length < 3 || nameTaken || nameChecking || !province,
                  whileTap: { scale: 0.97 },
                  className: cn(
                    "w-full h-14 rounded-2xl font-display font-black text-base shadow-xl transition-all duration-300 active:scale-95 flex items-center justify-center gap-2",
                    businessName.trim().length >= 3 && !nameTaken && !nameChecking && province ? "bg-emerald-500 hover:bg-emerald-400 text-[#052c1e] shadow-emerald-500/20" : "bg-white/5 text-slate-500 cursor-not-allowed border border-white/5"
                  ),
                  children: loading ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-4 h-4 border-2 border-emerald-900/30 border-t-emerald-900 rounded-full animate-spin" }),
                    t("common.saving", "Menyimpan...")
                  ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                    t("common.continue", "Lanjutkan"),
                    " ",
                    /* @__PURE__ */ jsx(ArrowLeft, { size: 16, className: "rotate-180" })
                  ] })
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: handleBack,
                  className: "flex items-center justify-center gap-2 w-full mt-6 py-2 text-slate-500 hover:text-white transition-colors text-sm font-bold",
                  children: [
                    /* @__PURE__ */ jsx(ArrowLeft, { size: 16 }),
                    t("common.back", "Kembali")
                  ]
                }
              )
            ]
          },
          "step-name"
        ) : isSetupStep ? /* @__PURE__ */ jsxs(
          motion.div,
          {
            initial: { opacity: 0, x: 20 },
            animate: { opacity: 1, x: 0 },
            exit: { opacity: 0, x: 20 },
            className: "relative z-10",
            children: [
              /* @__PURE__ */ jsx("div", { className: "mb-2", children: /* @__PURE__ */ jsx(
                StepSetup,
                {
                  selectedModel: selected,
                  setupData,
                  setSetupData,
                  t
                }
              ) }),
              /* @__PURE__ */ jsx(
                motion.button,
                {
                  onClick: saveAndComplete,
                  disabled: loading,
                  whileTap: { scale: 0.97 },
                  className: cn(
                    "w-full h-16 rounded-2xl font-display font-black text-lg shadow-xl shadow-amber-500/20 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2",
                    loading ? "bg-amber-500/50 cursor-not-allowed" : "bg-amber-500 hover:bg-amber-400 text-[#2c1a05]"
                  ),
                  children: loading ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-5 h-5 border-3 border-amber-900/30 border-t-amber-900 rounded-full animate-spin" }),
                    t("common.saving", "Menyimpan...")
                  ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                    t("onboarding_setup_complete", "Selesaikan Setup"),
                    " ",
                    /* @__PURE__ */ jsx(ArrowLeft, { size: 18, className: "rotate-180" })
                  ] })
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1 mt-6", children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => saveAndComplete(),
                    className: "w-full py-2.5 text-slate-500 hover:text-slate-300 text-[13px] font-bold transition-colors",
                    children: t("onboarding_setup_skip", "Lewati untuk sekarang")
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: handleBack,
                    className: "flex items-center justify-center gap-2 w-full py-2 text-slate-600 hover:text-slate-400 transition-colors text-xs font-bold",
                    children: [
                      /* @__PURE__ */ jsx(ArrowLeft, { size: 14 }),
                      t("onboarding_setup_back_to_name", "Kembali ke Nama Bisnis")
                    ]
                  }
                )
              ] })
            ]
          },
          "step-setup"
        ) : null })
      ]
    }
  ) });
}
function CategoryCard({ cat, onClick }) {
  const { t } = useLanguage();
  const labelKey = `biz_cat_${cat.key}_label`;
  const descKey = `biz_cat_${cat.key}_desc`;
  return /* @__PURE__ */ jsx(
    motion.div,
    {
      whileTap: { scale: 0.98 },
      whileHover: { scale: 1.01, borderColor: "rgba(2, 26, 2,0.2)" },
      onClick,
      className: "group relative bg-[#111C24] border border-white/5 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:bg-[#15232d] shadow-lg hover:shadow-emerald-500/5",
      children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-5", children: [
        /* @__PURE__ */ jsx("div", { className: "w-14 h-14 bg-emerald-500/10 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-110 transition-transform duration-500 border border-emerald-500/10 group-hover:border-emerald-500/30 group-hover:bg-emerald-500/20 overflow-hidden", children: typeof cat.icon === "string" && cat.icon.includes("/") ? /* @__PURE__ */ jsx("img", { src: cat.icon, alt: t(labelKey, cat.label), className: "w-full h-full object-cover scale-110" }) : cat.icon }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsx("h4", { className: "font-display font-bold text-[16px] text-white group-hover:text-emerald-400 transition-colors duration-300", children: t(labelKey, cat.label) }),
          /* @__PURE__ */ jsx("p", { className: "font-body text-[12px] text-slate-500 mt-1 leading-relaxed", children: t(descKey, cat.description) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-600 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-all duration-300", children: "›" })
      ] })
    }
  );
}
function ModelCard({ model, selected, onClick }) {
  const { t } = useLanguage();
  const isAnimal = ["ayam", "bebek", "domba", "kambing", "sapi", "babi"].includes(model.key);
  const labelKey = isAnimal ? `animal_group_${model.key}_label` : `biz_model_${model.key}_label`;
  const descKey = isAnimal ? `animal_group_${model.key}_desc` : `biz_model_${model.key}_desc`;
  return /* @__PURE__ */ jsxs(
    motion.div,
    {
      whileTap: !model.comingSoon ? { scale: 0.98 } : {},
      whileHover: !model.comingSoon ? { scale: 1.01 } : {},
      onClick,
      className: cn(
        "group relative border rounded-2xl p-4 transition-all duration-300 flex items-center gap-4",
        model.comingSoon ? "bg-white/[0.02] border-white/5 opacity-50 cursor-not-allowed" : selected ? "bg-emerald-500/5 border-emerald-500/40 shadow-[0_0_15px_rgba(2, 26, 2,0.1)] cursor-pointer" : "bg-[#111C24] border-white/5 hover:border-white/10 hover:bg-[#15232d] cursor-pointer"
      ),
      children: [
        /* @__PURE__ */ jsx("div", { className: cn(
          "w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-all duration-500 border overflow-hidden",
          selected ? "bg-emerald-500/20 border-emerald-500/30 shadow-inner" : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
        ), children: typeof model.icon === "string" && model.icon.includes("/") ? /* @__PURE__ */ jsx("img", { src: model.icon, alt: t(labelKey, model.label), className: "w-full h-full object-cover scale-110" }) : model.icon }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5 mb-1", children: [
            /* @__PURE__ */ jsx("h4", { className: cn(
              "font-display font-bold text-[15px] truncate transition-colors",
              selected ? "text-emerald-400" : "text-white"
            ), children: t(labelKey, model.label) }),
            model.comingSoon && /* @__PURE__ */ jsx("span", { className: "text-[9px] font-black tracking-widest text-[#FBBF24] bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase", children: "Soon" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "font-body text-[11px] text-slate-500 leading-relaxed truncate", children: t(descKey, model.description) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: cn(
          "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500 border-1.5",
          selected ? "bg-emerald-500 border-transparent shadow-[0_0_10px_rgba(2, 26, 2,0.3)]" : "border-white/10"
        ), children: model.comingSoon ? /* @__PURE__ */ jsx(Lock, { size: 10, className: "text-white/20" }) : selected && /* @__PURE__ */ jsx(Check, { size: 12, className: "text-[#052c1e] font-black", strokeWidth: 4 }) })
      ]
    }
  );
}
export {
  BusinessModelOverlay as B
};
