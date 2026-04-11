/**
 * usePeternakPermissions
 * ──────────────────────────────────────────────────────────────────────────────
 * Centralised permission matrix for the Peternak vertical.
 *
 * Roles (stored in profiles.role):
 *   owner      → pemilik kandang, akses penuh
 *   manajer    → manajer kandang, bisa semua kecuali hapus & setting bisnis
 *   staff      → pekerja / anak kandang, input harian & vaksinasi saja
 *   view_only  → investor / mitra silent, lihat saja (kecuali keuangan)
 *
 * Usage:
 *   const p = usePeternakPermissions()
 *   if (!p.canBuatSiklus) return null
 *   <button disabled={!p.canInputHarian}>Input</button>
 */

import { useAuth } from '@/lib/hooks/useAuth'

/**
 * Pure helper — pass role string, get permission object.
 * Useful outside React (e.g. server-side checks, tests).
 */
export function peternakPermissions(role) {
  const isOwner    = role === 'owner' || role === 'superadmin'
  const isManajer  = role === 'manajer'
  const isStaff    = role === 'staff'        // = Pekerja / Anak Kandang
  const isViewOnly = role === 'view_only'

  // Shorthand sets
  const ownerOrMgr    = isOwner || isManajer
  const canWrite      = isOwner || isManajer || isStaff  // anyone but view_only
  const canWriteData  = isOwner || isManajer             // financial / structural writes

  return {
    role,

    // ── NAVIGATION VISIBILITY ─────────────────────────────────────────────
    canViewBeranda:    true,
    canViewSiklus:     !isStaff,           // Pekerja tidak butuh daftar siklus
    canViewLaporan:    !isStaff,           // Pekerja tidak akses analitik
    canViewKeuangan:   ownerOrMgr,         // HPP / R/C / BEP hanya owner & manajer
    canViewVaksinasi:  true,
    canViewPakan:      !isViewOnly,        // View only tidak perlu stok pakan
    canViewAnakKandang: ownerOrMgr,
    canViewTim:        isOwner,
    canViewAkun:       true,

    // ── INPUT HARIAN ──────────────────────────────────────────────────────
    canInputHarian:         canWrite,      // owner | manajer | staff
    canEditHarianRecent:    canWrite,      // edit hari yg sama (<24 jam)
    canEditHarianOld:       ownerOrMgr,   // edit data lama (>24 jam)
    canDeleteHarian:        isOwner,

    // ── SIKLUS ───────────────────────────────────────────────────────────
    canBuatSiklus:    ownerOrMgr,
    canTutupSiklus:   ownerOrMgr,
    canHapusSiklus:   isOwner,

    // ── KANDANG ──────────────────────────────────────────────────────────
    canTambahKandang: isOwner,
    canEditKandang:   ownerOrMgr,
    canHapusKandang:  isOwner,

    // ── KEUANGAN / BIAYA ─────────────────────────────────────────────────
    canInputBiaya:    ownerOrMgr,
    canHapusBiaya:    isOwner,

    // ── VAKSINASI ────────────────────────────────────────────────────────
    canCatatVaksinasi: canWrite,
    canHapusVaksinasi: isOwner,

    // ── TIM ──────────────────────────────────────────────────────────────
    canUndangAnggota:   isOwner,
    canHapusAnggota:    isOwner,
    canGantiRoleAnggota: isOwner,

    // ── SETTINGS ─────────────────────────────────────────────────────────
    canEditSettings: isOwner,

    // ── FAB (tombol input cepat di bottom nav) ───────────────────────────
    showFab: canWrite,
  }
}

/** React hook — reads role from auth context */
export default function usePeternakPermissions() {
  const { profile } = useAuth()
  return peternakPermissions(profile?.role ?? 'view_only')
}

// ── Label helpers ─────────────────────────────────────────────────────────────

export const PETERNAK_ROLE_LABELS = {
  owner:     'Owner',
  manajer:   'Manajer',
  staff:     'Pekerja',
  view_only: 'Lihat Saja',
}

export const PETERNAK_ROLE_BADGE = {
  owner:     { label: 'Owner',      cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  manajer:   { label: 'Manajer',    cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20'         },
  staff:     { label: 'Pekerja',    cls: 'bg-violet-500/10 text-violet-400 border-violet-500/20'   },
  view_only: { label: 'Lihat Saja', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20'      },
}

/** Role options shown in invite sheet (peternak context) */
export const PETERNAK_INVITE_ROLES = [
  {
    value: 'manajer',
    label: 'Manajer',
    desc:  'Kelola siklus, input harian, pakan, vaksinasi & laporan. Tidak bisa hapus data atau undang anggota.',
  },
  {
    value: 'staff',
    label: 'Pekerja (Anak Kandang)',
    desc:  'Input harian & catat vaksinasi saja. Tidak bisa buat/tutup siklus atau lihat keuangan.',
  },
  {
    value: 'view_only',
    label: 'Lihat Saja',
    desc:  'Hanya melihat data dan laporan analitik. Tidak ada akses edit atau keuangan.',
  },
]
