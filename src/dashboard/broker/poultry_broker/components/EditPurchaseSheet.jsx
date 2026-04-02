import React from 'react'
import { Loader2 } from 'lucide-react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from '@/components/ui/sheet'
import { InputNumber } from '@/components/ui/InputNumber'
import { InputRupiah } from '@/components/ui/InputRupiah'
import { DatePicker } from '@/components/ui/DatePicker'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { formatIDR } from '@/lib/format'

export function EditPurchaseSheet({
  isOpen,
  onOpenChange,
  editTarget,
  editForm,
  setEditForm,
  onSubmit,
  isSubmitting
}) {
  return (
    <Sheet
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        side="right"
        style={{
          background: 'hsl(var(--card))',
          borderLeft: '1px solid hsl(var(--border))',
          width: '100%',
          maxWidth: '440px',
          padding: 0,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <SheetHeader style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid hsl(var(--border))',
          flexShrink: 0
        }}>
          <SheetTitle style={{
            fontFamily: 'Sora',
            fontSize: '18px',
            fontWeight: 700
          }}>
            Edit Pembelian
          </SheetTitle>
          <SheetDescription className="sr-only">
            Edit data transaksi pembelian
          </SheetDescription>
        </SheetHeader>

        {editTarget && (
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>

            {/* Info kandang (readonly) */}
            <div style={{
              padding: '12px 14px',
              background: 'rgba(16,185,129,0.06)',
              border: '1px solid rgba(16,185,129,0.12)',
              borderRadius: '10px',
              fontSize: '13px',
              color: '#34D399'
            }}>
              📦 {editTarget.farms?.farm_name}
            </div>

            {/* Jumlah Ekor */}
            <div>
              <label style={{fontSize:'11px',color:'#4B6478',
                textTransform:'uppercase',letterSpacing:'0.8px',
                display:'block',marginBottom:6}}>
                Jumlah Ekor *
              </label>
              <InputNumber
                value={editForm.quantity}
                onChange={v => setEditForm(p=>({
                  ...p, quantity: v
                }))}
                step={1} min={1}
                placeholder="500"
              />
            </div>

            {/* Bobot rata-rata */}
            <div>
              <label style={{fontSize:'11px',color:'#4B6478',
                textTransform:'uppercase',letterSpacing:'0.8px',
                display:'block',marginBottom:6}}>
                Bobot Rata-rata (kg/ekor) *
              </label>
              <InputNumber
                value={editForm.avg_weight_kg}
                onChange={v => setEditForm(p=>({
                  ...p, avg_weight_kg: v
                }))}
                step={0.01} min={0.1}
                placeholder="1.85"
              />
            </div>

            {/* Harga Beli */}
            <div>
              <label style={{fontSize:'11px',color:'#4B6478',
                textTransform:'uppercase',letterSpacing:'0.8px',
                display:'block',marginBottom:6}}>
                Harga Beli (Rp/kg) *
              </label>
              <InputRupiah
                value={editForm.price_per_kg}
                onChange={v => setEditForm(p=>({
                  ...p, price_per_kg: v
                }))}
                placeholder="22.000"
              />
            </div>

            {/* Biaya Perjalanan */}
            <div>
              <label style={{fontSize:'11px',color:'#4B6478',
                textTransform:'uppercase',letterSpacing:'0.8px',
                display:'block',marginBottom:6}}>
                Biaya Perjalanan (Transport)
              </label>
              <InputRupiah
                value={editForm.transport_cost}
                onChange={v => setEditForm(p=>({
                  ...p, transport_cost: v
                }))}
                placeholder="0"
              />
            </div>

            {/* Biaya Lain */}
            <div>
              <label style={{fontSize:'11px',color:'#4B6478',
                textTransform:'uppercase',letterSpacing:'0.8px',
                display:'block',marginBottom:6}}>
                Biaya Lain
              </label>
              <InputRupiah
                value={editForm.other_cost}
                onChange={v => setEditForm(p=>({
                  ...p, other_cost: v
                }))}
                placeholder="0"
              />
            </div>

            {/* Tanggal */}
            <div>
              <label style={{fontSize:'11px',color:'#4B6478',
                textTransform:'uppercase',letterSpacing:'0.8px',
                display:'block',marginBottom:6}}>
                Tanggal Transaksi
              </label>
              <DatePicker
                value={editForm.transaction_date ? new Date(editForm.transaction_date) : null}
                onChange={v => setEditForm(p=>({
                  ...p, transaction_date: v ? v.toISOString().split('T')[0] : null
                }))}
              />
            </div>

            {/* Catatan */}
            <div>
              <label style={{fontSize:'11px',color:'#4B6478',
                textTransform:'uppercase',letterSpacing:'0.8px',
                display:'block',marginBottom:6}}>
                Catatan
              </label>
              <Textarea
                value={editForm.notes || ''}
                onChange={e => setEditForm(p=>({
                  ...p, notes: e.target.value
                }))}
                placeholder="Catatan tambahan..."
                style={{fontSize:'16px', minHeight:'80px'}}
              />
            </div>

            {/* Live preview */}
            <div style={{
              padding: '14px',
              background: 'hsl(var(--secondary))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px'
            }}>
              <p style={{
                fontSize:'11px',fontWeight:700,
                color:'#4B6478',textTransform:'uppercase',
                letterSpacing:'0.8px',margin:'0 0 8px'
              }}>
                RINGKASAN
              </p>
              {(() => {
                const tw = Number(editForm.quantity || 0) * Number(editForm.avg_weight_kg || 0)
                const tc = tw * Number(editForm.price_per_kg || 0)
                const tm = tc + Number(editForm.transport_cost || 0) + Number(editForm.other_cost || 0)

                return (
                  <>
                    {[
                      ['Total Berat', `${tw.toFixed(1)} kg`],
                      ['Total Beli', formatIDR(tc)],
                      ['Biaya Perjalanan', formatIDR(Number(editForm.transport_cost || 0))],
                      ['Biaya Lain', formatIDR(Number(editForm.other_cost || 0))],
                    ].map(([label, val]) => (
                      <div key={label} style={{
                        display:'flex',justifyContent:'space-between',
                        padding:'4px 0',fontSize:'13px',
                        borderBottom:'1px solid rgba(255,255,255,0.05)'
                      }}>
                        <span style={{color:'#94A3B8'}}>{label}</span>
                        <span style={{color:'#F1F5F9', fontVariantNumeric:'tabular-nums'}}>
                          {val}
                        </span>
                      </div>
                    ))}

                    <div style={{
                      display:'flex', justifyContent:'space-between',
                      alignItems:'baseline', marginTop:8,
                      paddingTop:8,
                      borderTop:'1px solid rgba(255,255,255,0.08)'
                    }}>
                      <span style={{
                        fontFamily:'Sora', fontSize:'12px',
                        fontWeight:700, color:'hsl(var(--muted-foreground))'
                      }}>
                        TOTAL MODAL
                      </span>
                      <span style={{
                        fontFamily:'Sora', fontSize:'18px',
                        fontWeight:800, color:'#34D399',
                        fontVariantNumeric:'tabular-nums'
                      }}>
                        {formatIDR(tm)}
                      </span>
                    </div>
                  </>
                )
              })()}
            </div>

            {/* Tombol simpan */}
            <Button
              onClick={onSubmit}
              disabled={isSubmitting}
              style={{
                width:'100%', height:'46px',
                background:'#10B981', border:'none',
                borderRadius:'10px', color:'white',
                fontFamily:'DM Sans', fontSize:'15px',
                fontWeight:700
              }}
            >
              {isSubmitting
                ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</>
                : 'Simpan Perubahan'}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
