import { useState, useEffect } from 'react'
import {
  Edit3, Shuffle, Sparkles, HelpCircle, Building2, Shield,
  Check, X, Package, Receipt, Sun, Globe, Bell, Settings, Phone,
  FileText, LogOut, ChevronRight, ArrowUpRight, Info, LayoutGrid,
  ClipboardList, BarChart2, Users, ShoppingCart, Truck, Warehouse,
  Trash2, AlertTriangle, MapPin,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { resolveBusinessVertical, getXBasePath } from '@/lib/businessModel'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { logError } from '@/lib/logger/errorLogger'
import { logSupabaseError } from '@/lib/logger/supabaseLogger'

// ─── Constants ────────────────────────────────────────────────

const VERTICAL_ACCENTS = {
  peternak: { name: 'Peternakan',   base: 'oklch(0.72 0.15 155)', soft: 'oklch(0.72 0.15 155 / 0.16)' },
  sembako:  { name: 'Sembako',      base: 'oklch(0.72 0.16 60)',  soft: 'oklch(0.72 0.16 60  / 0.16)' },
  broker:   { name: 'Broker',       base: 'oklch(0.7  0.15 230)', soft: 'oklch(0.7  0.15 230 / 0.16)' },
  rpa:      { name: 'Rumah Potong', base: 'oklch(0.65 0.20 15)',  soft: 'oklch(0.65 0.20 15  / 0.16)' },
  admin:    { name: 'Administrasi', base: 'oklch(0.65 0.20 290)', soft: 'oklch(0.65 0.20 290 / 0.16)' },
}

const ROLE_LABELS = {
  owner:        { label: 'Pemilik',       bg: 'oklch(0.78 0.16 80 / 0.18)',  fg: 'oklch(0.82 0.16 80)'  },
  admin:        { label: 'Admin',         bg: 'oklch(0.7  0.18 240 / 0.18)', fg: 'oklch(0.78 0.16 240)' },
  superadmin:   { label: 'Super Admin',   bg: 'oklch(0.65 0.20 290 / 0.18)', fg: 'oklch(0.78 0.16 290)' },
  manajer:      { label: 'Manajer',       bg: 'oklch(0.65 0.18 280 / 0.18)', fg: 'oklch(0.78 0.16 280)' },
  staff:        { label: 'Staff Kandang', bg: 'oklch(0.65 0.16 200 / 0.18)', fg: 'oklch(0.78 0.14 210)' },
  anak_kandang: { label: 'Anak Kandang',  bg: 'oklch(0.62 0.18 155 / 0.18)', fg: 'oklch(0.78 0.16 155)' },
  view_only:    { label: 'Lihat Saja',    bg: 'oklch(0.6  0.02 250 / 0.2)',  fg: 'oklch(0.78 0.02 250)' },
}

const PERMISSION_MATRIX = {
  owner:        { input: true,  edit: true,  reports: true,  team: true,  billing: true  },
  admin:        { input: true,  edit: true,  reports: true,  team: true,  billing: true  },
  superadmin:   { input: true,  edit: true,  reports: true,  team: true,  billing: true  },
  manajer:      { input: true,  edit: true,  reports: true,  team: true,  billing: false },
  staff:        { input: true,  edit: false, reports: false, team: false, billing: false },
  anak_kandang: { input: true,  edit: false, reports: false, team: false, billing: false },
  view_only:    { input: false, edit: false, reports: true,  team: false, billing: false },
}

const BILLING_ROLES = ['owner', 'admin', 'superadmin', 'manajer']

const PLAN_INFO = {
  none:     { label: 'Belum aktif',  price: null,           users: 1,   batches: 1,   history: '30 hari'   },
  starter:  { label: 'Starter',      price: 'Rp 0',         users: 1,   batches: 2,   history: '6 bulan'   },
  pro:      { label: 'Pro',          price: 'Rp 199.000',   users: 3,   batches: 10,  history: '3 tahun',  next: '15 Jun 2026' },
  business: { label: 'Business',     price: 'Rp 499.000',   users: 999, batches: 999, history: 'Selamanya', next: '15 Jun 2026' },
}

const T = {
  bg:             '#0A0E0C',
  surface:        '#13191A',
  surfaceAlt:     '#0F1416',
  hairline:       'rgba(255,255,255,0.06)',
  hairlineStrong: 'rgba(255,255,255,0.12)',
  text:           '#F2F4F1',
  textDim:        '#9BA29B',
  textMute:       '#5A615C',
  danger:         'oklch(0.7 0.18 25)',
  warn:           'oklch(0.78 0.14 70)',
  ok:             'oklch(0.72 0.15 155)',
  shadow:         '0 1px 2px rgba(0,0,0,0.4), 0 12px 36px rgba(0,0,0,0.18)',
}

const APP_VERSION = 'v0.9.4 build 2026.05'

// ─── Helpers ──────────────────────────────────────────────────

function getUserRole(profile) {
  if (!profile) return 'view_only'
  const raw = (
    profile.app_role ||
    profile.business_role ||
    profile.role ||
    profile.user_type ||
    'view_only'
  ).toLowerCase()
  // normalize manager → manajer, owner_b2b → owner
  if (raw === 'manager') return 'manajer'
  if (raw === 'owner_b2b') return 'owner'
  return PERMISSION_MATRIX[raw] ? raw : 'view_only'
}

function normalizeVertical(v) {
  if (!v) return 'peternak'
  if (v.startsWith('peternak_') || v === 'peternak') return 'peternak'
  if (v === 'sembako_broker' || v === 'distributor_sembako') return 'sembako'
  if (v === 'poultry_broker') return 'broker'
  if (v.startsWith('rumah_potong')) return 'rpa'
  if (v === 'admin' || v === 'superadmin') return 'admin'
  return 'peternak'
}

function cardStyle() {
  return {
    background: T.surface,
    border: `1px solid ${T.hairline}`,
    borderRadius: 16,
    padding: 14,
    boxShadow: T.shadow,
  }
}

// ─── Main Component ───────────────────────────────────────────

export default function AkunPage() {
  const { user, profile, tenant, ownerTenant, profiles, isSuperadmin, refetchProfile } = useAuth()
  const navigate = useNavigate()
  const { state: routerState } = useLocation()

  const activeTenant = tenant
  const billingTenant = ownerTenant || tenant

  const rawVertical = resolveBusinessVertical(profile, activeTenant)
  const verticalKey = normalizeVertical(rawVertical)
  const basePath = getXBasePath(activeTenant, profile) || ''
  const editBizPath = getEditBizPath(rawVertical, basePath)
  const accent = VERTICAL_ACCENTS[verticalKey] || VERTICAL_ACCENTS.peternak

  const role = isSuperadmin ? 'superadmin' : getUserRole(profile)
  const roleBadge = ROLE_LABELS[role] || ROLE_LABELS.view_only
  const showBilling = BILLING_ROLES.includes(role)

  const isMultiTenant = (profiles?.length ?? 0) > 1
  const planKey = billingTenant?.plan || 'none'
  const plan = PLAN_INFO[planKey] ? planKey : 'none'

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Pengguna'
  const email = user?.email || 'Belum tersedia'
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
  const tenantName = activeTenant?.business_name || activeTenant?.name || 'Bisnis Aktif'
  const tenantCity = activeTenant?.city || activeTenant?.location || '—'

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut({ scope: 'local' })
    if (error) {
      logError({
        level: 'error',
        source: 'auth',
        component: 'AkunPreview',
        actionName: 'handleLogout',
        error,
        metadata: { operation: 'signOut' },
      })
      toast.error('Gagal keluar')
    } else {
      navigate('/login')
    }
  }

  const canDeleteBusiness = role === 'owner' && !isSuperadmin && !!activeTenant?.id
  const canEditBisnis = role === 'owner' && !!activeTenant?.id

  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [editBisnisOpen, setEditBisnisOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    if (routerState?.openEditBisnis && canEditBisnis) {
      setEditBisnisOpen(true)
      navigate('.', { replace: true, state: {} })
    }
  }, [routerState?.openEditBisnis, canEditBisnis])

  const handleSwitchBiz = () => {
    if (!isMultiTenant) return
    toast.info('Pilih bisnis dari daftar tim kamu di halaman Akun utama.')
  }

  const handleUpgrade = () => navigate('/upgrade')

  return (
    <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: 120 }}>
      <style>{`
        @keyframes pulse2 {
          0%, 100% { opacity: 1 }
          50%       { opacity: 0.4 }
        }
        @keyframes fadeIn {
          from { opacity: 0 }
          to   { opacity: 1 }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px) }
          to   { opacity: 1; transform: translateY(0) }
        }
      `}</style>

      {/* 1. Profile Hero */}
      <ProfileHero
        accent={accent} roleBadge={roleBadge}
        displayName={displayName} email={email} initials={initials}
        tenantName={tenantName}
      />

      <div style={{ padding: '0 20px' }}>

        {/* 2. Quick Actions */}
        <QuickActions
          accent={accent} plan={plan} showBilling={showBilling}
          isMultiTenant={isMultiTenant}
          onSwitch={handleSwitchBiz}
          onUpgrade={handleUpgrade}
          onHelp={() => navigate('/hubungi-kami')}
          onEditProfile={() => setEditProfileOpen(true)}
        />

        {/* 3. Bisnis Aktif */}
        <ActiveBusinessCard
          accent={accent} roleBadge={roleBadge}
          tenantName={tenantName} tenantCity={tenantCity}
          tenantProvince={activeTenant?.province || null}
          canEditBisnis={canEditBisnis}
          onEditBiz={canEditBisnis ? () => setEditBisnisOpen(true) : (editBizPath ? () => navigate(editBizPath) : null)}
        />

        {/* 4. Akses Saya */}
        <AccessSummaryCard role={role} accent={accent} rawVertical={rawVertical} />

        {/* 5. Paket & Billing */}
        {showBilling
          ? <BillingCard accent={accent} plan={plan} onUpgrade={handleUpgrade} />
          : <BillingHandledByOwnerCard />
        }

        {/* 5.5. Pintasan Vertikal */}
        {basePath && (
          <VerticalShortcutsCard
            rawVertical={rawVertical} basePath={basePath}
            accent={accent} navigate={navigate}
          />
        )}

        {/* 6. Preferensi */}
        <PreferencesCard />

        {/* 7. Bantuan & Tentang */}
        <HelpAboutCard navigate={navigate} />

        {/* 8. Zona Berbahaya — hanya pemilik bisnis */}
        {canDeleteBusiness && (
          <DangerZoneCard
            tenantName={tenantName}
            onDelete={() => setDeleteDialogOpen(true)}
          />
        )}

        {/* 9. Logout */}
        <LogoutBtn onLogout={handleLogout} />
      </div>

      {/* Edit Profile Sheet — key forces remount on open so state initializes fresh */}
      <EditProfileSheet
        key={editProfileOpen ? 'open' : 'closed'}
        open={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        profile={profile}
        user={user}
        onSuccess={refetchProfile}
        accent={accent}
      />

      {/* Edit Bisnis Sheet */}
      <EditBisnisSheet
        key={editBisnisOpen ? 'open' : 'closed'}
        open={editBisnisOpen}
        onClose={() => setEditBisnisOpen(false)}
        tenant={activeTenant}
        onSuccess={refetchProfile}
        accent={accent}
      />

      {/* Delete Business Dialog */}
      {deleteDialogOpen && (
        <DeleteBusinessDialog
          tenant={activeTenant}
          profiles={profiles}
          onClose={() => setDeleteDialogOpen(false)}
          onDeleted={() => {
            setDeleteDialogOpen(false)
            // Clear persisted tenant so useAuth picks next available on refetch
            try { localStorage.removeItem('ternakos_active_tenant_id') } catch { /* ok */ }
            refetchProfile()
            // Give refetchProfile a tick to resolve then navigate
            setTimeout(() => {
              const remaining = profiles.filter(p => p.tenant_id !== activeTenant?.id)
              if (remaining.length > 0) {
                navigate('/', { replace: true })
              } else {
                navigate('/welcome', { replace: true })
              }
            }, 300)
          }}
        />
      )}
    </div>
  )
}

