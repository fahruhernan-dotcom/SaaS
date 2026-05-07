import React from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/lib/hooks/useAuth'
import TutorialOverlay from '@/dashboard/_shared/components/TutorialOverlay'
import { getTutorialSteps } from './tutorialSteps'

const ACCENT = '#22C55E'
const ACCENT_DIM = 'rgba(34,197,94,0.12)'

export default function PeternakTutorialOverlay() {
  const { peternakType } = useParams()
  const { tenant } = useAuth()
  const steps = getTutorialSteps(peternakType)
  const storageKey = `peternak_tutorial_${tenant?.id}`
  return <TutorialOverlay steps={steps} storageKey={storageKey} accent={ACCENT} accentDim={ACCENT_DIM} />
}
