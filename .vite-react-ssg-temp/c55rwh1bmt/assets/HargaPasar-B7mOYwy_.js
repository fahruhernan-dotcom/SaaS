import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Info, History, Zap, ChevronUp, ChevronDown, ChevronsUpDown, Check } from "lucide-react";
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip as Tooltip$1, Area } from "recharts";
import { u as useAuth, c as useMediaQuery, s as supabase, au as safeNum, aB as formatDate, b0 as TooltipProvider, aK as Skeleton, aw as Card, b1 as Tooltip, b2 as TooltipTrigger, aA as Badge, b3 as TooltipContent, ao as Label, aq as formatIDR, a1 as cn, b4 as Collapsible, b5 as CollapsibleTrigger, b6 as CollapsibleContent, aN as ScrollArea, aO as ScrollBar, P as Popover, h as PopoverTrigger, a7 as Button, n as PROVINCES, i as PopoverContent, C as Command, j as CommandInput, k as CommandList, l as CommandEmpty, m as CommandGroup, o as CommandItem, a0 as Input } from "../main.mjs";
import { toast } from "sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import "vite-react-ssg";
import "react-router-dom";
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
import "@radix-ui/react-tabs";
import "@radix-ui/react-collapsible";
import "@radix-ui/react-select";
function HargaPasar() {
  const { profile, tenant } = useAuth();
  (profile == null ? void 0 : profile.role) === "view_only";
  const canWrite = (profile == null ? void 0 : profile.role) === "owner" || (profile == null ? void 0 : profile.role) === "staff";
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [isManualOpen, setIsManualOpen] = useState(false);
  const queryClient = useQueryClient();
  const today = new Date((/* @__PURE__ */ new Date()).getTime() + 7 * 60 * 60 * 1e3).toISOString().split("T")[0];
  const { data: prices, isLoading } = useQuery({
    queryKey: ["market-prices"],
    queryFn: async () => {
      const { data, error } = await supabase.from("market_prices").select("*").or("is_deleted.eq.false,is_deleted.is.null").neq("source", "arboge_scraper").order("price_date", { ascending: false }).order("region", { ascending: false }).order("source", { ascending: false }).limit(50);
      if (error) throw error;
      const cleanedData = (data || []).map((row) => ({
        ...row,
        avg_buy_price: safeNum(row.avg_buy_price) || safeNum(row.farm_gate_price),
        avg_sell_price: safeNum(row.avg_sell_price) || safeNum(row.buyer_price)
      }));
      return cleanedData.filter((x) => x.avg_sell_price >= x.avg_buy_price);
    }
  });
  useEffect(() => {
    const channel = supabase.channel("market-prices-live").on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "market_prices"
    }, () => {
      queryClient.invalidateQueries({ queryKey: ["market-prices"] });
      toast.info("📊 Harga pasar baru tersedia", {
        icon: "💡"
      });
    }).subscribe();
    return () => supabase.removeChannel(channel);
  }, [queryClient]);
  const { data: liveData } = useQuery({
    queryKey: ["live-market-price", tenant == null ? void 0 : tenant.id, today],
    queryFn: async () => {
      const { data: sales } = await supabase.from("sales").select("price_per_kg").eq("tenant_id", tenant.id).eq("transaction_date", today).eq("is_deleted", false).gt("price_per_kg", 0);
      const { data: purchases } = await supabase.from("purchases").select("price_per_kg").eq("tenant_id", tenant.id).eq("transaction_date", today).eq("is_deleted", false).gt("price_per_kg", 0);
      const MIN_REALISTIC_PRICE = 15e3;
      const s = (sales || []).filter((x) => Number(x.price_per_kg) >= MIN_REALISTIC_PRICE);
      const p = (purchases || []).filter((x) => Number(x.price_per_kg) >= MIN_REALISTIC_PRICE);
      const avgSell = s.length > 0 ? s.reduce((acc, x) => acc + (Number(x.price_per_kg) || 0), 0) / s.length : 0;
      const avgBuy = p.length > 0 ? p.reduce((acc, x) => acc + (Number(x.price_per_kg) || 0), 0) / p.length : 0;
      return {
        avg_sell_price: avgSell,
        avg_buy_price: avgBuy,
        transaction_count: s.length + p.length
      };
    },
    enabled: !!(tenant == null ? void 0 : tenant.id)
  });
  const { data: arbogeData } = useQuery({
    queryKey: ["arboge-dashboard-prices"],
    queryFn: async () => {
      const { data } = await supabase.from("market_prices").select("price_date, farm_gate_price, source").eq("is_deleted", false).in("source", ["arboge_referensi", "arboge_realisasi"]).order("price_date", { ascending: false }).limit(60);
      return (data || []).reduce((acc, r) => {
        const existing = acc[r.price_date];
        if (!existing || r.source === "arboge_realisasi") {
          acc[r.price_date] = r.farm_gate_price;
        }
        return acc;
      }, {});
    },
    staleTime: 60 * 1e3
  });
  const todayPrice = useMemo(() => {
    if (liveData && liveData.transaction_count > 0) {
      return {
        price_date: today,
        avg_buy_price: liveData.avg_buy_price,
        avg_sell_price: liveData.avg_sell_price,
        transaction_count: liveData.transaction_count
      };
    }
    const marketRecord = prices == null ? void 0 : prices.find((p) => p.price_date === today);
    if (marketRecord) return marketRecord;
    if (liveData && liveData.transaction_count === 0) {
      return null;
    }
    return null;
  }, [liveData, prices, today]);
  const yesterdayPrice = useMemo(() => {
    return (prices == null ? void 0 : prices.find((p) => p.price_date < today)) || null;
  }, [prices, today]);
  const buyDiff = todayPrice && yesterdayPrice ? todayPrice.avg_buy_price - yesterdayPrice.avg_buy_price : 0;
  const sellDiff = todayPrice && yesterdayPrice ? todayPrice.avg_sell_price - yesterdayPrice.avg_sell_price : 0;
  const margin = todayPrice ? todayPrice.avg_sell_price - todayPrice.avg_buy_price : 0;
  const chartData = useMemo(() => {
    if (!prices || prices.length === 0) return [];
    const uniqueDates = Array.from(new Set(prices.map((p) => p.price_date))).sort().slice(-14);
    return uniqueDates.map((date) => {
      const datePrices = prices.filter((p2) => p2.price_date === date);
      const p = datePrices[0];
      return {
        date: formatDate(date, "dd MMM"),
        beli: p.avg_buy_price,
        jual: p.avg_sell_price,
        margin: p.avg_sell_price - p.avg_buy_price,
        arboge: (arbogeData == null ? void 0 : arbogeData[date]) || null
      };
    });
  }, [prices, arbogeData]);
  return /* @__PURE__ */ jsx(TooltipProvider, { children: /* @__PURE__ */ jsxs(
    motion.div,
    {
      initial: { opacity: 0, y: 12 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
      className: cn("bg-[#06090F] min-h-screen pb-24", isDesktop && "pb-10"),
      children: [
        !isDesktop && /* @__PURE__ */ jsxs("header", { className: "px-5 pt-8 pb-4 border-b border-white/5 sticky top-0 bg-[#06090F]/80 backdrop-blur-md z-30 flex justify-between items-center", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h1", { className: "font-display text-xl font-black text-white tracking-tight leading-none uppercase", children: "Harga Pasar" }),
            /* @__PURE__ */ jsxs("p", { className: "text-[11px] font-bold text-[#4B6478] uppercase mt-1", children: [
              "Broiler ",
              (todayPrice == null ? void 0 : todayPrice.region) || "Nasional"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20", children: [
            /* @__PURE__ */ jsx("div", { className: "w-2 h-2 bg-emerald-500 rounded-full animate-pulse" }),
            /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black text-emerald-400 uppercase tracking-widest", children: "Live" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsx("section", { className: "px-5 pt-4", children: isLoading ? /* @__PURE__ */ jsx(Skeleton, { className: "h-48 w-full rounded-[20px] bg-secondary/10" }) : todayPrice ? /* @__PURE__ */ jsxs(Card, { className: "bg-gradient-to-br from-[#0C1319] to-[#111C24] border-emerald-500/20 rounded-[24px] p-5 shadow-2xl relative overflow-hidden group", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/5 blur-[60px] rounded-full group-hover:bg-emerald-500/10 transition-colors duration-700" }),
            /* @__PURE__ */ jsx("div", { className: "flex justify-between items-center mb-6 relative z-10", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1", children: [
              /* @__PURE__ */ jsx("span", { className: "text-[11px] font-black text-[#4B6478] uppercase tracking-[0.2em]", children: "Harga Broiler Hari Ini" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxs("span", { className: "text-[11px] font-bold text-white/40", children: [
                  formatDate(todayPrice.price_date),
                  " • ",
                  todayPrice.region
                ] }),
                todayPrice.source === "auto_scraper" ? /* @__PURE__ */ jsxs(Tooltip, { children: [
                  /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "bg-white/5 border-white/10 text-[#4B6478] text-[9px] font-black px-1.5 py-0 rounded-md h-4 flex items-center gap-1 cursor-help", children: [
                    "CHICKIN",
                    /* @__PURE__ */ jsx(Info, { size: 10 })
                  ] }) }),
                  /* @__PURE__ */ jsx(TooltipContent, { side: "right", className: "bg-[#111C24] border-white/10 text-[10px] font-bold text-white/60", children: "Referensi harga dari chickin.id" })
                ] }) : todayPrice.source === "arboge_scraper" ? /* @__PURE__ */ jsxs(Tooltip, { children: [
                  /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "bg-orange-500/10 border-orange-500/20 text-orange-400 text-[9px] font-black px-1.5 py-0 rounded-md h-4 flex items-center gap-1 cursor-help", children: [
                    "ARBOGE",
                    /* @__PURE__ */ jsx(Info, { size: 10 })
                  ] }) }),
                  /* @__PURE__ */ jsx(TooltipContent, { side: "right", className: "bg-[#111C24] border-orange-500/20 text-[10px] font-bold text-orange-400", children: "Realisasi harga dari arboge.com" })
                ] }) : todayPrice.source === "manual" ? /* @__PURE__ */ jsxs(Tooltip, { children: [
                  /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 text-[9px] font-black px-1.5 py-0 rounded-md h-4 flex items-center gap-1 cursor-help", children: "MANUAL" }) }),
                  /* @__PURE__ */ jsx(TooltipContent, { side: "right", className: "bg-[#111C24] border-emerald-500/20 text-[10px] font-bold text-emerald-400", children: "Diinput oleh broker" })
                ] }) : null
              ] })
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4 relative z-10", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx(Label, { className: "text-[10px] font-black text-[#4B6478] uppercase tracking-widest", children: "Harga Beli" }),
                /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
                  /* @__PURE__ */ jsxs("span", { className: "font-display text-[26px] font-black text-white leading-none tracking-tighter", children: [
                    todayPrice.source === "auto_scraper" && "~",
                    todayPrice.avg_buy_price > 0 ? formatIDR(todayPrice.avg_buy_price) : "-"
                  ] }),
                  /* @__PURE__ */ jsx(ChangeIndicator, { diff: buyDiff })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-1 text-right", children: [
                /* @__PURE__ */ jsx(Label, { className: "text-[10px] font-black text-[#4B6478] uppercase tracking-widest", children: "Harga Jual" }),
                /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-end", children: [
                  /* @__PURE__ */ jsxs("span", { className: "font-display text-[26px] font-black text-emerald-400 leading-none tracking-tighter", children: [
                    (todayPrice.source === "auto_scraper" || todayPrice.source === "arboge_scraper") && "~",
                    todayPrice.avg_sell_price > 0 ? formatIDR(todayPrice.avg_sell_price) : "-"
                  ] }),
                  /* @__PURE__ */ jsx(ChangeIndicator, { diff: sellDiff })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-8 pt-5 border-t border-white/5 flex flex-col gap-1 relative z-10", children: [
              /* @__PURE__ */ jsxs("p", { className: cn(
                "font-display text-[16px] font-bold tracking-tight",
                margin > 2e3 ? "text-emerald-400" : margin >= 1e3 ? "text-amber-500" : "text-red-400"
              ), children: [
                "Margin Rata-rata: ",
                margin !== 0 ? `${formatIDR(margin)}/kg` : "-"
              ] }),
              todayPrice.source === "auto_scraper" ? /* @__PURE__ */ jsx("p", { className: "text-[11px] font-bold text-[#4B6478]", children: "estimasi +Rp 2.500 margin dari chickin.id" }) : todayPrice.source === "arboge_scraper" ? /* @__PURE__ */ jsx("p", { className: "text-[11px] font-bold text-[#4B6478]", children: "estimasi +Rp 2.500 margin (realisasi arboge.com)" }) : /* @__PURE__ */ jsxs("p", { className: "text-[11px] font-bold text-[#4B6478]", children: [
                "dari ",
                todayPrice.transaction_count,
                " transaksi hari ini"
              ] })
            ] })
          ] }) : /* @__PURE__ */ jsx(EmptyStateSmall, { icon: History, title: "Belum ada data hari ini", desc: "Harga akan diperbarui otomatis saat ada transaksi." }) }),
          canWrite && /* @__PURE__ */ jsx("section", { className: "px-5", children: /* @__PURE__ */ jsxs(Collapsible, { open: isManualOpen, onOpenChange: setIsManualOpen, className: "bg-[#111C24] border border-white/5 rounded-2xl overflow-hidden", children: [
            /* @__PURE__ */ jsx(CollapsibleTrigger, { asChild: true, children: /* @__PURE__ */ jsxs("button", { className: "w-full flex items-center justify-between p-4 hover:bg-secondary/5 transition-colors", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
                /* @__PURE__ */ jsx(Zap, { size: 16, className: "text-amber-500" }),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] font-black text-white/60 uppercase tracking_widest", children: "Update Harga Manual" })
              ] }),
              isManualOpen ? /* @__PURE__ */ jsx(ChevronUp, { size: 14, className: "text-white/20" }) : /* @__PURE__ */ jsx(ChevronDown, { size: 14, className: "text-white/20" })
            ] }) }),
            /* @__PURE__ */ jsx(CollapsibleContent, { className: "p-4 pt-0", children: /* @__PURE__ */ jsx(
              ManualPriceForm,
              {
                tenant,
                onSuccess: () => {
                  setIsManualOpen(false);
                  queryClient.invalidateQueries({ queryKey: ["market-prices"] });
                }
              }
            ) })
          ] }) }),
          /* @__PURE__ */ jsxs("section", { className: "px-5 space-y-4", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-[11px] font-black text-[#4B6478] uppercase tracking-[0.2em] px-1", children: "Trend 14 Hari Terakhir" }),
            /* @__PURE__ */ jsxs("div", { className: "h-[220px] w-full bg-[#111C24]/50 rounded-[28px] border border-white/5 p-4 pt-8", children: [
              /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(AreaChart, { data: chartData, margin: { top: 0, right: 0, left: -20, bottom: 0 }, children: [
                /* @__PURE__ */ jsxs("defs", { children: [
                  /* @__PURE__ */ jsxs("linearGradient", { id: "colorBeli", x1: "0", y1: "0", x2: "0", y2: "1", children: [
                    /* @__PURE__ */ jsx("stop", { offset: "5%", stopColor: "#4B6478", stopOpacity: 0.1 }),
                    /* @__PURE__ */ jsx("stop", { offset: "95%", stopColor: "#4B6478", stopOpacity: 0 })
                  ] }),
                  /* @__PURE__ */ jsxs("linearGradient", { id: "colorJual", x1: "0", y1: "0", x2: "0", y2: "1", children: [
                    /* @__PURE__ */ jsx("stop", { offset: "5%", stopColor: "#021a02", stopOpacity: 0.1 }),
                    /* @__PURE__ */ jsx("stop", { offset: "95%", stopColor: "#021a02", stopOpacity: 0 })
                  ] })
                ] }),
                /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.03)", vertical: false }),
                /* @__PURE__ */ jsx(
                  XAxis,
                  {
                    dataKey: "date",
                    axisLine: false,
                    tickLine: false,
                    tick: { fontSize: 9, fill: "#4B6478", fontWeight: 800 },
                    dy: 10
                  }
                ),
                /* @__PURE__ */ jsx(
                  YAxis,
                  {
                    axisLine: false,
                    tickLine: false,
                    tick: { fontSize: 9, fill: "#4B6478", fontWeight: 800 },
                    domain: ["dataMin - 1000", "dataMax + 1000"]
                  }
                ),
                /* @__PURE__ */ jsx(Tooltip$1, { content: /* @__PURE__ */ jsx(CustomTooltip, {}), cursor: { stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 } }),
                /* @__PURE__ */ jsx(
                  Area,
                  {
                    type: "monotone",
                    dataKey: "beli",
                    stroke: "#4B6478",
                    strokeWidth: 2,
                    fillOpacity: 1,
                    fill: "url(#colorBeli)"
                  }
                ),
                /* @__PURE__ */ jsx(
                  Area,
                  {
                    type: "monotone",
                    dataKey: "jual",
                    stroke: "#021a02",
                    strokeWidth: 2,
                    fillOpacity: 1,
                    fill: "url(#colorJual)"
                  }
                ),
                /* @__PURE__ */ jsx(
                  Area,
                  {
                    type: "monotone",
                    dataKey: "arboge",
                    stroke: "#F97316",
                    strokeWidth: 2,
                    strokeDasharray: "4 4",
                    fill: "transparent",
                    connectNulls: true,
                    dot: false
                  }
                )
              ] }) }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-center gap-6 mt-2 flex-wrap", children: [
                /* @__PURE__ */ jsx(LegendItem, { color: "#4B6478", label: "Beli" }),
                /* @__PURE__ */ jsx(LegendItem, { color: "#021a02", label: "Jual" }),
                /* @__PURE__ */ jsx(LegendItem, { color: "#F97316", label: "Arboge (Ref)", dashed: true })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("section", { className: "px-5 pb-10", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-[11px] font-black text-[#4B6478] uppercase tracking-[0.2em] px-1 mb-4", children: "Riwayat Harga" }),
            /* @__PURE__ */ jsx("div", { className: "bg-[#111C24] border border-white/5 rounded-2xl overflow-hidden shadow-xl", children: /* @__PURE__ */ jsxs(ScrollArea, { className: "w-full", children: [
              /* @__PURE__ */ jsxs("table", { className: "w-full border-collapse", children: [
                /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-white/5 bg-secondary/5", children: [
                  /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 text-[9px] font-black text-[#4B6478] uppercase tracking-widest", children: "Tanggal" }),
                  /* @__PURE__ */ jsx("th", { className: "text-right py-3 px-4 text-[9px] font-black text-[#4B6478] uppercase tracking-widest", children: "Beli" }),
                  /* @__PURE__ */ jsx("th", { className: "text-right py-3 px-4 text-[9px] font-black text-[#4B6478] uppercase tracking-widest", children: "Jual" }),
                  /* @__PURE__ */ jsx("th", { className: "text-right py-3 px-4 text-[9px] font-black text-[#4B6478] uppercase tracking-widest", children: "Margin" }),
                  /* @__PURE__ */ jsx("th", { className: "text-right py-3 px-4 text-[9px] font-black text-[#4B6478] uppercase tracking-widest", children: "Tx" })
                ] }) }),
                /* @__PURE__ */ jsx("tbody", { children: isLoading ? Array(5).fill(0).map((_, i) => /* @__PURE__ */ jsx("tr", { className: "border-b border-white/5", children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "p-4", children: /* @__PURE__ */ jsx(Skeleton, { className: "h-4 w-full bg-secondary/10" }) }) }, i)) : prices == null ? void 0 : prices.map((p, i) => {
                  const m = p.avg_sell_price - p.avg_buy_price;
                  const isToday = i === 0;
                  return /* @__PURE__ */ jsxs("tr", { className: cn(
                    "border-b border-white/5 transition-colors hover:bg-secondary/5",
                    isToday && "bg-emerald-500/[0.04]"
                  ), children: [
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-[11px] font-bold text-slate-300", children: formatDate(p.price_date, "dd/MM/yy") }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-right text-[11px] font-bold text-[#94A3B8] tabular-nums", children: formatIDR(safeNum(p.avg_buy_price)).replace("Rp ", "") }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-right text-[11px] font-black text-white tabular-nums", children: formatIDR(safeNum(p.avg_sell_price)).replace("Rp ", "") }),
                    /* @__PURE__ */ jsx("td", { className: cn(
                      "py-3 px-4 text-right text-[11px] font-bold tabular-nums",
                      m > 2e3 ? "text-emerald-400" : m >= 1e3 ? "text-amber-500" : "text-red-400"
                    ), children: formatIDR(safeNum(m)).replace("Rp ", "") }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-right text-[10px] font-black text-[#4B6478]", children: isToday ? (liveData == null ? void 0 : liveData.transaction_count) ?? p.transaction_count : p.transaction_count })
                  ] }, p.id);
                }) })
              ] }),
              /* @__PURE__ */ jsx(ScrollBar, { orientation: "horizontal" })
            ] }) })
          ] })
        ] })
      ]
    }
  ) });
}
function ChangeIndicator({ diff }) {
  if (diff === 0) return /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-[#4B6478] leading-none mt-1", children: "Stabil" });
  return /* @__PURE__ */ jsxs("span", { className: cn(
    "text-[10px] font-black leading-none mt-1 flex items-center gap-0.5",
    diff > 0 ? "text-[#021a02]" : "text-[#F87171]"
  ), children: [
    diff > 0 ? "▲" : "▼",
    safeNum(Math.abs(diff)).toLocaleString("id-ID")
  ] });
}
function LegendItem({ color, label, dashed }) {
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
    dashed ? /* @__PURE__ */ jsx("div", { className: "w-4 h-0 border-t-2 border-dashed", style: { borderColor: color } }) : /* @__PURE__ */ jsx("div", { className: "w-2 h-2 rounded-full", style: { background: color } }),
    /* @__PURE__ */ jsx("span", { className: "text-[9px] font-black text-[#4B6478] uppercase tracking-widest", children: label })
  ] });
}
function CustomTooltip({ active, payload }) {
  var _a, _b, _c;
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const beli = (_a = payload.find((p) => p.dataKey === "beli")) == null ? void 0 : _a.value;
    const jual = (_b = payload.find((p) => p.dataKey === "jual")) == null ? void 0 : _b.value;
    const arboge = (_c = payload.find((p) => p.dataKey === "arboge")) == null ? void 0 : _c.value;
    const margin = jual && beli ? jual - beli : 0;
    return /* @__PURE__ */ jsxs("div", { className: "bg-[#111C24] border border-white/10 rounded-xl p-3 shadow-2xl space-y-2 min-w-[140px]", children: [
      /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black text-[#4B6478] uppercase tracking-widest border-b border-white/5 pb-1.5 mb-1.5", children: data.date }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center gap-4", children: [
          /* @__PURE__ */ jsx("span", { className: "text-[9px] font-black text-[#4B6478] uppercase tracking-widest", children: "Beli" }),
          /* @__PURE__ */ jsx("span", { className: "text-[11px] font-bold text-[#F1F5F9] tabular-nums", children: safeNum(beli).toLocaleString("id-ID") })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center gap-4", children: [
          /* @__PURE__ */ jsx("span", { className: "text-[9px] font-black text-emerald-400 uppercase tracking-widest", children: "Jual" }),
          /* @__PURE__ */ jsx("span", { className: "text-[11px] font-bold text-white tabular-nums", children: safeNum(jual).toLocaleString("id-ID") })
        ] }),
        arboge && /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center gap-4", children: [
          /* @__PURE__ */ jsx("span", { className: "text-[9px] font-black text-orange-400 uppercase tracking-widest", children: "Arboge" }),
          /* @__PURE__ */ jsx("span", { className: "text-[11px] font-bold text-orange-400 tabular-nums", children: safeNum(arboge).toLocaleString("id-ID") })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center gap-4 pt-1.5 mt-1.5 border-t border-white/5", children: [
          /* @__PURE__ */ jsx("span", { className: "text-[9px] font-black text-amber-500 uppercase tracking-widest", children: "Margin" }),
          /* @__PURE__ */ jsx("span", { className: "text-[11px] font-black text-amber-500 tabular-nums", children: safeNum(margin).toLocaleString("id-ID") })
        ] })
      ] })
    ] });
  }
  return null;
}
function ManualPriceForm({ tenant, onSuccess }) {
  var _a;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ beli: "", jual: "" });
  const [region, setRegion] = useState((tenant == null ? void 0 : tenant.area_operasi) || "");
  const [openRegion, setRegionOpen] = useState(false);
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.beli || !formData.jual) return toast.error("Harap isi harga beli dan jual");
    if (!region) return toast.error("Harap pilih wilayah/provinsi");
    setLoading(true);
    try {
      const todayString = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const { error } = await supabase.from("market_prices").upsert({
        price_date: todayString,
        chicken_type: "broiler",
        region,
        avg_buy_price: Number(formData.beli),
        avg_sell_price: Number(formData.jual),
        farm_gate_price: Number(formData.beli),
        buyer_price: Number(formData.jual),
        source: "manual",
        is_deleted: false
      }, { onConflict: "price_date, chicken_type, region" });
      if (error) throw error;
      toast.success("Harga pasar diperbarui!");
      onSuccess();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxs("form", { onSubmit: handleSave, className: "space-y-4 pt-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
      /* @__PURE__ */ jsx(Label, { className: "text-[10px] font-black text-[#4B6478] uppercase tracking-widest", children: "Wilayah / Provinsi" }),
      /* @__PURE__ */ jsxs(Popover, { open: openRegion, onOpenChange: setRegionOpen, children: [
        /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            role: "combobox",
            "aria-expanded": openRegion,
            className: "w-full justify-between bg-black/20 border-white/5 h-10 font-bold",
            children: [
              region ? (_a = PROVINCES.find((p) => p.value === region)) == null ? void 0 : _a.label : "Pilih wilayah...",
              /* @__PURE__ */ jsx(ChevronsUpDown, { className: "ml-2 h-4 w-4 shrink-0 opacity-50" })
            ]
          }
        ) }),
        /* @__PURE__ */ jsx(PopoverContent, { className: "w-full p-0 bg-[#0C1319] border-white/10", align: "start", children: /* @__PURE__ */ jsxs(Command, { className: "bg-transparent", children: [
          /* @__PURE__ */ jsx(CommandInput, { placeholder: "Cari provinsi...", className: "h-9" }),
          /* @__PURE__ */ jsxs(CommandList, { children: [
            /* @__PURE__ */ jsx(CommandEmpty, { children: "Provinsi tidak ditemukan." }),
            /* @__PURE__ */ jsx(CommandGroup, { children: PROVINCES.map((p) => /* @__PURE__ */ jsxs(
              CommandItem,
              {
                value: p.value,
                onSelect: (currentValue) => {
                  setRegion(currentValue);
                  setRegionOpen(false);
                },
                className: "text-white hover:bg-white/5",
                children: [
                  /* @__PURE__ */ jsx(
                    Check,
                    {
                      className: cn(
                        "mr-2 h-4 w-4",
                        region === p.value ? "opacity-100" : "opacity-0"
                      )
                    }
                  ),
                  p.label
                ]
              },
              p.value
            )) })
          ] })
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { className: "text-[10px] font-black text-[#4B6478] uppercase tracking-widest", children: "Harga Beli" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            type: "number",
            placeholder: "Rp/kg",
            value: formData.beli,
            onChange: (e) => setFormData({ ...formData, beli: e.target.value }),
            className: "bg-black/20 border-white/5 h-10 font-bold"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { className: "text-[10px] font-black text-[#4B6478] uppercase tracking-widest", children: "Harga Jual" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            type: "number",
            placeholder: "Rp/kg",
            value: formData.jual,
            onChange: (e) => setFormData({ ...formData, jual: e.target.value }),
            className: "bg-black/20 border-white/5 h-10 font-bold"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx(Button, { type: "submit", disabled: loading, className: "w-full h-11 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-xs tracking-widest rounded-xl border-none", children: loading ? "Menyimpan..." : "Simpan Update" })
  ] });
}
function EmptyStateSmall({ icon: Icon, title, desc }) {
  return /* @__PURE__ */ jsxs("div", { className: "h-48 border border-dashed border-white/10 rounded-[24px] flex flex-col items-center justify-center p-6 text-center bg-secondary/5", children: [
    /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center mb-3", children: /* @__PURE__ */ jsx(Icon, { size: 18, className: "text-[#4B6478]" }) }),
    /* @__PURE__ */ jsx("h4", { className: "text-[13px] font-black text-white/60 mb-1 uppercase tracking-tight", children: title }),
    /* @__PURE__ */ jsx("p", { className: "text-[11px] font-bold text-[#4B6478] max-w-[200px] leading-relaxed", children: desc })
  ] });
}
export {
  HargaPasar as default
};
