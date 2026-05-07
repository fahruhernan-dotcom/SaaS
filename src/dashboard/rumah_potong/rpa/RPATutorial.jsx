import React from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import TutorialOverlay from '@/dashboard/_shared/components/TutorialOverlay'
import { RPA_STEPS } from './rpaTutorialSteps'

const ACCENT = '#F97316'
const ACCENT_DIM = 'rgba(249,115,22,0.12)'

export default function RPATutorial() {
  const { tenant } = useAuth()
  return (
    <TutorialOverlay
      steps={RPA_STEPS}
      storageKey={`rpa_tutorial_${tenant?.id}`}
      accent={ACCENT}
      accentDim={ACCENT_DIM}
    />
  )
}
