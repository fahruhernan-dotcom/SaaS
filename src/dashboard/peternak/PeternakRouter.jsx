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

// Layer pages (placeholder)
import LayerBeranda from './layer/LayerBeranda'

// Shared pages
import HargaPasar from '../_shared/pages/HargaPasar'
import Akun from '../broker/poultry_broker/Akun' // Using poultry broker's Akun for now or shared one
import Tim from '../broker/poultry_broker/Tim'

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
      'harga-pasar':  <HargaPasar />,
      'akun':         <Akun />,
      'tim':          <Tim />,
    },
    peternak_layer: {
      beranda: <LayerBeranda />,
      'akun':  <Akun />,
    }
  }
  
  return pages[peternakType]?.[page]
    ?? <div className="p-8 text-[#94A3B8]">Halaman tidak ditemukan</div>
}
