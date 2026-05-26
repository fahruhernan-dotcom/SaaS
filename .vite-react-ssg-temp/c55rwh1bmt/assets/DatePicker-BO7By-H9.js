import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useMemo, useEffect, useRef } from "react";
import { subYears, isValid, getDaysInMonth, format } from "date-fns";
import { id } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarIcon, X } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { a1 as cn, bA as buttonVariants, F as Sheet, a8 as SheetTrigger, a7 as Button, G as SheetContent, H as SheetHeader, I as SheetTitle, J as SheetDescription, a9 as useIsMobile, P as Popover, h as PopoverTrigger, i as PopoverContent } from "../main.mjs";
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    DayPicker,
    {
      showOutsideDays,
      className: cn("p-4 bg-[#111C24] text-[#F1F5F9] border border-white/10 rounded-[28px] shadow-2xl", className),
      classNames: {
        months: "flex flex-col sm:flex-row gap-4",
        month: "flex flex-col gap-4 p-1",
        month_caption: "flex justify-center items-center h-10 relative mb-2",
        caption_label: "text-xs font-black uppercase tracking-[0.2em] text-white",
        nav: "flex items-center justify-between absolute inset-x-0 top-0 z-10",
        button_previous: cn(
          buttonVariants({ variant: "ghost" }),
          "h-10 w-10 p-0 opacity-40 hover:opacity-100 hover:bg-white/5 text-white rounded-xl transition-all border border-transparent hover:border-white/10"
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost" }),
          "h-10 w-10 p-0 opacity-40 hover:opacity-100 hover:bg-white/5 text-white rounded-xl transition-all border border-transparent hover:border-white/10"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex justify-between mb-4 px-1",
        weekday: "text-[#4B6478] w-10 font-black text-[10px] uppercase tracking-widest text-center",
        week: "flex w-full mt-1.5 justify-between",
        day: "p-0 flex items-center justify-center",
        day_button: cn(
          "h-10 w-10 p-0 font-bold text-[11px] uppercase tracking-tight transition-all rounded-xl flex items-center justify-center hover:bg-[#162230] text-white"
        ),
        today: "text-[#021a02] font-black underline underline-offset-4",
        selected: "bg-[#021a02] text-white hover:bg-[#021a02] hover:text-white focus:bg-[#021a02] focus:text-white shadow-lg shadow-[#021a02]/20",
        outside: "text-[#4B6478] opacity-20 pointer-events-none",
        disabled: "text-[#4B6478] opacity-10",
        range_middle: "aria-selected:bg-[#162230] aria-selected:text-white rounded-none",
        range_start: "aria-selected:bg-[#021a02] aria-selected:text-white rounded-l-xl",
        range_end: "aria-selected:bg-[#021a02] aria-selected:text-white rounded-r-xl",
        ...classNames
      },
      components: {
        Chevron: ({ orientation }) => {
          if (orientation === "left") return /* @__PURE__ */ jsx(ChevronLeft, { size: 18, strokeWidth: 2.5 });
          if (orientation === "right") return /* @__PURE__ */ jsx(ChevronRight, { size: 18, strokeWidth: 2.5 });
          return null;
        }
      },
      ...props
    }
  );
}
const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 5;
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
function WheelColumn({ items, value, onChange }) {
  const scrollRef = useRef(null);
  const isProgrammaticScroll = useRef(false);
  const debounceRef = useRef(null);
  useEffect(() => {
    const index = items.findIndex((item) => item.value === value);
    if (index === -1) return;
    const apply = () => {
      if (!scrollRef.current) return;
      isProgrammaticScroll.current = true;
      scrollRef.current.scrollTo({ top: index * ITEM_HEIGHT, behavior: "instant" });
      setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 50);
    };
    requestAnimationFrame(apply);
  }, [value, items]);
  const handleScroll = (e) => {
    if (isProgrammaticScroll.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const y = e.target.scrollTop;
      const index = Math.max(0, Math.min(items.length - 1, Math.round(y / ITEM_HEIGHT)));
      if (items[index] && items[index].value !== value) {
        onChange(items[index].value);
      }
    }, 150);
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex-1 relative overflow-hidden touch-none min-w-0", style: { height: CONTAINER_HEIGHT, touchAction: "none" }, children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        className: "absolute w-full left-0 right-0 pointer-events-none bg-white/[0.03] border-y border-white/[0.08] z-0",
        style: { top: "50%", transform: "translateY(-50%)", height: ITEM_HEIGHT }
      }
    ),
    /* @__PURE__ */ jsxs(
      "div",
      {
        ref: scrollRef,
        onScroll: handleScroll,
        className: "h-full overflow-y-auto scrollbar-hide snap-y snap-mandatory relative z-10",
        style: { scrollbarWidth: "none", msOverflowStyle: "none" },
        children: [
          /* @__PURE__ */ jsx("div", { style: { height: (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2 }, className: "snap-align-none" }),
          items.map((item) => /* @__PURE__ */ jsx(
            "div",
            {
              className: cn(
                "flex items-center justify-center snap-center transition-all duration-200 text-center line-clamp-1",
                item.value === value ? "text-[17px] text-white font-semibold tracking-wide" : "text-[15px] text-slate-500 font-medium opacity-50"
              ),
              style: { height: ITEM_HEIGHT },
              children: item.label
            },
            item.value
          )),
          /* @__PURE__ */ jsx("div", { style: { height: (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2 }, className: "snap-align-none" })
        ]
      }
    )
  ] });
}
function MobileWheelDatePicker({
  value,
  onChange,
  placeholder = "Pilih Tanggal",
  minYear = 1950,
  maxYear = (/* @__PURE__ */ new Date()).getFullYear(),
  defaultAge = 25
  // Optional: stops at this age if no value provided
}) {
  const [isOpen, setIsOpen] = useState(false);
  const defaultDate = useMemo(() => subYears(/* @__PURE__ */ new Date(), defaultAge), [defaultAge]);
  const parsedDate = value ? new Date(value) : null;
  const initDate = parsedDate && isValid(parsedDate) ? parsedDate : defaultDate;
  const [day, setDay] = useState(initDate.getDate());
  const [month, setMonth] = useState(initDate.getMonth() + 1);
  const [year, setYear] = useState(initDate.getFullYear());
  useEffect(() => {
    const maxDays = getDaysInMonth(new Date(year, month - 1));
    if (day > maxDays) setDay(maxDays);
  }, [month, year, day]);
  const days = useMemo(() => {
    const maxDays = getDaysInMonth(new Date(year, month - 1));
    return Array.from({ length: maxDays }, (_, i) => ({ value: i + 1, label: String(i + 1).padStart(2, "0") }));
  }, [month, year]);
  const months = useMemo(() => [
    { value: 1, label: "Jan" },
    { value: 2, label: "Feb" },
    { value: 3, label: "Mar" },
    { value: 4, label: "Apr" },
    { value: 5, label: "Mei" },
    { value: 6, label: "Jun" },
    { value: 7, label: "Jul" },
    { value: 8, label: "Agt" },
    { value: 9, label: "Sep" },
    { value: 10, label: "Okt" },
    { value: 11, label: "Nov" },
    { value: 12, label: "Des" }
  ], []);
  const years = useMemo(() => {
    return Array.from({ length: maxYear - minYear + 1 }, (_, i) => ({
      value: maxYear - i,
      label: String(maxYear - i)
    }));
  }, [minYear, maxYear]);
  const handleConfirm = () => {
    const selectedDate = new Date(year, month - 1, day);
    onChange(format(selectedDate, "yyyy-MM-dd"));
    setIsOpen(false);
  };
  useEffect(() => {
    if (isOpen && parsedDate && isValid(parsedDate)) {
      setDay(parsedDate.getDate());
      setMonth(parsedDate.getMonth() + 1);
      setYear(parsedDate.getFullYear());
    }
  }, [isOpen, value]);
  return /* @__PURE__ */ jsxs(Sheet, { open: isOpen, onOpenChange: setIsOpen, children: [
    /* @__PURE__ */ jsx(SheetTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(
      Button,
      {
        variant: "outline",
        className: cn(
          "h-14 w-full rounded-2xl bg-[#111C24] border-white/5 px-4 flex items-center justify-start gap-3 hover:bg-white/5 hover:border-white/10 transition-all",
          !value && "text-[#4B6478]",
          value && "text-white font-black text-xs uppercase tracking-widest"
        ),
        children: [
          /* @__PURE__ */ jsx(CalendarIcon, { size: 18, className: cn("transition-colors", value ? "text-[#021a02]" : "text-[#4B6478]") }),
          /* @__PURE__ */ jsx("span", { className: "flex-1 text-left", children: value && isValid(new Date(value)) ? format(new Date(value), "dd MMM yyyy", { locale: id }) : placeholder })
        ]
      }
    ) }),
    /* @__PURE__ */ jsxs(SheetContent, { side: "bottom", className: "bg-[#111C24] border-t border-white/10 px-0 pb-6 pt-4 rounded-t-3xl overflow-hidden", children: [
      /* @__PURE__ */ jsxs(SheetHeader, { className: "px-6 mb-4", children: [
        /* @__PURE__ */ jsx(SheetTitle, { className: "text-center text-lg text-white font-bold", children: placeholder }),
        /* @__PURE__ */ jsx(SheetDescription, { className: "sr-only", children: "Pilih tanggal" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex px-6 items-center justify-center gap-2 relative select-none", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute inset-x-0 top-0 h-[36px] bg-gradient-to-b from-[#111C24] to-transparent z-20 pointer-events-none" }),
        /* @__PURE__ */ jsx("div", { className: "absolute inset-x-0 bottom-0 h-[36px] bg-gradient-to-t from-[#111C24] to-transparent z-20 pointer-events-none" }),
        /* @__PURE__ */ jsx(WheelColumn, { items: days, value: day, onChange: setDay }),
        /* @__PURE__ */ jsx(WheelColumn, { items: months, value: month, onChange: setMonth }),
        /* @__PURE__ */ jsx(WheelColumn, { items: years, value: year, onChange: setYear })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "px-6 mt-8", children: /* @__PURE__ */ jsx(
        Button,
        {
          onClick: handleConfirm,
          className: "w-full h-14 bg-white hover:bg-slate-100 text-[#111C24] rounded-2xl font-bold text-[15px] shadow-lg shadow-white/5",
          children: "Pilih Tanggal"
        }
      ) })
    ] })
  ] });
}
function DatePicker({ id: id$1, value, onChange, placeholder, className, allowClear = true }) {
  const isMobile = useIsMobile();
  const dateValue = value ? value instanceof Date ? value : new Date(value) : null;
  if (isMobile) {
    return /* @__PURE__ */ jsxs("div", { className: "relative w-full", children: [
      /* @__PURE__ */ jsx(
        MobileWheelDatePicker,
        {
          value,
          onChange,
          placeholder: placeholder || "PILIH TANGGAL"
        }
      ),
      value && allowClear && /* @__PURE__ */ jsx(
        "div",
        {
          onClick: (e) => {
            e.preventDefault();
            e.stopPropagation();
            onChange(null);
          },
          className: "absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-full cursor-pointer transition-colors z-10",
          children: /* @__PURE__ */ jsx(X, { size: 14, className: "text-white/50 hover:text-white" })
        }
      )
    ] });
  }
  return /* @__PURE__ */ jsxs(Popover, { children: [
    /* @__PURE__ */ jsxs("div", { className: "relative w-full", children: [
      /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(
        Button,
        {
          id: id$1,
          variant: "outline",
          className: cn(
            "h-14 w-full rounded-2xl bg-[#111C24] border-white/5 px-4 flex items-center justify-start gap-3 hover:bg-white/5 hover:border-white/10 transition-all",
            !value && "text-[#4B6478]",
            value && "text-white font-black text-xs uppercase tracking-widest",
            className
          ),
          children: [
            /* @__PURE__ */ jsx(CalendarIcon, { size: 18, className: cn("transition-colors", value ? "text-[#021a02]" : "text-[#4B6478]") }),
            /* @__PURE__ */ jsx("span", { className: "flex-1 text-left", children: dateValue && !isNaN(dateValue.getTime()) ? format(dateValue, "dd MMM yyyy", { locale: id }) : placeholder || "PILIH TANGGAL" })
          ]
        }
      ) }),
      value && allowClear && /* @__PURE__ */ jsx(
        "div",
        {
          onClick: (e) => {
            e.preventDefault();
            e.stopPropagation();
            onChange(null);
          },
          className: "absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-full cursor-pointer transition-colors z-10",
          children: /* @__PURE__ */ jsx(X, { size: 14, className: "text-white/50 hover:text-white" })
        }
      )
    ] }),
    /* @__PURE__ */ jsx(PopoverContent, { align: "start", sideOffset: 4, collisionPadding: 16, className: "w-auto p-0 border-none bg-transparent shadow-none", children: /* @__PURE__ */ jsx(
      Calendar,
      {
        mode: "single",
        selected: dateValue,
        onSelect: (date) => {
          if (date) {
            onChange(format(date, "yyyy-MM-dd"));
          }
        },
        locale: id,
        initialFocus: true
      }
    ) })
  ] });
}
export {
  Calendar as C,
  DatePicker as D
};
