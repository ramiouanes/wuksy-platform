# Agent 4A: Header Component Testing Guide

## Overview
This guide provides step-by-step instructions for testing the Header component mobile optimizations.

---

## Prerequisites

### 1. Start Development Server
```bash
cd mvp-2/project
npm run dev
```
Server should start on `http://localhost:3000`

### 2. Required Tools
- Modern browser (Chrome, Firefox, Safari)
- Browser DevTools (F12)
- Screen reader (optional, for accessibility testing)

---

## Test Suite 1: Visual & Animation Testing

### Test 1.1: Mobile Menu Animation
**Viewport:** 375px width (iPhone SE)

**Steps:**
1. Open browser DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M or Cmd+Shift+M)
3. Select "iPhone SE" or set custom width to 375px
4. Navigate to any page on the site
5. Click the hamburger menu icon (☰)

**Expected Results:**
- ✅ Menu icon animates to X icon
- ✅ Semi-transparent backdrop fades in smoothly (200ms)
- ✅ Menu slides in from top (200ms)
- ✅ Backdrop has blur effect
- ✅ Menu appears above backdrop
- ✅ No layout shift
- ✅ Animation is smooth (60fps, no jank)

**Pass Criteria:**
All animations complete smoothly within 200ms

---

### Test 1.2: Backdrop Tap-to-Close
**Viewport:** 375px width

**Steps:**
1. Open mobile menu (from Test 1.1)
2. Click/tap anywhere on the semi-transparent backdrop (outside menu)

**Expected Results:**
- ✅ Menu closes immediately
- ✅ Backdrop fades out smoothly
- ✅ Menu slides out smoothly
- ✅ X icon changes back to hamburger icon

**Pass Criteria:**
Menu closes when backdrop is tapped

---

### Test 1.3: Menu Item Navigation
**Viewport:** 375px width

**Steps:**
1. Open mobile menu
2. Click "How It Works" link

**Expected Results:**
- ✅ Menu closes automatically
- ✅ Navigation happens to /how-it-works
- ✅ Close animation is smooth

**Pass Criteria:**
Menu closes and navigation works

---

### Test 1.4: Responsive Logo Sizing
**Viewports:** Multiple

**Steps:**
1. Set viewport to 375px width
2. Measure logo height (should be ~32px)
3. Set viewport to 640px width
4. Measure logo height (should be ~40px)
5. Set viewport to 1024px width
6. Measure logo height (should remain ~40px)

**Expected Results:**
- ✅ 375px (xs): Logo is 32px tall
- ✅ 640px (sm): Logo is 40px tall
- ✅ 768px (md): Logo is 40px tall
- ✅ 1024px (lg): Logo is 40px tall

**Pass Criteria:**
Logo scales appropriately at breakpoints

---

## Test Suite 2: Interaction Testing

### Test 2.1: Multiple Open/Close Cycles
**Viewport:** 375px width

**Steps:**
1. Open menu → Close with backdrop tap
2. Open menu → Close with X button
3. Open menu → Close with menu item click
4. Repeat cycle 5 times

**Expected Results:**
- ✅ Menu opens/closes reliably each time
- ✅ No memory leaks (check DevTools Memory tab)
- ✅ No console errors
- ✅ Animations remain smooth
- ✅ State management works correctly

**Pass Criteria:**
Menu works consistently across multiple cycles

---

### Test 2.2: Menu Button States
**Viewport:** 375px width

**Steps:**
1. Observe menu button in closed state (☰ icon)
2. Click to open menu (should show X icon)
3. Click X to close (should show ☰ icon)
4. Repeat several times

**Expected Results:**
- ✅ Icon toggles correctly
- ✅ Button responds immediately to clicks
- ✅ No double-click required
- ✅ Button remains tappable (44×44px touch target)

**Pass Criteria:**
Button states toggle correctly

---

### Test 2.3: Authenticated vs. Unauthenticated Menu
**Viewport:** 375px width

**Steps:**
1. **When signed out:**
   - Open menu
   - Verify menu shows: "Sign In" and "Get Started" buttons
2. **When signed in:**
   - Sign in to the app
   - Open menu
   - Verify menu shows: "Dashboard", "Documents", "Profile", "Sign Out"

**Expected Results:**
- ✅ Unauthenticated: Shows sign in/sign up buttons
- ✅ Authenticated: Shows dashboard, documents, profile, sign out
- ✅ Menu structure changes based on auth state
- ✅ All buttons functional

