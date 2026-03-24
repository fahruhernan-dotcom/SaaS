import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Check, ChevronLeft, ChevronRight, 
  Store, Tent, Building, MapPin, Phone, 
  ArrowRight, Sparkles, ShieldCheck, HeartPulse,
  Package, ShoppingCart, UserCheck, Briefcase,
  Warehouse, Loader2, Smartphone, Lock
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import AuroraBackground from '../../components/reactbits/AuroraBackground';

export default function OnboardingFlow() {
  const { user, profile, tenant, refetchProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isNewBusiness = searchParams.get('mode') === 'new_business';

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
  const [newTenantId, setNewTenantId] = useState(null);

  // Guard: Skip Step 0 if user_type is already set (Only for normal register)
  useEffect(() => {
    if (!isNewBusiness && profile?.user_type && step === 0) {
      setStep(1);
    }
  }, [profile, step, isNewBusiness]);

  // Guard: Redirect non-owners or already onboarded users (Only for normal register)
  useEffect(() => {
    if (!profile || isNewBusiness) return

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
  }, [profile, navigate, isNewBusiness])

  // Sync initial business name from profile/tenant if available (Only for normal register)
  useEffect(() => {
    if (!isNewBusiness && tenant?.business_name) {
      setFormData(prev => ({ ...prev, business_name: tenant.business_name }));
    }
  }, [tenant, isNewBusiness]);

  if (!profile && !isNewBusiness) {
    return (
      <div className="min-h-screen bg-[#06090F] flex items-center justify-center">
        <div className="text-[#4B6478] text-sm font-medium animate-pulse">Memuat profil...</div>
      </div>
    );
  }

  // Fallback protection: if profile is ever somehow completely falsy and didn't trigger the above
  if (!user || (!profile && isNewBusiness)) {
    return (
      <div className="min-h-screen bg-[#06090F] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500 mr-2" size={20} />
        <div className="text-[#4B6478] text-sm font-medium animate-pulse">Menyiapkan form...</div>
      </div>
    );
  }

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
    if (!isNewBusiness && !['broker', 'egg_broker'].includes(role)) {
      toast.info(`🚧 Dashboard ${role.toUpperCase()} sedang dalam pengembangan. Kami akan notifikasi kamu begitu siap!`);
    }
  };

  const proceedFromRole = async () => {
    if (isNewBusiness) {
      // Just go to next step, tenant creation happens in Step 1
      nextStep();
      return;
    }

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

  // Step 1: Handle Profile Update / Tenant Creation
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isNewBusiness) {
        // Generate tenant ID client-side to avoid SELECT RLS policy trigger
        const generatedTenantId = crypto.randomUUID();

        // Create NEW tenant (no .select() to bypass RLS SELECT policy)
        // trial_ends_at is NOT set — user will start trial manually from sidebar
        const { error: tenantError } = await supabase
          .from('tenants')
          .insert({
            id: generatedTenantId,
            business_name: formData.business_name,
            phone: formData.phone,
            location: formData.location,
            business_vertical: selectedRole === 'broker' ? 'poultry_broker' 
                              : selectedRole === 'egg_broker' ? 'egg_broker' 
                              : selectedRole,
            plan: 'starter'
          });
        
        if (tenantError) {
          if (tenantError.code === '42501') {
            throw new Error('Izin ditolak (RLS Supabase). Anda tidak diperbolehkan membuat bisnis baru.');
          }
          throw tenantError;
        }
        
        setNewTenantId(generatedTenantId);

        // Map selectedRole (business vertical) → valid user_type for profiles table
        const userTypeMap = { 'broker': 'broker', 'egg_broker': 'broker', 'peternak': 'peternak', 'rpa': 'rpa' };
        const mappedUserType = userTypeMap[selectedRole] || 'broker';

        // Create NEW profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            auth_user_id: user.id,
            tenant_id: generatedTenantId,
            full_name: profile?.full_name || user?.email?.split('@')[0],
            role: 'owner',
            user_type: mappedUserType,
            business_model_selected: true,
            onboarded: true,
            phone: formData.phone
          });

        if (profileError) {
          if (profileError.code === '42501') {
            throw new Error('Izin ditolak (RLS Supabase). Profil bisnis baru gagal dibuat.');
          }
          throw profileError;
        }

        // If not broiler broker, redirect now
        if (selectedRole !== 'broker') {
          toast.success('Bisnis baru berhasil dibuat!');
          localStorage.setItem('ternakos_active_tenant_id', generatedTenantId);
          
          let path = '/broker/beranda';
          if (selectedRole === 'egg_broker') path = '/broker/egg_broker/beranda';
          else if (selectedRole === 'peternak') path = '/peternak/beranda';
          else if (selectedRole === 'rpa') path = '/rpa-buyer/beranda';
          
          navigate(path);
          return;
        }

        nextStep();
      } else {
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
      }
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan profil bisnis');
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
        tenant_id: isNewBusiness ? newTenantId : profile.tenant_id,
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
        tenant_id: isNewBusiness ? newTenantId : profile.tenant_id,
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
      if (isNewBusiness) {
        await supabase
          .from('profiles')
          .update({ onboarded: true })
          .eq('tenant_id', newTenantId)
          .eq('auth_user_id', user.id);
        
        // Persist new tenant as active
        localStorage.setItem('ternakos_active_tenant_id', newTenantId);
      } else {
        await supabase
          .from('profiles')
          .update({ onboarded: true })
          .eq('auth_user_id', user.id);
      }
      
      await refetchProfile();
      toast.success(`🎉 Bisnis ${formData.business_name} siap digunakan!`);
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
    <div className="min-h-screen bg-[#06090F] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {step === 0 && <AuroraBackground style={{ position: 'absolute', inset: 0, minHeight: '100%', zIndex: 0 }} />}

      <div className="w-full max-w-md flex flex-col items-center gap-8 z-10 relative">
        {/* Header Logo */}
        <div className="flex items-center gap-2">
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
              className="w-full flex flex-col gap-6"
            >
              <div className="text-center">
                <h1 style={{ fontFamily: 'Sora', fontSize: '22px', fontWeight: 800, color: '#F1F5F9', marginBottom: '8px' }}>
                  Kamu berbisnis sebagai apa?
                </h1>
                <p style={{ fontSize: '14px', fontFamily: 'DM Sans', color: '#4B6478' }}>
                  Pilih tipe bisnis untuk kami siapkan dashboard yang tepat.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* BROKER GROUP */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ 
                    fontSize: '11px', 
                    fontWeight: 800, 
                    color: '#4B6478', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.1em',
                    marginLeft: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    🏢 Broker
                    <div style={{ flex: 1, h: '1px', background: 'rgba(255,255,255,0.05)' }} />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <RoleCard 
                      icon="🐔" 
                      title="Broker Ayam"
                      desc="Beli ayam dari kandang, jual ke RPA atau pasar. Kelola margin dan piutang."
                      badge="Tersedia"
                      badgeColor="#10B981"
                      loading={loading && selectedRole === 'broker'}
                      selected={selectedRole === 'broker'}
                      onClick={() => handleRoleSelection('broker')}
                    />
                    <RoleCard 
                      icon="🥚" 
                      title="Broker Telur"
                      desc="Kelola stok telur, penjualan, dan piutang pelanggan."
                      badge="Tersedia"
                      badgeColor="#10B981"
                      loading={loading && selectedRole === 'egg_broker'}
                      selected={selectedRole === 'egg_broker'}
                      onClick={() => handleRoleSelection('egg_broker')}
                    />
                    <RoleCard 
                      icon="🐄" 
                      title="Broker Sapi"
                      desc="Segera hadir untuk manajemen ternak potong dan distribusi daging."
                      badge="Segera Hadir"
                      badgeColor="#4B6478"
                      disabled={true}
                    />
                    <RoleCard 
                      icon="🛒" 
                      title="Broker Sembako"
                      desc="Segera hadir untuk distribusi bahan pokok dan komoditas pangan lainnya."
                      badge="Segera Hadir"
                      badgeColor="#4B6478"
                      disabled={true}
                    />
                  </div>
                </div>

                {/* OTHER CATEGORIES */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <RoleCard 
                    icon="🏚️" 
                    title="Peternak"
                    desc="Pelihara ayam di kandang, pantau FCR, deplesi, dan panen. (Segera Hadir)"
                    badge="Segera Hadir"
                    badgeColor="#F59E0B"
                    disabled={true}
                  />
                  <RoleCard 
                    icon="🏭" 
                    title="RPA / Buyer"
                    desc="Beli ayam dari broker, kelola order pembelian, dan pantau riwayat. (Segera Hadir)"
                    badge="Segera Hadir"
                    badgeColor="#F59E0B"
                    disabled={true}
                  />
                </div>
              </div>

              {selectedRole && (
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
              className="w-full"
            >
              <ProgressIndicator current={step} />

              {step === 1 && (
                <div>
                  <h2 style={stepTitleStyle}>Lengkapi profil bisnismu</h2>
                  <p style={stepDescStyle}>Data ini membantu kami menyiapkan dashboard kamu.</p>
                  
                  <div style={formGroupStyle}>
                    <label htmlFor="business_name" style={labelStyle}>Nama Bisnis</label>
                    <div style={inputWrapperStyle}>
                      <Building size={18} style={inputIconStyle} />
                      <input 
                        id="business_name"
                        name="business_name"
                        style={inputStyle}
                        placeholder="Contoh: UD Ayam Jaya"
                        value={formData.business_name}
                        onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                      />
                    </div>
                  </div>

                  <div style={formGroupStyle}>
                    <label htmlFor="phone" style={labelStyle}>No HP Bisnis</label>
                    <div style={inputWrapperStyle}>
                      <Smartphone size={18} style={inputIconStyle} />
                      <input 
                        id="phone"
                        name="phone"
                        type="tel"
                        style={inputStyle}
                        placeholder="08123456789"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                  </div>

                  <div style={formGroupStyle}>
                    <label htmlFor="location" style={labelStyle}>Lokasi / Kota</label>
                    <div style={inputWrapperStyle}>
                      <MapPin size={18} style={inputIconStyle} />
                      <input 
                        id="location"
                        name="location"
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
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Lock overlay for disabled cards */}
      {disabled && (
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          width: '28px',
          height: '28px',
          background: 'rgba(75,100,120,0.15)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(75,100,120,0.2)'
        }}>
          <Lock size={14} color="#4B6478" />
        </div>
      )}

      <div style={{ 
        width: '52px', 
        height: '52px', 
        background: disabled ? 'rgba(75,100,120,0.1)' : 'rgba(16,185,129,0.12)', 
        borderRadius: '14px', 
        fontSize: '24px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        filter: disabled ? 'grayscale(0.6)' : 'none'
      }}>
        {loading ? <Loader2 size={24} className="animate-spin text-[#10B981]" /> : icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <h3 style={{ fontFamily: 'Sora', fontSize: '16px', fontWeight: 700, color: disabled ? '#4B6478' : '#F1F5F9' }}>{title}</h3>
            {badge && (
              <span style={{ 
                fontSize: '10px', 
                fontWeight: 700, 
                color: badgeColor, 
                background: `${badgeColor}15`, 
                padding: '4px 10px', 
                borderRadius: '99px',
                border: `1px solid ${badgeColor}30`,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {disabled && <Lock size={9} />}
                {badge}
              </span>
            )}
        </div>
        <p style={{ fontSize: '13px', fontFamily: 'DM Sans', color: '#4B6478', lineHeight: '1.6' }}>{desc}</p>
        {/* "Mulai Trial" sub-text for available cards */}
        {!disabled && !selected && (
          <p style={{ fontSize: '11px', fontFamily: 'DM Sans', color: '#10B981', marginTop: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={12} /> Mulai Trial 14 Hari — Gratis
          </p>
        )}
        {selected && (
          <p style={{ fontSize: '11px', fontFamily: 'DM Sans', color: '#10B981', marginTop: '6px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Check size={12} /> Dipilih
          </p>
        )}
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
