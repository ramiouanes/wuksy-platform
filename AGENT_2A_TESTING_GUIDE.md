# Agent 2A: Dashboard Page - Testing Guide

## Quick Start Testing

### 1. Start Development Server
```bash
cd mvp-2/project
npm run dev
```

### 2. Navigate to Dashboard
```
http://localhost:3000/dashboard
```
(You'll need to sign in first if not authenticated)

---

## Device Testing Matrix

### Mobile Phones

#### iPhone SE (375px width)
**Chrome DevTools:** 
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select "iPhone SE" from device dropdown
4. Refresh page

**Expected Results:**
- ✅ Stats display vertically (stacked, not grid)
- ✅ Each stat takes full width
- ✅ Text is text-xl (not text-2xl)
- ✅ Support section shows with chevron down icon
- ✅ Support content is collapsed by default
- ✅ Tapping header expands support section
- ✅ Chevron rotates 180° when expanded
- ✅ Today's Insight shows "Show more" button after 2 lines
- ✅ No horizontal scroll
- ✅ Padding is reduced (py-8 not py-12)

#### iPhone 14 Pro (393px width)
Same tests as iPhone SE.

#### iPhone 14 Pro Max (430px width)
Same tests as iPhone SE.

#### Samsung Galaxy S23 (360px width - smallest)
**CRITICAL TEST** - This is the most constrained viewport.
- Verify all content fits without overflow
- Verify buttons are still tappable
- Verify text is still readable

---

### Tablets

#### iPad Mini Portrait (744px width - Small Tablet)
**Chrome DevTools:** Select "iPad Mini" and rotate to portrait

**Expected Results:**
- ✅ Stats display as 2×2 grid (sm:grid-cols-2)
- ✅ Text is text-2xl
- ✅ Support section always visible (no chevron, no collapse)
- ✅ Today's Insight still has "Show more" but starts expanded
- ✅ Cards have full padding (sm:p-8)

---

### Desktop

#### Desktop (1024px+)
**Expected Results:**
- ✅ Stats display as 1×4 grid (md:grid-cols-4)
- ✅ All four stats in a single row
- ✅ Support section always visible
- ✅ No chevron icon visible
- ✅ Full padding and spacing
- ✅ "View All Analyses" button visible

---

## Feature-Specific Testing

### 1. Stats Grid Layout

**Test Steps:**
1. Start at 375px width
2. Note stats are vertical (flex-col)
3. Resize to 640px
4. Note stats become 2×2 grid
5. Resize to 768px
6. Note stats become 1×4 grid

**Pass Criteria:**
- Smooth transition between layouts
- No layout shift or jank
- Numbers remain centered
- Labels remain visible

---

### 2. ExpandableText (Today's Insight)

**Test Steps:**
1. Load page on mobile (375px)
2. Find "Today's Insight" card
3. Verify text is truncated after 2 lines
4. Verify "Show more" button is visible
5. Tap "Show more"
6. Verify full text displays
7. Verify button changes to "Show less"
8. Tap "Show less"
9. Verify text truncates again

**Pass Criteria:**
- Truncation is clean (no cut-off mid-word if possible)
- Button is easily tappable (44×44px touch target)
- Transition is smooth
- No layout shift when expanding/collapsing

---

### 3. Support Section Collapse

**Test Steps:**
1. Load page on mobile (375px)
2. Find "Caring Support" card
3. Verify chevron down icon is visible
4. Verify support text is NOT visible
5. Tap the "Caring Support" header
6. Verify content expands
7. Verify chevron rotates 180° (points up)
8. Verify "Get Support" button is visible
9. Tap header again
10. Verify content collapses
11. Resize to 768px (tablet/desktop)
12. Verify chevron disappears
13. Verify content is always visible

**Pass Criteria:**
- Header is tappable (full width, 44px+ height)
- Chevron only visible on mobile (xs/sm breakpoints)
- Content shows/hides smoothly
- Desktop behavior: always visible, no interaction

**Accessibility:**
- aria-expanded attribute toggles correctly
- aria-label is descriptive
- Button is keyboard accessible (test with Tab key)

---

### 4. Reduced Motion

**Test Steps:**
1. Open System Preferences (macOS) or Settings (Windows)
2. Enable "Reduce Motion" / "Show animations in Windows"
3. Reload dashboard page
4. Verify no fade-in animations occur
5. Verify content appears immediately
6. Disable reduced motion
7. Reload page
8. Verify animations work normally

**macOS:**
System Preferences > Accessibility > Display > Reduce motion

**Windows:**
Settings > Ease of Access > Display > Show animations in Windows (turn OFF)

**Pass Criteria:**
- With reduced motion: No animations, instant appearance
- Without reduced motion: Smooth fade-in with stagger
- Content is accessible in both cases

---

### 5. Touch Targets

**Test on actual mobile device or use touch emulation:**

**Elements to test:**
1. ExpandableText "Show more" button
2. Support section header (collapse button)
3. Quick Action cards
4. Analysis item cards
5. "View Documents" button

**Pass Criteria:**
- All interactive elements are at least 44×44px
- Elements are easily tappable with thumb
- No mis-taps on adjacent elements
- 8px minimum spacing between tap targets

**How to verify:**
- Chrome DevTools: Enable "Show rulers" in device toolbar
- Measure element height/width in inspector
- All buttons should have min-h-[44px] or touch-target class

---

## Responsive Design Testing

### Breakpoint Transitions

**Test at these exact widths:**
- 374px (just below sm)
- 375px (mobile)
- 639px (just below sm)
- 640px (sm breakpoint)
- 767px (just below md)
- 768px (md breakpoint)
- 1023px (just below lg)
- 1024px (lg breakpoint)

**At each width, verify:**
- No horizontal scroll
- No broken layouts
- Text is readable
- Images/icons display correctly
- Spacing looks natural

---

## Browser Testing

### Chrome (Priority 1)
- Desktop Chrome
- Chrome on Android

### Safari (Priority 1 - iOS)
- Safari on iPhone
- Safari on iPad
- Safari on macOS

**iOS-specific checks:**
- Touch targets work well
- Animations smooth
- No webkit-specific bugs

### Firefox (Priority 2)
- Desktop Firefox

### Edge (Priority 3)
- Desktop Edge

---

## Performance Testing

### Lighthouse Audit

**Run Lighthouse:**
1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Select "Mobile" device
4. Select "Performance" and "Accessibility"
5. Click "Generate report"

**Target Scores:**
- Performance: > 80
- Accessibility: > 95
- Best Practices: > 90

**Key Metrics:**
- First Contentful Paint: < 2s
- Largest Contentful Paint: < 3s
- Cumulative Layout Shift: < 0.1

---

## Accessibility Testing

### Screen Reader

**Test with:**
- NVDA (Windows - free)
- VoiceOver (macOS/iOS - built-in)
- TalkBack (Android - built-in)

**Navigate to:**
1. Support section button
2. ExpandableText button
3. Quick action cards

**Verify:**
- All interactive elements are announced
- Button states are communicated (expanded/collapsed)
- Purpose of each button is clear

### Keyboard Navigation

**Test Steps:**
1. Load page
2. Press Tab key repeatedly
3. Verify focus moves through all interactive elements
4. Press Enter/Space on support section header
5. Verify it expands/collapses
6. Press Enter on ExpandableText button
7. Verify text expands

**Pass Criteria:**
- All interactive elements are keyboard accessible
- Focus indicator is visible
- Tab order is logical
- Enter/Space keys activate buttons

---

## Visual Regression Testing

**Take screenshots at:**
1. 375px width (mobile)
2. 640px width (tablet)
3. 1024px width (desktop)

**Compare:**
- Stats layout changes appropriately
- No text overflow
- No broken images
- Consistent spacing
- Brand colors maintained (zen colors, neutrals)

---

## Error Scenarios

### No Data
1. Test with new user (no analyses)
2. Verify empty state displays correctly
3. Verify "Begin Your Journey" message
4. Verify "Upload Blood Test" button works

### One Analysis
1. Test with exactly one analysis
2. Verify stats display correctly
3. Verify trend is "0%" or hidden
4. Verify no "View All" button appears

### Many Analyses
1. Test with 10+ analyses
2. Verify only 5 most recent show
3. Verify "View All Analyses" button appears
4. Verify scroll performance is good

---

## Common Issues to Watch For

### Layout Issues
- [ ] Horizontal scroll on any viewport
- [ ] Text overflow (truncated without ellipsis)
- [ ] Buttons not fully visible
- [ ] Cards overlapping
- [ ] Inconsistent spacing

### Interaction Issues
- [ ] Buttons not tappable (too small)
- [ ] Accidental taps on adjacent elements
- [ ] Collapse animation jerky
- [ ] ExpandableText not working
- [ ] Support section not collapsing on mobile

### Performance Issues
- [ ] Animations causing lag
- [ ] Large layout shift when content loads
- [ ] Slow rendering on low-end devices

### Accessibility Issues
- [ ] Focus indicator not visible
- [ ] Screen reader doesn't announce buttons
- [ ] Keyboard navigation doesn't work
- [ ] Color contrast too low

---

## Quick Smoke Test (2 minutes)

**Essential checks:**
1. ✅ Page loads without errors
2. ✅ Stats display (any layout)
3. ✅ At least one analysis shows (if data exists)
4. ✅ Tap/click any button - it works
5. ✅ No console errors
6. ✅ No horizontal scroll at 375px
7. ✅ Support section interactive on mobile
8. ✅ ExpandableText "Show more" button works

---

## Reporting Issues

**If you find a bug, report:**
1. Device/browser (e.g., "iPhone SE, Safari 16")
2. Viewport width (e.g., "375px")
3. Expected behavior
4. Actual behavior
5. Screenshot or video
6. Steps to reproduce

**Example:**
```
Device: iPhone 14 Pro, Safari 17
Viewport: 393px width
Expected: Support section should collapse on mobile
Actual: Support section always visible, no chevron icon
Steps:
1. Load /dashboard on iPhone 14 Pro
2. Scroll to "Caring Support" card
3. Observe no chevron, content visible
```

---

## Sign-off Checklist

Before marking as complete:
- [ ] Tested on at least 2 mobile devices (or emulated)
- [ ] Tested on at least 1 tablet
- [ ] Tested on desktop (1024px+)
- [ ] Verified stats grid layout at all breakpoints
- [ ] Verified ExpandableText works
- [ ] Verified Support section collapse works
- [ ] Verified reduced motion works
- [ ] No horizontal scroll at any width
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Lighthouse score > 80 (performance)
- [ ] Lighthouse score > 95 (accessibility)
- [ ] All touch targets ≥ 44×44px
- [ ] Keyboard navigation works
- [ ] Screen reader announces interactive elements

---

**Agent 2A Implementation Status:** ✅ Complete  
**Testing Status:** 🔄 Ready for Manual Testing

Good luck! 🚀