**Pass Criteria:**
Menu content adapts to authentication state

---

## Test Suite 3: Accessibility Testing

### Test 3.1: ARIA Labels (Visual Inspection)
**Viewport:** Any

**Steps:**
1. Open DevTools → Elements tab
2. Inspect mobile menu button (☰)
3. Check attributes

**Expected Results:**
- ✅ Has `aria-label="Open menu"` when closed
- ✅ Has `aria-label="Close menu"` when open
- ✅ Has `aria-expanded="false"` when closed
- ✅ Has `aria-expanded="true"` when open
- ✅ Backdrop has `aria-hidden="true"`

**Pass Criteria:**
All ARIA attributes present and correct

---

### Test 3.2: Screen Reader Testing (Optional)
**Tools:** NVDA (Windows), JAWS (Windows), VoiceOver (Mac/iOS)

**Steps:**
1. Enable screen reader
2. Navigate to header with Tab key
3. Focus on mobile menu button
4. Listen to announcement
5. Press Enter to open menu
6. Listen to announcement

**Expected Results:**
- ✅ Button announces as "Open menu, button"
- ✅ When pressed, announces "Close menu, button, expanded"
- ✅ Menu items are navigable with Tab
- ✅ Menu items announce their text and link role

**Pass Criteria:**
Screen reader provides clear context

---

### Test 3.3: Keyboard Navigation
**Viewport:** 375px width

**Steps:**
1. Tab to mobile menu button
2. Press Enter (should open menu)
3. Tab through menu items
4. Tab to X button
5. Press Enter (should close menu)

**Expected Results:**
- ✅ Can open menu with keyboard
- ✅ Can navigate menu items with Tab
- ✅ Can close menu with keyboard
- ✅ Focus visible on all interactive elements
- ✅ Focus order is logical

**Pass Criteria:**
Full keyboard accessibility

---

## Test Suite 4: Responsive Breakpoint Testing

### Test 4.1: Desktop View (≥ 768px)
**Viewport:** 1024px width

**Steps:**
1. Set viewport to 1024px
2. Observe header

**Expected Results:**
- ✅ Mobile menu button is hidden
- ✅ Desktop navigation is visible (horizontal)
- ✅ Logo is 40px tall
- ✅ All navigation links visible in header
- ✅ User actions (Sign In/Profile) visible in header

**Pass Criteria:**
Desktop navigation works correctly

---

### Test 4.2: Tablet View (640px - 767px)
**Viewport:** 640px width

**Steps:**
1. Set viewport to 640px (tablet portrait)
2. Observe header

**Expected Results:**
- ✅ Mobile menu button is visible (not hidden)
- ✅ Logo is 40px tall
- ✅ Mobile menu functionality works
- ✅ Layout doesn't break

**Pass Criteria:**
Tablet view uses mobile menu

---

### Test 4.3: Small Phone (375px - 639px)
**Viewport:** 375px width

**Steps:**
1. Set viewport to 375px
2. Test all mobile menu functionality

**Expected Results:**
- ✅ Mobile menu button visible
- ✅ Logo is 32px tall (smaller)
- ✅ Mobile menu works
- ✅ No content overflow
- ✅ No horizontal scroll

**Pass Criteria:**
Small phone view fully functional

---

### Test 4.4: Extra Small Phone (< 375px)
**Viewport:** 320px width

**Steps:**
1. Set viewport to 320px (iPhone SE in landscape, or very small devices)
2. Test header and mobile menu

**Expected Results:**
- ✅ Logo doesn't overflow
- ✅ Menu button visible and tappable
- ✅ Mobile menu opens correctly
- ✅ Menu items don't overflow
- ✅ Buttons in menu are full-width and tappable

**Pass Criteria:**
Works on very small screens

---

## Test Suite 5: Cross-Browser Testing

### Test 5.1: Chrome/Chromium
**Browser:** Chrome (latest version)

**Steps:**
1. Open site in Chrome
2. Run Tests 1.1 through 1.4
3. Check console for errors

**Expected Results:**
- ✅ All animations smooth
- ✅ Backdrop blur works
- ✅ No console errors
- ✅ 60fps animations

---

### Test 5.2: Firefox
**Browser:** Firefox (latest version)

