import React from 'react'
import { motion } from 'framer-motion'
import { MapPin, Users, Layers, ChevronRight, PlayCircle } from 'lucide-react'

// ─── Styles ───────────────────────────────────────────────────────────────────

const cardStyle = {
  background: '#0C1319',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 20,
  padding: '16px',
}

const farmNameStyle = {
  fontFamily: 'Sora', fontWeight: 800, fontSize: 15,
  color: '#F1F5F9', marginBottom: 4,
  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
}

const locationRowStyle = { display: 'flex', alignItems: 'center', gap: 4 }
const locationTextStyle = {
  fontSize: 11, color: '#4B6478',
  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
}

const livestockBadgeStyle = {
  flexShrink: 0,
  fontSize: 11, fontWeight: 700, color: '#F1F5F9',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.08)',
  padding: '3px 8px', borderRadius: 99,
  whiteSpace: 'nowrap',
}

const modelBadgeStyle = {
  display: 'inline-block',
  fontSize: 10, fontWeight: 800,
  padding: '3px 10px', borderRadius: 99,
  letterSpacing: '0.04em', textTransform: 'uppercase',
  marginTop: 4,
}

const mandiriBadgeStyle = {
  background: 'rgba(16,185,129,0.1)',
  color: '#34D399',
  border: '1px solid rgba(16,185,129,0.2)',
}

const kemitraanBadgeStyle = {
  background: 'rgba(59,130,246,0.1)',
  color: '#60A5FA',
  border: '1px solid rgba(59,130,246,0.2)',
}

const statsRowStyle = {
  display: 'flex', alignItems: 'center', gap: 10, marginTop: 12,
}
const statItemStyle = { display: 'flex', alignItems: 'center', gap: 5 }
const statTextStyle = { fontSize: 12, color: '#94A3B8', fontWeight: 600 }
const dotSepStyle = { width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }

const cycleRowStyle = { marginTop: 12 }

const cycleActivePillStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 7,
  background: 'rgba(124,58,237,0.08)',
  border: '1px solid rgba(124,58,237,0.2)',
  borderRadius: 99, padding: '5px 12px',
  fontSize: 11, fontWeight: 600, color: '#A78BFA',
}

const pulseDotStyle = {
  width: 6, height: 6, background: '#A78BFA', borderRadius: '50%',
  boxShadow: '0 0 6px #A78BFA',
}

const cycleEmptyStyle = {
  display: 'inline-block',
  fontSize: 11, color: '#4B6478',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.05)',
  borderRadius: 99, padding: '4px 10px',
}

const viewBtnStyle = {
  width: '100%',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  padding: '11px',
  background: 'rgba(124,58,237,0.1)',
  border: '1px solid rgba(124,58,237,0.25)',
  borderRadius: 12, color: '#A78BFA',
  fontSize: 13, fontWeight: 700, cursor: 'pointer',
  fontFamily: 'DM Sans',
}

const startBtnStyle = {
  width: '100%',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  padding: '12px',
  background: '#7C3AED',
  border: 'none', borderRadius: 12,
  color: 'white',
  fontSize: 13, fontWeight: 800, cursor: 'pointer',
  boxShadow: '0 4px 14px rgba(124,58,237,0.3)',
  fontFamily: 'Sora',
}



// ─── Maps ─────────────────────────────────────────────────────────────────────

const LIVESTOCK_LABELS = {
  ayam_broiler: '🐔 Ayam Broiler',
  ayam_petelur: '🥚 Ayam Petelur',
  domba:        '🐑 Domba',
  kambing:      '🐐 Kambing',
  sapi:         '🐄 Sapi',
  babi:         '🐷 Babi',
}

const BUSINESS_MODEL_LABELS = {
  mandiri_murni:  'Murni Mandiri',
  mandiri_semi:   'Semi Mandiri',
  mitra_penuh:    'INTI-PLASMA',
  mitra_pakan:    'Kemitraan Pakan',
  mitra_sapronak: 'Kemitraan Sapronak',
}

const isMandiri = model => model === 'mandiri_murni' || model === 'mandiri_semi'

// ─── Component ────────────────────────────────────────────────────────────────

export default function FarmCard({ farm, activeCycle, onStart, onView }) {
  const livestockLabel = LIVESTOCK_LABELS[farm.livestock_type] ?? farm.livestock_type ?? '—'
  const modelLabel = BUSINESS_MODEL_LABELS[farm.business_model] ?? farm.business_model ?? '—'
  const mandiri = isMandiri(farm.business_model)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      style={cardStyle}
    >
      {/* ── Top row: name + livestock badge ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={farmNameStyle}>{farm.farm_name}</h3>
          {farm.location && (
            <div style={locationRowStyle}>
              <MapPin size={11} color="#4B6478" />
              <span style={locationTextStyle}>{farm.location}</span>
            </div>
          )}
        </div>
        <span style={livestockBadgeStyle}>{livestockLabel}</span>
      </div>

      {/* ── Business model badge ── */}
      <span style={{ ...modelBadgeStyle, ...(mandiri ? mandiriBadgeStyle : kemitraanBadgeStyle) }}>
        {modelLabel}
      </span>

      {/* ── Stats row ── */}
      <div style={statsRowStyle}>
        <div style={statItemStyle}>
          <Users size={12} color="#4B6478" />
          <span style={statTextStyle}>{(farm.capacity || 0).toLocaleString('id-ID')} ekor</span>
        </div>
        <div style={dotSepStyle} />
        <div style={statItemStyle}>
          <Layers size={12} color="#4B6478" />
          <span style={statTextStyle}>{farm.kandang_count || 1} kandang</span>
        </div>
      </div>

      {/* ── Active cycle status ── */}
      <div style={cycleRowStyle}>
        {activeCycle ? (
          <div style={cycleActivePillStyle}>
            <div style={pulseDotStyle} />
            <span>Siklus #{activeCycle.cycle_number} aktif · Hari ke-{activeCycle.age_days ?? '—'}</span>
          </div>
        ) : (
          <span style={cycleEmptyStyle}>Belum ada siklus aktif</span>
        )}
      </div>

      {/* ── CTA ── */}
      <div style={{ marginTop: 14 }}>
        {activeCycle ? (
          <button style={viewBtnStyle} onClick={() => onView?.(farm)}>
            Masuk Kandang
            <ChevronRight size={14} />
          </button>
        ) : (
          <button style={startBtnStyle} onClick={() => onStart?.(farm)}>
            <PlayCircle size={14} />
            Mulai Siklus
          </button>
        )}
      </div>
    </motion.div>
  )
}
