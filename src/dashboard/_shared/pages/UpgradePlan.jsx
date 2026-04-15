import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, Copy, ArrowLeft, Zap, Crown, Loader2, CheckCircle2,
  Truck, Users, FileText, TrendingUp, Calculator, Warehouse,
  Receipt, BarChart3, ShieldCheck, Headphones, Infinity,
  ChevronDown, ChevronUp, Star, Building2,
} from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { usePaymentSettings, usePricingConfig, useCreateInvoice } from '@/lib/hooks/useAdminData'
import { formatIDR } from '@/lib/format'
import { getSubscriptionStatus } from '@/lib/subscriptionUtils'
import { format, addMonths } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ─── Billing options ─────────────────────────────────────────────────────────

const BILLING_OPTIONS = [
  { months: 1,  label: '1 Bln',   discount: 0   },
  { months: 3,  label: '3 Bln',   discount: 5   },
  { months: 6,  label: '6 Bln',   discount: 10  },
  { months: 12, label: '1 Tahun', discount: 20  },
]

// ─── Role-specific feature matrix ────────────────────────────────────────────

const ROLE_FEATURES = {
  broker: {
    label: 'Broker Ayam',
    pro: [
      { icon: <Infinity size={13} />, text: 'Transaksi tidak terbatas (vs 30/bln)' },
      { icon: <Truck size={13} />,    text: 'Armada hingga 5 kendaraan & sopir' },
      { icon: <TrendingUp size={13} />, text: 'Cash Flow & laporan keuangan' },
      { icon: <Users size={13} />,    text: 'Tim hingga 3 anggota' },
      { icon: <FileText size={13} />, text: 'Generate invoice & PDF profesional' },
      { icon: <Calculator size={13} />, text: 'Simulator keuntungan' },
    ],
    business: [
      { icon: <Infinity size={13} />, text: 'Semua fitur Pro' },
      { icon: <Users size={13} />,    text: 'Tim tidak terbatas' },
      { icon: <Truck size={13} />,    text: 'Armada tidak terbatas' },
      { icon: <BarChart3 size={13} />, text: 'Laporan & analitik lanjutan' },
      { icon: <ShieldCheck size={13} />, text: 'Akses API & integrasi' },
      { icon: <Headphones size={13} />, text: 'Dedicated account manager' },
    ],
  },
  peternak: {
    label: 'Peternak',
    pro: [
      { icon: <Warehouse size={13} />, text: 'Hingga 3 kandang' },
      { icon: <TrendingUp size={13} />, text: 'Laporan profit & FCR otomatis' },
      { icon: <FileText size={13} />, text: 'Export PDF & cetak laporan' },
      { icon: <Receipt size={13} />,  text: 'Riwayat siklus panen lengkap' },
      { icon: <BarChart3 size={13} />, text: 'Analitik performa kandang' },
      { icon: <Headphones size={13} />, text: 'Support prioritas WhatsApp' },
    ],
    business: [
      { icon: <Infinity size={13} />, text: 'Semua fitur Pro' },
      { icon: <Warehouse size={13} />, text: 'Kandang tidak terbatas' },
      { icon: <Users size={13} />,    text: 'Multi-user manajemen kandang' },
      { icon: <ShieldCheck size={13} />, text: 'Akses API data produksi' },
      { icon: <BarChart3 size={13} />, text: 'Dashboard analitik enterprise' },
      { icon: <Headphones size={13} />, text: 'Dedicated account manager' },
    ],
  },
  rpa: {
    label: 'Rumah Potong Ayam',
    pro: [
      { icon: <Infinity size={13} />, text: 'Order & transaksi tidak terbatas' },
      { icon: <Receipt size={13} />,  text: 'Manajemen piutang toko' },
      { icon: <FileText size={13} />, text: 'Invoice PDF profesional' },
      { icon: <BarChart3 size={13} />, text: 'Laporan penjualan & omzet' },
      { icon: <Users size={13} />,    text: 'Tim hingga 3 anggota' },
      { icon: <Headphones size={13} />, text: 'Support prioritas WhatsApp' },
    ],
    business: [
      { icon: <Infinity size={13} />, text: 'Semua fitur Pro' },
      { icon: <Warehouse size={13} />, text: 'Multi-lokasi / multi-outlet' },
      { icon: <Users size={13} />,    text: 'Tim tidak terbatas' },
      { icon: <ShieldCheck size={13} />, text: 'Akses API & integrasi ERP' },
      { icon: <BarChart3 size={13} />, text: 'Dashboard analitik enterprise' },
      { icon: <Headphones size={13} />, text: 'Dedicated account manager' },
    ],
  },
  egg_broker: {
    label: 'Broker Telur',
    pro: [
      { icon: <Infinity size={13} />, text: 'Penjualan & stok tidak terbatas' },
      { icon: <BarChart3 size={13} />, text: 'Laporan omzet & HPP otomatis' },
      { icon: <FileText size={13} />, text: 'Invoice PDF profesional' },
      { icon: <Receipt size={13} />,  text: 'Manajemen piutang pelanggan' },
      { icon: <Users size={13} />,    text: 'Tim hingga 3 anggota' },
      { icon: <Headphones size={13} />, text: 'Support prioritas WhatsApp' },
    ],
    business: [
      { icon: <Infinity size={13} />, text: 'Semua fitur Pro' },
      { icon: <Warehouse size={13} />, text: 'Multi-gudang / multi-lokasi' },
      { icon: <Users size={13} />,    text: 'Tim tidak terbatas' },
      { icon: <ShieldCheck size={13} />, text: 'Akses API & integrasi' },
      { icon: <BarChart3 size={13} />, text: 'Dashboard analitik enterprise' },
      { icon: <Headphones size={13} />, text: 'Dedicated account manager' },
    ],
  },
  sembako_broker: {
    label: 'Distributor Sembako',
    pro: [
      { icon: <Infinity size={13} />, text: 'Produk & transaksi tidak terbatas' },
      { icon: <BarChart3 size={13} />, text: 'FIFO stok & laporan COGS' },
      { icon: <FileText size={13} />, text: 'Invoice & surat jalan PDF' },
      { icon: <Receipt size={13} />,  text: 'Penggajian karyawan' },
      { icon: <Users size={13} />,    text: 'Tim hingga 3 anggota' },
      { icon: <Headphones size={13} />, text: 'Support prioritas WhatsApp' },
    ],
    business: [
      { icon: <Infinity size={13} />, text: 'Semua fitur Pro' },
      { icon: <Warehouse size={13} />, text: 'Multi-gudang / multi-outlet' },
      { icon: <Users size={13} />,    text: 'Tim tidak terbatas' },
      { icon: <ShieldCheck size={13} />, text: 'Akses API & integrasi ERP' },
      { icon: <BarChart3 size={13} />, text: 'Dashboard analitik enterprise' },
      { icon: <Headphones size={13} />, text: 'Dedicated account manager' },
    ],
  },
}

