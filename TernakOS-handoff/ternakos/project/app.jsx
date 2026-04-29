// TernakOS — Mobile dashboard for sheep fattening
// Re-design of the original `Beranda` screen, mobile-first.

const { useState, useEffect, useRef, useMemo } = React;

// ─────────────────────────────────────────────────────────────
// Tweak defaults — host rewrites this block on disk
// ─────────────────────────────────────────────────────────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "accent": "emerald",
  "density": "comfortable",
  "showFinancePeek": true,
  "navStyle": "tab"
}/*EDITMODE-END*/;

// ─────────────────────────────────────────────────────────────
// Theme tokens
// ─────────────────────────────────────────────────────────────
const ACCENTS = {
  emerald: { base: 'oklch(0.72 0.15 155)', soft: 'oklch(0.72 0.15 155 / 0.14)', ink: 'oklch(0.32 0.07 155)', name: 'Emerald' },
  amber:   { base: 'oklch(0.78 0.14 70)',  soft: 'oklch(0.78 0.14 70 / 0.14)',  ink: 'oklch(0.32 0.06 70)',  name: 'Amber'   },
  cobalt:  { base: 'oklch(0.7 0.13 245)',  soft: 'oklch(0.7 0.13 245 / 0.14)',  ink: 'oklch(0.32 0.06 245)', name: 'Cobalt'  },
};

function getTokens(theme, accentKey) {
  const accent = ACCENTS[accentKey] || ACCENTS.emerald;
  if (theme === 'light') {
    return {
      bg: '#F4F2EE',
      surface: '#FFFFFF',
      surfaceAlt: '#F8F7F4',
      hairline: 'rgba(20, 22, 18, 0.08)',
      hairlineStrong: 'rgba(20, 22, 18, 0.16)',
      text: '#101412',
      textDim: '#5C605A',
      textMute: '#9A9D96',
      danger: 'oklch(0.62 0.18 25)',
      warn: 'oklch(0.7 0.16 65)',
      ok: 'oklch(0.62 0.13 155)',
      shadow: '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)',
      accent,
      isDark: false,
    };
  }
  return {
    bg: '#0A0E0C',
    surface: '#13191A',
    surfaceAlt: '#0F1416',
    hairline: 'rgba(255, 255, 255, 0.06)',
    hairlineStrong: 'rgba(255, 255, 255, 0.12)',
    text: '#F2F4F1',
    textDim: '#9BA29B',
    textMute: '#5A615C',
    danger: 'oklch(0.7 0.18 25)',
    warn:   'oklch(0.78 0.14 70)',
    ok:     'oklch(0.72 0.15 155)',
    shadow: '0 1px 2px rgba(0,0,0,0.4), 0 12px 36px rgba(0,0,0,0.18)',
    accent,
    isDark: true,
  };
}

// ─────────────────────────────────────────────────────────────
// Mock data — drawn from the original hooks
// ─────────────────────────────────────────────────────────────
const TODAY = new Date('2026-04-28T10:30:00');

const BATCHES = [
  {
    id: 'b1', code: 'B-2604', kandang: 'Kandang Utara A', startDate: '2026-02-08',
    total: 48, active: 47, mortality: 1,
    avgEntryWeight: 14.2, avgWeight: 28.6, adg: 168,
    feedCost: 18_400_000, opCost: 4_200_000, purchaseCost: 84_000_000,
    nextSalePrice: 95_000, // per kg
  },
  {
    id: 'b2', code: 'B-2702', kandang: 'Kandang Selatan B', startDate: '2026-03-04',
    total: 36, active: 36, mortality: 0,
    avgEntryWeight: 13.8, avgWeight: 22.1, adg: 142,
    feedCost: 11_200_000, opCost: 2_800_000, purchaseCost: 61_200_000,
    nextSalePrice: 95_000,
  },
  {
    id: 'b3', code: 'B-2801', kandang: 'Kandang Timur C', startDate: '2026-03-30',
    total: 24, active: 24, mortality: 0,
    avgEntryWeight: 14.0, avgWeight: 17.4, adg: 113,
    feedCost: 4_400_000, opCost: 1_100_000, purchaseCost: 41_000_000,
    nextSalePrice: 95_000,
  },
];

