-- ─────────────────────────────────────────────────────────────────────────────
-- site_config: Global key-value store for admin-editable landing page content
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.site_config (
  key        text primary key,
  value      text,
  updated_at timestamptz not null default now()
);

-- Public can read (needed for landing page SSG/CSR)
alter table public.site_config enable row level security;

create policy "Public can read site_config"
  on public.site_config for select
  using (true);

create policy "Superadmin can upsert site_config"
  on public.site_config for all
  using (is_superadmin())
  with check (is_superadmin());

-- Seed default values (safe to re-run — ON CONFLICT DO NOTHING)
insert into public.site_config (key, value) values
  ('company_name',        'TernakOS'),
  ('company_url',         'https://ternakos.my.id'),
  ('company_logo_url',    'https://ternakos.my.id/logo.png'),
  ('company_description', 'Platform SaaS Manajemen Ternak #1 di Indonesia'),
  ('company_phone',       '+6281358925505'),
  ('contact_email',       'support@ternakos.my.id'),
  ('wa_url',              'https://wa.me/6281358925505'),
  ('business_hours',      'Senin – Jumat, 08:00 – 17:00 WIB'),
  ('instagram_url',       'https://instagram.com/ternakos.id'),
  ('linkedin_url',        'https://linkedin.com/company/ternakos'),
  ('stats_users',         '500+'),
  ('stats_transactions',  '10rb+'),
  ('stats_value',         'Rp 250M+')
on conflict (key) do nothing;
