# WUKSY Accessibility Best Practices Guide

**Maintained By:** Agent 5A  
**Last Updated:** November 2, 2025  
**Purpose:** Guide for maintaining and enhancing accessibility in future development

---

## Quick Reference

### Essential Rules

1. ✅ **Every icon-only button needs `aria-label`**
2. ✅ **Every form input needs a `label` with `htmlFor`**
3. ✅ **Every expand/collapse button needs `aria-expanded`**
4. ✅ **Every modal needs `role="dialog"` and `aria-modal="true"`**
5. ✅ **Every loading state needs `aria-busy`**
6. ✅ **Every dynamic update needs `aria-live`**
7. ✅ **Every decorative icon needs `aria-hidden="true"`**
8. ✅ **Every active navigation link needs `aria-current="page"`**

---

## Component Patterns

### 1. Icon-Only Buttons

**Bad ❌:**
```tsx
<button onClick={handleDelete}>
  <Trash2 className="h-4 w-4" />
</button>
```

**Good ✅:**
```tsx
<button 
  onClick={handleDelete}
  aria-label="Delete item"
>
  <Trash2 className="h-4 w-4" />
</button>
```

### 2. Expand/Collapse Buttons

**Bad ❌:**
```tsx
<button onClick={() => setExpanded(!expanded)}>
  Show Details
  <ChevronDown className={expanded ? 'rotate-180' : ''} />
</button>
```

**Good ✅:**
```tsx
<button 
  onClick={() => setExpanded(!expanded)}
  aria-expanded={expanded}
  aria-label={expanded ? 'Collapse details' : 'Expand details'}
>
  Show Details
  <ChevronDown 
    className={expanded ? 'rotate-180' : ''} 
    aria-hidden="true"
  />
</button>
```

### 3. Form Inputs

**Use the Input Component:**
```tsx
import Input from '@/components/ui/Input'

<Input
  label="Email Address"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={errors.email}
  helperText="We'll never share your email"
/>
```

The Input component automatically handles:
- Label association with `htmlFor`
- Error announcements with `role="alert"`
- Error association with `aria-describedby`
- Invalid state with `aria-invalid`

### 4. Modals/Dialogs

**Use the ResponsiveModal Component:**
```tsx
import { ResponsiveModal } from '@/components/ui/ResponsiveModal'

<ResponsiveModal
  isOpen={isOpen}
  onClose={handleClose}
  title="Modal Title"
>
  {/* Modal content */}
</ResponsiveModal>
```

The ResponsiveModal component automatically handles:
- `role="dialog"`
- `aria-modal="true"`
- `aria-labelledby` (when title provided)
- Focus trapping
- Escape key to close

### 5. Loading States

**Bad ❌:**
```tsx
<div className="loading-spinner">
  <Loader2 className="animate-spin" />
</div>
```

**Good ✅:**
```tsx
<div aria-busy="true" aria-live="polite">
  <Loader2 className="animate-spin" />
  <span className="sr-only">Loading...</span>
</div>
```

### 6. Status Messages

**Bad ❌:**
```tsx
{status === 'success' && <p>Upload complete!</p>}
```

**Good ✅:**
```tsx
<div aria-live="polite" aria-atomic="true">
  {status === 'success' && <p>Upload complete!</p>}
  {status === 'error' && <p role="alert">Upload failed!</p>}
</div>
```

**Politeness Levels:**
- `aria-live="polite"` - Announces when user is idle (most common)
- `aria-live="assertive"` - Announces immediately (errors, critical alerts)
- `aria-live="off"` - Don't announce (default)

### 7. Navigation Links

**Use with Next.js Link:**
```tsx
import { usePathname } from 'next/navigation'

const pathname = usePathname()

<Link 
  href="/dashboard"
  aria-current={pathname === '/dashboard' ? 'page' : undefined}
>
  Dashboard
</Link>
```

### 8. Lists

**Bad ❌:**
```tsx
<div>
  {items.map(item => (
    <div key={item.id}>{item.name}</div>
  ))}
</div>
```

**Good ✅:**
```tsx
<ul role="list">
  {items.map(item => (
    <li key={item.id}>{item.name}</li>
  ))}
</ul>
```

### 9. Tabs

**Pattern:**
```tsx
<div role="tablist">
  <button
    role="tab"
    aria-selected={activeTab === 'overview'}
    aria-controls="overview-panel"
    onClick={() => setActiveTab('overview')}
  >
    Overview
  </button>
  <button
    role="tab"
    aria-selected={activeTab === 'details'}
    aria-controls="details-panel"
    onClick={() => setActiveTab('details')}
  >
    Details
  </button>
</div>

<div 
  id="overview-panel"
  role="tabpanel"
  hidden={activeTab !== 'overview'}
>
  Overview content
</div>
```

---

## Testing Your Work

### Quick Screen Reader Test

**Windows (NVDA - Free):**
1. Download NVDA from https://www.nvaccess.org/
2. Install and launch
3. Navigate your page with Tab key
4. Listen to announcements

**macOS (VoiceOver - Built-in):**
1. Press Cmd + F5 to enable VoiceOver
2. Navigate with Tab or Ctrl + Option + Arrow keys
3. Listen to announcements

