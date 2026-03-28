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
  livestock_types: z.array(z.string()).min(1, 'Pilih minimal 1 jenis ternak'),
  business_model: z.string().optional(),
  capacity_ekor: z.number().optional(),
})

const LIVESTOCK_TYPES = ['Domba', 'Kambing', 'Sapi', 'Kerbau']

const BUSINESS_MODEL_OPTIONS = [
  { label: 'Mandiri', value: 'mandiri' },
  { label: 'Gaduhan', value: 'gaduhan' },
  { label: 'Kemitraan', value: 'kemitraan' },
]

const CAPACITY_OPTIONS = [
  { label: '< 50', value: 25 },
  { label: '50–200', value: 100 },
  { label: '200–500', value: 350 },
  { label: '> 500', value: 750 },
]

export default function PeternakRuminansiaForm({ onSubmit, onBack, isLoading }) {
  const { handleSubmit, setValue, watch, register, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      livestock_types: [],
      business_model: undefined,
      capacity_ekor: undefined,
    },
  })

  const livestock_types = watch('livestock_types')
  const business_model = watch('business_model')
  const capacity_ekor = watch('capacity_ekor')

  const toggleLivestock = (type) => {
    const cur = livestock_types || []
    setValue(
      'livestock_types',
      cur.includes(type) ? cur.filter(t => t !== type) : [...cur, type],
      { shouldValidate: true }
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full">
      <FormHeading
        title="Setup peternakan ruminansiam"
        subtitle="Data ini membantu kami menyesuaikan fitur untukmu."
      />

      {/* Section 1: Jenis Ternak */}
      <FormSection
        label="Jenis Ternak"
        error={errors.livestock_types?.message}
      >
        <PillRow>
          {LIVESTOCK_TYPES.map(t => (
            <Pill
              key={t}
              label={t}
              selected={livestock_types?.includes(t)}
              onClick={() => toggleLivestock(t)}
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
      <FormSection label="Kapasitas (ekor)">
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

      {/* Section 4: Lokasi Kandang */}
      <FormSection label="Lokasi Kandang" inputId="farm_location">
        <input
          id="farm_location"
          name="farm_location"
          style={simpleInputStyle}
          placeholder="Kab. Boyolali, Jawa Tengah"
          {...register('farm_location')}
        />
      </FormSection>

      <FormActions onBack={onBack} loading={isLoading} />
    </form>
  )
}
