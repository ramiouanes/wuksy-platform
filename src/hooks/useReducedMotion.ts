import { useEffect, useState } from 'react'

/**
 * Custom hook to detect if the user prefers reduced motion.
 * Respects the user's system-level accessibility preference.
 * 
 * @returns {boolean} True if the user prefers reduced motion, false otherwise
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  
  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') return
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    
    const listener = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }
    
    // Listen for changes in the preference
    mediaQuery.addEventListener('change', listener)
    
    return () => mediaQuery.removeEventListener('change', listener)
  }, [])
  
  return prefersReducedMotion
}

