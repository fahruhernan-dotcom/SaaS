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
import SembakoAkun from '../sembako_broker/Akun'
import SembakoTim from '../sembako_broker/Tim'

// Egg Broker pages
import EggBeranda from '../egg_broker/Beranda'
import EggInventori from '../egg_broker/Inventori'
import EggPOS from '../egg_broker/POS'
import EggTransaksi from '../egg_broker/Transaksi'
import EggSuppliers from '../egg_broker/Suppliers'
import EggCustomers from '../egg_broker/Customers'

import { useAuth } from '@/lib/hooks/useAuth'
import { resolveBusinessVertical as resolveVertical } from '@/lib/businessModel'

export function BrokerPageRouter({ page }) {
  const { brokerType } = useParams()
  const { profile, tenant } = useAuth()
  
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
      akun: <SembakoAkun />,
      tim: <SembakoTim />
    }
  }
  
  // Aliases for sub_types
  pages.sembako_broker = pages.distributor_sembako
  pages.poultry_broker = pages.broker_ayam
  
  // CENTRALIZED VERTICAL RESOLUTION
  const vertical = resolveVertical(profile, tenant)

  // Determine the best component set based on vertical
  let resolvedType = pages[vertical] ? vertical : (pages[brokerType] ? brokerType : 'broker_ayam')
  
  const componentSet = pages[resolvedType] || pages.broker_ayam
  const component = componentSet[page]
  
  if (!component) {
    return <Navigate to={`/broker/${brokerType}/beranda`} replace />
  }
  
  return component
}