**Key Things to Listen For:**
- Are buttons labeled correctly?
- Are form errors announced?
- Are loading states communicated?
- Are navigation links clear?
- Can you complete tasks without seeing the screen?

### Browser DevTools

**Chrome Accessibility Inspector:**
1. Open DevTools (F12)
2. Go to "Elements" tab
3. Look for "Accessibility" panel
4. Inspect elements to see ARIA tree

**Lighthouse Audit:**
1. Open DevTools (F12)
2. Go to "Lighthouse" tab
3. Select "Accessibility" only
4. Click "Generate report"
5. Fix any issues with score < 95

---

## Common Mistakes to Avoid

### ❌ Don't Do This

1. **Using divs as buttons:**
```tsx
<div onClick={handleClick}>Click me</div>
```

2. **Missing alt text:**
```tsx
<img src="logo.png" />
```

3. **Using placeholder as label:**
```tsx
<input type="email" placeholder="Email" />
```

4. **Color-only indicators:**
```tsx
<span className="text-red-500">Error</span>
```

5. **Keyboard traps:**
```tsx
<input onKeyDown={(e) => e.preventDefault()} />
```

6. **Automatic focus stealing:**
```tsx
useEffect(() => {
  inputRef.current?.focus() // Don't do this on every render!
}, [])
```

### ✅ Do This Instead

1. **Use semantic HTML:**
```tsx
<button onClick={handleClick}>Click me</button>
```

2. **Always include alt text:**
```tsx
<img src="logo.png" alt="WUKSY Logo" />
```

3. **Use proper labels:**
```tsx
<label htmlFor="email">Email</label>
<input id="email" type="email" placeholder="your@email.com" />
```

4. **Use icons + text or aria-label:**
```tsx
<span className="text-red-500">
  <AlertCircle className="inline h-4 w-4" aria-hidden="true" />
  Error: Invalid input
</span>
```

5. **Allow keyboard navigation:**
```tsx
<input onKeyDown={(e) => {
  if (e.key === 'Enter') handleSubmit()
}} />
```

6. **Focus intentionally:**
```tsx
const handleModalOpen = () => {
  setIsOpen(true)
  // Only focus when explicitly opening modal
}
```

---

## Touch Target Sizes

All interactive elements should meet minimum sizes:

- **Minimum:** 44×44px (WCAG 2.1 Level AA)
- **Recommended:** 48×48px (better for all users)

**Use the touch-target utility class:**
```tsx
<button className="touch-target">
  <Icon className="h-4 w-4" />
</button>
```

Or apply manually:
```tsx
<button className="min-h-[44px] min-w-[44px]">
  <Icon className="h-4 w-4" />
</button>
```

---

## Screen Reader Only Text

**Use the sr-only class:**
```tsx
<button>
  <span className="sr-only">Delete</span>
  <Trash2 className="h-4 w-4" aria-hidden="true" />
</button>
```

**CSS:**
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

---

## Keyboard Navigation

### Focus Styles

Never remove focus outlines:
```css
/* ❌ Bad */
button:focus {
  outline: none;
}

/* ✅ Good */
button:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}
```

### Tab Order

Maintain logical tab order:
1. Use semantic HTML (nav, main, aside, footer)
2. Don't use positive tabindex values
3. Only use `tabindex="-1"` for programmatic focus
4. Only use `tabindex="0"` to add keyboard access to custom controls

---

## Resources

### Documentation
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

### Tools
- [NVDA Screen Reader](https://www.nvaccess.org/) (Free)
- [axe DevTools](https://www.deque.com/axe/devtools/) (Free browser extension)
- [WAVE](https://wave.webaim.org/extension/) (Free browser extension)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) (Built into Chrome)

### Testing Services
- [WebAIM Color Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Accessible Color Palette Builder](https://toolness.github.io/accessible-color-matrix/)

---

## Checklist for New Features

Before marking a feature as complete, verify:

- [ ] All buttons have labels (visible text or aria-label)
- [ ] All form inputs have associated labels
- [ ] All images have alt text (or alt="" for decorative)
- [ ] All icons are either labeled or hidden (aria-hidden)
- [ ] All interactive elements have adequate touch targets (44×44px)
- [ ] All expand/collapse controls have aria-expanded
- [ ] All loading states have aria-busy
- [ ] All dynamic updates have aria-live
- [ ] All modals have proper role and aria-modal
- [ ] Keyboard navigation works throughout
- [ ] Focus is visible on all interactive elements
- [ ] Color is not the only indicator of meaning
- [ ] Lighthouse accessibility score > 95
- [ ] Manual screen reader test passes

---

## Getting Help

If you're unsure about accessibility:

1. Check this guide first
2. Review existing components in `/src/components/ui/`
3. Check MDN or ARIA Authoring Practices Guide
4. Test with a screen reader
5. Run Lighthouse audit
6. Ask in team chat with specific questions

---

## Updates to This Guide

When you discover new patterns or solutions:

1. Add them to this guide
2. Update the date at the top
3. Share with the team

---

**Remember:** Accessibility is not optional. It's a requirement for all new features and components.

---

**Maintained By:** Development Team  
**Last Updated:** November 2, 2025  
**Version:** 1.0

