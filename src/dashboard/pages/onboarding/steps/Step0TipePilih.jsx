import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Loader2 } from 'lucide-react'
import { RoleCard, SectionLabel, primaryBtnStyle } from '../shared'

// Step 0: Pilih Tipe Bisnis Utama
// Props: onNext({ tipe })

export default function Step0TipePilih({ onNext }) {
  const [selectedTipe, setSelectedTipe] = useState(null)

  const handleNext = () => {
    if (!selectedTipe) return
    onNext({ tipe: selectedTipe })
  }

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="text-center">
        <h1 style={{ fontFamily: 'Sora', fontSize: '22px', fontWeight: 800, color: '#F1F5F9', marginBottom: '8px' }}>
          Kamu berbisnis sebagai apa?
        </h1>
        <p style={{ fontSize: '14px', fontFamily: 'DM Sans', color: '#4B6478' }}>
          Kami siapkan dashboard yang tepat untukmu.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <RoleCard
          icon="🏢"
          title="Broker"
          desc="Perantara jual-beli ayam, telur, atau hasil ternak."
          pricing="mulai Rp 999rb/bln"
          selected={selectedTipe === 'broker'}
          onClick={() => setSelectedTipe('broker')}
        />
        <RoleCard
          icon="🏚️"
          title="Peternak"
          desc="Pemilik kandang dan pembudidaya ternak."
          pricing="mulai Rp 499rb/bln"
          selected={selectedTipe === 'peternak'}
          onClick={() => setSelectedTipe('peternak')}
        />
        <RoleCard
          icon="🏭"
          title="RPA / Buyer"
          desc="Rumah Pemotongan Ayam atau pembeli industri."
          pricing="mulai Rp 699rb/bln"
          selected={selectedTipe === 'rpa'}
          onClick={() => setSelectedTipe('rpa')}
        />
      </div>

      {selectedTipe && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleNext}
          style={primaryBtnStyle}
        >
          Lanjut <ArrowRight size={18} />
        </motion.button>
      )}
    </div>
  )
}
