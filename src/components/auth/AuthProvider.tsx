'use client'

/**
 * Centralized Auth Provider
 * Uses the centralized authService for all auth operations
 * Manages auth state for the entire application
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { Session } from '@supabase/supabase-js'
import { authService } from '@/lib/auth/auth-service'
import type { User } from '@/lib/supabase/types'

interface AuthContextType {
  user: User | null
  loading: boolean
  session: Session | null
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Memoize refreshUser to prevent stale closures during navigation
  const refreshUser = useCallback(async () => {
    try {
      const authUser = await authService.getAuthUser()
      
      if (!authUser) {
        setUser(null)
        return
      }

      // Fetch user profile from database
      const profile = await authService.getUserProfile(authUser.id)
      setUser(profile)
    } catch (error) {
      console.error('Error refreshing user:', error)
      setUser(null)
    }
  }, []) // No dependencies - authService is stable

  useEffect(() => {
    // Initialize auth state
    const initAuth = async () => {
      try {
        // Get initial session from cookies (instant, no network call)
        const initialSession = await authService.getSession()
        setSession(initialSession)
        
        // Set loading false immediately - session is proof of auth state
        // This prevents flash of logged-out state on page reload
        setLoading(false)
        
        // Fetch user profile in background (non-blocking)
        if (initialSession?.user) {
          refreshUser() // No await - runs in background
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        setLoading(false) // Always set loading false
      }
    }
    
    initAuth()
    
    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth event:', event)
        setSession(newSession)
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          refreshUser() // Background fetch, non-blocking
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        }
      }
    )
    
    return () => subscription.unsubscribe()
  }, [refreshUser]) // Include refreshUser to ensure fresh closure
  
  const signOut = useCallback(async () => {
    try {
      await authService.signOut()
      setUser(null)
      setSession(null)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, session, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}
