> File ini bagian dari docs/db/ split. Lihat 00_INDEX.md untuk navigasi lengkap.
> Last updated: 2026-05-06 — DB Audit v3 Sync
>
> 🤖 **AI: Baca file ini sebelum modifikasi storage bucket atau upload policy.**

# 📦 05 — Storage & Buckets

Dokumen ini mendeskripsikan konfigurasi bucket Supabase Storage yang digunakan TernakOS.

---

## 🪣 DAFTAR BUCKET

Saat ini TernakOS menggunakan bucket berikut untuk menyimpan file yang diunggah pengguna:

### 1. `avatars`
- **Kegunaan**: Menyimpan foto profil pengguna.
- **Akses Publik**: Ya. Profil pengguna bisa diakses/dilihat URL-nya secara publik untuk memudahkan penampilan di UI (tanpa signed URL yang berdurasi terbatas).
- **Format yang Diizinkan**: `image/jpeg`, `image/png`, `image/webp`.

### 2. `payment_proofs`
- **Kegunaan**: Menyimpan bukti transfer manual untuk tagihan berlangganan (`subscription_invoices`).
- **Akses Publik**: Tidak. Hanya dapat diakses oleh user dalam tenant yang sama atau superadmin.

### 3. `vehicle_documents` (Planned)
- **Kegunaan**: Menyimpan foto STNK, BPKB, KIR, atau asuransi armada.
- **Akses Publik**: Tidak. Akses ketat berdasar RLS tenant.

---

## 🛡️ STORAGE POLICIES (RLS on Storage)

Storage di Supabase mengandalkan RLS pada tabel `storage.objects`. Aturan yang diterapkan harus mengaitkan kepemilikan file dengan `auth.uid()` atau relasi ke tabel `profiles`.

### Contoh Policy Umum untuk Upload (Private)

User hanya boleh meng-upload file ke folder spesifik yang menjadi miliknya (berdasarkan `tenant_id` atau `user_id` di dalam path folder).

```sql
-- Contoh policy upload ke folder tenant
CREATE POLICY "Tenant members can upload to their folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'payment_proofs' AND
  (storage.foldername(name))[1] IN (
    SELECT tenant_id::text 
    FROM public.profiles 
    WHERE auth_user_id = auth.uid()
  )
);
```

### Konvensi Penamaan Path File

Untuk bucket non-publik, susunan path harus menyertakan `tenant_id` sebagai folder utama agar RLS dapat ditegakkan dengan mudah menggunakan fungsi `storage.foldername()`.

Format:
`[nama-bucket]/[tenant_id]/[kategori]/[nama_file_acak].[ext]`

Contoh:
`payment_proofs/a1b2c3d4-e5f6-7890-1234-56789abcdef0/invoice_IN-2026-001/proof_8x9.jpg`

---

## 🗑️ PENGHAPUSAN FILE (Lifecycle)

Sistem belum mengimplementasikan _hard-delete_ otomatis untuk file di storage saat data row (misal: invoice) di-soft-delete (`is_deleted = true`).
Pembersihan storage berlebih harus dilakukan secara berkala melalui fungsi admin atau background job jika diperlukan ke depannya.
