'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { supabase, User } from '@/lib/supabase'
import { getCurrentUser, signOut as authSignOut } from '@/lib/auth'

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

  const refreshUser = async () => {
    try {
      // console.log('🔄 AuthProvider: Refreshing user...')
      const currentUser = await getCurrentUser()
      // console.log('🔄 AuthProvider: User refreshed:', currentUser?.id)
      setUser(currentUser)
    } catch (error) {
      console.error('❌ AuthProvider: Error refreshing user:', error)
      setUser(null)
    }
  }

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        // console.log('🔄 AuthProvider: Getting initial session...')
        const { data: { session: initialSession } } = await supabase.auth.getSession()
        // console.log('🔄 AuthProvider: Initial session:', !!initialSession)
        setSession(initialSession)
        
        if (initialSession?.user) {
          await refreshUser()
        }
      } catch (error) {
        console.error('❌ AuthProvider: Error getting initial session:', error)
      } finally {
        // console.log('🔄 AuthProvider: Initial loading complete')
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // console.log('🔄 AuthProvider: Auth state changed:', event, session?.user?.email)
        setSession(session)
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            await refreshUser()
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    try {
      await authSignOut()
      setUser(null)
      setSession(null)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, session, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}