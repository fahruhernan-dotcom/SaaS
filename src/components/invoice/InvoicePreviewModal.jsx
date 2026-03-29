import React, { Suspense, useState } from 'react'
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, Printer, Save, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { SaleInvoice } from './templates/SaleInvoice'
import { PurchaseInvoice } from './templates/PurchaseInvoice'
import { DeliveryReceipt } from './templates/DeliveryReceipt'
import { PaymentReceipt } from './templates/PaymentReceipt'
import { PeternakInvoice } from './templates/PeternakInvoice'
import { RPATokoInvoice } from './templates/RPATokoInvoice'
import { useSaveInvoice } from '@/lib/invoice/useInvoice'
import { generateInvoiceNumber } from '@/lib/invoice/invoiceUtils'

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildDocument({ type, invoiceNumber, data }) {
  const {
    tenant, sale, rpa, farm, delivery, purchase, payment, payments,
    cycle, broker_name, total_ekor, total_berat, price_per_kg,
    invoice, customer, items, showProfit,
    generatedBy,
  } = data

  if (type === 'sale') {
    return (
      <SaleInvoice
        tenant={tenant}
        sale={sale}
        rpa={rpa}
        farm={farm}
        delivery={delivery}
        invoiceNumber={invoiceNumber}
        generatedBy={generatedBy}
        payments={payments}
      />
    )
  }

  if (type === 'purchase') {
    return (
      <PurchaseInvoice
        tenant={tenant}
        purchase={purchase}
        farm={farm}
        invoiceNumber={invoiceNumber}
        generatedBy={generatedBy}
      />
    )
  }

  if (type === 'delivery') {
    return (
      <DeliveryReceipt
        tenant={tenant}
        delivery={delivery}
        sale={sale}
        farm={farm}
        rpa={rpa}
        invoiceNumber={invoiceNumber}
        generatedBy={generatedBy}
      />
    )
  }

  if (type === 'payment_receipt') {
    return (
      <PaymentReceipt
        tenant={tenant}
        payment={payment}
        sale={sale}
        rpa={rpa}
        invoiceNumber={invoiceNumber}
        generatedBy={generatedBy}
      />
    )
  }

  if (type === 'peternak_invoice') {
    return (
      <PeternakInvoice
        tenant={tenant}
        cycle={cycle}
        farm={farm}
        broker_name={broker_name}
        total_ekor={total_ekor}
        total_berat={total_berat}
        price_per_kg={price_per_kg}
        invoiceNumber={invoiceNumber}
        generatedBy={generatedBy}
      />
    )
  }

  if (type === 'rpa_to_toko') {
    return (
      <RPATokoInvoice
        tenant={tenant}
        invoice={invoice}
        customer={customer}
        items={items || []}
        invoiceNumber={invoiceNumber}
        generatedBy={generatedBy}
        showProfit={showProfit ?? false}
      />
    )
  }

  return null
}

