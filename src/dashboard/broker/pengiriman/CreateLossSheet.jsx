import React, { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Plus, Receipt } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { toast } from 'sonner'

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function CreateLossSheet({ isOpen, onClose, initialData }) {
    const { tenant } = useAuth()
    const queryClient = useQueryClient()
    const [isLoading, setIsLoading] = useState(false)
    const [weightLoss, setWeightLoss] = useState(0)
    const [pricePerKg, setPricePerKg] = useState(0)

    const handleCreate = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        const formData = new FormData(e.currentTarget)
        
        const payload = {
            tenant_id: tenant.id,
            loss_type: formData.get('loss_type'),
            chicken_count: parseInt(formData.get('chicken_count')) || 0,
            weight_loss_kg: parseFloat(formData.get('weight_loss_kg')) || 0,
            financial_loss: parseInt(formData.get('financial_loss')) || 0,
            report_date: formData.get('report_date'),
            description: formData.get('description'),
            resolved: false
        }

        const { error } = await supabase.from('loss_reports').insert(payload)
        
        if (error) {
            toast.error('Gagal mencatat kerugian')
        } else {
            toast.success('Kerugian berhasil dicatat!')
            queryClient.invalidateQueries(['loss-reports'])
            queryClient.invalidateQueries(['broker-stats'])
            onClose()
        }
        setIsLoading(false)
    }

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="bottom" className="h-[80vh] bg-[#0C1319] border-white/10 rounded-t-[40px] px-6 text-left">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-white font-display text-2xl font-black uppercase tracking-tight">Catat Kerugian Lapangan</SheetTitle>
                    <SheetDescription className="text-[#4B6478] font-bold uppercase text-[10px] tracking-widest mt-1">Gunakan ini untuk kerugian di luar pengiriman otomatis</SheetDescription>
                </SheetHeader>

                <form onSubmit={handleCreate} className="space-y-6 pb-20">
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Jenis Kerugian *</Label>
                                <Select name="loss_type" defaultValue="mortality_kandang">
                                    <SelectTrigger className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs uppercase text-white shadow-inner">
                                        <SelectValue placeholder="PILIH JENIS" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#111C24] border-white/10">
                                        <SelectItem value="mortality_kandang" className="text-xs font-black uppercase">Mortalitas Kandang</SelectItem>
                                        <SelectItem value="underweight" className="text-xs font-black uppercase">Berat Tidak Capai Target</SelectItem>
                                        <SelectItem value="buyer_complaint" className="text-xs font-black uppercase">Komplain Buyer / Reject</SelectItem>
                                        <SelectItem value="other" className="text-xs font-black uppercase">Lain-lain</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Tanggal *</Label>
                                <Input required name="report_date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Jumlah (Ekor)</Label>
                                <Input name="chicken_count" type="number" placeholder="0" className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Berat Total (kg)</Label>
                                <Input name="weight_loss_kg" type="number" step="0.1" placeholder="0.0" className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Estimasi Nominal Kerugian (Rp) *</Label>
                            <Input required name="financial_loss" type="number" placeholder="0" className="h-16 rounded-2xl bg-[#111C24] border-white/5 font-black text-lg text-red-400" />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Keterangan / Alasan</Label>
                            <Textarea name="description" placeholder="JELASKAN PENYEBAB KERUGIAN..." className="rounded-2xl bg-[#111C24] border-white/5 font-black text-xs uppercase p-4 min-h-[100px]" />
                        </div>
                    </div>

                    <SheetFooter>
                        <Button 
                            disabled={isLoading}
                            className="w-full h-16 bg-red-500 hover:bg-red-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-[24px] shadow-xl shadow-red-500/20 active:scale-95 transition-all mt-4"
                        >
                            {isLoading ? 'MENYIMPAN...' : 'SIMPAN LAPORAN KERUGIAN'}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    )
}
