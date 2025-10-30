import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const adminAuth = cookieStore.get('admin-auth')

    if (adminAuth && adminAuth.value === 'true') {
      return NextResponse.json(
        { authenticated: true },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    )
  } catch (error) {
    console.error('Admin auth check error:', error)
    return NextResponse.json(
      { authenticated: false },
      { status: 500 }
    )
  }
}

