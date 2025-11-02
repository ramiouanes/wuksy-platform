import { useEffect, useState } from 'react'

/**
 * Breakpoint types aligned with Tailwind CSS default breakpoints
 */
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

/**
 * Breakpoint pixel values
 */
const breakpoints: Record<Breakpoint, number> = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
}

/**
 * Custom hook to detect the current viewport breakpoint.
 * Returns the current breakpoint name based on window width.
 * 
 * @returns {Breakpoint} Current breakpoint ('xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl')
 */
export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('md')
  
  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') return
    
    const updateBreakpoint = () => {
      const width = window.innerWidth
      if (width < breakpoints.sm) setBreakpoint('xs')
      else if (width < breakpoints.md) setBreakpoint('sm')
      else if (width < breakpoints.lg) setBreakpoint('md')
      else if (width < breakpoints.xl) setBreakpoint('lg')
      else if (width < breakpoints['2xl']) setBreakpoint('xl')
      else setBreakpoint('2xl')
    }
    
    // Set initial breakpoint
    updateBreakpoint()
    
    // Update on window resize
    window.addEventListener('resize', updateBreakpoint)
    
    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [])
  
  return breakpoint
}

/**
 * Helper function to check if current breakpoint is mobile
 * @param breakpoint Current breakpoint
 * @returns True if mobile (xs or sm)
 */
export function isMobileBreakpoint(breakpoint: Breakpoint): boolean {
  return breakpoint === 'xs' || breakpoint === 'sm'
}

/**
 * Helper function to check if current breakpoint is tablet
 * @param breakpoint Current breakpoint
 * @returns True if tablet (md)
 */
export function isTabletBreakpoint(breakpoint: Breakpoint): boolean {
  return breakpoint === 'md'
}

/**
 * Helper function to check if current breakpoint is desktop
 * @param breakpoint Current breakpoint
 * @returns True if desktop (lg, xl, or 2xl)
 */
export function isDesktopBreakpoint(breakpoint: Breakpoint): boolean {
  return breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === '2xl'
}

