import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, Copy, ArrowLeft, Zap, Crown, Loader2, CheckCircle2,
  Truck, Users, FileText, TrendingUp, Calculator, Warehouse,
  Receipt, BarChart3, ShieldCheck, Headphones, Infinity,
  ChevronDown, ChevronUp, Star, Building2, MessageCircle, Clock,
} from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { usePaymentSettings, usePricingConfig, useCreateInvoice, useActivateTrial, usePlanConfigs } from '@/lib/hooks/useAdminData'
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
  const createInvoice  = useCreateInvoice()
  const activateTrial  = useActivateTrial()
  const { data: planConfigs = {} } = usePlanConfigs()

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

  const isDesktop       = useMediaQuery('(min-width: 1024px)')
  const currentPlanMeta = PLAN_META[selectedPlan]
  const trialUsed       = !!tenant?.trial_ends_at
  const canTrial        = sub.plan === 'starter' && !trialUsed
  const trialDays       = planConfigs?.trial_config?.pro ?? 7

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
    const successMeta = PLAN_META[selectedPlan]
    const steps = [
      { n: '1', label: 'Salin nomor invoice', done: true },
      { n: '2', label: `Transfer ${formatIDR(total)} ke rekening di bawah` },
      { n: '3', label: 'Kirim bukti transfer ke admin via WhatsApp' },
      { n: '4', label: 'Plan aktif dalam 1×24 jam kerja' },
    ]
    return (
      <div className="min-h-screen p-5" style={{ background: '#06090F' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className="max-w-md mx-auto pt-6"
        >
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-7">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 18 }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: `${successMeta.colorMid}`, border: `1.5px solid ${successMeta.colorBorder}`, boxShadow: successMeta.glow }}
            >
              <CheckCircle2 size={28} color={successMeta.color} />
            </motion.div>
            <h2 className="font-display font-black text-2xl text-white mb-1">Invoice Dibuat!</h2>
            <p className="text-[13px] text-[#4B6478]">
              Selesaikan 3 langkah di bawah untuk mengaktifkan{' '}
              <span className="font-bold" style={{ color: successMeta.color }}>{successMeta.label}</span>
            </p>
          </div>

          {/* Invoice number */}
          <div
            className="flex items-center justify-between p-4 rounded-2xl mb-5"
            style={{ background: '#0C1319', border: `1px solid ${successMeta.colorBorder}` }}
          >
            <div>
              <p className="text-[10px] text-[#4B6478] mb-1 uppercase tracking-widest font-bold">Nomor Invoice</p>
              <p className="font-display font-black text-lg" style={{ color: successMeta.color }}>{invoiceResult}</p>
              <p className="text-[10px] text-[#2A3F52] mt-0.5">Sertakan di pesan WhatsApp kamu</p>
            </div>
            <button
              onClick={() => copyToClipboard(invoiceResult, 'inv')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all text-[12px] font-bold"
              style={{
                background: copied === 'inv' ? successMeta.colorMid : 'rgba(255,255,255,0.05)',
                border: `1px solid ${copied === 'inv' ? successMeta.colorBorder : 'rgba(255,255,255,0.08)'}`,
                color: copied === 'inv' ? successMeta.color : '#4B6478',
              }}
            >
              {copied === 'inv' ? <><CheckCircle2 size={13} /> Disalin</> : <><Copy size={13} /> Salin</>}
            </button>
          </div>

          {/* Steps */}
          <div className="space-y-2.5 mb-5">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: s.done ? `${successMeta.colorLow}` : 'rgba(255,255,255,0.02)', border: `1px solid ${s.done ? successMeta.colorBorder : 'rgba(255,255,255,0.05)'}` }}
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-black"
                  style={{ background: s.done ? successMeta.color : 'rgba(255,255,255,0.08)', color: s.done ? '#000' : '#4B6478' }}
                >
                  {s.done ? <Check size={11} strokeWidth={3} /> : s.n}
                </div>
                <span className={`text-[13px] ${s.done ? 'text-white font-semibold' : 'text-[#4B6478]'}`}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Bank accounts */}
          {activeBanks.length > 0 && (
            <div className="mb-5">
              <p className="text-[10px] font-bold text-[#4B6478] uppercase tracking-widest mb-2">Rekening Tujuan</p>
              <div className="space-y-2.5">
                {activeBanks.map((bank) => (
                  <div key={bank.id} className="flex items-center justify-between p-4 rounded-2xl"
                    style={{ background: '#0C1319', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <div>
                      <p className="text-[11px] text-[#4B6478] mb-0.5 font-semibold uppercase tracking-wider">{bank.bank_name}</p>
                      <p className="font-display font-black text-base text-white mb-0.5">{bank.account_number}</p>
                      <p className="text-[11px] text-[#4B6478]">a.n. {bank.account_name}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(bank.account_number, bank.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all text-[12px] font-bold"
                      style={{
                        background: copied === bank.id ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${copied === bank.id ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`,
                        color: copied === bank.id ? '#10B981' : '#4B6478',
                      }}
                    >
                      {copied === bank.id ? <><CheckCircle2 size={13} /> Disalin</> : <><Copy size={13} /> Salin</>}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 text-[13px] text-[#2A3F52] hover:text-[#4B6478] transition-colors w-full py-3"
          >
            <ArrowLeft size={13} /> Kembali ke Dashboard
          </button>
        </motion.div>
      </div>
    )
  }

  // ── Shared UI blocks (used in both layouts) ────────────────────────────────

  const planCards = (
    <div className="grid grid-cols-2 gap-3">
      {Object.entries(PLAN_META).map(([key, meta]) => (
        <PlanCard
          key={key} planKey={key} meta={meta}
          price={pricing?.[pricingRole]?.[key]?.price}
          isSelected={selectedPlan === key}
          onSelect={setSelectedPlan}
          features={roleFeatures[key]}
          billingMonths={billingMonths}
          discount={discount}
        />
      ))}
    </div>
  )

  const trialBlock = canTrial ? (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(99,102,241,0.25)' }}
    >
      <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.06))' }}
        className="p-4 flex items-center gap-4"
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(99,102,241,0.2)' }}>
          <Zap size={18} color="#818CF8" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-black text-sm text-white leading-tight">Coba Pro {trialDays} Hari — Gratis</p>
          <p className="text-[11px] text-[#64748B] mt-0.5">Tidak perlu kartu kredit. Batalkan kapan saja.</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => activateTrial.mutate({ tenantId: tenant.id, days: trialDays })}
          disabled={activateTrial.isPending}
          className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl font-display font-black text-[12px] disabled:opacity-60"
          style={{ background: '#818CF8', color: '#fff' }}
        >
          {activateTrial.isPending ? <Loader2 size={13} className="animate-spin" /> : 'Coba Gratis'}
        </motion.button>
      </div>
    </motion.div>
  ) : trialUsed && sub.status !== 'trial' ? (
    <p className="text-[11px] text-[#2A3F52] text-center">Trial sudah pernah digunakan.</p>
  ) : null

  const featureSections = (
    <div className="space-y-2.5">
      {Object.entries(PLAN_META).map(([key, meta]) => (
        <FeatureSection
          key={key} planKey={key} meta={meta}
          features={roleFeatures[key]}
          billingMonths={billingMonths}
          basePrice={pricing?.[pricingRole]?.[key]?.price || 0}
          discount={discount}
          isExpanded={expandedFeature === key}
          onToggle={() => setExpandedFeature(v => v === key ? null : key)}
        />
      ))}
    </div>
  )

  const priceSummary = (
    <motion.div layout className="rounded-2xl overflow-hidden"
      style={{ background: '#0C1319', border: `1px solid ${currentPlanMeta.colorBorder}` }}
    >
      <div className="p-4 space-y-2.5">
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-[#4B6478]">Plan</span>
          <span className="font-semibold" style={{ color: currentPlanMeta.color }}>{currentPlanMeta.label}</span>
        </div>
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
            <span className="text-emerald-400 font-semibold">Diskon {discount}%</span>
            <span className="text-emerald-400 font-semibold">-{formatIDR(savedAmount)}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-[#4B6478]">Aktif hingga</span>
          <span className="font-bold" style={{ color: currentPlanMeta.color }}>{newExpiryStr}</span>
        </div>
      </div>
      <div className="px-4 py-3 flex items-center justify-between"
        style={{ background: 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <span className="font-display font-black text-base text-white">Total Bayar</span>
        <motion.span key={total} initial={{ scale: 1.1, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }}
          className="font-display font-black text-xl" style={{ color: currentPlanMeta.color }}
        >
          {total ? formatIDR(total) : '—'}
        </motion.span>
      </div>
    </motion.div>
  )

  const bankList = activeBanks.length > 0 && (
    <div>
      <p className="text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mb-3">Transfer ke</p>
      <div className="space-y-2.5">
        {activeBanks.map((bank) => (
          <div key={bank.id} className="flex items-center justify-between p-4 rounded-2xl"
            style={{ background: '#0C1319', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div>
              <p className="text-[11px] text-[#4B6478] mb-0.5 font-semibold uppercase tracking-wider">{bank.bank_name}</p>
              <p className="font-display font-black text-base text-white mb-0.5">{bank.account_number}</p>
              <p className="text-[11px] text-[#4B6478]">a.n. {bank.account_name}</p>
            </div>
            <button onClick={() => copyToClipboard(bank.account_number, bank.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all text-[12px] font-bold"
              style={{
                background: copied === bank.id ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${copied === bank.id ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`,
                color: copied === bank.id ? '#10B981' : '#4B6478',
              }}
            >
              {copied === bank.id ? <><CheckCircle2 size={13} /> Disalin</> : <><Copy size={13} /> Salin</>}
            </button>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-[#2A3F52] mt-3">Setelah transfer, kirim bukti ke admin. Dikonfirmasi 1×24 jam kerja.</p>
    </div>
  )

  const ctaButton = (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={handleSubmit}
      disabled={createInvoice.isPending || !basePrice}
      className="w-full py-4 rounded-2xl font-display font-black text-[15px] transition-all disabled:opacity-60"
      style={{
        background: currentPlanMeta.color,
        color: selectedPlan === 'business' ? '#000' : '#fff',
        boxShadow: `0 4px 28px ${currentPlanMeta.colorMid}`,
      }}
    >
      {createInvoice.isPending ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 size={16} className="animate-spin" /> Memproses...
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          {currentPlanMeta.icon}
          {isRenewal ? 'Perpanjang' : 'Upgrade ke'} {currentPlanMeta.label}
          <span className="opacity-60">·</span>
          {total ? formatIDR(total) : '—'}
        </span>
      )}
    </motion.button>
  )

  const addonLink = (
    <button onClick={() => navigate('/dashboard/addons')}
      className="w-full flex items-center justify-between p-3 rounded-xl"
      style={{ background: 'rgba(168,85,247,0.04)', border: '1px solid rgba(168,85,247,0.12)' }}
    >
      <div className="flex items-center gap-2">
        <Building2 size={14} color="#A855F7" />
        <span className="text-[12px] text-[#64748B]">Butuh slot bisnis tambahan?</span>
      </div>
      <span className="text-[11px] font-bold text-purple-400">Mulai Rp 150rb →</span>
    </button>
  )

  const heroBadges = (
    <div className="flex items-center gap-2 mb-3 flex-wrap">
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#4B6478' }}
      >
        Plan aktif:&nbsp;<span className="text-emerald-400">{sub.label || 'Starter'}</span>
      </div>
      {sub.status === 'trial' && (
        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black"
          style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818CF8' }}
        >
          <Clock size={9} /> Trial aktif
        </div>
      )}
    </div>
  )

  const billingSelector = (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-bold text-[#4B6478] uppercase tracking-widest">Durasi Berlangganan</p>
        {discount > 0 && <span className="text-[11px] font-black text-emerald-400">Hemat {discount}% ✓</span>}
      </div>
      <BillingSelector value={billingMonths} onChange={setBillingMonths} />
    </div>
  )

  // ── Main screen ─────────────────────────────────────────────────────────────

  const ambientGlow = (
    <div className="pointer-events-none fixed inset-0 transition-all duration-700"
      style={{
        background: selectedPlan === 'pro'
          ? 'radial-gradient(ellipse 60% 40% at 50% -10%, rgba(16,185,129,0.1) 0%, transparent 70%)'
          : 'radial-gradient(ellipse 60% 40% at 50% -10%, rgba(245,158,11,0.1) 0%, transparent 70%)',
      }}
    />
  )

  // ── Desktop: two-column layout ────────────────────────────────────────────

  if (isDesktop) {
    return (
      <div className="min-h-screen" style={{ background: '#06090F' }}>
        {ambientGlow}
        <div className="relative max-w-5xl mx-auto px-8 pt-8 pb-12">

          {/* Top bar */}
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-[13px] text-[#4B6478] hover:text-[#94A3B8] transition-colors"
            >
              <ArrowLeft size={14} /> Kembali
            </button>
            {heroBadges}
          </div>

          {/* Hero heading */}
          <div className="mb-8">
            <h1 className="font-display font-black text-4xl text-white leading-tight mb-2">
              {isRenewal ? 'Perpanjang' : 'Upgrade'} Plan
            </h1>
            <p className="text-[14px] text-[#4B6478]">
              {roleFeatures.label} · Pilih plan & durasi — harga berubah otomatis
            </p>
          </div>

          {/* Two-column grid */}
          <div className="grid grid-cols-[1fr_360px] gap-8 items-start">

            {/* Left — plan selection */}
            <div className="space-y-6">
              {billingSelector}
              {planCards}
              {trialBlock}
              {featureSections}
              {addonLink}
            </div>

            {/* Right — sticky order panel */}
            <div className="sticky top-8 space-y-4">
              <div>
                <p className="text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mb-3">Ringkasan Pesanan</p>
                {priceSummary}
              </div>
              {bankList}
              <div>
                {ctaButton}
                <p className="text-center text-[10px] text-[#2A3F52] mt-2">
                  Transfer bank · Aktif hingga {newExpiryStr} · Konfirmasi 1×24 jam
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Mobile: single-column with sticky CTA ────────────────────────────────

  return (
    <div className="min-h-screen" style={{ background: '#06090F' }}>
      {ambientGlow}
      <div className="relative max-w-lg mx-auto px-4 pt-6 pb-36">

        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[13px] text-[#4B6478] hover:text-[#94A3B8] transition-colors mb-6"
        >
          <ArrowLeft size={14} /> Kembali
        </button>

        <div className="mb-6">
          {heroBadges}
          <h1 className="font-display font-black text-[26px] text-white leading-tight mb-1">
            {isRenewal ? 'Perpanjang' : 'Upgrade'} Plan
          </h1>
          <p className="text-[13px] text-[#4B6478]">
            {roleFeatures.label} · Pilih plan & durasi, harga berubah otomatis
          </p>
        </div>

        <div className="space-y-5">
          {billingSelector}
          {planCards}
          {trialBlock}
          {featureSections}
          {priceSummary}
          {bankList}
          {addonLink}
        </div>
      </div>

      {/* Sticky CTA — mobile only */}
      <div className="fixed bottom-0 left-0 right-0 p-4"
        style={{ background: 'linear-gradient(to top, #06090F 65%, transparent)', backdropFilter: 'blur(12px)' }}
      >
        <div className="max-w-lg mx-auto">
          {ctaButton}
          <p className="text-center text-[10px] text-[#2A3F52] mt-2">
            Transfer bank · Aktif hingga {newExpiryStr} · Konfirmasi 1×24 jam
          </p>
        </div>
      </div>
    </div>
  )
}
