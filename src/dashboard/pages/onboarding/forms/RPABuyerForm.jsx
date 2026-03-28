import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Pill, PillRow, FormSection,
  simpleInputStyle,
  FormHeading, FormActions,
} from './_formShared'

const schema = z.object({
  buyer_type: z.string().min(1, 'Pilih tipe pembeli'),
  chicken_types: z.array(z.string()).min(1, 'Pilih minimal 1 jenis produk'),
  volume_monthly_kg: z.number().optional(),
})

const BUYER_TYPES = [
  { label: 'RPA / Jagal', value: 'rpa' },
  { label: 'Restoran / Hotel', value: 'horeca' },
  { label: 'Pasar Tradisional', value: 'pasar' },
  { label: 'Supermarket / Retail', value: 'retail' },
  { label: 'Industri Pengolahan', value: 'industri' },
]

const PRODUCT_TYPES = ['Ayam Hidup', 'Karkas', 'Potongan Paha', 'Dada', 'Ceker', 'Jeroan']

const VOLUME_OPTIONS = [
  { label: '< 500 kg', value: 250 },
  { label: '500 kg–2 ton', value: 1000 },
  { label: '2–10 ton', value: 5000 },
  { label: '> 10 ton', value: 20000 },
]

export default function RPABuyerForm({ onSubmit, onBack, isLoading }) {
  const { handleSubmit, setValue, watch, register, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      buyer_type: '',
      chicken_types: [],
      volume_monthly_kg: undefined,
    },
  })

  const buyer_type = watch('buyer_type')
  const chicken_types = watch('chicken_types')
  const volume = watch('volume_monthly_kg')

  const toggleProduct = (type) => {
    const cur = chicken_types || []
    setValue(
      'chicken_types',
      cur.includes(type) ? cur.filter(t => t !== type) : [...cur, type],
      { shouldValidate: true }
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full">
      <FormHeading
        title="Setup profil pembeli/RPA"
        subtitle="Data ini membantu kami menyesuaikan fitur untukmu."
      />

      {/* Section 1: Tipe Pembeli */}
      <FormSection
        label="Tipe Pembeli"
        error={errors.buyer_type?.message}
      >
        <PillRow>
          {BUYER_TYPES.map(o => (
            <Pill
              key={o.value}
              label={o.label}
              selected={buyer_type === o.value}
              onClick={() => setValue('buyer_type', o.value, { shouldValidate: true })}
            />
          ))}
        </PillRow>
      </FormSection>

      {/* Section 2: Produk yang Dibutuhkan */}
      <FormSection
        label="Produk yang Dibutuhkan"
        error={errors.chicken_types?.message}
      >
        <PillRow>
          {PRODUCT_TYPES.map(t => (
            <Pill
              key={t}
              label={t}
              selected={chicken_types?.includes(t)}
              onClick={() => toggleProduct(t)}
            />
          ))}
        </PillRow>
      </FormSection>

      {/* Section 3: Volume Bulanan */}
      <FormSection label="Kebutuhan per Bulan">
        <PillRow>
          {VOLUME_OPTIONS.map(o => (
            <Pill
              key={o.value}
              label={o.label}
              selected={volume === o.value}
              onClick={() => setValue('volume_monthly_kg', o.value)}
            />
          ))}
        </PillRow>
      </FormSection>

      {/* Section 4: Area Pengiriman */}
      <FormSection label="Area Pengiriman" inputId="delivery_area">
        <input
          id="delivery_area"
          name="delivery_area"
          style={simpleInputStyle}
          placeholder="Jakarta Selatan, Tangerang..."
          {...register('delivery_area')}
        />
      </FormSection>

      <FormActions onBack={onBack} loading={isLoading} />
    </form>
  )
}