**Steps:**
1. Open site in Firefox
2. Run Tests 1.1 through 1.4
3. Check console for errors

**Expected Results:**
- ✅ All animations smooth
- ✅ Backdrop blur works
- ✅ No console errors
- ✅ Animations performant

---

### Test 5.3: Safari (macOS)
**Browser:** Safari (latest version)

**Steps:**
1. Open site in Safari
2. Run Tests 1.1 through 1.4
3. Check console for errors

**Expected Results:**
- ✅ All animations smooth
- ✅ Backdrop blur works (Safari has best blur support)
- ✅ No console errors
- ✅ Touch gestures work on trackpad

---

### Test 5.4: Safari (iOS)
**Device:** iPhone (real device or simulator)

**Steps:**
1. Open site in Safari on iPhone
2. Run Tests 1.1 through 1.4
3. Test with actual touch input

**Expected Results:**
- ✅ Touch interactions work
- ✅ Backdrop blur works
- ✅ No visual glitches
- ✅ Animations smooth
- ✅ No horizontal scroll
- ✅ No layout shift when menu opens

---

## Test Suite 6: Performance Testing

### Test 6.1: Animation Frame Rate
**Tool:** Chrome DevTools Performance tab

**Steps:**
1. Open DevTools → Performance tab
2. Start recording
3. Open and close menu 5 times
4. Stop recording
5. Analyze frame rate

**Expected Results:**
- ✅ Consistently 60fps during animations
- ✅ No dropped frames
- ✅ No long tasks (>50ms)
- ✅ Smooth animation curve

**Pass Criteria:**
60fps maintained during all animations

---

### Test 6.2: Memory Leaks
**Tool:** Chrome DevTools Memory tab

**Steps:**
1. Take heap snapshot
2. Open/close menu 20 times
3. Take another heap snapshot
4. Compare snapshots

**Expected Results:**
- ✅ Memory usage stays stable
- ✅ No significant memory increase
- ✅ Event listeners cleaned up properly

**Pass Criteria:**
No memory leaks detected

---

### Test 6.3: Bundle Size Impact
**Tool:** Build output or webpack-bundle-analyzer

**Steps:**
1. Check bundle size before/after changes
2. Verify Framer Motion is already in bundle

**Expected Results:**
- ✅ No additional bundle size (Framer Motion already included)
- ✅ Code changes minimal (~100 lines)
- ✅ No new dependencies added

**Pass Criteria:**
Minimal or zero bundle size impact

---

## Test Suite 7: Edge Cases

### Test 7.1: Rapid Open/Close
**Steps:**
1. Rapidly click menu button 10 times in quick succession
2. Observe behavior

**Expected Results:**
- ✅ Menu state toggles correctly
- ✅ No animation glitches
- ✅ No stuck states
- ✅ Animations queue properly (AnimatePresence handles this)

**Pass Criteria:**
No crashes or stuck states

---

### Test 7.2: Window Resize While Menu Open
**Steps:**
1. Open mobile menu (width < 768px)
2. Resize window to desktop width (≥ 768px)
3. Observe behavior

**Expected Results:**
- ✅ Mobile menu hidden at desktop widths
- ✅ Desktop navigation appears
- ✅ No JavaScript errors
- ✅ State resets cleanly

**Pass Criteria:**
Graceful handling of resize

---

### Test 7.3: Backdrop Click During Animation
**Steps:**
1. Click to open menu
2. Immediately click backdrop before animation completes

**Expected Results:**
- ✅ Menu closes gracefully
- ✅ No animation glitches
- ✅ No stuck states
- ✅ Close animation plays from current state

**Pass Criteria:**
Handles interruption gracefully

---

### Test 7.4: Long Menu Content
**Steps:**
1. Simulate scenario where menu would be very long
   (This would require auth state with all menu items visible)
2. Open menu

**Expected Results:**
- ✅ Menu is scrollable if needed
- ✅ Backdrop still covers entire screen
- ✅ Menu doesn't overflow viewport
- ✅ Close button remains accessible

**Pass Criteria:**
Long content handled gracefully

---

## Test Suite 8: Integration Testing

### Test 8.1: Works on All Pages
**Steps:**
1. Navigate to each page:
   - Landing page (/)
   - How It Works (/how-it-works)
   - Biomarkers (/biomarkers)
   - Dashboard (/dashboard)
   - Documents (/documents)
   - Profile (/profile)
   - Upload (/upload)
   - Analysis (/analysis/[id])
   - Coming Soon (/coming-soon)
