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
  egg_types: z.array(z.string()).min(1, 'Pilih minimal 1 jenis telur'),
  kapasitas_harian_butir: z.number().optional(),
  area_distribusi: z.string().optional(),
})

const EGG_TYPES = ['Telur Ayam', 'Telur Bebek', 'Telur Puyuh']

const KAPASITAS_OPTIONS = [
  { label: '< 1.000', value: 500 },
  { label: '1.000–5.000', value: 3000 },
  { label: '5.000–20.000', value: 12500 },
  { label: '> 20.000', value: 30000 },
]

export default function BrokerTelurForm({ onSubmit, onBack, isLoading }) {
  const { handleSubmit, setValue, watch, register, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      egg_types: [],
      kapasitas_harian_butir: undefined,
      area_distribusi: '',
    },
  })

  const egg_types = watch('egg_types')
  const kapasitas = watch('kapasitas_harian_butir')

  const [firstSupplier, setFirstSupplier] = useState({
    supplier_name: '', phone: '', kapasitas_supply: '',
  })

  const toggleEgg = (type) => {
    const cur = egg_types || []
    setValue(
      'egg_types',
      cur.includes(type) ? cur.filter(t => t !== type) : [...cur, type],
      { shouldValidate: true }
    )
  }

  const onFormSubmit = (data) => {
    onSubmit({
      ...data,
      ...(firstSupplier.supplier_name ? { first_supplier: firstSupplier } : {}),
    })
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="w-full">
      <FormHeading
        title="Setup bisnis broker telurmu"
        subtitle="Data ini membantu kami menyesuaikan fitur untukmu."
      />

      {/* Section 1: Jenis Telur */}
      <FormSection
        label="Jenis Telur yang Diperdagangkan"
        error={errors.egg_types?.message}
      >
        <PillRow>
          {EGG_TYPES.map(t => (
            <Pill
              key={t}
              label={t}
              selected={egg_types?.includes(t)}
              onClick={() => toggleEgg(t)}
            />
          ))}
        </PillRow>
      </FormSection>

      {/* Section 2: Kapasitas Harian */}
      <FormSection label="Kapasitas Harian (butir)">
        <PillRow>
          {KAPASITAS_OPTIONS.map(o => (
            <Pill
              key={o.value}
              label={o.label}
              selected={kapasitas === o.value}
              onClick={() => setValue('kapasitas_harian_butir', o.value)}
            />
          ))}
        </PillRow>
      </FormSection>

      {/* Section 3: Area Distribusi */}
      <FormSection label="Area Distribusi" inputId="area_distribusi">
        <input
          id="area_distribusi"
          name="area_distribusi"
          style={simpleInputStyle}
          placeholder="Jakarta Timur, Bekasi, Depok..."
          {...register('area_distribusi')}
        />
      </FormSection>

      {/* Section 4: Supplier Pertama (opsional) */}
      <CollapsibleSection title="Tambahkan supplier pertama (opsional)">
        <div style={fieldGroupStyle}>
          <label htmlFor="supplier_name" style={formLabelStyle}>Nama Supplier</label>
          <input
            id="supplier_name"
            name="supplier_name"
            style={simpleInputStyle}
            placeholder="Peternakan Pak Budi"
            value={firstSupplier.supplier_name}
            onChange={e => setFirstSupplier(p => ({ ...p, supplier_name: e.target.value }))}
          />
        </div>
        <div style={fieldGroupStyle}>
          <label htmlFor="supplier_phone" style={formLabelStyle}>No HP Supplier</label>
          <input
            id="supplier_phone"
            name="supplier_phone"
            type="tel"
            style={simpleInputStyle}
            placeholder="081..."
            value={firstSupplier.phone}
            onChange={e => setFirstSupplier(p => ({ ...p, phone: e.target.value }))}
          />
        </div>
        <div style={fieldGroupStyle}>
          <label htmlFor="supplier_kapasitas" style={formLabelStyle}>Kapasitas Supply/hari (butir)</label>
          <input
            id="supplier_kapasitas"
            name="supplier_kapasitas"
            type="number"
            style={simpleInputStyle}
            placeholder="2000"
            value={firstSupplier.kapasitas_supply}
            onChange={e => setFirstSupplier(p => ({ ...p, kapasitas_supply: e.target.value }))}
          />
        </div>
      </CollapsibleSection>

      <FormActions onBack={onBack} loading={isLoading} />
    </form>
  )
}
