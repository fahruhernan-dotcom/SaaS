import React from 'react'
import { motion } from 'framer-motion'
import {
  Users, Building2, TrendingUp, Clock,
  DollarSign, AlertTriangle, Bird, Egg,
  Home, Factory, ChevronRight, CheckCircle,
  RefreshCw
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { useGlobalStats, useAdminUpdateTenant } from '@/lib/hooks/useAdminData'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatIDR } from '@/lib/format'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'

// ── Custom Tooltip ────────────────────────────────────────────

function DarkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#111C24] border border-white/10 rounded-xl px-3 py-2 shadow-xl">
      <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest mb-1">{label}</p>
      <p className="text-[13px] font-black text-white">{payload[0].value} tenant</p>
    </div>
  )
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#111C24] border border-white/10 rounded-xl px-3 py-2 shadow-xl">
      <p className="text-[13px] font-black text-white">{payload[0].name}: {payload[0].value}</p>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-6 pb-12 animate-pulse">
      {/* Header */}
      <div className="h-10 w-64 bg-white/5 rounded-2xl" />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 bg-white/5 rounded-2xl" />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 h-64 bg-white/5 rounded-2xl" />
        <div className="lg:col-span-2 h-64 bg-white/5 rounded-2xl" />
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-48 bg-white/5 rounded-2xl" />
        <div className="h-48 bg-white/5 rounded-2xl" />
      </div>

      {/* Verticals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 bg-white/5 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────

export default function AdminBeranda() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: stats, isLoading, isError } = useGlobalStats()
  const updateTenant = useAdminUpdateTenant()

  const handleExtendTrial = (tenantId) => {
    const newEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    updateTenant.mutate(
      { tenantId, updates: { trial_ends_at: newEnd } },
      { onSuccess: () => queryClient.invalidateQueries(['admin-global-stats']) }
    )
  }

  // ── Loading ──
  if (isLoading || !stats) return <LoadingSkeleton />

  // ── Error ──
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center max-w-sm">
          <AlertTriangle size={32} className="text-red-500 mx-auto mb-3 opacity-70" />
          <p className="text-white font-bold text-sm mb-1">Gagal memuat data</p>
          <p className="text-[#4B6478] text-xs mb-4">Coba refresh halaman atau periksa koneksi.</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => queryClient.invalidateQueries(['admin-global-stats'])}
            className="border-white/10 text-white hover:bg-white/5 text-xs font-black uppercase tracking-widest"
          >
            <RefreshCw size={13} className="mr-2" /> Refresh
          </Button>
        </div>
      </div>
    )
  }

  // ── Derived data ──
  const pieData = [
    { name: 'Starter', value: stats.tenants.starter, color: '#4B6478' },
    { name: 'Pro', value: stats.tenants.pro, color: '#10B981' },
    { name: 'Business', value: stats.tenants.business, color: '#F59E0B' },
  ]

  const pendingCount = stats.revenue.pendingList.length
  const expiringCount = stats.tenants.trialExpiringSoon.length

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-12"
    >

      {/* ── SECTION A — Header ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-0 z-20 bg-[#080C10]/80 backdrop-blur-md py-2 -mx-2 px-2 rounded-xl">
        <div>
          <h1 className="font-display text-2xl font-bold text-white uppercase tracking-tight">
            OVERVIEW
          </h1>
          <p className="text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mt-1">
            Platform health & business metrics
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={() => queryClient.invalidateQueries(['admin-global-stats'])}
            className="h-9 rounded-xl border-white/10 text-white/40 hover:text-white hover:bg-white/5 text-[10px] font-black uppercase tracking-widest px-4"
          >
            <RefreshCw size={13} className="mr-2" /> Sync Data
          </Button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
              LIVE
            </span>
          </div>
        </div>
      </div>

      {/* ── SECTION B — KPI Row ──────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Card 1: Tenant Aktif */}
        <KPICard
          label="Tenant Aktif"
          value={stats.tenants.active}
          sub={`${stats.tenants.total} terdaftar`}
          icon={Building2}
          iconColor="text-emerald-400 bg-emerald-500/10"
        />

        {/* Card 2: Total User */}
        <KPICard
          label="Total User"
          value={stats.users.total}
          sub={`${stats.users.activeThisWeek} aktif minggu ini`}
          icon={Users}
          iconColor="text-[#60A5FA] bg-blue-500/10"
        />

        {/* Card 3: Tenant Baru */}
        <KPICard
          label="Tenant Baru"
          value={stats.tenants.newThisMonth}
          sub="bergabung 30 hari terakhir"
          icon={TrendingUp}
          iconColor="text-emerald-400 bg-emerald-500/10"
        />

        {/* Card 4: Revenue Bulan Ini */}
        <KPICard
          label="Revenue Bulan Ini"
          value={formatIDR(stats.revenue.thisMonth)}
          sub={`Total: ${formatIDR(stats.revenue.total)}`}
          icon={DollarSign}
          iconColor="text-emerald-400 bg-emerald-500/10"
          accentLeft="border-l-2 border-emerald-500"
        />

        {/* Card 5: Invoice Pending */}
        <KPICard
          label="Invoice Pending"
          value={pendingCount > 0 ? pendingCount : '0'}
          sub={pendingCount > 0
            ? `${formatIDR(stats.revenue.pendingAmount)} menunggu`
            : 'Semua terkonfirmasi ✓'
          }
          icon={Clock}
          iconColor={pendingCount > 0 ? 'text-[#F59E0B] bg-amber-500/10' : 'text-emerald-400 bg-emerald-500/10'}
          valueColor={pendingCount > 0 ? 'text-[#F59E0B]' : 'text-emerald-400'}
          accentLeft={pendingCount > 0 ? 'border-l-2 border-amber-500' : ''}
        />

        {/* Card 6: Trial Akan Habis */}
        <KPICard
          label="Trial Akan Habis"
          value={expiringCount > 0 ? expiringCount : '0'}
          sub="dalam 7 hari ke depan"
          icon={AlertTriangle}
          iconColor={expiringCount > 0 ? 'text-red-400 bg-red-500/10' : 'text-[#4B6478] bg-white/5'}
          valueColor={expiringCount > 0 ? 'text-red-400' : 'text-white'}
          accentLeft={expiringCount > 0 ? 'border-l-2 border-red-500' : ''}
          pulse={expiringCount > 0}
        />
      </div>

      {/* ── SECTION C — Charts ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Area Chart — Pertumbuhan Tenant */}
        <Card className="lg:col-span-3 bg-[#111C24] border-white/8 rounded-2xl p-5 shadow-2xl overflow-hidden">
          <p className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.3em] font-display mb-3">
            PERTUMBUHAN TENANT — 6 BULAN
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats.tenants.growthData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(16,185,129,0.2)" />
                  <stop offset="100%" stopColor="rgba(16,185,129,0)" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#4B6478', fontSize: 10, fontWeight: 700 }}
                dy={8}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#4B6478', fontSize: 10, fontWeight: 700 }}
              />
              <Tooltip content={<DarkTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#10B981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#emeraldGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Pie Chart — Distribusi Plan */}
        <Card className="lg:col-span-2 bg-[#111C24] border-white/8 rounded-2xl p-5 shadow-2xl flex flex-col">
          <p className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.3em] font-display mb-3">
            DISTRIBUSI PLAN
          </p>
          <div className="relative flex-1">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-2xl font-display font-black text-white">{stats.tenants.total}</p>
              <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest mt-0.5">Total</p>
            </div>
          </div>
          {/* Legend */}
          <div className="flex justify-center gap-5 mt-2">
            {pieData.map(p => {
              const pct = stats.tenants.total > 0
                ? Math.round((p.value / stats.tenants.total) * 100)
                : 0
              return (
                <div key={p.name} className="flex flex-col items-center gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest">{p.name}</span>
                  </div>
                  <p className="text-xs font-black text-white">{p.value}</p>
                  <p className="text-[9px] text-[#4B6478] font-bold">{pct}%</p>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* ── SECTION D — Actionable Queues ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Trial Akan Habis */}
        <Card className="bg-[#111C24] border-white/8 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.2em]">
              TRIAL AKAN HABIS
            </p>
            {expiringCount > 0 ? (
              <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[9px] font-black uppercase">
                {expiringCount} tenant
              </Badge>
            ) : (
              <CheckCircle size={14} className="text-emerald-500/40" />
            )}
          </div>

          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
            {stats.tenants.trialExpiringSoon.length > 0 ? (
              stats.tenants.trialExpiringSoon.map(t => {
                const daysLeft = Math.ceil((new Date(t.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24))
                const urgency = daysLeft <= 3 ? 'text-red-400' : 'text-amber-400'
                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all"
                  >
                    <div>
                      <p className="text-[12px] font-bold text-white leading-tight">{t.business_name}</p>
                      <p className={`text-[9px] font-black uppercase mt-1 tracking-wider ${urgency}`}>
                        Expires in {daysLeft} days
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updateTenant.isPending}
                      onClick={() => handleExtendTrial(t.id)}
                      className="h-7 rounded-lg border-white/10 text-white/40 text-[9px] font-black uppercase tracking-widest px-3 hover:bg-emerald-500 hover:text-white"
                    >
                      Extend
                    </Button>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-6 flex flex-col items-center gap-2 opacity-30">
                <p className="text-[10px] font-bold uppercase tracking-widest">Antrian Bersih</p>
              </div>
            )}
          </div>
        </Card>

        {/* Invoice Menunggu */}
        <Card className="bg-[#111C24] border-white/8 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.2em]">
              PENDING INVOICES
            </p>
            {pendingCount > 0 ? (
              <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[9px] font-black uppercase">
                {pendingCount} pending
              </Badge>
            ) : (
              <CheckCircle size={14} className="text-emerald-500/40" />
            )}
          </div>

          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
            {stats.revenue.pendingList.length > 0 ? (
              stats.revenue.pendingList.map(inv => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all"
                >
                  <div className="min-w-0">
                    <p className="text-emerald-400 font-mono text-xs font-bold leading-tight uppercase">
                      #{inv.invoice_number?.substring(0, 8)}
                    </p>
                    <p className="text-[#4B6478] text-[10px] font-bold uppercase mt-0.5 truncate">
                      {inv.tenants?.business_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <p className="font-display text-[12px] font-black text-white">
                      {formatIDR(inv.amount)}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate('/admin/subscriptions')}
                      className="h-7 w-7 p-0 rounded-lg border-white/10 text-[#4B6478] hover:text-amber-400 transition-colors"
                    >
                      <ChevronRight size={14} />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 flex flex-col items-center gap-2 opacity-30">
                <p className="text-[10px] font-bold uppercase tracking-widest">Semua Lunas</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ── SECTION E — Distribusi Vertikal ──────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <VerticalCard label="Broker Ayam" value={stats.tenants.byVertical.poultry_broker} icon={Bird} color="emerald" />
        <VerticalCard label="Broker Telur" value={stats.tenants.byVertical.egg_broker} icon={Egg} color="blue" />
        <VerticalCard label="Peternak" value={stats.tenants.byVertical.peternak} icon={Home} color="purple" />
        <VerticalCard label="RPA" value={stats.tenants.byVertical.rpa} icon={Factory} color="amber" />
      </div>
    </motion.div>
  )
}

// ── Internal Sub-components ───────────────────────────────────

function KPICard({ label, value, sub, icon: Icon, iconColor, valueColor = 'text-white', accentLeft = '', pulse = false }) {
  return (
    <div className={`bg-[#111C24] rounded-2xl p-5 border border-white/8 ${accentLeft} ${pulse ? 'animate-pulse-subtle' : ''}`}>
      <p className="text-[11px] uppercase tracking-widest text-[#4B6478] font-display font-black mb-3">
        {label}
      </p>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className={`text-2xl font-display font-bold leading-none ${valueColor}`}>
            {value}
          </p>
          {sub && (
            <p className="text-[10px] text-[#4B6478] font-bold mt-1.5 leading-tight">{sub}</p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  )
}

function VerticalCard({ label, value, icon: Icon, color }) {
  const themes = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    blue: 'bg-blue-500/10    text-blue-400    border-blue-500/20',
    purple: 'bg-purple-500/10  text-purple-400  border-purple-500/20',
    amber: 'bg-amber-500/10   text-amber-400   border-amber-500/20',
  }
  return (
    <div className="bg-[#111C24] rounded-xl p-4 border border-white/8 flex items-center gap-3 hover:border-white/15 transition-all">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${themes[color]}`}>
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-[15px] font-black text-white leading-none">{value}</p>
        <p className="text-[9px] font-bold text-[#4B6478] uppercase tracking-widest mt-1 leading-none truncate">{label}</p>
      </div>
    </div>
  )
}
