import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion' // eslint-disable-line no-unused-vars
import { Plus, X, ChevronLeft, Loader2 } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { DatePicker } from '@/components/ui/DatePicker'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { toast } from 'sonner'
import { formatIDR } from '@/lib/format'
import {
  useSembakoProducts, useSembakoCustomers, useSembakoSales, useSembakoEmployees,
  useCreateSembakoProduct, useCreateSembakoSale, useCreateSembakoDelivery,
  useRecordSembakoPayment, useUpdateSembakoSale, useCreateSembakoCustomer,
} from '@/lib/hooks/useSembakoData'
import SembakoInvoicePreview from '../SembakoInvoicePreview'
import {
  C, sInput, sBtn, sLabel,
  CustomSelect, InputRupiah, ProgressIndicator, SummaryLine,
  PAYMENT_TERMS_DAYS, PAYMENT_TERMS_LABEL,
  CUSTOMER_TYPE_OPTIONS,
} from './sembakoSaleUtils'
import { SembakoSuccessCard } from './SembakoSuccessCard'

export function SembakoCreateInvoiceSheet({ open, onOpenChange, editId }) {
  const { data: customers = [], isLoading: customersLoading } = useSembakoCustomers()
  const { data: products = [], isLoading: productsLoading } = useSembakoProducts()
  const { data: employees = [] } = useSembakoEmployees()
  const { data: allSales = [] } = useSembakoSales()

  const createSale = useCreateSembakoSale()
  const updateSale = useUpdateSembakoSale()
  const createCustomer = useCreateSembakoCustomer()
  const createProduct = useCreateSembakoProduct()
  const createDelivery = useCreateSembakoDelivery()
  const recordPayment = useRecordSembakoPayment()

  const [step, setStep] = useState(0)
  const [custId, setCustId] = useState('')
  const [txnDate, setTxnDate] = useState(new Date().toISOString().slice(0, 10))
  const [dueDate, setDueDate] = useState('')
  const [items, setItems] = useState([{ product_id: '', product_name: '', unit: '', quantity: 0, price_per_unit: 0, cogs_per_unit: 0 }])
  const [deliveryCost, setDeliveryCost] = useState(0)
  const [otherCost, setOtherCost] = useState(0)
  const [payAmount, setPayAmount] = useState(0)
  const [payMethod, setPayMethod] = useState('cash')
  const [notes, setNotes] = useState('')

  const [quickAddCust, setQuickAddCust] = useState(false)
  const [newCustForm, setNewCustForm] = useState({ customer_name: '', customer_type: 'warung', phone: '', address: '', payment_terms: 'cash' })
  const [quickAddProd, setQuickAddProd] = useState(false)
  const [newProdForm, setNewProdForm] = useState({ product_name: '', category: 'lainnya', unit: 'pcs', sell_price: 0 })

  const [useDelivery, setUseDelivery] = useState(false)
  const [deliveryDriver, setDeliveryDriver] = useState('')
  const [deliveryVehicle, setDeliveryVehicle] = useState('')
  const [deliveryPlate, setDeliveryPlate] = useState('')
  const [deliveryArea, setDeliveryArea] = useState('')
  const [fuelCost, setFuelCost] = useState(0)

  const [successData, setSuccessData] = useState(null)
  const [printData, setPrintData] = useState(null)
  const [printMode, setPrintMode] = useState('invoice')
  const lastPrefillKeyRef = useRef(null)

  const customerOptions = useMemo(() =>
    customers.map(c => ({ value: c.id, label: c.customer_name })),
    [customers]
  )
  const productOptions = useMemo(() =>
    products.map(p => ({ value: p.id, label: `${p.product_name} (${p.current_stock} ${p.unit})` })),
    [products]
  )
  const employeeOptions = useMemo(() =>
    [{ value: '', label: '-- Belum Ditentukan --' }, ...employees.filter(e => e.status === 'aktif').map(e => ({ value: e.id, label: `${e.full_name} (${e.role})` }))],
    [employees]
  )

  const editSale = useMemo(() => {
    if (!editId) return null
    return allSales.find(s => s.id === editId) || null
  }, [allSales, editId])

  useEffect(() => {
    if (!open || !editSale) {
      if (!open) lastPrefillKeyRef.current = null
      return
    }

    const prefillKey = `${editSale.id}:${editSale.updated_at || editSale.transaction_date || ''}`
    if (lastPrefillKeyRef.current === prefillKey) return
    lastPrefillKeyRef.current = prefillKey

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCustId(editSale.customer_id || '')
    setTxnDate(editSale.transaction_date?.slice(0, 10) || new Date().toISOString().slice(0, 10))
    setDueDate(editSale.due_date?.slice(0, 10) || '')
    setDeliveryCost(editSale.delivery_cost || 0)
    setOtherCost(editSale.other_cost || 0)
    setNotes(editSale.notes || '')

    if (Array.isArray(editSale.sembako_sale_items) && editSale.sembako_sale_items.length > 0) {
      setItems(editSale.sembako_sale_items.map(it => ({
        product_id: it.product_id,
        product_name: it.product_name,
        unit: it.unit,
        quantity: it.quantity,
        price_per_unit: it.price_per_unit,
        cogs_per_unit: it.cogs_per_unit
      })))
    } else {
      setItems([{ product_id: '', product_name: '', unit: '', quantity: 0, price_per_unit: 0, cogs_per_unit: 0 }])
    }
  }, [open, editSale])

  const selectedCust = customers.find(c => c.id === custId)
  const totalAmount = items.reduce((s, i) => s + Math.round((i.quantity || 0) * (i.price_per_unit || 0)), 0)
  const totalCogs = items.reduce((s, i) => s + Math.round((i.quantity || 0) * (i.cogs_per_unit || 0)), 0)
  const grossProfit = totalAmount - totalCogs

  function handleSelectCustomer(id) {
    setCustId(id)
    const c = customers.find(x => x.id === id)
    if (c?.payment_terms && PAYMENT_TERMS_DAYS[c.payment_terms]) {
      const d = new Date(txnDate)
      d.setDate(d.getDate() + PAYMENT_TERMS_DAYS[c.payment_terms])
      setDueDate(d.toISOString().slice(0, 10))
    }
  }

  async function handleSaveQuickCust() {
    if (!newCustForm.customer_name) { toast.error('Nama toko wajib diisi'); return }
    try {
      const res = await createCustomer.mutateAsync(newCustForm)
      if (res && res.id) { handleSelectCustomer(res.id); setQuickAddCust(false) }
    } catch {
      // Error handled by hook
    }
  }

  async function handleSaveQuickProd() {
    if (!newProdForm.product_name) { toast.error('Nama produk wajib diisi'); return }
    try {
      await createProduct.mutateAsync({ ...newProdForm, current_stock: 0, avg_buy_price: 0, is_active: true })
      setQuickAddProd(false)
    } catch {
      // Error handled by hook
    }
  }

  function handleItemChange(idx, field, val) {
    const next = [...items]
    next[idx] = { ...next[idx], [field]: val }
    if (field === 'product_id') {
      const p = products.find(x => x.id === val)
      if (p) {
        next[idx].product_name = p.product_name
        next[idx].unit = p.unit
        next[idx].price_per_unit = p.sell_price || 0
        next[idx].cogs_per_unit = p.avg_buy_price || 0
      }
    }
    setItems(next)
  }

  async function handleSubmit() {
    const validItems = items.filter(i => i.product_id && i.quantity > 0)
    if (!validItems.length) { toast.error('Tambahkan minimal 1 produk'); return }

    try {
      const custName = selectedCust?.customer_name || 'Umum'

      if (editId) {
        await updateSale.mutateAsync({
          id: editId,
          updates: {
            customer_id: custId || null,
            customer_name: custName,
            transaction_date: txnDate,
            due_date: dueDate || null,
            total_amount: totalAmount,
            total_cogs: totalCogs,
            delivery_cost: deliveryCost,
            other_cost: otherCost,
            notes,
          }
        })
        toast.success('Pinjaman/Transaksi diperbarui')
        handleClose()
        return
      }

      const sale = await createSale.mutateAsync({
        customer_id: custId || null,
        customer_name: custName,
        transaction_date: txnDate,
        due_date: dueDate || null,
        items: validItems,
        delivery_cost: deliveryCost,
        other_cost: otherCost,
        notes,
      })

      if (payAmount > 0 && sale?.id) {
        await recordPayment.mutateAsync({
          sale_id: sale.id,
          customer_id: custId || null,
          amount: payAmount,
          payment_date: txnDate,
          payment_method: payMethod,
          reference_number: null,
          notes: 'Pembayaran awal (wizard)',
        })
      }

      if (useDelivery && sale?.id) {
        await createDelivery.mutateAsync({
          sale_id: sale.id,
          employee_id: deliveryDriver || null,
          driver_name: employees.find(e => e.id === deliveryDriver)?.full_name || null,
          vehicle_type: deliveryVehicle,
          vehicle_plate: deliveryPlate.toUpperCase(),
          delivery_date: txnDate,
          delivery_area: deliveryArea || selectedCust?.address || '',
          delivery_cost: deliveryCost,
          status: 'pending',
          notes: 'Otomatis dari wizard penjualan'
        })
      }

      const netProfit = grossProfit - deliveryCost - otherCost
      setSuccessData({
        id: sale.id,
        invoiceNumber: sale.invoice_number,
        invoice_number: sale.invoice_number,
        customerName: custName,
        customer_name: custName,
        customerPhone: selectedCust?.phone || null,
        revenue: totalAmount,
        total_amount: totalAmount,
        cogs: totalCogs,
        deliveryCost,
        delivery_cost: deliveryCost,
        otherCost,
        other_cost: otherCost,
        netProfit,
        hasDelivery: useDelivery,
        driverName: employees.find(e => e.id === deliveryDriver)?.full_name,
        transaction_date: txnDate,
        sembako_sale_items: validItems,
        remaining_amount: totalAmount - payAmount
      })

    } catch (err) {
      console.error(err)
    }
  }

  const handleClose = useCallback(() => {
    lastPrefillKeyRef.current = null
    setStep(0); setCustId(''); setItems([{ product_id: '', product_name: '', unit: '', quantity: 0, price_per_unit: 0, cogs_per_unit: 0 }])
    setDeliveryCost(0); setOtherCost(0); setNotes('')
    setPayAmount(0); setPayMethod('cash')
    setUseDelivery(false); setQuickAddCust(false); setQuickAddProd(false)
    onOpenChange(false)
  }, [onOpenChange])

  const handleSheetOpenChange = (v) => {
    if (!v) handleClose()
    else onOpenChange(true)
  }

  const steps = ['Pilih Toko', 'Input Produk', 'Pengiriman', 'Summary']

  return (
    <>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <Sheet open={open && !successData} onOpenChange={handleSheetOpenChange}>
        <SheetContent side="right" style={{ background: C.bg, borderLeft: `1px solid ${C.border}`, width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', padding: 0, boxShadow: '-12px 0 40px rgba(0,0,0,0.5)' }}>

          {/* Header */}
          <div style={{ padding: '24px 24px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <SheetTitle style={{ color: C.text, fontWeight: 900, fontSize: '20px', fontFamily: 'DM Sans' }}>
                {editId ? 'Edit Transaksi' : 'Catat Penjualan'}
              </SheetTitle>
            </div>
            <SheetDescription className="sr-only">Wizard untuk mencatat penjualan sembako baru.</SheetDescription>
            <ProgressIndicator currentStep={step} steps={steps} />
          </div>

          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0 24px 24px' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
              >
                {/* ── Step 0: Customer ── */}
                {step === 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {!quickAddCust ? (
                      <div>
                        <p style={sLabel}>TOKO / CUSTOMER</p>
                        {customersLoading ? (
                          <div style={{ height: 48, borderRadius: 12, background: 'rgba(234,88,12,0.07)', animation: 'shimmer 1.4s infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg,rgba(234,88,12,0.07) 0%,rgba(234,88,12,0.13) 50%,rgba(234,88,12,0.07) 100%)' }} />
                        ) : (
                          <CustomSelect
                            id="invoice-customer"
                            value={custId}
                            placeholder="-- Pilih toko / customer --"
                            options={customerOptions}
                            onChange={val => handleSelectCustomer(val)}
                            onAddNew={() => setQuickAddCust(true)}
                          />
                        )}
                        {selectedCust && (
                          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '12px', padding: '12px', background: 'rgba(234,88,12,0.03)', border: `1px solid ${C.border}`, borderRadius: '12px', fontSize: '13px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ color: C.muted, fontWeight: 600 }}>Tipe:</span>
                              <span style={{ color: C.text, fontWeight: 700 }}>{selectedCust.customer_type?.toUpperCase() || '-'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ color: C.muted, fontWeight: 600 }}>Terms:</span>
                              <span style={{ color: C.accent, fontWeight: 800 }}>{PAYMENT_TERMS_LABEL[selectedCust.payment_terms] || selectedCust.payment_terms}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <span style={{ color: C.muted, fontWeight: 600 }}>Piutang Aktif:</span>
                              <span style={{ color: C.red, fontWeight: 800 }}>{formatIDR(selectedCust.total_outstanding || 0)}</span>
                            </div>
                            {selectedCust.credit_limit > 0 && (
                              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '10px' }}>
                                  <span style={{ color: C.muted, fontWeight: 800 }}>BATAS KREDIT: {formatIDR(selectedCust.credit_limit)}</span>
                                  <span style={{ color: (selectedCust.total_outstanding || 0) > selectedCust.credit_limit ? C.red : C.muted }}>
                                    {Math.round(((selectedCust.total_outstanding || 0) / selectedCust.credit_limit) * 100)}%
                                  </span>
                                </div>
                                <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                  <div style={{
                                    height: '100%',
                                    width: `${Math.min(100, ((selectedCust.total_outstanding || 0) / selectedCust.credit_limit) * 100)}%`,
                                    background: (selectedCust.total_outstanding || 0) > selectedCust.credit_limit ? C.red : C.accent,
                                    borderRadius: '2px'
                                  }} />
                                </div>
                                {(selectedCust.total_outstanding || 0) > selectedCust.credit_limit && (
                                  <p style={{ color: C.red, fontSize: '10px', fontWeight: 800, marginTop: '6px', textAlign: 'center' }}>
                                    WARNING: BATAS KREDIT TERLAMPAUI!
                                  </p>
                                )}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </div>
                    ) : (
                      <div style={{ background: C.card, borderRadius: '16px', padding: '16px', border: `1px solid ${C.accent}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <p style={{ fontSize: '14px', fontWeight: 800, color: C.text }}>Toko Baru</p>
                          <button onClick={() => setQuickAddCust(false)} style={{ background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer' }}><X size={16}/></button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div><p style={sLabel}>NAMA TOKO</p><input style={sInput} value={newCustForm.customer_name} onChange={e => setNewCustForm({...newCustForm, customer_name: e.target.value})} placeholder="Contoh: Toko Berkah" /></div>
                          <div><p style={sLabel}>TIPE TOKO</p>
                            <CustomSelect value={newCustForm.customer_type} onChange={v => setNewCustForm({...newCustForm, customer_type: v})} options={CUSTOMER_TYPE_OPTIONS} placeholder="Pilih Tipe" />
                          </div>
                          <div><p style={sLabel}>NO HP</p><PhoneInput value={newCustForm.phone} onChange={e => setNewCustForm({...newCustForm, phone: e.target.value})} placeholder="0812..." /></div>
                          <button onClick={handleSaveQuickCust} disabled={createCustomer.isPending} style={{ ...sBtn(true), width: '100%', marginTop: '8px' }}>
                            {createCustomer.isPending ? 'Menyimpan...' : 'Simpan Toko'}
                          </button>
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div><p style={sLabel}>TANGGAL TRANS.</p><DatePicker value={txnDate} onChange={setTxnDate} /></div>
                      <div><p style={sLabel}>JATUH TEMPO</p><DatePicker value={dueDate || ''} onChange={setDueDate} /></div>
                    </div>

                    <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: `1px dashed ${C.border}` }}>
                      <p style={{ fontSize: '12px', color: C.muted, lineHeight: 1.5 }}>
                        <span style={{ color: C.accent, fontWeight: 800 }}>Info:</span> Invoice number akan dibuat otomatis saat disimpan.
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Step 1: Products ── */}
                {step === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <p style={sLabel}>ITEM PRODUK</p>
                      {productsLoading
                        ? <span style={{ fontSize: '10px', color: C.accent, fontWeight: 700 }}>Memuat produk...</span>
                        : <span style={{ fontSize: '10px', color: C.muted, fontWeight: 700 }}>{items.length} Item</span>
                      }
                    </div>
                    {productsLoading && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[1,2].map(i => (
                          <div key={i} style={{ height: 90, borderRadius: 14, background: 'rgba(234,88,12,0.07)', backgroundImage: 'linear-gradient(90deg,rgba(234,88,12,0.07) 0%,rgba(234,88,12,0.13) 50%,rgba(234,88,12,0.07) 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
                        ))}
                      </div>
                    )}

                    {quickAddProd && (
                      <div style={{ background: C.card, borderRadius: '16px', padding: '16px', border: `1px solid ${C.accent}`, marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <p style={{ fontSize: '14px', fontWeight: 800, color: C.text }}>Produk Baru</p>
                          <button onClick={() => setQuickAddProd(false)} style={{ background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer' }}><X size={16}/></button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div><p style={sLabel}>NAMA PRODUK</p><input style={sInput} value={newProdForm.product_name} onChange={e => setNewProdForm({...newProdForm, product_name: e.target.value})} placeholder="Beras Maknyus 5Kg" /></div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div><p style={sLabel}>KATEGORI</p><input style={sInput} value={newProdForm.category} onChange={e => setNewProdForm({...newProdForm, category: e.target.value})} /></div>
                            <div><p style={sLabel}>SATUAN</p><input style={sInput} value={newProdForm.unit} onChange={e => setNewProdForm({...newProdForm, unit: e.target.value})} placeholder="kg/pcs/sak" /></div>
                          </div>
                          <div><p style={sLabel}>HARGA JUAL STANDARD</p><InputRupiah value={newProdForm.sell_price} onChange={v => setNewProdForm({...newProdForm, sell_price: v})} /></div>
                          <button onClick={handleSaveQuickProd} disabled={createProduct.isPending} style={{ ...sBtn(true), width: '100%', marginTop: '8px' }}>
                            {createProduct.isPending ? 'Menyimpan...' : 'Simpan Produk'}
                          </button>
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {items.map((item, idx) => {
                        const prod = products.find(p => p.id === item.product_id)
                        const overStock = prod && item.quantity > (prod.current_stock || 0)
                        return (
                          <div key={idx} style={{ background: C.card, borderRadius: '14px', padding: '16px', border: `1px solid ${overStock ? 'rgba(239,68,68,0.3)' : C.border}`, position: 'relative' }}>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                              <CustomSelect
                                value={item.product_id}
                                placeholder="Pilih produk..."
                                options={productOptions}
                                onChange={val => handleItemChange(idx, 'product_id', val)}
                                onAddNew={() => setQuickAddProd(true)}
                                style={{ flex: 1 }}
                              />
                              {items.length > 1 && (
                                <button onClick={() => setItems(items.filter((_, i) => i !== idx))} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: C.red, width: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
                              )}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                              <div>
                                <p style={{ ...sLabel, fontSize: '9px' }}>QTY ({item.unit || '...'})</p>
                                <input type="number" value={item.quantity || ''} onChange={e => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)} style={{...sInput, width: '100%'}} />
                                {overStock && <p style={{ fontSize: '9px', color: C.red, marginTop: '4px', fontWeight: 700 }}>Stok tidak cukup</p>}
                              </div>
                              <div>
                                <p style={{ ...sLabel, fontSize: '9px' }}>HARGA JUAL / UNIT</p>
                                <InputRupiah value={item.price_per_unit} onChange={v => handleItemChange(idx, 'price_per_unit', v)} />
                                {selectedCust && item.product_id && (
                                  <p style={{ fontSize: '9px', color: C.muted, marginTop: '4px', fontWeight: 600 }}>
                                    Harga terakhir: {formatIDR(item.price_per_unit || (prod?.sell_price || 0))}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <button onClick={() => setItems([...items, { product_id: '', product_name: '', unit: '', quantity: 0, price_per_unit: 0, cogs_per_unit: 0 }])}
                      style={{ ...sBtn(false), width: '100%', fontSize: '13px', border: `1px dashed ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}>
                      <Plus size={16} /> Tambah Item Lain
                    </button>

                    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '16px', marginTop: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '14px', color: C.muted, fontWeight: 700 }}>TOTAL SEMENTARA</span>
                        <span style={{ fontSize: '16px', color: C.text, fontWeight: 900 }}>{formatIDR(totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Step 2: Delivery ── */}
                {step === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <p style={{ fontSize: '13px', color: C.muted, lineHeight: 1.5 }}>
                      Apakah barang ini akan dikirim menggunakan armada sendiri? Jika ya, trip pengiriman akan otomatis dibuat.
                    </p>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', background: useDelivery ? 'rgba(96,165,250,0.1)' : C.card, border: `1px solid ${useDelivery ? '#60A5FA' : C.border}`, padding: '16px', borderRadius: '16px', transition: 'all 0.2s' }}>
                      <input type="checkbox" checked={useDelivery} onChange={e => setUseDelivery(e.target.checked)} style={{ width: '20px', height: '20px', accentColor: '#60A5FA' }} />
                      <span style={{ fontSize: '14px', fontWeight: 700, color: useDelivery ? '#60A5FA' : C.text }}>Jadwalkan Pengiriman</span>
                    </label>

                    <AnimatePresence>
                      {useDelivery && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' }}>
                          <div><p style={sLabel}>SOPIR / KURIR (OPSIONAL)</p>
                            <CustomSelect
                              value={deliveryDriver}
                              onChange={v => setDeliveryDriver(v)}
                              options={employeeOptions}
                              placeholder="Pilih Kurir"
                            />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div><p style={sLabel}>KENDARAAN</p><input style={sInput} value={deliveryVehicle} onChange={e => setDeliveryVehicle(e.target.value)} placeholder="Mobil Box/Pickup" /></div>
                            <div><p style={sLabel}>NO. PLAT</p><input style={sInput} value={deliveryPlate} onChange={e => setDeliveryPlate(e.target.value)} placeholder="B 1234 XY" /></div>
                          </div>
                          <div><p style={sLabel}>AREA PENGIRIMAN</p><input style={sInput} value={deliveryArea} onChange={e => setDeliveryArea(e.target.value)} placeholder="Contoh: Kec. Setiabudi" /></div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div><p style={sLabel}>BIAYA BBM (INTERNAL)</p><InputRupiah value={fuelCost} onChange={setFuelCost} /></div>
                            <div><p style={{ ...sLabel, color: C.accent }}>NET PROFIT STEP</p>
                              <div style={{ height: '44px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: '13px', color: C.green, fontWeight: 900 }}>
                                {formatIDR(grossProfit - deliveryCost - fuelCost - otherCost)}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* ── Step 3: Summary & Payment ── */}
                {step === 3 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ background: C.card, borderRadius: '16px', padding: '16px', border: `1px solid ${C.border}` }}>
                      <SummaryLine label="Toko / Customer" value={selectedCust?.customer_name || 'Umum'} bold />
                      <SummaryLine label="Jumlah Item" value={`${items.filter(i => i.product_id).length} Item`} />
                      <div style={{ height: '1px', background: C.border, margin: '8px 0' }} />
                      <SummaryLine label="Total Barang" value={formatIDR(totalAmount)} bold />
                      <SummaryLine label="Estimasi HPP" value={formatIDR(totalCogs)} />
                      <SummaryLine label="Est. Gross Profit" value={formatIDR(grossProfit)} color={grossProfit >= 0 ? C.green : C.red} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div><p style={sLabel}>BIAYA KIRIM</p><InputRupiah value={deliveryCost} onChange={setDeliveryCost} /></div>
                      <div><p style={sLabel}>BIAYA LAIN</p><InputRupiah value={otherCost} onChange={setOtherCost} /></div>
                    </div>

                    <div style={{ background: 'rgba(52,211,153,0.04)', borderRadius: '16px', padding: '16px', border: `1px solid rgba(52,211,153,0.15)` }}>
                      <p style={{ ...sLabel, color: C.green }}>PEMBAYARAN AWAL (OPSIONAL)</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                        <InputRupiah value={payAmount} onChange={setPayAmount} placeholder="Jumlah bayar..." />
                        {payAmount > 0 && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {['cash', 'transfer', 'qris'].map(m => (
                              <button key={m} onClick={() => setPayMethod(m)} style={{
                                flex: 1, padding: '10px', borderRadius: '10px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase',
                                background: payMethod === m ? C.green : 'transparent',
                                border: `1px solid ${payMethod === m ? C.green : C.border}`,
                                color: payMethod === m ? '#000' : C.muted,
                                cursor: 'pointer', transition: 'all 0.2s'
                              }}>{m}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div><p style={sLabel}>CATATAN INVOICE</p><textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} style={{ ...sInput, resize: 'none', height: '80px', fontSize: '14px' }} placeholder="Contoh: Titip di satpam, barang diskon..." /></div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Actions */}
          <div style={{ padding: '20px 24px 32px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: '12px', background: C.bg }}>
            {step > 0 ? (
              <button onClick={() => setStep(step - 1)} style={{ ...sBtn(false), flex: 1, padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <ChevronLeft size={16} /> Kembali
              </button>
            ) : (
              <button onClick={handleClose} style={{ ...sBtn(false), flex: 1, padding: '14px' }}>Batal</button>
            )}

            {step < 3 ? (
              <button onClick={() => {
                if (step === 0 && !custId && !selectedCust) { toast.error('Pilih toko dulu atau biarkan kosong jika Umum tidak ada di opsi (disarankan membuat toko)'); return }
                if (step === 1 && items.filter(i => i.product_id && i.quantity > 0).length === 0) { toast.error('Tambahkan minimal 1 produk'); return }
                setStep(step + 1)
              }} style={{ ...sBtn(true), flex: 2, padding: '14px', fontSize: '14px' }}>Lanjut {'>'}</button>
            ) : (
              <button onClick={handleSubmit} disabled={createSale.isPending} style={{ ...sBtn(true), flex: 2, padding: '14px', opacity: createSale.isPending ? 0.6 : 1, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {createSale.isPending ? <Loader2 className="animate-spin" size={18} /> : 'Simpan Invoice'}
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <SembakoSuccessCard
        isOpen={!!successData}
        onClose={() => { setSuccessData(null); handleClose() }}
        data={successData}
        onPrint={(mode) => { setPrintData(successData); setPrintMode(mode) }}
      />

      {printData && (
        <SembakoInvoicePreview
          data={printData}
          mode={printMode}
          onClose={() => setPrintData(null)}
        />
      )}
    </>
  )
}
