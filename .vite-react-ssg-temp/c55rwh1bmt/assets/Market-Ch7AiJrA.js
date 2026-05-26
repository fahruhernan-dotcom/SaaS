import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Store, Plus, Search, X, ChevronDown, MapPin, Package, ChevronUp, AlertCircle, Clock, MessageCircle, UserPlus, Check, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { u as useAuth, s as supabase, p as logSupabaseError, b7 as useMarketListings, b8 as useMyListings, b9 as useCloseListing, ba as useDeleteListing, bb as useCreateListing } from "../main.mjs";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { P as PhoneInput } from "./PhoneInput-BYk7A6X-.js";
import "vite-react-ssg";
import "react-router-dom";
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
const useMyConnections = () => {
  const { tenant } = useAuth();
  return useQuery({
    queryKey: ["broker-connections", tenant == null ? void 0 : tenant.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("broker_connections").select(`
          *,
          requester:requester_tenant_id(id, business_name, business_vertical, sub_type),
          target:target_tenant_id(id, business_name, business_vertical, sub_type)
        `).or(`requester_tenant_id.eq.${tenant.id},target_tenant_id.eq.${tenant.id}`).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!(tenant == null ? void 0 : tenant.id)
  });
};
const useConnectionStatus = (targetTenantId) => {
  const { tenant } = useAuth();
  return useQuery({
    queryKey: ["connection-status", tenant == null ? void 0 : tenant.id, targetTenantId],
    queryFn: async () => {
      const { data } = await supabase.from("broker_connections").select("id, status, requester_tenant_id").or(
        `and(requester_tenant_id.eq.${tenant.id},target_tenant_id.eq.${targetTenantId}),and(requester_tenant_id.eq.${targetTenantId},target_tenant_id.eq.${tenant.id})`
      ).maybeSingle();
      return data;
    },
    enabled: !!(tenant == null ? void 0 : tenant.id) && !!targetTenantId
  });
};
const useRequestConnection = () => {
  const { tenant } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ targetTenantId, targetType, message }) => {
      const { data, error } = await supabase.from("broker_connections").insert({
        requester_tenant_id: tenant.id,
        requester_type: tenant.business_vertical,
        target_tenant_id: targetTenantId,
        target_type: targetType,
        message: message || null,
        status: "pending"
      }).select().single();
      if (error) {
        logSupabaseError(error, { table: "broker_connections", operation: "insert", component: "useBrokerConnections", actionName: "broker.connection.request" });
        throw error;
      }
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries(["broker-connections", tenant.id]);
      queryClient.invalidateQueries(["connection-status", tenant.id, vars.targetTenantId]);
      toast.success("Permintaan koneksi terkirim");
    },
    onError: (err) => {
      if (err.code === "23505") {
        toast.error("Kamu sudah pernah request koneksi ini");
      } else {
        toast.error("Gagal mengirim permintaan");
      }
    }
  });
};
const useRespondConnection = () => {
  const { tenant } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ connectionId, status, rejectedReason }) => {
      const { data, error } = await supabase.from("broker_connections").update({
        status,
        rejected_reason: rejectedReason || null,
        responded_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", connectionId).select().single();
      if (error) {
        logSupabaseError(error, { table: "broker_connections", operation: "update", component: "useBrokerConnections", actionName: "broker.connection.respond" });
        throw error;
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["broker-connections", tenant.id]);
      queryClient.invalidateQueries(["connection-status"]);
      const messages = {
        active: "Koneksi diterima",
        rejected: "Koneksi ditolak",
        blocked: "Pengguna diblokir"
      };
      toast.success(messages[data.status] || "Status diperbarui");
    }
  });
};
const useCancelConnection = () => {
  const { tenant } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (connectionId) => {
      const { error } = await supabase.from("broker_connections").delete().eq("id", connectionId).eq("requester_tenant_id", tenant.id).eq("status", "pending");
      if (error) {
        logSupabaseError(error, { table: "broker_connections", operation: "delete", component: "useBrokerConnections", actionName: "broker.connection.cancel" });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["broker-connections", tenant.id]);
      queryClient.invalidateQueries(["connection-status"]);
      toast.success("Permintaan dibatalkan");
    }
  });
};
const LISTING_TYPES = [
  { value: "all", label: "Semua", icon: "/logo.png" },
  { value: "stok_ayam", label: "Stok Ayam", icon: "/assets/icons/models/role_peternak.png" },
  { value: "penawaran_broker", label: "Penawaran Broker", icon: "/assets/icons/models/role_broker.png" },
  { value: "permintaan_rpa", label: "Permintaan RPA", icon: "/assets/icons/models/role_rpa.png" }
];
const PAYMENT_TERMS = [
  { value: "cash", label: "Cash" },
  { value: "net3", label: "Net 3" },
  { value: "net7", label: "Net 7" }
];
const COMMODITY_GROUPS = [
  {
    label: "Unggas (Hidup & Karkas)",
    options: [
      { value: "broiler", label: "Ayam Broiler" },
      { value: "kampung", label: "Ayam Kampung" },
      { value: "pejantan", label: "Ayam Pejantan" },
      { value: "layer", label: "Ayam Layer" }
    ]
  },
  {
    label: "Ternak & Hewan Besar",
    options: [
      { value: "sapi", label: "Sapi" },
      { value: "kambing", label: "Kambing" },
      { value: "domba", label: "Domba" }
    ]
  },
  {
    label: "Sembako & Hasil Bumi",
    options: [
      { value: "beras", label: "Beras" },
      { value: "minyak", label: "Minyak Goreng" },
      { value: "gula", label: "Gula" },
      { value: "tepung", label: "Tepung" },
      { value: "telur", label: "Telur" }
    ]
  }
];
const TYPE_META = {
  stok_ayam: { label: "Stok Peternak", color: "#A78BFA", bg: "rgba(124,58,237,0.12)", border: "rgba(124,58,237,0.3)" },
  penawaran_broker: { label: "Penawaran Broker", color: "#021a02", bg: "rgba(2, 26, 2,0.12)", border: "rgba(2, 26, 2,0.3)" },
  permintaan_rpa: { label: "Permintaan RPA", color: "#FBBF24", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)" }
};
const STATUS_META = {
  active: { label: "Aktif", color: "#021a02", bg: "rgba(2, 26, 2,0.12)" },
  closed: { label: "Ditutup", color: "#94A3B8", bg: "rgba(148,163,184,0.1)" },
  expired: { label: "Kadaluarsa", color: "#F87171", bg: "rgba(248,113,113,0.12)" }
};
function normalizeWA(raw) {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  if (digits.startsWith("62")) return digits;
  return "62" + digits;
}
function formatRp(n) {
  if (!n && n !== 0) return "—";
  return "Rp " + Number(n).toLocaleString("id-ID");
}
function timeAgo(dateStr) {
  if (!dateStr) return "";
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: id });
  } catch {
    return "";
  }
}
function TypeBadge({ type }) {
  const m = TYPE_META[type];
  if (!m) return null;
  return /* @__PURE__ */ jsx(
    "span",
    {
      className: "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
      style: { color: m.color, background: m.bg, border: `1px solid ${m.border}` },
      children: m.label
    }
  );
}
function ConnectionButton({ connection, amRequester, onRequest, onRespond, onCancel }) {
  if (!connection) {
    return /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: onRequest,
        className: "flex items-center gap-1.5 px-3 py-1.5 rounded-lg\r\n          bg-emerald-500/10 border border-emerald-500/20\r\n          text-emerald-400 text-xs font-display font-black\r\n          hover:bg-emerald-500/20 transition-colors",
        children: [
          /* @__PURE__ */ jsx(UserPlus, { className: "w-3.5 h-3.5" }),
          "Ajak Kerjasama"
        ]
      }
    );
  }
  if (connection.status === "active") {
    return /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 px-3 py-1.5 rounded-lg\r\n        bg-emerald-500/10 text-emerald-400 text-xs font-display font-black", children: [
      /* @__PURE__ */ jsx(Check, { className: "w-3.5 h-3.5" }),
      "Mitra"
    ] });
  }
  if (connection.status === "pending" && amRequester) {
    return /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: onCancel,
        className: "flex items-center gap-1 px-3 py-1.5 rounded-lg\r\n          bg-amber-500/10 border border-amber-500/20\r\n          text-amber-400 text-xs font-display font-black\r\n          hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20\r\n          transition-colors group",
        children: [
          /* @__PURE__ */ jsx(Clock, { className: "w-3.5 h-3.5 group-hover:hidden" }),
          /* @__PURE__ */ jsx(X, { className: "w-3.5 h-3.5 hidden group-hover:block" }),
          /* @__PURE__ */ jsx("span", { className: "group-hover:hidden", children: "Menunggu" }),
          /* @__PURE__ */ jsx("span", { className: "hidden group-hover:block", children: "Batalkan" })
        ]
      }
    );
  }
  if (connection.status === "pending" && !amRequester) {
    return /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => onRespond("active"),
          className: "px-2.5 py-1.5 rounded-lg bg-emerald-500/10\r\n            text-emerald-400 text-xs font-display font-black\r\n            hover:bg-emerald-500/20 transition-colors",
          children: "Terima"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => onRespond("rejected"),
          className: "px-2.5 py-1.5 rounded-lg bg-red-500/10\r\n            text-red-400 text-xs font-display font-black\r\n            hover:bg-red-500/20 transition-colors",
          children: "Tolak"
        }
      )
    ] });
  }
  if (connection.status === "rejected") {
    return /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: onRequest,
        className: "flex items-center gap-1 px-3 py-1.5 rounded-lg\r\n          bg-[#111C24] border border-white/10\r\n          text-[#94A3B8] text-xs font-display font-black\r\n          hover:border-emerald-500/30 hover:text-emerald-400\r\n          transition-colors",
        children: [
          /* @__PURE__ */ jsx(RefreshCw, { className: "w-3.5 h-3.5" }),
          "Request Ulang"
        ]
      }
    );
  }
  if (connection.status === "blocked") {
    return /* @__PURE__ */ jsx("span", { className: "px-3 py-1.5 rounded-lg bg-[#111C24]\r\n        text-[#4B6478] text-xs font-display font-black cursor-not-allowed", children: "Diblokir" });
  }
  return null;
}
function ListingCard({ listing }) {
  var _a;
  const { tenant } = useAuth();
  const isOwnListing = listing.tenant_id === (tenant == null ? void 0 : tenant.id);
  const { data: connection } = useConnectionStatus(
    isOwnListing ? null : listing.tenant_id
  );
  const { mutate: requestConnection } = useRequestConnection();
  const { mutate: respondConnection } = useRespondConnection();
  const { mutate: cancelConnection } = useCancelConnection();
  const amRequester = (connection == null ? void 0 : connection.requester_tenant_id) === (tenant == null ? void 0 : tenant.id);
  async function handleContact() {
    supabase.from("market_listings").update({ view_count: (listing.view_count || 0) + 1 }).eq("id", listing.id).then(() => {
    });
    const wa = normalizeWA(listing.contact_wa || "");
    if (!wa || wa.length < 10) {
      toast.error("Nomor WA tidak valid");
      return;
    }
    const msg = encodeURIComponent(
      `Halo ${listing.contact_name}, saya tertarik dengan listing "${listing.title}" di TernakOS Market.`
    );
    window.open(`https://wa.me/${wa}?text=${msg}`, "_blank");
  }
  return /* @__PURE__ */ jsxs(
    motion.div,
    {
      layout: true,
      initial: { opacity: 0, y: 12 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, scale: 0.97 },
      className: "bg-[#111C24] rounded-2xl p-5 border border-white/8 hover:border-emerald-500/30 transition-all flex flex-col gap-3",
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 flex-wrap", children: [
          /* @__PURE__ */ jsx(TypeBadge, { type: listing.listing_type }),
          listing.chicken_type && /* @__PURE__ */ jsx("span", { className: "text-[10px] font-semibold text-[#4B6478] bg-white/5 px-2 py-0.5 rounded-full capitalize", children: listing.chicken_type })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-[#F1F5F9] leading-snug line-clamp-2", children: listing.title }),
          listing.location && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 mt-1", children: [
            /* @__PURE__ */ jsx(MapPin, { size: 11, className: "text-[#4B6478] shrink-0" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-[#4B6478] truncate", children: listing.location })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          listing.weight_kg > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-xs", children: [
            /* @__PURE__ */ jsx("span", { className: "text-[#4B6478]", children: "Kuantitas / Bobot Total" }),
            /* @__PURE__ */ jsxs("span", { className: "text-[#94A3B8] font-semibold tabular-nums", children: [
              listing.weight_kg,
              " kg/Liter"
            ] })
          ] }),
          listing.quantity_ekor > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-xs", children: [
            /* @__PURE__ */ jsx("span", { className: "text-[#4B6478]", children: "Jumlah Unit/Ekor" }),
            /* @__PURE__ */ jsxs("span", { className: "text-[#94A3B8] font-semibold tabular-nums", children: [
              listing.quantity_ekor.toLocaleString("id-ID"),
              " unit"
            ] })
          ] }),
          listing.price_per_kg > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-xs", children: [
            /* @__PURE__ */ jsx("span", { className: "text-[#4B6478]", children: listing.listing_type === "permintaan_rpa" ? "Budget Harga" : "Harga Per Satuan" }),
            /* @__PURE__ */ jsx("span", { className: "font-bold tabular-nums", style: { color: "#021a02" }, children: formatRp(listing.price_per_kg) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pt-1 border-t border-white/5 mt-auto gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs text-[#F1F5F9] font-semibold truncate", children: ((_a = listing.tenants) == null ? void 0 : _a.business_name) ?? listing.contact_name ?? "—" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 mt-0.5", children: [
              /* @__PURE__ */ jsx(Clock, { size: 10, className: "text-[#4B6478]" }),
              /* @__PURE__ */ jsx("p", { className: "text-[10px] text-[#4B6478]", children: timeAgo(listing.created_at) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 shrink-0", children: [
            !isOwnListing && /* @__PURE__ */ jsx(
              ConnectionButton,
              {
                connection,
                amRequester,
                onRequest: () => requestConnection({
                  targetTenantId: listing.tenant_id,
                  targetType: listing.listing_type
                }),
                onRespond: (status) => respondConnection({ connectionId: connection.id, status }),
                onCancel: () => cancelConnection(connection.id)
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: handleContact,
                className: "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors",
                style: {
                  background: "rgba(37,211,102,0.08)",
                  border: "1px solid rgba(37,211,102,0.25)",
                  color: "#25D366"
                },
                children: [
                  /* @__PURE__ */ jsx(MessageCircle, { size: 13 }),
                  "WA"
                ]
              }
            )
          ] })
        ] })
      ]
    }
  );
}
function MyListingRow({ listing, onClose, onDelete }) {
  const s = STATUS_META[listing.status] ?? STATUS_META.closed;
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 py-3 border-b border-white/5 last:border-0", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-[#F1F5F9] truncate", children: listing.title }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 flex-wrap mt-0.5", children: [
        /* @__PURE__ */ jsx(TypeBadge, { type: listing.listing_type }),
        /* @__PURE__ */ jsx(
          "span",
          {
            className: "text-[10px] font-semibold px-2 py-0.5 rounded-full",
            style: { color: s.color, background: s.bg },
            children: s.label
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx("p", { className: "text-xs text-[#4B6478] shrink-0 hidden sm:block", children: timeAgo(listing.created_at) }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [
      listing.status === "active" && /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => onClose(listing.id),
          className: "text-xs px-2.5 py-1.5 rounded-lg border border-white/10 text-[#94A3B8] hover:bg-white/5 transition-colors",
          children: "Tutup"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => onDelete(listing.id),
          className: "text-xs px-2.5 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors",
          children: "Hapus"
        }
      )
    ] })
  ] });
}
const FORM_DEFAULTS = {
  listing_type: "",
  title: "",
  chicken_type: "",
  quantity_ekor: "",
  weight_kg: "",
  price_per_kg: "",
  location: "",
  description: "",
  contact_name: "",
  contact_wa: "",
  expires_at: "",
  payment_terms: "",
  harvest_date: "",
  target_date: ""
};
function SheetPasangIklan({ isOpen, onClose, profile }) {
  const create = useCreateListing();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ ...FORM_DEFAULTS });
  function set(k, v) {
    setForm((p) => ({ ...p, [k]: v }));
  }
  function buildAutoTitle() {
    const ct = form.chicken_type || "Ayam";
    const qty = form.quantity_ekor ? `${form.quantity_ekor} ekor` : "";
    const loc = form.location || "";
    if (form.listing_type === "stok_ayam")
      return `Stok ${ct} siap panen${loc ? ` — ${loc}` : ""}`;
    if (form.listing_type === "penawaran_broker")
      return `Penawaran ${ct}${qty ? ` — ${qty}` : ""}${loc ? ` — ${loc}` : ""}`;
    if (form.listing_type === "permintaan_rpa")
      return `Butuh${qty ? ` ${qty}` : ""} ${ct}${loc ? ` — ${loc}` : ""}`;
    return "";
  }
  function handleSelectType(type) {
    const expires = /* @__PURE__ */ new Date();
    expires.setDate(expires.getDate() + 30);
    setForm({
      ...FORM_DEFAULTS,
      listing_type: type,
      contact_name: (profile == null ? void 0 : profile.full_name) || "",
      expires_at: expires.toISOString().split("T")[0]
    });
    setStep(2);
  }
  async function handleSubmit(e) {
    e.preventDefault();
    const waDigits = normalizeWA(form.contact_wa);
    if (!form.listing_type) {
      toast.error("Pilih tipe listing");
      return;
    }
    if (!form.contact_name.trim()) {
      toast.error("Nama kontak wajib diisi");
      return;
    }
    if (!form.contact_wa.trim() || waDigits.length < 10) {
      toast.error("Nomor WhatsApp tidak valid (min 10 digit)");
      return;
    }
    const autoTitle = buildAutoTitle();
    await create.mutateAsync({
      listing_type: form.listing_type,
      title: form.title.trim() || autoTitle,
      chicken_type: form.chicken_type || null,
      quantity_ekor: form.quantity_ekor ? parseInt(form.quantity_ekor) : null,
      weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
      price_per_kg: form.price_per_kg ? parseFloat(form.price_per_kg) : null,
      location: form.location || null,
      description: form.description || null,
      contact_name: form.contact_name,
      contact_wa: waDigits,
      status: "active",
      expires_at: form.expires_at || null,
      view_count: 0
    });
    setForm({ ...FORM_DEFAULTS });
    setStep(1);
    onClose();
  }
  function handleClose() {
    setForm({ ...FORM_DEFAULTS });
    setStep(1);
    onClose();
  }
  return /* @__PURE__ */ jsx(AnimatePresence, { children: isOpen && /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      motion.div,
      {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        className: "fixed inset-0 bg-black/60 z-40",
        onClick: handleClose
      }
    ),
    /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: { x: "100%" },
        animate: { x: 0 },
        exit: { x: "100%" },
        transition: { type: "spring", damping: 28, stiffness: 260 },
        className: "fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0C1319] border-l border-white/10 z-50 flex flex-col",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-6 py-5 border-b border-white/8", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              step === 2 && /* @__PURE__ */ jsx("button", { onClick: () => setStep(1), className: "w-7 h-7 rounded-lg hover:bg-white/8 flex items-center justify-center", children: /* @__PURE__ */ jsx(ChevronDown, { size: 14, className: "text-[#4B6478] rotate-90" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h3", { className: "font-bold text-[#F1F5F9] text-base", children: "Pasang Iklan" }),
                /* @__PURE__ */ jsxs("p", { className: "text-xs text-[#4B6478]", children: [
                  "Langkah ",
                  step,
                  " dari 2"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx("button", { onClick: handleClose, className: "w-8 h-8 rounded-lg hover:bg-white/8 flex items-center justify-center", children: /* @__PURE__ */ jsx(X, { size: 16, className: "text-[#4B6478]" }) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex gap-1.5 px-6 pt-4", children: [1, 2].map((n) => /* @__PURE__ */ jsx(
            "div",
            {
              className: "h-1 rounded-full flex-1 transition-all",
              style: { background: n <= step ? "#021a02" : "rgba(255,255,255,0.08)" }
            },
            n
          )) }),
          step === 1 && /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto px-6 py-5 space-y-3", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-black uppercase tracking-widest text-[#4B6478] mb-4", children: "Saya ingin..." }),
            [
              {
                type: "stok_ayam",
                icon: "/assets/icons/models/role_peternak.png",
                title: "Jual Stok Ayam",
                desc: "Saya peternak — ingin jual ayam siap panen ke broker atau buyer",
                color: "#A78BFA"
              },
              {
                type: "penawaran_broker",
                icon: "/assets/icons/models/role_broker.png",
                title: "Tawarkan Ayam",
                desc: "Saya broker — ingin tawarkan ayam ke RPA atau buyer",
                color: "#021a02"
              },
              {
                type: "permintaan_rpa",
                icon: "/assets/icons/models/role_rpa.png",
                title: "Cari Ayam",
                desc: "Saya RPA/buyer — ingin cari ayam dari broker atau peternak",
                color: "#FBBF24"
              }
            ].map((opt) => /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => handleSelectType(opt.type),
                className: "w-full flex items-start gap-4 p-4 rounded-2xl border text-left transition-all hover:border-opacity-60",
                style: { borderColor: "rgba(255,255,255,0.08)", background: "#111C24" },
                onMouseEnter: (e) => {
                  e.currentTarget.style.borderColor = opt.color + "50";
                },
                onMouseLeave: (e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                },
                children: [
                  /* @__PURE__ */ jsx("img", { src: opt.icon, alt: "", className: "w-8 h-8 object-contain" }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-[#F1F5F9]", children: opt.title }),
                    /* @__PURE__ */ jsx("p", { className: "text-xs text-[#4B6478] mt-0.5 leading-relaxed", children: opt.desc })
                  ] })
                ]
              },
              opt.type
            ))
          ] }),
          step === 2 && /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "flex-1 overflow-y-auto px-6 py-5 space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "bg-[#111C24] rounded-xl px-4 py-3 border border-white/5", children: [
              /* @__PURE__ */ jsx("p", { className: "text-[10px] text-[#4B6478] uppercase tracking-widest mb-1", children: "Preview Judul" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-[#94A3B8] italic", children: form.title || buildAutoTitle() || "Isi form untuk generate judul..." })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "ml-title", className: "block text-xs font-semibold text-[#4B6478] mb-1.5 uppercase tracking-wider", children: "Judul Kustom (opsional)" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "ml-title",
                  name: "title",
                  type: "text",
                  value: form.title,
                  onChange: (e) => set("title", e.target.value),
                  placeholder: "Biarkan kosong untuk auto-generate",
                  className: "w-full bg-[#111C24] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#F1F5F9] placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-colors"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "ml-chicken", className: "block text-xs font-semibold text-[#4B6478] mb-1.5 uppercase tracking-wider", children: "Pilih Komoditas *" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  id: "ml-chicken",
                  name: "chicken_type",
                  value: form.chicken_type,
                  onChange: (e) => set("chicken_type", e.target.value),
                  className: "w-full bg-[#111C24] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#F1F5F9] focus:outline-none focus:border-emerald-500/50",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: "Pilih..." }),
                    COMMODITY_GROUPS.map((g) => /* @__PURE__ */ jsx("optgroup", { label: g.label, children: g.options.map((c) => /* @__PURE__ */ jsx("option", { value: c.value, children: c.label }, c.value)) }, g.label))
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("label", { htmlFor: "ml-weight", className: "block text-xs font-semibold text-[#4B6478] mb-1.5 uppercase tracking-wider", children: [
                  form.listing_type === "permintaan_rpa" ? "Target Kuantitas" : "Total Kuantitas",
                  " (Kg/Top)"
                ] }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    id: "ml-weight",
                    name: "weight_kg",
                    type: "number",
                    min: "0",
                    step: "0.01",
                    value: form.weight_kg,
                    onChange: (e) => set("weight_kg", e.target.value),
                    placeholder: "Contoh: 50.5",
                    className: "w-full bg-[#111C24] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#F1F5F9] placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("label", { htmlFor: "ml-qty", className: "block text-xs font-semibold text-[#4B6478] mb-1.5 uppercase tracking-wider", children: [
                  "Stok Item",
                  /* @__PURE__ */ jsx("span", { className: "text-[10px] lowercase normal-case ml-1", children: "(Ekor/Karton)" })
                ] }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    id: "ml-qty",
                    name: "quantity_ekor",
                    type: "number",
                    min: "0",
                    value: form.quantity_ekor,
                    onChange: (e) => set("quantity_ekor", e.target.value),
                    placeholder: "Contoh: 100",
                    className: "w-full bg-[#111C24] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#F1F5F9] placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "ml-price", className: "block text-xs font-semibold text-[#4B6478] mb-1.5 uppercase tracking-wider", children: form.listing_type === "permintaan_rpa" ? "Budget Harga per Satuan (Rp)" : "Harga per Satuan (Rp)" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "ml-price",
                  name: "price_per_kg",
                  type: "number",
                  min: "0",
                  value: form.price_per_kg,
                  onChange: (e) => set("price_per_kg", e.target.value),
                  placeholder: "Contoh: 22000",
                  className: "w-full bg-[#111C24] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#F1F5F9] placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-colors"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "ml-loc", className: "block text-xs font-semibold text-[#4B6478] mb-1.5 uppercase tracking-wider", children: form.listing_type === "permintaan_rpa" ? "Lokasi Pengiriman" : "Lokasi Kandang" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "ml-loc",
                  name: "location",
                  type: "text",
                  value: form.location,
                  onChange: (e) => set("location", e.target.value),
                  placeholder: "Contoh: Boyolali, Jawa Tengah",
                  className: "w-full bg-[#111C24] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#F1F5F9] placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-colors"
                }
              )
            ] }),
            form.listing_type === "penawaran_broker" && /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "ml-terms", className: "block text-xs font-semibold text-[#4B6478] mb-1.5 uppercase tracking-wider", children: "Syarat Pembayaran" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  id: "ml-terms",
                  name: "payment_terms",
                  value: form.payment_terms,
                  onChange: (e) => set("payment_terms", e.target.value),
                  className: "w-full bg-[#111C24] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#F1F5F9] focus:outline-none focus:border-emerald-500/50",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: "Pilih syarat..." }),
                    PAYMENT_TERMS.map((t) => /* @__PURE__ */ jsx("option", { value: t.value, children: t.label }, t.value))
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "ml-desc", className: "block text-xs font-semibold text-[#4B6478] mb-1.5 uppercase tracking-wider", children: "Deskripsi / Catatan" }),
              /* @__PURE__ */ jsx(
                "textarea",
                {
                  id: "ml-desc",
                  name: "description",
                  value: form.description,
                  onChange: (e) => set("description", e.target.value),
                  rows: 3,
                  placeholder: "Info tambahan, kualitas, syarat, dll...",
                  className: "w-full bg-[#111C24] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#F1F5F9] placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-3 border border-white/8 rounded-xl p-4", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-black uppercase tracking-widest text-[#4B6478]", children: "Kontak" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { htmlFor: "ml-contact-name", className: "block text-xs text-[#4B6478] mb-1", children: "Nama *" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    id: "ml-contact-name",
                    name: "contact_name",
                    type: "text",
                    value: form.contact_name,
                    onChange: (e) => set("contact_name", e.target.value),
                    placeholder: "Nama Anda",
                    className: "w-full bg-[#111C24] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#F1F5F9] placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { htmlFor: "ml-wa", className: "block text-xs text-[#4B6478] mb-1", children: "No. WhatsApp *" }),
                /* @__PURE__ */ jsx(
                  PhoneInput,
                  {
                    id: "ml-wa",
                    name: "contact_wa",
                    value: form.contact_wa,
                    onChange: (e) => set("contact_wa", e.target.value),
                    placeholder: "cth. 0812...",
                    className: "w-full bg-[#111C24] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#F1F5F9] placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "ml-expires", className: "block text-xs font-semibold text-[#4B6478] mb-1.5 uppercase tracking-wider", children: "Berlaku Hingga" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "ml-expires",
                  name: "expires_at",
                  type: "date",
                  value: form.expires_at,
                  onChange: (e) => set("expires_at", e.target.value),
                  className: "w-full bg-[#111C24] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#F1F5F9] focus:outline-none focus:border-emerald-500/50 transition-colors"
                }
              )
            ] })
          ] }),
          step === 2 && /* @__PURE__ */ jsxs("div", { className: "px-6 py-4 border-t border-white/8 flex gap-3", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setStep(1),
                className: "flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-[#94A3B8] hover:bg-white/5 transition-colors",
                children: "Kembali"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: handleSubmit,
                disabled: create.isPending,
                className: "flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-sm font-bold text-white transition-colors disabled:opacity-50",
                children: create.isPending ? "Mempublikasikan..." : "Publikasikan"
              }
            )
          ] })
        ]
      }
    )
  ] }) });
}
function Market() {
  const { profile } = useAuth();
  const [typeFilter, setTypeFilter] = useState("all");
  const [chickenFilter, setChickenFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [myListingsOpen, setMyListingsOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const filters = useMemo(() => ({
    type: typeFilter !== "all" ? typeFilter : void 0,
    chicken_type: chickenFilter !== "all" ? chickenFilter : void 0,
    search: search.trim() || void 0,
    location: locationQuery.trim() || void 0
  }), [typeFilter, chickenFilter, search, locationQuery]);
  const { data: listings = [], isLoading } = useMarketListings(filters);
  const { data: myListings = [] } = useMyListings();
  const { data: connections = [] } = useMyConnections();
  const closeListing = useCloseListing();
  const deleteListing = useDeleteListing();
  const { tenant } = useAuth();
  const totalActive = listings.length;
  const stokAyam = listings.filter((l) => l.listing_type === "stok_ayam").length;
  const permintaan = listings.filter((l) => l.listing_type === "permintaan_rpa").length;
  const pendingIncoming = connections.filter(
    (c) => c.target_tenant_id === (tenant == null ? void 0 : tenant.id) && c.status === "pending"
  ).length;
  return /* @__PURE__ */ jsxs("div", { className: "p-4 md:p-6 pt-16 md:pt-8 space-y-5 max-w-6xl mx-auto pb-24", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
          /* @__PURE__ */ jsx(Store, { size: 20, className: "text-emerald-400 shrink-0" }),
          /* @__PURE__ */ jsx("h1", { className: "font-display font-black text-xl text-[#F1F5F9]", children: "TernakOS Market" }),
          pendingIncoming > 0 && /* @__PURE__ */ jsx("span", { className: "w-5 h-5 rounded-full bg-red-500 shrink-0\r\n\r\n                text-white text-[10px] font-black flex items-center justify-center", children: pendingIncoming })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-[#4B6478] leading-relaxed max-w-sm", children: "Temukan stok ayam, penawaran broker, dan permintaan buyer dalam satu platform." })
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setSheetOpen(true),
          className: "flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shadow-[0_4px_20px_rgba(2, 26, 2,0.25)] shrink-0",
          children: [
            /* @__PURE__ */ jsx(Plus, { size: 15 }),
            "Pasang Iklan"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex items-center gap-8 py-3 px-5 bg-[#111C24] rounded-2xl border border-white/8 overflow-x-auto", children: [
      { label: "Listing Aktif", value: totalActive, color: "#F1F5F9" },
      { label: "Stok Tersedia", value: stokAyam, color: "#A78BFA" },
      { label: "Dicari", value: permintaan, color: "#FBBF24" }
    ].map((s, i) => /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center shrink-0", children: [
      /* @__PURE__ */ jsx("span", { className: "font-display font-black text-2xl", style: { color: s.color }, children: s.value }),
      /* @__PURE__ */ jsx("span", { className: "text-[10px] text-[#4B6478] font-semibold whitespace-nowrap", children: s.label })
    ] }, i)) }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(Search, { size: 14, className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4B6478] pointer-events-none" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            id: "market-search",
            name: "search",
            type: "text",
            value: search,
            onChange: (e) => setSearch(e.target.value),
            placeholder: "Cari stok, penawaran, permintaan...",
            className: "w-full h-11 bg-[#111C24] border border-white/10 rounded-xl pl-9 pr-9 text-sm text-[#F1F5F9] placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-colors"
          }
        ),
        search && /* @__PURE__ */ jsx("button", { onClick: () => setSearch(""), className: "absolute right-3.5 top-1/2 -translate-y-1/2", children: /* @__PURE__ */ jsx(X, { size: 13, className: "text-[#4B6478]" }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden", children: LISTING_TYPES.map((t) => /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setTypeFilter(t.value),
          className: "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
          style: typeFilter === t.value ? { background: "#021a02", color: "#fff", border: "1px solid #021a02" } : { background: "rgba(255,255,255,0.04)", color: "#94A3B8", border: "1px solid rgba(255,255,255,0.08)" },
          children: [
            /* @__PURE__ */ jsx("img", { src: t.icon, alt: "", className: "w-4 h-4 object-contain" }),
            t.label
          ]
        },
        t.value
      )) }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsxs(
            "select",
            {
              id: "market-chicken",
              name: "chicken_filter",
              value: chickenFilter,
              onChange: (e) => setChickenFilter(e.target.value),
              className: "appearance-none bg-[#111C24] border border-white/10 rounded-xl pl-3 pr-7 py-2 text-xs text-[#F1F5F9] focus:outline-none focus:border-emerald-500/50 transition-colors",
              children: [
                /* @__PURE__ */ jsx("option", { value: "all", children: "Semua Komoditas" }),
                COMMODITY_GROUPS.map((g) => /* @__PURE__ */ jsx("optgroup", { label: g.label, children: g.options.map((c) => /* @__PURE__ */ jsx("option", { value: c.value, children: c.label }, c.value)) }, g.label))
              ]
            }
          ),
          /* @__PURE__ */ jsx(ChevronDown, { size: 12, className: "absolute right-2 top-1/2 -translate-y-1/2 text-[#4B6478] pointer-events-none" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
          /* @__PURE__ */ jsx(MapPin, { size: 12, className: "absolute left-3 top-1/2 -translate-y-1/2 text-[#4B6478] pointer-events-none" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "market-location",
              name: "location_filter",
              type: "text",
              value: locationQuery,
              onChange: (e) => setLocationQuery(e.target.value),
              placeholder: "Filter lokasi...",
              className: "w-full bg-[#111C24] border border-white/10 rounded-xl pl-7 pr-3 py-2 text-xs text-[#F1F5F9] placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-colors"
            }
          )
        ] })
      ] })
    ] }),
    isLoading ? /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center py-20", children: /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" }) }) : listings.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-20 text-center", children: [
      /* @__PURE__ */ jsx(Store, { size: 36, className: "text-[#4B6478] mb-3" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-[#4B6478]", children: "Belum ada listing" }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-[#4B6478]/70 mt-1", children: search || typeFilter !== "all" ? "Coba ubah filter pencarian" : "Jadilah yang pertama pasang iklan!" })
    ] }) : /* @__PURE__ */ jsx(motion.div, { layout: true, className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: /* @__PURE__ */ jsx(AnimatePresence, { mode: "popLayout", children: listings.map((l) => /* @__PURE__ */ jsx(ListingCard, { listing: l }, l.id)) }) }),
    /* @__PURE__ */ jsxs("div", { className: "border border-white/8 rounded-2xl overflow-hidden", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setMyListingsOpen((p) => !p),
          className: "w-full flex items-center justify-between px-5 py-4 bg-[#111C24] hover:bg-[#162230] transition-colors",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Package, { size: 15, className: "text-emerald-400" }),
              /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-[#F1F5F9]", children: "Listing Saya" }),
              /* @__PURE__ */ jsx("span", { className: "text-xs text-[#4B6478] bg-white/5 px-2 py-0.5 rounded-full", children: myListings.length })
            ] }),
            myListingsOpen ? /* @__PURE__ */ jsx(ChevronUp, { size: 16, className: "text-[#4B6478]" }) : /* @__PURE__ */ jsx(ChevronDown, { size: 16, className: "text-[#4B6478]" })
          ]
        }
      ),
      /* @__PURE__ */ jsx(AnimatePresence, { children: myListingsOpen && /* @__PURE__ */ jsx(
        motion.div,
        {
          initial: { height: 0, opacity: 0 },
          animate: { height: "auto", opacity: 1 },
          exit: { height: 0, opacity: 0 },
          transition: { duration: 0.2 },
          className: "overflow-hidden",
          children: /* @__PURE__ */ jsx("div", { className: "px-5 bg-[#0C1319]", children: myListings.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center py-10 text-center", children: [
            /* @__PURE__ */ jsx(AlertCircle, { size: 24, className: "text-[#4B6478] mb-2" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-[#4B6478]", children: "Belum ada listing." }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setSheetOpen(true),
                className: "mt-3 text-xs text-emerald-400 hover:text-emerald-300 underline",
                children: "Pasang iklan sekarang!"
              }
            )
          ] }) : myListings.map((l) => /* @__PURE__ */ jsx(
            MyListingRow,
            {
              listing: l,
              onClose: (id2) => closeListing.mutate(id2),
              onDelete: (id2) => deleteListing.mutate(id2)
            },
            l.id
          )) })
        }
      ) })
    ] }),
    /* @__PURE__ */ jsx(
      SheetPasangIklan,
      {
        isOpen: sheetOpen,
        onClose: () => setSheetOpen(false),
        profile
      }
    )
  ] });
}
export {
  Market as default
};
