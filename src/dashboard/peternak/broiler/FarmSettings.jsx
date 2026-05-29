import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, Save, Trash2, AlertTriangle, 
  Info, Settings, MapPin, Layers, Activity,
  CheckCircle2, X
} from 'lucide-react'
import { 
  useSingleFarm, 
  useFarmActiveCycle, 
  useUpdatePeternakFarm, 
  useDeletePeternakFarm 
} from '@/lib/hooks/usePeternakData'
import { useAuth } from '@/lib/hooks/useAuth'
import { PROVINCES } from '@/lib/constants/regions'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandList, CommandItem, CommandInput as CommandSearchInput } from '@/components/ui/command'
import { InputNumber } from '@/components/ui/InputNumber'
import LoadingSpinner from '@/dashboard/_shared/components/LoadingSpinner'
import { toast } from 'sonner'
import usePeternakPermissions from '@/lib/hooks/usePeternakPermissions'
import { getCurrentPosition } from '@/dashboard/peternak/_shared/utils/geofenceUtils'

// ─── Constants ────────────────────────────────────────────────────────────────

const LIVESTOCK_LABELS = {
  ayam_broiler: 'Ayam Broiler',
  ayam_petelur: 'Ayam Petelur',
  domba: 'Kambing & Domba',
  kambing: 'Kambing',
  sapi: 'Sapi',
}

const BMODEL_LABELS = {
  mandiri_murni:  'Murni Mandiri',
  mandiri_semi:   'Semi Mandiri',
  mitra_penuh:    'INTI-PLASMA',
  mitra_pakan:    'Kemitraan Pakan',
  mitra_sapronak: 'Kemitraan Sapronak',
}

// ─── Shared Styles ────────────────────────────────────────────────────────────

const labelCls = 'block text-[10px] font-extrabold uppercase tracking-widest text-[#4B6478] mb-2'
const inputCls = 'w-full h-12 px-4 rounded-xl bg-[#111C24] border border-white/10 text-sm text-white placeholder:text-[#4B6478] focus:border-purple-500/50 outline-none transition-colors'

// ─── Components ───────────────────────────────────────────────────────────────