// ─── Plan config ──────────────────────────────────────────────────────────────

const PLAN_META = {
  pro: {
    label:       'Pro',
    tagline:     'Untuk bisnis yang berkembang',
    icon:        <Zap size={20} />,
    color:       '#10B981',
    colorMid:    'rgba(16,185,129,0.15)',
    colorLow:    'rgba(16,185,129,0.08)',
    colorBorder: 'rgba(16,185,129,0.35)',
    glow:        '0 0 40px rgba(16,185,129,0.15)',
    badge:       null,
  },
  business: {
    label:       'Business',
    tagline:     'Untuk operasi skala besar',
    icon:        <Crown size={20} />,
    color:       '#F59E0B',
    colorMid:    'rgba(245,158,11,0.15)',
    colorLow:    'rgba(245,158,11,0.08)',
    colorBorder: 'rgba(245,158,11,0.35)',
    glow:        '0 0 40px rgba(245,158,11,0.15)',
    badge:       'Populer',
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Map tenant.business_vertical → pricing_plans.role key
const VERTICAL_TO_PRICING_ROLE = {
  poultry_broker:  'broker',
  egg_broker:      'egg_broker',
  peternak:        'peternak',
  rumah_potong:    'rpa',
  sembako_broker:  'sembako_broker',
}

function getPricingRole(tenant) {
  return VERTICAL_TO_PRICING_ROLE[tenant?.business_vertical] || 'broker'
}

function getRoleFeatures(pricingRole) {
  return ROLE_FEATURES[pricingRole] || ROLE_FEATURES.broker
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PlanCard({ planKey, meta, price, isSelected, onSelect, features, billingMonths, discount }) {
  const monthlyDisplay = price ? formatIDR(Math.round(price * (1 - discount / 100))) : '—'
  const originalMonthly = price ? formatIDR(price) : null

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={() => onSelect(planKey)}
      className="relative w-full text-left rounded-2xl p-4 sm:p-5 transition-all duration-200 focus:outline-none"
      style={{
        background: isSelected ? meta.colorLow : '#0C1319',
        border: `1.5px solid ${isSelected ? meta.colorBorder : 'rgba(255,255,255,0.08)'}`,
        boxShadow: isSelected ? meta.glow : 'none',
      }}
    >
      {/* Badge */}
      {meta.badge && (
        <div
          className="absolute -top-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest"
          style={{ background: meta.color, color: '#000' }}
        >
          <Star size={8} fill="currentColor" /> {meta.badge}
        </div>
      )}

      {/* Selected checkmark */}
      {isSelected && (
        <div
          className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: meta.color }}
        >
          <Check size={11} color="#000" strokeWidth={3} />
        </div>
      )}

      {/* Plan header */}
      <div className="flex items-center gap-2 mb-2" style={{ color: meta.color }}>
        {meta.icon}
        <span className="font-display font-black text-base text-white">{meta.label}</span>
      </div>

      {/* Price */}
      <div className="mb-1">
        <div className="flex items-baseline gap-1.5">
          <span className="font-display font-black text-xl" style={{ color: meta.color }}>
            {monthlyDisplay}
          </span>
          <span className="text-[11px] text-[#4B6478]">/bln</span>
        </div>
        {discount > 0 && originalMonthly && (
          <div className="text-[10px] text-[#4B6478] line-through mt-0.5">{originalMonthly}/bln</div>
        )}
      </div>

      <p className="text-[11px] text-[#4B6478]">{meta.tagline}</p>

      {/* Features mini-list (3 items) */}
      <div className="mt-3 space-y-1.5">
        {features.slice(0, 3).map((f, i) => (
          <div key={i} className="flex items-center gap-2">
            <div style={{ color: meta.color, flexShrink: 0 }}>{f.icon}</div>
            <span className="text-[11px] text-[#64748B] leading-tight">{f.text}</span>
          </div>
        ))}
        {features.length > 3 && (
          <div className="text-[10px] font-semibold mt-1" style={{ color: meta.color }}>
            +{features.length - 3} fitur lainnya ↓
          </div>
        )}
      </div>
    </motion.button>
  )
}

