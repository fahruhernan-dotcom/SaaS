import React from 'react'
import BrokerAyamForm from '../forms/BrokerAyamForm'
import BrokerTelurForm from '../forms/BrokerTelurForm'
import BrokerSembakoForm from '../forms/BrokerSembakoForm'
import PeternakAyamForm from '../forms/PeternakAyamForm'
import PeternakRuminansiaForm from '../forms/PeternakRuminansiaForm'
import RPABuyerForm from '../forms/RPABuyerForm'

// Maps sub_type keys → form components
const FORM_MAP = {
  broker_ayam:          BrokerAyamForm,
  broker_telur:         BrokerTelurForm,
  distributor_daging:   BrokerAyamForm,
  distributor_sembako:  BrokerSembakoForm,
  peternak_ayam:        PeternakAyamForm,       // legacy alias
  peternak_broiler:     PeternakAyamForm,
  peternak_layer:       PeternakAyamForm,
  peternak_ruminansia:  PeternakRuminansiaForm, // legacy alias
  rpa_buyer:            RPABuyerForm,            // legacy alias
  rpa_ayam:             RPABuyerForm,
}

// Fallback for unimplemented sub-types
function FallbackForm({ subType, onSubmit, onBack, isLoading }) {
  return (
    <div className="w-full">
      <div style={{
        background: 'rgba(16,185,129,0.05)',
        border: '1px dashed rgba(16,185,129,0.25)',
        borderRadius: '14px',
        padding: '32px 24px',
        textAlign: 'center',
        marginBottom: '24px',
      }}>
        <p style={{ fontSize: '15px', fontFamily: 'Sora', fontWeight: 700, color: '#F1F5F9', marginBottom: '8px' }}>
          Hampir selesai!
        </p>
        <p style={{ fontSize: '13px', color: '#4B6478', fontFamily: 'DM Sans' }}>
          Setup untuk <strong style={{ color: '#10B981' }}>{subType}</strong> segera tersedia.
        </p>
      </div>
      <button
        type="button"
        onClick={() => onSubmit({})}
        disabled={isLoading}
        style={{
          width: '100%',
          background: '#10B981',
          border: 'none',
          borderRadius: '12px',
          height: '48px',
          color: 'white',
          fontFamily: 'Sora',
          fontSize: '15px',
          fontWeight: 700,
          cursor: isLoading ? 'not-allowed' : 'pointer',
        }}
      >
        Mulai Pakai TernakOS →
      </button>
      <button
        type="button"
        onClick={onBack}
        style={{
          display: 'block',
          width: '100%',
          marginTop: '12px',
          background: 'transparent',
          border: 'none',
          color: '#4B6478',
          fontFamily: 'DM Sans',
          fontSize: '14px',
          cursor: 'pointer',
          padding: '8px',
        }}
      >
        ← Kembali
      </button>
    </div>
  )
}

// Props: subType, onBack, onSubmit(specificData), loading
export default function Step3Setup({ subType, onBack, onSubmit, loading }) {
  const FormComponent = FORM_MAP[subType]

  if (!FormComponent) {
    return <FallbackForm subType={subType} onSubmit={onSubmit} onBack={onBack} isLoading={loading} />
  }

  return (
    <FormComponent
      onSubmit={onSubmit}
      onBack={onBack}
      isLoading={loading}
    />
  )
}
