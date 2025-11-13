/**
 * Centralized Authentication Service
 * Single source of truth for all auth operations in the webapp
 * Manages Supabase client, session, and user state
 */

import { createClient } from '@/lib/supabase/client'
import type { Session } from '@supabase/supabase-js'
import type { User } from '@/lib/supabase/types'

class AuthService {
  private static instance: AuthService
  private supabaseClient = createClient()
  
  private constructor() {}
  
  /**
   * Get singleton instance of AuthService
   */
  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }
  
  /**
   * Get the Supabase client instance
   */
  getClient() {
    return this.supabaseClient
  }
  
  /**
   * Get current session from cookies (instant, no network call)
   */
  async getSession(): Promise<Session | null> {
    const { data: { session } } = await this.supabaseClient.auth.getSession()
    return session
  }
  
  /**
   * Get current auth user
   */
  async getAuthUser() {
    const { data: { user } } = await this.supabaseClient.auth.getUser()
    return user
  }
  
  /**
   * Get full user profile from database
   */
  async getUserProfile(userId: string): Promise<User | null> {
    try {
      const { data, error } = await this.supabaseClient
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }
      
      return data
    } catch (error) {
      console.error('Error in getUserProfile:', error)
      return null
    }
  }
  
  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    const { data, error } = await this.supabaseClient.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Check for specific error types
      if (error.message.includes('Email not confirmed')) {
        throw new Error('Please check your email and click the confirmation link before signing in.')
      }
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password. Please check your credentials.')
      }
      throw error
    }

    // Check if user email is confirmed
    if (data.user && !data.user.email_confirmed_at) {
      throw new Error('Please check your email and click the confirmation link to verify your account.')
    }

    // Update last login time if user exists
    if (data.user) {
      try {
        await this.supabaseClient
          .from('users')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', data.user.id)
      } catch (updateError) {
        console.error('Error updating last login:', updateError)
      }
    }

    return data
  }
  
  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string, name: string, dataConsent: boolean = true, researchConsent: boolean = false) {
    const { data, error } = await this.supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          data_consent: dataConsent,
          research_consent: researchConsent,
        }
      }
    })

    if (error) throw error

    // User profile will be automatically created by database trigger
    return data
  }
  
  /**
   * Sign in with OAuth provider
   */
  async signInWithProvider(provider: 'google' | 'facebook') {
    const { data, error } = await this.supabaseClient.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) throw error
    return data
  }
  
  /**
   * Sign out
   */
  async signOut() {
    const { error } = await this.supabaseClient.auth.signOut()
    if (error) throw error
  }
  
  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return this.supabaseClient.auth.onAuthStateChange(callback)
  }
  
  /**
   * Reset password
   */
  async resetPassword(email: string) {
    const { error } = await this.supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    
    if (error) throw error
  }
  
  /**
   * Update password
   */
  async updatePassword(newPassword: string) {
    const { error } = await this.supabaseClient.auth.updateUser({
      password: newPassword
    })
    
    if (error) throw error
  }
}

// Export singleton instance
export const authService = AuthService.getInstance()