function getFileName(type, invoiceNumber) {
  const prefixes = {
    sale:             'Invoice',
    purchase:         'BuktiBeli',
    delivery:         'SuratJalan',
    payment_receipt:  'Kwitansi',
    peternak_invoice: 'TagihanTernak',
    rpa_to_toko:      'InvoiceRPA',
  }
  return `${prefixes[type] || 'Dokumen'}_${invoiceNumber}.pdf`
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function PDFSkeleton() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-[#111C24] rounded-xl">
      <Loader2 size={28} className="animate-spin text-emerald-400" />
      <p className="text-sm text-[#4B6478] font-medium">Memuat preview PDF...</p>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
// Props:
//   type: 'sale' | 'purchase'
//   data: object — lihat buildDocument()
//   isOpen: boolean
//   onClose: () => void

export default function InvoicePreviewModal({ type, data, isOpen, onClose }) {
  const typeMap = {
    sale: 'sale', purchase: 'purchase', delivery: 'delivery',
    payment_receipt: 'payment_receipt',
    peternak_invoice: 'peternak_invoice', rpa_to_toko: 'rpa_to_toko',
  }
  const [invoiceNumber] = useState(() => generateInvoiceNumber(typeMap[type] || 'sale'))
  const [saved, setSaved] = useState(false)

  const { mutate: saveInvoice, isPending: isSaving } = useSaveInvoice()

  if (!isOpen || !data) return null

  const doc = buildDocument({ type, invoiceNumber, data })
  if (!doc) return null

  const fileName = getFileName(type, invoiceNumber)

  const titles = {
    sale:             'Invoice Penjualan',
    purchase:         'Bukti Pembelian',
    delivery:         'Surat Jalan',
    payment_receipt:  'Kwitansi Pembayaran',
    peternak_invoice: 'Tagihan Penjualan Ternak',
    rpa_to_toko:      'Invoice Penjualan (RPA)',
  }
  const title = titles[type] || 'Dokumen'

  const referenceId =
    type === 'purchase'         ? data.purchase?.id :
    type === 'delivery'         ? data.delivery?.id :
    type === 'payment_receipt'  ? data.payment?.id  :
    type === 'peternak_invoice' ? data.cycle?.id    :
    type === 'rpa_to_toko'      ? data.invoice?.id  :
    data.sale?.id

  const recipientName =
    type === 'purchase'         ? (data.farm?.farm_name               || '-') :
    type === 'peternak_invoice' ? (data.broker_name                   || '-') :
    type === 'rpa_to_toko'      ? (data.customer?.customer_name       || '-') :
    (data.rpa?.rpa_name || '-')

  const totalAmount =
    type === 'purchase'         ? Number(data.purchase?.total_cost    || 0) :
    type === 'payment_receipt'  ? Number(data.payment?.amount         || 0) :
    type === 'peternak_invoice' ? Number(data.cycle?.total_revenue    || 0) :
    type === 'rpa_to_toko'      ? Number(data.invoice?.total_amount   || 0) :
    Number(data.sale?.total_revenue || 0)

  const handleSave = () => {
    saveInvoice(
      {
        invoice_type:   type,
        reference_id:   referenceId,
        recipient_name: recipientName,
        total_amount:   totalAmount,
        metadata: {
          invoice_number: invoiceNumber,
          generated_by:   data.generatedBy,
        },
      },
      {
        onSuccess: () => {
          setSaved(true)
          toast.success('Invoice tersimpan ke riwayat')
        },
        onError: (err) => {
          toast.error('Gagal simpan: ' + err.message)
        },
      }
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent
        className="bg-[#0C1319] border border-white/[0.08] p-0 flex flex-col overflow-hidden"
        style={{ maxWidth: '900px', width: '95vw', height: '92vh', borderRadius: '20px' }}
      >
        {/* Header */}
        <DialogHeader className="flex-row items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.08] shrink-0">
          <div>
            <DialogTitle className="font-display font-bold text-lg text-white leading-none">
              {title}
            </DialogTitle>
            <DialogDescription className="text-[11px] text-[#4B6478] mt-1 font-mono">
              {invoiceNumber}
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-hidden px-4 py-3">
          <Suspense fallback={<PDFSkeleton />}>
            <PDFViewer
              width="100%"
              height="100%"
              style={{ borderRadius: '12px', border: 'none' }}
              showToolbar={true}
            >
              {doc}
            </PDFViewer>
          </Suspense>
        </div>

        {/* Footer actions */}
        <div className="shrink-0 px-6 py-4 border-t border-white/[0.08] flex items-center gap-3">
          {/* Simpan ke riwayat */}
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={isSaving || saved}
            className="h-11 border-white/10 bg-white/[0.03] text-[#94A3B8] font-semibold text-xs uppercase tracking-widest rounded-xl hover:bg-white/[0.06] disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 size={14} className="animate-spin mr-2" />
            ) : saved ? (
              <CheckCircle2 size={14} className="text-emerald-400 mr-2" />
            ) : (
              <Save size={14} className="mr-2" />
            )}
            {saved ? 'Tersimpan' : 'Simpan Riwayat'}
          </Button>

          {/* Print */}
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="h-11 border-white/10 bg-white/[0.03] text-[#94A3B8] font-semibold text-xs uppercase tracking-widest rounded-xl hover:bg-white/[0.06]"
          >
            <Printer size={14} className="mr-2" />
            Print
          </Button>

          {/* Download PDF */}
          <PDFDownloadLink document={doc} fileName={fileName}>
            {({ loading }) => (
              <Button
                disabled={loading}
                className="h-11 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-[0_4px_16px_rgba(16,185,129,0.25)] active:scale-95 transition-transform disabled:opacity-60 ml-auto"
              >
                {loading ? (
                  <Loader2 size={14} className="animate-spin mr-2" />
                ) : (
                  <Download size={14} className="mr-2" />
                )}
                {loading ? 'Memproses...' : 'Download PDF'}
              </Button>
            )}
          </PDFDownloadLink>
        </div>
      </DialogContent>
    </Dialog>
  )
}
