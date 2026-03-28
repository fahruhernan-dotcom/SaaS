import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Pill, PillRow, FormSection, CollapsibleSection,
  simpleInputStyle, formLabelStyle, fieldGroupStyle,
  FormHeading, FormActions,
} from './_formShared'

const schema = z.object({
  chicken_types: z.array(z.string()).min(1, 'Pilih minimal 1 jenis ayam'),
  business_model: z.string().optional(),
  capacity_ekor: z.number().optional(),
  kandang_count: z.number().optional(),
})

const CHICKEN_TYPES = ['Broiler', 'Layer', 'Kampung', 'Pejantan']

const BUSINESS_MODEL_OPTIONS = [
  { label: 'Mandiri', value: 'mandiri' },
  { label: 'Kemitraan INTI-PLASMA', value: 'kemitraan_inti_plasma' },
  { label: 'Kemitraan Pakan', value: 'kemitraan_pakan' },
]

const CAPACITY_OPTIONS = [
  { label: '< 1.000', value: 500 },
  { label: '1.000–5.000', value: 3000 },
  { label: '5.000–20.000', value: 12500 },
  { label: '> 20.000', value: 30000 },
]

const KANDANG_OPTIONS = [
  { label: '1', value: 1 },
  { label: '2–5', value: 3 },
  { label: '6–10', value: 8 },
  { label: '> 10', value: 15 },
]

export default function PeternakAyamForm({ onSubmit, onBack, isLoading }) {
  const { handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      chicken_types: [],
      business_model: undefined,
      capacity_ekor: undefined,
      kandang_count: undefined,
    },
  })

  const chicken_types = watch('chicken_types')
  const business_model = watch('business_model')
  const capacity_ekor = watch('capacity_ekor')
  const kandang_count = watch('kandang_count')

  const [mitraCompany, setMitraCompany] = useState('')

  const toggleChicken = (type) => {
    const cur = chicken_types || []
    setValue(
      'chicken_types',
      cur.includes(type) ? cur.filter(t => t !== type) : [...cur, type],
      { shouldValidate: true }
    )
  }

  const isKemitraan = business_model && business_model !== 'mandiri'

  const onFormSubmit = (data) => {
    onSubmit({
      ...data,
      ...(isKemitraan && mitraCompany ? { mitra_company: mitraCompany } : {}),
    })
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="w-full">
      <FormHeading
        title="Setup peternakan ayammu"
        subtitle="Data ini membantu kami menyesuaikan fitur untukmu."
      />

      {/* Section 1: Jenis Ayam */}
      <FormSection
        label="Jenis Ayam yang Diternak"
        error={errors.chicken_types?.message}
      >
        <PillRow>
          {CHICKEN_TYPES.map(t => (
            <Pill
              key={t}
              label={t}
              selected={chicken_types?.includes(t)}
              onClick={() => toggleChicken(t)}
            />
          ))}
        </PillRow>
      </FormSection>

      {/* Section 2: Model Bisnis */}
      <FormSection label="Model Bisnis">
        <PillRow>
          {BUSINESS_MODEL_OPTIONS.map(o => (
            <Pill
              key={o.value}
              label={o.label}
              selected={business_model === o.value}
              onClick={() => setValue('business_model', o.value)}
            />
          ))}
        </PillRow>
      </FormSection>

      {/* Section 3: Kapasitas */}
      <FormSection label="Kapasitas Kandang (ekor)">
        <PillRow>
          {CAPACITY_OPTIONS.map(o => (
            <Pill
              key={o.value}
              label={o.label}
              selected={capacity_ekor === o.value}
              onClick={() => setValue('capacity_ekor', o.value)}
            />
          ))}
        </PillRow>
      </FormSection>

      {/* Section 4: Jumlah Kandang */}
      <FormSection label="Jumlah Kandang">
        <PillRow>
          {KANDANG_OPTIONS.map(o => (
            <Pill
              key={o.value}
              label={o.label}
              selected={kandang_count === o.value}
              onClick={() => setValue('kandang_count', o.value)}
            />
          ))}
        </PillRow>
      </FormSection>

      {/* Section 5: Mitra (kondisional) */}
      {isKemitraan && (
        <FormSection label="Nama Perusahaan Mitra" inputId="mitra_company">
          <input
            id="mitra_company"
            name="mitra_company"
            style={simpleInputStyle}
            placeholder="PT. Charoen Pokphand, Wonokoyo, dll."
            value={mitraCompany}
            onChange={e => setMitraCompany(e.target.value)}
          />
        </FormSection>
      )}

      <FormActions onBack={onBack} loading={isLoading} />
    </form>
  )
}