// ─── Section 1: Profile Hero ──────────────────────────────────

function ProfileHero({ accent, roleBadge, displayName, email, initials, tenantName }) {
  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      padding: '64px 20px 28px',
      background: `linear-gradient(180deg, ${accent.soft} 0%, transparent 100%), linear-gradient(135deg, ${accent.base}1a 0%, transparent 60%)`,
      borderBottom: `1px solid ${T.hairline}`,
      animation: 'fadeIn 400ms ease',
    }}>
      {/* Glow blob */}
      <div style={{
        position: 'absolute', top: -60, right: -40,
        width: 200, height: 200, borderRadius: 999,
        background: accent.base, opacity: 0.18,
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Avatar */}
        <div style={{
          width: 64, height: 64, borderRadius: 18, flexShrink: 0, position: 'relative',
          background: `linear-gradient(135deg, ${accent.base}, oklch(0.65 0.18 280))`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 22, fontWeight: 700, letterSpacing: -0.5,
          boxShadow: `0 14px 36px ${accent.base}66`,
        }}>
          {initials}
          <span style={{
            position: 'absolute', bottom: -3, right: -3,
            width: 18, height: 18, borderRadius: 999,
            background: T.ok, color: '#fff', border: `2.5px solid ${T.bg}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Check size={9} strokeWidth={3} />
          </span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.text, letterSpacing: -0.3, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayName}
          </div>
          <div style={{ fontSize: 12, color: T.textDim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 8 }}>
            {email}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ padding: '3px 9px', borderRadius: 6, background: roleBadge.bg, color: roleBadge.fg, fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>
              {roleBadge.label}
            </span>
            <span style={{ padding: '3px 9px', borderRadius: 6, background: accent.soft, color: accent.base, fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: 999, background: accent.base }} />
              {accent.name}
            </span>
          </div>
        </div>
      </div>

      {/* Tenant strip */}
      <div style={{
        marginTop: 16, padding: '10px 14px',
        background: T.surface + 'cc', backdropFilter: 'blur(12px)',
        border: `1px solid ${T.hairline}`, borderRadius: 12,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ width: 26, height: 26, borderRadius: 8, background: accent.base + '22', color: accent.base, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Building2 size={13} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', color: T.textMute }}>Bisnis aktif</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tenantName}</div>
        </div>
        <span style={{ padding: '3px 8px', borderRadius: 6, background: T.ok + '22', color: T.ok, fontSize: 10, fontWeight: 700, letterSpacing: 0.3, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: T.ok, animation: 'pulse2 2s infinite' }} />
          Aktif
        </span>
      </div>
    </div>
  )
}

// ─── Section 2: Quick Actions ─────────────────────────────────

function QuickActions({ accent, plan, showBilling, isMultiTenant, onSwitch, onUpgrade, onHelp, onEditProfile }) {
  const planLabel = plan === 'none' ? 'Start Plan'
    : plan === 'starter' || plan === 'basic' ? 'Upgrade Plan'
    : 'Lihat Paket'
  const planSub = plan === 'none' ? 'Mulai berlangganan'
    : plan === 'starter' || plan === 'basic' ? 'Tingkatkan fitur'
    : 'Paket aktif'
  const planFg = plan === 'none' ? 'oklch(0.78 0.16 80)'
    : plan === 'starter' || plan === 'basic' ? 'oklch(0.65 0.20 290)'
    : T.textDim
  const isFeaturedPlan = plan === 'none' || plan === 'starter' || plan === 'basic'

  const items = [
    { icon: <Edit3 size={17} />, label: 'Edit Profil', sub: 'Nama & nomor HP', fg: accent.base, featured: false, disabled: false, onClick: onEditProfile },
    isMultiTenant && { icon: <Shuffle size={17} />, label: 'Ganti Bisnis', sub: 'Pindah tenant', fg: 'oklch(0.7 0.15 230)', featured: false, disabled: false, onClick: onSwitch },
    showBilling && { icon: <Sparkles size={17} />, label: planLabel, sub: planSub, fg: planFg, featured: isFeaturedPlan, disabled: false, onClick: onUpgrade },
    { icon: <HelpCircle size={17} />, label: 'Bantuan', sub: 'Pusat dukungan', fg: T.textDim, featured: false, disabled: false, onClick: onHelp },
  ].filter(Boolean)

  return (
    <div style={{ marginTop: 16, marginBottom: 18, animation: 'fadeInUp 300ms ease 0.05s both' }}>
      <SectionLabel label="Akses Cepat" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {items.map(it => (
          <button
            key={it.label}
            onClick={it.disabled ? undefined : it.onClick}
            disabled={it.disabled}
            style={{
              padding: 14, textAlign: 'left', cursor: it.disabled ? 'default' : 'pointer',
              background: it.featured ? `linear-gradient(135deg, ${it.fg}22, ${it.fg}05)` : T.surface,
              border: `1px solid ${it.featured ? it.fg + '40' : T.hairline}`,
              borderRadius: 14, position: 'relative', overflow: 'hidden',
              display: 'flex', flexDirection: 'column', gap: 8,
              opacity: it.disabled ? 0.55 : 1,
            }}
          >
            {it.featured && (
              <span style={{
                position: 'absolute', top: 8, right: 8,
                width: 6, height: 6, borderRadius: 999, background: it.fg,
                boxShadow: `0 0 8px ${it.fg}`,
                animation: 'pulse2 1.8s ease-in-out infinite',
              }} />
            )}
            <span style={{ width: 36, height: 36, borderRadius: 11, background: it.fg + '22', color: it.fg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {it.icon}
            </span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text, letterSpacing: -0.1 }}>{it.label}</div>
              <div style={{ fontSize: 11, color: T.textDim, marginTop: 1 }}>{it.sub}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Section 3: Bisnis Aktif ──────────────────────────────────

function getEditBizPath(rawVertical, basePath) {
  const v = rawVertical || ''
  const bp = basePath || ''
  if (!bp) return null
  if (v.startsWith('peternak_') || v === 'peternak') return `${bp}/tim`
  if (v === 'poultry_broker') return `${bp}/tim`
  if (v === 'broker_telur' || v === 'egg_broker') return `${bp}/tim`
  if (v === 'distributor_sembako' || v === 'sembako_broker') return `${bp}/karyawan`
  if (v === 'admin' || v === 'superadmin') return '/admin/settings'
  return null
}

function ActiveBusinessCard({ accent, roleBadge, tenantName, tenantCity, tenantProvince, canEditBisnis, onEditBiz }) {
  return (
    <Section title="Bisnis Aktif" icon={<Building2 size={13} />} iconColor={accent.base} delay={0.1}>
      <div style={cardStyle()}>
        <InfoRow label="Nama Bisnis" value={tenantName} />
        <InfoRow label="Model Bisnis">
          <span style={{ padding: '2px 8px', borderRadius: 6, background: accent.soft, color: accent.base, fontSize: 10, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase' }}>
            {accent.name}
          </span>
        </InfoRow>
        <InfoRow label="Lokasi" value={tenantCity} />
        <InfoRow label="Provinsi">
          {tenantProvince ? (
            <span style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{tenantProvince}</span>
          ) : (
            <span
              onClick={canEditBisnis ? onEditBiz : undefined}
              style={{
                fontSize: 11, fontWeight: 700, color: T.warn,
                background: 'oklch(0.78 0.14 70 / 0.12)',
                border: '1px solid oklch(0.78 0.14 70 / 0.3)',
                borderRadius: 6, padding: '2px 8px', letterSpacing: 0.3,
                textTransform: 'uppercase', cursor: canEditBisnis ? 'pointer' : 'default',
              }}
            >
              {canEditBisnis ? '⚠ Belum diisi — tap untuk isi' : 'Belum diisi'}
            </span>
          )}
        </InfoRow>
        <InfoRow label="Peran Saya" noBorder>
          <span style={{ padding: '2px 8px', borderRadius: 6, background: roleBadge.bg, color: roleBadge.fg, fontSize: 10, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase' }}>
            {roleBadge.label}
          </span>
        </InfoRow>

        {onEditBiz && (
          <button
            onClick={onEditBiz}
            style={{
              width: '100%', marginTop: 12, padding: '11px',
              background: accent.soft, border: `1px solid ${accent.base}44`,
              color: accent.base, borderRadius: 12, cursor: 'pointer',
              fontSize: 13, fontWeight: 700, letterSpacing: -0.1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <Edit3 size={14} strokeWidth={2.5} /> Edit Info Bisnis
          </button>
        )}
      </div>
    </Section>
  )
}

// ─── Section 4: Akses Saya ────────────────────────────────────

function getAccessLabelsByVertical(rawVertical) {
  const v = rawVertical || ''
  if (v.startsWith('peternak_') || v === 'peternak') {
    return [
      { key: 'input',   label: 'Input data harian',   desc: 'Pakan, kesehatan, timbang' },
      { key: 'edit',    label: 'Edit data lengkap',   desc: 'Ubah catatan tersimpan' },
      { key: 'reports', label: 'Lihat laporan & KPI', desc: 'ADG, mortalitas, HPP' },
      { key: 'team',    label: 'Kelola tim',           desc: 'Undang & atur peran' },
      { key: 'billing', label: 'Kelola billing',       desc: 'Upgrade & invoice' },
    ]
  }
  if (v === 'sembako_broker' || v === 'distributor_sembako') {
    return [
      { key: 'input',   label: 'Input transaksi',        desc: 'Penjualan, pembelian, pengiriman' },
      { key: 'edit',    label: 'Edit data operasional',  desc: 'Produk, stok, toko, supplier' },
      { key: 'reports', label: 'Lihat laporan bisnis',   desc: 'Omzet, piutang, margin, HPP' },
      { key: 'team',    label: 'Kelola tim',              desc: 'Karyawan & akses' },
      { key: 'billing', label: 'Kelola billing',          desc: 'Upgrade & invoice' },
    ]
  }
  if (v === 'poultry_broker') {
    return [
      { key: 'input',   label: 'Input transaksi',        desc: 'Beli, jual, pengiriman' },
      { key: 'edit',    label: 'Edit data transaksi',    desc: 'Harga, status, pembayaran' },
      { key: 'reports', label: 'Lihat laporan broker',   desc: 'Margin, cash flow, loss' },
      { key: 'team',    label: 'Kelola tim',              desc: 'Tim, sopir, akses' },
      { key: 'billing', label: 'Kelola billing',          desc: 'Upgrade & invoice' },
    ]
  }
  if (v === 'broker_telur' || v === 'egg_broker') {
    return [
      { key: 'input',   label: 'Input transaksi',        desc: 'POS, supplier, customer' },
      { key: 'edit',    label: 'Edit data operasional',  desc: 'Inventori, harga, pembayaran' },
      { key: 'reports', label: 'Lihat laporan bisnis',   desc: 'Omzet, stok, margin' },
      { key: 'team',    label: 'Kelola tim',              desc: 'Tim & akses' },
      { key: 'billing', label: 'Kelola billing',          desc: 'Upgrade & invoice' },
    ]
  }
  if (v.startsWith('rumah_potong') || v === 'rpa') {
    return [
      { key: 'input',   label: 'Input order',            desc: 'Order, pemotongan, distribusi' },
      { key: 'edit',    label: 'Edit data produksi',     desc: 'Status, hutang, pengiriman' },
      { key: 'reports', label: 'Lihat laporan RPA',      desc: 'Produksi, penjualan, hutang' },
      { key: 'team',    label: 'Kelola tim',              desc: 'Tim & akses' },
      { key: 'billing', label: 'Kelola billing',          desc: 'Upgrade & invoice' },
    ]
  }
  if (v === 'admin' || v === 'superadmin') {
    return [
      { key: 'input',   label: 'Kelola tenant',          desc: 'Bisnis, user, akses' },
      { key: 'edit',    label: 'Kelola subscription',    desc: 'Paket, invoice, pembayaran' },
      { key: 'reports', label: 'Lihat aktivitas',         desc: 'Audit, log, status sistem' },
      { key: 'team',    label: 'Kelola pengaturan',       desc: 'Harga, konfigurasi, platform' },
      { key: 'billing', label: 'Akses global',            desc: 'Semua vertical & tenant' },
    ]
  }
  // fallback — generic
  return [
    { key: 'input',   label: 'Input data',               desc: 'Catat transaksi & operasional' },
    { key: 'edit',    label: 'Edit data',                 desc: 'Ubah catatan tersimpan' },
    { key: 'reports', label: 'Lihat laporan',             desc: 'KPI, grafik, ringkasan' },
    { key: 'team',    label: 'Kelola tim',                desc: 'Undang & atur peran' },
    { key: 'billing', label: 'Kelola billing',            desc: 'Upgrade & invoice' },
  ]
}

function AccessSummaryCard({ role, accent, rawVertical }) {
  const perms = PERMISSION_MATRIX[role] || PERMISSION_MATRIX.view_only
  const rows = getAccessLabelsByVertical(rawVertical)
  const grantedCount = rows.filter(r => perms[r.key]).length
  const pct = Math.round((grantedCount / rows.length) * 100)

  return (
    <Section
      title="Akses Saya"
      icon={<Shield size={13} />}
      iconColor="oklch(0.78 0.16 80)"
      rightAction={<span style={{ fontSize: 11, fontWeight: 700, color: T.textDim }}>{grantedCount}/{rows.length} izin</span>}
      delay={0.12}
    >
      <div style={cardStyle()}>
        {/* Progress bar */}
        <div style={{ padding: '10px 12px', marginBottom: 10, background: T.surfaceAlt, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 6, borderRadius: 999, background: T.hairline, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: accent.base, borderRadius: 999, transition: 'width 500ms' }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{pct}%</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map(r => {
            const granted = perms[r.key]
            return (
              <div key={r.key} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '8px 10px', borderRadius: 10,
                background: granted ? accent.soft + '40' : 'transparent',
                opacity: granted ? 1 : 0.65,
              }}>
                <span style={{
                  width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                  background: granted ? accent.base : T.surfaceAlt,
                  color: granted ? '#0A0E0C' : T.textMute,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {granted ? <Check size={13} strokeWidth={3} /> : <X size={12} strokeWidth={2.5} />}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text, letterSpacing: -0.1 }}>{r.label}</div>
                  <div style={{ fontSize: 11, color: T.textDim, marginTop: 1 }}>{r.desc}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Section>
  )
}

// ─── Section 5: Billing ───────────────────────────────────────

function BillingCard({ accent, plan, onUpgrade }) {
  const info = PLAN_INFO[plan] || PLAN_INFO.none
  const canUpgrade = plan === 'none' || plan === 'starter' || plan === 'basic'
  const upgradeLabel = plan === 'none' ? 'Start Plan' : 'Upgrade Plan'
  const accentColor = plan === 'none' ? 'oklch(0.78 0.16 80)'
    : plan === 'starter' || plan === 'basic' ? 'oklch(0.65 0.20 290)'
    : accent.base

  if (plan === 'none') {
    return (
      <Section title="Paket & Billing" icon={<Package size={13} />} iconColor="oklch(0.78 0.16 80)" delay={0.15}>
        <div style={{
          padding: 18, borderRadius: 16, position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(135deg, oklch(0.78 0.16 80 / 0.16), oklch(0.78 0.16 80 / 0.04))',
          border: '1px solid oklch(0.78 0.16 80 / 0.38)',
        }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: 999, background: 'oklch(0.78 0.16 80)', opacity: 0.15, filter: 'blur(40px)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'oklch(0.78 0.16 80)', color: '#0A0E0C', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 28px oklch(0.78 0.16 80 / 0.55)' }}>
              <Sparkles size={20} strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: T.textDim }}>Belum berlangganan</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: T.text, letterSpacing: -0.2, marginTop: 2 }}>Mulai pakai TernakOS</div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: T.textDim, lineHeight: 1.5, marginBottom: 14, position: 'relative' }}>
            Akses fitur lengkap: tugas harian, laporan, multi-user, dan lebih banyak lagi.
          </div>
          <button onClick={onUpgrade} style={{
            width: '100%', padding: '13px', borderRadius: 12, border: 'none', cursor: 'pointer',
            background: 'oklch(0.78 0.16 80)', color: '#0A0E0C',
            fontSize: 14, fontWeight: 700, letterSpacing: -0.1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 8px 22px oklch(0.78 0.16 80 / 0.45)',
          }}>
            <Sparkles size={16} strokeWidth={2.5} /> Start Plan
          </button>
        </div>
      </Section>
    )
  }

  return (
    <Section title="Paket & Billing" icon={<Package size={13} />} iconColor={accentColor} delay={0.15}>
      <div style={{
        ...cardStyle(),
        background: `linear-gradient(135deg, ${accentColor}14, ${accentColor}04)`,
        border: `1px solid ${accentColor}30`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: T.textDim }}>Paket aktif</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: -0.4 }}>{info.label}</span>
              {info.price && <span style={{ fontSize: 11, color: T.textDim }}>· {info.price}/bulan</span>}
            </div>
          </div>
          <span style={{ padding: '4px 10px', borderRadius: 6, background: T.ok + '22', color: T.ok, fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>Aktif</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: T.textMute, marginBottom: 2 }}>Usage limit</div>
          <LimitRow label="Pengguna"    used={plan === 'starter' ? 1 : 3} cap={info.users === 999 ? null : info.users}   subtitle={info.users === 999 ? 'Unlimited' : null}   accent={accentColor} />
          <LimitRow label="Batch aktif" used={plan === 'starter' ? 2 : 3} cap={info.batches === 999 ? null : info.batches} subtitle={info.batches === 999 ? 'Unlimited' : null} accent={accentColor} />
          <LimitRow label="Riwayat data" used={null} cap={null} subtitle={info.history} accent={accentColor} />
        </div>

        {info.next && (
          <div style={{ fontSize: 11, color: T.textDim, marginBottom: 12 }}>
            Pembayaran berikutnya: <span style={{ color: T.text, fontWeight: 600 }}>{info.next}</span>
          </div>
        )}

        {canUpgrade && (
          <button onClick={onUpgrade} style={{
            width: '100%', padding: '11px', border: 'none', borderRadius: 11, cursor: 'pointer',
            background: accentColor, color: '#0A0E0C',
            fontSize: 13, fontWeight: 700,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            boxShadow: `0 6px 18px ${accentColor}55`,
          }}>
            <ArrowUpRight size={14} strokeWidth={2.5} /> {upgradeLabel}
          </button>
        )}
      </div>
    </Section>
  )
}

function BillingHandledByOwnerCard() {
  return (
    <Section title="Paket & Billing" icon={<Package size={13} />} iconColor={T.textMute} delay={0.15}>
      <div style={{ ...cardStyle(), display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 36, height: 36, borderRadius: 10, background: T.surfaceAlt, color: T.textDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Info size={16} />
        </span>
        <div style={{ flex: 1, fontSize: 13, color: T.textDim, lineHeight: 1.5 }}>
          Paket bisnis dikelola oleh <span style={{ color: T.text, fontWeight: 600 }}>Pemilik</span>.
        </div>
      </div>
    </Section>
  )
}

function LimitRow({ label, used, cap, subtitle, accent: accentColor }) {
  const pct = used != null && cap ? Math.min(100, (used / cap) * 100) : 100
  const isMaxed = used === cap && cap > 0
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: T.textDim }}>{label}</span>
        <span style={{ color: isMaxed ? T.warn : T.text, fontWeight: 600 }}>
          {used != null ? `${used}/${cap}` : subtitle}
        </span>
      </div>
      {used != null && (
        <div style={{ height: 4, background: T.hairline, borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: isMaxed ? T.warn : accentColor, borderRadius: 999 }} />
        </div>
      )}
    </div>
  )
}

// ─── Section 5.5: Vertical Shortcuts ─────────────────────────

function getVerticalShortcuts(rawVertical, basePath) {
  const bp = basePath || ''
  if (!rawVertical || rawVertical.startsWith('peternak_') || rawVertical === 'peternak') {
    return [
      { icon: 'clipboard', label: 'Tugas Harian', path: `${bp}/daily_task` },
      { icon: 'package',   label: 'Stok Pakan',   path: `${bp}/pakan` },
      { icon: 'barchart',  label: 'Laporan',       path: `${bp}/laporan` },
      { icon: 'users',     label: 'Tim',           path: `${bp}/tim` },
    ]
  }
  if (rawVertical === 'poultry_broker') {
    return [
      { icon: 'shopping',  label: 'Transaksi',  path: `${bp}/transaksi` },
      { icon: 'truck',     label: 'Pengiriman', path: `${bp}/pengiriman` },
      { icon: 'barchart',  label: 'Cash Flow',  path: `${bp}/cash-flow` },
      { icon: 'users',     label: 'Tim',        path: `${bp}/tim` },
    ]
  }
  if (rawVertical === 'broker_telur' || rawVertical === 'egg_broker') {
    return [
      { icon: 'shopping',  label: 'POS',       path: `${bp}/pos` },
      { icon: 'package',   label: 'Inventori', path: `${bp}/inventori` },
      { icon: 'barchart',  label: 'Transaksi', path: `${bp}/transaksi` },
      { icon: 'users',     label: 'Tim',       path: `${bp}/tim` },
    ]
  }
  if (rawVertical === 'sembako_broker' || rawVertical === 'distributor_sembako') {
    return [
      { icon: 'shopping',  label: 'Penjualan', path: `${bp}/penjualan` },
      { icon: 'warehouse', label: 'Gudang',    path: `${bp}/gudang` },
      { icon: 'barchart',  label: 'Laporan',   path: `${bp}/laporan` },
      { icon: 'users',     label: 'Tim',       path: `${bp}/tim` },
    ]
  }
  if (rawVertical?.startsWith('rumah_potong') || rawVertical === 'rpa') {
    return [
      { icon: 'clipboard', label: 'Order',      path: `${bp}/order` },
      { icon: 'receipt',   label: 'Hutang',     path: `${bp}/hutang` },
      { icon: 'truck',     label: 'Distribusi', path: `${bp}/distribusi` },
      { icon: 'barchart',  label: 'Laporan',    path: `${bp}/laporan` },
    ]
  }
  if (rawVertical === 'admin' || rawVertical === 'superadmin') {
    return [
      { icon: 'users',    label: 'Users',      path: '/admin/users' },
      { icon: 'package',  label: 'Langganan',  path: '/admin/subscriptions' },
      { icon: 'barchart', label: 'Aktivitas',  path: '/admin/activity' },
      { icon: 'settings', label: 'Pengaturan', path: '/admin/settings' },
    ]
  }
  return []
}

const SHORTCUT_ICONS = {
  clipboard: <ClipboardList size={16} />,
  package:   <Package size={16} />,
  barchart:  <BarChart2 size={16} />,
  users:     <Users size={16} />,
  shopping:  <ShoppingCart size={16} />,
  truck:     <Truck size={16} />,
  receipt:   <Receipt size={16} />,
  warehouse: <Warehouse size={16} />,
  settings:  <Settings size={16} />,
}

function VerticalShortcutsCard({ rawVertical, basePath, accent, navigate }) {
  const shortcuts = getVerticalShortcuts(rawVertical, basePath)
  if (!shortcuts.length) return null
  return (
    <Section title="Pintasan" icon={<LayoutGrid size={13} />} iconColor={accent.base} delay={0.17}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {shortcuts.map(s => (
          <button
            key={s.label}
            onClick={() => navigate(s.path)}
            style={{
              padding: '12px 4px 10px',
              background: T.surface, border: `1px solid ${T.hairline}`,
              borderRadius: 12, cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            }}
          >
            <span style={{
              width: 32, height: 32, borderRadius: 10,
              background: accent.soft, color: accent.base,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {SHORTCUT_ICONS[s.icon]}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 600, color: T.textDim,
              textAlign: 'center', letterSpacing: -0.1, lineHeight: 1.2,
            }}>
              {s.label}
            </span>
          </button>
        ))}
      </div>
    </Section>
  )
}

// ─── Section 6: Preferensi ────────────────────────────────────

function PreferencesCard() {
  const prefs = [
    { icon: <Sun size={14} />, label: 'Tema Tampilan', value: 'Gelap' },
    { icon: <Globe size={14} />, label: 'Bahasa', value: 'Bahasa Indonesia' },
    { icon: <Bell size={14} />, label: 'Notifikasi', value: 'Aktif · 3 channel' },
  ]
  return (
    <Section title="Preferensi Aplikasi" icon={<Settings size={13} />} iconColor="oklch(0.72 0.13 200)" delay={0.18}>
      <div style={cardStyle()}>
        {prefs.map((p, i) => (
          <div key={p.label} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 4px',
            borderBottom: i < prefs.length - 1 ? `1px solid ${T.hairline}` : 'none',
            opacity: 0.75,
          }}>
            <span style={{ width: 30, height: 30, borderRadius: 9, background: T.surfaceAlt, color: T.textDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {p.icon}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text, letterSpacing: -0.1 }}>{p.label}</div>
              <div style={{ fontSize: 11, color: T.textDim, marginTop: 1 }}>{p.value}</div>
            </div>
            <ChevronRight size={14} color={T.textMute} />
          </div>
        ))}
      </div>
    </Section>
  )
}

// ─── Section 7: Bantuan & Tentang ─────────────────────────────

function HelpAboutCard({ navigate }) {
  const items = [
    { icon: <HelpCircle size={14} />, label: 'Pusat Bantuan',      sub: 'FAQ, panduan, video', onClick: () => navigate('/faq') },
    { icon: <Phone size={14} />,      label: 'Hubungi Support',    sub: 'WhatsApp · live chat', onClick: () => navigate('/hubungi-kami') },
    { icon: <FileText size={14} />,   label: 'Syarat & Ketentuan', sub: null, onClick: () => navigate('/terms') },
    { icon: <Shield size={14} />,     label: 'Kebijakan Privasi',  sub: null, onClick: () => navigate('/privacy') },
  ]
  return (
    <Section title="Bantuan & Tentang" icon={<Info size={13} />} iconColor={T.textMute} delay={0.2}>
      <div style={cardStyle()}>
        {items.map((it, i) => (
          <button
            key={it.label}
            onClick={it.onClick}
            style={{
              width: '100%', textAlign: 'left',
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: '10px 4px',
              borderBottom: i < items.length - 1 ? `1px solid ${T.hairline}` : 'none',
              display: 'flex', alignItems: 'center', gap: 12,
            }}
          >
            <span style={{ width: 30, height: 30, borderRadius: 9, background: T.surfaceAlt, color: T.textDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {it.icon}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{it.label}</div>
              {it.sub && <div style={{ fontSize: 11, color: T.textDim, marginTop: 1 }}>{it.sub}</div>}
            </div>
            <ChevronRight size={14} color={T.textMute} />
          </button>
        ))}
      </div>
      <div style={{ marginTop: 8, padding: '10px 14px', textAlign: 'center', fontSize: 11, color: T.textMute }}>
        TernakOS · {APP_VERSION}
      </div>
    </Section>
  )
}

// ─── Section 8: Logout ────────────────────────────────────────

function LogoutBtn({ onLogout }) {
  return (
    <div style={{ animation: 'fadeIn 300ms ease 0.22s both' }}>
      <button
        onClick={onLogout}
        style={{
          width: '100%', marginTop: 6, marginBottom: 8, padding: '14px',
          background: 'transparent', border: `1px solid ${T.hairlineStrong}`,
          color: T.danger, borderRadius: 14, cursor: 'pointer',
          fontSize: 14, fontWeight: 600, letterSpacing: -0.1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        <LogOut size={16} strokeWidth={2} /> Logout
      </button>
    </div>
  )
}

// ─── Edit Bisnis Sheet ────────────────────────────────────────

const INDONESIA_PROVINCES = [
  'Aceh','Bali','Banten','Bengkulu','DI Yogyakarta','DKI Jakarta',
  'Gorontalo','Jambi','Jawa Barat','Jawa Tengah','Jawa Timur',
  'Kalimantan Barat','Kalimantan Selatan','Kalimantan Tengah',
  'Kalimantan Timur','Kalimantan Utara','Kepulauan Bangka Belitung',
  'Kepulauan Riau','Lampung','Maluku','Maluku Utara',
  'Nusa Tenggara Barat','Nusa Tenggara Timur','Papua','Papua Barat',
  'Papua Barat Daya','Papua Pegunungan','Papua Selatan','Papua Tengah',
  'Riau','Sulawesi Barat','Sulawesi Selatan','Sulawesi Tengah',
  'Sulawesi Tenggara','Sulawesi Utara','Sumatera Barat',
  'Sumatera Selatan','Sumatera Utara',
]

function EditBisnisSheet({ open, onClose, tenant, onSuccess, accent }) {
  const [businessName, setBusinessName] = useState(tenant?.business_name || '')
  const [location, setLocation] = useState(tenant?.location || '')
  const inferredProvince = !tenant?.province && tenant?.location && INDONESIA_PROVINCES.includes(tenant.location) ? tenant.location : ''
  const [province, setProvince] = useState(tenant?.province || inferredProvince)
  const [saving, setSaving] = useState(false)

  const originalName = tenant?.business_name || ''
  const originalLocation = tenant?.location || ''
  const originalProvince = tenant?.province || ''
  const isDirty = businessName.trim() !== originalName || location.trim() !== originalLocation || province !== originalProvince
  const isValid = businessName.trim().length > 0
  const canSave = isDirty && isValid && !saving

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    const { error } = await supabase
      .from('tenants')
      .update({
        business_name: businessName.trim(),
        location: location.trim() || null,
        province: province || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tenant.id)
    setSaving(false)
    if (error) {
      logSupabaseError(error, {
        table: 'tenants',
        operation: 'update',
        component: 'EditBisnisSheet',
        actionName: 'account.bisnis.update',
      })
      toast.error('Gagal menyimpan: ' + (error.message || 'Coba lagi'))
    } else {
      toast.success('Info bisnis berhasil diperbarui.')
      onSuccess?.()
      onClose()
    }
  }

  if (!open) return null

  const sheetStyle = {
    width: '100%', maxWidth: 480, margin: '0 auto',
    background: T.surface,
    borderRadius: '20px 20px 0 0',
    borderTop: `1px solid ${T.hairlineStrong}`,
    paddingBottom: 'calc(120px + env(safe-area-inset-bottom))',
    boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
    zIndex: 210,
    maxHeight: '90dvh', overflowY: 'auto',
    animation: 'slideUp 240ms cubic-bezier(0.32,0.72,0,1)',
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-end',
        animation: 'fadeIn 180ms ease',
      }}
    >
      <div onClick={e => e.stopPropagation()} style={sheetStyle}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: T.hairlineStrong }} />
        </div>

        {/* Header */}
        <div style={{ padding: '16px 20px 12px', borderBottom: `1px solid ${T.hairline}` }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: T.text, letterSpacing: -0.3 }}>Edit Info Bisnis</div>
          <div style={{ fontSize: 12, color: T.textDim, marginTop: 3 }}>Nama bisnis, lokasi, dan provinsi</div>
        </div>

        {/* Form */}
        <div style={{ padding: '20px 20px 8px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Business Name */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>
              Nama Bisnis <span style={{ color: T.danger }}>*</span>
            </label>
            <input
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              placeholder="Nama bisnis"
              style={{
                width: '100%', padding: '12px 14px', boxSizing: 'border-box',
                background: T.surfaceAlt, border: `1px solid ${businessName.trim() ? accent.base + '55' : T.hairline}`,
                borderRadius: 12, color: T.text, fontSize: 16, outline: 'none',
              }}
            />
          </div>

          {/* Provinsi — dropdown */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>
              Provinsi <span style={{ color: T.warn }}>⚠</span>
              <span style={{ fontSize: 10, fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 4 }}>
                — diperlukan untuk filter regional
              </span>
            </label>
            <select
              value={province}
              onChange={e => setProvince(e.target.value)}
              style={{
                width: '100%', padding: '12px 14px', boxSizing: 'border-box',
                background: T.surfaceAlt, border: `1px solid ${province ? accent.base + '55' : 'oklch(0.78 0.14 70 / 0.5)'}`,
                borderRadius: 12, color: province ? T.text : T.textDim, fontSize: 16, outline: 'none',
                appearance: 'none', WebkitAppearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239BA29B' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center',
                paddingRight: 36,
              }}
            >
              <option value="">— Pilih provinsi —</option>
              {INDONESIA_PROVINCES.map(p => (
                <option key={p} value={p} style={{ background: T.surface, color: T.text }}>{p}</option>
              ))}
            </select>
          </div>

          {/* Lokasi / Kota */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>
              Kota / Lokasi <span style={{ fontSize: 10, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opsional)</span>
            </label>
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Contoh: Malang, Jawa Timur"
              style={{
                width: '100%', padding: '12px 14px', boxSizing: 'border-box',
                background: T.surfaceAlt, border: `1px solid ${T.hairline}`,
                borderRadius: 12, color: T.text, fontSize: 16, outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: '12px 20px 20px', display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              flex: 1, padding: '13px',
              background: 'transparent', border: `1px solid ${T.hairlineStrong}`,
              color: T.textDim, borderRadius: 12, cursor: 'pointer',
              fontSize: 14, fontWeight: 600,
            }}
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            style={{
              flex: 2, padding: '13px',
              background: canSave ? accent.base : T.hairlineStrong,
              border: 'none', color: canSave ? '#0A0E0C' : T.textMute,
              borderRadius: 12, cursor: canSave ? 'pointer' : 'not-allowed',
              fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'background 150ms',
            }}
          >
            {saving ? 'Menyimpan...' : <><MapPin size={14} /> Simpan</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Edit Profile Sheet ───────────────────────────────────────

function EditProfileSheet({ open, onClose, profile, user, onSuccess, accent }) {
  const [name, setName] = useState(profile?.full_name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [saving, setSaving] = useState(false)

  const originalName = profile?.full_name || ''
  const originalPhone = profile?.phone || ''
  const isDirty = name.trim() !== originalName || phone.trim() !== originalPhone
  const isValid = name.trim().length > 0
  const canSave = isDirty && isValid && !saving

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)

    const payload = {
      full_name: name.trim(),
      phone: phone.trim() || null,
      updated_at: new Date().toISOString(),
    }

    let query = supabase.from('profiles').update(payload)

    if (profile?.profile_id) {
      query = query.eq('id', profile.profile_id)
    } else if (profile?.tenant_id && user?.id) {
      query = query.eq('auth_user_id', user.id).eq('tenant_id', profile.tenant_id)
    } else if (user?.id) {
      query = query.eq('auth_user_id', user.id)
    }

    const { error } = await query
    setSaving(false)

    if (error) {
      logSupabaseError(error, {
        table: 'profiles',
        operation: 'update',
        component: 'EditProfileSheet',
        actionName: 'handleSave',
      })
      toast.error('Gagal menyimpan: ' + (error.message || 'Coba lagi'))
    } else {
      toast.success('Profil berhasil diperbarui.')
      onSuccess?.()
      onClose()
    }
  }

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-end',
        animation: 'fadeIn 180ms ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480, margin: '0 auto',
          background: T.surface,
          borderRadius: '20px 20px 0 0',
          borderTop: `1px solid ${T.hairlineStrong}`,
          paddingBottom: 'calc(120px + env(safe-area-inset-bottom))',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
          zIndex: 210,
          maxHeight: '90dvh', overflowY: 'auto',
          animation: 'slideUp 240ms cubic-bezier(0.32,0.72,0,1)',
        }}
      >
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%) }
            to   { transform: translateY(0) }
          }
        `}</style>

        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: T.hairlineStrong }} />
        </div>

        {/* Header */}
        <div style={{ padding: '16px 20px 12px', borderBottom: `1px solid ${T.hairline}` }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: T.text, letterSpacing: -0.3 }}>Edit Profil</div>
          <div style={{ fontSize: 12, color: T.textDim, marginTop: 3 }}>Perbarui informasi dasar akun Anda</div>
        </div>

        {/* Form */}
        <div style={{ padding: '20px 20px 8px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Full Name */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>
              Nama Lengkap <span style={{ color: T.danger }}>*</span>
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nama lengkap"
              style={{
                width: '100%', padding: '12px 14px',
                background: T.surfaceAlt, border: `1px solid ${name.trim() ? accent.base + '55' : T.hairline}`,
                borderRadius: 12, color: T.text, fontSize: 15, outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 150ms',
              }}
            />
            {name.trim().length === 0 && (
              <div style={{ fontSize: 11, color: T.danger, marginTop: 5 }}>Nama tidak boleh kosong</div>
            )}
          </div>

          {/* Phone */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>
              Nomor HP <span style={{ fontSize: 10, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opsional)</span>
            </label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="08xx-xxxx-xxxx"
              type="tel"
              style={{
                width: '100%', padding: '12px 14px',
                background: T.surfaceAlt, border: `1px solid ${T.hairline}`,
                borderRadius: 12, color: T.text, fontSize: 15, outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Email — readonly */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>
              Email
            </label>
            <div style={{
              padding: '12px 14px',
              background: T.surfaceAlt + '88', border: `1px solid ${T.hairline}`,
              borderRadius: 12, color: T.textDim, fontSize: 15,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
            }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email || '—'}
              </span>
              <span style={{ fontSize: 10, fontWeight: 600, color: T.textMute, flexShrink: 0, letterSpacing: 0.3, textTransform: 'uppercase' }}>Read-only</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: '12px 20px 20px', display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              flex: 1, padding: '13px',
              background: 'transparent', border: `1px solid ${T.hairlineStrong}`,
              color: T.textDim, borderRadius: 12, cursor: 'pointer',
              fontSize: 14, fontWeight: 600,
            }}
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            style={{
              flex: 2, padding: '13px',
              background: canSave ? accent.base : T.surfaceAlt,
              border: 'none', borderRadius: 12,
              cursor: canSave ? 'pointer' : 'default',
              color: canSave ? '#0A0E0C' : T.textMute,
              fontSize: 14, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'background 150ms, color 150ms',
              boxShadow: canSave ? `0 6px 18px ${accent.base}55` : 'none',
            }}
          >
            {saving ? (
              <>
                <span style={{ width: 14, height: 14, borderRadius: 999, border: `2px solid currentColor`, borderTopColor: 'transparent', animation: 'spin 600ms linear infinite', display: 'inline-block' }} />
                Menyimpan...
              </>
            ) : 'Simpan'}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// ─── Reusable primitives ──────────────────────────────────────

function Section({ title, icon, iconColor, rightAction, delay = 0, children }) {
  return (
    <div style={{ marginBottom: 18, animation: `fadeInUp 300ms ease ${delay}s both` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 2px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 22, height: 22, borderRadius: 7, background: iconColor + '22', color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: T.text, letterSpacing: 0.4, textTransform: 'uppercase' }}>{title}</span>
        </div>
        {rightAction}
      </div>
      {children}
    </div>
  )
}

function SectionLabel({ label }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: T.textMute, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8, paddingLeft: 2 }}>
      {label}
    </div>
  )
}

function InfoRow({ label, value, children, noBorder }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 4px',
      borderBottom: noBorder ? 'none' : `1px solid ${T.hairline}`,
      gap: 12,
    }}>
      <span style={{ fontSize: 12, color: T.textDim, fontWeight: 500, flexShrink: 0 }}>{label}</span>
      {children || <span style={{ fontSize: 13, color: T.text, fontWeight: 600, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>}
    </div>
  )
}

