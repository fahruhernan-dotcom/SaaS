export const STATUS_CONFIG = {
  active:  { label: 'Aktif',    color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  sold:    { label: 'Terjual',  color: 'text-blue-400 bg-blue-500/10 border-blue-500/20'   },
  dead:    { label: 'Mati',     color: 'text-red-400 bg-red-500/10 border-red-500/20'      },
  culled:  { label: 'Afkir',    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'},
}

export const WEIGH_METHOD_LABEL = {
  timbang_langsung:   { label: 'Timbang',   color: 'text-green-400' },
  estimasi_pita_ukur: { label: 'Pita Ukur', color: 'text-amber-400' },
  estimasi_visual:    { label: 'Estimasi',  color: 'text-slate-400'  },
}

export const BCS_OPTIONS     = [1, 2, 3, 4, 5]
export const FAMACHA_OPTIONS = [1, 2, 3, 4, 5]
export const FAMACHA_COLOR   = { 1: 'text-green-400', 2: 'text-lime-400', 3: 'text-amber-400', 4: 'text-orange-400', 5: 'text-rose-500' }
export const BCS_LABEL       = { 1: 'Sangat Kurus', 2: 'Kurus', 3: 'Ideal', 4: 'Gemuk', 5: 'Obesitas' }

export const BUYER_TYPES = ['Pedagang', 'RPH', 'Konsumer Langsung', 'Eksportir', 'Lainnya']
export const PRICE_TYPES = [
  { value: 'per_ekor', label: 'Per Ekor' },
  { value: 'per_kg',   label: 'Per Kg LW' },
]
