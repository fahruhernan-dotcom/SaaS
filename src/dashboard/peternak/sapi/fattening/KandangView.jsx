import KandangViewLayout from '@/dashboard/peternak/_shared/components/kandang/KandangViewLayout'
import {
  useSapiActiveBatches,
  useSapiAnimalsByBatches,
  useSapiKandangs,
  useCreateSapiKandang,
  useUpdateSapiKandang,
  useUpdateSapiKandangPosition,
  useMoveSapiAnimalToKandang,
  useEnsureSapiHoldingPen,
  calcSapiADGFromRecords,
  calcSapiHariDiFarm,
} from '@/lib/hooks/useSapiPenggemukanData'

const SAPI_SPECIES_CONFIG = {
  emoji:           '🐄',
  targetHari:      150,
  adgThresholds:   { good: 0.8, ok: 0.5 },
  weightScaling:   (w) => Math.pow(w, 1 / 3) * 0.195,
  weightRecordsKey: 'sapi_penggemukan_weight_records',
  calcADG:         calcSapiADGFromRecords,
  calcHari:        calcSapiHariDiFarm,
}

const SAPI_HOOKS = {
  useActiveBatches:        useSapiActiveBatches,
  useAnimalsByBatches:     useSapiAnimalsByBatches,
  useKandangs:             useSapiKandangs,
  useCreateKandang:        useCreateSapiKandang,
  useUpdateKandang:        useUpdateSapiKandang,
  useUpdateKandangPosition: useUpdateSapiKandangPosition,
  // useDeleteKandang intentionally omitted — sapi does not support kandang deletion
  useMoveToKandang:        useMoveSapiAnimalToKandang,
  useEnsureHoldingPen:     useEnsureSapiHoldingPen,
}

export default function SapiKandangView() {
  return (
    <KandangViewLayout
      speciesConfig={SAPI_SPECIES_CONFIG}
      hooks={SAPI_HOOKS}
      pageTitle="Kandang Sapi"
    />
  )
}
