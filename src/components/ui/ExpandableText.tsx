'use client'

import { useState, useRef, useEffect } from 'react'

interface ExpandableTextProps {
  /** The text content to display */
  text: string
  /** Maximum number of lines to show when collapsed (default: 3) */
  maxLines?: number
  /** Additional CSS classes for the container */
  className?: string
  /** Text for the expand button (default: "Show more") */
  expandText?: string
  /** Text for the collapse button (default: "Show less") */
  collapseText?: string
  /** Whether to start in expanded state (default: false) */
  defaultExpanded?: boolean
}

/**
 * ExpandableText Component
 * 
 * A reusable component for text truncation with "Show more/less" functionality.
 * Uses CSS line-clamp for clean truncation with ellipsis.
 * 
 * @example
 * ```tsx
 * <ExpandableText
 *   text="Your long text content here..."
 *   maxLines={3}
 *   className="text-sm text-neutral-600"
 * />
 * ```
 */
export function ExpandableText({ 
  text, 
  maxLines = 3, 
  className = '',
  expandText = 'Show more',
  collapseText = 'Show less',
  defaultExpanded = false
}: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [needsExpansion, setNeedsExpansion] = useState(false)
  const textRef = useRef<HTMLParagraphElement>(null)
  
  useEffect(() => {
    if (textRef.current) {
      const lineHeight = parseInt(getComputedStyle(textRef.current).lineHeight) || 20
      const maxHeight = lineHeight * maxLines
      setNeedsExpansion(textRef.current.scrollHeight > maxHeight)
    }
  }, [text, maxLines])
  
  // Map maxLines to Tailwind classes
  const lineClampClasses: Record<number, string> = {
    1: 'line-clamp-1',
    2: 'line-clamp-2',
    3: 'line-clamp-3',
    4: 'line-clamp-4',
    5: 'line-clamp-5',
    6: 'line-clamp-6',
  }
  
  const lineClampClass = expanded ? '' : (lineClampClasses[maxLines] || 'line-clamp-3')
  
  if (!text) return null
  
  return (
    <div className={className}>
      <p 
        ref={textRef}
        className={lineClampClass}
      >
        {text}
      </p>
      {needsExpansion && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-primary-600 hover:text-primary-700 active:text-primary-800 text-sm mt-2 font-medium transition-colors touch-target"
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse text' : 'Expand text'}
        >
          {expanded ? collapseText : expandText}
        </button>
      )}
    </div>
  )
}

