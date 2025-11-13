'use client'

import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { User } from '@/lib/supabase/types'

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
  
  // Create client once and memoize it to prevent recreation on every render
  const supabase = useMemo(() => createClient(), [])

  const refreshUser = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        setUser(null)
        return
      }

      // Fetch user profile from database
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error) {
        setUser(null)
        return
      }

      setUser(profile)
    } catch (error) {
      setUser(null)
    }
  }, [supabase])

  useEffect(() => {
    // Track previous token to prevent unnecessary session updates
    let prevAccessToken: string | null = null

    // Get initial session - now instant because it reads from cookies
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession()
        
        if (error) {
          setSession(null)
          setUser(null)
          setLoading(false)
          return
        }
        
        prevAccessToken = initialSession?.access_token || null
        setSession(initialSession)
        
        if (initialSession?.user) {
          await refreshUser()
        } else {
          setUser(null)
        }
      } catch (error) {
        setSession(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Only update session if token actually changed to prevent unnecessary re-renders
        const newAccessToken = session?.access_token || null
        const tokenChanged = newAccessToken !== prevAccessToken
        
        if (tokenChanged || event === 'SIGNED_OUT') {
          prevAccessToken = newAccessToken
          setSession(session)
        }
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user && tokenChanged) {
            await refreshUser()
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setSession(null)
          prevAccessToken = null
        } else if (event === 'USER_UPDATED') {
          if (session?.user) {
            await refreshUser()
          }
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, []) // Empty deps - supabase and refreshUser are stable, effect should run once

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
    } catch (error) {
      // Error signing out
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, session, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}