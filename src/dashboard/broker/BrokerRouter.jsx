import React from 'react'
import { useParams, Navigate } from 'react-router-dom'

// Poultry Broker pages
import Beranda from './Beranda'
import Transaksi from './Transaksi'
import Kandang from './Kandang'
import Pengiriman from './Pengiriman'
import RPA from './RPA'
import CashFlow from './CashFlow'
import Armada from './Armada'
import Simulator from './Simulator'
import Tim from './Tim'
import Akun from './Akun'
import RPADetail from './RPADetail'
import SopirDashboard from './SopirDashboard'

// Sembako pages
import SembakoBeranda from '../sembako/Beranda'
import SembakoPenjualan from '../sembako/Penjualan'
import SembakoPegawai from '../sembako/Pegawai'
import SembakoLaporan from '../sembako/Laporan'
import SembakoProduk from '../sembako/Produk'
import SembakoGudang from '../sembako/Gudang'

export function BrokerPageRouter({ page }) {
  const { brokerType } = useParams()
  
  const pages = {
    poultry_broker: {
      beranda: <Beranda />,
      transaksi: <Transaksi />,
      kandang: <Kandang />,
      pengiriman: <Pengiriman />,
      rpa: <RPA />,
      'rpa-detail': <RPADetail />,
      'cash-flow': <CashFlow />,
      armada: <Armada />,
      simulator: <Simulator />,
      tim: <Tim />,
      akun: <Akun />,
      sopir: <SopirDashboard />
    },
    sembako_broker: {
      beranda: <SembakoBeranda />,
      pos: <SembakoPenjualan />,
      penjualan: <SembakoPenjualan />,
      produk: <SembakoProduk />,
      inventori: <SembakoProduk />,
      gudang: <SembakoGudang />,
      karyawan: <SembakoPegawai />,
      laporan: <SembakoLaporan />,
      akun: <Akun />,
      tim: <Tim />
    }
  }
  
  // Fallback map if the type doesn't exact match
  const typeMap = {
    broker_ayam: 'poultry_broker',
    distributor_telur: 'egg_broker',
    distributor_daging: 'sembako_broker',
    sembako: 'sembako_broker',
    broker: 'poultry_broker'
  }
  
  const resolvedType = pages[brokerType] ? brokerType : (typeMap[brokerType] || 'poultry_broker')

  return pages[resolvedType]?.[page] ?? (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <span className="text-4xl">🚧</span>
      <p className="font-black text-white">Halaman tidak ditemukan</p>
    </div>
  )
}
