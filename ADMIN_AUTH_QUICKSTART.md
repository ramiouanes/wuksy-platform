# Admin Authentication Quick Start Guide

## What Was Built

A temporary admin authentication system that:
1. Shows a "Coming Soon" landing page at the root URL
2. Collects email subscriptions from interested visitors
3. Protects all app routes with a simple password
4. Allows the WUKSY team to access and test the full application
5. Can be easily removed when ready for public launch

## Current Setup

### Public Access
- **Root URL** (`/`): Redirects to Coming Soon page
- **Coming Soon** (`/coming-soon`): Beautiful landing page with email subscription
- **Admin Login** (`/admin/login`): Portal for team access

### Admin Access (Password Protected)
All these routes now require admin password:
- `/app` - Main application homepage
- `/dashboard` - User dashboard
- `/upload` - Document upload
- `/documents` - Document management
- `/analysis` - Analysis results
- `/profile` - User profile
- `/biomarkers` - Biomarker information
- `/how-it-works` - Product information
- `/auth/signin` - User sign in
- `/auth/signup` - User registration

## How to Use

### For Development Team

1. **Access the Admin Portal**
   - Go to: `http://localhost:3000/admin/login`
   - Or: `https://your-domain.com/admin/login`

2. **Enter Admin Password**
   - Default: `wuksy-admin-2024`
   - Or: Value from `ADMIN_PASSWORD` in `.env.local`

3. **Access Full Application**
   - After login, you'll be redirected to `/app`
   - Admin banner appears at top of all pages
   - You can now access all routes and features
   - Regular user authentication (Supabase) still works normally

4. **Admin Logout**
   - Click "Admin Logout" button in the admin banner
   - Or visit: `/api/admin/logout`

### For Public Visitors (Before Launch)

1. **See Coming Soon Page**
   - Visit: `https://your-domain.com`
   - Beautiful landing page with WUKSY branding

2. **Subscribe for Updates**
   - Enter email address
   - Receive confirmation message
   - Emails stored in `email_subscriptions` table

## Environment Variables

Add to `.env.local`:

```bash
# Admin Password (change this to something secure!)
ADMIN_PASSWORD=your_secure_password_here

# Keep your existing Supabase and OpenAI keys
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
```

## Database Setup

Run the migration to create the email subscriptions table:

```bash
# Using Supabase CLI
supabase migration up

# Or manually run the SQL in Supabase dashboard:
# File: supabase/migrations/20250130_email_subscriptions.sql
```

## Testing

### Test Coming Soon Page
```bash
# Visit in browser (incognito mode to avoid admin cookies):
http://localhost:3000

# Should redirect to:
http://localhost:3000/coming-soon

# Test email subscription:
# Enter an email and submit
# Check Supabase dashboard: email_subscriptions table
```

### Test Admin Login
```bash
# Visit:
http://localhost:3000/admin/login

# Enter password (default: wuksy-admin-2024)
# Should redirect to: /app
# Admin banner should appear at top
```

### Test Protected Routes
```bash
# Without admin login (incognito mode):
http://localhost:3000/dashboard
# Should redirect to: /admin/login?redirect=/dashboard

# With admin login:
http://localhost:3000/dashboard
# Should show dashboard with admin banner
```

### Test Admin Logout
```bash
# While logged in as admin:
# Click "Admin Logout" in banner
# Or visit: http://localhost:3000/api/admin/logout

# Then try to access any protected route:
http://localhost:3000/dashboard
# Should redirect to: /admin/login
```

## Features

### Coming Soon Page
- ✅ Beautiful zen-inspired design matching WUKSY branding
- ✅ Email subscription form
- ✅ Success/error states with animations
- ✅ Trust indicators (HIPAA, Science-Based, AI-Powered)
- ✅ Feature preview cards
- ✅ Link to admin access
- ✅ Mobile responsive
- ✅ No header/footer for clean landing page

### Admin Authentication
- ✅ Simple password-based auth
- ✅ HTTP-only cookies for security
- ✅ 7-day session duration
- ✅ Route protection via middleware
- ✅ Automatic redirect to login
- ✅ Redirect back after login
- ✅ Admin banner on protected pages
- ✅ Easy logout functionality

