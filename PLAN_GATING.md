# Plan Gating — TernakOS

Dokumen ini menjelaskan arsitektur plan gating, fitur per tier, dan cara menambah/mengubah gating baru.

---

## Arsitektur

```
Limit source (runtime):  Supabase plan_configs WHERE config_key = 'transaction_quota'
                         value: { "starter": 30 }
                         → diubah via AdminPricing UI, langsung aktif tanpa deploy

Frontend check:          hooks/use*TransactionQuota.js  (quota banner + button disable)
                         getSubscriptionStatus()         (upgrade wall / feature block)

Server-side check:       PostgreSQL BEFORE INSERT trigger (enforce_rpa_invoice_quota)
                         → hanya rpa_invoices saat ini

Fallback (no DB row):    FALLBACK_TRANSACTION_QUOTA = 30
                         Defined in: src/lib/constants/planGating.js

isStarter pattern:       sub.plan === 'starter' && sub.status !== 'trial'
                         Trial users always get Pro-equivalent access.
```

---

## Fitur per Tier — RPA (Rumah Potong Ayam)

| Fitur | Starter | Pro | Business |
|---|---|---|---|
| Beranda | ✅ Full | ✅ Full | ✅ Full |
| Order (purchase ke broker) | ✅ Unlimited | ✅ Unlimited | ✅ Unlimited |
| Hutang (pembayaran ke broker) | ✅ Full | ✅ Full | ✅ Full |
| Distribusi — buat invoice | ✅ Max 30/bulan | ✅ Unlimited | ✅ Unlimited |
| Distribusi — cetak/export PDF | ❌ (auto-gate via InvoicePreviewModal) | ✅ | ✅ |
| Laporan Margin & HPP | ❌ Upgrade wall | ✅ Full | ✅ Full |

**Gate mechanism per fitur:**

| Fitur | Sidebar lock | In-page | DB trigger |
|---|---|---|---|
| Laporan | `planRequired: 'pro'` | Upgrade wall (full page) | — |
| Distribusi quota | — | Banner + button disable | `trg_rpa_invoice_quota` |
| Distribusi PDF | — | InvoicePreviewModal `isStarter` | — |

---

## Fitur per Tier — Broker Ayam (Poultry Broker)

| Fitur | Starter | Pro | Business |
|---|---|---|---|
| Transaksi | ✅ Max 30/bulan | ✅ Unlimited | ✅ Unlimited |
| Tim & Akses | ❌ Owner only | ✅ Max 3 anggota | ✅ Unlimited |
| Armada | ✅ Max 1 kendaraan + 1 sopir | ✅ Unlimited | ✅ Unlimited |
| Cash Flow | ❌ | ✅ | ✅ + PDF/Excel export |
| Simulator Margin | ❌ | ✅ | ✅ |

---

## Fitur per Tier — Sembako Broker

| Fitur | Starter | Pro | Business |
|---|---|---|---|
| Penjualan / Invoice | ✅ Max 30/bulan | ✅ Unlimited | ✅ Unlimited |
| Penjualan PDF | ❌ | ✅ | ✅ |
| Tim | ❌ Owner only | ✅ | ✅ |
| Karyawan / Pegawai | ❌ | ✅ | ✅ |
| Laporan | ❌ | ✅ | ✅ |

---

## Cara Menambah Fitur Baru ke Gating

### A. Sidebar lock only (fitur yang tidak bisa diakses langsung via URL)

1. Tambah `planRequired: 'pro'` (atau `'business'`) ke nav item di `AppSidebar.jsx`
2. Renderer di baris ~633 sudah menangani tooltip + opacity 40%

### B. In-page upgrade wall (halaman yang bisa diakses langsung via URL)

