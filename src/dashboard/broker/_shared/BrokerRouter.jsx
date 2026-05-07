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
import Akun from '../poultry_broker/Akun'
import RPADetail from '../poultry_broker/RPADetail'
import SopirDashboard from '../poultry_broker/SopirDashboard'
import PoultryTimManajemenPage from '../poultry_broker/TimManajemenPage'
import TelurTimManajemenPage from '../egg_broker/TimManajemenPage'
import BrokerAyamTutorial from '../poultry_broker/BrokerAyamTutorial'
import BrokerTelurTutorial from '../egg_broker/BrokerTelurTutorial'
import SembakoTutorial from '../sembako_broker/SembakoTutorial'
import WelcomeOnlyOverlay from '@/dashboard/_shared/components/WelcomeOnlyOverlay'

// Sembako pages
import SembakoBeranda from '../sembako_broker/Beranda'
import SembakoPenjualan from '../sembako_broker/Penjualan'
// import SembakoPegawai from '../sembako_broker/Pegawai'
import SembakoLaporan from '../sembako_broker/Laporan'
import SembakoProduk from '../sembako_broker/Produk'
import SembakoGudang from '../sembako_broker/Gudang'
import SembakoTokoSupplier from '../sembako_broker/TokoSupplier'
import SembakoTokoSupplierDetail from '../sembako_broker/TokoSupplierDetail'
import SembakoPengiriman from '../sembako_broker/Pengiriman'
import SembakoAkun from '../sembako_broker/Akun'
import SembakoTimManajemenPage from '../sembako_broker/TimManajemenPage'

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
      tim: <PoultryTimManajemenPage />,
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
      tim: <PoultryTimManajemenPage />,
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
      tim: <TelurTimManajemenPage />
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
      karyawan: <SembakoTimManajemenPage />,
      laporan: <SembakoLaporan />,
      akun: <SembakoAkun />,
      tim: <SembakoTimManajemenPage />
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

  if (page === 'beranda') {
    const isPoultry = resolvedType === 'broker_ayam' || resolvedType === 'distributor_daging' || resolvedType === 'poultry_broker'
    const isTelur   = resolvedType === 'broker_telur'
    const isSembako = resolvedType === 'distributor_sembako' || resolvedType === 'sembako_broker'
    const accent    = isPoultry ? '#0EA5E9' : isTelur ? '#F59E0B' : '#EA580C'
    const accentDim = isPoultry ? 'rgba(14,165,233,0.12)' : isTelur ? 'rgba(245,158,11,0.12)' : 'rgba(234,88,12,0.12)'
    return (
      <>
        {component}
        {isPoultry && <BrokerAyamTutorial />}
        {isTelur   && <BrokerTelurTutorial />}
        {isSembako && <SembakoTutorial />}
        <WelcomeOnlyOverlay accent={accent} accentDim={accentDim} />
      </>
    )
  }

  return component
}
