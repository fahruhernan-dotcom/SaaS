import KandangViewLayout from '../../_shared/components/kandang/KandangViewLayout'
import {
  useDombaActiveBatches,
  useDombaAnimalsByBatches,
  useDombaKandangs,
  useCreateDombaKandang,
  useUpdateDombaKandang,
  useUpdateDombaKandangPosition,
  useDeleteDombaKandang,
  useMoveDombaToKandang,
  useEnsureDombaHoldingPen,
  calcADGFromRecords,
  calcHariDiFarm,
} from '@/lib/hooks/useDombaPenggemukanData'

const DOMBA_SPECIES_CONFIG = {
  emoji:           '🐑',
  targetHari:      120,
  adgThresholds:   { good: 0.25, ok: 0.15 },
  weightScaling:   (w) => 0.06 * Math.pow(w, 0.77),
  weightRecordsKey: 'domba_penggemukan_weight_records',
  calcADG:         calcADGFromRecords,
  calcHari:        calcHariDiFarm,
}

const DOMBA_HOOKS = {
  useActiveBatches:        useDombaActiveBatches,
  useAnimalsByBatches:     useDombaAnimalsByBatches,
  useKandangs:             useDombaKandangs,
  useCreateKandang:        useCreateDombaKandang,
  useUpdateKandang:        useUpdateDombaKandang,
  useUpdateKandangPosition: useUpdateDombaKandangPosition,
  useDeleteKandang:        useDeleteDombaKandang,
  useMoveToKandang:        useMoveDombaToKandang,
  useEnsureHoldingPen:     useEnsureDombaHoldingPen,
}

export default function DombaKandangView() {
  return (
    <KandangViewLayout
      speciesConfig={DOMBA_SPECIES_CONFIG}
      hooks={DOMBA_HOOKS}
      pageTitle="Kandang Domba"
    />
  )
}
