'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

interface ResponsiveModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  contentRef?: React.RefObject<HTMLDivElement>
}

/**
 * ResponsiveModal Component
 * 
 * A mobile-first modal that:
 * - Displays full-screen on mobile devices (<768px)
 * - Shows as a centered dialog on desktop devices
 * - Includes backdrop that closes modal on click
 * - Has a close button with adequate touch target (44x44px)
 * - Manages focus and scroll behavior
 */
export function ResponsiveModal({ isOpen, onClose, children, title, contentRef }: ResponsiveModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Container */}
      <div 
        ref={contentRef}
        className="absolute inset-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-2xl md:w-full md:max-h-[90vh] md:rounded-2xl bg-white overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
      >
        {/* Close Button - Adequate touch target (44x44px) */}
        <button
          className="absolute top-4 right-4 p-3 rounded-full hover:bg-neutral-100 active:bg-neutral-200 min-h-[44px] min-w-[44px] flex items-center justify-center z-10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          onClick={onClose}
          aria-label="Close modal"
        >
          <X className="h-5 w-5 text-neutral-600" />
        </button>
        
        {/* Modal Content */}
        <div className="p-6 md:p-8">
          {title && (
            <h2 id="modal-title" className="text-2xl font-medium text-neutral-800 mb-4 pr-12">
              {title}
            </h2>
          )}
          {children}
        </div>
      </div>
    </div>
  )
}

export default ResponsiveModal

