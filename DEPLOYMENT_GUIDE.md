# GitHub Pages Deployment Guide

This guide walks you through deploying your WUKSY platform to GitHub Pages with Supabase integration.

## Prerequisites

- GitHub account
- Supabase project set up
- Node.js 18+ installed locally

## Step-by-Step Deployment

### 1. Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and create a new repository
2. Repository name: `wuksy-platform` (or your preferred name)
3. Make it **public** (required for free GitHub Pages)
4. Don't initialize with README, .gitignore, or license

### 2. Push Your Code

```bash
# Connect to your GitHub repository (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/wuksy-platform.git
git push -u origin main
```

### 3. Configure GitHub Secrets

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Add these repository secrets:

   - **NEXT_PUBLIC_SUPABASE_URL**: Your Supabase project URL
   - **NEXT_PUBLIC_SUPABASE_ANON_KEY**: Your Supabase anonymous key

   **To get these values:**
   - Go to your Supabase dashboard
   - Navigate to **Settings** → **API**
   - Copy the **Project URL** and **anon public** key

### 4. Configure Supabase

1. **In your Supabase project dashboard:**
2. **Go to Authentication** → **URL Configuration**
3. **Set Site URL to:**
   ```
   https://YOUR_USERNAME.github.io/REPOSITORY_NAME
   ```
4. **Add to Redirect URLs:**
   ```
   https://YOUR_USERNAME.github.io/REPOSITORY_NAME
   https://YOUR_USERNAME.github.io/REPOSITORY_NAME/auth/callback
   ```

### 5. Enable GitHub Pages

1. In your GitHub repository, go to **Settings** → **Pages**
2. Under **Source**, select **"GitHub Actions"**
3. The deployment will start automatically when you push to main

### 6. Access Your Deployed App

Your app will be available at:
```
https://YOUR_USERNAME.github.io/REPOSITORY_NAME
```

## Important Notes

### API Routes Limitation

GitHub Pages only serves static files, so API routes won't work. The app has been configured to use client-side functions that directly interact with Supabase.

**Features that work with static deployment:**
- ✅ User authentication (Supabase Auth)
- ✅ Profile management
- ✅ File uploads to Supabase Storage
- ✅ Database operations
- ✅ Basic document processing

**Features that require server-side processing:**
- ❌ Advanced AI analysis (requires API routes)
- ❌ Complex file processing
- ❌ Server-side PDF parsing

### Alternative Hosting Options

For full functionality including API routes, consider:

1. **Vercel** (Recommended)
   - Full Next.js support
   - Automatic deployments
   - Serverless functions

2. **Netlify**
   - Static site hosting
   - Netlify Functions for API routes

3. **Railway**
   - Full-stack hosting
   - Database support

## Troubleshooting

### Common Issues

**Build fails:**
- Check that all environment variables are set in GitHub secrets
- Ensure Supabase credentials are correct

**Authentication doesn't work:**
- Verify Supabase URL configuration includes your GitHub Pages domain
- Check that redirect URLs are properly configured

**App loads but features don't work:**
- Check browser console for errors
- Verify Supabase connection in Network tab

### Debug Steps

1. Check GitHub Actions logs for build errors
2. Use browser developer tools to inspect network requests
3. Verify Supabase configuration matches your GitHub Pages URL

## Next Steps

1. **Custom Domain** (Optional)
   - Configure a custom domain in GitHub Pages settings
   - Update Supabase URL configuration accordingly

2. **Enhanced Features**
   - Consider migrating to Vercel for full API route support
   - Implement Supabase Edge Functions for server-side processing

3. **Monitoring**
   - Set up error tracking (e.g., Sentry)
   - Monitor Supabase usage and performance

## Support

If you encounter issues:
1. Check the GitHub Actions logs
2. Review Supabase dashboard for errors
3. Consult the Next.js static export documentation
4. Check Supabase documentation for authentication setup