function FeatureSection({ planKey, meta, features, billingMonths, basePrice, discount, isExpanded, onToggle }) {
  const total = basePrice ? Math.round(basePrice * billingMonths * (1 - discount / 100)) : 0

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: `1px solid ${meta.colorBorder}`, background: meta.colorLow }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <div style={{ color: meta.color }}>{meta.icon}</div>
          <span className="font-display font-bold text-sm text-white">
            Semua fitur {meta.label}
          </span>
        </div>
        <div style={{ color: meta.color }}>
          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2.5">
              {features.map((f, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: meta.colorMid, color: meta.color }}
                  >
                    {f.icon}
                  </div>
                  <span className="text-[12px] text-[#94A3B8] leading-snug">{f.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function BillingSelector({ value, onChange }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {BILLING_OPTIONS.map((opt) => {
        const isSelected = value === opt.months
        return (
          <motion.button
            key={opt.months}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(opt.months)}
            className="relative flex flex-col items-center justify-center py-3 rounded-xl text-center transition-all"
            style={{
              background: isSelected ? 'rgba(16,185,129,0.1)' : '#0C1319',
              border: `1.5px solid ${isSelected ? '#10B981' : 'rgba(255,255,255,0.08)'}`,
              color: isSelected ? '#10B981' : '#4B6478',
            }}
          >
            {opt.discount > 0 && (
              <div
                className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full text-[9px] font-black"
                style={{ background: '#10B981', color: '#000' }}
              >
                -{opt.discount}%
              </div>
            )}
            <span className="font-display font-bold text-[11px] sm:text-xs leading-tight">
              {opt.label}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UpgradePlan() {
  const navigate = useNavigate()
  const { profile, tenant } = useAuth()
  const { data: pricing } = usePricingConfig()
  const { data: banks } = usePaymentSettings()
  const createInvoice = useCreateInvoice()

  const [selectedPlan, setSelectedPlan] = useState('pro')
  const [billingMonths, setBillingMonths] = useState(1)
  const [expandedFeature, setExpandedFeature] = useState('pro')
  const [invoiceResult, setInvoiceResult] = useState(null)
  const [copied, setCopied] = useState(null)

  const pricingRole  = getPricingRole(tenant)
  const roleFeatures = getRoleFeatures(pricingRole)
  const activeBanks  = banks?.filter(b => b.is_active && b.bank_name !== 'xendit_config') || []

  const sub       = getSubscriptionStatus(tenant)
  const isRenewal = sub.status === 'active' && tenant?.plan === selectedPlan

  const basePrice  = pricing?.[pricingRole]?.[selectedPlan]?.price || 0
  const discount   = BILLING_OPTIONS.find(o => o.months === billingMonths)?.discount || 0
  const total      = Math.round(basePrice * billingMonths * (1 - discount / 100))
  const savedAmount = Math.round(basePrice * billingMonths) - total

  const renewalBase   = isRenewal && sub.expiresAt > new Date() ? sub.expiresAt : new Date()
  const newExpiry     = addMonths(renewalBase, billingMonths)
  const newExpiryStr  = format(newExpiry, 'd MMM yyyy', { locale: localeId })

  const currentPlanMeta = PLAN_META[selectedPlan]

  const handleSubmit = async () => {
    if (!profile?.tenant_id) return
    try {
      const invoiceNumber = await createInvoice.mutateAsync({
        tenantId:     profile.tenant_id,
        plan:         selectedPlan,
        billingMonths,
        amount:       total,
        notes:        `${isRenewal ? 'Perpanjang' : 'Upgrade ke'} ${PLAN_META[selectedPlan].label} — ${billingMonths} bulan`,
      })
      setInvoiceResult(invoiceNumber)
    } catch (_) { /* handled by mutation */ }
  }

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    toast.success('Disalin!')
    setTimeout(() => setCopied(null), 2000)
  }

  // ── Success screen ──────────────────────────────────────────────────────────

  if (invoiceResult) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#06090F' }}>
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="w-full max-w-md"
        >
          {/* Success icon */}
          <div className="flex flex-col items-center text-center mb-8">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
              style={{ background: 'rgba(16,185,129,0.12)', border: '2px solid rgba(16,185,129,0.3)', boxShadow: '0 0 40px rgba(16,185,129,0.2)' }}
            >
              <CheckCircle2 size={36} color="#10B981" />
            </div>
            <h2 className="font-display font-black text-2xl text-white mb-2">Invoice Dibuat!</h2>
            <p className="text-[#4B6478] text-sm">
              Selesaikan pembayaran untuk mengaktifkan plan{' '}
              <span className="text-white font-bold">{PLAN_META[selectedPlan].label}</span>
            </p>
          </div>

          {/* Invoice number */}
          <div
            className="flex items-center justify-between p-4 rounded-2xl mb-4"
            style={{ background: '#0C1319', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div>
              <p className="text-[11px] text-[#4B6478] mb-1 uppercase tracking-widest font-semibold">Nomor Invoice</p>
              <p className="font-display font-black text-base text-emerald-400">{invoiceResult}</p>
            </div>
            <button
              onClick={() => copyToClipboard(invoiceResult, 'inv')}
              className="p-2 rounded-xl transition-colors"
              style={{ background: copied === 'inv' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: copied === 'inv' ? '#10B981' : '#4B6478' }}
            >
              {copied === 'inv' ? <CheckCircle2 size={15} /> : <Copy size={15} />}
            </button>
          </div>

          {/* Info */}
          <div
            className="p-4 rounded-2xl mb-5 text-[13px] text-[#94A3B8] leading-relaxed"
            style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}
          >
            Transfer <strong className="text-white">{formatIDR(total)}</strong> ke rekening di bawah, lalu kirim bukti ke admin via WhatsApp. Dikonfirmasi dalam{' '}
            <strong className="text-white">1×24 jam kerja</strong>.
          </div>

          {/* Banks */}
          <div className="space-y-3 mb-6">
            {activeBanks.map((bank) => (
              <div
                key={bank.id}
                className="flex items-center justify-between p-4 rounded-2xl"
                style={{ background: '#0C1319', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div>
                  <p className="text-[11px] text-[#4B6478] mb-0.5 font-semibold uppercase tracking-wider">{bank.bank_name}</p>
                  <p className="font-display font-black text-[15px] text-white mb-0.5">{bank.account_number}</p>
                  <p className="text-[11px] text-[#4B6478]">a.n. {bank.account_name}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(bank.account_number, bank.id)}
                  className="p-2.5 rounded-xl transition-colors"
                  style={{ background: copied === bank.id ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: copied === bank.id ? '#10B981' : '#4B6478' }}
                >
                  {copied === bank.id ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 text-[13px] text-[#4B6478] hover:text-[#94A3B8] transition-colors w-full"
          >
            <ArrowLeft size={14} /> Kembali ke Dashboard
          </button>
        </motion.div>
      </div>
    )
  }

  // ── Main screen ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ background: '#06090F' }}>
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0 transition-all duration-700"
        style={{
          background: selectedPlan === 'pro'
            ? 'radial-gradient(ellipse 60% 40% at 50% -10%, rgba(16,185,129,0.08) 0%, transparent 70%)'
            : 'radial-gradient(ellipse 60% 40% at 50% -10%, rgba(245,158,11,0.08) 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-lg mx-auto px-4 pt-6 pb-32">

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[13px] text-[#4B6478] hover:text-[#94A3B8] transition-colors mb-6"
        >
          <ArrowLeft size={14} /> Kembali
        </button>

        {/* Hero */}
        <div className="mb-7">
          {/* Current plan badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-3 text-[10px] font-black uppercase tracking-widest"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#4B6478' }}
          >
            Plan aktif:&nbsp;
            <span className="text-emerald-400">{sub.label || 'Starter'}</span>
          </div>

          <h1 className="font-display font-black text-[26px] sm:text-3xl text-white leading-tight mb-1">
            {isRenewal ? 'Perpanjang' : 'Upgrade'} Plan
          </h1>
          <p className="text-[13px] text-[#4B6478]">
            {roleFeatures.label} · Pilih plan yang sesuai kebutuhan bisnis kamu
          </p>
        </div>

        {/* ── Plan Cards ── */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {Object.entries(PLAN_META).map(([key, meta]) => {
            const price = pricing?.[pricingRole]?.[key]?.price
            return (
              <PlanCard
                key={key}
                planKey={key}
                meta={meta}
                price={price}
                isSelected={selectedPlan === key}
                onSelect={setSelectedPlan}
                features={roleFeatures[key]}
                billingMonths={billingMonths}
                discount={discount}
              />
            )
          })}
        </div>

        {/* ── Feature Sections (expandable) ── */}
        <div className="space-y-2.5 mb-6">
          {Object.entries(PLAN_META).map(([key, meta]) => (
            <FeatureSection
              key={key}
              planKey={key}
              meta={meta}
              features={roleFeatures[key]}
              billingMonths={billingMonths}
              basePrice={pricing?.[pricingRole]?.[key]?.price || 0}
              discount={discount}
              isExpanded={expandedFeature === key}
              onToggle={() => setExpandedFeature(v => v === key ? null : key)}
            />
          ))}
        </div>

        {/* ── Divider ── */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <span className="text-[10px] text-[#2A3F52] font-semibold uppercase tracking-widest">Add-on & Fitur Ekstra</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
        </div>

        {/* ── Add-on: Multi-Tenant Slot ── */}
        <div className="mb-8">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/dashboard/addons')}
            className="w-full text-left p-5 rounded-3xl bg-[linear-gradient(135deg,rgba(168,85,247,0.1),rgba(168,85,247,0.05))] border border-purple-500/20 group hover:border-purple-500/40 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="font-display font-black text-sm text-white uppercase tracking-tight">Slot Bisnis Tambahan</h3>
                  <p className="text-[11px] text-[#4B6478]">Kelola multi-bisnis dalam 1 akun</p>
                </div>
              </div>
              <div className="bg-purple-500/20 text-purple-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-purple-500/20 group-hover:bg-purple-500 group-hover:text-white transition-all">
                Mulai Rp 150rb
              </div>
            </div>
            <p className="text-xs text-[#94A3B8] leading-relaxed mb-4">
              Bapak punya unit usaha RPA dan Kandang terpisah? Tambah slot bisnis agar data tidak bercampur dan laporan tetap profesional.
            </p>
            <div className="flex items-center gap-2 text-[11px] font-bold text-purple-400 group-hover:gap-3 transition-all">
              Beli Slot Bisnis Baru <Zap size={12} className="fill-purple-400" />
            </div>
          </motion.button>
        </div>

        {/* ── Divider 2 ── */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <span className="text-[10px] text-[#2A3F52] font-semibold uppercase tracking-widest">Atur Langganan</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
        </div>

        {/* ── Billing Period ── */}
        <div className="mb-6">
          <p className="text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mb-3">Durasi Berlangganan</p>
          <BillingSelector value={billingMonths} onChange={setBillingMonths} />
        </div>

        {/* ── Price Summary ── */}
        <motion.div
          layout
          className="rounded-2xl overflow-hidden mb-5"
          style={{ background: '#0C1319', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="p-4 space-y-2.5">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[#4B6478]">Harga/bulan</span>
              <span className="text-[#94A3B8] font-semibold">{basePrice ? formatIDR(basePrice) : '—'}</span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[#4B6478]">Durasi</span>
              <span className="text-[#94A3B8] font-semibold">{billingMonths} bulan</span>
            </div>
            {discount > 0 && (
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-emerald-400 font-semibold">Hemat {discount}%</span>
                <span className="text-emerald-400 font-semibold">-{formatIDR(savedAmount)}</span>
              </div>
            )}
            {isRenewal && (
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-[#4B6478]">Aktif hingga</span>
                <span className="text-emerald-400 font-bold">{newExpiryStr}</span>
              </div>
            )}
          </div>
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ background: 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <span className="font-display font-black text-base text-white">Total</span>
            <motion.span
              key={total}
              initial={{ scale: 1.1, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              className="font-display font-black text-xl"
              style={{ color: currentPlanMeta.color }}
            >
              {total ? formatIDR(total) : '—'}
            </motion.span>
          </div>
        </motion.div>

        {/* ── Bank Transfer ── */}
        {activeBanks.length > 0 && (
          <div className="mb-6">
            <p className="text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mb-3">Transfer ke</p>
            <div className="space-y-2.5">
              {activeBanks.map((bank) => (
                <div
                  key={bank.id}
                  className="flex items-center justify-between p-4 rounded-2xl"
                  style={{ background: '#0C1319', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div>
                    <p className="text-[11px] text-[#4B6478] mb-0.5 font-semibold uppercase tracking-wider">{bank.bank_name}</p>
                    <p className="font-display font-black text-base text-white mb-0.5">{bank.account_number}</p>
                    <p className="text-[11px] text-[#4B6478]">a.n. {bank.account_name}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(bank.account_number, bank.id)}
                    className="p-2.5 rounded-xl transition-all"
                    style={{
                      background: copied === bank.id ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: copied === bank.id ? '#10B981' : '#4B6478',
                    }}
                  >
                    {copied === bank.id ? <CheckCircle2 size={15} /> : <Copy size={15} />}
                  </button>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-[#2A3F52] mt-3 leading-relaxed">
              Setelah transfer, kirim bukti ke admin. Dikonfirmasi dalam 1×24 jam kerja.
            </p>
          </div>
        )}
      </div>

      {/* ── Sticky CTA ── */}
      <div
        className="fixed bottom-0 left-0 right-0 p-4 sm:p-5"
        style={{
          background: 'linear-gradient(to top, #06090F 60%, transparent)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="max-w-lg mx-auto">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={createInvoice.isPending || !basePrice}
            className="w-full py-4 rounded-2xl font-display font-black text-[15px] transition-all disabled:opacity-60"
            style={{
              background: currentPlanMeta.color,
              color: selectedPlan === 'business' ? '#000' : '#fff',
              boxShadow: `0 4px 24px ${currentPlanMeta.colorMid}`,
            }}
          >
            {createInvoice.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Memproses...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                {currentPlanMeta.icon}
                {isRenewal ? 'Perpanjang' : 'Upgrade ke'} {PLAN_META[selectedPlan].label}
                <span className="opacity-70">·</span>
                {total ? formatIDR(total) : '—'}
              </span>
            )}
          </motion.button>

          <p className="text-center text-[10px] text-[#2A3F52] mt-2">
            Pembayaran manual via transfer bank · Dikonfirmasi 1×24 jam
          </p>
        </div>
      </div>
    </div>
  )
}
