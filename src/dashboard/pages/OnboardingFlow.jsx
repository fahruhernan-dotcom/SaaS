import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  MapPin, 
  CheckCircle2, 
  ArrowRight, 
  Warehouse, 
  Building, 
  ChevronRight,
  User,
  Smartphone,
  Check,
  Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import AuroraBackground from '../../components/reactbits/AuroraBackground';

export default function OnboardingFlow() {
  const { user, profile, tenant } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // Start at Step 0: Choose Role
  const [selectedRole, setSelectedRole] = useState(null);
  const [direction, setDirection] = useState(1); // For slide animation
  
  const [formData, setFormData] = useState({
    business_name: '',
    location: '',
    phone: '',
    // Step 2: Farm
    farm_name: '',
    farm_owner: '',
    farm_phone: '',
    farm_location: '',
    farm_status: 'ready',
    farm_stock: '0',
    // Step 3: RPA
    rpa_name: '',
    rpa_cp: '',
    rpa_phone: '',
    rpa_terms: 'cash'
  });

  const [loading, setLoading] = useState(false);
  const [isFarmAdded, setIsFarmAdded] = useState(false);
  const [isRPAAdded, setIsRPAAdded] = useState(false);

  // Guard: Skip Step 0 if user_type is already set
  useEffect(() => {
    if (profile?.user_type && step === 0) {
      setStep(1);
    }
  }, [profile, step]);

  // Guard: Redirect non-owners or already onboarded users
  useEffect(() => {
    if (!profile) return

    // Staff → langsung ke dashboard
    if (profile.role === 'staff') {
      navigate('/broker/beranda', { replace: true })
      return
    }

    // Owner sudah onboarded → ke dashboard
    if (profile.onboarded === true && profile.business_model_selected === true) {
      navigate('/broker/beranda', { replace: true })
      return
    }
  }, [profile, navigate])

  // Sync initial business name from profile/tenant if available
  useEffect(() => {
    if (tenant?.business_name) {
      setFormData(prev => ({ ...prev, business_name: tenant.business_name }));
    }
  }, [tenant]);

  if (!profile) return (
    <div className="min-h-screen bg-[#06090F] flex items-center justify-center">
      <div className="text-[#4B6478] text-sm font-medium animate-pulse">Memuat profil...</div>
    </div>
  )

  const nextStep = () => {
    setDirection(1);
    setStep(s => s + 1);
  };

  const prevStep = () => {
    setDirection(-1);
    setStep(s => s - 1);
  };

  // Step 0: Handle Role Selection (Improve 1 & 2)
  const handleRoleSelection = async (role) => {
    setSelectedRole(role);
    if (role !== 'broker') {
      toast.info(`🚧 Dashboard ${role.toUpperCase()} sedang dalam pengembangan. Kami akan notifikasi kamu begitu siap!`);
      
      setLoading(true);
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ 
            user_type: role, 
            business_model_selected: true,
            onboarded: true 
          })
          .eq('auth_user_id', user.id);
        
        if (error) throw error;
        
        const path = role === 'peternak' ? '/peternak/beranda' : '/rpa-buyer/beranda';
        navigate(path);
      } catch (err) {
        toast.error('Gagal memperbarui profil. ' + err.message);
      } finally {
        setLoading(false);
      }
      return;
    }
  };

  const proceedFromRole = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          user_type: 'broker',
          business_model_selected: true 
        })
        .eq('auth_user_id', user.id);
      
      if (error) throw error;
      nextStep();
    } catch (err) {
      toast.error('Gagal memperbarui tipe bisnis');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Handle Profile Update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          business_name: formData.business_name,
          phone: formData.phone,
          location: formData.location,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.tenant_id);
      
      if (error) throw error;
      nextStep();
    } catch (err) {
      toast.error('Gagal menyimpan profil bisnis');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Add First Farm
  const handleAddFarm = async () => {
    if (!formData.farm_name || !formData.farm_owner) {
      return toast.error('Mohon isi nama kandang dan pemilik');
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('farms').insert({
        tenant_id: profile.tenant_id,
        farm_name: formData.farm_name,
        owner_name: formData.farm_owner,
        phone: formData.farm_phone,
        location: formData.farm_location,
        status: formData.farm_status,
        available_stock: parseInt(formData.farm_stock) || 0
      });
      if (error) throw error;
      setIsFarmAdded(true);
      toast.success('Kandang berhasil ditambahkan!');
    } catch (err) {
      toast.error('Gagal menambahkan kandang');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Add First RPA
  const handleAddRPA = async () => {
    if (!formData.rpa_name) {
      return toast.error('Mohon isi nama RPA');
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('rpa_clients').insert({
        tenant_id: profile.tenant_id,
        rpa_name: formData.rpa_name,
        contact_person: formData.rpa_cp,
        phone: formData.rpa_phone,
        payment_terms: formData.rpa_terms
      });
      if (error) throw error;
      setIsRPAAdded(true);
      toast.success('RPA berhasil ditambahkan!');
    } catch (err) {
      toast.error('Gagal menambahkan RPA');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await supabase
        .from('profiles')
        .update({ onboarded: true })
        .eq('auth_user_id', user.id);
      
      toast.success(`🎉 Selamat datang di TernakOS, ${profile?.full_name?.split(' ')[0]}!`);
      navigate('/broker/beranda');
    } catch (err) {
      toast.error('Gagal menyelesaikan onboarding');
    } finally {
      setLoading(false);
    }
  };

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 40 : -40,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 40 : -40,
      opacity: 0
    })
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#06090F', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {step === 0 && <AuroraBackground />}

      <div style={{ 
        width: '100%', 
        maxWidth: '480px', 
        padding: '24px 20px', 
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh'
      }}>
        {/* Header Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: step === 0 ? '40px' : '24px' }}>
          <div style={{ width: '32px', height: '32px', background: '#10B981', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Warehouse size={18} color="white" />
          </div>
          <span style={{ fontFamily: 'Sora', fontSize: '18px', fontWeight: 700, color: '#F1F5F9' }}>TernakOS</span>
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          {step === 0 && (
            <motion.div
              key="step0"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
            >
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h1 style={{ fontFamily: 'Sora', fontSize: '22px', fontWeight: 800, color: '#F1F5F9', marginBottom: '8px' }}>
                  Kamu berbisnis sebagai apa?
                </h1>
                <p style={{ fontSize: '14px', fontFamily: 'DM Sans', color: '#4B6478' }}>
                  Pilih tipe bisnis untuk kami siapkan dashboard yang tepat.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <RoleCard 
                  icon="🤝" 
                  title="Broker / Pedagang"
                  desc="Beli ayam dari kandang, jual ke RPA atau pasar. Kelola margin, piutang, dan pengiriman."
                  badge="Tersedia"
                  badgeColor="#10B981"
                  loading={loading && selectedRole === 'broker'}
                  selected={selectedRole === 'broker'}
                  onClick={() => handleRoleSelection('broker')}
                />
                <RoleCard 
                  icon="🏚️" 
                  title="Peternak"
                  desc="Pelihara ayam di kandang, pantau FCR, deplesi, dan estimasi panen. Catat biaya produksi."
                  badge="Segera Hadir"
                  badgeColor="#F59E0B"
                  loading={loading && selectedRole === 'peternak'}
                  disabled={loading}
                  onClick={() => handleRoleSelection('peternak')}
                />
                <RoleCard 
                  icon="🏭" 
                  title="RPA / Buyer"
                  desc="Beli ayam dari broker, kelola order pembelian, dan pantau riwayat transaksi."
                  badge="Segera Hadir"
                  badgeColor="#F59E0B"
                  loading={loading && selectedRole === 'rpa'}
                  disabled={loading}
                  onClick={() => handleRoleSelection('rpa')}
                />
              </div>

              {selectedRole === 'broker' && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={proceedFromRole}
                  disabled={loading}
                  style={primaryBtnStyle}
                >
                  {loading ? <><Loader2 size={18} className="animate-spin mr-2" /> Menyiapkan...</> : 'Lanjut'} <ArrowRight size={18} />
                </motion.button>
              )}
            </motion.div>
          )}

          {step >= 1 && (
            <motion.div
              key={`step${step}`}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              style={{ flex: 1 }}
            >
              <ProgressIndicator current={step} />

              {step === 1 && (
                <div>
                  <h2 style={stepTitleStyle}>Lengkapi profil bisnismu</h2>
                  <p style={stepDescStyle}>Data ini membantu kami menyiapkan dashboard kamu.</p>
                  
                  <div style={formGroupStyle}>
                    <label style={labelStyle}>Nama Bisnis</label>
                    <div style={inputWrapperStyle}>
                      <Building size={18} style={inputIconStyle} />
                      <input 
                        style={inputStyle}
                        placeholder="Contoh: UD Ayam Jaya"
                        value={formData.business_name}
                        onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                      />
                    </div>
                  </div>

                  <div style={formGroupStyle}>
                    <label style={labelStyle}>No HP Bisnis</label>
                    <div style={inputWrapperStyle}>
                      <Smartphone size={18} style={inputIconStyle} />
                      <input 
                        type="tel"
                        style={inputStyle}
                        placeholder="08123456789"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                  </div>

                  <div style={formGroupStyle}>
                    <label style={labelStyle}>Lokasi / Kota</label>
                    <div style={inputWrapperStyle}>
                      <MapPin size={18} style={inputIconStyle} />
                      <input 
                        style={inputStyle}
                        placeholder="Contoh: Boyolali, Jawa Tengah"
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handleProfileUpdate}
                    disabled={loading || !formData.business_name || !formData.phone || !formData.location}
                    style={{ ...primaryBtnStyle, marginTop: '12px' }}
                  >
                    {loading ? <><Loader2 size={16} className="animate-spin mr-2" /> Menyimpan...</> : 'Lanjut'} <ArrowRight size={18} />
                  </button>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 style={stepTitleStyle}>Tambahkan kandang rekanan</h2>
                  <p style={stepDescStyle}>Tambah minimal satu kandang untuk mulai catat transaksi.</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                    <div style={formGroupStyle}>
                      <label style={labelStyle}>Nama Kandang *</label>
                      <input 
                        style={inputStyle}
                        placeholder="Kandang Pak Harto"
                        value={formData.farm_name}
                        onChange={(e) => setFormData({...formData, farm_name: e.target.value})}
                      />
                    </div>
                    
                    <div style={formGroupStyle}>
                      <label style={labelStyle}>Nama Pemilik *</label>
                      <input 
                        style={inputStyle}
                        placeholder="Pak Harto"
                        value={formData.farm_owner}
                        onChange={(e) => setFormData({...formData, farm_owner: e.target.value})}
                      />
                    </div>

                    <div style={formGroupStyle}>
                      <label style={labelStyle}>No HP Pemilik</label>
                      <input 
                        type="tel"
                        style={inputStyle}
                        placeholder="081..."
                        value={formData.farm_phone}
                        onChange={(e) => setFormData({...formData, farm_phone: e.target.value})}
                      />
                    </div>

                    <div style={formGroupStyle}>
                      <label style={labelStyle}>Status Saat Ini</label>
                      <select 
                        style={inputStyle}
                        value={formData.farm_status}
                        onChange={(e) => setFormData({...formData, farm_status: e.target.value})}
                      >
                        <option value="ready">Siap Panen</option>
                        <option value="growing">Tumbuh</option>
                        <option value="empty">Kosong</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    onClick={handleAddFarm}
                    disabled={loading || isFarmAdded}
                    style={{ 
                      ...primaryBtnStyle, 
                      marginTop: '24px',
                      background: isFarmAdded ? 'transparent' : '#10B981',
                      border: isFarmAdded ? '1px solid #10B981' : 'none',
                      color: isFarmAdded ? '#10B981' : 'white'
                    }}
                  >
                    {isFarmAdded ? <><Check size={18} /> Kandang ditambahkan!</> : loading ? <><Loader2 size={16} className="animate-spin mr-2" /> Menambahkan...</> : 'Tambah Kandang'}
                  </button>

                  <button onClick={nextStep} style={secondaryBtnStyle}>
                    {isFarmAdded ? 'Lanjut' : 'Lewati'} <ArrowRight size={18} />
                  </button>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h2 style={stepTitleStyle}>Siapa pembeli ayam kamu?</h2>
                  <p style={stepDescStyle}>Tambah RPA atau buyer yang biasa membeli dari kamu.</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                    <div style={formGroupStyle}>
                      <label style={labelStyle}>Nama RPA *</label>
                      <input 
                        style={inputStyle}
                        placeholder="RPA Prima Jaya"
                        value={formData.rpa_name}
                        onChange={(e) => setFormData({...formData, rpa_name: e.target.value})}
                      />
                    </div>
                    
                    <div style={formGroupStyle}>
                      <label style={labelStyle}>Contact Person</label>
                      <input 
                        style={inputStyle}
                        placeholder="Pak Budi"
                        value={formData.rpa_cp}
                        onChange={(e) => setFormData({...formData, rpa_cp: e.target.value})}
                      />
                    </div>

                    <div style={formGroupStyle}>
                      <label style={labelStyle}>No HP Buyer</label>
                      <input 
                        type="tel"
                        style={inputStyle}
                        placeholder="081..."
                        value={formData.rpa_phone}
                        onChange={(e) => setFormData({...formData, rpa_phone: e.target.value})}
                      />
                    </div>

                    <div style={formGroupStyle}>
                      <label style={labelStyle}>Syarat Pembayaran</label>
                      <select 
                        style={inputStyle}
                        value={formData.rpa_terms}
                        onChange={(e) => setFormData({...formData, rpa_terms: e.target.value})}
                      >
                        <option value="cash">Cash</option>
                        <option value="net3">Net 3 Hari</option>
                        <option value="net7">Net 7 Hari</option>
                        <option value="net14">Net 14 Hari</option>
                        <option value="net30">Net 30 Hari</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    onClick={handleAddRPA}
                    disabled={loading || isRPAAdded}
                    style={{ 
                      ...primaryBtnStyle, 
                      marginTop: '24px',
                      background: isRPAAdded ? 'transparent' : '#10B981',
                      border: isRPAAdded ? '1px solid #10B981' : 'none',
                      color: isRPAAdded ? '#10B981' : 'white'
                    }}
                  >
                    {isRPAAdded ? <><Check size={18} /> RPA ditambahkan!</> : loading ? <><Loader2 size={16} className="animate-spin mr-2" /> Menambahkan...</> : 'Tambah RPA'}
                  </button>

                  <button onClick={handleFinish} disabled={loading} style={secondaryBtnStyle}>
                    {loading ? <Loader2 size={16} className="animate-spin" /> : 'Mulai Pakai TernakOS'} <ArrowRight size={18} />
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function RoleCard({ icon, title, desc, badge, badgeColor, loading, selected, disabled, onClick }) {
  return (
    <motion.div
      whileHover={{ borderColor: disabled ? 'rgba(255,255,255,0.09)' : 'rgba(16,185,129,0.4)' }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={!disabled ? onClick : undefined}
      style={{
        background: selected ? 'rgba(16,185,129,0.06)' : '#111C24',
        border: `1px solid ${selected ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.09)'}`,
        borderRadius: '20px',
        padding: '24px 20px',
        cursor: disabled ? 'default' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        opacity: disabled ? 0.65 : 1,
        transition: 'all 0.2s ease',
        position: 'relative'
      }}
    >
      <div style={{ 
        width: '52px', 
        height: '52px', 
        background: 'rgba(16,185,129,0.12)', 
        borderRadius: '14px', 
        fontSize: '24px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        {loading ? <Loader2 size={24} className="animate-spin text-[#10B981]" /> : icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <h3 style={{ fontFamily: 'Sora', fontSize: '16px', fontWeight: 700, color: '#F1F5F9' }}>{title}</h3>
          <span style={{ 
            fontSize: '10px', 
            fontWeight: 700, 
            color: badgeColor, 
            background: `${badgeColor}15`, 
            padding: '4px 10px', 
            borderRadius: '99px',
            border: `1px solid ${badgeColor}30`
          }}>
            {badge}
          </span>
        </div>
        <p style={{ fontSize: '13px', fontFamily: 'DM Sans', color: '#4B6478', lineHeight: '1.6' }}>{desc}</p>
      </div>
    </motion.div>
  );
}

function ProgressIndicator({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '32px' }}>
      {[1, 2, 3].map(i => (
        <React.Fragment key={i}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 700,
            background: current >= i ? '#10B981' : '#111C24',
            color: current >= i ? 'white' : '#4B6478',
            border: current >= i ? 'none' : '1px solid rgba(255,255,255,0.15)',
            transition: 'all 0.3s ease'
          }}>
            {current > i ? <Check size={14} /> : i}
          </div>
          {i < 3 && <div style={{ width: '40px', height: '1px', background: current > i ? '#10B981' : 'rgba(255,255,255,0.1)' }} />}
        </React.Fragment>
      ))}
    </div>
  );
}

const primaryBtnStyle = {
  width: '100%',
  background: '#10B981',
  color: 'white',
  borderRadius: '14px',
  padding: '16px',
  fontFamily: 'Sora',
  fontSize: '15px',
  fontWeight: 700,
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  cursor: 'pointer',
  boxShadow: '0 4px 20px rgba(16,185,129,0.25)',
  margin: '24px auto 0'
};

const secondaryBtnStyle = {
  width: '100%',
  background: 'transparent',
  color: '#4B6478',
  borderRadius: '14px',
  padding: '12px',
  fontFamily: 'DM Sans',
  fontSize: '14px',
  fontWeight: 600,
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  cursor: 'pointer',
  marginTop: '12px'
};

const stepTitleStyle = { fontFamily: 'Sora', fontSize: '20px', fontWeight: 800, color: '#F1F5F9', marginBottom: '8px', textAlign: 'center' };
const stepDescStyle = { fontSize: '14px', color: '#94A3B8', marginBottom: '24px', textAlign: 'center' };
const formGroupStyle = { marginBottom: '16px' };
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 600, color: '#4B6478', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' };
const inputWrapperStyle = { position: 'relative', display: 'flex', alignItems: 'center' };
const inputIconStyle = { position: 'absolute', left: '14px', color: '#4B6478' };
const inputStyle = { width: '100%', padding: '14px 14px 14px 44px', background: '#111C24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: 'white', fontSize: '15px', outline: 'none' };
