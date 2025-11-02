import { useEffect, useState } from 'react'

/**
 * Custom hook to detect if the user is using a touch-capable device.
 * Checks both touch screen capability and pointer type.
 * 
 * @returns {boolean} True if the device supports touch, false otherwise
 */
export function useTouchDevice(): boolean {
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  
  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') return
    
    // Check for touch screen support
    const hasTouchScreen = 
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-ignore - For older IE/Edge
      navigator.msMaxTouchPoints > 0
    
    // Check for coarse pointer (typically touch or stylus)
    const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches
    
    // Device is considered touch if it has either touch screen or coarse pointer
    setIsTouchDevice(hasTouchScreen || hasCoarsePointer)
  }, [])
  
  return isTouchDevice
}

/**
 * Custom hook to detect if the device has hover capability.
 * Useful for conditionally showing hover effects.
 * 
 * @returns {boolean} True if the device can hover, false otherwise
 */
export function useHoverCapability(): boolean {
  const [canHover, setCanHover] = useState(true)
  
  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') return
    
    // Check if the primary input mechanism can hover
    const hasHoverCapability = window.matchMedia('(hover: hover)').matches
    
    setCanHover(hasHoverCapability)
  }, [])
  
  return canHover
}

