// Client-side API functions for static deployment
import { supabase } from './supabase'

export async function uploadDocument(file: File, userId: string) {
  try {
    // Upload file to Supabase storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file)

    if (uploadError) throw uploadError

    // Create document record
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .insert({
        user_id: userId,
        filename: file.name,
        file_path: uploadData.path,
        file_size: file.size,
        mime_type: file.type,
        upload_status: 'completed'
      })
      .select()
      .single()

    if (docError) throw docError

    return { success: true, document: docData }
  } catch (error) {
    console.error('Upload error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' }
  }
}

export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_demographic_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    return { success: true, profile: data }
  } catch (error) {
    console.error('Profile fetch error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' }
  }
}

export async function updateUserProfile(userId: string, profileData: any) {
  try {
    const { data, error } = await supabase
      .from('user_demographic_profiles')
      .upsert({
        user_id: userId,
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, profile: data }
  } catch (error) {
    console.error('Profile update error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' }
  }
}

export async function getBiomarkers() {
  try {
    const { data, error } = await supabase
      .from('biomarkers')
      .select('*')
      .order('name')

    if (error) throw error

    return { success: true, biomarkers: data }
  } catch (error) {
    console.error('Biomarkers fetch error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' }
  }
}

export async function generateAnalysis(userId: string, documentId: string) {
  try {
    // This would typically call an external API or edge function
    // For now, return a placeholder
    const analysisData = {
      user_id: userId,
      document_id: documentId,
      analysis_type: 'comprehensive',
      status: 'completed',
      insights: 'Analysis functionality requires server-side processing.',
      recommendations: 'Please consider using a platform that supports API routes for full functionality.'
    }

    const { data, error } = await supabase
      .from('health_analyses')
      .insert(analysisData)
      .select()
      .single()

    if (error) throw error

    return { success: true, analysis: data }
  } catch (error) {
    console.error('Analysis generation error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' }
  }
}
