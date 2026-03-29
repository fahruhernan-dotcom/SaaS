import React, { useState, useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Truck, ArrowRightLeft,
    Plus, Check, X, Pencil, PencilLine, Trash2,
    Printer, ChevronDown, ChevronsUpDown, Lock, Unlock, AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { toast } from 'sonner'
import { formatWeight, formatEkor, safeNum } from '@/lib/format'
import { useUpdateDelivery } from '@/lib/hooks/useUpdateDelivery'
import { InputNumber } from '@/components/ui/InputNumber'
import { TimePicker } from '@/components/ui/TimePicker'

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog'

export default function UpdateArrivalSheet({ isOpen, onClose, delivery }) {
    const isDesktop = useMediaQuery('(min-width: 1024px)')
    const { tenant } = useAuth()
    const queryClient = useQueryClient()
    const [isLoading, setIsLoading] = useState(false)
    const [arrivedQty, setArrivedQty] = useState('')
    const [mortalityQty, setMortalityQty] = useState(0)
    const [notes, setNotes] = useState('')
    const [loadTime, setLoadTime] = useState('')
    const { updateTiba } = useUpdateDelivery()

    // Unit Selector State
    const [beratTiba, setBeratTiba] = useState(0)
    const [unitTiba, setUnitTiba] = useState('kg')
    const [unitOpen, setUnitOpen] = useState(false)

    // Driver Selector State
    const [selectedDriver, setSelectedDriver] = useState(null)
    const [driverManual, setDriverManual] = useState(false)
    const [driverOpen, setDriverOpen] = useState(false)
    const [driverName, setDriverName] = useState('')
    const [driverPhone, setDriverPhone] = useState('')
    const [driverLocked, setDriverLocked] = useState(true)
    const [showDriverConfirm, setShowDriverConfirm] = useState(false)

    // Digital Scale State
    const [inputMode, setInputMode] = useState('manual') // 'manual' | 'scale'
    const [scaleEntries, setScaleEntries] = useState([])
    const [newScaleEntry, setNewScaleEntry] = useState({ weightKita: '' })
    const [editingScaleId, setEditingScaleId] = useState(null)
    const [editScaleForm, setEditScaleForm] = useState({ weightKita: '' })
    
    // Vehicle Selection State
    const [selectedVehicle, setSelectedVehicle] = useState(null)
    const [vehicleManual, setVehicleManual] = useState(false)
    const [vehicleOpen, setVehicleOpen] = useState(false)
    const [vehiclePlate, setVehiclePlate] = useState('')
    const [vehicleType, setVehicleType] = useState('')
    const [vehicleLocked, setVehicleLocked] = useState(true)
    const [showVehicleConfirm, setShowVehicleConfirm] = useState(false)

    // Fetch Vehicles
    const { data: vehicles = [] } = useQuery({
        queryKey: ['vehicles', tenant?.id],
        queryFn: async () => {
            const { data } = await supabase
                .from('vehicles')
                .select('id, vehicle_plate, vehicle_type')
                .eq('tenant_id', tenant?.id)
                .eq('status', 'aktif')
                .eq('is_deleted', false)
            return data || []
        },
        enabled: !!tenant?.id && isOpen
    })

    // Fetch Drivers
    const { data: drivers = [] } = useQuery({
        queryKey: ['drivers', tenant?.id],
        queryFn: async () => {
            const { data } = await supabase
                .from('drivers')
                .select('id, full_name, phone')
                .eq('tenant_id', tenant?.id)
                .eq('status', 'aktif')
                .eq('is_deleted', false)
            return data || []
        },
        enabled: !!tenant?.id && isOpen
    })

    // Conversion Logic
    const toKg = (val, unit) => {
        const n = parseFloat(val) || 0
        if (unit === 'ton') return n * 1000
        if (unit === 'rit') return n * 5000
        return n
    }

    const beratTibaKg = toKg(beratTiba, unitTiba)

    useEffect(() => {
        if (delivery && isOpen) {
            const isEdit = delivery.status === 'completed'
            
            // Now using both arrived and mortality counts
            const currentArrived = delivery.arrived_count || 0
            const currentMortality = delivery.mortality_count || 0
            
            setArrivedQty(isEdit ? currentArrived : delivery.initial_count)
            setMortalityQty(isEdit ? currentMortality : 0)
            setNotes(isEdit ? (delivery.notes || '') : '')
            setLoadTime(delivery.load_time ? format(new Date(delivery.load_time), 'HH:mm') : '')
            
            // Initial Weight & Unit
            const kg = safeNum(isEdit ? delivery.arrived_weight_kg : delivery.initial_weight_kg)
            if (kg >= 1000) {
                setUnitTiba('ton')
                setBeratTiba(kg / 1000)
            } else {
                setUnitTiba('kg')
                setBeratTiba(kg)
            }

            // Initial Driver Info
            setDriverName(delivery.driver_name || '')
            setDriverPhone(delivery.driver_phone || '')
            if (delivery.driver_id) {
                setDriverManual(false)
            } else {
                setDriverManual(true)
            }

            // Initial Vehicle Info
            setVehiclePlate(delivery.vehicle_plate || '')
            setVehicleType(delivery.vehicle_type || '')
            if (delivery.vehicle_id) {
                setVehicleManual(false)
            } else {
                setVehicleManual(true)
            }

            // Lock Logic: Lock only if data already exists
            setVehicleLocked(!!delivery.vehicle_plate)
            setDriverLocked(!!delivery.driver_name)
        }
    }, [delivery, isOpen])

    // Sync Logistics Data
    useEffect(() => {
        if (delivery?.driver_id && drivers.length > 0) {
            const matched = drivers.find(d => d.id === delivery.driver_id)
            if (matched) {
                setSelectedDriver(matched)
                setDriverManual(false)
            }
        }
    }, [drivers, delivery])

    useEffect(() => {
        if (delivery?.vehicle_id && vehicles.length > 0) {
            const matched = vehicles.find(v => v.id === delivery.vehicle_id)
            if (matched) {
                setSelectedVehicle(matched)
                setVehicleManual(false)
            }
        }
    }, [vehicles, delivery])
    
    const initialKg = safeNum(delivery?.initial_weight_kg)
    const initialCount = safeNum(delivery?.initial_count)

    // Sync Handlers
    const handleArrivedChange = (val) => {
        setArrivedQty(val)
        const num = safeNum(val)
        setMortalityQty(Math.max(0, initialCount - num))
    }

    const handleMortalityChange = (val) => {
        setMortalityQty(val)
        const num = safeNum(val)
        setArrivedQty(Math.max(0, initialCount - num))
    }

    const tibaKg = beratTibaKg
    const tibaCount = safeNum(arrivedQty)
    const matiEkor = safeNum(mortalityQty)
    const susutKg = initialKg - tibaKg
    const susutPct = initialKg > 0
      ? (susutKg / initialKg * 100).toFixed(1)
      : 0

    // Scale Logic
    const totalScaleKita = scaleEntries.reduce((acc, e) => acc + (parseFloat(e.weightKita) || 0), 0)
    const selisihKg = initialKg - totalScaleKita

    const handleAddScale = () => {
        if (!newScaleEntry.weightKita) {
            toast.error("Berat kita wajib diisi")
            return
        }
        const entry = {
            id: Date.now(),
            weightKita: parseFloat(newScaleEntry.weightKita) || 0
        }
        setScaleEntries([...scaleEntries, entry])
        setNewScaleEntry({ weightKita: '' })
    }

    const removeItem = (id) => {
        setScaleEntries(scaleEntries.filter(e => e.id !== id))
    }

    const handleStartEdit = (e) => {
        setEditingScaleId(e.id)
        setEditScaleForm({
            weightKita: e.weightKita.toString()
        })
    }

    const handleSaveEdit = () => {
        setScaleEntries(scaleEntries.map(e => 
            e.id === editingScaleId 
                ? { 
                    ...e, 
                    weightKita: parseFloat(editScaleForm.weightKita) || 0
                }
                : e
        ))
        setEditingScaleId(null)
    }

    const handlePrintScale = () => {
        const printWindow = window.open('', '_blank')
        const farmName = delivery.sales?.purchases?.farms?.farm_name || '-'
        const rpaName = delivery.sales?.rpa_clients?.rpa_name || '-'
        const initialKg = safeNum(delivery?.initial_weight_kg)
        const totalScaleKita = scaleEntries.reduce((acc, e) => acc + (parseFloat(e.weightKita) || 0), 0)
        const selisihKg = initialKg - totalScaleKita
        const tanggal = format(new Date(), 'dd MMMM yyyy HH:mm', { locale: id })
        
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Report Timbangan - ${delivery.vehicle_plate}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; color: #1e293b; padding: 40px; }
              .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #10B981; }
              .brand { display: flex; align-items: center; gap: 12px; }
              .brand-dot { width: 36px; height: 36px; background: #10B981; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 16px; }
              .brand-name { font-size: 20px; font-weight: 700; color: #0f172a; }
              .brand-sub { font-size: 12px; color: #64748b; }
              .badge { background: #f0fdf4; color: #10B981; border: 1px solid #10B981; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 600; }
              h1 { font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
              .subtitle { font-size: 13px; color: #64748b; margin-bottom: 24px; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 28px; }
              .info-card { background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; }
              .info-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; font-weight: 600; margin-bottom: 4px; }
              .info-value { font-size: 14px; font-weight: 600; color: #0f172a; }
              table { width: 100%; border-collapse: collapse; background: white; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0; margin-bottom: 20px; }
              thead { background: #0f172a; }
              th { padding: 12px 16px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; font-weight: 600; }
              td { padding: 12px 16px; font-size: 14px; border-bottom: 1px solid #f1f5f9; }
              tr:last-child td { border-bottom: none; }
              tr:nth-child(even) td { background: #f8fafc; }
              .no-col { color: #94a3b8; font-size: 12px; width: 48px; }
              .berat-col { font-weight: 600; color: #0f172a; }
              .total-card { background: #0f172a; border-radius: 10px; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
              .total-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin-bottom: 4px; }
              .total-value { font-size: 28px; font-weight: 800; color: #10B981; }
              .selisih-card { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 10px; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }
              .selisih-label { font-size: 12px; color: #92400e; text-transform: uppercase; letter-spacing: 0.08em; }
              .selisih-value { font-size: 18px; font-weight: 700; color: #d97706; }
              .footer { text-align: center; font-size: 11px; color: #94a3b8; padding-top: 20px; border-top: 1px solid #e2e8f0; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="brand">
                <div class="brand-dot">T</div>
                <div>
                  <div class="brand-name">TernakOS</div>
                  <div class="brand-sub">Broker Dashboard</div>
                </div>
              </div>
              <span class="badge">Data Timbangan Digital</span>
            </div>

            <h1>Report Timbangan</h1>
            <p class="subtitle">Dokumen resmi penimbangan ayam potong</p>

            <div class="info-grid">
              <div class="info-card">
                <div class="info-label">Kandang</div>
                <div class="info-value">${farmName}</div>
              </div>
              <div class="info-card">
                <div class="info-label">Buyer (RPA)</div>
                <div class="info-value">${rpaName}</div>
              </div>
              <div class="info-card">
                <div class="info-label">Kendaraan</div>
                <div class="info-value">${delivery.vehicle_plate} / ${delivery.vehicle_type || '-'}</div>
              </div>
              <div class="info-card">
                <div class="info-label">Tanggal & Waktu</div>
                <div class="info-value">${tanggal}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th class="no-col">No</th>
                  <th>Berat Timbangan (kg)</th>
                </tr>
              </thead>
              <tbody>
                ${scaleEntries.map((e, index) => `
                  <tr>
                    <td class="no-col">${index + 1}</td>
                    <td class="berat-col">${e.weightKita.toFixed(2)} kg</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="total-card">
              <div>
                <div class="total-label">Total Timbangan Kita</div>
                <div class="total-value">${totalScaleKita.toFixed(2)} kg</div>
              </div>
              <div style="text-align:right">
                <div class="total-label">Jumlah Timbangan</div>
                <div style="font-size:20px;font-weight:700;color:#64748b">${scaleEntries.length}x</div>
              </div>
            </div>

            <div class="selisih-card">
              <div class="selisih-label">Selisih dari Berat Kirim (${initialKg.toFixed(2)} kg)</div>
              <div class="selisih-value" style="color: ${selisihKg > 0 ? '#d97706' : selisihKg === 0 ? '#10b981' : '#ef4444'}">
                ${selisihKg === 0 ? 'Pas ✓' : (selisihKg > 0 ? `- ${selisihKg.toFixed(2)}` : `+ ${Math.abs(selisihKg).toFixed(2)}`)} kg
              </div>
            </div>

            <div class="footer">
              Dicetak via TernakOS &mdash; ${new Date().toLocaleString('id-ID')} &mdash; Dokumen ini sah tanpa tanda tangan
            </div>
            
            <script>
              window.onload = function() {
                window.focus();
                window.print();
              };
            </script>
          </body>
          </html>
        `)
        
        printWindow.document.close()
    }

    const handleUpdate = async (e) => {
        if (e && e.preventDefault) e.preventDefault()
        if (isLoading) return
        const arrivedCount = tibaCount
        const arrivedWeightKg = tibaKg
        console.log('SUBMIT DIPANGGIL', { arrivedCount, arrivedWeightKg })
        
        // Validation: Berat wajib > 0
        if (!tibaKg || tibaKg <= 0) {
            toast.error("Berat tiba wajib diisi")
            return
        }

        // Validation: Driver & Vehicle are mandatory
        const currentVehicle = vehicleLocked ? { plate: delivery.vehicle_plate } : (vehicleManual ? { plate: vehiclePlate } : selectedVehicle)
        const currentDriver = driverLocked ? { name: delivery.driver_name } : (driverManual ? { name: driverName } : selectedDriver)

        if (!currentVehicle || (!vehicleLocked && vehicleManual && !vehiclePlate)) {
            toast.error("Data kendaraan wajib diisi")
            return
        }
        if (!currentDriver || (!driverLocked && driverManual && !driverName)) {
            toast.error("Data sopir wajib diisi")
            return
        }

        setIsLoading(true)

        let formattedLoadTime = null
        if (loadTime) {
            const baseDate = delivery.created_at ? new Date(delivery.created_at) : new Date()
            const [hh, mm] = loadTime.split(':')
            baseDate.setHours(parseInt(hh), parseInt(mm), 0, 0)
            formattedLoadTime = baseDate.toISOString()
        }
        
        try {
            console.log('Step 1: update deliveries')
            if (delivery.status === 'completed') {
                // Direct UPDATE for existing delivery
                const updatePayload = {
                    arrived_count: tibaCount,
                    arrived_weight_kg: tibaKg,
                    mortality_count: matiEkor > 0 ? matiEkor : 0,
                    notes: notes,
                    load_time: formattedLoadTime,
                }

                if (!vehicleLocked) {
                    let finalVehicleId = selectedVehicle?.id || null
                    if (!finalVehicleId && vehiclePlate) {
                        const { data: newV } = await supabase.from('vehicles').insert({
                            tenant_id: tenant.id,
                            brand: 'Auto-Registered',
                            vehicle_plate: vehiclePlate.toUpperCase(),
                            vehicle_type: vehicleType || 'Armada',
                            ownership: 'lainnya',
                            status: 'aktif'
                        }).select('id').single()
                        if (newV) finalVehicleId = newV.id
                    }
                    updatePayload.vehicle_id = finalVehicleId
                    updatePayload.vehicle_plate = selectedVehicle?.vehicle_plate || vehiclePlate
                    updatePayload.vehicle_type = selectedVehicle?.vehicle_type || vehicleType
                }

                if (!driverLocked) {
                    let finalDriverId = selectedDriver?.id || null
                    if (!finalDriverId && driverName) {
                        const { data: newD } = await supabase.from('drivers').insert({
                            tenant_id: tenant.id,
                            full_name: driverName,
                            phone: driverPhone || null,
                            status: 'aktif'
                        }).select('id').single()
                        if (newD) finalDriverId = newD.id
                    }
                    updatePayload.driver_id = finalDriverId
                    updatePayload.driver_name = selectedDriver?.full_name || driverName
                    updatePayload.driver_phone = selectedDriver?.phone || driverPhone
                }

                const { error } = await supabase
                    .from('deliveries')
                    .update(updatePayload)
                    .eq('id', delivery.id)

                if (error) throw error
                
                // Update Sales Revenue
                const pricePerKg = delivery?.sales?.price_per_kg ?? 0
                const newTotalRevenue = Math.round(arrivedWeightKg * pricePerKg)
                await supabase
                    .from('sales')
                    .update({ total_revenue: newTotalRevenue })
                    .eq('id', delivery.sale_id)

                toast.success('Data kedatangan berhasil diperbarui')
            } else {
                // Standard arrival via hook (hook now handles sales update)
                const arrivalPayload = {
                    deliveryId: delivery.id,
                    arrivedCount: arrivedQty,
                    arrivedWeight: tibaKg,
                    notes: notes,
                    loadTime: formattedLoadTime,
                }

                if (!vehicleLocked) {
                    let finalVehicleId = selectedVehicle?.id || null
                    if (!finalVehicleId && vehiclePlate) {
                        const { data: newV } = await supabase.from('vehicles').insert({
                            tenant_id: tenant.id,
                            brand: 'Auto-Registered',
                            vehicle_plate: vehiclePlate.toUpperCase(),
                            vehicle_type: vehicleType || 'Armada',
                            ownership: 'lainnya',
                            status: 'aktif'
                        }).select('id').single()
                        if (newV) finalVehicleId = newV.id
                    }
                    arrivalPayload.vehicleId = finalVehicleId
                    arrivalPayload.vehiclePlate = selectedVehicle?.vehicle_plate || vehiclePlate
                    arrivalPayload.vehicleType = selectedVehicle?.vehicle_type || vehicleType
                }

                if (!driverLocked) {
                    let finalDriverId = selectedDriver?.id || null
                    if (!finalDriverId && driverName) {
                        const { data: newD } = await supabase.from('drivers').insert({
                            tenant_id: tenant.id,
                            full_name: driverName,
                            phone: driverPhone || null,
                            status: 'aktif'
                        }).select('id').single()
                        if (newD) finalDriverId = newD.id
                    }
                    arrivalPayload.driverId = finalDriverId
                    arrivalPayload.driverName = selectedDriver?.full_name || driverName
                    arrivalPayload.driverPhone = selectedDriver?.phone || driverPhone
                }

                await updateTiba(arrivalPayload)
                toast.success('Kedatangan berhasil dicatat!')
            }

            // Explicit sync variables already declared at top

            console.log('Step 2: delete old loss_reports')
            // 1. Hapus loss_reports lama untuk delivery ini (hindari duplikasi)
            await supabase
              .from('loss_reports')
              .delete()
              .eq('delivery_id', delivery.id)
              .eq('tenant_id', tenant.id)

            // 2. Hitung nilai
            const mortalityCount = (delivery?.initial_count ?? 0) - arrivedCount
            const shrinkageKg = (delivery?.initial_weight_kg ?? 0) - arrivedWeightKg
            const pricePerKg = delivery?.sales?.price_per_kg ?? 0
            const avgWeightKg = (delivery?.initial_count || 0) > 0
              ? ((delivery?.initial_weight_kg || 0) / (delivery?.initial_count || 1))
              : 1.85

            console.log('Step 3: insert mortality/shrinkage')
            // 3. Insert mortality jika ada
            if (mortalityCount > 0) {
              const { error: mortError } = await supabase
                .from('loss_reports')
                .insert({
                  tenant_id: tenant.id,
                  delivery_id: delivery.id,
                  sale_id: delivery.sale_id,
                  loss_type: 'mortality',
                  chicken_count: mortalityCount,
                  weight_loss_kg: mortalityCount * avgWeightKg,
                  price_per_kg: pricePerKg,
                  financial_loss: 0,
                  report_date: new Date().toISOString().split('T')[0],
                  description: 'Laporan mortalitas — tidak mempengaruhi revenue',
                  resolved: false
                })
              if (mortError) console.error('Error insert mortality:', mortError)
              else console.log('✅ Mortality loss_report inserted:', mortalityCount, 'ekor')
            }

            // 4. Insert shrinkage jika ada
            if (shrinkageKg > 0) {
              const { error: shrinkError } = await supabase
                .from('loss_reports')
                .insert({
                  tenant_id: tenant.id,
                  delivery_id: delivery.id,
                  sale_id: delivery.sale_id,
                  loss_type: 'shrinkage',
                  chicken_count: 0,
                  weight_loss_kg: shrinkageKg,
                  price_per_kg: pricePerKg,
                  financial_loss: Math.round(shrinkageKg * pricePerKg),
                  report_date: new Date().toISOString().split('T')[0],
                  description: 'Auto-generated dari Catat Kedatangan',
                  resolved: false
                })
              if (shrinkError) console.error('Error insert shrinkage:', shrinkError)
              else console.log('✅ Shrinkage loss_report inserted:', shrinkageKg, 'kg')
            }

            // 5. Invalidate queries
            await queryClient.invalidateQueries({ queryKey: ['sales'] })
            await queryClient.invalidateQueries({ queryKey: ['sales', tenant.id] })
            await queryClient.invalidateQueries({ queryKey: ['deliveries'] })
            await queryClient.invalidateQueries({ queryKey: ['deliveries', tenant.id] })
            await queryClient.refetchQueries({ queryKey: ['sales', tenant.id] })
            queryClient.invalidateQueries({ queryKey: ['loss-reports'] })
            queryClient.invalidateQueries({ queryKey: ['broker-stats'] })
            onClose()
        } catch (err) {
            console.error('Error update arrival:', err)
            toast.error('Gagal memperbarui data: ' + err.message)
        } finally {
            setIsLoading(false)
        }
    }

    if (!delivery) return null

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="right" className="w-full md:w-[520px] bg-[#0C1319] border-l border-white/8 p-8 overflow-y-auto">
                <SheetHeader className="mb-8">
                    <SheetTitle className="text-white font-display text-2xl font-black uppercase tracking-tight">CATAT KEDATANGAN</SheetTitle>
                    <SheetDescription className={cn("text-[#4B6478] font-bold uppercase tracking-widest mt-1", isDesktop ? "text-[10px]" : "text-xs")}>Konfirmasi jumlah dan berat tiba di lokasi buyer</SheetDescription>
                </SheetHeader>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 mb-6">
                     <div className={cn("flex justify-between items-center font-black uppercase tracking-[0.2em] text-[#4B6478] mb-1 px-1", isDesktop ? "text-[10px]" : "text-xs")}>
                         <span>Target Pengiriman</span>
                     </div>
                     <div className="bg-[#111C24] p-4 rounded-xl border border-white/5 flex justify-between items-center">
                         <div>
                             <p className={cn("font-black text-[#4B6478] uppercase mb-1", isDesktop ? "text-[9px]" : "text-xs")}>Kiriman Dari</p>
                             <p className="text-xs font-black text-white">{delivery.sales?.purchases?.farms?.farm_name || '-'}</p>
                         </div>
                         <ArrowRightLeft className="text-[#4B6478]" size={16} />
                         <div className="text-right">
                             <p className={cn("font-black text-[#4B6478] uppercase mb-1", isDesktop ? "text-[9px]" : "text-xs")}>Target Tiba</p>
                             <p className="text-xs font-black text-white uppercase">
                                 {formatEkor(delivery.initial_count)} / {formatWeight(delivery.initial_weight_kg)}
                             </p>
                         </div>
                     </div>
                </div>

                <form className="space-y-6 pb-20">
                    <div className="space-y-4">
                        <TimePicker 
                            label="Jam Muat"
                            value={loadTime} 
                            onChange={(val) => setLoadTime(val)}
                        />
                    </div>

                    {/* ROW 2: Ekor Tiba & Ekor Mati */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className={cn("font-black uppercase tracking-widest text-[#4B6478] ml-1", isDesktop ? "text-[10px]" : "text-xs")}>Ekor Tiba *</Label>
                            <InputNumber 
                                value={arrivedQty} 
                                onChange={handleArrivedChange}
                                placeholder={delivery.initial_count}
                                className="text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className={cn("font-black uppercase tracking-widest text-[#4B6478] ml-1", isDesktop ? "text-[10px]" : "text-xs")}>Ekor Mati</Label>
                            <InputNumber 
                                value={mortalityQty} 
                                onChange={handleMortalityChange}
                                placeholder="0"
                                className="text-white"
                            />
                        </div>
                    </div>

                    {/* ROW 3: Berat Tiba Full Width */}
                    <div className="space-y-2">
                         <div className="flex justify-between items-center mb-1">
                             <Label className={cn("font-black uppercase tracking-widest text-[#4B6478] ml-1", isDesktop ? "text-[10px]" : "text-xs")}>Berat Tiba *</Label>
                             <div className="flex bg-[#111C24] p-0.5 rounded-lg border border-white/5">
                                 <button
                                     type="button"
                                     onClick={() => setInputMode('manual')}
                                     className={cn(
                                         "px-3 py-1 rounded-md font-black uppercase tracking-widest transition-all",
                                         isDesktop ? "text-[9px]" : "text-[11px]",
                                         inputMode === 'manual' ? "bg-emerald-500 text-white shadow-lg" : "text-[#4B6478] hover:text-white"
                                     )}
                                 >
                                     Langsung
                                 </button>
                                 <button
                                     type="button"
                                     onClick={() => setInputMode('scale')}
                                     className={cn(
                                         "px-3 py-1 rounded-md font-black uppercase tracking-widest transition-all",
                                         isDesktop ? "text-[9px]" : "text-[11px]",
                                         inputMode === 'scale' ? "bg-emerald-500 text-white shadow-lg" : "text-[#4B6478] hover:text-white"
                                     )}
                                 >
                                     Timbangan
                                 </button>
                             </div>
                         </div>

                         <div className="h-full">
                             {inputMode === 'manual' ? (
                                 <div style={{
                                     display: 'grid',
                                     gridTemplateColumns: '1fr 90px',
                                     gap: 8
                                 }}>
                                     <InputNumber
                                         value={beratTiba}
                                         onChange={setBeratTiba}
                                         step={unitTiba === 'kg' ? 10 : 0.01}
                                         min={0}
                                         placeholder="0"
                                         className="text-[#F1F5F9]"
                                     />
                                     <div style={{position: 'relative'}}>
                                         <button
                                             type="button"
                                             onClick={() => setUnitOpen(!unitOpen)}
                                             style={{
                                                 width: '100%', height: '50px',
                                                 padding: '0 12px',
                                                 background: 'hsl(var(--secondary))',
                                                 border: '1px solid hsl(var(--border))',
                                                 borderRadius: '10px',
                                                 fontSize: '14px', fontWeight: 700,
                                                 color: 'hsl(var(--foreground))',
                                                 cursor: 'pointer',
                                                 display: 'flex',
                                                 justifyContent: 'space-between',
                                                 alignItems: 'center'
                                             }}
                                         >
                                           <span style={{textTransform: 'lowercase'}} className="text-[#F1F5F9]">{unitTiba}</span>
                                             <ChevronDown size={13} color="hsl(var(--muted-foreground))" />
                                         </button>
                                         {unitOpen && (
                                            <>
                                                <div style={{position:'fixed',inset:0,zIndex:40}} onClick={() => setUnitOpen(false)} />
                                                <div style={{
                                                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
                                                    background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '10px',
                                                    overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                                                }}>
                                                    {['kg','ton','rit'].map((unit) => (
                                                        <button
                                                            key={unit} type="button"
                                                            onClick={() => {
                                                                const currentKg = toKg(beratTiba, unitTiba)
                                                                if (unit === 'ton') setBeratTiba(currentKg / 1000)
                                                                else if (unit === 'rit') setBeratTiba(currentKg / 5000)
                                                                else setBeratTiba(currentKg)
                                                                setUnitTiba(unit); setUnitOpen(false)
                                                            }}
                                                            className={cn(
                                                                "w-full px-4 py-3 text-left text-sm font-bold transition-colors border-b border-white/5 last:border-0",
                                                                unitTiba === unit ? "bg-emerald-500/10 text-emerald-500" : "text-[#4B6478] hover:bg-white/5"
                                                            )}
                                                        >
                                                            {unit}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                         )}
                                     </div>
                                 </div>
                             ) : (
                                 <div className={cn("h-[50px] flex items-center px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 font-black text-emerald-500 uppercase tracking-widest", isDesktop ? "text-[9px]" : "text-xs")}>
                                     Mode Timbangan Aktif
                                 </div>
                             )}
                         </div>
                    </div>

                    {/* Scale Mode UI - Moved outside the small grid for better layout */}
                    {inputMode === 'scale' && (
                        <div className="space-y-4 pt-2">
                            {/* List Timbangan */}
                            <div className="rounded-xl border border-white/5 bg-[#111C24] overflow-hidden">
                                <div className={cn("p-3 bg-white/[0.02] border-b border-white/5 grid grid-cols-[30px_1fr_60px] gap-2 items-center font-black uppercase tracking-widest text-[#4B6478]", isDesktop ? "text-[9px]" : "text-xs")}>
                                    <span>No</span>
                                    <span>Kita (kg)</span>
                                    <span className="text-right">Action</span>
                                </div>
                                
                                <div className="max-h-[300px] overflow-y-auto">
                                    {scaleEntries.length === 0 ? (
                                        <div className={cn("p-8 text-center text-[#4B6478] uppercase font-bold italic", isDesktop ? "text-[10px]" : "text-xs")}>
                                            Belum ada data timbangan
                                        </div>
                                    ) : (
                                        scaleEntries.map((e, index) => (
                                            <div key={e.id} className="p-3 border-b border-white/5 grid grid-cols-[30px_1fr_60px] gap-2 items-center transition-all group relative">
                                                <span className={cn("font-black text-[#4B6478]", isDesktop ? "text-[10px]" : "text-xs")}>{index + 1}</span>
                                                
                                                {editingScaleId === e.id ? (
                                                    <>
                                                        <InputNumber 
                                                            value={editScaleForm.weightKita}
                                                            onChange={(v) => setEditScaleForm({ ...editScaleForm, weightKita: v })}
                                                            className={cn("text-white h-7 bg-[#0C1319] border-emerald-500/50 text-emerald-400 font-black p-1", isDesktop ? "text-[10px]" : "text-xs")}
                                                            onKeyDown={(evt) => evt.key === 'Enter' && (evt.preventDefault(), handleSaveEdit())}
                                                        />
                                                        <div className="flex justify-end gap-1">
                                                            <button type="button" onClick={handleSaveEdit} className="p-1 rounded bg-emerald-500 text-white hover:bg-emerald-600">
                                                                <Check size={10} />
                                                            </button>
                                                            <button type="button" onClick={() => setEditingScaleId(null)} className="p-1 rounded bg-red-500 text-white hover:bg-red-600">
                                                                <X size={10} />
                                                            </button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="text-xs font-black text-emerald-400">{e.weightKita}</span>
                                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button type="button" onClick={() => handleStartEdit(e)} className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10">
                                                                <PencilLine size={12} />
                                                            </button>
                                                            <button type="button" onClick={() => removeItem(e.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10">
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* New Row Input */}
                                <div className="p-3 bg-emerald-500/5 grid grid-cols-[1fr_40px] gap-2 items-center border-t border-white/10">
                                    <InputNumber 
                                        value={newScaleEntry.weightKita}
                                        onChange={(v) => setNewScaleEntry({ ...newScaleEntry, weightKita: v })}
                                        placeholder="Kita"
                                        className="text-white h-8 bg-[#0C1319] border-white/5 text-xs text-emerald-400 font-black focus:border-emerald-500/50"
                                        onKeyDown={(evt) => evt.key === 'Enter' && (evt.preventDefault(), handleAddScale())}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={handleAddScale}
                                        className="h-8 w-8 flex items-center justify-center bg-emerald-500 rounded-lg text-white hover:bg-emerald-600 active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
                                    >
                                        <Plus size={14} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>

                            {/* Summary Card */}
                            {scaleEntries.length > 0 && (
                                <div className="p-5 rounded-2xl bg-[#111C24] border border-white/5 space-y-4 relative overflow-hidden group/card shadow-2xl">
                                    <div className="grid grid-cols-2 gap-4 relative z-10">
                                        <div>
                                            <p className={cn("font-black text-[#4B6478] uppercase mb-1", isDesktop ? "text-[9px]" : "text-xs")}>Total Timbangan Kita</p>
                                            <p className="text-xl font-black text-emerald-400 tabular-nums">
                                                {totalScaleKita.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                                                <span className={cn("ml-1 opacity-60", isDesktop ? "text-[10px]" : "text-xs")}>kg</span>
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className={cn("font-black text-[#4B6478] uppercase mb-1", isDesktop ? "text-[9px]" : "text-xs")}>Kurang Dari Kirim</p>
                                            {selisihKg === 0 ? (
                                                <p className="text-xl font-black text-emerald-400">Pas ✓</p>
                                            ) : (
                                                <p className={cn(
                                                    "text-xl font-black tabular-nums",
                                                    selisihKg > 0 ? "text-amber-500" : "text-red-400"
                                                )}>
                                                    {selisihKg > 0 ? `- ${selisihKg.toFixed(2)}` : `+ ${Math.abs(selisihKg).toFixed(2)}`}
                                                    <span className={cn("ml-1 opacity-60", isDesktop ? "text-[10px]" : "text-xs")}>kg</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-2 relative z-10">
                                        <Button 
                                            type="button"
                                            onClick={() => {
                                               setBeratTiba(totalScaleKita)
                                               setUnitTiba('kg')
                                               toast.success('Total timbangan berhasil dipakai sebagai berat tiba')
                                            }}
                                            className={cn("flex-1 h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/20 group/btn", isDesktop ? "text-[11px]" : "text-xs")}
                                        >
                                            <Check size={14} className="mr-2 group-hover/btn:scale-125 transition-transform" />
                                            PAKAI TOTAL INI
                                        </Button>
                                        <Button 
                                            type="button"
                                            variant="outline"
                                            onClick={handlePrintScale}
                                            className="w-12 h-12 border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl active:scale-90 transition-all"
                                        >
                                            <Printer size={16} />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ROW 4: Ringkasan 2x2 */}
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
                        <div className={cn("flex justify-between items-center font-black uppercase tracking-widest text-[#4B6478] px-1", isDesktop ? "text-[10px]" : "text-xs")}>
                            <span>Ringkasan Kedatangan</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-[#111C24] p-3 rounded-xl border border-white/5">
                                <p className={cn("font-black text-[#4B6478] uppercase mb-1", isDesktop ? "text-[9px]" : "text-xs")}>Susut Berat</p>
                                <p className={cn("text-sm font-black tabular-nums", susutKg > 0 ? "text-amber-400" : "text-emerald-400")}>
                                    {formatWeight(susutKg)} <span className={cn("opacity-60", isDesktop ? "text-[10px]" : "text-xs")}>({susutPct}%)</span>
                                </p>
                            </div>
                            <div className="bg-[#111C24] p-3 rounded-xl border border-white/5">
                                <p className={cn("font-black text-[#4B6478] uppercase mb-1", isDesktop ? "text-[9px]" : "text-xs")}>Mati di Jalan</p>
                                <p className={cn("text-sm font-black tabular-nums", matiEkor > 0 ? "text-red-400" : "text-emerald-400")}>
                                    {matiEkor} <span className={cn("opacity-60", isDesktop ? "text-[10px]" : "text-xs")}>ekor</span>
                                </p>
                            </div>
                            <div className="bg-[#111C24] p-3 rounded-xl border border-white/5">
                                <p className={cn("font-black text-[#4B6478] uppercase mb-1", isDesktop ? "text-[9px]" : "text-xs")}>Ekor Dikirim</p>
                                <p className="text-sm font-black text-white tabular-nums">
                                    {delivery.initial_count} <span className={cn("opacity-60", isDesktop ? "text-[10px]" : "text-xs")}>ekor</span>
                                </p>
                            </div>
                            <div className="bg-[#111C24] p-3 rounded-xl border border-white/5">
                                <p className={cn("font-black text-[#4B6478] uppercase mb-1", isDesktop ? "text-[9px]" : "text-xs")}>Berat Dikirim</p>
                                <p className="text-sm font-black text-white tabular-nums">
                                    {formatWeight(initialKg)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {matiEkor > 0 && (
                      <div className={cn("p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 font-black text-red-400 uppercase tracking-widest", isDesktop ? "text-[10px]" : "text-xs")}>
                         <AlertCircle size={14} className="shrink-0" />
                         <span>Loss report akan dibuat otomatis untuk {matiEkor} ekor</span>
                      </div>
                    )}

                    {/* ROW 5: Detail Pengiriman */}
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-4">
                        <Label className={cn("font-black uppercase tracking-widest text-[#4B6478] ml-1", isDesktop ? "text-[10px]" : "text-xs")}>Detail Pengiriman</Label>
                        
                        <div className="space-y-4">
                            {/* KENDARAAN */}
                            <div className="space-y-2">
                                <Label className={cn("font-black uppercase text-[#4B6478] tracking-widest ml-1 text-emerald-500", isDesktop ? "text-[9px]" : "text-xs")}>Kendaraan *</Label>
                                {delivery?.vehicle_plate && vehicleLocked ? (
                                    <div 
                                        className="w-full h-14 px-4 rounded-xl bg-[#111C24] border border-white/5 flex justify-between items-center opacity-75 group transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Lock size={12} className="text-[#4B6478]" />
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black uppercase text-white">{delivery.vehicle_plate}</span>
                                                <span className={cn("font-bold uppercase text-[#4B6478]", isDesktop ? "text-[10px]" : "text-xs")}>{delivery.vehicle_type || 'ARMADA'}</span>
                                            </div>
                                        </div>
                                        <Button 
                                            type="button"
                                            variant="ghost" 
                                            size="icon"
                                            className="h-8 w-8 rounded-lg hover:bg-white/5 text-[#4B6478] hover:text-amber-500"
                                            onClick={() => setShowVehicleConfirm(true)}
                                            title="Ganti kendaraan"
                                        >
                                            <Unlock size={14} />
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex gap-1.5 mb-1 bg-[#111C24] p-0.5 rounded-xl border border-white/5">
                                            <button 
                                                type="button" 
                                                onClick={() => { setVehicleManual(false); setSelectedVehicle(null) }}
                                                className={cn(
                                                    "flex-1 py-2 rounded-lg font-black uppercase tracking-widest transition-all",
                                                    isDesktop ? "text-[9px]" : "text-xs",
                                                    !vehicleManual ? "bg-emerald-500 text-white shadow-lg" : "text-[#4B6478] hover:text-white"
                                                )}
                                            >Armada</button>
                                            <button 
                                                type="button" 
                                                onClick={() => { setVehicleManual(true); setSelectedVehicle(null) }}
                                                className={cn(
                                                    "flex-1 py-2 rounded-lg font-black uppercase tracking-widest transition-all",
                                                    isDesktop ? "text-[9px]" : "text-xs",
                                                    vehicleManual ? "bg-emerald-500 text-white shadow-lg" : "text-[#4B6478] hover:text-white"
                                                )}
                                            >Manual</button>
                                        </div>

                                        {!vehicleManual ? (
                                            <Popover open={vehicleOpen} onOpenChange={setVehicleOpen}>
                                                <PopoverTrigger asChild>
                                                    <button type="button" className="w-full h-12 px-4 rounded-xl bg-[#111C24] border border-white/5 flex justify-between items-center text-xs font-black text-white hover:border-white/20 transition-all uppercase">
                                                        <span>{selectedVehicle ? `${selectedVehicle.vehicle_plate} · ${selectedVehicle.vehicle_type}` : 'PILIH KENDARAAN'}</span>
                                                        <ChevronsUpDown size={14} className="opacity-50" />
                                                    </button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-[#0C1319] border-white/10" align="start">
                                                    <Command className="bg-transparent">
                                                        <CommandInput placeholder="Cari plat..." className="h-10 border-none font-bold text-xs" />
                                                        <CommandEmpty className="py-6 text-center text-[10px] uppercase font-black text-[#4B6478]">Kendaraan tidak ditemukan</CommandEmpty>
                                                        <CommandGroup className="max-h-64 overflow-y-auto">
                                                            {vehicles.map(v => (
                                                                <CommandItem 
                                                                    key={v.id} 
                                                                    onSelect={() => { setSelectedVehicle(v); setVehicleOpen(false) }}
                                                                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5 rounded-lg border-b border-white/5"
                                                                >
                                                                    <div className="flex flex-col">
                                                                        <span className="text-xs font-black uppercase text-white">{v.vehicle_plate}</span>
                                                                        <span className="text-[10px] font-bold uppercase text-[#4B6478]">{v.vehicle_type}</span>
                                                                    </div>
                                                                    {selectedVehicle?.id === v.id && <Check size={14} className="text-emerald-500" />}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-2">
                                                <Input 
                                                    placeholder="PLAT NOMOR" 
                                                    value={vehiclePlate}
                                                    onChange={e => setVehiclePlate(e.target.value.toUpperCase())}
                                                    className="h-12 bg-[#111C24] border-white/10 text-xs font-black text-white uppercase"
                                                />
                                                <Input 
                                                    placeholder="JENIS" 
                                                    value={vehicleType}
                                                    onChange={e => setVehicleType(e.target.value)}
                                                    className="h-12 bg-[#111C24] border-white/10 text-xs font-black text-white"
                                                />
                                            </div>
                                        )}
                                        
                                        {delivery?.vehicle_plate && !vehicleLocked && (
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    setVehicleLocked(true)
                                                    if (delivery.vehicle_id) {
                                                        const matched = vehicles.find(v => v.id === delivery.vehicle_id)
                                                        setSelectedVehicle(matched || null)
                                                        setVehicleManual(false)
                                                    } else {
                                                        setVehiclePlate(delivery.vehicle_plate)
                                                        setVehicleType(delivery.vehicle_type)
                                                        setVehicleManual(true)
                                                    }
                                                }}
                                                className={cn("font-black uppercase text-amber-500 hover:text-amber-400 mt-1 flex items-center gap-1.5 transition-colors", isDesktop ? "text-[9px]" : "text-xs")}
                                            >
                                                <Lock size={10} />
                                                Batal Ganti
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* SOPIR */}
                            <div className="space-y-2">
                                <Label className={cn("font-black uppercase text-[#4B6478] tracking-widest ml-1 text-emerald-500", isDesktop ? "text-[9px]" : "text-xs")}>Sopir *</Label>
                                {delivery?.driver_name && driverLocked ? (
                                    <div 
                                        className="w-full h-14 px-4 rounded-xl bg-[#111C24] border border-white/5 flex justify-between items-center opacity-75 group transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Lock size={12} className="text-[#4B6478]" />
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black uppercase text-white">{delivery.driver_name}</span>
                                                <span className={cn("font-bold uppercase text-[#4B6478]", isDesktop ? "text-[10px]" : "text-xs")}>{delivery.driver_phone || 'TANPA HP'}</span>
                                            </div>
                                        </div>
                                        <Button 
                                            type="button"
                                            variant="ghost" 
                                            size="icon"
                                            className="h-8 w-8 rounded-lg hover:bg-white/5 text-[#4B6478] hover:text-amber-500"
                                            onClick={() => setShowDriverConfirm(true)}
                                            title="Ganti sopir"
                                        >
                                            <Unlock size={14} />
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex gap-1.5 mb-1 bg-[#111C24] p-0.5 rounded-xl border border-white/5">
                                            <button 
                                                type="button" 
                                                onClick={() => { setDriverManual(false); setSelectedDriver(null) }}
                                                className={cn(
                                                    "flex-1 py-2 rounded-lg font-black uppercase tracking-widest transition-all",
                                                    isDesktop ? "text-[9px]" : "text-xs",
                                                    !driverManual ? "bg-emerald-500 text-white shadow-lg" : "text-[#4B6478] hover:text-white"
                                                )}
                                            >Terdaftar</button>
                                            <button 
                                                type="button" 
                                                onClick={() => { setDriverManual(true); setSelectedDriver(null) }}
                                                className={cn(
                                                    "flex-1 py-2 rounded-lg font-black uppercase tracking-widest transition-all",
                                                    isDesktop ? "text-[9px]" : "text-xs",
                                                    driverManual ? "bg-emerald-500 text-white shadow-lg" : "text-[#4B6478] hover:text-white"
                                                )}
                                            >Manual</button>
                                        </div>

                                        {!driverManual ? (
                                            <Popover open={driverOpen} onOpenChange={setDriverOpen}>
                                                <PopoverTrigger asChild>
                                                    <button type="button" className="w-full h-12 px-4 rounded-xl bg-[#111C24] border border-white/5 flex justify-between items-center text-xs font-black text-white hover:border-white/20 transition-all uppercase">
                                                        <span>{selectedDriver ? `${selectedDriver.full_name} · ${selectedDriver.phone || '-'}` : 'PILIH SOPIR'}</span>
                                                        <ChevronsUpDown size={14} className="opacity-50" />
                                                    </button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-[#0C1319] border-white/10" align="start">
                                                    <Command className="bg-transparent">
                                                        <CommandInput placeholder="Cari nama..." className="h-10 border-none font-bold text-xs" />
                                                        <CommandEmpty className={cn("py-6 text-center uppercase font-black text-[#4B6478]", isDesktop ? "text-[10px]" : "text-xs")}>Sopir tidak ditemukan</CommandEmpty>
                                                        <CommandGroup className="max-h-64 overflow-y-auto">
                                                            {drivers.map(d => (
                                                                <CommandItem 
                                                                    key={d.id} 
                                                                    onSelect={() => { setSelectedDriver(d); setDriverOpen(false) }}
                                                                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5 rounded-lg border-b border-white/5"
                                                                >
                                                                    <div className="flex flex-col">
                                                                        <span className="text-xs font-black uppercase text-white">{d.full_name}</span>
                                                                        <span className={cn("font-bold uppercase text-[#4B6478]", isDesktop ? "text-[10px]" : "text-xs")}>{d.phone || 'TANPA HP'}</span>
                                                                    </div>
                                                                    {selectedDriver?.id === d.id && <Check size={14} className="text-emerald-500" />}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-2">
                                                <Input 
                                                    placeholder="NAMA SOPIR" 
                                                    value={driverName}
                                                    onChange={e => setDriverName(e.target.value)}
                                                    className="h-12 bg-[#111C24] border-white/10 text-xs font-black text-white"
                                                />
                                                <Input 
                                                    placeholder="NO HP" 
                                                    value={driverPhone}
                                                    onChange={e => setDriverPhone(e.target.value)}
                                                    className="h-12 bg-[#111C24] border-white/10 text-xs font-black text-white"
                                                />
                                            </div>
                                        )}

                                        {delivery?.driver_name && !driverLocked && (
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    setDriverLocked(true)
                                                    if (delivery.driver_id) {
                                                        const matched = drivers.find(d => d.id === delivery.driver_id)
                                                        setSelectedDriver(matched || null)
                                                        setDriverManual(false)
                                                    } else {
                                                        setDriverName(delivery.driver_name)
                                                        setDriverPhone(delivery.driver_phone)
                                                        setDriverManual(true)
                                                    }
                                                }}
                                                className={cn("font-black uppercase text-amber-500 hover:text-amber-400 mt-1 flex items-center gap-1.5 transition-colors", isDesktop ? "text-[9px]" : "text-xs")}
                                            >
                                                <Lock size={10} />
                                                Batal Ganti
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* AlertDialogs */}
                            <AlertDialog open={showVehicleConfirm} onOpenChange={setShowVehicleConfirm}>
                                <AlertDialogContent className="bg-[#0C1319] border-white/10 max-w-[400px]">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-white font-display text-xl font-black uppercase">Ganti Kendaraan?</AlertDialogTitle>
                                        <AlertDialogDescription className="text-[#4B6478] font-bold text-xs leading-relaxed mt-2">
                                            Kendaraan ini sudah diisi saat transaksi dibuat. <span className="text-amber-500">Ganti hanya jika ada perubahan di lapangan (rusak, dll).</span>
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="mt-6 gap-3">
                                        <AlertDialogCancel className={cn("h-12 rounded-xl bg-[#111C24] border-white/5 text-[#4B6478] font-black uppercase hover:bg-white/5 hover:text-white transition-all", isDesktop ? "text-[10px]" : "text-xs")}>Batal</AlertDialogCancel>
                                        <AlertDialogAction 
                                            onClick={() => { setVehicleLocked(false); setShowVehicleConfirm(false) }}
                                            className={cn("h-12 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-white font-black uppercase shadow-lg shadow-amber-500/20 transition-all", isDesktop ? "text-[10px]" : "text-xs")}
                                        >Ya, Ganti</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            <AlertDialog open={showDriverConfirm} onOpenChange={setShowDriverConfirm}>
                                <AlertDialogContent className="bg-[#0C1319] border-white/10 max-w-[400px]">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-white font-display text-xl font-black uppercase">Ganti Sopir?</AlertDialogTitle>
                                        <AlertDialogDescription className="text-[#4B6478] font-bold text-xs leading-relaxed mt-2">
                                            Sopir ini sudah diisi saat transaksi dibuat. <span className="text-amber-500">Ganti hanya jika ada perubahan di lapangan.</span>
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="mt-6 gap-3">
                                        <AlertDialogCancel className={cn("h-12 rounded-xl bg-[#111C24] border-white/5 text-[#4B6478] font-black uppercase hover:bg-white/5 hover:text-white transition-all", isDesktop ? "text-[10px]" : "text-xs")}>Batal</AlertDialogCancel>
                                        <AlertDialogAction 
                                            onClick={() => { setDriverLocked(false); setShowDriverConfirm(false) }}
                                            className={cn("h-12 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-white font-black uppercase shadow-lg shadow-amber-500/20 transition-all", isDesktop ? "text-[10px]" : "text-xs")}
                                        >Ya, Ganti</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>

                    {/* ROW 6: Catatan */}
                    <div className="space-y-2">
                        <Label className={cn("font-black uppercase tracking-widest text-[#4B6478] ml-1", isDesktop ? "text-[10px]" : "text-xs")}>Catatan</Label>
                        <Textarea 
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="CATATAN KEDATANGAN..." 
                            className="rounded-2xl bg-[#111C24] border-white/10 font-black text-xs p-4 min-h-[100px] text-white" 
                        />
                    </div>

                    {/* ROW 7: Submit */}
                    <Button 
                        type="button"
                        onClick={handleUpdate}
                        disabled={isLoading}
                        className="w-full h-16 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-[24px] shadow-xl shadow-emerald-500/20 active:scale-95 transition-all mt-4"
                    >
                        {isLoading ? 'MENYIMPAN...' : 'SIMPAN KEDATANGAN'}
                    </Button>
                </form>
            </SheetContent>
        </Sheet>
    )
}

