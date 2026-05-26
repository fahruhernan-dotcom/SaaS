import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, ArrowLeft, Zap, Crown, Loader2, CheckCircle2, XCircle, AlertCircle,
  Truck, Users, FileText, TrendingUp, Calculator, Warehouse,
  Receipt, BarChart3, ShieldCheck, Headphones, Infinity as InfinityIcon,
  ChevronDown, ChevronUp, Star, Building2, Clock,
} from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { usePricingConfig, useCreateInvoice, useActivateTrial, usePlanConfigs, useHasPendingInvoice } from '@/lib/hooks/useAdminData'
import { supabase } from '@/lib/supabase'
import { formatIDR } from '@/lib/format'
import { getSubscriptionStatus } from '@/lib/subscriptionUtils'
import { FALLBACK_TRANSACTION_QUOTA } from '@/lib/constants/planGating'
import { format, addMonths } from 'date-fns'
import { id as localeId, enUS as localeEn } from 'date-fns/locale'
import { toast } from 'sonner'
import { useLanguage } from '@/lib/i18n/useLanguage'

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
    labelKey: 'role_broker_ayam_display',
    pro: [
      { key: 'feat_broker_pro_unlimited', icon: <InfinityIcon size={13} />, text: 'Transaksi tidak terbatas (vs {{STARTER_QUOTA}}/bln)' },
      { key: 'feat_broker_pro_fleet', icon: <Truck size={13} />,    text: 'Armada hingga 5 kendaraan & sopir' },
      { key: 'feat_broker_pro_cashflow', icon: <TrendingUp size={13} />, text: 'Cash Flow & laporan keuangan' },
      { key: 'feat_broker_pro_team', icon: <Users size={13} />,    text: 'Tim hingga 3 anggota' },
      { key: 'feat_broker_pro_invoice', icon: <FileText size={13} />, text: 'Generate invoice & PDF profesional' },
      { key: 'feat_broker_pro_simulator', icon: <Calculator size={13} />, text: 'Simulator keuntungan' },
    ],
    business: [
      { key: 'feat_broker_biz_all_pro', icon: <InfinityIcon size={13} />, text: 'Semua fitur Pro' },
      { key: 'feat_broker_biz_unlimited_team', icon: <Users size={13} />,    text: 'Tim tidak terbatas' },
      { key: 'feat_broker_biz_unlimited_fleet', icon: <Truck size={13} />,    text: 'Armada tidak terbatas' },
      { key: 'feat_broker_biz_advanced_reports', icon: <BarChart3 size={13} />, text: 'Laporan & analitik lanjutan' },
      { key: 'feat_broker_biz_api', icon: <ShieldCheck size={13} />, text: 'Akses API & integrasi' },
      { key: 'feat_broker_biz_manager', icon: <Headphones size={13} />, text: 'Dedicated account manager' },
    ],
  },
  peternak: {
    label: 'Peternak',
    labelKey: 'role_peternak_display',
    pro: [
      { key: 'feat_peternak_pro_barns', icon: <Warehouse size={13} />, text: 'Hingga 3 kandang' },
      { key: 'feat_peternak_pro_fcr', icon: <TrendingUp size={13} />, text: 'Laporan profit & FCR otomatis' },
      { key: 'feat_peternak_pro_export', icon: <FileText size={13} />, text: 'Export PDF & cetak laporan' },
      { key: 'feat_peternak_pro_history', icon: <Receipt size={13} />,  text: 'Riwayat siklus panen lengkap' },
      { key: 'feat_peternak_pro_analytics', icon: <BarChart3 size={13} />, text: 'Analitik performa kandang' },
      { key: 'feat_peternak_pro_support', icon: <Headphones size={13} />, text: 'Support prioritas WhatsApp' },
    ],
    business: [
      { key: 'feat_peternak_biz_all_pro', icon: <InfinityIcon size={13} />, text: 'Semua fitur Pro' },
      { key: 'feat_peternak_biz_unlimited_barns', icon: <Warehouse size={13} />, text: 'Kandang tidak terbatas' },
      { key: 'feat_peternak_biz_multiuser', icon: <Users size={13} />,    text: 'Multi-user manajemen kandang' },
      { key: 'feat_peternak_biz_api', icon: <ShieldCheck size={13} />, text: 'Akses API data produksi' },
      { key: 'feat_peternak_biz_enterprise_dashboard', icon: <BarChart3 size={13} />, text: 'Dashboard analitik enterprise' },
      { key: 'feat_peternak_biz_manager', icon: <Headphones size={13} />, text: 'Dedicated account manager' },
    ],
  },
  rpa: {
    label: 'Rumah Potong Ayam',
    labelKey: 'role_rpa_display',
    pro: [
      { key: 'feat_rpa_pro_unlimited', icon: <InfinityIcon size={13} />, text: 'Order & transaksi tidak terbatas' },
      { key: 'feat_rpa_pro_receivables', icon: <Receipt size={13} />,  text: 'Manajemen piutang toko' },
      { key: 'feat_rpa_pro_invoice', icon: <FileText size={13} />, text: 'Invoice PDF profesional' },
      { key: 'feat_rpa_pro_sales', icon: <BarChart3 size={13} />, text: 'Laporan penjualan & omzet' },
      { key: 'feat_rpa_pro_team', icon: <Users size={13} />,    text: 'Tim hingga 3 anggota' },
      { key: 'feat_rpa_pro_support', icon: <Headphones size={13} />, text: 'Support prioritas WhatsApp' },
    ],
    business: [
      { key: 'feat_rpa_biz_all_pro', icon: <InfinityIcon size={13} />, text: 'Semua fitur Pro' },
      { key: 'feat_rpa_biz_multilocation', icon: <Warehouse size={13} />, text: 'Multi-lokasi / multi-outlet' },
      { key: 'feat_rpa_biz_unlimited_team', icon: <Users size={13} />,    text: 'Tim tidak terbatas' },
      { key: 'feat_rpa_biz_api', icon: <ShieldCheck size={13} />, text: 'Akses API & integrasi ERP' },
      { key: 'feat_rpa_biz_enterprise_dashboard', icon: <BarChart3 size={13} />, text: 'Dashboard analitik enterprise' },
      { key: 'feat_rpa_biz_manager', icon: <Headphones size={13} />, text: 'Dedicated account manager' },
    ],
  },
  egg_broker: {
    label: 'Broker Telur',
    labelKey: 'role_egg_broker_display',
    pro: [
      { key: 'feat_egg_broker_pro_unlimited', icon: <InfinityIcon size={13} />, text: 'Penjualan & stok tidak terbatas' },
      { key: 'feat_egg_broker_pro_cogs', icon: <BarChart3 size={13} />, text: 'Laporan omzet & HPP otomatis' },
      { key: 'feat_egg_broker_pro_invoice', icon: <FileText size={13} />, text: 'Invoice PDF profesional' },
      { key: 'feat_egg_broker_pro_receivables', icon: <Receipt size={13} />,  text: 'Manajemen piutang pelanggan' },
      { key: 'feat_egg_broker_pro_team', icon: <Users size={13} />,    text: 'Tim hingga 3 anggota' },
      { key: 'feat_egg_broker_pro_support', icon: <Headphones size={13} />, text: 'Support prioritas WhatsApp' },
    ],
    business: [
      { key: 'feat_egg_broker_biz_all_pro', icon: <InfinityIcon size={13} />, text: 'Semua fitur Pro' },
      { key: 'feat_egg_broker_biz_multilocation', icon: <Warehouse size={13} />, text: 'Multi-gudang / multi-lokasi' },
      { key: 'feat_egg_broker_biz_unlimited_team', icon: <Users size={13} />,    text: 'Tim tidak terbatas' },
      { key: 'feat_egg_broker_biz_api', icon: <ShieldCheck size={13} />, text: 'Akses API & integrasi' },
      { key: 'feat_egg_broker_biz_enterprise_dashboard', icon: <BarChart3 size={13} />, text: 'Dashboard analitik enterprise' },
      { key: 'feat_egg_broker_biz_manager', icon: <Headphones size={13} />, text: 'Dedicated account manager' },
    ],
  },
  sembako_broker: {
    label: 'Distributor Sembako',
    labelKey: 'role_sembako_broker_display',
    pro: [
      { key: 'feat_sembako_pro_unlimited', icon: <InfinityIcon size={13} />, text: 'Produk & transaksi tidak terbatas' },
      { key: 'feat_sembako_pro_fifo', icon: <BarChart3 size={13} />, text: 'FIFO stok & laporan COGS' },
      { key: 'feat_sembako_pro_invoice', icon: <FileText size={13} />, text: 'Invoice & surat jalan PDF' },
      { key: 'feat_sembako_pro_payroll', icon: <Receipt size={13} />,  text: 'Penggajian karyawan' },
      { key: 'feat_sembako_pro_team', icon: <Users size={13} />,    text: 'Tim hingga 3 anggota' },
      { key: 'feat_sembako_pro_support', icon: <Headphones size={13} />, text: 'Support prioritas WhatsApp' },
    ],
    business: [
      { key: 'feat_sembako_biz_all_pro', icon: <InfinityIcon size={13} />, text: 'Semua fitur Pro' },
      { key: 'feat_sembako_biz_multilocation', icon: <Warehouse size={13} />, text: 'Multi-gudang / multi-outlet' },
      { key: 'feat_sembako_biz_unlimited_team', icon: <Users size={13} />,    text: 'Tim tidak terbatas' },
      { key: 'feat_sembako_biz_api', icon: <ShieldCheck size={13} />, text: 'Akses API & integrasi ERP' },
      { key: 'feat_sembako_biz_enterprise_dashboard', icon: <BarChart3 size={13} />, text: 'Dashboard analitik enterprise' },
      { key: 'feat_sembako_biz_manager', icon: <Headphones size={13} />, text: 'Dedicated account manager' },
    ],
  },
}

