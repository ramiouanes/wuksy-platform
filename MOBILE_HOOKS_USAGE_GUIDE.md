# Mobile Responsiveness Hooks & Components Usage Guide

This guide documents the utility hooks and components created for Agent 1B (Phase 1: Foundation) of the mobile responsiveness implementation.

## Table of Contents
1. [useReducedMotion Hook](#usereducedmotion-hook)
2. [useBreakpoint Hook](#usebreakpoint-hook)
3. [useTouchDevice Hook](#usetouchdevice-hook)
4. [ExpandableText Component](#expandabletext-component)

---

## useReducedMotion Hook

### Purpose
Detects if the user has enabled "Reduce Motion" in their operating system accessibility settings. This allows you to respect user preferences and disable or reduce animations.

### Location
`src/hooks/useReducedMotion.ts`

### Usage

```tsx
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { motion } from 'framer-motion'

function MyComponent() {
  const prefersReducedMotion = useReducedMotion()
  
  return (
    <motion.div
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
      animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8 }}
    >
      <h1>Content with respectful animations</h1>
    </motion.div>
  )
}
```

### Returns
- `boolean` - `true` if user prefers reduced motion, `false` otherwise

### Testing
To test this hook:
1. **macOS**: System Preferences → Accessibility → Display → Reduce motion
2. **Windows**: Settings → Ease of Access → Display → Show animations
3. **iOS**: Settings → Accessibility → Motion → Reduce Motion

---

## useBreakpoint Hook

### Purpose
Detects the current viewport breakpoint based on window width. Useful for conditional rendering or behavior based on screen size.

### Location
`src/hooks/useBreakpoint.ts`

### Usage

```tsx
import { useBreakpoint, isMobileBreakpoint } from '@/hooks/useBreakpoint'

function MyComponent() {
  const breakpoint = useBreakpoint()
  const isMobile = isMobileBreakpoint(breakpoint)
  
  return (
    <div>
      <p>Current breakpoint: {breakpoint}</p>
      {isMobile ? (
        <MobileMenu />
      ) : (
        <DesktopMenu />
      )}
    </div>
  )
}
```

### Advanced Usage - Conditional Display Limits

```tsx
import { useBreakpoint } from '@/hooks/useBreakpoint'

function DocumentsList({ documents }) {
  const breakpoint = useBreakpoint()
  const isMobile = breakpoint === 'xs' || breakpoint === 'sm'
  
  // Show only 3 items on mobile, 6 on desktop
  const displayLimit = isMobile ? 3 : 6
  
  return (
    <div>
      {documents.slice(0, displayLimit).map(doc => (
        <DocumentCard key={doc.id} document={doc} />
      ))}
    </div>
  )
}
```

### Returns
- `Breakpoint` - One of: `'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'`

### Breakpoint Values
- `xs`: 0px - 639px (small phones like iPhone SE)
- `sm`: 640px - 767px (standard phones)
- `md`: 768px - 1023px (tablets)
- `lg`: 1024px - 1279px (small desktops)
- `xl`: 1280px - 1535px (large desktops)
- `2xl`: 1536px+ (extra large displays)

### Helper Functions

#### `isMobileBreakpoint(breakpoint)`
Returns `true` if breakpoint is `xs` or `sm`

```tsx
const isMobile = isMobileBreakpoint(breakpoint)
```

#### `isTabletBreakpoint(breakpoint)`
Returns `true` if breakpoint is `md`

```tsx
const isTablet = isTabletBreakpoint(breakpoint)
```

#### `isDesktopBreakpoint(breakpoint)`
Returns `true` if breakpoint is `lg`, `xl`, or `2xl`

```tsx
const isDesktop = isDesktopBreakpoint(breakpoint)
```

### Testing
Test by resizing your browser window or using Chrome DevTools device toolbar:
1. Open Chrome DevTools (F12)
2. Click "Toggle device toolbar" (Ctrl+Shift+M)
3. Select different devices or set custom dimensions

---

## useTouchDevice Hook

### Purpose
Detects if the user's device supports touch input. Useful for conditionally showing touch-specific UI or disabling hover effects on touch devices.

### Location
`src/hooks/useTouchDevice.ts`

### Usage

```tsx
import { useTouchDevice, useHoverCapability } from '@/hooks/useTouchDevice'

function MyComponent() {
  const isTouchDevice = useTouchDevice()
  const canHover = useHoverCapability()
  
  return (
    <button
      className={`
        px-4 py-2 rounded
        ${canHover ? 'hover:bg-primary-600' : 'active:bg-primary-600'}
      `}
    >
      {isTouchDevice ? 'Tap me' : 'Click me'}
    </button>
  )
}
```

### Advanced Usage - Conditional Interactions

```tsx
import { useTouchDevice } from '@/hooks/useTouchDevice'
import { useState } from 'react'

function InfoCard() {
  const isTouchDevice = useTouchDevice()
  const [showDetails, setShowDetails] = useState(false)
  
  return (
    <div
      className="card"
      // On touch devices, require tap to show details
      // On hover devices, show on hover
      {...(isTouchDevice 
        ? { onClick: () => setShowDetails(!showDetails) }
        : { onMouseEnter: () => setShowDetails(true), onMouseLeave: () => setShowDetails(false) }
      )}
    >
      <h3>Card Title</h3>
      {showDetails && <p>Detailed information...</p>}
    </div>
  )
}
```

### Returns
- `useTouchDevice()`: `boolean` - `true` if device supports touch
- `useHoverCapability()`: `boolean` - `true` if device can hover

### Testing
- **Touch Device**: Test on actual phone/tablet, or use Chrome DevTools device emulation
- **Non-Touch Device**: Test on desktop with mouse
- **Hybrid Device**: Test on laptop with touchscreen (should detect as touch device)

---

## ExpandableText Component

### Purpose
A reusable component for text truncation with "Show more/less" functionality. Uses CSS line-clamp for clean truncation with ellipsis.

### Location
`src/components/ui/ExpandableText.tsx`

### Basic Usage

```tsx
import { ExpandableText } from '@/components/ui/ExpandableText'

function MyComponent() {
  return (
    <ExpandableText
      text="Your body speaks in whispers through your biomarkers. Listen gently and respond with kindness. This is a longer text that will be truncated on mobile devices."
      maxLines={3}
      className="text-sm text-neutral-600"
    />
  )
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `text` | `string` | **required** | The text content to display |
| `maxLines` | `number` | `3` | Maximum number of lines when collapsed |
| `className` | `string` | `''` | Additional CSS classes for container |
| `expandText` | `string` | `'Show more'` | Text for expand button |
| `collapseText` | `string` | `'Show less'` | Text for collapse button |
| `defaultExpanded` | `boolean` | `false` | Start in expanded state |

### Advanced Usage - Responsive Line Limits

```tsx
import { ExpandableText } from '@/components/ui/ExpandableText'
import { useBreakpoint, isMobileBreakpoint } from '@/hooks/useBreakpoint'

function BiomarkerExplanation({ explanation }) {
  const breakpoint = useBreakpoint()
  const isMobile = isMobileBreakpoint(breakpoint)
  
  return (
    <ExpandableText
      text={explanation}
      maxLines={isMobile ? 2 : 4}  // Fewer lines on mobile
      className="text-sm text-neutral-600 leading-relaxed"
      expandText="Read more"
      collapseText="Read less"
    />
  )
}
```

### Usage in Analysis Page

```tsx
// In biomarker insight card
<ExpandableText
  text={biomarker.explanation || 'No detailed explanation available.'}
  maxLines={3}
  className="text-sm text-neutral-600"
/>
```

### Usage in Documents Page

```tsx
// In document analysis summary
<ExpandableText
  text={document.analysis.summary}
  maxLines={2}
  className="text-sm text-neutral-600 mb-4"
  expandText="View full summary"
  collapseText="Hide summary"
/>
```

### Styling Notes

The component uses the `line-clamp-{n}` utility classes from `globals.css`:
- `line-clamp-1` - Single line with ellipsis
- `line-clamp-2` - Two lines with ellipsis
- `line-clamp-3` - Three lines with ellipsis
- `line-clamp-4` - Four lines with ellipsis

The button uses the `touch-target` class to ensure it meets the 44×44px minimum touch target requirement.

---

## Common Patterns

### Pattern 1: Responsive Content with Multiple Hooks

```tsx
import { useBreakpoint, isMobileBreakpoint } from '@/hooks/useBreakpoint'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useTouchDevice } from '@/hooks/useTouchDevice'
import { motion } from 'framer-motion'

function ResponsiveCard() {
  const breakpoint = useBreakpoint()
  const isMobile = isMobileBreakpoint(breakpoint)
  const prefersReducedMotion = useReducedMotion()
  const isTouchDevice = useTouchDevice()
  
  return (
    <motion.div
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
      animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
      className={`
        card
        ${isMobile ? 'p-4' : 'p-6'}
        ${isTouchDevice ? 'active:scale-95' : 'hover:shadow-lg'}
      `}
    >
      <h3 className={isMobile ? 'text-lg' : 'text-xl'}>Card Title</h3>
      <p>Card content here...</p>
    </motion.div>
  )
}
```

### Pattern 2: Collapsible Sections on Mobile

```tsx
import { useState } from 'react'
import { useBreakpoint, isMobileBreakpoint } from '@/hooks/useBreakpoint'
import { ChevronDown } from 'lucide-react'

function CollapsibleSection({ title, children }) {
  const breakpoint = useBreakpoint()
  const isMobile = isMobileBreakpoint(breakpoint)
  const [isExpanded, setIsExpanded] = useState(!isMobile)
  
  return (
    <div className="bg-white rounded-lg p-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between"
        aria-expanded={isExpanded}
      >
        <h3 className="font-medium text-neutral-800">{title}</h3>
        {isMobile && (
          <ChevronDown 
            className={`h-4 w-4 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        )}
      </button>
      
      {(isExpanded || !isMobile) && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </div>
  )
}
```

### Pattern 3: Adaptive Text Truncation

```tsx
import { ExpandableText } from '@/components/ui/ExpandableText'
import { useBreakpoint } from '@/hooks/useBreakpoint'

function AdaptiveDescription({ description }) {
  const breakpoint = useBreakpoint()
  
  // Determine line limit based on breakpoint
  let maxLines = 4
  if (breakpoint === 'xs' || breakpoint === 'sm') {
    maxLines = 2
  } else if (breakpoint === 'md') {
    maxLines = 3
  }
  
  return (
    <ExpandableText
      text={description}
      maxLines={maxLines}
      className="text-sm text-neutral-600 leading-relaxed"
    />
  )
}
```

---

## Performance Considerations

### 1. **useBreakpoint** - Debouncing (If Needed)

The current implementation updates on every resize event. For most use cases, this is fine. If you experience performance issues with complex components:

```tsx
// Enhanced version with debouncing (optional)
import { useEffect, useState } from 'react'
import { Breakpoint } from './useBreakpoint'

export function useBreakpointDebounced(delay = 150): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('md')
  
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    let timeoutId: NodeJS.Timeout
    
    const updateBreakpoint = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        const width = window.innerWidth
        // ... breakpoint logic
      }, delay)
    }
    
    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)
    return () => {
      window.removeEventListener('resize', updateBreakpoint)
      clearTimeout(timeoutId)
    }
  }, [delay])
  
  return breakpoint
}
```

### 2. **ExpandableText** - Long Content

For extremely long text (>10,000 characters), consider:
- Limiting the text length in the API response
- Using virtual scrolling for expanded state
- Loading full content only when expanded

---

## Accessibility Notes

### All Hooks and Components Follow These Principles:

1. **useReducedMotion**: Respects system-level accessibility preferences
2. **ExpandableText**: 
   - Button has proper `aria-expanded` attribute
   - Button has descriptive `aria-label`
   - Meets 44×44px touch target requirement
3. **Touch Targets**: All interactive elements use `touch-target` class (min 44×44px)

### Testing Accessibility

```bash
# Run accessibility audit
npm run build
npx lighthouse http://localhost:3000 --only-categories=accessibility
```

---

## Integration with Existing Code

### Step 1: Import Where Needed

```tsx
// Example: Dashboard page
import { useBreakpoint, isMobileBreakpoint } from '@/hooks/useBreakpoint'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { ExpandableText } from '@/components/ui/ExpandableText'
```

### Step 2: Use in Component

```tsx
function Dashboard() {
  const breakpoint = useBreakpoint()
  const isMobile = isMobileBreakpoint(breakpoint)
  const prefersReducedMotion = useReducedMotion()
  
  // ... rest of component
}
```

### Step 3: Apply to Existing Elements

```tsx
// Before
<div className="grid grid-cols-4 gap-6">
  {stats.map(stat => <StatCard key={stat.id} stat={stat} />)}
</div>

// After
<div className={`
  ${isMobile ? 'flex flex-col gap-4' : 'grid grid-cols-4 gap-6'}
`}>
  {stats.map(stat => <StatCard key={stat.id} stat={stat} />)}
</div>
```

---

## Testing Guide

### Manual Testing Checklist

- [ ] **useReducedMotion**
  - [ ] Enable "Reduce Motion" in OS settings
  - [ ] Verify animations are disabled
  - [ ] Disable "Reduce Motion"
  - [ ] Verify animations work normally

- [ ] **useBreakpoint**
  - [ ] Test at 375px width (xs)
  - [ ] Test at 640px width (sm)
  - [ ] Test at 768px width (md)
  - [ ] Test at 1024px width (lg)
  - [ ] Verify correct breakpoint returned at each size

- [ ] **useTouchDevice**
  - [ ] Test on desktop with mouse (should be false)
  - [ ] Test on phone/tablet (should be true)
  - [ ] Test on laptop with touchscreen (should be true)

- [ ] **ExpandableText**
  - [ ] Text truncates correctly with ellipsis
  - [ ] "Show more" button appears
  - [ ] Button expands text when clicked
  - [ ] "Show less" button collapses text
  - [ ] Button has adequate touch target (44×44px minimum)

### Automated Testing (Future)

```tsx
// Example test for useBreakpoint
import { renderHook } from '@testing-library/react'
import { useBreakpoint } from '@/hooks/useBreakpoint'

describe('useBreakpoint', () => {
  it('returns correct breakpoint for window width', () => {
    global.innerWidth = 375
    const { result } = renderHook(() => useBreakpoint())
    expect(result.current).toBe('xs')
  })
})
```

---

## Next Steps for Other Agents

### For Agent 2A-2E (Page Optimization Agents)

You can now use these hooks and components in your page optimizations:

```tsx
// Example from Agent 2A (Dashboard)
import { useBreakpoint, isMobileBreakpoint } from '@/hooks/useBreakpoint'
import { ExpandableText } from '@/components/ui/ExpandableText'
import { useReducedMotion } from '@/hooks/useReducedMotion'

function Dashboard() {
  const breakpoint = useBreakpoint()
  const isMobile = isMobileBreakpoint(breakpoint)
  const prefersReducedMotion = useReducedMotion()
  
  // Use in your implementations...
}
```

### For Agent 5B (Animation Optimization)

Apply `useReducedMotion` to all Framer Motion animations:

```tsx
<motion.div
  initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
  animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
  transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8 }}
>
```

---

## Summary

This guide covers the four main utilities created by Agent 1B:

1. **useReducedMotion** - Respect user's motion preferences
2. **useBreakpoint** - Detect viewport size
3. **useTouchDevice** - Detect touch capability
4. **ExpandableText** - Truncate and expand long text

All utilities are:
- ✅ TypeScript-ready with full type definitions
- ✅ Server-side rendering compatible
- ✅ Accessible and follow best practices
- ✅ Performance optimized
- ✅ Well-documented with examples

---

**Agent 1B Status**: ✅ Complete

**Files Created**:
- `src/hooks/useReducedMotion.ts`
- `src/hooks/useBreakpoint.ts`
- `src/hooks/useTouchDevice.ts`
- `src/components/ui/ExpandableText.tsx`
- `MOBILE_HOOKS_USAGE_GUIDE.md` (this file)

**Dependencies**: None
**Dependents**: All Phase 2+ agents can now use these utilities

