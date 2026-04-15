

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronDown, ArrowRight, Star, X as XIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { usePricingConfig, usePlanConfigs } from '@/lib/hooks/useAdminData'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import Particles from '../components/reactbits/Particles'


// ─── Config ───────────────────────────────────────────────────────────────────

import { WA_URL } from '@/lib/constants/contact'

const ROLES = [
  { id: 'broker', label: 'Broker', emoji: '🐔' },
  { id: 'peternak', label: 'Peternak', emoji: '🏠' },
  { id: 'rpa', label: 'RPA', emoji: '🏭' },
]

const SUBS = {
  broker: [
    { id: 'ayam', label: 'Broker Ayam', disabled: false },
    { id: 'telur', label: 'Broker Telur', disabled: false },
    { id: 'distributor', label: 'Distributor Daging', disabled: false },
    { id: 'sembako', label: 'Distributor Sembako', disabled: false },
  ],
  peternak: [
    { id: 'ayam', label: 'Ayam Broiler & Layer', disabled: false },
    { id: 'ruminansia', label: 'Sapi, Kambing, Domba', disabled: true },
  ],
  rpa: [
    { id: 'buyer', label: 'Rumah Potong Ayam', disabled: false },
    { id: 'rph', label: 'RPH', disabled: true },
  ],
}

const FAQ_LIST = [
  {
    q: 'Apakah ada kontrak jangka panjang?',
    a: 'Tidak. Kamu bisa cancel kapan saja. Tidak ada biaya tambahan atau penalti pembatalan.',
  },
  {
    q: 'Bagaimana cara pembayaran?',
    a: 'Transfer bank manual. Admin akan konfirmasi dalam 1×24 jam kerja setelah bukti transfer diterima.',
  },
  {
    q: 'Apakah data saya aman?',
    a: 'Ya. Data disimpan di Supabase (PostgreSQL) dengan enkripsi end-to-end dan backup otomatis setiap hari. Data bisnis kamu tidak pernah dijual ke pihak manapun.',
  },
  {
    q: 'Apa yang terjadi setelah trial berakhir?',
    a: 'Kamu akan diminta memilih plan. Data tidak dihapus selama 30 hari setelah masa trial (paket Pro atau Business) berakhir, sehingga kamu punya waktu untuk memutuskan.',
  },
  {
    q: 'Bisakah saya upgrade atau downgrade plan?',
    a: 'Bisa. Hubungi admin via WhatsApp untuk proses upgrade/downgrade. Penyesuaian harga dihitung secara prorata.',
  },
]

const ENTERPRISE_FEATURES = [
  'Semua fitur Business',
  'Onboarding dedicated',
  'SLA & support prioritas 24/7',
  'Integrasi custom (API)',
  'Multi-tenant management',
  'Kontrak fleksibel',
]

// Shared broker pricing (Ayam & Telur sama)
const _brokerBase = {
  proPrice: 999000,
  proYearly: 799000,
  proStrike: 1499000,
  bizPrice: 1499000,
  bizYearly: 1199000,
  bizStrike: 2499000,
  starterFeatures: [
    'Input transaksi harian',
    'Laporan harian dasar',
    'Manajemen 1 armada/sopir',
    'Harga pasar realtime',
  ],
  starterMissing: [
    'RPA & piutang management',
    'TernakBot AI',
  ],
}

// Shared peternak pricing (Ayam & Ruminansia sama)
const _peternakBase = {
  proPrice: 499000,
  proYearly: 399000,
  proStrike: 749000,
  bizPrice: 999000,
  bizYearly: 799000,
  bizStrike: 1499000,
  addOnNote: true,
  starterFeatures: [
    '1 kandang aktif',
    '1 jenis ternak',
    'Input harian & laporan dasar',
    'FCR & IP Score tracking',
  ],
  starterMissing: [
    'Export laporan',
    'TernakBot AI',
  ],
}

// Shared RPA pricing (Buyer & Distributor sama)
const _rpaBase = {
  proPrice: 699000,
  proYearly: 559000,
  proStrike: 999000,
  bizPrice: 1499000,
  bizYearly: 1199000,
  bizStrike: 2499000,
  starterFeatures: [
    'Input harian operasional',
    'Laporan stok dasar',
    'Manajemen 1 unit RPA',
    'Harga pasar realtime',
  ],
  starterMissing: [
    'Prediksi permintaan AI',
    'Dedicated support',
  ],
}