```jsx
// Di komponen halaman:
import { useAuth } from '@/lib/hooks/useAuth'
import { getSubscriptionStatus } from '@/lib/subscriptionUtils'
import { Link } from 'react-router-dom'
import { Lock, YourIcon } from 'lucide-react'

const { tenant } = useAuth()
const sub = getSubscriptionStatus(tenant)
const isStarter = sub.plan === 'starter' && sub.status !== 'trial'

if (isStarter) {
  return (
    <div> {/* bg sesuai vertical */}
      {/* Header tetap ada — back button harus berfungsi */}
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-8">
        <YourIcon size={30} /> {/* icon relevan */}
        <span>Fitur Pro</span> {/* badge */}
        <h2>Nama Fitur</h2>
        <p>Deskripsi singkat mengapa ini Pro</p>
        <Link to="/upgrade">Upgrade ke Pro</Link>
      </div>
    </div>
  )
}
```

Warna accent per vertical:
- Poultry broker: `#10B981` (emerald)
- Sembako broker: `#EA580C` (orange)
- RPA: `#F59E0B` (amber)

### C. Quota banner + button disable

1. Buat hook baru `use{Vertical}TransactionQuota` — clone dari `useRPATransactionQuota.js`, ganti nama tabel
2. Tambah import + `const quota = useHook(tenant)` di komponen
3. Pasang banner sebelum list, disabled pada tombol create
4. Referensi: `Distribusi.jsx` (RPA), `Penjualan.jsx` (sembako), `Transaksi.jsx` (poultry)

### D. DB-level enforcement (untuk bypass via direct API)

Buat migration SQL yang mirror `20260416_rpa_invoice_quota_trigger.sql`:
1. Function `enforce_{vertical}_quota()` — BEFORE INSERT trigger function
2. Read limit dari `plan_configs WHERE config_key = 'transaction_quota'`
3. Check `tenants.plan = 'starter'` AND `NOT rpa_tenant_in_trial(tenant_id)`
4. `RAISE EXCEPTION 'QUOTA_EXCEEDED|{table}|starter|{limit}|{used}'`
5. Parse error message di `onError` di hook mutation — format pipe-delimited sudah ada

---

## Cara Update Limit Quota

**Normal path** (direkomendasikan):
1. Login sebagai superadmin
2. Buka AdminPricing → tab "Konfigurasi"
3. Edit "Kuota Transaksi / Bulan" untuk Starter → Simpan
4. Perubahan langsung aktif untuk semua vertikal (frontend hook + DB trigger baca live)

**Jika plan_configs row hilang** (emergency):
- Frontend fallback: `FALLBACK_TRANSACTION_QUOTA` di `src/lib/constants/planGating.js`
- DB trigger fallback: hardcoded `30` di `enforce_rpa_invoice_quota()` (baris `COALESCE(..., 30)`)
- Kedua fallback harus selalu sama nilainya

---

## RPH — Placeholder

RPH (Rumah Potong Hewan) berbagi `business_vertical = 'rumah_potong'` dengan RPA.
Plan gating dibedakan via `profile.sub_type`:
- `rpa` → RPA gating berlaku
- `rph` → belum ada gating, semua akses penuh (placeholder)

Saat RPH dibangun:
1. Isi `RPH_PLAN_CONFIG` di `src/lib/constants/planGating.js`
2. Ikuti checklist TODO di `src/dashboard/rumah_potong/rph/RPHBeranda.jsx`
3. Tambah pricing row `role: 'rph'` ke `pricing_plans` table

---

## File yang Relevan

| File | Peran |
|---|---|
| `src/lib/constants/planGating.js` | Config & dokumentasi fitur per tier per vertical |
| `src/lib/subscriptionUtils.js` | `getSubscriptionStatus()` — satu-satunya tempat logic status subscription |
| `src/lib/hooks/useTransactionQuota.js` | Quota check poultry broker (`sales` table) |
| `src/lib/hooks/useSembakoTransactionQuota.js` | Quota check sembako (`sembako_sales` table) |
| `src/lib/hooks/useRPATransactionQuota.js` | Quota check RPA (`rpa_invoices` table) |
| `src/dashboard/_shared/components/AppSidebar.jsx` | `planRequired` di nav items, `isPlanLocked` renderer |
| `supabase/migrations/20260416_rpa_invoice_quota_trigger.sql` | DB trigger enforcement untuk RPA |
