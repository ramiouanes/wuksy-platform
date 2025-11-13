/**
 * DEPRECATED: This file is kept for backward compatibility
 * All auth functions now use the centralized authService
 * @see @/lib/auth/auth-service.ts
 */

import { authService } from '@/lib/auth/auth-service'
import { User } from '@/lib/supabase/types'

/**
 * @deprecated Use authService.signUp() instead
 */
export async function signUp(email: string, password: string, name: string, dataConsent: boolean = true, researchConsent: boolean = false) {
  return authService.signUp(email, password, name, dataConsent, researchConsent)
}

/**
 * @deprecated Use authService.signIn() instead
 */
export async function signIn(email: string, password: string) {
  return authService.signIn(email, password)
}

/**
 * @deprecated Use authService.signInWithProvider() instead
 */
export async function signInWithProvider(provider: 'google' | 'facebook') {
  return authService.signInWithProvider(provider)
}

/**
 * @deprecated Use authService.signOut() instead
 */
export async function signOut() {
  return authService.signOut()
}

/**
 * @deprecated Use authService.getAuthUser() and authService.getUserProfile() instead
 */
export async function getCurrentUser(): Promise<User | null> {
  const authUser = await authService.getAuthUser()
  if (!authUser) return null
  
  return authService.getUserProfile(authUser.id)
}

/**
 * @deprecated Use authService.resetPassword() instead
 */
export async function resetPassword(email: string) {
  return authService.resetPassword(email)
}

/**
 * @deprecated Use authService.updatePassword() instead
 */
export async function updatePassword(newPassword: string) {
  return authService.updatePassword(newPassword)
}
