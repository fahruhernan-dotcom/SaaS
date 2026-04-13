import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import { SembakoMobileBar } from './components/SembakoNavigation'
import {
  Plus, CreditCard, TrendingUp, CheckCircle2, AlertTriangle,
  History,
} from 'lucide-react'
import { useSembakoSales } from '@/lib/hooks/useSembakoData'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { formatIDR } from '@/lib/format'
import { SembakoPageHeader } from '@/dashboard/broker/sembako_broker/components/SembakoPageHeader'
import { SembakoSummaryStrip } from '@/dashboard/broker/sembako_broker/components/SembakoSummaryStrip'
import { SembakoInvoiceCard } from '@/dashboard/broker/sembako_broker/components/SembakoInvoiceCard'
import { SembakoStatCard } from '@/dashboard/broker/sembako_broker/components/SembakoUiPrimitives'
import { Button } from '@/components/ui/button'
import { SembakoSaleDetailSheet } from '@/dashboard/broker/sembako_broker/components/SembakoSaleDetailSheet'
import { SembakoCreateInvoiceSheet } from '@/dashboard/broker/sembako_broker/components/SembakoCreateInvoiceSheet'
import { C, INVOICE_FILTERS, LoadingSkeleton, EmptyBox } from '@/dashboard/broker/sembako_broker/components/sembakoSaleUtils'

export default function SembakoPenjualan() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const location = useLocation()
  const [openWizard, setOpenWizard] = useState(false)
  const navigate = useNavigate()

  const { setSidebarOpen } = useOutletContext()
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('action') === 'new') {
      setOpenWizard(true)
    }
  }, [location.search])

  const handleWizardClose = useCallback(() => {
    setOpenWizard(false)
    if (location.search.includes('action=new')) {
      navigate(location.pathname, { replace: true })
    }
  }, [location.search, location.pathname, navigate])

  return (
    <div style={{ background: C.bg, minHeight: '100vh', paddingBottom: '96px' }}>
      {!isDesktop && <SembakoMobileBar onHamburger={() => setSidebarOpen(true)} title="Penjualan" />}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <TabInvoice isDesktop={isDesktop} openWizard={openWizard} setOpenWizard={handleWizardClose} />
      </div>
    </div>
  )
}

