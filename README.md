# WUKSY MVP - Personalized Health Platform

A Next.js application that provides AI-powered blood test analysis and personalized supplement recommendations.

## Features

- **User Authentication**: Complete signup/signin flow with Supabase
- **Profile Management**: Comprehensive health profile with demographics, conditions, medications
- **Blood Test Upload**: Document processing for biomarker extraction
- **AI Analysis**: Personalized health insights and recommendations
- **Supplement Protocols**: Evidence-based supplement recommendations

## Quick Start

### 1. Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### 2. Clone and Install

```bash
git clone <your-repo>
cd mvp-2/project
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**To get these values:**
1. Go to [supabase.com](https://supabase.com) and create a new project
2. In your project dashboard, go to Settings > API
3. Copy the Project URL and anon public key

### 4. Database Setup

Run the SQL migrations in your Supabase SQL editor:

```bash
# Run both migration files in order:
# 1. supabase/migrations/20250814084848_plain_cave.sql
# 2. supabase/migrations/20250814085010_dark_tower.sql
```

### 5. Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000`

## Authentication System

### Complete Features

✅ **User Registration**
- Email/password signup
- Google OAuth integration
- Terms and privacy consent handling
- User profile creation

✅ **User Sign In**  
- Email/password authentication
- Social authentication (Google/Facebook)
- Session management
- "Remember me" functionality

✅ **Profile Management**
- Comprehensive health demographics
- Health conditions and medications tracking
- Lifestyle factors assessment
- Supplement preferences
- Real-time updates

✅ **Security**
- Row Level Security (RLS) enabled
- Session-based authentication
- Protected API routes
- Secure data handling

### Usage

#### Sign Up
```typescript
import { signUp } from '@/lib/auth'

await signUp(email, password, name, dataConsent, researchConsent)
```

#### Sign In
```typescript
import { signIn } from '@/lib/auth'

await signIn(email, password)
```

#### Access User Data
```typescript
import { useAuth } from '@/components/auth/AuthProvider'

const { user, loading, session, signOut } = useAuth()
```

#### Protected Routes
Routes automatically redirect to signin if user is not authenticated:
- `/dashboard`
- `/profile` 
- `/upload`
- `/analysis/*`

## Database Schema

### Core Tables
- `users` - User profiles and basic info
- `user_demographic_profiles` - Detailed health demographics
- `documents` - Uploaded blood test files
- `health_analyses` - AI-generated health insights
- `biomarkers` - Reference biomarker data
- `supplement_recommendations` - Personalized supplement protocols

## API Routes

### Authentication
- `GET/POST /api/profile` - User profile management
- `POST /auth/callback` - OAuth callback handling

### File Processing  
- `POST /api/documents/upload` - File upload
- `POST /api/documents/[id]/process` - Document processing

### Analysis
- `POST /api/analysis/generate` - Generate health analysis
- `GET /api/analysis/[id]` - Retrieve analysis results

## Development

### Project Structure
```
src/
├── app/                 # Next.js 13+ app directory
│   ├── auth/           # Authentication pages
│   ├── api/            # API routes
│   └── (protected)/    # Protected route groups
├── components/         # Reusable components
│   ├── auth/          # Authentication components
│   ├── ui/            # UI components
│   └── layout/        # Layout components
├── lib/               # Utilities and configurations
└── hooks/             # Custom React hooks
```

### Key Files
- `src/lib/supabase.ts` - Supabase client and types
- `src/lib/auth.ts` - Authentication utilities
- `src/components/auth/AuthProvider.tsx` - Authentication context
- `src/app/layout.tsx` - Root layout with AuthProvider

## Deployment

### Environment Variables
Ensure these are set in your deployment environment:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Supabase Configuration
1. **RLS Policies**: Already configured for user data protection
2. **OAuth Providers**: Configure in Supabase Auth settings
3. **Email Templates**: Customize in Supabase Auth settings

## Troubleshooting

### Common Issues

**"Missing environment variables" error**
- Ensure `.env.local` file exists with correct Supabase credentials
- Check that variable names match exactly

**Authentication not working**
- Verify Supabase project URL and keys are correct
- Check that RLS policies are enabled
- Ensure OAuth redirect URLs are configured in Supabase

**Profile data not saving**
- Check browser console for API errors
- Verify user session is active
- Ensure database migrations have been run

### Debug Mode
Add to `.env.local` for more verbose logging:
```bash
NEXT_PUBLIC_DEBUG=true
```

## Next Steps

- [ ] Add password reset functionality
- [ ] Implement email verification flow  
- [ ] Add user avatar upload
- [ ] Enhanced profile validation
- [ ] Multi-factor authentication
- [ ] Admin dashboard for user management