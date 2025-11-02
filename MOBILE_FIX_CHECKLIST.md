# WUKSY Mobile Fix Checklist

Use this checklist to track progress on mobile responsiveness fixes.

---

## Components

### `src/components/ui/Button.tsx`
- [ ] Add minimum touch target size (44×44px)
- [ ] Add `sm`, `md`, `lg` size variants with proper mobile scaling
- [ ] Ensure proper spacing between adjacent buttons
- [ ] Add press/active state for mobile (not just hover)
- [ ] Test with VoiceOver/TalkBack for accessibility

**Code changes needed:**
```tsx
// Add minimum touch target
className={cn(
  'min-h-[44px] min-w-[44px]',  // Mobile touch target
  'inline-flex items-center justify-center',
  // ... rest of styles
)}
```

---

### `src/components/layout/Header.tsx`
- [ ] Add backdrop for mobile menu (close on backdrop tap)
- [ ] Add slide-in animation for mobile menu
- [ ] Test logo size on very small screens (<375px)
- [ ] Consider bottom tab navigation alternative for authenticated users
- [ ] Add proper ARIA labels for mobile menu toggle

**Lines to modify:** 84-167 (mobile menu section)

---

### `src/components/layout/Footer.tsx`
- [ ] Reduce footer height on mobile (currently 4 sections × ~6 links each)
- [ ] Consider collapsible sections for mobile
- [ ] Ensure legal disclaimer text is readable (currently `text-sm`)
- [ ] Test all footer links are tappable with minimum 44px touch target

**Lines to modify:** 8-112 (entire footer grid)

---

## Pages

### `src/app/coming-soon/page.tsx`
- [ ] Make logo responsive (currently fixed `h-24`)
  - **Line 88:** Add `h-16 sm:h-20 md:h-24` instead of `h-24`
- [ ] Modal full-screen on mobile
  - **Line 260:** Add `inset-0 sm:inset-auto sm:top-1/2...`
- [ ] Fix scroll indicator for mobile
  - **Lines 275-305:** Test on iOS Safari with address bar
- [ ] Implement swipe-to-dismiss for modal
- [ ] Form input height optimization for landscape
  - **Lines 179, 417:** Test in landscape mode

**Priority:** High (first impression page)

---

### `src/app/dashboard/page.tsx`
- [ ] Change stat grid from 2×2 to vertical stack on mobile
  - **Line 293:** Change `grid-cols-2 md:grid-cols-4` to `flex flex-col md:grid md:grid-cols-4`
  - **Line 295:** Reduce number size `text-2xl` to `text-xl md:text-2xl`
- [ ] Truncate "Today's Insight" text with "Show more"
  - **Lines 429-438:** Add line-clamp-3 and expand button
- [ ] Simplify Journey Stats labels
  - **Lines 452-481:** Shorter labels on mobile
- [ ] Collapse support section by default on mobile
  - **Lines 486-501:** Add collapsible wrapper
- [ ] Quick action cards spacing
  - **Lines 227-271:** Test on narrow screens

**Priority:** High (main dashboard)

---

### `src/app/upload/page.tsx`
- [ ] Reduce dropzone padding on mobile
  - **Line 413:** Change `p-12` to `p-6 sm:p-8 md:p-12`
  - **Line 424:** Icon size `h-12 w-12` to `h-8 w-8 md:h-12 md:w-12`
- [ ] Simplify file processing UI
  - **Lines 457-546:** Reduce vertical height of cards
  - **Line 672:** Progress section `min-h-[12rem]` too tall, reduce to `min-h-[8rem]` on mobile
- [ ] Collapse AI reasoning by default (currently implemented but test)
  - **Lines 484-518:** Ensure works well on mobile
- [ ] Reduce AI metrics badge size
  - **Lines 522-533:** Consider showing count only on mobile
- [ ] Optimize supported formats section
  - **Lines 369-402:** Reduce icon/text size on mobile

**Priority:** High (critical user flow)

---

### `src/app/documents/page.tsx`
- [ ] Simplify document cards
  - **Lines 564-809:** Very complex, needs major simplification
- [ ] Show max 3 biomarkers on mobile (not 6)
  - **Line 599:** Change `slice(0, 6)` to `slice(0, 3)` on mobile
  - **Line 624:** Update "+X more" text accordingly
- [ ] Collapse analysis summary by default
  - **Lines 634-655:** Add expand/collapse
