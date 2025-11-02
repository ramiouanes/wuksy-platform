# Agent 5B: Animation Optimization - Testing Guide

## Overview

This guide provides step-by-step instructions for testing the reduced motion functionality implemented by Agent 5B across all pages of the WUKSY application.

## Prerequisites

- Application running locally or on a test server
- Access to browser DevTools
- Ability to change OS accessibility settings

---

## Test Environment Setup

### 1. Enable "Reduce Motion" in Your Operating System

#### macOS
```
1. Open System Settings
2. Go to Accessibility
3. Click on Display
4. Toggle "Reduce motion" ON
```

#### Windows
```
1. Open Settings
2. Go to Accessibility
3. Click on Visual effects
4. Toggle "Animation effects" OFF
```

#### iOS (for mobile testing)
```
1. Open Settings
2. Go to Accessibility
3. Click on Motion
4. Toggle "Reduce Motion" ON
```

#### Android (for mobile testing)
```
1. Open Settings
2. Go to Accessibility
3. Find "Remove animations" or "Animation scale"
4. Set to OFF or 0.5x
```

### 2. Verify Browser Detection

Open your browser's DevTools Console and run:
```javascript
window.matchMedia('(prefers-reduced-motion: reduce)').matches
```
Should return `true` when reduced motion is enabled.

---

## Page-by-Page Testing Checklist

### ✅ Test 1: Dashboard Page (`/dashboard`)

**URL:** `/dashboard`

**Without Reduced Motion:**
- Header fades in from below (y: 20)
- Quick actions fade in with delay
- Health overview card animates in
- Recent documents animate in
- Daily insight animates in
- Quick stats animate in
- Support section animates in

**With Reduced Motion:**
- [ ] All content appears immediately
- [ ] No fade-in or slide-in animations
- [ ] Page loads instantly without delays
- [ ] All functionality works normally

---

### ✅ Test 2: Upload Page (`/upload`)

**URL:** `/upload`

**Without Reduced Motion:**
- Header fades in
- Upload instructions animate in
- Dropzone area animates in
- File list animates with stagger
- Upload button fades in
- Privacy notice animates in

**With Reduced Motion:**
- [ ] All sections appear immediately
- [ ] No animation delays
- [ ] File upload functionality works
- [ ] Progress indicators update without animation

**Special Test:**
- [ ] Upload a file and verify progress shows immediately
- [ ] File processing status updates without animation

---

### ✅ Test 3: Documents Page (`/documents`)

**URL:** `/documents`

**Without Reduced Motion:**
- Header fades in
- Document cards animate in sequence
- Empty state (if no documents) fades in

**With Reduced Motion:**
- [ ] Header appears immediately
- [ ] All document cards visible instantly
- [ ] No staggered loading animation
- [ ] Empty state (if applicable) shows immediately

**Special Test:**
- [ ] Click "Analyze" button on a document
- [ ] Verify progress UI appears without animation

---

### ✅ Test 4: Analysis Detail Page (`/analysis/[id]`)

**URL:** `/analysis/[id]` (replace [id] with actual analysis ID)

**Without Reduced Motion:**
- Header fades in
- Tab navigation animates
- Tab content fades when switching
- Biomarker sidebar slides in
- Supplement sidebar slides in
- Health score card animates
- Quick actions animate
- Analysis details animate
- Disclaimers fade in

**With Reduced Motion:**
- [ ] Page loads completely instantly
- [ ] Tab switching shows new content immediately
- [ ] No sidebar slide-in animations
- [ ] All cards and sections visible immediately

**Special Tests:**
- [ ] Switch between tabs (Overview, Biomarkers, Supplements, Lifestyle)
- [ ] Verify tab content changes immediately
- [ ] Expand/collapse biomarker details
- [ ] Expand/collapse supplement information

---

### ✅ Test 5: Biomarkers Page (`/biomarkers`)

**URL:** `/biomarkers`

**Without Reduced Motion:**
- Header fades in
- Search/filter section animates
- Biomarker cards animate in with stagger
- Expanded details animate (height transition)
- Sidebar sections animate in
- CTA section animates