const PRICING_DATA = {
  broker_ayam: {
    ..._brokerBase,
    socialProof: '280+',
    proFeatures: [
      'Transaksi beli & jual unlimited',
      'Manajemen kandang unlimited',
      'Tracking pengiriman & loss report',
      'RPA & piutang management',
      'Cash flow & laporan keuangan',
      'Armada kendaraan & sopir',
      'Tim maks 3 anggota',
      'Harga pasar realtime',
      'TernakOS Market access',
      'Support via WhatsApp',
    ],
    bizExtras: [
      'TernakBot AI (Grok 4.1 Fast)',
      'Analisis profit otomatis',
      'Deteksi anomali transaksi',
      'Prediksi margin AI',
      'Laporan PDF/Excel otomatis',
      'Tim unlimited',
      'Priority support',
    ],
  },
  broker_telur: {
    ..._brokerBase,
    socialProof: '90+',
    proFeatures: [
      'POS penjualan telur unlimited',
      'Inventori 3 grade (Hero/Standard/Salted)',
      'Database supplier & customer',
      'Tracking piutang customer',
      'Log mutasi stok (masuk/keluar/adj)',
      'Laporan penjualan & margin',
      'Tim maks 3 anggota',
      'Harga pasar realtime',
      'TernakOS Market access',
      'Support via WhatsApp',
    ],
    bizExtras: [
      'TernakBot AI',
      'Analisis top customer AI',
      'Prediksi stok otomatis',
      'Tim unlimited',
      'Priority support',
    ],
  },
  peternak_ayam: {
    ..._peternakBase,
    socialProof: '150+',
    proFeatures: [
      '2 kandang aktif',
      '1 jenis ternak included',
      'Add-on: +Rp\u00a099.000/bln per jenis ternak tambahan',
      'Siklus pemeliharaan unlimited',
      'Input harian & laporan lengkap',
      'FCR & IP Score otomatis',
      'Export laporan',
      'Prediksi panen AI dasar',
      'TernakOS Market access',
      'Support via WhatsApp',
    ],
    bizExtras: [
      'Kandang unlimited',
      'Semua jenis ternak unlimited',
      'Tidak ada add-on',
      'TernakBot AI included',
      'Export PDF/Excel',
      'Tim unlimited',
      'Priority support',
    ],
  },
  peternak_ruminansia: {
    ..._peternakBase,
    socialProof: '40+',
    proFeatures: [
      '2 kandang aktif',
      '1 jenis ternak included',
      'Add-on: +Rp\u00a099.000/bln per jenis ternak tambahan',
      'Siklus pemeliharaan unlimited',
      'Input harian & laporan lengkap',
      'FCR & performa ternak otomatis',
      'Export laporan',
      'Prediksi panen AI dasar',
      'TernakOS Market access',
      'Support via WhatsApp',
    ],
    bizExtras: [
      'Kandang unlimited',
      'Semua jenis ternak unlimited',
      'Tidak ada add-on',
      'TernakBot AI included',
      'Export PDF/Excel',
      'Tim unlimited',
      'Priority support',
    ],
  },
  rpa_buyer: {
    ..._rpaBase,
    socialProof: '60+',
    proFeatures: [
      'Order ke broker unlimited',
      'Tracking hutang & pembayaran',
      'Laporan margin per produk',
      'Top customer analytics',
      'Profil bisnis RPA lengkap',
      'TernakOS Market access',
      'Tim maks 3 anggota',
      'Support via WhatsApp',
    ],
    bizExtras: [
      'TernakBot AI',
      'Prediksi permintaan AI',
      'Tim unlimited',
      'Priority support',
    ],
  },
  rpa_distributor: {
    ..._rpaBase,
    socialProof: '25+',
    proFeatures: [
      'Manajemen order distribusi unlimited',
      'Tracking hutang ke supplier',
      'Laporan margin per channel',
      'Analytics pelanggan distributor',
      'Profil bisnis distributor lengkap',
      'TernakOS Market access',
      'Tim maks 3 anggota',
      'Support via WhatsApp',
    ],
    bizExtras: [
      'TernakBot AI',
      'Prediksi demand AI',
      'Tim unlimited',
      'Priority support',
    ],
  },
  broker_distributor: {
    ..._brokerBase,
    socialProof: '30+',
    proFeatures: [
      'Manajemen order distribusi unlimited',
      'Tracking piutang per customer',
      'Laporan margin per channel & produk',
      'Database supplier & customer',
      'Tracking pengiriman & retur',
      'Cash flow & laporan keuangan',
      'Tim maks 3 anggota',
      'Harga pasar realtime',
      'TernakOS Market access',
      'Support via WhatsApp',
    ],
    bizExtras: [
      'TernakBot AI (Grok 4.1 Fast)',
      'Analisis profit otomatis',
      'Prediksi demand AI',
      'Laporan PDF/Excel otomatis',
      'Tim unlimited',
      'Priority support',
    ],
  },
  broker_sembako: {
    ..._brokerBase,
    socialProof: '120+',
    proFeatures: [
      'POS penjualan ritel & grosir unlimited',
      'Multi-gudang & multi-harga',
      'Database supplier & warung/toko',
      'Tracking piutang & tagihan',
      'Manajemen stok otomatis',
      'Cash flow & laporan laba/rugi',
      'Tim maks 3 anggota',
      'Katalog produk mandiri',
      'TernakOS Market access',
      'Support via WhatsApp',
    ],
    bizExtras: [
      'TernakBot AI (Grok 4.1 Fast)',
      'Analisis produk terlaris AI',
      'Prediksi restock otomatis via AI',
      'Broadcast WA tagihan otomatis',
      'Tim unlimited',
      'Priority support',
    ],
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtIDR(n) {
  return 'Rp\u00a0' + n.toLocaleString('id-ID')
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function FadeUp({ children, delay = 0, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, ease: 'easeOut', delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function FeatureItem({ text, isExtra = false }) {
  return (
    <li className="flex items-start gap-2">
      {isExtra
        ? <Star size={13} className="text-emerald-400 shrink-0 mt-0.5 fill-emerald-400/30" />
        : <Check size={13} className="text-emerald-400 shrink-0 mt-0.5" />
      }
      <span className={`text-sm leading-snug ${isExtra ? 'text-white/80' : 'text-[#94A3B8]'}`}>{text}</span>
    </li>
  )
}

function SocialAvatars({ count }) {
  const colors = ['bg-emerald-500', 'bg-purple-500', 'bg-blue-500', 'bg-amber-500', 'bg-pink-500']
  const initials = ['A', 'B', 'D', 'R', 'S']
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {colors.map((c, i) => (
          <div key={i} className={`w-6 h-6 rounded-full ${c} border-2 border-[#0C1319] flex items-center justify-center text-[9px] font-bold text-white shrink-0`}>
            {initials[i]}
          </div>
        ))}
      </div>
      <span className="text-xs text-[#94A3B8]">
        <span className="text-white font-semibold">{count}</span> bisnis pilih Business
      </span>
    </div>
  )
}

function AccordionItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-white/8">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between py-5 text-left gap-4 bg-transparent border-none cursor-pointer"
      >
        <span className="text-sm font-semibold text-white">{q}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0">
          <ChevronDown size={16} className="text-[#4B6478]" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: 'hidden' }}
          >
            <p className="text-sm text-[#94A3B8] leading-relaxed pb-5">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Pricing cards ────────────────────────────────────────────────────────────

function ProCard({ data, billing, annualDiscount }) {
  const price = billing === 'yearly' ? data.proYearly : data.proPrice
  const yearlyTotal = data.proYearly * 12
  const discountLabel = annualDiscount?.badge_text || 'Hemat 2 bln!'
  const discountPct = annualDiscount?.discount_percent || 20


  return (
    <div className="group relative bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.01))] rounded-2xl p-8 border border-white/8 flex flex-col h-full transition-all duration-300 hover:border-emerald-500/30 hover:shadow-[0_20px_45px_rgba(0,0,0,0.3)]">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/5 group-hover:to-transparent transition-all duration-500 rounded-2xl" />
      <div className="relative z-10 mb-6">
        {/* Anchoring: strikethrough */}
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#4B6478] mb-3">PRO</p>
        <div className="flex items-end gap-2 mb-1">
          <span className="text-sm text-[#4B6478] line-through">{fmtIDR(data.proStrike)}</span>
          <span className="text-[10px] bg-emerald-500/15 text-emerald-400 font-bold px-2 py-0.5 rounded-full">
            HEMAT {Math.round((1 - data.proPrice / data.proStrike) * 100)}%
          </span>
        </div>
        <div className="flex items-end gap-1">
          <span className="font-['Sora'] text-3xl font-black text-white">{fmtIDR(price)}</span>
          <span className="text-sm text-[#4B6478] mb-1">/bln</span>
        </div>
        {billing === 'yearly' && (
          <p className="text-xs text-[#4B6478] mt-1">
            {fmtIDR(yearlyTotal)}/tahun · hemat {discountPct}%
          </p>
        )}
      </div>

      <ul className="relative z-10 space-y-3 mb-5 flex-1">
        {data.proFeatures.map((f, i) => <FeatureItem key={i} text={f} />)}
      </ul>

      {/* Add-on note for peternak */}
      {data.addOnNote && (
        <div className="relative z-10 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-5 text-[11px] text-amber-400 leading-relaxed font-medium">
          💡 Punya lebih dari 1 jenis ternak aktif? Tambahkan +Rp&nbsp;99.000/bln per jenis. Maks 2 add-on — lebih dari itu otomatis lebih hemat upgrade ke Business.
        </div>
      )}

      <Link
        to="/register"
        className="relative z-10 block text-center py-3 rounded-xl border border-emerald-500/40 text-emerald-400 text-sm font-bold hover:bg-emerald-500/10 transition-colors"
      >
        Mulai {data.trialDays || 14} Hari Gratis
      </Link>
    </div>
  )
}

function BusinessCard({ data, billing, roleLabel, annualDiscount }) {
  const price = billing === 'yearly' ? data.bizYearly : data.bizPrice
  const yearlyTotal = data.bizYearly * 12
  const yearlySaving = (data.bizPrice - data.bizYearly) * 12
  const discountPct = annualDiscount?.discount_percent || 20


  return (
    <div className="relative">
      {/* Popular badge */}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap">
        <span className="bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-[0_4px_16px_rgba(16,185,129,0.4)]">
          ⚡ PALING POPULER
        </span>
      </div>

      <div
        className="group relative bg-[#0C1319] rounded-2xl p-8 border-2 border-emerald-500/60 flex flex-col h-full transition-all duration-300 hover:border-emerald-500 hover:shadow-[0_24px_60px_rgba(16,185,129,0.25)]"
        style={{ boxShadow: '0 0 40px rgba(16,185,129,0.15)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent pointer-events-none rounded-2xl" />

        <div className="relative z-10 mb-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-3">BUSINESS</p>

          {/* Anchoring */}
          <div className="flex items-end gap-2 mb-1">
            <span className="text-sm text-[#4B6478] line-through">{fmtIDR(data.bizStrike)}</span>
            <span className="text-[10px] bg-emerald-500/15 text-emerald-400 font-bold px-2 py-0.5 rounded-full">
              HEMAT {Math.round((1 - data.bizPrice / data.bizStrike) * 100)}%
            </span>
          </div>
          <div className="flex items-end gap-1">
            <span className="font-['Sora'] text-3xl font-black text-white">{fmtIDR(price)}</span>
            <span className="text-sm text-[#4B6478] mb-1">/bln</span>
          </div>
          {billing === 'yearly' && (
            <p className="text-xs text-[#4B6478] mt-1">
              {fmtIDR(yearlyTotal)}/tahun · hemat {discountPct}%
            </p>
          )}

          {/* Loss aversion */}
          {billing === 'yearly' && (
            <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
              <p className="text-[11px] text-amber-400 font-bold">
                💡 Hemat {fmtIDR(yearlySaving)} vs bayar bulanan
              </p>
            </div>
          )}
        </div>

        {/* Social proof */}
        <div className="relative z-10 mb-6">
          <SocialAvatars count={data.socialProof} />
        </div>

        <ul className="relative z-10 space-y-3 mb-2 flex-1">
          {data.proFeatures.map((f, i) => <FeatureItem key={i} text={f} />)}
          <li className="pt-2 border-t border-white/8" />
          {data.bizExtras.map((f, i) => <FeatureItem key={i} text={f} isExtra />)}
        </ul>

        <div className="relative z-10 mt-8">
          <Link
            to="/register"
            className="block text-center py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold transition-all shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_28px_rgba(16,185,129,0.45)] hover:-translate-y-0.5 active:translate-y-0"
          >
            Mulai {data.trialDays || 14} Hari Gratis
          </Link>
          <p className="text-center text-[11px] text-[#4B6478] mt-3 font-medium">Tidak perlu kartu kredit</p>
        </div>
      </div>
    </div>
  )
}

function StarterCard({ data }) {
  return (
    <div className="group relative bg-[linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] rounded-2xl p-8 border border-white/8 flex flex-col h-full transition-all duration-300 hover:border-white/20">
      <div className="relative z-10 mb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#4B6478] mb-3">STARTER</p>
        <div className="flex items-baseline gap-1 mb-1">
          <span className="font-['Sora'] text-3xl font-black text-white">Gratis</span>
        </div>
        <p className="text-xs text-[#4B6478] mt-1">Gratis selamanya untuk operasional dasar</p>
      </div>

      <ul className="relative z-10 space-y-3 flex-1 mb-8">
        {data.starterFeatures.map((f, i) => (
          <li key={i} className="flex items-start gap-3">
            <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
            <span className="text-[13px] text-[#94A3B8] leading-snug">{f}</span>
          </li>
        ))}
        {data.starterMissing.map((f, i) => (
          <li key={`x-${i}`} className="flex items-start gap-3">
            <XIcon size={14} className="text-[#4B6478] shrink-0 mt-0.5" />
            <span className="text-[13px] text-[#4B6478] leading-snug line-through">{f}</span>
          </li>
        ))}
      </ul>

      <Link
        to="/register"
        className="relative z-10 block text-center py-3 rounded-xl border border-white/10 text-[#64748B] text-sm font-bold hover:border-white/30 hover:text-white transition-all"
      >
        Mulai Gratis
      </Link>
    </div>
  )
}

function EnterpriseCard() {
  return (
    <div className="group relative bg-[linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] rounded-2xl p-8 border border-white/8 flex flex-col h-full transition-all duration-300 hover:border-white/20">
      <div className="relative z-10 mb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#4B6478] mb-3">ENTERPRISE</p>
        <div className="flex items-baseline gap-1 mb-1">
          <span className="font-['Sora'] text-3xl font-black text-white">Custom</span>
        </div>
        <p className="text-xs text-[#4B6478] mt-1">Harga disesuaikan kebutuhan bisnis</p>
      </div>

      <ul className="relative z-10 space-y-3 mb-8 flex-1">
        {ENTERPRISE_FEATURES.map((f, i) => <FeatureItem key={i} text={f} />)}
      </ul>

      <a
        href={WA_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="relative z-10 block text-center py-3 rounded-xl border border-white/10 text-white text-sm font-bold hover:border-white/30 hover:bg-white/5 transition-all"
      >
        Hubungi Kami
      </a>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HargaPage() {
  const [selectedRole, setSelectedRole] = useState('broker')
  const [selectedSub, setSelectedSub] = useState('ayam')
  const [billing, setBilling] = useState('monthly')
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  const { data: dbPricing } = usePricingConfig()
  const { data: dbConfigs } = usePlanConfigs()

  useEffect(() => {
    document.title = 'Pricing - TernakOS'
    return () => { document.title = 'TernakOS' }
  }, [])

  const dynamicPricingData = useMemo(() => {
    const newData = JSON.parse(JSON.stringify(PRICING_DATA))

    // Get custom trial days or defaults
    const trialDays = dbConfigs?.trial_config?.pro || 14
    const discountPct = dbConfigs?.annual_discount?.discount_percent || 20

    // Loop through our local keys and merge DB pricing if available
    for (const key of Object.keys(newData)) {
      const dbRole = key.split('_')[0] // 'broker_ayam' -> 'broker'

      newData[key].trialDays = trialDays

      if (dbPricing?.[dbRole]) {
        const dp = dbPricing[dbRole]
        // Handle PRO
        if (dp.pro) {
          newData[key].proPrice = dp.pro.price
          newData[key].proStrike = dp.pro.originalPrice
          newData[key].proYearly = Math.round(dp.pro.price * (1 - (discountPct / 100)))
        }
        // Handle BUSINESS
        if (dp.business) {
          newData[key].bizPrice = dp.business.price
          newData[key].bizStrike = dp.business.originalPrice
          newData[key].bizYearly = Math.round(dp.business.price * (1 - (discountPct / 100)))
        }
      }
    }
    return newData
  }, [dbPricing, dbConfigs])

  const handleRoleChange = (role) => {
    setSelectedRole(role)
    const defaults = { broker: 'ayam', peternak: 'ayam', rpa: 'buyer' }
    setSelectedSub(defaults[role])
  }

  const contentKey = `${selectedRole}_${selectedSub}`
  const data = dynamicPricingData[contentKey]
  const annualDiscount = dbConfigs?.annual_discount || { discount_percent: 20, badge_text: 'Hemat 2 bln!' }


  return (
    <div className="min-h-screen bg-[#06090F] text-[#F1F5F9] overflow-x-hidden">
      <Navbar />

      {/* Global Background Elements */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 50% at center top, black 30%, transparent 80%)',
          maskImage: 'radial-gradient(ellipse 80% 50% at center top, black 30%, transparent 80%)'
        }}
      />
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <Particles
          particleColors={['#10B981', '#34D399', '#059669']}
          particleCount={typeof window !== 'undefined' && window.innerWidth < 768 ? 25 : 50}
          speed={0.2}
          particleBaseSize={1.4}
        />
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="fixed top-[-120px] left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(16,185,129,0.18),transparent_70%)] animate-glow-breathe z-0 pointer-events-none md:w-[800px] md:h-[800px]"
      />

      <main className="relative z-10">

        {/* ── HEADER ── */}
        <section className="relative pt-32 pb-16 px-5 text-center">
          <div className="relative z-10 max-w-2xl mx-auto">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-[11px] font-bold uppercase tracking-widest text-[#10B981] mb-6"
            >
              HARGA TRANSPARAN
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className={`font-['Sora'] ${isDesktop ? 'text-4xl md:text-5xl lg:text-6xl' : 'text-3xl'} font-black text-white ${isDesktop ? 'leading-tight' : 'leading-[1.2]'} mb-4`}
            >
              Pilih plan yang sesuai bisnismu.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-[#94A3B8] text-lg"
            >
              Paket Pro & Business include trial {data.trialDays || 14} hari gratis.
            </motion.p>
          </div>
        </section>

        {/* ── BILLING TOGGLE ── */}
        <div className="flex justify-center mb-8 px-5">
          <div className="inline-flex items-center bg-[#111C24] border border-white/8 rounded-full p-1 gap-1">
            {['monthly', 'yearly'].map(b => (
              <button
                key={b}
                type="button"
                onClick={() => setBilling(b)}
                className={`relative px-5 py-2 rounded-full text-xs font-bold transition-colors duration-200 cursor-pointer border-none ${billing === b ? 'text-white' : 'text-white/40 hover:text-white/70'
                  }`}
              >
                {billing === b && (
                  <motion.span
                    layoutId="billing-bg"
                    className="absolute inset-0 rounded-full bg-white/10"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                <span className="relative">
                  {b === 'monthly' ? 'Bulanan' : 'Tahunan'}
                </span>
                {b === 'yearly' && billing === 'yearly' && (
                  <span className="relative ml-2 bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {annualDiscount.badge_text}
                  </span>
                )}
                {b === 'yearly' && billing !== 'yearly' && (
                  <span className="relative ml-2 bg-amber-500/10 text-amber-500/60 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {annualDiscount.badge_text}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── TAB BAR ── */}
        <div className="flex flex-col items-center gap-2 mb-10 px-4">

          {/* Level 1 — Role */}
          <div className="inline-flex bg-[#111C24] border border-white/8 rounded-full p-1 gap-1">
            {ROLES.map(role => (
              <button
                key={role.id}
                type="button"
                onClick={() => handleRoleChange(role.id)}
                className={`relative px-5 md:px-7 py-2 rounded-full text-[11px] md:text-xs font-bold uppercase tracking-wider transition-colors duration-200 cursor-pointer border-none ${selectedRole === role.id ? 'text-emerald-400' : 'text-white/40 hover:text-white/70'
                  }`}
              >
                {selectedRole === role.id && (
                  <motion.span
                    layoutId="harga-tab-bg"
                    className="absolute inset-0 rounded-full bg-emerald-500/10 border border-emerald-500/40"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                <span className="relative">{role.emoji} {role.label}</span>
              </button>
            ))}
          </div>

          {/* Level 2 — Sub-tabs */}
          {(SUBS[selectedRole]?.length ?? 0) > 0 && (
            <div className="flex items-center gap-1.5">
              {SUBS[selectedRole].map(sub => (
                <button
                  key={sub.id}
                  type="button"
                  disabled={sub.disabled}
                  onClick={() => !sub.disabled && setSelectedSub(sub.id)}
                  className={`flex items-center gap-1 px-3.5 py-1 rounded-full text-[11px] font-semibold border transition-colors duration-150 ${sub.disabled
                    ? 'opacity-40 cursor-not-allowed border-white/8 text-white/40'
                    : selectedSub === sub.id
                      ? 'border-white/20 bg-white/[0.08] text-white cursor-pointer'
                      : 'border-transparent text-white/50 hover:text-white/70 cursor-pointer'
                    }`}
                >
                  {sub.label}
                  {sub.disabled && (
                    <span className="text-[9px] font-bold text-amber-400/80 uppercase ml-0.5">Segera</span>
                  )}
                </button>
              ))}
            </div>
          )}

        </div>

        {/* ── PRICING CARDS ── */}
        <section className="px-4 md:px-8 pb-6">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={contentKey}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {/* Unified layout: 4 cards for ALL roles — Starter | PRO | Business | Enterprise */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start pt-6">
                  <StarterCard data={data} />
                  <ProCard data={data} billing={billing} annualDiscount={annualDiscount} />
                  <div className="lg:relative lg:z-10 lg:scale-[1.03]">
                    <BusinessCard data={data} billing={billing} roleLabel={ROLES.find(r => r.id === selectedRole)?.label} annualDiscount={annualDiscount} />
                  </div>
                  <EnterpriseCard />
                </div>
              </motion.div>
            </AnimatePresence>

            {/* All plans note */}
            <p className="text-center text-xs text-[#4B6478] mt-8">
              Paket Pro & Business include: Trial {data.trialDays || 14} hari gratis · Tidak perlu kartu kredit · Cancel kapan saja
            </p>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-24 px-5 bg-[#080D13]">
          <div className="max-w-2xl mx-auto">

            <FadeUp className="text-center mb-12">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#10B981] mb-4">FAQ</p>
              <h2 className="font-['Sora'] text-3xl font-bold text-white">Pertanyaan Umum</h2>
            </FadeUp>

            <FadeUp delay={0.1}>
              <div className="divide-y-0">
                {FAQ_LIST.map((item, i) => (
                  <AccordionItem key={i} q={item.q} a={item.a} />
                ))}
              </div>
            </FadeUp>

          </div>
        </section>

        {/* ── CTA FINAL ── */}
        <section className="py-24 px-5">
          <div className="max-w-2xl mx-auto">
            <FadeUp>
              <div className="relative rounded-3xl p-12 text-center border border-emerald-500/20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent pointer-events-none rounded-3xl" />
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 bg-emerald-500/10 blur-3xl pointer-events-none" />

                <div className="relative z-10">
                  <h2 className="font-['Sora'] text-3xl font-bold text-white mb-3">Masih ragu?</h2>
                  <p className="text-[#94A3B8] mb-8">Coba trial gratis untuk paket Pro & Business. Tidak perlu kartu kredit.</p>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                      to="/register"
                      className="inline-flex items-center gap-2 px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-all shadow-[0_4px_20px_rgba(16,185,129,0.3)]"
                    >
                      Mulai Sekarang
                      <ArrowRight size={16} />
                    </Link>
                    <a
                      href={WA_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#4B6478] hover:text-white transition-colors"
                    >
                      Tanya dulu via WhatsApp →
                    </a>
                  </div>
                </div>
              </div>
            </FadeUp>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  )
}
