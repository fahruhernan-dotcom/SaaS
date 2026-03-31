import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, ChevronDown, Truck, X
} from 'lucide-react'
import {
  useSembakoSales, useSembakoDeliveries, useSembakoEmployees,
  useCreateSembakoDelivery,
} from '@/lib/hooks/useSembakoData'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { formatIDR } from '@/lib/format'
import TopBar from '@/dashboard/_shared/components/TopBar'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import { DatePicker } from '@/components/ui/DatePicker'

// ── Palette ─────────────────────────────────────────────────────────────────
const C = {
  bg: '#06090F', card: '#1C1208', input: '#231A0E',
  accent: '#EA580C', amber: '#F59E0B', green: '#34D399', red: '#EF4444',
  text: '#FEF3C7', muted: '#92400E',
  border: 'rgba(234,88,12,0.15)', borderAm: 'rgba(245,158,11,0.25)',
}

const DELIVERY_STATUS = {
  pending:   { bg: 'rgba(245,158,11,0.12)', color: C.amber, label: 'Pending' },
  on_route:  { bg: 'rgba(96,165,250,0.12)',  color: '#60A5FA', label: 'On Route' },
  delivered: { bg: 'rgba(52,211,153,0.12)',  color: C.green, label: 'Delivered' },
  cancelled: { bg: 'rgba(239,68,68,0.12)',   color: C.red,   label: 'Cancelled' },
}

// ── Shared UI Primitives ────────────────────────────────────────────────────
const sInput = {
  background: C.input, border: `1px solid ${C.border}`, borderRadius: '10px',
  padding: '10px 12px', color: C.text, fontSize: '16px', fontWeight: 600,
  outline: 'none', width: '100%', appearance: 'none', WebkitAppearance: 'none',
  minHeight: '44px',
  colorScheme: 'dark',
}

