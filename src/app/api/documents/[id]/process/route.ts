import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/auth-server'
import { ocrService } from '@/lib/ocr-service'
import { aiBiomarkerService } from '@/lib/ai-biomarker-service'
import { downloadFileFromStorage, validateFileForProcessing } from '@/lib/file-utils'

// Configure route for streaming
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes max for Netlify Pro, 10s for free tier

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Resolve the params promise
    const { id: documentId } = await params

    // Check if this is a streaming request
    const isStreaming = request.headers.get('accept') === 'text/stream'
    
    if (isStreaming) {
      return handleStreamingProcess(request, documentId)
    }

    // Get the authenticated user using server-side auth
    const { user, error: authError } = await getAuthenticatedUser(request)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create a Supabase client with the user's token for database operations
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

    // Get document from database
    const { data: document, error: documentError } = await userSupabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (documentError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Check if document is already processed
    if (document.status === 'completed') {
      return NextResponse.json({
        success: true,
        message: 'Document already processed',
        document
      })
    }

    // Update document status to processing
    await userSupabase
      .from('documents')
      .update({ status: 'processing' })
      .eq('id', documentId)

    try {
      // Extract biomarkers from document using real OCR and AI
      const extractionResult = await extractBiomarkersFromDocument(userSupabase, document, token)
      
      if (extractionResult.biomarkers.length === 0) {
        throw new Error('No biomarkers found in document')
      }

      // Update document with extracted data
      const { data: updatedDocument, error: updateError } = await userSupabase
        .from('documents')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
          extracted_biomarkers: extractionResult.biomarkers,
          ocr_data: {
            text: extractionResult.ocrText || "Document processed successfully",
            confidence: extractionResult.overall_confidence
          },
          processing_metadata: {
            document_type: extractionResult.document_type,
            processing_notes: extractionResult.processing_notes,
            extraction_method: extractionResult.extraction_method
          }
        })
        .eq('id', documentId)
        .select()
        .single()

      if (updateError) {
        throw new Error('Failed to update document')
      }

      // Analysis will be triggered manually from the Documents page
      console.log('Document processing completed. Analysis can be triggered manually.')

      return NextResponse.json({
        success: true,
        message: 'Document processed successfully',
        document: updatedDocument,
        extracted_biomarkers: extractionResult.biomarkers,
        processing_info: {
          document_type: extractionResult.document_type,
          confidence: extractionResult.overall_confidence,
          notes: extractionResult.processing_notes
        }
      })

    } catch (processingError) {
      console.error('Processing error:', processingError)
      
      // Update document status to failed
      await userSupabase
        .from('documents')
        .update({ 
          status: 'failed',
          processing_errors: [processingError instanceof Error ? processingError.message : 'Unknown error']
        })
        .eq('id', documentId)

      return NextResponse.json(
        { error: 'Document processing failed', details: processingError instanceof Error ? processingError.message : 'Unknown error' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Document processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// New streaming handler
async function handleStreamingProcess(request: NextRequest, documentId: string) {
  // Get the authenticated user using server-side auth
  const { user, error: authError } = await getAuthenticatedUser(request)
  
  if (authError || !user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Create a Supabase client with the user's token for database operations
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const authorization = request.headers.get('authorization')
  const token = authorization?.replace('Bearer ', '')
  
  if (!token) {
    return new NextResponse('Missing authorization token', { status: 401 })
  }

  const userSupabase = createClient(supabaseUrl!, supabaseKey!, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  })

  // Get document from database
  const { data: document, error: documentError } = await userSupabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .eq('user_id', user.id)
    .single()

  if (documentError || !document) {
    return new NextResponse('Document not found', { status: 404 })
  }

  // Update document status to processing
  await userSupabase
    .from('documents')
    .update({ status: 'processing' })
    .eq('id', documentId)

  // Create a ReadableStream for streaming progress updates
  let isCancelled = false
  let controllerClosed = false
  
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      
      // Heartbeat to keep connection alive (every 15 seconds for serverless functions)
      const heartbeatInterval = setInterval(() => {
        try {
          if (!isCancelled && !controllerClosed && controller.desiredSize !== null) {
            // Send a comment line as heartbeat (SSE format)
            controller.enqueue(encoder.encode(': heartbeat\n\n'))
          }
        } catch (error) {
          clearInterval(heartbeatInterval)
        }
      }, 15000)
      
      const sendUpdate = (status: string, details?: any) => {
        try {
          // Check if stream was cancelled or controller is closed
          if (isCancelled || controllerClosed || controller.desiredSize === null) {
            console.log('Stream cancelled or closed, skipping update:', status)
            clearInterval(heartbeatInterval)
            return
          }
          
          const update = JSON.stringify({ status, details, timestamp: new Date().toISOString() }) + '\n'
          controller.enqueue(encoder.encode(update))
          console.log('📤 [SERVER] Sent update:', status.substring(0, 100), 'at', Date.now())
        } catch (error) {
          // Mark controller as closed to prevent further attempts
          controllerClosed = true
          clearInterval(heartbeatInterval)
          console.log('Failed to send stream update (likely cancelled):', status, error)
        }
      }

              try {
          sendUpdate('Starting document processing...')
          console.log('🚀 [API] Starting streaming biomarker extraction for document:', documentId)

          // Extract biomarkers with streaming updates
          const extractionResult = await extractBiomarkersFromDocumentWithStreaming(
            userSupabase, 
            document, 
            token, 
            (status, details) => {
              console.log('📊 API:', status)
              sendUpdate(status, details)
            }
          )
        
        console.log('Extraction complete:', {
          biomarkersFound: extractionResult.biomarkers.length,
          documentType: extractionResult.document_type,
          confidence: extractionResult.overall_confidence,
          processingNotes: extractionResult.processing_notes
        })
        
        if (extractionResult.biomarkers.length === 0) {
          const errorDetails = {
            documentType: extractionResult.document_type,
            confidence: extractionResult.overall_confidence,
            processingNotes: extractionResult.processing_notes,
            extractionMethod: extractionResult.extraction_method
          }
          console.error('No biomarkers extracted. Details:', errorDetails)
          throw new Error(`No biomarkers found. Extraction details: ${JSON.stringify(errorDetails, null, 2)}`)
        }

        sendUpdate('Saving extracted biomarkers...', { biomarkersFound: extractionResult.biomarkers.length })

        // Save biomarkers to biomarker_readings table immediately
        const biomarkerReadings = extractionResult.biomarkers.map(biomarker => ({
          user_id: user.id,
          document_id: documentId,
          biomarker_id: biomarker.biomarker_id || null,
          biomarker_name: biomarker.name, // Add the extracted biomarker name
          value: biomarker.value,
          unit: biomarker.unit,
          category: biomarker.category || 'other', // Add category from AI extraction
          reference_range: biomarker.reference_range || null, // Add reference range
          confidence: biomarker.confidence,
          matched_from_db: biomarker.matched_from_db || false,
          source_text: biomarker.source_text || null,
          extracted_at: new Date().toISOString()
        }))

        const { error: biomarkerSaveError } = await userSupabase
          .from('biomarker_readings')
          .insert(biomarkerReadings)

        if (biomarkerSaveError) {
          console.error('Error saving biomarker readings:', biomarkerSaveError)
          sendUpdate('Warning: Biomarkers extracted but failed to save to database', { 
            error: biomarkerSaveError.message 
          })
        } else {
          console.log('Successfully saved', biomarkerReadings.length, 'biomarker readings')
          sendUpdate('Biomarkers saved to database', { 
            biomarkersSaved: biomarkerReadings.length 
          })
        }

        // Update document with extracted data
        const { data: updatedDocument, error: updateError } = await userSupabase
          .from('documents')
          .update({
            status: 'completed',
            processed_at: new Date().toISOString(),
            extracted_biomarkers: extractionResult.biomarkers,
            ocr_data: {
              text: extractionResult.ocrText || "Document processed successfully",
              confidence: extractionResult.overall_confidence
            },
            processing_metadata: {
              document_type: extractionResult.document_type,
              processing_notes: extractionResult.processing_notes,
              extraction_method: extractionResult.extraction_method
            }
          })
          .eq('id', documentId)
          .select()
          .single()

        if (updateError) {
          throw new Error('Failed to update document')
        }

        sendUpdate('Document processing completed! Analysis can be triggered manually from the Documents page.', { stage: 'completed' })

        sendUpdate('Processing completed successfully', {
          phase: 'complete',
          document: updatedDocument,
          biomarkersFound: extractionResult.biomarkers.length,
          confidence: extractionResult.overall_confidence
        })

        // Clear heartbeat before closing
        try {
          clearInterval(heartbeatInterval)
        } catch (e) {
          // Ignore
        }
        
        // Only close if not already cancelled or closed
        if (!isCancelled && !controllerClosed) {
          try {
            controller.close()
            controllerClosed = true
          } catch (error) {
            console.log('Controller already closed:', error)
          }
        }

      } catch (error) {
        console.error('❌ STREAMING PROCESSING ERROR ❌')
        console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error)
        console.error('Error message:', error instanceof Error ? error.message : String(error))
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
        console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        const errorStack = error instanceof Error ? error.stack : undefined
        
        // Update document status to failed with detailed error info
        await userSupabase
          .from('documents')
          .update({ 
            status: 'failed',
            processing_errors: [errorMessage],
            processing_metadata: {
              error_details: {
                message: errorMessage,
                stack: errorStack,
                timestamp: new Date().toISOString(),
                type: error instanceof Error ? error.constructor.name : typeof error
              }
            }
          })
          .eq('id', documentId)

        sendUpdate('Processing failed', { 
          phase: 'error',
          error: errorMessage,
          errorType: error instanceof Error ? error.constructor.name : typeof error
        })
        
        // Clear heartbeat on error
        try {
          clearInterval(heartbeatInterval)
        } catch (e) {
          // Ignore
        }
        
        // Only close if not already cancelled or closed
        if (!isCancelled && !controllerClosed) {
          try {
            controller.close()
            controllerClosed = true
          } catch (closeError) {
            console.log('Controller already closed during error handling:', closeError)
          }
        }
      }
    },
    
    cancel(reason) {
      console.log('Stream cancelled by client:', reason)
      isCancelled = true
      controllerClosed = true
    }
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Transfer-Encoding': 'chunked',
    },
  })
}

