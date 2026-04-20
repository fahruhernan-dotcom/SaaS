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
import { getSubscriptionStatus, getExpiryLabel } from '@/lib/subscriptionUtils'
import { useAuth } from '@/lib/hooks/useAuth'
import { resolveBusinessVertical, BUSINESS_MODELS } from '@/lib/businessModel'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Loader2, Send } from 'lucide-react'

export default function Akun() {
  const { profile, user, tenant, ownerTenant, isSuperadmin } = useAuth()
  const navigate = useNavigate()

  // Use ownerTenant for subscription display — shows the user's OWN plan, not the invited tenant's.
  const sub = getSubscriptionStatus(ownerTenant)
  const expiryLabel = getExpiryLabel(ownerTenant)
  
  const vertical = resolveBusinessVertical(profile, tenant)
  const activeModel = BUSINESS_MODELS[vertical]

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

  // Invitation & Membership State
  const [inviteCode, setInviteCode] = React.useState('')
  const [isJoining, setIsJoining] = React.useState(false)
  const [memberships, setMemberships] = React.useState([])
  const [loadingMemberships, setLoadingMemberships] = React.useState(true)

  const fetchMemberships = React.useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tenant_memberships')
        .select('*, tenants(*)')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setMemberships(data || [])
    } catch (err) {
      console.error('Err fetching memberships:', err)
    } finally {
      setLoadingMemberships(false)
    }
  }, [user.id])

  React.useEffect(() => {
    fetchMemberships()
  }, [fetchMemberships])

  const handleJoinTeam = async () => {
    if (!inviteCode || inviteCode.length < 6) {
      toast.error('Masukkan kode undangan yang valid')
      return
    }

    setIsJoining(true)
    try {
      // 1. Cari undangan yang valid
      const { data: invite, error: inviteError } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('token', inviteCode.toUpperCase())
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()

      if (inviteError) throw inviteError
      if (!invite) throw new Error('Kode undangan tidak valid atau sudah kadaluarsa')

      // 2. Add to memberships (UPSERT)
      const { error: memberError } = await supabase
        .from('tenant_memberships')
        .upsert({
          auth_user_id: user.id,
          tenant_id: invite.tenant_id,
          role: invite.role
        }, { onConflict: 'auth_user_id,tenant_id' })

      if (memberError) throw memberError

      // 3. Upsert profile session for this specific tenant
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          auth_user_id: user.id,
          tenant_id: invite.tenant_id,
          role: invite.role,
          updated_at: new Date().toISOString()
        }, { onConflict: 'auth_user_id,tenant_id' })

      if (profileError) throw profileError

      // 4. Mark invite as accepted
      await supabase
        .from('team_invitations')
        .update({ status: 'accepted' })
        .eq('id', invite.id)

      toast.success('Berhasil bergabung ke tim baru!')
      setTimeout(() => window.location.href = '/dashboard', 1500)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsJoining(false)
    }
  }

  const handleSwitchTeam = async (targetTenantId, targetRole) => {
    if (targetTenantId === profile?.tenant_id) return
    
    const toastId = toast.loading('Berpindah peternakan...')
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role: targetRole,
          updated_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString()
        })
        .eq('auth_user_id', user.id)
        .eq('tenant_id', targetTenantId)
      
      if (error) throw error
      toast.success('Berhasil pindah peternakan', { id: toastId })
      setTimeout(() => window.location.href = '/dashboard', 1000)
    } catch (err) {
      toast.error('Gagal berpindah: ' + err.message, { id: toastId })
    }
  }

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
            <div style={planBadgeStyle}>{isSuperadmin ? 'BUSINESS (ADMIN)' : (tenant?.plan?.toUpperCase() || 'STARTER')}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={labelStyle}>Status</p>
            <p style={{
              fontSize: '12px', fontWeight: 600,
              color: isSuperadmin ? '#10B981' : sub.status === 'expired' ? '#F87171' : sub.status === 'trial' ? '#F59E0B' : '#10B981'
            }}>
              {isSuperadmin ? 'Bypass Sistem Aktif' : sub.status === 'expired' ? 'Expired' : sub.status === 'trial' ? 'Trial Aktif' : `Aktif (${sub.label})`}
            </p>
          </div>
        </div>
        {!isSuperadmin && expiryLabel && (
          <p style={{ fontSize: '11px', color: '#4B6478', marginBottom: '16px' }}>
            {expiryLabel}
            {sub.status !== 'active' && ' — Upgrade ke Pro untuk fitur tanpa batas.'}
          </p>
        )}
        {!isSuperadmin && (
          <button style={outlineBtnBlueStyle} onClick={() => navigate('/upgrade')}>
            <CreditCard size={16} /> {sub.status === 'active' ? 'Perpanjang Plan' : 'Upgrade Plan'}
          </button>
        )}
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
            {activeModel?.icon || '🏢'}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '15px', fontWeight: 700 }}>
              {activeModel?.name || 'Bisnis Tidak Diketahui'}
            </p>
            <p style={{ fontSize: '11px', color: '#4B6478' }}>Model bisnis Anda saat ini</p>
          </div>
          <button 
            onClick={async () => {
              if (window.confirm('Ganti bisnis model? Data Anda tetap aman.')) {
                await supabase.from('profiles').update({ business_model_selected: false }).eq('auth_user_id', user.id).eq('tenant_id', profile?.tenant_id)
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

      {/* Gabung Tim Section */}
      <section style={{ marginTop: '24px' }}>
        <p style={labelStyle}>Punya Kode Undangan?</p>
        <div style={{ ...cardStyle, marginTop: '8px', padding: '16px' }}>
          <p style={{ fontSize: '11px', color: '#4B6478', marginBottom: '12px' }}>
            Masukkan 6 digit kode dari Owner untuk bergabung ke peternakan mereka.
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="CONTOH: AB1234"
              maxLength={8}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '0 16px',
                color: '#10B981',
                fontFamily: 'Sora, sans-serif',
                fontWeight: 800,
                letterSpacing: '2px',
                fontSize: '15px'
              }}
            />
            <button 
              onClick={handleJoinTeam}
              disabled={isJoining || inviteCode.length < 5}
              style={{
                background: isJoining ? 'rgba(255,255,255,0.05)' : '#10B981',
                color: '#FFF',
                border: 'none',
                borderRadius: '12px',
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isJoining ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {isJoining ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </div>
        </div>
      </section>

      {/* Daftar Tim / Peternakan Section */}
      <section style={{ marginTop: '24px' }}>
        <p style={labelStyle}>Peternakan Saya</p>
        <div style={{ ...menuContainerStyle, marginTop: '8px' }}>
          {loadingMemberships ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <Loader2 size={24} className="animate-spin text-green-500 mx-auto" />
            </div>
          ) : memberships.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <p style={{ fontSize: '11px', color: '#4B6478' }}>Belum ada tim lain.</p>
            </div>
          ) : (
            memberships.map((m) => (
              <div 
                key={m.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  background: m.tenant_id === profile?.tenant_id ? 'rgba(16,185,129,0.05)' : 'transparent'
                }}
              >
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px'
                }}>
                  {m.tenants?.business_name?.[0]?.toUpperCase() || '🏠'}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '14px', fontWeight: 700 }}>{m.tenants?.business_name}</p>
                  <p style={{ fontSize: '10px', color: '#4B6478', textTransform: 'uppercase', fontWeight: 800 }}>{m.role}</p>
                </div>
                {m.tenant_id === profile?.tenant_id ? (
                  <span style={{ fontSize: '10px', color: '#10B981', fontWeight: 800, textTransform: 'uppercase' }}>Aktif</span>
                ) : (
                  <button 
                    onClick={() => handleSwitchTeam(m.tenant_id, m.role)}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      color: '#F1F5F9',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Masuk
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* App Menu */}
      <section style={{ marginTop: '24px' }}>
        <p style={{ ...labelStyle, marginLeft: '4px', marginBottom: '12px' }}>Aplikasi</p>
        <div style={menuContainerStyle}>
          <MenuItem icon={Bell} label="Notifikasi" sub="Coming soon" />
          <MenuItem icon={Calculator} label="Simulator Margin" onClick={() => navigate('/simulator')} />
          <MenuItem icon={BarChart3} label="Harga Pasar" onClick={() => navigate('/dashboard/harga-pasar')} />
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

      <div style={{ textAlign: 'center', marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontSize: '10px', color: '#4B6478' }}>
          <a href="/terms" style={{ color: '#4B6478', textDecoration: 'none' }}>Syarat &amp; Ketentuan</a>
          <span>·</span>
          <a href="/privacy" style={{ color: '#4B6478', textDecoration: 'none' }}>Kebijakan Privasi</a>
        </div>
        <p style={{ fontSize: '10px', color: '#4B6478' }}>TernakOS v1.0.2 • Made with 💚 in Indonesia</p>
      </div>
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
