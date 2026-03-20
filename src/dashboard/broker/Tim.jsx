import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/hooks/useAuth';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
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
import { Loader2, Trash2, X, Plus, UserPlus, Users, Clock } from 'lucide-react';
import { formatDistanceToNow, differenceInDays } from 'date-fns';
import { id } from 'date-fns/locale';

const ROLE_BADGE_MAP = {
  owner: { label: 'Owner', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  staff: { label: 'Staff', class: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  view_only: { label: 'View Only', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  supir: { label: 'Supir', class: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
};

export default function Tim() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [isInviteSheetOpen, setIsInviteSheetOpen] = useState(false);
  const isOwner = profile?.role === 'owner';

  // --- QUERIES ---
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

  // --- MUTATIONS ---
  const inviteMutation = useMutation({
    mutationFn: async (payload) => {
      const { data, error } = await supabase
        .from('team_invitations')
        .insert([{
          tenant_id: profile.tenant_id,
          invited_by: profile.id,
          email: payload.email,
          role: payload.role,
        }])
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Undangan berhasil dikirim ke ${data.email}`, {
        description: 'Link: ' + window.location.origin + '/invite/' + data.token,
        duration: 8000
      });
      queryClient.invalidateQueries(['team_invitations']);
      setIsInviteSheetOpen(false);
    },
    onError: (error) => {
      toast.error('Gagal mengirim undangan', { description: error.message });
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

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-tx-1">Tim & Akses</h1>
          <p className="text-tx-3 mt-1">
            {members.length} anggota aktif {invitations.length > 0 && `• ${invitations.length} undangan tertunda`}
          </p>
        </div>
        {isOwner && (
          <Button 
            onClick={() => setIsInviteSheetOpen(true)}
            className="bg-em-500 hover:bg-em-600 text-white font-semibold rounded-xl"
          >
            <UserPlus size={18} className="mr-2" />
            Undang Anggota
          </Button>
        )}
      </div>

      {!isOwner && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-amber-500 text-sm">
          Anda masuk sebagai <strong>{ROLE_BADGE_MAP[profile?.role]?.label || profile?.role}</strong>. Hanya owner yang dapat mengelola undangan dan akses.
        </div>
      )}

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
                      <div className="w-10 h-10 rounded-full bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.2)] flex items-center justify-center text-gold flex-shrink-0">
                        <UserPlus size={16} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-tx-1">{invite.email}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-tx-3">
                            <Clock size={12} className="inline mr-1 -mt-0.5" />
                            Sisa {daysLeft > 0 ? `${daysLeft} hari` : 'hari ini'}
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
                            if (confirm(`Batalkan undangan untuk ${invite.email}?`)) {
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

      {/* Invite Form Sheet */}
      <InviteSheet 
        isOpen={isInviteSheetOpen} 
        onClose={() => setIsInviteSheetOpen(false)} 
        onSubmit={(data) => inviteMutation.mutate(data)}
        isPending={inviteMutation.isPending}
      />

    </div>
  );
}

function InviteSheet({ isOpen, onClose, onSubmit, isPending }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('staff');
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Email wajib diisi');
      return;
    }
    onSubmit({ email, role });
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
          maxHeight: isDesktop ? '100vh' : '95vh',
          padding: 0,
          borderRadius: isDesktop ? '0' : '24px 24px 0 0',
        }}
      >
        <SheetHeader className="text-left p-6 sm:p-8 pb-0">
          <SheetTitle className="font-display text-xl font-bold text-tx-1">Undang Anggota</SheetTitle>
          <SheetDescription className="text-tx-3 text-sm">
            Kirimkan email undangan ke anggota baru untuk bergabung ke bisnis Anda.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-6 p-6 sm:p-8 pt-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-tx-3 uppercase tracking-wider">Email Tujuan <span className="text-red">*</span></Label>
            <Input 
              type="email" 
              placeholder="nama@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-bg-2 border-border-def h-12 rounded-xl text-tx-1 placeholder:text-tx-3/50 focus-visible:ring-1 focus-visible:ring-em-400"
              required
            />
          </div>

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

          <SheetFooter className="mt-auto pt-6 border-t border-border-sub">
            <Button 
              type="submit" 
              className="w-full bg-em-500 hover:bg-em-600 text-white font-bold h-12 rounded-xl text-[15px] transition-all"
              disabled={isPending}
            >
              {isPending ? <Loader2 className="animate-spin mr-2" /> : null}
              {isPending ? "Mengirim..." : "Kirim Undangan"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
