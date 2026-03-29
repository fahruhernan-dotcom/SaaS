import React from 'react'
import { motion } from 'framer-motion'
import { 
  User, 
  ChevronRight, 
  Bell, 
  Calculator, 
  BarChart3, 
  HelpCircle, 
  LogOut,
  CreditCard,
  Building
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

export default function Akun() {
  const { profile, user, tenant } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error('Gagal keluar')
    } else {
      navigate('/login')
      toast.success('Berhasil keluar')
    }
  }

  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

  return (
    <div style={{ padding: '24px 20px', color: '#F1F5F9' }}>
      <h1 style={{ 
        fontFamily: 'Sora, sans-serif', 
        fontSize: '20px', 
        fontWeight: 800, 
        marginBottom: '28px',
        textAlign: 'center'
      }}>
        Akun
      </h1>

      {/* Profile Section */}
      <section style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div style={avatarLargeStyle}>{initials}</div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>{profile?.full_name}</h2>
            <p style={{ fontSize: '12px', color: '#4B6478' }}>{user?.email}</p>
            <div style={roleBadgeStyle}>{profile?.user_type?.toUpperCase() || 'USER'}</div>
          </div>
        </div>
        <button style={outlineBtnStyle}>Edit Profil</button>
      </section>

      {/* Subscription Section */}
      <section style={{ ...cardStyle, marginTop: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <p style={labelStyle}>Plan Saya</p>
            <div style={planBadgeStyle}>{tenant?.plan?.toUpperCase() || 'STARTER'}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={labelStyle}>Status</p>
            <p style={{ fontSize: '12px', color: '#10B981', fontWeight: 600 }}>Aktif (Trial)</p>
          </div>
        </div>
        <p style={{ fontSize: '11px', color: '#4B6478', marginBottom: '16px' }}>
          Trial Anda akan berakhir dalam <span style={{ color: '#F87171' }}>24 hari</span>. Upgrade ke Pro untuk fitur tanpa batas.
        </p>
        <button style={outlineBtnBlueStyle}>
          <CreditCard size={16} /> Upgrade Plan
        </button>
      </section>

      {/* Business Model Section */}
      <section style={{ marginTop: '24px' }}>
        <p style={labelStyle}>Bisnis Model Aktif</p>
        <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '14px', marginTop: '8px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            {profile?.user_type === 'broker' ? '🤝' : profile?.user_type === 'peternak' ? '🏚️' : '🏭'}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '15px', fontWeight: 700 }}>
              {profile?.user_type === 'broker' ? 'Broker / Pedagang' : profile?.user_type === 'peternak' ? 'Peternak' : 'RPA / Buyer'}
            </p>
            <p style={{ fontSize: '11px', color: '#4B6478' }}>Model bisnis Anda saat ini</p>
          </div>
          <button 
            onClick={async () => {
              if (window.confirm('Ganti bisnis model? Data Anda tetap aman.')) {
                await supabase.from('profiles').update({ business_model_selected: false }).eq('auth_user_id', user.id)
                window.location.reload()
              }
            }}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '6px 12px',
              color: '#94A3B8',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Ganti
          </button>
        </div>
      </section>

      {/* App Menu */}
      <section style={{ marginTop: '24px' }}>
        <p style={{ ...labelStyle, marginLeft: '4px', marginBottom: '12px' }}>Aplikasi</p>
        <div style={menuContainerStyle}>
          <MenuItem icon={Bell} label="Notifikasi" sub="Coming soon" />
          <MenuItem icon={Calculator} label="Simulator Margin" onClick={() => navigate('/simulator')} />
          <MenuItem icon={BarChart3} label="Harga Pasar" onClick={() => navigate('/harga-pasar')} />
          <MenuItem icon={HelpCircle} label="Bantuan" sub="WhatsApp Center" />
        </div>
      </section>

      {/* Logout */}
      <motion.button 
        whileTap={{ scale: 0.98 }}
        onClick={handleLogout}
        style={logoutBtnStyle}
      >
        <LogOut size={18} /> Keluar
      </motion.button>

      <p style={{ textAlign: 'center', fontSize: '10px', color: '#4B6478', marginTop: '32px' }}>
        TernakOS v1.0.2 • Made with 💚 in Indonesia
      </p>
    </div>
  )
}

function MenuItem({ icon: Icon, label, sub, onClick }) {
  return (
    <div 
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '14px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.03)',
        cursor: onClick ? 'pointer' : 'default'
      }}
    >
      <div style={{ color: '#4B6478' }}><Icon size={18} /></div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '14px', fontWeight: 600, color: '#F1F5F9' }}>{label}</p>
        {sub && <p style={{ fontSize: '10px', color: '#4B6478' }}>{sub}</p>}
      </div>
      <ChevronRight size={16} color="#4B6478" />
    </div>
  )
}

const cardStyle = {
  background: '#111C24',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '20px',
  padding: '20px'
}

const avatarLargeStyle = {
  width: '64px',
  height: '64px',
  borderRadius: '22px',
  background: 'rgba(16,185,129,0.12)',
  border: '1px solid rgba(16,185,129,0.20)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'Sora, sans-serif',
  fontSize: '22px',
  fontWeight: 800,
  color: '#34D399'
}

const roleBadgeStyle = {
  display: 'inline-block',
  marginTop: '8px',
  padding: '3px 8px',
  background: 'rgba(16,185,129,0.1)',
  borderRadius: '6px',
  fontSize: '10px',
  fontWeight: 700,
  color: '#10B981',
  letterSpacing: '0.5px'
}

const outlineBtnStyle = {
  width: '100%',
  padding: '10px',
  background: 'none',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color: '#94A3B8',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer'
}

const outlineBtnBlueStyle = {
  width: '100%',
  padding: '12px',
  background: 'rgba(59,130,246,0.05)',
  border: '1px solid rgba(59,130,246,0.2)',
  borderRadius: '12px',
  color: '#93C5FD',
  fontSize: '14px',
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  cursor: 'pointer'
}

const labelStyle = {
  fontSize: '11px',
  fontWeight: 600,
  color: '#4B6478',
  textTransform: 'uppercase',
  letterSpacing: '0.8px',
  marginBottom: '4px'
}

const planBadgeStyle = {
  fontSize: '14px',
  fontWeight: 800,
  color: '#F1F5F9',
  fontFamily: 'Sora, sans-serif'
}

const menuContainerStyle = {
  background: '#111C24',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '20px',
  overflow: 'hidden'
}

const logoutBtnStyle = {
  width: '100%',
  marginTop: '32px',
  padding: '14px',
  background: 'rgba(248,113,113,0.08)',
  border: '1px solid rgba(248,113,113,0.15)',
  borderRadius: '14px',
  color: '#F87171',
  fontFamily: 'DM Sans, sans-serif',
  fontSize: '15px',
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  cursor: 'pointer'
}
