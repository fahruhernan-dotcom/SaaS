import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Copy, ArrowLeft, Zap, Crown, Loader2, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { usePaymentSettings, usePricingConfig, useCreateInvoice } from '@/lib/hooks/useAdminData'
import { formatIDR } from '@/lib/format'
import { getSubscriptionStatus } from '@/lib/subscriptionUtils'
import { format, addMonths } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { toast } from 'sonner'
import { getBrokerBasePath } from '@/lib/hooks/useAuth'

const BILLING_OPTIONS = [
  { months: 1,  label: '1 Bulan',  discount: 0 },
  { months: 3,  label: '3 Bulan',  discount: 5 },
  { months: 6,  label: '6 Bulan',  discount: 10 },
  { months: 12, label: '1 Tahun',  discount: 20 },
]

const PLAN_CONFIG = {
  pro: {
    label: 'Pro',
    icon: <Zap size={18} />,
    color: '#10B981',
    colorBg: 'rgba(16,185,129,0.08)',
    colorBorder: 'rgba(16,185,129,0.3)',
    features: [
      'Semua fitur Starter',
      'Hingga 2 kandang/lokasi',
      'Export laporan PDF & Excel',
      'Notifikasi piutang jatuh tempo',
      'Support prioritas via WhatsApp',
    ],
  },
  business: {
    label: 'Business',
    icon: <Crown size={18} />,
    color: '#F59E0B',
    colorBg: 'rgba(245,158,11,0.08)',
    colorBorder: 'rgba(245,158,11,0.3)',
    features: [
      'Semua fitur Pro',
      'Kandang/lokasi tidak terbatas',
      'Multi-user & manajemen tim',
      'Akses API & integrasi',
      'Dedicated account manager',
    ],
  },
}

// Map user_type → pricing role
function getPricingRole(profile) {
  if (profile?.user_type === 'peternak') return 'peternak'
  if (profile?.user_type === 'rumah_potong') return 'rpa'
  return 'broker'
}

