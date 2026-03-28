import React, { useState } from 'react'
import { ArrowRight, ChevronLeft, Building, Phone, MapPin, User } from 'lucide-react'
import {
  primaryBtnStyle, backBtnStyle,
  inputStyle, inputWrapperStyle, inputIconStyle,
  labelStyle, formGroupStyle,
  stepTitleStyle, stepDescStyle,
} from '../shared'

// Step 2: Info Bisnis (sama untuk semua sub_type)
// Props: onNext({ full_name, business_name, phone, location }), onBack(), defaultValues?

export default function Step2InfoBisnis({ onNext, onBack, defaultValues = {} }) {
  const [fields, setFields] = useState({
    full_name: defaultValues.full_name || '',
    business_name: defaultValues.business_name || '',
    phone: defaultValues.phone || '',
    location: defaultValues.location || '',
  })

  const set = (key) => (e) => setFields(prev => ({ ...prev, [key]: e.target.value }))

  const handleNext = () => {
    if (!fields.business_name.trim()) return
    onNext({
      full_name: fields.full_name.trim(),
      business_name: fields.business_name.trim(),
      phone: fields.phone.trim(),
      location: fields.location.trim(),
    })
  }

  return (
    <div className="w-full">
      <h2 style={stepTitleStyle}>Lengkapi profil bisnismu</h2>
      <p style={stepDescStyle}>Data ini membantu kami menyiapkan dashboard yang tepat.</p>

      {/* Nama Lengkap */}
      <div style={formGroupStyle}>
        <label htmlFor="full_name" style={labelStyle}>Nama Lengkap</label>
        <div style={inputWrapperStyle}>
          <User size={18} style={inputIconStyle} />
          <input
            id="full_name"
            name="full_name"
            style={inputStyle}
            placeholder="Nama lengkap kamu"
            value={fields.full_name}
            onChange={set('full_name')}
          />
        </div>
      </div>

      {/* Nama Bisnis */}
      <div style={formGroupStyle}>
        <label htmlFor="business_name" style={labelStyle}>Nama Bisnis *</label>
        <div style={inputWrapperStyle}>
          <Building size={18} style={inputIconStyle} />
          <input
            id="business_name"
            name="business_name"
            style={inputStyle}
            placeholder="cth. UD Jaya Makmur"
            value={fields.business_name}
            onChange={set('business_name')}
          />
        </div>
      </div>

      {/* No HP */}
      <div style={formGroupStyle}>
        <label htmlFor="phone" style={labelStyle}>No HP Bisnis</label>
        <div style={inputWrapperStyle}>
          <Phone size={18} style={inputIconStyle} />
          <input
            id="phone"
            name="phone"
            type="tel"
            style={inputStyle}
            placeholder="081234567890"
            value={fields.phone}
            onChange={set('phone')}
          />
        </div>
      </div>

      {/* Lokasi */}
      <div style={formGroupStyle}>
        <label htmlFor="location" style={labelStyle}>Lokasi / Kota</label>
        <div style={inputWrapperStyle}>
          <MapPin size={18} style={inputIconStyle} />
          <input
            id="location"
            name="location"
            style={inputStyle}
            placeholder="Contoh: Boyolali, Jawa Tengah"
            value={fields.location}
            onChange={set('location')}
          />
        </div>
      </div>

      <button
        onClick={handleNext}
        disabled={!fields.business_name.trim()}
        style={{ ...primaryBtnStyle, marginTop: '12px', opacity: fields.business_name.trim() ? 1 : 0.5 }}
      >
        Lanjut <ArrowRight size={18} />
      </button>

      <button onClick={onBack} style={backBtnStyle}>
        <ChevronLeft size={16} /> Kembali
      </button>
    </div>
  )
}
