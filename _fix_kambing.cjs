const fs = require('fs')
const path = require('path')

const dir = path.join(__dirname, 'src/dashboard/peternak/kambing')

const replacements = [
  // Hook file imports
  ['useDombaPenggemukanData', 'useKambingPenggemukanData'],
  ['useDombaBreedingData', 'useKambingBreedingData'],
  // Generic hook names
  ['useDombaActiveBatches', 'useKambingActiveBatches'],
  ['useDombaBatches', 'useKambingBatches'],
  ['useDombaAnimals', 'useKambingAnimals'],
  ['useDombaAnimalDetail', 'useKambingAnimalDetail'],
  ['useDombaWeightRecords', 'useKambingWeightRecords'],
  ['useDombaFeedLogs', 'useKambingFeedLogs'],
  ['useDombaHealthLogs', 'useKambingHealthLogs'],
  ['useDombaSales', 'useKambingSales'],
  ['useDombaKandangs', 'useKambingKandangs'],
  ['useCreateDombaBatch', 'useCreateKambingBatch'],
  ['useCloseDombaBatch', 'useCloseKambingBatch'],
  ['useAddDombaAnimal', 'useAddKambingAnimal'],
  ['useUpdateDombaAnimalStatus', 'useUpdateKambingAnimalStatus'],
  ['useAddDombaWeightRecord', 'useAddKambingWeightRecord'],
  ['useAddDombaFeedLog', 'useAddKambingFeedLog'],
  ['useAddDombaHealthLog', 'useAddKambingHealthLog'],
  ['useAddDombaSale', 'useAddKambingSale'],
  ['useDeleteDombaFeedLog', 'useDeleteKambingFeedLog'],
  ['useDeleteDombaWeightRecord', 'useDeleteKambingWeightRecord'],
  ['useCreateDombaKandang', 'useCreateKambingKandang'],
  ['useMoveDombaToKandang', 'useMoveKambingToKandang'],
  ['useEnsureDombaHoldingPen', 'useEnsureKambingHoldingPen'],
  // Breeding hooks
  ['useDombaBreedingAnimals', 'useKambingBreedingAnimals'],
  ['useDombaBreedingAnimalWeights', 'useKambingBreedingAnimalWeights'],
  ['useDombaBreedingMatings', 'useKambingBreedingMatings'],
  ['useDombaBreedingBirths', 'useKambingBreedingBirths'],
  ['useDombaBreedingHealthLogs', 'useKambingBreedingHealthLogs'],
  ['useDombaBreedingFeedLogs', 'useKambingBreedingFeedLogs'],
  ['useDombaBreedingSales', 'useKambingBreedingSales'],
  ['useAddDombaBreedingAnimal', 'useAddKambingBreedingAnimal'],
  ['useUpdateDombaBreedingAnimal', 'useUpdateKambingBreedingAnimal'],
  ['useAddDombaBreedingWeight', 'useAddKambingBreedingWeight'],
  ['useAddDombaBreedingMating', 'useAddKambingBreedingMating'],
  ['useUpdateDombaBreedingMating', 'useUpdateKambingBreedingMating'],
  ['useAddDombaBreedingBirth', 'useAddKambingBreedingBirth'],
  ['useAddDombaBreedingHealthLog', 'useAddKambingBreedingHealthLog'],
  ['useAddDombaBreedingFeedLog', 'useAddKambingBreedingFeedLog'],
  ['useAddDombaBreedingSale', 'useAddKambingBreedingSale'],
  // KPI calculators
  ['calcFCRDomba', 'calcFCRKambing'],
  ['calcMortalitasDomba', 'calcMortalitasKambing'],
  // Paths
  ['/peternak/peternak_domba_penggemukan', '/peternak/peternak_kambing_penggemukan'],
  ['/peternak/peternak_domba_breeding', '/peternak/peternak_kambing_breeding'],
  // Labels & components
  ['Penggemukan Domba', 'Penggemukan Kambing'],
  ['Breeding Domba', 'Breeding Kambing'],
  ['DombaPenggemukanBeranda', 'KambingPenggemukanBeranda'],
  ['DombaPenggemukanBatch', 'KambingPenggemukanBatch'],
  ['DombaBreedingBeranda', 'KambingBreedingBeranda'],
]

function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f)
    if (fs.statSync(p).isDirectory()) {
      walk(p)
    } else if (f.endsWith('.jsx')) {
      let c = fs.readFileSync(p, 'utf8')
      for (const [a, b] of replacements) {
        c = c.split(a).join(b)
      }
      fs.writeFileSync(p, c, 'utf8')
      console.log('OK:', p)
    }
  }
}

walk(dir)
console.log('Kambing Refactor Done!')
