import KandangViewLayout from '@/dashboard/peternak/_shared/components/kandang/KandangViewLayout'
import {
  useKambingActiveBatches,
  useKambingAnimalsByBatches,
  useKambingKandangs,
  useCreateKambingKandang,
  useUpdateKambingKandang,
  useUpdateKambingKandangPosition,
  useDeleteKambingKandang,
  useMoveKambingToKandang,
  useEnsureKambingHoldingPen,
  calcADGFromRecords,
  calcHariDiFarm,
} from '@/lib/hooks/useKambingPenggemukanData'

const KAMBING_SPECIES_CONFIG = {
  emoji:            '🐐',
  targetHari:       120,
  adgThresholds:    { good: 0.2, ok: 0.12 },
  weightScaling:    (w) => 0.06 * Math.pow(w, 0.77),
  weightRecordsKey: 'kambing_penggemukan_weight_records',
  calcADG:          calcADGFromRecords,
  calcHari:         calcHariDiFarm,
}

const KAMBING_HOOKS = {
  useActiveBatches:         useKambingActiveBatches,
  useAnimalsByBatches:      useKambingAnimalsByBatches,
  useKandangs:              useKambingKandangs,
  useCreateKandang:         useCreateKambingKandang,
  useUpdateKandang:         useUpdateKambingKandang,
  useUpdateKandangPosition: useUpdateKambingKandangPosition,
  useDeleteKandang:         useDeleteKambingKandang,
  useMoveToKandang:         useMoveKambingToKandang,
  useEnsureHoldingPen:      useEnsureKambingHoldingPen,
}

export default function KambingKandangView() {
  return (
    <KandangViewLayout
      speciesConfig={KAMBING_SPECIES_CONFIG}
      hooks={KAMBING_HOOKS}
      pageTitle="Kandang Kambing"
    />
  )
}
