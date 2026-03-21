# Pricing Section Redesign Plan

Redesign the pricing section of the landing page to feature a 3-card layout (PRO, BUSINESS, ENTERPRISE) with integrated monthly/yearly toggling, price animations, and celebratory effects.

## Proposed Changes

### [Component] Pricing Section

#### [MODIFY] [Pricing.jsx](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/sections/Pricing.jsx)
- **State Management**:
  - Add `isAnnual` state (boolean).
  - Remove `activeRole` if it conflicts with the new unified 3-plan structure, or adapt it.
- **Layout**:
  - Implement a 3-column grid for desktop, 1-column for mobile.
  - Apply lift effect to the "BUSINESS" card using `whileInView: { y: -16 }` and `scale: 0.96` for side cards.
- **Components**:
  - Replace `CountUp` with `NumberFlow`.
  - Add `Switch` (Radix) for monthly/yearly toggle.
  - Implement `canvas-confetti` trigger on `isAnnual` toggle (true).
- **Styling**:
  - Background: `#0C1319`, Border: `white/8`.
  - Popular Card: `border-[#10B981]`, border-2.
  - Buttons: Emerald theme logic (`#10B981` / `#34D399`).
  - Badge: "Paling Populer" and "Hemat 20%".

### [UI Library]
#### [NEW] [switch.jsx](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/components/ui/switch.jsx)
- shadcn-style Switch component using `@radix-ui/react-switch`.

## Verification Plan

### Manual Verification
- Toggle between Monthly and Yearly:
  - Verify price numbers animate smoothly via `NumberFlow`.
  - Verify `canvas-confetti` fires when switching to Yearly.
- Visual Audit:
  - Check "Paling Populer" badge on Business card.
  - Verify Business card is lifted (-16px) and side cards scaled (0.96).
  - Ensure colors match the Emerald design system.
- Responsive Test:
  - Verify 1-column layout on mobile.
  - Verify 3-column layout on desktop.
- Link Check:
  - Ensure "Mulai 14 Hari Gratis" leads to `/register`.
  - Ensure "Hubungi Kami" leads to WhatsApp or contact page.