// ─── Plan config ──────────────────────────────────────────────────────────────

const PLAN_META = {
  pro: {
    label:       'Pro',
    tagline:     'Untuk bisnis yang berkembang',
    icon:        <Zap size={20} />,
    color:       '#021a02',
    colorMid:    'rgba(2, 26, 2,0.15)',
    colorLow:    'rgba(2, 26, 2,0.08)',
    colorBorder: 'rgba(2, 26, 2,0.35)',
    glow:        '0 0 40px rgba(2, 26, 2,0.15)',
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
  poultry_broker:                    'broker',
  egg_broker:                        'egg_broker',
  peternak:                          'peternak',
  peternak_ayam_broiler:             'peternak_ayam_broiler',
  peternak_ayam_layer:               'peternak_ayam_layer',
  peternak_sapi_penggemukan:         'peternak_sapi_potong_fattening',
  peternak_sapi_potong_fattening:    'peternak_sapi_potong_fattening',
  peternak_sapi_potong_breeding:     'peternak_sapi_potong_breeding',
  peternak_sapi_perah:               'peternak_sapi_perah',
  peternak_kambing_penggemukan:      'peternak_kambing_potong_fattening',
  peternak_kambing_potong_fattening: 'peternak_kambing_potong_fattening',
  peternak_kambing_potong_breeding:  'peternak_kambing_potong_breeding',
  peternak_kambing_perah:            'peternak_kambing_perah',
  peternak_domba_penggemukan:        'peternak_domba_potong_fattening',
  peternak_domba_potong_fattening:   'peternak_domba_potong_fattening',
  peternak_domba_potong_breeding:    'peternak_domba_potong_breeding',
  rumah_potong:                      'rpa',
  sembako_broker:                    'sembako_broker',
  distributor_sembako:               'sembako_broker',
}

function getPricingRole(tenant) {
  return VERTICAL_TO_PRICING_ROLE[tenant?.business_vertical] || 'broker'
}

function getRoleFeatures(pricingRole, starterQuota = FALLBACK_TRANSACTION_QUOTA, t) {
  const featureKey = ROLE_FEATURES[pricingRole]
    ? pricingRole
    : pricingRole?.startsWith('peternak_') ? 'peternak' : 'broker'
  const base = ROLE_FEATURES[featureKey]

  const mapFeature = (f) => {
    let text = t ? t(f.key, f.text) : f.text
    if (typeof text === 'string' && text.includes('{{STARTER_QUOTA}}')) {
      text = text.replace('{{STARTER_QUOTA}}', starterQuota)
    }
    return { ...f, text }
  }

  return {
    ...base,
    label: t ? t(base.labelKey, base.label) : base.label,
    pro: base.pro.map(mapFeature),
    business: base.business.map(mapFeature),
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PlanCard({ planKey, meta, price, isSelected, onSelect, features, _billingMonths, discount }) {
  const { t, tPlan } = useLanguage()
  const monthlyDisplay = price ? formatIDR(Math.round(price * (1 - discount / 100))) : '—'
  const originalMonthly = price ? formatIDR(price) : null
  const tagline = planKey === 'pro' ? t('plan_pro_tagline', meta.tagline) : t('plan_business_tagline', meta.tagline)
  const badge = meta.badge ? t('plan_popular_badge', meta.badge) : null

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
      {badge && (
        <div
          className="absolute -top-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest"
          style={{ background: meta.color, color: '#000' }}
        >
          <Star size={8} fill="currentColor" /> {badge}
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
        <span className="font-display font-black text-base text-white">{tPlan(planKey)}</span>
      </div>

      {/* Price */}
      <div className="mb-1">
        <div className="flex items-baseline gap-1.5">
          <span className="font-display font-black text-xl" style={{ color: meta.color }}>
            {monthlyDisplay}
          </span>
          <span className="text-[11px] text-[#4B6478]">{t('billing_per_month', '/bln')}</span>
        </div>
        {discount > 0 && originalMonthly && (
          <div className="text-[10px] text-[#4B6478] line-through mt-0.5">{originalMonthly}{t('billing_per_month', '/bln')}</div>
        )}
      </div>

      <p className="text-[11px] text-[#4B6478]">{tagline}</p>

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
            {t('upgrade_more_features', '+{count} fitur lainnya ↓').replace('{count}', features.length - 3)}
          </div>
        )}
      </div>
    </motion.button>
  )
}

function FeatureSection({ planKey, meta, features, billingMonths, basePrice, discount, isExpanded, onToggle }) {
  const { t, tPlan } = useLanguage()
  const _total = basePrice ? Math.round(basePrice * billingMonths * (1 - discount / 100)) : 0

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
            {t('upgrade_all_features_of', 'Semua fitur {label}').replace('{label}', tPlan(planKey))}
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
  const { t } = useLanguage()
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
              background: isSelected ? 'rgba(2, 26, 2,0.1)' : '#0C1319',
              border: `1.5px solid ${isSelected ? '#021a02' : 'rgba(255,255,255,0.08)'}`,
              color: isSelected ? '#021a02' : '#4B6478',
            }}
          >
            {opt.discount > 0 && (
              <div
                className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full text-[9px] font-black"
                style={{ background: '#021a02', color: '#000' }}
              >
                -{opt.discount}%
              </div>
            )}
            <span className="font-display font-bold text-[11px] sm:text-xs leading-tight">
              {opt.months === 12
                ? t('billing_1_year', '1 Tahun')
                : t('billing_months_count', `${opt.months} Bln`).replace('{months}', opt.months)}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}


