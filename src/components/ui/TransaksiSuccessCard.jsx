import { motion, AnimatePresence } from 'framer-motion'
import { formatDate } from '@/lib/format'

// ─── Animated check circle ────────────────────────────────────────────────────

function CheckCircleAnimated() {
  return (
    <div className="w-20 h-20 mx-auto mb-5">
      <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Background fill */}
        <motion.circle
          cx="40" cy="40" r="36"
          fill="rgba(16,185,129,0.1)"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
        {/* Stroke circle */}
        <motion.circle
          cx="40" cy="40" r="36"
          stroke="#10B981"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          pathLength="1"
          initial={{ pathLength: 0, rotate: -90 }}
          animate={{ pathLength: 1, rotate: -90 }}
          style={{ originX: '50%', originY: '50%', rotate: -90 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        {/* Checkmark */}
        <motion.path
          d="M24 40 L35 51 L57 28"
          stroke="#10B981"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.3, ease: 'easeOut' }}
        />
      </svg>
    </div>
  )
}

// ─── Format helpers ───────────────────────────────────────────────────────────

function formatRp(num) {
  if (!num && num !== 0) return '—'
  return 'Rp ' + Number(num).toLocaleString('id-ID')
}

function formatKg(num) {
  if (!num && num !== 0) return '—'
  const n = Number(num)
  return n >= 1000 ? `${(n / 1000).toFixed(2)} ton` : `${n.toFixed(1)} kg`
}

// ─── TransaksiSuccessCard ─────────────────────────────────────────────────────

/**
 * Props:
 *   isOpen   — boolean
 *   onClose  — () => void
 *   onDetail — () => void (optional)
 *   data     — {
 *     type: 'beli'|'jual'|'lengkap',
 *     farmName, rpaName,
 *     quantity, totalWeight,
 *     buyPrice, sellPrice,
 *     netProfit, transactionDate
 *   }
 */
export default function TransaksiSuccessCard({ isOpen, onClose, onDetail, data }) {
  if (!data) return null

  const {
    farmName, rpaName, quantity, totalWeight,
    buyPrice, sellPrice, netProfit, transactionDate,
  } = data

  const profitColor = netProfit > 0 ? '#10B981' : netProfit < 0 ? '#F87171' : '#94A3B8'

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Card */}
          <motion.div
            key="card"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <motion.div
              className="bg-[#0C1319] rounded-3xl p-8 max-w-sm w-full pointer-events-auto"
              style={{
                border: '1px solid rgba(16,185,129,0.2)',
                boxShadow: '0 0 60px rgba(16,185,129,0.15)',
              }}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              {/* Check animation */}
              <CheckCircleAnimated />

              {/* Title */}
              <div className="text-center mb-6">
                <h3 className="font-display text-xl font-black text-white mb-1">
                  Transaksi Berhasil!
                </h3>
                {transactionDate && (
                  <p className="text-[#4B6478] text-sm">
                    {formatDate(transactionDate)}
                  </p>
                )}
              </div>

              {/* Info row */}
              <div className="bg-white/[0.03] rounded-2xl p-4 space-y-2.5 mb-4 border border-white/5">
                {farmName && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#4B6478]">Dari</span>
                    <span className="text-[#F1F5F9] font-semibold truncate ml-4 max-w-[60%] text-right">{farmName}</span>
                  </div>
                )}
                {rpaName && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#4B6478]">Ke</span>
                    <span className="text-[#F1F5F9] font-semibold truncate ml-4 max-w-[60%] text-right">{rpaName}</span>
                  </div>
                )}
                {totalWeight > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#4B6478]">Berat</span>
                    <span className="text-[#F1F5F9] font-semibold">
                      {formatKg(totalWeight)}
                      {quantity > 0 && <span className="text-[#4B6478] font-normal"> · {quantity} ekor</span>}
                    </span>
                  </div>
                )}
              </div>

              {/* Profit highlight */}
              {netProfit !== undefined && netProfit !== null && (
                <div
                  className="rounded-2xl p-4 mb-6 text-center"
                  style={{
                    background: netProfit >= 0 ? 'rgba(16,185,129,0.06)' : 'rgba(248,113,113,0.06)',
                    border: `1px solid ${netProfit >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(248,113,113,0.15)'}`,
                  }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#4B6478] mb-1">
                    ESTIMASI KEUNTUNGAN
                  </p>
                  <p
                    className="font-display text-2xl font-black"
                    style={{ color: profitColor }}
                  >
                    {netProfit >= 0 ? '+' : ''}{formatRp(netProfit)}
                  </p>
                  {buyPrice > 0 && sellPrice > 0 && (
                    <p className="text-[11px] text-[#4B6478] mt-1">
                      Modal {formatRp(buyPrice)} · Jual {formatRp(sellPrice)}
                    </p>
                  )}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                {onDetail && (
                  <button
                    onClick={() => { onDetail(); onClose() }}
                    className="flex-1 py-3 rounded-2xl border border-[#10B981]/30 text-[#10B981] text-sm font-bold hover:bg-emerald-500/5 transition-colors"
                  >
                    Lihat Detail
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-2xl bg-[#10B981] hover:bg-[#34D399] text-white text-sm font-bold transition-colors"
                  style={{ boxShadow: '0 4px 16px rgba(16,185,129,0.25)' }}
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