- [ ] Simplify progress UI for running analysis
  - **Lines 672-794:** Reduce height and complexity
  - **Line 672:** Move min-height to larger breakpoint
- [ ] Move action buttons to top of card (easier to reach)
  - **Lines 659-807:** Reorder on mobile
- [ ] Test nested collapsible sections on mobile
  - **Lines 716-755:** AI reasoning in progress section

**Priority:** Critical (most complex page)

---

### `src/app/biomarkers/page.tsx`
- [ ] Move sidebar to bottom on mobile
  - **Line 238:** Change flex order
  ```tsx
  <div className="flex flex-col lg:flex-row gap-8">
    <div className="order-2 lg:order-1 flex-1">{/* Main */}</div>
    <div className="order-1 lg:order-2 lg:w-80">{/* Sidebar */}</div>
  </div>
  ```
- [ ] Optimize filter bar for mobile
  - **Lines 244-321:** Test all controls fit on narrow screens
  - Tab buttons adequate spacing
- [ ] Cards: show essentials only, expand for details
  - **Lines 323-517:** Already has expand, verify works well
- [ ] Truncate aliases properly
  - **Lines 352-356:** Test long alias lists
- [ ] Reduce expanded card content on mobile
  - **Lines 417-512:** Consider shorter descriptions on mobile

**Priority:** Medium (exploration page)

---

### `src/app/analysis/[id]/page.tsx`
- [ ] Major simplification needed (1,954 lines!)
  - **Entire file:** This is the most complex page
- [ ] Implement clear tab navigation
  - Add tab bar at top with Biomarkers, Supplements, Lifestyle
  - Current nested tab structure too complex
- [ ] Show priority biomarkers only by default
  - Add "Show all" button to reveal complete list
  - Filter to show deficient/suboptimal/concerning first
- [ ] Truncate supplement details
  - Show name, dosage, priority by default
  - Expand for rationale, interactions, contraindications
- [ ] Simplify lifestyle recommendations
  - Show category tabs (Diet, Exercise, Sleep, Stress)
  - Each category: show 3 top recommendations
  - "Show more" for complete list
- [ ] Reduce text in expanded biomarker cards
  - Show essential info, link to biomarkers page for full details
- [ ] Test all nested expand/collapse states on mobile
  - Ensure user doesn't lose context when expanded

**Priority:** Critical (extremely text-heavy)

**Suggested Approach:** Break into smaller components
```
/analysis/[id]/
  - components/
    - BiomarkerSection.tsx
    - SupplementSection.tsx
    - LifestyleSection.tsx
  - page.tsx (just tab navigation and section routing)
```

---

### `src/app/profile/page.tsx`
- [ ] Optimize header buttons for mobile
  - **Lines 260-303:** Ensure buttons don't wrap
  - Test "Save Changes" and "Edit Profile" button text
- [ ] Form field label optimization
  - **Lines 312-404:** Reduce verbose labels if possible
- [ ] Tag input optimization for mobile
  - **Lines 407-492:** Test with long health condition names
  - Ensure delete buttons have proper touch targets
- [ ] Lifestyle factors dropdown optimization
  - **Lines 494-589:** Test long option text wrapping
- [ ] Privacy notice - collapse by default on mobile?
  - **Lines 596-616:** Consider collapsible
- [ ] Supplement preferences section spacing
  - **Lines 618-686:** Test on narrow screens

**Priority:** Medium (profile is important but less frequently accessed)

---

### `src/app/auth/signin/page.tsx` & `signup/page.tsx`
- [ ] Social login buttons spacing
  - **signin Lines 109-136, signup Lines 139-154:** Test icon + text spacing
- [ ] Optimize signup checkbox text
  - **signup Lines 232-293:** Long agreement texts wrap awkwardly
  - Consider shorter text with "Learn more" links
- [ ] Benefits list optimization
  - **signup Lines 123-136:** Good pattern, verify spacing
- [ ] Password visibility toggle position
  - Both pages: Test on various screen sizes
- [ ] Form max-width on very small screens
  - Both pages: Verify `max-w-md` works well

**Priority:** High (conversion-critical pages)

---

### `src/app/how-it-works/page.tsx`
- [ ] Reduce hero text size on mobile
  - **Line 130:** `text-4xl md:text-5xl` is large, test on small phones