**With Reduced Motion:**
- [ ] All content appears immediately
- [ ] Search bar is instantly interactive
- [ ] All biomarker cards visible at once
- [ ] Expand/collapse happens instantly
- [ ] Sidebar visible immediately

**Special Tests:**
- [ ] Search for a biomarker
- [ ] Filter by category
- [ ] Expand a biomarker card
- [ ] Verify expanded content appears immediately

---

### ✅ Test 6: Profile Page (`/profile`)

**URL:** `/profile`

**Without Reduced Motion:**
- Header fades in
- Basic information card animates
- Health conditions card animates
- Medications card animates
- Lifestyle factors card animates
- Sidebar cards animate

**With Reduced Motion:**
- [ ] Entire form visible immediately
- [ ] All input fields accessible instantly
- [ ] Sidebar content visible immediately
- [ ] No animation delays

**Special Tests:**
- [ ] Click "Edit Profile"
- [ ] Make changes to fields
- [ ] Click "Save"
- [ ] Verify success/error messages appear immediately

---

### ✅ Test 7: Sign In Page (`/auth/signin`)

**URL:** `/auth/signin`

**Without Reduced Motion:**
- Form container fades in and slides up

**With Reduced Motion:**
- [ ] Form appears immediately
- [ ] All fields visible instantly
- [ ] Social login buttons visible immediately
- [ ] No loading animation

**Special Tests:**
- [ ] Enter credentials
- [ ] Click "Sign In"
- [ ] Verify error messages appear immediately (if any)

---

### ✅ Test 8: Sign Up Page (`/auth/signup`)

**URL:** `/auth/signup`

**Without Reduced Motion:**
- Form container fades in and slides up

**With Reduced Motion:**
- [ ] Form appears immediately
- [ ] All fields visible instantly
- [ ] Checkboxes visible immediately
- [ ] Social login buttons visible immediately

**Special Tests:**
- [ ] Fill out registration form
- [ ] Check agreement boxes
- [ ] Click "Create Account"
- [ ] Verify validation messages appear immediately

---

### ✅ Test 9: How It Works Page (`/how-it-works`)

**URL:** `/how-it-works`

**Without Reduced Motion:**
- Hero section fades in
- Process steps animate in sequence
- Features grid animates
- Sample report cards animate
- FAQ accordion animates when opened

**With Reduced Motion:**
- [ ] All content visible immediately
- [ ] Process steps all visible at once
- [ ] Features grid fully visible
- [ ] FAQ accordion opens/closes instantly

**Special Tests:**
- [ ] Click FAQ questions
- [ ] Verify answers appear immediately without height animation

---

### ✅ Test 10: Coming Soon Page (`/coming-soon`)

**URL:** `/coming-soon`

**Without Reduced Motion:**
- Main content fades in
- "Coming Soon" badge scales
- "Soon" text pulses
- Learn more button has shimmer effect
- Success message fades in
- Scroll indicator bounces

**With Reduced Motion:**
- [ ] Page content appears immediately
- [ ] "Soon" text doesn't pulse
- [ ] Learn more button doesn't shimmer
- [ ] Success message appears immediately (if subscribed)
- [ ] Scroll indicator doesn't bounce

**Special Tests:**
- [ ] Enter email and subscribe
- [ ] Verify success message appears immediately
- [ ] Click "What is Wuksy?" button
- [ ] Verify modal opens immediately
- [ ] Verify modal scroll indicator (if present) doesn't animate

---

## Automated Testing

### Using Browser DevTools

You can simulate reduced motion in Chrome DevTools:

1. Open DevTools (F12 or Cmd+Option+I)
2. Press Cmd+Shift+P (Mac) or Ctrl+Shift+P (Windows) to open Command Palette
3. Type "reduced motion"
4. Select "Emulate CSS prefers-reduced-motion: reduce"

### Testing with JavaScript

Run this in the console to test the hook:

```javascript
// Check if hook detects reduced motion
const checkReducedMotion = () => {
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  console.log('Reduced Motion:', mediaQuery.matches)
  return mediaQuery.matches
}

checkReducedMotion()
```

