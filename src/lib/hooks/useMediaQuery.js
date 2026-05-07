import { useState, useEffect } from 'react'

export function useMediaQuery(query) {
  // Always start with false to avoid hydration mismatches (React error #418).
  // The real value is synced after mount via useEffect.
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia(query)
    setMatches(mq.matches) // sync immediately after mount
    const handler = (e) => setMatches(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [query])

  return matches
}
