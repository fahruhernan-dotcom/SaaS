import TopBar from '../components/TopBar'
import { useAuth } from '../../lib/hooks/useAuth'
import { supabase } from '../../lib/supabase'

export default function Akun() {
  const { profile } = useAuth()
  
  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <div>
      <TopBar title="Pengaturan Akun" />
      <div style={{ padding: '20px' }}>
        <div style={{ 
          background: '#111C24', 
          borderRadius: '16px', 
          padding: '20px',
          border: '1px solid rgba(255,255,255,0.07)'
        }}>
          <div style={{ color: '#F1F5F9', fontWeight: 700, fontSize: '18px' }}>
            {profile?.full_name || 'User TernakOS'}
          </div>
          <div style={{ color: '#4B6478', fontSize: '14px', marginBottom: '20px' }}>
            {profile?.tenants?.tenant_name || 'Broker Ayam'}
          </div>
          
          <button 
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(248,113,113,0.1)',
              border: '1px solid rgba(248,113,113,0.2)',
              borderRadius: '12px',
              color: '#F87171',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Keluar Aplikasi
          </button>
        </div>
      </div>
    </div>
  )
}
