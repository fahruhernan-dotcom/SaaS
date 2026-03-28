import React, { useState } from 'react'
import { ArrowRight, ChevronLeft } from 'lucide-react'
import { PillRow, FormSection, simpleInputStyle } from './_formShared'

const ACCENT = '#EA580C'

// Orange-tinted pill (inline, not re-using Pill which is hardcoded emerald)
function OPill({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: selected ? 'rgba(234,88,12,0.15)' : '#111C24',
        border: `1px solid ${selected ? 'rgba(234,88,12,0.5)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '12px',
        padding: '8px 16px',
        fontSize: '13px',
        fontFamily: 'DM Sans',
        fontWeight: selected ? 600 : 400,
        color: selected ? '#FB923C' : '#94A3B8',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )
}

const PRODUCT_CATS = ['Beras', 'Gula', 'Minyak Goreng', 'Tepung', 'Telur', 'Bumbu', 'Minuman', 'Snack', 'Lainnya']

const VOLUME_OPTIONS = [
  { label: '< 5 juta / bln',    value: 5_000_000 },
  { label: '5–20 juta / bln',   value: 20_000_000 },
  { label: '20–100 juta / bln', value: 100_000_000 },
  { label: '> 100 juta / bln',  value: 500_000_000 },
]

const CUSTOMER_OPTIONS = [
  { label: 'Warung / toko',          value: 'warung' },
  { label: 'Supermarket / minimarket', value: 'supermarket' },
  { label: 'Restoran / kafe',        value: 'restoran' },
  { label: 'Pengepul / grosir',      value: 'pengepul' },
]

const toggle = (arr, val) =>
  arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]

export default function BrokerSembakoForm({ onSubmit, onBack, isLoading }) {
  const [categories,    setCategories]    = useState([])
  const [targetVolume,  setTargetVolume]  = useState(null)
  const [customerTypes, setCustomerTypes] = useState([])
  const [areaOperasi,   setAreaOperasi]   = useState('')

  const canSubmit = categories.length > 0

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      categories,
      target_volume_monthly: targetVolume,
      customer_types: customerTypes,
      area_operasi: areaOperasi,
    })
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>

      {/* Heading */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '12px',
          background: 'rgba(234,88,12,0.12)', border: '1px solid rgba(234,88,12,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px', marginBottom: '12px',
        }}>🛒</div>
        <h2 style={{ fontFamily: 'Sora', fontSize: '20px', fontWeight: 800, color: '#F1F5F9', marginBottom: '6px' }}>
          Setup Distributor Sembako
        </h2>
        <p style={{ fontSize: '13px', fontFamily: 'DM Sans', color: '#4B6478', lineHeight: '1.6' }}>
          Ceritakan sedikit tentang bisnis distribusimu.
        </p>
      </div>

      {/* Kategori produk */}
      <FormSection label="Produk apa yang kamu distribusikan? *">
        <PillRow>
          {PRODUCT_CATS.map(c => (
            <OPill
              key={c}
              label={c}
              selected={categories.includes(c)}
              onClick={() => setCategories(prev => toggle(prev, c))}
            />
          ))}
        </PillRow>
        {categories.length === 0 && (
          <p style={{ fontSize: '11px', color: '#EF4444', marginTop: '6px' }}>Pilih minimal 1 kategori</p>
        )}
      </FormSection>

      {/* Estimasi omset */}
      <FormSection label="Estimasi omset per bulan">
        <PillRow>
          {VOLUME_OPTIONS.map(o => (
            <OPill
              key={o.value}
              label={o.label}
              selected={targetVolume === o.value}
              onClick={() => setTargetVolume(o.value)}
            />
          ))}
        </PillRow>
      </FormSection>

      {/* Tipe customer */}
      <FormSection label="Tipe customer utama">
        <PillRow>
          {CUSTOMER_OPTIONS.map(o => (
            <OPill
              key={o.value}
              label={o.label}
              selected={customerTypes.includes(o.value)}
              onClick={() => setCustomerTypes(prev => toggle(prev, o.value))}
            />
          ))}
        </PillRow>
      </FormSection>

      {/* Area distribusi */}
      <FormSection label="Area distribusi (kota / kabupaten)">
        <input
          type="text"
          value={areaOperasi}
          onChange={e => setAreaOperasi(e.target.value)}
          placeholder="contoh: Semarang, Salatiga, Demak"
          style={simpleInputStyle}
        />
      </FormSection>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
        <button
          type="submit"
          disabled={!canSubmit || isLoading}
          style={{
            width: '100%',
            background: canSubmit && !isLoading ? ACCENT : 'rgba(234,88,12,0.3)',
            border: 'none',
            borderRadius: '14px',
            height: '52px',
            color: 'white',
            fontFamily: 'Sora',
            fontSize: '15px',
            fontWeight: 700,
            cursor: (!canSubmit || isLoading) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: canSubmit ? '0 4px 16px rgba(234,88,12,0.3)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          {isLoading ? 'Menyimpan...' : <><span>Mulai Pakai TernakOS</span><ArrowRight size={18} /></>}
        </button>

        <button
          type="button"
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            background: 'transparent',
            border: 'none',
            color: '#4B6478',
            fontFamily: 'DM Sans',
            fontSize: '14px',
            cursor: 'pointer',
            padding: '8px 0',
          }}
        >
          <ChevronLeft size={16} /> Kembali
        </button>
      </div>
    </form>
  )
}
