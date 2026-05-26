import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { ChevronUp, ChevronDown, Search, Eye } from "lucide-react";
import { a1 as cn, a0 as Input, aw as Card } from "../main.mjs";
function InputNumber({
  value,
  onChange,
  step = 1,
  min,
  max,
  placeholder = "0",
  suffix,
  className = "",
  ...props
}) {
  const [displayVal, setDisplayVal] = useState("");
  useEffect(() => {
    if (value === null || value === void 0 || value === "") {
      setDisplayVal("");
      return;
    }
    const rawDisplay = displayVal.replace(/\./g, "").replace(/,/g, ".");
    const currentNum = parseFloat(rawDisplay);
    if (isNaN(currentNum) || currentNum !== value) {
      if (rawDisplay.endsWith(".") || rawDisplay.includes(".") && rawDisplay.endsWith("0") && currentNum === value) {
        return;
      }
      const parts = value.toString().split(".");
      const intPart = parseInt(parts[0], 10).toLocaleString("id-ID");
      const decPart = parts.length > 1 ? "," + parts[1] : "";
      setDisplayVal(intPart + decPart);
    }
  }, [value]);
  const handleChange = (e) => {
    let raw = e.target.value;
    if (raw === "") {
      setDisplayVal("");
      onChange("");
      return;
    }
    raw = raw.replace(/[^\d,]/g, "");
    const commaSplit = raw.split(",");
    if (commaSplit.length > 2) {
      raw = commaSplit[0] + "," + commaSplit.slice(1).join("");
    }
    const intPartRaw = commaSplit[0];
    const decPartRaw = commaSplit.length > 1 ? commaSplit[1] : void 0;
    let parsedInt = parseInt(intPartRaw, 10);
    let newDisplay = "";
    if (!isNaN(parsedInt)) {
      newDisplay = parsedInt.toLocaleString("id-ID");
    }
    if (decPartRaw !== void 0) {
      newDisplay += "," + decPartRaw;
    }
    setDisplayVal(newDisplay);
    const numericStr = raw.replace(/,/g, ".");
    const numericVal = parseFloat(numericStr);
    if (!isNaN(numericVal)) {
      onChange(numericVal);
    }
  };
  const handleUp = () => {
    const current = parseFloat(value) || 0;
    const next = current + step;
    if (max === void 0 || next <= max) {
      onChange(parseFloat(next.toFixed(10)));
    }
  };
  const handleDown = () => {
    const current = parseFloat(value) || 0;
    const next = current - step;
    if (min === void 0 || next >= min) {
      onChange(parseFloat(next.toFixed(10)));
    }
  };
  return /* @__PURE__ */ jsxs("div", { style: { position: "relative", width: "100%" }, children: [
    /* @__PURE__ */ jsx(
      "input",
      {
        type: "text",
        inputMode: "decimal",
        value: displayVal,
        onChange: handleChange,
        placeholder,
        min,
        max,
        step,
        style: {
          width: "100%",
          padding: suffix ? "13px 48px 13px 38px" : "13px 48px 13px 14px",
          background: "hsl(var(--input))",
          border: "1px solid hsl(var(--border))",
          borderRadius: "10px",
          fontSize: "16px",
          color: "inherit",
          outline: "none",
          MozAppearance: "textfield"
        },
        className: `focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 ${className}`,
        ...props
      }
    ),
    suffix && /* @__PURE__ */ jsx("span", { style: {
      position: "absolute",
      left: "14px",
      top: "50%",
      transform: "translateY(-50%)",
      fontSize: "13px",
      color: "hsl(var(--muted-foreground))",
      pointerEvents: "none",
      userSelect: "none",
      fontWeight: 700,
      textTransform: "uppercase"
    }, children: suffix }),
    /* @__PURE__ */ jsxs("div", { style: {
      position: "absolute",
      right: "1px",
      top: "1px",
      bottom: "1px",
      width: "36px",
      display: "flex",
      flexDirection: "column",
      borderLeft: "1px solid hsl(var(--border))",
      borderRadius: "0 9px 9px 0",
      overflow: "hidden",
      background: "rgba(255,255,255,0.02)"
    }, children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onMouseDown: (e) => {
            e.preventDefault();
            handleUp();
          },
          style: {
            flex: 1,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderBottom: "1px solid hsl(var(--border))",
            color: "hsl(var(--muted-foreground))",
            transition: "background 0.1s, color 0.1s"
          },
          onMouseEnter: (e) => {
            e.currentTarget.style.background = "rgba(2, 26, 2,0.10)";
            e.currentTarget.style.color = "#021a02";
          },
          onMouseLeave: (e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "hsl(var(--muted-foreground))";
          },
          children: /* @__PURE__ */ jsx(ChevronUp, { size: 11, strokeWidth: 2.5 })
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onMouseDown: (e) => {
            e.preventDefault();
            handleDown();
          },
          style: {
            flex: 1,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "hsl(var(--muted-foreground))",
            transition: "background 0.1s, color 0.1s"
          },
          onMouseEnter: (e) => {
            e.currentTarget.style.background = "rgba(2, 26, 2,0.10)";
            e.currentTarget.style.color = "#021a02";
          },
          onMouseLeave: (e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "hsl(var(--muted-foreground))";
          },
          children: /* @__PURE__ */ jsx(ChevronDown, { size: 11, strokeWidth: 2.5 })
        }
      )
    ] }),
    /* @__PURE__ */ jsx("style", { children: `
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      ` })
  ] });
}
function BrokerPageHeader({
  title = "Transaksi",
  subtitle,
  isDesktop,
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Cari data...",
  filters = [],
  activeFilter,
  onFilterChange,
  actionButton,
  isViewOnly
}) {
  return /* @__PURE__ */ jsxs("header", { className: "px-5 pt-8 pb-4 sticky top-0 bg-[#06090F]/80 backdrop-blur-md z-30 space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "font-display text-2xl font-black text-white tracking-tight uppercase leading-none", children: title }),
        subtitle && /* @__PURE__ */ jsx("p", { className: cn("font-bold text-[#4B6478] uppercase mt-1 tracking-widest", isDesktop ? "text-[10px]" : "text-xs"), children: subtitle })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 flex-1 justify-end", children: [
        onSearchChange && /* @__PURE__ */ jsxs("div", { className: "relative max-w-xs w-full hidden md:block", children: [
          /* @__PURE__ */ jsx(Search, { size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-[#4B6478]" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              value: searchQuery,
              onChange: (e) => onSearchChange(e.target.value),
              placeholder: searchPlaceholder,
              className: "pl-9 h-10 w-full bg-[#111C24] border-white/5 rounded-xl font-bold text-xs text-white placeholder:text-[#4B6478]"
            }
          )
        ] }),
        actionButton
      ] })
    ] }),
    onSearchChange && /* @__PURE__ */ jsxs("div", { className: "md:hidden mt-4 relative w-full", children: [
      /* @__PURE__ */ jsx(Search, { size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-[#4B6478]" }),
      /* @__PURE__ */ jsx(
        Input,
        {
          value: searchQuery,
          onChange: (e) => onSearchChange(e.target.value),
          placeholder: searchPlaceholder,
          className: "pl-9 h-10 w-full bg-[#111C24] border-white/5 rounded-xl font-bold text-xs text-white placeholder:text-[#4B6478]"
        }
      )
    ] }),
    filters.length > 0 && /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 overflow-x-auto no-scrollbar pb-1", children: filters.map((f) => /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => onFilterChange == null ? void 0 : onFilterChange(f.id),
        className: cn(
          "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
          activeFilter === f.id ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-[#111C24] text-[#4B6478] hover:text-emerald-400 border border-white/5"
        ),
        children: f.label
      },
      f.id
    )) }),
    isViewOnly && /* @__PURE__ */ jsxs("div", { className: "bg-[#0C1319] border border-white/8 rounded-xl px-4 py-2 flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(Eye, { className: "w-4 h-4 text-[#4B6478]" }),
      /* @__PURE__ */ jsxs("span", { className: "text-[#4B6478] text-xs", children: [
        "Kamu dalam mode ",
        /* @__PURE__ */ jsx("strong", { className: "text-[#94A3B8]", children: "View Only" }),
        " — hanya bisa melihat data"
      ] })
    ] })
  ] });
}
function BrokerBaseCard({
  onClick,
  isLoss,
  children,
  footer,
  header,
  className,
  isDesktop = true
}) {
  return /* @__PURE__ */ jsxs(
    Card,
    {
      onClick,
      className: cn(
        "bg-[#111C24] rounded-[22px] overflow-hidden relative cursor-pointer hover:bg-white/[0.04] active:scale-[0.98] transition-all group",
        isLoss ? "border-[#F87171]" : "border-white/5",
        className
      ),
      children: [
        /* @__PURE__ */ jsxs("div", { className: cn(isDesktop ? "p-5 space-y-6" : "p-3.5 space-y-3"), children: [
          header && /* @__PURE__ */ jsx("div", { className: cn("flex gap-2", isDesktop ? "justify-between items-start" : "flex-col"), children: header }),
          children
        ] }),
        footer && /* @__PURE__ */ jsx("div", { className: cn(
          "flex justify-between items-center",
          isDesktop ? "px-6 py-3" : "px-4 py-2.5",
          isLoss ? "bg-[#3d0f0f] border-t border-[#F87171]" : "bg-[#0C1319] border-t border-white/5"
        ), children: footer })
      ]
    }
  );
}
export {
  BrokerPageHeader as B,
  InputNumber as I,
  BrokerBaseCard as a
};
