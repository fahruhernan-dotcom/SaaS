import { jsxs, jsx } from "react/jsx-runtime";
import React__default, { forwardRef } from "react";
import { Loader2, ClipboardPaste } from "lucide-react";
import { a0 as Input, a1 as cn, bc as normalizePhone } from "../main.mjs";
import { toast } from "sonner";
const PhoneInput = forwardRef(({ className, onChange, value, ...props }, ref) => {
  const [isPasting, setIsPasting] = React__default.useState(false);
  const handlePasteClick = async () => {
    try {
      setIsPasting(true);
      const text = await navigator.clipboard.readText();
      if (text) {
        const normalized = normalizePhone(text);
        if (onChange) {
          onChange({ target: { value: normalized } });
        }
        toast.success("Nomor HP ditempel & dinormalisasi", {
          description: `${text} → ${normalized}`,
          duration: 2e3
        });
      }
    } catch (_err) {
      toast.error("Gagal membaca clipboard", {
        description: "Pastikan Anda memberi izin akses clipboard di browser."
      });
    } finally {
      setIsPasting(false);
    }
  };
  const handleChange = (e) => {
    const val = e.target.value;
    const cleaned = val.replace(/[^\d+]/g, "");
    if (onChange) {
      onChange({ ...e, target: { ...e.target, value: cleaned } });
    }
  };
  const handleBlur = (e) => {
    const val = e.target.value;
    const normalized = normalizePhone(val);
    if (onChange && normalized !== val) {
      onChange({ ...e, target: { ...e.target, value: normalized } });
    }
    if (props.onBlur) props.onBlur(e);
  };
  return /* @__PURE__ */ jsxs("div", { className: "relative group w-full", children: [
    /* @__PURE__ */ jsx(
      Input,
      {
        type: "tel",
        ref,
        value,
        onChange: handleChange,
        onBlur: handleBlur,
        className: cn("pr-12 font-black tracking-wider uppercase", className),
        placeholder: "0812...",
        ...props
      }
    ),
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: handlePasteClick,
        disabled: isPasting,
        className: "absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20 transition-all active:scale-90 z-10",
        title: "Tempel dari Clipboard",
        children: isPasting ? /* @__PURE__ */ jsx(Loader2, { size: 14, className: "animate-spin text-emerald-400" }) : /* @__PURE__ */ jsx(ClipboardPaste, { size: 14 })
      }
    )
  ] });
});
PhoneInput.displayName = "PhoneInput";
export {
  PhoneInput as P
};