---

## Visual Comparison Testing

### Without Reduced Motion
1. Disable reduced motion in OS
2. Record a video of navigating through the app
3. Note all animations:
   - Fade-ins
   - Slide-ins
   - Scale effects
   - Staggered sequences
   - Infinite animations

### With Reduced Motion
1. Enable reduced motion in OS
2. Record a video of navigating through the same pages
3. Verify:
   - Content appears immediately
   - No animation delays
   - No jarring transitions
   - Functionality intact

### Expected Difference
- **Without:** Smooth animations throughout
- **With:** Instant content appearance, no motion

---

## Performance Testing

### Measure Impact

1. Open Chrome DevTools
2. Go to Performance tab
3. Record page load with reduced motion OFF
4. Record page load with reduced motion ON
5. Compare:
   - Time to Interactive (TTI)
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)

**Expected Results:**
- With reduced motion ON, pages should load slightly faster
- No JavaScript errors
- No console warnings

---

## Accessibility Testing

### Screen Reader Testing

1. Enable screen reader (NVDA, JAWS, VoiceOver)
2. Enable reduced motion
3. Navigate through pages
4. Verify:
   - Content is announced immediately
   - No delays in announcements
   - Correct reading order

### Keyboard Navigation

1. Enable reduced motion
2. Use Tab key to navigate
3. Verify:
   - Focus indicators visible immediately
   - No animation delays
   - All interactive elements reachable

---

## Cross-Browser Testing Matrix

| Browser | Version | OS | Status |
|---------|---------|-----|--------|
| Chrome | 120+ | macOS | ⬜ To Test |
| Chrome | 120+ | Windows | ⬜ To Test |
| Firefox | 120+ | macOS | ⬜ To Test |
| Firefox | 120+ | Windows | ⬜ To Test |
| Safari | 17+ | macOS | ⬜ To Test |
| Safari | 17+ | iOS | ⬜ To Test |
| Edge | 120+ | Windows | ⬜ To Test |
| Chrome | Latest | Android | ⬜ To Test |

---

## Common Issues & Troubleshooting

### Issue 1: Animations Still Playing
**Symptom:** Animations continue despite reduced motion being enabled  
**Check:**
- Verify OS setting is enabled
- Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
- Check browser DevTools console for errors
- Verify `window.matchMedia('(prefers-reduced-motion: reduce)').matches` returns `true`

### Issue 2: Content Not Appearing
**Symptom:** Content disappears when reduced motion is enabled  
**Check:**
- Look for JavaScript errors in console
- Verify the `prefersReducedMotion` variable is properly initialized
- Check that all motion components have fallback empty objects `{}`

### Issue 3: Delayed Content
**Symptom:** Content still has delays even with reduced motion  
**Check:**
- Verify transition duration is set to 0: `{ duration: 0 }`
- Look for setTimeout or setInterval that might be delaying content
- Check for CSS animations that might not be controlled by JS

---

## Reporting Issues

When reporting issues, please include:

1. **Page URL**
2. **Browser & Version**
3. **OS & Version**
4. **Reduced Motion Status** (enabled/disabled)
5. **Expected Behavior**
6. **Actual Behavior**
7. **Screenshots/Video** (if possible)
8. **Console Errors** (if any)
9. **Steps to Reproduce**

---

## Testing Checklist Summary

- [ ] All 10 pages tested with reduced motion OFF
- [ ] All 10 pages tested with reduced motion ON
- [ ] Visual comparison completed
- [ ] Performance impact measured
- [ ] Screen reader tested
- [ ] Keyboard navigation tested
- [ ] Cross-browser testing completed
- [ ] Mobile devices tested
- [ ] No console errors
- [ ] All functionality working
- [ ] Documentation updated with findings

---

## Sign-off

**Tester Name:** ________________  
**Date:** ________________  
**Overall Status:** ⬜ Pass / ⬜ Fail  
**Notes:** ________________

---

**End of Agent 5B Testing Guide**

