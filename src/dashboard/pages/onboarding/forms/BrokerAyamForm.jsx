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
  target_volume_monthly: z.number().optional(),
  area_operasi: z.string().optional(),
  mitra_peternak_count: z.number().optional(),
})

const CHICKEN_TYPES = ['Broiler', 'Kampung', 'Pejantan', 'Layer']

const VOLUME_OPTIONS = [
  { label: '< 5 ton', value: 5000 },
  { label: '5–20 ton', value: 20000 },
  { label: '20–50 ton', value: 50000 },
  { label: '> 50 ton', value: 100000 },
]

const MITRA_OPTIONS = [
  { label: 'Belum ada', value: 0 },
  { label: '1–5', value: 3 },
  { label: '6–20', value: 13 },
  { label: '> 20', value: 30 },
]

export default function BrokerAyamForm({ onSubmit, onBack, isLoading }) {
  const { handleSubmit, setValue, watch, register, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      chicken_types: [],
      target_volume_monthly: undefined,
      area_operasi: '',
      mitra_peternak_count: undefined,
    },
  })

  const chicken_types = watch('chicken_types')
  const target_volume = watch('target_volume_monthly')
  const mitra_count = watch('mitra_peternak_count')

  const [firstFarm, setFirstFarm] = useState({
    farm_name: '', owner_name: '', phone: '', capacity: '',
  })

  const toggleChicken = (type) => {
    const cur = chicken_types || []
    setValue(
      'chicken_types',
      cur.includes(type) ? cur.filter(t => t !== type) : [...cur, type],
      { shouldValidate: true }
    )
  }

  const onFormSubmit = (data) => {
    onSubmit({
      ...data,
      ...(firstFarm.farm_name ? { first_farm: firstFarm } : {}),
    })
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="w-full">
      <FormHeading
        title="Setup bisnis broker ayammu"
        subtitle="Data ini membantu kami menyesuaikan fitur untukmu."
      />

      {/* Section 1: Jenis Ayam */}
      <FormSection
        label="Jenis Ayam yang Diperdagangkan"
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

      {/* Section 2: Target Volume */}
      <FormSection label="Target Volume per Bulan">
        <PillRow>
          {VOLUME_OPTIONS.map(o => (
            <Pill
              key={o.value}
              label={o.label}
              selected={target_volume === o.value}
              onClick={() => setValue('target_volume_monthly', o.value)}
            />
          ))}
        </PillRow>
      </FormSection>

      {/* Section 3: Area Operasi */}
      <FormSection
        label="Area Operasi"
        inputId="area_operasi"
        hint="Pisahkan dengan koma jika lebih dari satu"
      >
        <input
          id="area_operasi"
          name="area_operasi"
          style={simpleInputStyle}
          placeholder="Boyolali, Klaten, Solo..."
          {...register('area_operasi')}
        />
      </FormSection>

      {/* Section 4: Mitra Peternak */}
      <FormSection label="Jumlah Mitra Peternak Saat Ini">
        <PillRow>
          {MITRA_OPTIONS.map(o => (
            <Pill
              key={o.value}
              label={o.label}
              selected={mitra_count === o.value}
              onClick={() => setValue('mitra_peternak_count', o.value)}
            />
          ))}
        </PillRow>
      </FormSection>

      {/* Section 5: Kandang Pertama (opsional) */}
      <CollapsibleSection title="Tambahkan kandang mitra pertama (opsional)">
        <div style={fieldGroupStyle}>
          <label htmlFor="first_farm_name" style={formLabelStyle}>Nama Kandang</label>
          <input
            id="first_farm_name"
            name="first_farm_name"
            style={simpleInputStyle}
            placeholder="Kandang Pak Harto"
            value={firstFarm.farm_name}
            onChange={e => setFirstFarm(p => ({ ...p, farm_name: e.target.value }))}
          />
        </div>
        <div style={fieldGroupStyle}>
          <label htmlFor="first_farm_owner" style={formLabelStyle}>Nama Pemilik</label>
          <input
            id="first_farm_owner"
            name="first_farm_owner"
            style={simpleInputStyle}
            placeholder="Pak Harto"
            value={firstFarm.owner_name}
            onChange={e => setFirstFarm(p => ({ ...p, owner_name: e.target.value }))}
          />
        </div>
        <div style={fieldGroupStyle}>
          <label htmlFor="first_farm_phone" style={formLabelStyle}>No HP Pemilik</label>
          <input
            id="first_farm_phone"
            name="first_farm_phone"
            type="tel"
            style={simpleInputStyle}
            placeholder="081..."
            value={firstFarm.phone}
            onChange={e => setFirstFarm(p => ({ ...p, phone: e.target.value }))}
          />
        </div>
        <div style={fieldGroupStyle}>
          <label htmlFor="first_farm_capacity" style={formLabelStyle}>Kapasitas (ekor)</label>
          <input
            id="first_farm_capacity"
            name="first_farm_capacity"
            type="number"
            style={simpleInputStyle}
            placeholder="5000"
            value={firstFarm.capacity}
            onChange={e => setFirstFarm(p => ({ ...p, capacity: e.target.value }))}
          />
        </div>
      </CollapsibleSection>

      <FormActions onBack={onBack} loading={isLoading} />
    </form>
  )
}
