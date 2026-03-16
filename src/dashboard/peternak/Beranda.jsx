import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { 
  RefreshCw, 
  Users, 
  Calendar, 
  TrendingUp,
  PlusCircle,
  ChevronRight
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/hooks/useAuth'
import { formatDateFull } from '../../lib/format'
import LoadingSpinner from '../components/LoadingSpinner'
import { useNavigate } from 'react-router-dom'

export default function PeternakBeranda() {
  const { profile, tenant } = useAuth()
  const navigate = useNavigate()

  // placeholder queries - adjusting to real schema as needed
  const { data: cycles, isLoading } = useQuery({
    queryKey: ['active-cycles', tenant?.id],
    queryFn: async () => {
      // In a real scenario, we'd query a 'breeding_cycles' table
      return [] 
    },
    enabled: !!tenant?.id
  })

  if (isLoading) return <LoadingSpinner fullPage />

  return (
    <div style={{ color: '#F1F5F9' }}>
      <header style={headerStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={greetingLabelStyle}>Selamat {getGreeting()},</p>
            <h1 style={titleStyle}>{profile?.full_name?.split(' ')[0]}! 👋</h1>
            <p style={dateLabelStyle}>{formatDateFull(new Date())}</p>
          </div>
          <div style={liveBadgeStyle}>
            <div className="live-pulse" style={pulseDotStyle} />
            <span style={liveTextStyle}>Live</span>
          </div>
        </div>
      </header>

      <main style={{ padding: '0 20px 20px' }}>
        {/* Stats Grid */}
        <section style={statsGridStyle}>
          <PeternakStat 
            label="SIKLUS AKTIF"
            value="0"
            sub="kandang pemeliharaan"
            icon={RefreshCw}
            color="#A78BFA"
          />
          <PeternakStat 
            label="POPULASI HIDUP"
            value="0"
            sub="ekor saat ini"
            icon={Users}
            color="#F1F5F9"
          />
          <PeternakStat 
            label="SIAP PANEN"
            value="0"
            sub="dalam 7 hari"
            icon={Calendar}
            color="#34D399"
          />
          <PeternakStat 
            label="FCR RATA-RATA"
            value="0.00"
            sub="target < 1.7"
            icon={TrendingUp}
            color="#F87171"
          />
        </section>

        {/* Quick Action */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/input-harian')}
          style={quickActionStyle}
        >
          <PlusCircle size={20} />
          <span>+ Input Harian Hari Ini</span>
        </motion.button>

        {/* Siklus Aktif Widget */}
        <section style={{ marginTop: '28px' }}>
          <div style={sectionHeaderStyle}>
            <h2 style={sectionTitleStyle}>Siklus Aktif</h2>
            <button style={viewAllButtonStyle} onClick={() => navigate('/siklus')}>
              Lihat Semua
            </button>
          </div>

          <div style={emptyWidgetStyle}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏚️</div>
            <p style={{ color: '#4B6478', fontSize: '13px' }}>Belum ada siklus aktif</p>
            <button 
              onClick={() => navigate('/siklus')}
              style={emptyButtonStyle}
            >
              Mulai Siklus Baru
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}

function PeternakStat({ label, value, sub, icon: Icon, color }) {
  return (
    <div style={statCardStyle}>
      <div style={{ ...statIconBoxStyle, color }}>
        <Icon size={14} />
      </div>
      <p style={statLabelStyle}>{label}</p>
      <p style={{ ...statValueStyle, color }}>{value}</p>
      <p style={statSubStyle}>{sub}</p>
    </div>
  )
}

// Styles
const headerStyle = {
  padding: '24px 20px 20px',
  background: 'linear-gradient(180deg, #0C1319 0%, #06090F 100%)',
  borderBottom: '1px solid rgba(255,255,255,0.03)'
}

const greetingLabelStyle = { fontSize: '13px', color: '#4B6478', marginBottom: '2px' }
const titleStyle = { fontSize: '22px', fontFamily: 'Sora', fontWeight: 800, color: '#F1F5F9', marginBottom: '4px' }
const dateLabelStyle = { fontSize: '12px', color: '#4B6478', fontFamily: 'DM Sans' }

const liveBadgeStyle = {
  background: 'rgba(124,58,237,0.1)',
  border: '1px solid rgba(124,58,237,0.2)',
  padding: '4px 10px',
  borderRadius: '100px',
  display: 'flex',
  alignItems: 'center',
  gap: '6px'
}

const pulseDotStyle = {
  width: '6px',
  height: '6px',
  background: '#7C3AED',
  borderRadius: '50%',
  boxShadow: '0 0 8px #7C3AED'
}

const liveTextStyle = { fontSize: '11px', fontWeight: 700, color: '#A78BFA', textTransform: 'uppercase' }

const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '10px',
  marginTop: '16px'
}

const statCardStyle = {
  background: '#111C24',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '16px',
  padding: '16px'
}

const statIconBoxStyle = { marginBottom: '8px' }
const statLabelStyle = { fontSize: '10px', fontWeight: 600, color: '#4B6478', letterSpacing: '0.5px' }
const statValueStyle = { fontFamily: 'Sora', fontSize: '20px', fontWeight: 800, margin: '4px 0' }
const statSubStyle = { fontSize: '10px', color: '#4B6478' }

const quickActionStyle = {
  width: '100%',
  marginTop: '20px',
  padding: '16px',
  background: 'rgba(124,58,237,0.15)',
  border: '1px solid rgba(124,58,237,0.3)',
  borderRadius: '16px',
  color: '#A78BFA',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  fontFamily: 'DM Sans',
  fontSize: '15px',
  fontWeight: 700,
  cursor: 'pointer'
}

const sectionHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }
const sectionTitleStyle = { fontSize: '16px', fontFamily: 'Sora', fontWeight: 700 }
const viewAllButtonStyle = { color: '#7C3AED', fontSize: '12px', fontWeight: 600, background: 'none', border: 'none' }

const emptyWidgetStyle = {
  padding: '40px 0',
  textAlign: 'center',
  background: '#0C1319',
  borderRadius: '20px',
  border: '1px dashed rgba(255,255,255,0.05)'
}

const emptyButtonStyle = {
  marginTop: '16px',
  background: '#7C3AED',
  color: 'white',
  border: 'none',
  borderRadius: '10px',
  padding: '8px 16px',
  fontSize: '13px',
  fontWeight: 700
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 11) return 'pagi'
  if (hour < 15) return 'siang'
  if (hour < 19) return 'sore'
  return 'malam'
}
