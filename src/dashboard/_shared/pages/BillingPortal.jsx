import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle2, XCircle, Clock, AlertCircle, CreditCard, Building2, RefreshCw } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { getSubscriptionStatus } from '@/lib/subscriptionUtils'
import { formatIDR } from '@/lib/format'
import { format } from 'date-fns'
import { id as localeId, enUS as localeEn } from 'date-fns/locale'
import { useLanguage } from '@/lib/i18n/useLanguage'

// ─── Constants ────────────────────────────────────────────────────────────────

const BG = '#06090F'
const SURFACE = 'rgba(255,255,255,0.04)'
const HAIRLINE = 'rgba(255,255,255,0.07)'
const TEXT = '#E2E8F0'
const TEXT_DIM = '#64748B'
const TEXT_MUTE = '#2A3F52'

const INVOICE_STATUS = {
  paid:      { label: 'Lunas',    color: '#021a02', bg: 'rgba(2, 26, 2,0.12)',  icon: <CheckCircle2 size={13} /> },
  pending:   { label: 'Menunggu', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', icon: <Clock size={13} /> },
  expired:   { label: 'Kedaluwarsa', color: '#64748B', bg: 'rgba(100,116,139,0.12)', icon: <XCircle size={13} /> },
  cancelled: { label: 'Dibatalkan',  color: '#F87171', bg: 'rgba(248,113,113,0.12)', icon: <XCircle size={13} /> },
}

// ─── Hook: fetch invoices for a list of tenant IDs ────────────────────────────

function useTenantInvoices(tenantIds) {
  return useQuery({
    queryKey: ['billing-invoices', tenantIds],
    enabled: tenantIds.length > 0,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_invoices')
        .select('id, invoice_number, tenant_id, plan, billing_months, amount, status, provider_status, paid_at, created_at')
        .in('tenant_id', tenantIds)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data || []
    },
  })
}

// ─── Plan status chip ─────────────────────────────────────────────────────────

function PlanChip({ tenant }) {
  const { lang, tPlan, t } = useLanguage()
  const activeLocale = lang === 'en' ? localeEn : localeId
  const sub = getSubscriptionStatus(tenant)
  const colors = {
    active:  { color: '#021a02', bg: 'rgba(2, 26, 2,0.12)', border: 'rgba(2, 26, 2,0.25)' },
    trial:   { color: '#818CF8', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.25)' },
    expired: { color: '#F87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.25)' },
    unknown: { color: TEXT_DIM, bg: SURFACE, border: HAIRLINE },
  }
  const c = colors[sub.status] || colors.unknown
  const expiryStr = sub.expiresAt
    ? format(sub.expiresAt, 'd MMM yyyy', { locale: activeLocale })
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800,
        background: c.bg, border: `1px solid ${c.border}`, color: c.color,
      }}>
        {tPlan(sub.label)}
      </span>
      {expiryStr && (
        <span style={{ fontSize: 10, color: TEXT_MUTE }}>
          {sub.status === 'expired' ? t('billing_expired', 'Expired') : t('billing_until', 'hingga')} {expiryStr}
        </span>
      )}
    </div>
  )
}

// ─── Tenant card ──────────────────────────────────────────────────────────────

