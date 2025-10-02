import { supabase } from './supabase'
import { User } from './supabase'

export async function signUp(email: string, password: string, name: string, dataConsent: boolean = true, researchConsent: boolean = false) {
  const { data, error } = await supabase.auth.signUp({
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

export async function signIn(email: string, password: string) {
  console.log('🔄 Starting signIn function...')
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  console.log('�� Auth response:', { 
    userId: data?.user?.id, 
    session: !!data?.session, 
    emailConfirmed: data?.user?.email_confirmed_at,
    error: error?.message 
  })

  if (error) {
    console.error('❌ Auth error:', error)
    
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
    console.log('⚠️ User email not confirmed')
    throw new Error('Please check your email and click the confirmation link to verify your account.')
  }

  // Update last login time if user exists
  if (data.user) {
    try {
      console.log('🔄 Updating last login time...')
      const updateResult = await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', data.user.id)
      
      console.log('🔄 Update result:', updateResult)
    } catch (updateError) {
      console.error('⚠️ Error updating last login:', updateError)
    }
  }

  console.log('✅ signIn function completed successfully')
  return data
}

export async function signInWithProvider(provider: 'google' | 'facebook') {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })

  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser(): Promise<User | null> {
  //console.log('🔄 getCurrentUser: Starting...')
  
  const { data: { user } } = await supabase.auth.getUser()
  // console.log('🔄 getCurrentUser: Auth user:', user?.id)
  
  if (!user) {
    console.log('❌ getCurrentUser: No auth user found')
    return null
  }

  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // console.log('🔄 getCurrentUser: Profile query result:', { profile: profile?.id, error })

  if (error) {
    console.error('❌ getCurrentUser: Error fetching user profile:', error)
    return null
  }

  // console.log('✅ getCurrentUser: Profile found:', profile.id)
  return profile
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })
  
  if (error) throw error
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  })
  
  if (error) throw error
}