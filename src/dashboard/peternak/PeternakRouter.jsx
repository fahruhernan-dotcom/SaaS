import React from 'react'
import { useParams } from 'react-router-dom'

// ─── Broiler ──────────────────────────────────────────────────────────────────
import BroilerBeranda      from './broiler/Beranda'
import BroilerSiklus       from './broiler/Siklus'
import BroilerInputHarian  from './broiler/InputHarian'
import BroilerPakan        from './broiler/Pakan'
import BroilerAnakKandang  from './broiler/AnakKandang'
import BroilerLaporanSiklus from './broiler/LaporanSiklus'
import BroilerFarmBeranda  from './broiler/FarmBeranda'
import BroilerSetupFarm    from './broiler/SetupFarm'
import BroilerFarmSettings from './broiler/FarmSettings'
import BroilerVaksinasi    from './broiler/Vaksinasi'
import BroilerDailyTask    from './broiler/DailyTask'
import TimManajemenPage    from './_shared/pages/tim/TimManajemenPage'
import ListrikAirPage      from './_shared/pages/listrik-air/ListrikAirPage'

// ─── Layer ────────────────────────────────────────────────────────────────────
import LayerBeranda from './layer/LayerBeranda'
import LayerDailyTask from './layer/DailyTask'

// ─── Sapi — Penggemukan ───────────────────────────────────────────────────────
import SapiBeranda      from './sapi/fattening/Beranda'
import SapiBatch        from './sapi/fattening/Batch'
import SapiTernak       from './sapi/fattening/Ternak'
import SapiKesehatan    from './sapi/fattening/Kesehatan'
import SapiPakan        from './sapi/fattening/Pakan'
import SapiLaporan      from './sapi/fattening/LaporanBatch'
import SapiKandangView  from './sapi/fattening/KandangView'
import SapiDailyTask    from './sapi/fattening/DailyTask'
import SapiTaskAssign   from './sapi/fattening/TaskAssign'
import SapiTaskSettings from './sapi/fattening/TaskSettings'
import SapiQuickAdd     from './sapi/fattening/QuickAdd'
import SapiPenjualan    from './sapi/fattening/Penjualan'

// ─── Sapi — Breeding ──────────────────────────────────────────────────────────
import SapiBreedingBeranda    from './sapi/breeding/Beranda'
import SapiBreedingTernak     from './sapi/breeding/Ternak'
import SapiBreedingReproduksi from './sapi/breeding/Reproduksi'
import SapiBreedingKesehatan  from './sapi/breeding/Kesehatan'
import SapiBreedingPakan      from './sapi/breeding/Pakan'
import SapiBreedingLaporan    from './sapi/breeding/LaporanFarm'
import SapiBreedingDailyTask    from './sapi/breeding/DailyTask'
import SapiBreedingTaskAssign    from './sapi/breeding/TaskAssign'
import SapiBreedingTaskSettings  from './sapi/breeding/TaskSettings'

// ─── Domba — Penggemukan ──────────────────────────────────────────────────────
import DombaBeranda      from './domba/fattening/Beranda'
import DombaBatch        from './domba/fattening/Batch'
import DombaTernak       from './domba/fattening/Ternak'
import DombaKesehatan    from './domba/fattening/Kesehatan'
import DombaPakan        from './domba/fattening/Pakan'
import DombaLaporan      from './domba/fattening/LaporanBatch'
import DombaKandangView  from './domba/fattening/KandangView'
import DombaDailyTask    from './domba/fattening/DailyTask'
import DombaTaskAssign   from './domba/fattening/TaskAssign'
import DombaTaskSettings from './domba/fattening/TaskSettings'
import DombaPenjualan    from './domba/fattening/Penjualan'
import DombaQuickAdd     from './domba/fattening/QuickAdd'

