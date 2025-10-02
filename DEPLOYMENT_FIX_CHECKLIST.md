# Netlify Deployment Fix Checklist

## Issues Fixed

✅ **Corrected `netlify.toml` publish directory** - Changed from `.next` to `.` to work properly with `@netlify/plugin-nextjs`  
✅ **Removed incorrect Next.js output configuration** - The plugin handles this automatically  
✅ **These fixes resolve:**
- ChunkLoadError (JavaScript files not loading)
- 404 errors on routes
- MIME type errors
- Eventually the 401 upload error (caused by broken auth flow)

## Required Steps to Redeploy

### 1. Verify Environment Variables in Netlify

Go to your Netlify dashboard → Site settings → Environment variables and ensure these are set:

```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
OPENAI_API_KEY=<your-openai-key>
```

### 2. Clear Build Cache and Redeploy

1. Go to your Netlify dashboard
2. Click **Deploys** tab
3. Click **Trigger deploy** → **Clear cache and deploy site**
4. Wait for the build to complete (2-5 minutes)

### 3. Test Your Deployment

After deployment completes, test the following:

- ✅ Home page loads without console errors
- ✅ Navigation works (dashboard, profile, etc.)
- ✅ Login/authentication works
- ✅ File upload functionality works
- ✅ No ChunkLoadError in console

### 4. Monitor Build Logs

If the build fails, check the logs for:

- Missing dependencies → Run `npm install` locally to ensure `package.json` is up to date
- Environment variable errors → Double-check they're set in Netlify
- TypeScript errors → Run `npm run build` locally first to catch issues

## Common Post-Deployment Issues

### Issue: Authentication Still Failing

**Solution:**
1. Verify Supabase redirect URLs include your Netlify URL:
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add to **Redirect URLs**:
     ```
     https://your-site.netlify.app
     https://your-site.netlify.app/auth/callback
     https://your-site.netlify.app/**
     ```
   - Update **Site URL** to: `https://your-site.netlify.app`

### Issue: File Upload Returns 401

**Cause:** User not authenticated or session expired

**Solution:**
1. Clear browser cookies and local storage
2. Sign out and sign back in
3. Verify you're authenticated before uploading
4. Check browser console for auth errors

### Issue: Some Routes Still Return 404

**Solution:**
1. Ensure `@netlify/plugin-nextjs` is in `package.json`:
   ```bash
   npm install --save-dev @netlify/plugin-nextjs
   ```
2. Commit and push changes
3. Redeploy

### Issue: "Multiple GoTrueClient instances" Warning

**Note:** This is just a warning and won't affect functionality. It appears when the Supabase client is initialized multiple times (usually in development mode). Safe to ignore.

## Verification Commands (Run Locally)

Before pushing to trigger deployment:

```bash
# Ensure dependencies are installed
npm install

# Check for TypeScript errors
npm run type-check

# Test build locally
npm run build

# If build succeeds, you're good to deploy!
```

## Deployment Workflow

```bash
# 1. Make your changes
git add .

# 2. Commit with descriptive message
git commit -m "Fix Netlify deployment configuration"

# 3. Push to trigger auto-deploy
git push origin main

# 4. Monitor build in Netlify dashboard
```

## Support

If issues persist after following these steps:

1. **Check Netlify build logs** - Look for specific error messages
2. **Check browser console** - Network tab for failed requests
3. **Check Supabase logs** - Database & Auth sections for errors
4. **Verify environment variables** - All required vars are set with correct values

## Next Steps After Successful Deployment

- [ ] Test all features thoroughly
- [ ] Update custom domain (if applicable)
- [ ] Set up monitoring/analytics
- [ ] Configure SEO settings
- [ ] Add error tracking (e.g., Sentry)

