/**
 * DEPRECATED: This file is kept for backward compatibility
 * All server-side auth now uses the unified API auth helper
 * @see @/lib/auth/api-auth.ts
 */

import { getAuthenticatedUser as unifiedGetAuthenticatedUser } from '@/lib/auth/api-auth'
import { NextRequest } from 'next/server'

/**
 * @deprecated Use getAuthenticatedUser from '@/lib/auth/api-auth' instead
 */
export async function getAuthenticatedUser(request: NextRequest) {
  const result = await unifiedGetAuthenticatedUser(request)
  
  // Convert to old format for backward compatibility
  if ('error' in result) {
    return { user: null, error: result.error }
  }
  
  return { user: result.user, error: null }
    }

/**
 * @deprecated No longer needed - for testing only
 */
export async function getTestUser() {
  return {
    id: 'test-user-123',
    email: 'test@wuksy.com',
    name: 'Test User',
    data_consent: true,
    research_consent: false
  }
} 