- [ ] Process steps vertical spacing
  - **Lines 153-217:** Steps stack vertically creating long page
  - Consider shorter descriptions or "Learn more" links
- [ ] Features grid optimization
  - **Lines 236-261:** Single column on mobile - verify it's not too long
- [ ] Sample report cards spacing
  - **Lines 282-340:** Three cards in column on mobile
- [ ] Implement FAQ accordion (CRITICAL)
  - **Lines 345-380:** Currently all answers visible
  - Add expand/collapse to each FAQ item
  ```tsx
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)
  
  {faqs.map(faq => (
    <Card key={faq.question} onClick={() => setExpandedFaq(...)}>
      <h3>{faq.question}</h3>
      {expandedFaq === faq.question && <p>{faq.answer}</p>}
    </Card>
  ))}
  ```

**Priority:** Medium (informational page)

---

### `src/app/admin/page.tsx`
- [ ] Header mobile optimization
  - **Lines 278-308:** Test title + buttons on mobile
- [ ] Tab navigation for mobile
  - **Lines 267-274:** Six tabs need horizontal scroll or dropdown
- [ ] Data tables → card view for mobile
  - **Throughout:** Tables don't work on mobile, need alternative
- [ ] Stat cards responsive
  - **Overview section:** Optimize for mobile

**Priority:** Low (admin is desktop-focused, but should not break)

**Note:** Consider separate mobile admin view or tablet-minimum requirement

---

## Utilities & Hooks

### Create: `src/hooks/useReducedMotion.ts`
- [ ] Create reduced motion detection hook
- [ ] Apply to all Framer Motion animations
- [ ] Test with macOS/iOS "Reduce Motion" enabled

```tsx
import { useEffect, useState } from 'react'

export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    
    const listener = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }
    
    mediaQuery.addEventListener('change', listener)
    return () => mediaQuery.removeEventListener('change', listener)
  }, [])
  
  return prefersReducedMotion
}
```

---

### Create: `src/components/ui/ResponsiveModal.tsx`
- [ ] Create reusable modal component
- [ ] Full-screen on mobile, centered on desktop
- [ ] Backdrop tap to close
- [ ] Swipe-to-dismiss on mobile
- [ ] Proper focus management

```tsx
interface ResponsiveModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export function ResponsiveModal({ isOpen, onClose, children }: ResponsiveModalProps) {
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute inset-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-2xl md:max-h-[90vh] md:rounded-2xl bg-white overflow-y-auto">
        <button
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-100"
          onClick={onClose}
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>
  )
}
```

---

### Create: `src/components/ui/ExpandableText.tsx`
- [ ] Create reusable expandable text component
- [ ] Line clamp with "Show more" button
- [ ] Smooth animation on expand

```tsx
interface ExpandableTextProps {
  text: string
  maxLines?: number
  className?: string
}

export function ExpandableText({ text, maxLines = 3, className = '' }: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false)
  
  return (
    <div className={className}>
      <p className={expanded ? '' : `line-clamp-${maxLines}`}>
        {text}
      </p>
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-primary-600 hover:text-primary-700 text-sm mt-2"
      >
        {expanded ? 'Show less' : 'Show more'}
      </button>
    </div>
  )
}
```

---

## Global Styles

### `src/app/globals.css`
- [ ] Add mobile-specific utility classes
- [ ] Add line-clamp utilities if not already present
- [ ] Verify scrollbar styles work on mobile

```css
/* Add to globals.css */
@layer utilities {
  /* Line clamp utilities for mobile */
  .line-clamp-1 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
  }
  
  .line-clamp-2 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  
  .line-clamp-3 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
  }
  
  /* Mobile touch target minimum */
  .touch-target {
    @apply min-h-[44px] min-w-[44px];
  }
  
  /* Safe area for mobile notches */
  .safe-area-top {
    padding-top: env(safe-area-inset-top);
  }
  
  .safe-area-bottom {
    padding-bottom: env(safe-area-inset-bottom);
  }
}
```

---

## Configuration

### `tailwind.config.js`
- [ ] Verify breakpoints are appropriate
  - `sm: 640px` ✓
  - `md: 768px` ✓
  - `lg: 1024px` ✓
  - `xl: 1280px` ✓
- [ ] Add custom mobile-specific utilities if needed
- [ ] Consider adding `xs` breakpoint for very small phones (375px)