// ─── Danger Zone ──────────────────────────────────────────────

function DangerZoneCard({ tenantName, onDelete }) {
  return (
    <Section title="Zona Berbahaya" icon={<AlertTriangle size={13} />} iconColor={T.danger} delay={0.21}>
      <div style={{
        ...cardStyle(),
        border: `1px solid ${T.danger}33`,
        background: `${T.danger}08`,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingBottom: 12, borderBottom: `1px solid ${T.hairline}` }}>
          <span style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, background: `${T.danger}18`, color: T.danger, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
            <Trash2 size={15} />
          </span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 3 }}>Hapus Bisnis</div>
            <div style={{ fontSize: 12, color: T.textDim, lineHeight: 1.5 }}>
              Menghapus <strong style={{ color: T.text }}>{tenantName}</strong> beserta seluruh data secara permanen. Tindakan ini tidak dapat dibatalkan.
            </div>
          </div>
        </div>
        <button
          onClick={onDelete}
          style={{
            marginTop: 12, width: '100%', padding: '11px',
            background: 'transparent', border: `1px solid ${T.danger}55`,
            color: T.danger, borderRadius: 10, cursor: 'pointer',
            fontSize: 13, fontWeight: 700, letterSpacing: -0.1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          <Trash2 size={14} strokeWidth={2.5} /> Hapus Bisnis Ini...
        </button>
      </div>
    </Section>
  )
}

