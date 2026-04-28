import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Heart, Baby, ChevronDown, AlertTriangle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import {
  useSapiBreedingAnimals,
  useSapiBreedingMatingRecords,
  useSapiBreedingBirths,
  useAddSapiBreedingMatingRecord,
  useUpdateSapiBreedingMatingStatus,
  useAddSapiBreedingBirth,
  calcHariMenujuPartus,
  calcHariKebuntingan,
} from '@/lib/hooks/useSapiBreedingData'
import LoadingSpinner from '@/dashboard/_shared/components/LoadingSpinner'

const BASE = '/peternak/peternak_sapi_breeding'

const STATUS_CFG = {
  menunggu:   { label: 'Menunggu PKB', color: 'text-[#4B6478] bg-white/5 border-white/10' },
  bunting:    { label: 'Bunting',      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  gagal:      { label: 'Gagal',        color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  melahirkan: { label: 'Melahirkan',   color: 'text-green-400 bg-green-500/10 border-green-500/20' },
}

function MatingCard({ mating, onConfirmPregnancy, onRecordBirth }) {
  const dam      = mating.sapi_breeding_animals
  const st       = STATUS_CFG[mating.status] ?? STATUS_CFG.menunggu
  const hariMenuju = calcHariMenujuPartus(mating.est_partus_date)
  const hariIB     = calcHariKebuntingan(mating.mating_date)
  const isOverdue  = hariMenuju !== null && hariMenuju < 0

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-['Sora'] font-bold text-sm text-white">
              {dam?.ear_tag ?? '—'}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-bold ${st.color}`}>
              {st.label}
            </span>
            {isOverdue && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold">
                LEWAT
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#4B6478]">
            {dam?.breed ?? '—'} · Parity {dam?.parity ?? 0}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-white">
            {mating.method === 'ib' ? 'IB' : 'Kawin Alam'}
          </p>
          <p className="text-[10px] text-[#4B6478]">{mating.mating_date}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-white/[0.04] mb-3">
        <div>
          <p className="text-[11px] font-bold text-white">{hariIB}h</p>
          <p className="text-[10px] text-[#4B6478]">Sejak IB</p>
        </div>
        <div>
          <p className={`text-[11px] font-bold ${
            mating.est_partus_date
              ? isOverdue ? 'text-red-400' : hariMenuju <= 14 ? 'text-amber-400' : 'text-white'
              : 'text-[#4B6478]'
          }`}>
            {hariMenuju === null ? '—' : isOverdue ? `+${Math.abs(hariMenuju)}h` : `${hariMenuju}h`}
          </p>
          <p className="text-[10px] text-[#4B6478]">Menuju Partus</p>
        </div>
        <div>
          <p className="text-[11px] font-bold text-white">{mating.repeat_ib_count}Ã—</p>
          <p className="text-[10px] text-[#4B6478]">S/C</p>
        </div>
      </div>

      {mating.method === 'ib' && (
        <p className="text-[10px] text-[#4B6478] mb-3">
          {mating.bull_name && <>Pejantan: <span className="text-white">{mating.bull_name}</span></>}
          {mating.inseminator_name && <> · Ins: <span className="text-white">{mating.inseminator_name}</span></>}
          {mating.semen_code && <> · Semen: <span className="text-white">{mating.semen_code}</span></>}
        </p>
      )}

      {/* Aksi */}
      <div className="flex gap-2">
        {mating.status === 'menunggu' && (
          <button
            onClick={() => onConfirmPregnancy(mating)}
            className="flex-1 py-2 bg-amber-600/20 border border-amber-500/30 text-amber-400 text-xs font-bold rounded-xl"
          >
            Konfirmasi PKB
          </button>
        )}
        {mating.status === 'bunting' && (
          <button
            onClick={() => onRecordBirth(mating)}
            className="flex-1 py-2 bg-green-600/20 border border-green-500/30 text-green-400 text-xs font-bold rounded-xl"
          >
            Catat Kelahiran
          </button>
        )}
      </div>
    </div>
  )
}

function BirthCard({ birth }) {
  const dam = birth.sapi_breeding_animals
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-['Sora'] font-bold text-sm text-white">{dam?.ear_tag ?? '—'}</p>
          <p className="text-[11px] text-[#4B6478]">{birth.partus_date} · {birth.birth_type}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-black text-green-400 font-['Sora']">{birth.total_born_alive}</p>
          <p className="text-[10px] text-[#4B6478]">Lahir Hidup</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mt-1">
        {birth.pedet_sex && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#94A3B8]">
            {birth.pedet_sex === 'jantan' ? 'â™‚ Jantan' : birth.pedet_sex === 'betina' ? 'â™€ Betina' : 'â™‚â™€ Campuran'}
          </span>
        )}
        {birth.pedet_birth_weight_kg && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#94A3B8]">
            {birth.pedet_birth_weight_kg} kg
          </span>
        )}
        {birth.birth_assistance !== 'normal' && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
            {birth.birth_assistance === 'bantuan_tangan' ? 'Bantuan Tangan'
             : birth.birth_assistance === 'alat_obstetri' ? 'Alat Obstetri'
             : 'SC'}
          </span>
        )}
        {birth.is_freemartin_risk && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
            âš  Freemartin Risk
          </span>
        )}
        {birth.retentio_placenta && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
            Retensio Plasenta
          </span>
        )}
      </div>
    </div>
  )
}

// â”€â”€ Sheet: Catat IB Baru â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AddMatingSheet({ animals, onClose }) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { method: 'ib', repeat_ib_count: 1 }
  })
  const { mutate: addMating, isPending } = useAddSapiBreedingMatingRecord()
  const method = watch('method')

  const onSubmit = (data) => {
    addMating({
      dam_id:           data.dam_id,
      method:           data.method,
      bull_name:        data.bull_name?.trim() || null,
      semen_code:       data.semen_code?.trim() || null,
      inseminator_name: data.inseminator_name?.trim() || null,
      repeat_ib_count:  parseInt(data.repeat_ib_count) || 1,
      sync_protocol:    data.sync_protocol?.trim() || null,
      estrus_date:      data.estrus_date || null,
      mating_date:      data.mating_date,
      notes:            data.notes?.trim() || null,
    }, { onSuccess: onClose })
  }

  const fieldCls = "w-full px-3.5 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-[#4B6478] focus:outline-none focus:border-amber-500/40"
  const labelCls = "block text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mb-1.5"

  return (
    <motion.div
      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed inset-x-0 bottom-0 z-50 bg-[#0C1319] rounded-t-[24px] border-t border-white/[0.08] p-5 pb-10 max-h-[92vh] overflow-y-auto"
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-['Sora'] font-bold text-base text-white">Catat IB / Kawin</h2>
        <button onClick={onClose} className="p-1.5 rounded-xl bg-white/5 text-[#94A3B8]">
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Indukan */}
        <div>
          <label className={labelCls}>Indukan *</label>
          <div className="relative">
            <select {...register('dam_id', { required: true })}
              className={fieldCls + ' appearance-none'}>
              <option value="">-- Pilih indukan --</option>
              {animals.filter(a => a.sex === 'betina' && a.status !== 'mati' && a.status !== 'terjual')
                .map(a => (
                  <option key={a.id} value={a.id}>
                    {a.ear_tag} — {a.breed ?? '?'} (Parity {a.parity})
                  </option>
                ))}
            </select>
            <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4B6478] pointer-events-none" />
          </div>
          {errors.dam_id && <p className="text-red-400 text-[11px] mt-1">Wajib diisi</p>}
        </div>

        {/* Metode */}
        <div>
          <label className={labelCls}>Metode *</label>
          <div className="grid grid-cols-2 gap-2">
            {[['ib', 'Inseminasi Buatan (IB)'], ['alami', 'Kawin Alam']].map(([v, l]) => (
              <label key={v} className={`flex items-center gap-2 px-3.5 py-3 rounded-xl border cursor-pointer transition-colors ${
                method === v
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-white/[0.03] border-white/[0.08] text-[#4B6478]'
              }`}>
                <input {...register('method')} type="radio" value={v} className="hidden" />
                <span className="text-xs font-semibold">{l}</span>
              </label>
            ))}
          </div>
        </div>

        {/* IB fields */}
        {method === 'ib' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Nama Pejantan Donor</label>
                <input {...register('bull_name')} placeholder="e.g. Limousin BPTU-01"
                  className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>Kode Semen</label>
                <input {...register('semen_code')} placeholder="e.g. LIM-2025-A"
                  className={fieldCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Nama Inseminator</label>
                <input {...register('inseminator_name')} placeholder="Pak Budi / Dinas"
                  className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>Ke-berapa IB</label>
                <input {...register('repeat_ib_count')} type="number" min="1"
                  placeholder="1" className={fieldCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Protokol Sinkronisasi (Opsional)</label>
              <input {...register('sync_protocol')} placeholder="CIDR, PGF2Î±, Ovsynch..."
                className={fieldCls} />
            </div>
          </>
        )}

        {/* Tanggal */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Tgl Deteksi Birahi</label>
            <input {...register('estrus_date')} type="date" className={fieldCls} />
          </div>
          <div>
            <label className={labelCls}>Tgl IB / Kawin *</label>
            <input {...register('mating_date', { required: true })} type="date" className={fieldCls} />
            {errors.mating_date && <p className="text-red-400 text-[11px] mt-1">Wajib diisi</p>}
          </div>
        </div>

        <div>
          <label className={labelCls}>Catatan</label>
          <textarea {...register('notes')} rows={2}
            className={fieldCls + ' resize-none'} placeholder="Kondisi indukan, catatan khusus..." />
        </div>

        <button type="submit" disabled={isPending}
          className="w-full h-12 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-colors">
          {isPending ? 'Menyimpan...' : 'Simpan'}
        </button>
      </form>
    </motion.div>
  )
}

// â”€â”€ Sheet: Konfirmasi PKB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ConfirmPregnancySheet({ mating, onClose }) {
  const { register, handleSubmit, watch } = useForm({
    defaultValues: { status: 'bunting', pregnancy_method: 'usg' }
  })
  const { mutate: updateStatus, isPending } = useUpdateSapiBreedingMatingStatus()
  const status = watch('status')

  const onSubmit = (data) => {
    updateStatus({
      matingId: mating.id,
      damId: mating.dam_id,
      status: data.status,
      pregnancy_confirmed: data.status === 'bunting',
      pregnancy_confirm_date: data.confirm_date || null,
      pregnancy_method: data.pregnancy_method || null,
      fetus_count: data.fetus_count ? parseInt(data.fetus_count) : null,
    }, { onSuccess: onClose })
  }

  const fieldCls = "w-full px-3.5 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/40"
  const dam = mating.sapi_breeding_animals

  return (
    <motion.div
      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed inset-x-0 bottom-0 z-50 bg-[#0C1319] rounded-t-[24px] border-t border-white/[0.08] p-5 pb-10"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-['Sora'] font-bold text-base text-white">Hasil PKB</h2>
          <p className="text-[11px] text-[#4B6478]">{dam?.ear_tag} · IB {mating.mating_date}</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-xl bg-white/5 text-[#94A3B8]">
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {[['bunting', 'Bunting âœ…'], ['gagal', 'Tidak Bunting âŒ']].map(([v, l]) => (
            <label key={v} className={`flex items-center justify-center gap-2 px-3.5 py-3 rounded-xl border cursor-pointer transition-colors ${
              status === v
                ? v === 'bunting' ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                                  : 'bg-red-500/10 border-red-500/30 text-red-300'
                : 'bg-white/[0.03] border-white/[0.08] text-[#4B6478]'
            }`}>
              <input {...register('status')} type="radio" value={v} className="hidden" />
              <span className="text-xs font-semibold">{l}</span>
            </label>
          ))}
        </div>

        {status === 'bunting' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mb-1.5">Tgl Konfirmasi</label>
                <input {...register('confirm_date')} type="date" className={fieldCls} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mb-1.5">Metode PKB</label>
                <select {...register('pregnancy_method')} className={fieldCls + ' appearance-none'}>
                  <option value="usg">USG</option>
                  <option value="palpasi">Palpasi Rektal</option>
                  <option value="visual">Visual</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mb-1.5">Jumlah Fetus (dari USG)</label>
              <input {...register('fetus_count')} type="number" min="1" placeholder="1" className={fieldCls} />
            </div>
          </>
        )}

        <button type="submit" disabled={isPending}
          className="w-full h-12 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-colors">
          {isPending ? 'Menyimpan...' : 'Simpan Hasil PKB'}
        </button>
      </form>
    </motion.div>
  )
}

// â”€â”€ Sheet: Catat Kelahiran â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function RecordBirthSheet({ mating, onClose }) {
  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      birth_type: 'tunggal',
      total_born: 1,
      total_born_alive: 1,
      birth_assistance: 'normal',
      colostrum_given: true,
      placenta_expelled: true,
      retentio_placenta: false,
      partus_date: new Date().toISOString().split('T')[0],
    }
  })
  const { mutate: addBirth, isPending } = useAddSapiBreedingBirth()
  const birthType   = watch('birth_type')
  const pedetSex    = watch('pedet_sex')
  const isTwin      = birthType === 'kembar'
  const freemartinRisk = isTwin && pedetSex === 'campuran'

  const onSubmit = (data) => {
    addBirth({
      dam_id:               mating.dam_id,
      mating_record_id:     mating.id,
      partus_date:          data.partus_date,
      partus_time:          data.partus_time || null,
      birth_type:           data.birth_type,
      total_born:           parseInt(data.total_born) || 1,
      total_born_alive:     parseInt(data.total_born_alive) || 1,
      pedet_sex:            data.pedet_sex || null,
      pedet_birth_weight_kg: data.pedet_birth_weight_kg ? parseFloat(data.pedet_birth_weight_kg) : null,
      pedet_condition:      data.pedet_condition || null,
      is_freemartin_risk:   freemartinRisk,
      birth_assistance:     data.birth_assistance,
      colostrum_given:      data.colostrum_given === true || data.colostrum_given === 'true',
      placenta_expelled:    data.placenta_expelled === true || data.placenta_expelled === 'true',
      retentio_placenta:    data.retentio_placenta === true || data.retentio_placenta === 'true',
      dam_condition:        data.dam_condition?.trim() || null,
      notes:                data.notes?.trim() || null,
    }, { onSuccess: onClose })
  }

  const fieldCls = "w-full px-3.5 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-[#4B6478] focus:outline-none focus:border-amber-500/40"
  const labelCls = "block text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mb-1.5"
  const dam = mating.sapi_breeding_animals

  return (
    <motion.div
      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed inset-x-0 bottom-0 z-50 bg-[#0C1319] rounded-t-[24px] border-t border-white/[0.08] p-5 pb-10 max-h-[92vh] overflow-y-auto"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-['Sora'] font-bold text-base text-white">Catat Kelahiran</h2>
          <p className="text-[11px] text-[#4B6478]">{dam?.ear_tag} · Partus</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-xl bg-white/5 text-[#94A3B8]">
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Tgl Partus *</label>
            <input {...register('partus_date', { required: true })} type="date" className={fieldCls} />
          </div>
          <div>
            <label className={labelCls}>Jam (Opsional)</label>
            <input {...register('partus_time')} type="time" className={fieldCls} />
          </div>
        </div>

        {/* Jenis kelahiran */}
        <div>
          <label className={labelCls}>Jenis Kelahiran</label>
          <div className="grid grid-cols-2 gap-2">
            {[['tunggal','Tunggal'],['kembar','Kembar']].map(([v,l]) => (
              <label key={v} className={`flex items-center justify-center px-3.5 py-2.5 rounded-xl border cursor-pointer transition-colors text-xs font-semibold ${
                birthType === v
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-white/[0.03] border-white/[0.08] text-[#4B6478]'
              }`}>
                <input {...register('birth_type')} type="radio" value={v} className="hidden" />
                {l}
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Lahir Total</label>
            <input {...register('total_born')} type="number" min="1" className={fieldCls} />
          </div>
          <div>
            <label className={labelCls}>Lahir Hidup</label>
            <input {...register('total_born_alive')} type="number" min="0" className={fieldCls} />
          </div>
        </div>

        {/* Detail pedet (untuk tunggal) */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 space-y-3">
          <p className="text-[11px] font-bold text-[#4B6478] uppercase tracking-widest">Detail Pedet</p>
          <div className="grid grid-cols-3 gap-2">
            {[['jantan','â™‚ Jantan'],['betina','â™€ Betina'],['campuran','â™‚â™€ Campuran']].map(([v,l]) => (
              <label key={v} className={`flex items-center justify-center px-2 py-2 rounded-lg border cursor-pointer text-[10px] font-semibold transition-colors ${
                pedetSex === v
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-white/[0.03] border-white/[0.08] text-[#4B6478]'
              }`}>
                <input {...register('pedet_sex')} type="radio" value={v} className="hidden" />
                {l}
              </label>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Bobot Lahir (kg)</label>
              <input {...register('pedet_birth_weight_kg')} type="number" step="0.1"
                placeholder="32.0" className={fieldCls} />
            </div>
            <div>
              <label className={labelCls}>Kondisi Pedet</label>
              <select {...register('pedet_condition')} className={fieldCls + ' appearance-none'}>
                <option value="">-- Pilih --</option>
                <option value="normal">Normal</option>
                <option value="lemah">Lemah</option>
                <option value="mati_saat_lahir">Mati Saat Lahir</option>
              </select>
            </div>
          </div>
        </div>

        {/* Freemartin warning */}
        {freemartinRisk && (
          <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-semibold">
            <AlertTriangle size={13} className="shrink-0 mt-0.5" />
            <span>Kembar jantan+betina: pedet betina berisiko freemartin (92% infertil). Tandai untuk pemeriksaan kesuburan sebelum dijadikan indukan.</span>
          </div>
        )}

        {/* Proses kelahiran */}
        <div>
          <label className={labelCls}>Proses Kelahiran</label>
          <select {...register('birth_assistance')} className={fieldCls + ' appearance-none'}>
            <option value="normal">Normal (lahir sendiri)</option>
            <option value="bantuan_tangan">Bantuan Tangan</option>
            <option value="alat_obstetri">Alat Obstetri</option>
            <option value="sc">Sectio Caesarea</option>
          </select>
        </div>

        {/* Checklist pasca-partus */}
        <div className="space-y-2">
          {[
            ['colostrum_given',  'Kolostrum sudah diberikan'],
            ['placenta_expelled','Plasenta sudah keluar'],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer">
              <input {...register(key)} type="checkbox"
                className="w-4 h-4 rounded accent-amber-500" />
              <span className="text-sm text-[#94A3B8]">{label}</span>
            </label>
          ))}
          <label className="flex items-center gap-3 cursor-pointer">
            <input {...register('retentio_placenta')} type="checkbox"
              className="w-4 h-4 rounded accent-red-500" />
            <span className="text-sm text-red-400">Retensio plasenta (&gt;12 jam belum keluar)</span>
          </label>
        </div>

        <div>
          <label className={labelCls}>Kondisi Indukan</label>
          <input {...register('dam_condition')} placeholder="Normal, lemas, perlu drip..."
            className={fieldCls} />
        </div>
        <div>
          <label className={labelCls}>Catatan</label>
          <textarea {...register('notes')} rows={2} className={fieldCls + ' resize-none'} />
        </div>

        <button type="submit" disabled={isPending}
          className="w-full h-12 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-colors">
          {isPending ? 'Menyimpan...' : 'Simpan Kelahiran'}
        </button>
      </form>
    </motion.div>
  )
}

// â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function SapiBreedingReproduksi() {
  const [tab, setTab]                     = useState('aktif')
  const [showAdd, setShowAdd]             = useState(false)
  const [confirmMating, setConfirmMating] = useState(null)
  const [birthMating, setBirthMating]     = useState(null)

  const { data: animals  = [], isLoading: loadingAnimals  } = useSapiBreedingAnimals()
  const { data: matings  = [], isLoading: loadingMatings  } = useSapiBreedingMatingRecords()
  const { data: births   = [], isLoading: loadingBirths   } = useSapiBreedingBirths()

  const isLoading = loadingAnimals || loadingMatings || loadingBirths

  const activeMatings  = useMemo(() => matings.filter(m => m.status === 'menunggu' || m.status === 'bunting'), [matings])
  const closedMatings  = useMemo(() => matings.filter(m => m.status === 'melahirkan' || m.status === 'gagal'), [matings])

  if (isLoading) return <LoadingSpinner fullPage />

  return (
    <div className="text-slate-100 pb-24">
      <header className="px-4 pt-6 pb-4 bg-gradient-to-b from-[#0C1319] to-[#06090F] border-b border-white/[0.04] flex items-center justify-between">
        <div>
          <h1 className="font-['Sora'] font-black text-xl text-white mb-0.5">Reproduksi</h1>
          <p className="text-xs text-[#4B6478]">
            {activeMatings.length} aktif · {births.length} kelahiran tercatat
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-600 rounded-xl text-white text-xs font-extrabold font-['Sora'] shadow-[0_3px_12px_rgba(217,119,6,0.35)]"
        >
          <Plus size={13} /> Catat IB
        </motion.button>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 px-4 mt-4">
        {[['aktif','IB Aktif'],['riwayat','Riwayat'],['kelahiran','Kelahiran']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              tab === k ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-[#4B6478]'
            }`}>
            {l}
          </button>
        ))}
      </div>

      <div className="px-4 mt-4 space-y-3">
        {tab === 'aktif' && (
          activeMatings.length === 0
            ? <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
                <p className="text-3xl mb-3">ðŸ„</p>
                <p className="text-sm text-[#4B6478]">Belum ada IB/kawin aktif</p>
              </div>
            : activeMatings.map(m => (
                <MatingCard key={m.id} mating={m}
                  onConfirmPregnancy={setConfirmMating}
                  onRecordBirth={setBirthMating} />
              ))
        )}

        {tab === 'riwayat' && (
          closedMatings.length === 0
            ? <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
                <p className="text-sm text-[#4B6478]">Belum ada riwayat IB</p>
              </div>
            : closedMatings.map(m => (
                <MatingCard key={m.id} mating={m}
                  onConfirmPregnancy={setConfirmMating}
                  onRecordBirth={setBirthMating} />
              ))
        )}

        {tab === 'kelahiran' && (
          births.length === 0
            ? <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
                <p className="text-3xl mb-3">ðŸ®</p>
                <p className="text-sm text-[#4B6478]">Belum ada catatan kelahiran</p>
              </div>
            : births.map(b => <BirthCard key={b.id} birth={b} />)
        )}
      </div>

      {/* Sheets */}
      <AnimatePresence>
        {showAdd && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40" onClick={() => setShowAdd(false)} />
            <AddMatingSheet animals={animals} onClose={() => setShowAdd(false)} />
          </>
        )}
        {confirmMating && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40" onClick={() => setConfirmMating(null)} />
            <ConfirmPregnancySheet mating={confirmMating} onClose={() => setConfirmMating(null)} />
          </>
        )}
        {birthMating && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40" onClick={() => setBirthMating(null)} />
            <RecordBirthSheet mating={birthMating} onClose={() => setBirthMating(null)} />
          </>
        )}
      </AnimatePresence>
    </div>
  )
}