```js
// Add to tailwind.config.js if needed
module.exports = {
  theme: {
    screens: {
      'xs': '375px',  // iPhone SE and similar
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
  },
}
```

---

## Testing Checklist

### Device Testing
Test on these specific devices/sizes:
- [ ] iPhone SE (375px width) - Small phones
- [ ] iPhone 14 Pro (393px width) - Standard phones
- [ ] iPhone 14 Pro Max (430px width) - Large phones
- [ ] Samsung Galaxy S23 (360px width) - Android standard
- [ ] iPad Mini Portrait (744px width) - Small tablets
- [ ] iPad Pro Portrait (1024px width) - Large tablets

### Orientation Testing
- [ ] Portrait mode (primary)
- [ ] Landscape mode (especially on phones <600px height)

### Browser Testing
- [ ] Safari iOS (most critical - iOS Safari has specific issues)
- [ ] Chrome Android
- [ ] Chrome iOS
- [ ] Firefox Mobile
- [ ] Samsung Internet

### Accessibility Testing
- [ ] VoiceOver (iOS) - Test all key user flows
- [ ] TalkBack (Android) - Test all key user flows
- [ ] Keyboard navigation - Tab through forms and interactive elements
- [ ] Color contrast - Use Chrome DevTools or axe DevTools
- [ ] Font scaling - Test with browser font size at 150%, 200%
- [ ] Reduced motion - Enable in OS settings and test animations

### Performance Testing
- [ ] Lighthouse mobile audit (target >90 score)
- [ ] Test on 3G connection (Chrome DevTools network throttling)
- [ ] Test on low-end device (if available)
- [ ] Check bundle size (should be <1MB for mobile)
- [ ] Monitor FPS during animations and scrolling (target >55fps)

---

## React Native Preparation (Phase 3)

### Abstraction Layer
- [ ] Create platform-specific component structure
  ```
  src/components/ui/Button/
    - Button.interface.ts
    - Button.web.tsx
    - Button.native.tsx
    - index.ts
  ```
- [ ] Abstract navigation calls
- [ ] Create API client independent of fetch/Next.js
- [ ] Document all web-specific dependencies

### Web-Specific Dependencies to Replace
- [ ] `react-dropzone` → `react-native-document-picker`
- [ ] `URL.createObjectURL` → `react-native-fs`
- [ ] `TextDecoderStream` → Custom chunked parsing
- [ ] `scrollIntoView` → `ScrollView.scrollTo`
- [ ] `framer-motion` → `react-native-reanimated`
- [ ] `next/image` → React Native `Image`
- [ ] `next/link` → React Navigation
- [ ] CSS modules → StyleSheet

---

## Measurement

### Before Starting
- [ ] Run Lighthouse mobile audit (baseline)
- [ ] Measure bounce rate on mobile (if analytics available)
- [ ] Record current mobile conversion rate
- [ ] Note current major pain points from users

### After Each Phase
- [ ] Re-run Lighthouse mobile audit
- [ ] Test on real devices
- [ ] Collect user feedback
- [ ] Measure improvement in key metrics

### Success Criteria
- [ ] Lighthouse mobile score >90
- [ ] All touch targets >44×44px
- [ ] No horizontal scrolling (except intentional tabs)
- [ ] All text readable at default size
- [ ] All modals fit on screen
- [ ] Forms completable without zooming
- [ ] Page load <3s on 3G
- [ ] No layout shift on page load

---

## Quick Reference: Priority Order

1. **Week 1:** Button touch targets, text truncation, modal fixes
2. **Week 2:** Dashboard, upload, documents page optimization
3. **Week 3:** Analysis page simplification (biggest effort)
4. **Week 4:** Biomarkers, profile, auth pages
5. **Week 5:** How it works, footer, header improvements
6. **Week 6-8:** React Native preparation (abstractions)
7. **Week 9-10:** Accessibility and polish
8. **Week 11-12:** Testing and validation

---

## Notes

- Mark items as complete with `[x]` instead of `[ ]`
- Add notes about issues encountered during implementation
- Link to specific commits/PRs for each fix
- Document any deviations from plan

**Example:**
```
- [x] Dashboard stat grid to vertical
  - Commit: abc123
  - Note: Also reduced font size to text-xl on mobile
  - Issue: Had to adjust spacing, added gap-4
```

---

**Last Updated:** November 2, 2025  
**Next Review:** After Phase 1 completion (Week 2)