### Email Subscriptions
- ✅ Database table with RLS
- ✅ API endpoint with validation
- ✅ Duplicate email prevention
- ✅ IP and user agent tracking
- ✅ Status management (pending/confirmed/unsubscribed)
- ✅ Beautiful form UI with error handling

## File Structure

```
mvp-2/project/
├── src/
│   ├── app/
│   │   ├── page.tsx                      # Root redirect
│   │   ├── coming-soon/
│   │   │   ├── page.tsx                  # Coming soon landing page
│   │   │   └── layout.tsx                # Clean layout (no header/footer)
│   │   ├── admin/
│   │   │   ├── login/page.tsx            # Admin login page
│   │   │   └── layout.tsx                # Clean layout for login
│   │   ├── app/
│   │   │   ├── page.tsx                  # Main app homepage (protected)
│   │   │   └── layout.tsx                # With admin banner
│   │   ├── dashboard/layout.tsx          # All protected routes have
│   │   ├── upload/layout.tsx             # admin banner via layout
│   │   ├── documents/layout.tsx
│   │   ├── analysis/layout.tsx
│   │   ├── profile/layout.tsx
│   │   ├── biomarkers/layout.tsx
│   │   ├── how-it-works/layout.tsx
│   │   ├── auth/layout.tsx
│   │   └── api/
│   │       ├── subscribe/route.ts        # Email subscription API
│   │       └── admin/
│   │           ├── login/route.ts        # Admin login API
│   │           ├── logout/route.ts       # Admin logout API
│   │           └── check/route.ts        # Auth check API
│   ├── components/
│   │   └── layout/
│   │       └── AdminBanner.tsx           # Admin mode indicator banner
│   ├── hooks/
│   │   └── useAdminAuth.ts               # Admin auth client-side hook
│   └── middleware.ts                     # Route protection middleware
├── supabase/
│   └── migrations/
│       └── 20250130_email_subscriptions.sql  # Email subscriptions table
├── ADMIN_AUTH_QUICKSTART.md              # This file
└── ADMIN_AUTH_REMOVAL_GUIDE.md           # Removal instructions for launch
```

## Security Notes

1. **Change the Default Password!**
   - Default: `wuksy-admin-2024`
   - Set a strong password in production
   - Use environment variable: `ADMIN_PASSWORD`

2. **Cookie Security**
   - HTTP-only (not accessible via JavaScript)
   - Secure flag in production (HTTPS only)
   - SameSite: Lax (CSRF protection)
   - 7-day expiration

3. **Not for Long-Term Use**
   - This is a simple temporary solution
   - For public launch, remove and use proper auth
   - See: `ADMIN_AUTH_REMOVAL_GUIDE.md`

## Troubleshooting

### Can't Access Protected Routes
- Clear browser cookies
- Check admin-auth cookie exists
- Verify password matches environment variable
- Check middleware.ts is not filtered by .gitignore

### Coming Soon Page Not Showing
- Check root page.tsx redirects correctly
- Verify coming-soon/page.tsx exists
- Check browser console for errors
- Clear Next.js cache: `rm -rf .next`

### Email Subscription Not Working
- Run database migration
- Check Supabase connection
- Verify API route: `/api/subscribe`
- Check browser console/network tab
- Verify environment variables set

### Admin Login Not Working
- Check ADMIN_PASSWORD environment variable
- Restart dev server after env changes
- Clear browser cookies
- Check API route: `/api/admin/login`
- Verify password input (case-sensitive)

## Next Steps

### Before Launch (Remove Admin Auth)
See detailed instructions in: `ADMIN_AUTH_REMOVAL_GUIDE.md`

Quick steps:
1. Delete admin files and components
2. Remove middleware protection
3. Update root page with real landing page
4. Move `/app` content to `/`
5. Remove ADMIN_PASSWORD from environment
6. Test all routes work without admin login

### For Production Deployment
1. Set secure `ADMIN_PASSWORD` in production env
2. Deploy coming soon page
3. Test admin login on production URL
4. Share admin password with team (securely!)
5. Monitor email subscriptions
6. Plan launch date and removal timeline

## Support

Questions? Check:
- `ADMIN_AUTH_REMOVAL_GUIDE.md` - How to remove when launching
- `WUKSY_UI_Branding_Guide.md` - Design and branding guidelines
- GitHub Issues - Report problems
- Team Slack - Quick questions

---

**Created**: January 30, 2025
**Last Updated**: January 30, 2025

