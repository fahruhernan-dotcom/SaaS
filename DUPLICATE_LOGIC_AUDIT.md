# DUPLICATE_LOGIC_AUDIT.md — TernakOS Duplicate Logic Audit

> Dibuat: 2026-05-16
> Tujuan: Identifikasi logic yang tersebar/duplikat — bukan untuk langsung refactor, hanya mapping untuk rencana konsolidasi.

---

## 1. ROLE DETECTION — STATUS: TERKONSOLIDASI (tapi ada legacy path)

### Implementasi Aktual

Sistem RBAC sudah cukup terkonsolidasi di `src/lib/auth/`:

```
src/lib/auth/
├── constants.js      → APP_ROLES, BUSINESS_ROLES, USER_TYPES
├── app-roles.js      → isSuperadmin(), isUser()
├── business-roles.js → isOwner(), isManager(), isStaff(), isViewOnly()
├── capabilities.js   → canManageSales(), canViewFinance(), dll
├── guards.jsx        → RequireSuperadmin, RequireOwner, RequireCapability
└── index.js          → barrel export
```

### Masalah yang Ditemukan

**A. Dual-mode isSuperadmin() — Migrasi Belum Selesai**

```javascript
// src/lib/auth/app-roles.js
export const isSuperadmin = (profile) =>
  profile?.app_role === 'superadmin'
  || profile?.role === 'superadmin'       // Legacy field
  || profile?.user_type === 'superadmin'  // Legacy field
```

3 field dicek secara bersamaan untuk backward compatibility. Komentar di kode mengatakan "Remove in Phase 5". Ini adalah **technical debt** — bukan duplikat file, tapi duplikat logic dalam satu fungsi.

**B. isOwner() dipakai langsung di beberapa komponen besar**

```javascript
// src/dashboard/_shared/components/BottomNav.jsx
import { isSuperadmin, isOwner, isStaff, isViewOnly } from '@/lib/auth'
// ... dan juga peternakPermissions() untuk peternak

// src/dashboard/_shared/components/AppSidebar.jsx
import { isSuperadmin, isOwner, isManager, isStaff, isViewOnly } from '@/lib/auth'
```

Ini **sudah benar** — pakai centralised functions. Tidak ada duplikat implementasi.

**C. peternakPermissions() tidak ada di auth/ — ada di hook terpisah**

```javascript
// src/lib/hooks/usePeternakPermissions.js
export function peternakPermissions(role) {
  return {
    showFab: ...,
    canViewSiklus: ...,
    canViewBeranda: ...,
    canViewAkun: ...,
    // dll
  }
}
```

Fungsi ini dipakai di `BottomNav.jsx` sebagai `peternakPermissions(profile.role)`. Fungsinya **terpisah** dari `src/lib/auth/capabilities.js`. Ada potensi overlap dengan `capabilities.js` tapi berbeda konteks (permission untuk UI peternak vs capability umum).

**Rekomendasi:** Tidak perlu merge sekarang, tapi catat bahwa `usePeternakPermissions.js` bisa dijadikan bagian dari `capabilities.js` di masa depan.

---

## 2. VERTICAL / BUSINESS MODEL DETECTION — STATUS: BAIK

### Implementasi Aktual

Sudah terkonsolidasi di satu tempat:

```javascript
// src/lib/businessModel.js
export function resolveBusinessVertical(profile, tenant) { ... }
export function getBusinessModel(userType, subType) { ... }  // COMPAT
export const getXBasePath = (tenant, profile) => { ... }
export const BUSINESS_MODELS = { ... }
export const VERTICAL_ALIASES = { ... }
export const SUB_TYPE_TO_VERTICAL = VERTICAL_ALIASES  // COMPAT alias
```

**Tidak ada duplikat** — semua komponen import dari `businessModel.js`.

**Catatan:** `getBusinessModel()` dan `SUB_TYPE_TO_VERTICAL` adalah alias compat, bukan duplikat baru.

**Satu inkonsistensi minor:** Di `BottomNav.jsx` ada local helper `isPeternakDombaFattening()` yang cek vertical secara manual alih-alih menggunakan `resolveBusinessVertical`. Ini bisa disederhanakan, tapi bukan prioritas.

---

## 3. TENANT / BUSINESS RESOLVER — STATUS: BAIK

### Implementasi Aktual

Tenant resolution terpusat di `useAuth.jsx`:

```javascript
// src/lib/hooks/useAuth.jsx
const { user, profile, profiles, tenant, ownerTenant, switchTenant } = useAuth()
```

