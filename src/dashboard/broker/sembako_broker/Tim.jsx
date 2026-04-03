import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/hooks/useAuth';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter 
} from '@/components/ui/sheet';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Trash2, X, Plus, UserPlus, Users, Clock, Copy, Pencil, Save, AlertCircle } from 'lucide-react';
import { formatDistanceToNow, differenceInDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { SembakoMobileBar } from './components/SembakoNavigation';

const ROLE_BADGE_MAP = {
  owner: { label: 'Owner', class: 'bg-[#EA580C]/10 text-[#EA580C] border-[#EA580C]/20' },
  staff: { label: 'Staff', class: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  view_only: { label: 'View Only', class: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  supir: { label: 'Supir', class: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
};

export default function SembakoTim() {
  const { profile } = useAuth();
  const { setSidebarOpen } = useOutletContext();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const queryClient = useQueryClient();
  const [isInviteSheetOpen, setIsInviteSheetOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    business_name: '',
    phone: '',
    location: ''
  });
  
  const isOwner = profile?.role === 'owner';

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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .eq('is_active', true)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      return data;
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
          invited_by: profile.id,
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
    mutationFn: async (memberId) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', memberId)
        .eq('tenant_id', profile.tenant_id);
      if (error) throw error;
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

  return (
    <div className="bg-[#06090F] min-h-screen text-left">
      {!isDesktop && <SembakoMobileBar onHamburger={() => setSidebarOpen(true)} title="Tim & Akses" />}

      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 pb-32">
        {/* Header Desktop */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className={cn(!isDesktop && "hidden")}>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-white uppercase tracking-tight">Tim & Akses</h1>
            <p className="text-[#4B6478] text-sm font-bold uppercase tracking-widest mt-1">
              {members.length} anggota aktif {invitations.length > 0 && `• ${invitations.length} undangan tertunda`}
            </p>
          </div>
          {isOwner && (
            <Button 
              onClick={() => setIsInviteSheetOpen(true)}
              className="bg-[#EA580C] hover:bg-[#D44E0A] text-white font-black text-[12px] uppercase tracking-widest rounded-xl h-12 px-6 shadow-lg shadow-orange-950/20 active:scale-95 transition-all w-full md:w-auto"
            >
              <UserPlus size={18} className="mr-2" />
              Undang Anggota
            </Button>
          )}
        </div>

        {!isOwner && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-amber-500 text-sm font-bold uppercase tracking-wide">
            Anda masuk sebagai <strong>{ROLE_BADGE_MAP[profile?.role]?.label || profile?.role}</strong>. Hanya owner yang dapat mengelola undangan.
          </div>
        )}

        {/* Section: Profil Bisnis */}
        {isOwner && !tenant?.business_name && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
            <AlertCircle size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-amber-500 text-sm font-bold uppercase tracking-tight">
              Lengkapi profil bisnis kamu agar semua fitur dapat digunakan.
            </p>
          </div>
        )}

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-black text-white text-lg tracking-tight uppercase flex items-center gap-2">
              <Badge variant="outline" className="bg-[#EA580C]/10 text-[#EA580C] border-[#EA580C]/20 p-1.5 rounded-xl">
                <Users size={16} />
              </Badge>
              Profil Bisnis
            </h2>
            {isOwner && !isEditingProfile && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsEditingProfile(true)}
                className="text-[#4B6478] hover:text-white hover:bg-white/5 rounded-xl h-9 px-3 font-black text-[10px] uppercase tracking-widest"
              >
                <Pencil size={14} className="mr-2" />
                Edit Profil
              </Button>
            )}
          </div>

          <div className="bg-[#111C24] rounded-[28px] border border-white/5 p-6 shadow-xl transition-all duration-300">
            {loadingTenant ? (
              <div className="py-8 flex justify-center text-[#4B6478]"><Loader2 className="animate-spin" /></div>
            ) : isEditingProfile ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4B6478] ml-1">Nama Bisnis</Label>
                    <Input 
                      value={profileForm.business_name}
                      onChange={(e) => setProfileForm({...profileForm, business_name: e.target.value})}
                      placeholder="Contoh: TOKO SEMBAKO JAYA"
                      className="bg-[#0C1319] border-white/10 h-14 rounded-2xl text-sm font-bold focus:border-[#EA580C]/50 uppercase tracking-tight"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4B6478] ml-1">No HP Bisnis</Label>
                    <Input 
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                      placeholder="0812..."
                      className="bg-[#0C1319] border-white/10 h-14 rounded-2xl text-sm font-bold focus:border-[#EA580C]/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4B6478] ml-1">Lokasi / Kota</Label>
                  <Input 
                    value={profileForm.location}
                    onChange={(e) => setProfileForm({...profileForm, location: e.target.value})}
                    placeholder="Contoh: Boyolali, Jawa Tengah"
                    className="bg-[#0C1319] border-white/10 h-14 rounded-2xl text-sm font-bold focus:border-[#EA580C]/50 uppercase tracking-tight"
                  />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Button 
                    onClick={() => updateTenantMutation.mutate(profileForm)}
                    disabled={updateTenantMutation.isPending || !profileForm.business_name}
                    className="bg-[#10B981] hover:bg-emerald-600 text-white font-black text-[11px] uppercase tracking-widest h-12 px-8 rounded-xl flex-1 md:flex-none shadow-lg shadow-emerald-500/10"
                  >
                    {updateTenantMutation.isPending ? <Loader2 size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                    Simpan Perubahan
                  </Button>
                  <Button 
                    variant="ghost"
                    onClick={() => {
                      setIsEditingProfile(false);
                      if (tenant) {
                        setProfileForm({
                          business_name: tenant.business_name || '',
                          phone: tenant.phone || '',
                          location: tenant.location || ''
                        });
                      }
                    }}
                    disabled={updateTenantMutation.isPending}
                    className="text-[#4B6478] hover:text-white font-black text-[11px] uppercase tracking-widest h-12 px-6 rounded-xl"
                  >
                    Batal
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#4B6478]">Nama Bisnis</p>
                  <p className="text-[15px] font-black text-white uppercase tracking-tight">{tenant?.business_name || '-'}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#4B6478]">No HP Bisnis</p>
                  <p className="text-[15px] font-black text-white">{tenant?.phone || '-'}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#4B6478]">Lokasi / Kota</p>
                  <p className="text-[15px] font-black text-white uppercase tracking-tight">{tenant?.location || '-'}</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Section: Anggota Aktif */}
        <section className="space-y-4">
          <h2 className="font-display font-black text-white text-lg tracking-tight uppercase flex items-center gap-2">
             <Badge variant="outline" className="bg-[#EA580C]/10 text-[#EA580C] border-[#EA580C]/20 p-1.5 rounded-xl">
              <Users size={16} />
            </Badge>
            Anggota Aktif
          </h2>
          
          <div className="bg-[#111C24] border border-white/5 rounded-[28px] overflow-hidden shadow-xl">
            {loadingMembers ? (
              <div className="p-12 flex justify-center text-[#4B6478]"><Loader2 className="animate-spin" /></div>
            ) : members.length === 0 ? (
              <div className="p-12 text-center text-[#4B6478] font-bold uppercase text-xs tracking-widest italic">Belum ada anggota lain.</div>
            ) : (
              <div className="divide-y divide-white/5">
                {members.map(member => (
                  <div key={member.id} className="p-4 md:px-7 md:py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-[18px] bg-[#EA580C]/10 border border-[#EA580C]/20 flex items-center justify-center font-display font-black text-[#EA580C] text-base flex-shrink-0 shadow-inner group-hover:bg-[#EA580C]/20 transition-all">
                        {getInitials(member.full_name || member.email)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-white uppercase tracking-tight leading-none">{member.full_name || 'User Baru'}</span>
                        <span className="text-[11px] text-[#4B6478] font-bold mt-1.5 lowercase">{member.email}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className={cn("border-none h-6 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest", ROLE_BADGE_MAP[member.role]?.class || 'bg-gray-500/10 text-gray-400')}>
                        {ROLE_BADGE_MAP[member.role]?.label || member.role}
                      </Badge>
                      {isOwner && member.id !== profile.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-[#4B6478] hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all h-9 w-9"
                          onClick={() => {
                            if (confirm(`Hapus ${member.full_name || member.email} dari tim?`)) {
                              removeMemberMutation.mutate(member.id);
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
          <h2 className="font-display font-black text-white text-lg tracking-tight uppercase flex items-center gap-2">
             <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 p-1.5 rounded-xl">
              <Clock size={16} />
            </Badge>
            Undangan Tertunda
          </h2>
          
          <div className="bg-[#111C24] border border-white/5 rounded-[28px] overflow-hidden shadow-xl">
            {loadingInvitations ? (
              <div className="p-12 flex justify-center text-[#4B6478]"><Loader2 className="animate-spin" /></div>
            ) : invitations.length === 0 ? (
              <div className="p-10 text-center text-[#4B6478] text-[10px] font-black uppercase tracking-widest rounded-2xl italic">Tidak ada undangan tertunda.</div>
            ) : (
              <div className="divide-y divide-white/5">
                {invitations.map(invite => {
                  const daysLeft = differenceInDays(new Date(invite.expires_at), new Date());
                  
                  return (
                    <div key={invite.id} className="p-4 md:px-7 md:py-6 flex flex-col md:flex-row md:items-center justify-between gap-5 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-[20px] bg-[#111C24] border border-white/5 flex items-center justify-center text-[#EA580C] flex-shrink-0 shadow-lg">
                          <UserPlus size={22} />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-3">
                            <span className="font-display text-2xl font-black text-[#EA580C] tracking-[0.3em]">
                              {invite.token}
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(invite.token);
                                toast.success('Kode disalin');
                              }}
                              className="text-[#4B6478] hover:text-[#EA580C] cursor-pointer transition-colors p-2 bg-white/5 rounded-lg active:scale-95"
                              title="Salin Kode"
                            >
                              <Copy size={14} />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] font-black text-[#4B6478] uppercase tracking-wider">
                              Belum digunakan · Sisa {daysLeft > 0 ? `${daysLeft} hari` : 'hari ini'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between md:justify-end gap-5 w-full md:w-auto pt-4 md:pt-0 border-t border-white/5 md:border-none">
                        <Badge variant="outline" className={cn("border-none h-6 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest", ROLE_BADGE_MAP[invite.role]?.class || 'bg-gray-500/10 text-gray-400')}>
                          {ROLE_BADGE_MAP[invite.role]?.label || invite.role}
                        </Badge>
                        {isOwner && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-red-400/5 hover:bg-red-400/10 border-red-400/20 text-red-400 font-black text-[10px] uppercase tracking-widest h-10 px-5 rounded-xl transition-all shrink-0"
                            onClick={() => {
                              if (confirm(`Batalkan undangan kode ${invite.token}?`)) {
                                cancelInviteMutation.mutate(invite.id);
                              }
                            }}
                            disabled={cancelInviteMutation.isPending}
                          >
                            <X size={16} className="mr-2" />
                            Batalkan
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

        {/* Invite Sheet remains consistent but themed */}
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
        className="bg-[#0C1319] border-l border-white/10 flex flex-col p-0 overflow-y-auto"
        style={{
          width: isDesktop ? '520px' : '100%',
          maxWidth: '100vw',
          maxHeight: isDesktop ? '100vh' : '95vh',
          borderRadius: isDesktop ? '0' : '32px 32px 0 0',
        }}
      >
        <SheetHeader className="text-left p-8 pb-0">
          <SheetTitle className="font-display text-2xl font-black text-white uppercase tracking-tight">Undang Anggota</SheetTitle>
          <SheetDescription className="text-[#4B6478] text-sm font-bold uppercase tracking-tight mt-2">
            {showCode 
              ? "Kode berhasil dibuat. Bagikan ke anggota yang ingin diundang."
              : "Generate kode undangan untuk anggota baru bergabung ke bisnis Anda."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 flex flex-col gap-6 p-8 pt-6">
          {!showCode ? (
            <form onSubmit={handleSubmit} className="space-y-8 flex-1 flex flex-col">
              <div className="space-y-3">
                <Label className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.2em] ml-1">Level Akses (Role) <span className="text-red-500">*</span></Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="w-full bg-[#111C24] border-white/10 h-16 rounded-[20px] text-white font-bold focus:ring-[#EA580C]/20 text-lg px-6">
                    <SelectValue placeholder="Pilih Role" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111C24] border border-white/10 rounded-2xl shadow-2xl p-2 z-[9999]">
                    <SelectItem value="staff" className="focus:bg-white/5 cursor-pointer py-4 px-4 rounded-xl my-1 group">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-black text-white uppercase tracking-tight group-hover:text-[#EA580C] transition-colors">Staff</span>
                        <span className="text-[11px] text-[#4B6478] font-bold uppercase tracking-tight group-hover:text-white/40">Bisa input transaksi & akses fitur, tidak bisa hapus data utama</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="view_only" className="focus:bg-white/5 cursor-pointer py-4 px-4 rounded-xl my-1 group">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-black text-white uppercase tracking-tight group-hover:text-[#EA580C] transition-colors">View Only</span>
                        <span className="text-[11px] text-[#4B6478] font-bold uppercase tracking-tight group-hover:text-white/40">Hanya lihat laporan & data tanpa akses edit atau tambah</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="supir" className="focus:bg-white/5 cursor-pointer py-4 px-4 rounded-xl my-1 group">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-black text-white uppercase tracking-tight group-hover:text-[#EA580C] transition-colors">Supir</span>
                        <span className="text-[11px] text-[#4B6478] font-bold uppercase tracking-tight group-hover:text-white/40">Akses terbatas: Hanya melihat & update status pengiriman</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-6 pt-10 border-t border-white/5">
                <Button 
                  type="submit" 
                  className="w-full bg-[#EA580C] hover:bg-[#D44E0A] text-white font-black h-16 rounded-[22px] text-sm uppercase tracking-[0.2em] transition-all shadow-xl shadow-orange-950/20 active:scale-95"
                  disabled={isPending}
                >
                  {isPending ? <Loader2 className="animate-spin mr-2" /> : <Plus size={18} className="mr-2" />}
                  {isPending ? "Generating..." : "Generate Kode Undangan"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center space-y-10 animate-in fade-in zoom-in duration-300 py-6">
              <div className="w-full bg-[#111C24] border border-[#EA580C]/20 rounded-[32px] p-10 text-center space-y-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-[#EA580C] opacity-50" />
                <h3 className="text-[#4B6478] text-[10px] font-black uppercase tracking-[0.3em]">Kode Undangan Sembako</h3>
                
                <div className="font-display text-5xl font-black text-[#EA580C] tracking-[0.3em] py-10 bg-[#EA580C]/5 rounded-3xl border border-[#EA580C]/10 shadow-inner tabular-nums">
                  {inviteCode}
                </div>

                <div className="space-y-1">
                  <p className="text-[#10B981] text-[11px] font-black uppercase tracking-widest">Akses Level: {role.toUpperCase()}</p>
                  <p className="text-[#4B6478] text-[10px] font-bold uppercase tracking-wider mt-2">Berlaku 7 hari · Hanya 1x pakai</p>
                </div>

                <Button 
                  onClick={copyToClipboard}
                  className="w-full bg-[#EA580C] hover:bg-[#D44E0A] text-white font-black h-16 rounded-[22px] transition-all shadow-xl shadow-orange-950/40 uppercase tracking-[0.2em]"
                >
                  <Copy size={18} className="mr-3" />
                  Salin Kode
                </Button>
              </div>

              <div className="space-y-5 px-6 text-center">
                <p className="text-[#94A3B8] text-sm font-bold leading-relaxed uppercase tracking-tight">
                  Bagikan kode ini via <span className="text-[#10B981]">WhatsApp</span> ke anggota yang ingin diundang.
                </p>
                <div className="p-5 bg-black/20 border border-white/5 rounded-2xl text-[11px] font-bold text-[#4B6478] text-left uppercase tracking-tight leading-relaxed">
                  <p>💡 Calon staff dapat mendaftar sendiri menggunakan kode ini tanpa perlu input data bisnis lagi.</p>
                </div>
              </div>

              <Button 
                variant="ghost" 
                onClick={onClose}
                className="text-[#4B6478] hover:text-white font-black uppercase tracking-widest text-xs"
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
