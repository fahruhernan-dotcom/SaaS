import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogOut, CreditCard, BarChart2, HelpCircle, ChevronRight } from 'lucide-react'
import { differenceInDays, isAfter } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useRPAProfile, useUpsertRPAProfile } from '@/lib/hooks/useRPAData'
import TopBar from '../components/TopBar'

// ─── Constants ────────────────────────────────────────────────────────────────

const RPA_TYPES = [
  { value: 'rpa', label: 'RPA / Pemotongan' },
  { value: 'pedagang_pasar', label: 'Pedagang Pasar' },
  { value: 'restoran', label: 'Restoran' },
  { value: 'supermarket', label: 'Supermarket' },
  { value: 'pengepul', label: 'Pengepul' },
  { value: 'lainnya', label: 'Lainnya' },
]

const CHICKEN_TYPES = [
  { value: 'broiler', label: 'Broiler' },
  { value: 'kampung', label: 'Kampung' },
  { value: 'pejantan', label: 'Pejantan' },
]

const PAYMENT_TERMS = [
  { value: 'cash', label: 'Tunai (Cash)' },
  { value: 'net3', label: 'Net 3 Hari' },
  { value: 'net7', label: 'Net 7 Hari' },
  { value: 'net14', label: 'Net 14 Hari' },
  { value: 'net30', label: 'Net 30 Hari' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inputStyle = {
  width: '100%', padding: '10px 12px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px', color: '#F1F5F9',
  fontSize: '14px', outline: 'none', fontFamily: 'inherit',
}

const labelStyle = {
  fontSize: '12px', color: '#94A3B8',
  display: 'block', marginBottom: '6px',
}

const sectionLabel = {
  fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em',
  textTransform: 'uppercase', color: '#4B6478',
  marginBottom: '10px', display: 'block',
}

// ─── NavItem ──────────────────────────────────────────────────────────────────

function NavItem({ icon: Icon, label, sub, onClick, badge }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%', padding: '14px 16px',
        background: 'transparent', border: 'none',
        display: 'flex', alignItems: 'center', gap: '14px',
        cursor: 'pointer', textAlign: 'left',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <div style={{
        width: '38px', height: '38px', borderRadius: '11px',
        background: 'rgba(245,158,11,0.08)',
        border: '1px solid rgba(245,158,11,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={16} color="#F59E0B" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#F1F5F9' }}>{label}</div>
        {sub && <div style={{ fontSize: '12px', color: '#4B6478', marginTop: '2px' }}>{sub}</div>}
      </div>
      {badge ? (
        <span style={{
          background: 'rgba(245,158,11,0.15)', color: '#F59E0B',
          padding: '2px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 700,
        }}>{badge}</span>
      ) : (
        <ChevronRight size={15} color="#4B6478" />
      )}
    </button>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function RPAAkun() {
  const navigate = useNavigate()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { profile, user, tenant } = useAuth()
  const queryClient = useQueryClient()

  const { data: rpaProfile } = useRPAProfile()
  const upsertProfile = useUpsertRPAProfile()

  // RPA profile form state
  const [form, setForm] = useState({
    business_name: tenant?.business_name ?? '',
    rpa_type: rpaProfile?.rpa_type ?? 'rpa',
    daily_capacity: rpaProfile?.daily_capacity ?? '',
    preferred_chicken_types: rpaProfile?.preferred_chicken_types ?? 'broiler',
    payment_terms_to_broker: rpaProfile?.payment_terms_to_broker ?? 'net7',
    business_description: rpaProfile?.business_description ?? '',
  })

  // Sync form when rpaProfile/tenant loads
  useEffect(() => {
    setForm({
      business_name: tenant?.business_name ?? '',
      rpa_type: rpaProfile?.rpa_type ?? 'rpa',
      daily_capacity: rpaProfile?.daily_capacity ?? '',
      preferred_chicken_types: rpaProfile?.preferred_chicken_types ?? 'broiler',
      payment_terms_to_broker: rpaProfile?.payment_terms_to_broker ?? 'net7',
      business_description: rpaProfile?.business_description ?? '',
    })
  }, [rpaProfile, tenant])

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSaveProfile = () => {
    upsertProfile.mutate({
      business_name: form.business_name || undefined,
      rpa_type: form.rpa_type,
      daily_capacity: form.daily_capacity ? Number(form.daily_capacity) : null,
      preferred_chicken_types: form.preferred_chicken_types,
      payment_terms_to_broker: form.payment_terms_to_broker,
      business_description: form.business_description || null,
    })
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error('Gagal keluar')
    } else {
      queryClient.clear()
      navigate('/login')
      toast.success('Berhasil keluar')
    }
  }

  // Trial info
  const trialEnds = tenant?.trial_ends_at ? new Date(tenant.trial_ends_at) : null
  const daysLeft = trialEnds ? differenceInDays(trialEnds, new Date()) : 0
  const isTrialActive = trialEnds ? isAfter(trialEnds, new Date()) : false
  const trialProgress = Math.max(0, Math.min(100, (daysLeft / 14) * 100))

  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'RP'

  return (
    <div style={{ minHeight: '100vh', background: '#06090F', paddingBottom: '80px' }}>
      {/* Header */}
      {!isDesktop && (
        <div style={{
          position: 'sticky', top: 0, zIndex: 30,
          background: 'rgba(6,9,15,0.92)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '20px 20px 14px',
        }}>
          <h1 style={{
            fontFamily: 'Sora', fontSize: '18px', fontWeight: 900,
            color: '#F1F5F9', letterSpacing: '-0.02em', textTransform: 'uppercase',
          }}>Akun</h1>
        </div>
      )}
      {isDesktop && (
        <div style={{ padding: '28px 32px 0' }}>
          <h1 style={{ fontFamily: 'Sora', fontSize: '22px', fontWeight: 700, color: '#F1F5F9' }}>Akun & Profil</h1>
        </div>
      )}

      <div style={{ padding: isDesktop ? '20px 32px' : '20px 16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* ── Profile Card ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{
            background: 'linear-gradient(135deg, #111C24 0%, #0C1319 100%)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '24px', padding: '24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '20px',
                background: 'rgba(245,158,11,0.12)',
                border: '1px solid rgba(245,158,11,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Sora', fontSize: '26px', fontWeight: 900, color: '#F59E0B',
              }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Sora', fontSize: '18px', fontWeight: 900, color: '#F1F5F9', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
                  {profile?.full_name ?? 'Pengguna'}
                </div>
                <div style={{ fontSize: '12px', color: '#4B6478', marginTop: '3px', marginBottom: '8px' }}>
                  {user?.email}
                </div>
                <span style={{
                  background: 'rgba(245,158,11,0.1)',
                  border: '1px solid rgba(245,158,11,0.2)',
                  color: '#F59E0B',
                  padding: '3px 10px', borderRadius: '8px',
                  fontSize: '10px', fontWeight: 900,
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                }}>
                  RPA / Buyer
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Plan / Subscription ── */}
        <div>
          <span style={sectionLabel}>Plan & Layanan</span>
          <div style={{
            background: '#111C24', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '20px', padding: '20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <div style={{ fontFamily: 'Sora', fontSize: '16px', fontWeight: 900, color: '#F1F5F9', textTransform: 'uppercase' }}>
                  {tenant?.plan || 'Starter Free'}
                </div>
                <div style={{ fontSize: '11px', color: '#4B6478', marginTop: '2px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Status Berlangganan
                </div>
              </div>
              <span style={{
                background: isTrialActive ? 'rgba(245,158,11,0.1)' : 'rgba(52,211,153,0.1)',
                color: isTrialActive ? '#F59E0B' : '#34D399',
                border: `1px solid ${isTrialActive ? 'rgba(245,158,11,0.2)' : 'rgba(52,211,153,0.2)'}`,
                padding: '4px 12px', borderRadius: '8px',
                fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em',
              }}>
                {isTrialActive ? 'TRIAL' : 'AKTIF'}
              </span>
            </div>

            {isTrialActive && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: daysLeft <= 3 ? '#EF4444' : '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Berakhir dalam {daysLeft} hari
                  </span>
                  <span style={{ fontSize: '11px', color: '#4B6478', fontWeight: 700 }}>{Math.round(trialProgress)}%</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${trialProgress}%`,
                    background: daysLeft <= 3 ? '#EF4444' : '#F59E0B',
                    borderRadius: '99px', transition: 'width 0.5s',
                  }} />
                </div>
              </div>
            )}

            <button type="button" style={{
              width: '100%', padding: '13px',
              background: '#F59E0B', border: 'none', borderRadius: '14px',
              color: '#0D1117', fontWeight: 900, fontSize: '12px',
              cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}>
              <CreditCard size={16} />
              Upgrade Plan
            </button>
          </div>
        </div>

        {/* ── PROFIL BISNIS RPA ── */}
        <div>
          <span style={sectionLabel}>Profil Bisnis RPA</span>
          <div style={{
            background: '#111C24', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px', padding: '20px',
            display: 'flex', flexDirection: 'column', gap: '16px',
          }}>

            {/* Nama Bisnis */}
            <div>
              <label htmlFor="rpa-biz-name" style={labelStyle}>Nama Bisnis RPA</label>
              <input
                id="rpa-biz-name"
                name="business_name"
                type="text"
                value={form.business_name}
                onChange={e => set('business_name', e.target.value)}
                placeholder="PT. Maju Jaya RPA"
                style={inputStyle}
              />
            </div>

            {/* Tipe RPA */}
            <div>
              <label style={labelStyle}>Tipe RPA</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                {RPA_TYPES.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => set('rpa_type', t.value)}
                    style={{
                      padding: '7px 14px', borderRadius: '20px', fontSize: '12px',
                      border: `1px solid ${form.rpa_type === t.value ? '#F59E0B' : 'rgba(255,255,255,0.08)'}`,
                      background: form.rpa_type === t.value ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.03)',
                      color: form.rpa_type === t.value ? '#F59E0B' : '#64748B',
                      cursor: 'pointer', fontWeight: form.rpa_type === t.value ? 700 : 400,
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Kapasitas + Payment Terms */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label htmlFor="rpa-capacity" style={labelStyle}>Kapasitas Potong/Hari (ekor)</label>
                <input
                  id="rpa-capacity"
                  name="daily_capacity"
                  type="number"
                  min="0"
                  value={form.daily_capacity}
                  onChange={e => set('daily_capacity', e.target.value)}
                  placeholder="500"
                  style={inputStyle}
                />
              </div>
              <div>
                <label htmlFor="rpa-payment-terms" style={labelStyle}>Payment Terms ke Broker</label>
                <select
                  id="rpa-payment-terms"
                  name="payment_terms_to_broker"
                  value={form.payment_terms_to_broker}
                  onChange={e => set('payment_terms_to_broker', e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  {PAYMENT_TERMS.map(t => (
                    <option key={t.value} value={t.value} style={{ background: '#0D1117' }}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Jenis Ayam Preferred */}
            <div>
              <label style={labelStyle}>Jenis Ayam Preferred</label>
              <div style={{ display: 'flex', gap: '7px' }}>
                {CHICKEN_TYPES.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => set('preferred_chicken_types', t.value)}
                    style={{
                      flex: 1, padding: '8px', borderRadius: '10px', fontSize: '12px',
                      border: `1px solid ${form.preferred_chicken_types === t.value ? '#F59E0B' : 'rgba(255,255,255,0.08)'}`,
                      background: form.preferred_chicken_types === t.value ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.03)',
                      color: form.preferred_chicken_types === t.value ? '#F59E0B' : '#64748B',
                      cursor: 'pointer', fontWeight: form.preferred_chicken_types === t.value ? 700 : 400,
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Deskripsi */}
            <div>
              <label htmlFor="rpa-description" style={labelStyle}>Deskripsi Bisnis</label>
              <textarea
                id="rpa-description"
                name="business_description"
                rows={3}
                value={form.business_description}
                onChange={e => set('business_description', e.target.value)}
                placeholder="Ceritakan tentang bisnis RPA Anda..."
                style={{ ...inputStyle, resize: 'none' }}
              />
            </div>

            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={upsertProfile.isPending}
              style={{
                padding: '13px', borderRadius: '12px',
                background: upsertProfile.isPending ? 'rgba(245,158,11,0.4)' : '#F59E0B',
                border: 'none', color: '#0D1117', fontWeight: 900,
                fontSize: '13px', cursor: upsertProfile.isPending ? 'not-allowed' : 'pointer',
                textTransform: 'uppercase', letterSpacing: '0.1em',
              }}
            >
              {upsertProfile.isPending ? 'Menyimpan...' : 'Simpan Profil'}
            </button>
          </div>
        </div>

        {/* ── Navigasi ── */}
        <div>
          <span style={sectionLabel}>Aplikasi</span>
          <div style={{ background: '#111C24', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', overflow: 'hidden' }}>
            <NavItem
              icon={BarChart2}
              label="Laporan Margin"
              sub="Analisis profitabilitas distribusi"
              onClick={() => navigate('/rpa-buyer/laporan')}
            />
            <NavItem
              icon={BarChart2}
              label="Harga Pasar"
              sub="Harga ayam broiler hari ini"
              onClick={() => navigate('/harga-pasar')}
            />
          </div>
        </div>

        {/* ── Logout ── */}
        <div>
          <span style={sectionLabel}>Sesi</span>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              width: '100%', padding: '14px',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.15)',
              borderRadius: '14px',
              color: '#EF4444', fontWeight: 700, fontSize: '14px',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            <LogOut size={16} />
            Keluar
          </button>
        </div>

      </div>
    </div>
  )
}
