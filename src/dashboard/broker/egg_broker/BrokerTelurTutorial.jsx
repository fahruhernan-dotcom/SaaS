import React from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import TutorialOverlay from '@/dashboard/_shared/components/TutorialOverlay'
import { BROKER_TELUR_STEPS } from './brokerTelurTutorialSteps'

const ACCENT = '#F59E0B'
const ACCENT_DIM = 'rgba(245,158,11,0.12)'

export default function BrokerTelurTutorial() {
  const { tenant } = useAuth()
  return (
    <TutorialOverlay
      steps={BROKER_TELUR_STEPS}
      storageKey={`broker_telur_tutorial_${tenant?.id}`}
      accent={ACCENT}
      accentDim={ACCENT_DIM}
    />
  )
}