// ─── Domba — Breeding ─────────────────────────────────────────────────────────
import DombaBreedingBeranda    from './domba/breeding/Beranda'
import DombaBreedingTernak     from './domba/breeding/Ternak'
import DombaBreedingReproduksi from './domba/breeding/Reproduksi'
import DombaBreedingKesehatan  from './domba/breeding/Kesehatan'
import DombaBreedingPakan      from './domba/breeding/Pakan'
import DombaBreedingLaporan    from './domba/breeding/LaporanFarm'
import DombaBreedingDailyTask from './domba/breeding/DailyTask'
import DombaBreedingTaskAssign from './domba/breeding/TaskAssign'
import DombaBreedingTaskSettings from './domba/breeding/TaskSettings'

// ─── Kambing — Penggemukan ────────────────────────────────────────────────────
import KambingBeranda      from './kambing/fattening/Beranda'
import KambingBatch        from './kambing/fattening/Batch'
import KambingTernak       from './kambing/fattening/Ternak'
import KambingKesehatan    from './kambing/fattening/Kesehatan'
import KambingPakan        from './kambing/fattening/Pakan'
import KambingLaporan      from './kambing/fattening/LaporanBatch'
import KambingKandangView  from './kambing/fattening/KandangView'
import KambingDailyTask    from './kambing/fattening/DailyTask'
import KambingPenjualan    from './kambing/fattening/Penjualan'
import KambingQuickAdd     from './kambing/fattening/QuickAdd'
import KambingTaskAssign   from './kambing/fattening/TaskAssign'
import KambingTaskSettings from './kambing/fattening/TaskSettings'

// ─── Kambing — Breeding ───────────────────────────────────────────────────────
import KambingBreedingBeranda    from './kambing/breeding/Beranda'
import KambingBreedingTernak     from './kambing/breeding/Ternak'
import KambingBreedingReproduksi from './kambing/breeding/Reproduksi'
import KambingBreedingKesehatan  from './kambing/breeding/Kesehatan'
import KambingBreedingPakan      from './kambing/breeding/Pakan'
import KambingBreedingLaporan    from './kambing/breeding/LaporanFarm'
import KambingBreedingDailyTask from './kambing/breeding/DailyTask'
import KambingBreedingTaskAssign from './kambing/breeding/TaskAssign'
import KambingBreedingTaskSettings from './kambing/breeding/TaskSettings'

// ─── Kambing Perah ────────────────────────────────────────────────────────────
import KambingPerahBeranda   from './kambing_perah/Beranda'
import KambingPerahProduksi  from './kambing_perah/Produksi'
import KambingPerahTernak    from './kambing_perah/Ternak'
import KambingPerahInventory from './kambing_perah/Inventory'
import KambingPerahPenjualan from './kambing_perah/Penjualan'
import KambingPerahDailyTask from './kambing_perah/DailyTask'
import KambingPerahTaskAssign from './kambing_perah/TaskAssign'
import KambingPerahTaskSettings from './kambing_perah/TaskSettings'

// ─── Shared ───────────────────────────────────────────────────────────────────
import HargaPasar           from '@/dashboard/_shared/pages/HargaPasar'
import Akun                 from '@/dashboard/_shared/pages/Akun'
import LoadingSpinner       from '@/dashboard/_shared/components/LoadingSpinner'
import TanyaAIPage          from './ai/TanyaAIPage'
import AnalisisPerformaPage from './ai/AnalisisPerformaPage'
import PrediksiHasilPage    from './ai/PrediksiHasilPage'
import { getLivestockTypeFromSubType } from '@/lib/constants/taskTemplates'
import { useAuth } from '@/lib/hooks/useAuth'

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

function PeternakManagerGuard({ children }) {
  const { profile, loading } = useAuth()
  if (loading) return <LoadingSpinner fullPage />
  const isAllowed = ['owner', 'manajer', 'superadmin'].includes(profile?.role)
  if (!isAllowed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center text-slate-400">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <span className="text-2xl">🔒</span>
        </div>
        <h2 className="font-['Sora'] font-bold text-white text-lg mb-2">Akses Terbatas</h2>
        <p className="text-[#94A3B8] text-sm max-w-xs mx-auto">
          Hanya Owner atau Manajer yang dapat mengakses halaman ini.
        </p>
      </div>
    )
  }
  return children
}

