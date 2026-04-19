const fs = require('fs')
const path = require('path')

const dir = path.join(__dirname, 'src/dashboard/peternak/domba')

const replacements = [
  // Hook file imports
  ['useKdPenggemukanData', 'useDombaPenggemukanData'],
  ['useKdBreedingData', 'useDombaBreedingData'],
  // Penggemukan hooks
  ['useKdActiveBatches', 'useDombaActiveBatches'],
  ['useKdBatches', 'useDombaBatches'],
  ['useKdAnimals', 'useDombaAnimals'],
  ['useKdAnimalDetail', 'useDombaAnimalDetail'],
  ['useKdWeightRecords', 'useDombaWeightRecords'],
  ['useKdFeedLogs', 'useDombaFeedLogs'],
  ['useKdHealthLogs', 'useDombaHealthLogs'],
  ['useKdSales', 'useDombaSales'],
  ['useKdKandangs', 'useDombaKandangs'],
  ['useCreateKdBatch', 'useCreateDombaBatch'],
  ['useCloseKdBatch', 'useCloseDombaBatch'],
  ['useAddKdAnimal', 'useAddDombaAnimal'],
  ['useUpdateKdAnimalStatus', 'useUpdateDombaAnimalStatus'],
  ['useAddKdWeightRecord', 'useAddDombaWeightRecord'],
  ['useAddKdFeedLog', 'useAddDombaFeedLog'],
  ['useAddKdHealthLog', 'useAddDombaHealthLog'],
  ['useAddKdSale', 'useAddDombaSale'],
  ['useDeleteKdFeedLog', 'useDeleteDombaFeedLog'],
  ['useDeleteKdWeightRecord', 'useDeleteDombaWeightRecord'],
  ['useCreateKdKandang', 'useCreateDombaKandang'],
  ['useMoveAnimalToKandang', 'useMoveDombaToKandang'],
  ['useEnsureHoldingPen', 'useEnsureDombaHoldingPen'],
  // Breeding hooks
  ['useKdBreedingAnimals', 'useDombaBreedingAnimals'],
  ['useKdBreedingAnimalWeights', 'useDombaBreedingAnimalWeights'],
  ['useKdBreedingMatings', 'useDombaBreedingMatings'],
  ['useKdBreedingBirths', 'useDombaBreedingBirths'],
  ['useKdBreedingHealthLogs', 'useDombaBreedingHealthLogs'],
  ['useKdBreedingFeedLogs', 'useDombaBreedingFeedLogs'],
  ['useKdBreedingSales', 'useDombaBreedingSales'],
  ['useAddKdBreedingAnimal', 'useAddDombaBreedingAnimal'],
  ['useUpdateKdBreedingAnimal', 'useUpdateDombaBreedingAnimal'],
  ['useAddKdBreedingWeight', 'useAddDombaBreedingWeight'],
  ['useAddKdBreedingMating', 'useAddDombaBreedingMating'],
  ['useUpdateKdBreedingMating', 'useUpdateDombaBreedingMating'],
  ['useAddKdBreedingBirth', 'useAddDombaBreedingBirth'],
  ['useAddKdBreedingHealthLog', 'useAddDombaBreedingHealthLog'],
  ['useAddKdBreedingFeedLog', 'useAddDombaBreedingFeedLog'],
  ['useAddKdBreedingSale', 'useAddDombaBreedingSale'],
  // KPI calculators
  ['calcFCRKambing', 'calcFCRDomba'],
  ['calcMortalitasKambing', 'calcMortalitasDomba'],
  // Paths
  ['/peternak/peternak_kambing_domba_penggemukan', '/peternak/peternak_domba_penggemukan'],
  ['/peternak/peternak_kambing_domba_breeding', '/peternak/peternak_domba_breeding'],
  // Labels
  ['Penggemukan Kambing & Domba', 'Penggemukan Domba'],
  ['KdPenggemukanBeranda', 'DombaPenggemukanBeranda'],
  ['KdPenggemukanBatch', 'DombaPenggemukanBatch'],
  // Relative import fix
  ['../../_shared/', '../../../_shared/'],
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
console.log('All done!')
