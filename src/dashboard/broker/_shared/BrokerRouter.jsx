import React from 'react'
import { useParams, Navigate } from 'react-router-dom'

// Poultry Broker pages
import Beranda from '../poultry_broker/Beranda'
import Transaksi from '../poultry_broker/Transaksi'
import Kandang from '../poultry_broker/Kandang'
import Pengiriman from '../poultry_broker/Pengiriman'
import RPA from '../poultry_broker/RPA'
import CashFlow from '../poultry_broker/CashFlow'
import Armada from '../poultry_broker/Armada'
import Simulator from '../poultry_broker/Simulator'
import Tim from '../poultry_broker/Tim'
import Akun from '../poultry_broker/Akun'
import RPADetail from '../poultry_broker/RPADetail'
import SopirDashboard from '../poultry_broker/SopirDashboard'

// Sembako pages
import SembakoBeranda from '../sembako_broker/Beranda'
import SembakoPenjualan from '../sembako_broker/Penjualan'
import SembakoPegawai from '../sembako_broker/Pegawai'
import SembakoLaporan from '../sembako_broker/Laporan'
import SembakoProduk from '../sembako_broker/Produk'
import SembakoGudang from '../sembako_broker/Gudang'
import SembakoTokoSupplier from '../sembako_broker/TokoSupplier'
import SembakoTokoSupplierDetail from '../sembako_broker/TokoSupplierDetail'
import SembakoPengiriman from '../sembako_broker/Pengiriman'

// Egg Broker pages
import EggBeranda from '../egg_broker/Beranda'
import EggInventori from '../egg_broker/Inventori'
import EggPOS from '../egg_broker/POS'
import EggTransaksi from '../egg_broker/Transaksi'
import EggSuppliers from '../egg_broker/Suppliers'
import EggCustomers from '../egg_broker/Customers'

export function BrokerPageRouter({ page }) {
  const { brokerType } = useParams()
  
  const pages = {
    broker_ayam: {
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
    distributor_daging: {
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
    broker_telur: {
      beranda: <EggBeranda />,
      pos: <EggPOS />,
      inventori: <EggInventori />,
      suppliers: <EggSuppliers />,
      customers: <EggCustomers />,
      transaksi: <EggTransaksi />,
      akun: <Akun />,
      tim: <Tim />
    },
    distributor_sembako: {
      beranda: <SembakoBeranda />,
      pos: <SembakoPenjualan />,
      penjualan: <SembakoPenjualan />,
      produk: <SembakoProduk />,
      inventori: <SembakoProduk />,
      gudang: <SembakoGudang />,
      'toko-supplier': <SembakoTokoSupplier />,
      'toko-supplier-detail': <SembakoTokoSupplierDetail />,
      pengiriman: <SembakoPengiriman />,
      karyawan: <SembakoPegawai />,
      laporan: <SembakoLaporan />,
      akun: <Akun />,
      tim: <Tim />
    }
  }
  
  // Use brokerType (sub_type) directly or fallback to broker_ayam
  const resolvedType = pages[brokerType] ? brokerType : 'broker_ayam'

  return pages[resolvedType]?.[page] ?? (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <span className="text-4xl">🚧</span>
      <p className="font-black text-white">Halaman tidak ditemukan</p>
    </div>
  )
}
