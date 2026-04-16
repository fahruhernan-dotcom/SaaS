import React from 'react'

// TODO(RPH): Plan gating untuk RPH belum diimplementasi karena modul masih placeholder.
// Ketika RPH pages dibangun:
//  1. Import useAuth + getSubscriptionStatus untuk cek plan
//  2. Tambah planRequired ke nav items di AppSidebar (sub_type?.startsWith('rph') branch)
//  3. Tambah in-page upgrade wall ke halaman yang Pro-only
//  4. Lihat RPH_PLAN_CONFIG di src/lib/constants/planGating.js untuk struktur yang harus diisi
//  5. RPH share business_vertical 'rumah_potong' dengan RPA — gating per sub_type, bukan vertical
export default function RPHBeranda() {
  return (
    <div className="p-8 text-[#94A3B8]">
      RPH Dashboard — Coming Soon
    </div>
  )
}
