import React from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import TutorialOverlay from '@/dashboard/_shared/components/TutorialOverlay'
import { BROKER_AYAM_STEPS } from './brokerAyamTutorialSteps'

const ACCENT = '#0EA5E9'
const ACCENT_DIM = 'rgba(14,165,233,0.12)'

export default function BrokerAyamTutorial() {
  const { tenant } = useAuth()
  return (
    <TutorialOverlay
      steps={BROKER_AYAM_STEPS}
      storageKey={`broker_ayam_tutorial_${tenant?.id}`}
      accent={ACCENT}
      accentDim={ACCENT_DIM}
    />
  )
}
