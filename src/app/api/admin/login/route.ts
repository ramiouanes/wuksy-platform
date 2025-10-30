import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Admin password from environment variable
// To set this: add ADMIN_PASSWORD=your_secure_password to your .env.local file
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'wuksy-admin-2024'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    // Check if password matches
    if (password === ADMIN_PASSWORD) {
      // Set HTTP-only cookie that expires in 7 days
      const response = NextResponse.json(
        { success: true, message: 'Authentication successful' },
        { status: 200 }
      )

      // Set cookie with secure options
      const cookieStore = await cookies()
      cookieStore.set('admin-auth', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })

      return response
    } else {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: 'An error occurred during authentication' },
      { status: 500 }
    )
  }
}

