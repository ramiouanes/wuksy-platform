# Admin Console Setup - Fix for Supabase Data Access

## 🔧 Problem Fixed

The admin console wasn't showing data because it was using the **anon key** which is restricted by Row Level Security (RLS) policies. Admin routes need to use the **service role key** to bypass RLS and access all data.

## ✅ What Was Updated

All admin API routes now use `createAdminClient()` which uses the service role key:
- `/api/admin/stats`
- `/api/admin/users`
- `/api/admin/subscribers`
- `/api/admin/documents`
- `/api/admin/analyses`
- `/api/admin/biomarkers`
- `/api/admin/export`
- And all detail endpoints

## 🔐 Required: Add Service Role Key

You need to add your Supabase **service role key** to your environment variables.

### Step 1: Get Your Service Role Key

1. Go to your Supabase project dashboard
2. Click on **Settings** (gear icon in the left sidebar)
3. Click on **API** section
4. Find the **service_role** key (under "Project API keys")
5. Copy the key (it's the long one that starts with `eyJ...`)

⚠️ **WARNING**: The service role key bypasses all RLS policies. Never expose it to the client-side or commit it to version control!

### Step 2: Add to Environment Variables

Add this line to your `.env.local` file in the project root:

```bash
# Supabase Service Role Key (KEEP SECRET - Server-side only!)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

Your `.env.local` should now look something like:

```bash
# Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key

# Admin password
ADMIN_PASSWORD=your_secure_password_here

# Other env vars...
```

### Step 3: Restart Your Development Server

After adding the service role key, restart your dev server:

```bash
# Stop the current server (Ctrl+C)
# Then start it again:
npm run dev
```

### Step 4: Test the Admin Console

1. Go to `http://localhost:3000/admin/login`
2. Login with your admin password
3. You should now see all your data! 🎉

## 🔍 Verify It's Working

You should now see:
- ✅ Subscriber counts and data
- ✅ User data (if you have registered users)
- ✅ Documents (if any have been uploaded)
- ✅ Health analyses (if any exist)
- ✅ Biomarkers from your database

## 🔒 Security Notes

### What's the Difference Between Keys?

1. **Anon Key** (Public)
   - Safe to use in client-side code
   - Respects Row Level Security (RLS) policies
   - Users can only access their own data
   - Used in: Frontend, user-facing API routes

2. **Service Role Key** (Secret)
   - NEVER use in client-side code
   - Bypasses ALL RLS policies
   - Full admin access to all data
   - Used in: Admin API routes only

### Best Practices

✅ **DO:**
- Keep service role key in `.env.local` only
- Add `.env.local` to `.gitignore` (should already be there)
- Use service role key only in server-side API routes
- Protect admin routes with authentication (already done via middleware)

❌ **DON'T:**
- Never commit service role key to git
- Never send it to the client
- Never use it in client components
- Never expose it in public APIs

## 🐛 Troubleshooting

### Still Not Seeing Data?

1. **Check Environment Variable**
   ```bash
   # Make sure the key is set correctly
   echo $SUPABASE_SERVICE_ROLE_KEY
   ```

2. **Restart Server**
   - Environment variables are only loaded on server start
   - Make sure you restart after adding the key

3. **Check Console for Errors**
   - Open browser dev tools (F12)
   - Check the Console tab for errors
   - Check the Network tab for failed API requests

4. **Verify Key is Correct**
   - Go back to Supabase dashboard
   - Settings → API
   - Make sure you copied the `service_role` key (not the `anon` key)

5. **Check Supabase Tables Exist**
   - Go to Supabase dashboard
   - Table Editor
   - Verify these tables exist:
     - `email_subscriptions`
     - `users`
     - `documents`
     - `health_analyses`
     - `biomarkers`
     - `biomarker_readings`

### Error: "Missing SUPABASE_SERVICE_ROLE_KEY environment variable"

This means the environment variable isn't set. Follow Step 2 above and restart your server.

### Error: "Invalid JWT"

Your service role key might be incorrect. Double-check you copied the right key from Supabase.

## 📝 Production Deployment

When deploying to production (Vercel, etc.):

1. **Add Environment Variable to Platform**
   - Go to your deployment platform settings
   - Add `SUPABASE_SERVICE_ROLE_KEY` as an environment variable
   - Paste your service role key
   - This keeps it secure and separate from your code

2. **Vercel Example:**
   - Go to your project settings
   - Click "Environment Variables"
   - Add:
     - Name: `SUPABASE_SERVICE_ROLE_KEY`
     - Value: `your_service_role_key`
     - Environment: Production (and Preview if needed)

3. **Redeploy**
   - After adding the env var, redeploy your app
   - The admin console will now work in production

## 🎯 Summary

The admin console now uses the proper authentication method to access all your Supabase data. Just add the service role key to your environment variables and restart your server.

**Need Help?** If you're still having issues after following these steps, check:
- Server console logs for errors
- Browser console for client errors
- Supabase dashboard logs
- Network tab in dev tools to see API responses

---

**Status**: ✅ Fixed - Admin console now properly configured for full data access!

