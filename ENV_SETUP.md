# Environment Variables Setup Guide

## Overview

This guide explains all environment variables needed for WUKSY, including the new admin authentication system.

## Required Environment Variables

Create a `.env.local` file in the project root with these variables:

```bash
# =============================================================================
# SUPABASE CONFIGURATION (Required for all functionality)
# =============================================================================

# Your Supabase project URL
# Find at: Supabase Dashboard → Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Supabase anonymous key (public key)
# Find at: Supabase Dashboard → Project Settings → API
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase service role key (secret key)
# Find at: Supabase Dashboard → Project Settings → API
# ⚠️ Keep this secret! Never commit to git!
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# =============================================================================
# OPENAI CONFIGURATION (Required for AI analysis features)
# =============================================================================

# Your OpenAI API key
# Get at: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-...

# =============================================================================
# ADMIN AUTHENTICATION (TEMPORARY - For Pre-Launch Only)
# =============================================================================

# Admin password for pre-launch access
# ⚠️ Change this to something secure!
# ⚠️ Remove when launching publicly (see ADMIN_AUTH_REMOVAL_GUIDE.md)
ADMIN_PASSWORD=wuksy-admin-2024

# =============================================================================
# NODE ENVIRONMENT (Automatically set by hosting platforms)
# =============================================================================

# Development: 'development'
# Production: 'production'
NODE_ENV=development
```

## Step-by-Step Setup

### 1. Create the File

```bash
# In project root (mvp-2/project/)
touch .env.local
```

### 2. Add Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to: **Settings** → **API**
4. Copy these values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Add OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Navigate to: **API Keys**
3. Click: **Create new secret key**
4. Copy the key → `OPENAI_API_KEY`
5. ⚠️ Save it somewhere safe (you can't view it again!)

### 4. Set Admin Password

Choose a strong password for admin access:

```bash
# Example (change this!):
ADMIN_PASSWORD=MySecure-Wuksy-Admin-Pass-2024!

# Requirements:
# - Use something unique
# - Keep it secure
# - Share only with team members
# - Change regularly if needed
```

### 5. Verify Setup

```bash
# Start development server
npm run dev

# Test these:
# 1. Visit http://localhost:3000 (should see Coming Soon page)
# 2. Visit http://localhost:3000/admin/login (should see login page)
# 3. Enter your ADMIN_PASSWORD (should access app)
```

## Production Deployment

### Netlify

1. Go to: **Site Settings** → **Environment Variables**
2. Add each variable:
   - Click **Add a variable**
   - Enter **Key** and **Value**
   - Click **Save**

### Vercel

1. Go to: **Project Settings** → **Environment Variables**
2. Add each variable:
   - Enter **Key** and **Value**
   - Select environment: **Production**, **Preview**, **Development**
   - Click **Save**

### Other Platforms

Most hosting platforms have similar settings:
- Look for: "Environment Variables", "Config Vars", or "Secrets"
- Add each variable as key-value pairs
- Restart deployment after adding variables

## Security Best Practices

### ✅ DO
- ✅ Keep `.env.local` in `.gitignore` (already done)
- ✅ Use strong, unique passwords
- ✅ Rotate keys regularly
- ✅ Use different values for dev/staging/production
- ✅ Share secrets securely (password managers, encrypted channels)
- ✅ Remove admin password when launching publicly

### ❌ DON'T
- ❌ Commit `.env.local` to git
- ❌ Share keys in plain text (Slack, email, etc.)
- ❌ Use weak or default passwords in production
- ❌ Expose service role key to client-side code
- ❌ Reuse passwords across projects

## Variable Details

### NEXT_PUBLIC_SUPABASE_URL
- **Type**: Public
- **Usage**: Client-side Supabase connection
- **Format**: `https://[project-id].supabase.co`
- **Security**: Safe to expose (public)

### NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Type**: Public
- **Usage**: Client-side Supabase authentication
- **Format**: JWT token starting with `eyJ...`
- **Security**: Safe to expose (has RLS protection)

### SUPABASE_SERVICE_ROLE_KEY
- **Type**: Secret ⚠️
- **Usage**: Server-side admin operations
- **Format**: JWT token starting with `eyJ...`
- **Security**: NEVER expose to client! Server-only!

### OPENAI_API_KEY
- **Type**: Secret ⚠️
- **Usage**: AI analysis features
- **Format**: Starts with `sk-...`
- **Security**: NEVER expose to client!

### ADMIN_PASSWORD
- **Type**: Secret ⚠️ (Temporary)
- **Usage**: Pre-launch admin access
- **Format**: Any string (recommend 16+ chars)
- **Security**: Share only with team, remove at launch

### NODE_ENV
- **Type**: System
- **Usage**: Environment detection
- **Values**: `development` | `production`
- **Security**: Automatically set by hosting platform

## Troubleshooting

### Issue: "Cannot find module @supabase/supabase-js"
```bash
npm install
```

### Issue: "Invalid Supabase URL"
- Check URL format: `https://[project-id].supabase.co`
- No trailing slash
- Must start with `https://`
- Verify in Supabase dashboard

### Issue: "Invalid API key"
- Copy the entire key (they're very long!)
- No extra spaces or line breaks
- Check you're using the right key (anon vs service_role)
- Regenerate in Supabase dashboard if needed

### Issue: "Admin login not working"
- Restart dev server after adding ADMIN_PASSWORD
- Check for typos in password
- Verify .env.local file is in project root
- Try clearing browser cookies

### Issue: "Environment variable not found"
- Check file name is exactly `.env.local`
- Verify file is in `mvp-2/project/` directory
- No spaces in variable names
- Restart server after adding variables

## Testing Environment Variables

Create a test file to verify setup:

```bash
# Create test file
cat > test-env.js << 'EOF'
console.log('Environment Variables Test:')
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing')
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing')
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing')
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing')
console.log('ADMIN_PASSWORD:', process.env.ADMIN_PASSWORD ? '✅ Set' : '❌ Missing')
EOF

# Run test
node -r dotenv/config test-env.js

# Clean up
rm test-env.js
```

## Example .env.local

```bash
# Copy this template and fill in your actual values

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODM2ODAwMCwiZXhwIjoxOTUzOTQ0MDAwfQ.example-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjM4MzY4MDAwLCJleHAiOjE5NTM5NDQwMDB9.example-service-role-key-here

# OpenAI
OPENAI_API_KEY=sk-proj-1234567890abcdef1234567890abcdef1234567890abcdef

# Admin (Temporary)
ADMIN_PASSWORD=MySecurePassword123!

# Node Environment (set automatically)
NODE_ENV=development
```

## When to Update

### Regularly
- Rotate `ADMIN_PASSWORD` if shared widely
- Regenerate `OPENAI_API_KEY` if compromised
- Update `SUPABASE_SERVICE_ROLE_KEY` if exposed

### At Launch
- Remove `ADMIN_PASSWORD` completely
- Verify all production keys are set
- Test in production environment

### Never
- Don't change during active development
- Don't modify in production without testing
- Don't change keys just for the sake of it

## Support

If you're still having issues:

1. Check the [Supabase Documentation](https://supabase.com/docs)
2. Review [OpenAI API Documentation](https://platform.openai.com/docs)
3. See `ADMIN_AUTH_QUICKSTART.md` for admin setup
4. Contact the development team

---

**Created**: January 30, 2025
**Last Updated**: January 30, 2025

