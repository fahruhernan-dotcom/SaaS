import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import React__default, { useState, Suspense, useEffect, useCallback, useRef } from "react";
import { Document, Page, View, Text, StyleSheet, PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import { s as supabase, p as logSupabaseError, u as useAuth, g as getSubscriptionStatus, ak as Dialog, al as DialogContent, am as DialogHeader, an as DialogTitle, aZ as DialogDescription, a7 as Button, aK as Skeleton, x as isOwner, y as isSuperadmin, c as useMediaQuery, a1 as cn, aA as Badge, ao as Label, a0 as Input, F as Sheet, G as SheetContent, H as SheetHeader, I as SheetTitle, J as SheetDescription, a2 as Select, a3 as SelectTrigger, a4 as SelectValue, a5 as SelectContent, a6 as SelectItem, a_ as useLanguage, at as useTheme, a$ as THEME_PRESETS, K as logError, r as resolveBusinessVertical, aH as getXBasePath } from "../main.mjs";
import { Lock, FileText, Loader2, CheckCircle2, Save, Printer, Download, Menu, UserPlus, AlertCircle, Users, Pencil, Shield, Trash2, Clock, Copy, X, Plus, Check, Building2, Edit3, Shuffle, Sparkles, HelpCircle, CreditCard, Package, ArrowUpRight, Info, LayoutGrid, Sun, Globe, BellOff, AlertTriangle, Bell, Settings, Phone, ChevronRight, LogOut, Warehouse, Receipt, Truck, ShoppingCart, BarChart2, ClipboardList, MapPin, ChevronLeft } from "lucide-react";
import { Link, useOutletContext, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { P as PhoneInput } from "./PhoneInput-BYk7A6X-.js";
import { A as AlertDialog, a as AlertDialogContent, b as AlertDialogHeader, c as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter, f as AlertDialogCancel, g as AlertDialogAction } from "./alert-dialog-DzaJnNEE.js";
import { differenceInDays } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
const generateInvoiceNumber = (type, date = /* @__PURE__ */ new Date()) => {
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(3))).map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase().slice(0, 4);
  const prefixes = {
    sale: "INV",
    purchase: "PO",
    delivery: "DO",
    payment_receipt: "REC",
    peternak_invoice: "PET",
    rpa_to_toko: "RPA",
    sembako_sale: "SMB"
  };
  return `${prefixes[type] || "INV"}-${dateStr}-${rand}`;
};
const formatRupiahPDF = (n) => {
  if (n == null || n === "") return "Rp 0";
  const num = Number(n);
  if (isNaN(num)) return "Rp 0";
  const parts = Math.abs(Math.round(num)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return (num < 0 ? "-Rp " : "Rp ") + parts;
};
const formatDatePDF = (val, showDay = false) => {
  if (!val) return "-";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "-";
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des"
  ];
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const dateParts = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  if (showDay) {
    return `${days[d.getDay()]}, ${dateParts}`;
  }
  return dateParts;
};
const SATUAN = [
  "",
  "satu",
  "dua",
  "tiga",
  "empat",
  "lima",
  "enam",
  "tujuh",
  "delapan",
  "sembilan",
  "sepuluh",
  "sebelas"
];
function _terbilangRibuan(n) {
  if (n === 0) return "";
  if (n < 12) return SATUAN[n];
  if (n < 20) return SATUAN[n - 10] + " belas";
  if (n < 100) {
    const rem = n % 10;
    return SATUAN[Math.floor(n / 10)] + " puluh" + (rem ? " " + SATUAN[rem] : "");
  }
  if (n < 200) return "seratus" + (n > 100 ? " " + _terbilangRibuan(n - 100) : "");
  if (n < 1e3) {
    const rem = n % 100;
    return SATUAN[Math.floor(n / 100)] + " ratus" + (rem ? " " + _terbilangRibuan(rem) : "");
  }
  if (n < 2e3) return "seribu" + (n > 1e3 ? " " + _terbilangRibuan(n - 1e3) : "");
  if (n < 1e6) {
    const thousands = Math.floor(n / 1e3);
    const rem = n % 1e3;
    return _terbilangRibuan(thousands) + " ribu" + (rem ? " " + _terbilangRibuan(rem) : "");
  }
  return n.toString();
}
const terbilang = (n) => {
  const num = Math.round(Number(n) || 0);
  if (num === 0) return "nol rupiah";
  const parts = [];
  let remainder = Math.abs(num);
  const milyar = Math.floor(remainder / 1e9);
  remainder %= 1e9;
  if (milyar) parts.push(_terbilangRibuan(milyar) + " milyar");
  const juta = Math.floor(remainder / 1e6);
  remainder %= 1e6;
  if (juta) parts.push(_terbilangRibuan(juta) + " juta");
  const ribu = Math.floor(remainder / 1e3);
  remainder %= 1e3;
  if (ribu) parts.push(_terbilangRibuan(ribu) + " ribu");
  if (remainder) parts.push(_terbilangRibuan(remainder));
  const result = parts.join(" ") + " rupiah";
  return (num < 0 ? "minus " : "") + result.charAt(0).toUpperCase() + result.slice(1);
};
const C$6 = {
  bg: "#FFFFFF",
  text: "#1a1a1a",
  muted: "#666666",
  faint: "#999999",
  light: "#F9FAFB",
  border: "#E5E7EB",
  header: "#0C1319",
  accent: "#021a02",
  accentBg: "#F0FDF4",
  accentBorder: "#021a02",
  warn: "#F59E0B"
};
const s$6 = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 60,
    paddingLeft: 40,
    paddingRight: 40,
    backgroundColor: C$6.bg,
    color: C$6.text
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: C$6.accent,
    borderBottomStyle: "solid"
  },
  companyName: { fontSize: 18, fontFamily: "Helvetica-Bold", color: C$6.header },
  companyDetail: { fontSize: 8, color: C$6.muted, marginTop: 3 },
  invoiceTitle: { fontSize: 22, fontFamily: "Helvetica-Bold", color: C$6.accent, textAlign: "right" },
  invoiceNum: { fontSize: 9, color: C$6.muted, textAlign: "right", marginTop: 3 },
  invoiceDate: { fontSize: 9, color: C$6.muted, textAlign: "right", marginTop: 2 },
  invoiceDue: { fontSize: 9, color: C$6.warn, textAlign: "right", marginTop: 2 },
  // Status badge
  statusWrap: { marginBottom: 16, flexDirection: "row" },
  statusBadge: { paddingTop: 4, paddingBottom: 4, paddingLeft: 12, paddingRight: 12, borderRadius: 4 },
  statusText: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  // Bill to / from
  parties: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  partyBox: { width: "45%" },
  partyLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C$6.accent, letterSpacing: 1, marginBottom: 6 },
  partyName: { fontSize: 12, fontFamily: "Helvetica-Bold", color: C$6.header },
  partyDetail: { fontSize: 9, color: C$6.muted, marginTop: 2 },
  // Table
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C$6.header,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 4
  },
  thText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#FFFFFF" },
  tableRow: {
    flexDirection: "row",
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 10,
    borderBottomWidth: 1,
    borderBottomColor: C$6.border,
    borderBottomStyle: "solid"
  },
  tableRowAlt: { backgroundColor: C$6.light },
  td: { fontSize: 9, color: C$6.text },
  // Column widths
  col1: { width: "35%" },
  col2: { width: "15%", textAlign: "right" },
  col3: { width: "15%", textAlign: "right" },
  col4: { width: "18%", textAlign: "right" },
  col5: { width: "17%", textAlign: "right" },
  // Summary
  summarySection: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 24 },
  summaryBox: { width: "55%" },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 4,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: C$6.border,
    borderBottomStyle: "solid"
  },
  summaryLabel: { fontSize: 9, color: C$6.muted },
  summaryVal: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C$6.text },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 10,
    backgroundColor: C$6.accent,
    borderRadius: 4,
    marginTop: 4
  },
  totalLabel: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#FFFFFF", flex: 1 },
  totalVal: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#FFFFFF", textAlign: "right" },
  // Terbilang
  terbilangBox: {
    marginBottom: 20,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 14,
    paddingRight: 14,
    backgroundColor: C$6.light,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: C$6.accent,
    borderLeftStyle: "solid"
  },
  terbilangLabel: { fontSize: 8, color: C$6.muted, marginBottom: 3 },
  terbilangText: { fontSize: 9, fontFamily: "Helvetica-BoldOblique", color: C$6.text },
  // Payment info box
  paymentBox: {
    marginBottom: 20,
    paddingTop: 14,
    paddingBottom: 14,
    paddingLeft: 14,
    paddingRight: 14,
    backgroundColor: C$6.accentBg,
    borderWidth: 1,
    borderColor: C$6.accentBorder,
    borderStyle: "solid",
    borderRadius: 6
  },
  paymentLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C$6.accent, letterSpacing: 1, marginBottom: 6 },
  paymentText: { fontSize: 9, color: C$6.text, marginBottom: 3 },
  paymentNote: { fontSize: 8, color: C$6.muted, marginTop: 4, fontFamily: "Helvetica-Oblique" },
  // Signature
  sigSection: { flexDirection: "row", justifyContent: "space-between", marginTop: 36 },
  sigBox: { width: "40%", alignItems: "center" },
  sigLine: { borderBottomWidth: 1, borderBottomColor: C$6.text, borderBottomStyle: "solid", width: "100%", marginTop: 40, marginBottom: 6 },
  sigName: { fontSize: 9, fontFamily: "Helvetica-Bold", textAlign: "center" },
  sigLabel: { fontSize: 8, color: C$6.muted, textAlign: "center" },
  // Footer (fixed)
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: C$6.border,
    borderTopStyle: "solid",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  footerText: { fontSize: 7, color: C$6.faint }
});
function SaleInvoice({ tenant, sale, rpa, farm, delivery, invoiceNumber, generatedBy, payments = [] }) {
  const allPayments = payments.length > 0 ? payments : (sale == null ? void 0 : sale.payments) || [];
  const remaining = (Number(sale == null ? void 0 : sale.total_revenue) || 0) - (Number(sale == null ? void 0 : sale.paid_amount) || 0);
  const statusColors2 = {
    lunas: { bg: "#F0FDF4", border: "#021a02", text: "#021a02" },
    belum_lunas: { bg: "#FEF3C7", border: "#F59E0B", text: "#F59E0B" },
    sebagian: { bg: "#EFF6FF", border: "#3B82F6", text: "#3B82F6" }
  };
  const sc = statusColors2[sale == null ? void 0 : sale.payment_status] || statusColors2.belum_lunas;
  const statusLabel = { lunas: "LUNAS", belum_lunas: "BELUM DIBAYAR", sebagian: "SEBAGIAN" }[sale == null ? void 0 : sale.payment_status] || "-";
  const weightJual = (delivery == null ? void 0 : delivery.arrived_weight_kg) ? Number(delivery.arrived_weight_kg) : Number((sale == null ? void 0 : sale.total_weight_kg) || 0);
  const totalFinal = (sale == null ? void 0 : sale.payment_status) === "lunas" ? Number((sale == null ? void 0 : sale.total_revenue) || 0) : remaining;
  return /* @__PURE__ */ jsx(Document, { children: /* @__PURE__ */ jsxs(Page, { size: "A4", style: s$6.page, children: [
    /* @__PURE__ */ jsxs(View, { style: s$6.header, children: [
      /* @__PURE__ */ jsxs(View, { children: [
        /* @__PURE__ */ jsx(Text, { style: s$6.companyName, children: (tenant == null ? void 0 : tenant.business_name) || "Bisnis" }),
        /* @__PURE__ */ jsx(Text, { style: s$6.companyDetail, children: (tenant == null ? void 0 : tenant.location) || "-" }),
        /* @__PURE__ */ jsxs(Text, { style: s$6.companyDetail, children: [
          "Tel: ",
          (tenant == null ? void 0 : tenant.phone) || "-"
        ] }),
        /* @__PURE__ */ jsx(Text, { style: s$6.companyDetail, children: "TernakOS — Platform Manajemen Peternakan" })
      ] }),
      /* @__PURE__ */ jsxs(View, { children: [
        /* @__PURE__ */ jsx(Text, { style: s$6.invoiceTitle, children: "INVOICE" }),
        /* @__PURE__ */ jsx(Text, { style: s$6.invoiceNum, children: invoiceNumber }),
        /* @__PURE__ */ jsxs(Text, { style: s$6.invoiceDate, children: [
          "Tgl: ",
          formatDatePDF(sale == null ? void 0 : sale.transaction_date)
        ] }),
        (sale == null ? void 0 : sale.due_date) && /* @__PURE__ */ jsxs(Text, { style: s$6.invoiceDue, children: [
          "Jatuh Tempo: ",
          formatDatePDF(sale.due_date)
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(View, { style: s$6.statusWrap, children: /* @__PURE__ */ jsx(View, { style: [s$6.statusBadge, { backgroundColor: sc.bg, borderWidth: 1, borderColor: sc.border, borderStyle: "solid" }], children: /* @__PURE__ */ jsx(Text, { style: [s$6.statusText, { color: sc.text }], children: statusLabel }) }) }),
    /* @__PURE__ */ jsxs(View, { style: s$6.parties, children: [
      /* @__PURE__ */ jsxs(View, { style: s$6.partyBox, children: [
        /* @__PURE__ */ jsx(Text, { style: s$6.partyLabel, children: "DARI (SELLER)" }),
        /* @__PURE__ */ jsx(Text, { style: s$6.partyName, children: (tenant == null ? void 0 : tenant.business_name) || "-" }),
        /* @__PURE__ */ jsx(Text, { style: s$6.partyDetail, children: (tenant == null ? void 0 : tenant.location) || "-" }),
        /* @__PURE__ */ jsxs(Text, { style: s$6.partyDetail, children: [
          "Tel: ",
          (tenant == null ? void 0 : tenant.phone) || "-"
        ] })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: s$6.partyBox, children: [
        /* @__PURE__ */ jsx(Text, { style: s$6.partyLabel, children: "KEPADA (BUYER)" }),
        /* @__PURE__ */ jsx(Text, { style: s$6.partyName, children: (rpa == null ? void 0 : rpa.rpa_name) || "-" }),
        /* @__PURE__ */ jsx(Text, { style: s$6.partyDetail, children: (rpa == null ? void 0 : rpa.location) || "-" }),
        /* @__PURE__ */ jsxs(Text, { style: s$6.partyDetail, children: [
          "Tel: ",
          (rpa == null ? void 0 : rpa.phone) || "-"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(View, { style: { marginBottom: 20 }, children: [
      /* @__PURE__ */ jsxs(View, { style: s$6.tableHeader, children: [
        /* @__PURE__ */ jsx(Text, { style: [s$6.thText, s$6.col1], children: "Deskripsi" }),
        /* @__PURE__ */ jsx(Text, { style: [s$6.thText, s$6.col2], children: "Ekor" }),
        /* @__PURE__ */ jsx(Text, { style: [s$6.thText, s$6.col3], children: "Berat (kg)" }),
        /* @__PURE__ */ jsx(Text, { style: [s$6.thText, s$6.col4], children: "Harga/kg" }),
        /* @__PURE__ */ jsx(Text, { style: [s$6.thText, s$6.col5], children: "Subtotal" })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: s$6.tableRow, children: [
        /* @__PURE__ */ jsxs(View, { style: s$6.col1, children: [
          /* @__PURE__ */ jsx(Text, { style: s$6.td, children: "Penjualan Ayam" }),
          /* @__PURE__ */ jsxs(Text, { style: [s$6.td, { color: C$6.muted, marginTop: 2 }], children: [
            "Kandang: ",
            (farm == null ? void 0 : farm.farm_name) || "-"
          ] })
        ] }),
        /* @__PURE__ */ jsx(Text, { style: [s$6.td, s$6.col2], children: Number((sale == null ? void 0 : sale.quantity) || 0).toLocaleString("id-ID") }),
        /* @__PURE__ */ jsxs(Text, { style: [s$6.td, s$6.col3], children: [
          weightJual.toFixed(2),
          " kg"
        ] }),
        /* @__PURE__ */ jsx(Text, { style: [s$6.td, s$6.col4], children: formatRupiahPDF(sale == null ? void 0 : sale.price_per_kg) }),
        /* @__PURE__ */ jsx(Text, { style: [s$6.td, s$6.col5], children: formatRupiahPDF(sale == null ? void 0 : sale.total_revenue) })
      ] })
    ] }),
    /* @__PURE__ */ jsx(View, { style: s$6.summarySection, children: /* @__PURE__ */ jsxs(View, { style: s$6.summaryBox, children: [
      /* @__PURE__ */ jsxs(View, { style: s$6.summaryRow, children: [
        /* @__PURE__ */ jsx(Text, { style: s$6.summaryLabel, children: "Subtotal" }),
        /* @__PURE__ */ jsx(Text, { style: s$6.summaryVal, children: formatRupiahPDF(sale == null ? void 0 : sale.total_revenue) })
      ] }),
      Number(sale == null ? void 0 : sale.paid_amount) > 0 && /* @__PURE__ */ jsxs(View, { style: s$6.summaryRow, children: [
        /* @__PURE__ */ jsx(Text, { style: s$6.summaryLabel, children: "Sudah Dibayar" }),
        /* @__PURE__ */ jsxs(Text, { style: [s$6.summaryVal, { color: C$6.accent }], children: [
          "(",
          formatRupiahPDF(sale.paid_amount),
          ")"
        ] })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: s$6.totalRow, children: [
        /* @__PURE__ */ jsx(Text, { style: s$6.totalLabel, children: (sale == null ? void 0 : sale.payment_status) === "lunas" ? "TOTAL" : "SISA TAGIHAN (HUTANG)" }),
        /* @__PURE__ */ jsx(Text, { style: s$6.totalVal, children: formatRupiahPDF(totalFinal) })
      ] })
    ] }) }),
    allPayments.length > 0 && /* @__PURE__ */ jsxs(View, { style: { marginBottom: 20 }, children: [
      /* @__PURE__ */ jsx(Text, { style: [s$6.partyLabel, { marginBottom: 8 }], children: "RIWAYAT PEMBAYARAN / CICILAN" }),
      /* @__PURE__ */ jsxs(View, { style: [s$6.tableHeader, { backgroundColor: "#F3F4F6" }], children: [
        /* @__PURE__ */ jsx(Text, { style: [s$6.thText, { color: "#4B6478", width: "40%" }], children: "Tgl & Hari" }),
        /* @__PURE__ */ jsx(Text, { style: [s$6.thText, { color: "#4B6478", width: "30%" }], children: "Metode" }),
        /* @__PURE__ */ jsx(Text, { style: [s$6.thText, { color: "#4B6478", width: "30%", textAlign: "right" }], children: "Jumlah" })
      ] }),
      allPayments.map((p, i) => /* @__PURE__ */ jsxs(View, { style: [s$6.tableRow, { borderBottomColor: "#F3F4F6" }], children: [
        /* @__PURE__ */ jsx(Text, { style: [s$6.td, { width: "40%" }], children: formatDatePDF(p.payment_date, true) }),
        /* @__PURE__ */ jsx(Text, { style: [s$6.td, { width: "30%", textTransform: "uppercase" }], children: p.payment_method }),
        /* @__PURE__ */ jsx(Text, { style: [s$6.td, { width: "30%", textAlign: "right", fontFamily: "Helvetica-Bold" }], children: formatRupiahPDF(p.amount) })
      ] }, i))
    ] }),
    /* @__PURE__ */ jsxs(View, { style: s$6.terbilangBox, children: [
      /* @__PURE__ */ jsx(Text, { style: s$6.terbilangLabel, children: "TERBILANG" }),
      /* @__PURE__ */ jsx(Text, { style: s$6.terbilangText, children: terbilang(totalFinal) })
    ] }),
    (sale == null ? void 0 : sale.payment_status) !== "lunas" && /* @__PURE__ */ jsxs(View, { style: s$6.paymentBox, children: [
      /* @__PURE__ */ jsx(Text, { style: s$6.paymentLabel, children: "INFO PEMBAYARAN" }),
      /* @__PURE__ */ jsx(Text, { style: s$6.paymentText, children: "Harap transfer ke rekening atas nama:" }),
      /* @__PURE__ */ jsx(Text, { style: [s$6.paymentText, { fontFamily: "Helvetica-Bold" }], children: (tenant == null ? void 0 : tenant.business_name) || "-" }),
      /* @__PURE__ */ jsx(Text, { style: s$6.paymentNote, children: "* Konfirmasi pembayaran via WhatsApp/telepon setelah transfer" })
    ] }),
    /* @__PURE__ */ jsxs(View, { style: s$6.sigSection, children: [
      /* @__PURE__ */ jsxs(View, { style: s$6.sigBox, children: [
        /* @__PURE__ */ jsx(Text, { style: { fontSize: 9, color: C$6.muted, marginBottom: 4 }, children: "Hormat kami," }),
        /* @__PURE__ */ jsx(View, { style: s$6.sigLine }),
        /* @__PURE__ */ jsx(Text, { style: s$6.sigName, children: generatedBy || (tenant == null ? void 0 : tenant.business_name) || "-" }),
        /* @__PURE__ */ jsx(Text, { style: s$6.sigLabel, children: "Penjual / Broker" })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: s$6.sigBox, children: [
        /* @__PURE__ */ jsx(Text, { style: { fontSize: 9, color: C$6.muted, marginBottom: 4 }, children: "Diterima oleh," }),
        /* @__PURE__ */ jsx(View, { style: s$6.sigLine }),
        /* @__PURE__ */ jsx(Text, { style: s$6.sigName, children: (rpa == null ? void 0 : rpa.rpa_name) || "________________" }),
        /* @__PURE__ */ jsx(Text, { style: s$6.sigLabel, children: "Pembeli / RPA" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(View, { style: s$6.footer, fixed: true, children: [
      /* @__PURE__ */ jsxs(Text, { style: s$6.footerText, children: [
        invoiceNumber,
        " | Dibuat: ",
        formatDatePDF(/* @__PURE__ */ new Date()),
        " | ",
        generatedBy || "-"
      ] }),
      /* @__PURE__ */ jsx(Text, { style: s$6.footerText, children: "Powered by TernakOS — ternakos.com" })
    ] })
  ] }) });
}
const C$5 = {
  bg: "#FFFFFF",
  text: "#1a1a1a",
  muted: "#666666",
  faint: "#999999",
  light: "#F9FAFB",
  border: "#E5E7EB",
  header: "#0C1319",
  accent: "#021a02"
};
const s$5 = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 60,
    paddingLeft: 40,
    paddingRight: 40,
    backgroundColor: C$5.bg,
    color: C$5.text
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: C$5.accent,
    borderBottomStyle: "solid"
  },
  companyName: { fontSize: 18, fontFamily: "Helvetica-Bold", color: C$5.header },
  companyDetail: { fontSize: 8, color: C$5.muted, marginTop: 3 },
  docTitle: { fontSize: 20, fontFamily: "Helvetica-Bold", color: C$5.accent, textAlign: "right" },
  docNum: { fontSize: 9, color: C$5.muted, textAlign: "right", marginTop: 3 },
  docDate: { fontSize: 9, color: C$5.muted, textAlign: "right", marginTop: 2 },
  parties: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  partyBox: { width: "45%" },
  partyLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C$5.accent, letterSpacing: 1, marginBottom: 6 },
  partyName: { fontSize: 12, fontFamily: "Helvetica-Bold", color: C$5.header },
  partyDetail: { fontSize: 9, color: C$5.muted, marginTop: 2 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C$5.header,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 4
  },
  thText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#FFFFFF" },
  tableRow: {
    flexDirection: "row",
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 10,
    borderBottomWidth: 1,
    borderBottomColor: C$5.border,
    borderBottomStyle: "solid"
  },
  tableRowAlt: { backgroundColor: C$5.light },
  td: { fontSize: 9, color: C$5.text },
  col1: { width: "35%" },
  col2: { width: "15%", textAlign: "right" },
  col3: { width: "15%", textAlign: "right" },
  col4: { width: "18%", textAlign: "right" },
  col5: { width: "17%", textAlign: "right" },
  summarySection: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 16 },
  summaryBox: { width: "45%" },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 4,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: C$5.border,
    borderBottomStyle: "solid"
  },
  summaryLabel: { fontSize: 9, color: C$5.muted },
  summaryVal: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C$5.text },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 10,
    backgroundColor: C$5.accent,
    borderRadius: 4,
    marginTop: 4
  },
  totalLabel: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#FFFFFF" },
  totalVal: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#FFFFFF" },
  terbilangBox: {
    marginBottom: 20,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 14,
    paddingRight: 14,
    backgroundColor: C$5.light,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: C$5.accent,
    borderLeftStyle: "solid"
  },
  terbilangLabel: { fontSize: 8, color: C$5.muted, marginBottom: 3 },
  terbilangText: { fontSize: 9, fontFamily: "Helvetica-BoldOblique", color: C$5.text },
  // Paid stamp box
  paidBox: {
    marginBottom: 20,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 14,
    paddingRight: 14,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: C$5.accent,
    borderStyle: "solid",
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center"
  },
  paidText: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C$5.accent },
  sigSection: { flexDirection: "row", justifyContent: "space-between", marginTop: 36 },
  sigBox: { width: "40%", alignItems: "center" },
  sigLine: {
    borderBottomWidth: 1,
    borderBottomColor: C$5.text,
    borderBottomStyle: "solid",
    width: "100%",
    marginTop: 40,
    marginBottom: 6
  },
  sigName: { fontSize: 9, fontFamily: "Helvetica-Bold", textAlign: "center" },
  sigLabel: { fontSize: 8, color: C$5.muted, textAlign: "center" },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: C$5.border,
    borderTopStyle: "solid",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  footerText: { fontSize: 7, color: C$5.faint }
});
function PurchaseInvoice({ tenant, purchase, farm, invoiceNumber, generatedBy }) {
  const totalModal = Number((purchase == null ? void 0 : purchase.total_cost) || 0);
  const transportCost = Number((purchase == null ? void 0 : purchase.transport_cost) || 0);
  const otherCost = Number((purchase == null ? void 0 : purchase.other_cost) || 0);
  const basePrice = totalModal - transportCost - otherCost;
  return /* @__PURE__ */ jsx(Document, { children: /* @__PURE__ */ jsxs(Page, { size: "A4", style: s$5.page, children: [
    /* @__PURE__ */ jsxs(View, { style: s$5.header, children: [
      /* @__PURE__ */ jsxs(View, { children: [
        /* @__PURE__ */ jsx(Text, { style: s$5.companyName, children: (tenant == null ? void 0 : tenant.business_name) || "Bisnis" }),
        /* @__PURE__ */ jsx(Text, { style: s$5.companyDetail, children: (tenant == null ? void 0 : tenant.location) || "-" }),
        /* @__PURE__ */ jsxs(Text, { style: s$5.companyDetail, children: [
          "Tel: ",
          (tenant == null ? void 0 : tenant.phone) || "-"
        ] }),
        /* @__PURE__ */ jsx(Text, { style: s$5.companyDetail, children: "TernakOS — Platform Manajemen Peternakan" })
      ] }),
      /* @__PURE__ */ jsxs(View, { children: [
        /* @__PURE__ */ jsx(Text, { style: s$5.docTitle, children: "BUKTI PEMBELIAN" }),
        /* @__PURE__ */ jsx(Text, { style: s$5.docNum, children: invoiceNumber }),
        /* @__PURE__ */ jsxs(Text, { style: s$5.docDate, children: [
          "Tgl: ",
          formatDatePDF(purchase == null ? void 0 : purchase.transaction_date)
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(View, { style: s$5.parties, children: [
      /* @__PURE__ */ jsxs(View, { style: s$5.partyBox, children: [
        /* @__PURE__ */ jsx(Text, { style: s$5.partyLabel, children: "PEMBELI" }),
        /* @__PURE__ */ jsx(Text, { style: s$5.partyName, children: (tenant == null ? void 0 : tenant.business_name) || "-" }),
        /* @__PURE__ */ jsx(Text, { style: s$5.partyDetail, children: (tenant == null ? void 0 : tenant.location) || "-" }),
        /* @__PURE__ */ jsxs(Text, { style: s$5.partyDetail, children: [
          "Tel: ",
          (tenant == null ? void 0 : tenant.phone) || "-"
        ] })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: s$5.partyBox, children: [
        /* @__PURE__ */ jsx(Text, { style: s$5.partyLabel, children: "DARI KANDANG" }),
        /* @__PURE__ */ jsx(Text, { style: s$5.partyName, children: (farm == null ? void 0 : farm.farm_name) || "-" }),
        (farm == null ? void 0 : farm.owner_name) ? /* @__PURE__ */ jsxs(Text, { style: s$5.partyDetail, children: [
          "Pemilik: ",
          farm.owner_name
        ] }) : null,
        /* @__PURE__ */ jsx(Text, { style: s$5.partyDetail, children: (farm == null ? void 0 : farm.location) || "-" }),
        (farm == null ? void 0 : farm.phone) ? /* @__PURE__ */ jsxs(Text, { style: s$5.partyDetail, children: [
          "Tel: ",
          farm.phone
        ] }) : null
      ] })
    ] }),
    /* @__PURE__ */ jsxs(View, { style: { marginBottom: 20 }, children: [
      /* @__PURE__ */ jsxs(View, { style: s$5.tableHeader, children: [
        /* @__PURE__ */ jsx(Text, { style: [s$5.thText, s$5.col1], children: "Deskripsi" }),
        /* @__PURE__ */ jsx(Text, { style: [s$5.thText, s$5.col2], children: "Ekor" }),
        /* @__PURE__ */ jsx(Text, { style: [s$5.thText, s$5.col3], children: "Berat (kg)" }),
        /* @__PURE__ */ jsx(Text, { style: [s$5.thText, s$5.col4], children: "Harga/kg" }),
        /* @__PURE__ */ jsx(Text, { style: [s$5.thText, s$5.col5], children: "Subtotal" })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: s$5.tableRow, children: [
        /* @__PURE__ */ jsxs(View, { style: s$5.col1, children: [
          /* @__PURE__ */ jsx(Text, { style: s$5.td, children: "Pembelian Ayam" }),
          /* @__PURE__ */ jsxs(Text, { style: [s$5.td, { color: C$5.muted, marginTop: 2 }], children: [
            "Kandang: ",
            (farm == null ? void 0 : farm.farm_name) || "-"
          ] })
        ] }),
        /* @__PURE__ */ jsx(Text, { style: [s$5.td, s$5.col2], children: Number((purchase == null ? void 0 : purchase.quantity) || 0).toLocaleString("id-ID") }),
        /* @__PURE__ */ jsxs(Text, { style: [s$5.td, s$5.col3], children: [
          Number((purchase == null ? void 0 : purchase.total_weight_kg) || 0).toFixed(2),
          " kg"
        ] }),
        /* @__PURE__ */ jsx(Text, { style: [s$5.td, s$5.col4], children: formatRupiahPDF(purchase == null ? void 0 : purchase.price_per_kg) }),
        /* @__PURE__ */ jsx(Text, { style: [s$5.td, s$5.col5], children: formatRupiahPDF(basePrice) })
      ] }),
      transportCost > 0 && /* @__PURE__ */ jsxs(View, { style: [s$5.tableRow, s$5.tableRowAlt], children: [
        /* @__PURE__ */ jsx(Text, { style: [s$5.td, s$5.col1], children: "Biaya Transport / Perjalanan" }),
        /* @__PURE__ */ jsx(Text, { style: [s$5.td, s$5.col2], children: "-" }),
        /* @__PURE__ */ jsx(Text, { style: [s$5.td, s$5.col3], children: "-" }),
        /* @__PURE__ */ jsx(Text, { style: [s$5.td, s$5.col4], children: "-" }),
        /* @__PURE__ */ jsx(Text, { style: [s$5.td, s$5.col5], children: formatRupiahPDF(transportCost) })
      ] }),
      otherCost > 0 && /* @__PURE__ */ jsxs(View, { style: [s$5.tableRow, s$5.tableRowAlt], children: [
        /* @__PURE__ */ jsx(Text, { style: [s$5.td, s$5.col1], children: "Biaya Lain-lain" }),
        /* @__PURE__ */ jsx(Text, { style: [s$5.td, s$5.col2], children: "-" }),
        /* @__PURE__ */ jsx(Text, { style: [s$5.td, s$5.col3], children: "-" }),
        /* @__PURE__ */ jsx(Text, { style: [s$5.td, s$5.col4], children: "-" }),
        /* @__PURE__ */ jsx(Text, { style: [s$5.td, s$5.col5], children: formatRupiahPDF(otherCost) })
      ] })
    ] }),
    /* @__PURE__ */ jsx(View, { style: s$5.summarySection, children: /* @__PURE__ */ jsxs(View, { style: s$5.summaryBox, children: [
      transportCost > 0 && /* @__PURE__ */ jsxs(View, { style: s$5.summaryRow, children: [
        /* @__PURE__ */ jsx(Text, { style: s$5.summaryLabel, children: "Harga Beli" }),
        /* @__PURE__ */ jsx(Text, { style: s$5.summaryVal, children: formatRupiahPDF(basePrice) })
      ] }),
      transportCost > 0 && /* @__PURE__ */ jsxs(View, { style: s$5.summaryRow, children: [
        /* @__PURE__ */ jsx(Text, { style: s$5.summaryLabel, children: "Transport" }),
        /* @__PURE__ */ jsx(Text, { style: s$5.summaryVal, children: formatRupiahPDF(transportCost) })
      ] }),
      otherCost > 0 && /* @__PURE__ */ jsxs(View, { style: s$5.summaryRow, children: [
        /* @__PURE__ */ jsx(Text, { style: s$5.summaryLabel, children: "Biaya Lain" }),
        /* @__PURE__ */ jsx(Text, { style: s$5.summaryVal, children: formatRupiahPDF(otherCost) })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: s$5.totalRow, children: [
        /* @__PURE__ */ jsx(Text, { style: s$5.totalLabel, children: "TOTAL MODAL" }),
        /* @__PURE__ */ jsx(Text, { style: s$5.totalVal, children: formatRupiahPDF(totalModal) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs(View, { style: s$5.terbilangBox, children: [
      /* @__PURE__ */ jsx(Text, { style: s$5.terbilangLabel, children: "TERBILANG" }),
      /* @__PURE__ */ jsx(Text, { style: s$5.terbilangText, children: terbilang(totalModal) })
    ] }),
    /* @__PURE__ */ jsx(View, { style: s$5.paidBox, children: /* @__PURE__ */ jsx(Text, { style: s$5.paidText, children: "✓  PEMBELIAN TELAH DILAKUKAN — LUNAS" }) }),
    /* @__PURE__ */ jsxs(View, { style: s$5.sigSection, children: [
      /* @__PURE__ */ jsxs(View, { style: s$5.sigBox, children: [
        /* @__PURE__ */ jsx(Text, { style: { fontSize: 9, color: C$5.muted, marginBottom: 4 }, children: "Pembeli," }),
        /* @__PURE__ */ jsx(View, { style: s$5.sigLine }),
        /* @__PURE__ */ jsx(Text, { style: s$5.sigName, children: generatedBy || (tenant == null ? void 0 : tenant.business_name) || "-" }),
        /* @__PURE__ */ jsx(Text, { style: s$5.sigLabel, children: "Broker / Pembeli" })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: s$5.sigBox, children: [
        /* @__PURE__ */ jsx(Text, { style: { fontSize: 9, color: C$5.muted, marginBottom: 4 }, children: "Penjual," }),
        /* @__PURE__ */ jsx(View, { style: s$5.sigLine }),
        /* @__PURE__ */ jsx(Text, { style: s$5.sigName, children: (farm == null ? void 0 : farm.owner_name) || (farm == null ? void 0 : farm.farm_name) || "________________" }),
        /* @__PURE__ */ jsx(Text, { style: s$5.sigLabel, children: "Pemilik Kandang" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(View, { style: s$5.footer, fixed: true, children: [
      /* @__PURE__ */ jsxs(Text, { style: s$5.footerText, children: [
        invoiceNumber,
        " | Dibuat: ",
        formatDatePDF(/* @__PURE__ */ new Date()),
        " | ",
        generatedBy || "-"
      ] }),
      /* @__PURE__ */ jsx(Text, { style: s$5.footerText, children: "Powered by TernakOS — ternakos.com" })
    ] })
  ] }) });
}
const C$4 = {
  bg: "#FFFFFF",
  text: "#1a1a1a",
  muted: "#666666",
  faint: "#999999",
  light: "#F9FAFB",
  border: "#E5E7EB",
  header: "#0C1319",
  accent: "#3B82F6",
  // blue
  accentBg: "#EFF6FF",
  warn: "#EF4444"
};
const s$4 = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 60,
    paddingLeft: 40,
    paddingRight: 40,
    backgroundColor: C$4.bg,
    color: C$4.text
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: C$4.accent,
    borderBottomStyle: "solid"
  },
  companyName: { fontSize: 18, fontFamily: "Helvetica-Bold", color: C$4.header },
  companyDetail: { fontSize: 8, color: C$4.muted, marginTop: 3 },
  docTitle: { fontSize: 16, fontFamily: "Helvetica-Bold", color: C$4.accent, textAlign: "right" },
  docSubTitle: { fontSize: 9, color: C$4.muted, textAlign: "right", marginTop: 2 },
  docNum: { fontSize: 9, color: C$4.muted, textAlign: "right", marginTop: 2 },
  docDate: { fontSize: 9, color: C$4.muted, textAlign: "right", marginTop: 2 },
  parties: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  partyBox: { width: "45%" },
  partyLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C$4.accent,
    letterSpacing: 1,
    marginBottom: 6
  },
  partyName: { fontSize: 12, fontFamily: "Helvetica-Bold", color: C$4.header },
  partyDetail: { fontSize: 9, color: C$4.muted, marginTop: 2 },
  // Table pengiriman
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C$4.header,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 4
  },
  thText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#FFFFFF" },
  tableRow: {
    flexDirection: "row",
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 10,
    borderBottomWidth: 1,
    borderBottomColor: C$4.border,
    borderBottomStyle: "solid"
  },
  tableRowAlt: { backgroundColor: C$4.light },
  td: { fontSize: 9, color: C$4.text },
  colDesc: { width: "28%" },
  colAwal: { width: "18%", textAlign: "right" },
  colTiba: { width: "18%", textAlign: "right" },
  colSelisih: { width: "18%", textAlign: "right" },
  colKet: { width: "18%", textAlign: "center" },
  // Info box pengiriman
  infoBox: {
    marginBottom: 20,
    paddingTop: 14,
    paddingBottom: 14,
    paddingLeft: 16,
    paddingRight: 16,
    backgroundColor: C$4.accentBg,
    borderWidth: 1,
    borderColor: C$4.accent,
    borderStyle: "solid",
    borderRadius: 6
  },
  infoBoxLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C$4.accent, letterSpacing: 1, marginBottom: 10 },
  infoGrid: { flexDirection: "row", flexWrap: "wrap" },
  infoItem: { width: "50%", marginBottom: 8 },
  infoLabel: { fontSize: 8, color: C$4.muted, marginBottom: 2 },
  infoValue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C$4.text },
  // Financial summary (jika ada harga)
  summarySection: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 20 },
  summaryBox: { width: "55%" },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 4,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: C$4.border,
    borderBottomStyle: "solid"
  },
  summaryLabel: { fontSize: 9, color: C$4.muted },
  summaryVal: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C$4.text },
  summaryWarn: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C$4.warn },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 10,
    backgroundColor: C$4.accent,
    borderRadius: 4,
    marginTop: 4
  },
  totalLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#FFFFFF" },
  totalVal: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#FFFFFF" },
  // Signature — 3 pihak
  sigSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 40
  },
  sigBox: { width: "30%", alignItems: "center" },
  sigLine: {
    borderBottomWidth: 1,
    borderBottomColor: C$4.text,
    borderBottomStyle: "solid",
    width: "100%",
    marginTop: 40,
    marginBottom: 6
  },
  sigName: { fontSize: 9, fontFamily: "Helvetica-Bold", textAlign: "center" },
  sigLabel: { fontSize: 8, color: C$4.muted, textAlign: "center" },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: C$4.border,
    borderTopStyle: "solid",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  footerText: { fontSize: 7, color: C$4.faint }
});
function durasi(departure, arrival) {
  if (!departure || !arrival) return "-";
  const diff = new Date(arrival) - new Date(departure);
  if (diff <= 0) return "-";
  const totalMin = Math.round(diff / 6e4);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h} jam ${m} mnt` : `${m} menit`;
}
function formatTime(val) {
  if (!val) return "-";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false });
}
function DeliveryReceipt({ tenant, delivery, sale, farm, rpa, invoiceNumber, generatedBy }) {
  const isArrived = ["arrived", "completed"].includes(delivery == null ? void 0 : delivery.status);
  const initCount = Number((delivery == null ? void 0 : delivery.initial_count) || 0);
  const arrivedCount = isArrived ? Number((delivery == null ? void 0 : delivery.arrived_count) || 0) : null;
  const initWeight = Number((delivery == null ? void 0 : delivery.initial_weight_kg) || 0);
  const arrivedWeight = isArrived ? Number((delivery == null ? void 0 : delivery.arrived_weight_kg) || 0) : null;
  const mortality = isArrived ? Number((delivery == null ? void 0 : delivery.mortality_count) || initCount - arrivedCount || 0) : null;
  const shrinkage = isArrived ? Number((delivery == null ? void 0 : delivery.shrinkage_kg) || initWeight - arrivedWeight || 0) : null;
  const pricePerKg = Number((sale == null ? void 0 : sale.price_per_kg) || 0);
  const shrinkagePct = isArrived && initWeight > 0 ? shrinkage / initWeight * 100 : 0;
  const revenueAktual = isArrived ? arrivedWeight * pricePerKg : 0;
  const revenueEstimasi = initWeight * pricePerKg;
  const selisihFinancial = revenueEstimasi - revenueAktual;
  return /* @__PURE__ */ jsx(Document, { children: /* @__PURE__ */ jsxs(Page, { size: "A4", style: s$4.page, children: [
    /* @__PURE__ */ jsxs(View, { style: s$4.header, children: [
      /* @__PURE__ */ jsxs(View, { children: [
        /* @__PURE__ */ jsx(Text, { style: s$4.companyName, children: (tenant == null ? void 0 : tenant.business_name) || "Bisnis" }),
        /* @__PURE__ */ jsx(Text, { style: s$4.companyDetail, children: (tenant == null ? void 0 : tenant.location) || "-" }),
        /* @__PURE__ */ jsxs(Text, { style: s$4.companyDetail, children: [
          "Tel: ",
          (tenant == null ? void 0 : tenant.phone) || "-"
        ] }),
        /* @__PURE__ */ jsx(Text, { style: s$4.companyDetail, children: "TernakOS — Platform Manajemen Peternakan" })
      ] }),
      /* @__PURE__ */ jsxs(View, { children: [
        /* @__PURE__ */ jsx(Text, { style: s$4.docTitle, children: "SURAT JALAN" }),
        /* @__PURE__ */ jsx(Text, { style: s$4.docSubTitle, children: "DELIVERY ORDER" }),
        /* @__PURE__ */ jsx(Text, { style: s$4.docNum, children: invoiceNumber }),
        /* @__PURE__ */ jsxs(Text, { style: s$4.docDate, children: [
          "Tgl: ",
          formatDatePDF((delivery == null ? void 0 : delivery.departure_time) || /* @__PURE__ */ new Date())
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(View, { style: s$4.parties, children: [
      /* @__PURE__ */ jsxs(View, { style: s$4.partyBox, children: [
        /* @__PURE__ */ jsx(Text, { style: s$4.partyLabel, children: "DARI (ASAL)" }),
        /* @__PURE__ */ jsx(Text, { style: s$4.partyName, children: (farm == null ? void 0 : farm.farm_name) || "-" }),
        /* @__PURE__ */ jsx(Text, { style: s$4.partyDetail, children: (farm == null ? void 0 : farm.location) || "-" })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: s$4.partyBox, children: [
        /* @__PURE__ */ jsx(Text, { style: s$4.partyLabel, children: "TUJUAN" }),
        /* @__PURE__ */ jsx(Text, { style: s$4.partyName, children: (rpa == null ? void 0 : rpa.rpa_name) || "-" }),
        /* @__PURE__ */ jsx(Text, { style: s$4.partyDetail, children: (rpa == null ? void 0 : rpa.location) || "-" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(View, { style: { marginBottom: 20 }, children: [
      /* @__PURE__ */ jsxs(View, { style: s$4.tableHeader, children: [
        /* @__PURE__ */ jsx(Text, { style: [s$4.thText, s$4.colDesc], children: "Deskripsi" }),
        /* @__PURE__ */ jsx(Text, { style: [s$4.thText, s$4.colAwal], children: "Awal" }),
        /* @__PURE__ */ jsx(Text, { style: [s$4.thText, s$4.colTiba], children: "Tiba" }),
        /* @__PURE__ */ jsx(Text, { style: [s$4.thText, s$4.colSelisih], children: "Selisih" }),
        /* @__PURE__ */ jsx(Text, { style: [s$4.thText, s$4.colKet], children: "Ket" })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: s$4.tableRow, children: [
        /* @__PURE__ */ jsx(Text, { style: [s$4.td, s$4.colDesc], children: "Jumlah Ayam (ekor)" }),
        /* @__PURE__ */ jsx(Text, { style: [s$4.td, s$4.colAwal], children: initCount.toLocaleString("id-ID") }),
        /* @__PURE__ */ jsx(Text, { style: [s$4.td, s$4.colTiba], children: isArrived ? arrivedCount.toLocaleString("id-ID") : "-" }),
        /* @__PURE__ */ jsx(Text, { style: [s$4.td, s$4.colSelisih, { color: mortality > 0 ? C$4.warn : C$4.text }], children: isArrived ? mortality > 0 ? `-${mortality}` : "0" : "-" }),
        /* @__PURE__ */ jsx(Text, { style: [s$4.td, s$4.colKet, { color: mortality > 0 ? C$4.warn : C$4.text }], children: isArrived ? mortality > 0 ? "Ada kematian" : "OK" : "-" })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: [s$4.tableRow, s$4.tableRowAlt], children: [
        /* @__PURE__ */ jsx(Text, { style: [s$4.td, s$4.colDesc], children: "Berat (kg)" }),
        /* @__PURE__ */ jsx(Text, { style: [s$4.td, s$4.colAwal], children: initWeight.toFixed(2) }),
        /* @__PURE__ */ jsx(Text, { style: [s$4.td, s$4.colTiba], children: isArrived ? arrivedWeight.toFixed(2) : "-" }),
        /* @__PURE__ */ jsx(Text, { style: [s$4.td, s$4.colSelisih, { color: shrinkage > 0 ? C$4.warn : C$4.text }], children: isArrived ? shrinkage > 0 ? `-${shrinkage.toFixed(2)}` : "0.00" : "-" }),
        /* @__PURE__ */ jsx(Text, { style: [s$4.td, s$4.colKet, { color: shrinkagePct > 2 ? C$4.warn : C$4.text }], children: isArrived ? shrinkage > 0 ? `${shrinkagePct.toFixed(1)}%` : "OK" : "-" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(View, { style: s$4.infoBox, children: [
      /* @__PURE__ */ jsx(Text, { style: s$4.infoBoxLabel, children: "DETAIL PENGIRIMAN" }),
      /* @__PURE__ */ jsxs(View, { style: s$4.infoGrid, children: [
        /* @__PURE__ */ jsxs(View, { style: s$4.infoItem, children: [
          /* @__PURE__ */ jsx(Text, { style: s$4.infoLabel, children: "Sopir" }),
          /* @__PURE__ */ jsx(Text, { style: s$4.infoValue, children: (delivery == null ? void 0 : delivery.driver_name) || "-" })
        ] }),
        /* @__PURE__ */ jsxs(View, { style: s$4.infoItem, children: [
          /* @__PURE__ */ jsx(Text, { style: s$4.infoLabel, children: "Kendaraan" }),
          /* @__PURE__ */ jsx(Text, { style: s$4.infoValue, children: [delivery == null ? void 0 : delivery.vehicle_type, delivery == null ? void 0 : delivery.vehicle_plate].filter(Boolean).join(" · ") || "-" })
        ] }),
        /* @__PURE__ */ jsxs(View, { style: s$4.infoItem, children: [
          /* @__PURE__ */ jsx(Text, { style: s$4.infoLabel, children: "Jam Muat" }),
          /* @__PURE__ */ jsx(Text, { style: s$4.infoValue, children: formatTime(delivery == null ? void 0 : delivery.load_time) })
        ] }),
        /* @__PURE__ */ jsxs(View, { style: s$4.infoItem, children: [
          /* @__PURE__ */ jsx(Text, { style: s$4.infoLabel, children: "Waktu Berangkat" }),
          /* @__PURE__ */ jsx(Text, { style: s$4.infoValue, children: formatTime(delivery == null ? void 0 : delivery.departure_time) })
        ] }),
        /* @__PURE__ */ jsxs(View, { style: s$4.infoItem, children: [
          /* @__PURE__ */ jsx(Text, { style: s$4.infoLabel, children: "Waktu Tiba" }),
          /* @__PURE__ */ jsx(Text, { style: s$4.infoValue, children: formatTime(delivery == null ? void 0 : delivery.arrival_time) })
        ] }),
        /* @__PURE__ */ jsxs(View, { style: s$4.infoItem, children: [
          /* @__PURE__ */ jsx(Text, { style: s$4.infoLabel, children: "Durasi" }),
          /* @__PURE__ */ jsx(Text, { style: s$4.infoValue, children: durasi(delivery == null ? void 0 : delivery.departure_time, delivery == null ? void 0 : delivery.arrival_time) })
        ] })
      ] })
    ] }),
    pricePerKg > 0 && isArrived && /* @__PURE__ */ jsx(View, { style: s$4.summarySection, children: /* @__PURE__ */ jsxs(View, { style: s$4.summaryBox, children: [
      /* @__PURE__ */ jsxs(View, { style: s$4.summaryRow, children: [
        /* @__PURE__ */ jsxs(Text, { style: s$4.summaryLabel, children: [
          "Estimasi (",
          initWeight.toFixed(2),
          " kg)"
        ] }),
        /* @__PURE__ */ jsx(Text, { style: s$4.summaryVal, children: formatRupiahPDF(revenueEstimasi) })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: s$4.summaryRow, children: [
        /* @__PURE__ */ jsxs(Text, { style: s$4.summaryLabel, children: [
          "Aktual (",
          arrivedWeight.toFixed(2),
          " kg)"
        ] }),
        /* @__PURE__ */ jsx(Text, { style: s$4.summaryVal, children: formatRupiahPDF(revenueAktual) })
      ] }),
      shrinkage > 0 && /* @__PURE__ */ jsxs(View, { style: s$4.summaryRow, children: [
        /* @__PURE__ */ jsxs(Text, { style: s$4.summaryLabel, children: [
          "Susut ",
          shrinkagePct.toFixed(1),
          "%",
          shrinkagePct > 2 ? " ⚠" : ""
        ] }),
        /* @__PURE__ */ jsxs(Text, { style: [s$4.summaryVal, { color: shrinkagePct > 2 ? C$4.warn : C$4.text }], children: [
          "-",
          formatRupiahPDF(selisihFinancial)
        ] })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: s$4.totalRow, children: [
        /* @__PURE__ */ jsx(Text, { style: s$4.totalLabel, children: "PENDAPATAN AKTUAL" }),
        /* @__PURE__ */ jsx(Text, { style: s$4.totalVal, children: formatRupiahPDF(revenueAktual) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs(View, { style: s$4.sigSection, children: [
      /* @__PURE__ */ jsxs(View, { style: s$4.sigBox, children: [
        /* @__PURE__ */ jsx(Text, { style: { fontSize: 9, color: C$4.muted, marginBottom: 4, textAlign: "center" }, children: "Pengirim," }),
        /* @__PURE__ */ jsx(View, { style: s$4.sigLine }),
        /* @__PURE__ */ jsx(Text, { style: s$4.sigName, children: generatedBy || (tenant == null ? void 0 : tenant.business_name) || "-" }),
        /* @__PURE__ */ jsx(Text, { style: s$4.sigLabel, children: "Broker / Pengirim" })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: s$4.sigBox, children: [
        /* @__PURE__ */ jsx(Text, { style: { fontSize: 9, color: C$4.muted, marginBottom: 4, textAlign: "center" }, children: "Sopir," }),
        /* @__PURE__ */ jsx(View, { style: s$4.sigLine }),
        /* @__PURE__ */ jsx(Text, { style: s$4.sigName, children: (delivery == null ? void 0 : delivery.driver_name) || "________________" }),
        /* @__PURE__ */ jsx(Text, { style: s$4.sigLabel, children: "Sopir Pengiriman" })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: s$4.sigBox, children: [
        /* @__PURE__ */ jsx(Text, { style: { fontSize: 9, color: C$4.muted, marginBottom: 4, textAlign: "center" }, children: "Penerima," }),
        /* @__PURE__ */ jsx(View, { style: s$4.sigLine }),
        /* @__PURE__ */ jsx(Text, { style: s$4.sigName, children: (rpa == null ? void 0 : rpa.rpa_name) || "________________" }),
        /* @__PURE__ */ jsx(Text, { style: s$4.sigLabel, children: "Penerima / RPA" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(View, { style: s$4.footer, fixed: true, children: [
      /* @__PURE__ */ jsxs(Text, { style: s$4.footerText, children: [
        invoiceNumber,
        " | ",
        formatDatePDF(/* @__PURE__ */ new Date()),
        " | ",
        generatedBy || "-"
      ] }),
      /* @__PURE__ */ jsx(Text, { style: s$4.footerText, children: "Powered by TernakOS — ternakos.com" })
    ] })
  ] }) });
}
const C$3 = {
  bg: "#FFFFFF",
  text: "#1a1a1a",
  muted: "#666666",
  faint: "#999999",
  light: "#F9FAFB",
  border: "#E5E7EB",
  header: "#0C1319",
  accent: "#021a02",
  accentBg: "#F0FDF4"
};
const s$3 = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 60,
    paddingLeft: 40,
    paddingRight: 40,
    backgroundColor: C$3.bg,
    color: C$3.text
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: C$3.accent,
    borderBottomStyle: "solid"
  },
  companyName: { fontSize: 18, fontFamily: "Helvetica-Bold", color: C$3.header },
  companyDetail: { fontSize: 8, color: C$3.muted, marginTop: 3 },
  docTitle: { fontSize: 18, fontFamily: "Helvetica-Bold", color: C$3.accent, textAlign: "right" },
  docNum: { fontSize: 9, color: C$3.muted, textAlign: "right", marginTop: 3 },
  docDate: { fontSize: 9, color: C$3.muted, textAlign: "right", marginTop: 2 },
  // Large receipt box
  receiptBox: {
    marginBottom: 24,
    paddingTop: 20,
    paddingBottom: 20,
    paddingLeft: 24,
    paddingRight: 24,
    backgroundColor: C$3.accentBg,
    borderWidth: 2,
    borderColor: C$3.accent,
    borderStyle: "solid",
    borderRadius: 8,
    alignItems: "center"
  },
  receiptLabel: { fontSize: 9, color: C$3.muted, letterSpacing: 1, marginBottom: 6 },
  receiptPayer: { fontSize: 20, fontFamily: "Helvetica-Bold", color: C$3.header, marginBottom: 10, textAlign: "center" },
  receiptAmtLabel: { fontSize: 9, color: C$3.muted, letterSpacing: 1, marginBottom: 4 },
  receiptAmount: { fontSize: 28, fontFamily: "Helvetica-Bold", color: C$3.accent, textAlign: "center" },
  // Detail table
  detailSection: { marginBottom: 20 },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: C$3.border,
    borderBottomStyle: "solid"
  },
  detailLabel: { fontSize: 9, color: C$3.muted },
  detailValue: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C$3.text },
  // Summary box
  summarySection: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 16 },
  summaryBox: { width: "50%" },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 4,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: C$3.border,
    borderBottomStyle: "solid"
  },
  summaryLabel: { fontSize: 9, color: C$3.muted },
  summaryVal: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C$3.text },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 10,
    backgroundColor: C$3.accent,
    borderRadius: 4,
    marginTop: 4
  },
  totalLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#FFFFFF" },
  totalVal: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#FFFFFF" },
  // Terbilang
  terbilangBox: {
    marginBottom: 20,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 14,
    paddingRight: 14,
    backgroundColor: C$3.light,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: C$3.accent,
    borderLeftStyle: "solid"
  },
  terbilangLabel: { fontSize: 8, color: C$3.muted, marginBottom: 3 },
  terbilangText: { fontSize: 9, fontFamily: "Helvetica-BoldOblique", color: C$3.text },
  // LUNAS badge
  lunasBadge: {
    marginBottom: 20,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 14,
    paddingRight: 14,
    backgroundColor: C$3.accentBg,
    borderWidth: 1,
    borderColor: C$3.accent,
    borderStyle: "solid",
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center"
  },
  lunasText: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C$3.accent },
  // Signature
  sigSection: { flexDirection: "row", justifyContent: "space-between", marginTop: 36 },
  sigBox: { width: "40%", alignItems: "center" },
  sigLine: {
    borderBottomWidth: 1,
    borderBottomColor: C$3.text,
    borderBottomStyle: "solid",
    width: "100%",
    marginTop: 40,
    marginBottom: 6
  },
  sigName: { fontSize: 9, fontFamily: "Helvetica-Bold", textAlign: "center" },
  sigLabel: { fontSize: 8, color: C$3.muted, textAlign: "center" },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: C$3.border,
    borderTopStyle: "solid",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  footerText: { fontSize: 7, color: C$3.faint }
});
function PaymentReceipt({ tenant, payment, sale, rpa, invoiceNumber, generatedBy }) {
  const amount = Number((payment == null ? void 0 : payment.amount) || 0);
  const totalRevenue = Number((sale == null ? void 0 : sale.total_revenue) || 0);
  const paidAmount = Number((sale == null ? void 0 : sale.paid_amount) || 0);
  const sisaSetelah = Math.max(0, totalRevenue - paidAmount);
  const paidBefore = Math.max(0, paidAmount - amount);
  const isLunas = (sale == null ? void 0 : sale.payment_status) === "lunas" || sisaSetelah <= 0;
  const methodLabels = {
    cash: "Tunai",
    transfer: "Transfer Bank",
    bank_transfer: "Transfer Bank",
    check: "Cek / Giro",
    other: "Lainnya"
  };
  const methodLabel = methodLabels[payment == null ? void 0 : payment.payment_method] || (payment == null ? void 0 : payment.payment_method) || "-";
  return /* @__PURE__ */ jsx(Document, { children: /* @__PURE__ */ jsxs(Page, { size: "A4", style: s$3.page, children: [
    /* @__PURE__ */ jsxs(View, { style: s$3.header, children: [
      /* @__PURE__ */ jsxs(View, { children: [
        /* @__PURE__ */ jsx(Text, { style: s$3.companyName, children: (tenant == null ? void 0 : tenant.business_name) || "Bisnis" }),
        /* @__PURE__ */ jsx(Text, { style: s$3.companyDetail, children: (tenant == null ? void 0 : tenant.location) || "-" }),
        /* @__PURE__ */ jsxs(Text, { style: s$3.companyDetail, children: [
          "Tel: ",
          (tenant == null ? void 0 : tenant.phone) || "-"
        ] }),
        /* @__PURE__ */ jsx(Text, { style: s$3.companyDetail, children: "TernakOS — Platform Manajemen Peternakan" })
      ] }),
      /* @__PURE__ */ jsxs(View, { children: [
        /* @__PURE__ */ jsx(Text, { style: s$3.docTitle, children: "KWITANSI" }),
        /* @__PURE__ */ jsx(Text, { style: s$3.docNum, children: invoiceNumber }),
        /* @__PURE__ */ jsxs(Text, { style: s$3.docDate, children: [
          "Tgl: ",
          formatDatePDF(payment == null ? void 0 : payment.payment_date)
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(View, { style: s$3.receiptBox, children: [
      /* @__PURE__ */ jsx(Text, { style: s$3.receiptLabel, children: "TELAH DITERIMA DARI" }),
      /* @__PURE__ */ jsx(Text, { style: s$3.receiptPayer, children: (rpa == null ? void 0 : rpa.rpa_name) || "-" }),
      /* @__PURE__ */ jsx(Text, { style: s$3.receiptAmtLabel, children: "SEBESAR" }),
      /* @__PURE__ */ jsx(Text, { style: s$3.receiptAmount, children: formatRupiahPDF(amount) })
    ] }),
    /* @__PURE__ */ jsxs(View, { style: s$3.detailSection, children: [
      /* @__PURE__ */ jsxs(View, { style: s$3.detailRow, children: [
        /* @__PURE__ */ jsx(Text, { style: s$3.detailLabel, children: "Metode Pembayaran" }),
        /* @__PURE__ */ jsx(Text, { style: s$3.detailValue, children: methodLabel })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: s$3.detailRow, children: [
        /* @__PURE__ */ jsx(Text, { style: s$3.detailLabel, children: "Tanggal Pembayaran" }),
        /* @__PURE__ */ jsx(Text, { style: s$3.detailValue, children: formatDatePDF(payment == null ? void 0 : payment.payment_date) })
      ] }),
      (payment == null ? void 0 : payment.notes) ? /* @__PURE__ */ jsxs(View, { style: s$3.detailRow, children: [
        /* @__PURE__ */ jsx(Text, { style: s$3.detailLabel, children: "Keterangan" }),
        /* @__PURE__ */ jsx(Text, { style: s$3.detailValue, children: payment.notes })
      ] }) : null
    ] }),
    /* @__PURE__ */ jsx(View, { style: s$3.summarySection, children: /* @__PURE__ */ jsxs(View, { style: s$3.summaryBox, children: [
      /* @__PURE__ */ jsxs(View, { style: s$3.summaryRow, children: [
        /* @__PURE__ */ jsx(Text, { style: s$3.summaryLabel, children: "Total Tagihan" }),
        /* @__PURE__ */ jsx(Text, { style: s$3.summaryVal, children: formatRupiahPDF(totalRevenue) })
      ] }),
      paidBefore > 0 && /* @__PURE__ */ jsxs(View, { style: s$3.summaryRow, children: [
        /* @__PURE__ */ jsx(Text, { style: s$3.summaryLabel, children: "Sudah Dibayar Sebelumnya" }),
        /* @__PURE__ */ jsxs(Text, { style: [s$3.summaryVal, { color: C$3.accent }], children: [
          "(",
          formatRupiahPDF(paidBefore),
          ")"
        ] })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: s$3.summaryRow, children: [
        /* @__PURE__ */ jsx(Text, { style: s$3.summaryLabel, children: "Pembayaran Ini" }),
        /* @__PURE__ */ jsxs(Text, { style: [s$3.summaryVal, { color: C$3.accent }], children: [
          "(",
          formatRupiahPDF(amount),
          ")"
        ] })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: s$3.totalRow, children: [
        /* @__PURE__ */ jsx(Text, { style: s$3.totalLabel, children: "SISA HUTANG" }),
        /* @__PURE__ */ jsx(Text, { style: s$3.totalVal, children: formatRupiahPDF(sisaSetelah) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs(View, { style: s$3.terbilangBox, children: [
      /* @__PURE__ */ jsx(Text, { style: s$3.terbilangLabel, children: "TERBILANG (PEMBAYARAN INI)" }),
      /* @__PURE__ */ jsx(Text, { style: s$3.terbilangText, children: terbilang(amount) })
    ] }),
    isLunas && /* @__PURE__ */ jsx(View, { style: s$3.lunasBadge, children: /* @__PURE__ */ jsx(Text, { style: s$3.lunasText, children: "✓  HUTANG TELAH LUNAS — TERIMA KASIH" }) }),
    /* @__PURE__ */ jsxs(View, { style: s$3.sigSection, children: [
      /* @__PURE__ */ jsxs(View, { style: s$3.sigBox, children: [
        /* @__PURE__ */ jsx(Text, { style: { fontSize: 9, color: C$3.muted, marginBottom: 4 }, children: "Yang Menerima," }),
        /* @__PURE__ */ jsx(View, { style: s$3.sigLine }),
        /* @__PURE__ */ jsx(Text, { style: s$3.sigName, children: generatedBy || (tenant == null ? void 0 : tenant.business_name) || "-" }),
        /* @__PURE__ */ jsx(Text, { style: s$3.sigLabel, children: "Penjual / Broker" })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: s$3.sigBox, children: [
        /* @__PURE__ */ jsx(Text, { style: { fontSize: 9, color: C$3.muted, marginBottom: 4 }, children: "Yang Membayar," }),
        /* @__PURE__ */ jsx(View, { style: s$3.sigLine }),
        /* @__PURE__ */ jsx(Text, { style: s$3.sigName, children: (rpa == null ? void 0 : rpa.rpa_name) || "________________" }),
        /* @__PURE__ */ jsx(Text, { style: s$3.sigLabel, children: "Pembeli / RPA" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(View, { style: s$3.footer, fixed: true, children: [
      /* @__PURE__ */ jsxs(Text, { style: s$3.footerText, children: [
        invoiceNumber,
        " | Dibuat: ",
        formatDatePDF(/* @__PURE__ */ new Date()),
        " | ",
        generatedBy || "-"
      ] }),
      /* @__PURE__ */ jsx(Text, { style: s$3.footerText, children: "Powered by TernakOS — ternakos.com" })
    ] })
  ] }) });
}
const C$2 = {
  bg: "#FFFFFF",
  text: "#1a1a1a",
  muted: "#666666",
  faint: "#999999",
  light: "#F5F3FF",
  // purple tint
  border: "#E5E7EB",
  header: "#0C1319",
  accent: "#7C3AED",
  // purple
  accentBg: "#F5F3FF"
};
const s$2 = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 60,
    paddingLeft: 40,
    paddingRight: 40,
    backgroundColor: C$2.bg,
    color: C$2.text
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: C$2.accent,
    borderBottomStyle: "solid"
  },
  companyName: { fontSize: 18, fontFamily: "Helvetica-Bold", color: C$2.header },
  companyDetail: { fontSize: 8, color: C$2.muted, marginTop: 3 },
  docTitle: { fontSize: 16, fontFamily: "Helvetica-Bold", color: C$2.accent, textAlign: "right" },
  docSubTitle: { fontSize: 8, color: C$2.muted, textAlign: "right", marginTop: 2 },
  docNum: { fontSize: 9, color: C$2.muted, textAlign: "right", marginTop: 2 },
  docDate: { fontSize: 9, color: C$2.muted, textAlign: "right", marginTop: 2 },
  // Parties
  parties: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  partyBox: { width: "45%" },
  partyLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C$2.accent, letterSpacing: 1, marginBottom: 6 },
  partyName: { fontSize: 12, fontFamily: "Helvetica-Bold", color: C$2.header },
  partyDetail: { fontSize: 9, color: C$2.muted, marginTop: 2 },
  // Cycle info box
  cycleBox: {
    marginBottom: 20,
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 14,
    paddingRight: 14,
    backgroundColor: C$2.accentBg,
    borderWidth: 1,
    borderColor: C$2.accent,
    borderStyle: "solid",
    borderRadius: 6,
    flexDirection: "row",
    flexWrap: "wrap"
  },
  cycleItem: { width: "25%", marginBottom: 4 },
  cycleLabel: { fontSize: 7, color: C$2.muted, letterSpacing: 0.5 },
  cycleValue: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C$2.text },
  // Table
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C$2.header,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 4
  },
  thText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#FFFFFF" },
  tableRow: {
    flexDirection: "row",
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 10,
    borderBottomWidth: 1,
    borderBottomColor: C$2.border,
    borderBottomStyle: "solid"
  },
  td: { fontSize: 9, color: C$2.text },
  col1: { width: "30%" },
  // Jenis Ternak
  col2: { width: "12%", textAlign: "right" },
  // Ekor
  col3: { width: "14%", textAlign: "right" },
  // Berat Avg
  col4: { width: "16%", textAlign: "right" },
  // Total Berat
  col5: { width: "14%", textAlign: "right" },
  // Harga/kg
  col6: { width: "14%", textAlign: "right" },
  // Subtotal
  // Summary
  summarySection: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 16 },
  summaryBox: { width: "45%" },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 4,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: C$2.border,
    borderBottomStyle: "solid"
  },
  summaryLabel: { fontSize: 9, color: C$2.muted },
  summaryVal: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C$2.text },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 10,
    backgroundColor: C$2.accent,
    borderRadius: 4,
    marginTop: 4
  },
  totalLabel: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#FFFFFF" },
  totalVal: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#FFFFFF" },
  // Terbilang
  terbilangBox: {
    marginBottom: 20,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 14,
    paddingRight: 14,
    backgroundColor: C$2.light,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: C$2.accent,
    borderLeftStyle: "solid"
  },
  terbilangLabel: { fontSize: 8, color: C$2.muted, marginBottom: 3 },
  terbilangText: { fontSize: 9, fontFamily: "Helvetica-BoldOblique", color: C$2.text },
  // Notes
  notesBox: {
    marginBottom: 20,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 14,
    paddingRight: 14,
    backgroundColor: "rgba(255,255,255,0)",
    borderWidth: 1,
    borderColor: C$2.border,
    borderStyle: "solid",
    borderRadius: 6
  },
  notesLabel: { fontSize: 8, color: C$2.muted, marginBottom: 3 },
  notesText: { fontSize: 9, color: C$2.text },
  // Signature
  sigSection: { flexDirection: "row", justifyContent: "space-between", marginTop: 36 },
  sigBox: { width: "40%", alignItems: "center" },
  sigLine: {
    borderBottomWidth: 1,
    borderBottomColor: C$2.text,
    borderBottomStyle: "solid",
    width: "100%",
    marginTop: 40,
    marginBottom: 6
  },
  sigName: { fontSize: 9, fontFamily: "Helvetica-Bold", textAlign: "center" },
  sigLabel: { fontSize: 8, color: C$2.muted, textAlign: "center" },
  // Footer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: C$2.border,
    borderTopStyle: "solid",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  footerText: { fontSize: 7, color: C$2.faint }
});
const CHICKEN_LABELS = {
  ayam_broiler: "Ayam Broiler",
  ayam_pejantan: "Ayam Pejantan",
  ayam_kampung: "Ayam Kampung",
  ayam_layer: "Ayam Layer (Afkir)"
};
function PeternakInvoice({
  tenant,
  cycle,
  farm,
  broker_name,
  total_ekor,
  total_berat,
  price_per_kg,
  invoiceNumber,
  generatedBy
}) {
  const ekor = Number(total_ekor || 0);
  const berat = Number(total_berat || 0);
  const priceKg = Number(price_per_kg || 0);
  const subtotal = Number((cycle == null ? void 0 : cycle.total_revenue) || berat * priceKg);
  const avgWeight = ekor > 0 ? berat / ekor : 0;
  const cycleNum = (cycle == null ? void 0 : cycle.cycle_number) ?? "-";
  const chickenLbl = CHICKEN_LABELS[cycle == null ? void 0 : cycle.chicken_type] || (cycle == null ? void 0 : cycle.chicken_type) || "-";
  const harvestDate = cycle == null ? void 0 : cycle.actual_harvest_date;
  const fcr = (cycle == null ? void 0 : cycle.final_fcr) ? Number(cycle.final_fcr).toFixed(2) : "-";
  return /* @__PURE__ */ jsx(Document, { children: /* @__PURE__ */ jsxs(Page, { size: "A4", style: s$2.page, children: [
    /* @__PURE__ */ jsxs(View, { style: s$2.header, children: [
      /* @__PURE__ */ jsxs(View, { children: [
        /* @__PURE__ */ jsx(Text, { style: s$2.companyName, children: (tenant == null ? void 0 : tenant.business_name) || "Peternak" }),
        /* @__PURE__ */ jsx(Text, { style: s$2.companyDetail, children: (farm == null ? void 0 : farm.farm_name) || (tenant == null ? void 0 : tenant.location) || "-" }),
        /* @__PURE__ */ jsxs(Text, { style: s$2.companyDetail, children: [
          "Tel: ",
          (tenant == null ? void 0 : tenant.phone) || "-"
        ] }),
        /* @__PURE__ */ jsx(Text, { style: s$2.companyDetail, children: "TernakOS — Platform Manajemen Peternakan" })
      ] }),
      /* @__PURE__ */ jsxs(View, { children: [
        /* @__PURE__ */ jsx(Text, { style: s$2.docTitle, children: "TAGIHAN" }),
        /* @__PURE__ */ jsx(Text, { style: s$2.docSubTitle, children: "PENJUALAN TERNAK" }),
        /* @__PURE__ */ jsx(Text, { style: s$2.docNum, children: invoiceNumber }),
        /* @__PURE__ */ jsxs(Text, { style: s$2.docDate, children: [
          "Tgl: ",
          formatDatePDF(harvestDate || /* @__PURE__ */ new Date())
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(View, { style: s$2.parties, children: [
      /* @__PURE__ */ jsxs(View, { style: s$2.partyBox, children: [
        /* @__PURE__ */ jsx(Text, { style: s$2.partyLabel, children: "DARI (PETERNAK)" }),
        /* @__PURE__ */ jsx(Text, { style: s$2.partyName, children: (tenant == null ? void 0 : tenant.business_name) || "-" }),
        /* @__PURE__ */ jsx(Text, { style: s$2.partyDetail, children: (farm == null ? void 0 : farm.farm_name) || "-" }),
        /* @__PURE__ */ jsx(Text, { style: s$2.partyDetail, children: (tenant == null ? void 0 : tenant.location) || "-" }),
        /* @__PURE__ */ jsxs(Text, { style: s$2.partyDetail, children: [
          "Tel: ",
          (tenant == null ? void 0 : tenant.phone) || "-"
        ] })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: s$2.partyBox, children: [
        /* @__PURE__ */ jsx(Text, { style: s$2.partyLabel, children: "KEPADA (PEMBELI)" }),
        /* @__PURE__ */ jsx(Text, { style: s$2.partyName, children: broker_name || "—" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(View, { style: s$2.cycleBox, children: [
      /* @__PURE__ */ jsxs(View, { style: s$2.cycleItem, children: [
        /* @__PURE__ */ jsx(Text, { style: s$2.cycleLabel, children: "SIKLUS" }),
        /* @__PURE__ */ jsxs(Text, { style: s$2.cycleValue, children: [
          "#",
          cycleNum
        ] })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: s$2.cycleItem, children: [
        /* @__PURE__ */ jsx(Text, { style: s$2.cycleLabel, children: "JENIS TERNAK" }),
        /* @__PURE__ */ jsx(Text, { style: s$2.cycleValue, children: chickenLbl })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: s$2.cycleItem, children: [
        /* @__PURE__ */ jsx(Text, { style: s$2.cycleLabel, children: "TGL PANEN" }),
        /* @__PURE__ */ jsx(Text, { style: s$2.cycleValue, children: formatDatePDF(harvestDate) })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: s$2.cycleItem, children: [
        /* @__PURE__ */ jsx(Text, { style: s$2.cycleLabel, children: "FCR FINAL" }),
        /* @__PURE__ */ jsx(Text, { style: s$2.cycleValue, children: fcr })
      ] }),
      (farm == null ? void 0 : farm.mitra_company) ? /* @__PURE__ */ jsxs(View, { style: s$2.cycleItem, children: [
        /* @__PURE__ */ jsx(Text, { style: s$2.cycleLabel, children: "MITRA" }),
        /* @__PURE__ */ jsx(Text, { style: s$2.cycleValue, children: farm.mitra_company })
      ] }) : null
    ] }),
    /* @__PURE__ */ jsxs(View, { style: { marginBottom: 20 }, children: [
      /* @__PURE__ */ jsxs(View, { style: s$2.tableHeader, children: [
        /* @__PURE__ */ jsx(Text, { style: [s$2.thText, s$2.col1], children: "Jenis Ternak" }),
        /* @__PURE__ */ jsx(Text, { style: [s$2.thText, s$2.col2], children: "Ekor" }),
        /* @__PURE__ */ jsx(Text, { style: [s$2.thText, s$2.col3], children: "Berat Avg" }),
        /* @__PURE__ */ jsx(Text, { style: [s$2.thText, s$2.col4], children: "Total Berat" }),
        /* @__PURE__ */ jsx(Text, { style: [s$2.thText, s$2.col5], children: "Harga/kg" }),
        /* @__PURE__ */ jsx(Text, { style: [s$2.thText, s$2.col6], children: "Subtotal" })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: s$2.tableRow, children: [
        /* @__PURE__ */ jsxs(View, { style: s$2.col1, children: [
          /* @__PURE__ */ jsx(Text, { style: s$2.td, children: chickenLbl }),
          /* @__PURE__ */ jsx(Text, { style: [s$2.td, { color: C$2.muted, marginTop: 2 }], children: (farm == null ? void 0 : farm.farm_name) || "-" })
        ] }),
        /* @__PURE__ */ jsx(Text, { style: [s$2.td, s$2.col2], children: ekor > 0 ? ekor.toLocaleString("id-ID") : "-" }),
        /* @__PURE__ */ jsx(Text, { style: [s$2.td, s$2.col3], children: avgWeight > 0 ? `${avgWeight.toFixed(2)} kg` : "-" }),
        /* @__PURE__ */ jsx(Text, { style: [s$2.td, s$2.col4], children: berat > 0 ? `${berat.toFixed(2)} kg` : "-" }),
        /* @__PURE__ */ jsx(Text, { style: [s$2.td, s$2.col5], children: priceKg > 0 ? formatRupiahPDF(priceKg) : "-" }),
        /* @__PURE__ */ jsx(Text, { style: [s$2.td, s$2.col6], children: formatRupiahPDF(subtotal) })
      ] })
    ] }),
    /* @__PURE__ */ jsx(View, { style: s$2.summarySection, children: /* @__PURE__ */ jsxs(View, { style: s$2.summaryBox, children: [
      Number(cycle == null ? void 0 : cycle.total_cost) > 0 && /* @__PURE__ */ jsxs(View, { style: s$2.summaryRow, children: [
        /* @__PURE__ */ jsx(Text, { style: s$2.summaryLabel, children: "Biaya Produksi" }),
        /* @__PURE__ */ jsx(Text, { style: s$2.summaryVal, children: formatRupiahPDF(cycle.total_cost) })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: s$2.totalRow, children: [
        /* @__PURE__ */ jsx(Text, { style: s$2.totalLabel, children: "TOTAL TAGIHAN" }),
        /* @__PURE__ */ jsx(Text, { style: s$2.totalVal, children: formatRupiahPDF(subtotal) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs(View, { style: s$2.terbilangBox, children: [
      /* @__PURE__ */ jsx(Text, { style: s$2.terbilangLabel, children: "TERBILANG" }),
      /* @__PURE__ */ jsx(Text, { style: s$2.terbilangText, children: terbilang(subtotal) })
    ] }),
    (cycle == null ? void 0 : cycle.notes) ? /* @__PURE__ */ jsxs(View, { style: s$2.notesBox, children: [
      /* @__PURE__ */ jsx(Text, { style: s$2.notesLabel, children: "CATATAN" }),
      /* @__PURE__ */ jsx(Text, { style: s$2.notesText, children: cycle.notes })
    ] }) : null,
    /* @__PURE__ */ jsxs(View, { style: s$2.sigSection, children: [
      /* @__PURE__ */ jsxs(View, { style: s$2.sigBox, children: [
        /* @__PURE__ */ jsx(Text, { style: { fontSize: 9, color: C$2.muted, marginBottom: 4 }, children: "Penjual," }),
        /* @__PURE__ */ jsx(View, { style: s$2.sigLine }),
        /* @__PURE__ */ jsx(Text, { style: s$2.sigName, children: generatedBy || (tenant == null ? void 0 : tenant.business_name) || "-" }),
        /* @__PURE__ */ jsx(Text, { style: s$2.sigLabel, children: "Peternak / Penjual" })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: s$2.sigBox, children: [
        /* @__PURE__ */ jsx(Text, { style: { fontSize: 9, color: C$2.muted, marginBottom: 4 }, children: "Pembeli," }),
        /* @__PURE__ */ jsx(View, { style: s$2.sigLine }),
        /* @__PURE__ */ jsx(Text, { style: s$2.sigName, children: broker_name || "________________" }),
        /* @__PURE__ */ jsx(Text, { style: s$2.sigLabel, children: "Broker / Pembeli" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(View, { style: s$2.footer, fixed: true, children: [
      /* @__PURE__ */ jsxs(Text, { style: s$2.footerText, children: [
        invoiceNumber,
        " | Dibuat: ",
        formatDatePDF(/* @__PURE__ */ new Date()),
        " | ",
        generatedBy || "-"
      ] }),
      /* @__PURE__ */ jsx(Text, { style: s$2.footerText, children: "Powered by TernakOS — ternakos.com" })
    ] })
  ] }) });
}
const C$1 = {
  bg: "#FFFFFF",
  text: "#1a1a1a",
  muted: "#666666",
  faint: "#999999",
  light: "#FFFBEB",
  // amber tint
  border: "#E5E7EB",
  header: "#0C1319",
  accent: "#F59E0B",
  // amber
  accentBg: "#FFFBEB",
  warn: "#EF4444",
  ok: "#021a02"
};
const s$1 = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 60,
    paddingLeft: 40,
    paddingRight: 40,
    backgroundColor: C$1.bg,
    color: C$1.text
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: C$1.accent,
    borderBottomStyle: "solid"
  },
  companyName: { fontSize: 18, fontFamily: "Helvetica-Bold", color: C$1.header },
  companyDetail: { fontSize: 8, color: C$1.muted, marginTop: 3 },
  docTitle: { fontSize: 22, fontFamily: "Helvetica-Bold", color: C$1.accent, textAlign: "right" },
  docRefNum: { fontSize: 8, color: C$1.muted, textAlign: "right", marginTop: 2 },
  docNum: { fontSize: 9, color: C$1.muted, textAlign: "right", marginTop: 2 },
  docDate: { fontSize: 9, color: C$1.muted, textAlign: "right", marginTop: 2 },
  docDue: { fontSize: 9, color: "#F59E0B", textAlign: "right", marginTop: 2 },
  // Status badge
  statusWrap: { marginBottom: 16, flexDirection: "row" },
  statusBadge: { paddingTop: 4, paddingBottom: 4, paddingLeft: 12, paddingRight: 12, borderRadius: 4 },
  statusText: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  // Parties
  parties: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  partyBox: { width: "45%" },
  partyLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C$1.accent, letterSpacing: 1, marginBottom: 6 },
  partyName: { fontSize: 12, fontFamily: "Helvetica-Bold", color: C$1.header },
  partyDetail: { fontSize: 9, color: C$1.muted, marginTop: 2 },
  // Table (public — no HPP)
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C$1.header,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 4
  },
  thText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#FFFFFF" },
  tableRow: {
    flexDirection: "row",
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 10,
    borderBottomWidth: 1,
    borderBottomColor: C$1.border,
    borderBottomStyle: "solid"
  },
  tableRowAlt: { backgroundColor: C$1.light },
  td: { fontSize: 9, color: C$1.text },
  // Public columns (showProfit=false)
  pColDesc: { width: "40%" },
  pColQty: { width: "15%", textAlign: "right" },
  pColPrice: { width: "20%", textAlign: "right" },
  pColSubtotal: { width: "25%", textAlign: "right" },
  // Profit columns (showProfit=true)
  rColDesc: { width: "30%" },
  rColQty: { width: "13%", textAlign: "right" },
  rColPrice: { width: "14%", textAlign: "right" },
  rColHPP: { width: "14%", textAlign: "right" },
  rColSubtotal: { width: "15%", textAlign: "right" },
  rColMargin: { width: "14%", textAlign: "right" },
  // Summary
  summarySection: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 20 },
  summaryBox: { width: "48%" },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 4,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: C$1.border,
    borderBottomStyle: "solid"
  },
  summaryLabel: { fontSize: 9, color: C$1.muted },
  summaryVal: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C$1.text },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 10,
    backgroundColor: C$1.accent,
    borderRadius: 4,
    marginTop: 4
  },
  totalLabel: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#FFFFFF" },
  totalVal: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#FFFFFF" },
  // Profit summary (showProfit only)
  profitBox: {
    marginBottom: 16,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 14,
    paddingRight: 14,
    backgroundColor: "rgba(2, 26, 2,0.06)",
    borderWidth: 1,
    borderColor: "rgba(2, 26, 2,0.2)",
    borderStyle: "solid",
    borderRadius: 6,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  profitItem: { alignItems: "center" },
  profitLabel: { fontSize: 8, color: C$1.muted, marginBottom: 2 },
  profitValue: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  // Terbilang
  terbilangBox: {
    marginBottom: 20,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 14,
    paddingRight: 14,
    backgroundColor: C$1.light,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: C$1.accent,
    borderLeftStyle: "solid"
  },
  terbilangLabel: { fontSize: 8, color: C$1.muted, marginBottom: 3 },
  terbilangText: { fontSize: 9, fontFamily: "Helvetica-BoldOblique", color: C$1.text },
  // Payment info (if not lunas)
  paymentBox: {
    marginBottom: 20,
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 14,
    paddingRight: 14,
    backgroundColor: C$1.accentBg,
    borderWidth: 1,
    borderColor: C$1.accent,
    borderStyle: "solid",
    borderRadius: 6
  },
  paymentLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C$1.accent, letterSpacing: 1, marginBottom: 6 },
  paymentText: { fontSize: 9, color: C$1.text, marginBottom: 3 },
  paymentNote: { fontSize: 8, color: C$1.muted, marginTop: 4, fontFamily: "Helvetica-Oblique" },
  // Signature
  sigSection: { flexDirection: "row", justifyContent: "space-between", marginTop: 36 },
  sigBox: { width: "40%", alignItems: "center" },
  sigLine: {
    borderBottomWidth: 1,
    borderBottomColor: C$1.text,
    borderBottomStyle: "solid",
    width: "100%",
    marginTop: 40,
    marginBottom: 6
  },
  sigName: { fontSize: 9, fontFamily: "Helvetica-Bold", textAlign: "center" },
  sigLabel: { fontSize: 8, color: C$1.muted, textAlign: "center" },
  // Footer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: C$1.border,
    borderTopStyle: "solid",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  footerText: { fontSize: 7, color: C$1.faint }
});
const statusColors$1 = {
  lunas: { bg: "#F0FDF4", border: "#021a02", text: "#021a02" },
  belum_lunas: { bg: "#FEF3C7", border: "#F59E0B", text: "#F59E0B" },
  sebagian: { bg: "#EFF6FF", border: "#3B82F6", text: "#3B82F6" }
};
const statusLabels$1 = {
  lunas: "LUNAS",
  belum_lunas: "BELUM DIBAYAR",
  sebagian: "SEBAGIAN"
};
const customerTypeLabels$1 = {
  toko_kecil: "Toko Kecil",
  toko_menengah: "Toko Menengah",
  supermarket: "Supermarket",
  restoran: "Restoran",
  hotel: "Hotel",
  catering: "Catering",
  lainnya: "Lainnya"
};
function RPATokoInvoice({
  tenant,
  invoice,
  customer,
  items = [],
  invoiceNumber,
  generatedBy,
  showProfit = false
}) {
  const totalAmount = Number((invoice == null ? void 0 : invoice.total_amount) || 0);
  const totalCost = Number((invoice == null ? void 0 : invoice.total_cost) || 0);
  const netProfit = Number((invoice == null ? void 0 : invoice.net_profit) || totalAmount - totalCost);
  const paidAmount = Number((invoice == null ? void 0 : invoice.paid_amount) || 0);
  const remaining = Number((invoice == null ? void 0 : invoice.remaining_amount) ?? Math.max(0, totalAmount - paidAmount));
  const isLunas = (invoice == null ? void 0 : invoice.payment_status) === "lunas";
  const sc = statusColors$1[invoice == null ? void 0 : invoice.payment_status] || statusColors$1.belum_lunas;
  const statusLabel = statusLabels$1[invoice == null ? void 0 : invoice.payment_status] || "-";
  const marginPct = totalAmount > 0 ? (netProfit / totalAmount * 100).toFixed(1) : "0.0";
  return /* @__PURE__ */ jsx(Document, { children: /* @__PURE__ */ jsxs(Page, { size: "A4", style: s$1.page, children: [
    /* @__PURE__ */ jsxs(View, { style: s$1.header, children: [
      /* @__PURE__ */ jsxs(View, { children: [
        /* @__PURE__ */ jsx(Text, { style: s$1.companyName, children: (tenant == null ? void 0 : tenant.business_name) || "RPA" }),
        /* @__PURE__ */ jsx(Text, { style: s$1.companyDetail, children: (tenant == null ? void 0 : tenant.location) || "-" }),
        /* @__PURE__ */ jsxs(Text, { style: s$1.companyDetail, children: [
          "Tel: ",
          (tenant == null ? void 0 : tenant.phone) || "-"
        ] }),
        /* @__PURE__ */ jsx(Text, { style: s$1.companyDetail, children: "TernakOS — Platform Manajemen Peternakan" })
      ] }),
      /* @__PURE__ */ jsxs(View, { children: [
        /* @__PURE__ */ jsx(Text, { style: s$1.docTitle, children: "INVOICE" }),
        /* @__PURE__ */ jsxs(Text, { style: s$1.docRefNum, children: [
          "Ref: ",
          (invoice == null ? void 0 : invoice.invoice_number) || "-"
        ] }),
        /* @__PURE__ */ jsx(Text, { style: s$1.docNum, children: invoiceNumber }),
        /* @__PURE__ */ jsxs(Text, { style: s$1.docDate, children: [
          "Tgl: ",
          formatDatePDF(invoice == null ? void 0 : invoice.transaction_date)
        ] }),
        (invoice == null ? void 0 : invoice.due_date) && /* @__PURE__ */ jsxs(Text, { style: s$1.docDue, children: [
          "Jatuh Tempo: ",
          formatDatePDF(invoice.due_date)
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(View, { style: s$1.statusWrap, children: /* @__PURE__ */ jsx(View, { style: [s$1.statusBadge, {
      backgroundColor: sc.bg,
      borderWidth: 1,
      borderColor: sc.border,
      borderStyle: "solid"
    }], children: /* @__PURE__ */ jsx(Text, { style: [s$1.statusText, { color: sc.text }], children: statusLabel }) }) }),
    /* @__PURE__ */ jsxs(View, { style: s$1.parties, children: [
      /* @__PURE__ */ jsxs(View, { style: s$1.partyBox, children: [
        /* @__PURE__ */ jsx(Text, { style: s$1.partyLabel, children: "DARI (SELLER)" }),
        /* @__PURE__ */ jsx(Text, { style: s$1.partyName, children: (tenant == null ? void 0 : tenant.business_name) || "-" }),
        /* @__PURE__ */ jsx(Text, { style: s$1.partyDetail, children: (tenant == null ? void 0 : tenant.location) || "-" }),
        /* @__PURE__ */ jsxs(Text, { style: s$1.partyDetail, children: [
          "Tel: ",
          (tenant == null ? void 0 : tenant.phone) || "-"
        ] })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: s$1.partyBox, children: [
        /* @__PURE__ */ jsx(Text, { style: s$1.partyLabel, children: "KEPADA (BUYER)" }),
        /* @__PURE__ */ jsx(Text, { style: s$1.partyName, children: (customer == null ? void 0 : customer.customer_name) || (invoice == null ? void 0 : invoice.customer_name) || "-" }),
        (customer == null ? void 0 : customer.customer_type) ? /* @__PURE__ */ jsx(Text, { style: s$1.partyDetail, children: customerTypeLabels$1[customer.customer_type] || customer.customer_type }) : null,
        (customer == null ? void 0 : customer.address) ? /* @__PURE__ */ jsx(Text, { style: s$1.partyDetail, children: customer.address }) : null,
        (customer == null ? void 0 : customer.phone) ? /* @__PURE__ */ jsxs(Text, { style: s$1.partyDetail, children: [
          "Tel: ",
          customer.phone
        ] }) : null
      ] })
    ] }),
    /* @__PURE__ */ jsx(View, { style: { marginBottom: 20 }, children: showProfit ? (
      /* ── WITH PROFIT (internal only) ── */
      /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs(View, { style: s$1.tableHeader, children: [
          /* @__PURE__ */ jsx(Text, { style: [s$1.thText, s$1.rColDesc], children: "Produk" }),
          /* @__PURE__ */ jsx(Text, { style: [s$1.thText, s$1.rColQty], children: "Jumlah" }),
          /* @__PURE__ */ jsx(Text, { style: [s$1.thText, s$1.rColPrice], children: "Harga / Unit" }),
          /* @__PURE__ */ jsx(Text, { style: [s$1.thText, s$1.rColHPP], children: "HPP / Unit" }),
          /* @__PURE__ */ jsx(Text, { style: [s$1.thText, s$1.rColSubtotal], children: "Subtotal" }),
          /* @__PURE__ */ jsx(Text, { style: [s$1.thText, s$1.rColMargin], children: "Margin" })
        ] }),
        items.map((item, idx) => {
          const itemSubtotal = Number(item.subtotal ?? Math.round((item.quantity_kg || 0) * (item.price_per_kg || 0)));
          const itemCost = Math.round((item.quantity_kg || 0) * (item.cost_per_kg || 0));
          const itemMargin = itemSubtotal - itemCost;
          const unit = item.unit || "pcs";
          return /* @__PURE__ */ jsxs(View, { style: [s$1.tableRow, idx % 2 === 1 ? s$1.tableRowAlt : {}], children: [
            /* @__PURE__ */ jsx(Text, { style: [s$1.td, s$1.rColDesc], children: item.product_name }),
            /* @__PURE__ */ jsxs(Text, { style: [s$1.td, s$1.rColQty], children: [
              Number(item.quantity || item.quantity_kg || 0).toFixed(2),
              " ",
              unit
            ] }),
            /* @__PURE__ */ jsx(Text, { style: [s$1.td, s$1.rColPrice], children: formatRupiahPDF(item.price_per_kg) }),
            /* @__PURE__ */ jsx(Text, { style: [s$1.td, s$1.rColHPP, { color: C$1.muted }], children: formatRupiahPDF(item.cost_per_kg) }),
            /* @__PURE__ */ jsx(Text, { style: [s$1.td, s$1.rColSubtotal], children: formatRupiahPDF(itemSubtotal) }),
            /* @__PURE__ */ jsx(Text, { style: [s$1.td, s$1.rColMargin, { color: itemMargin >= 0 ? C$1.ok : C$1.warn }], children: formatRupiahPDF(itemMargin) })
          ] }, idx);
        })
      ] })
    ) : (
      /* ── PUBLIC (no HPP) ── */
      /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs(View, { style: s$1.tableHeader, children: [
          /* @__PURE__ */ jsx(Text, { style: [s$1.thText, s$1.pColDesc], children: "Produk" }),
          /* @__PURE__ */ jsx(Text, { style: [s$1.thText, s$1.pColQty], children: "Jumlah" }),
          /* @__PURE__ */ jsx(Text, { style: [s$1.thText, s$1.pColPrice], children: "Harga / Unit" }),
          /* @__PURE__ */ jsx(Text, { style: [s$1.thText, s$1.pColSubtotal], children: "Subtotal" })
        ] }),
        items.map((item, idx) => {
          const itemSubtotal = Number(item.subtotal ?? Math.round((item.quantity_kg || 0) * (item.price_per_kg || 0)));
          const unit = item.unit || "pcs";
          return /* @__PURE__ */ jsxs(View, { style: [s$1.tableRow, idx % 2 === 1 ? s$1.tableRowAlt : {}], children: [
            /* @__PURE__ */ jsx(Text, { style: [s$1.td, s$1.pColDesc], children: item.product_name }),
            /* @__PURE__ */ jsxs(Text, { style: [s$1.td, s$1.pColQty], children: [
              Number(item.quantity || item.quantity_kg || 0).toFixed(2),
              " ",
              unit
            ] }),
            /* @__PURE__ */ jsx(Text, { style: [s$1.td, s$1.pColPrice], children: formatRupiahPDF(item.price_per_kg) }),
            /* @__PURE__ */ jsx(Text, { style: [s$1.td, s$1.pColSubtotal], children: formatRupiahPDF(itemSubtotal) })
          ] }, idx);
        })
      ] })
    ) }),
    showProfit && /* @__PURE__ */ jsxs(View, { style: s$1.profitBox, children: [
      /* @__PURE__ */ jsxs(View, { style: s$1.profitItem, children: [
        /* @__PURE__ */ jsx(Text, { style: s$1.profitLabel, children: "TOTAL HPP" }),
        /* @__PURE__ */ jsx(Text, { style: [s$1.profitValue, { color: C$1.warn }], children: formatRupiahPDF(totalCost) })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: s$1.profitItem, children: [
        /* @__PURE__ */ jsx(Text, { style: s$1.profitLabel, children: "GROSS PROFIT" }),
        /* @__PURE__ */ jsx(Text, { style: [s$1.profitValue, { color: netProfit >= 0 ? C$1.ok : C$1.warn }], children: formatRupiahPDF(netProfit) })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: s$1.profitItem, children: [
        /* @__PURE__ */ jsx(Text, { style: s$1.profitLabel, children: "MARGIN" }),
        /* @__PURE__ */ jsxs(Text, { style: [s$1.profitValue, { color: netProfit >= 0 ? C$1.ok : C$1.warn }], children: [
          marginPct,
          "%"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(View, { style: s$1.summarySection, children: /* @__PURE__ */ jsxs(View, { style: s$1.summaryBox, children: [
      /* @__PURE__ */ jsxs(View, { style: s$1.summaryRow, children: [
        /* @__PURE__ */ jsx(Text, { style: s$1.summaryLabel, children: "Subtotal" }),
        /* @__PURE__ */ jsx(Text, { style: s$1.summaryVal, children: formatRupiahPDF(totalAmount) })
      ] }),
      paidAmount > 0 && /* @__PURE__ */ jsxs(View, { style: s$1.summaryRow, children: [
        /* @__PURE__ */ jsx(Text, { style: s$1.summaryLabel, children: "Sudah Dibayar" }),
        /* @__PURE__ */ jsxs(Text, { style: [s$1.summaryVal, { color: C$1.ok }], children: [
          "(",
          formatRupiahPDF(paidAmount),
          ")"
        ] })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: s$1.totalRow, children: [
        /* @__PURE__ */ jsx(Text, { style: s$1.totalLabel, children: isLunas ? "TOTAL" : "SISA TAGIHAN" }),
        /* @__PURE__ */ jsx(Text, { style: s$1.totalVal, children: formatRupiahPDF(isLunas ? totalAmount : remaining) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs(View, { style: s$1.terbilangBox, children: [
      /* @__PURE__ */ jsx(Text, { style: s$1.terbilangLabel, children: "TERBILANG" }),
      /* @__PURE__ */ jsx(Text, { style: s$1.terbilangText, children: terbilang(isLunas ? totalAmount : remaining) })
    ] }),
    !isLunas && /* @__PURE__ */ jsxs(View, { style: s$1.paymentBox, children: [
      /* @__PURE__ */ jsx(Text, { style: s$1.paymentLabel, children: "INFO PEMBAYARAN" }),
      /* @__PURE__ */ jsx(Text, { style: s$1.paymentText, children: "Harap transfer ke rekening atas nama:" }),
      /* @__PURE__ */ jsx(Text, { style: [s$1.paymentText, { fontFamily: "Helvetica-Bold" }], children: (tenant == null ? void 0 : tenant.business_name) || "-" }),
      /* @__PURE__ */ jsx(Text, { style: s$1.paymentNote, children: "* Konfirmasi pembayaran via WhatsApp/telepon setelah transfer" })
    ] }),
    /* @__PURE__ */ jsxs(View, { style: s$1.sigSection, children: [
      /* @__PURE__ */ jsxs(View, { style: s$1.sigBox, children: [
        /* @__PURE__ */ jsx(Text, { style: { fontSize: 9, color: C$1.muted, marginBottom: 4 }, children: "Hormat kami," }),
        /* @__PURE__ */ jsx(View, { style: s$1.sigLine }),
        /* @__PURE__ */ jsx(Text, { style: s$1.sigName, children: generatedBy || (tenant == null ? void 0 : tenant.business_name) || "-" }),
        /* @__PURE__ */ jsx(Text, { style: s$1.sigLabel, children: "Pihak Kedai / Penjual" })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: s$1.sigBox, children: [
        /* @__PURE__ */ jsx(Text, { style: { fontSize: 9, color: C$1.muted, marginBottom: 4 }, children: "Diterima oleh," }),
        /* @__PURE__ */ jsx(View, { style: s$1.sigLine }),
        /* @__PURE__ */ jsx(Text, { style: s$1.sigName, children: (customer == null ? void 0 : customer.customer_name) || (invoice == null ? void 0 : invoice.customer_name) || "________________" }),
        /* @__PURE__ */ jsx(Text, { style: s$1.sigLabel, children: "Pihak Pembeli" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(View, { style: s$1.footer, fixed: true, children: [
      /* @__PURE__ */ jsxs(Text, { style: s$1.footerText, children: [
        invoiceNumber,
        " | Ref: ",
        (invoice == null ? void 0 : invoice.invoice_number) || "-",
        " | ",
        formatDatePDF(/* @__PURE__ */ new Date()),
        " | ",
        generatedBy || "-"
      ] }),
      /* @__PURE__ */ jsx(Text, { style: s$1.footerText, children: "Powered by TernakOS — ternakos.com" })
    ] })
  ] }) });
}
const C = {
  bg: "#FFFFFF",
  text: "#1a1a1a",
  muted: "#666666",
  faint: "#999999",
  light: "#FFFBEB",
  // amber tint
  border: "#E5E7EB",
  header: "#0C1319",
  accent: "#F59E0B",
  // amber
  accentBg: "#FFFBEB",
  warn: "#EF4444",
  ok: "#021a02"
};
const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 60,
    paddingLeft: 40,
    paddingRight: 40,
    backgroundColor: C.bg,
    color: C.text
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: C.accent,
    borderBottomStyle: "solid"
  },
  companyName: { fontSize: 18, fontFamily: "Helvetica-Bold", color: C.header },
  companyDetail: { fontSize: 8, color: C.muted, marginTop: 3 },
  docTitle: { fontSize: 22, fontFamily: "Helvetica-Bold", color: C.accent, textAlign: "right" },
  docRefNum: { fontSize: 8, color: C.muted, textAlign: "right", marginTop: 2 },
  docNum: { fontSize: 9, color: C.muted, textAlign: "right", marginTop: 2 },
  docDate: { fontSize: 9, color: C.muted, textAlign: "right", marginTop: 2 },
  docDue: { fontSize: 9, color: "#F59E0B", textAlign: "right", marginTop: 2 },
  // Status badge
  statusWrap: { marginBottom: 16, flexDirection: "row" },
  statusBadge: { paddingTop: 4, paddingBottom: 4, paddingLeft: 12, paddingRight: 12, borderRadius: 4 },
  statusText: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  // Parties
  parties: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  partyBox: { width: "45%" },
  partyLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.accent, letterSpacing: 1, marginBottom: 6 },
  partyName: { fontSize: 12, fontFamily: "Helvetica-Bold", color: C.header },
  partyDetail: { fontSize: 9, color: C.muted, marginTop: 2 },
  // Table (public — no HPP)
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C.header,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 4
  },
  thText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#FFFFFF" },
  tableRow: {
    flexDirection: "row",
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    borderBottomStyle: "solid"
  },
  tableRowAlt: { backgroundColor: C.light },
  td: { fontSize: 9, color: C.text },
  // Public columns (showProfit=false)
  pColDesc: { width: "40%" },
  pColQty: { width: "15%", textAlign: "right" },
  pColPrice: { width: "20%", textAlign: "right" },
  pColSubtotal: { width: "25%", textAlign: "right" },
  // Profit columns (showProfit=true)
  rColDesc: { width: "30%" },
  rColQty: { width: "13%", textAlign: "right" },
  rColPrice: { width: "14%", textAlign: "right" },
  rColHPP: { width: "14%", textAlign: "right" },
  rColSubtotal: { width: "15%", textAlign: "right" },
  rColMargin: { width: "14%", textAlign: "right" },
  // Summary
  summarySection: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 20 },
  summaryBox: { width: "48%" },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 4,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    borderBottomStyle: "solid"
  },
  summaryLabel: { fontSize: 9, color: C.muted },
  summaryVal: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.text },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 10,
    backgroundColor: C.accent,
    borderRadius: 4,
    marginTop: 4
  },
  totalLabel: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#FFFFFF" },
  totalVal: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#FFFFFF" },
  // Profit summary (showProfit only)
  profitBox: {
    marginBottom: 16,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 14,
    paddingRight: 14,
    backgroundColor: "rgba(2, 26, 2,0.06)",
    borderWidth: 1,
    borderColor: "rgba(2, 26, 2,0.2)",
    borderStyle: "solid",
    borderRadius: 6,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  profitItem: { alignItems: "center" },
  profitLabel: { fontSize: 8, color: C.muted, marginBottom: 2 },
  profitValue: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  // Terbilang
  terbilangBox: {
    marginBottom: 20,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 14,
    paddingRight: 14,
    backgroundColor: C.light,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: C.accent,
    borderLeftStyle: "solid"
  },
  terbilangLabel: { fontSize: 8, color: C.muted, marginBottom: 3 },
  terbilangText: { fontSize: 9, fontFamily: "Helvetica-BoldOblique", color: C.text },
  // Payment info (if not lunas)
  paymentBox: {
    marginBottom: 20,
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 14,
    paddingRight: 14,
    backgroundColor: C.accentBg,
    borderWidth: 1,
    borderColor: C.accent,
    borderStyle: "solid",
    borderRadius: 6
  },
  paymentLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.accent, letterSpacing: 1, marginBottom: 6 },
  paymentText: { fontSize: 9, color: C.text, marginBottom: 3 },
  paymentNote: { fontSize: 8, color: C.muted, marginTop: 4, fontFamily: "Helvetica-Oblique" },
  // Signature
  sigSection: { flexDirection: "row", justifyContent: "space-between", marginTop: 36 },
  sigBox: { width: "40%", alignItems: "center" },
  sigLine: {
    borderBottomWidth: 1,
    borderBottomColor: C.text,
    borderBottomStyle: "solid",
    width: "100%",
    marginTop: 40,
    marginBottom: 6
  },
  sigName: { fontSize: 9, fontFamily: "Helvetica-Bold", textAlign: "center" },
  sigLabel: { fontSize: 8, color: C.muted, textAlign: "center" },
  // Footer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
    borderTopStyle: "solid",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  footerText: { fontSize: 7, color: C.faint }
});
const statusColors = {
  lunas: { bg: "#F0FDF4", border: "#021a02", text: "#021a02" },
  belum_lunas: { bg: "#FEF3C7", border: "#F59E0B", text: "#F59E0B" },
  sebagian: { bg: "#EFF6FF", border: "#3B82F6", text: "#3B82F6" }
};
const statusLabels = {
  lunas: "LUNAS",
  belum_lunas: "BELUM DIBAYAR",
  sebagian: "SEBAGIAN"
};
const customerTypeLabels = {
  toko_kecil: "Toko Kecil",
  toko_menengah: "Toko Menengah",
  supermarket: "Supermarket",
  restoran: "Restoran",
  hotel: "Hotel",
  catering: "Catering",
  lainnya: "Lainnya"
};
function SembakoInvoice({
  tenant,
  invoice,
  customer,
  items = [],
  invoiceNumber,
  generatedBy,
  showProfit = false
}) {
  const totalAmount = Number((invoice == null ? void 0 : invoice.total_amount) || 0);
  const totalCost = Number((invoice == null ? void 0 : invoice.total_cost) || 0);
  const netProfit = Number((invoice == null ? void 0 : invoice.net_profit) || totalAmount - totalCost);
  const paidAmount = Number((invoice == null ? void 0 : invoice.paid_amount) || 0);
  const remaining = Number((invoice == null ? void 0 : invoice.remaining_amount) ?? Math.max(0, totalAmount - paidAmount));
  const isLunas = (invoice == null ? void 0 : invoice.payment_status) === "lunas";
  const sc = statusColors[invoice == null ? void 0 : invoice.payment_status] || statusColors.belum_lunas;
  const statusLabel = statusLabels[invoice == null ? void 0 : invoice.payment_status] || "-";
  const marginPct = totalAmount > 0 ? (netProfit / totalAmount * 100).toFixed(1) : "0.0";
  return /* @__PURE__ */ jsx(Document, { children: /* @__PURE__ */ jsxs(Page, { size: "A4", style: s.page, children: [
    /* @__PURE__ */ jsxs(View, { style: s.header, children: [
      /* @__PURE__ */ jsxs(View, { children: [
        /* @__PURE__ */ jsx(Text, { style: s.companyName, children: (tenant == null ? void 0 : tenant.business_name) || "Grosir Sembako" }),
        /* @__PURE__ */ jsx(Text, { style: s.companyDetail, children: (tenant == null ? void 0 : tenant.location) || "-" }),
        /* @__PURE__ */ jsxs(Text, { style: s.companyDetail, children: [
          "Tel: ",
          (tenant == null ? void 0 : tenant.phone) || "-"
        ] }),
        /* @__PURE__ */ jsx(Text, { style: s.companyDetail, children: "TernakOS — Platform Manajemen Peternakan" })
      ] }),
      /* @__PURE__ */ jsxs(View, { children: [
        /* @__PURE__ */ jsx(Text, { style: s.docTitle, children: "INVOICE" }),
        /* @__PURE__ */ jsxs(Text, { style: s.docRefNum, children: [
          "Ref: ",
          (invoice == null ? void 0 : invoice.invoice_number) || "-"
        ] }),
        /* @__PURE__ */ jsx(Text, { style: s.docNum, children: invoiceNumber }),
        /* @__PURE__ */ jsxs(Text, { style: s.docDate, children: [
          "Tgl: ",
          formatDatePDF(invoice == null ? void 0 : invoice.transaction_date)
        ] }),
        (invoice == null ? void 0 : invoice.due_date) && /* @__PURE__ */ jsxs(Text, { style: s.docDue, children: [
          "Jatuh Tempo: ",
          formatDatePDF(invoice.due_date)
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(View, { style: s.statusWrap, children: /* @__PURE__ */ jsx(View, { style: [s.statusBadge, {
      backgroundColor: sc.bg,
      borderWidth: 1,
      borderColor: sc.border,
      borderStyle: "solid"
    }], children: /* @__PURE__ */ jsx(Text, { style: [s.statusText, { color: sc.text }], children: statusLabel }) }) }),
    /* @__PURE__ */ jsxs(View, { style: s.parties, children: [
      /* @__PURE__ */ jsxs(View, { style: s.partyBox, children: [
        /* @__PURE__ */ jsx(Text, { style: s.partyLabel, children: "DARI (SELLER)" }),
        /* @__PURE__ */ jsx(Text, { style: s.partyName, children: (tenant == null ? void 0 : tenant.business_name) || "-" }),
        /* @__PURE__ */ jsx(Text, { style: s.partyDetail, children: (tenant == null ? void 0 : tenant.location) || "-" }),
        /* @__PURE__ */ jsxs(Text, { style: s.partyDetail, children: [
          "Tel: ",
          (tenant == null ? void 0 : tenant.phone) || "-"
        ] })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: s.partyBox, children: [
        /* @__PURE__ */ jsx(Text, { style: s.partyLabel, children: "KEPADA (BUYER)" }),
        /* @__PURE__ */ jsx(Text, { style: s.partyName, children: (customer == null ? void 0 : customer.customer_name) || (invoice == null ? void 0 : invoice.customer_name) || "-" }),
        (customer == null ? void 0 : customer.customer_type) ? /* @__PURE__ */ jsx(Text, { style: s.partyDetail, children: customerTypeLabels[customer.customer_type] || customer.customer_type }) : null,
        (customer == null ? void 0 : customer.address) ? /* @__PURE__ */ jsx(Text, { style: s.partyDetail, children: customer.address }) : null,
        (customer == null ? void 0 : customer.phone) ? /* @__PURE__ */ jsxs(Text, { style: s.partyDetail, children: [
          "Tel: ",
          customer.phone
        ] }) : null
      ] })
    ] }),
    /* @__PURE__ */ jsx(View, { style: { marginBottom: 20 }, children: showProfit ? (
      /* ── WITH PROFIT (internal only) ── */
      /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs(View, { style: s.tableHeader, children: [
          /* @__PURE__ */ jsx(Text, { style: [s.thText, s.rColDesc], children: "Produk" }),
          /* @__PURE__ */ jsx(Text, { style: [s.thText, s.rColQty], children: "Jumlah" }),
          /* @__PURE__ */ jsx(Text, { style: [s.thText, s.rColPrice], children: "Harga / Unit" }),
          /* @__PURE__ */ jsx(Text, { style: [s.thText, s.rColHPP], children: "HPP / Unit" }),
          /* @__PURE__ */ jsx(Text, { style: [s.thText, s.rColSubtotal], children: "Subtotal" }),
          /* @__PURE__ */ jsx(Text, { style: [s.thText, s.rColMargin], children: "Margin" })
        ] }),
        items.map((item, idx) => {
          const qty = Number(item.quantity || item.quantity_kg || 0);
          const price = Number(item.price_per_unit || item.price_per_kg || 0);
          const cost = Number(item.cost_per_unit || item.cost_per_kg || 0);
          const itemSubtotal = Number(item.subtotal ?? Math.round(qty * price));
          const itemCost = Math.round(qty * cost);
          const itemMargin = itemSubtotal - itemCost;
          const unit = item.unit || "pcs";
          return /* @__PURE__ */ jsxs(View, { style: [s.tableRow, idx % 2 === 1 ? s.tableRowAlt : {}], children: [
            /* @__PURE__ */ jsx(Text, { style: [s.td, s.rColDesc], children: item.product_name }),
            /* @__PURE__ */ jsxs(Text, { style: [s.td, s.rColQty], children: [
              Number.isInteger(qty) ? qty : qty.toFixed(2),
              " ",
              unit
            ] }),
            /* @__PURE__ */ jsx(Text, { style: [s.td, s.rColPrice], children: formatRupiahPDF(price) }),
            /* @__PURE__ */ jsx(Text, { style: [s.td, s.rColHPP, { color: C.muted }], children: formatRupiahPDF(cost) }),
            /* @__PURE__ */ jsx(Text, { style: [s.td, s.rColSubtotal], children: formatRupiahPDF(itemSubtotal) }),
            /* @__PURE__ */ jsx(Text, { style: [s.td, s.rColMargin, { color: itemMargin >= 0 ? C.ok : C.warn }], children: formatRupiahPDF(itemMargin) })
          ] }, idx);
        })
      ] })
    ) : (
      /* ── PUBLIC (no HPP) ── */
      /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs(View, { style: s.tableHeader, children: [
          /* @__PURE__ */ jsx(Text, { style: [s.thText, s.pColDesc], children: "Produk" }),
          /* @__PURE__ */ jsx(Text, { style: [s.thText, s.pColQty], children: "Jumlah" }),
          /* @__PURE__ */ jsx(Text, { style: [s.thText, s.pColPrice], children: "Harga / Unit" }),
          /* @__PURE__ */ jsx(Text, { style: [s.thText, s.pColSubtotal], children: "Subtotal" })
        ] }),
        items.map((item, idx) => {
          const qty = Number(item.quantity || item.quantity_kg || 0);
          const price = Number(item.price_per_unit || item.price_per_kg || 0);
          const itemSubtotal = Number(item.subtotal ?? Math.round(qty * price));
          const unit = item.unit || "pcs";
          return /* @__PURE__ */ jsxs(View, { style: [s.tableRow, idx % 2 === 1 ? s.tableRowAlt : {}], children: [
            /* @__PURE__ */ jsx(Text, { style: [s.td, s.pColDesc], children: item.product_name }),
            /* @__PURE__ */ jsxs(Text, { style: [s.td, s.pColQty], children: [
              Number.isInteger(qty) ? qty : qty.toFixed(2),
              " ",
              unit
            ] }),
            /* @__PURE__ */ jsx(Text, { style: [s.td, s.pColPrice], children: formatRupiahPDF(price) }),
            /* @__PURE__ */ jsx(Text, { style: [s.td, s.pColSubtotal], children: formatRupiahPDF(itemSubtotal) })
          ] }, idx);
        })
      ] })
    ) }),
    showProfit && /* @__PURE__ */ jsxs(View, { style: s.profitBox, children: [
      /* @__PURE__ */ jsxs(View, { style: s.profitItem, children: [
        /* @__PURE__ */ jsx(Text, { style: s.profitLabel, children: "TOTAL HPP" }),
        /* @__PURE__ */ jsx(Text, { style: [s.profitValue, { color: C.warn }], children: formatRupiahPDF(totalCost) })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: s.profitItem, children: [
        /* @__PURE__ */ jsx(Text, { style: s.profitLabel, children: "GROSS PROFIT" }),
        /* @__PURE__ */ jsx(Text, { style: [s.profitValue, { color: netProfit >= 0 ? C.ok : C.warn }], children: formatRupiahPDF(netProfit) })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: s.profitItem, children: [
        /* @__PURE__ */ jsx(Text, { style: s.profitLabel, children: "MARGIN" }),
        /* @__PURE__ */ jsxs(Text, { style: [s.profitValue, { color: netProfit >= 0 ? C.ok : C.warn }], children: [
          marginPct,
          "%"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(View, { style: s.summarySection, children: /* @__PURE__ */ jsxs(View, { style: s.summaryBox, children: [
      /* @__PURE__ */ jsxs(View, { style: s.summaryRow, children: [
        /* @__PURE__ */ jsx(Text, { style: s.summaryLabel, children: "Subtotal" }),
        /* @__PURE__ */ jsx(Text, { style: s.summaryVal, children: formatRupiahPDF(totalAmount) })
      ] }),
      paidAmount > 0 && /* @__PURE__ */ jsxs(View, { style: s.summaryRow, children: [
        /* @__PURE__ */ jsx(Text, { style: s.summaryLabel, children: "Sudah Dibayar" }),
        /* @__PURE__ */ jsxs(Text, { style: [s.summaryVal, { color: C.ok }], children: [
          "(",
          formatRupiahPDF(paidAmount),
          ")"
        ] })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: s.totalRow, children: [
        /* @__PURE__ */ jsx(Text, { style: s.totalLabel, children: isLunas ? "TOTAL" : "SISA TAGIHAN" }),
        /* @__PURE__ */ jsx(Text, { style: s.totalVal, children: formatRupiahPDF(isLunas ? totalAmount : remaining) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs(View, { style: s.terbilangBox, children: [
      /* @__PURE__ */ jsx(Text, { style: s.terbilangLabel, children: "TERBILANG" }),
      /* @__PURE__ */ jsx(Text, { style: s.terbilangText, children: terbilang(isLunas ? totalAmount : remaining) })
    ] }),
    !isLunas && /* @__PURE__ */ jsxs(View, { style: s.paymentBox, children: [
      /* @__PURE__ */ jsx(Text, { style: s.paymentLabel, children: "INFO PEMBAYARAN" }),
      /* @__PURE__ */ jsx(Text, { style: s.paymentText, children: "Harap transfer ke rekening atas nama:" }),
      /* @__PURE__ */ jsx(Text, { style: [s.paymentText, { fontFamily: "Helvetica-Bold" }], children: (tenant == null ? void 0 : tenant.business_name) || "-" }),
      /* @__PURE__ */ jsx(Text, { style: s.paymentNote, children: "* Konfirmasi pembayaran via WhatsApp/telepon setelah transfer" })
    ] }),
    /* @__PURE__ */ jsxs(View, { style: s.sigSection, children: [
      /* @__PURE__ */ jsxs(View, { style: s.sigBox, children: [
        /* @__PURE__ */ jsx(Text, { style: { fontSize: 9, color: C.muted, marginBottom: 4 }, children: "Hormat kami," }),
        /* @__PURE__ */ jsx(View, { style: s.sigLine }),
        /* @__PURE__ */ jsx(Text, { style: s.sigName, children: generatedBy || (tenant == null ? void 0 : tenant.business_name) || "-" }),
        /* @__PURE__ */ jsx(Text, { style: s.sigLabel, children: "Pihak Kedai / Penjual" })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: s.sigBox, children: [
        /* @__PURE__ */ jsx(Text, { style: { fontSize: 9, color: C.muted, marginBottom: 4 }, children: "Diterima oleh," }),
        /* @__PURE__ */ jsx(View, { style: s.sigLine }),
        /* @__PURE__ */ jsx(Text, { style: s.sigName, children: (customer == null ? void 0 : customer.customer_name) || (invoice == null ? void 0 : invoice.customer_name) || "________________" }),
        /* @__PURE__ */ jsx(Text, { style: s.sigLabel, children: "Pihak Pembeli" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(View, { style: s.footer, fixed: true, children: [
      /* @__PURE__ */ jsxs(Text, { style: s.footerText, children: [
        invoiceNumber,
        " | Ref: ",
        (invoice == null ? void 0 : invoice.invoice_number) || "-",
        " | ",
        formatDatePDF(/* @__PURE__ */ new Date()),
        " | ",
        generatedBy || "-"
      ] }),
      /* @__PURE__ */ jsx(Text, { style: s.footerText, children: "Powered by TernakOS — ternakos.com" })
    ] })
  ] }) });
}
const useSaveInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      invoice_type,
      reference_id,
      recipient_name,
      total_amount,
      metadata
    }) => {
      const { data: authData } = await supabase.auth.getUser();
      const { data: profile, error: profileErr } = await supabase.from("profiles").select("tenant_id, id").eq("auth_user_id", authData.user.id).single();
      if (profileErr) throw profileErr;
      const invoice_number = generateInvoiceNumber(invoice_type);
      const { data, error } = await supabase.from("generated_invoices").insert({
        tenant_id: profile.tenant_id,
        invoice_type,
        reference_id,
        invoice_number,
        recipient_name,
        total_amount,
        metadata,
        created_by: profile.id,
        status: "draft"
      }).select().single();
      if (error) {
        logSupabaseError(error, { table: "generated_invoices", operation: "insert", component: "useInvoice", actionName: "invoice.generate" });
        throw error;
      }
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["generated-invoices", vars.reference_id] });
    }
  });
};
function buildDocument({ type, invoiceNumber, data }) {
  const {
    tenant,
    sale,
    rpa,
    farm,
    delivery,
    purchase,
    payment,
    payments,
    cycle,
    broker_name,
    total_ekor,
    total_berat,
    price_per_kg,
    invoice,
    customer,
    items,
    showProfit,
    generatedBy
  } = data;
  if (type === "sale") {
    return /* @__PURE__ */ jsx(
      SaleInvoice,
      {
        tenant,
        sale,
        rpa,
        farm,
        delivery,
        invoiceNumber,
        generatedBy,
        payments
      }
    );
  }
  if (type === "purchase") {
    return /* @__PURE__ */ jsx(
      PurchaseInvoice,
      {
        tenant,
        purchase,
        farm,
        invoiceNumber,
        generatedBy
      }
    );
  }
  if (type === "delivery") {
    return /* @__PURE__ */ jsx(
      DeliveryReceipt,
      {
        tenant,
        delivery,
        sale,
        farm,
        rpa,
        invoiceNumber,
        generatedBy
      }
    );
  }
  if (type === "payment_receipt") {
    return /* @__PURE__ */ jsx(
      PaymentReceipt,
      {
        tenant,
        payment,
        sale,
        rpa,
        invoiceNumber,
        generatedBy
      }
    );
  }
  if (type === "peternak_invoice") {
    return /* @__PURE__ */ jsx(
      PeternakInvoice,
      {
        tenant,
        cycle,
        farm,
        broker_name,
        total_ekor,
        total_berat,
        price_per_kg,
        invoiceNumber,
        generatedBy
      }
    );
  }
  if (type === "rpa_to_toko") {
    return /* @__PURE__ */ jsx(
      RPATokoInvoice,
      {
        tenant,
        invoice,
        customer,
        items: items || [],
        invoiceNumber,
        generatedBy,
        showProfit: showProfit ?? false
      }
    );
  }
  if (type === "sembako_sale") {
    return /* @__PURE__ */ jsx(
      SembakoInvoice,
      {
        tenant,
        invoice,
        customer,
        items: items || [],
        invoiceNumber,
        generatedBy,
        showProfit: showProfit ?? false
      }
    );
  }
  return null;
}
function getFileName(type, invoiceNumber) {
  const prefixes = {
    sale: "Invoice",
    purchase: "BuktiBeli",
    delivery: "SuratJalan",
    payment_receipt: "Kwitansi",
    peternak_invoice: "TagihanTernak",
    rpa_to_toko: "InvoiceRPA",
    sembako_sale: "InvoiceSembako"
  };
  return `${prefixes[type] || "Dokumen"}_${invoiceNumber}.pdf`;
}
function PDFSkeleton() {
  return /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col items-center justify-center gap-3 bg-[#111C24] rounded-xl", children: [
    /* @__PURE__ */ jsx(Loader2, { size: 28, className: "animate-spin text-emerald-400" }),
    /* @__PURE__ */ jsx("p", { className: "text-sm text-[#4B6478] font-medium", children: "Memuat preview PDF..." })
  ] });
}
function InvoicePreviewModal({ type, data, isOpen, onClose }) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q;
  const typeMap = {
    sale: "sale",
    purchase: "purchase",
    delivery: "delivery",
    payment_receipt: "payment_receipt",
    peternak_invoice: "peternak_invoice",
    rpa_to_toko: "rpa_to_toko",
    sembako_sale: "sembako_sale"
  };
  const [invoiceNumber] = useState(() => generateInvoiceNumber(typeMap[type] || "sale"));
  const [saved, setSaved] = useState(false);
  const { tenant } = useAuth();
  const sub = getSubscriptionStatus(tenant);
  const isStarter = sub.status !== "active" && sub.status !== "trial";
  const { mutate: saveInvoice, isPending: isSaving } = useSaveInvoice();
  if (!isOpen || !data) return null;
  const doc = buildDocument({ type, invoiceNumber, data });
  if (!doc) return null;
  const fileName = getFileName(type, invoiceNumber);
  const titles = {
    sale: "Invoice Penjualan",
    purchase: "Bukti Pembelian",
    delivery: "Surat Jalan",
    payment_receipt: "Kwitansi Pembayaran",
    peternak_invoice: "Tagihan Penjualan Ternak",
    rpa_to_toko: "Invoice Penjualan (RPA)",
    sembako_sale: "Invoice Penjualan Sembako"
  };
  const title = titles[type] || "Dokumen";
  const referenceId = type === "purchase" ? (_a = data.purchase) == null ? void 0 : _a.id : type === "delivery" ? (_b = data.delivery) == null ? void 0 : _b.id : type === "payment_receipt" ? (_c = data.payment) == null ? void 0 : _c.id : type === "peternak_invoice" ? (_d = data.cycle) == null ? void 0 : _d.id : type === "rpa_to_toko" ? (_e = data.invoice) == null ? void 0 : _e.id : type === "sembako_sale" ? (_f = data.invoice) == null ? void 0 : _f.id : (_g = data.sale) == null ? void 0 : _g.id;
  const recipientName = type === "purchase" ? ((_h = data.farm) == null ? void 0 : _h.farm_name) || "-" : type === "peternak_invoice" ? data.broker_name || "-" : type === "rpa_to_toko" ? ((_i = data.customer) == null ? void 0 : _i.customer_name) || "-" : type === "sembako_sale" ? ((_j = data.customer) == null ? void 0 : _j.customer_name) || "-" : ((_k = data.rpa) == null ? void 0 : _k.rpa_name) || "-";
  const totalAmount = type === "purchase" ? Number(((_l = data.purchase) == null ? void 0 : _l.total_cost) || 0) : type === "payment_receipt" ? Number(((_m = data.payment) == null ? void 0 : _m.amount) || 0) : type === "peternak_invoice" ? Number(((_n = data.cycle) == null ? void 0 : _n.total_revenue) || 0) : type === "rpa_to_toko" ? Number(((_o = data.invoice) == null ? void 0 : _o.total_amount) || 0) : type === "sembako_sale" ? Number(((_p = data.invoice) == null ? void 0 : _p.total_amount) || 0) : Number(((_q = data.sale) == null ? void 0 : _q.total_revenue) || 0);
  const handleSave = () => {
    saveInvoice(
      {
        invoice_type: type,
        reference_id: referenceId,
        recipient_name: recipientName,
        total_amount: totalAmount,
        metadata: {
          invoice_number: invoiceNumber,
          generated_by: data.generatedBy
        }
      },
      {
        onSuccess: () => {
          setSaved(true);
          toast.success("Invoice tersimpan ke riwayat");
        },
        onError: (err) => {
          toast.error("Gagal simpan: " + err.message);
        }
      }
    );
  };
  return /* @__PURE__ */ jsx(Dialog, { open: isOpen, onOpenChange: (open) => {
    if (!open) onClose();
  }, children: /* @__PURE__ */ jsxs(
    DialogContent,
    {
      className: "bg-[#0C1319] border border-white/[0.08] p-0 flex flex-col overflow-hidden max-w-[900px] w-[95vw] h-[90dvh] rounded-[20px]",
      children: [
        /* @__PURE__ */ jsx(DialogHeader, { className: "flex-row items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-white/[0.08] shrink-0", children: /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(DialogTitle, { className: "font-display font-bold text-base sm:text-lg text-white leading-none", children: title }),
          /* @__PURE__ */ jsx(DialogDescription, { className: "text-[10px] sm:text-[11px] text-[#4B6478] mt-1 font-mono", children: invoiceNumber })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-hidden px-2 sm:px-4 py-2 sm:py-3", children: isStarter ? /* @__PURE__ */ jsxs(
          "div",
          {
            className: "h-full flex flex-col items-center justify-center gap-6 rounded-xl relative overflow-hidden",
            style: { background: "linear-gradient(135deg, #0D1F2E 0%, #0A1520 100%)", border: "1px solid rgba(255,255,255,0.06)" },
            children: [
              /* @__PURE__ */ jsx("div", { className: "absolute inset-0 opacity-10 pointer-events-none select-none p-8 flex flex-col gap-3 blur-sm", children: Array.from({ length: 12 }).map((_, i) => /* @__PURE__ */ jsx("div", { className: "h-3 rounded-full bg-white/40", style: { width: `${55 + i % 3 * 15}%` } }, i)) }),
              /* @__PURE__ */ jsxs("div", { className: "relative z-10 flex flex-col items-center text-center gap-4 px-6", children: [
                /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center", children: /* @__PURE__ */ jsx(Lock, { size: 28, className: "text-emerald-400" }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-3", children: [
                    /* @__PURE__ */ jsx(FileText, { size: 11, className: "text-emerald-400" }),
                    /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black uppercase tracking-widest text-emerald-400", children: "Fitur Pro" })
                  ] }),
                  /* @__PURE__ */ jsx("h3", { className: "font-display text-xl font-black text-white mb-2", children: "Generate Invoice & PDF" }),
                  /* @__PURE__ */ jsxs("p", { className: "text-sm text-[#64748B] max-w-xs leading-relaxed", children: [
                    "Buat invoice, surat jalan, dan kwitansi PDF profesional. Tersedia di plan ",
                    /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Pro" }),
                    " dan ",
                    /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Business" }),
                    "."
                  ] })
                ] }),
                /* @__PURE__ */ jsx(
                  Link,
                  {
                    to: "/upgrade",
                    onClick: onClose,
                    className: "inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-sm rounded-xl transition-colors shadow-[0_4px_20px_rgba(2, 26, 2,0.3)]",
                    children: "Lihat Paket Pro →"
                  }
                )
              ] })
            ]
          }
        ) : /* @__PURE__ */ jsx(Suspense, { fallback: /* @__PURE__ */ jsx(PDFSkeleton, {}), children: /* @__PURE__ */ jsx(
          PDFViewer,
          {
            width: "100%",
            height: "100%",
            style: { borderRadius: "12px", border: "none" },
            showToolbar: true,
            children: doc
          }
        ) }) }),
        /* @__PURE__ */ jsxs("div", { className: "shrink-0 p-4 sm:px-6 sm:py-4 border-t border-white/[0.08] flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 overflow-y-auto max-h-[30dvh]", children: [
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "outline",
              onClick: handleSave,
              disabled: isSaving || saved || isStarter,
              className: "flex-1 sm:flex-none h-11 border-white/10 bg-white/[0.03] text-[#94A3B8] font-semibold text-[10px] sm:text-xs uppercase tracking-widest rounded-xl hover:bg-white/[0.06] disabled:opacity-50",
              children: [
                isSaving ? /* @__PURE__ */ jsx(Loader2, { size: 14, className: "animate-spin mr-1 sm:mr-2" }) : saved ? /* @__PURE__ */ jsx(CheckCircle2, { size: 14, className: "text-emerald-400 mr-1 sm:mr-2" }) : /* @__PURE__ */ jsx(Save, { size: 14, className: "mr-1 sm:mr-2" }),
                saved ? "Tersimpan" : "Simpan"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "outline",
              onClick: () => window.print(),
              disabled: isStarter,
              className: "flex-1 sm:flex-none h-11 border-white/10 bg-white/[0.03] text-[#94A3B8] font-semibold text-[10px] sm:text-xs uppercase tracking-widest rounded-xl hover:bg-white/[0.06] disabled:opacity-50",
              children: [
                /* @__PURE__ */ jsx(Printer, { size: 14, className: "mr-1 sm:mr-2" }),
                "Print"
              ]
            }
          ),
          isStarter ? /* @__PURE__ */ jsxs(
            Button,
            {
              disabled: true,
              className: "w-full sm:w-auto sm:ml-auto h-11 bg-white/[0.05] text-white/30 font-bold text-[10px] sm:text-xs uppercase tracking-widest rounded-xl cursor-not-allowed",
              children: [
                /* @__PURE__ */ jsx(Lock, { size: 14, className: "mr-1 sm:mr-2" }),
                "Download — Pro Only"
              ]
            }
          ) : /* @__PURE__ */ jsx(PDFDownloadLink, { document: doc, fileName, className: "w-full sm:w-auto sm:ml-auto", children: ({ loading }) => /* @__PURE__ */ jsxs(
            Button,
            {
              disabled: loading,
              className: "w-full h-11 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] sm:text-xs uppercase tracking-widest rounded-xl shadow-[0_4px_16px_rgba(2, 26, 2,0.25)] active:scale-95 transition-transform disabled:opacity-60",
              children: [
                loading ? /* @__PURE__ */ jsx(Loader2, { size: 14, className: "animate-spin mr-1 sm:mr-2" }) : /* @__PURE__ */ jsx(Download, { size: 14, className: "mr-1 sm:mr-2" }),
                loading ? "Memproses..." : "Download PDF"
              ]
            }
          ) })
        ] })
      ]
    }
  ) });
}
const BASE = "bg-[#06090F] min-h-screen p-4 md:p-6 lg:p-8";
function SkeletonStatCard() {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 space-y-3", children: [
    /* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-20 rounded-full" }),
    /* @__PURE__ */ jsx(Skeleton, { className: "h-8 w-32 rounded-lg" }),
    /* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-16 rounded-full" })
  ] });
}
function SkeletonListCard() {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 flex items-center gap-4", children: [
    /* @__PURE__ */ jsx(Skeleton, { className: "h-11 w-11 rounded-xl shrink-0" }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-2", children: [
      /* @__PURE__ */ jsx(Skeleton, { className: "h-4 w-36 rounded-full" }),
      /* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-24 rounded-full" })
    ] }),
    /* @__PURE__ */ jsx(Skeleton, { className: "h-6 w-16 rounded-full" })
  ] });
}
function SkeletonTableRow() {
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 py-3 border-b border-white/[0.04]", children: [
    /* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-24 rounded-full" }),
    /* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-32 rounded-full flex-1" }),
    /* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-20 rounded-full" }),
    /* @__PURE__ */ jsx(Skeleton, { className: "h-6 w-16 rounded-full" })
  ] });
}
function SkeletonPageHeader({ withSearch = true, withButton = true }) {
  return /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4 mb-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Skeleton, { className: "h-8 w-52 rounded-xl" }),
      /* @__PURE__ */ jsx(Skeleton, { className: "h-4 w-36 rounded-full" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      withSearch && /* @__PURE__ */ jsx(Skeleton, { className: "h-10 w-40 rounded-xl" }),
      withButton && /* @__PURE__ */ jsx(Skeleton, { className: "h-10 w-28 rounded-xl" })
    ] })
  ] });
}
function SkeletonTabs({ count = 3 }) {
  return /* @__PURE__ */ jsx("div", { className: "flex gap-2 mb-4", children: Array(count).fill(0).map((_, i) => /* @__PURE__ */ jsx(Skeleton, { className: `h-9 rounded-xl ${i === 0 ? "w-24" : "w-20"}` }, i)) });
}
function BerandaSkeleton() {
  return /* @__PURE__ */ jsxs("div", { className: BASE + " space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Skeleton, { className: "h-8 w-56 rounded-xl" }),
      /* @__PURE__ */ jsx(Skeleton, { className: "h-4 w-40 rounded-full" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsx(SkeletonStatCard, {}),
      /* @__PURE__ */ jsx(SkeletonStatCard, {})
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-4", children: [
      /* @__PURE__ */ jsx(Skeleton, { className: "col-span-1 lg:col-span-2 h-64 rounded-2xl" }),
      /* @__PURE__ */ jsx(Skeleton, { className: "col-span-1 h-64 rounded-2xl" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "space-y-3", children: Array(4).fill(0).map((_, i) => /* @__PURE__ */ jsx(SkeletonListCard, {}, i)) })
  ] });
}
function TransaksiSkeleton() {
  return /* @__PURE__ */ jsxs("div", { className: BASE + " space-y-4", children: [
    /* @__PURE__ */ jsx(SkeletonPageHeader, {}),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-3", children: Array(3).fill(0).map((_, i) => /* @__PURE__ */ jsx(SkeletonStatCard, {}, i)) }),
    /* @__PURE__ */ jsx(SkeletonTabs, { count: 4 }),
    /* @__PURE__ */ jsx("div", { className: "space-y-3", children: Array(5).fill(0).map((_, i) => /* @__PURE__ */ jsxs("div", { className: "rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(Skeleton, { className: "h-9 w-9 rounded-xl" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsx(Skeleton, { className: "h-4 w-28 rounded-full" }),
            /* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-20 rounded-full" })
          ] })
        ] }),
        /* @__PURE__ */ jsx(Skeleton, { className: "h-6 w-20 rounded-full" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-2 pt-1", children: [
        /* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-full rounded-full" }),
        /* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-full rounded-full" }),
        /* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-full rounded-full" })
      ] })
    ] }, i)) })
  ] });
}
function PengirimanSkeleton() {
  return /* @__PURE__ */ jsxs("div", { className: BASE + " space-y-5", children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Skeleton, { className: "h-8 w-52 rounded-xl" }),
      /* @__PURE__ */ jsx(Skeleton, { className: "h-4 w-44 rounded-full" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-4", children: [
      /* @__PURE__ */ jsx(Skeleton, { className: "h-28 rounded-2xl" }),
      /* @__PURE__ */ jsx(Skeleton, { className: "h-28 rounded-2xl" }),
      /* @__PURE__ */ jsx(Skeleton, { className: "h-28 rounded-2xl" })
    ] }),
    /* @__PURE__ */ jsx(SkeletonTabs, { count: 2 }),
    /* @__PURE__ */ jsx("div", { className: "flex gap-2 mb-3", children: ["Semua", "Aktif", "Selesai"].map((l) => /* @__PURE__ */ jsx(Skeleton, { className: "h-8 w-16 rounded-full" }, l)) }),
    /* @__PURE__ */ jsx("div", { className: "space-y-3", children: Array(4).fill(0).map((_, i) => /* @__PURE__ */ jsxs("div", { className: "rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex gap-3 items-center", children: [
          /* @__PURE__ */ jsx(Skeleton, { className: "h-10 w-10 rounded-xl" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsx(Skeleton, { className: "h-4 w-32 rounded-full" }),
            /* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-24 rounded-full" })
          ] })
        ] }),
        /* @__PURE__ */ jsx(Skeleton, { className: "h-6 w-20 rounded-full" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-4 gap-2", children: Array(4).fill(0).map((_2, j) => /* @__PURE__ */ jsx(Skeleton, { className: "h-3 rounded-full" }, j)) })
    ] }, i)) })
  ] });
}
function RPASkeleton() {
  return /* @__PURE__ */ jsxs("div", { className: BASE + " space-y-5", children: [
    /* @__PURE__ */ jsx(SkeletonPageHeader, { withSearch: true }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsx(SkeletonStatCard, {}),
      /* @__PURE__ */ jsx(SkeletonStatCard, {})
    ] }),
    /* @__PURE__ */ jsx("div", { className: "space-y-3", children: Array(6).fill(0).map((_, i) => /* @__PURE__ */ jsxs("div", { className: "rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 flex items-center gap-4", children: [
      /* @__PURE__ */ jsx(Skeleton, { className: "h-12 w-12 rounded-2xl shrink-0" }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-2", children: [
        /* @__PURE__ */ jsx(Skeleton, { className: "h-4 w-32 rounded-full" }),
        /* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-48 rounded-full" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-right space-y-1.5", children: [
        /* @__PURE__ */ jsx(Skeleton, { className: "h-4 w-24 rounded-full ml-auto" }),
        /* @__PURE__ */ jsx(Skeleton, { className: "h-6 w-20 rounded-full ml-auto" })
      ] })
    ] }, i)) })
  ] });
}
function KandangSkeleton() {
  return /* @__PURE__ */ jsxs("div", { className: BASE + " space-y-5", children: [
    /* @__PURE__ */ jsx(SkeletonPageHeader, { withSearch: true }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsx(SkeletonStatCard, {}),
      /* @__PURE__ */ jsx(SkeletonStatCard, {})
    ] }),
    /* @__PURE__ */ jsx("div", { className: "space-y-3", children: Array(5).fill(0).map((_, i) => /* @__PURE__ */ jsxs("div", { className: "rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 flex items-center gap-4", children: [
      /* @__PURE__ */ jsx(Skeleton, { className: "h-11 w-11 rounded-xl shrink-0" }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-2", children: [
        /* @__PURE__ */ jsx(Skeleton, { className: "h-4 w-28 rounded-full" }),
        /* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-20 rounded-full" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5 text-right", children: [
        /* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-16 rounded-full ml-auto" }),
        /* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-12 rounded-full ml-auto" })
      ] })
    ] }, i)) })
  ] });
}
function TimSkeleton() {
  return /* @__PURE__ */ jsxs("div", { className: BASE + " space-y-5", children: [
    /* @__PURE__ */ jsx(SkeletonPageHeader, { withSearch: false, withButton: true }),
    /* @__PURE__ */ jsx(Skeleton, { className: "h-24 w-full rounded-2xl" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Skeleton, { className: "h-4 w-28 rounded-full" }),
      /* @__PURE__ */ jsx("div", { className: "space-y-2", children: Array(4).fill(0).map((_, i) => /* @__PURE__ */ jsxs("div", { className: "rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(Skeleton, { className: "h-10 w-10 rounded-full shrink-0" }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-1.5", children: [
          /* @__PURE__ */ jsx(Skeleton, { className: "h-4 w-28 rounded-full" }),
          /* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-40 rounded-full" })
        ] }),
        /* @__PURE__ */ jsx(Skeleton, { className: "h-6 w-16 rounded-full" })
      ] }, i)) })
    ] })
  ] });
}
function ArmadaSkeleton() {
  return /* @__PURE__ */ jsxs("div", { className: BASE + " space-y-5", children: [
    /* @__PURE__ */ jsx(SkeletonPageHeader, { withSearch: true }),
    /* @__PURE__ */ jsx(SkeletonTabs, { count: 2 }),
    /* @__PURE__ */ jsx("div", { className: "space-y-3", children: Array(5).fill(0).map((_, i) => /* @__PURE__ */ jsxs("div", { className: "rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 flex items-center gap-4", children: [
      /* @__PURE__ */ jsx(Skeleton, { className: "h-11 w-11 rounded-xl shrink-0" }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-2", children: [
        /* @__PURE__ */ jsx(Skeleton, { className: "h-4 w-24 rounded-full" }),
        /* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-32 rounded-full" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "space-y-1.5", children: /* @__PURE__ */ jsx(Skeleton, { className: "h-6 w-16 rounded-full" }) })
    ] }, i)) })
  ] });
}
function CashFlowSkeleton() {
  return /* @__PURE__ */ jsxs("div", { className: BASE + " space-y-5", children: [
    /* @__PURE__ */ jsx(SkeletonPageHeader, { withSearch: false, withButton: false }),
    /* @__PURE__ */ jsx(SkeletonTabs, { count: 5 }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: Array(4).fill(0).map((_, i) => /* @__PURE__ */ jsx(SkeletonStatCard, {}, i)) }),
    /* @__PURE__ */ jsx(Skeleton, { className: "h-56 w-full rounded-2xl" }),
    /* @__PURE__ */ jsx("div", { className: "rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-1", children: Array(8).fill(0).map((_, i) => /* @__PURE__ */ jsx(SkeletonTableRow, {}, i)) })
  ] });
}
function RPADetailSkeleton() {
  return /* @__PURE__ */ jsxs("div", { className: BASE + " space-y-5", children: [
    /* @__PURE__ */ jsx(Skeleton, { className: "h-9 w-24 rounded-xl" }),
    /* @__PURE__ */ jsxs("div", { className: "rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsx(Skeleton, { className: "h-14 w-14 rounded-2xl" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Skeleton, { className: "h-5 w-36 rounded-full" }),
          /* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-28 rounded-full" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-3 pt-2", children: Array(3).fill(0).map((_, i) => /* @__PURE__ */ jsx(SkeletonStatCard, {}, i)) })
    ] }),
    /* @__PURE__ */ jsx(SkeletonTabs, { count: 3 }),
    /* @__PURE__ */ jsx("div", { className: "space-y-3", children: Array(4).fill(0).map((_, i) => /* @__PURE__ */ jsx(SkeletonListCard, {}, i)) })
  ] });
}
const PETERNAK_TIM_CONFIG = {
  // Warna
  accent: "#021a02",
  accentHover: "#021a02",
  accentRgb: "16, 185, 129",
  // Role badge map
  roleBadgeMap: {
    owner: { label: "Owner", class: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    manajer: { label: "Manajer", class: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
    staff: { label: "Staff Kandang", class: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    anak_buah: { label: "Anak Buah Kandang", class: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
    view_only: { label: "Lihat Saja", class: "bg-amber-500/10 text-amber-400 border-amber-500/20" }
  },
  // Role options di InviteSheet
  inviteRoles: [
    { value: "manajer", label: "Manajer Kandang", desc: "Kelola semua data transaksi & siklus, tidak bisa akses profil bisnis." },
    { value: "staff", label: "Staff Kandang", desc: "Input data harian & tugas. Tidak bisa melihat keuangan." },
    { value: "anak_buah", label: "Anak Buah Kandang", desc: "Hanya bisa melihat & menyelesaikan tugas yang ditugaskan padanya." },
    { value: "view_only", label: "Lihat Saja", desc: "Akses terbatas: hanya melihat statistik & laporan." }
  ],
  defaultInviteRole: "staff",
  // UI tokens
  cardBg: "#0C1319",
  cardRadius: "16px",
  inputBg: "#111C24",
  inviteCodeTitle: "Kode Undangan Tim"
};
const BROKER_SEMBAKO_TIM_CONFIG = {
  accent: "#EA580C",
  accentHover: "#D44E0A",
  accentRgb: "234, 88, 12",
  roleBadgeMap: {
    owner: { label: "Owner", class: "bg-[#EA580C]/10 text-[#EA580C] border-[#EA580C]/20" },
    admin: { label: "Admin", class: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    sales: { label: "Sales", class: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    gudang: { label: "Gudang", class: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
    kurir: { label: "Kurir / Sopir", class: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
    lainnya: { label: "Lainnya", class: "bg-gray-500/10 text-gray-400 border-gray-500/20" }
  },
  inviteRoles: [
    { value: "admin", label: "Admin", desc: "Akses penuh ke operasional, keuangan, dan laporan." },
    { value: "sales", label: "Sales", desc: "Mengelola penjualan, pelanggan, dan pesanan baru." },
    { value: "gudang", label: "Gudang", desc: "Mengelola stok, inventori, masuk & keluar barang." },
    { value: "kurir", label: "Kurir / Sopir", desc: "Akses melihat rute dan update status pengiriman/logistik." },
    { value: "lainnya", label: "Lainnya", desc: "Akses khusus atau jabatan lainnya di dalam operasional." }
  ],
  defaultInviteRole: "admin",
  cardBg: "#111C24",
  cardRadius: "28px",
  inputBg: "#0C1319",
  inviteCodeTitle: "Kode Undangan Sembako"
};
const BROKER_POULTRY_TIM_CONFIG = {
  accent: "#0EA5E9",
  accentHover: "#0284C7",
  accentRgb: "14, 165, 233",
  roleBadgeMap: {
    owner: { label: "Owner", class: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
    manajer: { label: "Manajer", class: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
    sales: { label: "Sales / Marketing", class: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    supir: { label: "Supir / Driver", class: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    staff: { label: "Staff", class: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
    view_only: { label: "Lihat Saja", class: "bg-gray-500/10 text-gray-400 border-gray-500/20" }
  },
  inviteRoles: [
    { value: "manajer", label: "Manajer", desc: "Akses penuh operasional & transaksi." },
    { value: "sales", label: "Sales / Marketing", desc: "Kelola transaksi penjualan & pelanggan." },
    { value: "supir", label: "Supir / Driver", desc: "Akses lihat jadwal pengiriman." },
    { value: "staff", label: "Staff", desc: "Input data & tugas operasional." },
    { value: "view_only", label: "Lihat Saja", desc: "Akses terbatas laporan & statistik." }
  ],
  defaultInviteRole: "staff",
  cardBg: "#0C1319",
  cardRadius: "16px",
  inputBg: "#111C24",
  inviteCodeTitle: "Kode Undangan Broker Ayam"
};
const BROKER_TELUR_TIM_CONFIG = {
  accent: "#F59E0B",
  accentHover: "#D97706",
  accentRgb: "245, 158, 11",
  roleBadgeMap: {
    owner: { label: "Owner", class: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    admin: { label: "Admin", class: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    sales: { label: "Sales", class: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    gudang: { label: "Gudang", class: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
    kurir: { label: "Kurir / Sopir", class: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
    view_only: { label: "Lihat Saja", class: "bg-gray-500/10 text-gray-400 border-gray-500/20" }
  },
  inviteRoles: [
    { value: "admin", label: "Admin", desc: "Akses penuh operasional & keuangan." },
    { value: "sales", label: "Sales", desc: "Kelola penjualan & pelanggan telur." },
    { value: "gudang", label: "Gudang", desc: "Manajemen stok & inventori telur." },
    { value: "kurir", label: "Kurir / Sopir", desc: "Akses lihat jadwal pengiriman." },
    { value: "view_only", label: "Lihat Saja", desc: "Akses terbatas laporan." }
  ],
  defaultInviteRole: "admin",
  cardBg: "#0C1319",
  cardRadius: "16px",
  inputBg: "#111C24",
  inviteCodeTitle: "Kode Undangan Broker Telur"
};
const RPA_TIM_CONFIG = {
  accent: "#8B5CF6",
  accentHover: "#7C3AED",
  accentRgb: "139, 92, 246",
  roleBadgeMap: {
    owner: { label: "Owner", class: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
    admin_rpa: { label: "Admin RPA", class: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    operator: { label: "Operator", class: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    qc: { label: "Quality Control", class: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    gudang_rpa: { label: "Gudang", class: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" }
  },
  inviteRoles: [
    { value: "admin_rpa", label: "Admin RPA", desc: "Akses penuh ke operasional RPA dan laporan." },
    { value: "operator", label: "Operator", desc: "Mengelola proses pemotongan dan produksi." },
    { value: "qc", label: "Quality Control", desc: "Inspeksi kualitas produk dan standar kebersihan." },
    { value: "gudang_rpa", label: "Gudang", desc: "Mengelola stok hasil produksi dan distribusi." }
  ],
  defaultInviteRole: "operator",
  cardBg: "#0C1319",
  cardRadius: "16px",
  inputBg: "#111C24",
  inviteCodeTitle: "Kode Undangan RPA"
};
function Tim({ hideMobileHeader = false, roleConfig }) {
  var _a;
  const cfg = roleConfig || PETERNAK_TIM_CONFIG;
  const ROLE_BADGE_MAP = cfg.roleBadgeMap;
  const accent = cfg.accent || "#021a02";
  const cardRadius = cfg.cardRadius || "16px";
  const cardBg = cfg.cardBg || "#0C1319";
  const inputBg = cfg.inputBg || "#111C24";
  cfg.inviteRoles || [];
  cfg.defaultInviteRole || "staff";
  cfg.inviteCodeTitle || "Kode Undangan Tim";
  const { profile, tenant: authTenant } = useAuth();
  const sub = getSubscriptionStatus(authTenant);
  const queryClient = useQueryClient();
  const [isInviteSheetOpen, setIsInviteSheetOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    business_name: "",
    phone: "",
    location: ""
  });
  const isOwner$1 = isOwner(profile) || isSuperadmin(profile);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const { setSidebarOpen } = useOutletContext() || {};
  const { data: tenant, isLoading: loadingTenant } = useQuery({
    queryKey: ["tenants", profile == null ? void 0 : profile.tenant_id],
    queryFn: async () => {
      if (!(profile == null ? void 0 : profile.tenant_id)) return null;
      const { data, error } = await supabase.from("tenants").select("*").eq("id", profile.tenant_id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!(profile == null ? void 0 : profile.tenant_id)
  });
  React__default.useEffect(() => {
    if (tenant) {
      setProfileForm({
        business_name: tenant.business_name || "",
        phone: tenant.phone || "",
        location: tenant.location || ""
      });
      if (!tenant.business_name && isOwner$1) {
        setIsEditingProfile(true);
      }
    }
  }, [tenant, isOwner$1]);
  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ["peternak-team", profile == null ? void 0 : profile.tenant_id],
    queryFn: async () => {
      if (!(profile == null ? void 0 : profile.tenant_id)) return [];
      const [{ data: profileMembers, error }, { data: membershipMembers }] = await Promise.all([
        supabase.from("profiles").select("*").eq("tenant_id", profile.tenant_id),
        supabase.from("tenant_memberships").select("*").eq("tenant_id", profile.tenant_id)
      ]);
      if (error) throw error;
      const combined = [...profileMembers || []];
      const membershipOnly = [];
      for (const m of membershipMembers || []) {
        const existing = combined.find((p) => p.auth_user_id === m.auth_user_id);
        if (!existing) {
          combined.push(m);
          membershipOnly.push(m.auth_user_id);
        } else if (!existing.full_name && m.full_name) {
          existing.full_name = m.full_name;
          if (!existing.avatar_url) existing.avatar_url = m.avatar_url;
        }
      }
      if (membershipOnly.length > 0) {
        const { data: nameData } = await supabase.from("profiles").select("auth_user_id, full_name, avatar_url").in("auth_user_id", membershipOnly);
        for (const m of combined) {
          if (!m.full_name) {
            const np = nameData == null ? void 0 : nameData.find((n) => n.auth_user_id === m.auth_user_id);
            if (np) {
              m.full_name = np.full_name;
              m.avatar_url = np.avatar_url;
            }
          }
        }
      }
      return combined.sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""));
    },
    enabled: !!(profile == null ? void 0 : profile.tenant_id)
  });
  const { data: invitations = [], isLoading: loadingInvitations } = useQuery({
    queryKey: ["peternak-invites", profile == null ? void 0 : profile.tenant_id],
    queryFn: async () => {
      if (!(profile == null ? void 0 : profile.tenant_id)) return [];
      const { data, error } = await supabase.from("team_invitations").select("*").eq("tenant_id", profile.tenant_id).eq("status", "pending").gt("expires_at", (/* @__PURE__ */ new Date()).toISOString()).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!(profile == null ? void 0 : profile.tenant_id)
  });
  const [inviteCode, setInviteCode] = useState(null);
  const [showCode, setShowCode] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(null);
  const inviteMutation = useMutation({
    mutationFn: async (payload) => {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { data, error } = await supabase.from("team_invitations").insert([{
        tenant_id: profile.tenant_id,
        invited_by: profile.profile_id ?? profile.id,
        token: code,
        role: payload.role,
        status: "pending",
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3).toISOString()
      }]).select().single();
      if (error) {
        logSupabaseError(error, { table: "team_invitations", operation: "insert", component: "Tim", actionName: "team.invite.create", tenantId: profile == null ? void 0 : profile.tenant_id });
        throw error;
      }
      return { ...data, code };
    },
    onSuccess: (data) => {
      setInviteCode(data.code);
      setShowCode(true);
      toast.success("Kode undangan berhasil dibuat");
      queryClient.invalidateQueries(["peternak-invites"]);
    },
    onError: (error) => {
      toast.error("Gagal membuat kode undangan", { description: error.message });
    }
  });
  const updateTenantMutation = useMutation({
    mutationFn: async (payload) => {
      const { error } = await supabase.from("tenants").update(payload).eq("id", profile.tenant_id);
      if (error) {
        logSupabaseError(error, { table: "tenants", operation: "update", component: "Tim", actionName: "team.tenant.update", tenantId: profile == null ? void 0 : profile.tenant_id });
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Profil bisnis berhasil disimpan");
      queryClient.invalidateQueries(["tenants"]);
      setIsEditingProfile(false);
    },
    onError: (error) => {
      toast.error("Gagal menyimpan profil", { description: error.message });
    }
  });
  const removeMemberMutation = useMutation({
    mutationFn: async (member) => {
      const authUserId = member.auth_user_id;
      const { error: errorMem } = await supabase.from("tenant_memberships").delete().eq("auth_user_id", authUserId).eq("tenant_id", profile.tenant_id);
      if (errorMem) {
        logSupabaseError(errorMem, { table: "tenant_memberships", operation: "delete", component: "Tim", actionName: "team.member.remove", tenantId: profile == null ? void 0 : profile.tenant_id });
        throw errorMem;
      }
      const { error: errorProf } = await supabase.from("profiles").delete().eq("auth_user_id", authUserId).eq("tenant_id", profile.tenant_id);
      if (errorProf) {
        logSupabaseError(errorProf, { table: "profiles", operation: "delete", component: "Tim", actionName: "team.member.remove", tenantId: profile == null ? void 0 : profile.tenant_id });
        throw errorProf;
      }
    },
    onSuccess: () => {
      toast.success("Anggota berhasil dihapus");
      queryClient.invalidateQueries(["peternak-team"]);
    },
    onError: (error) => {
      toast.error("Gagal menghapus anggota", { description: error.message });
    }
  });
  const cancelInviteMutation = useMutation({
    mutationFn: async (inviteId) => {
      const { error } = await supabase.from("team_invitations").update({ status: "expired" }).eq("id", inviteId).eq("tenant_id", profile.tenant_id);
      if (error) {
        logSupabaseError(error, { table: "team_invitations", operation: "update", component: "Tim", actionName: "team.invite.cancel", tenantId: profile == null ? void 0 : profile.tenant_id });
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Undangan dibatalkan");
      queryClient.invalidateQueries(["peternak-invites"]);
    },
    onError: (error) => {
      toast.error("Gagal membatalkan undangan", { description: error.message });
    }
  });
  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  };
  if (loadingTenant || loadingMembers) return /* @__PURE__ */ jsx(TimSkeleton, {});
  const isStarter = sub.plan === "starter" && sub.status !== "trial";
  isStarter ? 1 : sub.plan === "business" ? Infinity : 3;
  const handleInviteClick = () => {
    const totalMembers = members.length + invitations.length;
    if (isStarter) {
      toast.error("Fitur Tim tidak tersedia di Starter", { description: "Upgrade ke Pro untuk mengundang hingga 3 anggota tim." });
      return;
    }
    if (sub.plan !== "business" && totalMembers >= 3) {
      toast.error("Kapasitas Tim Penuh", { description: "Plan Pro dibatasi maksimal 3 anggota. Upgrade ke Business untuk anggota unlimited!" });
      return;
    }
    setIsInviteSheetOpen(true);
  };
  return /* @__PURE__ */ jsxs("div", { className: cn("max-w-5xl mx-auto", isDesktop ? "p-8 space-y-8 pb-32" : "space-y-5 pb-24"), children: [
    !hideMobileHeader && /* @__PURE__ */ jsxs("header", { className: "h-14 px-4 flex items-center gap-3 justify-between sticky top-0 bg-[#06090F]/80 backdrop-blur-md z-30 border-b border-white/5", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setSidebarOpen == null ? void 0 : setSidebarOpen(true),
            className: "w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0 active:scale-90 transition-transform",
            children: /* @__PURE__ */ jsx(Menu, { size: 16, className: "text-[#94A3B8]" })
          }
        ),
        /* @__PURE__ */ jsx("h1", { className: "font-display text-[15px] font-black text-white uppercase tracking-tight", children: "Tim & Akses" })
      ] }),
      isOwner$1 && /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: handleInviteClick,
          className: "h-9 px-3 text-[11px] font-black text-white rounded-xl flex items-center gap-1.5 uppercase tracking-widest transition-all active:scale-95",
          style: { background: accent },
          children: [
            /* @__PURE__ */ jsx(UserPlus, { size: 13 }),
            " Undang"
          ]
        }
      )
    ] }),
    isDesktop && /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "font-display text-2xl md:text-3xl font-bold text-tx-1", children: "Tim & Akses" }),
        /* @__PURE__ */ jsxs("p", { className: "text-tx-3 mt-1 text-sm", children: [
          members.length,
          " anggota aktif ",
          invitations.length > 0 && `• ${invitations.length} undangan tertunda`,
          sub.plan !== "business" && /* @__PURE__ */ jsx("span", { className: `ml-2 font-bold ${isStarter ? "text-red-400" : "text-amber-500"}`, children: isStarter ? "(Starter: hanya owner)" : `(Kapasitas Plan: ${members.length + invitations.length} / 3)` })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(
        Button,
        {
          onClick: handleInviteClick,
          className: "text-white font-semibold rounded-xl",
          style: { background: accent },
          children: [
            /* @__PURE__ */ jsx(UserPlus, { size: 18, className: "mr-2" }),
            "Undang Anggota"
          ]
        }
      )
    ] }),
    !isDesktop && /* @__PURE__ */ jsxs("p", { className: "text-tx-3 text-xs px-4 pt-1", children: [
      members.length,
      " anggota aktif ",
      invitations.length > 0 && `• ${invitations.length} undangan tertunda`,
      sub.plan !== "business" && /* @__PURE__ */ jsx("span", { className: `ml-2 font-bold ${isStarter ? "text-red-400" : "text-amber-500"}`, children: isStarter ? "(Starter: hanya owner)" : `(${members.length + invitations.length}/3)` })
    ] }),
    isStarter && /* @__PURE__ */ jsxs("div", { className: cn("flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/20", isDesktop ? "" : "mx-4"), children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
        /* @__PURE__ */ jsx(AlertCircle, { size: 14, className: "text-red-400 shrink-0" }),
        /* @__PURE__ */ jsx("p", { className: "text-[12px] font-bold text-red-400", children: "Plan Starter hanya untuk 1 akun (owner). Upgrade ke Pro untuk mengundang tim." })
      ] }),
      /* @__PURE__ */ jsx(Link, { to: "/upgrade", className: "shrink-0 text-[10px] font-black text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors whitespace-nowrap", children: "Upgrade" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: cn(isDesktop ? "" : "px-4"), children: [
      !isOwner$1 && /* @__PURE__ */ jsxs("div", { className: "bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-amber-500 text-sm", children: [
        "Anda masuk sebagai ",
        /* @__PURE__ */ jsx("strong", { children: ((_a = ROLE_BADGE_MAP[profile == null ? void 0 : profile.role]) == null ? void 0 : _a.label) || (profile == null ? void 0 : profile.role) }),
        ". Hanya owner yang dapat mengelola undangan dan akses."
      ] }),
      isOwner$1 && !(tenant == null ? void 0 : tenant.business_name) && /* @__PURE__ */ jsxs("div", { className: "bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-500", children: [
        /* @__PURE__ */ jsx(AlertCircle, { size: 18, className: "text-amber-500 mt-0.5 flex-shrink-0" }),
        /* @__PURE__ */ jsx("p", { className: "text-amber-500 text-sm font-medium", children: "Lengkapi profil bisnis kamu agar semua fitur dapat digunakan." })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("h2", { className: "font-display font-semibold text-lg text-tx-2 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "bg-em-500/10 text-em-400 border-em-500/20 p-1 rounded-md", children: /* @__PURE__ */ jsx(Users, { size: 16 }) }),
            "Profil Bisnis"
          ] }),
          isOwner$1 && !isEditingProfile && /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "ghost",
              size: "sm",
              onClick: () => setIsEditingProfile(true),
              className: cn("text-tx-3 hover:text-tx-1 hover:bg-white/5 rounded-lg px-2", isDesktop ? "h-8" : "h-10"),
              children: [
                /* @__PURE__ */ jsx(Pencil, { size: 14, className: "mr-2" }),
                "Edit Profil"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: cn("border border-white/8 shadow-sm transition-all duration-300", isDesktop ? "p-6" : "p-4"), style: { background: cardBg, borderRadius: cardRadius }, children: loadingTenant ? /* @__PURE__ */ jsx("div", { className: "py-8 flex justify-center text-tx-3", children: /* @__PURE__ */ jsx(Loader2, { className: "animate-spin" }) }) : isEditingProfile ? /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { className: "text-[11px] font-black uppercase tracking-widest text-[#4B6478]", children: "Nama Bisnis" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  value: profileForm.business_name,
                  onChange: (e) => setProfileForm({ ...profileForm, business_name: e.target.value }),
                  placeholder: "Contoh: UD Ayam Jaya",
                  className: "border-white/10 h-12 rounded-xl text-[16px]",
                  style: { background: inputBg }
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { className: "text-[11px] font-black uppercase tracking-widest text-[#4B6478]", children: "No HP Bisnis" }),
              /* @__PURE__ */ jsx(
                PhoneInput,
                {
                  value: profileForm.phone,
                  onChange: (e) => setProfileForm({ ...profileForm, phone: e.target.value }),
                  placeholder: "0812...",
                  className: "border-white/10 h-12 rounded-xl text-[16px]",
                  style: { background: inputBg }
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-[11px] font-black uppercase tracking-widest text-[#4B6478]", children: "Lokasi / Kota" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                value: profileForm.location,
                onChange: (e) => setProfileForm({ ...profileForm, location: e.target.value }),
                placeholder: "Contoh: Boyolali, Jawa Tengah",
                className: "border-white/10 h-12 rounded-xl text-[16px]",
                style: { background: inputBg }
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 pt-2", children: [
            /* @__PURE__ */ jsxs(
              Button,
              {
                onClick: () => updateTenantMutation.mutate(profileForm),
                disabled: updateTenantMutation.isPending || !profileForm.business_name,
                className: "text-white font-bold h-11 px-6 rounded-xl flex-1 md:flex-none",
                style: { background: accent },
                children: [
                  updateTenantMutation.isPending ? /* @__PURE__ */ jsx(Loader2, { size: 18, className: "animate-spin mr-2" }) : /* @__PURE__ */ jsx(Save, { size: 18, className: "mr-2" }),
                  "Simpan Perubahan"
                ]
              }
            ),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "ghost",
                onClick: () => {
                  setIsEditingProfile(false);
                  if (tenant) {
                    setProfileForm({
                      business_name: tenant.business_name || "",
                      phone: tenant.phone || "",
                      location: tenant.location || ""
                    });
                  }
                },
                disabled: updateTenantMutation.isPending,
                className: "text-tx-3 hover:text-tx-1 h-11 px-6 rounded-xl",
                children: "Batal"
              }
            )
          ] })
        ] }) : /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx("p", { className: "text-[11px] font-black uppercase tracking-widest text-[#4B6478]", children: "Nama Bisnis" }),
            /* @__PURE__ */ jsx("p", { className: "text-[16px] font-semibold text-tx-1", children: (tenant == null ? void 0 : tenant.business_name) || "-" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx("p", { className: "text-[11px] font-black uppercase tracking-widest text-[#4B6478]", children: "No HP Bisnis" }),
            /* @__PURE__ */ jsx("p", { className: "text-[16px] font-semibold text-tx-1", children: (tenant == null ? void 0 : tenant.phone) || "-" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx("p", { className: "text-[11px] font-black uppercase tracking-widest text-[#4B6478]", children: "Lokasi / Kota" }),
            /* @__PURE__ */ jsx("p", { className: "text-[16px] font-semibold text-tx-1", children: (tenant == null ? void 0 : tenant.location) || "-" })
          ] })
        ] }) })
      ] }),
      (() => {
        var _a2, _b;
        const ownerMember = members.find((m) => m.role === "owner");
        if (!ownerMember) return null;
        return /* @__PURE__ */ jsxs("section", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("h2", { className: "font-display font-semibold text-lg text-tx-2 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Shield, { size: 18, className: "text-em-400" }),
            "Pemilik Bisnis"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "bg-bg-2 border border-border-def rounded-2xl overflow-hidden shadow-sm", children: /* @__PURE__ */ jsxs("div", { className: "p-4 md:px-6 flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-bg-3 border border-border-def flex items-center justify-center font-display font-bold text-tx-2 text-sm flex-shrink-0", children: getInitials(ownerMember.full_name || ownerMember.email) }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
                /* @__PURE__ */ jsx("span", { className: "font-semibold text-tx-1", children: ownerMember.full_name || "User Baru" }),
                /* @__PURE__ */ jsx("span", { className: "text-sm text-tx-3", children: ownerMember.email })
              ] })
            ] }),
            /* @__PURE__ */ jsx(Badge, { variant: "outline", className: ((_a2 = ROLE_BADGE_MAP["owner"]) == null ? void 0 : _a2.class) || "", children: ((_b = ROLE_BADGE_MAP["owner"]) == null ? void 0 : _b.label) || "Owner" })
          ] }) })
        ] });
      })(),
      /* @__PURE__ */ jsxs("section", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("h2", { className: "font-display font-semibold text-lg text-tx-2 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Users, { size: 18, className: "text-em-400" }),
          "Anggota Aktif"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "bg-bg-2 border border-border-def rounded-2xl overflow-hidden shadow-sm", children: loadingMembers ? /* @__PURE__ */ jsx("div", { className: "p-12 flex justify-center text-tx-3", children: /* @__PURE__ */ jsx(Loader2, { className: "animate-spin" }) }) : members.filter((m) => m.role !== "owner").length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-8 text-center text-tx-3 italic rounded-2xl", children: "Belum ada anggota lain." }) : /* @__PURE__ */ jsx("div", { className: "divide-y divide-border-sub", children: members.filter((m) => m.role !== "owner").map((member) => {
          var _a2, _b;
          return /* @__PURE__ */ jsxs("div", { className: "p-4 md:px-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-bg-3 border border-border-def flex items-center justify-center font-display font-bold text-tx-2 text-sm flex-shrink-0", children: getInitials(member.full_name || member.email) }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
                /* @__PURE__ */ jsx("span", { className: "font-semibold text-tx-1", children: member.full_name || "User Baru" }),
                /* @__PURE__ */ jsx("span", { className: "text-sm text-tx-3", children: member.email })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsx(Badge, { variant: "outline", className: ((_a2 = ROLE_BADGE_MAP[member.role]) == null ? void 0 : _a2.class) || "bg-gray-500/10 text-gray-400", children: ((_b = ROLE_BADGE_MAP[member.role]) == null ? void 0 : _b.label) || member.role }),
              isOwner$1 && member.id !== profile.id && /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "ghost",
                  size: "icon",
                  className: "text-tx-3 hover:text-red hover:bg-red/10 rounded-xl transition-colors",
                  onClick: () => setConfirmRemove(member),
                  disabled: removeMemberMutation.isPending,
                  children: /* @__PURE__ */ jsx(Trash2, { size: 16 })
                }
              )
            ] })
          ] }, member.id);
        }) }) })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("h2", { className: "font-display font-semibold text-lg text-tx-2 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Clock, { size: 18, className: "text-gold" }),
          "Undangan Tertunda",
          invitations.length > 0 && /* @__PURE__ */ jsxs("span", { className: "text-[10px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full px-2 py-0.5 ml-1", children: [
            invitations.length,
            " slot"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "space-y-2", children: loadingInvitations ? /* @__PURE__ */ jsx("div", { className: "p-12 flex justify-center text-tx-3 bg-bg-2 border border-border-def rounded-2xl", children: /* @__PURE__ */ jsx(Loader2, { className: "animate-spin" }) }) : invitations.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-6 text-center text-tx-3 text-sm bg-bg-2 border border-dashed border-white/8 rounded-2xl", children: "Belum ada undangan aktif." }) : invitations.map((invite) => {
          const daysLeft = differenceInDays(new Date(invite.expires_at), /* @__PURE__ */ new Date());
          const isExpiringSoon = daysLeft <= 2;
          const roleInfo = ROLE_BADGE_MAP[invite.role];
          return /* @__PURE__ */ jsxs(
            "div",
            {
              className: "flex items-center gap-3 p-3.5 rounded-2xl border border-dashed border-amber-500/20 bg-amber-500/[0.03] hover:bg-amber-500/[0.06] transition-colors",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "relative shrink-0", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-[#1A2535] border-2 border-dashed border-amber-500/30 flex items-center justify-center", children: /* @__PURE__ */ jsx(UserPlus, { size: 15, className: "text-amber-500/60" }) }),
                  /* @__PURE__ */ jsx("span", { className: "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-400 border-2 border-[#06090F] animate-pulse" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-white/60 italic", children: "Menunggu pendaftaran…" }),
                    /* @__PURE__ */ jsx(Badge, { variant: "outline", className: cn("text-[10px] py-0", (roleInfo == null ? void 0 : roleInfo.class) ?? "bg-gray-500/10 text-gray-400"), children: (roleInfo == null ? void 0 : roleInfo.label) ?? invite.role })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mt-1", children: [
                    /* @__PURE__ */ jsxs(
                      "button",
                      {
                        onClick: () => {
                          navigator.clipboard.writeText(invite.token);
                          toast.success("Kode disalin");
                        },
                        className: "flex items-center gap-1.5 group",
                        title: "Salin kode undangan",
                        children: [
                          /* @__PURE__ */ jsx("span", { className: "font-mono text-xs font-black tracking-[0.2em] text-amber-400 group-hover:text-amber-300 transition-colors", children: invite.token }),
                          /* @__PURE__ */ jsx(Copy, { size: 11, className: "text-[#4B6478] group-hover:text-amber-400 transition-colors" })
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsx("span", { className: "text-[#4B6478] text-[10px]", children: "·" }),
                    /* @__PURE__ */ jsx("span", { className: cn("text-[10px] font-medium", isExpiringSoon ? "text-red-400" : "text-[#4B6478]"), children: daysLeft > 0 ? `sisa ${daysLeft} hari` : "berakhir hari ini" })
                  ] })
                ] }),
                isOwner$1 && /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => setConfirmCancel(invite),
                    disabled: cancelInviteMutation.isPending,
                    className: "w-8 h-8 rounded-xl flex items-center justify-center text-[#4B6478] hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0",
                    title: "Batalkan undangan",
                    children: /* @__PURE__ */ jsx(X, { size: 15 })
                  }
                )
              ]
            },
            invite.id
          );
        }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx(AlertDialog, { open: !!confirmRemove, onOpenChange: (v) => !v && setConfirmRemove(null), children: /* @__PURE__ */ jsxs(AlertDialogContent, { className: "bg-[#0C1319] border border-white/8 rounded-2xl max-w-sm", children: [
      /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsx(AlertDialogTitle, { className: "text-white", children: "Hapus Anggota?" }),
        /* @__PURE__ */ jsxs(AlertDialogDescription, { className: "text-[#4B6478]", children: [
          /* @__PURE__ */ jsx("span", { className: "font-bold text-white/70", children: (confirmRemove == null ? void 0 : confirmRemove.full_name) || (confirmRemove == null ? void 0 : confirmRemove.email) }),
          " akan dihapus dari tim dan kehilangan akses ke bisnis ini."
        ] })
      ] }),
      /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsx(AlertDialogCancel, { className: "bg-white/5 border-white/8 text-slate-300 hover:bg-white/10 rounded-xl", children: "Batal" }),
        /* @__PURE__ */ jsx(
          AlertDialogAction,
          {
            className: "bg-red-500/90 hover:bg-red-500 text-white rounded-xl",
            onClick: () => {
              removeMemberMutation.mutate(confirmRemove);
              setConfirmRemove(null);
            },
            children: "Hapus"
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(AlertDialog, { open: !!confirmCancel, onOpenChange: (v) => !v && setConfirmCancel(null), children: /* @__PURE__ */ jsxs(AlertDialogContent, { className: "bg-[#0C1319] border border-white/8 rounded-2xl max-w-sm", children: [
      /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsx(AlertDialogTitle, { className: "text-white", children: "Batalkan Undangan?" }),
        /* @__PURE__ */ jsxs(AlertDialogDescription, { className: "text-[#4B6478]", children: [
          "Kode ",
          /* @__PURE__ */ jsx("span", { className: "font-mono font-black text-amber-400", children: confirmCancel == null ? void 0 : confirmCancel.token }),
          " akan dinonaktifkan dan tidak bisa digunakan lagi."
        ] })
      ] }),
      /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsx(AlertDialogCancel, { className: "bg-white/5 border-white/8 text-slate-300 hover:bg-white/10 rounded-xl", children: "Batal" }),
        /* @__PURE__ */ jsx(
          AlertDialogAction,
          {
            className: "bg-red-500/90 hover:bg-red-500 text-white rounded-xl",
            onClick: () => {
              cancelInviteMutation.mutate(confirmCancel.id);
              setConfirmCancel(null);
            },
            children: "Batalkan Undangan"
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(
      InviteSheet,
      {
        isOpen: isInviteSheetOpen,
        onClose: () => {
          setIsInviteSheetOpen(false);
          setShowCode(false);
          setInviteCode(null);
        },
        onSubmit: (data) => inviteMutation.mutate(data),
        isPending: inviteMutation.isPending,
        showCode,
        inviteCode,
        roleConfig
      }
    )
  ] });
}
function InviteSheet({ isOpen, onClose, onSubmit, isPending, showCode, inviteCode, roleConfig }) {
  const cfg = roleConfig || PETERNAK_TIM_CONFIG;
  const accent = cfg.accent || "#021a02";
  const inviteRoles = cfg.inviteRoles || [];
  const defaultInviteRole = cfg.defaultInviteRole || "staff";
  cfg.inviteCodeTitle || "Kode Undangan Tim";
  const [role, setRole] = useState(defaultInviteRole);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ role });
  };
  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteCode);
    toast.success("Kode disalin");
  };
  return /* @__PURE__ */ jsx(Sheet, { open: isOpen, onOpenChange: (open) => {
    if (!open) onClose();
  }, children: /* @__PURE__ */ jsxs(
    SheetContent,
    {
      side: isDesktop ? "right" : "bottom",
      className: "bg-[#0C1319] border-l border-border/10 flex flex-col",
      style: {
        width: isDesktop ? "520px" : "100%",
        maxWidth: "100vw",
        maxHeight: isDesktop ? "100vh" : "90dvh",
        padding: 0,
        borderRadius: isDesktop ? "0" : "24px 24px 0 0"
      },
      children: [
        /* @__PURE__ */ jsxs(SheetHeader, { className: cn("text-left pb-0", isDesktop ? "p-8" : "p-5"), children: [
          /* @__PURE__ */ jsx(SheetTitle, { className: "font-display text-xl font-bold text-tx-1", children: "Undang Anggota" }),
          /* @__PURE__ */ jsx(SheetDescription, { className: "text-tx-3 text-sm", children: showCode ? "Kode berhasil dibuat. Bagikan ke anggota yang ingin diundang." : "Generate kode undangan untuk anggota baru bergabung ke bisnis Anda." })
        ] }),
        /* @__PURE__ */ jsx("div", { className: cn("flex-1 flex flex-col gap-6 pt-4", isDesktop ? "p-8" : "p-5"), children: !showCode ? /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-6 flex-1 flex flex-col", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs(Label, { className: "text-xs font-bold text-tx-3 uppercase tracking-wider", children: [
              "Level Akses (Role) ",
              /* @__PURE__ */ jsx("span", { className: "text-red", children: "*" })
            ] }),
            /* @__PURE__ */ jsxs(Select, { value: role, onValueChange: setRole, children: [
              /* @__PURE__ */ jsx(SelectTrigger, { className: "w-full bg-bg-2 border-border-def h-12 rounded-xl text-tx-1 focus-visible:ring-1 focus-visible:ring-em-400", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Pilih Role" }) }),
              /* @__PURE__ */ jsx(SelectContent, { className: "bg-bg-1 border border-border-def rounded-xl shadow-xl", children: inviteRoles.map((r) => /* @__PURE__ */ jsx(SelectItem, { value: r.value, className: "focus:bg-bg-2 cursor-pointer py-3 rounded-lg mx-1 my-0.5", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1", children: [
                /* @__PURE__ */ jsx("span", { className: "font-semibold text-tx-1", children: r.label }),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-tx-3", children: r.desc })
              ] }) }, r.value)) })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mt-auto pt-6 border-t border-border-sub", children: /* @__PURE__ */ jsxs(
            Button,
            {
              type: "submit",
              className: cn("w-full text-white font-bold rounded-xl transition-all", isDesktop ? "h-12 text-[15px]" : "h-11 text-[14px]"),
              style: { background: accent },
              disabled: isPending,
              children: [
                isPending ? /* @__PURE__ */ jsx(Loader2, { className: "animate-spin mr-2" }) : /* @__PURE__ */ jsx(Plus, { size: 18, className: "mr-2" }),
                isPending ? "Generating..." : "Generate Kode Undangan"
              ]
            }
          ) })
        ] }) : /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-300", children: [
          /* @__PURE__ */ jsxs("div", { className: "w-full bg-[#0C1319] border border-[#021a02]/30 rounded-2xl p-8 text-center space-y-6 shadow-xl shadow-emerald-500/5", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-tx-3 text-xs font-bold uppercase tracking-[0.2em]", children: "Kode Undangan Tim" }),
            /* @__PURE__ */ jsx("div", { className: "font-display text-4xl font-black text-[#021a02] tracking-[0.4em] py-6 bg-[#021a02]/5 rounded-2xl border border-[#021a02]/10", children: inviteCode }),
            /* @__PURE__ */ jsx("div", { className: "space-y-1", children: /* @__PURE__ */ jsx("p", { className: "text-[#4B6478] text-xs font-medium", children: "Berlaku 7 hari · Hanya 1x pakai" }) }),
            /* @__PURE__ */ jsxs(
              Button,
              {
                onClick: copyToClipboard,
                className: cn("w-full text-white font-bold rounded-xl transition-all shadow-lg", isDesktop ? "h-12" : "h-11"),
                style: { background: accent },
                children: [
                  /* @__PURE__ */ jsx(Copy, { size: 16, className: "mr-2" }),
                  "Salin Kode"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4 px-4 text-center", children: [
            /* @__PURE__ */ jsxs("p", { className: "text-[#94A3B8] text-sm leading-relaxed", children: [
              "Bagikan kode ini via ",
              /* @__PURE__ */ jsx("strong", { children: "WhatsApp atau chat" }),
              " ke anggota yang ingin diundang."
            ] }),
            /* @__PURE__ */ jsx("div", { className: "p-3 bg-bg-2 border border-border-sub rounded-xl text-xs text-tx-3 text-left", children: /* @__PURE__ */ jsx("p", { children: "💡 Calon staff dapat mendaftar sendiri menggunakan kode ini tanpa perlu input data bisnis." }) })
          ] }),
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "ghost",
              onClick: onClose,
              className: "text-tx-3 hover:text-tx-1",
              children: "Selesai"
            }
          )
        ] }) })
      ]
    }
  ) });
}
function ManajemenPage({ roleConfig, workerTab }) {
  const { setSidebarOpen } = useOutletContext() || {};
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const TABS = [
    ...workerTab ? [{ id: workerTab.id, label: workerTab.label, icon: workerTab.icon || Users, desc: "Pekerja & gaji" }] : [],
    { id: "tim", label: "Tim & Akses", icon: Shield, desc: "Anggota & undangan" }
  ];
  const [activeTab, setActiveTab] = useState(workerTab ? workerTab.id : "tim");
  const accent = (roleConfig == null ? void 0 : roleConfig.accent) || "#021a02";
  if (!workerTab) {
    return /* @__PURE__ */ jsx(Tim, { roleConfig });
  }
  const WorkerComponent = workerTab.component;
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col min-h-full", style: { background: "#06090F" }, children: [
    !isDesktop && /* @__PURE__ */ jsx(
      "header",
      {
        className: "sticky top-0 z-30 backdrop-blur-md border-b border-white/5 pt-[env(safe-area-inset-top,0px)]",
        style: { background: "rgba(6,9,15,0.90)" },
        children: /* @__PURE__ */ jsxs("div", { className: "h-14 px-4 flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setSidebarOpen == null ? void 0 : setSidebarOpen(true),
              className: "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 active:scale-90 transition-transform",
              style: { background: `${accent}14`, border: `1px solid ${accent}2e` },
              children: /* @__PURE__ */ jsx(Menu, { size: 18, style: { color: accent } })
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "flex gap-1.5 bg-white/[0.04] rounded-xl p-1 flex-1", children: TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => setActiveTab(tab.id),
                className: cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all",
                  active ? "text-white shadow-sm" : "text-[#4B6478] hover:text-white/60"
                ),
                style: active ? { background: accent } : {},
                children: [
                  /* @__PURE__ */ jsx(Icon, { size: 12 }),
                  /* @__PURE__ */ jsx("span", { className: "hidden xs:inline", children: tab.label.split(" ")[0] }),
                  /* @__PURE__ */ jsx("span", { children: tab.label.split(" ").slice(-1)[0] })
                ]
              },
              tab.id
            );
          }) })
        ] })
      }
    ),
    isDesktop && /* @__PURE__ */ jsx("div", { className: "px-8 pt-8 pb-0", children: /* @__PURE__ */ jsx("div", { className: "flex items-end gap-6 border-b border-white/[0.06]", children: TABS.map((tab) => {
      const Icon = tab.icon;
      const active = activeTab === tab.id;
      return /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setActiveTab(tab.id),
          className: cn(
            "pb-3 flex items-center gap-2 text-sm font-bold border-b-2 transition-all -mb-px",
            active ? "text-white" : "border-transparent text-[#4B6478] hover:text-white/60"
          ),
          style: active ? { borderBottomColor: accent } : {},
          children: [
            /* @__PURE__ */ jsx(Icon, { size: 15, style: active ? { color: accent } : {} }),
            tab.label,
            active && tab.desc && /* @__PURE__ */ jsxs("span", { className: "text-[10px] font-normal text-[#4B6478] ml-1 hidden md:inline", children: [
              "· ",
              tab.desc
            ] })
          ]
        },
        tab.id
      );
    }) }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 min-h-0", children: [
      activeTab === (workerTab == null ? void 0 : workerTab.id) && /* @__PURE__ */ jsx(WorkerComponent, { hideMobileHeader: true }),
      activeTab === "tim" && /* @__PURE__ */ jsx(Tim, { roleConfig, hideMobileHeader: true })
    ] })
  ] });
}
const VERTICAL_ACCENTS = {
  peternak: { name: "Peternakan", base: "oklch(0.72 0.15 155)", soft: "oklch(0.72 0.15 155 / 0.16)" },
  sembako: { name: "Sembako", base: "oklch(0.72 0.16 60)", soft: "oklch(0.72 0.16 60  / 0.16)" },
  broker: { name: "Broker", base: "oklch(0.7  0.15 230)", soft: "oklch(0.7  0.15 230 / 0.16)" },
  rpa: { name: "Rumah Potong", base: "oklch(0.65 0.20 15)", soft: "oklch(0.65 0.20 15  / 0.16)" },
  admin: { name: "Administrasi", base: "oklch(0.65 0.20 290)", soft: "oklch(0.65 0.20 290 / 0.16)" }
};
const ROLE_LABELS = {
  owner: { label: "Pemilik", bg: "oklch(0.78 0.16 80 / 0.18)", fg: "oklch(0.82 0.16 80)" },
  admin: { label: "Admin", bg: "oklch(0.7  0.18 240 / 0.18)", fg: "oklch(0.78 0.16 240)" },
  superadmin: { label: "Super Admin", bg: "oklch(0.65 0.20 290 / 0.18)", fg: "oklch(0.78 0.16 290)" },
  manajer: { label: "Manajer", bg: "oklch(0.65 0.18 280 / 0.18)", fg: "oklch(0.78 0.16 280)" },
  staff: { label: "Staff Kandang", bg: "oklch(0.65 0.16 200 / 0.18)", fg: "oklch(0.78 0.14 210)" },
  anak_kandang: { label: "Anak Kandang", bg: "oklch(0.62 0.18 155 / 0.18)", fg: "oklch(0.78 0.16 155)" },
  view_only: { label: "Lihat Saja", bg: "oklch(0.6  0.02 250 / 0.2)", fg: "oklch(0.78 0.02 250)" }
};
const PERMISSION_MATRIX = {
  owner: { input: true, edit: true, reports: true, team: true, billing: true },
  admin: { input: true, edit: true, reports: true, team: true, billing: true },
  superadmin: { input: true, edit: true, reports: true, team: true, billing: true },
  manajer: { input: true, edit: true, reports: true, team: true, billing: false },
  staff: { input: true, edit: false, reports: false, team: false, billing: false },
  anak_kandang: { input: true, edit: false, reports: false, team: false, billing: false },
  view_only: { input: false, edit: false, reports: true, team: false, billing: false }
};
const BILLING_ROLES = ["owner", "admin", "superadmin", "manajer"];
const PLAN_INFO = {
  none: { label: "Belum aktif", price: null, users: 1, batches: 1, history: "30 hari" },
  starter: { label: "Starter", price: "Rp 0", users: 1, batches: 2, history: "6 bulan" },
  pro: { label: "Pro", price: "Rp 199.000", users: 3, batches: 10, history: "3 tahun", next: "15 Jun 2026" },
  business: { label: "Business", price: "Rp 499.000", users: 999, batches: 999, history: "Selamanya", next: "15 Jun 2026" }
};
const T = {
  bg: "#0A0E0C",
  surface: "#13191A",
  surfaceAlt: "#0F1416",
  hairline: "rgba(255,255,255,0.06)",
  hairlineStrong: "rgba(255,255,255,0.12)",
  text: "#F2F4F1",
  textDim: "#9BA29B",
  textMute: "#5A615C",
  danger: "oklch(0.7 0.18 25)",
  warn: "oklch(0.78 0.14 70)",
  ok: "oklch(0.72 0.15 155)",
  shadow: "0 1px 2px rgba(0,0,0,0.4), 0 12px 36px rgba(0,0,0,0.18)"
};
const APP_VERSION = "v0.9.4 build 2026.05";
const INDONESIA_PROVINCES = [
  "Aceh",
  "Bali",
  "Banten",
  "Bengkulu",
  "DI Yogyakarta",
  "DKI Jakarta",
  "Gorontalo",
  "Jambi",
  "Jawa Barat",
  "Jawa Tengah",
  "Jawa Timur",
  "Kalimantan Barat",
  "Kalimantan Selatan",
  "Kalimantan Tengah",
  "Kalimantan Timur",
  "Kalimantan Utara",
  "Kepulauan Bangka Belitung",
  "Kepulauan Riau",
  "Lampung",
  "Maluku",
  "Maluku Utara",
  "Nusa Tenggara Barat",
  "Nusa Tenggara Timur",
  "Papua",
  "Papua Barat",
  "Papua Barat Daya",
  "Papua Pegunungan",
  "Papua Selatan",
  "Papua Tengah",
  "Riau",
  "Sulawesi Barat",
  "Sulawesi Selatan",
  "Sulawesi Tengah",
  "Sulawesi Tenggara",
  "Sulawesi Utara",
  "Sumatera Barat",
  "Sumatera Selatan",
  "Sumatera Utara"
];
function getUserRole(profile) {
  if (!profile) return "view_only";
  const raw = (profile.role || profile.app_role || profile.business_role || profile.user_type || "view_only").toLowerCase();
  if (raw === "manager") return "manajer";
  if (raw === "owner_b2b") return "owner";
  return PERMISSION_MATRIX[raw] ? raw : "view_only";
}
function normalizeVertical(v) {
  if (!v) return "peternak";
  if (v.startsWith("peternak_") || v === "peternak") return "peternak";
  if (v === "sembako_broker" || v === "distributor_sembako") return "sembako";
  if (v === "poultry_broker") return "broker";
  if (v.startsWith("rumah_potong")) return "rpa";
  if (v === "admin" || v === "superadmin") return "admin";
  return "peternak";
}
function cardStyle() {
  return {
    background: T.surface,
    border: `1px solid ${T.hairline}`,
    borderRadius: 16,
    padding: 14,
    boxShadow: T.shadow
  };
}
const KEYS = {
  enabled: "ternakos.notifications.enabled",
  billing: "ternakos.notifications.billing",
  business: "ternakos.notifications.business",
  system: "ternakos.notifications.system"
};
function readBool(key, defaultValue = false) {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return defaultValue;
    return v === "true";
  } catch {
    return defaultValue;
  }
}
function writeBool(key, value) {
  try {
    localStorage.setItem(key, value ? "true" : "false");
  } catch {
  }
}
function getPermission() {
  if (typeof window === "undefined") return "default";
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}
function useBrowserNotifications() {
  const supported = typeof window !== "undefined" && "Notification" in window;
  const [permission, setPermission] = useState(getPermission);
  const [enabled, setEnabledState] = useState(false);
  const [categories, setCategoriesState] = useState({
    billing: true,
    business: true,
    system: true
  });
  useEffect(() => {
    const perm = getPermission();
    setPermission(perm);
    const isGranted = perm === "granted";
    const savedEnabled = readBool(KEYS.enabled, false);
    setEnabledState(isGranted && savedEnabled);
    setCategoriesState({
      billing: readBool(KEYS.billing, true),
      business: readBool(KEYS.business, true),
      system: readBool(KEYS.system, true)
    });
  }, []);
  const requestEnable = useCallback(async () => {
    if (!supported) return;
    const perm = getPermission();
    if (perm === "denied") {
      setPermission("denied");
      setEnabledState(false);
      writeBool(KEYS.enabled, false);
      return;
    }
    if (perm === "granted") {
      setEnabledState(true);
      writeBool(KEYS.enabled, true);
      setPermission("granted");
      return;
    }
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") {
        setEnabledState(true);
        writeBool(KEYS.enabled, true);
      } else {
        setEnabledState(false);
        writeBool(KEYS.enabled, false);
      }
    } catch {
      setEnabledState(false);
      writeBool(KEYS.enabled, false);
    }
  }, [supported]);
  const setEnabled = useCallback((value) => {
    if (!supported) return;
    if (getPermission() !== "granted") return;
    setEnabledState(!!value);
    writeBool(KEYS.enabled, !!value);
  }, [supported]);
  const setCategory = useCallback((key, value) => {
    if (!KEYS[key]) return;
    setCategoriesState((prev) => ({ ...prev, [key]: !!value }));
    writeBool(KEYS[key], !!value);
  }, []);
  return {
    supported,
    permission,
    // 'default' | 'granted' | 'denied' | 'unsupported'
    enabled,
    // true only when granted + saved enabled
    categories,
    // { billing, business, system }
    requestEnable,
    // async — prompts if default, enables if granted, shows status if denied
    setEnabled,
    // toggle off when already granted
    setCategory
    // save individual category
  };
}
function Section({ title, icon, iconColor, rightAction, delay = 0, children }) {
  return /* @__PURE__ */ jsxs("div", { style: { marginBottom: 18, animation: `fadeInUp 300ms ease ${delay}s both` }, children: [
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 2px 8px" }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
        /* @__PURE__ */ jsx("span", { style: { width: 22, height: 22, borderRadius: 7, background: iconColor + "22", color: iconColor, display: "flex", alignItems: "center", justifyContent: "center" }, children: icon }),
        /* @__PURE__ */ jsx("span", { style: { fontSize: 12, fontWeight: 700, color: T.text, letterSpacing: 0.4, textTransform: "uppercase" }, children: title })
      ] }),
      rightAction
    ] }),
    children
  ] });
}
function SectionLabel({ label }) {
  return /* @__PURE__ */ jsx("div", { style: { fontSize: 11, fontWeight: 700, color: T.textMute, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8, paddingLeft: 2 }, children: label });
}
function InfoRow({ label, value, children, noBorder }) {
  return /* @__PURE__ */ jsxs("div", { style: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 4px",
    borderBottom: noBorder ? "none" : `1px solid ${T.hairline}`,
    gap: 12
  }, children: [
    /* @__PURE__ */ jsx("span", { style: { fontSize: 12, color: T.textDim, fontWeight: 500, flexShrink: 0 }, children: label }),
    children || /* @__PURE__ */ jsx("span", { style: { fontSize: 13, color: T.text, fontWeight: 600, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: value })
  ] });
}
function ProfileHero({ accent, roleBadge, displayName, email, initials, tenantName }) {
  const { t } = useLanguage();
  return /* @__PURE__ */ jsxs("div", { style: {
    position: "relative",
    overflow: "hidden",
    padding: "64px 20px 28px",
    background: `linear-gradient(180deg, ${accent.soft} 0%, transparent 100%), linear-gradient(135deg, ${accent.base}1a 0%, transparent 60%)`,
    borderBottom: `1px solid ${T.hairline}`,
    animation: "fadeIn 400ms ease"
  }, children: [
    /* @__PURE__ */ jsx("div", { style: {
      position: "absolute",
      top: -60,
      right: -40,
      width: 200,
      height: 200,
      borderRadius: 999,
      background: accent.base,
      opacity: 0.18,
      filter: "blur(60px)",
      pointerEvents: "none"
    } }),
    /* @__PURE__ */ jsxs("div", { style: { position: "relative", display: "flex", alignItems: "center", gap: 16 }, children: [
      /* @__PURE__ */ jsxs("div", { style: {
        width: 64,
        height: 64,
        borderRadius: 18,
        flexShrink: 0,
        position: "relative",
        background: `linear-gradient(135deg, ${accent.base}, oklch(0.65 0.18 280))`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: 22,
        fontWeight: 700,
        letterSpacing: -0.5,
        boxShadow: `0 14px 36px ${accent.base}66`
      }, children: [
        initials,
        /* @__PURE__ */ jsx("span", { style: {
          position: "absolute",
          bottom: -3,
          right: -3,
          width: 18,
          height: 18,
          borderRadius: 999,
          background: T.ok,
          color: "#fff",
          border: `2.5px solid ${T.bg}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }, children: /* @__PURE__ */ jsx(Check, { size: 9, strokeWidth: 3 }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: 18, fontWeight: 700, color: T.text, letterSpacing: -0.3, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: displayName }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: 12, color: T.textDim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 8 }, children: email }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" }, children: [
          /* @__PURE__ */ jsx("span", { style: { padding: "3px 9px", borderRadius: 6, background: roleBadge.bg, color: roleBadge.fg, fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase" }, children: roleBadge.label }),
          /* @__PURE__ */ jsxs("span", { style: { padding: "3px 9px", borderRadius: 6, background: accent.soft, color: accent.base, fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: 4 }, children: [
            /* @__PURE__ */ jsx("span", { style: { width: 5, height: 5, borderRadius: 999, background: accent.base } }),
            accent.name
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: {
      marginTop: 16,
      padding: "10px 14px",
      background: T.surface + "cc",
      backdropFilter: "blur(12px)",
      border: `1px solid ${T.hairline}`,
      borderRadius: 12,
      display: "flex",
      alignItems: "center",
      gap: 10
    }, children: [
      /* @__PURE__ */ jsx("span", { style: { width: 26, height: 26, borderRadius: 8, background: accent.base + "22", color: accent.base, display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ jsx(Building2, { size: 13 }) }),
      /* @__PURE__ */ jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: 10, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase", color: T.textMute }, children: t("hero_active_biz") }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 600, color: T.text, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: tenantName })
      ] }),
      /* @__PURE__ */ jsxs("span", { style: { padding: "3px 8px", borderRadius: 6, background: T.ok + "22", color: T.ok, fontSize: 10, fontWeight: 700, letterSpacing: 0.3, display: "inline-flex", alignItems: "center", gap: 4 }, children: [
        /* @__PURE__ */ jsx("span", { style: { width: 6, height: 6, borderRadius: 999, background: T.ok, animation: "pulse2 2s infinite" } }),
        t("hero_active_status")
      ] })
    ] })
  ] });
}
function QuickActions({ accent, plan, showBilling, isMultiTenant, onSwitch, onUpgrade, onManage, onHelp, onEditProfile }) {
  const { t } = useLanguage();
  const planLabel = plan === "none" ? t("qa_plan_start") : plan === "starter" || plan === "basic" ? t("qa_plan_upgrade") : t("qa_plan_view");
  const planSub = plan === "none" ? t("qa_plan_start_sub") : plan === "starter" || plan === "basic" ? t("qa_plan_upgrade_sub") : t("qa_plan_view_sub");
  const planFg = plan === "none" ? "oklch(0.78 0.16 80)" : plan === "starter" || plan === "basic" ? "oklch(0.65 0.20 290)" : T.textDim;
  const isFeaturedPlan = plan === "none" || plan === "starter" || plan === "basic";
  const items = [
    { icon: /* @__PURE__ */ jsx(Edit3, { size: 17 }), label: t("qa_edit_profile"), sub: t("qa_edit_profile_sub"), fg: accent.base, featured: false, disabled: false, onClick: onEditProfile },
    isMultiTenant && { icon: /* @__PURE__ */ jsx(Shuffle, { size: 17 }), label: t("qa_switch_biz"), sub: t("qa_switch_biz_sub"), fg: "oklch(0.7 0.15 230)", featured: false, disabled: false, onClick: onSwitch },
    showBilling && { icon: /* @__PURE__ */ jsx(Sparkles, { size: 17 }), label: planLabel, sub: planSub, fg: planFg, featured: isFeaturedPlan, disabled: false, onClick: onUpgrade },
    { icon: /* @__PURE__ */ jsx(HelpCircle, { size: 17 }), label: t("qa_help"), sub: t("qa_help_sub"), fg: T.textDim, featured: false, disabled: false, onClick: onHelp },
    showBilling && { icon: /* @__PURE__ */ jsx(CreditCard, { size: 17 }), label: t("qa_manage_plan"), sub: t("qa_manage_plan_sub"), fg: "oklch(0.7 0.15 230)", featured: false, disabled: false, onClick: onManage }
  ].filter(Boolean);
  return /* @__PURE__ */ jsxs("div", { style: { marginTop: 16, marginBottom: 18, animation: "fadeInUp 300ms ease 0.05s both" }, children: [
    /* @__PURE__ */ jsx(SectionLabel, { label: t("qa_section") }),
    /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }, children: items.map((it) => /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: it.disabled ? void 0 : it.onClick,
        disabled: it.disabled,
        style: {
          padding: 14,
          textAlign: "left",
          cursor: it.disabled ? "default" : "pointer",
          background: it.featured ? `linear-gradient(135deg, ${it.fg}22, ${it.fg}05)` : T.surface,
          border: `1px solid ${it.featured ? it.fg + "40" : T.hairline}`,
          borderRadius: 14,
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          opacity: it.disabled ? 0.55 : 1
        },
        children: [
          it.featured && /* @__PURE__ */ jsx("span", { style: {
            position: "absolute",
            top: 8,
            right: 8,
            width: 6,
            height: 6,
            borderRadius: 999,
            background: it.fg,
            boxShadow: `0 0 8px ${it.fg}`,
            animation: "pulse2 1.8s ease-in-out infinite"
          } }),
          /* @__PURE__ */ jsx("span", { style: { width: 36, height: 36, borderRadius: 11, background: it.fg + "22", color: it.fg, display: "flex", alignItems: "center", justifyContent: "center" }, children: it.icon }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 600, color: T.text, letterSpacing: -0.1 }, children: it.label }),
            /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: T.textDim, marginTop: 1 }, children: it.sub })
          ] })
        ]
      },
      it.label
    )) })
  ] });
}
function getEditBizPath(rawVertical, basePath) {
  const v = rawVertical || "";
  const bp = basePath || "";
  if (!bp) return null;
  if (v.startsWith("peternak_") || v === "peternak") return bp + "/tim";
  if (v === "poultry_broker") return bp + "/tim";
  if (v === "broker_telur" || v === "egg_broker") return bp + "/tim";
  if (v === "distributor_sembako" || v === "sembako_broker") return bp + "/karyawan";
  if (v === "admin" || v === "superadmin") return "/admin/settings";
  return null;
}
function ActiveBusinessCard({ accent, roleBadge, tenantName, tenantCity, tenantProvince, canEditBisnis, onEditBiz }) {
  const { t } = useLanguage();
  return /* @__PURE__ */ jsx(Section, { title: t("biz_section"), icon: /* @__PURE__ */ jsx(Building2, { size: 13 }), iconColor: accent.base, delay: 0.1, children: /* @__PURE__ */ jsxs("div", { style: cardStyle(), children: [
    /* @__PURE__ */ jsx(InfoRow, { label: t("biz_name"), value: tenantName }),
    /* @__PURE__ */ jsx(InfoRow, { label: t("biz_model"), children: /* @__PURE__ */ jsx("span", { style: { padding: "2px 8px", borderRadius: 6, background: accent.soft, color: accent.base, fontSize: 10, fontWeight: 700, letterSpacing: 0.3, textTransform: "uppercase" }, children: accent.name }) }),
    /* @__PURE__ */ jsx(InfoRow, { label: t("biz_location"), value: tenantCity }),
    /* @__PURE__ */ jsx(InfoRow, { label: t("biz_province"), children: tenantProvince ? /* @__PURE__ */ jsx("span", { style: { fontSize: 13, color: T.text, fontWeight: 500 }, children: tenantProvince }) : /* @__PURE__ */ jsx(
      "span",
      {
        onClick: canEditBisnis ? onEditBiz : void 0,
        style: {
          fontSize: 11,
          fontWeight: 700,
          color: T.warn,
          background: "oklch(0.78 0.14 70 / 0.12)",
          border: "1px solid oklch(0.78 0.14 70 / 0.3)",
          borderRadius: 6,
          padding: "2px 8px",
          letterSpacing: 0.3,
          textTransform: "uppercase",
          cursor: canEditBisnis ? "pointer" : "default"
        },
        children: canEditBisnis ? t("biz_province_missing_owner") : t("biz_province_missing")
      }
    ) }),
    /* @__PURE__ */ jsx(InfoRow, { label: t("biz_role"), noBorder: true, children: /* @__PURE__ */ jsx("span", { style: { padding: "2px 8px", borderRadius: 6, background: roleBadge.bg, color: roleBadge.fg, fontSize: 10, fontWeight: 700, letterSpacing: 0.3, textTransform: "uppercase" }, children: roleBadge.label }) }),
    onEditBiz && /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: onEditBiz,
        style: {
          width: "100%",
          marginTop: 12,
          padding: "11px",
          background: accent.soft,
          border: `1px solid ${accent.base}44`,
          color: accent.base,
          borderRadius: 12,
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: -0.1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6
        },
        children: [
          /* @__PURE__ */ jsx(Edit3, { size: 14, strokeWidth: 2.5 }),
          " ",
          t("biz_edit_btn")
        ]
      }
    )
  ] }) });
}
function getAccessLabelsByVertical(rawVertical, t) {
  const v = rawVertical || "";
  if (v.startsWith("peternak_") || v === "peternak") {
    return [
      { key: "input", label: t("access_peternak_input_label"), desc: t("access_peternak_input_desc") },
      { key: "edit", label: t("access_peternak_edit_label"), desc: t("access_peternak_edit_desc") },
      { key: "reports", label: t("access_peternak_reports_label"), desc: t("access_peternak_reports_desc") },
      { key: "team", label: t("access_peternak_team_label"), desc: t("access_peternak_team_desc") },
      { key: "billing", label: t("access_peternak_billing_label"), desc: t("access_peternak_billing_desc") }
    ];
  }
  if (v === "sembako_broker" || v === "distributor_sembako") {
    return [
      { key: "input", label: t("access_sembako_input_label"), desc: t("access_sembako_input_desc") },
      { key: "edit", label: t("access_sembako_edit_label"), desc: t("access_sembako_edit_desc") },
      { key: "reports", label: t("access_sembako_reports_label"), desc: t("access_sembako_reports_desc") },
      { key: "team", label: t("access_sembako_team_label"), desc: t("access_sembako_team_desc") },
      { key: "billing", label: t("access_sembako_billing_label"), desc: t("access_sembako_billing_desc") }
    ];
  }
  if (v === "poultry_broker") {
    return [
      { key: "input", label: t("access_broker_input_label"), desc: t("access_broker_input_desc") },
      { key: "edit", label: t("access_broker_edit_label"), desc: t("access_broker_edit_desc") },
      { key: "reports", label: t("access_broker_reports_label"), desc: t("access_broker_reports_desc") },
      { key: "team", label: t("access_broker_team_label"), desc: t("access_broker_team_desc") },
      { key: "billing", label: t("access_broker_billing_label"), desc: t("access_broker_billing_desc") }
    ];
  }
  if (v === "broker_telur" || v === "egg_broker") {
    return [
      { key: "input", label: t("access_egg_broker_input_label"), desc: t("access_egg_broker_input_desc") },
      { key: "edit", label: t("access_egg_broker_edit_label"), desc: t("access_egg_broker_edit_desc") },
      { key: "reports", label: t("access_egg_broker_reports_label"), desc: t("access_egg_broker_reports_desc") },
      { key: "team", label: t("access_egg_broker_team_label"), desc: t("access_egg_broker_team_desc") },
      { key: "billing", label: t("access_egg_broker_billing_label"), desc: t("access_egg_broker_billing_desc") }
    ];
  }
  if (v.startsWith("rumah_potong") || v === "rpa") {
    return [
      { key: "input", label: t("access_rpa_input_label"), desc: t("access_rpa_input_desc") },
      { key: "edit", label: t("access_rpa_edit_label"), desc: t("access_rpa_edit_desc") },
      { key: "reports", label: t("access_rpa_reports_label"), desc: t("access_rpa_reports_desc") },
      { key: "team", label: t("access_rpa_team_label"), desc: t("access_rpa_team_desc") },
      { key: "billing", label: t("access_rpa_billing_label"), desc: t("access_rpa_billing_desc") }
    ];
  }
  if (v === "admin" || v === "superadmin") {
    return [
      { key: "input", label: t("access_admin_input_label"), desc: t("access_admin_input_desc") },
      { key: "edit", label: t("access_admin_edit_label"), desc: t("access_admin_edit_desc") },
      { key: "reports", label: t("access_admin_reports_label"), desc: t("access_admin_reports_desc") },
      { key: "team", label: t("access_admin_team_label"), desc: t("access_admin_team_desc") },
      { key: "billing", label: t("access_admin_billing_label"), desc: t("access_admin_billing_desc") }
    ];
  }
  return [
    { key: "input", label: t("access_default_input_label"), desc: t("access_default_input_desc") },
    { key: "edit", label: t("access_default_edit_label"), desc: t("access_default_edit_desc") },
    { key: "reports", label: t("access_default_reports_label"), desc: t("access_default_reports_desc") },
    { key: "team", label: t("access_default_team_label"), desc: t("access_default_team_desc") },
    { key: "billing", label: t("access_default_billing_label"), desc: t("access_default_billing_desc") }
  ];
}
function AccessSummaryCard({ role, accent, rawVertical }) {
  const { t } = useLanguage();
  const perms = PERMISSION_MATRIX[role] || PERMISSION_MATRIX.view_only;
  const rows = getAccessLabelsByVertical(rawVertical, t);
  const grantedCount = rows.filter((r) => perms[r.key]).length;
  const pct = Math.round(grantedCount / rows.length * 100);
  return /* @__PURE__ */ jsx(
    Section,
    {
      title: t("access_section"),
      icon: /* @__PURE__ */ jsx(Shield, { size: 13 }),
      iconColor: "oklch(0.78 0.16 80)",
      rightAction: /* @__PURE__ */ jsxs("span", { style: { fontSize: 11, fontWeight: 700, color: T.textDim }, children: [
        grantedCount,
        "/",
        rows.length,
        " ",
        t("access_perms_label")
      ] }),
      delay: 0.12,
      children: /* @__PURE__ */ jsxs("div", { style: cardStyle(), children: [
        /* @__PURE__ */ jsxs("div", { style: { padding: "10px 12px", marginBottom: 10, background: T.surfaceAlt, borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }, children: [
          /* @__PURE__ */ jsx("div", { style: { flex: 1, height: 6, borderRadius: 999, background: T.hairline, overflow: "hidden" }, children: /* @__PURE__ */ jsx("div", { style: { height: "100%", width: pct + "%", background: accent.base, borderRadius: 999, transition: "width 500ms" } }) }),
          /* @__PURE__ */ jsxs("span", { style: { fontSize: 13, fontWeight: 700, color: T.text }, children: [
            pct,
            "%"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: rows.map((r) => {
          const granted = perms[r.key];
          return /* @__PURE__ */ jsxs("div", { style: {
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "8px 10px",
            borderRadius: 10,
            background: granted ? accent.soft + "40" : "transparent",
            opacity: granted ? 1 : 0.65
          }, children: [
            /* @__PURE__ */ jsx("span", { style: {
              width: 24,
              height: 24,
              borderRadius: 7,
              flexShrink: 0,
              background: granted ? accent.base : T.surfaceAlt,
              color: granted ? "#0A0E0C" : T.textMute,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }, children: granted ? /* @__PURE__ */ jsx(Check, { size: 13, strokeWidth: 3 }) : /* @__PURE__ */ jsx(X, { size: 12, strokeWidth: 2.5 }) }),
            /* @__PURE__ */ jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
              /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 600, color: T.text, letterSpacing: -0.1 }, children: r.label }),
              /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: T.textDim, marginTop: 1 }, children: r.desc })
            ] })
          ] }, r.key);
        }) })
      ] })
    }
  );
}
function BillingCard({ accent, plan, onUpgrade }) {
  const { t, tPlan } = useLanguage();
  const info = PLAN_INFO[plan] || PLAN_INFO.none;
  const planLabel = tPlan(plan);
  const planHistory = t(`plan_${plan}_history`, info.history);
  const canUpgrade = plan === "none" || plan === "starter" || plan === "basic";
  const upgradeLabel = plan === "none" ? t("billing_start_btn") : t("billing_upgrade_btn");
  const accentColor = plan === "none" ? "oklch(0.78 0.16 80)" : plan === "starter" || plan === "basic" ? "oklch(0.65 0.20 290)" : accent.base;
  if (plan === "none") {
    return /* @__PURE__ */ jsx(Section, { title: t("billing_section"), icon: /* @__PURE__ */ jsx(Package, { size: 13 }), iconColor: "oklch(0.78 0.16 80)", delay: 0.15, children: /* @__PURE__ */ jsxs("div", { style: {
      padding: 18,
      borderRadius: 16,
      position: "relative",
      overflow: "hidden",
      background: "linear-gradient(135deg, oklch(0.78 0.16 80 / 0.16), oklch(0.78 0.16 80 / 0.04))",
      border: "1px solid oklch(0.78 0.16 80 / 0.38)"
    }, children: [
      /* @__PURE__ */ jsx("div", { style: { position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: 999, background: "oklch(0.78 0.16 80)", opacity: 0.15, filter: "blur(40px)", pointerEvents: "none" } }),
      /* @__PURE__ */ jsxs("div", { style: { position: "relative", display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }, children: [
        /* @__PURE__ */ jsx("div", { style: { width: 44, height: 44, borderRadius: 12, background: "oklch(0.78 0.16 80)", color: "#0A0E0C", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 28px oklch(0.78 0.16 80 / 0.55)" }, children: /* @__PURE__ */ jsx(Sparkles, { size: 20, strokeWidth: 2.5 }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { style: { fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: T.textDim }, children: t("billing_no_sub") }),
          /* @__PURE__ */ jsx("div", { style: { fontSize: 17, fontWeight: 700, color: T.text, letterSpacing: -0.2, marginTop: 2 }, children: t("billing_no_sub_title") })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { style: { fontSize: 13, color: T.textDim, lineHeight: 1.5, marginBottom: 14, position: "relative" }, children: t("billing_no_sub_desc") }),
      /* @__PURE__ */ jsxs("button", { onClick: onUpgrade, style: {
        width: "100%",
        padding: "13px",
        borderRadius: 12,
        border: "none",
        cursor: "pointer",
        background: "oklch(0.78 0.16 80)",
        color: "#0A0E0C",
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: -0.1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        boxShadow: "0 8px 22px oklch(0.78 0.16 80 / 0.45)"
      }, children: [
        /* @__PURE__ */ jsx(Sparkles, { size: 16, strokeWidth: 2.5 }),
        " ",
        t("billing_start_btn")
      ] })
    ] }) });
  }
  return /* @__PURE__ */ jsx(Section, { title: t("billing_section"), icon: /* @__PURE__ */ jsx(Package, { size: 13 }), iconColor: accentColor, delay: 0.15, children: /* @__PURE__ */ jsxs("div", { style: {
    ...cardStyle(),
    background: `linear-gradient(135deg, ${accentColor}14, ${accentColor}04)`,
    border: `1px solid ${accentColor}30`
  }, children: [
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }, children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: T.textDim }, children: t("billing_active") }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }, children: [
          /* @__PURE__ */ jsx("span", { style: { fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: -0.4 }, children: planLabel }),
          info.price && /* @__PURE__ */ jsxs("span", { style: { fontSize: 11, color: T.textDim }, children: [
            "· ",
            info.price,
            t("billing_per_month", "/bulan")
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("span", { style: { padding: "4px 10px", borderRadius: 6, background: T.ok + "22", color: T.ok, fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase" }, children: t("billing_status_active") })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }, children: [
      /* @__PURE__ */ jsx("div", { style: { fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", color: T.textMute, marginBottom: 2 }, children: t("billing_usage_title") }),
      /* @__PURE__ */ jsx(LimitRow, { label: t("billing_usage_users"), used: plan === "starter" ? 1 : 3, cap: info.users === 999 ? null : info.users, subtitle: info.users === 999 ? "Unlimited" : null, accent: accentColor }),
      /* @__PURE__ */ jsx(LimitRow, { label: t("billing_usage_batch"), used: plan === "starter" ? 2 : 3, cap: info.batches === 999 ? null : info.batches, subtitle: info.batches === 999 ? "Unlimited" : null, accent: accentColor }),
      /* @__PURE__ */ jsx(LimitRow, { label: t("billing_usage_history"), used: null, cap: null, subtitle: planHistory, accent: accentColor })
    ] }),
    info.next && /* @__PURE__ */ jsxs("div", { style: { fontSize: 11, color: T.textDim, marginBottom: 12 }, children: [
      t("billing_next_payment"),
      " ",
      /* @__PURE__ */ jsx("span", { style: { color: T.text, fontWeight: 600 }, children: info.next })
    ] }),
    canUpgrade && /* @__PURE__ */ jsxs("button", { onClick: onUpgrade, style: {
      width: "100%",
      padding: "11px",
      border: "none",
      borderRadius: 11,
      cursor: "pointer",
      background: accentColor,
      color: "#0A0E0C",
      fontSize: 13,
      fontWeight: 700,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      boxShadow: `0 6px 18px ${accentColor}55`
    }, children: [
      /* @__PURE__ */ jsx(ArrowUpRight, { size: 14, strokeWidth: 2.5 }),
      " ",
      upgradeLabel
    ] })
  ] }) });
}
function BillingHandledByOwnerCard() {
  const { t } = useLanguage();
  return /* @__PURE__ */ jsx(Section, { title: t("billing_section"), icon: /* @__PURE__ */ jsx(Package, { size: 13 }), iconColor: T.textMute, delay: 0.15, children: /* @__PURE__ */ jsxs("div", { style: { ...cardStyle(), display: "flex", alignItems: "center", gap: 12 }, children: [
    /* @__PURE__ */ jsx("span", { style: { width: 36, height: 36, borderRadius: 10, background: T.surfaceAlt, color: T.textDim, display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ jsx(Info, { size: 16 }) }),
    /* @__PURE__ */ jsxs("div", { style: { flex: 1, fontSize: 13, color: T.textDim, lineHeight: 1.5 }, children: [
      t("billing_managed_by"),
      " ",
      /* @__PURE__ */ jsx("span", { style: { color: T.text, fontWeight: 600 }, children: t("billing_managed_owner") }),
      "."
    ] })
  ] }) });
}
function LimitRow({ label, used, cap, subtitle, accent: accentColor }) {
  const pct = used != null && cap ? Math.min(100, used / cap * 100) : 100;
  const isMaxed = used === cap && cap > 0;
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }, children: [
      /* @__PURE__ */ jsx("span", { style: { color: T.textDim }, children: label }),
      /* @__PURE__ */ jsx("span", { style: { color: isMaxed ? T.warn : T.text, fontWeight: 600 }, children: used != null ? used + "/" + cap : subtitle })
    ] }),
    used != null && /* @__PURE__ */ jsx("div", { style: { height: 4, background: T.hairline, borderRadius: 999, overflow: "hidden" }, children: /* @__PURE__ */ jsx("div", { style: { height: "100%", width: pct + "%", background: isMaxed ? T.warn : accentColor, borderRadius: 999 } }) })
  ] });
}
function getVerticalShortcuts(rawVertical, basePath, t) {
  const bp = basePath || "";
  if (!rawVertical || rawVertical.startsWith("peternak_") || rawVertical === "peternak") {
    return [
      { icon: "clipboard", label: t("shortcut_daily_task"), path: bp + "/daily_task" },
      { icon: "package", label: t("shortcut_pakan"), path: bp + "/pakan" },
      { icon: "barchart", label: t("shortcut_laporan"), path: bp + "/laporan" },
      { icon: "users", label: t("shortcut_tim"), path: bp + "/tim" }
    ];
  }
  if (rawVertical === "poultry_broker") {
    return [
      { icon: "shopping", label: t("shortcut_transaksi"), path: bp + "/transaksi" },
      { icon: "truck", label: t("shortcut_pengiriman"), path: bp + "/pengiriman" },
      { icon: "barchart", label: t("shortcut_cash_flow"), path: bp + "/cash-flow" },
      { icon: "users", label: t("shortcut_tim"), path: bp + "/tim" }
    ];
  }
  if (rawVertical === "broker_telur" || rawVertical === "egg_broker") {
    return [
      { icon: "shopping", label: t("shortcut_pos"), path: bp + "/pos" },
      { icon: "package", label: t("shortcut_inventori"), path: bp + "/inventori" },
      { icon: "barchart", label: t("shortcut_transaksi"), path: bp + "/transaksi" },
      { icon: "users", label: t("shortcut_tim"), path: bp + "/tim" }
    ];
  }
  if (rawVertical === "sembako_broker" || rawVertical === "distributor_sembako") {
    return [
      { icon: "shopping", label: t("shortcut_penjualan"), path: bp + "/penjualan" },
      { icon: "warehouse", label: t("shortcut_gudang"), path: bp + "/gudang" },
      { icon: "barchart", label: t("shortcut_laporan"), path: bp + "/laporan" },
      { icon: "users", label: t("shortcut_tim"), path: bp + "/tim" }
    ];
  }
  if ((rawVertical == null ? void 0 : rawVertical.startsWith("rumah_potong")) || rawVertical === "rpa") {
    return [
      { icon: "clipboard", label: t("shortcut_order"), path: bp + "/order" },
      { icon: "receipt", label: t("shortcut_hutang"), path: bp + "/hutang" },
      { icon: "truck", label: t("shortcut_distribusi"), path: bp + "/distribusi" },
      { icon: "barchart", label: t("shortcut_laporan"), path: bp + "/laporan" }
    ];
  }
  if (rawVertical === "admin" || rawVertical === "superadmin") {
    return [
      { icon: "users", label: t("shortcut_users"), path: "/admin/users" },
      { icon: "package", label: t("shortcut_langganan"), path: "/admin/subscriptions" },
      { icon: "barchart", label: t("shortcut_aktivitas"), path: "/admin/activity" },
      { icon: "settings", label: t("shortcut_pengaturan"), path: "/admin/settings" }
    ];
  }
  return [];
}
const SHORTCUT_ICONS = {
  clipboard: /* @__PURE__ */ jsx(ClipboardList, { size: 16 }),
  package: /* @__PURE__ */ jsx(Package, { size: 16 }),
  barchart: /* @__PURE__ */ jsx(BarChart2, { size: 16 }),
  users: /* @__PURE__ */ jsx(Users, { size: 16 }),
  shopping: /* @__PURE__ */ jsx(ShoppingCart, { size: 16 }),
  truck: /* @__PURE__ */ jsx(Truck, { size: 16 }),
  receipt: /* @__PURE__ */ jsx(Receipt, { size: 16 }),
  warehouse: /* @__PURE__ */ jsx(Warehouse, { size: 16 }),
  settings: /* @__PURE__ */ jsx(Settings, { size: 16 })
};
function VerticalShortcutsCard({ rawVertical, basePath, accent, navigate }) {
  const { t } = useLanguage();
  const shortcuts = getVerticalShortcuts(rawVertical, basePath, t);
  if (!shortcuts.length) return null;
  return /* @__PURE__ */ jsx(Section, { title: t("shortcuts_section"), icon: /* @__PURE__ */ jsx(LayoutGrid, { size: 13 }), iconColor: accent.base, delay: 0.17, children: /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }, children: shortcuts.map((s2) => /* @__PURE__ */ jsxs(
    "button",
    {
      onClick: () => navigate(s2.path),
      style: {
        padding: "12px 4px 10px",
        background: T.surface,
        border: `1px solid ${T.hairline}`,
        borderRadius: 12,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6
      },
      children: [
        /* @__PURE__ */ jsx("span", { style: {
          width: 32,
          height: 32,
          borderRadius: 10,
          background: accent.soft,
          color: accent.base,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }, children: SHORTCUT_ICONS[s2.icon] }),
        /* @__PURE__ */ jsx("span", { style: {
          fontSize: 10,
          fontWeight: 600,
          color: T.textDim,
          textAlign: "center",
          letterSpacing: -0.1,
          lineHeight: 1.2
        }, children: s2.label })
      ]
    },
    s2.label
  )) }) });
}
function PrefRow({ icon, label, desc, open, onToggle, noBorder, children }) {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: onToggle,
        style: {
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 4px",
          borderBottom: open || noBorder ? "none" : `1px solid ${T.hairline}`,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          borderRadius: 0
        },
        children: [
          /* @__PURE__ */ jsx("span", { style: {
            width: 30,
            height: 30,
            borderRadius: 9,
            background: T.surfaceAlt,
            color: T.textDim,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }, children: icon }),
          /* @__PURE__ */ jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
            /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 600, color: T.text, letterSpacing: -0.1 }, children: label }),
            desc && /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: T.textDim, marginTop: 1 }, children: desc })
          ] }),
          /* @__PURE__ */ jsx(
            ChevronRight,
            {
              size: 14,
              color: T.textMute,
              style: { transform: open ? "rotate(90deg)" : "none", transition: "transform 150ms", flexShrink: 0 }
            }
          )
        ]
      }
    ),
    open && /* @__PURE__ */ jsx("div", { style: {
      padding: "12px 14px 16px",
      borderBottom: noBorder ? "none" : `1px solid ${T.hairline}`,
      background: T.surfaceAlt,
      borderRadius: 10,
      marginBottom: 4
    }, children })
  ] });
}
function Toggle({ on, onChange, disabled = false }) {
  return /* @__PURE__ */ jsx(
    "button",
    {
      onClick: () => !disabled && onChange(!on),
      style: {
        width: 40,
        height: 22,
        borderRadius: 11,
        border: "none",
        padding: 2,
        background: on ? "oklch(0.72 0.15 155)" : T.hairlineStrong,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "background 200ms",
        flexShrink: 0,
        position: "relative",
        display: "flex",
        alignItems: "center"
      },
      children: /* @__PURE__ */ jsx("span", { style: {
        width: 18,
        height: 18,
        borderRadius: "50%",
        background: "#fff",
        boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
        transform: on ? "translateX(18px)" : "translateX(0)",
        transition: "transform 200ms",
        display: "block"
      } })
    }
  );
}
function PreferencesCard() {
  const { accentColor, setTheme } = useTheme();
  const [themeOpen, setThemeOpen] = useState(false);
  const activePreset = THEME_PRESETS.find((p) => p.hex === accentColor);
  const { lang, setLang, t, languages } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);
  const activeLang = languages.find((l) => l.code === lang) || languages[0];
  const notif = useBrowserNotifications();
  const [notifOpen, setNotifOpen] = useState(false);
  const permStatusColor = notif.permission === "granted" ? "oklch(0.72 0.15 155)" : notif.permission === "denied" ? T.warn : T.textDim;
  const permStatusLabel = !notif.supported ? t("notif_unsupported") : notif.permission === "granted" ? t("notif_status_granted") : notif.permission === "denied" ? t("notif_status_denied") : t("notif_status_default");
  const handleNotifMainToggle = () => {
    if (!notif.supported) return;
    if (notif.permission === "denied") return;
    if (notif.enabled) {
      notif.setEnabled(false);
    } else {
      notif.requestEnable();
    }
  };
  return /* @__PURE__ */ jsx(Section, { title: t("pref_section"), icon: /* @__PURE__ */ jsx(Settings, { size: 13 }), iconColor: "oklch(0.72 0.13 200)", delay: 0.18, children: /* @__PURE__ */ jsxs("div", { style: cardStyle(), children: [
    /* @__PURE__ */ jsxs(
      PrefRow,
      {
        icon: /* @__PURE__ */ jsx(Sun, { size: 14 }),
        label: t("theme_label"),
        desc: `${t("theme_active_prefix")} ${activePreset ? activePreset.name : "Default"} · ${t("theme_mode_label")}`,
        open: themeOpen,
        onToggle: () => setThemeOpen((o) => !o),
        children: [
          /* @__PURE__ */ jsx("div", { style: { fontSize: 11, fontWeight: 600, color: T.textMute, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 10 }, children: t("theme_panel_heading") }),
          /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: THEME_PRESETS.map((preset) => {
            const isActive = accentColor === preset.hex;
            return /* @__PURE__ */ jsx(
              "button",
              {
                title: preset.label,
                onClick: () => setTheme(isActive ? null : preset.hex),
                style: {
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: preset.hex,
                  border: isActive ? `3px solid ${preset.hex}` : "3px solid transparent",
                  outline: isActive ? "2px solid rgba(255,255,255,0.5)" : "2px solid transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "transform 0.15s, outline 0.15s",
                  transform: isActive ? "scale(1.15)" : "scale(1)",
                  flexShrink: 0
                },
                children: isActive && /* @__PURE__ */ jsx(Check, { size: 14, color: "white", strokeWidth: 3 })
              },
              preset.hex
            );
          }) }),
          accentColor && /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setTheme(null),
              style: { marginTop: 10, fontSize: 11, color: T.textDim, background: "none", border: "none", cursor: "pointer", padding: 0 },
              children: t("theme_reset")
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsxs(
      PrefRow,
      {
        icon: /* @__PURE__ */ jsx(Globe, { size: 14 }),
        label: t("lang_label"),
        desc: `${activeLang.flag} ${activeLang.native}`,
        open: langOpen,
        onToggle: () => setLangOpen((o) => !o),
        children: [
          /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: languages.map((l) => {
            const isActive = lang === l.code;
            return /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => {
                  setLang(l.code);
                  setLangOpen(false);
                },
                style: {
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: isActive ? "oklch(0.72 0.15 155 / 0.15)" : "transparent",
                  border: `1px solid ${isActive ? "oklch(0.72 0.15 155 / 0.4)" : T.hairline}`,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 150ms, border-color 150ms"
                },
                children: [
                  /* @__PURE__ */ jsx("span", { style: { fontSize: 18, lineHeight: 1, flexShrink: 0 }, children: l.flag }),
                  /* @__PURE__ */ jsxs("div", { style: { flex: 1 }, children: [
                    /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 600, color: T.text }, children: l.native }),
                    /* @__PURE__ */ jsx("div", { style: { fontSize: 10, color: T.textDim, marginTop: 1 }, children: l.label })
                  ] }),
                  isActive && /* @__PURE__ */ jsx(Check, { size: 14, color: "oklch(0.72 0.15 155)", strokeWidth: 3 })
                ]
              },
              l.code
            );
          }) }),
          /* @__PURE__ */ jsx("div", { style: { marginTop: 10, fontSize: 10, color: T.textMute, letterSpacing: 0.2 }, children: t("lang_scope_note") })
        ]
      }
    ),
    /* @__PURE__ */ jsx(
      PrefRow,
      {
        icon: notif.enabled ? /* @__PURE__ */ jsx(Bell, { size: 14 }) : /* @__PURE__ */ jsx(BellOff, { size: 14 }),
        label: t("notif_label"),
        desc: `${permStatusLabel}${notif.enabled ? " · 3 kategori aktif" : ""}`,
        open: notifOpen,
        onToggle: () => setNotifOpen((o) => !o),
        noBorder: true,
        children: !notif.supported ? /* @__PURE__ */ jsxs("div", { style: {
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 12px",
          borderRadius: 10,
          background: T.surfaceAlt,
          border: `1px solid ${T.hairline}`
        }, children: [
          /* @__PURE__ */ jsx(BellOff, { size: 14, color: T.textMute }),
          /* @__PURE__ */ jsx("div", { style: { fontSize: 12, color: T.textDim }, children: t("notif_unsupported") })
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("div", { style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 12px",
            borderRadius: 10,
            background: notif.enabled ? "oklch(0.72 0.15 155 / 0.1)" : T.bg,
            border: `1px solid ${notif.enabled ? "oklch(0.72 0.15 155 / 0.3)" : T.hairline}`,
            marginBottom: 10
          }, children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 600, color: T.text }, children: t("notif_toggle_label") }),
              /* @__PURE__ */ jsx("div", { style: { fontSize: 11, marginTop: 2, color: permStatusColor, fontWeight: 500 }, children: permStatusLabel })
            ] }),
            /* @__PURE__ */ jsx(
              Toggle,
              {
                on: notif.enabled,
                onChange: handleNotifMainToggle,
                disabled: notif.permission === "denied" || !notif.supported
              }
            )
          ] }),
          notif.permission === "denied" && /* @__PURE__ */ jsxs("div", { style: {
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
            padding: "10px 12px",
            borderRadius: 10,
            background: `${T.warn}10`,
            border: `1px solid ${T.warn}30`,
            marginBottom: 10
          }, children: [
            /* @__PURE__ */ jsx(AlertTriangle, { size: 13, color: T.warn, style: { marginTop: 1, flexShrink: 0 } }),
            /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: T.textDim, lineHeight: 1.5 }, children: t("notif_denied_help") })
          ] }),
          notif.enabled && notif.permission === "granted" && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("div", { style: {
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.4,
              textTransform: "uppercase",
              color: T.textMute,
              marginBottom: 8
            }, children: t("notif_categories_title") }),
            [
              { key: "billing", label: t("notif_cat_billing"), desc: t("notif_cat_billing_desc") },
              { key: "business", label: t("notif_cat_business"), desc: t("notif_cat_business_desc") },
              { key: "system", label: t("notif_cat_system"), desc: t("notif_cat_system_desc") }
            ].map((cat, i, arr) => /* @__PURE__ */ jsxs(
              "div",
              {
                style: {
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "8px 0",
                  borderBottom: i < arr.length - 1 ? `1px solid ${T.hairline}` : "none"
                },
                children: [
                  /* @__PURE__ */ jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
                    /* @__PURE__ */ jsx("div", { style: { fontSize: 12, fontWeight: 600, color: T.text }, children: cat.label }),
                    /* @__PURE__ */ jsx("div", { style: { fontSize: 10, color: T.textDim, marginTop: 1 }, children: cat.desc })
                  ] }),
                  /* @__PURE__ */ jsx(
                    Toggle,
                    {
                      on: notif.categories[cat.key],
                      onChange: (v) => notif.setCategory(cat.key, v)
                    }
                  )
                ]
              },
              cat.key
            )),
            /* @__PURE__ */ jsx("div", { style: { marginTop: 10, fontSize: 10, color: T.textMute, lineHeight: 1.5 }, children: t("notif_browser_note") })
          ] })
        ] })
      }
    )
  ] }) });
}
function HelpAboutCard({ navigate, canDeleteBusiness, onDeleteClick }) {
  const { t } = useLanguage();
  const items = [
    { icon: /* @__PURE__ */ jsx(HelpCircle, { size: 14 }), label: t("help_center"), sub: t("help_center_sub"), onClick: () => navigate("/faq") },
    { icon: /* @__PURE__ */ jsx(Phone, { size: 14 }), label: t("help_contact"), sub: t("help_contact_sub"), onClick: () => navigate("/hubungi-kami") },
    { icon: /* @__PURE__ */ jsx(FileText, { size: 14 }), label: t("help_terms"), sub: null, onClick: () => navigate("/terms") },
    { icon: /* @__PURE__ */ jsx(Shield, { size: 14 }), label: t("help_privacy"), sub: null, onClick: () => navigate("/privacy") },
    ...canDeleteBusiness ? [
      { icon: /* @__PURE__ */ jsx(AlertTriangle, { size: 14, color: T.danger }), label: t("help_delete_biz"), sub: t("help_delete_biz_sub"), onClick: onDeleteClick }
    ] : []
  ];
  return /* @__PURE__ */ jsxs(Section, { title: t("help_section"), icon: /* @__PURE__ */ jsx(Info, { size: 13 }), iconColor: T.textMute, delay: 0.2, children: [
    /* @__PURE__ */ jsx("div", { style: cardStyle(), children: items.map((it, i) => /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: it.onClick,
        style: {
          width: "100%",
          textAlign: "left",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "10px 4px",
          borderBottom: i < items.length - 1 ? `1px solid ${T.hairline}` : "none",
          display: "flex",
          alignItems: "center",
          gap: 12
        },
        children: [
          /* @__PURE__ */ jsx("span", { style: { width: 30, height: 30, borderRadius: 9, background: T.surfaceAlt, color: T.textDim, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }, children: it.icon }),
          /* @__PURE__ */ jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
            /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 600, color: T.text }, children: it.label }),
            it.sub && /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: T.textDim, marginTop: 1 }, children: it.sub })
          ] }),
          /* @__PURE__ */ jsx(ChevronRight, { size: 14, color: T.textMute })
        ]
      },
      it.label
    )) }),
    /* @__PURE__ */ jsxs("div", { style: { marginTop: 8, padding: "10px 14px", textAlign: "center", fontSize: 11, color: T.textMute }, children: [
      "TernakOS · ",
      APP_VERSION
    ] })
  ] });
}
function LogoutBtn({ onLogout }) {
  const { t } = useLanguage();
  return /* @__PURE__ */ jsx("div", { style: { animation: "fadeIn 300ms ease 0.22s both" }, children: /* @__PURE__ */ jsxs(
    "button",
    {
      onClick: onLogout,
      style: {
        width: "100%",
        marginTop: 6,
        marginBottom: 8,
        padding: "14px",
        background: "transparent",
        border: `1px solid ${T.hairlineStrong}`,
        color: T.danger,
        borderRadius: 14,
        cursor: "pointer",
        fontSize: 14,
        fontWeight: 600,
        letterSpacing: -0.1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8
      },
      children: [
        /* @__PURE__ */ jsx(LogOut, { size: 16, strokeWidth: 2 }),
        " ",
        t("logout_btn")
      ]
    }
  ) });
}
function EditBisnisSheet({ open, onClose, tenant, onSuccess, accent }) {
  const { t } = useLanguage();
  const [businessName, setBusinessName] = useState((tenant == null ? void 0 : tenant.business_name) || "");
  const [location, setLocation] = useState((tenant == null ? void 0 : tenant.location) || "");
  const inferredProvince = !(tenant == null ? void 0 : tenant.province) && (tenant == null ? void 0 : tenant.location) && INDONESIA_PROVINCES.includes(tenant.location) ? tenant.location : "";
  const [province, setProvince] = useState((tenant == null ? void 0 : tenant.province) || inferredProvince);
  const [saving, setSaving] = useState(false);
  const originalName = (tenant == null ? void 0 : tenant.business_name) || "";
  const originalLocation = (tenant == null ? void 0 : tenant.location) || "";
  const originalProvince = (tenant == null ? void 0 : tenant.province) || "";
  const isDirty = businessName.trim() !== originalName || location.trim() !== originalLocation || province !== originalProvince;
  const isValid = businessName.trim().length > 0;
  const canSave = isDirty && isValid && !saving;
  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    const { error } = await supabase.from("tenants").update({
      business_name: businessName.trim(),
      location: location.trim() || null,
      province: province || null,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", tenant.id);
    setSaving(false);
    if (error) {
      logSupabaseError(error, {
        table: "tenants",
        operation: "update",
        component: "EditBisnisSheet",
        actionName: "account.bisnis.update"
      });
      toast.error(t("index_toast_save_failed") + ": " + (error.message || t("try_again")));
    } else {
      toast.success(t("index_toast_biz_save_success"));
      onSuccess == null ? void 0 : onSuccess();
      onClose();
    }
  };
  if (!open) return null;
  const sheetStyle = {
    width: "100%",
    maxWidth: 480,
    margin: "0 auto",
    background: T.surface,
    borderRadius: "20px 20px 0 0",
    borderTop: `1px solid ${T.hairlineStrong}`,
    paddingBottom: "calc(120px + env(safe-area-inset-bottom))",
    boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
    zIndex: 210,
    maxHeight: "90dvh",
    overflowY: "auto",
    animation: "slideUp 240ms cubic-bezier(0.32,0.72,0,1)"
  };
  return /* @__PURE__ */ jsx(
    "div",
    {
      onClick: onClose,
      style: {
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "flex-end",
        animation: "fadeIn 180ms ease"
      },
      children: /* @__PURE__ */ jsxs("div", { onClick: (e) => e.stopPropagation(), style: sheetStyle, children: [
        /* @__PURE__ */ jsx("div", { style: { display: "flex", justifyContent: "center", padding: "12px 0 0" }, children: /* @__PURE__ */ jsx("div", { style: { width: 36, height: 4, borderRadius: 2, background: T.hairlineStrong } }) }),
        /* @__PURE__ */ jsxs("div", { style: { padding: "16px 20px 12px", borderBottom: `1px solid ${T.hairline}` }, children: [
          /* @__PURE__ */ jsx("div", { style: { fontSize: 17, fontWeight: 700, color: T.text, letterSpacing: -0.3 }, children: t("eb_title") }),
          /* @__PURE__ */ jsx("div", { style: { fontSize: 12, color: T.textDim, marginTop: 3 }, children: t("eb_subtitle") })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { padding: "20px 20px 8px", display: "flex", flexDirection: "column", gap: 16 }, children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { style: { display: "block", fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 8 }, children: [
              t("eb_biz_name_label"),
              " ",
              /* @__PURE__ */ jsx("span", { style: { color: T.danger }, children: "*" })
            ] }),
            /* @__PURE__ */ jsx(
              "input",
              {
                value: businessName,
                onChange: (e) => setBusinessName(e.target.value),
                placeholder: t("eb_biz_name_placeholder"),
                style: {
                  width: "100%",
                  padding: "12px 14px",
                  boxSizing: "border-box",
                  background: T.surfaceAlt,
                  border: `1px solid ${businessName.trim() ? accent.base + "55" : T.hairline}`,
                  borderRadius: 12,
                  color: T.text,
                  fontSize: 16,
                  outline: "none"
                }
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { style: { display: "block", fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 8 }, children: [
              t("eb_province_label"),
              " ",
              /* @__PURE__ */ jsx("span", { style: { color: T.warn }, children: "⚠" }),
              /* @__PURE__ */ jsx("span", { style: { fontSize: 10, fontWeight: 400, textTransform: "none", letterSpacing: 0, marginLeft: 4 }, children: t("eb_province_required") })
            ] }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: province,
                onChange: (e) => setProvince(e.target.value),
                style: {
                  width: "100%",
                  padding: "12px 14px",
                  boxSizing: "border-box",
                  background: T.surfaceAlt,
                  border: `1px solid ${province ? accent.base + "55" : "oklch(0.78 0.14 70 / 0.5)"}`,
                  borderRadius: 12,
                  color: province ? T.text : T.textDim,
                  fontSize: 16,
                  outline: "none",
                  appearance: "none",
                  WebkitAppearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239BA29B' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 14px center",
                  paddingRight: 36
                },
                children: [
                  /* @__PURE__ */ jsx("option", { value: "", children: t("eb_province_placeholder") }),
                  INDONESIA_PROVINCES.map((p) => /* @__PURE__ */ jsx("option", { value: p, style: { background: T.surface, color: T.text }, children: p }, p))
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { style: { display: "block", fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 8 }, children: [
              t("eb_city_label"),
              " ",
              /* @__PURE__ */ jsx("span", { style: { fontSize: 10, fontWeight: 400, textTransform: "none", letterSpacing: 0 }, children: t("eb_city_optional") })
            ] }),
            /* @__PURE__ */ jsx(
              "input",
              {
                value: location,
                onChange: (e) => setLocation(e.target.value),
                placeholder: t("eb_city_placeholder"),
                style: {
                  width: "100%",
                  padding: "12px 14px",
                  boxSizing: "border-box",
                  background: T.surfaceAlt,
                  border: `1px solid ${T.hairline}`,
                  borderRadius: 12,
                  color: T.text,
                  fontSize: 16,
                  outline: "none"
                }
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { padding: "12px 20px 20px", display: "flex", gap: 10 }, children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: onClose,
              disabled: saving,
              style: {
                flex: 1,
                padding: "13px",
                background: "transparent",
                border: `1px solid ${T.hairlineStrong}`,
                color: T.textDim,
                borderRadius: 12,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600
              },
              children: t("eb_cancel")
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handleSave,
              disabled: !canSave,
              style: {
                flex: 2,
                padding: "13px",
                background: canSave ? accent.base : T.hairlineStrong,
                border: "none",
                color: canSave ? "#0A0E0C" : T.textMute,
                borderRadius: 12,
                cursor: canSave ? "pointer" : "not-allowed",
                fontSize: 14,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                transition: "background 150ms"
              },
              children: saving ? t("eb_saving") : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(MapPin, { size: 14 }),
                " ",
                t("eb_save")
              ] })
            }
          )
        ] })
      ] })
    }
  );
}
function EditProfileSheet({ open, onClose, profile, user, onSuccess, accent }) {
  const { t } = useLanguage();
  const [name, setName] = useState((profile == null ? void 0 : profile.full_name) || "");
  const [phone, setPhone] = useState((profile == null ? void 0 : profile.phone) || "");
  const [saving, setSaving] = useState(false);
  const originalName = (profile == null ? void 0 : profile.full_name) || "";
  const originalPhone = (profile == null ? void 0 : profile.phone) || "";
  const isDirty = name.trim() !== originalName || phone.trim() !== originalPhone;
  const isValid = name.trim().length > 0;
  const canSave = isDirty && isValid && !saving;
  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    const payload = {
      full_name: name.trim(),
      phone: phone.trim() || null,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    let query = supabase.from("profiles").update(payload);
    if (profile == null ? void 0 : profile.profile_id) {
      query = query.eq("id", profile.profile_id);
    } else if ((profile == null ? void 0 : profile.tenant_id) && (user == null ? void 0 : user.id)) {
      query = query.eq("auth_user_id", user.id).eq("tenant_id", profile.tenant_id);
    } else if (user == null ? void 0 : user.id) {
      query = query.eq("auth_user_id", user.id);
    }
    const { error } = await query;
    setSaving(false);
    if (error) {
      logSupabaseError(error, {
        table: "profiles",
        operation: "update",
        component: "EditProfileSheet",
        actionName: "handleSave"
      });
      toast.error(t("index_toast_save_failed") + ": " + (error.message || t("try_again")));
    } else {
      toast.success(t("index_toast_save_success"));
      onSuccess == null ? void 0 : onSuccess();
      onClose();
    }
  };
  if (!open) return null;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      onClick: onClose,
      style: {
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "flex-end",
        animation: "fadeIn 180ms ease"
      },
      children: [
        /* @__PURE__ */ jsxs(
          "div",
          {
            onClick: (e) => e.stopPropagation(),
            style: {
              width: "100%",
              maxWidth: 480,
              margin: "0 auto",
              background: T.surface,
              borderRadius: "20px 20px 0 0",
              borderTop: `1px solid ${T.hairlineStrong}`,
              paddingBottom: "calc(120px + env(safe-area-inset-bottom))",
              boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
              zIndex: 210,
              maxHeight: "90dvh",
              overflowY: "auto",
              animation: "slideUp 240ms cubic-bezier(0.32,0.72,0,1)"
            },
            children: [
              /* @__PURE__ */ jsx("style", { children: `
          @keyframes slideUp {
            from { transform: translateY(100%) }
            to   { transform: translateY(0) }
          }
        ` }),
              /* @__PURE__ */ jsx("div", { style: { display: "flex", justifyContent: "center", padding: "12px 0 0" }, children: /* @__PURE__ */ jsx("div", { style: { width: 36, height: 4, borderRadius: 2, background: T.hairlineStrong } }) }),
              /* @__PURE__ */ jsxs("div", { style: { padding: "16px 20px 12px", borderBottom: `1px solid ${T.hairline}` }, children: [
                /* @__PURE__ */ jsx("div", { style: { fontSize: 17, fontWeight: 700, color: T.text, letterSpacing: -0.3 }, children: t("ep_title") }),
                /* @__PURE__ */ jsx("div", { style: { fontSize: 12, color: T.textDim, marginTop: 3 }, children: t("ep_subtitle") })
              ] }),
              /* @__PURE__ */ jsxs("div", { style: { padding: "20px 20px 8px", display: "flex", flexDirection: "column", gap: 16 }, children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsxs("label", { style: { display: "block", fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 8 }, children: [
                    t("ep_name_label"),
                    " ",
                    /* @__PURE__ */ jsx("span", { style: { color: T.danger }, children: "*" })
                  ] }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      value: name,
                      onChange: (e) => setName(e.target.value),
                      placeholder: t("ep_name_placeholder"),
                      style: {
                        width: "100%",
                        padding: "12px 14px",
                        background: T.surfaceAlt,
                        border: `1px solid ${name.trim() ? accent.base + "55" : T.hairline}`,
                        borderRadius: 12,
                        color: T.text,
                        fontSize: 15,
                        outline: "none",
                        boxSizing: "border-box",
                        transition: "border-color 150ms"
                      }
                    }
                  ),
                  name.trim().length === 0 && /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: T.danger, marginTop: 5 }, children: t("ep_name_empty_error") })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsxs("label", { style: { display: "block", fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 8 }, children: [
                    t("ep_phone_label"),
                    " ",
                    /* @__PURE__ */ jsx("span", { style: { fontSize: 10, fontWeight: 400, textTransform: "none", letterSpacing: 0 }, children: t("ep_phone_optional") })
                  ] }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      value: phone,
                      onChange: (e) => setPhone(e.target.value),
                      placeholder: t("ep_phone_placeholder"),
                      type: "tel",
                      style: {
                        width: "100%",
                        padding: "12px 14px",
                        background: T.surfaceAlt,
                        border: `1px solid ${T.hairline}`,
                        borderRadius: 12,
                        color: T.text,
                        fontSize: 15,
                        outline: "none",
                        boxSizing: "border-box"
                      }
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { style: { display: "block", fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 8 }, children: t("ep_email_label") }),
                  /* @__PURE__ */ jsxs("div", { style: {
                    padding: "12px 14px",
                    background: T.surfaceAlt + "88",
                    border: `1px solid ${T.hairline}`,
                    borderRadius: 12,
                    color: T.textDim,
                    fontSize: 15,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8
                  }, children: [
                    /* @__PURE__ */ jsx("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: (user == null ? void 0 : user.email) || "—" }),
                    /* @__PURE__ */ jsx("span", { style: { fontSize: 10, fontWeight: 600, color: T.textMute, flexShrink: 0, letterSpacing: 0.3, textTransform: "uppercase" }, children: t("ep_email_readonly") })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { style: { padding: "12px 20px 20px", display: "flex", gap: 10 }, children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: onClose,
                    disabled: saving,
                    style: {
                      flex: 1,
                      padding: "13px",
                      background: "transparent",
                      border: `1px solid ${T.hairlineStrong}`,
                      color: T.textDim,
                      borderRadius: 12,
                      cursor: "pointer",
                      fontSize: 14,
                      fontWeight: 600
                    },
                    children: t("ep_cancel")
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: handleSave,
                    disabled: !canSave,
                    style: {
                      flex: 2,
                      padding: "13px",
                      background: canSave ? accent.base : T.surfaceAlt,
                      border: "none",
                      borderRadius: 12,
                      cursor: canSave ? "pointer" : "default",
                      color: canSave ? "#0A0E0C" : T.textMute,
                      fontSize: 14,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      transition: "background 150ms, color 150ms",
                      boxShadow: canSave ? `0 6px 18px ${accent.base}55` : "none"
                    },
                    children: saving ? /* @__PURE__ */ jsxs(Fragment, { children: [
                      /* @__PURE__ */ jsx("span", { style: { width: 14, height: 14, borderRadius: 999, border: `2px solid currentColor`, borderTopColor: "transparent", animation: "spin 600ms linear infinite", display: "inline-block" } }),
                      t("ep_saving")
                    ] }) : t("ep_save")
                  }
                )
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsx("style", { children: `@keyframes spin { to { transform: rotate(360deg) } }` })
      ]
    }
  );
}
function DeleteBusinessDialog({ tenant, profiles, onClose, onDeleted }) {
  const { t } = useLanguage();
  const tenantName = (tenant == null ? void 0 : tenant.business_name) || "Bisnis Aktif";
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const isLastBusiness = profiles.filter((p) => p.tenant_id !== (tenant == null ? void 0 : tenant.id)).length === 0;
  const nameMatches = confirmText.trim().toLowerCase() === tenantName.toLowerCase();
  const handleDelete = async () => {
    var _a;
    if (!nameMatches || deleting) return;
    setDeleting(true);
    const { error } = await supabase.rpc("delete_my_business", { p_tenant_id: tenant.id });
    setDeleting(false);
    if (error) {
      logSupabaseError(error, {
        table: "rpc:delete_my_business",
        operation: "rpc",
        component: "DeleteBusinessDialog",
        actionName: "account.business.delete"
      });
      logError({
        level: "error",
        source: "supabase",
        component: "DeleteBusinessDialog",
        actionName: "account.business.delete",
        error,
        metadata: { tenant_id: tenant == null ? void 0 : tenant.id }
      });
      if ((_a = error.message) == null ? void 0 : _a.includes("ACCESS_DENIED")) {
        toast.error(t("dd_error_access_denied"));
      } else {
        toast.error(t("dd_error_failed") + ": " + (error.message || t("try_again")));
      }
      return;
    }
    toast.success(tenantName + " " + t("index_toast_delete_success"));
    onDeleted();
  };
  return /* @__PURE__ */ jsx(
    "div",
    {
      onClick: onClose,
      style: {
        position: "fixed",
        inset: 0,
        zIndex: 300,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "flex-end",
        animation: "fadeIn 180ms ease"
      },
      children: /* @__PURE__ */ jsxs(
        "div",
        {
          onClick: (e) => e.stopPropagation(),
          style: {
            width: "100%",
            maxWidth: 480,
            margin: "0 auto",
            background: T.surface,
            borderRadius: "20px 20px 0 0",
            borderTop: `2px solid ${T.danger}55`,
            paddingBottom: "calc(32px + env(safe-area-inset-bottom))",
            boxShadow: `0 -8px 40px rgba(0,0,0,0.6), 0 -2px 0 ${T.danger}33`,
            animation: "slideUp 240ms cubic-bezier(0.32,0.72,0,1)",
            maxHeight: "90dvh",
            overflowY: "auto"
          },
          children: [
            /* @__PURE__ */ jsx("div", { style: { display: "flex", justifyContent: "center", padding: "12px 0 0" }, children: /* @__PURE__ */ jsx("div", { style: { width: 36, height: 4, borderRadius: 2, background: T.hairlineStrong } }) }),
            /* @__PURE__ */ jsxs("div", { style: { padding: "20px 20px 16px", borderBottom: `1px solid ${T.hairline}`, display: "flex", alignItems: "center", gap: 12 }, children: [
              /* @__PURE__ */ jsx("div", { style: { width: 44, height: 44, borderRadius: 13, background: `${T.danger}18`, color: T.danger, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }, children: /* @__PURE__ */ jsx(Trash2, { size: 20 }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { style: { fontSize: 16, fontWeight: 800, color: T.text, letterSpacing: -0.3 }, children: t("dd_title") }),
                /* @__PURE__ */ jsx("div", { style: { fontSize: 12, color: T.textDim, marginTop: 2 }, children: t("dd_subtitle") })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { style: { padding: "20px 20px 8px", display: "flex", flexDirection: "column", gap: 16 }, children: [
              /* @__PURE__ */ jsxs("div", { style: {
                padding: "14px",
                borderRadius: 12,
                background: `${T.danger}10`,
                border: `1px solid ${T.danger}30`,
                display: "flex",
                gap: 10,
                alignItems: "flex-start"
              }, children: [
                /* @__PURE__ */ jsx(AlertTriangle, { size: 16, color: T.danger, style: { flexShrink: 0, marginTop: 1 } }),
                /* @__PURE__ */ jsxs("div", { style: { fontSize: 12, color: T.textDim, lineHeight: 1.6 }, children: [
                  t("dd_warning_pre"),
                  " ",
                  /* @__PURE__ */ jsx("strong", { style: { color: T.text }, children: tenantName }),
                  " ",
                  t("dd_warning_mid"),
                  isLastBusiness && /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx("br", {}),
                    /* @__PURE__ */ jsx("br", {}),
                    /* @__PURE__ */ jsx("span", { style: { color: T.warn }, children: t("dd_last_biz_warning") })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { style: { display: "block", fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 8 }, children: t("dd_confirm_label") }),
                /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 600, color: T.danger, background: `${T.danger}12`, border: `1px solid ${T.danger}30`, borderRadius: 8, padding: "6px 12px", marginBottom: 8, letterSpacing: 0.2 }, children: tenantName }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    value: confirmText,
                    onChange: (e) => setConfirmText(e.target.value),
                    placeholder: t("dd_confirm_placeholder_prefix", "Ketik:") + " " + tenantName,
                    autoComplete: "off",
                    style: {
                      width: "100%",
                      padding: "12px 14px",
                      background: T.surfaceAlt,
                      border: `1px solid ${nameMatches ? T.danger + "88" : T.hairline}`,
                      borderRadius: 12,
                      color: T.text,
                      fontSize: 15,
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "border-color 150ms"
                    }
                  }
                ),
                confirmText.length > 0 && !nameMatches && /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: T.textDim, marginTop: 5 }, children: t("dd_name_mismatch") })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { style: { padding: "8px 20px 0", display: "flex", gap: 10 }, children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: onClose,
                  disabled: deleting,
                  style: {
                    flex: 1,
                    padding: "13px",
                    background: "transparent",
                    border: `1px solid ${T.hairlineStrong}`,
                    color: T.textDim,
                    borderRadius: 12,
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 600
                  },
                  children: t("dd_cancel")
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: handleDelete,
                  disabled: !nameMatches || deleting,
                  style: {
                    flex: 2,
                    padding: "13px",
                    background: nameMatches && !deleting ? T.danger : T.surfaceAlt,
                    border: "none",
                    borderRadius: 12,
                    cursor: nameMatches && !deleting ? "pointer" : "default",
                    color: nameMatches && !deleting ? "#fff" : T.textMute,
                    fontSize: 14,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    transition: "background 150ms, color 150ms",
                    boxShadow: nameMatches && !deleting ? `0 6px 18px ${T.danger}44` : "none"
                  },
                  children: deleting ? /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx("span", { style: { width: 14, height: 14, borderRadius: 999, border: "2px solid currentColor", borderTopColor: "transparent", animation: "spin 600ms linear infinite", display: "inline-block" } }),
                    t("dd_deleting")
                  ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx(Trash2, { size: 14 }),
                    " ",
                    t("dd_delete_btn")
                  ] })
                }
              )
            ] })
          ]
        }
      )
    }
  );
}
function DangerZoneSheet({ open, onClose, tenantName, onDelete }) {
  const { t } = useLanguage();
  if (!open) return null;
  return /* @__PURE__ */ jsx(
    "div",
    {
      onClick: onClose,
      style: {
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "flex-end",
        animation: "fadeIn 180ms ease"
      },
      children: /* @__PURE__ */ jsxs(
        "div",
        {
          onClick: (e) => e.stopPropagation(),
          style: {
            width: "100%",
            maxWidth: 480,
            margin: "0 auto",
            background: T.surface,
            borderRadius: "20px 20px 0 0",
            borderTop: `2px solid ${T.danger}55`,
            paddingBottom: "calc(32px + env(safe-area-inset-bottom))",
            boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
            zIndex: 210,
            maxHeight: "90dvh",
            overflowY: "auto",
            animation: "slideUp 240ms cubic-bezier(0.32,0.72,0,1)"
          },
          children: [
            /* @__PURE__ */ jsx("div", { style: { display: "flex", justifyContent: "center", padding: "12px 0 0" }, children: /* @__PURE__ */ jsx("div", { style: { width: 36, height: 4, borderRadius: 2, background: T.hairlineStrong } }) }),
            /* @__PURE__ */ jsxs("div", { style: { padding: "20px 20px 16px", borderBottom: `1px solid ${T.hairline}`, display: "flex", alignItems: "center", gap: 12 }, children: [
              /* @__PURE__ */ jsx("div", { style: { width: 44, height: 44, borderRadius: 13, background: `${T.danger}18`, color: T.danger, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }, children: /* @__PURE__ */ jsx(AlertTriangle, { size: 20 }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { style: { fontSize: 16, fontWeight: 800, color: T.text, letterSpacing: -0.3 }, children: t("dz_title") }),
                /* @__PURE__ */ jsx("div", { style: { fontSize: 12, color: T.textDim, marginTop: 2 }, children: t("dz_subtitle") })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { style: { padding: "24px 20px", display: "flex", flexDirection: "column", gap: 20 }, children: [
              /* @__PURE__ */ jsxs("div", { style: {
                ...cardStyle(),
                border: `1px solid ${T.danger}33`,
                background: `${T.danger}08`
              }, children: [
                /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "flex-start", gap: 12, paddingBottom: 12, borderBottom: `1px solid ${T.hairline}` }, children: [
                  /* @__PURE__ */ jsx("span", { style: { width: 32, height: 32, borderRadius: 10, flexShrink: 0, background: `${T.danger}18`, color: T.danger, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }, children: /* @__PURE__ */ jsx(Trash2, { size: 15 }) }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 3 }, children: t("dz_delete_title") }),
                    /* @__PURE__ */ jsxs("div", { style: { fontSize: 12, color: T.textDim, lineHeight: 1.5 }, children: [
                      t("dz_delete_desc_pre"),
                      " ",
                      /* @__PURE__ */ jsx("strong", { style: { color: T.text }, children: tenantName }),
                      " ",
                      t("dz_delete_desc_post")
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => {
                      onDelete();
                      onClose();
                    },
                    style: {
                      marginTop: 12,
                      width: "100%",
                      padding: "11px",
                      background: T.danger,
                      border: "none",
                      color: "#fff",
                      borderRadius: 10,
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 700,
                      letterSpacing: -0.1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      boxShadow: `0 4px 14px ${T.danger}40`
                    },
                    children: [
                      /* @__PURE__ */ jsx(Trash2, { size: 14, strokeWidth: 2.5 }),
                      " ",
                      t("dz_delete_btn")
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: onClose,
                  style: {
                    width: "100%",
                    padding: "12px",
                    background: "rgba(255,255,255,0.05)",
                    border: `1px solid ${T.hairline}`,
                    color: T.text,
                    borderRadius: 10,
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 700
                  },
                  children: t("dz_cancel")
                }
              )
            ] })
          ]
        }
      )
    }
  );
}
function AkunPage() {
  var _a;
  const { user, profile, tenant, ownerTenant, profiles, isSuperadmin: isSuperadmin2, refetchProfile } = useAuth();
  const navigate = useNavigate();
  const { state: routerState } = useLocation();
  const { t, tRole, tVertical } = useLanguage();
  const activeTenant = tenant;
  const billingTenant = ownerTenant || tenant;
  const rawVertical = resolveBusinessVertical(profile, activeTenant);
  const verticalKey = normalizeVertical(rawVertical);
  const basePath = getXBasePath(activeTenant, profile) || "";
  const editBizPath = getEditBizPath(rawVertical, basePath);
  const originalAccent = VERTICAL_ACCENTS[verticalKey] || VERTICAL_ACCENTS.peternak;
  const accent = {
    ...originalAccent,
    name: tVertical(verticalKey)
  };
  const role = isSuperadmin2 ? "superadmin" : getUserRole(profile);
  const originalRoleBadge = ROLE_LABELS[role] || ROLE_LABELS.view_only;
  const roleBadge = {
    ...originalRoleBadge,
    label: tRole(role)
  };
  const showBilling = BILLING_ROLES.includes(role);
  const isMultiTenant = ((profiles == null ? void 0 : profiles.length) ?? 0) > 1;
  const planKey = (billingTenant == null ? void 0 : billingTenant.plan) || "none";
  const plan = PLAN_INFO[planKey] ? planKey : "none";
  const displayName = (profile == null ? void 0 : profile.full_name) || ((_a = user == null ? void 0 : user.email) == null ? void 0 : _a.split("@")[0]) || t("index_fallback_user", "Pengguna");
  const email = (user == null ? void 0 : user.email) || t("index_fallback_email", "Belum tersedia");
  const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U";
  const tenantName = (activeTenant == null ? void 0 : activeTenant.business_name) || (activeTenant == null ? void 0 : activeTenant.name) || t("index_fallback_biz", "Bisnis Aktif");
  const tenantCity = (activeTenant == null ? void 0 : activeTenant.city) || (activeTenant == null ? void 0 : activeTenant.location) || "—";
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) {
      logError({
        level: "error",
        source: "auth",
        component: "AkunPreview",
        actionName: "handleLogout",
        error,
        metadata: { operation: "signOut" }
      });
      toast.error(t("index_toast_logout_failed", "Gagal keluar"));
    } else {
      navigate("/login");
    }
  };
  const canDeleteBusiness = role === "owner" && !isSuperadmin2 && !!(activeTenant == null ? void 0 : activeTenant.id);
  const canEditBisnis = role === "owner" && !!(activeTenant == null ? void 0 : activeTenant.id);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editBisnisOpen, setEditBisnisOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dangerZoneOpen, setDangerZoneOpen] = useState(false);
  useEffect(() => {
    if ((routerState == null ? void 0 : routerState.openEditBisnis) && canEditBisnis) {
      setEditBisnisOpen(true);
      navigate(".", { replace: true, state: {} });
    }
  }, [routerState == null ? void 0 : routerState.openEditBisnis, canEditBisnis]);
  const handleSwitchBiz = () => {
    if (!isMultiTenant) return;
    toast.info(t("index_toast_switch_biz_info"));
  };
  const handleUpgrade = () => navigate("/upgrade");
  return /* @__PURE__ */ jsxs("div", { style: { minHeight: "100vh", background: T.bg, paddingBottom: 120 }, children: [
    /* @__PURE__ */ jsx("style", { children: `
        @keyframes pulse2 {
          0%, 100% { opacity: 1 }
          50%       { opacity: 0.4 }
        }
        @keyframes fadeIn {
          from { opacity: 0 }
          to   { opacity: 1 }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px) }
          to   { opacity: 1; transform: translateY(0) }
        }
      ` }),
    /* @__PURE__ */ jsx(
      ProfileHero,
      {
        accent,
        roleBadge,
        displayName,
        email,
        initials,
        tenantName
      }
    ),
    /* @__PURE__ */ jsxs("div", { style: { padding: "0 20px" }, children: [
      /* @__PURE__ */ jsx(
        QuickActions,
        {
          accent,
          plan,
          showBilling,
          isMultiTenant,
          onSwitch: handleSwitchBiz,
          onUpgrade: handleUpgrade,
          onManage: () => navigate("/billing"),
          onHelp: () => navigate("/hubungi-kami"),
          onEditProfile: () => setEditProfileOpen(true)
        }
      ),
      /* @__PURE__ */ jsx(
        ActiveBusinessCard,
        {
          accent,
          roleBadge,
          tenantName,
          tenantCity,
          tenantProvince: (activeTenant == null ? void 0 : activeTenant.province) || null,
          canEditBisnis,
          onEditBiz: canEditBisnis ? () => setEditBisnisOpen(true) : editBizPath ? () => navigate(editBizPath) : null
        }
      ),
      /* @__PURE__ */ jsx(AccessSummaryCard, { role, accent, rawVertical }),
      showBilling ? /* @__PURE__ */ jsx(BillingCard, { accent, plan, onUpgrade: handleUpgrade }) : /* @__PURE__ */ jsx(BillingHandledByOwnerCard, {}),
      basePath && /* @__PURE__ */ jsx(
        VerticalShortcutsCard,
        {
          rawVertical,
          basePath,
          accent,
          navigate
        }
      ),
      /* @__PURE__ */ jsx(PreferencesCard, {}),
      /* @__PURE__ */ jsx(HelpAboutCard, { navigate, canDeleteBusiness, onDeleteClick: () => setDangerZoneOpen(true) }),
      /* @__PURE__ */ jsx(LogoutBtn, { onLogout: handleLogout })
    ] }),
    /* @__PURE__ */ jsx(
      EditProfileSheet,
      {
        open: editProfileOpen,
        onClose: () => setEditProfileOpen(false),
        profile,
        user,
        onSuccess: refetchProfile,
        accent
      },
      editProfileOpen ? "profile-open" : "profile-closed"
    ),
    /* @__PURE__ */ jsx(
      EditBisnisSheet,
      {
        open: editBisnisOpen,
        onClose: () => setEditBisnisOpen(false),
        tenant: activeTenant,
        onSuccess: refetchProfile,
        accent
      },
      editBisnisOpen ? "bisnis-open" : "bisnis-closed"
    ),
    deleteDialogOpen && /* @__PURE__ */ jsx(
      DeleteBusinessDialog,
      {
        tenant: activeTenant,
        profiles,
        onClose: () => setDeleteDialogOpen(false),
        onDeleted: () => {
          setDeleteDialogOpen(false);
          try {
            localStorage.removeItem("ternakos_active_tenant_id");
          } catch {
          }
          refetchProfile();
          setTimeout(() => {
            const remaining = profiles.filter((p) => p.tenant_id !== (activeTenant == null ? void 0 : activeTenant.id));
            if (remaining.length > 0) {
              navigate("/", { replace: true });
            } else {
              navigate("/welcome", { replace: true });
            }
          }, 300);
        }
      }
    ),
    /* @__PURE__ */ jsx(
      DangerZoneSheet,
      {
        open: dangerZoneOpen,
        onClose: () => setDangerZoneOpen(false),
        tenantName,
        onDelete: () => setDeleteDialogOpen(true)
      }
    )
  ] });
}
const CARD_BG$1 = "#0C1319";
const MUTED$1 = "#64748B";
const TEXT$1 = "#F1F5F9";
const SPOTLIGHT_PAD = 12;
const SPOTLIGHT_RADIUS = 14;
function useIsDesktop$1() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const update = () => setIsDesktop(window.innerWidth >= 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return isDesktop;
}
function useViewport() {
  const [vp, setVp] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const update = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return vp;
}
function ProgressDots({ total, current, accent }) {
  return /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 5, alignItems: "center" }, children: Array.from({ length: total }).map((_, i) => /* @__PURE__ */ jsx("div", { style: {
    width: i === current ? 18 : 7,
    height: 7,
    borderRadius: 4,
    background: i === current ? accent : "rgba(255,255,255,0.15)",
    transition: "all 0.3s ease"
  } }, i)) });
}
function SpotlightSVG({ rect, accent }) {
  const vp = useViewport();
  if (!vp.w) return null;
  const x = rect ? rect.x - SPOTLIGHT_PAD : 0;
  const y = rect ? rect.y - SPOTLIGHT_PAD : 0;
  const rw = rect ? rect.w + SPOTLIGHT_PAD * 2 : 0;
  const rh = rect ? rect.h + SPOTLIGHT_PAD * 2 : 0;
  return /* @__PURE__ */ jsx(
    "svg",
    {
      style: { position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 9998, pointerEvents: "none" },
      children: rect ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("mask", { id: "tut-mask", children: [
          /* @__PURE__ */ jsx("rect", { width: "100%", height: "100%", fill: "white" }),
          /* @__PURE__ */ jsx("rect", { x, y, width: rw, height: rh, rx: SPOTLIGHT_RADIUS, ry: SPOTLIGHT_RADIUS, fill: "black" })
        ] }) }),
        /* @__PURE__ */ jsx("rect", { width: "100%", height: "100%", fill: "rgba(0,0,0,0.82)", mask: "url(#tut-mask)" }),
        /* @__PURE__ */ jsx(
          "rect",
          {
            x,
            y,
            width: rw,
            height: rh,
            rx: SPOTLIGHT_RADIUS,
            ry: SPOTLIGHT_RADIUS,
            fill: "none",
            stroke: accent,
            strokeWidth: "2.5",
            opacity: "0.85"
          }
        ),
        /* @__PURE__ */ jsx(
          "rect",
          {
            x: x - 5,
            y: y - 5,
            width: rw + 10,
            height: rh + 10,
            rx: SPOTLIGHT_RADIUS + 5,
            ry: SPOTLIGHT_RADIUS + 5,
            fill: "none",
            stroke: accent,
            strokeWidth: "1",
            opacity: "0.25"
          }
        )
      ] }) : /* @__PURE__ */ jsx("rect", { width: "100%", height: "100%", fill: "rgba(0,0,0,0.78)" })
    }
  );
}
function ClickBlocker({ rect }) {
  const vp = useViewport();
  if (!vp.w) return /* @__PURE__ */ jsx("div", { style: { position: "fixed", inset: 0, zIndex: 9997 } });
  if (!rect) return /* @__PURE__ */ jsx("div", { style: { position: "fixed", inset: 0, zIndex: 9997 } });
  const x = rect.x - SPOTLIGHT_PAD;
  const y = rect.y - SPOTLIGHT_PAD;
  const rw = rect.w + SPOTLIGHT_PAD * 2;
  const rh = rect.h + SPOTLIGHT_PAD * 2;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("div", { style: { position: "fixed", top: 0, left: 0, right: 0, height: y, zIndex: 9997 } }),
    /* @__PURE__ */ jsx("div", { style: { position: "fixed", top: y + rh, left: 0, right: 0, bottom: 0, zIndex: 9997 } }),
    /* @__PURE__ */ jsx("div", { style: { position: "fixed", top: y, left: 0, width: x, height: rh, zIndex: 9997 } }),
    /* @__PURE__ */ jsx("div", { style: { position: "fixed", top: y, left: x + rw, right: 0, height: rh, zIndex: 9997 } })
  ] });
}
function TooltipCard({ step, stepIdx, totalSteps, rect, isLast, isDesktop, accent, accentDim, onNext, onPrev, onSkip }) {
  const vp = useViewport();
  const Icon = step.icon;
  if (!vp.w) return null;
  const CARD_W = isDesktop ? 296 : Math.min(296, vp.w - 32);
  let style = {};
  let arrowSide = null;
  if (rect) {
    const pad = SPOTLIGHT_PAD;
    const elBottom = rect.y + rect.h + pad + 12;
    const elTop = rect.y - pad - 12;
    const elCenterX = rect.x + rect.w / 2;
    const clampLeft = (v) => Math.max(16, Math.min(vp.w - CARD_W - 16, v));
    if (elBottom + 220 < vp.h) {
      style = { top: elBottom, left: clampLeft(elCenterX - CARD_W / 2) };
      arrowSide = "top";
    } else if (elTop - 220 > 0) {
      style = { bottom: vp.h - elTop, left: clampLeft(elCenterX - CARD_W / 2) };
      arrowSide = "bottom";
    } else {
      style = { bottom: 96, left: clampLeft(elCenterX - CARD_W / 2) };
    }
  } else {
    style = { bottom: isDesktop ? 48 : 96, left: Math.max(16, (vp.w - CARD_W) / 2) };
  }
  return /* @__PURE__ */ jsxs(
    motion.div,
    {
      initial: { opacity: 0, y: arrowSide === "top" ? -10 : 10, scale: 0.95 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, scale: 0.94 },
      transition: { duration: 0.2, ease: "easeOut" },
      style: {
        position: "fixed",
        ...style,
        width: CARD_W,
        background: CARD_BG$1,
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.1)",
        padding: "18px 18px 14px",
        zIndex: 1e4,
        boxShadow: `0 24px 64px rgba(0,0,0,0.75), 0 0 0 1px ${accent}1a`
      },
      children: [
        arrowSide === "top" && /* @__PURE__ */ jsx("div", { style: { position: "absolute", top: -7, left: 22, width: 14, height: 7, overflow: "hidden" }, children: /* @__PURE__ */ jsx("div", { style: { width: 12, height: 12, background: CARD_BG$1, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 2, transform: "rotate(45deg) translate(1px, 1px)" } }) }),
        arrowSide === "bottom" && /* @__PURE__ */ jsx("div", { style: { position: "absolute", bottom: -7, left: 22, width: 14, height: 7, overflow: "hidden", display: "flex", alignItems: "flex-end" }, children: /* @__PURE__ */ jsx("div", { style: { width: 12, height: 12, background: CARD_BG$1, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 2, transform: "rotate(45deg) translate(1px, -1px)" } }) }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }, children: [
          /* @__PURE__ */ jsx("div", { style: { width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: accentDim, display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ jsx(Icon, { size: 17, color: accent }) }),
          /* @__PURE__ */ jsxs("div", { style: { flex: 1 }, children: [
            /* @__PURE__ */ jsxs("div", { style: { fontSize: 10, color: MUTED$1, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 2 }, children: [
              "LANGKAH ",
              stepIdx,
              " / ",
              totalSteps - 1
            ] }),
            /* @__PURE__ */ jsx("div", { style: { fontSize: 14, fontWeight: 800, color: TEXT$1, lineHeight: 1.25, fontFamily: "DM Sans, sans-serif" }, children: step.title })
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: onSkip,
              style: { background: "none", border: "none", color: MUTED$1, cursor: "pointer", padding: "2px 2px", lineHeight: 0, flexShrink: 0 },
              "aria-label": "Lewati tutorial",
              children: /* @__PURE__ */ jsx(X, { size: 15 })
            }
          )
        ] }),
        /* @__PURE__ */ jsx("p", { style: { fontSize: 12.5, color: "#94A3B8", lineHeight: 1.65, margin: "0 0 12px" }, children: step.desc }),
        !rect && step.navHint && /* @__PURE__ */ jsxs("div", { style: { display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, padding: "5px 10px", marginBottom: 12 }, children: [
          /* @__PURE__ */ jsx(MapPin, { size: 11, color: MUTED$1 }),
          /* @__PURE__ */ jsxs("span", { style: { fontSize: 11, color: MUTED$1, fontWeight: 700 }, children: [
            "Buka sidebar → ",
            step.navHint
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { style: { height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 12 } }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
          /* @__PURE__ */ jsx(ProgressDots, { total: totalSteps, current: stepIdx, accent }),
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 7 }, children: [
            /* @__PURE__ */ jsx("button", { onClick: onPrev, style: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "7px 12px", color: "#94A3B8", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }, children: /* @__PURE__ */ jsx(ChevronLeft, { size: 13 }) }),
            /* @__PURE__ */ jsx("button", { onClick: onNext, style: { background: isLast ? "#16A34A" : accent, border: "none", borderRadius: 10, padding: "7px 15px", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, boxShadow: `0 4px 14px ${accent}40` }, children: isLast ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Check, { size: 13, strokeWidth: 3 }),
              " Mulai!"
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              "Lanjut ",
              /* @__PURE__ */ jsx(ChevronRight, { size: 13 })
            ] }) })
          ] })
        ] })
      ]
    },
    stepIdx
  );
}
function MobileStepSheet({ step, stepIdx, totalSteps, isLast, accent, accentDim, onNext, onPrev, onSkip, hasSpotlight = false }) {
  const Icon = step.icon;
  return /* @__PURE__ */ jsx("div", { style: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    display: "flex",
    alignItems: "flex-end",
    // SpotlightSVG handles backdrop when element is found
    background: hasSpotlight ? "transparent" : "rgba(0,0,0,0.55)",
    backdropFilter: hasSpotlight ? "none" : "blur(3px)",
    pointerEvents: "none"
  }, children: /* @__PURE__ */ jsxs(
    motion.div,
    {
      initial: { y: "100%" },
      animate: { y: 0 },
      exit: { y: "100%" },
      transition: { duration: 0.3, ease: [0.32, 0.72, 0, 1] },
      style: {
        width: "100%",
        background: CARD_BG$1,
        borderRadius: "24px 24px 0 0",
        border: "1px solid rgba(255,255,255,0.08)",
        borderBottom: "none",
        padding: "16px 20px",
        paddingBottom: "max(20px, env(safe-area-inset-bottom))",
        boxShadow: "0 -16px 48px rgba(0,0,0,0.5)",
        pointerEvents: "auto"
        // only the sheet captures touches
      },
      children: [
        /* @__PURE__ */ jsx("div", { style: { width: 32, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)", margin: "0 auto 16px" } }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }, children: [
          /* @__PURE__ */ jsx("div", { style: { width: 42, height: 42, borderRadius: 13, background: accentDim, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }, children: /* @__PURE__ */ jsx(Icon, { size: 20, color: accent }) }),
          /* @__PURE__ */ jsxs("div", { style: { flex: 1 }, children: [
            /* @__PURE__ */ jsxs("div", { style: { fontSize: 10, color: MUTED$1, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 2 }, children: [
              "LANGKAH ",
              stepIdx,
              " / ",
              totalSteps - 1
            ] }),
            /* @__PURE__ */ jsx("div", { style: { fontSize: 16, fontWeight: 800, color: TEXT$1, lineHeight: 1.25, fontFamily: "DM Sans, sans-serif" }, children: step.title })
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: onSkip,
              style: {
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                color: MUTED$1,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 44,
                height: 44,
                flexShrink: 0
              },
              "aria-label": "Lewati tutorial",
              children: /* @__PURE__ */ jsx(X, { size: 16 })
            }
          )
        ] }),
        /* @__PURE__ */ jsx("p", { style: { fontSize: 14, color: "#94A3B8", lineHeight: 1.65, margin: "0 0 12px" }, children: step.desc }),
        step.navHint && /* @__PURE__ */ jsxs("div", { style: {
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: `${accent}18`,
          border: `1px solid ${accent}35`,
          borderRadius: 10,
          padding: "9px 12px",
          marginBottom: 16
        }, children: [
          /* @__PURE__ */ jsx(MapPin, { size: 13, color: accent }),
          /* @__PURE__ */ jsxs("span", { style: { fontSize: 13, color: accent, fontWeight: 700 }, children: [
            "Menu → ",
            step.navHint
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { style: { height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 14 } }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
          /* @__PURE__ */ jsx(ProgressDots, { total: totalSteps, current: stepIdx, accent }),
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 8 }, children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: onPrev,
                style: {
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  padding: "0 16px",
                  color: "#94A3B8",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  minHeight: 44,
                  minWidth: 44
                },
                children: /* @__PURE__ */ jsx(ChevronLeft, { size: 15 })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: onNext,
                style: {
                  background: isLast ? "#16A34A" : accent,
                  border: "none",
                  borderRadius: 12,
                  padding: "0 20px",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: `0 4px 14px ${accent}40`,
                  minHeight: 44
                },
                children: isLast ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(Check, { size: 14, strokeWidth: 3 }),
                  " Mulai!"
                ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                  "Lanjut ",
                  /* @__PURE__ */ jsx(ChevronRight, { size: 14 })
                ] })
              }
            )
          ] })
        ] })
      ]
    },
    stepIdx
  ) });
}
function WelcomeModal({ step, steps, stepIdx, direction, accent, accentDim, onNext, onSkip, isDesktop }) {
  const Icon = step.icon;
  const variants = {
    enter: (d) => ({ x: d > 0 ? 28 : -28, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d) => ({ x: d > 0 ? -28 : 28, opacity: 0 })
  };
  const content = /* @__PURE__ */ jsx(AnimatePresence, { mode: "wait", custom: direction, children: /* @__PURE__ */ jsx(
    motion.div,
    {
      custom: direction,
      variants,
      initial: "enter",
      animate: "center",
      exit: "exit",
      transition: { duration: 0.22, ease: "easeOut" },
      children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 14 }, children: [
        /* @__PURE__ */ jsx("div", { style: { width: 68, height: 68, borderRadius: 20, background: accentDim, display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ jsx(Icon, { size: 32, color: accent }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { style: { fontFamily: "DM Sans, sans-serif", fontWeight: 800, fontSize: isDesktop ? 22 : 20, color: TEXT$1, margin: 0, lineHeight: 1.3 }, children: step.title }),
          /* @__PURE__ */ jsx("p", { style: { fontSize: 14, color: "#94A3B8", margin: "10px 0 0", lineHeight: 1.7 }, children: step.desc })
        ] }),
        step.bullets && /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: step.bullets.map((b, i) => /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10 }, children: [
          /* @__PURE__ */ jsx("div", { style: { width: 22, height: 22, borderRadius: 6, background: accentDim, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }, children: /* @__PURE__ */ jsx(Check, { size: 12, color: accent, strokeWidth: 3 }) }),
          /* @__PURE__ */ jsx("span", { style: { fontSize: 13, color: "#CBD5E1", fontWeight: 600 }, children: b })
        ] }, i)) })
      ] })
    },
    stepIdx
  ) });
  if (isDesktop) {
    return /* @__PURE__ */ jsx("div", { style: { position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }, children: /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 0.24, ease: "easeOut" },
        style: { width: "100%", maxWidth: 560, background: CARD_BG$1, borderRadius: 24, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden", display: "flex", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" },
        children: [
          /* @__PURE__ */ jsxs("div", { style: { width: "38%", background: `linear-gradient(160deg, ${accentDim} 0%, rgba(0,0,0,0) 100%)`, borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", gap: 24 }, children: [
            /* @__PURE__ */ jsx("div", { style: { width: 88, height: 88, borderRadius: 26, background: accentDim, display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ jsx(Icon, { size: 44, color: accent }) }),
            /* @__PURE__ */ jsx(ProgressDots, { total: steps.length, current: stepIdx, accent }),
            /* @__PURE__ */ jsxs("span", { style: { fontSize: 12, color: MUTED$1, fontWeight: 700, letterSpacing: "0.06em" }, children: [
              stepIdx + 1,
              " / ",
              steps.length
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { flex: 1, padding: "32px 28px", display: "flex", flexDirection: "column" }, children: [
            /* @__PURE__ */ jsx("div", { style: { flex: 1 }, children: content }),
            /* @__PURE__ */ jsxs("div", { style: { paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
              /* @__PURE__ */ jsx("button", { onClick: onSkip, style: { background: "none", border: "none", color: MUTED$1, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "8px 4px" }, children: "Lewati tutorial" }),
              /* @__PURE__ */ jsxs("button", { onClick: onNext, style: { display: "flex", alignItems: "center", gap: 8, background: accent, border: "none", borderRadius: 12, padding: "11px 22px", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", boxShadow: `0 4px 16px ${accent}40` }, children: [
                "Mulai tour ",
                /* @__PURE__ */ jsx(ChevronRight, { size: 15 })
              ] })
            ] })
          ] })
        ]
      }
    ) });
  }
  return /* @__PURE__ */ jsx("div", { style: { position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "flex-end", background: "rgba(0,0,0,0.84)", backdropFilter: "blur(4px)" }, children: /* @__PURE__ */ jsxs(
    motion.div,
    {
      initial: { y: "100%" },
      animate: { y: 0 },
      transition: { duration: 0.32, ease: [0.32, 0.72, 0, 1] },
      style: { width: "100%", maxHeight: "82vh", background: CARD_BG$1, borderRadius: "24px 24px 0 0", border: "1px solid rgba(255,255,255,0.08)", borderBottom: "none", display: "flex", flexDirection: "column", padding: "16px 20px 0", boxShadow: "0 -16px 48px rgba(0,0,0,0.5)" },
      children: [
        /* @__PURE__ */ jsx("div", { style: { width: 32, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)", margin: "0 auto 14px", flexShrink: 0 } }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexShrink: 0 }, children: [
          /* @__PURE__ */ jsx(ProgressDots, { total: steps.length, current: stepIdx, accent }),
          /* @__PURE__ */ jsx("button", { onClick: onSkip, style: { background: "none", border: "none", color: MUTED$1, fontSize: 13, fontWeight: 700, cursor: "pointer", padding: "10px 4px 10px 16px", minHeight: 44 }, children: "Lewati" })
        ] }),
        /* @__PURE__ */ jsx("div", { style: { flex: 1, overflowY: "auto", paddingBottom: 8 }, children: content }),
        /* @__PURE__ */ jsx("div", { style: { paddingTop: 16, paddingBottom: "max(20px, env(safe-area-inset-bottom))", flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.06)" }, children: /* @__PURE__ */ jsxs("button", { onClick: onNext, style: { width: "100%", background: accent, border: "none", borderRadius: 14, padding: "15px 0", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: `0 4px 20px ${accent}44` }, children: [
          "Mulai tour ",
          /* @__PURE__ */ jsx(ChevronRight, { size: 16 })
        ] }) })
      ]
    }
  ) });
}
function TutorialOverlay({ steps, storageKey, accent, accentDim }) {
  const { profile, tenant } = useAuth();
  const isDesktop = useIsDesktop$1();
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState("welcome");
  const [stepIdx, setStepIdx] = useState(0);
  const [direction, setDirection] = useState(1);
  const [targetRect, setTargetRect] = useState(null);
  const retryRef = useRef(null);
  const actualProfileId = (profile == null ? void 0 : profile.profile_id) ?? (profile == null ? void 0 : profile.id);
  useEffect(() => {
    if (!(tenant == null ? void 0 : tenant.id) || !actualProfileId) return;
    try {
      if (localStorage.getItem(storageKey)) return;
    } catch {
    }
    supabase.from("profiles").select("tutorials_completed").eq("id", actualProfileId).single().then(({ data }) => {
      var _a;
      if ((_a = data == null ? void 0 : data.tutorials_completed) == null ? void 0 : _a[storageKey]) {
        try {
          localStorage.setItem(storageKey, data.tutorials_completed[storageKey]);
        } catch {
        }
      } else {
        setVisible(true);
      }
    });
  }, [tenant == null ? void 0 : tenant.id, actualProfileId, storageKey]);
  const queryTarget = useCallback((step2) => {
    if (!(step2 == null ? void 0 : step2.selector)) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(step2.selector);
    if (el) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && r.top >= 0 && r.top < window.innerHeight) {
        setTargetRect({ x: r.x, y: r.y, w: r.width, h: r.height });
        return;
      }
    }
    setTargetRect(null);
  }, []);
  useEffect(() => {
    if (mode !== "spotlight") return;
    const step2 = steps[stepIdx];
    if (isDesktop) {
      window.dispatchEvent(new Event("open-mobile-sidebar"));
    }
    clearTimeout(retryRef.current);
    retryRef.current = setTimeout(() => queryTarget(step2), isDesktop ? 340 : 80);
    const onResize = () => queryTarget(step2);
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(retryRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, [mode, stepIdx, isDesktop, steps, queryTarget]);
  if (!visible) return null;
  if ((profile == null ? void 0 : profile.role) !== "owner") return null;
  const step = steps[stepIdx];
  const isLast = stepIdx === steps.length - 1;
  const dismiss = async (reason) => {
    const value = reason === "complete" ? (/* @__PURE__ */ new Date()).toISOString() : reason;
    try {
      localStorage.setItem(storageKey, value);
    } catch {
    }
    setVisible(false);
    if (actualProfileId && (tenant == null ? void 0 : tenant.id)) {
      try {
        const { data: current, error: readErr } = await supabase.from("profiles").select("tutorials_completed").eq("id", actualProfileId).single();
        if (readErr) {
          logSupabaseError(readErr, {
            table: "profiles",
            operation: "select",
            component: "TutorialOverlay",
            actionName: "tutorial.complete.read"
          });
        } else {
          const merged = {
            ...(current == null ? void 0 : current.tutorials_completed) || {},
            [storageKey]: value
          };
          const { error: writeErr } = await supabase.from("profiles").update({ tutorials_completed: merged }).eq("id", actualProfileId);
          if (writeErr) {
            logSupabaseError(writeErr, {
              table: "profiles",
              operation: "update",
              component: "TutorialOverlay",
              actionName: "tutorial.complete.write"
            });
          }
        }
      } catch (err) {
        logSupabaseError(err, {
          table: "profiles",
          operation: "update",
          component: "TutorialOverlay",
          actionName: "tutorial.complete.exception"
        });
      }
    }
  };
  const goNext = () => {
    if (mode === "welcome") {
      setMode("spotlight");
      setStepIdx(1);
      return;
    }
    if (isLast) {
      dismiss("complete");
      return;
    }
    setDirection(1);
    setStepIdx((i) => i + 1);
  };
  const goPrev = () => {
    if (mode === "spotlight" && stepIdx <= 1) {
      setMode("welcome");
      setStepIdx(0);
      setTargetRect(null);
      return;
    }
    setDirection(-1);
    setStepIdx((i) => i - 1);
  };
  if (mode === "welcome") {
    return /* @__PURE__ */ jsx(
      WelcomeModal,
      {
        step,
        steps,
        stepIdx,
        direction,
        isDesktop,
        accent,
        accentDim,
        onNext: goNext,
        onSkip: () => dismiss("skip")
      }
    );
  }
  if (!isDesktop) {
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      targetRect && /* @__PURE__ */ jsx(SpotlightSVG, { rect: targetRect, accent }),
      /* @__PURE__ */ jsx(AnimatePresence, { mode: "wait", children: /* @__PURE__ */ jsx(
        MobileStepSheet,
        {
          step,
          stepIdx,
          totalSteps: steps.length,
          isLast,
          accent,
          accentDim,
          onNext: goNext,
          onPrev: goPrev,
          onSkip: () => dismiss("skip"),
          hasSpotlight: !!targetRect
        },
        stepIdx
      ) })
    ] });
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(SpotlightSVG, { rect: targetRect, accent }),
    /* @__PURE__ */ jsx(ClickBlocker, { rect: targetRect }),
    /* @__PURE__ */ jsx(AnimatePresence, { mode: "wait", children: /* @__PURE__ */ jsx(
      TooltipCard,
      {
        step,
        stepIdx,
        totalSteps: steps.length,
        rect: targetRect,
        isLast,
        isDesktop,
        accent,
        accentDim,
        onNext: goNext,
        onPrev: goPrev,
        onSkip: () => dismiss("skip")
      },
      stepIdx
    ) })
  ] });
}
const CARD_BG = "#0C1319";
const MUTED = "#64748B";
const TEXT = "#F1F5F9";
const ROLE_INFO = {
  manajer: { label: "Manajer", desc: "Kamu punya akses penuh operasional — kelola transaksi, pantau performa tim, dan lihat laporan bisnis." },
  staff: { label: "Staff", desc: "Kamu bisa input data harian dan menyelesaikan tugas operasional yang diberikan manajer." },
  sales: { label: "Sales", desc: "Kamu bertanggung jawab atas transaksi penjualan dan hubungan dengan pelanggan." },
  sopir: { label: "Sopir / Driver", desc: "Kamu bisa melihat jadwal pengiriman dan memperbarui status perjalanan." },
  supir: { label: "Supir / Driver", desc: "Kamu bisa melihat jadwal pengiriman dan memperbarui status perjalanan." },
  kurir: { label: "Kurir", desc: "Kamu bisa melihat jadwal pengiriman dan memperbarui status pengantaran." },
  anak_kandang: { label: "Anak Kandang", desc: "Kamu bisa mengisi input harian kandang dan menyelesaikan tugas yang diberikan penanggung jawab." },
  gudang: { label: "Staff Gudang", desc: "Kamu bertanggung jawab atas stok dan inventori gudang." },
  admin: { label: "Admin", desc: "Kamu punya akses penuh operasional dan keuangan." },
  view_only: { label: "Viewer", desc: "Kamu punya akses terbatas untuk melihat laporan dan statistik bisnis." }
};
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const update = () => setIsDesktop(window.innerWidth >= 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return isDesktop;
}
function WelcomeOnlyOverlay({ accent, accentDim }) {
  const { profile, tenant } = useAuth();
  const isDesktop = useIsDesktop();
  const [visible, setVisible] = useState(false);
  const storageKey = `welcome_${tenant == null ? void 0 : tenant.id}`;
  useEffect(() => {
    if (!(tenant == null ? void 0 : tenant.id)) return;
    if ((profile == null ? void 0 : profile.role) === "owner") return;
    try {
      setVisible(!localStorage.getItem(storageKey));
    } catch {
    }
  }, [tenant == null ? void 0 : tenant.id, profile == null ? void 0 : profile.role, storageKey]);
  if (!visible) return null;
  if (!(profile == null ? void 0 : profile.role) || profile.role === "owner") return null;
  const info = ROLE_INFO[profile.role] || { label: profile.role, desc: "Selamat datang di TernakOS. Hubungi owner jika butuh bantuan." };
  const businessName = (tenant == null ? void 0 : tenant.business_name) || "bisnis ini";
  const dismiss = () => {
    try {
      localStorage.setItem(storageKey, "done");
    } catch {
    }
    setVisible(false);
  };
  const content = /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 14 }, children: [
    /* @__PURE__ */ jsx("div", { style: { width: 60, height: 60, borderRadius: 18, background: accentDim, display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ jsx(Users, { size: 28, color: accent }) }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("h2", { style: { fontFamily: "DM Sans, sans-serif", fontWeight: 800, fontSize: isDesktop ? 21 : 19, color: TEXT, margin: 0, lineHeight: 1.3 }, children: [
        "Halo! Kamu bergabung sebagai ",
        /* @__PURE__ */ jsx("span", { style: { color: accent }, children: info.label })
      ] }),
      /* @__PURE__ */ jsx("p", { style: { fontSize: 14, color: "#94A3B8", margin: "10px 0 0", lineHeight: 1.7 }, children: info.desc })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 14px" }, children: [
      /* @__PURE__ */ jsx("span", { style: { fontSize: 12, color: MUTED, fontWeight: 600 }, children: "Bergabung di: " }),
      /* @__PURE__ */ jsx("span", { style: { fontSize: 12, color: TEXT, fontWeight: 700 }, children: businessName })
    ] })
  ] });
  if (isDesktop) {
    return /* @__PURE__ */ jsx("div", { style: { position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }, children: /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 0.24, ease: "easeOut" },
        style: { width: "100%", maxWidth: 440, background: CARD_BG, borderRadius: 24, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.6)", padding: "36px 32px" },
        children: [
          content,
          /* @__PURE__ */ jsx("div", { style: { paddingTop: 28, display: "flex", justifyContent: "flex-end" }, children: /* @__PURE__ */ jsxs("button", { onClick: dismiss, style: { display: "flex", alignItems: "center", gap: 8, background: accent, border: "none", borderRadius: 12, padding: "11px 22px", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", boxShadow: `0 4px 16px ${accent}40` }, children: [
            "Oke, mengerti ",
            /* @__PURE__ */ jsx(ChevronRight, { size: 15 })
          ] }) })
        ]
      }
    ) });
  }
  return /* @__PURE__ */ jsx("div", { style: { position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "flex-end", background: "rgba(0,0,0,0.84)", backdropFilter: "blur(4px)" }, children: /* @__PURE__ */ jsxs(
    motion.div,
    {
      initial: { y: "100%" },
      animate: { y: 0 },
      transition: { duration: 0.32, ease: [0.32, 0.72, 0, 1] },
      style: { width: "100%", maxHeight: "80vh", background: CARD_BG, borderRadius: "24px 24px 0 0", border: "1px solid rgba(255,255,255,0.08)", borderBottom: "none", display: "flex", flexDirection: "column", padding: "16px 20px 0", boxShadow: "0 -16px 48px rgba(0,0,0,0.5)" },
      children: [
        /* @__PURE__ */ jsx("div", { style: { width: 32, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)", margin: "0 auto 18px", flexShrink: 0 } }),
        /* @__PURE__ */ jsx("div", { style: { flex: 1, overflowY: "auto", paddingBottom: 8 }, children: content }),
        /* @__PURE__ */ jsx("div", { style: { paddingTop: 16, paddingBottom: "max(20px, env(safe-area-inset-bottom))", flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.06)" }, children: /* @__PURE__ */ jsxs("button", { onClick: dismiss, style: { width: "100%", background: accent, border: "none", borderRadius: 14, padding: "15px 0", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: `0 4px 20px ${accent}44` }, children: [
          "Oke, mengerti ",
          /* @__PURE__ */ jsx(ChevronRight, { size: 16 })
        ] }) })
      ]
    }
  ) });
}
export {
  AkunPage as A,
  BerandaSkeleton as B,
  CashFlowSkeleton as C,
  InvoicePreviewModal as I,
  KandangSkeleton as K,
  ManajemenPage as M,
  PETERNAK_TIM_CONFIG as P,
  RPASkeleton as R,
  TutorialOverlay as T,
  WelcomeOnlyOverlay as W,
  TransaksiSkeleton as a,
  PengirimanSkeleton as b,
  ArmadaSkeleton as c,
  RPADetailSkeleton as d,
  BROKER_POULTRY_TIM_CONFIG as e,
  BROKER_TELUR_TIM_CONFIG as f,
  BROKER_SEMBAKO_TIM_CONFIG as g,
  RPA_TIM_CONFIG as h
};
