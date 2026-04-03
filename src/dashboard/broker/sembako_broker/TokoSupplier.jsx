import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ChevronRight,
  MapPin,
  Package,
  Phone,
  Plus,
  Star,
  Store,
  TrendingDown,
  Wallet,
} from 'lucide-react'
import {
  useCreateSembakoCustomer,
  useCreateSembakoSupplier,
  useSembakoAllBatches,
  useSembakoCustomers,
  useSembakoSales,
  useSembakoSuppliers,
} from '@/lib/hooks/useSembakoData'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { formatIDR } from '@/lib/format'
import TopBar from '@/dashboard/_shared/components/TopBar'
import { SembakoPageHeader } from '@/dashboard/broker/sembako_broker/components/SembakoPageHeader'
import { SembakoSummaryStrip } from '@/dashboard/broker/sembako_broker/components/SembakoSummaryStrip'
import {
  SembakoEmptyState,
  SembakoFilterPill,
  SembakoStatCard,
} from '@/dashboard/broker/sembako_broker/components/SembakoUiPrimitives'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const MotionButton = motion.button

const CUSTOMER_TYPES = [
  'warung',
  'toko_retail',
  'supermarket',
  'restoran',
  'catering',
  'grosir',
  'lainnya',
]

const PAYMENT_TERMS = [
  { value: 'cash', label: 'Cash' },
  { value: 'net3', label: 'NET 3' },
  { value: 'net7', label: 'NET 7' },
  { value: 'net14', label: 'NET 14' },
  { value: 'net30', label: 'NET 30' },
]

