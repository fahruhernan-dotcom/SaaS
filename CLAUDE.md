# TernakOS — Claude Code Instructions

## DATABASE SCHEMA — WAJIB BACA INI DULU

**JANGAN baca `supabase/schema.sql` untuk memahami struktur DB.**
File tersebut sudah tidak sinkron dengan database aktual di Supabase.

**SELALU baca `DATABASE_STRUCTURE.md`** sebagai sumber kebenaran schema DB.
File ini di-maintain manual dan mencerminkan state DB aktual termasuk semua migration yang sudah diapply.

Sebelum menulis query SQL, migration, atau kode yang menyentuh tabel/kolom:
1. Baca `DATABASE_STRUCTURE.md` dulu
2. Jika perlu konfirmasi state aktual → minta user jalankan query audit di Supabase SQL Editor
3. Jangan asumsikan kolom/tabel ada berdasarkan `schema.sql`

## TECH STACK

- **Frontend:** React + Vite, TanStack Query, Tailwind CSS, shadcn/ui
- **Backend:** Supabase (PostgreSQL + RLS + Edge Functions)
- **Auth:** Supabase Auth via `useAuth` hook (`src/lib/hooks/useAuth.jsx`)
- **Multi-tenant:** Setiap user bisa punya banyak tenant. `profile.id` ≠ `profiles.id` kalau user masuk via `tenant_memberships`

## MULTI-TENANT — CRITICAL

- `profiles` table: UNIQUE(auth_user_id, tenant_id) — satu user bisa punya banyak baris
- `tenant_memberships`: tabel M:N untuk user ↔ tenant (role-based)
- `useAuth` combined array: `profile.id` = membership UUID (bukan `profiles.id`)
- `profile.profile_id` = actual `profiles.id` — pakai ini untuk FK ke profiles
- Selalu pakai `profile.profile_id ?? profile.id` untuk FK yang butuh `profiles.id`

## CODING STANDARDS

- Loading guard: pakai `||` bukan `&&` untuk kondisi loading/null
- Jangan mock database di tests
- Jangan tambah `search_path` tanpa `SET search_path = public` di fungsi SQL
- Semua fungsi SQL wajib `SECURITY DEFINER SET search_path = public`
- Query RLS: hindari recursive policy — pakai SECURITY DEFINER function sebagai wrapper

## MOBILE UX

- Touch target minimum 44px
- Input font minimum 16px (mencegah zoom di iOS)
- Spacing konsisten: gunakan sistem yang sudah ada

## SAAT ADA ERROR/BUG

1. **Audit dulu** — minta user jalankan query SQL ke Supabase untuk cek state aktual
2. **Jangan drop sesuatu** tanpa audit relasi dulu
3. **Jangan fix A lalu break B** — petakan semua impact sebelum mulai
