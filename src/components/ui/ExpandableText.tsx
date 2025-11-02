'use client'

import { useState } from 'react'

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
  
  // Generate the line-clamp class dynamically
  const lineClampClass = expanded ? '' : `line-clamp-${maxLines}`
  
  return (
    <div className={className}>
      <p className={lineClampClass}>
        {text}
      </p>
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-primary-600 hover:text-primary-700 active:text-primary-800 text-sm mt-2 font-medium transition-colors touch-target"
        aria-expanded={expanded}
        aria-label={expanded ? 'Collapse text' : 'Expand text'}
      >
        {expanded ? collapseText : expandText}
      </button>
    </div>
  )
}

