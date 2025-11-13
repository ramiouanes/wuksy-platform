import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, isAuthError, unauthorizedResponse } from '@/lib/auth/api-auth'

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user using unified auth helper
    const authResult = await getAuthenticatedUser(request)
    
    if (isAuthError(authResult)) {
      return unauthorizedResponse(authResult.error)
    }
    
    const { user, supabase } = authResult

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type and size
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/bmp',
      'image/webp'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload PDF or image files.' },
        { status: 400 }
      )
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${user.id}/${timestamp}_${cleanFileName}`

    // Upload file to Supabase Storage using authenticated client
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    // Save document metadata to database using authenticated client
    const { data: documentData, error: dbError } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        filename: file.name,
        filesize: file.size,
        mimetype: file.type,
        storage_path: uploadData.path,
        status: 'uploading'
      })
      .select()
      .single() as { data: any | null; error: any }

    if (dbError) {
      console.error('Database error:', dbError)
      // Try to clean up uploaded file
      await supabase.storage
        .from('documents')
        .remove([fileName])
      
      return NextResponse.json(
        { error: 'Failed to save document metadata' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      document: documentData,
      message: 'File uploaded successfully'
    })

  } catch (error) {
    console.error('Upload endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
