# Netlify Deployment Guide

Complete guide to deploy your WUKSY platform to Netlify with custom domain support.

## Prerequisites

- GitHub account
- Netlify account (free - sign up at [netlify.com](https://netlify.com))
- Supabase project configured
- Custom domain (optional, can add later)

## Step-by-Step Deployment

### 1. Push Your Code to GitHub

If you haven't already created a GitHub repository:

```bash
# Create a new repository on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/wuksy-platform.git
git add .
git commit -m "Prepare for Netlify deployment"
git push -u origin main
```

### 2. Connect GitHub to Netlify

1. **Go to [netlify.com](https://netlify.com)** and sign up/login
2. **Click "Add new site"** → **"Import an existing project"**
3. **Select "GitHub"** and authorize Netlify
4. **Choose your repository** (`wuksy-platform`)
5. **Configure build settings:**
   - **Base directory**: Leave empty
   - **Build command**: `npm run build` (auto-detected)
   - **Publish directory**: `.next` (auto-detected)
   - **Node version**: Will use 18 from netlify.toml

### 3. Add Environment Variables

Before deploying, add your Supabase credentials:

1. In Netlify dashboard, go to **Site settings** → **Environment variables**
2. **Add the following variables:**

   ```
   NEXT_PUBLIC_SUPABASE_URL = your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY = your_supabase_anon_key
   OPENAI_API_KEY = your_openai_api_key (if using AI features)
   ```

   **To get Supabase values:**
   - Go to your Supabase dashboard
   - Navigate to **Settings** → **API**
   - Copy **Project URL** and **anon public** key

### 4. Deploy!

1. **Click "Deploy site"**
2. Netlify will:
   - Install dependencies
   - Build your Next.js app
   - Deploy to a temporary URL (`random-name-123.netlify.app`)
3. **Wait 2-5 minutes** for first deployment

### 5. Configure Supabase URLs

Once deployed, update your Supabase authentication settings:

1. **Copy your Netlify URL** (e.g., `https://your-site.netlify.app`)
2. **Go to Supabase dashboard** → **Authentication** → **URL Configuration**
3. **Add to Site URL:**
   ```
   https://your-site.netlify.app
   ```
4. **Add to Redirect URLs:**
   ```
   https://your-site.netlify.app
   https://your-site.netlify.app/auth/callback
   https://your-site.netlify.app/**
   ```

### 6. Set Up Custom Domain (Optional)

#### If you own a domain (e.g., wuksy.com):

1. **In Netlify dashboard**, go to **Domain settings**
2. **Click "Add custom domain"**
3. **Enter your domain** (e.g., `app.wuksy.com` or `wuksy.com`)
4. **Choose one option:**

   **Option A: Use Netlify DNS (Recommended - Easiest)**
   - Netlify will show you nameservers
   - Go to your domain registrar (GoDaddy, Namecheap, etc.)
   - Update nameservers to Netlify's nameservers
   - Wait 24-48 hours for DNS propagation

   **Option B: Use Your Existing DNS**
   - Add a CNAME record pointing to your Netlify site:
     ```
     Type: CNAME
     Name: app (or @ for root domain)
     Value: your-site.netlify.app
     ```
   - If using root domain (@), use A record pointing to Netlify's load balancer IP

5. **Enable HTTPS** (automatic - Netlify provides free SSL)

#### Update Supabase with Custom Domain:

After domain is configured:
1. Go to **Supabase** → **Authentication** → **URL Configuration**
2. **Update Site URL** to your custom domain:
   ```
   https://app.wuksy.com
   ```
3. **Update Redirect URLs**:
   ```
   https://app.wuksy.com
   https://app.wuksy.com/auth/callback
   https://app.wuksy.com/**
   ```

## Automatic Deployments

Every time you push to your `main` branch on GitHub, Netlify will automatically:
1. Pull the latest code
2. Run the build
3. Deploy the new version
4. Keep the old version as a rollback option

## Monitoring Your Deployment

### Check Build Logs
- Go to **Deploys** tab in Netlify dashboard
- Click on any deployment to see logs

### Common Issues

**Build fails with "Module not found":**
- Check that all dependencies are in `package.json`
- Clear cache and retry: **Deploys** → **Trigger deploy** → **Clear cache and deploy**

**Environment variables not working:**
- Verify they're set in Netlify (not just in `.env.local`)
- Redeploy after adding new variables

**Authentication not working:**
- Check Supabase redirect URLs match your Netlify URL exactly
- Verify environment variables are correct

**API routes returning 404:**
- Make sure `@netlify/plugin-nextjs` is installed
- Check `netlify.toml` configuration is present

## Performance & Limits (Free Tier)

✅ **Bandwidth**: 100 GB/month  
✅ **Build minutes**: 300 minutes/month  
✅ **Concurrent builds**: 1  
✅ **Sites**: Unlimited  
✅ **Functions**: 125K requests/month, 100 hours runtime  
✅ **Form submissions**: 100/month  

**This is more than enough for your MVP!**

## Advanced Configuration

### Branch Previews

Netlify automatically creates preview deployments for pull requests:
- Each PR gets its own URL
- Perfect for testing before merging

### Deploy Previews

Create a preview from any branch:
```bash
git checkout -b feature-branch
git push origin feature-branch
```
Netlify creates a preview at `feature-branch--your-site.netlify.app`

### Rollback

If a deployment has issues:
1. Go to **Deploys** tab
2. Find a previous working deployment
3. Click **"Publish deploy"**

## Support

- **Netlify Docs**: https://docs.netlify.com/
- **Netlify Forums**: https://answers.netlify.com/
- **Next.js on Netlify**: https://docs.netlify.com/integrations/frameworks/next-js/

## Summary

That's it! Your app is now:
- ✅ Deployed on Netlify
- ✅ Connected to Supabase
- ✅ Using your custom domain
- ✅ Auto-deploying from GitHub
- ✅ Completely FREE for your MVP

Any push to `main` will trigger a new deployment automatically.