export function PeternakPageRouter({ page }) {
  const { peternakType } = useParams()
  const livestockType = getLivestockTypeFromSubType(peternakType)

  const AI = {
    'ai-chat':       <TanyaAIPage />,
    'ai-analysis':   <AnalisisPerformaPage />,
    'ai-prediction': <PrediksiHasilPage />,
  }

  const pages = {
    peternak_broiler: {
      beranda:        <BroilerBeranda />,
      siklus:         <BroilerSiklus />,
      'input-harian': <BroilerInputHarian />,
      'stok-pakan':   <BroilerPakan />,
      'anak-kandang': <BroilerAnakKandang />,
      laporan:        <BroilerLaporanSiklus />,
      'farm-beranda': <BroilerFarmBeranda />,
      'setup-farm':   <BroilerSetupFarm />,
      vaksinasi:      <BroilerVaksinasi />,
      daily_task:     <BroilerDailyTask />,
      'harga-pasar':  <HargaPasar />,
      akun:           <Akun />,
      tim:            <TimManajemenPage />,
      atur:           <PeternakAdminGuard><BroilerFarmSettings /></PeternakAdminGuard>,
      ...AI,
    },
    peternak_layer: {
      beranda:       <LayerBeranda />,
      'stok-pakan':  <LayerBeranda />,
      laporan:       <LayerBeranda />,
      daily_task:    <LayerDailyTask />,
      'harga-pasar': <HargaPasar />,
      tim:           <TimManajemenPage />,
      akun:          <Akun />,
      ...AI,
    },
    peternak_sapi_penggemukan: {
      beranda:        <SapiBeranda />,
      batch:          <SapiBatch />,
      ternak:         <SapiTernak />,
      kesehatan:      <SapiKesehatan />,
      'stok-pakan':   <SapiPakan />,
      laporan:        <SapiLaporan />,
      'kandang-view': <SapiKandangView />,
      daily_task:     <SapiDailyTask />,
      task_settings:  <PeternakManagerGuard><SapiTaskSettings /></PeternakManagerGuard>,
      task_assign:    <PeternakManagerGuard><SapiTaskAssign /></PeternakManagerGuard>,
      'quick-add':    <SapiQuickAdd />,
      penjualan:      <SapiPenjualan />,
      'listrik-air':  <ListrikAirPage />,
      'harga-pasar':  <HargaPasar />,
      tim:            <TimManajemenPage />,
      akun:           <Akun />,
      ...AI,
    },
    peternak_sapi_breeding: {
      beranda:       <SapiBreedingBeranda />,
      ternak:        <SapiBreedingTernak />,
      reproduksi:    <SapiBreedingReproduksi />,
      kesehatan:     <SapiBreedingKesehatan />,
      'stok-pakan':  <SapiBreedingPakan />,
      laporan:       <SapiBreedingLaporan />,
      daily_task:    <SapiBreedingDailyTask />,
      task_settings: <PeternakManagerGuard><SapiBreedingTaskSettings /></PeternakManagerGuard>,
      task_assign:   <PeternakManagerGuard><SapiBreedingTaskAssign /></PeternakManagerGuard>,
      'listrik-air': <ListrikAirPage />,
      'harga-pasar': <HargaPasar />,
      tim:           <TimManajemenPage />,
      akun:          <Akun />,
      ...AI,
    },
    peternak_domba_penggemukan: {
      beranda:        <DombaBeranda />,
      batch:          <DombaBatch />,
      ternak:         <DombaTernak />,
      kesehatan:      <DombaKesehatan />,
      'stok-pakan':   <DombaPakan />,
      laporan:        <DombaLaporan />,
      'kandang-view': <DombaKandangView />,
      daily_task:     <DombaDailyTask />,
      task_settings:  <PeternakManagerGuard><DombaTaskSettings /></PeternakManagerGuard>,
      task_assign:    <PeternakManagerGuard><DombaTaskAssign /></PeternakManagerGuard>,
      penjualan:      <DombaPenjualan />,
      'quick-add':    <DombaQuickAdd />,
      'listrik-air':  <ListrikAirPage />,
      'harga-pasar':  <HargaPasar />,
      tim:            <TimManajemenPage />,
      akun:           <Akun />,
      ...AI,
    },
    peternak_domba_breeding: {
      beranda:       <DombaBreedingBeranda />,
      ternak:        <DombaBreedingTernak />,
      reproduksi:    <DombaBreedingReproduksi />,
      kesehatan:     <DombaBreedingKesehatan />,
      'stok-pakan':  <DombaBreedingPakan />,
      laporan:       <DombaBreedingLaporan />,
      daily_task:    <DombaBreedingDailyTask />,
      task_settings: <PeternakManagerGuard><DombaBreedingTaskSettings /></PeternakManagerGuard>,
      task_assign:   <PeternakManagerGuard><DombaBreedingTaskAssign /></PeternakManagerGuard>,
      'harga-pasar': <HargaPasar />,
      tim:           <TimManajemenPage />,
      akun:          <Akun />,
      ...AI,
    },
    peternak_kambing_penggemukan: {
      beranda:        <KambingBeranda />,
      batch:          <KambingBatch />,
      ternak:         <KambingTernak />,
      kesehatan:      <KambingKesehatan />,
      'stok-pakan':   <KambingPakan />,
      laporan:        <KambingLaporan />,
      'kandang-view': <KambingKandangView />,
      daily_task:     <KambingDailyTask />,
      task_settings:  <PeternakManagerGuard><KambingTaskSettings /></PeternakManagerGuard>,
      task_assign:    <PeternakManagerGuard><KambingTaskAssign /></PeternakManagerGuard>,
      penjualan:      <KambingPenjualan />,
      'quick-add':    <KambingQuickAdd />,
      'listrik-air':  <ListrikAirPage />,
      'harga-pasar':  <HargaPasar />,
      tim:            <TimManajemenPage />,
      akun:           <Akun />,
      ...AI,
    },
    peternak_kambing_breeding: {
      beranda:       <KambingBreedingBeranda />,
      ternak:        <KambingBreedingTernak />,
      reproduksi:    <KambingBreedingReproduksi />,
      kesehatan:     <KambingBreedingKesehatan />,
      'stok-pakan':  <KambingBreedingPakan />,
      laporan:       <KambingBreedingLaporan />,
      daily_task:    <KambingBreedingDailyTask />,
      task_settings: <PeternakManagerGuard><KambingBreedingTaskSettings /></PeternakManagerGuard>,
      task_assign:   <PeternakManagerGuard><KambingBreedingTaskAssign /></PeternakManagerGuard>,
      'harga-pasar': <HargaPasar />,
      tim:           <TimManajemenPage />,
      akun:          <Akun />,
      ...AI,
    },
    peternak_kambing_perah: {
      beranda:       <KambingPerahBeranda />,
      ternak:        <KambingPerahTernak />,
      produksi:      <KambingPerahProduksi />,
      inventory:     <KambingPerahInventory />,
      penjualan:     <KambingPerahPenjualan />,
      laporan:       <div className="p-8"><h2 className="text-xl font-bold text-white">Laporan</h2><p className="text-slate-400">Coming soon</p></div>,
      'stok-pakan':  <KambingPerahInventory />,
      daily_task:    <KambingPerahDailyTask />,
      'harga-pasar': <HargaPasar />,
      tim:           <TimManajemenPage />,
      akun:          <Akun />,
      ...AI,
    },
  }

  return pages[peternakType]?.[page]
    ?? <div className="p-8 text-[#94A3B8]">Halaman tidak ditemukan</div>
}
