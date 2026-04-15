import React from 'react'

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
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { getSubscriptionStatus } from '@/lib/subscriptionUtils'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatIDR, toTitleCase } from '@/lib/format'
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
    <div className="space-y-4 pb-12 animate-pulse">
      {/* Revenue Hero Skeleton */}
      <div className="h-28 lg:h-32 bg-white/5 rounded-2xl w-full" />

      {/* Other KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-white/5 rounded-2xl" />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 h-64 bg-white/5 rounded-2xl" />
        <div className="lg:col-span-2 h-64 bg-white/5 rounded-2xl" />
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────

export default function AdminBeranda() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
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

  const pendingCount      = stats.revenue.pendingList.length
  const expiringCount     = stats.tenants.trialExpiringSoon.length
  const planExpiringCount = stats.tenants.planExpiringSoon.length
  const planExpiredCount  = stats.tenants.planAlreadyExpired.length

  return (
    <div>

      {/* ── SECTION A — Header Actions ────────────────────────── */}
      <div className="flex items-center justify-between py-2 -mx-2 px-2">
        <div className="hidden lg:block">
          <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight">
            PLATFORM OVERVIEW
          </h1>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Platform health & business metrics
          </p>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => queryClient.invalidateQueries(['admin-global-stats'])}
            className="h-9 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 text-[10px] font-black uppercase tracking-widest px-4"
          >
            <RefreshCw size={13} className="mr-2" /> Sync
          </Button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
              LIVE
            </span>
          </div>
        </div>
      </div>

      {/* ── SECTION B — KPI Cards ────────────────────────────── */}
      <div className="space-y-3 lg:space-y-4">
        {/* REVENUE HERO CARD — Promoted for visual hierarchy */}
        <KPICard
          label="REVENUE BULAN INI"
          value={formatIDR(stats.revenue.thisMonth)}
          sub={`Total Akumulasi: ${formatIDR(stats.revenue.total)}`}
          icon={DollarSign}
          iconColor="text-emerald-400 bg-emerald-500/10"
          accentLeft={expiringCount > 0 ? 'border-l-2 border-red-500' : ''}
          pulse={expiringCount > 0}
        />

        {/* Card 7: Plan Paid Akan Expired */}
        <KPICard
          label="Plan Akan Expired"
          value={planExpiringCount > 0 ? planExpiringCount : planExpiredCount > 0 ? planExpiredCount : '0'}
          sub={planExpiredCount > 0
            ? `${planExpiredCount} sudah expired — belum downgrade`
            : planExpiringCount > 0
              ? 'Pro/Business dalam 30 hari'
              : 'Semua plan aktif ✓'
          }
          icon={Clock}
          iconColor={planExpiredCount > 0
            ? 'text-red-400 bg-red-500/10'
            : planExpiringCount > 0
              ? 'text-amber-400 bg-amber-500/10'
              : 'text-[#4B6478] bg-white/5'
          }
          valueColor={planExpiredCount > 0
            ? 'text-red-400'
            : planExpiringCount > 0
              ? 'text-amber-400'
              : 'text-white'
          }
          accentLeft={planExpiredCount > 0
            ? 'border-l-2 border-red-500'
            : planExpiringCount > 0
              ? 'border-l-2 border-amber-500'
              : ''
          }
          pulse={planExpiredCount > 0}
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
            <AreaChart data={stats.tenants.growthData} margin={{ top: 10, right: 25, bottom: 0, left: 0 }}>
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
                const sub = getSubscriptionStatus(t)
                const daysLeft = sub.daysLeft
                const urgency = daysLeft <= 3 ? 'text-red-400' : 'text-amber-400'
                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all"
                  >
                    <div>
                      <p className="text-[12px] font-bold text-white leading-tight">{toTitleCase(t.business_name)}</p>
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
                    <p className="text-[#4B6478] text-[10px] font-bold mt-0.5 truncate">
                      {toTitleCase(inv.tenants?.business_name)}
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
    </div>
  )
}

// ── Internal Sub-components ───────────────────────────────────

function KPICard({ label, value, sub, icon: Icon, iconColor, valueColor = 'text-white', accentLeft = '', pulse = false, compact = false, hero = false }) {
  if (hero) {
    return (
      <div className={`bg-gradient-to-br from-[#111C24] to-[#0A0F14] rounded-2xl p-6 border border-white/8 relative overflow-hidden shadow-2xl ${accentLeft}`}>
         <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -mr-10 -mt-10" />
         <div className="flex items-center justify-between relative z-10">
            <div>
               <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] mb-4 font-display">{label}</p>
               <p className="text-3xl lg:text-4xl font-display font-black text-white leading-none mb-3">{value}</p>
               <div className="flex items-center gap-2">
                  <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                     <span className="text-[10px] font-black text-emerald-400 uppercase">Bulan Berjalan</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-500">{sub}</p>
               </div>
            </div>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-xl ${iconColor}`}>
               <Icon size={24} />
            </div>
         </div>
      </div>
    )
  }

  if (compact) {
    return (
      <div className={`bg-[#111C24] rounded-xl p-3 lg:p-4 border border-white/8 flex flex-col items-center justify-center text-center shadow-lg active:scale-95 transition-transform ${pulse ? 'animate-pulse-subtle' : ''}`}>
        <div className={`w-7 h-7 lg:w-9 lg:h-9 rounded-lg lg:rounded-xl flex items-center justify-center mb-2 ${iconColor}`}>
           <Icon size={14} className="lg:size-16" />
        </div>
        <p className={`text-sm lg:text-lg font-display font-black leading-none ${valueColor}`}>
          {value}
        </p>
        <p className="text-[8px] lg:text-[10px] uppercase tracking-wider text-slate-400 font-black mt-2">
          {label}
        </p>
      </div>
    )
  }

  return (
    <div className={`bg-[#111C24] rounded-2xl p-5 border border-white/8 ${accentLeft} ${pulse ? 'animate-pulse-subtle' : ''}`}>
      <p className="text-[11px] uppercase tracking-widest text-slate-400 font-display font-black mb-4">
        {label}
      </p>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className={`text-2xl font-display font-bold leading-none ${valueColor}`}>
            {value}
          </p>
          {sub && (
            <p className="text-[10px] text-slate-400 font-bold mt-2 leading-tight">{sub}</p>
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
