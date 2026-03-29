import React from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import BusinessModelOverlay from '../components/BusinessModelOverlay'
import { Navigate } from 'react-router-dom'
import LoadingScreen from '@/components/LoadingScreen'

/**
 * Onboarding Flow Page
 * Mandiri (Owner) users are redirected here after registration
 * to select their business model.
 */
export default function OnboardingFlow() {
  const { profile, loading, refetchProfile } = useAuth()
  
  if (loading) return <LoadingScreen />
  
  // If already onboarded, redirect to home
  if (profile?.onboarded) {
    return <Navigate to="/" replace />
  }
  
  return (
    <div className="min-h-screen bg-[#06090F]">
       <BusinessModelOverlay 
         profile={profile} 
         onComplete={() => {
           // Refetch to get updated onboarded status
           refetchProfile()
         }} 
       />
    </div>
  )
}