function TabInvoice({ isDesktop, openWizard, setOpenWizard }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: sales = [], isLoading } = useSembakoSales()
  const [search, setSearch] = useState('')
  const [invoiceFilter, setInvoiceFilter] = useState('all')
  const [page, setPage] = useState(0)
  const PER_PAGE = 20

  const stats = useMemo(() => {
    const now = new Date()
    const thirtyDaysAgo = new Date(now - 30 * 86400000)
    const thisMonth = sales.filter(s => new Date(s.transaction_date) > thirtyDaysAgo)
    return {
      piutang: sales.reduce((s, i) => s + (i.remaining_amount || 0), 0),
      revenue: thisMonth.reduce((s, i) => s + (i.total_amount || 0), 0),
      lunas: sales.filter(s => s.payment_status === 'lunas').length,
      overdue: sales.filter(s => s.payment_status !== 'lunas' && s.due_date && new Date(s.due_date) < now).length,
    }
  }, [sales])

  const summaryItems = useMemo(() => ([
    { label: 'Piutang Aktif', value: stats.piutang, isCurrency: true, color: 'red' },
    { label: 'Revenue 30 Hari', value: stats.revenue, isCurrency: true, color: 'amber' },
    { label: 'Invoice Lunas', value: stats.lunas, color: 'green' },
    { label: 'Lewat Jatuh Tempo', value: stats.overdue, color: stats.overdue > 0 ? 'red' : 'green' },
  ]), [stats])

  const [selectedSaleId, setSelectedSaleId] = useState(null)
  const [showDetail, setShowDetail] = useState(false)
  const [editSaleId, setEditSaleId] = useState(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return sales.filter(s => {
      const matchesSearch =
        (s.invoice_number || '').toLowerCase().includes(q) ||
        (s.customer_name || '').toLowerCase().includes(q) ||
        (s.sembako_customers?.customer_name || '').toLowerCase().includes(q)

      if (!matchesSearch) return false
      if (invoiceFilter === 'all') return true
      if (invoiceFilter === 'paid') return s.payment_status === 'lunas'
      if (invoiceFilter === 'partial') return s.payment_status === 'sebagian'
      if (invoiceFilter === 'unpaid') return (s.remaining_amount || 0) > 0
      if (invoiceFilter === 'overdue') {
        return s.payment_status !== 'lunas' && s.due_date && new Date(s.due_date) < new Date()
      }
      return true
    })
  }, [sales, search, invoiceFilter])

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const activePage = page >= totalPages ? 0 : page
  const paged = filtered.slice(activePage * PER_PAGE, (activePage + 1) * PER_PAGE)

  const selectedSale = useMemo(() =>
    sales.find(s => s.id === selectedSaleId),
    [sales, selectedSaleId]
  )

  const handleOpenEdit = useCallback((sale) => {
    setEditSaleId(sale.id)
    setShowDetail(false)
    setOpenWizard(true)
  }, [setEditSaleId, setShowDetail, setOpenWizard])

  const handleWizardClose = useCallback((open) => {
    if (!open) {
      setOpenWizard(false)
      setEditSaleId(null)
    } else {
      setOpenWizard(true)
    }
  }, [setOpenWizard, setEditSaleId])

  const handleManageDelivery = useCallback((saleId) => {
    const base = location.pathname.replace('/penjualan', '/pengiriman')
    navigate(`${base}?saleId=${saleId}`)
  }, [location.pathname, navigate])

  return (
    <div>
      <SembakoPageHeader
        title="Penjualan & Invoice"
        subtitle="Arus transaksi, piutang, dan status pengiriman"
        isDesktop={isDesktop}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cari invoice atau nama toko..."
        filters={INVOICE_FILTERS}
        activeFilter={invoiceFilter}
        onFilterChange={setInvoiceFilter}
        actionButton={
          <Button
            type="button"
            onClick={() => setOpenWizard(true)}
            className="h-10 rounded-xl bg-[#EA580C] px-4 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-orange-950/20"
          >
            <Plus size={15} className="mr-1" /> Catat Penjualan
          </Button>
        }
      />

      <SembakoSummaryStrip isDesktop={isDesktop} items={summaryItems} />

      <div style={{ padding: '20px 20px 0', display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(4,1fr)' : 'repeat(2,1fr)', gap: '12px', marginBottom: '20px' }}>
        <SembakoStatCard icon={CreditCard} label="Piutang" value={formatIDR(stats.piutang)} color="red" subLabel="Sisa tagihan aktif" />
        <SembakoStatCard icon={TrendingUp} label="Revenue 30 Hari" value={formatIDR(stats.revenue)} color="accent" subLabel="Penjualan berjalan" />
        <SembakoStatCard icon={CheckCircle2} label="Lunas" value={stats.lunas} color="green" subLabel="Invoice selesai" />
        <SembakoStatCard icon={AlertTriangle} label="Jatuh Tempo" value={stats.overdue} color={stats.overdue > 0 ? 'red' : 'green'} subLabel="Butuh follow-up" />
      </div>

      <div style={{ padding: '0 20px' }}>
        {isLoading ? <LoadingSkeleton /> : paged.length === 0 ? (
          <EmptyBox icon={History} text="Belum ada invoice yang cocok dengan filter ini" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {paged.map(sale => (
              <SembakoInvoiceCard
                key={sale.id}
                sale={sale}
                isDesktop={isDesktop}
                onOpenDetail={() => {
                  setSelectedSaleId(sale.id)
                  setShowDetail(true)
                }}
                onManageDelivery={() => handleManageDelivery(sale.id)}
              />
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px', padding: '0 20px' }}>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => setPage(i)} style={{
              width: '32px', height: '32px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              background: activePage === i ? C.accent : C.card, color: activePage === i ? '#fff' : C.muted,
              fontWeight: 700, fontSize: '12px',
            }}>{i + 1}</button>
          ))}
        </div>
      )}

      <SembakoCreateInvoiceSheet open={openWizard} onOpenChange={handleWizardClose} editId={editSaleId} />
      <SembakoSaleDetailSheet
        isOpen={showDetail}
        onOpenChange={setShowDetail}
        sale={selectedSale}
        onEdit={handleOpenEdit}
      />
    </div>
  )
}
