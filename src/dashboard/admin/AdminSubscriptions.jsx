import React, { useState, useMemo, useEffect } from 'react'
import { cn } from '@/lib/utils'

import { useQueryClient } from '@tanstack/react-query'
import {
  CreditCard, Banknote, History, Search,
  CheckCircle2, XCircle, Clock, Check, ChevronRight,
  ExternalLink, Globe, AlertCircle, AlertTriangle, Zap,
  Plus, Edit2, Trash2, Download, FileText, X, CalendarDays,
  Eye, EyeOff, Copy, Wifi, WifiOff,
  Bird, Egg, Home, Factory, Building2
} from 'lucide-react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import {
  useAllInvoices,
  useConfirmInvoice,
  usePaymentSettings,
  useUpsertPaymentSetting,
  useDeletePaymentSetting,
  useCreateInvoice,
  useDeleteInvoice,
  useAllTenants,
  usePricingConfig,
  useXenditConfig,
  useSaveXenditConfig
} from '@/lib/hooks/useAdminData'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { InputRupiah } from '@/components/ui/InputRupiah'
import { DatePicker } from '@/components/ui/DatePicker'
import { formatIDR, formatDate, toTitleCase } from '@/lib/format'
import { getSubscriptionStatus } from '@/lib/subscriptionUtils'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

function getVerticalIcon(v) {
  switch (v) {
    case 'poultry_broker': return <Bird size={18} />
    case 'egg_broker': return <Egg size={18} />
    case 'peternak': return <Home size={18} />
    case 'rpa': return <Factory size={18} />
    default: return <Building2 size={18} />
  }
}