function TenantCard({ tenant, onUpgrade }) {
  const { t, tVertical } = useLanguage()
  return (
    <div style={{
      padding: '14px 16px', borderRadius: 14,
      background: SURFACE, border: `1px solid ${HAIRLINE}`,
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: 'rgba(2, 26, 2,0.12)', border: '1px solid rgba(2, 26, 2,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Building2 size={17} color="#021a02" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: TEXT, margin: 0, lineHeight: 1.3 }}>
          {tenant.business_name || t('index_fallback_biz', 'Bisnis Saya')}
        </p>
        <p style={{ fontSize: 11, color: TEXT_DIM, margin: 0, marginTop: 2 }}>
          {tVertical(tenant.business_vertical) || '—'}
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <PlanChip tenant={tenant} />
        <button
          onClick={() => onUpgrade(tenant)}
          style={{
            fontSize: 10, fontWeight: 800, color: '#021a02',
            background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
          }}
        >
          {t('billing_manage_btn', 'Kelola →')}
        </button>
      </div>
    </div>
  )
}

// ─── Invoice row ──────────────────────────────────────────────────────────────

function InvoiceRow({ invoice, tenantMap }) {
  const { t, tStatus, tPlan, lang } = useLanguage()
  const activeLocale = lang === 'en' ? localeEn : localeId
  const s = INVOICE_STATUS[invoice.status] || INVOICE_STATUS.pending
  const dateStr = invoice.paid_at || invoice.created_at
  const date = dateStr ? format(new Date(dateStr), 'd MMM yyyy', { locale: activeLocale }) : '—'
  const tenantName = tenantMap[invoice.tenant_id] || '—'
  const statusLabel = tStatus(invoice.status)

  return (
    <div style={{
      padding: '12px 16px',
      borderBottom: `1px solid ${HAIRLINE}`,
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9, flexShrink: 0,
        background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: s.color,
      }}>
        {s.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: TEXT, margin: 0 }}>
          {invoice.invoice_number}
        </p>
        <p style={{ fontSize: 10, color: TEXT_DIM, margin: 0, marginTop: 1 }}>
          {tenantName} · {tPlan(invoice.plan)} {t('billing_months_count_unit', '{months} bln').replace('{months}', invoice.billing_months)} · {date}
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: TEXT }}>
          {formatIDR(invoice.amount)}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700, color: s.color,
          background: s.bg, padding: '2px 7px', borderRadius: 999,
        }}>
          {statusLabel}
        </span>
      </div>
    </div>

  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BillingPortal() {
  const navigate = useNavigate()
  const { profiles, isSuperadmin } = useAuth()
  const { t, tPlan } = useLanguage()

  // Collect all owned tenants from profiles
  const ownedTenants = profiles
    .filter(p => p.role === 'owner' && p.tenants)
    .map(p => p.tenants)
    .filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i) // dedupe

  const tenantIds = ownedTenants.map(t => t.id)
  const tenantMap = Object.fromEntries(ownedTenants.map(t => [t.id, t.business_name || t('index_fallback_biz', 'Bisnis Saya')]))

  const { data: invoices = [], isLoading, refetch } = useTenantInvoices(tenantIds)

  // Separate invoices by status
  const paidInvoices    = invoices.filter(i => i.status === 'paid')
  const pendingInvoices = invoices.filter(i => i.status === 'pending')
  const otherInvoices   = invoices.filter(i => !['paid', 'pending'].includes(i.status))

  const orderedInvoices = [...pendingInvoices, ...paidInvoices, ...otherInvoices]

  const totalSpent = paidInvoices.reduce((sum, i) => sum + Number(i.amount || 0), 0)

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: 'Sora, sans-serif' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 0 40px' }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '16px 20px', borderBottom: `1px solid ${HAIRLINE}`,
          position: 'sticky', top: 0, zIndex: 10,
          background: BG,
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', color: TEXT_DIM, cursor: 'pointer', padding: 4, display: 'flex' }}
          >
            <ArrowLeft size={20} />
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: TEXT }}>{t('billing_portal_title', 'Billing & Langganan')}</h1>
            <p style={{ margin: 0, fontSize: 11, color: TEXT_DIM }}>{t('billing_portal_subtitle', 'Kelola paket dan riwayat pembayaran')}</p>
          </div>
          <button
            onClick={() => refetch()}
            style={{ background: 'none', border: 'none', color: TEXT_DIM, cursor: 'pointer', padding: 4, display: 'flex' }}
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        <div style={{ padding: '0 16px' }}>

          {/* Summary strip */}
          {!isSuperadmin && (
            <div style={{
              margin: '16px 0', padding: '14px 16px', borderRadius: 14,
              background: 'rgba(2, 26, 2,0.06)', border: '1px solid rgba(2, 26, 2,0.15)',
              display: 'flex', gap: 0,
            }}>
              <div style={{ flex: 1, textAlign: 'center', borderRight: `1px solid ${HAIRLINE}` }}>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#021a02' }}>{ownedTenants.length}</p>
                <p style={{ margin: 0, fontSize: 10, color: TEXT_DIM }}>{t('billing_business', 'Bisnis')}</p>
              </div>
              <div style={{ flex: 1, textAlign: 'center', borderRight: `1px solid ${HAIRLINE}` }}>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: TEXT }}>{paidInvoices.length}</p>
                <p style={{ margin: 0, fontSize: 10, color: TEXT_DIM }}>{t('billing_paid_invoices', 'Invoice Lunas')}</p>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: TEXT }}>{formatIDR(totalSpent)}</p>
                <p style={{ margin: 0, fontSize: 10, color: TEXT_DIM }}>{t('billing_total_paid', 'Total Dibayar')}</p>
              </div>
            </div>
          )}

          {/* Bisnis & Plan */}
          <p style={{ fontSize: 11, fontWeight: 800, color: TEXT_MUTE, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '20px 0 10px' }}>
            {t('billing_my_businesses', 'Bisnis Saya')}
          </p>
          {ownedTenants.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: TEXT_DIM, fontSize: 13 }}>
              {t('billing_no_business', 'Tidak ada bisnis yang ditemukan')}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ownedTenants.map(t => (
                <TenantCard
                  key={t.id}
                  tenant={t}
                  onUpgrade={() => navigate('/upgrade')}
                />
              ))}
            </div>
          )}

          {/* CTA upgrade */}
          <button
            onClick={() => navigate('/upgrade')}
            style={{
              width: '100%', marginTop: 12, padding: '12px 16px',
              borderRadius: 12, border: '1px dashed rgba(2, 26, 2,0.3)',
              background: 'transparent', color: '#021a02',
              fontSize: 12, fontWeight: 800, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <CreditCard size={14} />
            {t('billing_upgrade_renew_btn', 'Upgrade / Perpanjang Paket')}
          </button>

          {/* Invoice history */}
          <p style={{ fontSize: 11, fontWeight: 800, color: TEXT_MUTE, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '24px 0 0' }}>
            {t('billing_payment_history', 'Riwayat Pembayaran')}
          </p>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: TEXT_DIM, fontSize: 13 }}>
              {t('billing_loading', 'Memuat data...')}
            </div>
          ) : orderedInvoices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: TEXT_MUTE, fontSize: 13 }}>
              {t('billing_no_history', 'Belum ada riwayat pembayaran')}
            </div>
          ) : (
            <div style={{
              marginTop: 10, borderRadius: 14, overflow: 'hidden',
              border: `1px solid ${HAIRLINE}`, background: SURFACE,
            }}>
              {orderedInvoices.map((inv, i) => (
                <InvoiceRow
                  key={inv.id}
                  invoice={inv}
                  tenantMap={tenantMap}
                  isLast={i === orderedInvoices.length - 1}
                />
              ))}
            </div>
          )}

          {pendingInvoices.length > 0 && (
            <div style={{
              marginTop: 12, padding: '12px 14px', borderRadius: 12,
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <AlertCircle size={14} color="#F59E0B" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: 11, color: '#F59E0B', lineHeight: 1.5 }}>
                <span dangerouslySetInnerHTML={{
                  __html: t('billing_pending_invoices_alert', 'Kamu punya <strong>{count} invoice pending</strong> yang belum dibayar.')
                    .replace('{count}', pendingInvoices.length)
                }} />{' '}
                <span
                  onClick={() => navigate('/upgrade')}
                  style={{ textDecoration: 'underline', cursor: 'pointer' }}
                >
                  {t('billing_pay_now', 'Bayar sekarang →')}
                </span>
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
