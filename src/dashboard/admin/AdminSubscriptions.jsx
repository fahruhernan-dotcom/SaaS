import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
import { formatIDR, formatDate } from '@/lib/format'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-20 bg-[#080C10]/80 backdrop-blur-md py-2 -mx-2 px-2 rounded-xl">
        <div>
          <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight">
            Subscriptions & Invoices
          </h1>
          <p className="text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mt-1">
            Monitoring pendapatan dan konfirmasi pembayaran tenant
          </p>
        </div>
        <Button
          onClick={() => setIsGenerateOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-600 rounded-xl h-11 px-6 text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 shrink-0 transition-all active:scale-95"
        >
          <Plus size={16} className="mr-2" /> Generate Invoice Manual
        </Button>
      </div>

      <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="w-full">
        <TabsList className="bg-[#111C24] border border-white/5 p-1 h-12 rounded-2xl mb-6">
          <TabsTrigger
            value="invoices"
            className="flex-1 rounded-xl data-[state=active]:bg-emerald-500 data-[state=active]:text-white font-bold uppercase text-[12px] tracking-widest transition-all"
          >
            Invoice Management
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="flex-1 rounded-xl data-[state=active]:bg-emerald-500 data-[state=active]:text-white font-bold uppercase text-[12px] tracking-widest transition-all"
          >
            Rekening Bank
          </TabsTrigger>
          <TabsTrigger
            value="xendit"
            className="flex-1 rounded-xl data-[state=active]:bg-violet-500 data-[state=active]:text-white font-bold uppercase text-[12px] tracking-widest transition-all"
          >
            Xendit
          </TabsTrigger>
        </TabsList>

        {/* ─── INVOICES TAB ─── */}
        <TabsContent value="invoices" className="space-y-6 animate-in fade-in duration-300">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Pending Konfirmasi" value={stats.pending} icon={Clock} color="amber" isUrgent={stats.pending > 0} />
            <StatCard label="Lunas Bulan Ini" value={stats.paidMonth} icon={CheckCircle2} color="emerald" />
            <StatCard label="Total Revenue" value={formatIDR(stats.totalRevenue)} icon={Banknote} color="blue" />
            <StatCard label="Expired / Cancelled" value={stats.failed} icon={XCircle} color="red" />
          </div>

          {/* Filter & Search */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-[#111C24] p-4 rounded-2xl border border-white/8">
            <Tabs value={invoiceTab} onValueChange={setInvoiceTab} className="w-full lg:w-auto">
              <TabsList className="bg-black/20 border border-white/5 p-1 h-11 rounded-xl overflow-x-auto justify-start flex-nowrap">
                {['Semua', 'Pending', 'Paid', 'Expired', 'Cancelled'].map(tab => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="rounded-lg px-4 text-[11px] font-bold uppercase tracking-wider data-[state=active]:bg-emerald-500 data-[state=active]:text-white whitespace-nowrap"
                  >
                    {tab}
                    {tab === 'Pending' && stats.pending > 0 && (
                      <span className="ml-2 w-4 h-4 rounded-full bg-red-500 text-[9px] flex items-center justify-center animate-pulse">
                        {stats.pending}
                      </span>
                    )}
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
                  className="bg-black/20 border-white/10 h-10 rounded-xl pl-11 text-sm focus:border-emerald-500/50 transition-all font-medium"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <DatePicker
                  id="dateFrom"
                  value={dateFrom}
                  onChange={setDateFrom}
                  placeholder="Mulai..."
                  className="!h-10 !w-[130px] !rounded-xl bg-[#111C24] border-white/10 text-white/70 px-3 text-xs"
                />
                <span className="text-[#4B6478] text-xs font-bold">—</span>
                <DatePicker
                  id="dateTo"
                  value={dateTo}
                  onChange={setDateTo}
                  placeholder="Sampai..."
                  className="!h-10 !w-[130px] !rounded-xl bg-[#111C24] border-white/10 text-white/70 px-3 text-xs"
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
          <div className="bg-[#0C1319] rounded-2xl border border-white/8 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-display font-black">Invoice</th>
                    <th className="px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-display font-black">Tenant</th>
                    <th className="px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-display font-black text-center">Plan</th>
                    <th className="px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-display font-black text-center">Periode</th>
                    <th className="px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-display font-black">Amount</th>
                    <th className="px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-display font-black text-center">Status</th>
                    <th className="px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-display font-black text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedInvoices.map((inv, i) => (
                    <tr
                      key={inv.id}
                      className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors group ${i % 2 === 1 ? 'bg-white/[0.01]' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <p className="text-[12px] font-mono font-bold text-emerald-400 leading-none">#{inv.invoice_number}</p>
                          <p className="text-[10px] text-[#4B6478] font-bold uppercase">{formatDate(inv.created_at)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-bold text-white truncate max-w-[140px]">{inv.tenants?.business_name}</p>
                          {inv.tenants?.business_vertical && (
                            <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter h-4 px-1 border-white/10 bg-white/5 text-[#4B6478]">
                              {inv.tenants.business_vertical.split('_')[0]}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center"><PlanBadge plan={inv.plan} /></td>
                      <td className="px-6 py-4 text-center text-[13px] font-bold text-white">{inv.billing_months} Bln</td>
                      <td className="px-6 py-4">
                        <p className="text-[14px] font-display font-black text-white">{formatIDR(inv.amount)}</p>
                      </td>
                      <td className="px-6 py-4 text-center"><StatusBadge status={inv.status} /></td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {inv.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => handleOpenDetail(inv)}
                              className="h-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-all text-[10px] font-black uppercase tracking-widest px-3"
                            >
                              Konfirmasi
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDetail(inv)}
                            className="h-8 w-8 p-0 rounded-lg border-white/10 text-[#4B6478] hover:bg-white/5 transition-all flex items-center justify-center"
                          >
                            <ChevronRight size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredInvoices.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-24 text-center">
                        <div className="flex flex-col items-center justify-center space-y-4 max-w-sm mx-auto">
                          <div className="w-20 h-20 rounded-3xl bg-white/[0.03] border border-white/5 flex items-center justify-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <History size={32} className="text-[#4B6478] group-hover:text-emerald-400 transition-colors" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[13px] font-black text-white uppercase tracking-widest">Belum ada riwayat invoice</p>
                            <p className="text-[10px] font-bold text-[#4B6478] uppercase tracking-widest leading-loose">
                              Data transaksi atau tagihan tenant akan muncul di sini setelah dibuat.
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => setIsGenerateOpen(true)}
                            className="h-9 rounded-xl border-white/10 text-white/40 hover:text-white hover:bg-white/5 text-[10px] font-black uppercase tracking-widest"
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

        {/* ─── XENDIT CONFIG TAB ─── */}
        <TabsContent value="xendit" className="animate-in fade-in duration-300">
          <XenditConfigTab />
        </TabsContent>
      </Tabs>

      {/* ─── INVOICE DETAIL SHEET ─── */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-full sm:w-[480px] bg-[#0C1319] border-l border-white/8 p-0 overflow-hidden flex flex-col">
          <AnimatePresence>
            {selectedInvoice && (
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
                className="flex flex-col h-full"
              >
                {/* Sheet Header */}
                <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                  <AnimatePresence mode="wait">
                    {confirmSuccess ? (
                      <motion.div
                        key="success-banner"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="flex items-center gap-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl px-4 py-3 mb-4"
                      >
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/30 flex items-center justify-center shrink-0">
                          <Check size={14} className="text-emerald-400" />
                        </div>
                        <p className="text-[12px] font-black text-emerald-400 uppercase tracking-widest">
                          ✓ Terkonfirmasi — Menutup...
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="status-row"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-between mb-4"
                      >
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">PAYMENT INVOICE</p>
                        <StatusBadge status={selectedInvoice.status} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <SheetTitle className="text-2xl font-black text-white tracking-tight leading-none mb-1">
                    #{selectedInvoice.invoice_number}
                  </SheetTitle>
                  <SheetDescription className="text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mt-1">
                    Dibuat pada {formatDate(selectedInvoice.created_at)}
                  </SheetDescription>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                  {/* Amount */}
                  <div className="bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-[24px] text-center space-y-2 relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-[0.03] rotate-12">
                      <Banknote size={120} className="text-emerald-400" />
                    </div>
                    <p className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest leading-none">TOTAL PEMBAYARAN</p>
                    <p className="text-4xl font-display font-black text-white">{formatIDR(selectedInvoice.amount)}</p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <PlanBadge plan={selectedInvoice.plan} />
                      <Badge className="bg-white/5 text-white/40 border-white/10 uppercase text-[9px] font-bold">
                        {selectedInvoice.billing_months} BULAN
                      </Badge>
                      {selectedInvoice.payment_method && (
                        <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 uppercase text-[9px] font-bold">
                          {selectedInvoice.payment_method === 'manual' ? 'Transfer Manual' : selectedInvoice.payment_method}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Tenant */}
                  <section className="space-y-4">
                    <h3 className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.2em] px-1">DETAIL TENANT</h3>
                    <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex items-center justify-between group cursor-pointer hover:bg-white/[0.05] transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl">
                          {getVerticalIcon(selectedInvoice.tenants?.business_vertical)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white leading-tight">{selectedInvoice.tenants?.business_name}</p>
                          <p className="text-[10px] text-[#4B6478] font-bold uppercase mt-0.5">
                            ID: {selectedInvoice.tenants?.id?.substring(0, 8)}...
                          </p>
                        </div>
                      </div>
                      <ExternalLink size={14} className="text-[#4B6478] group-hover:text-emerald-400 transition-colors" />
                    </div>
                  </section>

                  {/* Payment Proof */}
                  <section className="space-y-4">
                    <h3 className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.2em] px-1">BUKTI PEMBAYARAN</h3>
                    <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 relative min-h-[160px] flex items-center justify-center overflow-hidden">
                      {selectedInvoice.payment_proof_url ? (
                        <>
                          <img
                            src={selectedInvoice.payment_proof_url}
                            alt="Bukti Pembayaran"
                            className="w-full h-full absolute inset-0 object-cover opacity-40 hover:opacity-100 transition-opacity cursor-pointer"
                            onClick={() => window.open(selectedInvoice.payment_proof_url, '_blank')}
                          />
                          <div className="relative z-10 flex flex-col gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="bg-white/10 hover:bg-white/20 text-white border-white/20 h-9 rounded-xl font-bold text-[11px] uppercase tracking-widest"
                              onClick={() => window.open(selectedInvoice.payment_proof_url, '_blank')}
                            >
                              <Globe size={14} className="mr-2" /> Lihat Bukti
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="bg-white/10 hover:bg-white/20 text-white border-white/20 h-9 rounded-xl font-bold text-[11px] uppercase tracking-widest"
                              onClick={() => {
                                const a = document.createElement('a')
                                a.href = selectedInvoice.payment_proof_url
                                a.download = `bukti-${selectedInvoice.invoice_number}`
                                a.click()
                              }}
                            >
                              <Download size={14} className="mr-2" /> Download
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center space-y-2 opacity-40">
                          <AlertCircle size={32} className="mx-auto text-[#4B6478]" />
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#4B6478]">Belum ada bukti pembayaran</p>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Notes (if exists) */}
                  {selectedInvoice.notes && (
                    <section className="space-y-3">
                      <h3 className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.2em] px-1">CATATAN</h3>
                      <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
                        <p className="text-[13px] text-white/70 font-medium leading-relaxed">{selectedInvoice.notes}</p>
                      </div>
                    </section>
                  )}

                  {/* Confirmation Log */}
                  {selectedInvoice.confirmed_at && (
                    <section className="space-y-4">
                      <h3 className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.2em] px-1">LOG KONFIRMASI</h3>
                      <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <Check size={16} />
                          </div>
                          <div>
                            <p className="text-[12px] font-bold text-white uppercase tracking-tight">Dikonfirmasi</p>
                            <p className="text-[10px] text-emerald-500/70 font-bold uppercase tracking-tighter">
                              {formatDate(selectedInvoice.confirmed_at)} • {format(new Date(selectedInvoice.confirmed_at), 'HH:mm')} WIB
                            </p>
                          </div>
                        </div>
                        {selectedInvoice.paid_at && selectedInvoice.paid_at !== selectedInvoice.confirmed_at && (
                          <div className="pt-2 border-t border-emerald-500/10">
                            <p className="text-[10px] font-bold text-[#4B6478] uppercase tracking-widest">Paid At</p>
                            <p className="text-[11px] font-bold text-emerald-400 mt-0.5">
                              {formatDate(selectedInvoice.paid_at)} • {format(new Date(selectedInvoice.paid_at), 'HH:mm')} WIB
                            </p>
                          </div>
                        )}
                      </div>
                    </section>
                  )}
                </div>

                {/* Footer Actions */}
                {selectedInvoice.status === 'pending' && (() => {
                  const isXenditInvoice = selectedInvoice.payment_method === 'xendit' || !!selectedInvoice.xendit_invoice_id
                  return (
                    <div className="p-6 border-t border-white/5 bg-white/[0.02] space-y-3">
                      {isXenditInvoice ? (
                        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-4">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                            <Zap size={15} className="text-amber-400" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[12px] font-black text-amber-300 uppercase tracking-wide leading-snug">
                              Invoice ini dibayar via Xendit
                            </p>
                            <p className="text-[11px] font-medium text-amber-400/70 leading-snug">
                              Konfirmasi otomatis saat webhook diterima.
                            </p>
                            {selectedInvoice.xendit_invoice_id && (
                              <p className="text-[10px] font-mono text-amber-500/50 mt-1 break-all">
                                ID: {selectedInvoice.xendit_invoice_id}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <label htmlFor="confirmNotes" className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest ml-1">
                              Catatan Konfirmasi (opsional)
                            </label>
                            <Textarea
                              id="confirmNotes"
                              name="confirmNotes"
                              placeholder="Mis. Transfer BCA tanggal 25 Maret..."
                              value={confirmNotes}
                              onChange={(e) => setConfirmNotes(e.target.value)}
                              rows={2}
                              className="bg-white/5 border-white/10 rounded-xl text-sm font-medium focus:border-emerald-500/50 resize-none"
                            />
                          </div>
                          <Button
                            className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[12px] tracking-widest shadow-xl shadow-emerald-500/20"
                            onClick={handleConfirm}
                            disabled={confirmInvoice.isPending}
                          >
                            {confirmInvoice.isPending ? 'Memproses...' : '✓ Konfirmasi Pembayaran'}
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        className="w-full h-11 rounded-xl border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all font-bold uppercase text-[11px] tracking-widest"
                        onClick={handleCancelInvoice}
                      >
                        ✗ Batalkan Invoice
                      </Button>
                    </div>
                  )
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </SheetContent>
      </Sheet>

      {/* ─── GENERATE INVOICE SHEET ─── */}
      <Sheet open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <SheetContent side="right" className="w-full sm:w-[480px] bg-[#0C1319] border-l border-white/8 p-0 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-white/5 bg-white/[0.02]">
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">ADMIN ACTION</p>
            <SheetTitle className="text-xl font-black text-white tracking-tight">Generate Invoice Manual</SheetTitle>
            <SheetDescription className="text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mt-1">
              Buat invoice baru untuk tenant secara manual
            </SheetDescription>
          </div>
          <form onSubmit={handleGenerateInvoice} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-5">
              {/* Tenant Select */}
              <div className="space-y-2">
                <label htmlFor="genTenantId" className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest ml-1">Tenant *</label>
                <select
                  id="genTenantId"
                  name="genTenantId"
                  value={genForm.tenantId}
                  onChange={(e) => { setGenForm(f => ({ ...f, tenantId: e.target.value })); setManualPrice(0) }}
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm font-medium text-white focus:border-emerald-500/50 focus:outline-none transition-all"
                  required
                >
                  <option value="" className="bg-[#0C1319]">— Pilih Tenant —</option>
                  {allTenants?.map(t => (
                    <option key={t.id} value={t.id} className="bg-[#0C1319]">
                      {t.business_name} ({t.business_vertical})
                    </option>
                  ))}
                </select>
              </div>

              {/* FIX 2: Double-bill warning */}
              {genHasPending && (
                <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-3">
                  <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-bold text-amber-300 leading-snug">
                    Tenant ini sudah punya invoice <span className="text-amber-400 uppercase">pending</span>. Konfirmasi atau batalkan dulu sebelum generate baru.
                  </p>
                </div>
              )}

              {/* Plan */}
              <div className="space-y-2">
                <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest ml-1">Plan *</p>
                <div className="grid grid-cols-2 gap-3">
                  {['pro', 'business'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setGenForm(f => ({ ...f, plan: p }))}
                      className={`h-12 rounded-xl font-black uppercase text-[12px] tracking-widest border transition-all ${genForm.plan === p
                          ? p === 'pro'
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                            : 'bg-amber-500/20 border-amber-500 text-amber-400'
                          : 'bg-white/5 border-white/10 text-[#4B6478] hover:bg-white/10'
                        }`}
                    >
                      {p === 'pro' ? '⭐ PRO' : '👑 BUSINESS'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest ml-1">Durasi *</p>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 3, 6, 12].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setGenForm(f => ({ ...f, billingMonths: m }))}
                      className={`h-12 rounded-xl font-black text-[13px] border transition-all ${genForm.billingMonths === m
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                          : 'bg-white/5 border-white/10 text-[#4B6478] hover:bg-white/10'
                        }`}
                    >
                      {m}
                      <span className="block text-[9px] uppercase tracking-widest font-bold opacity-60">{m === 1 ? 'bln' : 'bln'}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* FIX 3: Manual price override when config not found */}
              {!isPriceFromConfig && genForm.tenantId && (
                <div className="space-y-2">
                  <label htmlFor="manualPriceInput" className="text-[10px] font-black text-amber-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                    <AlertTriangle size={11} /> HARGA TIDAK DITEMUKAN — INPUT MANUAL
                  </label>
                  <InputRupiah
                    id="manualPriceInput"
                    name="manualPriceInput"
                    value={manualPrice}
                    onChange={setManualPrice}
                    placeholder="Harga per bulan (Rp)"
                    className="bg-amber-500/5 border-amber-500/30 h-12 rounded-xl focus:border-amber-500/60"
                  />
                </div>
              )}

              {/* Price Breakdown */}
              <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 space-y-3">
                <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">KALKULASI HARGA</p>
                <div className="flex justify-between text-[12px]">
                  <span className="text-white/50 font-medium">Harga {genForm.billingMonths} bln × {formatIDR(effectiveMonthly)}</span>
                  <span className="font-bold text-white">{formatIDR(genSubtotal)}</span>
                </div>
                {genDiscount > 0 && (
                  <div className="flex justify-between text-[12px]">
                    <span className="text-red-400/70 font-medium">Diskon {genForm.discountPct}%</span>
                    <span className="font-bold text-red-400">-{formatIDR(genDiscount)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-white/5 flex justify-between">
                  <span className="text-[13px] font-black text-white uppercase tracking-wide">Total</span>
                  <span className="text-[16px] font-display font-black text-emerald-400">{formatIDR(genFinal)}</span>
                </div>
              </div>

              {/* Discount */}
              <div className="space-y-2">
                <label htmlFor="genDiscount" className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest ml-1">Diskon %</label>
                <Input
                  id="genDiscount"
                  name="genDiscount"
                  type="number"
                  min={0}
                  max={100}
                  value={genForm.discountPct}
                  onChange={(e) => setGenForm(f => ({ ...f, discountPct: Number(e.target.value) }))}
                  className="bg-white/5 border-white/10 h-12 rounded-xl text-sm font-medium focus:border-emerald-500/50"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label htmlFor="genNotes" className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest ml-1">Catatan</label>
                <Textarea
                  id="genNotes"
                  name="genNotes"
                  placeholder="Catatan untuk invoice ini (opsional)..."
                  value={genForm.notes}
                  onChange={(e) => setGenForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className="bg-white/5 border-white/10 rounded-xl text-sm font-medium focus:border-emerald-500/50 resize-none"
                />
              </div>
            </div>

            <div className="p-6 pt-0 flex gap-3 sticky bottom-0 bg-[#0C1319] border-t border-white/5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsGenerateOpen(false)}
                className="flex-1 h-12 rounded-xl border-white/10 text-[#4B6478] font-black uppercase text-[11px] tracking-widest"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={createInvoice.isPending || !genForm.tenantId || genFinal <= 0 || genHasPending}
                className="flex-1 h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[11px] tracking-widest shadow-xl shadow-emerald-500/20 disabled:opacity-50"
              >
                {createInvoice.isPending ? 'Membuat...' : <><FileText size={15} className="mr-2" /> Generate Invoice</>}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ─── BANK MODAL ─── */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setIsBankModalOpen(false)}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#0C1319] border border-white/10 w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl relative z-10"
          >
            <form onSubmit={handleSaveBank}>
              <div className="p-8 pb-4">
                <h2 className="text-xl font-black text-white uppercase tracking-tight mb-1">
                  {editingBank ? 'Edit Rekening' : 'Tambah Rekening'}
                </h2>
                <p className="text-[11px] font-bold text-[#4B6478] uppercase tracking-widest">
                  Pengaturan mutasi bank TernakOS
                </p>
              </div>
              <div className="p-8 pt-4 space-y-4">
                <div className="space-y-2">
                  <label htmlFor="bank_name" className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest ml-1">Nama Bank</label>
                  <Input
                    id="bank_name"
                    name="bank_name"
                    defaultValue={editingBank?.bank_name}
                    placeholder="Contoh: BCA / Mandiri / BNI"
                    className="bg-white/5 border-white/10 h-12 rounded-xl text-sm font-medium focus:border-emerald-500/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="account_number" className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest ml-1">Nomor Rekening</label>
                  <Input
                    id="account_number"
                    name="account_number"
                    defaultValue={editingBank?.account_number}
                    placeholder="000123456789"
                    className="bg-white/5 border-white/10 h-12 rounded-xl text-sm font-medium focus:border-emerald-500/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="account_name" className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest ml-1">Atas Nama (Pemilik)</label>
                  <Input
                    id="account_name"
                    name="account_name"
                    defaultValue={editingBank?.account_name}
                    placeholder="PT TERNAKOS TEKNOLOGI"
                    className="bg-white/5 border-white/10 h-12 rounded-xl text-sm font-medium focus:border-emerald-500/50 uppercase"
                    required
                  />
                </div>
              </div>
              <div className="p-8 pt-0 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsBankModalOpen(false)}
                  className="flex-1 h-12 rounded-xl border-white/10 text-[#4B6478] font-black uppercase text-[11px] tracking-widest"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[11px] tracking-widest shadow-xl shadow-emerald-500/20"
                >
                  Simpan Akun
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}

// ─── Internal UI Components ───────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color, isUrgent }) {
  const colors = {
    amber: 'text-amber-400 border-amber-500/20 bg-amber-500/5',
    emerald: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
    blue: 'text-blue-400 border-blue-500/20 bg-blue-500/5',
    red: 'text-red-400 border-red-500/20 bg-red-500/5'
  }
  return (
    <Card className={`relative overflow-hidden border border-white/8 rounded-[24px] p-5 shadow-2xl transition-all group hover:border-white/20 ${isUrgent ? 'animate-pulse border-amber-500/50' : ''}`}>
      <div className={`absolute -right-2 -bottom-2 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity ${colors[color]}`}>
        <Icon size={80} strokeWidth={2.5} />
      </div>
      <div className="relative z-10 flex flex-col h-full justify-between gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colors[color]} group-hover:scale-110 transition-transform`}>
          <Icon size={18} />
        </div>
        <div>
          <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest mb-1">{label}</p>
          <p className="text-2xl font-display font-black text-white leading-none whitespace-nowrap">{value}</p>
        </div>
      </div>
    </Card>
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
    <motion.div
      layout
      className={`bg-[#111C24] border rounded-[24px] p-6 relative overflow-hidden group transition-all shadow-xl ${bank.is_active ? 'border-white/8 hover:border-emerald-500/30' : 'border-white/5 opacity-60 hover:opacity-80'
        }`}
    >
      <div className="absolute -right-4 -bottom-4 opacity-[0.02] -rotate-12">
        <CreditCard size={100} />
      </div>
      <div className="flex justify-between items-start mb-6">
        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl">
          🏦
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[9px] font-black uppercase tracking-widest ${bank.is_active ? 'text-emerald-400' : 'text-[#4B6478]'}`}>
            {bank.is_active ? 'AKTIF' : 'NONAKTIF'}
          </span>
          <Switch
            checked={bank.is_active}
            onCheckedChange={handleToggleActive}
            disabled={isToggling}
            className="data-[state=checked]:bg-emerald-500 scale-90"
          />
        </div>
      </div>
      <div className="space-y-4 relative z-10">
        <div>
          <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.2em] mb-1">Bank Name</p>
          <p className="text-xl font-display font-black text-white">{bank.bank_name}</p>
        </div>
        <div>
          <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.2em] mb-1">Account Number</p>
          <p className="text-lg font-mono font-bold text-white/80">{bank.account_number}</p>
        </div>
        <div className="pt-2 border-t border-white/5 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-bold text-[#4B6478] uppercase tracking-wider mb-0.5">Atas Nama</p>
            <p className="text-[11px] font-black text-white uppercase truncate max-w-[120px]">{bank.account_name}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-9 w-9 p-0 rounded-xl bg-white/5 hover:bg-emerald-500 hover:text-white transition-all border border-transparent hover:border-emerald-500 shadow-lg"
            >
              <Edit2 size={14} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-9 w-9 p-0 rounded-xl bg-white/5 hover:bg-red-500 hover:text-white transition-all border border-transparent hover:border-red-500 shadow-lg"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
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

function getVerticalIcon(v) {
  switch (v) {
    case 'poultry_broker': return <Bird size={18} />
    case 'egg_broker': return <Egg size={18} />
    case 'peternak': return <Home size={18} />
    case 'rpa': return <Factory size={18} />
    default: return <Building2 size={18} />
  }
}
