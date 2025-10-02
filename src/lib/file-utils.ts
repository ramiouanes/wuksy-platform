import { createClient } from '@supabase/supabase-js'

export interface FileDownloadResult {
  buffer: Buffer
  contentType: string
  size: number
}

/**
 * Download a file from Supabase storage
 */
export async function downloadFileFromStorage(
  storagePath: string,
  authToken: string
): Promise<FileDownloadResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing')
  }

  const userSupabase = createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    },
  })

  try {
    console.log(`Attempting to download file from Supabase storage: ${storagePath}`)
    
    const { data, error } = await userSupabase.storage
      .from('documents')
      .download(storagePath)

    if (error) {
      console.error('Supabase storage download error:', error)
      throw new Error(`Failed to download file: ${error.message}`)
    }

    if (!data) {
      throw new Error('No file data received')
    }

    console.log(`File downloaded successfully, type: ${data.type}, size: ${data.size}`)

    // Convert blob to buffer
    const arrayBuffer = await data.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    console.log(`File converted to buffer, final size: ${buffer.length} bytes`)

    return {
      buffer,
      contentType: data.type || 'application/octet-stream',
      size: data.size || buffer.length
    }
  } catch (error) {
    console.error('File download error:', error)
    throw new Error(`File download failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Validate file for processing
 */
export function validateFileForProcessing(
  mimeType: string,
  fileSize: number
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check supported file types
  const supportedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/webp'
  ]

  if (!supportedTypes.includes(mimeType)) {
    errors.push(`Unsupported file type: ${mimeType}`)
  }

  // Check file size (max 10MB for processing)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (fileSize > maxSize) {
    errors.push(`File size (${fileSize} bytes) exceeds maximum (${maxSize} bytes)`)
  }

  // Check minimum file size
  const minSize = 100 // 100 bytes
  if (fileSize < minSize) {
    errors.push(`File size (${fileSize} bytes) is too small`)
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Get file type category for processing decisions
 */
export function getFileTypeCategory(mimeType: string): 'pdf' | 'image' | 'unknown' {
  if (mimeType === 'application/pdf') {
    return 'pdf'
  } else if (mimeType.startsWith('image/')) {
    return 'image'
  } else {
    return 'unknown'
  }
}

/**
 * Estimate processing time based on file type and size
 */
export function estimateProcessingTime(mimeType: string, fileSize: number): number {
  const category = getFileTypeCategory(mimeType)
  
  // Base time in seconds
  let baseTime = 5
  
  if (category === 'pdf') {
    baseTime = 10 // PDFs take longer
  } else if (category === 'image') {
    baseTime = 8 // Images with OCR
  }
  
  // Add time based on file size (1 second per MB)
  const sizeInMB = fileSize / (1024 * 1024)
  const sizeTime = Math.ceil(sizeInMB)
  
  return Math.max(baseTime + sizeTime, 5) // Minimum 5 seconds
} 