import React, { useState, useEffect, useCallback } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { DatePicker } from '@/components/ui/DatePicker'
import { formatIDR } from '@/lib/format'
import { useRecordSembakoPayment } from '@/lib/hooks/useSembakoData'
import { C, sInput, sBtn, sLabel, CustomSelect, InputRupiah, PAYMENT_METHOD_OPTIONS } from './sembakoSaleUtils'

export function SembakoPaymentSheet({ sale, onClose }) {
  const recordPayment = useRecordSembakoPayment()
  const [amount, setAmount] = useState(0)
  const handleSheetClose = useCallback((v) => { if (!v) onClose() }, [onClose])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (sale?.remaining_amount) setAmount(sale.remaining_amount)
    else setAmount(0)
  }, [sale])
  const [method, setMethod] = useState('cash')
  const [refNo, setRefNo] = useState('')
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10))

  async function handleSubmit() {
    if (!amount || !sale) return
    await recordPayment.mutateAsync({
      sale_id: sale.id,
      customer_id: sale.customer_id,
      amount, payment_date: payDate, payment_method: method,
      reference_number: refNo || null, notes: null,
    })
    setAmount(0); setRefNo('')
    onClose()
  }

  return (
    <Sheet open={!!sale} onOpenChange={handleSheetClose}>
      <SheetContent side="right" style={{ background: C.bg, borderLeft: `1px solid ${C.border}`, width: '100%', maxWidth: '420px', padding: '24px', overflowY: 'auto' }}>
        <SheetHeader>
          <SheetTitle style={{ color: C.text, fontWeight: 900 }}>Catat Pembayaran</SheetTitle>
          <SheetDescription className="sr-only">Form untuk mencatat pembayaran invoice sembako.</SheetDescription>
        </SheetHeader>
        {sale && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '20px', paddingBottom: '100px' }}>
            <div style={{ background: C.card, borderRadius: '10px', padding: '12px', border: `1px solid ${C.border}` }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: C.text }}>{sale.invoice_number}</p>
              <p style={{ fontSize: '11px', color: C.muted }}>{sale.customer_name} - Total: {formatIDR(sale.total_amount)}</p>
              <p style={{ fontSize: '11px', color: C.red, fontWeight: 900, letterSpacing: '0.02em' }}>Sisa tagihan: {formatIDR(sale.remaining_amount)}</p>
            </div>
            <div><p style={sLabel}>JUMLAH BAYAR</p><InputRupiah value={amount} onChange={setAmount} /></div>
            <div><p style={sLabel}>METODE</p>
              <CustomSelect
                value={method || 'cash'}
                onChange={val => setMethod(val)}
                options={PAYMENT_METHOD_OPTIONS}
                placeholder="Pilih metode"
              />
            </div>
            <div><p style={sLabel}>NO REFERENSI</p><input style={sInput} value={refNo} onChange={e => setRefNo(e.target.value)} placeholder="Opsional" /></div>
            <div><p style={sLabel}>TANGGAL</p><DatePicker value={payDate} onChange={setPayDate} placeholder="Pilih tanggal" /></div>
            <button onClick={handleSubmit} disabled={recordPayment.isPending} style={{ ...sBtn(true), width: '100%', padding: '14px' }}>
              {recordPayment.isPending ? 'Menyimpan...' : 'Catat Pembayaran'}
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
