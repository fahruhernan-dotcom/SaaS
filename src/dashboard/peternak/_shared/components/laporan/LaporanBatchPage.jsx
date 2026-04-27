import React, { useMemo, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import LoadingSpinner from '../../../../_shared/components/LoadingSpinner'
import TabPerforma  from './TabPerforma'
import TabKeuangan  from './TabKeuangan'
import TabPakan     from './TabPakan'
import TabKesehatan from './TabKesehatan'
import TabAudit     from './TabAudit'

const TABS = [
  { key: 'performa',  label: 'Performa'  },
  { key: 'keuangan',  label: 'Keuangan'  },
  { key: 'pakan',     label: 'Pakan & FCR' },
  { key: 'kesehatan', label: 'Kesehatan' },
  { key: 'audit',     label: 'Audit Ops' },
]

/**
 * Shared Laporan page for all fattening livestock types.
 *
 * Props:
 *   livestockLabel      — "DOMBA" | "KAMBING" | "SAPI"
 *   livestockType       — "domba_penggemukan" | "kambing_penggemukan"
 *   BASE                — route prefix, e.g. "/peternak/peternak_domba_penggemukan"
 *   adgBenchmark        — e.g. "≥150 g/hari"
 *   mortalitasBenchmark — e.g. "≤3%" (optional, default "≤3%")
 *   hooks               — {
 *                           useBatches,
 *                           useAnimalsByBatches,
 *                           useSalesByBatches,
 *                           useFeedLogsByBatches,
 *                           useHealthLogsByBatches,
 *                           useOperationalCostsByBatches,
 *                           useBatchWeightHistoryByBatches,
 *                           calcHariDiFarm,
 *                         }
 */
export default function LaporanBatchPage({
  livestockLabel,
  livestockType,
  BASE,
  adgBenchmark,
  mortalitasBenchmark = '≤3%',
  hooks,
}) {
  const navigate = useNavigate()
  const [tab, setTab] = useState('performa')

  const {
    useBatches,
    useAnimalsByBatches,
    useSalesByBatches,
    useFeedLogsByBatches,
    useHealthLogsByBatches,
    useOperationalCostsByBatches,
    useBatchWeightHistoryByBatches,
    calcHariDiFarm,
  } = hooks

  const { data: batches = [], isLoading: loadingBatches } = useBatches()
  const batchIds = useMemo(() => batches.map(b => b.id), [batches])

  const { data: animals       = [] } = useAnimalsByBatches(batchIds)
  const { data: sales         = [] } = useSalesByBatches(batchIds)
  const { data: feedLogs      = [] } = useFeedLogsByBatches(batchIds)
  const { data: healthLogs    = [] } = useHealthLogsByBatches(batchIds)
  const { data: opCosts       = [] } = useOperationalCostsByBatches(batchIds)
  const { data: weightHistory = [] } = useBatchWeightHistoryByBatches(batchIds)

  if (loadingBatches) return <LoadingSpinner fullPage />

  const activeBatchesCount = batches.filter(b => b.status === 'active').length

  return (
    <div className="text-slate-100 pb-24">
      <header className="px-5 pt-8 pb-5 bg-gradient-to-b from-[#0C1319] to-[#06090F] border-b border-white/[0.05]">
        <div className="flex items-center gap-4 mb-5">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#4B6478] hover:text-white transition-all shadow-inner"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-['Sora'] font-black text-2xl text-white tracking-tight leading-none mb-1">
              Analisa & Laporan
            </h1>
            <p className="text-[11px] text-[#4B6478] font-black uppercase tracking-widest">
              {activeBatchesCount} BATCH AKTIF · {livestockLabel}
            </p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar p-1 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex-shrink-0 flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap px-2',
                tab === t.key
                  ? 'bg-green-600 text-white shadow-lg shadow-green-600/20'
                  : 'text-[#4B6478] hover:text-white hover:bg-white/5',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-5 mt-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {tab === 'performa'  && (
              <TabPerforma
                batches={batches}
                animals={animals}
                sales={sales}
                weightHistory={weightHistory}
                healthLogs={healthLogs}
                navigate={navigate}
                BASE={BASE}
                adgBenchmark={adgBenchmark}
                calcHariDiFarm={calcHariDiFarm}
              />
            )}
            {tab === 'keuangan'  && (
              <TabKeuangan
                batches={batches}
                animals={animals}
                sales={sales}
                feedLogs={feedLogs}
                opCosts={opCosts}
              />
            )}
            {tab === 'pakan'     && (
              <TabPakan
                batches={batches}
                animals={animals}
                feedLogs={feedLogs}
                weightHistory={weightHistory}
              />
            )}
            {tab === 'kesehatan' && (
              <TabKesehatan
                batches={batches}
                healthLogs={healthLogs}
                mortalitasBenchmark={mortalitasBenchmark}
              />
            )}
            {tab === 'audit'     && (
              <TabAudit livestockType={livestockType} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
