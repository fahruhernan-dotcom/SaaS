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
import SapiTaskSettings from './sapi/TaskSettings'
import SapiTaskAssign from './sapi/TaskAssign'
import SapiKandangView from './sapi/KandangView'
import UniversalDailyTask from './_shared/UniversalDailyTask'
import { getLivestockTypeFromSubType } from '@/lib/constants/taskTemplates'

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

// New Domba — Penggemukan
import DombaBeranda       from './domba/Beranda'
import DombaBatch         from './domba/Batch'
import DombaTernak        from './domba/Ternak'
import DombaKesehatan     from './domba/Kesehatan'
import DombaPakan         from './domba/Pakan'
import DombaLaporan       from './domba/LaporanBatch'
import DombaKandangView   from './domba/KandangView'
import DombaTaskSettings  from './domba/TaskSettings'
import DombaTaskAssign    from './domba/TaskAssign'
import DombaDailyTask     from './domba/DailyTask'
import DombaPenjualan     from './domba/Penjualan'

// New Domba — Breeding
import DombaBreedingBeranda    from './domba/breeding/Beranda'
import DombaBreedingTernak     from './domba/breeding/Ternak'
import DombaBreedingReproduksi from './domba/breeding/Reproduksi'
import DombaBreedingKesehatan  from './domba/breeding/Kesehatan'
import DombaBreedingPakan      from './domba/breeding/Pakan'
import DombaBreedingLaporan    from './domba/breeding/LaporanFarm'

// New Kambing — Penggemukan (Phase 2)
import NewKambingBeranda       from './kambing/Beranda'
import NewKambingBatch         from './kambing/Batch'
import NewKambingTernak        from './kambing/Ternak'
import NewKambingKesehatan     from './kambing/Kesehatan'
import NewKambingPakan         from './kambing/Pakan'
import NewKambingLaporan       from './kambing/LaporanBatch'
import NewKambingKandangView   from './kambing/KandangView'

// New Kambing — Breeding (Phase 2)
import NewKambingBreedingBeranda    from './kambing/breeding/Beranda'
import NewKambingBreedingTernak     from './kambing/breeding/Ternak'
import NewKambingBreedingReproduksi from './kambing/breeding/Reproduksi'
import NewKambingBreedingKesehatan  from './kambing/breeding/Kesehatan'
import NewKambingBreedingPakan      from './kambing/breeding/Pakan'
import NewKambingBreedingLaporan    from './kambing/breeding/LaporanFarm'

// ─── KAMBING PERAH (Phase 3) ──────────────────────────────────────────
import KambingPerahBeranda    from './kambing_perah/Beranda'
import KambingPerahProduksi   from './kambing_perah/Produksi'
import KambingPerahTernak     from './kambing_perah/Ternak'
import KambingPerahInventory  from './kambing_perah/Inventory'
import KambingPerahPenjualan  from './kambing_perah/Penjualan'

// AI pages
import TanyaAIPage from './ai/TanyaAIPage'
import AnalisisPerformaPage from './ai/AnalisisPerformaPage'
import PrediksiHasilPage from './ai/PrediksiHasilPage'

