import { jsxs, jsx } from "react/jsx-runtime";
import { a0 as Input } from "../main.mjs";
function InputRupiah({
  value,
  onChange,
  placeholder = "0",
  id,
  ...props
}) {
  const formatDisplay = (num) => {
    if (num === null || num === void 0 || isNaN(num) || num === "") return "";
    if (num === 0) return "0";
    return Number(num).toLocaleString("id-ID");
  };
  const handleChange = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    const numValue = raw ? parseInt(raw, 10) : "";
    onChange(numValue);
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: { position: "relative" },
      className: "rounded-md transition-shadow duration-200 [&:focus-within]:shadow-[0_0_0_1px_rgba(2, 26, 2,0.25),0_0_12px_rgba(2, 26, 2,0.08)]",
      children: [
        /* @__PURE__ */ jsx("span", { style: {
          position: "absolute",
          left: "14px",
          top: "50%",
          transform: "translateY(-50%)",
          fontSize: "14px",
          color: "hsl(var(--muted-foreground))",
          pointerEvents: "none",
          userSelect: "none"
        }, children: "Rp" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            id,
            ...props,
            value: formatDisplay(value),
            onChange: handleChange,
            placeholder,
            style: {
              paddingLeft: "36px",
              ...props.style
            }
          }
        )
      ]
    }
  );
}
export {
  InputRupiah as I
};