Semua komponen mendapatkan `tenant` dari `useAuth()` — tidak ada duplikat resolver.

**Satu potensi masalah:** `getBrokerBasePath(tenant)` tersedia di `useAuth.jsx` sebagai export terpisah. Ini dipakai di `BottomNav.jsx` dan `FormJualModal.jsx`. Jika ada komponen yang masih melakukan kalkulasi base path secara manual (tanpa `getBrokerBasePath`), itu adalah duplikat tersembunyi.

---

## 4. DASHBOARD SELECTOR — STATUS: BAIK

### Implementasi Aktual

Tidak ada "dashboard selector" terpisah. Routing sudah handle ini:

- `RoleRedirector` → `getVerticalBeranda(tenant, profile)` → navigasi otomatis
- `BrokerPageRouter`, `PeternakPageRouter`, `RPPageRouter` → dispatch berdasarkan URL param (brokerType/peternakType)

Tidak ada duplikat logic di sini.

---

## 5. NAVIGATION / MENU CONFIG — STATUS: ADA DUPLIKAT MINOR

### Masalah: Nav paths hardcoded di beberapa tempat

**A. `drawerMenu` paths di businessModel.js menggunakan path literal:**

```javascript
// businessModel.js
drawerMenu: [
  { path: '/broker/broker_ayam/pengiriman', icon: 'Truck', label: 'Pengiriman & Loss' },
  { path: '/broker/broker_ayam/cashflow',   icon: 'Wallet', label: 'Cash Flow' },
  // ...
]
```

Jika `broker_ayam` berubah, path harus diupdate manual di seluruh `drawerMenu`. BottomNav sudah mengatasi ini dengan `createNav()` helper + dynamic path replacement — tapi `drawerMenu` belum.

**B. Speed Dial items di BottomNav.jsx hardcoded:**

```javascript
// src/dashboard/_shared/components/BottomNav.jsx
const DOMBA_BASE = '/peternak/peternak_domba_penggemukan'
const dombaSpeedItems = isDombaFattening ? [
  { label: 'Timbang Ternak', onClick: () => navigate(`${DOMBA_BASE}/ternak`) },
  // ...
]
```

Ini hardcoded untuk Domba Fattening saja. Jika Kambing Fattening atau Sapi juga perlu Speed Dial, logiknya harus diulang.

**Rekomendasi future:** Pindahkan `speedDialItems` ke `BUSINESS_MODELS` config di `businessModel.js` (sama seperti `bottomNav` dan `drawerMenu`).

---

## 6. PERMISSION LOGIC — STATUS: ADA OVERLAP MINOR

### Overlap: capabilities.js vs usePeternakPermissions.js

| Fungsi | File | Dipakai Di |
|--------|------|-----------|
| `canManageSales()` | `auth/capabilities.js` | Sembako/Broker pages |
| `canManageInventory()` | `auth/capabilities.js` | Gudang pages |
| `peternakPermissions().showFab` | `usePeternakPermissions.js` | BottomNav.jsx |
| `peternakPermissions().canViewSiklus` | `usePeternakPermissions.js` | BottomNav.jsx |

Keduanya berbeda scope (general capability vs peternak-specific UI permissions). Tidak perlu merge sekarang.

---

## 7. FORMATTING — STATUS: BAIK (tapi perlu konfirmasi)

### Implementasi Aktual

Formatter terpusat di `src/lib/format.js`:

```javascript
// src/lib/format.js (diasumsikan — perlu konfirmasi isi)
export const formatIDR = (amount) => ...
export const formatWeight = (weight, unit) => ...
export const safeNum = (val) => ...
```

Diimport di banyak tempat via `@/lib/format`. Tidak ada duplikat formatter yang ditemukan.

**Perlu cek:** Apakah ada file yang masih mendefinisikan formatter inline? Contoh: `Intl.NumberFormat('id-ID', ...).format(amount)` secara langsung tanpa `formatIDR`.

---

## 8. SUPABASE QUERY PATTERNS — STATUS: ADA PENGULANGAN (NORMAL)

### Pattern yang Berulang

Ini adalah pengulangan yang **normal** dalam React Query, bukan masalah arsitektur:

```javascript
// Pattern ini berulang di setiap hook:
const { data, isLoading, error } = useQuery({
  queryKey: ['...', tenant_id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('...')
      .select('...')
      .eq('tenant_id', tenant_id)
    if (error) throw error
    return data
  },
  enabled: !!tenant_id
})
```

