import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, MapPin, CheckCircle2, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/hooks/useAuth';

export default function OnboardingFlow() {
  const { user, profile } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    tenant_name: '',
    region: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    setLoading(true);
    try {
      // 1. Create Tenant
      const { data: tenant, error: tErr } = await supabase
        .from('tenants')
        .insert([{ tenant_name: formData.tenant_name, region: formData.region }])
        .select()
        .single();
      
      if (tErr) throw tErr;

      // 2. Update Profile with Tenant ID
      const { error: pErr } = await supabase
        .from('profiles')
        .update({ tenant_id: tenant.id })
        .eq('auth_user_id', user.id);

      if (pErr) throw pErr;

      setStep(3); // Success step
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#06090F', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <AnimatePresence mode="wait">
        
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, x: -20 }}
            style={cardStyle}
          >
            <div style={iconBoxStyle}><Building2 color="#10B981" /></div>
            <h2 style={titleStyle}>Siapa nama bisnis Anda?</h2>
            <p style={descStyle}>Ini akan menjadi nama tenant utama Anda.</p>
            <input 
              type="text" 
              placeholder="Contoh: Berkah Unggul Perkasa" 
              value={formData.tenant_name}
              onChange={(e) => setFormData({...formData, tenant_name: e.target.value})}
              style={inputStyle}
            />
            <button 
              disabled={!formData.tenant_name}
              onClick={() => setStep(2)}
              style={btnStyle}
            >
              Lanjut <ArrowRight size={18} />
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            style={cardStyle}
          >
            <div style={iconBoxStyle}><MapPin color="#10B981" /></div>
            <h2 style={titleStyle}>Lokasi Operasional?</h2>
            <p style={descStyle}>Wilayah kerja broker Anda.</p>
            <input 
              type="text" 
              placeholder="Contoh: Jawa Tengah" 
              value={formData.region}
              onChange={(e) => setFormData({...formData, region: e.target.value})}
              style={inputStyle}
            />
            <button 
              disabled={!formData.region || loading}
              onClick={handleComplete}
              style={btnStyle}
            >
              {loading ? 'Menyimpan...' : 'Selesaikan Profil'}
            </button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={cardStyle}
          >
            <div style={iconBoxStyle}><CheckCircle2 color="#10B981" /></div>
            <h2 style={titleStyle}>Semua Selesai!</h2>
            <p style={descStyle}>Dashboard Anda sudah siap digunakan.</p>
            <button 
              onClick={() => window.location.href = '/dashboard'}
              style={btnStyle}
            >
              Masuk Dashboard
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

const cardStyle = {
  width: '100%',
  maxWidth: '360px',
  background: '#111C24',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '24px',
  padding: '32px 24px',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
};

const iconBoxStyle = {
  width: '56px', height: '56px',
  background: 'rgba(16,185,129,0.1)',
  borderRadius: '16px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  marginBottom: '20px'
};

const titleStyle = { fontFamily: 'Sora', fontSize: '20px', fontWeight: 800, color: '#F1F5F9', marginBottom: '8px' };
const descStyle = { fontSize: '14px', color: '#94A3B8', marginBottom: '24px' };
const inputStyle = { width: '100%', padding: '14px', background: '#0C1319', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', marginBottom: '24px', outline: 'none', textAlign: 'center' };
const btnStyle = { width: '100%', padding: '16px', background: '#10B981', color: 'white', borderRadius: '12px', border: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' };
