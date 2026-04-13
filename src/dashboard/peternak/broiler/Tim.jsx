import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import usePeternakPermissions, {
  PETERNAK_ROLE_BADGE,
  PETERNAK_INVITE_ROLES,
} from '@/lib/hooks/usePeternakPermissions'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, Plus, UserPlus, Users, Copy, Trash2, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'

export default function Tim() {
  const { profile, tenant } = useAuth()
  const p = usePeternakPermissions()
  const queryClient = useQueryClient()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteCode, setInviteCode] = useState(null)

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['peternak-team', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return []
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, created_at')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    enabled: !!profile?.tenant_id,
  })

  const { data: pendingInvites = [] } = useQuery({
    queryKey: ['peternak-invites', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return []
      const { data, error } = await supabase
        .from('invitations')
        .select('id, role, invite_code, expires_at, created_at')
        .eq('tenant_id', profile.tenant_id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!profile?.tenant_id && p.canUndangAnggota,
  })

  const generateInvite = useMutation({
    mutationFn: async ({ role }) => {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase()
      const expires = new Date()
      expires.setDate(expires.getDate() + 7)
      const { error } = await supabase.from('invitations').insert({
        tenant_id: profile.tenant_id,
        role,
        invite_code: code,
        expires_at: expires.toISOString(),
        status: 'pending',
      })
      if (error) throw error
      return code
    },
    onSuccess: (code) => {
      setInviteCode(code)
      queryClient.invalidateQueries({ queryKey: ['peternak-invites', profile?.tenant_id] })
    },
    onError: (err) => toast.error('Gagal buat undangan: ' + err.message),
  })

  const revokeInvite = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('invitations').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['peternak-invites', profile?.tenant_id] })
      toast.success('Undangan dicabut')
    },
  })

  const removeMember = useMutation({
    mutationFn: async (memberId) => {
      const { error } = await supabase
        .from('profiles')
        .update({ tenant_id: null, role: null })
        .eq('id', memberId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['peternak-team', profile?.tenant_id] })
      toast.success('Anggota dihapus dari tim')
    },
    onError: (err) => toast.error('Gagal hapus anggota: ' + err.message),
  })

  return (
    <div className="text-slate-100 pb-10">
      <header className="px-4 pt-6 pb-5 bg-gradient-to-b from-[#0C1319] to-[#06090F] border-b border-white/[0.04] flex justify-between items-center">
        <div>
          <h1 className="font-['Sora'] font-extrabold text-xl text-slate-100">Tim & Akses</h1>
          <p className="text-xs text-[#4B6478] mt-0.5">{tenant?.business_name ?? 'Kandang Saya'}</p>
        </div>
        {p.canUndangAnggota && (
          <button
            onClick={() => { setInviteCode(null); setInviteOpen(true) }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#7C3AED] border-none rounded-xl text-white text-xs font-extrabold font-['Sora'] shadow-[0_3px_12px_rgba(124,58,237,0.35)] cursor-pointer"
          >
            <UserPlus size={13} strokeWidth={2.5} />
            Undang
          </button>
        )}
      </header>

      <div className="px-4 mt-5 flex flex-col gap-5">

        {/* ── Non-owner notice ── */}
        {!p.canUndangAnggota && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-amber-400 text-sm">
            Anda masuk sebagai <strong>{PETERNAK_ROLE_BADGE[profile?.role]?.label ?? profile?.role}</strong>.
            Hanya Owner yang dapat mengelola undangan dan akses tim.
          </div>
        )}

        {/* ── Anggota aktif ── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Users size={13} className="text-[#4B6478]" />
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#4B6478]">
              Anggota ({members.length})
            </p>
          </div>
          <div className="bg-[#0C1319] border border-white/[0.08] rounded-2xl overflow-hidden">
            {isLoading ? (
              <div className="py-8 flex justify-center">
                <Loader2 size={18} className="animate-spin text-[#4B6478]" />
              </div>
            ) : members.map((m, idx, arr) => {
              const badge = PETERNAK_ROLE_BADGE[m.role] ?? { label: m.role, cls: 'bg-white/10 text-slate-400' }
              const isMe = m.id === profile?.id
              return (
                <div
                  key={m.id}
                  className={`px-4 py-3 flex items-center justify-between gap-3 ${idx < arr.length - 1 ? 'border-b border-white/[0.04]' : ''}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-[13px] font-bold text-[#A78BFA]">
                        {(m.full_name || m.email || '?')[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-slate-100 truncate">
                        {m.full_name || m.email || 'Pengguna'}
                        {isMe && <span className="text-[10px] text-[#4B6478] ml-1.5">(Anda)</span>}
                      </p>
                      {m.full_name && (
                        <p className="text-[11px] text-[#4B6478] truncate">{m.email}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0.5 ${badge.cls}`}>
                      {badge.label}
                    </Badge>
                    {p.canHapusAnggota && !isMe && m.role !== 'owner' && (
                      <button
                        onClick={() => removeMember.mutate(m.id)}
                        className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer bg-transparent border-none"
                        title="Hapus dari tim"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Undangan pending ── */}
        {p.canUndangAnggota && pendingInvites.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Clock size={13} className="text-[#4B6478]" />
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#4B6478]">
                Undangan Pending ({pendingInvites.length})
              </p>
            </div>
            <div className="bg-[#0C1319] border border-white/[0.08] rounded-2xl overflow-hidden">
              {pendingInvites.map((inv, idx, arr) => {
                const badge = PETERNAK_ROLE_BADGE[inv.role] ?? { label: inv.role, cls: 'bg-white/10 text-slate-400' }
                const expired = new Date(inv.expires_at) < new Date()
                return (
                  <div
                    key={inv.id}
                    className={`px-4 py-3 flex items-center justify-between gap-3 ${idx < arr.length - 1 ? 'border-b border-white/[0.04]' : ''}`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <code className="text-[13px] font-bold text-[#A78BFA] tracking-widest">{inv.invite_code}</code>
                        <button
                          onClick={() => { navigator.clipboard.writeText(inv.invite_code); toast.success('Kode disalin') }}
                          className="p-1 text-[#4B6478] hover:text-slate-300 cursor-pointer bg-transparent border-none"
                        >
                          <Copy size={11} />
                        </button>
                      </div>
                      <p className="text-[10px] text-[#4B6478] mt-0.5">
                        {expired ? '⚠️ Kadaluarsa' : `Berlaku ${formatDistanceToNow(new Date(inv.expires_at), { locale: id, addSuffix: true })}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0.5 ${badge.cls}`}>
                        {badge.label}
                      </Badge>
                      <button
                        onClick={() => revokeInvite.mutate(inv.id)}
                        className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer bg-transparent border-none"
                        title="Cabut undangan"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Role guide ── */}
        <section>
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#4B6478] mb-3">Panduan Role</p>
          <div className="flex flex-col gap-2">
            {PETERNAK_INVITE_ROLES.map(r => {
              const badge = PETERNAK_ROLE_BADGE[r.value]
              return (
                <div key={r.value} className="bg-[#111C24] border border-white/[0.06] rounded-xl px-4 py-3 flex items-start gap-3">
                  <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0.5 flex-shrink-0 mt-0.5 ${badge?.cls ?? ''}`}>
                    {r.label}
                  </Badge>
                  <p className="text-[12px] text-[#4B6478] leading-relaxed">{r.desc}</p>
                </div>
              )
            })}
          </div>
        </section>

      </div>

      {/* ── Invite Sheet ── */}
      <InviteSheet
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        inviteCode={inviteCode}
        onSubmit={({ role }) => generateInvite.mutate({ role })}
        isPending={generateInvite.isPending}
      />
    </div>
  )
}

// ── Invite Sheet ──────────────────────────────────────────────────────────────

function InviteSheet({ isOpen, onClose, onSubmit, isPending, inviteCode }) {
  const [role, setRole] = useState('staff')

  return (
    <Sheet open={isOpen} onOpenChange={open => { if (!open) onClose() }}>
      <SheetContent
        side="bottom"
        className="bg-[#0C1319] border-t border-border/10 flex flex-col"
        style={{ maxHeight: '92vh', padding: 0, borderRadius: '24px 24px 0 0' }}
      >
        <SheetHeader className="text-left p-6 pb-0">
          <SheetTitle className="font-display text-xl font-bold text-tx-1">Undang Anggota Tim</SheetTitle>
          <SheetDescription className="text-tx-3 text-sm">
            {inviteCode
              ? 'Kode berhasil dibuat. Bagikan ke anggota yang ingin diundang.'
              : 'Pilih role lalu generate kode undangan.'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 flex flex-col gap-6 p-6 pt-4 overflow-y-auto">
          {!inviteCode ? (
            <form
              onSubmit={e => { e.preventDefault(); onSubmit({ role }) }}
              className="space-y-6 flex-1 flex flex-col"
            >
              <div className="space-y-2">
                <label className="text-xs font-bold text-tx-3 uppercase tracking-wider">Role *</label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="w-full bg-bg-2 border-border-def h-12 rounded-xl text-tx-1">
                    <SelectValue placeholder="Pilih Role" />
                  </SelectTrigger>
                  <SelectContent className="bg-bg-1 border border-border-def rounded-xl shadow-xl">
                    {PETERNAK_INVITE_ROLES.map(r => (
                      <SelectItem key={r.value} value={r.value} className="focus:bg-bg-2 cursor-pointer py-3 rounded-lg mx-1 my-0.5">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-tx-1">{r.label}</span>
                          <span className="text-[11px] text-tx-3">{r.desc}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-auto pt-6 border-t border-border-sub">
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full flex items-center justify-center gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold h-12 rounded-xl text-[15px] transition-all cursor-pointer border-none disabled:opacity-60"
                >
                  {isPending ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                  {isPending ? 'Generating...' : 'Generate Kode Undangan'}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              <div className="w-full bg-[#111C24] border border-[#7C3AED]/30 rounded-2xl p-8 text-center">
                <p className="text-[11px] text-[#4B6478] uppercase tracking-widest mb-3">Kode Undangan</p>
                <p className="font-['Sora'] text-3xl font-extrabold text-[#A78BFA] tracking-[0.2em] mb-4">{inviteCode}</p>
                <button
                  onClick={() => { navigator.clipboard.writeText(inviteCode); toast.success('Kode disalin!') }}
                  className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-[#7C3AED]/20 border border-[#7C3AED]/30 rounded-xl text-[#A78BFA] text-sm font-bold cursor-pointer hover:bg-[#7C3AED]/30 transition-colors"
                >
                  <Copy size={14} />
                  Salin Kode
                </button>
                <p className="text-[11px] text-[#4B6478] mt-4">Berlaku 7 hari. Anggota masukkan kode ini saat bergabung.</p>
              </div>
              <button
                onClick={onClose}
                className="w-full py-3 border border-white/10 rounded-xl text-[#4B6478] text-sm font-semibold cursor-pointer hover:bg-white/5 transition-colors bg-transparent"
              >
                Selesai
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