function CustomSelect({ value, onChange, options, placeholder, id }) {
  const [open, setOpen] = useState(false)
  const selected = options.find(o => o.value === value)

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div
        id={id}
        onClick={() => setOpen(!open)}
        style={{
          ...sInput,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          border: open ? `1px solid ${C.accent}` : `1px solid ${C.border}`,
          transition: 'all 0.2s'
        }}
      >
        <span style={{ color: value ? C.text : C.muted, fontSize: '14px' }}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={16} color={C.muted} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </div>
      <AnimatePresence>
        {open && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 998 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px',
                background: '#130C06', border: `1px solid ${C.border}`, borderRadius: '14px',
                zIndex: 999, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                {options.length === 0 && (
                  <div style={{ padding: '16px', textAlign: 'center', color: C.muted, fontSize: '13px' }}>
                    Tidak ada pilihan
                  </div>
                )}
                {options.map(opt => (
                  <div
                    key={opt.value}
                    onClick={() => { onChange(opt.value); setOpen(false) }}
                    style={{
                      padding: '12px 16px', fontSize: '14px', color: value === opt.value ? C.accent : C.text,
                      background: value === opt.value ? 'rgba(234,88,12,0.1)' : 'transparent',
                      cursor: 'pointer', transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}
                  >
                    <span>{opt.label}</span>
                    {value === opt.value && <span style={{ fontSize: '10px' }}>✓</span>}
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

const sBtn = (primary) => ({
  background: primary ? C.accent : 'transparent',
  border: primary ? 'none' : `1px solid ${C.border}`,
  color: primary ? '#fff' : C.text, borderRadius: '10px',
  padding: '10px 18px', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
})
const sLabel = { fontSize: '11px', color: C.muted, fontWeight: 700, letterSpacing: '0.06em', marginBottom: '4px' }

function fmtDate(d) {
  if (!d) return '-'
  try { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return '-' }
}

function InputRupiah({ value, onChange, placeholder, style }) {
  const display = value ? Number(value).toLocaleString('id-ID') : ''
  return (
    <input style={{ ...sInput, ...style }} placeholder={placeholder || 'Rp 0'}
      value={display ? `Rp ${display}` : ''}
      onChange={e => {
        const raw = e.target.value.replace(/[^0-9]/g, '')
        onChange(raw ? parseInt(raw) : 0)
      }} />
  )
}

function EmptyBox({ icon: Icon, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 0', color: C.muted, gridColumn: '1 / -1' }}>
      <Icon size={32} color={C.muted} style={{ margin: '0 auto 8px' }} />
      <p style={{ fontSize: '13px', fontWeight: 600 }}>{text}</p>
    </div>
  )
}

// ── MAIN ────────────────────────────────────────────────────────────────────
export default function SembakoPengiriman() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { data: deliveries = [] } = useSembakoDeliveries()
  const { data: sales = [] } = useSembakoSales()
  const { data: employees = [] } = useSembakoEmployees()
  const createDelivery = useCreateSembakoDelivery()
  const [openAdd, setOpenAdd] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [form, setForm] = useState({ sale_id: '', employee_id: '', vehicle_type: '', vehicle_plate: '', delivery_date: new Date().toISOString().slice(0, 10), delivery_area: '', delivery_cost: 0, other_cost: 0, notes: '' })

  const filtered = filterStatus ? deliveries.filter(d => d.status === filterStatus) : deliveries

  async function handleCreate() {
    if (!form.delivery_date) return
    await createDelivery.mutateAsync({
      ...form,
      sale_id: form.sale_id || null,
      employee_id: form.employee_id || null,
      driver_name: employees.find(e => e.id === form.employee_id)?.full_name || form.driver_name || null,
    })
    setForm({ sale_id: '', employee_id: '', vehicle_type: '', vehicle_plate: '', delivery_date: new Date().toISOString().slice(0, 10), delivery_area: '', delivery_cost: 0, other_cost: 0, notes: '' })
    setOpenAdd(false)
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', paddingBottom: '96px' }}>
      {!isDesktop && <TopBar title="Pengiriman" />}
      <div style={{ padding: isDesktop ? '32px 40px' : '20px 16px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: isDesktop ? '28px' : '22px', fontWeight: 900, color: C.text, fontFamily: 'DM Sans', marginBottom: '20px' }}>
          Pengiriman & Trip
        </h1>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <button onClick={() => setOpenAdd(true)} style={{ ...sBtn(true), display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={14} /> Tambah Trip
          </button>
          <div style={{ width: 'auto', minWidth: '160px' }}>
            <CustomSelect
              value={filterStatus}
              onChange={val => setFilterStatus(val)}
              options={[
                { value: '', label: 'Semua Status' },
                ...Object.entries(DELIVERY_STATUS).map(([k, v]) => ({ value: k, label: v.label }))
              ]}
              placeholder="Semua Status"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(2,1fr)' : '1fr', gap: '12px' }}>
          {filtered.map(d => {
            const st = DELIVERY_STATUS[d.status] || DELIVERY_STATUS.pending
            return (
              <div key={d.id} style={{ background: C.card, borderRadius: '14px', padding: '14px', border: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: C.text }}>
                    {d.sembako_employees?.full_name || d.driver_name || 'Kurir'}
                  </span>
                  <span style={{ background: st.bg, color: st.color, fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px' }}>{st.label}</span>
                </div>
                <p style={{ fontSize: '11px', color: C.muted }}>
                  {d.vehicle_type && `${d.vehicle_type} `}{d.vehicle_plate && `· ${d.vehicle_plate} `}· {fmtDate(d.delivery_date)}
                </p>
                {d.delivery_area && <p style={{ fontSize: '11px', color: C.muted }}>Area: {d.delivery_area}</p>}
                <p style={{ fontSize: '11px', color: C.text, fontWeight: 600, marginTop: '6px' }}>
                  Biaya: {formatIDR((d.delivery_cost || 0) + (d.other_cost || 0))}
                </p>
                {d.sembako_sales && <p style={{ fontSize: '10px', color: C.muted, marginTop: '4px' }}>Invoice: {d.sembako_sales.invoice_number}</p>}
              </div>
            )
          })}
          {filtered.length === 0 && <EmptyBox icon={Truck} text="Belum ada pengiriman" />}
        </div>
      </div>

      <Sheet open={openAdd} onOpenChange={v => !v && setOpenAdd(false)}>
        <SheetContent side="right" style={{ background: C.bg, borderLeft: `1px solid ${C.border}`, maxWidth: '420px', width: '100%', padding: '24px', overflowY: 'auto' }}>
          <SheetHeader>
            <SheetTitle style={{ color: C.text, fontWeight: 900 }}>Tambah Trip</SheetTitle>
            <SheetDescription className="sr-only">Form untuk menambah jadwal pengiriman sembako.</SheetDescription>
          </SheetHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px', paddingBottom: '100px' }}>
            <div><p style={sLabel}>INVOICE (OPSIONAL)</p>
              <CustomSelect
                value={form.sale_id || ''}
                onChange={val => setForm({ ...form, sale_id: val })}
                options={[
                  { value: '', label: '— Tanpa Invoice —' },
                  ...sales.filter(s => s.payment_status !== 'lunas').map(s => ({ value: s.id, label: `${s.invoice_number} — ${s.customer_name}` }))
                ]}
                placeholder="— Tanpa Invoice —"
              />
            </div>
            <div><p style={sLabel}>SOPIR / KURIR</p>
              <CustomSelect
                value={form.employee_id || ''}
                onChange={val => setForm({ ...form, employee_id: val })}
                options={[
                  { value: '', label: '— Pilih pegawai —' },
                  ...employees.filter(e => e.status === 'aktif').map(e => ({ value: e.id, label: `${e.full_name} (${e.role})` }))
                ]}
                placeholder="— Pilih pegawai —"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div><p style={sLabel}>KENDARAAN</p><input style={sInput} value={form.vehicle_type} onChange={e => setForm({ ...form, vehicle_type: e.target.value })} placeholder="Truk / Pickup" /></div>
              <div><p style={sLabel}>PLAT</p><input style={sInput} value={form.vehicle_plate} onChange={e => setForm({ ...form, vehicle_plate: e.target.value.toUpperCase() })} placeholder="B 1234 XX" /></div>
            </div>
            <div><p style={sLabel}>TANGGAL KIRIM</p><DatePicker value={form.delivery_date} onChange={val => setForm({ ...form, delivery_date: val })} placeholder="Pilih tanggal" /></div>
            <div><p style={sLabel}>AREA PENGIRIMAN</p><input style={sInput} value={form.delivery_area} onChange={e => setForm({ ...form, delivery_area: e.target.value })} placeholder="Kecamatan / kota" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div><p style={sLabel}>BIAYA KIRIM</p><InputRupiah value={form.delivery_cost} onChange={v => setForm({ ...form, delivery_cost: v })} /></div>
              <div><p style={sLabel}>BIAYA LAIN</p><InputRupiah value={form.other_cost} onChange={v => setForm({ ...form, other_cost: v })} /></div>
            </div>
            <div><p style={sLabel}>CATATAN</p><textarea rows={2} style={{ ...sInput, resize: 'vertical' }} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            <button onClick={handleCreate} disabled={createDelivery.isPending} style={{ ...sBtn(true), width: '100%', padding: '14px' }}>
              {createDelivery.isPending ? 'Menyimpan...' : 'Simpan Trip'}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
