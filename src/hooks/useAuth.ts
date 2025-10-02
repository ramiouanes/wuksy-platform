'use client'

// Re-export the useAuth hook from AuthProvider to maintain backward compatibility
// This ensures all imports of useAuth will work consistently
export { useAuth } from '@/components/auth/AuthProvider'