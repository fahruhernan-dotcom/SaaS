import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CreditCard, Banknote, History, Search, Filter, 
  CheckCircle2, XCircle, Clock, Check, ChevronRight,
  ExternalLink, Building2, Shield, Sparkles, AlertCircle,
  Plus, Edit2, Trash2, Smartphone, Globe
} from 'lucide-react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { 
  useAllInvoices, 
  useConfirmInvoice, 
  usePaymentSettings, 
  useUpsertPaymentSetting 
} from '@/lib/hooks/useAdminData'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from '@/components/ui/sheet'
import { formatIDR, formatDate } from '@/lib/format'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

export default function AdminSubscriptions() {
  const { data: invoices, isLoading: isLoadingInvoices } = useAllInvoices()
  const { data: bankAccounts, isLoading: isLoadingBanks } = usePaymentSettings()
  const confirmInvoice = useConfirmInvoice()
  const upsertBank = useUpsertPaymentSetting()

  const [activeMainTab, setActiveMainTab] = useState('invoices')
  const [invoiceSearch, setInvoiceSearch] = useState('')
  const [invoiceTab, setInvoiceTab] = useState('Semua')
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isBankModalOpen, setIsBankModalOpen] = useState(false)
  const [editingBank, setEditingBank] = useState(null)

  // Stats calculation
  const stats = useMemo(() => {
    if (!invoices) return { pending: 0, paidMonth: 0, totalRevenue: 0, failed: 0 }
    
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    return invoices.reduce((acc, inv) => {
      if (inv.status === 'pending') acc.pending += 1
      if (inv.status === 'paid') {
        acc.totalRevenue += inv.amount
        const confirmedAt = inv.confirmed_at ? new Date(inv.confirmed_at) : null
        if (confirmedAt && confirmedAt >= thirtyDaysAgo) {
          acc.paidMonth += 1
        }
      }
      if (inv.status === 'expired' || inv.status === 'cancelled') acc.failed += 1
      return acc
    }, { pending: 0, paidMonth: 0, totalRevenue: 0, failed: 0 })
  }, [invoices])

  // Filtering invoices
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

      return matchesSearch && matchesTab
    })
  }, [invoices, invoiceSearch, invoiceTab])

  const handleOpenDetail = (inv) => {
    setSelectedInvoice(inv)
    setIsSheetOpen(true)
  }

  const handleConfirm = (inv) => {
    confirmInvoice.mutate({
      invoiceId: inv.id,
      tenantId: inv.tenants.id,
      plan: inv.plan,
      billingMonths: inv.billing_months
    }, {
      onSuccess: () => setIsSheetOpen(false)
    })
  }

  const handleCancelInvoice = async (inv) => {
    if (!confirm('Batalkan invoice ini?')) return
    const { error } = await supabase
      .from('subscription_invoices')
      .update({ status: 'cancelled' })
      .eq('id', inv.id)
    
    if (error) {
      toast.error('Gagal membatalkan invoice')
    } else {
      toast.success('Invoice dibatalkan')
      setIsSheetOpen(false)
      // We don't have a specific invalidate for one invoice update outside hook, 
      // but useConfirmInvoice's invalidate will work if we trigger it or use manual invalidate
      // For now, let's assume global state update is needed
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

  if (isLoadingInvoices) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight">
            Subscriptions & Invoices
          </h1>
          <p className="text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mt-1">
            Monitoring pendapatan dan konfirmasi pembayaran tenant
          </p>
        </div>
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
        </TabsList>

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

            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4B6478]" size={16} />
              <Input 
                placeholder="Cari No. Invoice / Bisnis..." 
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                className="bg-black/20 border-white/10 h-11 rounded-xl pl-11 text-sm focus:border-emerald-500/50 transition-all font-medium"
              />
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
                  {filteredInvoices.map((inv, i) => (
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
                      <td className="px-6 py-4 text-center">
                        <PlanBadge plan={inv.plan} />
                      </td>
                      <td className="px-6 py-4 text-center text-[13px] font-bold text-white">
                        {inv.billing_months} Bln
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[14px] font-display font-black text-white">{formatIDR(inv.amount)}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={inv.status} />
                      </td>
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
                      <td colSpan={7} className="px-6 py-16 text-center text-[#4B6478]">
                        <div className="flex flex-col items-center gap-2 opacity-30">
                          <History size={48} />
                          <p className="text-[11px] font-bold uppercase tracking-[0.2em] mt-2">Belum ada riwayat invoice</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.3em] flex items-center gap-2">
              <CreditCard size={14} /> REKENING PEMBAYARAN AKTIF
            </h2>
            <Button 
              size="sm"
              onClick={() => { setEditingBank(null); setIsBankModalOpen(true); }}
              className="bg-emerald-500 hover:bg-emerald-600 rounded-xl h-10 px-4 text-[11px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20"
            >
              <Plus size={16} className="mr-2" /> Tambah Rekening
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoadingBanks ? [1,2,3].map(i => <BankSkeleton key={i} />) : 
              bankAccounts?.map(bank => (
                <BankCard 
                  key={bank.id} 
                  bank={bank} 
                  onEdit={() => { setEditingBank(bank); setIsBankModalOpen(true); }}
                />
              ))
            }
          </div>
        </TabsContent>
      </Tabs>

      {/* Invoice Detail Sheet */}
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
                <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">PAYMENT INVOICE</p>
                    <StatusBadge status={selectedInvoice.status} />
                  </div>
                  <SheetTitle className="text-2xl font-black text-white tracking-tight leading-none mb-1">
                    #{selectedInvoice.invoice_number}
                  </SheetTitle>
                  <SheetDescription className="text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mt-1">
                    Dibuat pada {formatDate(selectedInvoice.created_at)}
                  </SheetDescription>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                  {/* Amount Section */}
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
                    </div>
                  </div>

                  {/* Tenant Details */}
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

                  {/* Proof of Transfer */}
                  <section className="space-y-4">
                    <h3 className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.2em] px-1">BUKTI TRANSFER</h3>
                    <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 relative min-h-[160px] flex items-center justify-center overflow-hidden">
                       {selectedInvoice.transfer_proof_url ? (
                         <>
                           <img 
                            src={selectedInvoice.transfer_proof_url} 
                            alt="Bukti Transfer" 
                            className="w-full h-full absolute inset-0 object-cover opacity-40 hover:opacity-100 transition-opacity"
                           />
                           <div className="relative z-10 flex flex-col gap-2">
                              <Button 
                                variant="secondary" 
                                size="sm" 
                                className="bg-white/10 hover:bg-white/20 text-white border-white/20 h-9 rounded-xl font-bold text-[11px] uppercase tracking-widest"
                                onClick={() => window.open(selectedInvoice.transfer_proof_url, '_blank')}
                              >
                                <Globe size={14} className="mr-2" /> Buka Full Gambar
                              </Button>
                           </div>
                         </>
                       ) : (
                         <div className="text-center space-y-2 opacity-40">
                            <AlertCircle size={32} className="mx-auto text-[#4B6478]" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#4B6478]">Belum ada bukti transfer</p>
                         </div>
                       )}
                    </div>
                  </section>

                  {/* Log Details */}
                  {selectedInvoice.confirmed_at && (
                    <section className="space-y-4">
                       <h3 className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.2em] px-1">LOG KONFIRMASI</h3>
                       <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                             <Check size={16} />
                          </div>
                          <div>
                             <p className="text-[12px] font-bold text-white uppercase tracking-tight">Dikonfirmasi sistem</p>
                             <p className="text-[10px] text-emerald-500/70 font-bold uppercase tracking-tighter">
                                {formatDate(selectedInvoice.confirmed_at)} • {format(new Date(selectedInvoice.confirmed_at), 'HH:mm')} WIB
                             </p>
                          </div>
                       </div>
                    </section>
                  )}
                </div>

                {/* Footer Actions */}
                {selectedInvoice.status === 'pending' && (
                  <div className="p-6 border-t border-white/5 bg-white/[0.02] space-y-3">
                    <Button 
                      className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[12px] tracking-widest shadow-xl shadow-emerald-500/20"
                      onClick={() => handleConfirm(selectedInvoice)}
                      disabled={confirmInvoice.isPending}
                    >
                      {confirmInvoice.isPending ? 'Memproses...' : '✓ Konfirmasi Pembayaran'}
                    </Button>
                    <Button 
                      variant="outline"
                      className="w-full h-11 rounded-xl border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all font-bold uppercase text-[11px] tracking-widest"
                      onClick={() => handleCancelInvoice(selectedInvoice)}
                    >
                      ✗ Batalkan Invoice
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </SheetContent>
      </Sheet>

      {/* Bank Modal */}
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
                  <label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest ml-1">Nama Bank</label>
                  <Input 
                    name="bank_name" 
                    defaultValue={editingBank?.bank_name}
                    placeholder="Contoh: BCA / Mandiri / BNI" 
                    className="bg-white/5 border-white/10 h-12 rounded-xl text-sm font-medium focus:border-emerald-500/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest ml-1">Nomor Rekening</label>
                  <Input 
                    name="account_number" 
                    defaultValue={editingBank?.account_number}
                    placeholder="000123456789" 
                    className="bg-white/5 border-white/10 h-12 rounded-xl text-sm font-medium focus:border-emerald-500/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest ml-1">Atas Nama (Pemilik)</label>
                  <Input 
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

// --- Internal UI Components ---

function StatCard({ label, value, icon: Icon, color, isUrgent }) {
    const colors = {
      amber: "text-amber-400 border-amber-500/20 bg-amber-500/5",
      emerald: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
      blue: "text-blue-400 border-blue-500/20 bg-blue-500/5",
      red: "text-red-400 border-red-500/20 bg-red-500/5"
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
    starter: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    pro: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    business: "bg-amber-500/10 text-amber-400 border-amber-500/20"
  }
  return (
    <Badge className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-widest border ${styles[plan] || styles.starter}`}>
      {plan}
    </Badge>
  )
}

function StatusBadge({ status }) {
  const styles = {
    pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    paid: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    expired: "bg-red-500/10 text-red-500 border-red-500/20",
    cancelled: "bg-white/5 text-[#4B6478] border-white/10"
  }
  return (
    <Badge className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${styles[status]}`}>
      {status === 'pending' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
      {status}
    </Badge>
  )
}

function BankCard({ bank, onEdit }) {
  return (
    <motion.div 
      layout
      className="bg-[#111C24] border border-white/8 rounded-[24px] p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-all shadow-xl"
    >
      <div className="absolute -right-4 -bottom-4 opacity-[0.02] -rotate-12">
        <CreditCard size={100} />
      </div>
      <div className="flex justify-between items-start mb-6">
         <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl">
             🏦
         </div>
         <Badge className={`h-6 px-3 rounded-full text-[9px] font-black uppercase tracking-widest ${bank.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]' : 'bg-white/5 text-muted-foreground border-white/10'}`}>
            {bank.is_active ? 'AKTIF' : 'NONAKTIF'}
         </Badge>
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
               <p className="text-[11px] font-black text-white uppercase truncate max-w-[140px]">{bank.account_name}</p>
            </div>
            <Button 
                variant="ghost" 
                size="sm"
                onClick={onEdit} 
                className="h-9 w-9 p-0 rounded-xl bg-white/5 hover:bg-emerald-500 hover:text-white transition-all border border-transparent hover:border-emerald-500 shadow-lg"
            >
                <Edit2 size={14} />
            </Button>
         </div>
      </div>
    </motion.div>
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
    case 'poultry_broker': return '🐔'
    case 'egg_broker': return '🥚'
    case 'peternak': return '🏠'
    case 'rpa': return '🏭'
    default: return '🏢'
  }
}
