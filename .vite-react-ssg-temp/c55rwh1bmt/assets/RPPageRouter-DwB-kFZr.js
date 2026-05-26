import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link, useParams } from "react-router-dom";
import { u as useAuth, aY as usePageTitle, r as resolveBusinessVertical, d as BUSINESS_MODELS, a7 as Button, aa as NotificationBell, s as supabase, p as logSupabaseError, K as logError, aq as formatIDR, aB as formatDate, c as useMediaQuery, F as Sheet, G as SheetContent, H as SheetHeader, I as SheetTitle, g as getSubscriptionStatus, aI as usePlanConfigs, a2 as Select, a3 as SelectTrigger, a4 as SelectValue, a5 as SelectContent, a6 as SelectItem } from "../main.mjs";
import { T as TutorialOverlay, I as InvoicePreviewModal, A as AkunPage, M as ManajemenPage, h as RPA_TIM_CONFIG, W as WelcomeOnlyOverlay } from "./WelcomeOnlyOverlay-Ch0ZSpcb.js";
import { Menu, ArrowLeft, Search, User, Sparkles, ClipboardList, Truck, BarChart2, Plus, CreditCard, TrendingUp, ShoppingCart, DollarSign, ChevronRight, Ban, XCircle, CheckCircle2, Clock, ArrowUpRight, Wallet, Landmark, Lock, FileText, Store, Download, Package, AlertTriangle, Phone, Pencil, Star, X, MapPin, BarChart3, TrendingDown, ChevronUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { D as DatePicker } from "./DatePicker-BO7By-H9.js";
import { I as InputRupiah } from "./InputRupiah-Cjv6-Pgv.js";
import { format, isAfter, addDays, parseISO, startOfMonth, differenceInDays } from "date-fns";
import { id } from "date-fns/locale";
import { P as PhoneInput } from "./PhoneInput-BYk7A6X-.js";
import { F as FALLBACK_TRANSACTION_QUOTA } from "./planGating-BwKbTRBv.js";
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Line } from "recharts";
import "vite-react-ssg";
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
import "@radix-ui/react-dialog";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-scroll-area";
import "react-dom";
import "@radix-ui/react-popover";
import "cmdk";
import "@radix-ui/react-tabs";
import "@radix-ui/react-collapsible";
import "@radix-ui/react-select";
import "@react-pdf/renderer";
import "./alert-dialog-DzaJnNEE.js";
import "@radix-ui/react-alert-dialog";
import "react-day-picker";
function TopBar({ title, subtitle, showBack = false, rightAction, showBell = true, onMenuClick }) {
  var _a;
  const navigate = useNavigate();
  const { profile, tenant } = useAuth();
  const pageTitle = usePageTitle();
  const vertical = resolveBusinessVertical(profile, tenant);
  const model = BUSINESS_MODELS[vertical];
  const color = (model == null ? void 0 : model.color) || "#021a02";
  const displayTitle = title || pageTitle;
  const isBeranda = displayTitle === "Beranda";
  const greeting = `Halo, ${((_a = profile == null ? void 0 : profile.full_name) == null ? void 0 : _a.split(" ")[0]) ?? "Peternak"} 👋`;
  return /* @__PURE__ */ jsxs(
    motion.header,
    {
      initial: { y: -20, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      transition: { duration: 0.2 },
      className: "hidden md:flex px-5 lg:px-6 pt-10 lg:pt-4 pb-4 lg:pb-5 items-center justify-between sticky top-0 bg-[#06090F]/80 backdrop-blur-md z-50 border-b border-white/5 min-h-[60px] lg:min-h-[64px]",
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 flex-1 min-w-0", children: [
          !showBack && onMenuClick && /* @__PURE__ */ jsx(
            Button,
            {
              variant: "ghost",
              size: "icon",
              onClick: onMenuClick,
              className: "w-10 h-10 lg:hidden rounded-xl bg-white/5 border border-white/10 active:scale-95 transition-transform",
              children: /* @__PURE__ */ jsx(Menu, { size: 20, className: "text-[#94A3B8]" })
            }
          ),
          showBack && /* @__PURE__ */ jsx(
            Button,
            {
              variant: "ghost",
              size: "icon",
              onClick: () => navigate(-1),
              style: { borderColor: `${color}33`, color },
              className: "w-10 h-10 lg:w-9 lg:h-9 rounded-xl lg:rounded-lg bg-white/5 border active:scale-95 transition-transform",
              children: /* @__PURE__ */ jsx(ArrowLeft, { size: 20, className: "lg:w-4 lg:h-4" })
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "text-left flex-1 min-w-0", children: [
            /* @__PURE__ */ jsx("h1", { className: "font-display text-lg lg:text-xl font-black text-white tracking-tight uppercase leading-none truncate", children: isBeranda ? greeting : displayTitle }),
            subtitle && /* @__PURE__ */ jsx("p", { className: "text-[10px] lg:text-xs font-bold text-[#4B6478] uppercase mt-1 lg:mt-1.5 tracking-widest truncate", children: subtitle })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          rightAction,
          showBell && /* @__PURE__ */ jsx(NotificationBell, {}),
          !rightAction && !showBell && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 lg:gap-3", children: [
            /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "w-10 h-10 lg:w-9 lg:h-9 rounded-xl lg:rounded-lg bg-white/5 border border-white/10 text-[#4B6478]", children: /* @__PURE__ */ jsx(Search, { size: 18, className: "lg:w-4 lg:h-4" }) }),
            /* @__PURE__ */ jsx(
              "div",
              {
                style: { background: `${color}11`, borderColor: `${color}22` },
                className: "w-10 h-10 lg:w-9 lg:h-9 rounded-xl lg:rounded-lg border flex items-center justify-center",
                children: /* @__PURE__ */ jsx(User, { size: 18, style: { color }, className: "lg:w-4 lg:h-4" })
              }
            )
          ] })
        ] })
      ]
    }
  );
}
const RPA_STEPS = [
  {
    id: "welcome",
    icon: Sparkles,
    title: "Selamat datang di TernakOS!",
    desc: "Platform manajemen Rumah Potong Ayam — kelola order pemotongan, distribusi, dan pantau margin bisnis Anda.",
    bullets: [
      "Order pemotongan tercatat & terlacak",
      "Distribusi ke pelanggan terpantau",
      "Laporan margin & piutang otomatis"
    ]
  },
  {
    id: "order",
    icon: ClipboardList,
    title: "Buat Order Pemotongan",
    desc: "Catat setiap order masuk dari broker atau pelanggan langsung. Jumlah ekor, harga, dan jadwal potong tersimpan per order.",
    navHint: "Order",
    selector: '[data-tutorial="rpa-order"]'
  },
  {
    id: "distribusi",
    icon: Truck,
    title: "Kelola Distribusi",
    desc: "Buat jadwal pengiriman hasil potong ke pelanggan. Status pengiriman, berat aktual, dan pembayaran terpantau secara real-time.",
    navHint: "Distribusi",
    selector: '[data-tutorial="rpa-distribusi"]'
  },
  {
    id: "laporan",
    icon: BarChart2,
    title: "Pantau Laporan Margin",
    desc: "Lihat margin per order, piutang outstanding, dan tren omset. Laporan bisa diekspor untuk pembukuan atau diskusi dengan investor.",
    navHint: "Laporan",
    selector: '[data-tutorial="rpa-laporan"]'
  }
];
const ACCENT = "#F97316";
const ACCENT_DIM = "rgba(249,115,22,0.12)";
function RPATutorial() {
  const { tenant } = useAuth();
  return /* @__PURE__ */ jsx(
    TutorialOverlay,
    {
      steps: RPA_STEPS,
      storageKey: `rpa_tutorial_${tenant == null ? void 0 : tenant.id}`,
      accent: ACCENT,
      accentDim: ACCENT_DIM
    }
  );
}
const useRPAPurchaseOrders = () => {
  const { tenant } = useAuth();
  return useQuery({
    queryKey: ["rpa-purchase-orders", tenant == null ? void 0 : tenant.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("rpa_purchase_orders").select("*, tenants!broker_tenant_id(business_name)").eq("rpa_tenant_id", tenant.id).eq("is_deleted", false).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!(tenant == null ? void 0 : tenant.id)
  });
};
const useCreatePurchaseOrder = () => {
  const queryClient = useQueryClient();
  const { tenant } = useAuth();
  return useMutation({
    mutationFn: async ({
      chicken_type,
      requested_count,
      requested_weight_kg,
      target_price_per_kg,
      requested_date,
      notes
    }) => {
      const { error } = await supabase.from("rpa_purchase_orders").insert({
        rpa_tenant_id: tenant.id,
        chicken_type,
        requested_count,
        requested_weight_kg,
        target_price_per_kg,
        requested_date,
        notes,
        status: "open"
      });
      if (error) {
        logSupabaseError(error, {
          table: "rpa_purchase_orders",
          operation: "insert",
          component: "useCreatePurchaseOrder",
          actionName: "rpa.purchase_order.create"
        });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rpa-purchase-orders", tenant == null ? void 0 : tenant.id] });
      queryClient.invalidateQueries({ queryKey: ["rpa-dashboard-stats", tenant == null ? void 0 : tenant.id] });
      toast.success("Order berhasil dikirim ke broker");
    },
    onError: (err) => toast.error("Gagal kirim order: " + err.message)
  });
};
const useRPACustomers = () => {
  const { tenant } = useAuth();
  return useQuery({
    queryKey: ["rpa-customers", tenant == null ? void 0 : tenant.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("rpa_customers").select("*").eq("tenant_id", tenant.id).eq("is_deleted", false).order("customer_name");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!(tenant == null ? void 0 : tenant.id)
  });
};
const useRPAProducts = () => {
  const { tenant } = useAuth();
  return useQuery({
    queryKey: ["rpa-products", tenant == null ? void 0 : tenant.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("rpa_products").select("*").eq("tenant_id", tenant.id).eq("is_deleted", false).eq("is_active", true).order("product_name");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!(tenant == null ? void 0 : tenant.id)
  });
};
const useRPAInvoices = () => {
  const { tenant } = useAuth();
  return useQuery({
    queryKey: ["rpa-invoices", tenant == null ? void 0 : tenant.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("rpa_invoices").select("*, rpa_customers(customer_name, customer_type, phone), rpa_invoice_items(*)").eq("tenant_id", tenant.id).eq("is_deleted", false).order("transaction_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!(tenant == null ? void 0 : tenant.id)
  });
};
const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  const { tenant } = useAuth();
  return useMutation({
    mutationFn: async (payload) => {
      const { error } = await supabase.from("rpa_customers").insert({ ...payload, tenant_id: tenant.id });
      if (error) {
        logSupabaseError(error, {
          table: "rpa_customers",
          operation: "insert",
          component: "useCreateCustomer",
          actionName: "rpa.customer.create"
        });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rpa-customers", tenant == null ? void 0 : tenant.id] });
      toast.success("Toko berhasil ditambahkan");
    },
    onError: (err) => toast.error("Gagal tambah toko: " + err.message)
  });
};
const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  const { tenant } = useAuth();
  return useMutation({
    mutationFn: async ({ id: id2, updates }) => {
      const { error } = await supabase.from("rpa_customers").update(updates).eq("id", id2);
      if (error) {
        logSupabaseError(error, {
          table: "rpa_customers",
          operation: "update",
          component: "useUpdateCustomer",
          actionName: "rpa.customer.update"
        });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rpa-customers", tenant == null ? void 0 : tenant.id] });
      toast.success("Data toko diperbarui");
    },
    onError: (err) => toast.error("Gagal update toko: " + err.message)
  });
};
const useCreateProduct = () => {
  const queryClient = useQueryClient();
  const { tenant } = useAuth();
  return useMutation({
    mutationFn: async (payload) => {
      const { error } = await supabase.from("rpa_products").insert({ ...payload, tenant_id: tenant.id, is_active: true });
      if (error) {
        logSupabaseError(error, {
          table: "rpa_products",
          operation: "insert",
          component: "useCreateProduct",
          actionName: "rpa.product.create"
        });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rpa-products", tenant == null ? void 0 : tenant.id] });
      toast.success("Produk berhasil ditambahkan");
    },
    onError: (err) => toast.error("Gagal tambah produk: " + err.message)
  });
};
const useCreateInvoice = () => {
  const queryClient = useQueryClient();
  const { tenant } = useAuth();
  return useMutation({
    mutationFn: async ({ customer_id, customer_name, transaction_date, due_date, items, notes }) => {
      const dateStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10).replace(/-/g, "");
      const rand = Array.from(crypto.getRandomValues(new Uint8Array(3))).map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase().slice(0, 4);
      const invoice_number = `RPA-${dateStr}-${rand}`;
      const total_amount = items.reduce((s, item) => s + Math.round((item.quantity_kg || 0) * (item.price_per_kg || 0)), 0);
      const total_cost = items.reduce((s, item) => s + Math.round((item.quantity_kg || 0) * (item.cost_per_kg || 0)), 0);
      const { data: invoice, error: invErr } = await supabase.from("rpa_invoices").insert({
        tenant_id: tenant.id,
        customer_id,
        customer_name,
        invoice_number,
        transaction_date,
        due_date: due_date || null,
        total_amount,
        total_cost,
        payment_status: "belum_lunas",
        paid_amount: 0,
        notes: notes || null
      }).select().single();
      if (invErr) {
        logSupabaseError(invErr, {
          table: "rpa_invoices",
          operation: "insert",
          component: "useCreateInvoice",
          actionName: "rpa.invoice.create"
        });
        throw invErr;
      }
      const itemRows = items.map((item) => ({
        invoice_id: invoice.id,
        product_id: item.product_id || null,
        product_name: item.product_name,
        quantity_kg: item.quantity_kg,
        price_per_kg: item.price_per_kg,
        cost_per_kg: item.cost_per_kg || 0
      }));
      const { error: itemErr } = await supabase.from("rpa_invoice_items").insert(itemRows);
      if (itemErr) {
        logError({
          source: "supabase",
          component: "useCreateInvoice",
          actionName: "rpa.invoice.create_items",
          error: itemErr,
          metadata: { partial: true, table: "rpa_invoice_items", operation: "insert", invoice_id: invoice.id, invoice_number }
        });
        throw itemErr;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rpa-invoices", tenant == null ? void 0 : tenant.id] });
      queryClient.invalidateQueries({ queryKey: ["rpa-dashboard-stats", tenant == null ? void 0 : tenant.id] });
      toast.success("Invoice berhasil dibuat");
    },
    onError: (err) => {
      var _a;
      if ((_a = err.message) == null ? void 0 : _a.startsWith("QUOTA_EXCEEDED")) {
        const [, , , limit, used] = err.message.split("|");
        toast.error("Kuota invoice habis", {
          description: `Plan Starter dibatasi ${limit} invoice/bulan (${used} terpakai). Upgrade ke Pro untuk unlimited.`
        });
      } else {
        toast.error("Gagal buat invoice: " + err.message);
      }
    }
  });
};
const useRecordCustomerPayment = () => {
  const queryClient = useQueryClient();
  const { tenant } = useAuth();
  return useMutation({
    mutationFn: async ({ invoice_id, customer_id, amount, payment_date, payment_method, reference_no, notes }) => {
      const { error: payErr } = await supabase.from("rpa_customer_payments").insert({
        tenant_id: tenant.id,
        invoice_id,
        customer_id,
        amount,
        payment_date,
        payment_method,
        reference_no: reference_no || null,
        notes: notes || null
      });
      if (payErr) {
        logSupabaseError(payErr, {
          table: "rpa_customer_payments",
          operation: "insert",
          component: "useRecordCustomerPayment",
          actionName: "rpa.customer_payment.create"
        });
        throw payErr;
      }
      const { data: invoice, error: fetchErr } = await supabase.from("rpa_invoices").select("total_amount, paid_amount").eq("id", invoice_id).single();
      if (fetchErr) {
        logError({
          source: "supabase",
          component: "useRecordCustomerPayment",
          actionName: "rpa.customer_payment.sync_invoice_fetch",
          error: fetchErr,
          metadata: { partial: true, table: "rpa_invoices", operation: "select", invoice_id }
        });
        throw fetchErr;
      }
      const newPaid = (invoice.paid_amount || 0) + amount;
      const newStatus = newPaid >= invoice.total_amount ? "lunas" : newPaid > 0 ? "sebagian" : "belum_lunas";
      const { error: invErr } = await supabase.from("rpa_invoices").update({ paid_amount: newPaid, payment_status: newStatus }).eq("id", invoice_id);
      if (invErr) {
        logError({
          source: "supabase",
          component: "useRecordCustomerPayment",
          actionName: "rpa.customer_payment.sync_invoice_status",
          error: invErr,
          metadata: { partial: true, table: "rpa_invoices", operation: "update", invoice_id, newPaid, newStatus }
        });
        throw invErr;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rpa-invoices", tenant == null ? void 0 : tenant.id] });
      queryClient.invalidateQueries({ queryKey: ["rpa-customers", tenant == null ? void 0 : tenant.id] });
      queryClient.invalidateQueries({ queryKey: ["rpa-dashboard-stats", tenant == null ? void 0 : tenant.id] });
      toast.success("Pembayaran berhasil dicatat");
    },
    onError: (err) => toast.error("Gagal catat pembayaran: " + err.message)
  });
};
const useUpdatePurchaseOrder = () => {
  const queryClient = useQueryClient();
  const { tenant } = useAuth();
  return useMutation({
    mutationFn: async ({ orderId, updates }) => {
      const { error } = await supabase.from("rpa_purchase_orders").update(updates).eq("id", orderId);
      if (error) {
        logSupabaseError(error, {
          table: "rpa_purchase_orders",
          operation: "update",
          component: "useUpdatePurchaseOrder",
          actionName: "rpa.purchase_order.update"
        });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rpa-purchase-orders", tenant == null ? void 0 : tenant.id] });
      toast.success("Order diperbarui");
    },
    onError: (err) => toast.error("Gagal update order: " + err.message)
  });
};
const useRPAPaymentsToSend = () => {
  const { tenant } = useAuth();
  return useQuery({
    queryKey: ["rpa-payments-to-broker", tenant == null ? void 0 : tenant.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("rpa_payments").select("*, tenants!broker_tenant_id(business_name)").eq("rpa_tenant_id", tenant.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!(tenant == null ? void 0 : tenant.id)
  });
};
const useCreateRPAPayment = () => {
  const queryClient = useQueryClient();
  const { tenant } = useAuth();
  return useMutation({
    mutationFn: async ({ broker_tenant_id, amount, payment_method, reference_no, notes }) => {
      const { error } = await supabase.from("rpa_payments").insert({
        rpa_tenant_id: tenant.id,
        broker_tenant_id,
        amount,
        payment_method,
        reference_no,
        notes
      });
      if (error) {
        logSupabaseError(error, {
          table: "rpa_payments",
          operation: "insert",
          component: "useCreateRPAPayment",
          actionName: "rpa.hutang_payment.create"
        });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rpa-payments-to-broker", tenant == null ? void 0 : tenant.id] });
      queryClient.invalidateQueries({ queryKey: ["rpa-dashboard-stats", tenant == null ? void 0 : tenant.id] });
      toast.success("Pembayaran berhasil dicatat");
    },
    onError: (err) => toast.error("Gagal catat pembayaran: " + err.message)
  });
};
const useRPAMarginReport = (startDate, endDate) => {
  const { tenant } = useAuth();
  return useQuery({
    queryKey: ["rpa-margin-report", tenant == null ? void 0 : tenant.id, startDate, endDate],
    enabled: !!(tenant == null ? void 0 : tenant.id) && !!startDate && !!endDate,
    queryFn: async () => {
      const { data: invoices, error } = await supabase.from("rpa_invoices").select("*, rpa_invoice_items(*), rpa_customers(customer_name, customer_type)").eq("tenant_id", tenant.id).eq("is_deleted", false).gte("transaction_date", startDate).lte("transaction_date", endDate);
      if (error) throw error;
      const { data: purchaseOrders } = await supabase.from("rpa_purchase_orders").select("id, status, created_at, requested_weight_kg, target_price_per_kg").eq("rpa_tenant_id", tenant.id).gte("created_at", startDate + "T00:00:00").lte("created_at", endDate + "T23:59:59");
      const inv = invoices ?? [];
      const totalRevenue = inv.reduce((s, i) => s + (i.total_amount || 0), 0);
      const totalCost = inv.reduce((s, i) => s + (i.total_cost || 0), 0);
      const totalProfit = inv.reduce((s, i) => s + (i.net_profit || 0), 0);
      const marginPct = totalRevenue > 0 ? (totalProfit / totalRevenue * 100).toFixed(1) : 0;
      const byProduct = {};
      inv.forEach((invoice) => {
        (invoice.rpa_invoice_items || []).forEach((item) => {
          if (!byProduct[item.product_name]) {
            byProduct[item.product_name] = { revenue: 0, cost: 0, qty: 0 };
          }
          byProduct[item.product_name].revenue += item.subtotal || 0;
          byProduct[item.product_name].cost += Math.round((item.quantity_kg || 0) * (item.cost_per_kg || 0));
          byProduct[item.product_name].qty += item.quantity_kg || 0;
        });
      });
      const byCustomer = {};
      inv.forEach((invoice) => {
        const key = invoice.customer_name;
        if (!byCustomer[key]) byCustomer[key] = { revenue: 0, profit: 0, invoiceCount: 0 };
        byCustomer[key].revenue += invoice.total_amount || 0;
        byCustomer[key].profit += invoice.net_profit || 0;
        byCustomer[key].invoiceCount++;
      });
      return {
        invoices: inv,
        totalRevenue,
        totalCost,
        totalProfit,
        marginPct,
        byProduct,
        byCustomer,
        purchaseOrders: purchaseOrders ?? []
      };
    }
  });
};
const useRPADashboardStats = () => {
  const { tenant } = useAuth();
  return useQuery({
    queryKey: ["rpa-dashboard-stats", tenant == null ? void 0 : tenant.id],
    queryFn: async () => {
      const [ordersRes, invoicesRes] = await Promise.all([
        supabase.from("rpa_purchase_orders").select("id, status, created_at").eq("rpa_tenant_id", tenant.id).eq("is_deleted", false),
        supabase.from("rpa_invoices").select("id, total_amount, paid_amount, remaining_amount, payment_status, transaction_date, due_date, net_profit").eq("tenant_id", tenant.id).eq("is_deleted", false),
        supabase.from("rpa_customer_payments").select("amount, payment_date").eq("tenant_id", tenant.id).order("payment_date", { ascending: false })
      ]);
      if (ordersRes.error) throw ordersRes.error;
      if (invoicesRes.error) throw invoicesRes.error;
      const orders = ordersRes.data ?? [];
      const invoices = invoicesRes.data ?? [];
      const now = /* @__PURE__ */ new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3);
      return {
        orders: {
          total: orders.length,
          open: orders.filter((o) => o.status === "open").length,
          confirmed: orders.filter((o) => o.status === "confirmed").length,
          thisMonth: orders.filter((o) => new Date(o.created_at) > thirtyDaysAgo).length
        },
        sales: {
          totalRevenue: invoices.reduce((s, i) => s + (i.total_amount || 0), 0),
          totalProfit: invoices.reduce((s, i) => s + (i.net_profit || 0), 0),
          revenueThisMonth: invoices.filter((i) => new Date(i.transaction_date) > thirtyDaysAgo).reduce((s, i) => s + (i.total_amount || 0), 0),
          invoicesThisMonth: invoices.filter((i) => new Date(i.transaction_date) > thirtyDaysAgo).length,
          totalOutstanding: invoices.filter((i) => i.payment_status !== "lunas").reduce((s, i) => s + (i.remaining_amount || 0), 0),
          overdueCount: invoices.filter(
            (i) => i.payment_status !== "lunas" && i.due_date && new Date(i.due_date) < now
          ).length
        }
      };
    },
    enabled: !!(tenant == null ? void 0 : tenant.id)
  });
};
const ORDER_STATUS = {
  open: { label: "Menunggu", className: "text-amber-400 bg-amber-400/10 border-amber-400/25" },
  responded: { label: "Ada Respon", className: "text-blue-400 bg-blue-400/10 border-blue-400/25" },
  confirmed: { label: "Dikonfirmasi", className: "text-emerald-400 bg-emerald-400/10 border-emerald-400/25" },
  delivered: { label: "Dalam Pengiriman", className: "text-purple-400 bg-purple-400/10 border-purple-400/25" }
};
const PAYMENT_STATUS = {
  lunas: { label: "Lunas", className: "text-emerald-400 bg-emerald-400/10 border-emerald-400/25" },
  belum_lunas: { label: "Belum", className: "text-amber-400 bg-amber-400/10 border-amber-400/25" },
  sebagian: { label: "Sebagian", className: "text-blue-400 bg-blue-400/10 border-blue-400/25" }
};
function RPABeranda() {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o;
  const { profile, tenant } = useAuth();
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useRPADashboardStats();
  const { data: invoices = [], isLoading: invoicesLoading } = useRPAInvoices();
  const { data: orders = [], isLoading: ordersLoading } = useRPAPurchaseOrders();
  const { data: customers = [] } = useRPACustomers();
  const isLoading = statsLoading || invoicesLoading || ordersLoading;
  const recentInvoices = useMemo(() => invoices.slice(0, 5), [invoices]);
  const activeOrders = useMemo(
    () => orders.filter((o) => o.status === "open" || o.status === "responded"),
    [orders]
  );
  const avgOrderValue = useMemo(() => {
    var _a2;
    if (!invoices.length) return 0;
    return Math.round((((_a2 = stats == null ? void 0 : stats.sales) == null ? void 0 : _a2.totalRevenue) ?? 0) / invoices.length);
  }, [invoices.length, (_a = stats == null ? void 0 : stats.sales) == null ? void 0 : _a.totalRevenue]);
  const now = /* @__PURE__ */ new Date();
  if (isLoading) {
    return /* @__PURE__ */ jsxs("div", { className: "text-slate-100", children: [
      /* @__PURE__ */ jsx("div", { className: "md:hidden", children: /* @__PURE__ */ jsx("div", { className: "h-[60px] bg-[#0C1319] border-b border-white/[0.06] animate-pulse" }) }),
      /* @__PURE__ */ jsxs("div", { className: "p-4 md:p-6 space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "hidden md:flex justify-between items-center", children: [
          /* @__PURE__ */ jsx("div", { className: "h-8 w-48 bg-[#111C24] rounded-xl animate-pulse" }),
          /* @__PURE__ */ jsx("div", { className: "h-10 w-36 bg-[#111C24] rounded-xl animate-pulse" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [...Array(4)].map((_, i) => /* @__PURE__ */ jsx("div", { className: "h-28 bg-[#111C24] rounded-2xl animate-pulse" }, i)) }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-5 gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: "md:col-span-3 h-64 bg-[#0C1319] rounded-2xl animate-pulse" }),
          /* @__PURE__ */ jsx("div", { className: "md:col-span-2 h-64 bg-[#0C1319] rounded-2xl animate-pulse" })
        ] })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "text-slate-100 pb-10", children: [
    /* @__PURE__ */ jsx("div", { className: "md:hidden", children: /* @__PURE__ */ jsx(
      TopBar,
      {
        title: "Beranda",
        subtitle: tenant == null ? void 0 : tenant.business_name,
        rightAction: /* @__PURE__ */ jsxs(
          motion.button,
          {
            whileTap: { scale: 0.93 },
            onClick: () => navigate("/rumah_potong/rpa/distribusi?action=new"),
            className: "flex items-center gap-1.5 px-3 py-2 bg-amber-500 rounded-xl text-white text-xs font-extrabold font-['Sora'] border-none cursor-pointer shadow-[0_3px_10px_rgba(245,158,11,0.35)]",
            children: [
              /* @__PURE__ */ jsx(Plus, { size: 13, strokeWidth: 2.5 }),
              "Invoice"
            ]
          }
        )
      }
    ) }),
    /* @__PURE__ */ jsxs("header", { className: "hidden md:flex justify-between items-center px-6 pt-7 pb-5", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-[11px] text-[#4B6478] font-semibold mb-1", children: (/* @__PURE__ */ new Date()).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) }),
        /* @__PURE__ */ jsxs("h1", { className: "font-['Sora'] text-2xl font-extrabold text-slate-100", children: [
          "Selamat datang, ",
          ((_b = profile == null ? void 0 : profile.full_name) == null ? void 0 : _b.split(" ")[0]) ?? "RPA",
          " 👋"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-[13px] text-[#4B6478] mt-1", children: tenant == null ? void 0 : tenant.business_name })
      ] }),
      /* @__PURE__ */ jsxs(
        motion.button,
        {
          whileTap: { scale: 0.95 },
          onClick: () => navigate("/rumah_potong/rpa/distribusi?action=new"),
          className: "flex items-center gap-2 px-5 h-10 bg-amber-500 hover:bg-amber-400 rounded-xl text-white text-sm font-extrabold font-['Sora'] border-none cursor-pointer shadow-[0_4px_16px_rgba(245,158,11,0.3)] transition-colors",
          children: [
            /* @__PURE__ */ jsx(Plus, { size: 15, strokeWidth: 2.5 }),
            "Buat Invoice"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "px-4 md:px-6", children: [
      /* @__PURE__ */ jsxs("section", { className: "grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 md:mt-0", children: [
        /* @__PURE__ */ jsx(
          KPICard,
          {
            icon: /* @__PURE__ */ jsx(CreditCard, { size: 16, className: "text-amber-400" }),
            label: "Piutang Toko",
            value: formatIDR(((_c = stats == null ? void 0 : stats.sales) == null ? void 0 : _c.totalOutstanding) ?? 0),
            sub: (((_d = stats == null ? void 0 : stats.sales) == null ? void 0 : _d.overdueCount) ?? 0) > 0 ? `${stats.sales.overdueCount} invoice jatuh tempo` : "Semua lancar",
            accentLeft: (((_e = stats == null ? void 0 : stats.sales) == null ? void 0 : _e.overdueCount) ?? 0) > 0 ? "border-l-2 border-l-red-400" : "",
            valueColor: "text-amber-400",
            subColor: (((_f = stats == null ? void 0 : stats.sales) == null ? void 0 : _f.overdueCount) ?? 0) > 0 ? "text-red-400" : "text-[#4B6478]"
          }
        ),
        /* @__PURE__ */ jsx(
          KPICard,
          {
            icon: /* @__PURE__ */ jsx(TrendingUp, { size: 16, className: "text-amber-400" }),
            label: "Revenue Bulan Ini",
            value: formatIDR(((_g = stats == null ? void 0 : stats.sales) == null ? void 0 : _g.revenueThisMonth) ?? 0),
            sub: `Total: ${formatIDR(((_h = stats == null ? void 0 : stats.sales) == null ? void 0 : _h.totalRevenue) ?? 0)}`,
            valueColor: "text-amber-400"
          }
        ),
        /* @__PURE__ */ jsx(
          KPICard,
          {
            icon: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(ShoppingCart, { size: 16, className: "text-blue-400" }),
              (((_i = stats == null ? void 0 : stats.orders) == null ? void 0 : _i.open) ?? 0) > 0 && /* @__PURE__ */ jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse inline-block" })
            ] }),
            label: "Order ke Broker",
            value: String(((_j = stats == null ? void 0 : stats.orders) == null ? void 0 : _j.open) ?? 0),
            sub: "order menunggu konfirmasi",
            accentLeft: (((_k = stats == null ? void 0 : stats.orders) == null ? void 0 : _k.open) ?? 0) > 0 ? "border-l-2 border-l-blue-400" : "",
            valueColor: (((_l = stats == null ? void 0 : stats.orders) == null ? void 0 : _l.open) ?? 0) > 0 ? "text-blue-400" : "text-slate-400"
          }
        ),
        /* @__PURE__ */ jsx(
          KPICard,
          {
            icon: /* @__PURE__ */ jsx(DollarSign, { size: 16, className: "text-emerald-400" }),
            label: "Profit Bersih",
            value: formatIDR(((_m = stats == null ? void 0 : stats.sales) == null ? void 0 : _m.totalProfit) ?? 0),
            sub: "dari semua penjualan",
            valueColor: (((_n = stats == null ? void 0 : stats.sales) == null ? void 0 : _n.totalProfit) ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "grid grid-cols-1 md:grid-cols-5 gap-4 mt-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "md:col-span-3 bg-[#0C1319] border border-white/[0.06] rounded-2xl p-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-4", children: [
            /* @__PURE__ */ jsx("p", { className: "text-[10px] font-extrabold text-[#4B6478] uppercase tracking-widest font-['Sora']", children: "Invoice Terbaru" }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                className: "flex items-center gap-1 text-xs font-semibold text-amber-400 bg-transparent border-none cursor-pointer",
                onClick: () => navigate("/rumah_potong/rpa/distribusi"),
                children: [
                  "Lihat Semua ",
                  /* @__PURE__ */ jsx(ChevronRight, { size: 12 })
                ]
              }
            )
          ] }),
          recentInvoices.length === 0 ? /* @__PURE__ */ jsx(EmptyState, { icon: "📋", message: "Belum ada invoice" }) : /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-2", children: recentInvoices.map((inv) => {
            var _a2;
            const ps = PAYMENT_STATUS[inv.payment_status] ?? PAYMENT_STATUS.belum_lunas;
            const isOverdue2 = inv.payment_status !== "lunas" && inv.due_date && new Date(inv.due_date) < now;
            const customerName = ((_a2 = inv.rpa_customers) == null ? void 0 : _a2.customer_name) ?? inv.customer_name ?? "—";
            return /* @__PURE__ */ jsxs(
              "div",
              {
                className: "flex items-center gap-3 px-3 py-2.5 bg-[#111C24] border border-white/[0.06] rounded-[14px]",
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-0.5", children: [
                      /* @__PURE__ */ jsx("span", { className: "font-medium text-[13px] text-slate-100 truncate", children: customerName }),
                      isOverdue2 && /* @__PURE__ */ jsx("span", { className: "text-[9px] font-extrabold text-red-400 bg-red-400/10 border border-red-400/25 px-1.5 py-0.5 rounded-full flex-shrink-0", children: "Jatuh Tempo" })
                    ] }),
                    /* @__PURE__ */ jsx("p", { className: "text-[11px] text-[#4B6478]", children: formatDate(inv.transaction_date) })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-end gap-1 flex-shrink-0", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-[13px] font-bold text-slate-100", children: formatIDR(inv.total_amount ?? 0) }),
                    /* @__PURE__ */ jsx("span", { className: `text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${ps.className}`, children: ps.label })
                  ] })
                ]
              },
              inv.id
            );
          }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "md:col-span-2 bg-[#0C1319] border border-white/[0.06] rounded-2xl p-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-4", children: [
            /* @__PURE__ */ jsx("p", { className: "text-[10px] font-extrabold text-[#4B6478] uppercase tracking-widest font-['Sora']", children: "Order Aktif" }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                className: "flex items-center gap-1 text-xs font-semibold text-amber-400 bg-transparent border-none cursor-pointer",
                onClick: () => navigate("/rumah_potong/rpa/order?action=new"),
                children: [
                  /* @__PURE__ */ jsx(Plus, { size: 11, strokeWidth: 2.5 }),
                  "Order"
                ]
              }
            )
          ] }),
          activeOrders.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "py-8 text-center", children: [
            /* @__PURE__ */ jsx("p", { className: "text-[#4B6478] text-sm mb-3", children: "Tidak ada order aktif" }),
            /* @__PURE__ */ jsx(
              motion.button,
              {
                whileTap: { scale: 0.95 },
                onClick: () => navigate("/rumah_potong/rpa/order?action=new"),
                className: "px-4 py-2 bg-amber-500 text-white text-xs font-bold font-['Sora'] rounded-xl border-none cursor-pointer",
                children: "+ Buat Order"
              }
            )
          ] }) : /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-2", children: activeOrders.map((order) => {
            var _a2;
            const os = ORDER_STATUS[order.status] ?? ORDER_STATUS.open;
            return /* @__PURE__ */ jsxs(
              "div",
              {
                className: "px-3 py-2.5 bg-[#111C24] border border-white/[0.06] rounded-[14px]",
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-1", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-[11px] font-bold text-slate-100 capitalize", children: ((_a2 = order.chicken_type) == null ? void 0 : _a2.replace("_", " ")) ?? "—" }),
                    /* @__PURE__ */ jsx("span", { className: `text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${os.className}`, children: os.label })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                    /* @__PURE__ */ jsxs("span", { className: "text-[12px] text-[#94A3B8] font-semibold", children: [
                      (order.requested_count ?? 0).toLocaleString("id-ID"),
                      " ekor"
                    ] }),
                    order.requested_date && /* @__PURE__ */ jsx("span", { className: "text-[11px] text-[#4B6478]", children: formatDate(order.requested_date) })
                  ] })
                ]
              },
              order.id
            );
          }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "hidden md:grid grid-cols-3 gap-3 mt-4", children: [
        /* @__PURE__ */ jsx(
          QuickStat,
          {
            label: "Total Toko Aktif",
            value: customers.length,
            unit: "toko"
          }
        ),
        /* @__PURE__ */ jsx(
          QuickStat,
          {
            label: "Invoice Bulan Ini",
            value: ((_o = stats == null ? void 0 : stats.sales) == null ? void 0 : _o.invoicesThisMonth) ?? 0,
            unit: "invoice"
          }
        ),
        /* @__PURE__ */ jsx(
          QuickStat,
          {
            label: "Avg. Order Value",
            value: formatIDR(avgOrderValue),
            unit: ""
          }
        )
      ] })
    ] })
  ] });
}
function KPICard({ icon, label, value, sub, valueColor, subColor = "text-[#4B6478]", accentLeft = "" }) {
  return /* @__PURE__ */ jsxs(
    motion.div,
    {
      initial: { opacity: 0, y: 12 },
      animate: { opacity: 1, y: 0 },
      className: `bg-[#111C24] border border-white/[0.08] rounded-2xl p-4 ${accentLeft}`,
      children: [
        /* @__PURE__ */ jsx("div", { className: "mb-2", children: icon }),
        /* @__PURE__ */ jsx("p", { className: "text-[10px] font-extrabold text-[#4B6478] uppercase tracking-widest font-['Sora'] mb-1", children: label }),
        /* @__PURE__ */ jsx("p", { className: `font-['Sora'] text-xl font-extrabold mb-0.5 truncate ${valueColor}`, children: value }),
        /* @__PURE__ */ jsx("p", { className: `text-[10px] font-medium ${subColor}`, children: sub })
      ]
    }
  );
}
function QuickStat({ label, value, unit }) {
  return /* @__PURE__ */ jsxs("div", { className: "bg-[#111C24] border border-white/[0.08] rounded-xl p-3 text-center", children: [
    /* @__PURE__ */ jsx("p", { className: "text-[10px] font-extrabold text-[#4B6478] uppercase tracking-widest font-['Sora'] mb-1", children: label }),
    /* @__PURE__ */ jsxs("p", { className: "font-['Sora'] text-lg font-extrabold text-slate-100", children: [
      typeof value === "number" ? value.toLocaleString("id-ID") : value,
      unit && /* @__PURE__ */ jsx("span", { className: "text-[11px] font-semibold text-[#4B6478] ml-1", children: unit })
    ] })
  ] });
}
function EmptyState({ icon, message }) {
  return /* @__PURE__ */ jsxs("div", { className: "py-10 text-center", children: [
    /* @__PURE__ */ jsx("span", { className: "text-3xl", children: icon }),
    /* @__PURE__ */ jsx("p", { className: "text-[#4B6478] text-sm mt-2", children: message })
  ] });
}
const CHICKEN_TYPES = [
  { value: "broiler", label: "Broiler", icon: "🐔" },
  { value: "layer", label: "Layer", icon: "🥚" },
  { value: "kampung", label: "Kampung", icon: "🐓" }
];
const STATUS_TABS = [
  { key: "all", label: "Semua" },
  { key: "open", label: "Menunggu" },
  { key: "confirmed", label: "Dikonfirmasi" },
  { key: "in_delivery", label: "Dikirim" },
  { key: "completed", label: "Selesai" }
];
const STATUS_CONFIG$2 = {
  open: { label: "Menunggu", color: "#F59E0B", bg: "rgba(245,158,11,0.12)", icon: Clock },
  responded: { label: "Direspon", color: "#60A5FA", bg: "rgba(96,165,250,0.12)", icon: CheckCircle2 },
  confirmed: { label: "Dikonfirmasi", color: "#021a02", bg: "rgba(2, 26, 2,0.12)", icon: CheckCircle2 },
  in_delivery: { label: "Dikirim", color: "#A78BFA", bg: "rgba(167,139,250,0.12)", icon: Truck },
  delivered: { label: "Terkirim", color: "#021a02", bg: "rgba(2, 26, 2,0.12)", icon: Truck },
  completed: { label: "Selesai", color: "#4B6478", bg: "rgba(75,100,120,0.12)", icon: CheckCircle2 },
  cancelled: { label: "Dibatalkan", color: "#EF4444", bg: "rgba(239,68,68,0.12)", icon: XCircle }
};
const orderSchema = z.object({
  chicken_type: z.string().min(1, "Pilih jenis ayam"),
  requested_count: z.coerce.number().int().min(1, "Minimal 1 ekor"),
  requested_weight_kg: z.coerce.number().min(0.1, "Isi berat estimasi"),
  target_price_per_kg: z.coerce.number().min(1e3, "Isi target harga"),
  requested_date: z.string().min(1, "Pilih tanggal pengiriman"),
  notes: z.string().optional()
});
const fmt$4 = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
const fmtDate$4 = (d) => {
  if (!d) return "-";
  try {
    return format(new Date(d), "d MMM yyyy", { locale: id });
  } catch {
    return d;
  }
};
function StatusBadge$2({ status }) {
  const cfg = STATUS_CONFIG$2[status] ?? { label: status, color: "#94A3B8", bg: "rgba(148,163,184,0.12)" };
  const Icon = cfg.icon;
  return /* @__PURE__ */ jsxs("span", { style: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    background: cfg.bg,
    color: cfg.color,
    padding: "3px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 600
  }, children: [
    Icon && /* @__PURE__ */ jsx(Icon, { size: 11 }),
    cfg.label
  ] });
}
function OrderCard({ order, onCancel }) {
  var _a, _b, _c;
  const ct = CHICKEN_TYPES.find((t) => t.value === order.chicken_type);
  const estimatedValue = (order.requested_weight_kg || 0) * (order.target_price_per_kg || 0);
  return /* @__PURE__ */ jsxs("div", { style: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "14px",
    padding: "16px"
  }, children: [
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "10px" }, children: [
        /* @__PURE__ */ jsx("div", { style: {
          width: "38px",
          height: "38px",
          borderRadius: "10px",
          background: "rgba(245,158,11,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "18px"
        }, children: (ct == null ? void 0 : ct.icon) ?? "🐔" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { style: { fontWeight: 600, color: "#F1F5F9", fontSize: "14px" }, children: (ct == null ? void 0 : ct.label) ?? order.chicken_type }),
          /* @__PURE__ */ jsxs("div", { style: { fontSize: "12px", color: "#4B6478", marginTop: "2px" }, children: [
            (_a = order.requested_count) == null ? void 0 : _a.toLocaleString("id-ID"),
            " ekor •",
            " ",
            (_b = order.requested_weight_kg) == null ? void 0 : _b.toLocaleString("id-ID"),
            " kg"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx(StatusBadge$2, { status: order.status })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: {
      marginTop: "12px",
      paddingTop: "12px",
      borderTop: "1px solid rgba(255,255,255,0.06)",
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "8px"
    }, children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: "11px", color: "#4B6478" }, children: "Target Harga/kg" }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: "13px", fontWeight: 600, color: "#F59E0B" }, children: fmt$4(order.target_price_per_kg || 0) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: "11px", color: "#4B6478" }, children: "Est. Nilai" }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: "13px", fontWeight: 600, color: "#F1F5F9" }, children: fmt$4(estimatedValue) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: "11px", color: "#4B6478" }, children: "Tgl Pengiriman" }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: "13px", color: "#CBD5E1" }, children: fmtDate$4(order.requested_date) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: "11px", color: "#4B6478" }, children: "Broker" }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: "13px", color: "#CBD5E1" }, children: ((_c = order.tenants) == null ? void 0 : _c.business_name) ?? /* @__PURE__ */ jsx("span", { style: { color: "#4B6478" }, children: "Belum ditentukan" }) })
      ] })
    ] }),
    order.notes && /* @__PURE__ */ jsx("div", { style: {
      marginTop: "10px",
      padding: "8px 10px",
      background: "rgba(255,255,255,0.03)",
      borderRadius: "8px",
      fontSize: "12px",
      color: "#64748B"
    }, children: order.notes }),
    order.status === "open" && /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => onCancel(order.id),
        style: {
          marginTop: "12px",
          width: "100%",
          padding: "8px",
          background: "transparent",
          border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: "8px",
          color: "#EF4444",
          fontSize: "13px",
          cursor: "pointer",
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px"
        },
        children: [
          /* @__PURE__ */ jsx(Ban, { size: 14 }),
          "Batalkan Order"
        ]
      }
    )
  ] });
}
function CreateOrderSheet({ open, onClose }) {
  const createOrder = useCreatePurchaseOrder();
  const { register, control, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      chicken_type: "",
      requested_count: "",
      requested_weight_kg: "",
      target_price_per_kg: "",
      requested_date: "",
      notes: ""
    }
  });
  const selectedType = watch("chicken_type");
  const onSubmit = (data) => {
    createOrder.mutate(data, {
      onSuccess: () => {
        reset();
        onClose();
      }
    });
  };
  return /* @__PURE__ */ jsx(Sheet, { open, onOpenChange: (v) => {
    if (!v) {
      reset();
      onClose();
    }
  }, children: /* @__PURE__ */ jsxs(SheetContent, { side: "bottom", style: { background: "#0D1117", border: "none", maxHeight: "92vh", overflowY: "auto", borderRadius: "20px 20px 0 0" }, children: [
    /* @__PURE__ */ jsx(SheetHeader, { style: { padding: "20px 20px 0" }, children: /* @__PURE__ */ jsx(SheetTitle, { style: { color: "#F1F5F9", fontFamily: "Sora", fontSize: "18px" }, children: "Order ke Broker" }) }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit(onSubmit), style: { padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }, children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("label", { style: { fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "8px" }, children: [
          "Jenis Ayam ",
          /* @__PURE__ */ jsx("span", { style: { color: "#EF4444" }, children: "*" })
        ] }),
        /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: "8px" }, children: CHICKEN_TYPES.map((t) => /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => setValue("chicken_type", t.value, { shouldValidate: true }),
            style: {
              flex: 1,
              padding: "10px 8px",
              borderRadius: "10px",
              border: `1px solid ${selectedType === t.value ? "#F59E0B" : "rgba(255,255,255,0.08)"}`,
              background: selectedType === t.value ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.03)",
              color: selectedType === t.value ? "#F59E0B" : "#94A3B8",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 600,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px"
            },
            children: [
              /* @__PURE__ */ jsx("span", { style: { fontSize: "22px" }, children: t.icon }),
              t.label
            ]
          },
          t.value
        )) }),
        errors.chicken_type && /* @__PURE__ */ jsx("p", { style: { fontSize: "12px", color: "#EF4444", marginTop: "4px" }, children: errors.chicken_type.message })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }, children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("label", { htmlFor: "requested_count", style: { fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "6px" }, children: [
            "Jumlah (ekor) ",
            /* @__PURE__ */ jsx("span", { style: { color: "#EF4444" }, children: "*" })
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "requested_count",
              name: "requested_count",
              type: "number",
              min: "1",
              placeholder: "500",
              ...register("requested_count"),
              style: {
                width: "100%",
                padding: "10px 12px",
                background: "rgba(255,255,255,0.05)",
                border: `1px solid ${errors.requested_count ? "#EF4444" : "rgba(255,255,255,0.1)"}`,
                borderRadius: "10px",
                color: "#F1F5F9",
                fontSize: "14px",
                outline: "none"
              }
            }
          ),
          errors.requested_count && /* @__PURE__ */ jsx("p", { style: { fontSize: "11px", color: "#EF4444", marginTop: "3px" }, children: errors.requested_count.message })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("label", { htmlFor: "requested_weight_kg", style: { fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "6px" }, children: [
            "Berat Est. (kg) ",
            /* @__PURE__ */ jsx("span", { style: { color: "#EF4444" }, children: "*" })
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "requested_weight_kg",
              name: "requested_weight_kg",
              type: "number",
              step: "0.1",
              min: "0",
              placeholder: "1200",
              ...register("requested_weight_kg"),
              style: {
                width: "100%",
                padding: "10px 12px",
                background: "rgba(255,255,255,0.05)",
                border: `1px solid ${errors.requested_weight_kg ? "#EF4444" : "rgba(255,255,255,0.1)"}`,
                borderRadius: "10px",
                color: "#F1F5F9",
                fontSize: "14px",
                outline: "none"
              }
            }
          ),
          errors.requested_weight_kg && /* @__PURE__ */ jsx("p", { style: { fontSize: "11px", color: "#EF4444", marginTop: "3px" }, children: errors.requested_weight_kg.message })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("label", { htmlFor: "target_price_per_kg", style: { fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "6px" }, children: [
          "Target Harga/kg ",
          /* @__PURE__ */ jsx("span", { style: { color: "#EF4444" }, children: "*" })
        ] }),
        /* @__PURE__ */ jsx(
          Controller,
          {
            name: "target_price_per_kg",
            control,
            render: ({ field }) => /* @__PURE__ */ jsx(
              InputRupiah,
              {
                id: "target_price_per_kg",
                name: "target_price_per_kg",
                value: field.value,
                onChange: field.onChange,
                placeholder: "32.000",
                hasError: !!errors.target_price_per_kg
              }
            )
          }
        ),
        errors.target_price_per_kg && /* @__PURE__ */ jsx("p", { style: { fontSize: "12px", color: "#EF4444", marginTop: "4px" }, children: errors.target_price_per_kg.message })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("label", { htmlFor: "requested_date", style: { fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "6px" }, children: [
          "Tanggal Pengiriman ",
          /* @__PURE__ */ jsx("span", { style: { color: "#EF4444" }, children: "*" })
        ] }),
        /* @__PURE__ */ jsx(
          Controller,
          {
            name: "requested_date",
            control,
            render: ({ field }) => /* @__PURE__ */ jsx(
              DatePicker,
              {
                id: "requested_date",
                name: "requested_date",
                value: field.value,
                onChange: field.onChange,
                hasError: !!errors.requested_date
              }
            )
          }
        ),
        errors.requested_date && /* @__PURE__ */ jsx("p", { style: { fontSize: "12px", color: "#EF4444", marginTop: "4px" }, children: errors.requested_date.message })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "notes", style: { fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "6px" }, children: "Catatan (opsional)" }),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            id: "notes",
            name: "notes",
            ...register("notes"),
            rows: 2,
            placeholder: "Spesifikasi tambahan, preferensi broker, dll.",
            style: {
              width: "100%",
              padding: "10px 12px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "10px",
              color: "#F1F5F9",
              fontSize: "14px",
              outline: "none",
              resize: "none",
              fontFamily: "inherit"
            }
          }
        )
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          disabled: createOrder.isPending,
          style: {
            padding: "13px",
            borderRadius: "12px",
            background: createOrder.isPending ? "rgba(245,158,11,0.4)" : "#F59E0B",
            border: "none",
            color: "#0D1117",
            fontWeight: 700,
            fontSize: "15px",
            cursor: createOrder.isPending ? "not-allowed" : "pointer"
          },
          children: createOrder.isPending ? "Mengirim..." : "Kirim ke Broker"
        }
      )
    ] })
  ] }) });
}
function RPAOrder() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("all");
  const { data: orders = [], isLoading } = useRPAPurchaseOrders();
  const updateOrder = useUpdatePurchaseOrder();
  const sheetOpen = searchParams.get("action") === "new";
  const openSheet = () => setSearchParams({ action: "new" });
  const closeSheet = () => setSearchParams({}, { replace: true });
  const handleCancel = (orderId) => {
    updateOrder.mutate({ orderId, updates: { status: "cancelled" } });
  };
  const filtered = activeTab === "all" ? orders : orders.filter((o) => o.status === activeTab);
  const stats = {
    total: orders.length,
    open: orders.filter((o) => o.status === "open").length,
    inDelivery: orders.filter((o) => o.status === "in_delivery" || o.status === "delivered").length
  };
  const AddButton = /* @__PURE__ */ jsxs(
    motion.button,
    {
      whileTap: { scale: 0.95 },
      onClick: openSheet,
      style: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 14px",
        borderRadius: "10px",
        background: "#F59E0B",
        border: "none",
        color: "#0D1117",
        fontWeight: 700,
        fontSize: "13px",
        cursor: "pointer"
      },
      children: [
        /* @__PURE__ */ jsx(Plus, { size: 16 }),
        isDesktop ? "Order Baru" : "Order"
      ]
    }
  );
  return /* @__PURE__ */ jsxs("div", { style: { minHeight: "100vh", background: "#06090F" }, children: [
    !isDesktop ? /* @__PURE__ */ jsx(TopBar, { title: "Order ke Broker", subtitle: `${stats.open} menunggu konfirmasi`, rightAction: AddButton }) : /* @__PURE__ */ jsxs("div", { style: { padding: "28px 32px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }, children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { style: { fontFamily: "Sora", fontSize: "22px", fontWeight: 700, color: "#F1F5F9" }, children: "Order ke Broker" }),
        /* @__PURE__ */ jsx("p", { style: { fontSize: "14px", color: "#4B6478", marginTop: "4px" }, children: "Manajemen pembelian ayam dari broker" })
      ] }),
      AddButton
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { padding: isDesktop ? "24px 32px" : "20px 16px" }, children: [
      /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px", marginBottom: "20px" }, children: [
        { label: "Total Order", value: stats.total, color: "#F59E0B" },
        { label: "Menunggu", value: stats.open, color: "#60A5FA" },
        { label: "Dalam Pengiriman", value: stats.inDelivery, color: "#A78BFA" }
      ].map((s) => /* @__PURE__ */ jsxs("div", { style: {
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "12px",
        padding: "12px",
        textAlign: "center"
      }, children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: "22px", fontWeight: 700, color: s.color }, children: s.value }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: "11px", color: "#4B6478", marginTop: "2px" }, children: s.label })
      ] }, s.label)) }),
      /* @__PURE__ */ jsx("div", { style: {
        display: "flex",
        gap: "6px",
        overflowX: "auto",
        paddingBottom: "4px",
        marginBottom: "16px",
        scrollbarWidth: "none"
      }, children: STATUS_TABS.map((tab) => /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setActiveTab(tab.key),
          style: {
            flexShrink: 0,
            padding: "6px 14px",
            borderRadius: "20px",
            border: activeTab === tab.key ? "none" : "1px solid rgba(255,255,255,0.08)",
            background: activeTab === tab.key ? "#F59E0B" : "rgba(255,255,255,0.03)",
            color: activeTab === tab.key ? "#0D1117" : "#64748B",
            fontSize: "13px",
            fontWeight: activeTab === tab.key ? 700 : 400,
            cursor: "pointer",
            whiteSpace: "nowrap"
          },
          children: [
            tab.label,
            tab.key !== "all" && /* @__PURE__ */ jsx("span", { style: { marginLeft: "5px", opacity: 0.7 }, children: orders.filter((o) => o.status === tab.key).length })
          ]
        },
        tab.key
      )) }),
      isLoading ? /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: "12px" }, children: [1, 2, 3].map((i) => /* @__PURE__ */ jsx("div", { style: {
        height: "140px",
        borderRadius: "14px",
        background: "rgba(255,255,255,0.03)",
        animation: "pulse 1.5s infinite"
      } }, i)) }) : filtered.length === 0 ? /* @__PURE__ */ jsxs("div", { style: { textAlign: "center", paddingTop: "60px" }, children: [
        /* @__PURE__ */ jsx(ShoppingCart, { size: 40, color: "#1E293B" }),
        /* @__PURE__ */ jsx("p", { style: { color: "#4B6478", marginTop: "12px", fontSize: "14px" }, children: activeTab === "all" ? "Belum ada order. Buat order pertama Anda." : "Tidak ada order dengan status ini." }),
        activeTab === "all" && /* @__PURE__ */ jsx(
          motion.button,
          {
            whileTap: { scale: 0.95 },
            onClick: openSheet,
            style: {
              marginTop: "16px",
              padding: "10px 20px",
              borderRadius: "10px",
              background: "#F59E0B",
              border: "none",
              color: "#0D1117",
              fontWeight: 700,
              fontSize: "14px",
              cursor: "pointer"
            },
            children: "Buat Order Baru"
          }
        )
      ] }) : /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: "12px" }, children: filtered.map((order) => /* @__PURE__ */ jsx(OrderCard, { order, onCancel: handleCancel }, order.id)) })
    ] }),
    /* @__PURE__ */ jsx(CreateOrderSheet, { open: sheetOpen, onClose: closeSheet })
  ] });
}
const PAYMENT_METHODS$2 = [
  { value: "transfer", label: "Transfer Bank", icon: "🏦" },
  { value: "cash", label: "Tunai", icon: "💵" },
  { value: "giro", label: "Giro", icon: "📃" },
  { value: "qris", label: "QRIS", icon: "📲" }
];
const CHICKEN_LABELS = { broiler: "Broiler", layer: "Layer", kampung: "Kampung" };
const paymentSchema = z.object({
  broker_tenant_id: z.string().min(1, "Pilih broker"),
  amount: z.coerce.number().min(1e3, "Minimal Rp 1.000"),
  payment_method: z.string().min(1, "Pilih metode"),
  reference_no: z.string().optional(),
  notes: z.string().optional()
});
const fmt$3 = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n || 0);
const fmtDate$3 = (d) => {
  if (!d) return "-";
  try {
    return format(new Date(d), "d MMM yyyy", { locale: id });
  } catch {
    return d;
  }
};
const calcOrderValue = (o) => (o.requested_weight_kg || 0) * (o.target_price_per_kg || 0);
function CatatPembayaranSheet({ open, onClose, brokers }) {
  const createPayment = useCreateRPAPayment();
  const { register, control, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      broker_tenant_id: "",
      amount: "",
      payment_method: "transfer",
      reference_no: "",
      notes: ""
    }
  });
  const selectedMethod = watch("payment_method");
  const onSubmit = (data) => {
    createPayment.mutate(data, {
      onSuccess: () => {
        reset();
        onClose();
      }
    });
  };
  return /* @__PURE__ */ jsx(Sheet, { open, onOpenChange: (v) => {
    if (!v) {
      reset();
      onClose();
    }
  }, children: /* @__PURE__ */ jsxs(SheetContent, { side: "bottom", style: { background: "#0D1117", border: "none", maxHeight: "92vh", overflowY: "auto", borderRadius: "20px 20px 0 0" }, children: [
    /* @__PURE__ */ jsx(SheetHeader, { style: { padding: "20px 20px 0" }, children: /* @__PURE__ */ jsx(SheetTitle, { style: { color: "#F1F5F9", fontFamily: "Sora", fontSize: "18px" }, children: "Catat Pembayaran" }) }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit(onSubmit), style: { padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }, children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("label", { htmlFor: "broker_tenant_id", style: { fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "6px" }, children: [
          "Broker ",
          /* @__PURE__ */ jsx("span", { style: { color: "#EF4444" }, children: "*" })
        ] }),
        /* @__PURE__ */ jsxs(
          "select",
          {
            id: "broker_tenant_id",
            name: "broker_tenant_id",
            ...register("broker_tenant_id"),
            style: {
              width: "100%",
              padding: "10px 12px",
              background: "rgba(255,255,255,0.05)",
              border: `1px solid ${errors.broker_tenant_id ? "#EF4444" : "rgba(255,255,255,0.1)"}`,
              borderRadius: "10px",
              color: "#F1F5F9",
              fontSize: "14px",
              outline: "none"
            },
            children: [
              /* @__PURE__ */ jsx("option", { value: "", style: { background: "#0D1117" }, children: "Pilih broker..." }),
              brokers.map((b) => /* @__PURE__ */ jsx("option", { value: b.id, style: { background: "#0D1117" }, children: b.business_name }, b.id))
            ]
          }
        ),
        errors.broker_tenant_id && /* @__PURE__ */ jsx("p", { style: { fontSize: "12px", color: "#EF4444", marginTop: "4px" }, children: errors.broker_tenant_id.message })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("label", { htmlFor: "amount", style: { fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "6px" }, children: [
          "Jumlah Bayar ",
          /* @__PURE__ */ jsx("span", { style: { color: "#EF4444" }, children: "*" })
        ] }),
        /* @__PURE__ */ jsx(
          Controller,
          {
            name: "amount",
            control,
            render: ({ field }) => /* @__PURE__ */ jsx(
              InputRupiah,
              {
                id: "amount",
                name: "amount",
                value: field.value,
                onChange: field.onChange,
                placeholder: "0",
                hasError: !!errors.amount
              }
            )
          }
        ),
        errors.amount && /* @__PURE__ */ jsx("p", { style: { fontSize: "12px", color: "#EF4444", marginTop: "4px" }, children: errors.amount.message })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("label", { style: { fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "8px" }, children: [
          "Metode Pembayaran ",
          /* @__PURE__ */ jsx("span", { style: { color: "#EF4444" }, children: "*" })
        ] }),
        /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "6px" }, children: PAYMENT_METHODS$2.map((m) => /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => setValue("payment_method", m.value),
            style: {
              padding: "8px 4px",
              borderRadius: "8px",
              border: `1px solid ${selectedMethod === m.value ? "#F59E0B" : "rgba(255,255,255,0.08)"}`,
              background: selectedMethod === m.value ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.03)",
              color: selectedMethod === m.value ? "#F59E0B" : "#64748B",
              cursor: "pointer",
              fontSize: "11px",
              fontWeight: 600,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "3px"
            },
            children: [
              /* @__PURE__ */ jsx("span", { style: { fontSize: "16px" }, children: m.icon }),
              m.label
            ]
          },
          m.value
        )) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "reference_no", style: { fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "6px" }, children: "No. Referensi / Bukti (opsional)" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            id: "reference_no",
            name: "reference_no",
            type: "text",
            placeholder: "No. transfer, nota, dll.",
            ...register("reference_no"),
            style: {
              width: "100%",
              padding: "10px 12px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "10px",
              color: "#F1F5F9",
              fontSize: "14px",
              outline: "none"
            }
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "pay_notes", style: { fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "6px" }, children: "Catatan (opsional)" }),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            id: "pay_notes",
            name: "notes",
            ...register("notes"),
            rows: 2,
            placeholder: "Keterangan tambahan...",
            style: {
              width: "100%",
              padding: "10px 12px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "10px",
              color: "#F1F5F9",
              fontSize: "14px",
              outline: "none",
              resize: "none",
              fontFamily: "inherit"
            }
          }
        )
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          disabled: createPayment.isPending,
          style: {
            padding: "13px",
            borderRadius: "12px",
            background: createPayment.isPending ? "rgba(245,158,11,0.4)" : "#F59E0B",
            border: "none",
            color: "#0D1117",
            fontWeight: 700,
            fontSize: "15px",
            cursor: createPayment.isPending ? "not-allowed" : "pointer"
          },
          children: createPayment.isPending ? "Menyimpan..." : "Catat Pembayaran"
        }
      )
    ] })
  ] }) });
}
function RPAHutang() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: orders = [], isLoading: ordersLoading } = useRPAPurchaseOrders();
  const { data: payments = [], isLoading: paymentsLoading } = useRPAPaymentsToSend();
  const sheetOpen = searchParams.get("action") === "new";
  const openSheet = () => setSearchParams({ action: "new" });
  const closeSheet = () => setSearchParams({}, { replace: true });
  const debtOrders = orders.filter(
    (o) => o.status === "delivered" || o.status === "completed"
  );
  const brokerMap = {};
  orders.forEach((o) => {
    var _a;
    if (o.broker_tenant_id && ((_a = o.tenants) == null ? void 0 : _a.business_name)) {
      brokerMap[o.broker_tenant_id] = { id: o.broker_tenant_id, business_name: o.tenants.business_name };
    }
  });
  const brokers = Object.values(brokerMap);
  const totalHutang = debtOrders.reduce((s, o) => s + calcOrderValue(o), 0);
  const totalDibayar = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const sisaHutang = Math.max(0, totalHutang - totalDibayar);
  const isLoading = ordersLoading || paymentsLoading;
  const AddButton = /* @__PURE__ */ jsxs(
    motion.button,
    {
      whileTap: { scale: 0.95 },
      onClick: openSheet,
      style: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 14px",
        borderRadius: "10px",
        background: "#F59E0B",
        border: "none",
        color: "#0D1117",
        fontWeight: 700,
        fontSize: "13px",
        cursor: "pointer"
      },
      children: [
        /* @__PURE__ */ jsx(Plus, { size: 16 }),
        isDesktop ? "Catat Pembayaran" : "Bayar"
      ]
    }
  );
  return /* @__PURE__ */ jsxs("div", { style: { minHeight: "100vh", background: "#06090F" }, children: [
    !isDesktop ? /* @__PURE__ */ jsx(TopBar, { title: "Hutang ke Broker", subtitle: sisaHutang > 0 ? `Sisa ${fmt$3(sisaHutang)}` : "Lunas", rightAction: AddButton }) : /* @__PURE__ */ jsxs("div", { style: { padding: "28px 32px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }, children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { style: { fontFamily: "Sora", fontSize: "22px", fontWeight: 700, color: "#F1F5F9" }, children: "Hutang ke Broker" }),
        /* @__PURE__ */ jsx("p", { style: { fontSize: "14px", color: "#4B6478", marginTop: "4px" }, children: "Rekap pembayaran atas pembelian ayam" })
      ] }),
      AddButton
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { padding: isDesktop ? "24px 32px" : "20px 16px" }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px", marginBottom: "24px" }, children: [
        /* @__PURE__ */ jsxs("div", { style: {
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(239,68,68,0.15)",
          borderRadius: "12px",
          padding: "14px"
        }, children: [
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }, children: [
            /* @__PURE__ */ jsx(CreditCard, { size: 14, color: "#EF4444" }),
            /* @__PURE__ */ jsx("span", { style: { fontSize: "11px", color: "#4B6478" }, children: "Total Hutang" })
          ] }),
          /* @__PURE__ */ jsx("div", { style: { fontSize: "16px", fontWeight: 700, color: "#EF4444" }, children: isLoading ? "—" : fmt$3(totalHutang) })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: {
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(2, 26, 2,0.15)",
          borderRadius: "12px",
          padding: "14px"
        }, children: [
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }, children: [
            /* @__PURE__ */ jsx(ArrowUpRight, { size: 14, color: "#021a02" }),
            /* @__PURE__ */ jsx("span", { style: { fontSize: "11px", color: "#4B6478" }, children: "Sudah Dibayar" })
          ] }),
          /* @__PURE__ */ jsx("div", { style: { fontSize: "16px", fontWeight: 700, color: "#021a02" }, children: isLoading ? "—" : fmt$3(totalDibayar) })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: {
          background: sisaHutang > 0 ? "rgba(245,158,11,0.05)" : "rgba(255,255,255,0.03)",
          border: `1px solid ${sisaHutang > 0 ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.06)"}`,
          borderRadius: "12px",
          padding: "14px"
        }, children: [
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }, children: [
            /* @__PURE__ */ jsx(Wallet, { size: 14, color: sisaHutang > 0 ? "#F59E0B" : "#4B6478" }),
            /* @__PURE__ */ jsx("span", { style: { fontSize: "11px", color: "#4B6478" }, children: "Sisa Hutang" })
          ] }),
          /* @__PURE__ */ jsx("div", { style: { fontSize: "16px", fontWeight: 700, color: sisaHutang > 0 ? "#F59E0B" : "#021a02" }, children: isLoading ? "—" : sisaHutang > 0 ? fmt$3(sisaHutang) : "Lunas" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { marginBottom: "24px" }, children: [
        /* @__PURE__ */ jsx("h3", { style: { fontSize: "14px", fontWeight: 600, color: "#94A3B8", marginBottom: "12px" }, children: "Rincian Pembelian" }),
        isLoading ? /* @__PURE__ */ jsx("div", { style: { height: "120px", borderRadius: "12px", background: "rgba(255,255,255,0.03)", animation: "pulse 1.5s infinite" } }) : debtOrders.length === 0 ? /* @__PURE__ */ jsxs("div", { style: {
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "12px",
          padding: "24px",
          textAlign: "center"
        }, children: [
          /* @__PURE__ */ jsx(Landmark, { size: 32, color: "#1E293B" }),
          /* @__PURE__ */ jsx("p", { style: { color: "#4B6478", marginTop: "10px", fontSize: "13px" }, children: "Belum ada pembelian yang perlu dibayar." })
        ] }) : /* @__PURE__ */ jsx("div", { style: {
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "12px",
          overflow: "hidden"
        }, children: debtOrders.map((order, idx) => {
          var _a, _b, _c;
          const val = calcOrderValue(order);
          const ct = CHICKEN_LABELS[order.chicken_type] ?? order.chicken_type;
          return /* @__PURE__ */ jsxs(
            "div",
            {
              style: {
                padding: "12px 16px",
                borderBottom: idx < debtOrders.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              },
              children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsxs("div", { style: { fontSize: "13px", fontWeight: 600, color: "#E2E8F0" }, children: [
                    ct,
                    " — ",
                    (_a = order.requested_count) == null ? void 0 : _a.toLocaleString("id-ID"),
                    " ekor"
                  ] }),
                  /* @__PURE__ */ jsxs("div", { style: { fontSize: "11px", color: "#4B6478", marginTop: "2px" }, children: [
                    ((_b = order.tenants) == null ? void 0 : _b.business_name) ?? "Broker belum terisi",
                    " • ",
                    fmtDate$3(order.requested_date)
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { style: { textAlign: "right" }, children: [
                  /* @__PURE__ */ jsx("div", { style: { fontSize: "13px", fontWeight: 700, color: "#F59E0B" }, children: fmt$3(val) }),
                  /* @__PURE__ */ jsxs("div", { style: { fontSize: "11px", color: "#4B6478", marginTop: "1px" }, children: [
                    (_c = order.requested_weight_kg) == null ? void 0 : _c.toLocaleString("id-ID"),
                    " kg"
                  ] })
                ] })
              ]
            },
            order.id
          );
        }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { style: { fontSize: "14px", fontWeight: 600, color: "#94A3B8", marginBottom: "12px" }, children: "Riwayat Pembayaran" }),
        isLoading ? /* @__PURE__ */ jsx("div", { style: { height: "100px", borderRadius: "12px", background: "rgba(255,255,255,0.03)", animation: "pulse 1.5s infinite" } }) : payments.length === 0 ? /* @__PURE__ */ jsx("div", { style: {
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "12px",
          padding: "24px",
          textAlign: "center"
        }, children: /* @__PURE__ */ jsx("p", { style: { color: "#4B6478", fontSize: "13px" }, children: "Belum ada pembayaran yang dicatat." }) }) : /* @__PURE__ */ jsx("div", { style: {
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "12px",
          overflow: "hidden"
        }, children: payments.map((p, idx) => {
          var _a;
          const method = PAYMENT_METHODS$2.find((m) => m.value === p.payment_method);
          return /* @__PURE__ */ jsxs(
            "div",
            {
              style: {
                padding: "12px 16px",
                borderBottom: idx < payments.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              },
              children: [
                /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "10px" }, children: [
                  /* @__PURE__ */ jsx("div", { style: {
                    width: "34px",
                    height: "34px",
                    borderRadius: "8px",
                    background: "rgba(2, 26, 2,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px"
                  }, children: (method == null ? void 0 : method.icon) ?? "💰" }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("div", { style: { fontSize: "13px", fontWeight: 600, color: "#E2E8F0" }, children: ((_a = p.tenants) == null ? void 0 : _a.business_name) ?? "Broker" }),
                    /* @__PURE__ */ jsxs("div", { style: { fontSize: "11px", color: "#4B6478", marginTop: "1px" }, children: [
                      (method == null ? void 0 : method.label) ?? p.payment_method,
                      " • ",
                      fmtDate$3(p.created_at)
                    ] }),
                    p.reference_no && /* @__PURE__ */ jsxs("div", { style: { fontSize: "11px", color: "#4B6478" }, children: [
                      "Ref: ",
                      p.reference_no
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsx("div", { style: { fontSize: "14px", fontWeight: 700, color: "#021a02" }, children: fmt$3(p.amount) })
              ]
            },
            p.id
          );
        }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx(CatatPembayaranSheet, { open: sheetOpen, onClose: closeSheet, brokers })
  ] });
}
const FALLBACK_STARTER_LIMIT = FALLBACK_TRANSACTION_QUOTA;
function useRPATransactionQuota(tenant) {
  var _a;
  const sub = getSubscriptionStatus(tenant);
  const isStarter = sub.status !== "active" && sub.status !== "trial";
  const { data: configs = {} } = usePlanConfigs();
  const limit = ((_a = configs == null ? void 0 : configs.transaction_quota) == null ? void 0 : _a.starter) ?? FALLBACK_STARTER_LIMIT;
  const now = /* @__PURE__ */ new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const { data: used = 0, isLoading } = useQuery({
    queryKey: ["rpa-transaction-quota", tenant == null ? void 0 : tenant.id, now.getFullYear(), now.getMonth()],
    queryFn: async () => {
      const { count, error } = await supabase.from("rpa_invoices").select("id", { count: "exact", head: true }).eq("tenant_id", tenant.id).eq("is_deleted", false).gte("transaction_date", firstOfMonth);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!(tenant == null ? void 0 : tenant.id) && isStarter,
    staleTime: 6e4
  });
  if (!isStarter) {
    return { used: 0, limit: null, remaining: null, isAtLimit: false, isStarter: false, isLoading: false };
  }
  const remaining = Math.max(0, limit - used);
  return {
    used,
    limit,
    remaining,
    isAtLimit: used >= limit,
    isStarter: true,
    isLoading
  };
}
const INVOICE_STATUS_TABS = [
  { key: "all", label: "Semua" },
  { key: "belum_lunas", label: "Belum Lunas" },
  { key: "sebagian", label: "Sebagian" },
  { key: "lunas", label: "Lunas" },
  { key: "overdue", label: "Jatuh Tempo" }
];
const STATUS_CONFIG$1 = {
  lunas: { label: "Lunas", color: "#021a02", bg: "rgba(2, 26, 2,0.12)" },
  sebagian: { label: "Sebagian", color: "#60A5FA", bg: "rgba(96,165,250,0.12)" },
  belum_lunas: { label: "Belum Lunas", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" }
};
const CUSTOMER_TYPES$1 = [
  { value: "toko", label: "Toko" },
  { value: "supermarket", label: "Supermarket" },
  { value: "restoran", label: "Restoran" },
  { value: "warung", label: "Warung" },
  { value: "pengepul", label: "Pengepul" },
  { value: "lainnya", label: "Lainnya" }
];
const PRODUCT_TYPES = [
  { value: "karkas", label: "Karkas" },
  { value: "fillet", label: "Fillet" },
  { value: "potongan", label: "Potongan" },
  { value: "jeroan", label: "Jeroan" },
  { value: "lainnya", label: "Lainnya" }
];
const PAYMENT_METHODS$1 = [
  { value: "cash", label: "Tunai" },
  { value: "transfer", label: "Transfer" },
  { value: "qris", label: "QRIS" },
  { value: "giro", label: "Giro" }
];
const fmt$2 = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n || 0);
const fmtDate$2 = (d) => {
  if (!d) return "-";
  try {
    return format(new Date(d), "d MMM yyyy", { locale: id });
  } catch {
    return d;
  }
};
const isOverdue$1 = (inv) => inv.payment_status !== "lunas" && inv.due_date && isAfter(/* @__PURE__ */ new Date(), new Date(inv.due_date));
const emptyItem = () => ({
  _id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
  product_id: "",
  product_name: "",
  quantity_kg: "",
  price_per_kg: "",
  cost_per_kg: ""
});
const inputBase$1 = (hasError) => ({
  width: "100%",
  height: "48px",
  // h-12
  padding: "0 16px",
  background: "#111C24",
  border: `1px solid ${hasError ? "#EF4444" : "rgba(255,255,255,0.1)"}`,
  borderRadius: "12px",
  // rounded-xl
  color: "#FFFFFF",
  fontSize: "16px",
  // text-base
  outline: "none",
  fontFamily: "inherit",
  transition: "all 0.2s"
});
const labelStyle$1 = {
  fontSize: "11px",
  fontWeight: "900",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "#4B6478",
  fontFamily: "Sora, sans-serif",
  display: "block",
  marginBottom: "6px"
};
function StatusBadge$1({ status, overdue }) {
  const cfg = overdue && status !== "lunas" ? { label: "Jatuh Tempo", color: "#EF4444", bg: "rgba(239,68,68,0.12)" } : STATUS_CONFIG$1[status] ?? { label: status, color: "#94A3B8", bg: "rgba(148,163,184,0.12)" };
  return /* @__PURE__ */ jsxs("span", { style: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    background: cfg.bg,
    color: cfg.color,
    padding: "3px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: 700
  }, children: [
    overdue && status !== "lunas" && /* @__PURE__ */ jsx(AlertTriangle, { size: 10 }),
    cfg.label
  ] });
}
function CustomerTypeBadge({ type }) {
  var _a;
  const label = ((_a = CUSTOMER_TYPES$1.find((t) => t.value === type)) == null ? void 0 : _a.label) ?? type;
  return /* @__PURE__ */ jsx("span", { style: {
    background: "rgba(167,139,250,0.12)",
    color: "#A78BFA",
    padding: "2px 8px",
    borderRadius: "8px",
    fontSize: "11px",
    fontWeight: 600
  }, children: label });
}
function InvoiceCard({ inv, onPay, _onDetail, onPrintInvoice }) {
  var _a;
  const od = isOverdue$1(inv);
  return /* @__PURE__ */ jsxs("div", { style: {
    background: "rgba(255,255,255,0.03)",
    border: `1px solid ${od && inv.payment_status !== "lunas" ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.06)"}`,
    borderRadius: "14px",
    padding: "14px"
  }, children: [
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" }, children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { style: { fontFamily: "monospace", fontSize: "12px", color: "#F59E0B", fontWeight: 700 }, children: inv.invoice_number }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: "14px", fontWeight: 600, color: "#F1F5F9", marginTop: "2px" }, children: inv.customer_name ?? ((_a = inv.rpa_customers) == null ? void 0 : _a.customer_name) }),
        /* @__PURE__ */ jsxs("div", { style: { fontSize: "12px", color: "#4B6478", marginTop: "2px" }, children: [
          fmtDate$2(inv.transaction_date),
          inv.due_date && /* @__PURE__ */ jsxs("span", { style: { marginLeft: "8px", color: od ? "#EF4444" : "#4B6478" }, children: [
            "Jatuh: ",
            fmtDate$2(inv.due_date)
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx(StatusBadge$1, { status: inv.payment_status, overdue: od })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: {
      marginTop: "12px",
      paddingTop: "10px",
      borderTop: "1px solid rgba(255,255,255,0.05)",
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "8px"
    }, children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: "11px", color: "#4B6478" }, children: "Total" }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: "13px", fontWeight: 700, color: "#F1F5F9" }, children: fmt$2(inv.total_amount) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: "11px", color: "#4B6478" }, children: "Dibayar" }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: "13px", fontWeight: 700, color: "#021a02" }, children: fmt$2(inv.paid_amount) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: "11px", color: "#4B6478" }, children: "Sisa" }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: "13px", fontWeight: 700, color: "#F59E0B" }, children: fmt$2(inv.remaining_amount ?? inv.total_amount - inv.paid_amount) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: "8px", marginTop: "10px" }, children: [
      inv.payment_status !== "lunas" && /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => onPay(inv),
          style: {
            flex: 1,
            padding: "8px",
            background: "#F59E0B",
            border: "none",
            borderRadius: "9px",
            color: "#0D1117",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer"
          },
          children: "Catat Pembayaran"
        }
      ),
      onPrintInvoice && /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => onPrintInvoice(inv),
          style: {
            flex: inv.payment_status !== "lunas" ? "0 0 auto" : 1,
            padding: "8px 12px",
            background: "transparent",
            border: "1px solid rgba(245,158,11,0.35)",
            borderRadius: "9px",
            color: "#F59E0B",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px"
          },
          children: [
            /* @__PURE__ */ jsx(Download, { size: 13 }),
            "Invoice PDF"
          ]
        }
      )
    ] })
  ] });
}
function CreateInvoiceSheet({ open, onClose, customers, products }) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const createInvoice = useCreateInvoice();
  const [form, setForm] = useState({
    customer_id: "",
    transaction_date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
    due_date: "",
    notes: ""
  });
  const [items, setItems] = useState([emptyItem()]);
  const [errors, setErrors] = useState({});
  const selectedCustomer = customers.find((c) => c.id === form.customer_id);
  function handleCustomerChange(val) {
    const customer = customers.find((c) => c.id === val);
    const newDueDate = form.transaction_date && (customer == null ? void 0 : customer.payment_terms) ? format(addDays(parseISO(form.transaction_date), Number(customer.payment_terms)), "yyyy-MM-dd") : form.due_date;
    setForm((prev) => ({ ...prev, customer_id: val, due_date: newDueDate }));
  }
  function handleDateChange(date) {
    const customer = customers.find((c) => c.id === form.customer_id);
    const newDueDate = date && (customer == null ? void 0 : customer.payment_terms) ? format(addDays(parseISO(date), Number(customer.payment_terms)), "yyyy-MM-dd") : form.due_date;
    setForm((prev) => ({ ...prev, transaction_date: date, due_date: newDueDate }));
  }
  function handleItemProductSelect(itemId, productId) {
    const product = products.find((p) => p.id === productId);
    setItems((prev) => prev.map((it) => it._id !== itemId ? it : {
      ...it,
      product_id: productId,
      product_name: (product == null ? void 0 : product.product_name) ?? "",
      price_per_kg: (product == null ? void 0 : product.sell_price) ?? it.price_per_kg,
      cost_per_kg: (product == null ? void 0 : product.cost_price) ?? it.cost_per_kg
    }));
  }
  function updateItem(itemId, field, value) {
    setItems((prev) => prev.map((it) => it._id !== itemId ? it : { ...it, [field]: value }));
  }
  const totals = useMemo(() => {
    const totalAmount = items.reduce((s, it) => s + Math.round((Number(it.quantity_kg) || 0) * (Number(it.price_per_kg) || 0)), 0);
    const totalCost = items.reduce((s, it) => s + Math.round((Number(it.quantity_kg) || 0) * (Number(it.cost_per_kg) || 0)), 0);
    return { totalAmount, totalCost, grossProfit: totalAmount - totalCost };
  }, [items]);
  function validate() {
    const e = {};
    if (!form.customer_id) e.customer_id = "Pilih toko";
    if (!form.transaction_date) e.transaction_date = "Isi tanggal";
    const validItems = items.filter((it) => it.product_name && Number(it.quantity_kg) > 0);
    if (validItems.length === 0) e.items = "Minimal satu item";
    setErrors(e);
    return Object.keys(e).length === 0;
  }
  function handleSubmit() {
    if (!validate()) return;
    const validItems = items.filter((it) => it.product_name && Number(it.quantity_kg) > 0);
    const customer = customers.find((c) => c.id === form.customer_id);
    createInvoice.mutate({
      customer_id: form.customer_id,
      customer_name: (customer == null ? void 0 : customer.customer_name) ?? "",
      transaction_date: form.transaction_date,
      due_date: form.due_date || null,
      items: validItems.map((it) => ({
        product_id: it.product_id || null,
        product_name: it.product_name,
        quantity_kg: Number(it.quantity_kg),
        price_per_kg: Number(it.price_per_kg),
        cost_per_kg: Number(it.cost_per_kg) || 0
      })),
      notes: form.notes || null
    }, {
      onSuccess: () => {
        setForm({ customer_id: "", transaction_date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), due_date: "", notes: "" });
        setItems([emptyItem()]);
        setErrors({});
        onClose();
      }
    });
  }
  return /* @__PURE__ */ jsx(Sheet, { open, onOpenChange: (v) => {
    if (!v) onClose();
  }, children: /* @__PURE__ */ jsxs(
    SheetContent,
    {
      side: isDesktop ? "right" : "bottom",
      className: "p-0 border-none bg-[#0D1117] flex flex-col",
      style: {
        ...isDesktop ? { width: "520px", maxWidth: "100vw" } : { maxHeight: "calc(100dvh - 64px)", borderRadius: "20px 20px 0 0" }
      },
      children: [
        /* @__PURE__ */ jsxs("div", { className: "sticky top-0 bg-[#0C1319] z-20 px-5 pt-5 pb-4 border-b border-white/10 flex items-center justify-between", children: [
          /* @__PURE__ */ jsx(SheetTitle, { className: "text-base font-bold text-white font-display", children: "Buat Invoice Baru" }),
          /* @__PURE__ */ jsx("button", { onClick: onClose, className: "w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center active:bg-white/10", children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4 text-[#4B6478]" }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto p-5 pb-10 flex flex-col gap-6", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { htmlFor: "inv-customer", style: labelStyle$1, children: [
              "TOKO / PELANGGAN ",
              /* @__PURE__ */ jsx("span", { style: { color: "#EF4444" }, children: "*" })
            ] }),
            /* @__PURE__ */ jsxs(
              Select,
              {
                value: form.customer_id,
                onValueChange: handleCustomerChange,
                children: [
                  /* @__PURE__ */ jsx(SelectTrigger, { style: inputBase$1(!!errors.customer_id), children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "— Pilih toko —" }) }),
                  /* @__PURE__ */ jsx(SelectContent, { className: "bg-[#162230] border border-white/10 rounded-xl", children: customers.map((c) => /* @__PURE__ */ jsx(
                    SelectItem,
                    {
                      value: c.id,
                      className: "text-white hover:bg-white/5 focus:bg-white/5 rounded-lg",
                      children: c.customer_name
                    },
                    c.id
                  )) })
                ]
              }
            ),
            customers.length === 0 && /* @__PURE__ */ jsx("p", { style: { fontSize: "12px", color: "#F59E0B", marginTop: "4px" }, children: 'Belum ada toko. Tambah toko di tab "Toko & Produk" terlebih dahulu.' }),
            errors.customer_id && /* @__PURE__ */ jsx("p", { style: { fontSize: "12px", color: "#EF4444", marginTop: "3px" }, children: errors.customer_id }),
            selectedCustomer && /* @__PURE__ */ jsxs("div", { style: {
              marginTop: "6px",
              padding: "8px 12px",
              background: "rgba(245,158,11,0.05)",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#94A3B8",
              display: "flex",
              gap: "12px"
            }, children: [
              /* @__PURE__ */ jsx(CustomerTypeBadge, { type: selectedCustomer.customer_type }),
              selectedCustomer.payment_terms && /* @__PURE__ */ jsxs("span", { children: [
                "Tempo: ",
                selectedCustomer.payment_terms,
                " hari"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("label", { style: labelStyle$1, children: [
                "TANGGAL INVOICE ",
                /* @__PURE__ */ jsx("span", { style: { color: "#EF4444" }, children: "*" })
              ] }),
              /* @__PURE__ */ jsx(
                DatePicker,
                {
                  value: form.transaction_date,
                  onChange: handleDateChange,
                  placeholder: "Pilih tanggal",
                  className: "h-12 text-base"
                }
              ),
              errors.transaction_date && /* @__PURE__ */ jsx("p", { style: { fontSize: "11px", color: "#EF4444", marginTop: "3px" }, children: errors.transaction_date })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { style: labelStyle$1, children: "JATUH TEMPO" }),
              /* @__PURE__ */ jsx(
                DatePicker,
                {
                  value: form.due_date,
                  onChange: (v) => setForm((prev) => ({ ...prev, due_date: v })),
                  placeholder: "Otomatis",
                  className: "h-12 text-base"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }, children: [
              /* @__PURE__ */ jsxs("label", { style: { ...labelStyle$1, margin: 0 }, children: [
                "Item Produk ",
                /* @__PURE__ */ jsx("span", { style: { color: "#EF4444" }, children: "*" })
              ] }),
              /* @__PURE__ */ jsxs("span", { style: { fontSize: "11px", color: "#4B6478" }, children: [
                items.length,
                " item"
              ] })
            ] }),
            errors.items && /* @__PURE__ */ jsx("p", { style: { fontSize: "12px", color: "#EF4444", marginBottom: "6px" }, children: errors.items }),
            /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: "10px" }, children: items.map((item, idx) => {
              const subtotal = Math.round((Number(item.quantity_kg) || 0) * (Number(item.price_per_kg) || 0));
              return /* @__PURE__ */ jsxs("div", { style: {
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                padding: "12px"
              }, children: [
                /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: "8px", marginBottom: "8px" }, children: [
                  /* @__PURE__ */ jsxs("div", { style: { flex: 1 }, children: [
                    /* @__PURE__ */ jsx("label", { htmlFor: `pname-${item._id}`, style: labelStyle$1, children: "PRODUK" }),
                    /* @__PURE__ */ jsxs(
                      Select,
                      {
                        value: item.product_id,
                        onValueChange: (val) => handleItemProductSelect(item._id, val),
                        children: [
                          /* @__PURE__ */ jsx(SelectTrigger, { style: inputBase$1(false), children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "— Pilih produk —" }) }),
                          /* @__PURE__ */ jsxs(SelectContent, { className: "bg-[#162230] border border-white/10 rounded-xl", children: [
                            /* @__PURE__ */ jsx(SelectItem, { value: "__manual__", className: "text-[#4B6478]", children: "Ketik manual..." }),
                            products.map((p) => /* @__PURE__ */ jsx(SelectItem, { value: p.id, className: "text-white hover:bg-white/5 rounded-lg", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between w-full gap-3", children: [
                              /* @__PURE__ */ jsx("span", { children: p.product_name }),
                              /* @__PURE__ */ jsxs("span", { className: "text-[11px] text-[#4B6478]", children: [
                                "HPP: ",
                                fmt$2(p.cost_price)
                              ] })
                            ] }) }, p.id))
                          ] })
                        ]
                      }
                    ),
                    item.product_id && /* @__PURE__ */ jsx(
                      "input",
                      {
                        id: `pname-manual-${item._id}`,
                        name: `product_name_manual_${idx}`,
                        type: "text",
                        value: item.product_name,
                        onChange: (e) => updateItem(item._id, "product_name", e.target.value),
                        placeholder: "Nama tampilan",
                        style: { ...inputBase$1(false), marginTop: "6px", fontSize: "12px" }
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => setItems((prev) => prev.filter((it) => it._id !== item._id)),
                      disabled: items.length === 1,
                      style: {
                        marginTop: "18px",
                        width: "30px",
                        height: "30px",
                        borderRadius: "8px",
                        background: "rgba(239,68,68,0.1)",
                        border: "1px solid rgba(239,68,68,0.2)",
                        color: "#EF4444",
                        cursor: items.length === 1 ? "not-allowed" : "pointer",
                        opacity: items.length === 1 ? 0.4 : 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      },
                      children: /* @__PURE__ */ jsx(X, { size: 14 })
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }, children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("label", { htmlFor: `qty-${item._id}`, style: labelStyle$1, children: "Qty (kg)" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        id: `qty-${item._id}`,
                        name: `qty_${idx}`,
                        type: "number",
                        step: "0.5",
                        min: "0",
                        value: item.quantity_kg,
                        onChange: (e) => updateItem(item._id, "quantity_kg", e.target.value),
                        placeholder: "0",
                        style: inputBase$1(false)
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("label", { htmlFor: `price-${item._id}`, style: labelStyle$1, children: "Harga/kg" }),
                    /* @__PURE__ */ jsx(
                      InputRupiah,
                      {
                        id: `price-${item._id}`,
                        name: `price_${idx}`,
                        value: item.price_per_kg,
                        onChange: (v) => updateItem(item._id, "price_per_kg", v),
                        placeholder: "0"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("label", { htmlFor: `cost-${item._id}`, style: labelStyle$1, children: "HPP/kg" }),
                    /* @__PURE__ */ jsx(
                      InputRupiah,
                      {
                        id: `cost-${item._id}`,
                        name: `cost_${idx}`,
                        value: item.cost_per_kg,
                        onChange: (v) => updateItem(item._id, "cost_per_kg", v),
                        placeholder: "0"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("div", { style: labelStyle$1, children: "Subtotal" }),
                    /* @__PURE__ */ jsx("div", { style: {
                      padding: "9px 8px",
                      background: "rgba(245,158,11,0.05)",
                      borderRadius: "10px",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#F59E0B"
                    }, children: subtotal > 0 ? fmt$2(subtotal).replace("Rp", "").trim() : "-" })
                  ] })
                ] })
              ] }, item._id);
            }) }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setItems((prev) => [...prev, emptyItem()]),
                style: {
                  marginTop: "8px",
                  width: "100%",
                  padding: "8px",
                  background: "transparent",
                  border: "1px dashed rgba(245,158,11,0.4)",
                  borderRadius: "10px",
                  color: "#F59E0B",
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px"
                },
                children: [
                  /* @__PURE__ */ jsx(Plus, { size: 14 }),
                  "Tambah Item"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { style: {
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "12px",
            padding: "12px"
          }, children: [
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: "6px" }, children: [
              /* @__PURE__ */ jsx("span", { style: { fontSize: "13px", color: "#94A3B8" }, children: "Total Revenue" }),
              /* @__PURE__ */ jsx("span", { style: { fontSize: "14px", fontWeight: 700, color: "#F1F5F9" }, children: fmt$2(totals.totalAmount) })
            ] }),
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: "6px" }, children: [
              /* @__PURE__ */ jsx("span", { style: { fontSize: "13px", color: "#64748B" }, children: "Total HPP" }),
              /* @__PURE__ */ jsx("span", { style: { fontSize: "13px", color: "#64748B" }, children: fmt$2(totals.totalCost) })
            ] }),
            /* @__PURE__ */ jsxs("div", { style: {
              display: "flex",
              justifyContent: "space-between",
              paddingTop: "8px",
              borderTop: "1px solid rgba(255,255,255,0.05)"
            }, children: [
              /* @__PURE__ */ jsx("span", { style: { fontSize: "13px", color: "#94A3B8", fontWeight: 600 }, children: "Gross Profit" }),
              /* @__PURE__ */ jsx("span", { style: {
                fontSize: "14px",
                fontWeight: 700,
                color: totals.grossProfit >= 0 ? "#021a02" : "#EF4444"
              }, children: fmt$2(totals.grossProfit) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "inv-notes", style: labelStyle$1, children: "CATATAN (OPSIONAL)" }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                id: "inv-notes",
                name: "notes",
                value: form.notes,
                onChange: (e) => setForm((prev) => ({ ...prev, notes: e.target.value })),
                rows: 2,
                placeholder: "Catatan tambahan...",
                style: { ...inputBase$1(false), height: "auto", minHeight: "80px", padding: "12px 16px", resize: "none" }
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "sticky bottom-0 bg-[#0C1319] px-5 pt-3 pb-[calc(16px+env(safe-area-inset-bottom))] border-t border-white/10 z-20", children: /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: handleSubmit,
            disabled: createInvoice.isPending,
            className: "w-full h-12 bg-emerald-500 rounded-xl font-bold text-white text-sm shadow-[0_8px_24px_rgba(2, 26, 2,0.25)] active:scale-[0.97] transition-transform disabled:opacity-50",
            children: createInvoice.isPending ? "Menyimpan..." : "Simpan Invoice"
          }
        ) })
      ]
    }
  ) });
}
function RecordPaymentSheet$1({ invoice, onClose }) {
  var _a;
  const recordPayment = useRecordCustomerPayment();
  const [amount, setAmount] = useState(
    invoice ? invoice.remaining_amount ?? invoice.total_amount - invoice.paid_amount : ""
  );
  const [method, setMethod] = useState("transfer");
  const [refNo, setRefNo] = useState("");
  const [payDate, setPayDate] = useState((/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
  const [notes, _setNotes] = useState("");
  useEffect(() => {
    if (invoice) {
      setAmount(invoice.remaining_amount ?? invoice.total_amount - invoice.paid_amount);
    }
  }, [invoice]);
  if (!invoice) return null;
  const remaining = invoice.remaining_amount ?? invoice.total_amount - invoice.paid_amount;
  const afterPay = Math.max(0, remaining - (Number(amount) || 0));
  function handleSubmit() {
    if (!amount || Number(amount) <= 0) return;
    recordPayment.mutate({
      invoice_id: invoice.id,
      customer_id: invoice.customer_id,
      amount: Number(amount),
      payment_date: payDate,
      payment_method: method,
      reference_no: refNo || null,
      notes: notes || null
    }, { onSuccess: onClose });
  }
  return /* @__PURE__ */ jsx(Sheet, { open: !!invoice, onOpenChange: (v) => {
    if (!v) onClose();
  }, children: /* @__PURE__ */ jsxs(
    SheetContent,
    {
      side: "bottom",
      className: "p-0 border-none bg-[#0D1117] flex flex-col",
      style: { maxHeight: "calc(100dvh - 64px)", borderRadius: "20px 20px 0 0" },
      children: [
        /* @__PURE__ */ jsxs("div", { className: "sticky top-0 bg-[#0C1319] z-20 px-5 pt-5 pb-4 border-b border-white/10 flex items-center justify-between", children: [
          /* @__PURE__ */ jsx(SheetTitle, { className: "text-base font-bold text-white font-display", children: "Catat Pembayaran" }),
          /* @__PURE__ */ jsx("button", { onClick: onClose, className: "w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center active:bg-white/10", children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4 text-[#4B6478]" }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto p-5 pb-10 flex flex-col gap-5", children: [
          /* @__PURE__ */ jsxs("div", { style: {
            padding: "12px",
            background: "rgba(245,158,11,0.05)",
            border: "1px solid rgba(245,158,11,0.15)",
            borderRadius: "10px"
          }, children: [
            /* @__PURE__ */ jsx("div", { style: { fontSize: "12px", fontFamily: "monospace", color: "#F59E0B" }, children: invoice.invoice_number }),
            /* @__PURE__ */ jsx("div", { style: { fontSize: "14px", fontWeight: 600, color: "#F1F5F9", marginTop: "2px" }, children: invoice.customer_name ?? ((_a = invoice.rpa_customers) == null ? void 0 : _a.customer_name) }),
            /* @__PURE__ */ jsxs("div", { style: { fontSize: "12px", color: "#4B6478", marginTop: "4px" }, children: [
              "Sisa tagihan: ",
              /* @__PURE__ */ jsx("span", { style: { color: "#F59E0B", fontWeight: 700 }, children: fmt$2(remaining) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { htmlFor: "pay-amount", style: labelStyle$1, children: [
              "JUMLAH BAYAR ",
              /* @__PURE__ */ jsx("span", { style: { color: "#EF4444" }, children: "*" })
            ] }),
            /* @__PURE__ */ jsx(InputRupiah, { id: "pay-amount", name: "amount", value: amount, onChange: setAmount, placeholder: "0" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { style: labelStyle$1, children: "METODE PEMBAYARAN" }),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-2", children: PAYMENT_METHODS$1.map((m) => /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setMethod(m.value),
                style: {
                  padding: "10px 4px",
                  borderRadius: "10px",
                  border: `1px solid ${method === m.value ? "#F59E0B" : "rgba(255,255,255,0.08)"}`,
                  background: method === m.value ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.03)",
                  color: method === m.value ? "#F59E0B" : "#64748B",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: method === m.value ? 700 : 400
                },
                children: m.label
              },
              m.value
            )) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-5", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "pay-ref", style: labelStyle$1, children: "NO. BUKTI (OPSIONAL)" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "pay-ref",
                  name: "reference_no",
                  type: "text",
                  value: refNo,
                  onChange: (e) => setRefNo(e.target.value),
                  placeholder: "Ref transfer, nota",
                  style: inputBase$1(false)
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { style: labelStyle$1, children: "TANGGAL BAYAR" }),
              /* @__PURE__ */ jsx(DatePicker, { value: payDate, onChange: setPayDate, className: "h-12 text-base" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { style: {
            padding: "12px 16px",
            background: "rgba(2, 26, 2,0.05)",
            border: "1px solid rgba(2, 26, 2,0.15)",
            borderRadius: "12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }, children: [
            /* @__PURE__ */ jsx("span", { style: { fontSize: "14px", color: "#94A3B8" }, children: "Sisa setelah bayar" }),
            /* @__PURE__ */ jsx("span", { style: { fontSize: "16px", fontWeight: 700, color: afterPay === 0 ? "#021a02" : "#F59E0B" }, children: afterPay === 0 ? "LUNAS 🎉" : fmt$2(afterPay) })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "sticky bottom-0 bg-[#0C1319] px-5 pt-3 pb-[calc(16px+env(safe-area-inset-bottom))] border-t border-white/10 z-20", children: /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: handleSubmit,
            disabled: recordPayment.isPending || !amount || Number(amount) <= 0,
            className: "w-full h-12 bg-emerald-500 rounded-xl font-bold text-white text-sm shadow-[0_8px_24px_rgba(2, 26, 2,0.25)] active:scale-[0.97] transition-transform disabled:opacity-50",
            children: recordPayment.isPending ? "Menyimpan..." : "Konfirmasi Pembayaran"
          }
        ) })
      ]
    }
  ) });
}
function CustomerFormSheet({ open, customer, onClose }) {
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const isEdit = !!customer;
  const [form, setForm] = useState({
    customer_name: (customer == null ? void 0 : customer.customer_name) ?? "",
    customer_type: (customer == null ? void 0 : customer.customer_type) ?? "toko",
    phone: (customer == null ? void 0 : customer.phone) ?? "",
    address: (customer == null ? void 0 : customer.address) ?? "",
    payment_terms: (customer == null ? void 0 : customer.payment_terms) ?? 14,
    credit_limit: (customer == null ? void 0 : customer.credit_limit) ?? "",
    reliability: (customer == null ? void 0 : customer.reliability) ?? 5
  });
  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));
  function handleSubmit() {
    if (!form.customer_name.trim()) return;
    const payload = {
      customer_name: form.customer_name.trim(),
      customer_type: form.customer_type,
      phone: form.phone || null,
      address: form.address || null,
      payment_terms: Number(form.payment_terms) || null,
      credit_limit: form.credit_limit ? Number(form.credit_limit) : null,
      reliability: Number(form.reliability)
    };
    if (isEdit) {
      updateCustomer.mutate({ id: customer.id, updates: payload }, { onSuccess: onClose });
    } else {
      createCustomer.mutate(payload, { onSuccess: onClose });
    }
  }
  const isPending = createCustomer.isPending || updateCustomer.isPending;
  return /* @__PURE__ */ jsx(Sheet, { open, onOpenChange: (v) => {
    if (!v) onClose();
  }, children: /* @__PURE__ */ jsxs(
    SheetContent,
    {
      side: "bottom",
      className: "p-0 border-none bg-[#0D1117] flex flex-col",
      style: { maxHeight: "calc(100dvh - 64px)", borderRadius: "20px 20px 0 0" },
      children: [
        /* @__PURE__ */ jsxs("div", { className: "sticky top-0 bg-[#0C1319] z-20 px-5 pt-5 pb-4 border-b border-white/10 flex items-center justify-between", children: [
          /* @__PURE__ */ jsx(SheetTitle, { className: "text-base font-bold text-white font-display", children: isEdit ? "Edit Toko" : "Tambah Toko" }),
          /* @__PURE__ */ jsx("button", { onClick: onClose, className: "w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center active:bg-white/10", children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4 text-[#4B6478]" }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto p-5 pb-10 flex flex-col gap-6", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { htmlFor: "cust-name", style: labelStyle$1, children: [
              "NAMA TOKO ",
              /* @__PURE__ */ jsx("span", { style: { color: "#EF4444" }, children: "*" })
            ] }),
            /* @__PURE__ */ jsx(
              "input",
              {
                id: "cust-name",
                name: "customer_name",
                type: "text",
                value: form.customer_name,
                onChange: (e) => set("customer_name", e.target.value),
                placeholder: "Toko Maju Jaya",
                style: inputBase$1(!form.customer_name)
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-5", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "cust-type", style: labelStyle$1, children: "TIPE PELANGGAN" }),
              /* @__PURE__ */ jsxs(Select, { value: form.customer_type, onValueChange: (v) => set("customer_type", v), children: [
                /* @__PURE__ */ jsx(SelectTrigger, { style: inputBase$1(false), children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Pilih tipe" }) }),
                /* @__PURE__ */ jsx(SelectContent, { className: "bg-[#162230] border border-white/10 rounded-xl", children: CUSTOMER_TYPES$1.map((t) => /* @__PURE__ */ jsx(SelectItem, { value: t.value, className: "text-white hover:bg-white/5 rounded-lg", children: t.label }, t.value)) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "cust-phone", style: labelStyle$1, children: "NO. TELEPON" }),
              /* @__PURE__ */ jsx(
                PhoneInput,
                {
                  id: "cust-phone",
                  name: "phone",
                  value: form.phone,
                  onChange: (v) => set("phone", v),
                  placeholder: "0812...",
                  style: inputBase$1(false)
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "cust-address", style: labelStyle$1, children: "ALAMAT LENGKAP" }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                id: "cust-address",
                name: "address",
                value: form.address,
                onChange: (e) => set("address", e.target.value),
                placeholder: "Jl. Anggrek No. 12...",
                style: { ...inputBase$1(false), height: "auto", minHeight: "80px", padding: "12px 16px", resize: "none" }
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-5", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "cust-terms", style: labelStyle$1, children: "TEMPO BAYAR (HARI)" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "cust-terms",
                  name: "payment_terms",
                  type: "number",
                  min: "0",
                  value: form.payment_terms,
                  onChange: (e) => set("payment_terms", e.target.value),
                  placeholder: "14",
                  style: inputBase$1(false)
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "cust-limit", style: labelStyle$1, children: "CREDIT LIMIT (RP)" }),
              /* @__PURE__ */ jsx(
                InputRupiah,
                {
                  id: "cust-limit",
                  name: "credit_limit",
                  value: form.credit_limit,
                  onChange: (v) => set("credit_limit", v),
                  placeholder: "0"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { style: labelStyle$1, children: "RELIABILITAS (1-5 BINTANG)" }),
            /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: "8px" }, children: [1, 2, 3, 4, 5].map((n) => /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => set("reliability", n),
                style: {
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  border: `1px solid ${n <= form.reliability ? "rgba(245,158,11,0.4)" : "rgba(255,255,255,0.08)"}`,
                  background: n <= form.reliability ? "rgba(245,158,11,0.1)" : "transparent",
                  color: n <= form.reliability ? "#F59E0B" : "#334155",
                  cursor: "pointer",
                  fontSize: "20px"
                },
                children: n <= form.reliability ? "★" : "☆"
              },
              n
            )) })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "sticky bottom-0 bg-[#0C1319] px-5 pt-3 pb-[calc(16px+env(safe-area-inset-bottom))] border-t border-white/10 z-20", children: /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: handleSubmit,
            disabled: isPending,
            className: "w-full h-12 bg-emerald-500 rounded-xl font-bold text-white text-sm shadow-[0_8px_24px_rgba(2, 26, 2,0.25)] active:scale-[0.97] transition-transform disabled:opacity-50",
            children: isPending ? "Menyimpan..." : isEdit ? "Simpan Toko" : "Tambah Toko"
          }
        ) })
      ]
    }
  ) });
}
function ProductFormSheet({ open, onClose }) {
  const createProduct = useCreateProduct();
  const [form, setForm] = useState({
    product_name: "",
    product_type: "karkas",
    sell_price: "",
    cost_price: ""
  });
  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));
  function handleSubmit() {
    if (!form.product_name.trim()) return;
    createProduct.mutate({
      product_name: form.product_name.trim(),
      product_type: form.product_type,
      sell_price: Number(form.sell_price) || 0,
      cost_price: Number(form.cost_price) || 0
    }, {
      onSuccess: () => {
        setForm({ product_name: "", product_type: "karkas", sell_price: "", cost_price: "" });
        onClose();
      }
    });
  }
  const margin = form.sell_price && form.cost_price ? ((Number(form.sell_price) - Number(form.cost_price)) / Number(form.sell_price) * 100).toFixed(1) : null;
  return /* @__PURE__ */ jsx(Sheet, { open, onOpenChange: (v) => {
    if (!v) onClose();
  }, children: /* @__PURE__ */ jsxs(
    SheetContent,
    {
      side: "bottom",
      className: "p-0 border-none bg-[#0D1117] flex flex-col",
      style: { maxHeight: "calc(100dvh - 64px)", borderRadius: "20px 20px 0 0" },
      children: [
        /* @__PURE__ */ jsxs("div", { className: "sticky top-0 bg-[#0C1319] z-20 px-5 pt-5 pb-4 border-b border-white/10 flex items-center justify-between", children: [
          /* @__PURE__ */ jsx(SheetTitle, { className: "text-base font-bold text-white font-display", children: "Tambah Produk" }),
          /* @__PURE__ */ jsx("button", { onClick: onClose, className: "w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center active:bg-white/10", children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4 text-[#4B6478]" }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto p-5 pb-10 flex flex-col gap-6", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { htmlFor: "prod-name", style: labelStyle$1, children: [
              "NAMA PRODUK ",
              /* @__PURE__ */ jsx("span", { style: { color: "#EF4444" }, children: "*" })
            ] }),
            /* @__PURE__ */ jsx(
              "input",
              {
                id: "prod-name",
                name: "product_name",
                type: "text",
                value: form.product_name,
                onChange: (e) => set("product_name", e.target.value),
                placeholder: "Karkas Broiler",
                style: inputBase$1(!form.product_name)
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "prod-type", style: labelStyle$1, children: "JENIS PRODUK" }),
            /* @__PURE__ */ jsxs(Select, { value: form.product_type, onValueChange: (v) => set("product_type", v), children: [
              /* @__PURE__ */ jsx(SelectTrigger, { style: inputBase$1(false), children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Pilih jenis" }) }),
              /* @__PURE__ */ jsx(SelectContent, { className: "bg-[#162230] border border-white/10 rounded-xl", children: PRODUCT_TYPES.map((t) => /* @__PURE__ */ jsx(SelectItem, { value: t.value, className: "text-white hover:bg-white/5 rounded-lg", children: t.label }, t.value)) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-5", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "prod-sell", style: labelStyle$1, children: "HARGA JUAL/KG" }),
              /* @__PURE__ */ jsx(
                InputRupiah,
                {
                  id: "prod-sell",
                  name: "sell_price",
                  value: form.sell_price,
                  onChange: (v) => set("sell_price", v),
                  placeholder: "35.000"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "prod-cost", style: labelStyle$1, children: "HPP/KG" }),
              /* @__PURE__ */ jsx(
                InputRupiah,
                {
                  id: "prod-cost",
                  name: "cost_price",
                  value: form.cost_price,
                  onChange: (v) => set("cost_price", v),
                  placeholder: "28.000"
                }
              )
            ] })
          ] }),
          margin && /* @__PURE__ */ jsxs("div", { style: {
            padding: "12px 16px",
            background: "rgba(2, 26, 2,0.05)",
            border: "1px solid rgba(2, 26, 2,0.15)",
            borderRadius: "12px",
            fontSize: "14px",
            color: "#94A3B8",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }, children: [
            /* @__PURE__ */ jsx("span", { children: "Estimasi Margin" }),
            /* @__PURE__ */ jsxs("span", { style: { color: "#021a02", fontWeight: 700 }, children: [
              margin,
              "%"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "sticky bottom-0 bg-[#0C1319] px-5 pt-3 pb-[calc(16px+env(safe-area-inset-bottom))] border-t border-white/10 z-20", children: /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: handleSubmit,
            disabled: createProduct.isPending,
            className: "w-full h-12 bg-emerald-500 rounded-xl font-bold text-white text-sm shadow-[0_8px_24px_rgba(2, 26, 2,0.25)] active:scale-[0.97] transition-transform disabled:opacity-50",
            children: createProduct.isPending ? "Menyimpan..." : "Tambah Produk"
          }
        ) })
      ]
    }
  ) });
}
function CustomerCard({ customer, outstanding, onClick, onEdit }) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "14px",
        padding: "14px",
        cursor: "pointer"
      },
      onClick,
      children: [
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" }, children: [
          /* @__PURE__ */ jsxs("div", { style: { flex: 1 }, children: [
            /* @__PURE__ */ jsx("div", { style: { fontSize: "14px", fontWeight: 700, color: "#F1F5F9" }, children: customer.customer_name }),
            /* @__PURE__ */ jsxs("div", { style: { marginTop: "4px", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }, children: [
              /* @__PURE__ */ jsx(CustomerTypeBadge, { type: customer.customer_type }),
              customer.phone && /* @__PURE__ */ jsxs("span", { style: { fontSize: "12px", color: "#4B6478", display: "flex", alignItems: "center", gap: "3px" }, children: [
                /* @__PURE__ */ jsx(Phone, { size: 11 }),
                customer.phone
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: (e) => {
                e.stopPropagation();
                onEdit();
              },
              style: {
                width: "30px",
                height: "30px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#64748B",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              },
              children: /* @__PURE__ */ jsx(Pencil, { size: 13 })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { style: {
          marginTop: "10px",
          paddingTop: "10px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }, children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { style: { fontSize: "11px", color: "#4B6478" }, children: "Piutang" }),
            /* @__PURE__ */ jsx("div", { style: { fontSize: "13px", fontWeight: 700, color: outstanding > 0 ? "#F59E0B" : "#4B6478" }, children: outstanding > 0 ? fmt$2(outstanding) : "Lunas" })
          ] }),
          customer.reliability && /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: "2px" }, children: Array.from({ length: 5 }).map((_, i) => /* @__PURE__ */ jsx(
            Star,
            {
              size: 12,
              fill: i < (customer.reliability || 0) ? "#F59E0B" : "transparent",
              color: i < (customer.reliability || 0) ? "#F59E0B" : "#334155"
            },
            i
          )) })
        ] })
      ]
    }
  );
}
const PAGE_SIZE = 20;
function RPADistribusi() {
  const navigate = useNavigate();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const { tenant, profile } = useAuth();
  const quota = useRPATransactionQuota(tenant);
  const [searchParams, setSearchParams] = useSearchParams();
  const [mainTab, setMainTab] = useState("invoice");
  const [subTab, setSubTab] = useState("toko");
  const [invoiceFilter, setInvoiceFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [printingInvoice, setPrintingInvoice] = useState(null);
  const [customerSheet, setCustomerSheet] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [productSheet, setProductSheet] = useState(false);
  const { data: customers = [], isLoading: custLoading } = useRPACustomers();
  const { data: products = [], isLoading: prodLoading } = useRPAProducts();
  const { data: invoices = [], isLoading: invLoading } = useRPAInvoices();
  const invoiceSheetOpen = searchParams.get("action") === "new";
  const openInvoiceSheet = () => setSearchParams({ action: "new" });
  const closeInvoiceSheet = () => setSearchParams({}, { replace: true });
  const outstandingByCustomer = useMemo(() => {
    const map = {};
    invoices.forEach((inv) => {
      if (inv.payment_status !== "lunas" && inv.customer_id) {
        map[inv.customer_id] = (map[inv.customer_id] || 0) + (inv.remaining_amount ?? inv.total_amount - inv.paid_amount);
      }
    });
    return map;
  }, [invoices]);
  const now = /* @__PURE__ */ new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3);
  const stats = useMemo(() => ({
    totalOutstanding: invoices.filter((i) => i.payment_status !== "lunas").reduce((s, i) => s + (i.remaining_amount ?? i.total_amount - i.paid_amount), 0),
    revenueThisMonth: invoices.filter((i) => new Date(i.transaction_date) > thirtyDaysAgo).reduce((s, i) => s + (i.total_amount || 0), 0),
    lunas: invoices.filter((i) => i.payment_status === "lunas").length,
    overdue: invoices.filter((i) => isOverdue$1(i)).length
  }), [invoices]);
  const filtered = useMemo(() => {
    let list = invoices;
    if (invoiceFilter === "overdue") list = list.filter((i) => isOverdue$1(i));
    else if (invoiceFilter !== "all") list = list.filter((i) => i.payment_status === invoiceFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) => (i.customer_name ?? "").toLowerCase().includes(q) || (i.invoice_number ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [invoices, invoiceFilter, search]);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const AddInvoiceButton = /* @__PURE__ */ jsxs(
    motion.button,
    {
      whileTap: quota.isAtLimit ? {} : { scale: 0.95 },
      onClick: () => !quota.isAtLimit && openInvoiceSheet(),
      disabled: quota.isAtLimit,
      title: quota.isAtLimit ? "Kuota invoice bulan ini habis — Upgrade ke Pro" : void 0,
      style: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 14px",
        borderRadius: "10px",
        background: quota.isAtLimit ? "rgba(255,255,255,0.06)" : "#F59E0B",
        border: "none",
        color: quota.isAtLimit ? "#4B6478" : "#0D1117",
        fontWeight: 700,
        fontSize: "13px",
        cursor: quota.isAtLimit ? "not-allowed" : "pointer",
        flexShrink: 0,
        opacity: quota.isAtLimit ? 0.6 : 1
      },
      children: [
        quota.isAtLimit ? /* @__PURE__ */ jsx(Lock, { size: 14 }) : /* @__PURE__ */ jsx(Plus, { size: 15 }),
        quota.isAtLimit ? "Kuota Habis" : isDesktop ? "Buat Invoice" : "Invoice"
      ]
    }
  );
  return /* @__PURE__ */ jsxs("div", { style: { minHeight: "100vh", background: "#06090F" }, children: [
    !isDesktop ? /* @__PURE__ */ jsx(TopBar, { title: "Distribusi", subtitle: "Invoice & Toko", rightAction: mainTab === "invoice" ? AddInvoiceButton : null }) : /* @__PURE__ */ jsxs("div", { style: { padding: "28px 32px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }, children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { style: { fontFamily: "Sora", fontSize: "22px", fontWeight: 700, color: "#F1F5F9" }, children: "Distribusi" }),
        /* @__PURE__ */ jsx("p", { style: { fontSize: "14px", color: "#4B6478", marginTop: "4px" }, children: "Kelola invoice & penjualan ke toko" })
      ] }),
      mainTab === "invoice" && AddInvoiceButton
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { padding: isDesktop ? "20px 32px" : "16px 16px 0" }, children: [
      /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: "4px", marginBottom: "20px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "4px" }, children: [{ key: "invoice", label: "Invoice", icon: FileText }, { key: "toko", label: "Toko & Produk", icon: Store }].map((t) => {
        const Icon = t.icon;
        return /* @__PURE__ */ jsxs("button", { onClick: () => setMainTab(t.key), style: {
          flex: 1,
          padding: "9px",
          borderRadius: "9px",
          background: mainTab === t.key ? "rgba(245,158,11,0.15)" : "transparent",
          border: mainTab === t.key ? "1px solid rgba(245,158,11,0.3)" : "1px solid transparent",
          color: mainTab === t.key ? "#F59E0B" : "#4B6478",
          cursor: "pointer",
          fontSize: "13px",
          fontWeight: mainTab === t.key ? 700 : 400,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px"
        }, children: [
          /* @__PURE__ */ jsx(Icon, { size: 14 }),
          t.label
        ] }, t.key);
      }) }),
      mainTab === "invoice" && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "20px" }, children: [
          { label: "Total Piutang", value: fmt$2(stats.totalOutstanding), color: "#F59E0B", warn: stats.totalOutstanding > 0 },
          { label: "Revenue Bulan Ini", value: fmt$2(stats.revenueThisMonth), color: "#021a02" },
          { label: "Invoice Lunas", value: stats.lunas, color: "#60A5FA" },
          { label: "Jatuh Tempo", value: stats.overdue, color: "#EF4444", warn: stats.overdue > 0 }
        ].map((s) => /* @__PURE__ */ jsxs("div", { style: {
          background: s.warn ? `rgba(${s.color === "#EF4444" ? "239,68,68" : "245,158,11"},0.05)` : "rgba(255,255,255,0.03)",
          border: `1px solid ${s.warn ? s.color === "#EF4444" ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.06)"}`,
          borderRadius: "12px",
          padding: "12px"
        }, children: [
          /* @__PURE__ */ jsx("div", { style: { fontSize: "11px", color: "#4B6478", marginBottom: "4px" }, children: s.label }),
          /* @__PURE__ */ jsx("div", { style: { fontSize: typeof s.value === "number" ? "22px" : "14px", fontWeight: 700, color: s.color }, children: s.value })
        ] }, s.label)) }),
        quota.isStarter && /* @__PURE__ */ jsxs("div", { style: {
          marginBottom: "14px",
          padding: "12px 16px",
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          background: quota.isAtLimit ? "rgba(239,68,68,0.08)" : quota.remaining <= 5 ? "rgba(245,158,11,0.08)" : "rgba(245,158,11,0.06)",
          border: `1px solid ${quota.isAtLimit ? "rgba(239,68,68,0.25)" : quota.remaining <= 5 ? "rgba(245,158,11,0.2)" : "rgba(245,158,11,0.15)"}`
        }, children: [
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }, children: [
            /* @__PURE__ */ jsx("div", { style: {
              width: "28px",
              height: "28px",
              borderRadius: "8px",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: quota.isAtLimit ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.12)",
              fontSize: "13px"
            }, children: quota.isAtLimit ? "🔒" : "📊" }),
            /* @__PURE__ */ jsxs("div", { style: { minWidth: 0 }, children: [
              /* @__PURE__ */ jsx("p", { style: {
                fontSize: "12px",
                fontWeight: 700,
                lineHeight: 1.3,
                color: quota.isAtLimit ? "#F87171" : quota.remaining <= 5 ? "#FBBF24" : "#94A3B8"
              }, children: quota.isAtLimit ? "Kuota invoice bulan ini habis" : `${quota.used} / ${quota.limit} invoice bulan ini` }),
              quota.isAtLimit && /* @__PURE__ */ jsx("p", { style: { fontSize: "11px", color: "#64748B", marginTop: "2px" }, children: "Upgrade ke Pro untuk invoice unlimited" })
            ] })
          ] }),
          !quota.isAtLimit && /* @__PURE__ */ jsxs("div", { style: { width: "80px", flexShrink: 0 }, children: [
            /* @__PURE__ */ jsx("div", { style: { height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "99px", overflow: "hidden" }, children: /* @__PURE__ */ jsx("div", { style: {
              height: "100%",
              borderRadius: "99px",
              transition: "width 0.5s",
              width: `${Math.min(100, quota.used / quota.limit * 100)}%`,
              background: quota.remaining <= 5 ? "#F59E0B" : "#F59E0B"
            } }) }),
            /* @__PURE__ */ jsxs("p", { style: { fontSize: "10px", color: "#4B6478", textAlign: "right", marginTop: "3px" }, children: [
              quota.remaining,
              " sisa"
            ] })
          ] }),
          quota.isAtLimit && /* @__PURE__ */ jsx(
            Link,
            {
              to: "/upgrade",
              style: {
                flexShrink: 0,
                fontSize: "11px",
                fontWeight: 800,
                color: "#F59E0B",
                border: "1px solid rgba(245,158,11,0.3)",
                padding: "6px 12px",
                borderRadius: "8px",
                textDecoration: "none",
                whiteSpace: "nowrap"
              },
              children: "Upgrade"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }, children: [
          /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: "5px", overflowX: "auto", flex: 1 }, children: INVOICE_STATUS_TABS.map((t) => /* @__PURE__ */ jsx("button", { onClick: () => {
            setInvoiceFilter(t.key);
            setPage(0);
          }, style: {
            flexShrink: 0,
            padding: "6px 12px",
            borderRadius: "20px",
            border: invoiceFilter === t.key ? "none" : "1px solid rgba(255,255,255,0.08)",
            background: invoiceFilter === t.key ? "#F59E0B" : "rgba(255,255,255,0.03)",
            color: invoiceFilter === t.key ? "#0D1117" : "#64748B",
            fontSize: "12px",
            fontWeight: invoiceFilter === t.key ? 700 : 400,
            cursor: "pointer",
            whiteSpace: "nowrap"
          }, children: t.label }, t.key)) }),
          /* @__PURE__ */ jsxs("div", { style: { position: "relative", minWidth: "160px" }, children: [
            /* @__PURE__ */ jsx(Search, { size: 14, style: { position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#4B6478" } }),
            /* @__PURE__ */ jsx(
              "input",
              {
                id: "inv-search",
                name: "search",
                type: "text",
                value: search,
                onChange: (e) => {
                  setSearch(e.target.value);
                  setPage(0);
                },
                placeholder: "Cari toko / no. invoice",
                style: {
                  padding: "8px 10px 8px 30px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "10px",
                  color: "#F1F5F9",
                  fontSize: "13px",
                  outline: "none",
                  width: "100%"
                }
              }
            )
          ] })
        ] }),
        invLoading ? /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: "10px" }, children: [1, 2, 3].map((i) => /* @__PURE__ */ jsx("div", { style: { height: "120px", borderRadius: "14px", background: "rgba(255,255,255,0.03)", animation: "pulse 1.5s infinite" } }, i)) }) : paginated.length === 0 ? /* @__PURE__ */ jsxs("div", { style: { textAlign: "center", paddingTop: "60px" }, children: [
          /* @__PURE__ */ jsx(FileText, { size: 40, color: "#1E293B" }),
          /* @__PURE__ */ jsx("p", { style: { color: "#4B6478", marginTop: "12px", fontSize: "14px" }, children: search || invoiceFilter !== "all" ? "Tidak ada invoice sesuai filter." : "Belum ada invoice." }),
          !search && invoiceFilter === "all" && /* @__PURE__ */ jsx(motion.button, { whileTap: { scale: 0.95 }, onClick: openInvoiceSheet, style: {
            marginTop: "14px",
            padding: "10px 20px",
            borderRadius: "10px",
            background: "#F59E0B",
            border: "none",
            color: "#0D1117",
            fontWeight: 700,
            fontSize: "14px",
            cursor: "pointer"
          }, children: "Buat Invoice Pertama" })
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          isDesktop ? (
            /* Desktop Table */
            /* @__PURE__ */ jsx("div", { style: { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", overflow: "hidden" }, children: /* @__PURE__ */ jsxs("table", { style: { width: "100%", borderCollapse: "collapse" }, children: [
              /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { style: { borderBottom: "1px solid rgba(255,255,255,0.06)" }, children: ["Invoice #", "Toko", "Tanggal", "Jatuh Tempo", "Total", "Dibayar", "Sisa", "Status", "Aksi"].map((h) => /* @__PURE__ */ jsx("th", { style: {
                padding: "10px 14px",
                textAlign: "left",
                fontSize: "11px",
                fontWeight: 700,
                color: "#4B6478",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }, children: h }, h)) }) }),
              /* @__PURE__ */ jsx("tbody", { children: paginated.map((inv, idx) => {
                var _a;
                const od = isOverdue$1(inv);
                return /* @__PURE__ */ jsxs("tr", { style: {
                  borderBottom: idx < paginated.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none"
                }, children: [
                  /* @__PURE__ */ jsx("td", { style: { padding: "12px 14px", fontFamily: "monospace", fontSize: "12px", color: "#F59E0B" }, children: inv.invoice_number }),
                  /* @__PURE__ */ jsx("td", { style: { padding: "12px 14px", fontSize: "13px", color: "#E2E8F0", fontWeight: 600 }, children: inv.customer_name ?? ((_a = inv.rpa_customers) == null ? void 0 : _a.customer_name) }),
                  /* @__PURE__ */ jsx("td", { style: { padding: "12px 14px", fontSize: "13px", color: "#94A3B8" }, children: fmtDate$2(inv.transaction_date) }),
                  /* @__PURE__ */ jsx("td", { style: { padding: "12px 14px", fontSize: "13px", color: od ? "#EF4444" : "#94A3B8" }, children: fmtDate$2(inv.due_date) }),
                  /* @__PURE__ */ jsx("td", { style: { padding: "12px 14px", fontSize: "13px", color: "#F1F5F9", fontWeight: 600 }, children: fmt$2(inv.total_amount) }),
                  /* @__PURE__ */ jsx("td", { style: { padding: "12px 14px", fontSize: "13px", color: "#021a02" }, children: fmt$2(inv.paid_amount) }),
                  /* @__PURE__ */ jsx("td", { style: { padding: "12px 14px", fontSize: "13px", color: "#F59E0B", fontWeight: 600 }, children: fmt$2(inv.remaining_amount ?? inv.total_amount - inv.paid_amount) }),
                  /* @__PURE__ */ jsx("td", { style: { padding: "12px 14px" }, children: /* @__PURE__ */ jsx(StatusBadge$1, { status: inv.payment_status, overdue: od }) }),
                  /* @__PURE__ */ jsx("td", { style: { padding: "12px 14px" }, children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: "6px", alignItems: "center" }, children: [
                    inv.payment_status !== "lunas" && /* @__PURE__ */ jsx("button", { onClick: () => setPayingInvoice(inv), style: {
                      padding: "5px 10px",
                      borderRadius: "7px",
                      background: "#F59E0B",
                      border: "none",
                      color: "#0D1117",
                      fontWeight: 700,
                      fontSize: "12px",
                      cursor: "pointer"
                    }, children: "Bayar" }),
                    /* @__PURE__ */ jsxs(
                      "button",
                      {
                        onClick: () => setPrintingInvoice(inv),
                        title: "Invoice PDF",
                        style: {
                          padding: "5px 8px",
                          borderRadius: "7px",
                          background: "transparent",
                          border: "1px solid rgba(245,158,11,0.3)",
                          color: "#F59E0B",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "11px",
                          fontWeight: 600
                        },
                        children: [
                          /* @__PURE__ */ jsx(Download, { size: 12 }),
                          "PDF"
                        ]
                      }
                    )
                  ] }) })
                ] }, inv.id);
              }) })
            ] }) })
          ) : (
            /* Mobile Cards */
            /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: "10px" }, children: paginated.map((inv) => /* @__PURE__ */ jsx(
              InvoiceCard,
              {
                inv,
                onPay: setPayingInvoice,
                onPrintInvoice: setPrintingInvoice
              },
              inv.id
            )) })
          ),
          totalPages > 1 && /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "center", gap: "8px", marginTop: "16px" }, children: [
            /* @__PURE__ */ jsx("button", { onClick: () => setPage((p) => Math.max(0, p - 1)), disabled: page === 0, style: {
              padding: "7px 14px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#94A3B8",
              cursor: page === 0 ? "not-allowed" : "pointer",
              opacity: page === 0 ? 0.4 : 1
            }, children: "‹ Prev" }),
            /* @__PURE__ */ jsxs("span", { style: { padding: "7px 12px", fontSize: "13px", color: "#64748B" }, children: [
              page + 1,
              " / ",
              totalPages
            ] }),
            /* @__PURE__ */ jsx("button", { onClick: () => setPage((p) => Math.min(totalPages - 1, p + 1)), disabled: page >= totalPages - 1, style: {
              padding: "7px 14px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#94A3B8",
              cursor: page >= totalPages - 1 ? "not-allowed" : "pointer",
              opacity: page >= totalPages - 1 ? 0.4 : 1
            }, children: "Next ›" })
          ] })
        ] })
      ] }),
      mainTab === "toko" && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: "4px", marginBottom: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", padding: "3px", width: "fit-content" }, children: [{ key: "toko", label: "Daftar Toko" }, { key: "produk", label: "Produk" }].map((t) => /* @__PURE__ */ jsx("button", { onClick: () => setSubTab(t.key), style: {
          padding: "7px 16px",
          borderRadius: "8px",
          background: subTab === t.key ? "rgba(245,158,11,0.15)" : "transparent",
          border: subTab === t.key ? "1px solid rgba(245,158,11,0.3)" : "1px solid transparent",
          color: subTab === t.key ? "#F59E0B" : "#4B6478",
          cursor: "pointer",
          fontSize: "13px",
          fontWeight: subTab === t.key ? 700 : 400
        }, children: t.label }, t.key)) }),
        subTab === "toko" && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: "8px", marginBottom: "14px" }, children: [
            /* @__PURE__ */ jsxs("div", { style: { position: "relative", flex: 1 }, children: [
              /* @__PURE__ */ jsx(Search, { size: 14, style: { position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#4B6478" } }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "cust-search",
                  name: "cust-search",
                  type: "text",
                  placeholder: "Cari nama toko...",
                  style: { padding: "9px 10px 9px 30px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", color: "#F1F5F9", fontSize: "13px", outline: "none", width: "100%" }
                }
              )
            ] }),
            /* @__PURE__ */ jsxs(motion.button, { whileTap: { scale: 0.95 }, onClick: () => setCustomerSheet(true), style: {
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "10px",
              background: "#F59E0B",
              border: "none",
              color: "#0D1117",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
              flexShrink: 0
            }, children: [
              /* @__PURE__ */ jsx(Plus, { size: 15 }),
              "Tambah Toko"
            ] })
          ] }),
          custLoading ? /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: isDesktop ? "repeat(3, 1fr)" : "1fr", gap: "10px" }, children: [1, 2, 3].map((i) => /* @__PURE__ */ jsx("div", { style: { height: "100px", borderRadius: "14px", background: "rgba(255,255,255,0.03)", animation: "pulse 1.5s infinite" } }, i)) }) : customers.length === 0 ? /* @__PURE__ */ jsxs("div", { style: { textAlign: "center", paddingTop: "60px" }, children: [
            /* @__PURE__ */ jsx(Store, { size: 40, color: "#1E293B" }),
            /* @__PURE__ */ jsx("p", { style: { color: "#4B6478", marginTop: "12px", fontSize: "14px" }, children: "Belum ada toko. Tambah toko pertama." })
          ] }) : /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: isDesktop ? "repeat(3, 1fr)" : "1fr", gap: "10px" }, children: customers.map((c) => /* @__PURE__ */ jsx(
            CustomerCard,
            {
              customer: c,
              outstanding: outstandingByCustomer[c.id] || 0,
              onClick: () => navigate(`/rumah_potong/rpa/distribusi/${c.id}`),
              onEdit: () => setEditingCustomer(c)
            },
            c.id
          )) })
        ] }),
        subTab === "produk" && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { style: { display: "flex", justifyContent: "flex-end", marginBottom: "14px" }, children: /* @__PURE__ */ jsxs(motion.button, { whileTap: { scale: 0.95 }, onClick: () => setProductSheet(true), style: {
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 14px",
            borderRadius: "10px",
            background: "#F59E0B",
            border: "none",
            color: "#0D1117",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer"
          }, children: [
            /* @__PURE__ */ jsx(Plus, { size: 15 }),
            "Tambah Produk"
          ] }) }),
          prodLoading ? /* @__PURE__ */ jsx("div", { style: { height: "100px", borderRadius: "12px", background: "rgba(255,255,255,0.03)", animation: "pulse 1.5s infinite" } }) : products.length === 0 ? /* @__PURE__ */ jsxs("div", { style: { textAlign: "center", paddingTop: "60px" }, children: [
            /* @__PURE__ */ jsx(Package, { size: 40, color: "#1E293B" }),
            /* @__PURE__ */ jsx("p", { style: { color: "#4B6478", marginTop: "12px", fontSize: "14px" }, children: "Belum ada produk." })
          ] }) : /* @__PURE__ */ jsx("div", { style: { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", overflow: "hidden" }, children: products.map((p, idx) => {
            var _a;
            const margin = p.sell_price && p.cost_price ? ((p.sell_price - p.cost_price) / p.sell_price * 100).toFixed(1) : null;
            return /* @__PURE__ */ jsxs("div", { style: {
              padding: "12px 16px",
              borderBottom: idx < products.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }, children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { style: { fontSize: "14px", fontWeight: 600, color: "#E2E8F0" }, children: p.product_name }),
                /* @__PURE__ */ jsx("div", { style: { fontSize: "12px", color: "#4B6478", marginTop: "2px" }, children: ((_a = PRODUCT_TYPES.find((t) => t.value === p.product_type)) == null ? void 0 : _a.label) ?? p.product_type })
              ] }),
              /* @__PURE__ */ jsxs("div", { style: { textAlign: "right" }, children: [
                /* @__PURE__ */ jsxs("div", { style: { fontSize: "13px", fontWeight: 700, color: "#F59E0B" }, children: [
                  fmt$2(p.sell_price),
                  "/kg"
                ] }),
                /* @__PURE__ */ jsxs("div", { style: { fontSize: "11px", color: "#4B6478" }, children: [
                  "HPP: ",
                  fmt$2(p.cost_price),
                  "/kg"
                ] }),
                margin && /* @__PURE__ */ jsxs("div", { style: { fontSize: "11px", color: "#021a02", fontWeight: 600 }, children: [
                  "Margin ",
                  margin,
                  "%"
                ] })
              ] })
            ] }, p.id);
          }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(CreateInvoiceSheet, { open: invoiceSheetOpen, onClose: closeInvoiceSheet, customers, products }),
    /* @__PURE__ */ jsx(RecordPaymentSheet$1, { invoice: payingInvoice, onClose: () => setPayingInvoice(null) }),
    /* @__PURE__ */ jsx(CustomerFormSheet, { open: customerSheet, customer: null, onClose: () => setCustomerSheet(false) }),
    editingCustomer && /* @__PURE__ */ jsx(CustomerFormSheet, { open: !!editingCustomer, customer: editingCustomer, onClose: () => setEditingCustomer(null) }),
    /* @__PURE__ */ jsx(ProductFormSheet, { open: productSheet, onClose: () => setProductSheet(false) }),
    /* @__PURE__ */ jsx(
      InvoicePreviewModal,
      {
        type: "rpa_to_toko",
        isOpen: !!printingInvoice,
        onClose: () => setPrintingInvoice(null),
        data: printingInvoice ? {
          tenant,
          invoice: printingInvoice,
          customer: printingInvoice.rpa_customers,
          items: printingInvoice.rpa_invoice_items || [],
          showProfit: false,
          generatedBy: profile == null ? void 0 : profile.full_name
        } : null
      }
    )
  ] });
}
const STATUS_CONFIG = {
  lunas: { label: "Lunas", color: "#021a02", bg: "rgba(2, 26, 2,0.12)" },
  sebagian: { label: "Sebagian", color: "#60A5FA", bg: "rgba(96,165,250,0.12)" },
  belum_lunas: { label: "Belum Lunas", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" }
};
const CUSTOMER_TYPES = [
  { value: "toko", label: "Toko" },
  { value: "supermarket", label: "Supermarket" },
  { value: "restoran", label: "Restoran" },
  { value: "warung", label: "Warung" },
  { value: "pengepul", label: "Pengepul" },
  { value: "lainnya", label: "Lainnya" }
];
const PAYMENT_METHODS = [
  { value: "cash", label: "Tunai" },
  { value: "transfer", label: "Transfer" },
  { value: "qris", label: "QRIS" },
  { value: "giro", label: "Giro" }
];
const fmt$1 = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n || 0);
const fmtDate$1 = (d) => {
  if (!d) return "-";
  try {
    return format(new Date(d), "d MMM yyyy", { locale: id });
  } catch {
    return d;
  }
};
const isOverdue = (inv) => inv.payment_status !== "lunas" && inv.due_date && isAfter(/* @__PURE__ */ new Date(), new Date(inv.due_date));
const labelStyle = { fontSize: "12px", color: "#94A3B8", display: "block", marginBottom: "5px" };
const inputBase = (hasError) => ({
  width: "100%",
  padding: "9px 11px",
  background: "rgba(255,255,255,0.05)",
  border: `1px solid ${hasError ? "#EF4444" : "rgba(255,255,255,0.1)"}`,
  borderRadius: "10px",
  color: "#F1F5F9",
  fontSize: "13px",
  outline: "none",
  fontFamily: "inherit"
});
function StatusBadge({ status, overdue }) {
  const cfg = overdue && status !== "lunas" ? { label: "Jatuh Tempo", color: "#EF4444", bg: "rgba(239,68,68,0.12)" } : STATUS_CONFIG[status] ?? { label: status, color: "#94A3B8", bg: "rgba(148,163,184,0.12)" };
  return /* @__PURE__ */ jsx("span", { style: {
    background: cfg.bg,
    color: cfg.color,
    padding: "3px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: 700
  }, children: cfg.label });
}
function EditCustomerSheet({ open, customer, onClose }) {
  const updateCustomer = useUpdateCustomer();
  const [form, setForm] = useState({
    customer_name: (customer == null ? void 0 : customer.customer_name) ?? "",
    customer_type: (customer == null ? void 0 : customer.customer_type) ?? "toko",
    phone: (customer == null ? void 0 : customer.phone) ?? "",
    address: (customer == null ? void 0 : customer.address) ?? "",
    payment_terms: (customer == null ? void 0 : customer.payment_terms) ?? 14,
    credit_limit: (customer == null ? void 0 : customer.credit_limit) ?? "",
    reliability: (customer == null ? void 0 : customer.reliability) ?? 5
  });
  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));
  function handleSubmit() {
    if (!form.customer_name.trim() || !customer) return;
    updateCustomer.mutate({
      id: customer.id,
      updates: {
        customer_name: form.customer_name.trim(),
        customer_type: form.customer_type,
        phone: form.phone || null,
        address: form.address || null,
        payment_terms: Number(form.payment_terms) || null,
        credit_limit: form.credit_limit ? Number(form.credit_limit) : null,
        reliability: Number(form.reliability)
      }
    }, { onSuccess: onClose });
  }
  return /* @__PURE__ */ jsx(Sheet, { open, onOpenChange: (v) => {
    if (!v) onClose();
  }, children: /* @__PURE__ */ jsxs(
    SheetContent,
    {
      side: "bottom",
      style: { background: "#0D1117", border: "none", maxHeight: "92vh", borderRadius: "20px 20px 0 0", overflowY: "auto" },
      children: [
        /* @__PURE__ */ jsx(SheetHeader, { style: { padding: "20px 20px 0" }, children: /* @__PURE__ */ jsx(SheetTitle, { style: { color: "#F1F5F9", fontFamily: "Sora", fontSize: "18px" }, children: "Edit Info Toko" }) }),
        /* @__PURE__ */ jsxs("div", { style: { padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }, children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { htmlFor: "edit-cust-name", style: labelStyle, children: [
              "Nama Toko ",
              /* @__PURE__ */ jsx("span", { style: { color: "#EF4444" }, children: "*" })
            ] }),
            /* @__PURE__ */ jsx(
              "input",
              {
                id: "edit-cust-name",
                name: "customer_name",
                type: "text",
                value: form.customer_name,
                onChange: (e) => set("customer_name", e.target.value),
                style: inputBase(!form.customer_name)
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }, children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "edit-cust-type", style: labelStyle, children: "Tipe" }),
              /* @__PURE__ */ jsx(
                "select",
                {
                  id: "edit-cust-type",
                  name: "customer_type",
                  value: form.customer_type,
                  onChange: (e) => set("customer_type", e.target.value),
                  style: inputBase(false),
                  children: CUSTOMER_TYPES.map((t) => /* @__PURE__ */ jsx("option", { value: t.value, style: { background: "#0D1117" }, children: t.label }, t.value))
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "edit-cust-phone", style: labelStyle, children: "Telepon" }),
              /* @__PURE__ */ jsx(
                PhoneInput,
                {
                  id: "edit-cust-phone",
                  name: "phone",
                  value: form.phone,
                  onChange: (e) => set("phone", e.target.value),
                  style: inputBase(false)
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "edit-cust-address", style: labelStyle, children: "Alamat" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                id: "edit-cust-address",
                name: "address",
                type: "text",
                value: form.address,
                onChange: (e) => set("address", e.target.value),
                style: inputBase(false)
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }, children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "edit-cust-terms", style: labelStyle, children: "Tempo Bayar (hari)" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "edit-cust-terms",
                  name: "payment_terms",
                  type: "number",
                  min: "0",
                  value: form.payment_terms,
                  onChange: (e) => set("payment_terms", e.target.value),
                  style: inputBase(false)
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "edit-cust-limit", style: labelStyle, children: "Credit Limit" }),
              /* @__PURE__ */ jsx(
                InputRupiah,
                {
                  id: "edit-cust-limit",
                  name: "credit_limit",
                  value: form.credit_limit,
                  onChange: (v) => set("credit_limit", v),
                  placeholder: "0"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { style: labelStyle, children: "Reliabilitas" }),
            /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: "6px" }, children: [1, 2, 3, 4, 5].map((n) => /* @__PURE__ */ jsx("button", { type: "button", onClick: () => set("reliability", n), style: {
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              border: `1px solid ${n <= form.reliability ? "rgba(245,158,11,0.4)" : "rgba(255,255,255,0.08)"}`,
              background: n <= form.reliability ? "rgba(245,158,11,0.1)" : "transparent",
              color: n <= form.reliability ? "#F59E0B" : "#4B6478",
              cursor: "pointer",
              fontSize: "18px"
            }, children: "★" }, n)) })
          ] }),
          /* @__PURE__ */ jsx("button", { type: "button", onClick: handleSubmit, disabled: updateCustomer.isPending, style: {
            padding: "13px",
            borderRadius: "12px",
            background: updateCustomer.isPending ? "rgba(245,158,11,0.4)" : "#F59E0B",
            border: "none",
            color: "#0D1117",
            fontWeight: 700,
            fontSize: "15px",
            cursor: updateCustomer.isPending ? "not-allowed" : "pointer"
          }, children: updateCustomer.isPending ? "Menyimpan..." : "Simpan Perubahan" })
        ] })
      ]
    }
  ) });
}
function RecordPaymentSheet({ invoice, onClose }) {
  const recordPayment = useRecordCustomerPayment();
  const [amount, setAmount] = useState(
    invoice ? invoice.remaining_amount ?? invoice.total_amount - invoice.paid_amount : ""
  );
  const [method, setMethod] = useState("transfer");
  const [refNo, setRefNo] = useState("");
  const [payDate, setPayDate] = useState((/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
  if (!invoice) return null;
  const remaining = invoice.remaining_amount ?? invoice.total_amount - invoice.paid_amount;
  const afterPay = Math.max(0, remaining - (Number(amount) || 0));
  return /* @__PURE__ */ jsx(Sheet, { open: !!invoice, onOpenChange: (v) => {
    if (!v) onClose();
  }, children: /* @__PURE__ */ jsxs(SheetContent, { side: "bottom", style: { background: "#0D1117", border: "none", maxHeight: "88vh", borderRadius: "20px 20px 0 0", overflowY: "auto" }, children: [
    /* @__PURE__ */ jsx(SheetHeader, { style: { padding: "20px 20px 0" }, children: /* @__PURE__ */ jsx(SheetTitle, { style: { color: "#F1F5F9", fontFamily: "Sora", fontSize: "18px" }, children: "Catat Pembayaran" }) }),
    /* @__PURE__ */ jsxs("div", { style: { padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: "14px" }, children: [
      /* @__PURE__ */ jsxs("div", { style: { padding: "10px 12px", background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: "10px" }, children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: "12px", fontFamily: "monospace", color: "#F59E0B" }, children: invoice.invoice_number }),
        /* @__PURE__ */ jsxs("div", { style: { fontSize: "12px", color: "#4B6478", marginTop: "2px" }, children: [
          "Sisa: ",
          /* @__PURE__ */ jsx("span", { style: { color: "#F59E0B", fontWeight: 700 }, children: fmt$1(remaining) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("label", { htmlFor: "dp-amount", style: labelStyle, children: [
          "Jumlah Bayar ",
          /* @__PURE__ */ jsx("span", { style: { color: "#EF4444" }, children: "*" })
        ] }),
        /* @__PURE__ */ jsx(InputRupiah, { id: "dp-amount", name: "amount", value: amount, onChange: setAmount, placeholder: "0" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { style: labelStyle, children: "Metode" }),
        /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }, children: PAYMENT_METHODS.map((m) => /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setMethod(m.value), style: {
          padding: "8px",
          borderRadius: "8px",
          border: `1px solid ${method === m.value ? "#F59E0B" : "rgba(255,255,255,0.08)"}`,
          background: method === m.value ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.03)",
          color: method === m.value ? "#F59E0B" : "#64748B",
          cursor: "pointer",
          fontSize: "12px",
          fontWeight: method === m.value ? 700 : 400
        }, children: m.label }, m.value)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }, children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "dp-ref", style: labelStyle, children: "No. Bukti" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "dp-ref",
              name: "reference_no",
              type: "text",
              value: refNo,
              onChange: (e) => setRefNo(e.target.value),
              placeholder: "Ref...",
              style: inputBase(false)
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { style: labelStyle, children: "Tanggal Bayar" }),
          /* @__PURE__ */ jsx(DatePicker, { value: payDate, onChange: setPayDate })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: {
        padding: "10px 12px",
        background: "rgba(2, 26, 2,0.05)",
        border: "1px solid rgba(2, 26, 2,0.15)",
        borderRadius: "10px",
        display: "flex",
        justifyContent: "space-between"
      }, children: [
        /* @__PURE__ */ jsx("span", { style: { fontSize: "13px", color: "#94A3B8" }, children: "Sisa setelah bayar" }),
        /* @__PURE__ */ jsx("span", { style: { fontSize: "14px", fontWeight: 700, color: afterPay === 0 ? "#021a02" : "#F59E0B" }, children: afterPay === 0 ? "LUNAS 🎉" : fmt$1(afterPay) })
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          disabled: recordPayment.isPending || !amount || Number(amount) <= 0,
          onClick: () => recordPayment.mutate({
            invoice_id: invoice.id,
            customer_id: invoice.customer_id,
            amount: Number(amount),
            payment_date: payDate,
            payment_method: method,
            reference_no: refNo || null,
            notes: null
          }, { onSuccess: onClose }),
          style: {
            padding: "13px",
            borderRadius: "12px",
            background: recordPayment.isPending ? "rgba(245,158,11,0.4)" : "#F59E0B",
            border: "none",
            color: "#0D1117",
            fontWeight: 700,
            fontSize: "15px",
            cursor: recordPayment.isPending ? "not-allowed" : "pointer"
          },
          children: recordPayment.isPending ? "Menyimpan..." : "Konfirmasi Pembayaran"
        }
      )
    ] })
  ] }) });
}
function RPADistribusiDetail() {
  var _a;
  const { customerId } = useParams();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [invFilter, setInvFilter] = useState("all");
  const [editOpen, setEditOpen] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState(null);
  const { data: customers = [] } = useRPACustomers();
  const { data: invoices = [], isLoading } = useRPAInvoices();
  const customer = customers.find((c) => c.id === customerId);
  const custInvoices = useMemo(
    () => invoices.filter((i) => i.customer_id === customerId),
    [invoices, customerId]
  );
  const filtered = useMemo(() => {
    if (invFilter === "all") return custInvoices;
    if (invFilter === "belum_lunas") return custInvoices.filter((i) => i.payment_status !== "lunas");
    return custInvoices.filter((i) => i.payment_status === invFilter);
  }, [custInvoices, invFilter]);
  const stats = useMemo(() => ({
    totalPurchases: custInvoices.reduce((s, i) => s + (i.total_amount || 0), 0),
    outstanding: custInvoices.filter((i) => i.payment_status !== "lunas").reduce((s, i) => s + (i.remaining_amount ?? i.total_amount - i.paid_amount), 0),
    count: custInvoices.length,
    reliability: (customer == null ? void 0 : customer.reliability) ?? 0
  }), [custInvoices, customer]);
  if (!customer && customers.length > 0) {
    return /* @__PURE__ */ jsx("div", { style: { minHeight: "100vh", background: "#06090F", display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ jsx("p", { style: { color: "#4B6478" }, children: "Toko tidak ditemukan." }) });
  }
  const customerTypeLbl = ((_a = CUSTOMER_TYPES.find((t) => t.value === (customer == null ? void 0 : customer.customer_type))) == null ? void 0 : _a.label) ?? (customer == null ? void 0 : customer.customer_type);
  return /* @__PURE__ */ jsxs("div", { style: { minHeight: "100vh", background: "#06090F" }, children: [
    !isDesktop ? /* @__PURE__ */ jsx(
      TopBar,
      {
        title: (customer == null ? void 0 : customer.customer_name) ?? "...",
        subtitle: customerTypeLbl,
        showBack: true,
        rightAction: /* @__PURE__ */ jsx("button", { onClick: () => setEditOpen(true), style: {
          width: "34px",
          height: "34px",
          borderRadius: "9px",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#94A3B8",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }, children: /* @__PURE__ */ jsx(Pencil, { size: 15 }) })
      }
    ) : /* @__PURE__ */ jsxs("div", { style: { padding: "28px 32px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }, children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "10px" }, children: [
          /* @__PURE__ */ jsx("h1", { style: { fontFamily: "Sora", fontSize: "22px", fontWeight: 700, color: "#F1F5F9" }, children: (customer == null ? void 0 : customer.customer_name) ?? "..." }),
          customerTypeLbl && /* @__PURE__ */ jsx("span", { style: {
            background: "rgba(167,139,250,0.12)",
            color: "#A78BFA",
            padding: "3px 10px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: 600
          }, children: customerTypeLbl })
        ] }),
        (customer == null ? void 0 : customer.address) && /* @__PURE__ */ jsxs("p", { style: { fontSize: "13px", color: "#4B6478", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }, children: [
          /* @__PURE__ */ jsx(MapPin, { size: 12 }),
          customer.address
        ] })
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: () => setEditOpen(true), style: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 14px",
        borderRadius: "10px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "#94A3B8",
        cursor: "pointer",
        fontSize: "13px"
      }, children: [
        /* @__PURE__ */ jsx(Pencil, { size: 14 }),
        "Edit Info Toko"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { padding: isDesktop ? "24px 32px" : "20px 16px" }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: isDesktop ? "grid" : "block", gridTemplateColumns: "1fr 300px", gap: "24px" }, children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", marginBottom: "24px" }, children: [
            /* @__PURE__ */ jsxs("div", { style: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "14px" }, children: [
              /* @__PURE__ */ jsxs("div", { style: { fontSize: "11px", color: "#4B6478", marginBottom: "4px", display: "flex", alignItems: "center", gap: "5px" }, children: [
                /* @__PURE__ */ jsx(TrendingUp, { size: 12 }),
                "Total Pembelian"
              ] }),
              /* @__PURE__ */ jsx("div", { style: { fontSize: "18px", fontWeight: 700, color: "#F1F5F9" }, children: fmt$1(stats.totalPurchases) })
            ] }),
            /* @__PURE__ */ jsxs("div", { style: {
              background: stats.outstanding > 0 ? "rgba(245,158,11,0.05)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${stats.outstanding > 0 ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.06)"}`,
              borderRadius: "12px",
              padding: "14px"
            }, children: [
              /* @__PURE__ */ jsxs("div", { style: { fontSize: "11px", color: "#4B6478", marginBottom: "4px", display: "flex", alignItems: "center", gap: "5px" }, children: [
                /* @__PURE__ */ jsx(CreditCard, { size: 12 }),
                "Outstanding"
              ] }),
              /* @__PURE__ */ jsx("div", { style: { fontSize: "18px", fontWeight: 700, color: stats.outstanding > 0 ? "#F59E0B" : "#021a02" }, children: stats.outstanding > 0 ? fmt$1(stats.outstanding) : "Lunas" })
            ] }),
            /* @__PURE__ */ jsxs("div", { style: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "14px" }, children: [
              /* @__PURE__ */ jsxs("div", { style: { fontSize: "11px", color: "#4B6478", marginBottom: "4px", display: "flex", alignItems: "center", gap: "5px" }, children: [
                /* @__PURE__ */ jsx(FileText, { size: 12 }),
                "Total Invoice"
              ] }),
              /* @__PURE__ */ jsx("div", { style: { fontSize: "22px", fontWeight: 700, color: "#60A5FA" }, children: stats.count })
            ] }),
            /* @__PURE__ */ jsxs("div", { style: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "14px" }, children: [
              /* @__PURE__ */ jsx("div", { style: { fontSize: "11px", color: "#4B6478", marginBottom: "4px" }, children: "Reliabilitas" }),
              /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: "3px", marginTop: "4px" }, children: Array.from({ length: 5 }).map((_, i) => /* @__PURE__ */ jsx(
                Star,
                {
                  size: 16,
                  fill: i < stats.reliability ? "#F59E0B" : "transparent",
                  color: i < stats.reliability ? "#F59E0B" : "#334155"
                },
                i
              )) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }, children: [
            /* @__PURE__ */ jsx("h3", { style: { fontSize: "14px", fontWeight: 600, color: "#94A3B8" }, children: "Riwayat Invoice" }),
            /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: "5px" }, children: [
              { key: "all", label: "Semua" },
              { key: "belum_lunas", label: "Belum Lunas" },
              { key: "lunas", label: "Lunas" }
            ].map((t) => /* @__PURE__ */ jsx("button", { onClick: () => setInvFilter(t.key), style: {
              padding: "5px 10px",
              borderRadius: "16px",
              fontSize: "12px",
              border: invFilter === t.key ? "none" : "1px solid rgba(255,255,255,0.08)",
              background: invFilter === t.key ? "#F59E0B" : "rgba(255,255,255,0.03)",
              color: invFilter === t.key ? "#0D1117" : "#64748B",
              cursor: "pointer",
              fontWeight: invFilter === t.key ? 700 : 400
            }, children: t.label }, t.key)) })
          ] }),
          isLoading ? /* @__PURE__ */ jsx("div", { style: { height: "120px", borderRadius: "12px", background: "rgba(255,255,255,0.03)", animation: "pulse 1.5s infinite" } }) : filtered.length === 0 ? /* @__PURE__ */ jsxs("div", { style: { textAlign: "center", padding: "40px 0" }, children: [
            /* @__PURE__ */ jsx(FileText, { size: 36, color: "#1E293B" }),
            /* @__PURE__ */ jsx("p", { style: { color: "#4B6478", marginTop: "10px", fontSize: "13px" }, children: "Belum ada invoice." })
          ] }) : /* @__PURE__ */ jsx("div", { style: { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", overflow: "hidden" }, children: filtered.map((inv, idx) => {
            const od = isOverdue(inv);
            return /* @__PURE__ */ jsxs("div", { style: {
              padding: "12px 16px",
              borderBottom: idx < filtered.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none"
            }, children: [
              /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" }, children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("div", { style: { fontFamily: "monospace", fontSize: "12px", color: "#F59E0B" }, children: inv.invoice_number }),
                  /* @__PURE__ */ jsxs("div", { style: { fontSize: "12px", color: "#4B6478", marginTop: "2px" }, children: [
                    fmtDate$1(inv.transaction_date),
                    inv.due_date && /* @__PURE__ */ jsxs("span", { style: { marginLeft: "8px", color: od ? "#EF4444" : "#4B6478" }, children: [
                      "Jatuh: ",
                      fmtDate$1(inv.due_date)
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsx(StatusBadge, { status: inv.payment_status, overdue: od })
              ] }),
              /* @__PURE__ */ jsxs("div", { style: {
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                gap: "8px",
                marginTop: "10px",
                paddingTop: "8px",
                borderTop: "1px solid rgba(255,255,255,0.04)"
              }, children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("div", { style: { fontSize: "10px", color: "#4B6478" }, children: "Total" }),
                  /* @__PURE__ */ jsx("div", { style: { fontSize: "13px", fontWeight: 700, color: "#F1F5F9" }, children: fmt$1(inv.total_amount) })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("div", { style: { fontSize: "10px", color: "#4B6478" }, children: "Dibayar" }),
                  /* @__PURE__ */ jsx("div", { style: { fontSize: "13px", fontWeight: 700, color: "#021a02" }, children: fmt$1(inv.paid_amount) })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("div", { style: { fontSize: "10px", color: "#4B6478" }, children: "Sisa" }),
                  /* @__PURE__ */ jsx("div", { style: { fontSize: "13px", fontWeight: 700, color: "#F59E0B" }, children: fmt$1(inv.remaining_amount ?? inv.total_amount - inv.paid_amount) })
                ] })
              ] }),
              inv.payment_status !== "lunas" && /* @__PURE__ */ jsx("button", { onClick: () => setPayingInvoice(inv), style: {
                marginTop: "8px",
                padding: "6px 14px",
                borderRadius: "8px",
                background: "#F59E0B",
                border: "none",
                color: "#0D1117",
                fontWeight: 700,
                fontSize: "12px",
                cursor: "pointer"
              }, children: "Catat Pembayaran" })
            ] }, inv.id);
          }) })
        ] }),
        isDesktop && customer && /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: "10px" }, children: /* @__PURE__ */ jsxs("div", { style: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "18px" }, children: [
          /* @__PURE__ */ jsx("h3", { style: { fontSize: "13px", fontWeight: 700, color: "#94A3B8", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.05em" }, children: "Info Toko" }),
          [
            { label: "Tipe", value: customerTypeLbl },
            { label: "Telepon", value: customer.phone },
            { label: "Alamat", value: customer.address },
            { label: "Tempo Bayar", value: customer.payment_terms ? `${customer.payment_terms} hari` : null },
            {
              label: "Credit Limit",
              value: customer.credit_limit ? fmt$1(customer.credit_limit) : null
            }
          ].map((row) => row.value ? /* @__PURE__ */ jsxs("div", { style: {
            display: "flex",
            justifyContent: "space-between",
            padding: "8px 0",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
            fontSize: "13px"
          }, children: [
            /* @__PURE__ */ jsx("span", { style: { color: "#4B6478" }, children: row.label }),
            /* @__PURE__ */ jsx("span", { style: { color: "#E2E8F0", fontWeight: 500, textAlign: "right", maxWidth: "160px" }, children: row.value })
          ] }, row.label) : null)
        ] }) })
      ] }),
      !isDesktop && customer && /* @__PURE__ */ jsxs("div", { style: { marginTop: "20px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "16px" }, children: [
        /* @__PURE__ */ jsx("h3", { style: { fontSize: "12px", fontWeight: 700, color: "#4B6478", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }, children: "Info Toko" }),
        /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }, children: [
          { label: "Tipe", value: customerTypeLbl },
          { label: "Telepon", value: customer.phone },
          { label: "Tempo", value: customer.payment_terms ? `${customer.payment_terms} hari` : null },
          { label: "Credit Limit", value: customer.credit_limit ? fmt$1(customer.credit_limit) : null }
        ].map((row) => row.value ? /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { style: { fontSize: "11px", color: "#4B6478" }, children: row.label }),
          /* @__PURE__ */ jsx("div", { style: { fontSize: "13px", color: "#E2E8F0", fontWeight: 500, marginTop: "2px" }, children: row.value })
        ] }, row.label) : null) })
      ] })
    ] }),
    customer && /* @__PURE__ */ jsx(EditCustomerSheet, { open: editOpen, customer, onClose: () => setEditOpen(false) }),
    /* @__PURE__ */ jsx(RecordPaymentSheet, { invoice: payingInvoice, onClose: () => setPayingInvoice(null) })
  ] });
}
const fmt = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n || 0);
const fmtShort = (n) => {
  if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(1)}M`;
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}jt`;
  if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(0)}rb`;
  return String(n);
};
const fmtDate = (d) => {
  if (!d) return "-";
  try {
    return format(new Date(d), "d MMM yy", { locale: id });
  } catch {
    return d;
  }
};
const marginColor = (pct) => {
  const n = Number(pct);
  if (n >= 15) return "var(--brand-500)";
  if (n >= 10) return "#F59E0B";
  return "#EF4444";
};
function CustomTooltip({ active, payload, label }) {
  if (!active || !(payload == null ? void 0 : payload.length)) return null;
  return /* @__PURE__ */ jsxs("div", { style: {
    background: "var(--bg-1-val)",
    border: "1px solid var(--border-sub-val)",
    borderRadius: "10px",
    padding: "10px 14px",
    minWidth: "160px"
  }, children: [
    /* @__PURE__ */ jsx("div", { style: { fontSize: "12px", color: "var(--text-muted-val)", marginBottom: "6px", fontWeight: 600 }, children: label }),
    payload.map((p) => /* @__PURE__ */ jsxs("div", { style: { fontSize: "12px", color: p.color === "#021a02" ? "var(--brand-500)" : p.color, fontWeight: 600, marginBottom: "3px" }, children: [
      p.name,
      ": ",
      typeof p.value === "number" ? fmt(p.value) : p.value
    ] }, p.name))
  ] });
}
function buildChartData(invoices, startDate, endDate) {
  if (!(invoices == null ? void 0 : invoices.length) || !startDate || !endDate) return [];
  const startD = parseISO(startDate);
  const endD = parseISO(endDate);
  const daysDiff = differenceInDays(endD, startD);
  const useWeekly = daysDiff > 30;
  const map = {};
  if (!useWeekly) {
    for (let i = 0; i <= daysDiff; i++) {
      const d = addDays(startD, i);
      const key = format(d, "dd/MM");
      map[key] = { label: key, revenue: 0, cost: 0, profit: 0 };
    }
  }
  invoices.forEach((inv) => {
    const d = new Date(inv.transaction_date);
    const key = useWeekly ? `Mg${format(d, "w")}` : format(d, "dd/MM");
    if (!map[key]) map[key] = { label: key, revenue: 0, cost: 0, profit: 0 };
    map[key].revenue += inv.total_amount || 0;
    map[key].cost += inv.total_cost || 0;
    map[key].profit += inv.net_profit || 0;
  });
  return Object.values(map);
}
function Skeleton({ h = 60, rounded = 12 }) {
  return /* @__PURE__ */ jsx("div", { style: { height: h, borderRadius: rounded, background: "var(--border-sub-val)", animation: "pulse 1.5s infinite" } });
}
function RPALaporanMargin() {
  var _a;
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const { tenant } = useAuth();
  const sub = getSubscriptionStatus(tenant);
  const isStarter = sub.status !== "active" && sub.status !== "trial";
  const [startDate, setStartDate] = useState(format(startOfMonth(/* @__PURE__ */ new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(/* @__PURE__ */ new Date(), "yyyy-MM-dd"));
  const [showAllInvoices, setShowAllInvoices] = useState(false);
  const [invFilter, setInvFilter] = useState("all");
  const { data, isLoading } = useRPAMarginReport(startDate, endDate);
  const chartData = useMemo(
    () => buildChartData(data == null ? void 0 : data.invoices, startDate, endDate),
    [data, startDate, endDate]
  );
  const productRows = useMemo(() => {
    if (!(data == null ? void 0 : data.byProduct)) return [];
    return Object.entries(data.byProduct).map(([name, v]) => ({
      name,
      ...v,
      profit: v.revenue - v.cost,
      margin: v.revenue > 0 ? ((v.revenue - v.cost) / v.revenue * 100).toFixed(1) : "0"
    })).sort((a, b) => b.revenue - a.revenue);
  }, [data]);
  const customerRows = useMemo(() => {
    if (!(data == null ? void 0 : data.byCustomer)) return [];
    return Object.entries(data.byCustomer).map(([name, v]) => ({
      name,
      ...v,
      margin: v.revenue > 0 ? (v.profit / v.revenue * 100).toFixed(1) : "0"
    })).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  }, [data]);
  const filteredInvoices = useMemo(() => {
    if (!(data == null ? void 0 : data.invoices)) return [];
    if (invFilter === "all") return data.invoices;
    return data.invoices.filter((i) => i.payment_status === invFilter);
  }, [data, invFilter]);
  if (isStarter) {
    return /* @__PURE__ */ jsxs("div", { style: { minHeight: "100vh", background: "var(--bg-base-val)" }, children: [
      !isDesktop && /* @__PURE__ */ jsx(TopBar, { title: "Laporan Margin", subtitle: "Analisis profitabilitas" }),
      /* @__PURE__ */ jsxs("div", { style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "80vh",
        padding: "32px 20px",
        textAlign: "center"
      }, children: [
        /* @__PURE__ */ jsx("div", { style: {
          width: "64px",
          height: "64px",
          borderRadius: "20px",
          marginBottom: "20px",
          background: "rgba(245,158,11,0.1)",
          border: "1px solid rgba(245,158,11,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }, children: /* @__PURE__ */ jsx(BarChart3, { size: 28, color: "#F59E0B" }) }),
        /* @__PURE__ */ jsx("span", { style: {
          display: "inline-block",
          marginBottom: "14px",
          padding: "4px 12px",
          borderRadius: "20px",
          background: "rgba(245,158,11,0.1)",
          border: "1px solid rgba(245,158,11,0.2)",
          fontSize: "11px",
          fontWeight: 700,
          color: "#F59E0B",
          textTransform: "uppercase",
          letterSpacing: "0.1em"
        }, children: "Fitur Pro" }),
        /* @__PURE__ */ jsx("h2", { style: { fontSize: "20px", fontWeight: 800, color: "var(--text-primary-val)", marginBottom: "10px", fontFamily: "Sora" }, children: "Laporan Margin & HPP" }),
        /* @__PURE__ */ jsx("p", { style: { fontSize: "14px", color: "var(--text-muted-val)", maxWidth: "320px", lineHeight: 1.6, marginBottom: "28px" }, children: "Analitik HPP, margin per produk, breakdown per customer, dan chart revenue vs cost tersedia di plan Pro ke atas." }),
        /* @__PURE__ */ jsxs(
          Link,
          {
            to: "/upgrade",
            style: {
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 28px",
              borderRadius: "14px",
              background: "#F59E0B",
              color: "#0D1117",
              fontWeight: 800,
              fontSize: "14px",
              textDecoration: "none",
              boxShadow: "0 8px 24px rgba(245,158,11,0.3)"
            },
            children: [
              /* @__PURE__ */ jsx(Lock, { size: 15 }),
              "Upgrade ke Pro"
            ]
          }
        )
      ] })
    ] });
  }
  const mc = marginColor((data == null ? void 0 : data.marginPct) ?? 0);
  const profitPositive = ((data == null ? void 0 : data.totalProfit) ?? 0) >= 0;
  const tableHeaderStyle = {
    padding: "9px 12px",
    textAlign: "left",
    fontSize: "10px",
    fontWeight: 700,
    color: "var(--text-muted-val)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    background: "var(--bg-2-val)",
    borderBottom: "1px solid var(--border-sub-val)"
  };
  const tdStyle = (align = "left") => ({
    padding: "10px 12px",
    fontSize: "13px",
    color: "var(--text-secondary-val)",
    textAlign: align,
    borderBottom: "1px solid var(--border-sub-val)"
  });
  return /* @__PURE__ */ jsxs("div", { style: { minHeight: "100vh", background: "var(--bg-base-val)" }, children: [
    !isDesktop ? /* @__PURE__ */ jsx(TopBar, { title: "Laporan Margin", subtitle: `${fmtDate(startDate)} – ${fmtDate(endDate)}` }) : /* @__PURE__ */ jsxs("div", { style: { padding: "28px 32px 0" }, children: [
      /* @__PURE__ */ jsx("h1", { style: { fontFamily: "Sora", fontSize: "22px", fontWeight: 700, color: "var(--text-primary-val)" }, children: "Laporan Margin" }),
      /* @__PURE__ */ jsx("p", { style: { fontSize: "14px", color: "var(--text-muted-val)", marginTop: "4px" }, children: "Analisis profitabilitas distribusi RPA" })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { padding: isDesktop ? "20px 32px" : "16px 16px" }, children: [
      /* @__PURE__ */ jsxs("div", { style: {
        display: "flex",
        gap: "10px",
        alignItems: "flex-end",
        marginBottom: "20px",
        flexWrap: "wrap"
      }, children: [
        /* @__PURE__ */ jsxs("div", { style: { flex: 1, minWidth: "140px" }, children: [
          /* @__PURE__ */ jsx("label", { style: { fontSize: "11px", color: "var(--text-muted-val)", display: "block", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.05em" }, children: "Dari" }),
          /* @__PURE__ */ jsx(DatePicker, { value: startDate, onChange: setStartDate, placeholder: "Tanggal mulai" })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { flex: 1, minWidth: "140px" }, children: [
          /* @__PURE__ */ jsx("label", { style: { fontSize: "11px", color: "var(--text-muted-val)", display: "block", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.05em" }, children: "Sampai" }),
          /* @__PURE__ */ jsx(DatePicker, { value: endDate, onChange: setEndDate, placeholder: "Tanggal akhir" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: isDesktop ? "repeat(4,1fr)" : "repeat(2,1fr)", gap: "10px", marginBottom: "20px" }, children: [
        /* @__PURE__ */ jsxs("div", { style: { background: "var(--bg-1-val)", border: "1px solid var(--border-sub-val)", borderRadius: "12px", padding: "14px" }, children: [
          /* @__PURE__ */ jsxs("div", { style: { fontSize: "11px", color: "var(--text-muted-val)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "5px" }, children: [
            /* @__PURE__ */ jsx(DollarSign, { size: 12 }),
            "TOTAL REVENUE"
          ] }),
          isLoading ? /* @__PURE__ */ jsx(Skeleton, { h: 28, rounded: 6 }) : /* @__PURE__ */ jsx("div", { style: { fontSize: isDesktop ? "18px" : "15px", fontWeight: 700, color: "#F59E0B" }, children: fmt(data == null ? void 0 : data.totalRevenue) })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { background: "var(--bg-1-val)", border: "1px solid var(--border-sub-val)", borderRadius: "12px", padding: "14px" }, children: [
          /* @__PURE__ */ jsx("div", { style: { fontSize: "11px", color: "var(--text-muted-val)", marginBottom: "6px" }, children: "TOTAL HPP" }),
          isLoading ? /* @__PURE__ */ jsx(Skeleton, { h: 28, rounded: 6 }) : /* @__PURE__ */ jsx("div", { style: { fontSize: isDesktop ? "18px" : "15px", fontWeight: 700, color: "var(--text-secondary-val)" }, children: fmt(data == null ? void 0 : data.totalCost) })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: {
          background: profitPositive ? "rgba(52, 211, 153, 0.05)" : "rgba(239,68,68,0.05)",
          border: `1px solid ${profitPositive ? "var(--brand-500)" : "#EF4444"}`,
          borderRadius: "12px",
          padding: "14px"
        }, children: [
          /* @__PURE__ */ jsxs("div", { style: { fontSize: "11px", color: "var(--text-muted-val)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "5px" }, children: [
            profitPositive ? /* @__PURE__ */ jsx(TrendingUp, { size: 12, color: "var(--brand-500)" }) : /* @__PURE__ */ jsx(TrendingDown, { size: 12, color: "#EF4444" }),
            "GROSS PROFIT"
          ] }),
          isLoading ? /* @__PURE__ */ jsx(Skeleton, { h: 28, rounded: 6 }) : /* @__PURE__ */ jsx("div", { style: { fontSize: isDesktop ? "18px" : "15px", fontWeight: 700, color: profitPositive ? "var(--brand-500)" : "#EF4444" }, children: fmt(data == null ? void 0 : data.totalProfit) })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: {
          background: `rgba(${mc === "var(--brand-500)" ? "52,211,153" : mc === "#F59E0B" ? "245,158,11" : "239,68,68"},0.05)`,
          border: `1px solid rgba(${mc === "var(--brand-500)" ? "52,211,153" : mc === "#F59E0B" ? "245,158,11" : "239,68,68"},0.2)`,
          borderRadius: "12px",
          padding: "14px"
        }, children: [
          /* @__PURE__ */ jsx("div", { style: { fontSize: "11px", color: "var(--text-muted-val)", marginBottom: "6px" }, children: "MARGIN %" }),
          isLoading ? /* @__PURE__ */ jsx(Skeleton, { h: 28, rounded: 6 }) : /* @__PURE__ */ jsxs("div", { style: { fontSize: isDesktop ? "22px" : "18px", fontWeight: 700, color: mc, fontFamily: "Sora" }, children: [
            (data == null ? void 0 : data.marginPct) ?? 0,
            "%"
          ] }),
          !isLoading && /* @__PURE__ */ jsx("div", { style: { fontSize: "11px", color: "var(--text-muted-val)", marginTop: "3px" }, children: Number(data == null ? void 0 : data.marginPct) >= 15 ? "✓ Sehat" : Number(data == null ? void 0 : data.marginPct) >= 10 ? "⚠ Perlu perhatian" : "✗ Di bawah target" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: {
        background: "var(--bg-1-val)",
        border: "1px solid var(--border-sub-val)",
        borderRadius: "14px",
        padding: "16px",
        marginBottom: "20px"
      }, children: [
        /* @__PURE__ */ jsx("h3", { style: { fontSize: "13px", fontWeight: 600, color: "var(--text-secondary-val)", marginBottom: "14px" }, children: "Revenue vs HPP vs Profit" }),
        isLoading ? /* @__PURE__ */ jsx(Skeleton, { h: 240, rounded: 10 }) : chartData.length === 0 ? /* @__PURE__ */ jsx("div", { style: { height: 200, display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ jsx("p", { style: { color: "var(--text-muted-val)", fontSize: "13px" }, children: "Tidak ada data dalam periode ini." }) }) : /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 240, children: /* @__PURE__ */ jsxs(ComposedChart, { data: chartData, margin: { top: 8, right: 8, left: 0, bottom: 0 }, children: [
          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "var(--border-sub-val)", vertical: false }),
          /* @__PURE__ */ jsx(XAxis, { dataKey: "label", tick: { fontSize: 11, fill: "var(--text-muted-val)" }, axisLine: false, tickLine: false }),
          /* @__PURE__ */ jsx(YAxis, { tickFormatter: fmtShort, tick: { fontSize: 11, fill: "var(--text-muted-val)" }, axisLine: false, tickLine: false, width: 48 }),
          /* @__PURE__ */ jsx(Tooltip, { content: /* @__PURE__ */ jsx(CustomTooltip, {}) }),
          /* @__PURE__ */ jsx(Legend, { wrapperStyle: { fontSize: "12px", color: "var(--text-secondary-val)", paddingTop: "8px" } }),
          /* @__PURE__ */ jsx(Bar, { dataKey: "revenue", name: "Revenue", fill: "#F59E0B", fillOpacity: 0.8, radius: [3, 3, 0, 0] }),
          /* @__PURE__ */ jsx(Bar, { dataKey: "cost", name: "HPP", fill: "var(--border-strong-val)", radius: [3, 3, 0, 0] }),
          /* @__PURE__ */ jsx(Line, { dataKey: "profit", name: "Profit", stroke: "var(--brand-500)", strokeWidth: 2, dot: false, type: "monotone" })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: {
        display: "grid",
        gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr",
        gap: "16px",
        marginBottom: "20px"
      }, children: [
        /* @__PURE__ */ jsxs("div", { style: { background: "var(--bg-1-val)", border: "1px solid var(--border-sub-val)", borderRadius: "14px", overflow: "hidden" }, children: [
          /* @__PURE__ */ jsx("div", { style: { padding: "14px 16px", borderBottom: "1px solid var(--border-sub-val)" }, children: /* @__PURE__ */ jsx("h3", { style: { fontSize: "13px", fontWeight: 700, color: "var(--text-secondary-val)" }, children: "Breakdown per Produk" }) }),
          isLoading ? /* @__PURE__ */ jsx("div", { style: { padding: "12px" }, children: /* @__PURE__ */ jsx(Skeleton, { h: 120, rounded: 8 }) }) : productRows.length === 0 ? /* @__PURE__ */ jsx("div", { style: { padding: "24px", textAlign: "center", fontSize: "13px", color: "var(--text-muted-val)" }, children: "Belum ada data" }) : /* @__PURE__ */ jsxs("table", { style: { width: "100%", borderCollapse: "collapse" }, children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { children: ["Produk", "Qty", "Revenue", "Profit", "Margin"].map((h) => /* @__PURE__ */ jsx("th", { style: tableHeaderStyle, children: h }, h)) }) }),
            /* @__PURE__ */ jsxs("tbody", { children: [
              productRows.map((row) => /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { style: tdStyle(), children: /* @__PURE__ */ jsx("span", { style: { fontSize: "12px", fontWeight: 600, color: "var(--text-primary-val)" }, children: row.name }) }),
                /* @__PURE__ */ jsx("td", { style: tdStyle("right"), children: /* @__PURE__ */ jsx("span", { style: { fontSize: "12px", color: "var(--text-secondary-val)" }, children: row.qty.toFixed(1) }) }),
                /* @__PURE__ */ jsx("td", { style: tdStyle("right"), children: /* @__PURE__ */ jsx("span", { style: { fontSize: "12px", color: "#F59E0B" }, children: fmtShort(row.revenue) }) }),
                /* @__PURE__ */ jsx("td", { style: tdStyle("right"), children: /* @__PURE__ */ jsx("span", { style: { fontSize: "12px", color: row.profit >= 0 ? "var(--brand-500)" : "#EF4444" }, children: fmtShort(row.profit) }) }),
                /* @__PURE__ */ jsx("td", { style: tdStyle("right"), children: /* @__PURE__ */ jsxs("span", { style: { fontSize: "12px", color: marginColor(row.margin), fontWeight: 700 }, children: [
                  row.margin,
                  "%"
                ] }) })
              ] }, row.name)),
              /* @__PURE__ */ jsxs("tr", { style: { background: "rgba(245,158,11,0.08)" }, children: [
                /* @__PURE__ */ jsx("td", { style: { ...tdStyle(), fontWeight: 700, color: "var(--text-primary-val)", borderBottom: "none" }, children: "TOTAL" }),
                /* @__PURE__ */ jsx("td", { style: { ...tdStyle("right"), fontWeight: 700, color: "var(--text-primary-val)", borderBottom: "none" }, children: productRows.reduce((s, r) => s + r.qty, 0).toFixed(1) }),
                /* @__PURE__ */ jsx("td", { style: { ...tdStyle("right"), fontWeight: 700, color: "#F59E0B", borderBottom: "none" }, children: fmtShort(productRows.reduce((s, r) => s + r.revenue, 0)) }),
                /* @__PURE__ */ jsx("td", { style: { ...tdStyle("right"), fontWeight: 700, color: "var(--brand-500)", borderBottom: "none" }, children: fmtShort(productRows.reduce((s, r) => s + r.profit, 0)) }),
                /* @__PURE__ */ jsx("td", { style: { ...tdStyle("right"), borderBottom: "none" }, children: /* @__PURE__ */ jsxs("span", { style: { color: mc, fontWeight: 700 }, children: [
                  (data == null ? void 0 : data.marginPct) ?? 0,
                  "%"
                ] }) })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { background: "var(--bg-1-val)", border: "1px solid var(--border-sub-val)", borderRadius: "14px", overflow: "hidden" }, children: [
          /* @__PURE__ */ jsx("div", { style: { padding: "14px 16px", borderBottom: "1px solid var(--border-sub-val)" }, children: /* @__PURE__ */ jsx("h3", { style: { fontSize: "13px", fontWeight: 700, color: "var(--text-secondary-val)" }, children: "Top Toko (maks. 10)" }) }),
          isLoading ? /* @__PURE__ */ jsx("div", { style: { padding: "12px" }, children: /* @__PURE__ */ jsx(Skeleton, { h: 120, rounded: 8 }) }) : customerRows.length === 0 ? /* @__PURE__ */ jsx("div", { style: { padding: "24px", textAlign: "center", fontSize: "13px", color: "var(--text-muted-val)" }, children: "Belum ada data" }) : /* @__PURE__ */ jsxs("table", { style: { width: "100%", borderCollapse: "collapse" }, children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { children: ["Toko", "Inv", "Revenue", "Profit", "Margin"].map((h) => /* @__PURE__ */ jsx("th", { style: tableHeaderStyle, children: h }, h)) }) }),
            /* @__PURE__ */ jsx("tbody", { children: customerRows.map((row, idx) => /* @__PURE__ */ jsxs("tr", { style: { background: idx === 0 ? "rgba(245,158,11,0.06)" : "transparent" }, children: [
              /* @__PURE__ */ jsx("td", { style: tdStyle(), children: /* @__PURE__ */ jsxs("span", { style: { fontSize: "12px", fontWeight: 600, color: "var(--text-primary-val)" }, children: [
                idx === 0 && /* @__PURE__ */ jsx("span", { style: { color: "#F59E0B", marginRight: "4px" }, children: "★" }),
                row.name
              ] }) }),
              /* @__PURE__ */ jsx("td", { style: { ...tdStyle("center") }, children: /* @__PURE__ */ jsx("span", { style: { fontSize: "12px", color: "var(--text-secondary-val)" }, children: row.invoiceCount }) }),
              /* @__PURE__ */ jsx("td", { style: tdStyle("right"), children: /* @__PURE__ */ jsx("span", { style: { fontSize: "12px", color: "#F59E0B" }, children: fmtShort(row.revenue) }) }),
              /* @__PURE__ */ jsx("td", { style: tdStyle("right"), children: /* @__PURE__ */ jsx("span", { style: { fontSize: "12px", color: row.profit >= 0 ? "var(--brand-500)" : "#EF4444" }, children: fmtShort(row.profit) }) }),
              /* @__PURE__ */ jsx("td", { style: tdStyle("right"), children: /* @__PURE__ */ jsxs("span", { style: { fontSize: "12px", color: marginColor(row.margin), fontWeight: 700 }, children: [
                row.margin,
                "%"
              ] }) })
            ] }, row.name)) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { background: "var(--bg-1-val)", border: "1px solid var(--border-sub-val)", borderRadius: "14px", overflow: "hidden" }, children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => setShowAllInvoices((v) => !v),
            style: {
              width: "100%",
              padding: "14px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "transparent",
              border: "none",
              cursor: "pointer"
            },
            children: [
              /* @__PURE__ */ jsxs("span", { style: { fontSize: "13px", fontWeight: 700, color: "var(--text-secondary-val)", display: "flex", alignItems: "center", gap: "6px" }, children: [
                /* @__PURE__ */ jsx(FileText, { size: 14 }),
                "Semua Invoice (",
                ((_a = data == null ? void 0 : data.invoices) == null ? void 0 : _a.length) ?? 0,
                ")"
              ] }),
              showAllInvoices ? /* @__PURE__ */ jsx(ChevronUp, { size: 16, color: "var(--text-muted-val)" }) : /* @__PURE__ */ jsx(ChevronDown, { size: 16, color: "var(--text-muted-val)" })
            ]
          }
        ),
        /* @__PURE__ */ jsx(AnimatePresence, { children: showAllInvoices && /* @__PURE__ */ jsxs(
          motion.div,
          {
            initial: { height: 0, opacity: 0 },
            animate: { height: "auto", opacity: 1 },
            exit: { height: 0, opacity: 0 },
            transition: { duration: 0.2 },
            style: { overflow: "hidden" },
            children: [
              /* @__PURE__ */ jsx("div", { style: { padding: "8px 16px 10px", borderTop: "1px solid var(--border-sub-val)", display: "flex", gap: "6px", overflowX: "auto" }, children: [
                { key: "all", label: "Semua" },
                { key: "belum_lunas", label: "Belum Lunas" },
                { key: "sebagian", label: "Sebagian" },
                { key: "lunas", label: "Lunas" }
              ].map((t) => /* @__PURE__ */ jsx("button", { onClick: () => setInvFilter(t.key), style: {
                flexShrink: 0,
                padding: "5px 12px",
                borderRadius: "16px",
                border: invFilter === t.key ? "none" : "1px solid var(--border-sub-val)",
                background: invFilter === t.key ? "#F59E0B" : "transparent",
                color: invFilter === t.key ? "#0D1117" : "var(--text-secondary-val)",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: invFilter === t.key ? 700 : 400
              }, children: t.label }, t.key)) }),
              isLoading ? /* @__PURE__ */ jsx("div", { style: { padding: "12px" }, children: /* @__PURE__ */ jsx(Skeleton, { h: 80, rounded: 8 }) }) : /* @__PURE__ */ jsxs("table", { style: { width: "100%", borderCollapse: "collapse" }, children: [
                /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { children: ["Invoice #", "Toko", "Tanggal", "Total", "HPP", "Profit", "Status"].map((h) => /* @__PURE__ */ jsx("th", { style: tableHeaderStyle, children: h }, h)) }) }),
                /* @__PURE__ */ jsx("tbody", { children: filteredInvoices.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 7, style: { padding: "20px", textAlign: "center", fontSize: "13px", color: "var(--text-muted-val)" }, children: "Tidak ada invoice" }) }) : filteredInvoices.map((inv, _idx) => {
                  var _a2;
                  const profit = inv.net_profit || inv.total_amount - inv.total_cost || 0;
                  const isLunas = inv.payment_status === "lunas";
                  const isSebagian = inv.payment_status === "sebagian";
                  const statusBg = isLunas ? "rgba(52, 211, 153, 0.12)" : isSebagian ? "rgba(96, 165, 250, 0.12)" : "rgba(245, 158, 11, 0.12)";
                  const statusColor = isLunas ? "var(--brand-500)" : isSebagian ? "#60A5FA" : "#F59E0B";
                  return /* @__PURE__ */ jsxs("tr", { children: [
                    /* @__PURE__ */ jsx("td", { style: { ...tdStyle(), fontFamily: "monospace", fontSize: "11px", color: "#F59E0B" }, children: inv.invoice_number }),
                    /* @__PURE__ */ jsx("td", { style: { ...tdStyle(), fontSize: "12px", fontWeight: 600, color: "var(--text-primary-val)" }, children: inv.customer_name ?? ((_a2 = inv.rpa_customers) == null ? void 0 : _a2.customer_name) }),
                    /* @__PURE__ */ jsx("td", { style: { ...tdStyle(), fontSize: "12px" }, children: fmtDate(inv.transaction_date) }),
                    /* @__PURE__ */ jsx("td", { style: { ...tdStyle("right"), fontSize: "12px", color: "#F59E0B" }, children: fmt(inv.total_amount) }),
                    /* @__PURE__ */ jsx("td", { style: { ...tdStyle("right"), fontSize: "12px", color: "var(--text-secondary-val)" }, children: fmt(inv.total_cost) }),
                    /* @__PURE__ */ jsx("td", { style: { ...tdStyle("right"), fontSize: "12px", color: profit >= 0 ? "var(--brand-500)" : "#EF4444", fontWeight: 600 }, children: fmt(profit) }),
                    /* @__PURE__ */ jsx("td", { style: tdStyle(), children: /* @__PURE__ */ jsx("span", { style: {
                      background: statusBg,
                      color: statusColor,
                      padding: "2px 8px",
                      borderRadius: "16px",
                      fontSize: "11px",
                      fontWeight: 700
                    }, children: inv.payment_status === "lunas" ? "Lunas" : inv.payment_status === "sebagian" ? "Sebagian" : "Belum" }) })
                  ] }, inv.id);
                }) })
              ] })
            ]
          }
        ) })
      ] })
    ] })
  ] });
}
function Akun() {
  return /* @__PURE__ */ jsx(AkunPage, {});
}
function RPATimManajemenPage() {
  return /* @__PURE__ */ jsx(ManajemenPage, { roleConfig: RPA_TIM_CONFIG });
}
function RPHBeranda() {
  return /* @__PURE__ */ jsx("div", { className: "p-8 text-[#94A3B8]", children: "RPH Dashboard — Coming Soon" });
}
function RPPageRouter({ page }) {
  var _a;
  const { rpType } = useParams();
  const pages = {
    rpa: {
      beranda: /* @__PURE__ */ jsx(RPABeranda, {}),
      order: /* @__PURE__ */ jsx(RPAOrder, {}),
      hutang: /* @__PURE__ */ jsx(RPAHutang, {}),
      distribusi: /* @__PURE__ */ jsx(RPADistribusi, {}),
      "distribusi-detail": /* @__PURE__ */ jsx(RPADistribusiDetail, {}),
      laporan: /* @__PURE__ */ jsx(RPALaporanMargin, {}),
      akun: /* @__PURE__ */ jsx(Akun, {}),
      tim: /* @__PURE__ */ jsx(RPATimManajemenPage, {})
    },
    rph: {
      beranda: /* @__PURE__ */ jsx(RPHBeranda, {})
    }
  };
  const component = ((_a = pages[rpType]) == null ? void 0 : _a[page]) ?? /* @__PURE__ */ jsx("div", { className: "p-8 text-[#94A3B8]", children: "Halaman tidak ditemukan" });
  if (page === "beranda" && rpType === "rpa") {
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      component,
      /* @__PURE__ */ jsx(RPATutorial, {}),
      /* @__PURE__ */ jsx(WelcomeOnlyOverlay, { accent: "#F97316", accentDim: "rgba(249,115,22,0.12)" })
    ] });
  }
  return component;
}
export {
  RPPageRouter
};
