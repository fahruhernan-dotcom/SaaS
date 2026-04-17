import React from 'react'
import { useParams } from 'react-router-dom'

// Broiler pages
import BroilerBeranda from './broiler/Beranda'
import BroilerSiklus from './broiler/Siklus'
import BroilerInputHarian from './broiler/InputHarian'
import BroilerPakan from './broiler/Pakan'
import BroilerAnakKandang from './broiler/AnakKandang'
import BroilerLaporanSiklus from './broiler/LaporanSiklus'
import BroilerFarmBeranda from './broiler/FarmBeranda'
import BroilerSetupFarm from './broiler/SetupFarm'
import BroilerFarmSettings from './broiler/FarmSettings' // [NEW]
import BroilerVaksinasi from './broiler/Vaksinasi'
import BroilerTim from './broiler/Tim'

// Layer pages (placeholder)
import LayerBeranda from './layer/LayerBeranda'

// Sapi — Penggemukan
import SapiBeranda    from './sapi/Beranda'
import SapiBatch      from './sapi/Batch'
import SapiTernak     from './sapi/Ternak'
import SapiKesehatan  from './sapi/Kesehatan'
import SapiPakan      from './sapi/Pakan'
import SapiLaporan    from './sapi/LaporanBatch'

// Kambing & Domba — Penggemukan
import KambingBeranda   from './kambing_domba/Beranda'
import KambingBatch     from './kambing_domba/Batch'
import KambingTernak    from './kambing_domba/Ternak'
import KambingKesehatan from './kambing_domba/Kesehatan'
import KambingPakan     from './kambing_domba/Pakan'
import KambingLaporan   from './kambing_domba/LaporanBatch'
import KandangView      from './kambing_domba/KandangView'

// Sapi — Breeding
import SapiBreedingBeranda    from './sapi/breeding/Beranda'
import SapiBreedingTernak     from './sapi/breeding/Ternak'
import SapiBreedingReproduksi from './sapi/breeding/Reproduksi'
import SapiBreedingKesehatan  from './sapi/breeding/Kesehatan'
import SapiBreedingPakan      from './sapi/breeding/Pakan'
import SapiBreedingLaporan    from './sapi/breeding/LaporanFarm'

// Kambing & Domba — Breeding
import BreedingBeranda    from './kambing_domba/breeding/Beranda'
import BreedingTernak     from './kambing_domba/breeding/Ternak'
import BreedingReproduksi from './kambing_domba/breeding/Reproduksi'
import BreedingKesehatan  from './kambing_domba/breeding/Kesehatan'
import BreedingPakan      from './kambing_domba/breeding/Pakan'
import BreedingLaporan    from './kambing_domba/breeding/LaporanFarm'

// Shared pages
import HargaPasar from '../_shared/pages/HargaPasar'
import Akun from '../_shared/pages/Akun'
import { useAuth } from '@/lib/hooks/useAuth'
import LoadingSpinner from '../_shared/components/LoadingSpinner'

// ─── Route Guard ──────────────────────────────────────────────────────────────

function PeternakAdminGuard({ children }) {
  const { profile, loading } = useAuth()
  if (loading) return <LoadingSpinner fullPage />
  
  const isAllowed = profile?.role === 'owner' || profile?.role === 'superadmin'
  if (!isAllowed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center text-slate-400">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <span className="text-2xl">🔒</span>
        </div>
        <h2 className="font-['Sora'] font-bold text-white text-lg mb-2">Akses Terbatas</h2>
        <p className="text-[#94A3B8] text-sm max-w-xs mx-auto">
          Hanya Owner atau Admin yang dapat mengakses pengaturan kandang.
        </p>
      </div>
    )
  }
  return children
}

export function PeternakPageRouter({ page }) {
  const { peternakType } = useParams()
  
  const pages = {
    peternak_broiler: {
      beranda:       <BroilerBeranda />,
      siklus:        <BroilerSiklus />,
      'input-harian': <BroilerInputHarian />,
      'stok-pakan':   <BroilerPakan />,
      'anak-kandang': <BroilerAnakKandang />,
      'laporan':      <BroilerLaporanSiklus />,
      'farm-beranda': <BroilerFarmBeranda />,
      'setup-farm':   <BroilerSetupFarm />,
      'vaksinasi':    <BroilerVaksinasi />,
      'harga-pasar':  <HargaPasar />,
      'akun':         <Akun />,
      'tim':          <BroilerTim />,
      'atur':         <PeternakAdminGuard><BroilerFarmSettings /></PeternakAdminGuard>,
    },
    peternak_layer: {
      beranda:      <LayerBeranda />,
      'stok-pakan': <LayerBeranda />, // placeholder
      'laporan':    <LayerBeranda />, // placeholder
      'harga-pasar':<HargaPasar />,
      tim:           <BroilerTim />,
      'akun':       <Akun />,
    },
    peternak_kambing_domba_breeding: {
      beranda:      <BreedingBeranda />,
      ternak:       <BreedingTernak />,
      reproduksi:   <BreedingReproduksi />,
      kesehatan:    <BreedingKesehatan />,
      'stok-pakan': <BreedingPakan />,
      laporan:      <BreedingLaporan />,
      'harga-pasar':<HargaPasar />,
      tim:          <BroilerTim />,
      akun:         <Akun />,
    },
    peternak_sapi_penggemukan: {
      beranda:       <SapiBeranda />,
      batch:         <SapiBatch />,
      ternak:        <SapiTernak />,
      kesehatan:     <SapiKesehatan />,
      'stok-pakan':  <SapiPakan />,
      laporan:       <SapiLaporan />,
      'harga-pasar': <HargaPasar />,
      tim:           <BroilerTim />,
      akun:          <Akun />,
    },
    peternak_sapi_breeding: {
      beranda:       <SapiBreedingBeranda />,
      ternak:        <SapiBreedingTernak />,
      reproduksi:    <SapiBreedingReproduksi />,
      kesehatan:     <SapiBreedingKesehatan />,
      'stok-pakan':  <SapiBreedingPakan />,
      laporan:       <SapiBreedingLaporan />,
      'harga-pasar': <HargaPasar />,
      tim:           <BroilerTim />,
      akun:          <Akun />,
    },
    peternak_kambing_domba_penggemukan: {
      beranda:       <KambingBeranda />,
      batch:         <KambingBatch />,
      ternak:        <KambingTernak />,
      kesehatan:     <KambingKesehatan />,
      'stok-pakan':   <KambingPakan />,
      laporan:       <KambingLaporan />,
      'kandang-view':<KandangView />,
      'harga-pasar': <HargaPasar />,
      tim:           <BroilerTim />,
      akun:          <Akun />,
    },
  }
  
  return pages[peternakType]?.[page]
    ?? <div className="p-8 text-[#94A3B8]">Halaman tidak ditemukan</div>
}