// Real biomarker extraction function using OCR and AI
async function extractBiomarkersFromDocument(userSupabase: any, document: any, authToken: string) {
  console.log('Starting real biomarker extraction for document:', document.id)
  
  try {
    // Step 1: Validate file for processing
    const validation = validateFileForProcessing(document.mimetype, document.filesize)
    if (!validation.isValid) {
      throw new Error(`File validation failed: ${validation.errors.join(', ')}`)
    }

    // Step 2: Download file from storage
    console.log('Downloading file from storage:', document.storage_path)
    console.log('Document details:', { 
      id: document.id, 
      filename: document.filename, 
      mimetype: document.mimetype,
      filesize: document.filesize,
      storage_path: document.storage_path 
    })
    const fileData = await downloadFileFromStorage(document.storage_path, authToken)

    // Step 3: Extract text using OCR
    console.log('Performing OCR extraction...')
    console.log('OCR input details:', {
      bufferSize: fileData.buffer.length,
      mimeType: document.mimetype,
      contentType: fileData.contentType
    })
    
    let ocrResult
    try {
      ocrResult = await ocrService.extractText(fileData.buffer, document.mimetype, {
        language: 'eng',
        preprocessImage: true
      })
    } catch (ocrError) {
      console.error('OCR Service Error:', ocrError)
      throw new Error(`OCR processing failed: ${ocrError instanceof Error ? ocrError.message : 'Unknown OCR error'}`)
    }

    // Step 4: Validate OCR quality
    const ocrQuality = ocrService.validateOCRQuality(ocrResult)
    console.log('OCR quality:', ocrQuality)

    // Step 5: Get known biomarkers from database
  const { data: knownBiomarkers } = await userSupabase
    .from('biomarkers')
    .select('id, name, aliases, unit, category')
    .eq('is_active', true)

    // Step 6: Extract biomarkers using comprehensive AI extraction
    console.log('Extracting biomarkers using comprehensive AI extraction...')
    console.log('OCR text sample:', ocrResult.text.substring(0, 200))
    console.log('Known biomarkers count:', knownBiomarkers?.length || 0)
    
    const biomarkerResult = await aiBiomarkerService.extractBiomarkers(
      ocrResult.text,
      knownBiomarkers || [],
      true // Use AI-first approach for maximum biomarker discovery
    )
    
    console.log('AI extraction result:', {
      biomarkersFound: biomarkerResult.biomarkers.length,
      confidence: biomarkerResult.overall_confidence,
      processingNotes: biomarkerResult.processing_notes
    })

    // Step 7: Compile final result
    const finalResult = {
      biomarkers: biomarkerResult.biomarkers,
      document_type: biomarkerResult.document_type || 'unknown',
      processing_notes: [
        ...biomarkerResult.processing_notes,
        ...(ocrQuality.issues.length > 0 ? [`OCR issues: ${ocrQuality.issues.join(', ')}`] : []),
        `OCR confidence: ${Math.round(ocrResult.confidence * 100)}%`,
        `Processing time: ${ocrResult.metadata?.processingTime}ms`
      ],
      overall_confidence: biomarkerResult.overall_confidence,
      extraction_method: biomarkerResult.processing_notes.some(note => note.includes('comprehensive AI')) ? 'ai_comprehensive' : 
                        biomarkerResult.processing_notes.some(note => note.includes('legacy pattern')) ? 'legacy_fallback' : 'unknown',
      ocrText: ocrResult.text.substring(0, 500) + '...', // First 500 chars for debugging
      ocrConfidence: ocrResult.confidence
    }

    console.log(`Extraction complete. Found ${finalResult.biomarkers.length} biomarkers with ${Math.round(finalResult.overall_confidence * 100)}% confidence`)
    
    return finalResult

  } catch (error) {
    console.error('Biomarker extraction failed:', error)
    
    // Return error result
    return {
      biomarkers: [],
      document_type: 'unknown',
      processing_notes: [`Extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      overall_confidence: 0,
      extraction_method: 'failed',
      ocrText: '',
      ocrConfidence: 0
    }
  }
}

// Streaming version of biomarker extraction with progress updates
async function extractBiomarkersFromDocumentWithStreaming(
  userSupabase: any, 
  document: any, 
  authToken: string,
  onProgress: (status: string, details?: any) => void
) {
  console.log('Starting real biomarker extraction for document:', document.id)
  
  try {
    onProgress('Validating file for processing...', { stage: 'validation' })

    // Step 1: Validate file for processing
    const validation = validateFileForProcessing(document.mimetype, document.filesize)
    if (!validation.isValid) {
      throw new Error(`File validation failed: ${validation.errors.join(', ')}`)
    }

    onProgress('Downloading file from storage...', { stage: 'download' })

    // Step 2: Download file from storage
    console.log('Downloading file from storage:', document.storage_path)
    console.log('Document details:', { 
      id: document.id, 
      filename: document.filename, 
      mimetype: document.mimetype,
      filesize: document.filesize,
      storage_path: document.storage_path 
    })
    const fileData = await downloadFileFromStorage(document.storage_path, authToken)

    onProgress('Performing OCR text extraction...', { stage: 'ocr' })

    // Step 3: Extract text using OCR
    console.log('Performing OCR extraction...')
    console.log('OCR input details:', {
      bufferSize: fileData.buffer.length,
      mimeType: document.mimetype,
      contentType: fileData.contentType
    })
    
    let ocrResult
    try {
      ocrResult = await ocrService.extractText(fileData.buffer, document.mimetype, {
        language: 'eng',
        preprocessImage: true
      })
      console.log('✅ OCR extraction successful, text length:', ocrResult.text.length)
      console.log('📄 OCR text preview (first 500 chars):', ocrResult.text.substring(0, 500))
    } catch (ocrError) {
      console.error('❌ OCR Service Error - CRITICAL:', ocrError)
      console.error('OCR error details:', {
        type: ocrError instanceof Error ? ocrError.constructor.name : typeof ocrError,
        message: ocrError instanceof Error ? ocrError.message : String(ocrError),
        stack: ocrError instanceof Error ? ocrError.stack : 'No stack'
      })
      throw new Error(`OCR processing failed: ${ocrError instanceof Error ? ocrError.message : 'Unknown OCR error'}`)
    }

    onProgress('Validating OCR quality...', { stage: 'ocr_validation' })

    // Step 4: Validate OCR quality
    const ocrQuality = ocrService.validateOCRQuality(ocrResult)
    console.log('OCR quality:', ocrQuality)

    onProgress('Loading biomarker database...', { stage: 'database' })

    // Step 5: Get known biomarkers from database
    const { data: knownBiomarkers } = await userSupabase
      .from('biomarkers')
      .select('id, name, aliases, unit, category')
      .eq('is_active', true)

    onProgress('Starting AI biomarker extraction...', { 
      stage: 'ai_extraction',
      textLength: ocrResult.text.length,
      knownBiomarkersCount: knownBiomarkers?.length || 0
    })

    // Step 6: Extract biomarkers using comprehensive AI extraction with streaming
    console.log('Extracting biomarkers using comprehensive AI extraction...')
    console.log('OCR text sample (first 200 chars):', ocrResult.text.substring(0, 200))
    console.log('OCR text length:', ocrResult.text.length)
    console.log('Known biomarkers count:', knownBiomarkers?.length || 0)
    
    let biomarkerResult
    try {
      biomarkerResult = await aiBiomarkerService.extractBiomarkersWithStreaming(
        ocrResult.text,
        knownBiomarkers || [],
        true, // Use AI-first approach for maximum biomarker discovery
        (status, details) => {
          console.log('🤖 AI Service:', status)
          onProgress(status, details)
        }
      )
    } catch (aiExtractionError) {
      console.error('❌ AI EXTRACTION FAILED - CRITICAL ERROR:', aiExtractionError)
      console.error('Error details:', {
        type: aiExtractionError instanceof Error ? aiExtractionError.constructor.name : typeof aiExtractionError,
        message: aiExtractionError instanceof Error ? aiExtractionError.message : String(aiExtractionError),
        stack: aiExtractionError instanceof Error ? aiExtractionError.stack : 'No stack'
      })
      throw new Error(`AI biomarker extraction failed: ${aiExtractionError instanceof Error ? aiExtractionError.message : String(aiExtractionError)}`)
    }
    
    console.log('✅ AI extraction completed successfully')
    console.log('AI extraction result:', {
      biomarkersFound: biomarkerResult.biomarkers.length,
      confidence: biomarkerResult.overall_confidence,
      documentType: biomarkerResult.document_type,
      processingNotes: biomarkerResult.processing_notes
    })

    onProgress('Compiling final results...', { stage: 'finalization' })

    // Step 7: Compile final result
    const finalResult = {
      biomarkers: biomarkerResult.biomarkers,
      document_type: biomarkerResult.document_type || 'unknown',
      processing_notes: [
        ...biomarkerResult.processing_notes,
        ...(ocrQuality.issues.length > 0 ? [`OCR issues: ${ocrQuality.issues.join(', ')}`] : []),
        `OCR confidence: ${Math.round(ocrResult.confidence * 100)}%`,
        `Processing time: ${ocrResult.metadata?.processingTime}ms`
      ],
      overall_confidence: biomarkerResult.overall_confidence,
      extraction_method: biomarkerResult.processing_notes.some(note => note.includes('comprehensive AI')) ? 'ai_comprehensive' : 
                        biomarkerResult.processing_notes.some(note => note.includes('legacy pattern')) ? 'legacy_fallback' : 'unknown',
      ocrText: ocrResult.text.substring(0, 500) + '...', // First 500 chars for debugging
      ocrConfidence: ocrResult.confidence
    }

    console.log(`Extraction complete. Found ${finalResult.biomarkers.length} biomarkers with ${Math.round(finalResult.overall_confidence * 100)}% confidence`)
    
    return finalResult

  } catch (error) {
    console.error('❌ BIOMARKER EXTRACTION FAILED - TOP LEVEL ERROR')
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    onProgress('Extraction failed', { 
      stage: 'error', 
      error: errorMessage,
      errorType: error instanceof Error ? error.constructor.name : typeof error
    })
    
    // Return detailed error result
    return {
      biomarkers: [],
      document_type: 'unknown',
      processing_notes: [
        `Extraction failed: ${errorMessage}`,
        `Error type: ${error instanceof Error ? error.constructor.name : typeof error}`,
        ...(error instanceof Error && error.stack ? [`Stack: ${error.stack.substring(0, 500)}`] : [])
      ],
      overall_confidence: 0,
      extraction_method: 'failed',
      ocrText: '',
      ocrConfidence: 0
    }
  }
}

 