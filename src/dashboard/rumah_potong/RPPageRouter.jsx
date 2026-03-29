import React from 'react'
import { useParams } from 'react-router-dom'

// RPA pages (dari folder rpa/ yang sudah dipindah)
import RPABeranda from './rpa/Beranda'
import RPAOrder from './rpa/Order'
import RPAHutang from './rpa/Hutang'
import RPADistribusi from './rpa/Distribusi'
import RPADistribusiDetail from './rpa/DistribusiDetail'
import RPALaporanMargin from './rpa/LaporanMargin'
import RPAAkun from './rpa/Akun'

// RPH pages (placeholder)
import RPHBeranda from './rph/RPHBeranda'

export function RPPageRouter({ page }) {
  const { rpType } = useParams()
  
  const pages = {
    rpa: {
      beranda:      <RPABeranda />,
      order:        <RPAOrder />,
      hutang:       <RPAHutang />,
      distribusi:   <RPADistribusi />,
      'distribusi-detail': <RPADistribusiDetail />,
      laporan:      <RPALaporanMargin />,
      akun:         <RPAAkun />,
    },
    rph: {
      beranda: <RPHBeranda />,
    }
  }
  
  return pages[rpType]?.[page] 
    ?? <div className="p-8 text-[#94A3B8]">Halaman tidak ditemukan</div>
}
