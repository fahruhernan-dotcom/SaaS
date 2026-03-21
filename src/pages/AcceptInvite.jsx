import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UserPlus, LogIn, ArrowLeft, ShieldCheck, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function AcceptInvite() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [view, setView] = useState('input'); // 'input', 'choice', 'register', 'login'
  const [inviteCode, setInviteCode] = useState('');
  const [invitation, setInvitation] = useState(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const verifyCode = async (e) => {
    if (e) e.preventDefault();
    if (inviteCode.length !== 6) {
      return toast.error('Kode harus 6 karakter');
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('team_invitations')
        .select('*, tenants(business_name, plan)')
        .eq('token', inviteCode.toUpperCase())
        .eq('status', 'pending')
        .eq('is_deleted', false)
        .single();

      if (error || !data) {
        toast.error('Kode tidak valid atau sudah kadaluarsa');
      } else if (new Date(data.expires_at) < new Date()) {
        toast.error('Kode undangan ini telah kedaluwarsa');
      } else {
        setInvitation(data);
        if (data.email) {
          setFormData(prev => ({ ...prev, email: data.email }));
        }
        setView('choice');
      }
    } catch (err) {
      toast.error('Gagal memverifikasi kode');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return toast.error('Konfirmasi password tidak cocok');
    }
    if (formData.password.length < 8) {
      return toast.error('Password minimal 8 karakter');
    }

    setIsSubmitting(true);
    try {
      // 1. Sign Up
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName
          }
        }
      });
      if (signUpError) throw signUpError;

      const user = authData.user;
      if (!user) throw new Error('Gagal membuat user');

      // 2. Fetch userType from tenant owner
      const { data: ownerProfile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('tenant_id', invitation.tenant_id)
        .eq('role', 'owner')
        .limit(1)
        .single();
      
      const userType = ownerProfile?.user_type || 'broker';

      // 3. Upsert Profile
      const { error: profileError } = await supabase.from('profiles').upsert({
        auth_user_id: user.id,
        tenant_id: invitation.tenant_id,
        full_name: formData.fullName,
        role: invitation.role || 'staff',
        user_type: userType,
        business_model_selected: true,
        onboarded: true
      }, { onConflict: 'auth_user_id' });
      if (profileError) throw profileError;

      // 4. Update Invitation
      await supabase
        .from('team_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

      toast.success('Pendaftaran berhasil! Bergabung dengan tim.');
      
      const rolePath = userType === 'rpa' ? 'rpa-buyer' : userType;
      navigate(`/${rolePath}/beranda`);
    } catch (err) {
      toast.error(err.message || 'Gagal membuat akun');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });
      if (signInError) throw signInError;

      // 2. Fetch userType
      const { data: ownerProfile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('tenant_id', invitation.tenant_id)
        .eq('role', 'owner')
        .limit(1)
        .single();
      
      const userType = ownerProfile?.user_type || 'broker';

      // 3. Update current user Profile with new tenant_id and role
      const { data: { user } } = await supabase.auth.getUser();
      const { error: profileError } = await supabase.from('profiles').update({
        tenant_id: invitation.tenant_id,
        role: invitation.role || 'staff',
        user_type: userType,
        business_model_selected: true,
        onboarded: true
      }).eq('auth_user_id', user.id);
      if (profileError) throw profileError;

      // 4. Update Invitation
      await supabase
        .from('team_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

      toast.success('Berhasil bergabung dengan tim!');
      
      const rolePath = userType === 'rpa' ? 'rpa-buyer' : userType;
      navigate(`/${rolePath}/beranda`);
    } catch (err) {
      toast.error('Gagal masuk. Periksa kembali password Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06090F] flex flex-col items-center justify-center p-6 sm:p-8">
      {/* Input View */}
      {view === 'input' && (
        <div className="bg-[#0C1319] border border-white/8 rounded-2xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-300">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-[#10B981]/10 rounded-2xl flex items-center justify-center border border-[#10B981]/20">
              <UserPlus className="text-[#10B981]" size={32} />
            </div>
          </div>

          <div className="text-center mb-10">
            <h1 className="text-[#F1F5F9] text-2xl font-bold mb-2">Masukkan Kode</h1>
            <p className="text-[#4B6478] text-sm">Minta kode dari owner tim yang mengundangmu</p>
          </div>

          <form onSubmit={verifyCode} className="space-y-6">
            <Input 
              placeholder="CONTOH: A3K9FZ"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase().slice(0, 6))}
              className="h-16 text-center text-3xl font-bold tracking-[0.3em] uppercase bg-[#111C24] border-white/10 text-white rounded-xl focus:ring-[#10B981]/20 focus:border-[#10B981]/50"
            />
            
            <Button 
              type="submit"
              disabled={loading || inviteCode.length !== 6}
              className="w-full h-14 bg-[#10B981] hover:bg-[#34D399] text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Verifikasi Kode"}
            </Button>
          </form>

          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="w-full mt-6 text-[#4B6478] hover:text-[#F1F5F9]"
          >
            Kembali ke Beranda
          </Button>
        </div>
      )}

      {/* Choice View */}
      {view === 'choice' && (
        <div className="bg-[#0C1319] border border-white/8 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
          <div className="flex justify-center mb-8">
            <div className="w-12 h-12 bg-[#10B981] rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-2xl">🐔</span>
            </div>
          </div>

          <div className="text-center mb-10">
            <p className="text-[#4B6478] text-sm uppercase tracking-widest font-bold mb-2">Undangan Tim</p>
            <h1 className="text-[#F1F5F9] text-xl font-medium mb-1">Berhasil Verifikasi! Bergabung ke</h1>
            <h2 className="text-[#10B981] text-3xl font-extrabold tracking-tight">
              {invitation.tenants?.business_name}
            </h2>
            <div className="flex justify-center mt-3">
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-emerald-500/20">
                {invitation.role || 'Staff'}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <Button 
              onClick={() => setView('register')}
              className="w-full h-14 bg-[#10B981] hover:bg-[#34D399] text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-all"
            >
              <UserPlus size={20} /> Buat Akun Baru
            </Button>
            <Button 
              onClick={() => setView('login')}
              variant="outline"
              className="w-full h-14 bg-transparent border-white/10 hover:bg-white/5 text-[#F1F5F9] font-bold rounded-xl flex items-center justify-center gap-3 transition-all"
            >
              <LogIn size={20} /> Masuk dengan Akun yang Ada
            </Button>
          </div>
          
          <Button 
            variant="ghost" 
            onClick={() => setView('input')}
            className="w-full mt-6 text-[#4B6478] hover:text-[#F1F5F9]"
          >
            Bukan tim ini? Gunakan kode lain
          </Button>
        </div>
      )}

      {/* Register View */}
      {view === 'register' && (
        <div className="bg-[#0C1319] border border-white/8 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in fade-in slide-in-from-right duration-300">
          <button 
            onClick={() => setView('choice')}
            className="flex items-center gap-2 text-[#4B6478] hover:text-[#F1F5F9] mb-8 transition-colors"
          >
            <ArrowLeft size={16} /> <span className="text-sm font-medium">Batal</span>
          </button>

          <h2 className="text-2xl font-bold text-[#F1F5F9] mb-2 font-display">Lengkapi Akun</h2>
          <p className="text-[#4B6478] text-sm mb-8 leading-relaxed">
            Hanya butuh beberapa detik untuk mulai berkolaborasi dengan tim <span className="text-emerald-400 font-bold">{invitation.tenants?.business_name}</span>.
          </p>

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest font-bold text-[#4B6478] ml-1">Email</Label>
              <div className="relative">
                <Input 
                  required
                  type="email"
                  placeholder="nama@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="h-12 bg-[#111C24] border-white/10 text-white pl-10 focus:ring-emerald-500/20"
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest font-bold text-[#4B6478] ml-1">Nama Lengkap</Label>
              <Input 
                required
                placeholder="Budi Santoso"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                className="h-12 bg-[#111C24] border-white/10 text-white focus:ring-emerald-500/20"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest font-bold text-[#4B6478] ml-1">Password Baru</Label>
              <Input 
                type="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="h-12 bg-[#111C24] border-white/10 text-white focus:ring-emerald-500/20"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest font-bold text-[#4B6478] ml-1">Konfirmasi Password</Label>
              <Input 
                type="password"
                required
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className="h-12 bg-[#111C24] border-white/10 text-white focus:ring-emerald-500/20"
              />
            </div>

            <Button 
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-[#10B981] hover:bg-[#34D399] text-white font-bold rounded-xl mt-4 shadow-lg shadow-emerald-500/20"
            >
              {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <ShieldCheck className="mr-2" size={20} />}
              {isSubmitting ? "Memproses..." : "Terima Undangan"}
            </Button>
          </form>
        </div>
      )}

      {/* Login View */}
      {view === 'login' && (
        <div className="bg-[#0C1319] border border-white/8 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in fade-in slide-in-from-right duration-300">
          <button 
            onClick={() => setView('choice')}
            className="flex items-center gap-2 text-[#4B6478] hover:text-[#F1F5F9] mb-8 transition-colors"
          >
            <ArrowLeft size={16} /> <span className="text-sm font-medium">Batal</span>
          </button>

          <h2 className="text-2xl font-bold text-[#F1F5F9] mb-2 font-display">Masuk Akun</h2>
          <p className="text-[#4B6478] text-sm mb-8 leading-relaxed">
            Gunakan akun Anda untuk masuk dan menerima akses tim.
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest font-bold text-[#4B6478] ml-1">Email</Label>
              <div className="relative">
                <Input 
                  required
                  type="email"
                  placeholder="nama@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="h-12 bg-[#111C24] border-white/10 text-white pl-10 focus:ring-emerald-500/20"
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest font-bold text-[#4B6478] ml-1">Password</Label>
              <Input 
                type="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="h-12 bg-[#111C24] border-white/10 text-white focus:ring-emerald-500/20"
              />
            </div>

            <Button 
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-[#10B981] hover:bg-[#34D399] text-white font-bold rounded-xl mt-4 shadow-lg shadow-emerald-500/20"
            >
              {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <LogIn className="mr-2" size={20} />}
              {isSubmitting ? "Memverifikasi..." : "Masuk & Terima"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
