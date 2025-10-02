import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user using server-side auth
    const { user, error: authError } = await getAuthenticatedUser(request)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create a Supabase client with the user's token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const authorization = request.headers.get('authorization')
    const token = authorization?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { error: 'Missing authorization token' },
        { status: 401 }
      )
    }

    const userSupabase = createClient(supabaseUrl!, supabaseKey!, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    })

    // Get user demographic profile
    const { data: profile, error: profileError } = await userSupabase
      .from('user_demographic_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      profile: profile || null
    })

  } catch (error) {
    console.error('Profile GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user using server-side auth
    const { user, error: authError } = await getAuthenticatedUser(request)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create a Supabase client with the user's token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const authorization = request.headers.get('authorization')
    const token = authorization?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { error: 'Missing authorization token' },
        { status: 401 }
      )
    }

    const userSupabase = createClient(supabaseUrl!, supabaseKey!, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    })

    const profileData = await request.json()

    // Check if profile already exists
    const { data: existingProfile } = await userSupabase
      .from('user_demographic_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    let result
    if (existingProfile) {
      // Update existing profile
      result = await userSupabase
        .from('user_demographic_profiles')
        .update({
          gender: profileData.gender || null,
          date_of_birth: profileData.date_of_birth || null,
          ethnicity: profileData.ethnicity || null,
          bmi: profileData.bmi || null,
          health_conditions: profileData.health_conditions || [],
          medications: profileData.medications || [],
          lifestyle_factors: profileData.lifestyle_factors || {},
          supplement_preferences: profileData.supplement_preferences || {},
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single()
    } else {
      // Create new profile
      result = await userSupabase
        .from('user_demographic_profiles')
        .insert({
          user_id: user.id,
          gender: profileData.gender || null,
          date_of_birth: profileData.date_of_birth || null,
          ethnicity: profileData.ethnicity || null,
          bmi: profileData.bmi || null,
          health_conditions: profileData.health_conditions || [],
          medications: profileData.medications || [],
          lifestyle_factors: profileData.lifestyle_factors || {},
          supplement_preferences: profileData.supplement_preferences || {}
        })
        .select()
        .single()
    }

    if (result.error) {
      console.error('Error saving profile:', result.error)
      return NextResponse.json(
        { error: 'Failed to save profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      profile: result.data,
      message: 'Profile saved successfully'
    })

  } catch (error) {
    console.error('Profile POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 