const TASKS = [
  { id: 't1', type: 'pakan',    label: 'Pakan Pagi',     time: '06:30', worker: 'Pak Joko',  status: 'done',    note: 'Konsentrat + hijauan, sisa sedikit' },
  { id: 't2', type: 'timbang',  label: 'Timbang B-2604', time: '07:30', worker: 'Pak Joko',  status: 'done',    note: '12/47 ekor' },
  { id: 't3', type: 'sehat',    label: 'Cek Kesehatan',  time: '09:00', worker: 'Bu Sari',   status: 'doing',   note: '3 ekor butuh perhatian' },
  { id: 't4', type: 'kandang',  label: 'Bersih Kandang', time: '12:00', worker: 'Pak Adi',   status: 'pending', note: '' },
  { id: 't5', type: 'pakan',    label: 'Pakan Sore',     time: '15:30', worker: 'Pak Joko',  status: 'pending', note: '' },
  { id: 't6', type: 'kandang',  label: 'Tutup Kandang',  time: '18:00', worker: 'Pak Adi',   status: 'pending', note: '' },
];

const ALERTS = [
  { id: 'a1', level: 'danger', batch: 'B-2604', title: '2 hari pakan sisa banyak', body: 'Cek palatabilitas atau kondisi kelompok.', at: '07:14' },
  { id: 'a2', level: 'warn',   batch: 'B-2702', title: 'Mortalitas 1.8%', body: 'Naik dari minggu lalu — pantau.', at: 'kemarin' },
];

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const TARGET_DAYS = 90;

function daysSince(dateStr) {
  const d = new Date(dateStr);
  return Math.floor((TODAY - d) / (1000 * 60 * 60 * 24));
}

function fmtDate(d, opts = { day: '2-digit', month: 'short' }) {
  return d.toLocaleDateString('id-ID', opts);
}

function fmtRp(n, compact = true) {
  if (compact) {
    if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)} M`;
    if (n >= 1_000_000)     return `Rp ${(n / 1_000_000).toFixed(1)} jt`;
    if (n >= 1_000)         return `Rp ${(n / 1_000).toFixed(0)} rb`;
  }
  return `Rp ${n.toLocaleString('id-ID')}`;
}

function greeting(d) {
  const h = d.getHours();
  if (h < 11) return 'Selamat pagi';
  if (h < 15) return 'Selamat siang';
  if (h < 19) return 'Selamat sore';
  return 'Selamat malam';
}

// Aggregate KPIs across all active batches
function getKpi() {
  const total = BATCHES.reduce((s, b) => s + b.active, 0);
  const totalEntry = BATCHES.reduce((s, b) => s + b.total, 0);
  const mortPct = ((BATCHES.reduce((s, b) => s + b.mortality, 0) / totalEntry) * 100);
  const adg = Math.round(
    BATCHES.reduce((s, b) => s + b.adg * b.active, 0) /
    BATCHES.reduce((s, b) => s + b.active, 0)
  );
  const harvestSoon = BATCHES.filter(b => {
    const d = daysSince(b.startDate);
    return d >= 60 && d <= 90;
  }).reduce((s, b) => s + b.active, 0);
  // P&L projection
  const cost = BATCHES.reduce((s, b) => s + b.feedCost + b.opCost + b.purchaseCost, 0);
  const revenue = BATCHES.reduce((s, b) => s + b.active * b.avgWeight * b.nextSalePrice, 0);
  return { total, mortPct, adg, harvestSoon, cost, revenue, profit: revenue - cost };
}

// Pull globals for cross-file scripts
Object.assign(window, {
  TWEAK_DEFAULTS, ACCENTS, getTokens,
  BATCHES, TASKS, ALERTS, TODAY, TARGET_DAYS,
  daysSince, fmtDate, fmtRp, greeting, getKpi,
});
