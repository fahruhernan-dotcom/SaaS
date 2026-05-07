> File ini bagian dari docs/db/ split. Lihat 00_INDEX.md untuk navigasi lengkap.
> Last updated: 2026-05-06 — DB Audit v3 Sync
>
> 🤖 **AI: Baca file ini sebelum modifikasi auth flow, invite system, atau role-based logic.**

# 🔑 04 — Auth System & Invitations

Dokumen ini menjelaskan alur autentikasi, manajemen session, dan sistem undangan tim (Team Invitations) di TernakOS.

---

## 🪪 AUTHENTICATION (Supabase Auth)

TernakOS menggunakan Supabase Auth (GoTrue) untuk autentikasi.

- **Tabel Sentral**: `auth.users` (Dikelola otomatis oleh Supabase).
- **Penyimpanan Session**: JWT disimpan secara lokal (localStorage/sessionStorage via Supabase SDK).
- **Relasi ke Data Bisnis**:
  - `auth.users.id` berelasi 1-ke-banyak dengan `public.profiles`.
  - Artinya, satu user login bisa memiliki akses ke beberapa Tenant (bisnis) yang berbeda.

### Alur Register / Login

1. User melakukan signup/login via Email/Password atau OAuth.
2. Supabase membuat record di `auth.users`.
3. Trigger database `handle_new_user()` dipanggil.
4. Tergantung metadata (`invite_token`), sistem akan:
   - Memasukkan user ke tenant yang sudah ada (jika diundang).
   - Membentuk tenant baru + profile baru (jika daftar mandiri).

---

## 🎫 SISTEM UNDANGAN TIM (Team Invitations)

Sistem undangan tim dirancang untuk menghindari eksploitasi dan kebocoran email.

### Struktur Tabel `team_invitations`
- `tenant_id`: Bisnis mana yang mengundang.
- `invited_by`: Profil siapa yang membuat undangan.
- `role`: Peran yang diberikan (e.g., `'staff'`, `'sopir'`).
- `token`: 6 digit kode random uppercase (atau 32-byte hex, sesuai revisi terbaru).
- `status`: `'pending'`, `'accepted'`, `'expired'`.
- `expires_at`: Waktu kadaluarsa (default 7 hari).

⚠️ **Penting**: Kolom `email` **NULLABLE** dan tidak wajib diisi. Alur undangan saat ini tidak mengirim email langsung, melainkan membagikan kode secara manual (via WhatsApp/lainnya).

### Flow Pembuatan Undangan (Tim.jsx)
1. Owner mengklik "Generate Kode Undangan".
2. Frontend men-generate kode (e.g., 6 karakter uppercase).
3. Insert ke `team_invitations` dengan status `'pending'` dan `expires_at = now() + 7 hari`.

### Flow Penerimaan Undangan (AcceptInvite.jsx)
1. User (baru/lama) memasukkan kode di halaman `/invite`.
2. **JANGAN QUERY LANGSUNG KE TABEL!**
3. Frontend memanggil Edge Function:
   ```javascript
   supabase.functions.invoke('verify-invite-code', { body: { code } })
   ```
4. Edge Function memproses rate-limiting, validasi kode, kadaluarsa, dan status.
5. Jika sukses (HTTP 200), Edge Function mengembalikan data undangan.
6. User yang belum punya akun melakukan pendaftaran. Frontend mengirim `invite_token` melalui user metadata:
   ```javascript
   supabase.auth.signUp({
     options: { data: { invite_token: 'KODE_TERSEBUT', full_name: 'Nama User' } }
   })
   ```
7. Trigger `handle_new_user()` memproses penambahan profil ke tenant sesuai undangan.

---

## 🛑 EDGE FUNCTION: `verify-invite-code`

Untuk mengamankan endpoint undangan dari brute-force, digunakan Edge Function dengan implementasi Rate Limit In-Memory.

### Spesifikasi Rate Limit
| Parameter | Aturan |
|-----------|--------|
| **Max Attempts** | 5 percobaan per IP per window |
| **Window** | 15 menit |
| **Lockout Duration** | 30 menit (jika melebihi batas) |
| **Reset on Success**| Ya (counter di-reset jika kode valid dimasukkan) |

### Penanganan HTTP Response
- `200`: Kode valid. Lanjutkan ke pendaftaran/login.
- `400`: Format kode salah.
- `404`: Kode tidak ditemukan atau sudah tidak `'pending'`.
- `410`: Kode sudah expired (`expires_at` terlewati).
- `429`: Terlalu banyak percobaan. UI harus mengunci input.

---

## 🔐 RBAC (Role-Based Access Control)

Di dalam aplikasi, kontrol akses diatur berdasarkan nilai kolom `role` pada tabel `profiles`.

### Role Definitions
- **`owner`**: Akses penuh ke seluruh fitur tenant.
- **`staff`**: Akses operasional harian (Transaksi, Kandang, Pengiriman), tidak bisa melihat Dashboard Keuangan/Cashflow, tidak bisa mengatur Tim.
- **`view_only`**: Hanya bisa membaca data, tidak bisa merubah.
- **`sopir`**: Hanya bisa mengakses modul Pengiriman (dan hanya pengiriman yang ditugaskan kepadanya).
- **`anak_buah`**: (Planned) Hanya bisa melihat tugas (Tasks) harian kandang.
- **`superadmin`**: Akses bypass ke semua sistem (role internal TernakOS).

### Frontend Implementation
- Proteksi route dilakukan menggunakan komponen `<RoleGuard>` di React.
- Komponen ini menerima properti `allowedRoles={['owner', 'staff']}`.
