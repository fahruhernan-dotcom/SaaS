import { format, formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'

export const formatIDR = (n) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n ?? 0)

export const formatIDRShort = (n) => {
  if (!n) return 'Rp 0'
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}rb`
  return `Rp ${n}`
}

export const formatDate = (date) =>
  format(new Date(date), 'd MMM yyyy', { locale: id })

export const formatDateFull = (date) =>
  format(new Date(date), 'EEEE, d MMMM yyyy', { locale: id })

export const formatRelative = (date) =>
  formatDistanceToNow(new Date(date), { addSuffix: true, locale: id })

export const formatWeight = (kg) =>
  kg >= 1000 ? `${(kg / 1000).toFixed(1)} ton` : `${kg} kg`

export const formatEkor = (n) =>
  `${(n || 0).toLocaleString('id-ID')} ekor`

export const formatKg = (n) =>
  n >= 1000
    ? `${(n / 1000).toFixed(2)} ton`
    : `${Number(n || 0).toFixed(1)} kg`

export const calcMargin = (buyPrice, sellPrice) =>
  sellPrice - buyPrice

export const calcROI = (modal, profit) =>
  modal > 0 ? ((profit / modal) * 100).toFixed(1) : 0

export const calcMortalityRate = (initial, died) =>
  initial > 0 ? ((died / initial) * 100).toFixed(2) : 0

export const calcShrinkage = (initialKg, arrivedKg) => ({
  kg: (initialKg - arrivedKg).toFixed(2),
  percent: initialKg > 0
    ? (((initialKg - arrivedKg) / initialKg) * 100).toFixed(1)
    : 0,
})

