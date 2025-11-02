# Agent 3A: Auth Pages - Visual Testing Guide

## Quick Testing Instructions

### Prerequisites
1. Start the development server: `npm run dev`
2. Open Chrome DevTools (F12)
3. Enable Device Toolbar (Ctrl+Shift+M or Cmd+Shift+M)

---

## Test 1: Sign-In Page (`/auth/signin`)

### Mobile Testing (375px - iPhone SE)
1. Set viewport to **375px × 667px**
2. Navigate to `/auth/signin`

**Verify:**
- [ ] Logo is smaller (h-10) and fits comfortably
- [ ] Heading "Welcome Back to WUKSY" is readable (text-2xl)
- [ ] Description text is smaller (text-sm)
- [ ] "Continue with Google" button text doesn't overflow
- [ ] "Continue with Facebook" button text doesn't overflow
- [ ] Icons are proportional (w-4 h-4)
- [ ] Card has less padding (p-6) - more content visible
- [ ] Email input shows email keyboard when focused
- [ ] Password visibility toggle button is easy to tap (44×44px target)
- [ ] "Remember me" and "Forgot password" stack vertically
- [ ] No horizontal scrollbar appears

### Tablet Testing (768px - iPad)
1. Set viewport to **768px × 1024px**
2. Navigate to `/auth/signin`

**Verify:**
- [ ] Logo is larger (h-12)
- [ ] Heading is larger (text-3xl)
- [ ] Description is base size (text-base)
- [ ] Button text is larger (text-base)
- [ ] Icons are larger (w-5 h-5)
- [ ] "Remember me" and "Forgot password" are on same line
- [ ] Card has more padding (p-8)

### Desktop Testing (1440px)
1. Set viewport to **1440px × 900px**
2. Navigate to `/auth/signin`

**Verify:**
- [ ] All elements use desktop sizing
- [ ] Card is centered with max-w-md constraint
- [ ] Layout looks balanced and not too spread out

---

## Test 2: Sign-Up Page (`/auth/signup`)

### Mobile Testing (375px - iPhone SE)
1. Set viewport to **375px × 667px**
2. Navigate to `/auth/signup`

**Verify:**
- [ ] Logo is smaller (h-10)
- [ ] Heading "Join WUKSY Today" is readable (text-2xl)
- [ ] Description text is smaller (text-sm)
- [ ] Benefits list displays properly with icons
- [ ] "Continue with Google" button text doesn't overflow
- [ ] Card has less padding (p-6)
- [ ] All form fields are easily accessible
- [ ] Email input shows email keyboard when focused
- [ ] Name field shows text keyboard (no special keyboard)
- [ ] Password visibility toggles are easy to tap (44×44px target)
- [ ] Checkboxes have adequate touch area
- [ ] "I consent to health data processing" has shorter text
- [ ] "(details)" button is visible and tappable
- [ ] Clicking "(details)" shows/hides expandable info box
- [ ] Expandable info box has gray background and proper spacing
- [ ] "Anonymous data use for research (optional)" text is shorter
- [ ] Terms and Privacy links are underlined
- [ ] No horizontal scrollbar appears

### Expandable Details Test
1. Stay on mobile viewport (375px)
2. Click the "(details)" button next to "I consent to health data processing"

**Verify:**
- [ ] Gray info box appears below the checkbox
- [ ] Text reads: "Your health data will be processed for personalized analysis. You can delete your data at any time."
- [ ] Box has neutral background (bg-neutral-50)
- [ ] Box has proper indentation (ml-6)
- [ ] Text is small but readable (text-xs)
- [ ] Clicking "(details)" again hides the box

### Tablet Testing (768px - iPad)
1. Set viewport to **768px × 1024px**
2. Navigate to `/auth/signup`

**Verify:**
- [ ] Logo is larger (h-12)
- [ ] Heading is larger (text-3xl)
- [ ] Button text is larger (text-base)
- [ ] Icons are larger (w-5 h-5)
- [ ] Card has more padding (p-8)
- [ ] All checkboxes still work properly

### Desktop Testing (1440px)
1. Set viewport to **1440px × 900px**
2. Navigate to `/auth/signup`

