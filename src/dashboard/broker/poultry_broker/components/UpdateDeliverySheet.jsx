import React from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatEkor, formatWeight, safeNum } from '@/lib/format'

export function UpdateDeliverySheet({
  isOpen,
  onOpenChange,
  deliveryTarget,
  arrivedCount,
  setArrivedCount,
  arrivedWeight,
  setArrivedWeight,
  arrivalNotes,
  setArrivalNotes,
  onSubmit,
  isSubmitting
}) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="bg-[#0C1319] border-l border-white/10 p-6 h-full text-left overflow-y-auto w-full sm:max-w-md">
          <SheetHeader className="mb-6">
              <SheetTitle className="text-white font-display text-2xl font-black uppercase tracking-tight">Catat Kedatangan</SheetTitle>
              <SheetDescription className="text-[#4B6478] font-bold uppercase text-[10px] tracking-widest mt-1">Konfirmasi jumlah dan berat tiba di buyer</SheetDescription>
          </SheetHeader>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 mb-6">
               <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-[#4B6478] mb-1 px-1">
                   <span>Target Pengiriman</span>
               </div>
               <div className="bg-[#111C24] p-4 rounded-xl border border-white/5 flex justify-between items-center">
                   <div>
                       <p className="text-[9px] font-black text-[#4B6478] uppercase mb-1">Kiriman Dari</p>
                       <p className="text-xs font-black text-white">{deliveryTarget?.sales?.purchases?.farms?.farm_name || '-'}</p>
                   </div>
                   <div className="text-right">
                       <p className="text-[9px] font-black text-[#4B6478] uppercase mb-1">Target Tiba</p>
                       <p className="text-xs font-black text-white uppercase">
                           {formatEkor(deliveryTarget?.initial_count)} / {formatWeight(deliveryTarget?.initial_weight_kg)}
                       </p>
                   </div>
               </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-6 pb-20">
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Ekor Tiba *</Label>
                      <Input 
                          type="number" 
                          value={arrivedCount} 
                          onChange={(e) => setArrivedCount(e.target.value)}
                          placeholder={deliveryTarget?.initial_count?.toString()}
                          className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs" 
                      />
                  </div>
                  <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Berat Tiba (kg) *</Label>
                      <Input 
                          type="number" 
                          step="0.1" 
                          value={arrivedWeight}
                          onChange={(e) => setArrivedWeight(e.target.value)}
                          placeholder={deliveryTarget?.initial_weight_kg?.toString()}
                          className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs" 
                      />
                  </div>
              </div>

              {/* Summary Live Calculation */}
              {(() => {
                  const mortality = safeNum(deliveryTarget?.initial_count) - safeNum(arrivedCount)
                  const shrinkage = safeNum(deliveryTarget?.initial_weight_kg) - safeNum(arrivedWeight)
                  
                  return (
                      <>
                          <div style={{
                            padding: '14px 16px',
                            background: 'hsl(var(--secondary))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8
                          }}>
                            {[
                              {
                                label: 'Berat dikirim',
                                value: formatWeight(deliveryTarget?.initial_weight_kg),
                                color: 'hsl(var(--foreground))'
                              },
                              {
                                label: 'Berat tiba',
                                value: formatWeight(arrivedWeight),
                                color: '#34D399'
                              },
                              {
                                label: 'Susut berat',
                                value: formatWeight(shrinkage),
                                color: shrinkage > 0 ? '#F87171' : '#34D399'
                              },
                              {
                                label: 'Mati di perjalanan',
                                value: formatEkor(mortality),
                                color: mortality > 0 ? '#F87171' : '#34D399'
                              },
                            ].map(({ label, value, color }) => (
                              <div key={label} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '13px'
                              }}>
                                <span style={{color:'#4B6478'}}>{label}</span>
                                <span style={{
                                  color, fontWeight: 600,
                                  fontVariantNumeric: 'tabular-nums'
                                }}>
                                  {value}
                                </span>
                              </div>
                            ))}
                          </div>

                          {mortality > 0 && (
                            <div style={{
                              padding: '10px 14px',
                              background: 'rgba(248,113,113,0.08)',
                              border: '1px solid rgba(248,113,113,0.20)',
                              borderRadius: '10px',
                              fontSize: '12px',
                              color: '#F87171',
                              display: 'flex',
                              gap: 8,
                              alignItems: 'center'
                            }}>
                              <AlertCircle size={14} style={{flexShrink:0}} />
                              Loss report akan dibuat otomatis untuk {mortality} ekor yang mati.
                            </div>
                          )}
                      </>
                  )
              })()}

              <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Catatan</Label>
                  <Textarea 
                      value={arrivalNotes}
                      onChange={(e) => setArrivalNotes(e.target.value)}
                      placeholder="CATATAN KEDATANGAN..." 
                      className="rounded-2xl bg-[#111C24] border-white/5 font-black text-xs uppercase p-4 min-h-[100px]" 
                  />
              </div>

              <Button 
                  disabled={isSubmitting}
                  className="w-full h-16 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-[24px] shadow-xl shadow-emerald-500/20 active:scale-95 transition-all mt-4"
              >
                  {isSubmitting ? 'MENYIMPAN...' : 'SIMPAN & SELESAIKAN'}
              </Button>
          </form>
      </SheetContent>
    </Sheet>
  )
}