export default function AdminSubscriptions() {
  const queryClient = useQueryClient()
  const { data: invoices, isLoading: isLoadingInvoices } = useAllInvoices()
  const { data: bankAccounts, isLoading: isLoadingBanks } = usePaymentSettings()
  const { data: allTenants } = useAllTenants()
  const { data: pricingConfig } = usePricingConfig()
  const confirmInvoice = useConfirmInvoice()
  const upsertBank = useUpsertPaymentSetting()
  const deleteBank = useDeletePaymentSetting()
  const createInvoice = useCreateInvoice()
  const deleteInvoice = useDeleteInvoice()

  const [activeMainTab, setActiveMainTab] = useState('invoices')
  const [invoiceSearch, setInvoiceSearch] = useState('')
  const [invoiceTab, setInvoiceTab] = useState('Semua')
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [confirmNotes, setConfirmNotes] = useState('')
  const [isBankModalOpen, setIsBankModalOpen] = useState(false)
  const [editingBank, setEditingBank] = useState(null)
  const [isGenerateOpen, setIsGenerateOpen] = useState(false)
  const [genForm, setGenForm] = useState({ tenantId: '', plan: 'pro', billingMonths: 1, discountPct: 0, notes: '' })
  const [manualPrice, setManualPrice] = useState(0)
  const [confirmSuccess, setConfirmSuccess] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const ITEMS_PER_PAGE = 20
  const today = new Date().toISOString().slice(0, 10)

  // Stats calculation
  const stats = useMemo(() => {
    if (!invoices) return { pending: 0, paidMonth: 0, totalRevenue: 0, failed: 0 }
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    return invoices.reduce((acc, inv) => {
      if (inv.status === 'pending') acc.pending += 1
      if (inv.status === 'paid') {
        acc.totalRevenue += inv.amount
        const paidAt = inv.paid_at ? new Date(inv.paid_at) : null
        if (paidAt && paidAt >= thirtyDaysAgo) acc.paidMonth += 1
      }
      if (inv.status === 'expired' || inv.status === 'cancelled') acc.failed += 1
      return acc
    }, { pending: 0, paidMonth: 0, totalRevenue: 0, failed: 0 })
  }, [invoices])

  // Filtering invoices (includes date range)
  const filteredInvoices = useMemo(() => {
    if (!invoices) return []
    return invoices.filter(inv => {
      const bizName = inv.tenants?.business_name || ''
      const invNum = inv.invoice_number || ''
      const matchesSearch = bizName.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
        invNum.toLowerCase().includes(invoiceSearch.toLowerCase())
      let matchesTab = true
      if (invoiceTab === 'Pending') matchesTab = inv.status === 'pending'
      else if (invoiceTab === 'Paid') matchesTab = inv.status === 'paid'
      else if (invoiceTab === 'Expired') matchesTab = inv.status === 'expired'
      else if (invoiceTab === 'Cancelled') matchesTab = inv.status === 'cancelled'
      const matchesFrom = !dateFrom || inv.created_at >= dateFrom
      const matchesTo = !dateTo || inv.created_at <= dateTo + 'T23:59:59'
      return matchesSearch && matchesTab && matchesFrom && matchesTo
    })
  }, [invoices, invoiceSearch, invoiceTab, dateFrom, dateTo])

  // Reset to page 1 whenever filters change
  useEffect(() => { setCurrentPage(1) }, [invoiceSearch, invoiceTab, dateFrom, dateTo])

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE))
  const pagedInvoices = filteredInvoices.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  // Generate invoice price calculation (FIX 3: fallback chain)
  const genTenant = allTenants?.find(t => t.id === genForm.tenantId)
  const genVertical = genTenant?.business_vertical
  const genBaseMonthly =
    pricingConfig?.[genVertical]?.[genForm.plan]?.price ||
    pricingConfig?.['broker']?.[genForm.plan]?.price ||
    (genForm.plan === 'pro' ? 999000 : 1499000)
  const isPriceFromConfig = !!(pricingConfig?.[genVertical]?.[genForm.plan]?.price)
  const effectiveMonthly = isPriceFromConfig ? genBaseMonthly : (manualPrice || genBaseMonthly)
  const genSubtotal = effectiveMonthly * genForm.billingMonths
  const genDiscount = Math.round(genSubtotal * (genForm.discountPct / 100))
  const genFinal = genSubtotal - genDiscount

  // FIX 2: Double-bill check
  const genHasPending = !!(genForm.tenantId && invoices?.some(
    i => i.tenants?.id === genForm.tenantId && i.status === 'pending'
  ))

  const handleOpenDetail = (inv) => {
    setSelectedInvoice(inv)
    setConfirmNotes('')
    setIsSheetOpen(true)
  }

  const handleConfirm = () => {
    const now = new Date().toISOString()
    confirmInvoice.mutate({
      invoiceId: selectedInvoice.id,
      tenantId: selectedInvoice.tenants.id,
      plan: selectedInvoice.plan,
      billingMonths: selectedInvoice.billing_months,
      notes: confirmNotes || undefined
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-invoices'])
        setSelectedInvoice(prev => prev
          ? { ...prev, status: 'paid', confirmed_at: now, paid_at: now }
          : null
        )
        setConfirmSuccess(true)
        setTimeout(() => {
          setIsSheetOpen(false)
          setConfirmSuccess(false)
        }, 1500)
      }
    })
  }

  const handleCancelInvoice = async () => {
    if (!confirm('Batalkan invoice ini?')) return
    const { error } = await supabase
      .from('subscription_invoices')
      .update({ status: 'cancelled' })
      .eq('id', selectedInvoice.id)
    if (error) {
      toast.error('Gagal membatalkan invoice')
    } else {
      toast.success('Invoice dibatalkan')
      queryClient.invalidateQueries(['admin-invoices'])
      setIsSheetOpen(false)
    }
  }

  const handleDeleteInvoice = async () => {
    if (!selectedInvoice) return
    if (!confirm(`HAPUS PERMANEN invoice #${selectedInvoice.invoice_number}?\n\nData ini akan hilang selamanya dan tidak bisa dikembalikan.`)) return
    
    deleteInvoice.mutate(selectedInvoice.id, {
      onSuccess: () => {
        setIsSheetOpen(false)
        setSelectedInvoice(null)
      }
    })
  }

  const handleSaveBank = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const payload = {
      bank_name: formData.get('bank_name'),
      account_number: formData.get('account_number'),
      account_name: formData.get('account_name'),
      is_active: true
    }
    if (editingBank?.id) payload.id = editingBank.id
    upsertBank.mutate(payload, {
      onSuccess: () => {
        setIsBankModalOpen(false)
        setEditingBank(null)
      }
    })
  }

  const handleDeleteBank = (bank) => {
    if (!confirm(`Hapus rekening ${bank.bank_name} - ${bank.account_number}?`)) return
    deleteBank.mutate(bank.id)
  }

  const handleGenerateInvoice = (e) => {
    e.preventDefault()
    if (!genForm.tenantId) { toast.error('Pilih tenant terlebih dahulu'); return }
    if (genFinal <= 0) { toast.error('Nominal harus lebih dari 0'); return }
    createInvoice.mutate({
      tenantId: genForm.tenantId,
      plan: genForm.plan,
      billingMonths: genForm.billingMonths,
      amount: genFinal,
      notes: genForm.notes || undefined
    }, {
      onSuccess: () => {
        setIsGenerateOpen(false)
        setGenForm({ tenantId: '', plan: 'pro', billingMonths: 1, discountPct: 0, notes: '' })
        setManualPrice(0)
      }
    })
  }

  if (isLoadingInvoices) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    )
  }

  return (
    <div>
      {/* Background Orbs — Consistently 'Modern Classy' */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full animate-pulse-glow" />
        <div className="absolute bottom-[10%] left-[-5%] w-[400px] h-[400px] bg-blue-500/5 blur-[100px] rounded-full" />
      </div>

      {/* Header — Enhanced for Premium Feel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-14 lg:top-0 z-40 bg-[#080C10]/80 backdrop-blur-2xl py-4 -mx-2 px-4 rounded-2xl border border-white/5 shadow-2xl overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <History className="text-emerald-400" size={20} />
            </div>
            <div>
              <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight leading-none">
                Billing & <span className="text-emerald-400">Subscriptions</span>
              </h1>
              <p className="text-[10px] font-bold text-[#4B6478] uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Revenue Monitoring & Invoice Management
              </p>
            </div>
          </div>
        </div>
        <Button
          onClick={() => setIsGenerateOpen(true)}
          className="relative z-10 hidden md:flex bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-12 px-6 text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_4px_20px_rgba(16,185,129,0.3)] shrink-0 transition-all active:scale-95 group/btn overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
          <Plus size={16} className="mr-2 relative z-10" /> 
          <span className="relative z-10">Generate Invoice Manual</span>
        </Button>
      </div>

      <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="w-full relative z-10 mt-4">
        <TabsList className="bg-white/5 backdrop-blur-xl border border-white/10 p-1 h-12 lg:h-10 rounded-xl mb-6 lg:mb-8 w-full lg:max-w-3xl flex overflow-x-auto scrollbar-hide flex-nowrap relative z-30 shadow-xl items-center justify-start">
          {[
            { id: 'invoices', label: 'Invoices' },
            { id: 'settings', label: 'Rekening Bank' },
            { id: 'expiring', label: 'Expiring Plans' },
            { id: 'xendit', label: 'Xendit Gateway' }
          ].map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex-1 shrink-0 min-w-[140px] relative rounded-lg font-bold uppercase text-[10px] md:text-[11px] tracking-widest transition-colors data-[state=active]:text-white text-[#4B6478] hover:text-white/60 h-full z-10 bg-transparent group"
            >
              {activeMainTab === tab.id && (
                <div className="absolute inset-0 bg-white/10 rounded-lg shadow-inner" />
              )}
              {tab.id === 'expiring' ? (
                <div className="flex items-center gap-2">
                  {tab.label}
                  {(() => {
                    const count = (allTenants ?? []).filter(t => {
                      const s = getSubscriptionStatus(t)
                      return (s.status === 'active' || s.status === 'trial') && s.daysLeft <= 30
                    }).length
                    return count > 0 && (
                      <span className="w-4 h-4 rounded-full bg-red-500 text-[9px] flex items-center justify-center animate-pulse shadow-lg shadow-red-500/20">
                        {count}
                      </span>
                    )
                  })()}
                </div>
              ) : tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ─── INVOICES TAB ─── */}
        <TabsContent value="invoices" className="space-y-6 animate-in fade-in duration-300">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8 lg:mt-4">
            <StatCard label="Pending Konfirmasi" value={stats.pending} icon={Clock} color="amber" isUrgent={stats.pending > 0} />
            <StatCard label="Lunas Bulan Ini" value={stats.paidMonth} icon={CheckCircle2} color="emerald" />
            <StatCard label="Total Revenue" value={formatIDR(stats.totalRevenue)} icon={Banknote} color="blue" />
            <StatCard label="Expired / Cancelled" value={stats.failed} icon={XCircle} color="red" />
          </div>

          {/* Filter & Search */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white/[0.03] backdrop-blur-md p-5 rounded-3xl border border-white/8 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
            
            <Tabs value={invoiceTab} onValueChange={setInvoiceTab} className="w-full lg:w-auto relative z-10">
              <TabsList className="bg-black/40 border border-white/5 p-1 h-12 rounded-xl flex overflow-x-auto scrollbar-hide flex-nowrap justify-start items-center">
                {['Semua', 'Pending', 'Paid', 'Expired', 'Cancelled'].map(tab => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="relative rounded-lg px-5 h-full text-[11px] font-bold uppercase tracking-wider data-[state=active]:text-white text-[#4B6478] hover:text-white/60 transition-colors bg-transparent shrink-0"
                  >
                    {invoiceTab === tab && (
                      <div className="absolute inset-0 bg-white/10 rounded-lg shadow-inner" />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      {tab}
                      {tab === 'Pending' && stats.pending > 0 && (
                        <span className="w-4 h-4 rounded-full bg-red-500 text-[9px] flex items-center justify-center animate-pulse shadow-lg shadow-red-500/20">
                          {stats.pending}
                        </span>
                      )}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap">
              <div className="relative w-full lg:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4B6478]" size={16} />
                <Input
                  placeholder="Cari No. Invoice / Bisnis..."
                  value={invoiceSearch}
                  onChange={(e) => setInvoiceSearch(e.target.value)}
                  className="bg-black/20 border-white/10 h-11 rounded-xl pl-11 text-base lg:text-sm focus:border-emerald-500/50 transition-all font-medium"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <DatePicker
                  id="dateFrom"
                  value={dateFrom}
                  onChange={setDateFrom}
                  placeholder="Mulai..."
                  className="!h-11 !w-[130px] !rounded-xl bg-[#111C24] border-white/10 text-white/70 px-3 text-base lg:text-xs"
                />
                <span className="text-[#4B6478] text-xs font-bold">—</span>
                <DatePicker
                  id="dateTo"
                  value={dateTo}
                  onChange={setDateTo}
                  placeholder="Sampai..."
                  className="!h-11 !w-[130px] !rounded-xl bg-[#111C24] border-white/10 text-white/70 px-3 text-base lg:text-xs"
                />
                {(dateFrom || dateTo) && (
                  <button
                    type="button"
                    onClick={() => { setDateFrom(''); setDateTo('') }}
                    className="w-7 h-7 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-[#4B6478] flex items-center justify-center transition-all"
                    title="Reset filter tanggal"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Invoice Table */}
          <div className="bg-white/[0.02] backdrop-blur-xl rounded-[32px] border border-white/8 overflow-hidden shadow-2xl relative group">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
            <div className="overflow-x-auto relative z-10">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-[#4B6478] font-display font-black">Invoice</th>
                    <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-[#4B6478] font-display font-black">Tenant</th>
                    <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-[#4B6478] font-display font-black text-center">Plan</th>
                    <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-[#4B6478] font-display font-black text-center">Periode</th>
                    <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-[#4B6478] font-display font-black">Amount</th>
                    <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-[#4B6478] font-display font-black text-center">Status</th>
                    <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-[#4B6478] font-display font-black text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {pagedInvoices.map((inv, i) => (
                    <tr
                      key={inv.id}
                      className="hover:bg-white/[0.04] transition-all group"
                    >
                      <td className="px-8 py-5">
                        <div className="space-y-1">
                          <p className="text-[12px] font-mono font-black text-emerald-400 leading-none group-hover:scale-105 transition-transform origin-left inline-block">#{inv.invoice_number}</p>
                          <p className="text-[9px] text-[#4B6478] font-black uppercase tracking-wider">{formatDate(inv.created_at)}</p>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col gap-1">
                          <p className="text-[13px] font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{toTitleCase(inv.tenants?.business_name)}</p>
                          {inv.tenants?.business_vertical && (
                            <div className="flex">
                              <Badge className="text-[8px] font-black tracking-[0.1em] h-4 px-1.5 border-emerald-500/20 bg-emerald-500/5 text-emerald-500/70 uppercase">
                                {toTitleCase(inv.tenants.business_vertical)}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center"><PlanBadge plan={inv.plan} /></td>
                      <td className="px-8 py-5 text-center text-[12px] font-black text-white">{inv.billing_months} BLN</td>
                      <td className="px-8 py-5">
                        <p className="text-[14px] font-display font-black text-white tracking-tight">{formatIDR(inv.amount)}</p>
                      </td>
                      <td className="px-8 py-5 text-center"><StatusBadge status={inv.status} /></td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          {inv.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => handleOpenDetail(inv)}
                              className="h-9 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-all text-[10px] font-black uppercase tracking-widest px-4 shadow-[0_4px_15px_rgba(16,185,129,0.2)]"
                            >
                              Konfirmasi
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDetail(inv)}
                            className="h-9 w-9 p-0 rounded-xl border-white/10 text-[#4B6478] hover:bg-white/10 hover:text-white transition-all flex items-center justify-center group/btn"
                          >
                            <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredInvoices.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-8 py-32 text-center">
                        <div className="flex flex-col items-center justify-center space-y-6 max-w-sm mx-auto">
                          <div className="w-24 h-24 rounded-[32px] bg-white/[0.03] border border-white/5 flex items-center justify-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                            <History size={40} className="text-[#4B6478] group-hover:text-emerald-400 transition-all duration-500" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-[14px] font-black text-white uppercase tracking-[0.2em]">Belum ada riwayat invoice</p>
                            <p className="text-[11px] font-bold text-[#4B6478] uppercase tracking-[0.15em] leading-relaxed">
                              Data transaksi atau tagihan tenant akan muncul di sini setelah dibuat.
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => setIsGenerateOpen(true)}
                            className="h-11 rounded-2xl border-white/10 text-white/50 hover:text-white hover:bg-white/5 hover:border-emerald-500/30 text-[10px] font-black uppercase tracking-[0.2em] transition-all"
                          >
                            Generate Pertama
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {filteredInvoices.length > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-white/[0.01]">
                <p className="text-[11px] font-bold text-[#4B6478]">
                  Menampilkan{' '}
                  <span className="text-white">{Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredInvoices.length)}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredInvoices.length)}</span>
                  {' '}dari <span className="text-white">{filteredInvoices.length}</span> invoice
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-8 px-3 rounded-lg bg-[#111C24] border border-white/10 text-[#4B6478] text-sm font-bold disabled:opacity-30 hover:bg-white/5 transition-all"
                  >
                    ←
                  </button>
                  {(() => {
                    const delta = 2
                    const range = []
                    const left = Math.max(1, currentPage - delta)
                    const right = Math.min(totalPages, currentPage + delta)
                    for (let i = left; i <= right; i++) range.push(i)
                    if (left > 1) range.unshift('...')
                    if (right < totalPages) range.push('...')
                    if (left > 1) range.unshift(1)
                    if (right < totalPages) range.push(totalPages)
                    return range.map((p, idx) => p === '...'
                      ? <span key={`dot-${idx}`} className="px-1 text-[#4B6478] text-sm">…</span>
                      : (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(p)}
                          className={`h-8 min-w-[32px] px-2 rounded-lg border text-sm font-bold transition-all ${currentPage === p
                              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                              : 'bg-[#111C24] border-white/10 text-[#4B6478] hover:bg-white/5'
                            }`}
                        >
                          {p}
                        </button>
                      )
                    )
                  })()}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 px-3 rounded-lg bg-[#111C24] border border-white/10 text-[#4B6478] text-sm font-bold disabled:opacity-30 hover:bg-white/5 transition-all"
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ─── REKENING BANK TAB ─── */}
        <TabsContent value="settings" className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.3em] flex items-center gap-2">
              <CreditCard size={14} /> REKENING PEMBAYARAN
            </h2>
            <Button
              size="sm"
              onClick={() => { setEditingBank(null); setIsBankModalOpen(true) }}
              className="bg-emerald-500 hover:bg-emerald-600 rounded-xl h-10 px-4 text-[11px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20"
            >
              <Plus size={16} className="mr-2" /> Tambah Rekening
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoadingBanks
              ? [1, 2, 3].map(i => <BankSkeleton key={i} />)
              : bankAccounts?.map(bank => (
                <BankCard
                  key={bank.id}
                  bank={bank}
                  onEdit={() => { setEditingBank(bank); setIsBankModalOpen(true) }}
                  onDelete={() => handleDeleteBank(bank)}
                />
              ))
            }
          </div>
        </TabsContent>

        {/* ─── EXPIRING PLANS TAB ─── */}
        <TabsContent value="expiring" className="space-y-6 animate-in fade-in duration-300">
          <ExpiringPlansTab
            allTenants={allTenants}
            onRenew={(tenant) => {
              setGenForm(prev => ({ ...prev, tenantId: tenant.id, plan: tenant.plan === 'starter' ? 'pro' : tenant.plan, billingMonths: 1, discountPct: 0, notes: '' }))
              setManualPrice(0)
              setIsGenerateOpen(true)
            }}
          />
        </TabsContent>

        {/* ─── XENDIT CONFIG TAB ─── */}
        <TabsContent value="xendit" className="animate-in fade-in duration-300">
          <XenditConfigTab />
        </TabsContent>
      </Tabs>

      {/* ─── INVOICE DETAIL SHEET ─── */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-full sm:w-[500px] bg-[#0A0F14]/95 backdrop-blur-2xl border-l border-white/5 p-0 overflow-hidden flex flex-col shadow-2xl">
          
            {selectedInvoice && (
              <div>
                {/* Background glow for sheet */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />

                {/* Sheet Header */}
                <div className="p-8 pb-6 border-b border-white/5 bg-white/[0.01] relative z-10">
                  
                    {confirmSuccess ? (
                      <div>
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                          <Check size={16} className="text-emerald-400" />
                        </div>
                        <p className="text-[12px] font-black text-emerald-400 uppercase tracking-[0.2em]">
                          ✓ Terkonfirmasi
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.3em]">Payment Invoice</p>
                        <StatusBadge status={selectedInvoice.status} />
                      </div>
                    )}
                  
                  <SheetTitle className="text-3xl font-display font-black text-white tracking-tight leading-none mb-2">
                    #{selectedInvoice.invoice_number}
                  </SheetTitle>
                  <SheetDescription className="text-[11px] font-bold text-[#4B6478] uppercase tracking-[0.2em]">
                    Dibuat pada {formatDate(selectedInvoice.created_at)}
                  </SheetDescription>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-10 relative z-10 scrollbar-hide">
                  {/* Amount Section — High Impact Glass */}
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-8 rounded-[40px] text-center space-y-3 relative overflow-hidden shadow-2xl group/amount">
                    <div className="absolute -right-6 -bottom-6 opacity-[0.05] group-hover/amount:opacity-[0.12] transition-opacity -rotate-12 duration-1000">
                      <Banknote size={180} />
                    </div>
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
                    
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] leading-none mb-1">Total Premium Amount</p>
                    <p className="text-5xl font-display font-black text-white tracking-tighter drop-shadow-2xl">{formatIDR(selectedInvoice.amount)}</p>
                    
                    <div className="flex items-center justify-center gap-2.5 pt-4">
                      <PlanBadge plan={selectedInvoice.plan} />
                      <div className="h-5 w-px bg-white/10" />
                      <span className="bg-white/5 px-2.5 py-1 rounded-lg text-[9px] font-black text-white/50 uppercase tracking-widest border border-white/5">
                        {selectedInvoice.billing_months} MONTHS
                      </span>
                      {selectedInvoice.payment_method && (
                        <span className="bg-blue-500/10 px-2.5 py-1 rounded-lg text-[9px] font-black text-blue-400 uppercase tracking-widest border border-blue-500/20">
                          {selectedInvoice.payment_method === 'manual' ? 'MANUAL TRANSFER' : selectedInvoice.payment_method.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tenant Details Section */}
                  <section className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                      <h3 className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.3em]">Client Information</h3>
                      <div className="h-px flex-1 mx-4 bg-white/5" />
                    </div>
                    
                    <div className="bg-white/[0.03] border border-white/8 rounded-[32px] p-6 flex items-center justify-between group transition-all hover:bg-white/[0.06] hover:border-white/20 shadow-xl cursor-default">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-[24px] bg-black/40 border border-white/5 flex items-center justify-center text-3xl shadow-inner group-hover:scale-105 transition-transform duration-500">
                          {getVerticalIcon(selectedInvoice.tenants?.business_vertical)}
                        </div>
                        <div>
                          <p className="text-lg font-display font-black text-white leading-tight uppercase tracking-tight">{toTitleCase(selectedInvoice.tenants?.business_name)}</p>
                          <p className="text-[11px] text-[#4B6478] font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
                             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                             Tenant ID: {selectedInvoice.tenants?.id?.substring(0, 8)}
                          </p>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#4B6478] group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-all">
                        <ExternalLink size={16} />
                      </div>
                    </div>
                  </section>

                  {/* Payment Proof Section */}
                  <section className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                      <h3 className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.3em]">Evidence Log</h3>
                      <div className="h-px flex-1 mx-4 bg-white/5" />
                    </div>
                    
                    <div className="bg-white/[0.03] border border-white/8 rounded-[32px] relative min-h-[220px] flex items-center justify-center overflow-hidden shadow-2xl group/proof">
                      {selectedInvoice.payment_proof_url ? (
                        <>
                          <img
                            src={selectedInvoice.payment_proof_url}
                            alt="Bukti Pembayaran"
                            className="w-full h-full absolute inset-0 object-cover opacity-30 group-hover/proof:opacity-60 transition-all duration-700 blur-[2px] group-hover/proof:blur-0"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F14] via-transparent to-transparent opacity-60" />
                          
                          <div className="relative z-10 flex flex-col gap-3">
                            <Button
                              variant="secondary"
                              onClick={() => window.open(selectedInvoice.payment_proof_url, '_blank')}
                              className="bg-white/10 hover:bg-emerald-500 hover:text-white backdrop-blur-md text-white border-white/10 h-11 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all px-6 shadow-2xl"
                            >
                              <Globe size={14} className="mr-2" /> Preview Fullscreen
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                const a = document.createElement('a')
                                a.href = selectedInvoice.payment_proof_url
                                a.download = `TERNAKOS-INVOICE-${selectedInvoice.invoice_number}`
                                a.click()
                              }}
                              className="bg-black/40 hover:bg-white/10 border-white/5 text-white/60 hover:text-white h-11 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all px-6"
                            >
                              <Download size={14} className="mr-2" /> Archive Proof
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center space-y-3 opacity-30 group-hover/proof:opacity-50 transition-opacity p-8">
                          <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#4B6478] flex items-center justify-center mx-auto mb-2">
                            <AlertCircle size={28} className="text-[#4B6478]" />
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#4B6478] leading-relaxed">Evidence not yet<br/>provided by tenant</p>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Log Confirmation */}
                  {selectedInvoice.confirmed_at && (
                    <section className="space-y-4">
                      <div className="flex items-center justify-between px-2">
                        <h3 className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.3em]">Confirmation Trail</h3>
                        <div className="h-px flex-1 mx-4 bg-white/5" />
                      </div>
                      
                      <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-[24px] p-6 space-y-4 shadow-inner relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                           <CheckCircle2 size={60} className="text-emerald-400" />
                        </div>
                        <div className="flex items-center gap-4 relative z-10">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30 shadow-xl">
                            <Check size={20} strokeWidth={3} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-white uppercase tracking-tight">Invoice Confirmed</p>
                            <p className="text-[11px] text-emerald-500/80 font-bold uppercase tracking-widest mt-0.5">
                              {formatDate(selectedInvoice.confirmed_at)} @ {format(new Date(selectedInvoice.confirmed_at), 'HH:mm')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </section>
                  )}
                </div>

                {/* Footer Actions — Bottom Stick with Blur */}
                {selectedInvoice.status === 'pending' && (() => {
                  const isXenditInvoice = selectedInvoice.payment_method === 'xendit' || !!selectedInvoice.xendit_invoice_id
                  return (
                    <div className="p-8 border-t border-white/5 bg-gradient-to-b from-[#0A0F14]/40 to-[#0A0F14] relative z-20 space-y-4">
                      {isXenditInvoice ? (
                        <div className="flex items-start gap-4 bg-amber-500/5 border border-amber-500/20 rounded-3xl p-5 shadow-inner">
                          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0 border border-amber-500/20 shadow-xl">
                            <Zap size={18} className="text-amber-400" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[12px] font-black text-amber-300 uppercase tracking-widest leading-none">Automated Gateway</p>
                            <p className="text-[11px] font-bold text-amber-400/50 leading-relaxed uppercase tracking-tighter">
                              Processing via Xendit. Confirmation will trigger via Webhook.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-2.5">
                            <label htmlFor="confirmNotes" className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.3em] ml-1">
                              Confirmation Logs
                            </label>
                            <Textarea
                              id="confirmNotes"
                              name="confirmNotes"
                              placeholder="Add processing notes (e.g. Validated BCA transfer)..."
                              value={confirmNotes}
                              onChange={(e) => setConfirmNotes(e.target.value)}
                              rows={2}
                              className="bg-white/[0.02] border-white/10 rounded-2xl text-sm font-bold text-white focus:border-emerald-500/50 hover:bg-white/[0.04] transition-all resize-none shadow-inner"
                            />
                          </div>
                          <Button
                            className="w-full h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[12px] tracking-[0.2em] shadow-[0_10px_30px_rgba(16,185,129,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2 group/confirm"
                            onClick={handleConfirm}
                            disabled={confirmInvoice.isPending}
                          >
                            {confirmInvoice.isPending ? 'Validating...' : (
                              <>
                                <Check size={18} strokeWidth={3} className="group-hover:scale-110 transition-transform" />
                                Approve Payment
                              </>
                            )}
                          </Button>
                        </>
                      )}
                      
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          variant="outline"
                          className="h-12 rounded-2xl border-white/5 bg-white/5 text-[#4B6478] hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all font-black uppercase text-[10px] tracking-[0.2em]"
                          onClick={handleCancelInvoice}
                        >
                          Cancel Unit
                        </Button>
                        <Button
                          variant="ghost"
                          className="h-12 rounded-2xl text-red-500/40 hover:text-red-500 hover:bg-red-500/5 transition-all font-black uppercase text-[10px] tracking-[0.2em]"
                          onClick={handleDeleteInvoice}
                          disabled={deleteInvoice.isPending}
                        >
                          Destroy Data
                        </Button>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}
          
        </SheetContent>
      </Sheet>

      {/* ─── GENERATE INVOICE SHEET ─── */}
      <Sheet open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <SheetContent side="right" className="w-full sm:w-[500px] bg-[#0A0F14]/95 backdrop-blur-2xl border-l border-white/5 p-0 overflow-hidden flex flex-col shadow-2xl">
          <div className="p-8 pb-6 border-b border-white/5 bg-white/[0.01] relative z-10">
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-2">Admin Action</p>
            <SheetTitle className="text-3xl font-display font-black text-white tracking-tight leading-none mb-2">Generate Invoice</SheetTitle>
            <SheetDescription className="text-[11px] font-bold text-[#4B6478] uppercase tracking-[0.2em]">
              Buat invoice baru untuk tenant secara manual
            </SheetDescription>
          </div>
          <form onSubmit={handleGenerateInvoice} className="flex-1 overflow-y-auto relative z-10">
            <div className="p-8 space-y-6">
              {/* Tenant Select */}
              <div className="space-y-2">
                <label htmlFor="genTenantId" className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.3em] ml-1">Tenant *</label>
                <div className="relative">
                  <select
                    id="genTenantId"
                    name="genTenantId"
                    value={genForm.tenantId}
                    onChange={(e) => { setGenForm(f => ({ ...f, tenantId: e.target.value })); setManualPrice(0) }}
                    className={`w-full h-12 bg-white/[0.02] border rounded-2xl px-4 text-sm font-medium text-white focus:border-emerald-500 focus:bg-white/[0.05] transition-all appearance-none ${genHasPending ? 'border-amber-500/50 ring-1 ring-amber-500/20 shadow-amber-500/10 shadow-lg' : 'border-white/10 hover:border-white/20'}`}
                    required
                  >
                    <option value="" className="bg-[#0C1319]">— Pilih Tenant —</option>
                    {allTenants?.map(t => (
                      <option key={t.id} value={t.id} className="bg-[#0A0F14]">
                        {toTitleCase(t.business_name)} ({toTitleCase(t.business_vertical)})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#4B6478]">
                    <ChevronRight size={16} className="rotate-90" />
                  </div>
                </div>
              </div>

              {/* Double-bill warning */}
              
                {genHasPending && (
                  <div>
                    <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-black text-amber-300 leading-relaxed uppercase tracking-wider">
                      Tenant ini sudah punya invoice pending. Konfirmasi atau batalkan dulu sebelum generate baru.
                    </p>
                  </div>
                )}
              

              {/* Plan */}
              <div className="space-y-2">
                <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.3em] ml-1">Plan *</p>
                <div className="grid grid-cols-2 gap-3">
                  {['pro', 'business'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setGenForm(f => ({ ...f, plan: p }))}
                      className={`h-14 rounded-2xl font-black uppercase text-[12px] tracking-widest border transition-all shadow-xl group ${genForm.plan === p
                          ? p === 'pro'
                            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-emerald-500/10 hover:bg-emerald-500/20'
                            : 'bg-amber-500/10 border-amber-500/50 text-amber-400 shadow-amber-500/10 hover:bg-amber-500/20'
                          : 'bg-white/[0.02] border-white/5 text-[#4B6478] hover:bg-white/[0.05] hover:text-white hover:border-white/20'
                        }`}
                    >
                      {p === 'pro' ? '⭐ PRO' : '👑 BUSINESS'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.3em] ml-1">Durasi *</p>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 3, 6, 12].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setGenForm(f => ({ ...f, billingMonths: m }))}
                      className={`h-14 rounded-2xl border transition-all flex flex-col items-center justify-center gap-0.5 ${genForm.billingMonths === m
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-xl shadow-emerald-500/10'
                          : 'bg-white/[0.02] border-white/5 text-[#4B6478] hover:bg-white/[0.05] hover:text-white hover:border-white/20'
                        }`}
                    >
                      <span className="font-display font-black text-[16px] leading-none">{m}</span>
                      <span className="text-[8px] uppercase tracking-[0.2em] font-bold opacity-70">BLN</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual price override */}
              {!isPriceFromConfig && genForm.tenantId && (
                <div className="space-y-2 overflow-hidden rounded-2xl bg-amber-500/5 border border-amber-500/20 p-4">
                  <label htmlFor="manualPriceInput" className="text-[10px] font-black text-amber-400 uppercase tracking-widest ml-1 flex items-center gap-1.5 mb-3">
                    <AlertTriangle size={12} /> HARGA DEFAULT TIDAK DITEMUKAN
                  </label>
                  <InputRupiah
                    id="manualPriceInput"
                    name="manualPriceInput"
                    value={manualPrice}
                    onChange={setManualPrice}
                    placeholder="Input Harga per bulan (Rp)"
                    className="bg-black/40 border-amber-500/30 h-12 rounded-xl focus:border-amber-500/60 font-display text-lg"
                  />
                </div>
              )}

              {/* Price Breakdown */}
              <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-4 shadow-inner">
                <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.3em]">Kalkulasi Total</p>
                <div className="flex justify-between items-end pb-3 border-b border-white/5">
                  <span className="text-white/50 text-[11px] font-bold uppercase tracking-wider">{genForm.billingMonths} BLN × {formatIDR(effectiveMonthly)}</span>
                  <span className="font-display font-black text-white text-[14px]">{formatIDR(genSubtotal)}</span>
                </div>
                {genDiscount > 0 && (
                  <div className="flex justify-between items-end pb-3 border-b border-white/5">
                    <span className="text-red-400/70 text-[11px] font-bold uppercase tracking-wider">Diskon {genForm.discountPct}%</span>
                    <span className="font-display font-black text-red-500 text-[14px]">-{formatIDR(genDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[12px] font-black text-[#4B6478] uppercase tracking-[0.3em]">Final</span>
                  <span className="text-[24px] font-display font-black text-emerald-400 tracking-tight">{formatIDR(genFinal)}</span>
                </div>
              </div>

              {/* Discount */}
              <div className="space-y-2">
                <label htmlFor="genDiscount" className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.3em] ml-1">Diskon %</label>
                <Input
                  id="genDiscount"
                  name="genDiscount"
                  type="number"
                  min={0}
                  max={100}
                  value={genForm.discountPct}
                  onChange={(e) => setGenForm(f => ({ ...f, discountPct: Number(e.target.value) }))}
                  className="bg-white/[0.02] border-white/10 h-12 rounded-2xl text-sm font-bold focus:border-emerald-500/50 hover:bg-white/[0.04]"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label htmlFor="genNotes" className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.3em] ml-1">Keterangan Internal</label>
                <Textarea
                  id="genNotes"
                  name="genNotes"
                  placeholder="Catatan tambahan (opsional)..."
                  value={genForm.notes}
                  onChange={(e) => setGenForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className="bg-white/[0.02] border-white/10 rounded-2xl text-sm font-medium focus:border-emerald-500/50 hover:bg-white/[0.04] resize-none"
                />
              </div>
            </div>

            <div className="p-8 pt-0 flex gap-4 sticky bottom-0 bg-gradient-to-t from-[#0A0F14] via-[#0A0F14]/90 to-transparent">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsGenerateOpen(false)}
                className="flex-1 h-14 rounded-2xl border-white/10 text-[#4B6478] hover:bg-white/5 hover:text-white font-black uppercase text-[11px] tracking-[0.2em] transition-all"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={createInvoice.isPending || !genForm.tenantId || genFinal <= 0 || genHasPending}
                className="flex-1 h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[11px] tracking-[0.2em] shadow-[0_4px_20px_rgba(16,185,129,0.3)] disabled:opacity-50 transition-all active:scale-95"
              >
                {createInvoice.isPending ? 'Proses...' : <><FileText size={16} className="mr-2" /> Generate</>}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ─── BANK MODAL ─── */}
      
      {isBankModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsBankModalOpen(false)}
          />
          <div className="relative z-10 bg-[#111C24] border border-white/10 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />
            <form onSubmit={handleSaveBank} className="relative z-10">
              <div className="p-8 pb-6 border-b border-white/5">
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-2">REKENING TENANT</p>
                <h2 className="text-2xl font-display font-black text-white uppercase tracking-tight leading-none mb-1">
                  {editingBank ? 'Edit Bank' : 'Tambah Bank'}
                </h2>
                <p className="text-[11px] font-bold text-[#4B6478] uppercase tracking-[0.2em] mt-2">
                  Pengaturan mutasi bank TernakOS
                </p>
              </div>
              <div className="p-8 space-y-5">
                <div className="space-y-2">
                  <label htmlFor="bank_name" className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.3em] ml-1">Provider Bank</label>
                  <Input
                    id="bank_name"
                    name="bank_name"
                    defaultValue={editingBank?.bank_name}
                    placeholder="BCA / Mandiri / CIMB..."
                    className="bg-white/[0.02] border-white/10 hover:border-white/20 h-14 rounded-2xl text-sm font-bold focus:border-emerald-500 transition-all font-display tracking-wide"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="account_number" className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.3em] ml-1">No. Rekening</label>
                  <Input
                    id="account_number"
                    name="account_number"
                    defaultValue={editingBank?.account_number}
                    placeholder="000123456789"
                    className="bg-white/[0.02] border-white/10 hover:border-white/20 h-14 rounded-2xl text-sm font-black text-emerald-400 focus:border-emerald-500 transition-all font-mono tracking-widest"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="account_name" className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.3em] ml-1">Atas Nama</label>
                  <Input
                    id="account_name"
                    name="account_name"
                    defaultValue={editingBank?.account_name}
                    placeholder="PT TERNAKOS TEKNOLOGI"
                    className="bg-white/[0.02] border-white/10 hover:border-white/20 h-14 rounded-2xl text-sm font-black focus:border-emerald-500 transition-all uppercase tracking-wider"
                    required
                  />
                </div>
              </div>
              <div className="p-8 pt-0 flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsBankModalOpen(false)}
                  className="flex-1 h-14 rounded-2xl border-white/10 hover:border-white/20 hover:bg-white/5 text-[#4B6478] hover:text-white font-black uppercase text-[11px] tracking-[0.2em] transition-all"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[11px] tracking-[0.2em] shadow-[0_4px_20px_rgba(16,185,129,0.3)] transition-all active:scale-95"
                >
                  {editingBank ? 'Simpan' : '+ Tambah'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* FAB (Floating Action Button) for Mobile — Prevents Intersecting Layouts */}
      <div className="md:hidden fixed bottom-20 right-4 z-40 animate-in translate-y-4 duration-500 pb-[env(safe-area-inset-bottom)]">
        <Button
          onClick={() => setIsGenerateOpen(true)}
          className="w-14 h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_10px_30px_rgba(16,185,129,0.4)] border border-emerald-400/20 active:scale-90 transition-transform flex items-center justify-center p-0"
        >
          <Plus size={28} />
        </Button>
      </div>
    </div>
  )
}

// ─── ExpiringPlansTab ─────────────────────────────────────────────────────────

function ExpiringPlansTab({ allTenants, onRenew }) {
  const [search, setSearch] = useState('')

  const allExpiring = useMemo(() => {
    if (!allTenants) return []
    return allTenants
      .map(t => ({ ...t, _sub: getSubscriptionStatus(t) }))
      .filter(t => (t._sub.status === 'active' || t._sub.status === 'trial') && t._sub.daysLeft <= 30)
      .sort((a, b) => a._sub.daysLeft - b._sub.daysLeft)
  }, [allTenants])

  const expiring = useMemo(() => {
    if (!search) return allExpiring
    return allExpiring.filter(t => t.business_name?.toLowerCase().includes(search.toLowerCase()))
  }, [allExpiring, search])

  const alreadyExpiredCount = useMemo(() => {
    if (!allTenants) return 0
    return allTenants.filter(t => getSubscriptionStatus(t).status === 'expired').length
  }, [allTenants])

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.3em] flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-400" /> PLAN AKAN BERAKHIR (≤ 30 HARI)
          </p>
          {alreadyExpiredCount > 0 && (
            <p className="text-[10px] font-bold text-red-400/70 mt-1">
              + {alreadyExpiredCount} tenant sudah expired
            </p>
          )}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4B6478]" size={14} />
          <Input
            placeholder="Cari bisnis..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-black/20 border-white/10 h-10 rounded-xl pl-10 text-sm focus:border-amber-500/50 transition-all font-medium"
          />
        </div>
      </div>

      {expiring.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 size={28} className="text-emerald-400" />
          </div>
          {search ? (
            <>
              <p className="text-[13px] font-black text-white uppercase tracking-widest">Tidak ditemukan</p>
              <p className="text-[10px] font-bold text-[#4B6478] uppercase tracking-widest">
                Tidak ada tenant yang cocok dengan pencarian "{search}".
              </p>
            </>
          ) : (
            <>
              <p className="text-[13px] font-black text-white uppercase tracking-widest">Semua plan aman</p>
              <p className="text-[10px] font-bold text-[#4B6478] uppercase tracking-widest">
                Tidak ada tenant dengan plan yang akan berakhir dalam 30 hari ke depan.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white/[0.02] backdrop-blur-xl rounded-[32px] border border-white/8 overflow-hidden shadow-2xl relative group">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
          <div className="overflow-x-auto relative z-10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-[#4B6478] font-display font-black">Bisnis</th>
                  <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-[#4B6478] font-display font-black text-center">Plan</th>
                  <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-[#4B6478] font-display font-black text-center">Berakhir</th>
                  <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-[#4B6478] font-display font-black text-center">Sisa</th>
                  <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-[#4B6478] font-display font-black text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {expiring.map((tenant, i) => {
                  const sub = tenant._sub
                  const isUrgent = sub.daysLeft <= 7
                  const expiryStr = sub.expiresAt
                    ? format(sub.expiresAt, 'd MMM yyyy', { locale: localeId })
                    : '—'
                  return (
                    <tr
                      key={tenant.id}
                      className="hover:bg-white/[0.04] transition-all group"
                    >
                      <td className="px-8 py-5">
                        <div className="space-y-1">
                          <p className="text-[13px] font-black text-white group-hover:text-amber-400 transition-colors uppercase tracking-tight truncate max-w-[200px]">{toTitleCase(tenant.business_name)}</p>
                          <div className="flex">
                            <Badge className="text-[8px] font-black tracking-[0.1em] h-4 px-1.5 border-white/10 bg-white/5 text-[#4B6478] uppercase">
                              {toTitleCase(tenant.business_vertical)}
                            </Badge>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center"><PlanBadge plan={sub.plan} /></td>
                      <td className="px-8 py-5 text-center">
                        <p className="text-[12px] font-bold text-white/70">{expiryStr}</p>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider shadow-inner ${
                          isUrgent
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {isUrgent && <AlertTriangle size={12} className="animate-pulse" />}
                          {sub.daysLeft}h lagi
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <Button
                          size="sm"
                          onClick={() => onRenew(tenant)}
                          className={`h-9 rounded-xl text-[10px] font-black uppercase tracking-widest px-4 transition-all active:scale-95 shadow-xl ${
                            isUrgent 
                              ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20' 
                              : 'bg-amber-500 hover:bg-amber-600 text-black shadow-amber-500/20'
                          }`}
                        >
                          Buat Renewal
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Internal UI Components ───────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color, isUrgent }) {
  const themes = {
    amber: {
      bg: 'bg-amber-500/5',
      border: 'border-amber-500/10',
      iconBg: 'bg-amber-500/10',
      text: 'text-amber-400',
      glow: 'from-amber-500/10 to-transparent'
    },
    emerald: {
      bg: 'bg-emerald-500/5',
      border: 'border-emerald-500/10',
      iconBg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      glow: 'from-emerald-500/10 to-transparent'
    },
    blue: {
      bg: 'bg-blue-500/5',
      border: 'border-blue-500/10',
      iconBg: 'bg-blue-500/10',
      text: 'text-blue-400',
      glow: 'from-blue-500/10 to-transparent'
    },
    red: {
      bg: 'bg-red-500/5',
      border: 'border-red-500/10',
      iconBg: 'bg-red-500/10',
      text: 'text-red-400',
      glow: 'from-red-500/10 to-transparent'
    }
  }

  const theme = themes[color] || themes.emerald

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border p-5 lg:p-6 group cursor-default transition-all duration-500 hover:-translate-y-0.5 shadow-lg",
      theme.bg, theme.border,
      isUrgent && 'ring-1 ring-amber-500/30'
    )}>
      <div className={`absolute -right-2 -bottom-2 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity ${theme.text}`}>
        <Icon size={80} strokeWidth={1} />
      </div>
      
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${theme.glow} opacity-30`} />

      <div className="relative z-10 flex flex-col h-full justify-between gap-4 lg:gap-6">
        <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center border ${theme.border} ${theme.bg} ${theme.text} group-hover:scale-110 group-hover:bg-opacity-20 transition-all duration-500 shadow-md`}>
          <Icon size={18} className="lg:scale-110" />
        </div>
        
        <div>
          <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.2em] mb-1.5">{label}</p>
          <div className="flex items-baseline gap-1">
            <p className="text-xl lg:text-2xl font-display font-black text-white leading-none tracking-tight">
              {value}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


function PlanBadge({ plan }) {
  const styles = {
    starter: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    pro: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    business: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  }
  return (
    <Badge className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-widest border ${styles[plan] || styles.starter}`}>
      {plan}
    </Badge>
  )
}

function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    paid: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    expired: 'bg-red-500/10 text-red-500 border-red-500/20',
    cancelled: 'bg-white/5 text-[#4B6478] border-white/10'
  }
  return (
    <Badge className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${styles[status]}`}>
      {status === 'pending' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
      {status}
    </Badge>
  )
}

function BankCard({ bank, onEdit, onDelete }) {
  const queryClient = useQueryClient()
  const [isToggling, setIsToggling] = useState(false)

  const handleToggleActive = async () => {
    setIsToggling(true)
    const { error } = await supabase
      .from('payment_settings')
      .update({ is_active: !bank.is_active })
      .eq('id', bank.id)
    setIsToggling(false)
    if (error) {
      toast.error('Gagal mengubah status rekening')
    } else {
      queryClient.invalidateQueries(['payment-settings'])
      toast.success(bank.is_active ? 'Rekening dinonaktifkan' : 'Rekening diaktifkan')
    }
  }

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-white/8 bg-[#111C24] p-6 lg:p-7 hover:border-white/15 group cursor-default transition-all duration-500 hover:-translate-y-0.5 shadow-lg">
      <div className="absolute -right-4 -bottom-4 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity -rotate-12 duration-700">
        <CreditCard size={120} />
      </div>
      
      <div className="flex justify-between items-start mb-10">
        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500 shadow-xl">
          🏦
        </div>
        <div className="flex items-center gap-3 bg-black/40 px-3 py-1.5 rounded-full border border-white/5 shadow-inner">
          <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${bank.is_active ? 'text-emerald-400' : 'text-[#4B6478]'}`}>
            {bank.is_active ? 'ACTIVE' : 'INACTIVE'}
          </span>
          <Switch
            checked={bank.is_active}
            onCheckedChange={handleToggleActive}
            disabled={isToggling}
            className="data-[state=checked]:bg-emerald-500 scale-75"
          />
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.3em]">Bank Provider</p>
          <p className="text-2xl font-display font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{bank.bank_name}</p>
        </div>
        
        <div className="space-y-1">
          <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.3em]">Account Details</p>
          <div className="p-3 bg-black/40 border border-white/5 rounded-xl font-mono text-sm font-bold text-emerald-400/80 tracking-widest shadow-inner">
            {bank.account_number}
          </div>
        </div>

        <div className="pt-6 border-t border-white/5 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-[0.3em] mb-1">Holder</p>
            <p className="text-[12px] font-black text-white uppercase truncate max-w-[130px] leading-tight font-display tracking-tight">{bank.account_name}</p>
          </div>
          <div className="flex gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="h-10 w-10 p-0 rounded-2xl bg-white/5 hover:bg-emerald-500 hover:text-white transition-all border border-white/10 hover:border-emerald-500 shadow-xl"
            >
              <Edit2 size={14} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="h-10 w-10 p-0 rounded-2xl bg-white/5 hover:bg-red-500 hover:text-white transition-all border border-white/10 hover:border-red-500 shadow-xl"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Xendit Config Tab ────────────────────────────────────────────────────────

function XenditConfigTab() {
  const queryClient = useQueryClient()
  const { data: xenditConfig } = useXenditConfig()
  const saveConfig = useSaveXenditConfig()

  // Parse saved config
  const savedMeta = (() => {
    try { return JSON.parse(xenditConfig?.account_name || '{}') } catch { return {} }
  })()

  const [apiKey, setApiKey] = useState('')
  const [webhookToken, setWebhookToken] = useState('')
  const [callbackUrl, setCallbackUrl] = useState('')
  const [isProduction, setIsProduction] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [showWebhookToken, setShowWebhookToken] = useState(false)

  // Pre-fill from DB on load
  useEffect(() => {
    if (!xenditConfig) return
    setApiKey(xenditConfig.account_number || '')
    setWebhookToken(savedMeta.webhook_token || '')
    setCallbackUrl(savedMeta.callback_url || '')
    setIsProduction(savedMeta.is_production ?? false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xenditConfig?.id])

  const webhookEndpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/xendit-webhook`

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookEndpoint)
    toast.success('URL disalin')
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!apiKey.trim()) { toast.error('API Key tidak boleh kosong'); return }
    saveConfig.mutate({ api_key: apiKey, webhook_token: webhookToken, callback_url: callbackUrl, is_production: isProduction })
  }

  const maskedApiKey = xenditConfig?.account_number
    ? 'xnd_****' + xenditConfig.account_number.slice(-4)
    : null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* ── LEFT: Form ── */}
      <div className="lg:col-span-3">
        <form onSubmit={handleSave} className="bg-[#111C24] rounded-2xl border border-white/8 overflow-hidden">
          {/* Card Header */}
          <div className="p-6 border-b border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Zap size={22} className="text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest mb-0.5">PAYMENT GATEWAY</p>
              <h3 className="text-lg font-display font-black text-white uppercase tracking-tight leading-none">Konfigurasi Xendit</h3>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Environment Toggle */}
            <div className="space-y-2">
              <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest ml-1">Mode</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsProduction(false)}
                  className={`h-11 rounded-xl font-black uppercase text-[11px] tracking-widest border transition-all flex items-center justify-center gap-2 ${!isProduction
                      ? 'bg-amber-500/15 border-amber-500/60 text-amber-400'
                      : 'bg-white/5 border-white/10 text-[#4B6478] hover:bg-white/10'
                    }`}
                >
                  <span className={`w-2 h-2 rounded-full ${!isProduction ? 'bg-amber-400' : 'bg-[#4B6478]'}`} />
                  Sandbox
                </button>
                <button
                  type="button"
                  onClick={() => setIsProduction(true)}
                  className={`h-11 rounded-xl font-black uppercase text-[11px] tracking-widest border transition-all flex items-center justify-center gap-2 ${isProduction
                      ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-400'
                      : 'bg-white/5 border-white/10 text-[#4B6478] hover:bg-white/10'
                    }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isProduction ? 'bg-emerald-400' : 'bg-[#4B6478]'}`} />
                  Production
                </button>
              </div>
            </div>

            {/* Secret API Key */}
            <div className="space-y-2">
              <label htmlFor="xenditApiKey" className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest ml-1">
                Secret API Key *
              </label>
              <div className="relative">
                <input
                  id="xenditApiKey"
                  name="xenditApiKey"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={isProduction ? 'xnd_production_...' : 'xnd_development_...'}
                  className="w-full h-12 bg-[#162230] border border-white/10 rounded-xl px-4 pr-12 font-mono text-sm text-white placeholder:text-[#4B6478] focus:border-emerald-500/50 focus:outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4B6478] hover:text-white transition-colors"
                >
                  {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Webhook Token */}
            <div className="space-y-2">
              <label htmlFor="xenditWebhookToken" className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest ml-1">
                Webhook Verification Token
              </label>
              <div className="relative">
                <input
                  id="xenditWebhookToken"
                  name="xenditWebhookToken"
                  type={showWebhookToken ? 'text' : 'password'}
                  value={webhookToken}
                  onChange={(e) => setWebhookToken(e.target.value)}
                  placeholder="Token verifikasi dari dashboard Xendit"
                  className="w-full h-12 bg-[#162230] border border-white/10 rounded-xl px-4 pr-12 font-mono text-sm text-white placeholder:text-[#4B6478] focus:border-emerald-500/50 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowWebhookToken(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4B6478] hover:text-white transition-colors"
                >
                  {showWebhookToken ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Callback URL */}
            <div className="space-y-2">
              <label htmlFor="xenditCallbackUrl" className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest ml-1">
                Callback URL (opsional)
              </label>
              <input
                id="xenditCallbackUrl"
                name="xenditCallbackUrl"
                type="url"
                value={callbackUrl}
                onChange={(e) => setCallbackUrl(e.target.value)}
                placeholder="https://yourapp.com/api/xendit/webhook"
                className="w-full h-12 bg-[#162230] border border-white/10 rounded-xl px-4 text-sm text-white placeholder:text-[#4B6478] focus:border-emerald-500/50 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="px-6 pb-6">
            <Button
              type="submit"
              disabled={saveConfig.isPending}
              className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[12px] tracking-widest shadow-xl shadow-emerald-500/20 disabled:opacity-60"
            >
              {saveConfig.isPending ? 'Menyimpan...' : <><Zap size={15} className="mr-2" /> Simpan Konfigurasi</>}
            </Button>
          </div>
        </form>
      </div>

      {/* ── RIGHT: Status + Info ── */}
      <div className="lg:col-span-2 space-y-4">
        {/* Status Card */}
        <div className="bg-[#162230] rounded-xl p-4 border border-white/8">
          <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest mb-3">Status Koneksi</p>
          {xenditConfig ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <p className="text-[13px] font-black text-emerald-400">Terkonfigurasi</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-[#4B6478] uppercase tracking-wider">Mode</p>
                  <Badge className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 ${savedMeta.is_production
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                    {savedMeta.is_production ? 'Production' : 'Sandbox'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-[#4B6478] uppercase tracking-wider">API Key</p>
                  <p className="text-[11px] font-mono font-bold text-white/60">{maskedApiKey}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <p className="text-[13px] font-black text-red-400">Belum dikonfigurasi</p>
            </div>
          )}
        </div>

        {/* Webhook URL Card */}
        <div className="bg-[#162230] rounded-xl p-4 border border-white/8">
          <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest mb-3">Webhook Endpoint</p>
          <div className="bg-black/30 border border-white/5 rounded-lg p-3 flex items-center justify-between gap-2">
            <p className="text-[10px] font-mono text-white/40 break-all leading-relaxed flex-1 min-w-0">
              {webhookEndpoint}
            </p>
            <button
              type="button"
              onClick={handleCopyWebhook}
              className="shrink-0 w-8 h-8 rounded-lg bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-400 text-[#4B6478] flex items-center justify-center transition-all"
              title="Salin URL"
            >
              <Copy size={13} />
            </button>
          </div>
          <p className="text-[10px] font-bold text-[#4B6478] mt-2 leading-relaxed">
            Masukkan URL ini di Dashboard Xendit → Settings → Webhooks
          </p>
        </div>

        {/* Coming Soon Features */}
        <div className="bg-[#162230] rounded-xl p-4 border border-white/8 space-y-3">
          <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Fitur Terintegrasi</p>
          {[
            'Auto-konfirmasi invoice saat pembayaran',
            'Generate payment link untuk tenant',
            'Notifikasi real-time via webhook',
            'Riwayat transaksi Xendit',
          ].map((feat, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="w-4 h-4 rounded-md bg-emerald-500/15 flex items-center justify-center shrink-0">
                <Check size={9} className="text-emerald-400" />
              </div>
              <p className="text-[11px] font-bold text-white/50">{feat}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function BankSkeleton() {
  return (
    <div className="bg-[#111C24] border border-white/8 rounded-[24px] p-6 h-[240px] animate-pulse">
      <div className="flex justify-between items-start mb-6">
        <div className="w-12 h-12 rounded-xl bg-white/5" />
        <div className="w-16 h-6 rounded-full bg-white/5" />
      </div>
      <div className="space-y-4">
        <div className="w-24 h-3 bg-white/5 rounded" />
        <div className="w-32 h-6 bg-white/5 rounded" />
        <div className="w-24 h-3 bg-white/5 rounded" />
        <div className="w-48 h-5 bg-white/5 rounded" />
      </div>
    </div>
  )
}
