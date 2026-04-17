import React from 'react'
import PeternakSapiForm from './PeternakSapiForm'

export default function StepSetup({ selectedModel, setupData, setSetupData }) {
  switch (selectedModel) {
    case 'peternak_sapi_penggemukan':
      return (
        <PeternakSapiForm
          data={setupData}
          onChange={setSetupData}
        />
      )
    default:
      return (
        <div style={{
          padding: '24px',
          textAlign: 'center',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <p style={{ fontSize: '13px', color: '#4B6478', fontStyle: 'italic' }}>
            Tidak ada konfigurasi tambahan untuk tipe bisnis ini.
          </p>
        </div>
      )
  }
}