export default function SembakoTokoSupplier() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [sub, setSub] = useState('toko')
  const [search, setSearch] = useState('')
  const [selectedArea, setSelectedArea] = useState('Semua Area')
  const [onlyHutang, setOnlyHutang] = useState(false)

  const { data: customers = [] } = useSembakoCustomers()
  const { data: suppliers = [] } = useSembakoSuppliers()
  const { data: sales = [] } = useSembakoSales()
  const { data: allBatches = [] } = useSembakoAllBatches()

  const customerStats = useMemo(() => {
    return sales.reduce((acc, sale) => {
      if (!sale.customer_id) return acc

      const current = acc[sale.customer_id] || {
        calculatedOutstanding: 0,
        invoiceCount: 0,
        totalRevenue: 0,
        lastTransactionDate: null,
      }

      current.calculatedOutstanding += sale.remaining_amount || 0
      current.invoiceCount += 1
      current.totalRevenue += sale.total_amount || 0

      if (!current.lastTransactionDate || (sale.transaction_date && sale.transaction_date > current.lastTransactionDate)) {
        current.lastTransactionDate = sale.transaction_date
      }

      acc[sale.customer_id] = current
      return acc
    }, {})
  }, [sales])

  const supplierStats = useMemo(() => {
    return allBatches.reduce((acc, batch) => {
      if (!batch.supplier_id) return acc

      const current = acc[batch.supplier_id] || {
        totalPurchaseValue: 0,
        batchCount: 0,
        lastPurchaseDate: null,
      }

      current.totalPurchaseValue += batch.total_cost || 0
      current.batchCount += 1

      if (!current.lastPurchaseDate || (batch.purchase_date && batch.purchase_date > current.lastPurchaseDate)) {
        current.lastPurchaseDate = batch.purchase_date
      }

      acc[batch.supplier_id] = current
      return acc
    }, {})
  }, [allBatches])

  const totalPiutang = useMemo(
    () => Object.values(customerStats).reduce((sum, item) => sum + (item.calculatedOutstanding || 0), 0),
    [customerStats]
  )

  const totalBelanjaSupplier = useMemo(
    () => Object.values(supplierStats).reduce((sum, item) => sum + (item.totalPurchaseValue || 0), 0),
    [supplierStats]
  )

  const customersWithDebt = useMemo(
    () => customers.filter((customer) => (customerStats[customer.id]?.calculatedOutstanding || 0) > 0).length,
    [customerStats, customers]
  )

  const activeSuppliers = useMemo(
    () => suppliers.filter((supplier) => (supplierStats[supplier.id]?.batchCount || 0) > 0).length,
    [supplierStats, suppliers]
  )

  const areas = useMemo(() => {
    const set = new Set(customers.map((customer) => customer.area).filter(Boolean))
    return ['Semua Area', ...Array.from(set).sort()]
  }, [customers])

  const activeFilters = useMemo(() => {
    if (sub === 'supplier') return []

    return [
      { id: 'all', label: 'Semua Toko' },
      { id: 'debt', label: 'Punya Piutang' },
      ...areas.slice(1).map((area) => ({ id: `area:${area}`, label: area })),
    ]
  }, [areas, sub])

  const activeCustomerFilter = onlyHutang
    ? 'debt'
    : selectedArea !== 'Semua Area'
      ? `area:${selectedArea}`
      : 'all'

  const summaryItems = sub === 'toko'
    ? [
        { label: 'Total Piutang', value: totalPiutang, isCurrency: true, color: 'amber' },
        { label: 'Customer Aktif', value: customers.length },
        { label: 'Punya Tagihan', value: customersWithDebt, color: 'red' },
      ]
    : [
        { label: 'Total Belanja', value: totalBelanjaSupplier, isCurrency: true, color: 'green' },
        { label: 'Supplier Aktif', value: suppliers.length },
        { label: 'Pernah Kirim Batch', value: activeSuppliers, color: 'amber' },
      ]

  return (
    <div className="min-h-screen bg-[#06090F] pb-24 text-left">
      {!isDesktop && <TopBar title="Toko & Supplier" />}

      <div className="mx-auto max-w-7xl">
        <SembakoPageHeader
          title="Toko & Supplier"
          subtitle="Relasi bisnis sembako"
          isDesktop={isDesktop}
          searchQuery={search}
          onSearchChange={setSearch}
          searchPlaceholder={sub === 'toko' ? 'Cari toko, area, atau nomor...' : 'Cari supplier, kontak, atau alamat...'}
          filters={activeFilters}
          activeFilter={activeCustomerFilter}
          onFilterChange={(filterId) => {
            if (filterId === 'all') {
              setOnlyHutang(false)
              setSelectedArea('Semua Area')
              return
            }

            if (filterId === 'debt') {
              setOnlyHutang(true)
              setSelectedArea('Semua Area')
              return
            }

            if (filterId.startsWith('area:')) {
              setOnlyHutang(false)
              setSelectedArea(filterId.replace('area:', ''))
            }
          }}
          actionButton={
            <div className="flex items-center gap-2">
              <SegmentSwitch sub={sub} setSub={setSub} />
              {sub === 'toko' ? <TokoActions compact={isDesktop} /> : <SupplierActions compact={isDesktop} />}
            </div>
          }
        />

        <SembakoSummaryStrip isDesktop={isDesktop} items={summaryItems} />

        <div className="space-y-5 px-5 pt-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {sub === 'toko' ? (
              <>
                <SembakoStatCard
                  label="Estimasi Piutang"
                  value={formatIDR(totalPiutang)}
                  icon={TrendingDown}
                  color="amber"
                  subLabel="Dihitung dari invoice aktual"
                />
                <SembakoStatCard
                  label="Toko Terdaftar"
                  value={customers.length}
                  icon={Store}
                  subLabel="Semua customer aktif"
                />
                <SembakoStatCard
                  label="Punya Tagihan"
                  value={customersWithDebt}
                  icon={Wallet}
                  color="red"
                  subLabel="Masih ada sisa piutang"
                />
                <div className="rounded-[28px] border border-[#EA580C]/10 bg-[#1C1208] p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#92400E]">Filter Area</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <SembakoFilterPill
                      label="Semua Area"
                      active={selectedArea === 'Semua Area'}
                      onClick={() => setSelectedArea('Semua Area')}
                    />
                    {areas.slice(1).map((area) => (
                      <SembakoFilterPill
                        key={area}
                        label={area}
                        active={selectedArea === area}
                        onClick={() => setSelectedArea(area)}
                      />
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <SembakoStatCard
                  label="Total Belanja Supplier"
                  value={formatIDR(totalBelanjaSupplier)}
                  icon={Package}
                  color="green"
                  subLabel="Akumulasi semua batch"
                />
                <SembakoStatCard
                  label="Supplier Terdaftar"
                  value={suppliers.length}
                  icon={Store}
                  subLabel="Partner pengadaan aktif"
                />
                <SembakoStatCard
                  label="Supplier Aktif"
                  value={activeSuppliers}
                  icon={Wallet}
                  color="amber"
                  subLabel="Sudah punya histori batch"
                />
                <div className="rounded-[28px] border border-[#F59E0B]/10 bg-[#1C1208] p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#92400E]">Riwayat Batch</p>
                  <p className="mt-3 font-display text-2xl font-black text-[#F59E0B]">
                    {allBatches.length}
                  </p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-[#92400E]">
                    Total batch pembelian
                  </p>
                </div>
              </>
            )}
          </div>

          {sub === 'toko' ? (
            <TokoList
              customers={customers}
              customerStats={customerStats}
              search={search}
              selectedArea={selectedArea}
              onlyHutang={onlyHutang}
            />
          ) : (
            <SupplierList
              suppliers={suppliers}
              supplierStats={supplierStats}
              search={search}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function SegmentSwitch({ sub, setSub }) {
  return (
    <div className="flex items-center gap-1 rounded-2xl border border-[#EA580C]/10 bg-[#1C1208] p-1.5">
      <button
        onClick={() => setSub('toko')}
        className={cn(
          'h-10 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest transition-all',
          sub === 'toko' ? 'bg-[#EA580C] text-white shadow-lg shadow-orange-950/20' : 'text-[#92400E] hover:text-[#FEF3C7]'
        )}
      >
        Toko
      </button>
      <button
        onClick={() => setSub('supplier')}
        className={cn(
          'h-10 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest transition-all',
          sub === 'supplier' ? 'bg-[#F59E0B] text-[#1C1208] shadow-lg shadow-amber-950/20' : 'text-[#92400E] hover:text-[#FEF3C7]'
        )}
      >
        Supplier
      </button>
    </div>
  )
}

function TokoActions({ compact = false }) {
  const [open, setOpen] = useState(false)
  const createCustomer = useCreateSembakoCustomer()
  const [form, setForm] = useState({
    customer_name: '',
    customer_type: 'warung',
    phone: '',
    address: '',
    area: '',
    payment_terms: 'cash',
    credit_limit: 0,
    reliability_score: 3,
  })

  const handleCreate = async () => {
    if (!form.customer_name.trim()) return
    await createCustomer.mutateAsync(form)
    setOpen(false)
    setForm({
      customer_name: '',
      customer_type: 'warung',
      phone: '',
      address: '',
      area: '',
      payment_terms: 'cash',
      credit_limit: 0,
      reliability_score: 3,
    })
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className={cn(
          'bg-[#EA580C] font-black uppercase tracking-widest shadow-xl shadow-orange-950/20',
          compact ? 'h-10 rounded-xl px-4 text-[10px]' : 'h-12 rounded-2xl px-6 text-[11px]'
        )}
      >
        <Plus size={16} className="mr-2" />
        Tambah Toko
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="overflow-y-auto border-[#EA580C]/10 bg-[#06090F] p-6 text-left">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-left font-display text-2xl font-black uppercase tracking-tight text-[#FEF3C7]">
              Tambah Toko Baru
            </SheetTitle>
            <SheetDescription className="text-left text-xs text-[#92400E]">
              Simpan customer sembako baru untuk transaksi penjualan dan piutang.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 pb-16">
            <Field label="Nama Toko">
              <Input
                className="h-12 rounded-xl border-[#EA580C]/10 bg-[#231A0E] font-bold text-[#FEF3C7] placeholder:text-[#92400E]"
                value={form.customer_name}
                onChange={(event) => setForm({ ...form, customer_name: event.target.value })}
              />
            </Field>

            <Field label="Tipe Customer">
              <Select value={form.customer_type} onValueChange={(value) => setForm({ ...form, customer_type: value })}>
                <SelectTrigger className="h-12 rounded-xl border-[#EA580C]/10 bg-[#231A0E] font-bold text-[#FEF3C7]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-[#EA580C]/10 bg-[#1C1208] text-[#FEF3C7]">
                  {CUSTOMER_TYPES.map((type) => (
                    <SelectItem key={type} value={type} className="text-xs font-bold uppercase">
                      {type.replaceAll('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="No. HP">
              <Input
                className="h-12 rounded-xl border-[#EA580C]/10 bg-[#231A0E] font-bold text-[#FEF3C7] placeholder:text-[#92400E]"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
            </Field>

            <Field label="Area">
              <Input
                className="h-12 rounded-xl border-[#EA580C]/10 bg-[#231A0E] font-bold text-[#FEF3C7] placeholder:text-[#92400E]"
                value={form.area}
                onChange={(event) => setForm({ ...form, area: event.target.value })}
              />
            </Field>

            <Field label="Alamat">
              <Input
                className="h-12 rounded-xl border-[#EA580C]/10 bg-[#231A0E] font-bold text-[#FEF3C7] placeholder:text-[#92400E]"
                value={form.address}
                onChange={(event) => setForm({ ...form, address: event.target.value })}
              />
            </Field>

            <Field label="Termin Bayar">
              <Select value={form.payment_terms} onValueChange={(value) => setForm({ ...form, payment_terms: value })}>
                <SelectTrigger className="h-12 rounded-xl border-[#EA580C]/10 bg-[#231A0E] font-bold text-[#FEF3C7]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-[#EA580C]/10 bg-[#1C1208] text-[#FEF3C7]">
                  {PAYMENT_TERMS.map((term) => (
                    <SelectItem key={term.value} value={term.value} className="text-xs font-bold uppercase">
                      {term.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Keandalan Toko">
              <div className="flex gap-1 pt-1">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setForm({ ...form, reliability_score: score })}
                    className="p-1"
                  >
                    <Star
                      size={22}
                      className={cn(
                        'transition-colors',
                        score <= form.reliability_score
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-transparent text-[#92400E]'
                      )}
                    />
                  </button>
                ))}
              </div>
            </Field>

            <Button
              onClick={handleCreate}
              disabled={createCustomer.isPending}
              className="mt-4 h-12 w-full rounded-2xl bg-[#EA580C] font-black uppercase tracking-widest shadow-xl shadow-orange-950/20 disabled:opacity-50"
            >
              {createCustomer.isPending ? 'Menyimpan...' : 'Simpan Toko'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

function SupplierActions({ compact = false }) {
  const [open, setOpen] = useState(false)
  const createSupplier = useCreateSembakoSupplier()
  const [form, setForm] = useState({
    supplier_name: '',
    phone: '',
    address: '',
    notes: '',
  })

  const handleCreate = async () => {
    if (!form.supplier_name.trim()) return
    await createSupplier.mutateAsync(form)
    setOpen(false)
    setForm({
      supplier_name: '',
      phone: '',
      address: '',
      notes: '',
    })
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className={cn(
          'bg-[#F59E0B] font-black uppercase tracking-widest text-[#1C1208] shadow-xl shadow-amber-950/20',
          compact ? 'h-10 rounded-xl px-4 text-[10px]' : 'h-12 rounded-2xl px-6 text-[11px]'
        )}
      >
        <Plus size={16} className="mr-2" />
        Tambah Supplier
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="overflow-y-auto border-[#F59E0B]/10 bg-[#06090F] p-6 text-left">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-left font-display text-2xl font-black uppercase tracking-tight text-[#FEF3C7]">
              Tambah Supplier
            </SheetTitle>
            <SheetDescription className="text-left text-xs text-[#92400E]">
              Tambahkan partner pengadaan baru untuk pembelian batch stok.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 pb-16">
            <Field label="Nama Supplier">
              <Input
                className="h-12 rounded-xl border-[#F59E0B]/10 bg-[#231A0E] font-bold text-[#FEF3C7] placeholder:text-[#92400E]"
                value={form.supplier_name}
                onChange={(event) => setForm({ ...form, supplier_name: event.target.value })}
              />
            </Field>

            <Field label="No. HP">
              <Input
                className="h-12 rounded-xl border-[#F59E0B]/10 bg-[#231A0E] font-bold text-[#FEF3C7] placeholder:text-[#92400E]"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
            </Field>

            <Field label="Alamat">
              <Input
                className="h-12 rounded-xl border-[#F59E0B]/10 bg-[#231A0E] font-bold text-[#FEF3C7] placeholder:text-[#92400E]"
                value={form.address}
                onChange={(event) => setForm({ ...form, address: event.target.value })}
              />
            </Field>

            <Field label="Catatan">
              <Input
                className="h-12 rounded-xl border-[#F59E0B]/10 bg-[#231A0E] font-bold text-[#FEF3C7] placeholder:text-[#92400E]"
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
              />
            </Field>

            <Button
              onClick={handleCreate}
              disabled={createSupplier.isPending}
              className="mt-4 h-12 w-full rounded-2xl bg-[#F59E0B] font-black uppercase tracking-widest text-[#1C1208] shadow-xl shadow-amber-950/20 disabled:opacity-50"
            >
              {createSupplier.isPending ? 'Menyimpan...' : 'Simpan Supplier'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

function TokoList({ customers, customerStats, search, selectedArea, onlyHutang }) {
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    return customers
      .filter((customer) => {
        const outstanding = customerStats[customer.id]?.calculatedOutstanding || 0
        const haystack = [customer.customer_name, customer.area, customer.phone]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        const matchesSearch = haystack.includes(search.toLowerCase())
        const matchesArea = selectedArea === 'Semua Area' || customer.area === selectedArea
        const matchesDebt = !onlyHutang || outstanding > 0

        return matchesSearch && matchesArea && matchesDebt
      })
      .sort((left, right) => {
        const leftOutstanding = customerStats[left.id]?.calculatedOutstanding || 0
        const rightOutstanding = customerStats[right.id]?.calculatedOutstanding || 0
        return rightOutstanding - leftOutstanding
      })
  }, [customerStats, customers, onlyHutang, search, selectedArea])

  if (!filtered.length) {
    return (
      <SembakoEmptyState
        icon={Store}
        title="Toko Tidak Ditemukan"
        description="Ubah pencarian atau filter. Daftar toko akan muncul di sini setelah customer tersedia."
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {filtered.map((customer) => {
        const stats = customerStats[customer.id] || {}
        const outstanding = stats.calculatedOutstanding || 0
        const invoiceCount = stats.invoiceCount || 0
        const lastTxDate = stats.lastTransactionDate
          ? new Date(stats.lastTransactionDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' })
          : null

        return (
          <MotionButton
            key={customer.id}
            type="button"
            onClick={() => navigate(`customer/${customer.id}`)}
            whileTap={{ scale: 0.985 }}
            className="group rounded-[28px] border border-[#EA580C]/10 bg-[#1C1208] p-5 text-left shadow-lg transition-all hover:border-[#EA580C]/25 hover:shadow-orange-950/20"
          >
            <div className="flex items-start gap-4">
              <Avatar className="h-14 w-14 rounded-2xl border border-[#EA580C]/10 bg-[#EA580C]/10">
                <AvatarFallback className="bg-transparent font-display text-xl font-black uppercase text-[#EA580C]">
                  {(customer.customer_name || '--').slice(0, 2)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-lg font-black uppercase tracking-tight text-[#FEF3C7]">
                      {customer.customer_name}
                    </h3>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge className="h-5 border-none bg-[#EA580C]/10 px-2 text-[8px] font-black uppercase tracking-wider text-[#EA580C]">
                        {customer.customer_type || 'customer'}
                      </Badge>
                      <span className="text-[#EA580C]/20">•</span>
                      <span className="truncate text-[10px] font-bold uppercase text-[#92400E]">
                        {customer.area || 'Tanpa Area'}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="mt-1 text-[#92400E] transition-all group-hover:translate-x-1 group-hover:text-[#EA580C]" size={16} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#EA580C]/10 pt-4">
                  <MetricBlock
                    label="Status Piutang"
                    value={outstanding > 0 ? formatIDR(outstanding) : 'Lunas'}
                    tone={outstanding > 0 ? 'red' : 'green'}
                  />
                  <MetricBlock
                    label="Total Invoice"
                    value={invoiceCount}
                    tone="default"
                  />
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex flex-wrap gap-3 text-[10px] font-black uppercase text-[#92400E]">
                    {customer.phone && <MiniInfo icon={Phone} text={customer.phone} />}
                    {lastTxDate && <MiniInfo icon={MapPin} text={`Trx ${lastTxDate}`} />}
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <Star
                        key={score}
                        size={10}
                        className={cn(
                          score <= (customer.reliability_score || 0)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-[#EA580C]/10'
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </MotionButton>
        )
      })}
    </div>
  )
}

function SupplierList({ suppliers, supplierStats, search }) {
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    return suppliers
      .filter((supplier) => {
        const haystack = [supplier.supplier_name, supplier.phone, supplier.address]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return haystack.includes(search.toLowerCase())
      })
      .sort((left, right) => {
        const leftValue = supplierStats[left.id]?.totalPurchaseValue || 0
        const rightValue = supplierStats[right.id]?.totalPurchaseValue || 0
        return rightValue - leftValue
      })
  }, [search, supplierStats, suppliers])

  if (!filtered.length) {
    return (
      <SembakoEmptyState
        icon={Package}
        title="Supplier Tidak Ditemukan"
        description="Belum ada supplier yang cocok dengan pencarianmu. Tambahkan partner baru jika dibutuhkan."
        color="green"
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {filtered.map((supplier) => {
        const stats = supplierStats[supplier.id] || {}
        const lastDate = stats.lastPurchaseDate
          ? new Date(stats.lastPurchaseDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' })
          : null

        return (
          <MotionButton
            key={supplier.id}
            type="button"
            onClick={() => navigate(`supplier/${supplier.id}`)}
            whileTap={{ scale: 0.992 }}
            className="group flex items-center justify-between rounded-[24px] border border-[#F59E0B]/10 bg-[#1C1208] p-4 text-left shadow-lg transition-all hover:border-[#F59E0B]/25"
          >
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#F59E0B]/15 bg-[#F59E0B]/10">
                <Package size={22} className="text-[#F59E0B]" />
              </div>

              <div className="min-w-0">
                <h3 className="truncate font-display text-base font-black uppercase tracking-tight text-[#FEF3C7]">
                  {supplier.supplier_name}
                </h3>

                <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] font-black uppercase text-[#92400E]">
                  {supplier.phone && <MiniInfo icon={Phone} text={supplier.phone} />}
                  {lastDate && <MiniInfo icon={MapPin} text={`Batch ${lastDate}`} />}
                </div>

                <div className="mt-3 flex flex-wrap gap-4">
                  <MetricBlock label="Nilai Belanja" value={formatIDR(stats.totalPurchaseValue || 0)} tone="amber" compact />
                  <MetricBlock label="Total Batch" value={stats.batchCount || 0} tone="default" compact />
                </div>
              </div>
            </div>

            <ChevronRight className="ml-4 text-[#92400E] transition-all group-hover:translate-x-1 group-hover:text-[#F59E0B]" size={18} />
          </MotionButton>
        )
      })}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-[#92400E]">
        {label}
      </label>
      {children}
    </div>
  )
}

function MetricBlock({ label, value, tone = 'default', compact = false }) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] font-black uppercase tracking-widest text-[#92400E]">
        {label}
      </p>
      <p
        className={cn(
          'font-display font-black tracking-tight',
          compact ? 'text-base' : 'text-xl',
          tone === 'red' && 'text-[#EF4444]',
          tone === 'green' && 'text-[#34D399]',
          tone === 'amber' && 'text-[#F59E0B]',
          tone === 'default' && 'text-[#FEF3C7]'
        )}
      >
        {value}
      </p>
    </div>
  )
}

function MiniInfo({ icon: Icon, text }) {
  const El = Icon
  return (
    <span className="inline-flex max-w-[180px] items-center gap-1 truncate">
      <El size={10} />
      <span className="truncate">{text}</span>
    </span>
  )
}

