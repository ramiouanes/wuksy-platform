# Mobile-Specific Utility Classes Documentation

This document describes all mobile-specific utility classes added to the WUKSY application as part of the mobile responsiveness enhancement (Phase 1, Agent 1C).

---

## Table of Contents

1. [Line Clamp Utilities](#line-clamp-utilities)
2. [Touch Target Utilities](#touch-target-utilities)
3. [Safe Area Utilities](#safe-area-utilities)
4. [Scrollbar Utilities](#scrollbar-utilities)
5. [Mobile Padding Utilities](#mobile-padding-utilities)
6. [Responsive Text Size Utilities](#responsive-text-size-utilities)
7. [Layout Utilities](#layout-utilities)
8. [Breakpoints](#breakpoints)
9. [Existing Classes Enhancements](#existing-classes-enhancements)

---

## Line Clamp Utilities

Truncate text to a specific number of lines with an ellipsis.

### Classes

- `.line-clamp-1` - Truncate to 1 line
- `.line-clamp-2` - Truncate to 2 lines
- `.line-clamp-3` - Truncate to 3 lines
- `.line-clamp-4` - Truncate to 4 lines

### Usage Example

```tsx
<p className="line-clamp-3 text-neutral-600">
  This is a long paragraph that will be truncated to exactly 3 lines 
  with an ellipsis at the end if it exceeds that length. Perfect for 
  preview text in cards or list items.
</p>
```

### Use Cases

- Preview text in document cards
- Biomarker descriptions in collapsed state
- Long explanations in mobile views
- News/update summaries

---

## Touch Target Utilities

Ensure minimum touch target sizes for mobile accessibility (WCAG 2.1 AAA compliance).

### Classes

- `.touch-target` - Minimum 44×44px touch target
- `.touch-target-lg` - Minimum 48×48px touch target (for important actions)

### Usage Example

```tsx
<button className="touch-target p-2 rounded-full hover:bg-neutral-100">
  <X className="h-5 w-5" />
</button>
```

### Use Cases

- Icon-only buttons
- Close buttons in modals
- Delete/remove buttons
- Toggle switches
- Checkbox/radio button containers

### Important Notes

- All interactive elements should meet the 44×44px minimum
- Use `touch-target-lg` for primary CTAs or critical actions
- These classes set `min-height` and `min-width`, so content can be larger

---

## Safe Area Utilities

Handle mobile device notches, rounded corners, and home indicators.

### Classes

- `.safe-area-top` - Adds padding for top notch/status bar
- `.safe-area-bottom` - Adds padding for bottom home indicator
- `.safe-area-left` - Adds padding for left edge (landscape)
- `.safe-area-right` - Adds padding for right edge (landscape)

### Usage Example

```tsx
<header className="sticky top-0 safe-area-top bg-white">
  <div className="px-4 py-3">
    {/* Header content */}
  </div>
</header>

<footer className="safe-area-bottom bg-neutral-900 text-white">
  {/* Footer content */}
</footer>
```

### Use Cases

- Fixed/sticky headers
- Fixed/sticky footers
- Full-screen modals
- Bottom navigation bars
- Floating action buttons

### Important Notes

- Uses CSS `env(safe-area-inset-*)` variables
- Only affects devices with notches/home indicators (iPhone X and newer)
- Has no effect on devices without safe areas

---

## Scrollbar Utilities

Hide scrollbars while maintaining scroll functionality.

### Classes

- `.no-scrollbar` - Hides scrollbar in all browsers

### Usage Example

```tsx
<div className="overflow-x-auto no-scrollbar">
  <div className="flex space-x-2 min-w-max">
    <button>Tab 1</button>
    <button>Tab 2</button>
    <button>Tab 3</button>
    {/* More tabs */}
  </div>
</div>
```

### Use Cases

- Horizontal tab navigation
- Image carousels
- Card sliders
- Category filters
- Any scrollable content where scrollbar is visually distracting

---

## Mobile Padding Utilities

Responsive padding that scales based on screen size.

### Classes

- `.mobile-padding` - `px-4 py-6` on mobile, `px-6 py-8` on tablet, `px-8 py-12` on desktop

### Usage Example

```tsx
<div className="mobile-padding max-w-6xl mx-auto">
  {/* Page content */}
</div>
```

### Use Cases

- Page containers
- Section wrappers
- Content areas
- Modal/dialog bodies

### Breakpoints

- Mobile (default): `px-4 py-6` (16px horizontal, 24px vertical)
- Small (`sm:` ≥640px): `px-6 py-8` (24px horizontal, 32px vertical)
- Medium (`md:` ≥768px): `px-8 py-12` (32px horizontal, 48px vertical)

---

## Responsive Text Size Utilities

Typography classes that scale appropriately on mobile.

### Classes

- `.text-mobile-h1` - Responsive H1 (2xl → 3xl → 4xl)
- `.text-mobile-h2` - Responsive H2 (xl → 2xl → 3xl)
- `.text-mobile-h3` - Responsive H3 (lg → xl → 2xl)

### Usage Example

```tsx
<h1 className="text-mobile-h1 font-light text-neutral-800">
  Welcome to WUKSY
</h1>

<h2 className="text-mobile-h2 font-medium text-neutral-700">
  Your Health Analysis
</h2>

<h3 className="text-mobile-h3 text-neutral-600">
  Recent Biomarkers
</h3>
```

### Size Breakdown

**text-mobile-h1:**
- Mobile: `text-2xl` (1.5rem / 24px)
- Tablet: `text-3xl` (1.875rem / 30px)
- Desktop: `text-4xl` (2.25rem / 36px)

**text-mobile-h2:**
- Mobile: `text-xl` (1.25rem / 20px)
- Tablet: `text-2xl` (1.5rem / 24px)
- Desktop: `text-3xl` (1.875rem / 30px)

**text-mobile-h3:**
- Mobile: `text-lg` (1.125rem / 18px)
- Tablet: `text-xl` (1.25rem / 20px)
- Desktop: `text-2xl` (1.5rem / 24px)

All classes include `leading-tight` for better line height.

---

## Layout Utilities

Responsive layout patterns for mobile-first design.

### Classes

- `.stack-mobile` - Vertical stack on mobile, horizontal flex on desktop

### Usage Example

```tsx
<div className="stack-mobile gap-4">
  <div className="flex-1">
    {/* Main content */}
  </div>
  <div className="w-full md:w-64">
    {/* Sidebar */}
  </div>
</div>
```

### Behavior

- Mobile: `flex flex-col` (stacked vertically)
- Desktop (`md:` ≥768px): `flex-row` (side by side)

### Use Cases

- Content + sidebar layouts
- Form + help text layouts
- Image + description layouts
- Two-column content that should stack on mobile

---

## Breakpoints

All responsive utilities use these Tailwind breakpoints.

### Default Breakpoints

- `xs`: 375px (iPhone SE and small phones)
- `sm`: 640px (Large phones, small tablets)
- `md`: 768px (Tablets)
- `lg`: 1024px (Small laptops)
- `xl`: 1280px (Desktops)
- `2xl`: 1536px (Large desktops)

### New Breakpoint: `xs`

The `xs` breakpoint (375px) was added specifically for targeting very small phones like iPhone SE.

### Usage Example

```tsx
<div className="text-sm xs:text-base sm:text-lg">
  Text scales up from small phones to larger screens
</div>
```

---

## Existing Classes Enhancements

### Enhanced `.card-hover`

The existing `.card-hover` class now includes mobile-friendly active states.

**Before:**
```css
.card-hover {
  @apply transition-all duration-300 hover:shadow-sm hover:translate-y-0;
}
```

**After:**
```css
.card-hover {
  @apply transition-all duration-300 hover:shadow-sm hover:translate-y-0 active:scale-[0.98];
}
```

**New Behavior:**
- On hover (desktop): Subtle shadow and translation
- On tap (mobile): Scales down to 98% for visual feedback

**Usage:**
```tsx
<Card className="card-hover p-6 cursor-pointer">
  {/* Tappable card content */}
</Card>
```

---

## Existing Zen-Inspired Classes

These classes remain unchanged and work perfectly on mobile:

### `.zen-text`
- Applies primary sage green color (`text-primary-600`)
- Use for brand-related text and accents

### `.zen-gradient`
- Background gradient from `primary-50` to `stone-50`
- Use for soft, calm backgrounds in cards and sections

### Health Score Classes

All health score classes remain mobile-friendly:
- `.health-score-poor` (red)
- `.health-score-fair` (amber)
- `.health-score-good` (primary/sage)
- `.health-score-excellent` (emerald)

### Biomarker Status Classes

All biomarker status classes remain mobile-friendly:
- `.biomarker-status-deficient` (red)
- `.biomarker-status-suboptimal` (amber)
- `.biomarker-status-optimal` (primary/sage)
- `.biomarker-status-excess` (orange)
- `.biomarker-status-concerning` (red)

---

## Best Practices

### 1. Touch Targets

Always ensure interactive elements meet the 44×44px minimum:

```tsx
// ✅ Good
<button className="touch-target p-2">
  <Icon className="h-5 w-5" />
</button>

// ❌ Bad
<button className="p-1">
  <Icon className="h-4 w-4" />
</button>
```

### 2. Text Truncation

Use line-clamp for preview text, provide expansion option:

```tsx
// ✅ Good
<div>
  <p className="line-clamp-3">{longText}</p>
  <button onClick={() => setExpanded(true)}>Show more</button>
</div>

// ❌ Bad
<p className="line-clamp-1">{longText}</p> {/* Too aggressive */}
```

### 3. Responsive Padding

Use mobile-padding for consistent spacing:

```tsx
// ✅ Good
<div className="mobile-padding max-w-6xl mx-auto">

// ❌ Bad
<div className="p-8"> {/* Too much padding on mobile */}
```

### 4. Safe Areas

Apply safe area padding to fixed positioned elements:

```tsx
// ✅ Good
<header className="fixed top-0 safe-area-top">

// ❌ Bad
<header className="fixed top-0"> {/* Content behind notch */}
```

### 5. Responsive Text

Use mobile text utilities for headings:

```tsx
// ✅ Good
<h1 className="text-mobile-h1">

// ❌ Bad
<h1 className="text-5xl"> {/* Too large on mobile */}
```

---

## Browser Support

All utilities support:
- ✅ Chrome/Edge (Desktop & Android)
- ✅ Safari (Desktop & iOS)
- ✅ Firefox (Desktop & Android)
- ✅ Samsung Internet

### Safe Area Support
- iOS 11+ (iPhone X and newer)
- Android 9+ (devices with notches)

### Line Clamp Support
- All modern browsers (using `-webkit-line-clamp`)
- Fallback: Normal overflow on very old browsers

---

## Migration Guide

If updating existing code, look for these patterns:

### 1. Manual Line Truncation → Line Clamp

**Before:**
```tsx
<p style={{ 
  overflow: 'hidden', 
  textOverflow: 'ellipsis', 
  whiteSpace: 'nowrap' 
}}>
```

**After:**
```tsx
<p className="line-clamp-1">
```

### 2. Custom Touch Targets → Utility Class

**Before:**
```tsx
<button style={{ minHeight: '44px', minWidth: '44px' }}>
```

**After:**
```tsx
<button className="touch-target">
```

### 3. Fixed Padding → Responsive Padding

**Before:**
```tsx
<div className="px-8 py-12">
```

**After:**
```tsx
<div className="mobile-padding">
```

### 4. Large Headings → Responsive Headings

**Before:**
```tsx
<h1 className="text-4xl md:text-5xl lg:text-6xl">
```

**After:**
```tsx
<h1 className="text-mobile-h1"> {/* Simpler, pre-scaled */}
```

---

## Testing Checklist

When using these utilities, verify:

- [ ] Touch targets are at least 44×44px (use browser DevTools)
- [ ] Text truncates with ellipsis (test with long content)
- [ ] Safe areas work on iPhone with notch (test in simulator)
- [ ] Scrollbars are hidden but scrolling works
- [ ] Padding scales appropriately at all breakpoints
- [ ] Text sizes are readable on small screens (375px width)
- [ ] Active states provide visual feedback on tap

---

## Performance Notes

- All utilities use Tailwind's JIT compiler for optimal bundle size
- Line clamp uses native CSS, no JavaScript needed
- Safe area uses CSS environment variables (zero runtime cost)
- Active states use CSS transforms (GPU-accelerated)

---

## Future Enhancements

Potential additions for future phases:

1. `.line-clamp-5` through `.line-clamp-10` (if needed)
2. `.touch-target-xl` for 56×56px targets (Material Design spec)
3. More responsive spacing utilities (e.g., `.mobile-margin`)
4. Orientation-specific utilities (`.landscape:`, `.portrait:`)
5. Dark mode variants of all utilities

---

## Support

For questions or issues with these utilities:

1. Check this documentation first
2. Verify Tailwind config includes all breakpoints
3. Ensure PostCSS is processing the utilities layer
4. Test in target browsers (especially Safari iOS)

---

**Last Updated:** November 2, 2025  
**Agent:** 1C - Style System Enhancement  
**Phase:** 1 (Foundation)  
**Version:** 1.0.0

