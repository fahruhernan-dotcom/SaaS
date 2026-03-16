import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { 
  CreditCard, 
  ShoppingCart, 
  BarChart3, 
  History,
  PlusCircle
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/hooks/useAuth'
import { formatDateFull, formatIDRShort } from '../../lib/format'
import LoadingSpinner from '../components/LoadingSpinner'
import { useNavigate } from 'react-router-dom'

export default function RPABeranda() {
  const { profile, tenant } = useAuth()
  const navigate = useNavigate()

  const { data: stats, isLoading } = useQuery({
    queryKey: ['rpa-stats', tenant?.id],
    queryFn: async () => {
      // Placeholder
      return { debt: 0, pendingOrders: 0 }
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
        <section style={statsGridStyle}>
          <RPAStat 
            label="HUTANG AKTIF"
            value={formatIDRShort(0)}
            sub="ke broker rekanan"
            icon={CreditCard}
            color="#F87171"
          />
          <RPAStat 
            label="ORDER PENDING"
            value="0"
            sub="menunggu pengiriman"
            icon={ShoppingCart}
            color="#FBBF24"
          />
          <RPAStat 
            label="BELI BULAN INI"
            value={formatIDRShort(0)}
            sub="total volume ayam"
            icon={BarChart3}
            color="#F1F5F9"
          />
          <RPAStat 
            label="TRANSAKSI"
            value="0"
            sub="bulan ini"
            icon={History}
            color="#3B82F6"
          />
        </section>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/order-broker')}
          style={quickActionStyle}
        >
          <PlusCircle size={20} />
          <span>+ Buat Order ke Broker</span>
        </motion.button>

        <section style={{ marginTop: '28px' }}>
          <div style={sectionHeaderStyle}>
            <h2 style={sectionTitleStyle}>Hutang ke Broker</h2>
            <button style={viewAllButtonStyle} onClick={() => navigate('/hutang-saya')}>
              Lihat Semua
            </button>
          </div>

          <div style={emptyWidgetStyle}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏭</div>
            <p style={{ color: '#4B6478', fontSize: '13px' }}>Tidak ada hutang aktif</p>
          </div>
        </section>
      </main>
    </div>
  )
}

function RPAStat({ label, value, sub, icon: Icon, color }) {
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

// Styles (Matched for consistency)
const headerStyle = {
  padding: '24px 20px 20px',
  background: 'linear-gradient(180deg, #0C1319 0%, #06090F 100%)',
  borderBottom: '1px solid rgba(255,255,255,0.03)'
}

const greetingLabelStyle = { fontSize: '13px', color: '#4B6478', marginBottom: '2px' }
const titleStyle = { fontSize: '22px', fontFamily: 'Sora', fontWeight: 800, color: '#F1F5F9', marginBottom: '4px' }
const dateLabelStyle = { fontSize: '12px', color: '#4B6478', fontFamily: 'DM Sans' }

const liveBadgeStyle = {
  background: 'rgba(245,158,11,0.1)',
  border: '1px solid rgba(245,158,11,0.2)',
  padding: '4px 10px',
  borderRadius: '100px',
  display: 'flex',
  alignItems: 'center',
  gap: '6px'
}

const pulseDotStyle = {
  width: '6px',
  height: '6px',
  background: '#F59E0B',
  borderRadius: '50%',
  boxShadow: '0 0 8px #F59E0B'
}

const liveTextStyle = { fontSize: '11px', fontWeight: 700, color: '#FBBF24', textTransform: 'uppercase' }

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
  background: 'rgba(245,158,11,0.12)',
  border: '1px solid rgba(245,158,11,0.25)',
  borderRadius: '16px',
  color: '#FBBF24',
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
const viewAllButtonStyle = { color: '#F59E0B', fontSize: '12px', fontWeight: 600, background: 'none', border: 'none' }

const emptyWidgetStyle = {
  padding: '40px 0',
  textAlign: 'center',
  background: '#0C1319',
  borderRadius: '20px',
  border: '1px dashed rgba(255,255,255,0.05)'
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 11) return 'pagi'
  if (hour < 15) return 'siang'
  if (hour < 19) return 'sore'
  return 'malam'
}
