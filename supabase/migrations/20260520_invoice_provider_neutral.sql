-- ─────────────────────────────────────────────────────────────────────────────
-- Migration : 20260520_invoice_provider_neutral.sql
-- Phase     : B3A — Provider-neutral payment schema
-- Date      : 2026-05-20
--
-- WHAT THIS DOES
--   1. Adds 10 provider-neutral columns to subscription_invoices (Midtrans-ready,
--      all nullable, existing manual invoices unaffected).
--   2. Adds CHECK constraint on payment_method (fixes F-03 — no constraint existed).
--   3. Adds CHECK constraint on payment_provider (enforces known provider values).
--   4. Creates 4 indexes:
--        - Unique partial on provider_order_id WHERE NOT NULL   (webhook idempotency)
--        - (tenant_id, status)                                  (primary query pattern)
--        - (payment_provider, provider_status) WHERE NOT NULL   (webhook fan-out)
--        - Unique partial (tenant_id) WHERE status = 'pending'  (F-13 dedup guard)
--
-- WHAT THIS DOES NOT DO
--   - Does NOT rename or drop xendit_config table             → Phase B3D
--     (deferred: table rename is a breaking schema change even with 0 rows;
--      safer to do after B3B code cleanup is verified in production)
--   - Does NOT drop xendit_invoice_id / xendit_payment_url   → Phase B3D
--   - Does NOT change any RLS policy
--   - Does NOT change any frontend code
--   - Does NOT migrate xendit column data                    → skipped (see preflight)
--   - Does NOT implement Midtrans Edge Functions             → Phase B4/B5
--
-- PREFLIGHT RESULTS (verified 2026-05-20, Supabase SQL Editor)
--   xendit_invoice_id  non-null rows : 0 of 4  → data migration skipped
--   xendit_payment_url non-null rows : 0 of 4  → data migration skipped
--   Duplicate pending invoices       : 0 rows  → unique pending index safe
--   plan_configs.kandang_limit.starter         → 1  (confirmed for B3E backfill)
--
-- PREFLIGHT: payment_method values (verified 2026-05-20, Supabase SQL Editor)
--   manual : 4 rows
--   (no other values present)
--   → CHECK constraint ('transfer','manual','midtrans_snap','midtrans_va') is safe to apply.
--
-- IDEMPOTENCY
--   All ADD COLUMN use IF NOT EXISTS.
--   All CREATE INDEX use IF NOT EXISTS.
--   CHECK constraints use DROP IF EXISTS before re-adding.
-- ─────────────────────────────────────────────────────────────────────────────


-- ─── 1. Provider-neutral columns ─────────────────────────────────────────────
--
-- payment_provider : NOT NULL DEFAULT 'manual' so every invoice always has a
--   provider tag. Existing 4 rows are backfilled to 'manual' automatically by
--   Postgres at ALTER time (constant DEFAULT is metadata-only in PG14+, no rewrite).
--
-- provider_signature_verified : NOT NULL DEFAULT false so webhook code can do a
--   simple boolean check without handling NULL.
--
-- All other columns : nullable — set incrementally by Edge Functions as the
--   payment lifecycle progresses.

ALTER TABLE public.subscription_invoices
  ADD COLUMN IF NOT EXISTS payment_provider            text      NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS provider_order_id           text,
  ADD COLUMN IF NOT EXISTS provider_transaction_id     text,
  ADD COLUMN IF NOT EXISTS provider_payment_url        text,
  ADD COLUMN IF NOT EXISTS provider_status             text,
  ADD COLUMN IF NOT EXISTS provider_payload            jsonb,
  ADD COLUMN IF NOT EXISTS provider_signature_verified boolean   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS provider_paid_at            timestamptz,
  ADD COLUMN IF NOT EXISTS provider_expired_at         timestamptz,
  ADD COLUMN IF NOT EXISTS provider_cancelled_at       timestamptz;


-- ─── 2. CHECK: payment_method ─────────────────────────────────────────────────
--
-- F-03 fix: column existed as freeform text with default 'transfer' and no constraint.
-- Allowed values:
--   'transfer'      – existing manual bank transfer invoices (column default)
--   'manual'        – explicit value set by useCreateInvoice()
--   'midtrans_snap' – future Midtrans Snap (redirect flow)
--   'midtrans_va'   – future Midtrans Virtual Account flow
--
-- Drop-before-add makes this idempotent on re-run.

ALTER TABLE public.subscription_invoices
  DROP CONSTRAINT IF EXISTS subscription_invoices_payment_method_check;

ALTER TABLE public.subscription_invoices
  ADD CONSTRAINT subscription_invoices_payment_method_check
  CHECK (payment_method IN ('transfer', 'manual', 'midtrans_snap', 'midtrans_va'));


-- ─── 3. CHECK: payment_provider ──────────────────────────────────────────────
--
-- Enforces known provider values on the new column.
--   'manual'    – bank transfer confirmed by admin
--   'midtrans'  – Midtrans Snap / VA (Phase B4+)
-- 'xendit' is intentionally excluded: preflight confirmed 0 historical Xendit rows.
-- Add new providers here via ALTER CONSTRAINT in a future migration.

ALTER TABLE public.subscription_invoices
  DROP CONSTRAINT IF EXISTS subscription_invoices_payment_provider_check;

ALTER TABLE public.subscription_invoices
  ADD CONSTRAINT subscription_invoices_payment_provider_check
  CHECK (payment_provider IN ('manual', 'midtrans'));


-- ─── 4. Indexes ──────────────────────────────────────────────────────────────

-- 4a. Idempotency key for Midtrans create-transaction and webhook dedup.
--     Partial (WHERE NOT NULL) so existing manual rows (NULL provider_order_id)
--     do not conflict and the index stays small.
CREATE UNIQUE INDEX IF NOT EXISTS idx_sub_invoices_provider_order_id
  ON public.subscription_invoices (provider_order_id)
  WHERE provider_order_id IS NOT NULL;

-- 4b. Primary read pattern: useAllInvoices + useHasPendingInvoice both filter
--     by tenant_id and status.
CREATE INDEX IF NOT EXISTS idx_sub_invoices_tenant_status
  ON public.subscription_invoices (tenant_id, status);

-- 4c. Webhook fan-out: midtrans-webhook looks up invoices by payment_provider
--     and provider_status to determine which action to take.
CREATE INDEX IF NOT EXISTS idx_sub_invoices_provider_status
  ON public.subscription_invoices (payment_provider, provider_status)
  WHERE payment_provider IS NOT NULL;

-- 4d. Prevents duplicate pending invoices per tenant at DB level (B1 finding F-13).
--     Preflight confirmed 0 existing duplicate pending rows — safe to add now.
--     UpgradePlan.jsx useHasPendingInvoice() is the frontend guard; this index
--     is the DB-level hard stop for race conditions and direct DB writes.
CREATE UNIQUE INDEX IF NOT EXISTS idx_sub_invoices_one_pending_per_tenant
  ON public.subscription_invoices (tenant_id)
  WHERE status = 'pending';


-- ─── 5. xendit_config table — DEFERRED to Phase B3D ─────────────────────────
--
-- The xendit_config rename was originally planned here but is deferred.
-- Reason: table rename is a breaking schema change even with 0 rows — any
-- in-flight transactions or cached query plans that reference xendit_config
-- would break. Safer to rename only after B3B code cleanup is confirmed live.
--
-- Action in B3D:
--   ALTER TABLE public.xendit_config RENAME TO _deprecated_xendit_config;
--   (then DROP after confirming no code references it)