export default function FarmSettings() {
  const { farmId } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  
  const { data: farm, isLoading: farmLoading } = useSingleFarm(farmId)
  const { data: activeCycle, isLoading: cycleLoading } = useFarmActiveCycle(farmId)
  
  const updateFarm = useUpdatePeternakFarm()
  const deleteFarm = useDeletePeternakFarm()
  const permissions = usePeternakPermissions()
  const canEdit = permissions.canEditKandang

  const [form, setForm] = useState({
    farm_name: '',
    location: '',
    province: '',
    capacity: '',
    kandang_count: '',
    livestock_type: '',
    business_model: '',
    mitra_company: '',
    latitude: null,
    longitude: null,
  })
  
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmName, setConfirmName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Geolocation states
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [pendingCoords, setPendingCoords] = useState(null)
  const [isAccuracyModalOpen, setIsAccuracyModalOpen] = useState(false)
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)

  const peternakBase = `/peternak/${profile?.sub_type || 'peternak_broiler'}`

  // ── Sync form with data ──
  useEffect(() => {
    if (farm) {
      setForm({
        farm_name:      farm.farm_name || '',
        location:       farm.location || '',
        province:       farm.province || '',
        capacity:       farm.capacity || '',
        kandang_count:  farm.kandang_count || 1,
        livestock_type: farm.livestock_type || '',
        business_model: farm.business_model || '',
        mitra_company:  farm.mitra_company || '',
        latitude:       farm.latitude ?? null,
        longitude:      farm.longitude ?? null,
      })
    }
  }, [farm])

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleUpdate = async () => {
    if (!form.farm_name.trim()) return toast.error('Nama kandang harus diisi')
    setIsSaving(true)
    try {
      await updateFarm.mutateAsync({
        id: farmId,
        ...form
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleGetLocation = async () => {
    if (!canEdit) return
    setIsGettingLocation(true)
    try {
      const position = await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      })
      const { latitude, longitude, accuracy } = position.coords
      
      if (accuracy <= 100) {
        await handleSaveCoords(latitude, longitude)
      } else {
        setPendingCoords({ latitude, longitude, accuracy })
        setIsAccuracyModalOpen(true)
      }
    } catch (err) {
      let friendlyMessage = 'Gagal mendapatkan lokasi. Pastikan GPS aktif.'
      if (err.code === 1) {
        friendlyMessage = 'Akses lokasi ditolak. Izinkan akses lokasi pada browser Anda.'
      } else if (err.code === 2) {
        friendlyMessage = 'Lokasi tidak tersedia. Pastikan perangkat Anda mendapatkan sinyal GPS.'
      } else if (err.code === 3) {
        friendlyMessage = 'Waktu pencarian lokasi habis. Silakan coba lagi.'
      }
      toast.error(friendlyMessage)
    } finally {
      setIsGettingLocation(false)
    }
  }

  const handleSaveCoords = async (lat, lon) => {
    try {
      await updateFarm.mutateAsync({
        id: farmId,
        ...form,
        latitude: lat,
        longitude: lon
      })
      setForm(f => ({ ...f, latitude: lat, longitude: lon }))
      setIsAccuracyModalOpen(false)
      setPendingCoords(null)
    } catch (_err) {
      // Toast notification is handled by the hook
    }
  }

  const handleResetLocation = async () => {
    try {
      await updateFarm.mutateAsync({
        id: farmId,
        ...form,
        latitude: null,
        longitude: null
      })
      setForm(f => ({ ...f, latitude: null, longitude: null }))
      setIsResetModalOpen(false)
    } catch (_err) {
      // Toast notification is handled by the hook
    }
  }

  const handleDelete = async () => {
    if (confirmName !== farm.farm_name) return toast.error('Nama kandang tidak cocok')
    try {
      await deleteFarm.mutateAsync(farmId)
      navigate(`${peternakBase}/beranda`)
    } catch (_err) {
      // toast handled in hook
    }
  }

  if (farmLoading || cycleLoading) return <LoadingSpinner fullPage />
  if (!farm) return <div className="p-8 text-center text-slate-400">Kandang tidak ditemukan</div>

  const hasActiveCycle = !!activeCycle
  const canDelete = confirmName === farm.farm_name && !hasActiveCycle && !deleteFarm.isPending

  return (
    <div className="text-slate-100 pb-20 max-w-2xl mx-auto px-4">
      
      {/* Header */}
      <header className="py-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="font-['Sora'] font-extrabold text-xl">Atur Kandang</h1>
            <p className="text-xs text-[#4B6478]">ID: {farmId.slice(0,8)}... · {LIVESTOCK_LABELS[farm.livestock_type] || 'Ternak'}</p>
          </div>
        </div>
        <button
          onClick={handleUpdate}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-xl text-white text-sm font-bold shadow-lg shadow-purple-900/20 transition-all cursor-pointer border-none"
        >
          {isSaving ? <LoadingSpinner size={14} /> : <Save size={16} />}
          Simpan
        </button>
      </header>

      <div className="space-y-6">
        
        {/* Basic Info Section */}
        <section className="bg-[#0C1319] border border-white/8 rounded-[24px] p-6 space-y-5">
          <div className="flex items-center gap-2.5 mb-2">
            <Info size={16} className="text-purple-400" />
            <h2 className="font-['Sora'] font-bold text-base text-white">Informasi Umum</h2>
          </div>

          <div>
            <label className={labelCls}>Nama Kandang *</label>
            <input 
              className={inputCls}
              value={form.farm_name}
              onChange={e => setField('farm_name', e.target.value)}
              placeholder="Contoh: Kandang Utama"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Kapasitas (Ekor)</label>
              <InputNumber 
                value={form.capacity}
                onChange={v => setField('capacity', v)}
                className="h-12 rounded-xl bg-[#111C24] border-white/10 text-sm"
              />
            </div>
            <div>
              <label className={labelCls}>Jumlah Pen/Kandang</label>
              <InputNumber 
                value={form.kandang_count}
                onChange={v => setField('kandang_count', v)}
                min={1}
                className="h-12 rounded-xl bg-[#111C24] border-white/10 text-sm"
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Provinsi</label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex items-center justify-between w-full h-12 px-4 bg-[#111C24] border border-white/10 rounded-xl text-white text-sm hover:border-white/20 transition-all"
                >
                  <span className={form.province ? "text-white" : "text-[#4B6478]"}>
                    {form.province || "Pilih Provinsi"}
                  </span>
                  <MapPin size={14} className="text-[#4B6478]" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0 bg-[#0C1319] border-white/10 shadow-2xl z-[100]" align="start">
                <Command className="bg-transparent">
                  <div className="p-2 border-b border-white/10 flex items-center gap-2">
                    <Info size={14} className="text-[#4B6478]" />
                    <input autoFocus placeholder="Cari provinsi..." className="bg-transparent border-none outline-none text-white text-xs w-full py-1" />
                  </div>
                  <CommandList className="max-h-[200px] overflow-y-auto">
                    <CommandEmpty className="py-2 text-center text-xs text-[#4B6478]">Tidak ditemukan</CommandEmpty>
                    <CommandGroup>
                      {PROVINCES.map((p) => (
                        <CommandItem
                          key={p}
                          value={p}
                          onSelect={() => setField('province', p)}
                          className="flex items-center justify-between py-2 px-3 cursor-pointer hover:bg-white/5 rounded-lg text-xs"
                        >
                          <span className={form.province === p ? "text-purple-400" : "text-white/70"}>{p}</span>
                          {form.province === p && <CheckCircle2 size={12} className="text-purple-400" />}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className={labelCls}>Lokasi Detail</label>
            <textarea 
              className={`${inputCls} h-24 py-3 resize-none`}
              value={form.location}
              onChange={e => setField('location', e.target.value)}
              placeholder="Alamat lengkap lokasi kandang..."
            />
          </div>
        </section>

        {/* Business Settings */}
        <section className="bg-[#0C1319] border border-white/8 rounded-[24px] p-6 space-y-5">
          <div className="flex items-center gap-2.5 mb-2">
            <Layers size={16} className="text-purple-400" />
            <h2 className="font-['Sora'] font-bold text-base text-white">Model Bisnis</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Jenis Ternak</label>
              <select 
                className={inputCls}
                value={form.livestock_type}
                onChange={e => setField('livestock_type', e.target.value)}
              >
                {Object.entries(LIVESTOCK_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Model Bisnis</label>
              <select 
                className={inputCls}
                value={form.business_model}
                onChange={e => setField('business_model', e.target.value)}
              >
                {Object.entries(BMODEL_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {form.business_model !== 'mandiri_murni' && (
            <div>
              <label className={labelCls}>Perusahaan Mitra/PT</label>
              <input 
                className={inputCls}
                value={form.mitra_company}
                onChange={e => setField('mitra_company', e.target.value)}
                placeholder="Nama PT atau Koperasi Mitra"
              />
            </div>
          )}
        </section>

        {/* Lokasi Kandang */}
        <section className="bg-[#0C1319] border border-white/8 rounded-[24px] p-6 space-y-5">
          <div className="flex items-center gap-2.5 mb-2">
            <MapPin size={16} className="text-purple-400" />
            <h2 className="font-['Sora'] font-bold text-base text-white">Lokasi Kandang</h2>
          </div>

          <p className="text-xs text-[#94A3B8] leading-relaxed">
            Digunakan untuk validasi lokasi staff saat mulai/menyelesaikan tugas harian.
          </p>

          <div className="flex flex-col gap-2">
            <div className="flex items-center">
              {form.latitude != null && form.longitude != null ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 size={12} /> Lokasi sudah diatur
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <AlertTriangle size={12} /> Lokasi belum diatur
                </span>
              )}
            </div>

            {form.latitude != null && form.longitude != null && (
              <p className="text-xs font-mono text-slate-300 mt-1 bg-[#111C24] p-3 rounded-xl border border-white/5">
                Lat: {Number(form.latitude).toFixed(5)}, Lon: {Number(form.longitude).toFixed(5)}
              </p>
            )}
          </div>

          <div className="flex items-start gap-2.5 p-3.5 bg-white/5 border border-white/10 rounded-xl">
            <Info size={14} className="text-[#4B6478] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              Radius default: <span className="text-white font-bold">150 meter</span>. Staff harus berada di dalam area ini untuk memulai/menyelesaikan tugas.
            </p>
          </div>

          {canEdit ? (
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={isGettingLocation}
                className="flex-1 h-12 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-bold shadow-lg shadow-purple-900/20 transition-all flex items-center justify-center gap-2 border-none cursor-pointer"
              >
                {isGettingLocation ? (
                  <>
                    <LoadingSpinner size={14} />
                    <span>Mencari Lokasi...</span>
                  </>
                ) : (
                  <>
                    <MapPin size={16} />
                    <span>Gunakan Lokasi Saat Ini</span>
                  </>
                )}
              </button>
              {form.latitude != null && form.longitude != null && (
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(true)}
                  className="px-4 h-12 rounded-xl border border-red-500/20 hover:border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-sm font-bold transition-all cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          ) : (
            <div className="text-[11px] text-[#4B6478] italic mt-1 leading-relaxed">
              Hanya Owner atau Manajer yang dapat mengatur ulang titik koordinat kandang.
            </div>
          )}
        </section>

        {/* Danger Zone */}
        <section className="bg-red-500/5 border border-red-500/10 rounded-[24px] p-6 space-y-4">
          <div className="flex items-center gap-2.5 mb-2">
            <Trash2 size={16} className="text-red-400" />
            <h2 className="font-['Sora'] font-bold text-base text-red-400">Danger Zone</h2>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-xs text-[#F87171] leading-relaxed">
              Menghapus kandang akan menyembunyikan kandang ini dari dashboard dan laporan.
              Data historis siklus yang sudah selesai tetap tersimpan secara internal namun tidak akan muncul di daftar kandang aktif.
            </p>

            {hasActiveCycle && (
              <div className="flex items-start gap-2.5 p-3.5 bg-amber-400/10 border border-amber-400/20 rounded-xl">
                <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-400 font-semibold leading-relaxed">
                  Kandang ini memiliki siklus yang sedang aktif. Silakan tutup siklus terlebih dahulu sebelum menghapus kandang.
                </p>
              </div>
            )}

            <button
              onClick={() => setIsDeleting(true)}
              disabled={hasActiveCycle}
              className={`w-full py-3.5 rounded-xl text-red-400 text-sm font-bold border border-red-500/20 bg-red-500/5 transition-all
                ${hasActiveCycle ? 'opacity-40 cursor-not-allowed' : 'hover:bg-red-500/10 cursor-pointer'}`}
            >
              Hapus Kandang Ini
            </button>
          </div>
        </section>

      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {isDeleting && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0C1319] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl shadow-black"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle size={24} className="text-red-500" />
                </div>
                <button onClick={() => setIsDeleting(false)} className="text-[#4B6478] hover:text-white bg-transparent border-none cursor-pointer">
                  <X size={20} />
                </button>
              </div>
              
              <h3 className="font-['Sora'] font-bold text-white text-lg mb-2">Hapus Kandang?</h3>
              <p className="text-sm text-[#94A3B8] mb-6 leading-relaxed">
                Tindakan ini tidak dapat dibatalkan dengan mudah. Masukkan nama kandang <span className="text-white font-bold">"{farm.farm_name}"</span> di bawah untuk mengonfirmasi.
              </p>

              <input 
                className={`${inputCls} mb-4`}
                placeholder="Masukkan nama kandang"
                value={confirmName}
                onChange={e => setConfirmName(e.target.value)}
              />

              <div className="flex gap-3">
                <button 
                  onClick={() => setIsDeleting(false)}
                  className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  onClick={handleDelete}
                  disabled={!canDelete}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold border-none text-white transition-all
                    ${canDelete ? 'bg-red-600 hover:bg-red-500 cursor-pointer shadow-lg shadow-red-900/20' : 'bg-red-600/30 opacity-50 cursor-not-allowed'}`}
                >
                  {deleteFarm.isPending ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Accuracy Warning Modal */}
      <AnimatePresence>
        {isAccuracyModalOpen && pendingCoords && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0C1319] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl shadow-black"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <AlertTriangle size={24} className="text-amber-500" />
                </div>
                <button onClick={() => { setIsAccuracyModalOpen(false); setPendingCoords(null); }} className="text-[#4B6478] hover:text-white bg-transparent border-none cursor-pointer">
                  <X size={20} />
                </button>
              </div>
              
              <h3 className="font-['Sora'] font-bold text-white text-lg mb-2">Akurasi GPS Rendah</h3>
              <p className="text-sm text-[#94A3B8] mb-6 leading-relaxed">
                Akurasi lokasi saat ini kurang presisi (<span className="text-amber-400 font-bold">{Math.round(pendingCoords.accuracy)} meter</span>, disarankan &le; 100 meter). Hal ini dapat mempersulit validasi lokasi staff jika posisi kandang bergeser. Gunakan koordinat ini tetap?
              </p>

              <div className="flex gap-3">
                <button 
                  onClick={() => { setIsAccuracyModalOpen(false); setPendingCoords(null); }}
                  className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white cursor-pointer"
                >
                  Coba Lagi
                </button>
                <button 
                  onClick={() => handleSaveCoords(pendingCoords.latitude, pendingCoords.longitude)}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl text-sm font-bold border-none text-white transition-all cursor-pointer shadow-lg shadow-purple-900/20"
                >
                  Simpan Tetap
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reset Location Confirmation Modal */}
      <AnimatePresence>
        {isResetModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0C1319] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl shadow-black"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle size={24} className="text-red-500" />
                </div>
                <button onClick={() => setIsResetModalOpen(false)} className="text-[#4B6478] hover:text-white bg-transparent border-none cursor-pointer">
                  <X size={20} />
                </button>
              </div>
              
              <h3 className="font-['Sora'] font-bold text-white text-lg mb-2">Reset Lokasi Kandang?</h3>
              <p className="text-sm text-[#94A3B8] mb-6 leading-relaxed">
                Tindakan ini akan menghapus titik GPS kandang ini. Geofence validasi staff/ABK akan terhambat saat memulai/menyelesaikan tugas harian sampai lokasi diatur kembali.
              </p>

              <div className="flex gap-3">
                <button 
                  onClick={() => setIsResetModalOpen(false)}
                  className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  onClick={handleResetLocation}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-bold border-none text-white transition-all cursor-pointer shadow-lg shadow-red-900/20"
                >
                  Ya, Reset
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
