import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Clock, ShieldCheck, Activity, MapPin, ChevronsUpDown } from "lucide-react";
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area } from "recharts";
import { format, subDays, startOfWeek, startOfMonth } from "date-fns";
import { u as useAuth, x as isOwner, aJ as isStaff, y as isSuperadmin, s as supabase, aB as formatDate, aw as Card, a1 as cn, aN as ScrollArea, aK as Skeleton, aq as formatIDR, aO as ScrollBar, aQ as CardContent, P as Popover, h as PopoverTrigger, a7 as Button, i as PopoverContent, C as Command, j as CommandInput, k as CommandList, l as CommandEmpty, m as CommandGroup, o as CommandItem } from "../main.mjs";
import { useQuery } from "@tanstack/react-query";
import "vite-react-ssg";
import "react-router-dom";
import "sonner";
import "@radix-ui/react-tooltip";
import "clsx";
import "tailwind-merge";
import "@supabase/supabase-js";
import "animejs";
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
import "@radix-ui/react-tabs";
import "@radix-ui/react-collapsible";
import "@radix-ui/react-select";
const WIB_OFFSET = 7 * 60 * 60 * 1e3;
const PROVINCE_TO_ARBOGE_REGION = {
  "DKI Jakarta": "Jakarta",
  "Banten": "Banten",
  "Jawa Barat": "Jawa Barat",
  "Jawa Tengah": "Jawa Tengah",
  "DI Yogyakarta": "Jawa Tengah",
  "Jawa Timur": "Jawa Timur",
  "Bali": "Bali",
  "Nusa Tenggara Barat": "NTB",
  "Nusa Tenggara Timur": "NTT",
  "Lampung": "Lampung",
  // Sumatera provinces → generic "Sumatera"
  "Aceh": "Sumatera",
  "Sumatera Utara": "Sumatera",
  "Sumatera Barat": "Sumatera",
  "Riau": "Sumatera",
  "Kepulauan Riau": "Sumatera",
  "Jambi": "Sumatera",
  "Sumatera Selatan": "Sumatera",
  "Kepulauan Bangka Belitung": "Sumatera",
  "Bengkulu": "Sumatera",
  // Kalimantan provinces → generic "Kalimantan"
  "Kalimantan Barat": "Kalimantan",
  "Kalimantan Tengah": "Kalimantan",
  "Kalimantan Selatan": "Kalimantan",
  "Kalimantan Timur": "Kalimantan",
  "Kalimantan Utara": "Kalimantan",
  // Sulawesi provinces → generic "Sulawesi"
  "Sulawesi Utara": "Sulawesi",
  "Sulawesi Tengah": "Sulawesi",
  "Sulawesi Selatan": "Sulawesi",
  "Sulawesi Tenggara": "Sulawesi",
  "Gorontalo": "Sulawesi",
  "Sulawesi Barat": "Sulawesi"
};
const TODAY_STR = new Date(Date.now() + WIB_OFFSET).toISOString().split("T")[0];
const REGION_GROUPS = {
  "Sumatera": ["Aceh", "Sumatera Utara", "Sumatera Barat", "Riau", "Kepulauan Riau", "Jambi", "Sumatera Selatan", "Kepulauan Bangka Belitung", "Bengkulu", "Lampung"],
  "Jawa": ["DKI Jakarta", "Jawa Barat", "Banten", "Jawa Tengah", "DI Yogyakarta", "Jawa Timur"],
  "Bali & Nusa": ["Bali", "Nusa Tenggara Barat", "Nusa Tenggara Timur"],
  "Kalimantan": ["Kalimantan Barat", "Kalimantan Tengah", "Kalimantan Selatan", "Kalimantan Timur", "Kalimantan Utara"],
  "Sulawesi": ["Sulawesi Utara", "Sulawesi Tengah", "Sulawesi Selatan", "Sulawesi Tenggara", "Gorontalo", "Sulawesi Barat"],
  "Maluku & Papua": ["Maluku", "Maluku Utara", "Papua", "Papua Barat", "Papua Tengah", "Papua Pegunungan", "Papua Selatan", "Papua Barat Daya"]
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } }
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } }
};
function formatShortDate(dateStr) {
  const d = /* @__PURE__ */ new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
}
function MarketPriceDashboard() {
  var _a;
  const { profile, tenant } = useAuth();
  isOwner(profile) || isStaff(profile) || isSuperadmin(profile);
  const [selectedProvince, setSelectedProvince] = useState(
    (tenant == null ? void 0 : tenant.province) || "Jawa Tengah"
  );
  const [trendPeriod, setTrendPeriod] = useState("monthly");
  const { data: scrapResult, isLoading: scraperLoading } = useQuery({
    queryKey: ["dashboard-market-prices", selectedProvince],
    queryFn: async () => {
      const isAll = selectedProvince === "Seluruh Indonesia";
      let q = supabase.from("market_prices").select("price_date, farm_gate_price, buyer_price, region, source").eq("is_deleted", false).not("source", "ilike", "arboge_%").gte("price_date", format(subDays(/* @__PURE__ */ new Date(), 45), "yyyy-MM-dd")).order("price_date", { ascending: false });
      if (!isAll) q = q.ilike("region", selectedProvince);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).filter((r) => r.farm_gate_price > 1e3 || r.buyer_price > 1e3).map((r) => ({
        ...r,
        avg_buy_price: r.farm_gate_price,
        avg_sell_price: r.buyer_price,
        broker_margin: (r.buyer_price || 0) - (r.farm_gate_price || 0)
      }));
    },
    staleTime: 60 * 1e3
  });
  const { data: arbogeMap } = useQuery({
    queryKey: ["dashboard-arboge-prices", selectedProvince],
    queryFn: async () => {
      const isAll = selectedProvince === "Seluruh Indonesia";
      const arbogeRegion = PROVINCE_TO_ARBOGE_REGION[selectedProvince] || selectedProvince;
      let q = supabase.from("market_prices").select("price_date, farm_gate_price, region, source").eq("is_deleted", false).in("source", ["arboge_referensi", "arboge_realisasi"]).gte("price_date", format(subDays(/* @__PURE__ */ new Date(), 45), "yyyy-MM-dd")).order("price_date", { ascending: false });
      if (!isAll) q = q.ilike("region", arbogeRegion);
      const { data } = await q;
      return (data || []).filter((r) => r.farm_gate_price > 1e3).reduce((acc, r) => {
        const existing = acc[r.price_date];
        if (!existing || r.source === "arboge_realisasi") acc[r.price_date] = r;
        return acc;
      }, {});
    },
    staleTime: 60 * 1e3
  });
  const { trendStartDate, trendEndDate, trendLabel } = useMemo(() => {
    const now = /* @__PURE__ */ new Date();
    let start, end;
    if (trendPeriod === "weekly") {
      start = startOfWeek(now, { weekStartsOn: 1 });
      end = now;
    } else {
      start = startOfMonth(now);
      end = now;
    }
    return {
      trendStartDate: format(start, "yyyy-MM-dd"),
      trendEndDate: format(end, "yyyy-MM-dd"),
      trendLabel: trendPeriod === "weekly" ? "Minggu Ini" : "Bulan Ini"
    };
  }, [trendPeriod]);
  const { data: platformRpc, isLoading: rpcLoading } = useQuery({
    queryKey: ["dashboard-platform-rpc", selectedProvince],
    queryFn: async () => {
      const target = selectedProvince === "Seluruh Indonesia" ? "%" : selectedProvince;
      const { data } = await supabase.rpc("get_province_price_trends", {
        p_province: target,
        p_start_date: format(subDays(/* @__PURE__ */ new Date(), 45), "yyyy-MM-dd"),
        p_end_date: format(/* @__PURE__ */ new Date(), "yyyy-MM-dd")
      });
      return (data || []).reduce((acc, r) => {
        acc[r.price_date] = r;
        return acc;
      }, {});
    },
    staleTime: 60 * 1e3
  });
  const { data: activityMap } = useQuery({
    queryKey: ["dashboard-market-stats"],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_public_market_stats");
      return data || {};
    },
    staleTime: 1e3 * 60 * 15
  });
  const unifiedData = useMemo(() => {
    const rawMap = /* @__PURE__ */ new Map();
    for (const row of scrapResult || []) if (!rawMap.has(row.price_date)) rawMap.set(row.price_date, row);
    const dates = /* @__PURE__ */ new Set([
      ...rawMap.keys(),
      ...Object.keys(platformRpc || {}),
      ...Object.keys(arbogeMap || {})
    ]);
    return [...dates].sort().map((dStr) => {
      var _a2;
      const s = rawMap.get(dStr);
      const p = platformRpc == null ? void 0 : platformRpc[dStr];
      const chickin = (s == null ? void 0 : s.avg_buy_price) > 1e3 ? s.avg_buy_price : null;
      const arboge = ((_a2 = arbogeMap == null ? void 0 : arbogeMap[dStr]) == null ? void 0 : _a2.farm_gate_price) > 1e3 ? arbogeMap[dStr].farm_gate_price : null;
      const pBeli = (p == null ? void 0 : p.avg_buy) > 1e3 ? Math.round(p.avg_buy) : null;
      const pJual = (p == null ? void 0 : p.avg_sell) > 1e3 ? Math.round(p.avg_sell) : null;
      const finalBeli = pBeli || chickin || 0;
      const finalJual = pJual || (s == null ? void 0 : s.avg_sell_price) || (chickin ? chickin + 2e3 : 0);
      return {
        date: dStr,
        price_date: dStr,
        displayDate: formatShortDate(dStr),
        chickin,
        arboge,
        platformBeli: pBeli,
        platformJual: pJual,
        avg_buy_price: finalBeli,
        avg_sell_price: finalJual,
        broker_margin: finalJual > 0 && finalBeli > 0 ? finalJual - finalBeli : 0,
        source: p ? "transaction" : (s == null ? void 0 : s.source) || "auto_scraper"
      };
    }).filter((d) => d.chickin || d.arboge || d.platformBeli || d.platformJual);
  }, [scrapResult, platformRpc, arbogeMap]);
  const trendData = useMemo(() => {
    return unifiedData.filter((d) => d.date >= trendStartDate && d.date <= trendEndDate);
  }, [unifiedData, trendStartDate, trendEndDate]);
  const dedupedPrices = useMemo(() => [...unifiedData].reverse(), [unifiedData]);
  const latestRow = dedupedPrices[0] ?? null;
  const prevRow = dedupedPrices[1] ?? null;
  latestRow && prevRow ? latestRow.avg_buy_price - prevRow.avg_buy_price : 0;
  latestRow && prevRow ? latestRow.avg_sell_price - prevRow.avg_sell_price : 0;
  useMemo(() => {
    const recent = dedupedPrices.slice(0, 7).filter((r) => r.broker_margin > 0);
    if (!recent.length) return 0;
    return Math.round(recent.reduce((s, r) => s + r.broker_margin, 0) / recent.length);
  }, [dedupedPrices]);
  ((_a = trendData == null ? void 0 : trendData[trendData.length - 1]) == null ? void 0 : _a.delta) ?? 0;
  const latestTrend = trendData == null ? void 0 : trendData[trendData.length - 1];
  (latestTrend == null ? void 0 : latestTrend.avg_buy_price) && (latestTrend == null ? void 0 : latestTrend.chickin) ? latestTrend.avg_buy_price - latestTrend.chickin : null;
  return /* @__PURE__ */ jsxs("div", { className: "bg-[#06090F] min-h-screen pb-28 relative overflow-hidden", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/4 rounded-full blur-[140px] pointer-events-none" }),
    /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/3 rounded-full blur-[120px] pointer-events-none" }),
    /* @__PURE__ */ jsx(
      motion.section,
      {
        variants: stagger,
        initial: "hidden",
        animate: "visible",
        className: "px-6 pt-10 pb-6 relative z-10",
        children: /* @__PURE__ */ jsxs(motion.div, { variants: fadeUp, className: "flex flex-col md:flex-row md:items-center justify-between gap-6", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
              /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" }),
              /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]", children: "Live Market Intelligence" })
            ] }),
            /* @__PURE__ */ jsx("h1", { className: "text-3xl font-display font-black text-white tracking-tight uppercase leading-none", children: "Harga Pasar" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-[#4B6478] font-medium mt-1.5 max-w-md", children: "Data harga harian broiler berdasarkan scraper + transaksi nyata platform." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 flex-wrap", children: [
            /* @__PURE__ */ jsx(
              ProvinceSelector,
              {
                selected: selectedProvince,
                onSelect: setSelectedProvince,
                activityMap
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 flex items-center gap-2.5", children: [
              /* @__PURE__ */ jsx(Clock, { size: 13, className: "text-[#4B6478]" }),
              /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-slate-300", children: latestRow ? formatDate(latestRow.price_date) : "Belum ada data" })
            ] })
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ jsxs("section", { className: "px-6 grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 space-y-6", children: [
        /* @__PURE__ */ jsx(motion.div, { variants: fadeUp, initial: "hidden", animate: "visible", children: /* @__PURE__ */ jsxs(Card, { className: "p-6 md:p-8 bg-[#0C1319] border-white/5 rounded-[28px] relative overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(2, 26, 2,0.04)_0%,transparent_70%)] pointer-events-none" }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 mb-8 relative z-10", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap justify-between items-start gap-3", children: [
              "                  ",
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" }),
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]", children: "Data Real Platform + Referensi Pasar" })
                ] }),
                /* @__PURE__ */ jsx("h2", { className: "text-xl md:text-2xl font-black text-white tracking-tight", children: "Hybrid Market Insight" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex bg-black/40 p-1 rounded-xl border border-white/5 shrink-0", children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => setTrendPeriod("weekly"),
                    className: cn(
                      "px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all",
                      trendPeriod === "weekly" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-[#4B6478] hover:text-[#94A3B8]"
                    ),
                    children: "Mingguan"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => setTrendPeriod("monthly"),
                    className: cn(
                      "px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ml-0.5",
                      trendPeriod === "monthly" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-[#4B6478] hover:text-[#94A3B8]"
                    ),
                    children: "Bulanan"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-4", children: [
              /* @__PURE__ */ jsx(LegendItem, { color: "#F59E0B", label: "Chickin.id (Ref)", dashed: true }),
              /* @__PURE__ */ jsx(LegendItem, { color: "#F97316", label: "Arboge.com (Ref)", dashed: true }),
              /* @__PURE__ */ jsx(LegendItem, { color: "var(--brand-500)", label: "Beli (TernakOS)" }),
              /* @__PURE__ */ jsx(LegendItem, { color: "#818CF8", label: "Jual (TernakOS)" }),
              /* @__PURE__ */ jsxs("span", { className: "ml-auto text-[9px] font-black text-[#4B6478] uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-lg border border-white/10", children: [
                selectedProvince,
                " · ",
                trendLabel
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-[260px] w-full relative z-10", children: rpcLoading ? /* @__PURE__ */ jsx("div", { className: "h-full flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" }) }) : /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(AreaChart, { data: trendData, children: [
            /* @__PURE__ */ jsxs("defs", { children: [
              /* @__PURE__ */ jsxs("linearGradient", { id: "gradBuy", x1: "0", y1: "0", x2: "0", y2: "1", children: [
                /* @__PURE__ */ jsx("stop", { offset: "5%", stopColor: "var(--brand-500)", stopOpacity: 0.15 }),
                /* @__PURE__ */ jsx("stop", { offset: "95%", stopColor: "var(--brand-500)", stopOpacity: 0 })
              ] }),
              /* @__PURE__ */ jsxs("linearGradient", { id: "gradSell", x1: "0", y1: "0", x2: "0", y2: "1", children: [
                /* @__PURE__ */ jsx("stop", { offset: "5%", stopColor: "#818CF8", stopOpacity: 0.1 }),
                /* @__PURE__ */ jsx("stop", { offset: "95%", stopColor: "#818CF8", stopOpacity: 0 })
              ] })
            ] }),
            /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false, stroke: "rgba(255,255,255,0.03)" }),
            /* @__PURE__ */ jsx(XAxis, { dataKey: "displayDate", axisLine: false, tickLine: false, tick: { fill: "#4B6478", fontSize: 10, fontWeight: 800 }, dy: 10, interval: trendPeriod === "monthly" ? 4 : 0 }),
            /* @__PURE__ */ jsx(YAxis, { hide: true, domain: ["dataMin - 3000", "dataMax + 2000"] }),
            /* @__PURE__ */ jsx(Tooltip, { content: /* @__PURE__ */ jsx(HybridTooltip, {}) }),
            /* @__PURE__ */ jsx(Area, { type: "monotone", dataKey: "chickin", stroke: "#F59E0B", strokeWidth: 2, strokeDasharray: "5 4", fill: "transparent", connectNulls: true, dot: false }),
            /* @__PURE__ */ jsx(Area, { type: "monotone", dataKey: "arboge", stroke: "#F97316", strokeWidth: 2, strokeDasharray: "3 3", fill: "transparent", connectNulls: true, dot: false }),
            /* @__PURE__ */ jsx(Area, { type: "monotone", dataKey: "platformJual", stroke: "#818CF8", strokeWidth: 2, fillOpacity: 1, fill: "url(#gradSell)", connectNulls: true, activeDot: { r: 5, stroke: "#0C1319", strokeWidth: 2, fill: "#818CF8" } }),
            /* @__PURE__ */ jsx(Area, { type: "monotone", dataKey: "platformBeli", stroke: "var(--brand-500)", strokeWidth: 3, fillOpacity: 1, fill: "url(#gradBuy)", connectNulls: true, activeDot: { r: 6, stroke: "#0C1319", strokeWidth: 2, fill: "var(--brand-500)" } })
          ] }) }) })
        ] }) }),
        /* @__PURE__ */ jsxs(motion.div, { variants: fadeUp, initial: "hidden", animate: "visible", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-1 mb-3", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-[11px] font-black text-[#4B6478] uppercase tracking-[0.2em]", children: "Riwayat Update" }),
            /* @__PURE__ */ jsxs("span", { className: "text-[10px] font-bold text-[#4B6478]", children: [
              dedupedPrices.length,
              " records"
            ] })
          ] }),
          /* @__PURE__ */ jsx(Card, { className: "bg-[#0C1319] border-white/5 rounded-[24px] overflow-hidden", children: /* @__PURE__ */ jsxs(ScrollArea, { className: "w-full", children: [
            /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
              /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-white/5 bg-white/[0.02]", children: [
                /* @__PURE__ */ jsx("th", { className: "p-4 text-[10px] font-black text-[#4B6478] uppercase tracking-widest", children: "Tanggal" }),
                /* @__PURE__ */ jsx("th", { className: "p-4 text-[10px] font-black text-[#4B6478] uppercase text-right", children: "Beli (Kandang)" }),
                /* @__PURE__ */ jsx("th", { className: "p-4 text-[10px] font-black text-[#4B6478] uppercase text-right", children: "Jual (RPA/Pasar)" }),
                /* @__PURE__ */ jsx("th", { className: "p-4 text-[10px] font-black text-[#4B6478] uppercase text-right", children: "Margin" }),
                /* @__PURE__ */ jsx("th", { className: "p-4 text-[10px] font-black text-[#4B6478] uppercase text-center", children: "Sumber" })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { children: scraperLoading ? Array(6).fill(0).map((_, i) => /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "p-4", children: /* @__PURE__ */ jsx(Skeleton, { className: "h-4 w-full bg-white/5" }) }) }, i)) : !dedupedPrices.length ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsxs("td", { colSpan: 5, className: "p-8 text-center text-[#4B6478] text-sm font-bold", children: [
                "Belum ada data untuk ",
                selectedProvince
              ] }) }) : dedupedPrices.slice(0, 14).map((p, i) => /* @__PURE__ */ jsxs("tr", { className: cn("border-b border-white/5 transition-colors", p.price_date === TODAY_STR ? "bg-emerald-500/5" : "hover:bg-white/[0.02]"), children: [
                /* @__PURE__ */ jsxs("td", { className: "p-4 text-xs font-bold text-slate-300 flex items-center gap-2", children: [
                  p.price_date === TODAY_STR && /* @__PURE__ */ jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" }),
                  formatDate(p.price_date, "dd MMM yyyy")
                ] }),
                /* @__PURE__ */ jsx("td", { className: "p-4 text-xs font-bold text-slate-400 text-right tabular-nums", children: formatIDR(p.avg_buy_price).replace("Rp ", "") }),
                /* @__PURE__ */ jsx("td", { className: "p-4 text-xs font-black text-white text-right tabular-nums", children: formatIDR(p.avg_sell_price).replace("Rp ", "") }),
                /* @__PURE__ */ jsx("td", { className: "p-4 text-xs font-black text-emerald-400 text-right tabular-nums", children: formatIDR(p.broker_margin).replace("Rp ", "") }),
                /* @__PURE__ */ jsx("td", { className: "p-4 text-center", children: /* @__PURE__ */ jsx(SourceBadge, { source: p.source }) })
              ] }, i)) })
            ] }),
            /* @__PURE__ */ jsx(ScrollBar, { orientation: "horizontal" })
          ] }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsx(motion.div, { variants: fadeUp, initial: "hidden", animate: "visible", children: /* @__PURE__ */ jsxs(Card, { className: "bg-[#0C1319] border border-white/5 rounded-[28px] overflow-hidden relative", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(2, 26, 2,0.05),transparent_60%)] pointer-events-none" }),
          /* @__PURE__ */ jsxs(CardContent, { className: "p-6 relative z-10", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
              /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400", children: /* @__PURE__ */ jsx(ShieldCheck, { size: 15 }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em]", children: "Metodologi Data" }),
                /* @__PURE__ */ jsx("h3", { className: "text-sm font-black text-white", children: "Hybrid Intelligence" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsx(SourceInfoRow, { color: "#F59E0B", label: "Chickin.id", desc: "Scraper harian farm gate price", badge: "Auto", badgeColor: "text-amber-400 bg-amber-500/10", dotted: true }),
              /* @__PURE__ */ jsx(SourceInfoRow, { color: "#F97316", label: "Arboge.com", desc: "Referensi harga broker regional", badge: "Reference", badgeColor: "text-orange-400 bg-orange-500/10", dotted: true }),
              /* @__PURE__ */ jsx(
                SourceInfoRow,
                {
                  isHybrid: true,
                  label: "Transaksi Platform",
                  desc: "Rata-rata transaksi broker TernakOS",
                  badge: "Verified",
                  badgeColor: "text-emerald-400 bg-emerald-500/10"
                }
              )
            ] }),
            /* @__PURE__ */ jsx("div", { className: "mt-5 pt-4 border-t border-white/5", children: /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-[#4B6478] font-medium leading-relaxed", children: [
              "⚠️ Data bersifat ",
              /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "read-only" }),
              ". Digunakan sebagai acuan posisi beli dan jual broker di pasar regional."
            ] }) })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs(motion.div, { variants: fadeUp, initial: "hidden", animate: "visible", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-[11px] font-black text-[#4B6478] uppercase tracking-[0.2em] px-1 mb-3", children: "Wawasan Komoditas" }),
          /* @__PURE__ */ jsx("div", { className: "space-y-3", children: [
            { title: "TernakOS vs Chickin", desc: "Kami fokus pada data transaksi nyata broker.", icon: Activity },
            { title: "Positioning Harga", desc: "Bandingkan posisi beli Anda vs referensi pasar.", icon: ShieldCheck }
          ].map((item, i) => /* @__PURE__ */ jsx(Card, { className: "bg-[#111C24] border border-white/5 rounded-2xl group cursor-default", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/10 group-hover:text-emerald-400 transition-colors text-[#4B6478]", children: /* @__PURE__ */ jsx(item.icon, { size: 17 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "text-[12px] font-black text-white uppercase tracking-tight", children: item.title }),
              /* @__PURE__ */ jsx("p", { className: "text-[11px] text-[#4B6478] font-medium leading-relaxed mt-0.5", children: item.desc })
            ] })
          ] }) }, i)) })
        ] })
      ] })
    ] })
  ] });
}
function ProvinceSelector({ selected, onSelect, activityMap }) {
  const [open, setOpen] = useState(false);
  return /* @__PURE__ */ jsxs(Popover, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(
      Button,
      {
        variant: "outline",
        className: "h-10 bg-[#111C24] border-white/10 font-black rounded-xl flex justify-between items-center px-4 gap-3 uppercase tracking-widest hover:bg-white/5 transition-all text-[10px] min-w-[200px]",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(MapPin, { size: 13, className: "text-emerald-400 shrink-0" }),
            /* @__PURE__ */ jsx("span", { className: "truncate", children: selected })
          ] }),
          /* @__PURE__ */ jsx(ChevronsUpDown, { size: 13, className: "opacity-50 shrink-0" })
        ]
      }
    ) }),
    /* @__PURE__ */ jsx(PopoverContent, { className: "w-[300px] p-0 bg-[#0C1319] border-white/10 shadow-2xl", children: /* @__PURE__ */ jsxs(Command, { className: "bg-transparent", children: [
      /* @__PURE__ */ jsx(CommandInput, { placeholder: "Cari provinsi...", className: "h-11 font-bold" }),
      /* @__PURE__ */ jsxs(CommandList, { className: "max-h-[350px]", children: [
        /* @__PURE__ */ jsx(CommandEmpty, { className: "py-4 text-center text-[10px] font-black uppercase opacity-50", children: "Tidak ditemukan." }),
        /* @__PURE__ */ jsx(CommandGroup, { heading: "Akses Cepat", className: "px-2 text-[9px] font-black uppercase tracking-widest text-[#4B6478] opacity-50", children: /* @__PURE__ */ jsxs(CommandItem, { onSelect: () => {
          onSelect("Seluruh Indonesia");
          setOpen(false);
        }, className: "flex items-center gap-2 rounded-lg cursor-pointer text-[10px] font-bold uppercase py-2.5", children: [
          /* @__PURE__ */ jsx(MapPin, { size: 12, className: "text-emerald-500" }),
          " Seluruh Indonesia"
        ] }) }),
        Object.entries(REGION_GROUPS).map(([group, provinces]) => /* @__PURE__ */ jsx(CommandGroup, { heading: group, className: "px-2 mt-2 text-[9px] font-black uppercase tracking-widest text-[#4B6478]", children: provinces.map((p) => /* @__PURE__ */ jsxs(
          CommandItem,
          {
            value: p,
            onSelect: () => {
              onSelect(p);
              setOpen(false);
            },
            className: "flex items-center justify-between rounded-lg cursor-pointer text-[10px] font-bold uppercase py-2.5 hover:bg-emerald-500/10 group",
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(MapPin, { size: 12, className: cn("transition-colors", selected === p ? "text-emerald-500" : "text-[#4B6478] group-hover:text-emerald-500") }),
                /* @__PURE__ */ jsx("span", { className: cn(selected === p ? "text-emerald-500" : "text-white"), children: p })
              ] }),
              (activityMap == null ? void 0 : activityMap[p]) && /* @__PURE__ */ jsxs("span", { className: "text-[8px] text-emerald-500/70 font-black", children: [
                "🔥 ",
                activityMap[p],
                " TRX"
              ] })
            ]
          },
          p
        )) }, group))
      ] })
    ] }) })
  ] });
}
function HybridTooltip({ active, payload }) {
  if (!active || !(payload == null ? void 0 : payload.length)) return null;
  const d = payload[0].payload;
  const spread = d.platformBeli && d.chickin ? d.chickin - d.platformBeli : null;
  const margin = d.platformBeli && d.platformJual ? d.platformJual - d.platformBeli : null;
  return /* @__PURE__ */ jsxs("div", { className: "bg-bg-1 border border-border-subtle p-4 rounded-2xl shadow-2xl min-w-[200px] backdrop-blur-xl", children: [
    /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-3", children: d.displayDate }),
    /* @__PURE__ */ jsx("div", { className: "space-y-2.5", children: [
      { label: "Chickin.id (Ref)", val: d.chickin, color: "text-amber-500 font-bold" },
      { label: "Arboge.com (Ref)", val: d.arboge, color: "text-orange-500 font-bold" },
      { label: "Beli (TernakOS)", val: d.platformBeli, color: "text-emerald-600 dark:text-brand-500 font-black" },
      { label: "Jual (TernakOS)", val: d.platformJual, color: "text-indigo-600 dark:text-indigo-400 font-black" }
    ].map(({ label, val, color }) => /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center gap-4", children: [
      /* @__PURE__ */ jsx("span", { className: "text-[11px] text-text-secondary font-bold", children: label }),
      /* @__PURE__ */ jsx("span", { className: cn("text-sm font-black tabular-nums", val ? color : "text-text-muted"), children: val ? formatIDR(val) : "—" })
    ] }, label)) }),
    (spread != null || margin != null) && /* @__PURE__ */ jsxs("div", { className: "mt-3 pt-3 border-t border-border-subtle space-y-1.5", children: [
      spread != null && /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
        /* @__PURE__ */ jsx("span", { className: "text-[9px] font-black text-text-muted uppercase tracking-wider", children: "Efisiensi Beli" }),
        /* @__PURE__ */ jsxs("span", { className: cn("text-xs font-black tabular-nums", spread >= 0 ? "text-emerald-600 dark:text-brand-500" : "text-rose-600 dark:text-rose-400"), children: [
          spread > 0 ? "+" : "",
          formatIDR(spread)
        ] })
      ] }),
      margin != null && /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
        /* @__PURE__ */ jsx("span", { className: "text-[9px] font-black text-text-muted uppercase tracking-wider", children: "Margin/kg" }),
        /* @__PURE__ */ jsxs("span", { className: cn("text-xs font-black tabular-nums", margin >= 0 ? "text-emerald-600 dark:text-brand-500" : "text-rose-600 dark:text-rose-400"), children: [
          margin > 0 ? "+" : "",
          formatIDR(margin)
        ] })
      ] })
    ] })
  ] });
}
function SourceBadge({ source }) {
  const map = {
    auto_scraper: { label: "Scraped", color: "text-sky-400 bg-sky-500/10" },
    transaction: { label: "Verified", color: "text-emerald-400 bg-emerald-500/10" },
    arboge_referensi: { label: "Arboge Ref", color: "text-amber-400 bg-amber-500/10" },
    arboge_realisasi: { label: "Arboge Real", color: "text-orange-400 bg-orange-500/10" }
  };
  const s = map[source] || { label: source || "—", color: "text-[#4B6478] bg-white/5" };
  return /* @__PURE__ */ jsx("span", { className: cn("text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-lg", s.color), children: s.label });
}
function LegendItem({ color, label, dashed = false }) {
  return /* @__PURE__ */ jsxs("div", { className: "hidden md:flex items-center gap-2", children: [
    dashed ? /* @__PURE__ */ jsx("div", { className: "w-4 h-0 border-t-2 border-dashed", style: { borderColor: color } }) : /* @__PURE__ */ jsx("div", { className: "w-2 h-2 rounded-full", style: { background: color } }),
    /* @__PURE__ */ jsx("span", { className: "text-[9px] font-black text-[#4B6478] uppercase tracking-wider", children: label })
  ] });
}
function SourceInfoRow({ color, label, desc, badge, badgeColor, dotted, isHybrid }) {
  return /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
    isHybrid ? /* @__PURE__ */ jsxs("div", { className: "flex gap-1 mt-2 shrink-0", children: [
      /* @__PURE__ */ jsx("div", { className: "w-2 h-2 rounded-full", style: { background: "#021a02" }, title: "Beli" }),
      /* @__PURE__ */ jsx("div", { className: "w-2 h-2 rounded-full", style: { background: "#818CF8" }, title: "Jual" })
    ] }) : /* @__PURE__ */ jsx(
      "div",
      {
        className: cn("shrink-0 mt-1.5", dotted ? "w-3 h-0 border-t-2 border-dashed" : "w-2 h-2 rounded-full"),
        style: { borderColor: color, background: dotted ? "transparent" : color }
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-0.5", children: [
        /* @__PURE__ */ jsx("span", { className: "text-[11px] font-black text-white uppercase tracking-tight", children: label }),
        /* @__PURE__ */ jsx("span", { className: cn("text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded", badgeColor), children: badge })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-[10px] text-[#4B6478] font-medium leading-relaxed", children: desc })
    ] })
  ] });
}
export {
  MarketPriceDashboard as default
};
