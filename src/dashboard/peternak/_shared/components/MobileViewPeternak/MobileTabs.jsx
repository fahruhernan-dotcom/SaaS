import React, { useState } from 'react'
import { Plus, Search, Filter, ChevronRight, Heart, Wheat, Wallet, User, Shield, Map, Calendar, Target, FileText, Bell, LogOut, HeartPulse } from 'lucide-react'
import { Card, Pill, ProgressBar } from '@/dashboard/peternak/_shared/components/MobilePrimitives'
import { MobileBatchRow } from './MobileBatchRow'
import { MobileAlertRow } from './MobileAlertRow'

// ─── BATCH TAB ────────────────────────────────────────────────
export function MobileBatchTab({ activeBatches, allBatches, onBatchClick, onAddBatch }) {
  const [filter, setFilter] = useState('aktif')
  
  const filtered = filter === 'aktif' 
    ? activeBatches 
    : filter === 'selesai' 
      ? allBatches.filter(b => b.status === 'closed')
      : activeBatches.filter(b => {
          const days = Math.floor((new Date() - new Date(b.start_date)) / (1000 * 60 * 60 * 24))
          return days >= 75 // Mock "ready to harvest" logic
        })

  return (
    <div className="pb-32">
      <div className="px-5 pt-8 pb-6">
        <h2 className="text-[24px] font-display font-bold text-white tracking-tight">Batch</h2>
        <p className="text-[13px] text-[#94A3B8] mt-1">{activeBatches.length} aktif · {allBatches.length - activeBatches.length} selesai</p>
      </div>

      <div className="px-5 mb-6">
        <div className="flex p-1 bg-white/[0.03] border border-white/5 rounded-xl">
          {[
            { id: 'aktif', label: 'Berjalan' },
            { id: 'panen', label: 'Siap Panen' },
            { id: 'selesai', label: 'Selesai' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`flex-1 py-2 text-[13px] font-bold rounded-lg transition-all ${
                filter === t.id ? 'bg-[#13191A] text-white shadow-lg shadow-black/20' : 'text-[#94A3B8]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 space-y-3">
        {filtered.map((batch, i) => (
          <MobileBatchRow 
            key={batch.id} 
            batch={batch} 
            onClick={() => onBatchClick(batch)}
            index={i}
          />
        ))}
        
        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-[#4B6478]">
              <Search size={24} />
            </div>
            <p className="text-[#94A3B8] font-medium">Tidak ada batch ditemukan</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-24 right-5 z-40">
        <button 
          onClick={onAddBatch}
          className="w-14 h-14 bg-emerald-500 text-[#0A0E0C] rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20 active:scale-95 transition-transform"
        >
          <Plus size={24} strokeWidth={3} />
        </button>
      </div>
    </div>
  )
}

// ─── HEALTH TAB ───────────────────────────────────────────────
export function MobileHealthTab({ logs = [], onAddLog }) {
  const monitoring = logs.filter(l => l.status === 'monitoring').length
  const recovered = logs.filter(l => l.status === 'sembuh').length

  return (
    <div className="pb-32">
      <div className="px-5 pt-8 pb-6">
        <h2 className="text-[24px] font-display font-bold text-white tracking-tight">Kesehatan</h2>
        <p className="text-[13px] text-[#94A3B8] mt-1">{monitoring} dalam pemantauan · {recovered} sembuh</p>
      </div>

      <div className="px-5 grid grid-cols-2 gap-3 mb-8">
        <Card className="p-4 border-amber-500/10">
          <div className="flex items-center gap-2 text-amber-400 mb-2">
            <Heart size={16} /><span className="text-[10px] font-bold uppercase tracking-widest">Sakit Aktif</span>
          </div>
          <div className="text-[24px] font-display font-bold text-white leading-none">{monitoring}</div>
        </Card>
        <Card className="p-4 border-emerald-500/10">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <Shield size={16} /><span className="text-[10px] font-bold uppercase tracking-widest">Vaksinasi</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-[24px] font-display font-bold text-white leading-none">92</span>
            <span className="text-[12px] text-[#94A3B8] font-medium">%</span>
          </div>
        </Card>
      </div>

      <div className="px-5 mb-4 flex items-center justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#4B6478]">Riwayat Penanganan</h3>
        <button onClick={onAddLog} className="text-emerald-400 text-[11px] font-bold uppercase tracking-widest">+ Catat</button>
      </div>

      <div className="px-5 space-y-3">
        {logs.map((log, i) => (
          <Card key={i} className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center">
                  <HeartPulse size={18} />
                </div>
                <div>
                  <div className="text-[15px] font-bold text-white">{log.animal_tag || 'Massal'} · {log.batch_code}</div>
                  <div className="text-[12px] text-[#94A3B8] mt-0.5">{log.date}</div>
                </div>
              </div>
              <Pill tone={log.status === 'sembuh' ? 'ok' : 'warn'}>{log.status}</Pill>
            </div>
            <div className="space-y-2 mt-4 pt-4 border-t border-white/5">
              <div className="flex gap-4">
                <span className="w-20 text-[10px] font-bold text-[#4B6478] uppercase tracking-wider">Diagnosis</span>
                <span className="text-[13px] text-white flex-1">{log.diagnosis}</span>
              </div>
              <div className="flex gap-4">
                <span className="w-20 text-[10px] font-bold text-[#4B6478] uppercase tracking-wider">Obat</span>
                <span className="text-[13px] text-emerald-400 font-medium flex-1">{log.medication}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ─── PROFILE TAB ──────────────────────────────────────────────
export function MobileProfileTab({ profile, farm, onLogout }) {
  const initial = profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'L'

  const menuItems = [
    { icon: <User size={18} />, label: 'Pekerja & Peran', sub: 'Kelola tim peternakan', path: '/workers' },
    { icon: <Map size={18} />, label: 'Kandang', sub: 'Atur denah & kapasitas', path: '/kandang' },
    { icon: <Calendar size={18} />, label: 'Template Tugas', sub: 'SOP harian otomatis', path: '/task-templates' },
    { icon: <Target size={18} />, label: 'Target & Ambang', sub: 'ADG, mortalitas, hari panen', path: '/targets' },
    { icon: <FileText size={18} />, label: 'Laporan & Ekspor', sub: 'Unduh PDF / Excel', path: '/reports' },
    { icon: <Bell size={18} />, label: 'Notifikasi', sub: 'Atur pengingat aktivitas', path: '/notifications' },
  ]

  return (
    <div className="pb-32">
      <div className="px-5 pt-8 pb-6">
        <h2 className="text-[24px] font-display font-bold text-white tracking-tight">Profil</h2>
      </div>

      <div className="px-5 mb-8">
        <div className="bg-[#13191A] border border-white/5 rounded-2xl p-5 flex items-center gap-4 shadow-xl">
          <div className="w-16 h-16 bg-emerald-500 text-[#0A0E0C] rounded-full flex items-center justify-center font-display text-[24px] font-bold">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[18px] font-bold text-white truncate">{profile?.full_name || 'Peternak'}</h3>
            <p className="text-[13px] text-[#94A3B8] truncate">{profile?.role || 'Pemilik'} · {farm?.name || 'Peternakan Berkah'}</p>
          </div>
        </div>
      </div>

      <div className="px-5 mb-4">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#4B6478]">Pengaturan</h3>
      </div>

      <div className="px-5 space-y-2">
        {menuItems.map((it, i) => (
          <button
            key={i}
            className="w-full bg-[#13191A] border border-white/5 rounded-xl p-4 flex items-center gap-4 active:scale-[0.98] transition-transform text-left group"
          >
            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-[#0A0E0C] transition-colors">
              {it.icon}
            </div>
            <div className="flex-1">
              <div className="text-[15px] font-bold text-white">{it.label}</div>
              <div className="text-[12px] text-[#94A3B8] mt-0.5">{it.sub}</div>
            </div>
            <ChevronRight size={18} className="text-[#4B6478]" />
          </button>
        ))}

        <button
          onClick={onLogout}
          className="w-full mt-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-4 active:scale-[0.98] transition-transform text-left group"
        >
          <div className="w-10 h-10 bg-red-500/20 text-red-500 rounded-xl flex items-center justify-center shrink-0">
            <LogOut size={18} />
          </div>
          <div className="flex-1">
            <div className="text-[15px] font-bold text-red-400">Keluar Sesi</div>
            <div className="text-[12px] text-red-400/60 mt-0.5">Logout dari perangkat ini</div>
          </div>
        </button>
      </div>
    </div>
  )
}