export default function UpgradePlan() {
  const navigate = useNavigate()
  const { profile, tenant } = useAuth()
  const { data: pricing } = usePricingConfig()
  const { data: banks } = usePaymentSettings()
  const createInvoice = useCreateInvoice()

  const [selectedPlan, setSelectedPlan] = useState('pro')
  const [billingMonths, setBillingMonths] = useState(1)
  const [invoiceResult, setInvoiceResult] = useState(null)

  const pricingRole = getPricingRole(profile)
  const activeBanks = banks?.filter(b => b.is_active && b.bank_name !== 'xendit_config') || []

  const basePrice = pricing?.[pricingRole]?.[selectedPlan]?.price || 0
  const discount   = BILLING_OPTIONS.find(o => o.months === billingMonths)?.discount || 0
  const total      = Math.round(basePrice * billingMonths * (1 - discount / 100))

  // Renewal context
  const sub = getSubscriptionStatus(tenant)
  const isRenewal = sub.status === 'active' && tenant?.plan === selectedPlan
  const renewalBase = isRenewal && sub.expiresAt > new Date() ? sub.expiresAt : new Date()
  const newExpiry = addMonths(renewalBase, billingMonths)
  const newExpiryStr = format(newExpiry, 'd MMM yyyy', { locale: localeId })
  const currentExpiryStr = sub.expiresAt ? format(sub.expiresAt, 'd MMM yyyy', { locale: localeId }) : null

  const handleSubmit = async () => {
    if (!profile?.tenant_id) return
    try {
      const invoiceNumber = await createInvoice.mutateAsync({
        tenantId: profile.tenant_id,
        plan: selectedPlan,
        billingMonths,
        amount: total,
        notes: `${isRenewal ? 'Perpanjang' : 'Upgrade ke'} ${PLAN_CONFIG[selectedPlan].label} — ${billingMonths} bulan`,
      })
      setInvoiceResult(invoiceNumber)
    } catch (e) {
      // error handled by mutation
    }
  }

  const handleBack = () => {
    navigate(-1)
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Disalin!')
  }

  if (invoiceResult) {
    return (
      <div style={{ minHeight: '100vh', background: '#06090F', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{ maxWidth: '420px', width: '100%', textAlign: 'center' }}
        >
          <div style={{ width: 72, height: 72, background: 'rgba(16,185,129,0.12)', border: '2px solid rgba(16,185,129,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <CheckCircle2 size={32} color="#10B981" />
          </div>
          <h2 style={{ fontFamily: 'Sora', fontSize: '22px', fontWeight: 800, color: '#F1F5F9', marginBottom: '8px' }}>Invoice Dibuat!</h2>
          <p style={{ color: '#4B6478', fontSize: '14px', marginBottom: '8px' }}>Nomor invoice kamu:</p>
          <div style={{ background: '#0C1319', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <span style={{ fontFamily: 'Sora', fontWeight: 700, color: '#10B981', fontSize: '15px' }}>{invoiceResult}</span>
            <button onClick={() => copyToClipboard(invoiceResult)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B6478' }}>
              <Copy size={16} />
            </button>
          </div>
          <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '14px', padding: '16px', marginBottom: '24px', textAlign: 'left' }}>
            <p style={{ color: '#94A3B8', fontSize: '13px', lineHeight: 1.7, margin: 0 }}>
              Silakan transfer <strong style={{ color: '#F1F5F9' }}>{formatIDR(total)}</strong> ke salah satu rekening di bawah, lalu kirim bukti transfer ke admin via WhatsApp. Invoice akan dikonfirmasi dalam <strong style={{ color: '#F1F5F9' }}>1×24 jam kerja</strong>.
            </p>
          </div>
          {activeBanks.map((bank) => (
            <div key={bank.id} style={{ background: '#0C1319', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px 16px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ textAlign: 'left' }}>
                <p style={{ color: '#94A3B8', fontSize: '11px', margin: '0 0 2px' }}>{bank.bank_name}</p>
                <p style={{ color: '#F1F5F9', fontWeight: 700, fontSize: '15px', margin: '0 0 2px', fontFamily: 'Sora' }}>{bank.account_number}</p>
                <p style={{ color: '#4B6478', fontSize: '12px', margin: 0 }}>{bank.account_name}</p>
              </div>
              <button onClick={() => copyToClipboard(bank.account_number)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#94A3B8' }}>
                <Copy size={14} />
              </button>
            </div>
          ))}
          <button
            onClick={handleBack}
            style={{ marginTop: '8px', background: 'transparent', border: 'none', color: '#4B6478', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', margin: '8px auto 0' }}
          >
            <ArrowLeft size={14} /> Kembali ke Dashboard
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#06090F', padding: '24px 16px 48px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>

        {/* Header */}
        <button
          onClick={handleBack}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#4B6478', fontSize: '13px', cursor: 'pointer', marginBottom: '24px', padding: 0 }}
        >
          <ArrowLeft size={14} /> Kembali
        </button>

        <h1 style={{ fontFamily: 'Sora', fontSize: '22px', fontWeight: 800, color: '#F1F5F9', margin: '0 0 4px' }}>
          {sub.status === 'active' ? 'Perpanjang Plan' : 'Upgrade Plan'}
        </h1>
        <p style={{ color: '#4B6478', fontSize: '13px', marginBottom: isRenewal ? '16px' : '28px' }}>
          Plan aktif: <span style={{ color: '#10B981', fontWeight: 600, textTransform: 'uppercase' }}>{tenant?.plan || 'Starter'}</span>
        </p>

        {/* Renewal context banner */}
        {isRenewal && currentExpiryStr && (
          <div style={{
            background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: '12px', padding: '12px 14px', marginBottom: '24px',
            fontSize: '12px', color: '#94A3B8', lineHeight: 1.6,
          }}>
            <span style={{ color: '#4B6478' }}>Aktif hingga </span>
            <strong style={{ color: '#F1F5F9' }}>{currentExpiryStr}</strong>
            <span style={{ color: '#4B6478' }}> — setelah perpanjangan </span>
            <strong style={{ color: '#10B981' }}>{billingMonths} bln</strong>
            <span style={{ color: '#4B6478' }}>: </span>
            <strong style={{ color: '#10B981' }}>{newExpiryStr}</strong>
          </div>
        )}

        {/* Plan Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          {Object.entries(PLAN_CONFIG).map(([key, plan]) => {
            const price = pricing?.[pricingRole]?.[key]?.price
            const isSelected = selectedPlan === key
            return (
              <motion.div
                key={key}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedPlan(key)}
                style={{
                  background: isSelected ? plan.colorBg : '#0C1319',
                  border: `1px solid ${isSelected ? plan.colorBorder : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '16px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  position: 'relative',
                }}
              >
                {isSelected && (
                  <div style={{ position: 'absolute', top: '10px', right: '10px', width: '18px', height: '18px', background: plan.color, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={11} color="white" strokeWidth={3} />
                  </div>
                )}
                <div style={{ color: plan.color, marginBottom: '8px' }}>{plan.icon}</div>
                <h3 style={{ fontFamily: 'Sora', fontSize: '15px', fontWeight: 800, color: '#F1F5F9', margin: '0 0 6px' }}>{plan.label}</h3>
                <p style={{ color: plan.color, fontSize: '13px', fontWeight: 700, margin: 0 }}>
                  {price ? formatIDR(price) : '—'}<span style={{ color: '#4B6478', fontWeight: 400, fontSize: '11px' }}>/bln</span>
                </p>
              </motion.div>
            )
          })}
        </div>

        {/* Features */}
        <div style={{ background: '#0C1319', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px', marginBottom: '24px' }}>
          <p style={{ color: '#94A3B8', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
            Fitur {PLAN_CONFIG[selectedPlan].label}
          </p>
          {PLAN_CONFIG[selectedPlan].features.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Check size={13} color={PLAN_CONFIG[selectedPlan].color} strokeWidth={3} />
              <span style={{ color: '#94A3B8', fontSize: '13px' }}>{f}</span>
            </div>
          ))}
        </div>

        {/* Billing Period */}
        <p style={{ color: '#94A3B8', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
          Durasi Langganan
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '24px' }}>
          {BILLING_OPTIONS.map((opt) => (
            <button
              key={opt.months}
              onClick={() => setBillingMonths(opt.months)}
              style={{
                padding: '10px 4px',
                borderRadius: '10px',
                border: billingMonths === opt.months ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.08)',
                background: billingMonths === opt.months ? 'rgba(16,185,129,0.08)' : '#0C1319',
                color: billingMonths === opt.months ? '#10B981' : '#4B6478',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center',
                fontFamily: 'Sora',
              }}
            >
              {opt.label}
              {opt.discount > 0 && (
                <div style={{ fontSize: '10px', color: '#10B981', marginTop: '2px' }}>-{opt.discount}%</div>
              )}
            </button>
          ))}
        </div>

        {/* Total */}
        <div style={{ background: '#0C1319', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: '#4B6478', fontSize: '13px' }}>Harga/bulan</span>
            <span style={{ color: '#94A3B8', fontSize: '13px' }}>{formatIDR(basePrice)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: '#4B6478', fontSize: '13px' }}>Durasi</span>
            <span style={{ color: '#94A3B8', fontSize: '13px' }}>{billingMonths} bulan</span>
          </div>
          {discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: '#10B981', fontSize: '13px' }}>Diskon</span>
              <span style={{ color: '#10B981', fontSize: '13px' }}>-{discount}%</span>
            </div>
          )}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '10px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#F1F5F9', fontSize: '14px', fontWeight: 700 }}>Total</span>
            <span style={{ color: '#10B981', fontSize: '16px', fontWeight: 800, fontFamily: 'Sora' }}>{formatIDR(total)}</span>
          </div>
        </div>

        {/* Bank info */}
        {activeBanks.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <p style={{ color: '#94A3B8', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
              Transfer ke
            </p>
            {activeBanks.map((bank) => (
              <div key={bank.id} style={{ background: '#0C1319', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 14px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ color: '#4B6478', fontSize: '11px', margin: '0 0 2px' }}>{bank.bank_name}</p>
                  <p style={{ color: '#F1F5F9', fontWeight: 700, fontSize: '14px', margin: '0 0 1px', fontFamily: 'Sora' }}>{bank.account_number}</p>
                  <p style={{ color: '#4B6478', fontSize: '11px', margin: 0 }}>a.n. {bank.account_name}</p>
                </div>
                <button onClick={() => copyToClipboard(bank.account_number)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#94A3B8' }}>
                  <Copy size={14} />
                </button>
              </div>
            ))}
            <p style={{ color: '#4B6478', fontSize: '11px', marginTop: '8px', lineHeight: 1.5 }}>
              Setelah transfer, kirim bukti ke admin. Konfirmasi dalam 1×24 jam kerja.
            </p>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleSubmit}
          disabled={createInvoice.isPending || !basePrice}
          style={{
            width: '100%',
            padding: '16px',
            background: '#10B981',
            border: 'none',
            borderRadius: '14px',
            color: 'white',
            fontFamily: 'Sora',
            fontSize: '15px',
            fontWeight: 700,
            cursor: createInvoice.isPending ? 'not-allowed' : 'pointer',
            opacity: createInvoice.isPending ? 0.7 : 1,
            boxShadow: '0 4px 20px rgba(16,185,129,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {createInvoice.isPending
            ? <><Loader2 size={16} className="animate-spin" /> Memproses...</>
            : `${isRenewal ? 'Perpanjang' : 'Upgrade'} — ${formatIDR(total)}`}
        </button>
      </div>
    </div>
  )
}
