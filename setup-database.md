# WUKSY Database Setup Guide

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: WUKSY Platform
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to your location
5. Click "Create new project"
6. Wait for initialization (~2 minutes)

## Step 2: Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** > **API**
2. Copy the following values to your `.env.local` file:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (optional)

## Step 3: Run Database Migrations

### Method A: Using SQL Editor (Recommended)

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the content from `supabase/migrations/20250814084848_plain_cave.sql`
4. Click "Run" to execute
5. Then copy and paste the content from `supabase/migrations/20250814085010_dark_tower.sql`
6. Click "Run" to execute

### Method B: Using Migration Files (Advanced)

If you have Supabase CLI installed locally:
```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

## Step 4: Verify Database Setup

1. Go to **Table Editor** in your Supabase dashboard
2. You should see these tables:
   - `users`
   - `user_demographic_profiles`
   - `biomarkers`
   - `biomarker_optimal_ranges`
   - `health_analyses`
   - `supplements`
   - `supplement_protocols`
   - `orders`
   - And more...

## Step 5: Enable Authentication

1. Go to **Authentication** > **Settings**
2. Enable the authentication providers you want:
   - Email/Password (enabled by default)
   - Google (optional)
   - GitHub (optional)
3. Configure email templates if needed

## Sample Data

Your database will be populated with:
- ✅ 15 common biomarkers (Vitamin D, B12, Iron, etc.)
- ✅ Optimal ranges for different demographics
- ✅ 10 high-quality supplements
- ✅ Evidence-based protocols
- ✅ Scientific references
- ✅ Sample partner suppliers

## Troubleshooting

**Issue**: Migration fails with permission error
**Solution**: Make sure you're using the SQL Editor in Supabase dashboard with admin privileges

**Issue**: Tables not visible
**Solution**: Check if the migration completed successfully. Look for error messages in the SQL Editor.

**Issue**: Authentication not working
**Solution**: Verify your environment variables are correct and Supabase URL is accessible.

## Next Steps

After database setup:
1. Test the connection with your Next.js app
2. Create your first user account
3. Upload a sample blood test document
4. Test the AI analysis features 