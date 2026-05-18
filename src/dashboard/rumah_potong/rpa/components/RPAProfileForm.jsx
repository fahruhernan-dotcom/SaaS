import React, { useState, useEffect } from 'react'
import { useRPAProfile, useUpsertRPAProfile } from '@/lib/hooks/useRPAData'
import { useAuth } from '@/lib/hooks/useAuth'

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

export default function RPAProfileForm() {
  const { tenant } = useAuth()
  const { data: rpaProfile } = useRPAProfile()
  const upsertProfile = useUpsertRPAProfile()

  const [form, setForm] = useState({
    business_name: tenant?.business_name ?? '',
    rpa_type: rpaProfile?.rpa_type ?? 'rpa',
    daily_capacity: rpaProfile?.daily_capacity ?? '',
    preferred_chicken_types: rpaProfile?.preferred_chicken_types ?? 'broiler',
    payment_terms_to_broker: rpaProfile?.payment_terms_to_broker ?? 'net7',
    business_description: rpaProfile?.business_description ?? '',
  })

  useEffect(() => {
    // Syncing async query data into form when it loads — intentional pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  return (
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
            marginTop: '8px'
          }}
        >
          {upsertProfile.isPending ? 'Menyimpan...' : 'Simpan Profil'}
        </button>
      </div>
    </div>
  )
}
