import React from 'react'
import { motion } from 'framer-motion'
import { Check, Undo2 } from 'lucide-react'
import { format } from 'date-fns'

export default function AISuccessCard({ entry, onUndo, onClose, undoCountdown }) {
  if (!entry) return null
  
  const { extracted_data: data, intent } = entry
  
  const isPenjualan = intent === 'CATAT_PENJUALAN'
  const isPembelian = intent === 'CATAT_PEMBELIAN'
  const isPengiriman = intent === 'CATAT_PENGIRIMAN'
  
  const source = data?.supplier_name || data?.farm_name || 'Kandang'
  const dest = data?.rpa_name || data?.customer_name || 'RPA / Pembeli'
  const weight = data?.weight_kg ? (data.weight_kg / 1000).toFixed(2) : 0
  const qty = data?.qty_ekor || 0
  
  const formattedDate = data?.sale_date || data?.purchase_date || data?.departed_at || data?.record_date || new Date()
  let displayDate = 'Hari ini'
  try {
    displayDate = format(new Date(formattedDate), 'dd MMM yyyy')
  } catch(e) {}
  
  const revenue = isPenjualan ? (data.weight_kg || 0) * (data.price_per_kg || 0) : 0
  
  // Approximate profit for the sake of the estimation UI if we don't have true modal data
  const estimatedCost = isPenjualan ? revenue * 0.865 : 0 
  const marginEst = isPenjualan ? (revenue - estimatedCost) : 0 
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      className="bg-[#111C24] mx-4 rounded-3xl p-6 border border-emerald-500/20 shadow-[0_10px_40px_rgba(16,185,129,0.1)] relative"
    >
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 rounded-full border-2 border-emerald-500 flex items-center justify-center bg-emerald-500/10">
          <Check size={32} className="text-emerald-500" />
        </div>
      </div>
      
      <h3 className="text-center text-white font-bold text-xl tracking-tight">Pesanan Dicatat!</h3>
      <p className="text-center justify-center text-[#4B6478] text-xs font-semibold mb-6">{displayDate}</p>

      <div className="border border-white/5 bg-white/[0.02] rounded-2xl p-4 space-y-3 mb-4">
        {(isPembelian || isPenjualan) && (
          <>
            <div className="flex justify-between text-[13px]">
              <span className="text-[#4B6478] font-medium">Dari</span>
              <span className="text-white font-bold">{source}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-[#4B6478] font-medium">Ke</span>
              <span className="text-white font-bold">{dest}</span>
            </div>
          </>
        )}
        {isPengiriman && (
          <>
            <div className="flex justify-between text-[13px]">
              <span className="text-[#4B6478] font-medium">Kendaraan</span>
              <span className="text-white font-bold">{data.vehicle_plate || '-'}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-[#4B6478] font-medium">Sopir</span>
              <span className="text-white font-bold">{data.driver_name || '-'}</span>
            </div>
          </>
        )}
        <div className="flex justify-between text-[13px] pt-2 border-t border-white/5 mt-2">
          <span className="text-[#4B6478] font-medium">Berat</span>
          <span className="text-white font-bold tracking-tight">
            {weight} ton <span className="text-[#4B6478] font-medium text-xs ml-1">· {qty.toLocaleString('id-ID')} ekor</span>
          </span>
        </div>
      </div>

      {isPenjualan && revenue > 0 && (
        <div className="bg-[#0C1A14] border border-emerald-500/20 rounded-2xl p-4 mb-5 text-center">
          <p className="text-emerald-500/60 text-[10px] uppercase tracking-widest font-black mb-1">Estimasi Keuntungan</p>
          <p className="text-emerald-400 text-2xl font-black mb-1 tracking-tighter">
            +Rp {marginEst.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[#4B6478] text-[10px] font-medium">
             Modal Rp {estimatedCost.toLocaleString('id-ID', { maximumFractionDigits: 0 })} · Jual Rp {revenue.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
          </p>
        </div>
      )}

      <div className="flex gap-2">
        {undoCountdown > 0 && onUndo && (
          <button onClick={onUndo} className="h-11 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold text-[12px] flex items-center justify-center gap-2 transition-colors border border-amber-500/20">
            <Undo2 size={16} /> Batal ({Math.ceil(undoCountdown / 1000)}s)
          </button>
        )}
        <button onClick={onClose} className="flex-1 h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-[12px] flex justify-center items-center transition-colors">
          Tutup
        </button>
      </div>
    </motion.div>
  )
}