// Shared pages
import HargaPasar from '../_shared/pages/HargaPasar'
import Akun from '../_shared/pages/Akun'
import ComingSoon from '../_shared/components/ComingSoon'
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
  const livestockType = getLivestockTypeFromSubType(peternakType)
  
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
      daily_task:    <UniversalDailyTask livestockType={livestockType} />,
      'harga-pasar':  <HargaPasar />,
      'akun':         <Akun />,
      'tim':          <BroilerTim />,
      'atur':         <PeternakAdminGuard><BroilerFarmSettings /></PeternakAdminGuard>,
      'ai-chat':      <TanyaAIPage />,
      'ai-analysis':  <AnalisisPerformaPage />,
      'ai-prediction':<PrediksiHasilPage />,
    },
    peternak_layer: {
      beranda:      <LayerBeranda />,
      'stok-pakan': <LayerBeranda />, // placeholder
      'laporan':    <LayerBeranda />, // placeholder
      daily_task:   <UniversalDailyTask livestockType={livestockType} />,
      'harga-pasar':<HargaPasar />,
      tim:           <BroilerTim />,
      'akun':       <Akun />,
      'ai-chat':      <TanyaAIPage />,
      'ai-analysis':  <AnalisisPerformaPage />,
      'ai-prediction':<PrediksiHasilPage />,
    },
    peternak_kambing_domba_breeding: {
      beranda:      <BreedingBeranda />,
      ternak:       <BreedingTernak />,
      reproduksi:   <BreedingReproduksi />,
      kesehatan:    <BreedingKesehatan />,
      'stok-pakan': <BreedingPakan />,
      laporan:      <BreedingLaporan />,
      daily_task:   <UniversalDailyTask livestockType={livestockType} />,
      'harga-pasar':<HargaPasar />,
      tim:          <BroilerTim />,
      akun:         <Akun />,
      'ai-chat':      <TanyaAIPage />,
      'ai-analysis':  <AnalisisPerformaPage />,
      'ai-prediction':<PrediksiHasilPage />,
    },
    peternak_sapi_penggemukan: {
      beranda:        <SapiBeranda />,
      batch:          <SapiBatch />,
      ternak:         <SapiTernak />,
      kesehatan:      <SapiKesehatan />,
      'stok-pakan':   <SapiPakan />,
      laporan:        <SapiLaporan />,
      'kandang-view': <SapiKandangView />,
      daily_task:     <UniversalDailyTask livestockType={livestockType} />,
      task_settings:  <PeternakAdminGuard><SapiTaskSettings /></PeternakAdminGuard>,
      task_assign:    <PeternakAdminGuard><SapiTaskAssign /></PeternakAdminGuard>,
      'harga-pasar':  <HargaPasar />,
      tim:            <BroilerTim />,
      akun:           <Akun />,
      'ai-chat':      <TanyaAIPage />,
      'ai-analysis':  <AnalisisPerformaPage />,
      'ai-prediction':<PrediksiHasilPage />,
    },
    peternak_sapi_breeding: {
      beranda:       <SapiBreedingBeranda />,
      ternak:        <SapiBreedingTernak />,
      reproduksi:    <SapiBreedingReproduksi />,
      kesehatan:     <SapiBreedingKesehatan />,
      'stok-pakan':  <SapiBreedingPakan />,
      laporan:       <SapiBreedingLaporan />,
      daily_task:    <UniversalDailyTask livestockType={livestockType} />,
      task_settings: <PeternakAdminGuard><SapiTaskSettings /></PeternakAdminGuard>,
      task_assign:   <PeternakAdminGuard><SapiTaskAssign /></PeternakAdminGuard>,
      'harga-pasar': <HargaPasar />,
      tim:           <BroilerTim />,
      akun:          <Akun />,
      'ai-chat':      <TanyaAIPage />,
      'ai-analysis':  <AnalisisPerformaPage />,
      'ai-prediction':<PrediksiHasilPage />,
    },
    peternak_kambing_domba_penggemukan: {
      beranda:       <KambingBeranda />,
      batch:         <KambingBatch />,
      ternak:        <KambingTernak />,
      kesehatan:     <KambingKesehatan />,
      'stok-pakan':   <KambingPakan />,
      laporan:       <KambingLaporan />,
      'kandang-view':<KandangView />,
      daily_task:    <UniversalDailyTask livestockType={livestockType} />,
      'harga-pasar': <HargaPasar />,
      tim:           <BroilerTim />,
      akun:          <Akun />,
      'ai-chat':      <TanyaAIPage />,
      'ai-analysis':  <AnalisisPerformaPage />,
      'ai-prediction':<PrediksiHasilPage />,
    },
    // ─── NEW DOMBA ROUTES ───────────────────────────────────────────────────
    peternak_domba_penggemukan: {
      beranda:       <DombaBeranda />,
      batch:         <DombaBatch />,
      ternak:        <DombaTernak />,
      kesehatan:     <DombaKesehatan />,
      'stok-pakan':   <DombaPakan />,
      laporan:       <DombaLaporan />,
      'kandang-view': <DombaKandangView />,
      daily_task:    <DombaDailyTask />,
      task_settings: <PeternakAdminGuard><DombaTaskSettings /></PeternakAdminGuard>,
      task_assign:   <PeternakAdminGuard><DombaTaskAssign /></PeternakAdminGuard>,
      penjualan:     <DombaPenjualan />,
      'harga-pasar': <HargaPasar />,
      tim:           <BroilerTim />,
      akun:          <Akun />,
      'ai-chat':      <TanyaAIPage />,
      'ai-analysis':  <AnalisisPerformaPage />,
      'ai-prediction':<PrediksiHasilPage />,
    },
    peternak_domba_breeding: {
      beranda:      <DombaBreedingBeranda />,
      ternak:       <DombaBreedingTernak />,
      reproduksi:   <DombaBreedingReproduksi />,
      kesehatan:    <DombaBreedingKesehatan />,
      'stok-pakan': <DombaBreedingPakan />,
      laporan:      <DombaBreedingLaporan />,
      daily_task:   <UniversalDailyTask livestockType={livestockType} />,
      'harga-pasar':<HargaPasar />,
      tim:          <BroilerTim />,
      akun:         <Akun />,
      'ai-chat':      <TanyaAIPage />,
      'ai-analysis':  <AnalisisPerformaPage />,
      'ai-prediction':<PrediksiHasilPage />,
    },
    // ─── KAMBING ROUTES (Phase 2) ──────────────────────────────────────────
    peternak_kambing_penggemukan: {
      beranda:       <NewKambingBeranda />,
      batch:         <NewKambingBatch />,
      ternak:        <NewKambingTernak />,
      kesehatan:     <NewKambingKesehatan />,
      'stok-pakan':   <NewKambingPakan />,
      laporan:       <NewKambingLaporan />,
      'kandang-view':<NewKambingKandangView />,
      daily_task:    <UniversalDailyTask livestockType={livestockType} />,
      'harga-pasar': <HargaPasar />,
      tim:           <BroilerTim />,
      akun:          <Akun />,
      'ai-chat':      <TanyaAIPage />,
      'ai-analysis':  <AnalisisPerformaPage />,
      'ai-prediction':<PrediksiHasilPage />,
    },
    peternak_kambing_breeding: {
      beranda:      <NewKambingBreedingBeranda />,
      ternak:       <NewKambingBreedingTernak />,
      reproduksi:   <NewKambingBreedingReproduksi />,
      kesehatan:    <NewKambingBreedingKesehatan />,
      'stok-pakan': <NewKambingBreedingPakan />,
      laporan:      <NewKambingBreedingLaporan />,
      daily_task:   <UniversalDailyTask livestockType={livestockType} />,
      'harga-pasar':<HargaPasar />,
      tim:          <BroilerTim />,
      akun:         <Akun />,
      'ai-chat':      <TanyaAIPage />,
      'ai-analysis':  <AnalisisPerformaPage />,
      'ai-prediction':<PrediksiHasilPage />,
    },
    peternak_kambing_perah: {
      beranda:       <KambingPerahBeranda />,
      ternak:        <KambingPerahTernak />,
      produksi:      <KambingPerahProduksi />,
      inventory:     <KambingPerahInventory />,
      penjualan:     <KambingPerahPenjualan />,
      laporan:       <div className="p-8"><h2 className="text-xl font-bold text-white">Laporan</h2><p className="text-slate-400">Coming soon</p></div>,
      'stok-pakan':   <KambingPerahInventory />,
      daily_task:    <UniversalDailyTask livestockType={livestockType} />,
      'harga-pasar': <HargaPasar />,
      tim:           <BroilerTim />,
      akun:          <Akun />,
      'ai-chat':      <TanyaAIPage />,
      'ai-analysis':  <AnalisisPerformaPage />,
      'ai-prediction':<PrediksiHasilPage />,
    },
  }
  
  return pages[peternakType]?.[page]
    ?? <div className="p-8 text-[#94A3B8]">Halaman tidak ditemukan</div>
}