**Verify:**
- [ ] All elements use desktop sizing
- [ ] Form is comfortable to fill out
- [ ] Card is centered with max-w-md constraint

---

## Test 3: Touch Target Verification

### Password Visibility Toggles
1. On mobile (375px), navigate to `/auth/signin`
2. Tap the eye icon next to the password field

**Verify:**
- [ ] Button has 44×44px minimum touch target
- [ ] Icon changes from Eye to EyeOff (or vice versa)
- [ ] Password text becomes visible/hidden
- [ ] No accidental clicks on nearby elements

### Checkboxes (Sign-Up)
1. On mobile (375px), navigate to `/auth/signup`
2. Tap each checkbox

**Verify:**
- [ ] Each checkbox has min-w-[16px]
- [ ] Checkbox is easy to tap without accidentally clicking the label link
- [ ] Checkboxes toggle properly

### Links
1. Test all links on mobile
2. Verify they're easy to tap without zooming

**Verify:**
- [ ] Terms of Service link is tappable
- [ ] Privacy Policy link is tappable
- [ ] Forgot password link is tappable
- [ ] Sign up / Sign in footer links are tappable

---

## Test 4: Keyboard and Input Behavior

### Email Input
1. On mobile device or simulator
2. Focus the email input field

**Verify:**
- [ ] Email keyboard appears (with @ and . keys easily accessible)
- [ ] `inputMode="email"` is working
- [ ] AutoComplete suggests saved email addresses (if any saved)

### Name Input (Sign-Up)
1. On mobile device or simulator
2. Focus the name input field

**Verify:**
- [ ] Standard keyboard appears
- [ ] AutoComplete suggests saved names (if any saved)

### Password Input
1. On mobile device or simulator
2. Focus the password input field

**Verify:**
- [ ] Standard keyboard appears
- [ ] AutoComplete suggests saved passwords (if any saved)
- [ ] On sign-in: Suggests passwords for this domain
- [ ] On sign-up: Offers to save new password

---

## Test 5: Responsive Breakpoint Transitions

### Smooth Transitions
1. Open `/auth/signin` at 375px width
2. Slowly resize browser to 1440px width
3. Watch for any layout shifts or jumps

**Verify:**
- [ ] Logo smoothly transitions from h-10 to h-12 at sm breakpoint (640px)
- [ ] Heading smoothly transitions from text-2xl to text-3xl at sm
- [ ] Button text smoothly transitions from text-sm to text-base at sm
- [ ] Icons smoothly transition from w-4 h-4 to w-5 h-5 at sm
- [ ] No layout shift or content jumping
- [ ] Card padding transitions smoothly at sm

### Critical Breakpoints
Test at these specific widths:
- **374px**: Just below iPhone SE (should still work)
- **375px**: iPhone SE (primary mobile target)
- **390px**: iPhone 12/13/14 standard
- **430px**: iPhone 14 Pro Max
- **639px**: Just below sm breakpoint
- **640px**: sm breakpoint (should see size changes)
- **768px**: md breakpoint (tablet)

---

## Test 6: Accessibility

### Screen Reader Testing (Optional but Recommended)
1. Enable screen reader (VoiceOver on Mac, NVDA on Windows)
2. Navigate through the form using Tab key

**Verify:**
- [ ] All form fields announce their labels
- [ ] Password visibility toggle announces "Hide password" or "Show password"
- [ ] Data consent details button announces "Show data consent details"
- [ ] Checkboxes announce their state (checked/unchecked)
- [ ] Required fields are indicated

### Keyboard Navigation
1. Navigate through form using only Tab and Enter keys

**Verify:**
- [ ] Can tab through all interactive elements
- [ ] Tab order is logical (top to bottom)
- [ ] Focus indicators are visible
- [ ] Can toggle password visibility with Enter/Space
- [ ] Can check/uncheck checkboxes with Space
- [ ] Can submit form with Enter

---

## Test 7: Edge Cases

### Long Text
1. Try entering very long text in input fields

**Verify:**
- [ ] Text doesn't overflow container
- [ ] Input fields handle long text gracefully

