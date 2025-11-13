import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, isAuthError, unauthorizedResponse } from '@/lib/auth/api-auth'

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user using unified auth helper
    const authResult = await getAuthenticatedUser(request)
    
    if (isAuthError(authResult)) {
      return unauthorizedResponse(authResult.error)
    }

    const { user, supabase } = authResult

    // Get user demographic profile
    const { data: profile, error: profileError } = await supabase
      .from('user_demographic_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single() as { data: any | null; error: any }

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
    // Get the authenticated user using unified auth helper
    const authResult = await getAuthenticatedUser(request)
    
    if (isAuthError(authResult)) {
      return unauthorizedResponse(authResult.error)
    }

    const { user, supabase } = authResult

    const profileData = await request.json()

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('user_demographic_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single() as { data: { id: string } | null; error: any }

    let result
    if (existingProfile) {
      // Update existing profile
      result = await supabase
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
        .single() as { data: any | null; error: any }
    } else {
      // Create new profile
      result = await supabase
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
        .single() as { data: any | null; error: any }
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