**Tidak ada action item** — ini adalah normal pattern untuk React Query. Setiap hook punya query key dan queryFn yang spesifik.

**Exception:** Error handling. Beberapa hook mungkin handle error berbeda-beda. Perlu audit apakah `supabaseErrorHandler.js` dipakai konsisten atau ada yang inline try/catch.

---

## 9. FORM MODAL — STATUS: ADA DUPLIKAT SIGNIFIKAN

### Tiga Implementasi FormBayarModal

| File | Ukuran | UI Library | Dipakai Oleh |
|------|--------|-----------|--------------|
| `_shared/forms/FormBayarModal.jsx` | 135 baris | Inline CSS + SlideModal | `RPA.jsx` |
| `_shared/components/forms/FormBayarModal.jsx` | 149 baris | Shadcn Sheet | `Transaksi.jsx`, `SaleAuditSheet.jsx` |

Keduanya punya logic yang berbeda:
- Versi `forms/`: FIFO payment allocation, update payment_status
- Versi `components/forms/`: Insert ke tabel `payments` terpisah, update `sales`

**Ini bukan duplikat sederhana** — keduanya melakukan operasi yang berbeda pada tabel yang berbeda. Perlu analisis bisnis sebelum merge.

### Dua Implementasi FormBeliModal dan FormJualModal

| File | Ukuran | Status |
|------|--------|--------|
| `_shared/forms/FormBeliModal.jsx` | 199 baris | Tidak diimport |
| `_shared/components/FormBeliModal.jsx` | 391 baris | Aktif (diimport di Beranda.jsx) |
| `_shared/forms/FormJualModal.jsx` | 240 baris | Tidak diimport |
| `_shared/components/FormJualModal.jsx` | 322 baris | Aktif (diimport di Beranda.jsx) |

Versi di `components/` lebih lengkap (lebih besar, Shadcn UI). Versi di `forms/` lebih kecil (inline CSS, SlideModal).

**Kemungkinan:** Versi `forms/` adalah versi lama yang tidak pernah dihapus setelah digantikan oleh versi `components/`.

---

## 10. MOBILE PRIMITIVES — STATUS: PERLU INVESTIGASI

| File | Keterangan |
|------|------------|
| `src/dashboard/broker/_shared/components/MobilePrimitives.jsx` | Broker-specific mobile UI |
| `src/dashboard/peternak/_shared/components/MobilePrimitives.jsx` | Peternak-specific mobile UI |

Apakah isinya identik atau berbeda? Perlu cek manual. Jika sama, kandidat untuk merge ke `dashboard/_shared/components/MobilePrimitives.jsx`.

---

## 11. AI CHATBUBBLE — STATUS: PERLU INVESTIGASI

| File | Import Status |
|------|--------------|
| `src/dashboard/broker/ai/AIChatBubble.jsx` | Diimport oleh `BrokerLayout.jsx` |
| `src/dashboard/peternak/ai/AIChatBubble.jsx` | 0 import ditemukan |

Perlu cek apakah kedua file memiliki konten yang berbeda, atau apakah `peternak/ai/AIChatBubble.jsx` adalah versi lama yang sudah tidak dipakai setelah dipindah ke shared.

---

## REKOMENDASI FILE PUSAT (FUTURE STATE)

Jika ada roadmap konsolidasi, berikut file pusat yang disarankan:

| Area | File Pusat | Status Sekarang |
|------|-----------|-----------------|
| Role check | `src/lib/auth/` (sudah ada) | ✅ Sudah baik |
| Vertical detection | `src/lib/businessModel.js` (sudah ada) | ✅ Sudah baik |
| Formatter | `src/lib/format.js` (sudah ada) | ✅ Perlu konfirmasi tidak ada inline dupe |
| Nav config | `src/lib/businessModel.js` (sudah ada, `bottomNav` + `drawerMenu`) | ⚠️ `drawerMenu` path masih hardcoded |
| Speed dial items | Belum ada — tersebar di BottomNav.jsx | 🔴 Kandidat konsolidasi |
| Peternak permissions | `src/lib/hooks/usePeternakPermissions.js` | ⚠️ Bisa masuk capabilities.js |
| Mobile primitives | Belum ada — duplikat di broker/ + peternak/ | 🔴 Kandidat merge |
| Form modal (bayar) | Belum ada unified versi | 🔴 Perlu analisis bisnis |
