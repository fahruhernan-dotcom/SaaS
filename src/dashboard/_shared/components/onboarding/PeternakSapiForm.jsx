import React from 'react'
import { PawPrint, Scale, Hash, Calendar, Info } from 'lucide-react'

const labelStyle = {
  display: 'block',
  fontSize: '10px',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: '#D97706',
  marginBottom: '8px',
  marginLeft: '2px',
}
const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  background: '#111C24',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: '12px',
  color: '#F1F5F9',
  fontFamily: 'DM Sans',
  fontSize: '14px',
  fontWeight: 500,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s ease',
}
const hintStyle = {
  fontSize: '11px',
  color: '#4B6478',
  marginTop: '6px',
  lineHeight: 1.5,
  display: 'flex',
  alignItems: 'flex-start',
  gap: '6px',
}

export default function PeternakSapiForm({ data, onChange }) {
  const set = (key, val) => onChange({ ...data, [key]: val })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Nama Batch */}
      <div>
        <label style={labelStyle}>
          <Hash size={11} style={{ display: 'inline', marginRight: 4, marginBottom: -2 }} />
          Nama Batch *
        </label>
        <input
          type="text"
          value={data.batch_name || ''}
          onChange={e => set('batch_name', e.target.value)}
          placeholder="Contoh: Batch Penggemukan April 2024"
          style={inputStyle}
        />
        <p style={hintStyle}>
          <Info size={11} style={{ marginTop: 1, flexShrink: 0 }} />
          Bisa berupa nama periode, musim, atau angkatan.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {/* Tanggal Mulai */}
        <div>
          <label style={labelStyle}>
            <Calendar size={11} style={{ display: 'inline', marginRight: 4, marginBottom: -2 }} />
            Tanggal Mulai *
          </label>
          <input
            type="date"
            value={data.start_date || new Date().toISOString().split('T')[0]}
            onChange={e => set('start_date', e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Jumlah Ekor */}
        <div>
          <label style={labelStyle}>
            <PawPrint size={11} style={{ display: 'inline', marginRight: 4, marginBottom: -2 }} />
            Populasi (Ekor) *
          </label>
          <input
            type="number"
            min="1"
            value={data.initial_count || ''}
            onChange={e => set('initial_count', e.target.value)}
            placeholder="0"
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {/* Berat Rata-rata */}
        <div>
          <label style={labelStyle}>
            <Scale size={11} style={{ display: 'inline', marginRight: 4, marginBottom: -2 }} />
            Berat Avg (kg/ekor)
          </label>
          <input
            type="number"
            min="50"
            step="0.1"
            value={data.initial_avg_weight || ''}
            onChange={e => set('initial_avg_weight', e.target.value)}
            placeholder="350"
            style={inputStyle}
          />
        </div>

        {/* Harga Beli */}
        <div>
          <label style={labelStyle}>
            Harga Beli (Rp/kg)
          </label>
          <input
            type="number"
            min="0"
            step="500"
            value={data.purchase_price_per_kg || ''}
            onChange={e => set('purchase_price_per_kg', e.target.value)}
            placeholder="52000"
            style={inputStyle}
          />
          <p style={hintStyle}>Opsional</p>
        </div>
      </div>

      <div style={{
        padding: '12px 14px',
        borderRadius: '12px',
        background: 'rgba(217,119,6,0.05)',
        border: '1px solid rgba(217,119,6,0.12)',
      }}>
        <p style={{ fontSize: '12px', color: 'rgba(251,191,36,0.7)', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
          "Data ini digunakan untuk menghitung ADG dan estimasi keuntungan secara otomatis."
        </p>
      </div>

    </div>
  )
}