2. Test mobile menu on each page

**Expected Results:**
- ✅ Menu works identically on all pages
- ✅ Active route highlighted (if implemented)
- ✅ No page-specific bugs
- ✅ Consistent behavior

**Pass Criteria:**
Menu works on all pages

---

### Test 8.2: Auth Integration
**Steps:**
1. Test menu while signed out
2. Sign in
3. Test menu while signed in
4. Sign out
5. Test menu after signing out

**Expected Results:**
- ✅ Menu content updates immediately after auth state change
- ✅ No need to refresh page
- ✅ Sign Out button works from mobile menu
- ✅ Navigation to Dashboard/Documents works

**Pass Criteria:**
Auth integration works correctly

---

## Automated Testing Checklist

### TypeScript Check
```bash
npm run type-check
```
**Expected:** ✅ No TypeScript errors

### Linting Check
```bash
npm run lint
```
**Expected:** ✅ No ESLint errors

### Build Check
```bash
npm run build
```
**Expected:** ✅ Build succeeds without errors

---

## Bug Report Template

If you find a bug, use this template:

```markdown
## Bug: [Brief Description]

**Severity:** [Critical / High / Medium / Low]

**Test:** [Which test case from this guide]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:**


**Actual Behavior:**


**Screenshots:**


**Environment:**
- Browser: 
- Viewport: 
- OS: 
- Device: 

**Console Errors:**


**Additional Context:**

```

---

## Test Results Summary

After completing all tests, fill out this summary:

### Visual & Animation (Suite 1)
- [ ] Test 1.1: Mobile Menu Animation
- [ ] Test 1.2: Backdrop Tap-to-Close
- [ ] Test 1.3: Menu Item Navigation
- [ ] Test 1.4: Responsive Logo Sizing

### Interaction (Suite 2)
- [ ] Test 2.1: Multiple Open/Close Cycles
- [ ] Test 2.2: Menu Button States
- [ ] Test 2.3: Authenticated vs. Unauthenticated

### Accessibility (Suite 3)
- [ ] Test 3.1: ARIA Labels
- [ ] Test 3.2: Screen Reader (Optional)
- [ ] Test 3.3: Keyboard Navigation

### Responsive (Suite 4)
- [ ] Test 4.1: Desktop View
- [ ] Test 4.2: Tablet View
- [ ] Test 4.3: Small Phone
- [ ] Test 4.4: Extra Small Phone

### Cross-Browser (Suite 5)
- [ ] Test 5.1: Chrome
- [ ] Test 5.2: Firefox
- [ ] Test 5.3: Safari (macOS)
- [ ] Test 5.4: Safari (iOS)

### Performance (Suite 6)
- [ ] Test 6.1: Animation Frame Rate
- [ ] Test 6.2: Memory Leaks
- [ ] Test 6.3: Bundle Size

### Edge Cases (Suite 7)
- [ ] Test 7.1: Rapid Open/Close
- [ ] Test 7.2: Window Resize
- [ ] Test 7.3: Backdrop Click During Animation
- [ ] Test 7.4: Long Menu Content

### Integration (Suite 8)
- [ ] Test 8.1: Works on All Pages
- [ ] Test 8.2: Auth Integration

---

## Quick Smoke Test (5 minutes)

If you only have 5 minutes, run this minimal test:

1. ✅ Open mobile menu at 375px width
2. ✅ Verify animations are smooth
3. ✅ Tap backdrop to close
4. ✅ Verify logo is 32px tall at 375px
5. ✅ Verify logo is 40px tall at 640px
6. ✅ Check console for errors (should be 0)
7. ✅ Test on one other browser

---

## Resources

- **DevTools Device Emulation:** F12 → Ctrl+Shift+M (Cmd+Shift+M on Mac)
- **DevTools Performance:** F12 → Performance tab
- **DevTools Memory:** F12 → Memory tab
- **Lighthouse:** F12 → Lighthouse tab
- **Screen Readers:** 
  - Windows: NVDA (free), JAWS
  - macOS: VoiceOver (built-in, Cmd+F5)
  - iOS: VoiceOver (Settings → Accessibility)

---

**Testing Guide Version:** 1.0  
**Agent:** 4A  
**Date:** November 2, 2025  
**Status:** Ready for QA

