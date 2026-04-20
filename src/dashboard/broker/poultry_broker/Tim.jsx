import React, { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/hooks/useAuth';
import { getSubscriptionStatus } from '@/lib/subscriptionUtils';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter 
} from '@/components/ui/sheet';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Trash2, X, Plus, UserPlus, Users, Clock, Copy, Pencil, Save, AlertCircle, Menu } from 'lucide-react';
import { formatDistanceToNow, differenceInDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { TimSkeleton } from '@/components/ui/BrokerPageSkeleton'

const ROLE_BADGE_MAP = {
  owner: { label: 'Owner', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  staff: { label: 'Staff', class: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  view_only: { label: 'View Only', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  supir: { label: 'Supir', class: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
};

export default function Tim() {
  const { profile, tenant: authTenant } = useAuth();
  const sub = getSubscriptionStatus(authTenant);
  const queryClient = useQueryClient();
  const [isInviteSheetOpen, setIsInviteSheetOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    business_name: '',
    phone: '',
    location: ''
  });
  
  const isOwner = profile?.role === 'owner' || profile?.role === 'superadmin';
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const { setSidebarOpen } = useOutletContext() || {};

  // --- QUERIES ---
  const { data: tenant, isLoading: loadingTenant } = useQuery({
    queryKey: ['tenants', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return null;
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', profile.tenant_id)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.tenant_id,
  });

  // Sync form when tenant data loads or edit mode starts
  React.useEffect(() => {
    if (tenant) {
      setProfileForm({
        business_name: tenant.business_name || '',
        phone: tenant.phone || '',
        location: tenant.location || ''
      });
      
      // Auto-edit if name is missing (new user)
      if (!tenant.business_name && isOwner) {
        setIsEditingProfile(true);
      }
    }
  }, [tenant, isOwner]);

  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ['team_members', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];
      const [{ data: profileMembers, error }, { data: membershipMembers }] = await Promise.all([
        supabase.from('profiles').select('*').eq('tenant_id', profile.tenant_id),
        supabase.from('tenant_memberships').select('*').eq('tenant_id', profile.tenant_id),
      ]);
      if (error) throw error;
      const combined = [...(profileMembers || [])];
      const membershipOnly = [];
      for (const m of (membershipMembers || [])) {
        if (!combined.some(p => p.auth_user_id === m.auth_user_id)) {
          combined.push(m);
          membershipOnly.push(m.auth_user_id);
        }
      }
      if (membershipOnly.length > 0) {
        const { data: nameData } = await supabase
          .from('profiles').select('auth_user_id, full_name, avatar_url')
          .in('auth_user_id', membershipOnly);
        for (const m of combined) {
          if (!m.full_name) {
            const np = nameData?.find(n => n.auth_user_id === m.auth_user_id);
            if (np) { m.full_name = np.full_name; m.avatar_url = np.avatar_url; }
          }
        }
      }
      return combined.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
    },
    enabled: !!profile?.tenant_id,
  });

  const { data: invitations = [], isLoading: loadingInvitations } = useQuery({
    queryKey: ['team_invitations', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];
      const { data, error } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.tenant_id,
  });

  const [inviteCode, setInviteCode] = useState(null);
  const [showCode, setShowCode] = useState(false);

  // --- MUTATIONS ---
  const inviteMutation = useMutation({
    mutationFn: async (payload) => {
      // Generate kode 6 karakter uppercase alphanumeric
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const { data, error } = await supabase
        .from('team_invitations')
        .insert([{
          tenant_id: profile.tenant_id,
          invited_by: profile.profile_id ?? profile.id,
          token: code,
          role: payload.role,
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }])
        .select()
        .single();
        
      if (error) throw error;
      return { ...data, code };
    },
    onSuccess: (data) => {
      setInviteCode(data.code);
      setShowCode(true);
      toast.success('Kode undangan berhasil dibuat');
      queryClient.invalidateQueries(['team_invitations']);
    },
    onError: (error) => {
      toast.error('Gagal membuat kode undangan', { description: error.message });
    }
  });

  const updateTenantMutation = useMutation({
    mutationFn: async (payload) => {
      const { error } = await supabase
        .from('tenants')
        .update(payload)
        .eq('id', profile.tenant_id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Profil bisnis berhasil disimpan');
      queryClient.invalidateQueries(['tenants']);
      setIsEditingProfile(false);
    },
    onError: (error) => {
      toast.error('Gagal menyimpan profil', { description: error.message });
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (member) => {
      const authUserId = member.auth_user_id;
      await supabase.from('tenant_memberships').delete()
        .eq('auth_user_id', authUserId).eq('tenant_id', profile.tenant_id);
      await supabase.from('profiles').delete()
        .eq('auth_user_id', authUserId).eq('tenant_id', profile.tenant_id);
    },
    onSuccess: () => {
      toast.success('Anggota berhasil dihapus');
      queryClient.invalidateQueries(['team_members']);
    },
    onError: (error) => {
      toast.error('Gagal menghapus anggota', { description: error.message });
    }
  });

  const cancelInviteMutation = useMutation({
    mutationFn: async (inviteId) => {
      // Set status to expired instead of deleting row completely
      const { error } = await supabase
        .from('team_invitations')
        .update({ status: 'expired' })
        .eq('id', inviteId)
        .eq('tenant_id', profile.tenant_id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Undangan dibatalkan');
      queryClient.invalidateQueries(['team_invitations']);
    },
    onError: (error) => {
      toast.error('Gagal membatalkan undangan', { description: error.message });
    }
  });

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  if (loadingTenant || loadingMembers) return <TimSkeleton />

  const isStarter = sub.plan === 'starter' && sub.status !== 'trial'
  const memberLimit = isStarter ? 1 : sub.plan === 'business' ? Infinity : 3

  const handleInviteClick = () => {
    const totalMembers = members.length + invitations.length;
    if (isStarter) {
      toast.error('Fitur Tim tidak tersedia di Starter', { description: 'Upgrade ke Pro untuk mengundang hingga 3 anggota tim.' });
      return;
    }
    if (sub.plan !== 'business' && totalMembers >= 3) {
      toast.error('Kapasitas Tim Penuh', { description: 'Plan Pro dibatasi maksimal 3 anggota. Upgrade ke Business untuk anggota unlimited!' });
      return;
    }
    setIsInviteSheetOpen(true);
  };

  return (
    <div className={cn("max-w-5xl mx-auto", isDesktop ? "p-8 space-y-8 pb-32" : "space-y-5 pb-24")}>
      {/* Mobile sticky header */}
      {!isDesktop && (
        <header className="h-14 px-4 flex items-center gap-3 justify-between sticky top-0 bg-[#06090F]/80 backdrop-blur-md z-30 border-b border-white/5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen?.(true)}
              className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0 active:scale-90 transition-transform"
            >
              <Menu size={16} className="text-[#94A3B8]" />
            </button>
            <h1 className="font-display text-[15px] font-black text-white uppercase tracking-tight">Tim & Akses</h1>
          </div>
          {isOwner && (
            <button
              onClick={handleInviteClick}
              className="h-9 px-3 text-[11px] font-black bg-em-500 hover:bg-em-600 text-white rounded-xl flex items-center gap-1.5 uppercase tracking-widest transition-all active:scale-95"
            >
              <UserPlus size={13} /> Undang
            </button>
          )}
        </header>
      )}

      {/* Desktop Header */}
      {isDesktop && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-tx-1">Tim & Akses</h1>
            <p className="text-tx-3 mt-1 text-sm">
              {members.length} anggota aktif {invitations.length > 0 && `• ${invitations.length} undangan tertunda`}
              {sub.plan !== 'business' && (
                <span className={`ml-2 font-bold ${isStarter ? 'text-red-400' : 'text-amber-500'}`}>
                  {isStarter
                    ? '(Starter: hanya owner)'
                    : `(Kapasitas Plan: ${members.length + invitations.length} / 3)`}
                </span>
              )}
            </p>
          </div>
          <Button
            onClick={handleInviteClick}
            className="bg-em-500 hover:bg-em-600 text-white font-semibold rounded-xl"
          >
            <UserPlus size={18} className="mr-2" />
            Undang Anggota
          </Button>
        </div>
      )}

      {/* Mobile subtitle */}
      {!isDesktop && (
        <p className="text-tx-3 text-xs px-4 pt-1">
          {members.length} anggota aktif {invitations.length > 0 && `• ${invitations.length} undangan tertunda`}
          {sub.plan !== 'business' && (
            <span className={`ml-2 font-bold ${isStarter ? 'text-red-400' : 'text-amber-500'}`}>
              {isStarter ? '(Starter: hanya owner)' : `(${members.length + invitations.length}/3)`}
            </span>
          )}
        </p>
      )}

      {isStarter && (
        <div className={cn("flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/20", isDesktop ? "" : "mx-4")}>
          <div className="flex items-center gap-2.5">
            <AlertCircle size={14} className="text-red-400 shrink-0" />
            <p className="text-[12px] font-bold text-red-400">
              Plan Starter hanya untuk 1 akun (owner). Upgrade ke Pro untuk mengundang tim.
            </p>
          </div>
          <Link to="/upgrade" className="shrink-0 text-[10px] font-black text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors whitespace-nowrap">
            Upgrade
          </Link>
        </div>
      )}

      <div className={cn(isDesktop ? "" : "px-4")}>
      {!isOwner && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-amber-500 text-sm">
          Anda masuk sebagai <strong>{ROLE_BADGE_MAP[profile?.role]?.label || profile?.role}</strong>. Hanya owner yang dapat mengelola undangan dan akses.
        </div>
      )}

      {/* Section: Profil Bisnis */}
      {isOwner && !tenant?.business_name && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
          <AlertCircle size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-amber-500 text-sm font-medium">
            Lengkapi profil bisnis kamu agar semua fitur dapat digunakan.
          </p>
        </div>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-lg text-tx-2 flex items-center gap-2">
            <Badge variant="outline" className="bg-em-500/10 text-em-400 border-em-500/20 p-1 rounded-md">
              <Users size={16} />
            </Badge>
            Profil Bisnis
          </h2>
          {isOwner && !isEditingProfile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingProfile(true)}
              className={cn("text-tx-3 hover:text-tx-1 hover:bg-white/5 rounded-lg px-2", isDesktop ? "h-8" : "h-10")}
            >
              <Pencil size={14} className="mr-2" />
              Edit Profil
            </Button>
          )}
        </div>

        <div className={cn("bg-[#0C1319] rounded-2xl border border-white/8 shadow-sm transition-all duration-300", isDesktop ? "p-6" : "p-4")}>
          {loadingTenant ? (
            <div className="py-8 flex justify-center text-tx-3"><Loader2 className="animate-spin" /></div>
          ) : isEditingProfile ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-[#4B6478]">Nama Bisnis</Label>
                  <Input 
                    value={profileForm.business_name}
                    onChange={(e) => setProfileForm({...profileForm, business_name: e.target.value})}
                    placeholder="Contoh: UD Ayam Jaya"
                    className="bg-[#111C24] border-white/10 h-12 rounded-xl text-[16px] focus:border-em-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-[#4B6478]">No HP Bisnis</Label>
                  <PhoneInput 
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                    placeholder="0812..."
                    className="bg-[#111C24] border-white/10 h-12 rounded-xl text-[16px] focus:border-em-500/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-black uppercase tracking-widest text-[#4B6478]">Lokasi / Kota</Label>
                <Input 
                  value={profileForm.location}
                  onChange={(e) => setProfileForm({...profileForm, location: e.target.value})}
                  placeholder="Contoh: Boyolali, Jawa Tengah"
                  className="bg-[#111C24] border-white/10 h-12 rounded-xl text-[16px] focus:border-em-500/50"
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button 
                  onClick={() => updateTenantMutation.mutate(profileForm)}
                  disabled={updateTenantMutation.isPending || !profileForm.business_name}
                  className="bg-em-500 hover:bg-em-600 text-white font-bold h-11 px-6 rounded-xl flex-1 md:flex-none"
                >
                  {updateTenantMutation.isPending ? <Loader2 size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                  Simpan Perubahan
                </Button>
                <Button 
                  variant="ghost"
                  onClick={() => {
                    setIsEditingProfile(false);
                    // Reset form to latest data
                    if (tenant) {
                      setProfileForm({
                        business_name: tenant.business_name || '',
                        phone: tenant.phone || '',
                        location: tenant.location || ''
                      });
                    }
                  }}
                  disabled={updateTenantMutation.isPending}
                  className="text-tx-3 hover:text-tx-1 h-11 px-6 rounded-xl"
                >
                  Batal
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-1">
                <p className="text-[11px] font-black uppercase tracking-widest text-[#4B6478]">Nama Bisnis</p>
                <p className="text-[16px] font-semibold text-tx-1">{tenant?.business_name || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-black uppercase tracking-widest text-[#4B6478]">No HP Bisnis</p>
                <p className="text-[16px] font-semibold text-tx-1">{tenant?.phone || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-black uppercase tracking-widest text-[#4B6478]">Lokasi / Kota</p>
                <p className="text-[16px] font-semibold text-tx-1">{tenant?.location || '-'}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Section: Anggota Aktif */}
      <section className="space-y-4">
        <h2 className="font-display font-semibold text-lg text-tx-2 flex items-center gap-2">
          <Users size={18} className="text-em-400" />
          Anggota Aktif
        </h2>
        
        <div className="bg-bg-2 border border-border-def rounded-2xl overflow-hidden shadow-sm">
          {loadingMembers ? (
            <div className="p-12 flex justify-center text-tx-3"><Loader2 className="animate-spin" /></div>
          ) : members.length === 0 ? (
            <div className="p-8 text-center text-tx-3 italic rounded-2xl">Belum ada anggota lain.</div>
          ) : (
            <div className="divide-y divide-border-sub">
              {members.map(member => (
                <div key={member.id} className="p-4 md:px-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-bg-3 border border-border-def flex items-center justify-center font-display font-bold text-tx-2 text-sm flex-shrink-0">
                      {getInitials(member.full_name || member.email)}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-tx-1">{member.full_name || 'User Baru'}</span>
                      <span className="text-sm text-tx-3">{member.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className={ROLE_BADGE_MAP[member.role]?.class || 'bg-gray-500/10 text-gray-400'}>
                      {ROLE_BADGE_MAP[member.role]?.label || member.role}
                    </Badge>
                    {isOwner && member.id !== profile.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-tx-3 hover:text-red hover:bg-red/10 rounded-xl transition-colors"
                        onClick={() => {
                          if (confirm(`Hapus ${member.full_name || member.email} dari tim?`)) {
                            removeMemberMutation.mutate(member);
                          }
                        }}
                        disabled={removeMemberMutation.isPending}
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Section: Undangan Tertunda */}
      <section className="space-y-4">
        <h2 className="font-display font-semibold text-lg text-tx-2 flex items-center gap-2">
          <Clock size={18} className="text-gold" />
          Undangan Tertunda
        </h2>
        
        <div className="bg-bg-2 border border-border-def rounded-2xl overflow-hidden shadow-sm">
          {loadingInvitations ? (
            <div className="p-12 flex justify-center text-tx-3"><Loader2 className="animate-spin" /></div>
          ) : invitations.length === 0 ? (
            <div className="p-8 text-center text-tx-3 text-sm rounded-2xl">Tidak ada undangan tertunda.</div>
          ) : (
            <div className="divide-y divide-border-sub">
              {invitations.map(invite => {
                const daysLeft = differenceInDays(new Date(invite.expires_at), new Date());
                
                return (
                  <div key={invite.id} className="p-4 md:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-bg-3 border border-border-def flex items-center justify-center text-em-400 flex-shrink-0 shadow-sm">
                        <UserPlus size={20} />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-display text-lg font-bold text-[#10B981] tracking-widest">
                            {invite.token}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(invite.token);
                              toast.success('Kode disalin');
                            }}
                            className="text-[#4B6478] hover:text-[#10B981] cursor-pointer transition-colors"
                            title="Salin Kode"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-[#4B6478]">
                            Belum digunakan · Sisa {daysLeft > 0 ? `${daysLeft} hari` : 'hari ini'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
                      <Badge variant="outline" className={ROLE_BADGE_MAP[invite.role]?.class || 'bg-gray-500/10 text-gray-400'}>
                        {ROLE_BADGE_MAP[invite.role]?.label || invite.role}
                      </Badge>
                      {isOwner && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-tx-3 border-border-def hover:text-tx-1 hover:bg-bg-3 rounded-xl transition-colors shrink-0"
                          onClick={() => {
                            if (confirm(`Batalkan undangan kode ${invite.token}?`)) {
                              cancelInviteMutation.mutate(invite.id);
                            }
                          }}
                          disabled={cancelInviteMutation.isPending}
                        >
                          <X size={16} className="mr-1 md:mr-2" />
                          <span className="hidden md:inline">Batalkan</span>
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      </div>

      <InviteSheet
        isOpen={isInviteSheetOpen}
        onClose={() => {
          setIsInviteSheetOpen(false);
          setShowCode(false);
          setInviteCode(null);
        }}
        onSubmit={(data) => inviteMutation.mutate(data)}
        isPending={inviteMutation.isPending}
        showCode={showCode}
        inviteCode={inviteCode}
      />

    </div>
  );
}

function InviteSheet({ isOpen, onClose, onSubmit, isPending, showCode, inviteCode }) {
  const [role, setRole] = useState('staff');
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ role });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteCode);
    toast.success('Kode disalin');
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <SheetContent 
        side={isDesktop ? 'right' : 'bottom'} 
        className="bg-[#0C1319] border-l border-border/10 flex flex-col"
        style={{
          width: isDesktop ? '520px' : '100%',
          maxWidth: '100vw',
          maxHeight: isDesktop ? '100vh' : '90dvh',
          padding: 0,
          borderRadius: isDesktop ? '0' : '24px 24px 0 0',
        }}
      >
        <SheetHeader className={cn("text-left pb-0", isDesktop ? "p-8" : "p-5")}>
          <SheetTitle className="font-display text-xl font-bold text-tx-1">Undang Anggota</SheetTitle>
          <SheetDescription className="text-tx-3 text-sm">
            {showCode
              ? "Kode berhasil dibuat. Bagikan ke anggota yang ingin diundang."
              : "Generate kode undangan untuk anggota baru bergabung ke bisnis Anda."}
          </SheetDescription>
        </SheetHeader>

        <div className={cn("flex-1 flex flex-col gap-6 pt-4", isDesktop ? "p-8" : "p-5")}>
          {!showCode ? (
            <form onSubmit={handleSubmit} className="space-y-6 flex-1 flex flex-col">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-tx-3 uppercase tracking-wider">Level Akses (Role) <span className="text-red">*</span></Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="w-full bg-bg-2 border-border-def h-12 rounded-xl text-tx-1 focus-visible:ring-1 focus-visible:ring-em-400">
                    <SelectValue placeholder="Pilih Role" />
                  </SelectTrigger>
                  <SelectContent className="bg-bg-1 border border-border-def rounded-xl shadow-xl">
                    <SelectItem value="staff" className="focus:bg-bg-2 cursor-pointer py-3 rounded-lg mx-1 my-0.5">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-tx-1">Staff</span>
                        <span className="text-[11px] text-tx-3">Bisa input transaksi & akses fitur, tidak bisa hapus</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="view_only" className="focus:bg-bg-2 cursor-pointer py-3 rounded-lg mx-1 my-0.5">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-tx-1">View Only</span>
                        <span className="text-[11px] text-tx-3">Hanya lihat laporan & data, tanpa akses edit</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="supir" className="focus:bg-bg-2 cursor-pointer py-3 rounded-lg mx-1 my-0.5">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-tx-1">Supir</span>
                        <span className="text-[11px] text-tx-3">Akses terbatas: Hanya melihat & update status pengiriman</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-auto pt-6 border-t border-border-sub">
                <Button
                  type="submit"
                  className={cn("w-full bg-em-500 hover:bg-em-600 text-white font-bold rounded-xl transition-all", isDesktop ? "h-12 text-[15px]" : "h-11 text-[14px]")}
                  disabled={isPending}
                >
                  {isPending ? <Loader2 className="animate-spin mr-2" /> : <Plus size={18} className="mr-2" />}
                  {isPending ? "Generating..." : "Generate Kode Undangan"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-300">
              <div className="w-full bg-[#0C1319] border border-[#10B981]/30 rounded-2xl p-8 text-center space-y-6 shadow-xl shadow-emerald-500/5">
                <h3 className="text-tx-3 text-xs font-bold uppercase tracking-[0.2em]">Kode Undangan Tim</h3>
                
                <div className="font-display text-4xl font-black text-[#10B981] tracking-[0.4em] py-6 bg-[#10B981]/5 rounded-2xl border border-[#10B981]/10">
                  {inviteCode}
                </div>

                <div className="space-y-1">
                  <p className="text-[#4B6478] text-xs font-medium">Berlaku 7 hari · Hanya 1x pakai</p>
                </div>

                <Button
                  onClick={copyToClipboard}
                  className={cn("w-full bg-[#10B981] hover:bg-em-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20", isDesktop ? "h-12" : "h-11")}
                >
                  <Copy size={16} className="mr-2" />
                  Salin Kode
                </Button>
              </div>

              <div className="space-y-4 px-4 text-center">
                <p className="text-[#94A3B8] text-sm leading-relaxed">
                  Bagikan kode ini via <strong>WhatsApp atau chat</strong> ke anggota yang ingin diundang.
                </p>
                <div className="p-3 bg-bg-2 border border-border-sub rounded-xl text-xs text-tx-3 text-left">
                  <p>💡 Calon staff dapat mendaftar sendiri menggunakan kode ini tanpa perlu input data bisnis.</p>
                </div>
              </div>

              <Button 
                variant="ghost" 
                onClick={onClose}
                className="text-tx-3 hover:text-tx-1"
              >
                Selesai
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