### Button Text Overflow
1. Test with smaller viewports (320px if possible)

**Verify:**
- [ ] "Continue with Google" doesn't break to multiple lines
- [ ] Text truncates properly with `truncate` class
- [ ] Icons don't shrink with `flex-shrink-0`

### Multiple Form Errors
1. Submit sign-up form without filling any fields

**Verify:**
- [ ] Error message displays properly
- [ ] Error doesn't cause layout shift
- [ ] Error is readable on mobile

---

## Test 8: Cross-Browser Testing

### Chrome (Android Simulation)
1. Open DevTools → Device Toolbar
2. Select "Pixel 5" or similar Android device
3. Test both sign-in and sign-up

### Safari (iOS Simulation)
1. If on Mac, use Safari's Responsive Design Mode
2. Select "iPhone 14 Pro" or similar
3. Test both sign-in and sign-up

**Verify:**
- [ ] Layout is consistent across browsers
- [ ] Email keyboard works on both iOS and Android
- [ ] Touch targets work properly
- [ ] No browser-specific rendering issues

---

## Quick Visual Regression Checklist

Before/After comparison:
- [ ] Mobile layout is MORE compact (less wasted space)
- [ ] Text is MORE readable on mobile (not too small or too large)
- [ ] Buttons don't overflow or wrap awkwardly
- [ ] Touch targets are LARGER and easier to tap
- [ ] Form is MORE user-friendly on mobile
- [ ] No NEW horizontal scroll issues
- [ ] Desktop experience remains unchanged

---

## Automated Testing (Optional)

If you have Playwright or Cypress set up:

```javascript
// Test sign-in page mobile
test('sign-in page is mobile responsive', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/auth/signin');
  
  // Logo should be smaller on mobile
  const logo = await page.locator('img[alt="WUKSY Logo"]');
  await expect(logo).toHaveClass(/h-10/);
  
  // Heading should be smaller on mobile
  const heading = await page.locator('h1');
  await expect(heading).toHaveClass(/text-2xl/);
  
  // Password toggle should be visible and tappable
  const toggle = await page.locator('button[aria-label*="password"]');
  await expect(toggle).toBeVisible();
  const box = await toggle.boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
});

// Test expandable data consent details
test('data consent details toggle works', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/auth/signup');
  
  // Details box should not be visible initially
  const detailsBox = await page.locator('text=Your health data will be processed');
  await expect(detailsBox).not.toBeVisible();
  
  // Click details button
  await page.click('button:has-text("(details)")');
  
  // Details box should now be visible
  await expect(detailsBox).toBeVisible();
  
  // Click details button again
  await page.click('button:has-text("(details)")');
  
  // Details box should be hidden again
  await expect(detailsBox).not.toBeVisible();
});
```

---

## Issue Reporting Template

If you find any issues during testing, report them using this format:

```
### Issue Title
Brief description of the issue

**Device/Browser:** iPhone SE / Chrome 118
**Viewport:** 375px × 667px
**Page:** /auth/signin
**Steps to Reproduce:**
1. Navigate to /auth/signin
2. Tap the password visibility toggle
3. Observe...

**Expected Behavior:**
Password should toggle visibility

**Actual Behavior:**
Button is too small to tap accurately

**Screenshot:** [Attach if possible]

**Priority:** High/Medium/Low
```

---

## Sign-Off Checklist

Before marking Agent 3A as complete:
- [ ] All tests pass on mobile (375px)
- [ ] All tests pass on tablet (768px)
- [ ] All tests pass on desktop (1440px)
- [ ] No TypeScript errors
- [ ] No linter errors
- [ ] No console errors or warnings
- [ ] All touch targets are 44×44px or larger
- [ ] All interactive elements are keyboard accessible
- [ ] Email keyboards work on mobile
- [ ] AutoComplete attributes work
- [ ] Expandable details work correctly
- [ ] No horizontal scroll on any viewport
- [ ] Visual regression check passes

---

**Testing completed by:** _________________  
**Date:** _________________  
**Status:** ✅ Pass / ❌ Fail (with issues documented)