// ─── Delete Business Dialog ───────────────────────────────────

function DeleteBusinessDialog({ tenant, profiles, onClose, onDeleted }) {
  const tenantName = tenant?.business_name || 'Bisnis Aktif'
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const isLastBusiness = profiles.filter(p => p.tenant_id !== tenant?.id).length === 0
  const nameMatches = confirmText.trim().toLowerCase() === tenantName.toLowerCase()

  const handleDelete = async () => {
    if (!nameMatches || deleting) return
    setDeleting(true)
    const { error } = await supabase.rpc('delete_my_business', { p_tenant_id: tenant.id })
    setDeleting(false)
    if (error) {
      logSupabaseError(error, {
        table: 'rpc:delete_my_business',
        operation: 'rpc',
        component: 'DeleteBusinessDialog',
        actionName: 'account.business.delete',
      })
      logError({
        level: 'error',
        source: 'supabase',
        component: 'DeleteBusinessDialog',
        actionName: 'account.business.delete',
        error,
        metadata: { tenant_id: tenant?.id },
      })
      if (error.message?.includes('ACCESS_DENIED')) {
        toast.error('Hanya pemilik bisnis yang bisa menghapus bisnis ini.')
      } else {
        toast.error('Gagal menghapus bisnis: ' + (error.message || 'Coba lagi'))
      }
      return
    }
    toast.success(`${tenantName} berhasil dihapus.`)
    onDeleted()
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-end',
        animation: 'fadeIn 180ms ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480, margin: '0 auto',
          background: T.surface,
          borderRadius: '20px 20px 0 0',
          borderTop: `2px solid ${T.danger}55`,
          paddingBottom: 'calc(32px + env(safe-area-inset-bottom))',
          boxShadow: `0 -8px 40px rgba(0,0,0,0.6), 0 -2px 0 ${T.danger}33`,
          animation: 'slideUp 240ms cubic-bezier(0.32,0.72,0,1)',
          maxHeight: '90dvh', overflowY: 'auto',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: T.hairlineStrong }} />
        </div>

        {/* Header */}
        <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${T.hairline}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 13, background: `${T.danger}18`, color: T.danger, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Trash2 size={20} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: T.text, letterSpacing: -0.3 }}>Hapus Bisnis?</div>
            <div style={{ fontSize: 12, color: T.textDim, marginTop: 2 }}>Semua data akan dihapus permanen</div>
          </div>
        </div>

        <div style={{ padding: '20px 20px 8px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Warning box */}
          <div style={{
            padding: '14px', borderRadius: 12,
            background: `${T.danger}10`, border: `1px solid ${T.danger}30`,
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <AlertTriangle size={16} color={T.danger} style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 12, color: T.textDim, lineHeight: 1.6 }}>
              Menghapus <strong style={{ color: T.text }}>{tenantName}</strong> akan menghapus permanen semua transaksi, laporan, data kandang, dan anggota tim bisnis ini.
              {isLastBusiness && (
                <><br /><br /><span style={{ color: T.warn }}>⚠ Ini adalah bisnis terakhir Anda. Setelah dihapus, Anda perlu membuat bisnis baru untuk menggunakan TernakOS.</span></>
              )}
            </div>
          </div>

          {/* Confirm input */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>
              Ketik nama bisnis untuk konfirmasi
            </label>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.danger, background: `${T.danger}12`, border: `1px solid ${T.danger}30`, borderRadius: 8, padding: '6px 12px', marginBottom: 8, letterSpacing: 0.2 }}>
              {tenantName}
            </div>
            <input
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder={`Ketik: ${tenantName}`}
              autoComplete="off"
              style={{
                width: '100%', padding: '12px 14px',
                background: T.surfaceAlt,
                border: `1px solid ${nameMatches ? T.danger + '88' : T.hairline}`,
                borderRadius: 12, color: T.text, fontSize: 15, outline: 'none',
                boxSizing: 'border-box', transition: 'border-color 150ms',
              }}
            />
            {confirmText.length > 0 && !nameMatches && (
              <div style={{ fontSize: 11, color: T.textDim, marginTop: 5 }}>Nama belum sesuai</div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: '8px 20px 0', display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            disabled={deleting}
            style={{
              flex: 1, padding: '13px',
              background: 'transparent', border: `1px solid ${T.hairlineStrong}`,
              color: T.textDim, borderRadius: 12, cursor: 'pointer',
              fontSize: 14, fontWeight: 600,
            }}
          >
            Batal
          </button>
          <button
            onClick={handleDelete}
            disabled={!nameMatches || deleting}
            style={{
              flex: 2, padding: '13px',
              background: nameMatches && !deleting ? T.danger : T.surfaceAlt,
              border: 'none', borderRadius: 12,
              cursor: nameMatches && !deleting ? 'pointer' : 'default',
              color: nameMatches && !deleting ? '#fff' : T.textMute,
              fontSize: 14, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'background 150ms, color 150ms',
              boxShadow: nameMatches && !deleting ? `0 6px 18px ${T.danger}44` : 'none',
            }}
          >
            {deleting ? (
              <>
                <span style={{ width: 14, height: 14, borderRadius: 999, border: '2px solid currentColor', borderTopColor: 'transparent', animation: 'spin 600ms linear infinite', display: 'inline-block' }} />
                Menghapus...
              </>
            ) : (
              <><Trash2 size={14} /> Hapus Selamanya</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