// ─── Main Component ───────────────────────────────────────────────────────────

const PAYMENT_STATUS_META = {
  finish: {
    icon: <CheckCircle2 size={18} />,
    title: 'Pembayaran diterima!',
    body: 'Plan kamu sedang diaktifkan. Refresh halaman dalam 1–2 menit.',
    color: '#021a02',
    bg: 'rgba(2, 26, 2,0.08)',
    border: 'rgba(2, 26, 2,0.25)',
  },
  unfinish: {
    icon: <AlertCircle size={18} />,
    title: 'Pembayaran belum selesai',
    body: 'Kamu menutup halaman pembayaran sebelum selesai. Klik tombol upgrade untuk melanjutkan.',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.25)',
  },
  error: {
    icon: <XCircle size={18} />,
    title: 'Pembayaran gagal',
    body: 'Terjadi kesalahan saat memproses pembayaran. Coba lagi atau hubungi admin.',
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.25)',
  },
}

export default function UpgradePlan() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { profile, tenant } = useAuth()
  const { data: pricing } = usePricingConfig()
  const createInvoice  = useCreateInvoice()
  const activateTrial  = useActivateTrial()
  const { data: planConfigs = {} } = usePlanConfigs()
  const { data: hasPendingInvoice } = useHasPendingInvoice(profile?.tenant_id)
  const { lang, t, tPlan } = useLanguage()

  const [selectedPlan, setSelectedPlan] = useState(() => {
    const p = searchParams.get('plan')
    return (p === 'business' || p === 'pro') ? p : 'pro'
  })
  const [billingMonths, setBillingMonths] = useState(1)
  const [expandedFeature, setExpandedFeature] = useState('pro')
  const [redirecting, setRedirecting] = useState(false)

  const pricingRole  = getPricingRole(tenant)
  const starterQuota = planConfigs?.transaction_quota?.starter ?? FALLBACK_TRANSACTION_QUOTA
  const roleFeatures = getRoleFeatures(pricingRole, starterQuota, t)

  const sub       = getSubscriptionStatus(tenant)
  const isRenewal = sub.status === 'active' && tenant?.plan === selectedPlan

  const basePrice  = pricing?.[pricingRole]?.[selectedPlan]?.price || 0
  const discount   = BILLING_OPTIONS.find(o => o.months === billingMonths)?.discount || 0
  const total      = Math.round(basePrice * billingMonths * (1 - discount / 100))
  const savedAmount = Math.round(basePrice * billingMonths) - total

  const activeLocale  = lang === 'en' ? localeEn : localeId
  const renewalBase   = isRenewal && sub.expiresAt > new Date() ? sub.expiresAt : new Date()
  const newExpiry     = addMonths(renewalBase, billingMonths)
  const newExpiryStr  = format(newExpiry, 'd MMM yyyy', { locale: activeLocale })

  const isDesktop       = useMediaQuery('(min-width: 1024px)')
  const currentPlanMeta = PLAN_META[selectedPlan]
  const trialUsed       = !!tenant?.trial_ends_at
  const canTrial        = sub.plan === 'starter' && !trialUsed
  const trialDays       = selectedPlan === 'business'
    ? (planConfigs?.trial_config?.business ?? 7)
    : (planConfigs?.trial_config?.pro ?? 7)

  const getPaymentTranslation = (status) => {
    if (status === 'finish') {
      return {
        title: t('payment_success_title', 'Pembayaran diterima!'),
        body: t('payment_success_body', 'Plan kamu sedang diaktifkan. Refresh halaman dalam 1–2 menit.'),
      }
    }
    if (status === 'unfinish') {
      return {
        title: t('payment_pending_title', 'Pembayaran belum selesai'),
        body: t('payment_pending_body', 'Kamu menutup halaman pembayaran sebelum selesai. Klik tombol upgrade untuk melanjutkan.'),
      }
    }
    if (status === 'error') {
      return {
        title: t('payment_failed_title', 'Pembayaran gagal'),
        body: t('payment_failed_body', 'Terjadi kesalahan saat memproses pembayaran. Coba lagi atau hubungi admin.'),
      }
    }
    return null
  }

  const paymentStatus   = searchParams.get('payment') // 'finish' | 'unfinish' | 'error' | null
  const paymentMeta     = PAYMENT_STATUS_META[paymentStatus] ?? null
  const paymentTrans    = getPaymentTranslation(paymentStatus)

  const paymentBanner = paymentMeta && paymentTrans && (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 p-4 rounded-2xl mb-6"
      style={{ background: paymentMeta.bg, border: `1px solid ${paymentMeta.border}` }}
    >
      <span style={{ color: paymentMeta.color, flexShrink: 0, marginTop: 1 }}>{paymentMeta.icon}</span>
      <div>
        <p className="font-display font-black text-[13px] text-white leading-tight mb-0.5">{paymentTrans.title}</p>
        <p className="text-[12px] text-[#4B6478]">{paymentTrans.body}</p>
      </div>
    </motion.div>
  )

  const handleSubmit = async () => {
    if (!profile?.tenant_id) return
    if (hasPendingInvoice === true) {
      toast.warning(t('upgrade_toast_pending_invoice', 'Kamu sudah memiliki invoice pending. Tunggu konfirmasi admin atau hubungi admin untuk membatalkannya terlebih dahulu.'))
      return
    }
    try {
      const { invoiceId } = await createInvoice.mutateAsync({
        tenantId:     profile.tenant_id,
        plan:         selectedPlan,
        billingMonths,
        amount:       total,
        notes:        `${isRenewal ? t('upgrade_renew', 'Perpanjang') : t('upgrade_to', 'Upgrade ke')} ${tPlan(selectedPlan)} — ${billingMonths} bulan`,
      })
      setRedirecting(true)
      const { data: fnData, error: fnError } = await supabase.functions.invoke('midtrans-create-transaction', {
        body: { invoice_id: invoiceId },
      })
      if (fnError || !fnData?.redirect_url) {
        toast.error(t('upgrade_toast_midtrans_failed', 'Gagal menghubungi payment gateway. Silakan coba lagi atau hubungi admin.'))
        setRedirecting(false)
        return
      }
      window.location.assign(fnData.redirect_url)
    } catch (_) {
      setRedirecting(false)
    }
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
          <p className="font-display font-black text-sm text-white leading-tight">
            {t('upgrade_trial_title', 'Coba {plan} {days} Hari — Gratis')
              .replace('{plan}', tPlan(selectedPlan))
              .replace('{days}', trialDays)}
          </p>
          <p className="text-[11px] text-[#64748B] mt-0.5">{t('upgrade_trial_subtitle', 'Tidak perlu kartu kredit. Batalkan kapan saja.')}</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            if (!profile?.tenant_id) {
              toast.error(t('onboarding_error_invalid_config', 'Tenant ID tidak ditemukan.'))
              return
            }
            activateTrial.mutate(
              { tenantId: profile.tenant_id, plan: selectedPlan, days: trialDays },
              {
                onSuccess: () => {
                  navigate('/billing')
                }
              }
            )
          }}
          disabled={activateTrial.isPending}
          className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl font-display font-black text-[12px] disabled:opacity-60"
          style={{ background: '#818CF8', color: '#fff' }}
        >
          {activateTrial.isPending ? <Loader2 size={13} className="animate-spin" /> : t('upgrade_try_free', 'Coba Gratis')}
        </motion.button>
      </div>
    </motion.div>
  ) : trialUsed && sub.status !== 'trial' ? (
    <p className="text-[11px] text-[#2A3F52] text-center">{t('upgrade_trial_used', 'Trial sudah pernah digunakan.')}</p>
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
          <span className="text-[#4B6478]">{t('Plan', 'Plan')}</span>
          <span className="font-semibold" style={{ color: currentPlanMeta.color }}>{tPlan(selectedPlan)}</span>
        </div>
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-[#4B6478]">{t('upgrade_price_per_month', 'Harga/bulan')}</span>
          <span className="text-[#94A3B8] font-semibold">{basePrice ? formatIDR(basePrice) : '—'}</span>
        </div>
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-[#4B6478]">{t('upgrade_duration', 'Durasi')}</span>
          <span className="text-[#94A3B8] font-semibold">
            {billingMonths === 12
              ? t('billing_1_year', '1 Tahun')
              : t('billing_months_count', `${billingMonths} Bln`).replace('{months}', billingMonths)}
          </span>
        </div>
        {discount > 0 && (
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-emerald-400 font-semibold">{t('upgrade_discount_percent', 'Diskon {discount}%').replace('{discount}', discount)}</span>
            <span className="text-emerald-400 font-semibold">-{formatIDR(savedAmount)}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-[#4B6478]">{t('upgrade_active_until', 'Aktif hingga')}</span>
          <span className="font-bold" style={{ color: currentPlanMeta.color }}>{newExpiryStr}</span>
        </div>
      </div>
      <div className="px-4 py-3 flex items-center justify-between"
        style={{ background: 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <span className="font-display font-black text-base text-white">{t('upgrade_total_pay', 'Total Bayar')}</span>
        <motion.span key={total} initial={{ scale: 1.1, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }}
          className="font-display font-black text-xl" style={{ color: currentPlanMeta.color }}
        >
          {total ? formatIDR(total) : '—'}
        </motion.span>
      </div>
    </motion.div>
  )

  const ctaButton = (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={handleSubmit}
      disabled={createInvoice.isPending || redirecting || !basePrice}
      className="w-full py-4 rounded-2xl font-display font-black text-[15px] transition-all disabled:opacity-60"
      style={{
        background: currentPlanMeta.color,
        color: selectedPlan === 'business' ? '#000' : '#fff',
        boxShadow: `0 4px 28px ${currentPlanMeta.colorMid}`,
      }}
    >
      {redirecting ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 size={16} className="animate-spin" /> {t('upgrade_redirecting_payment', 'Mengarahkan ke pembayaran...')}
        </span>
      ) : createInvoice.isPending ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 size={16} className="animate-spin" /> {t('auth_processing', 'Memproses...')}
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          {currentPlanMeta.icon}
          {isRenewal ? t('upgrade_renew', 'Perpanjang') : t('upgrade_to', 'Upgrade ke')} {tPlan(selectedPlan)}
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
        <span className="text-[12px] text-[#64748B]">{t('upgrade_need_more_biz_slots', 'Butuh slot bisnis tambahan?')}</span>
      </div>
      <span className="text-[11px] font-bold text-purple-400">{t('upgrade_start_from_idr', 'Mulai Rp 150rb →')}</span>
    </button>
  )

  const heroBadges = (
    <div className="flex items-center gap-2 mb-3 flex-wrap">
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#4B6478' }}
      >
        {t('upgrade_active_plan', 'Plan aktif:')}&nbsp;<span className="text-emerald-400">{tPlan(sub.label?.toLowerCase() || 'starter')}</span>
      </div>
      {sub.status === 'trial' && (
        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black"
          style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818CF8' }}
        >
          <Clock size={9} /> {t('upgrade_trial_active', 'Trial aktif')}
        </div>
      )}
    </div>
  )

  const billingSelector = (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-bold text-[#4B6478] uppercase tracking-widest">{t('upgrade_sub_duration', 'Durasi Berlangganan')}</p>
        {discount > 0 && (
          <span className="text-[11px] font-black text-emerald-400">
            {t('upgrade_save_percent', 'Hemat {discount}% ✓').replace('{discount}', discount)}
          </span>
        )}
      </div>
      <BillingSelector value={billingMonths} onChange={setBillingMonths} />
    </div>
  )

  // ── Main screen ─────────────────────────────────────────────────────────────

  const ambientGlow = (
    <div className="pointer-events-none fixed inset-0 transition-all duration-700"
      style={{
        background: selectedPlan === 'pro'
          ? 'radial-gradient(ellipse 60% 40% at 50% -10%, rgba(2, 26, 2,0.1) 0%, transparent 70%)'
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
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-[13px] font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/5 hover:border-white/10 transition-all active:scale-[0.98]"
              >
                <ArrowLeft size={14} /> {t('common.back', 'Kembali')}
              </button>
              <button onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-[13px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/15 px-4 py-2 rounded-xl border border-emerald-500/10 hover:border-emerald-500/20 transition-all active:scale-[0.98]"
              >
                <Building2 size={14} /> {t('Dashboard', 'Dashboard')}
              </button>
            </div>
            {heroBadges}
          </div>

          {/* Hero heading */}
          <div className="mb-8">
            <h1 className="font-display font-black text-4xl text-white leading-tight mb-2">
              {isRenewal ? t('upgrade_renew_plan_title', 'Perpanjang Plan') : t('upgrade_upgrade_plan_title', 'Upgrade Plan')}
            </h1>
            <p className="text-[14px] text-[#4B6478]">
              {t('upgrade_hero_desc', '{vertical} · Pilih plan & durasi, harga berubah otomatis').replace('{vertical}', roleFeatures.label)}
            </p>
          </div>

          {paymentBanner}

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
                <p className="text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mb-3">{t('upgrade_order_summary', 'Ringkasan Pesanan')}</p>
                {priceSummary}
              </div>
              <div>
                {ctaButton}
                <p className="text-center text-[10px] text-[#2A3F52] mt-2">
                  {t('upgrade_secure_payment_footer', 'Pembayaran aman via Midtrans · Aktif hingga {date}').replace('{date}', newExpiryStr)}
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

        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[13px] font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/5 hover:border-white/10 transition-all active:scale-[0.98]"
          >
            <ArrowLeft size={14} /> {t('common.back', 'Kembali')}
          </button>
          <button onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-[13px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/15 px-4 py-2 rounded-xl border border-emerald-500/10 hover:border-emerald-500/20 transition-all active:scale-[0.98]"
          >
            <Building2 size={14} /> {t('Dashboard', 'Dashboard')}
          </button>
        </div>

        <div className="mb-6">
          {heroBadges}
          <h1 className="font-display font-black text-[26px] text-white leading-tight mb-1">
            {isRenewal ? t('upgrade_renew_plan_title', 'Perpanjang Plan') : t('upgrade_upgrade_plan_title', 'Upgrade Plan')}
          </h1>
          <p className="text-[13px] text-[#4B6478]">
            {t('upgrade_hero_desc', '{vertical} · Pilih plan & durasi, harga berubah otomatis').replace('{vertical}', roleFeatures.label)}
          </p>
        </div>

        {paymentBanner}

        <div className="space-y-5">
          {billingSelector}
          {planCards}
          {trialBlock}
          {featureSections}
          {priceSummary}
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
            {t('upgrade_secure_payment_footer', 'Pembayaran aman via Midtrans · Aktif hingga {date}').replace('{date}', newExpiryStr)}
          </p>
        </div>
      </div>
    </div>
  )
}

