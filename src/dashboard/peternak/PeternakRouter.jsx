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
import BroilerVaksinasi from './broiler/Vaksinasi'
import BroilerTim from './broiler/Tim'

// Layer pages (placeholder)
import LayerBeranda from './layer/LayerBeranda'

// Kambing & Domba — Penggemukan
import KambingBeranda   from './kambing_domba/Beranda'
import KambingBatch     from './kambing_domba/Batch'
import KambingTernak    from './kambing_domba/Ternak'
import KambingKesehatan from './kambing_domba/Kesehatan'
import KambingPakan     from './kambing_domba/Pakan'
import KambingLaporan   from './kambing_domba/LaporanBatch'
import KandangView      from './kambing_domba/KandangView'

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
    },
    peternak_layer: {
      beranda: <LayerBeranda />,
      'akun':  <Akun />,
    },
    peternak_kambing_domba_breeding: {
      beranda:    <BreedingBeranda />,
      ternak:     <BreedingTernak />,
      reproduksi: <BreedingReproduksi />,
      kesehatan:  <BreedingKesehatan />,
      pakan:      <BreedingPakan />,
      laporan:    <BreedingLaporan />,
      tim:        <Akun />,
      akun:       <Akun />,
    },
    peternak_kambing_domba_penggemukan: {
      beranda:       <KambingBeranda />,
      batch:         <KambingBatch />,
      ternak:        <KambingTernak />,
      kesehatan:     <KambingKesehatan />,
      pakan:         <KambingPakan />,
      laporan:       <KambingLaporan />,
      'kandang-view':<KandangView />,
      'harga-pasar': <HargaPasar />,
      tim:           <Akun />,   // placeholder — Phase 4 ganti ke KambingTim
      akun:          <Akun />,
    },
  }
  
  return pages[peternakType]?.[page]
    ?? <div className="p-8 text-[#94A3B8]">Halaman tidak ditemukan</div>
}
