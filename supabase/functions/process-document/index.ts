/**
 * Supabase Edge Function: process-document
 * 
 * Handles background document processing with OCR and AI biomarker extraction
 * 150-second timeout (Supabase free tier)
 * 
 * Flow:
 * 1. Validate document exists and user has access
 * 2. Update status to "processing"
 * 3. Download file from Supabase storage
 * 4. Extract text with OCR
 * 5. Call OpenAI for biomarker extraction
 * 6. Save biomarkers to database
 * 7. Update document status to "completed"
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, handleCorsPrelight, corsResponse, corsErrorResponse } from '../_shared/cors.ts'
import { createServiceClient } from '../_shared/supabase-client.ts'
import OpenAI from "jsr:@openai/openai"
import { saveOpenAIUsage, extractUsageFromChunk } from '../_shared/openai-usage-tracker.ts'

/**
 * Helper function to write processing updates to database
 * 
 * Updates the documents table and inserts into document_processing_updates table
 */
async function writeProcessingUpdate(
  documentId: string,
  phase: string,
  message: string,
  details?: Record<string, any>
) {
  try {
    const supabase = createServiceClient()
    
    const timestamp = new Date().toISOString()
    console.log(`📝 [${timestamp}] [${documentId}] Writing DB update - Phase: ${phase} - ${message}`)
    if (details?.thoughtProcess) {
      console.log(`   💭 ThoughtProcess: ${details.thoughtProcess.substring(0, 100)}...`)
    }
    
    // Update documents table with latest status
    const updateData: any = {
      status: phase === 'complete' ? 'completed' : phase === 'error' ? 'failed' : 'processing',
      last_update_at: timestamp
    }
    
    // Add processed_at and processing_completed_at when complete
    if (phase === 'complete') {
      updateData.processed_at = timestamp
      updateData.processing_completed_at = timestamp
    }
    
    // Add processing_completed_at on error
    if (phase === 'error') {
      updateData.processing_completed_at = timestamp
    }
    
    const { error: updateError } = await supabase
      .from('documents')
      .update(updateData)
      .eq('id', documentId)
    
    if (updateError) {
      console.error(`❌ Failed to update document ${documentId}:`, updateError)
    } else {
      console.log(`✅ Document table updated successfully`)
    }
    
    // Insert detailed update into document_processing_updates table
    const { error: insertError } = await supabase
      .from('document_processing_updates')
      .insert({
        document_id: documentId,
        phase,
        message,
        details: details || {}
      })
    
    if (insertError) {
      console.error(`❌ Failed to insert processing update for ${documentId}:`, insertError)
    } else {
      console.log(`✅ Processing update row inserted successfully`)
    }
    
  } catch (error) {
    console.error(`❌ Error writing processing update for ${documentId}:`, error)
  }
}

/**
 * Download file from Supabase storage
 */
async function downloadFileFromStorage(storagePath: string): Promise<{
  data: Uint8Array
  contentType: string
  size: number
}> {
  const supabase = createServiceClient()
  
  console.log(`📥 Downloading file from storage: ${storagePath}`)
  
  const { data, error } = await supabase.storage
    .from('documents')
    .download(storagePath)
  
  if (error || !data) {
    throw new Error(`Failed to download file: ${error?.message || 'No data received'}`)
  }
  
  const arrayBuffer = await data.arrayBuffer()
  const uint8Array = new Uint8Array(arrayBuffer)
  
  console.log(`✅ File downloaded: ${uint8Array.length} bytes, type: ${data.type}`)
  
  return {
    data: uint8Array,
    contentType: data.type || 'application/octet-stream',
    size: uint8Array.length
  }
}

/**
 * Extract text from PDF using pdf-parse (Deno compatible via npm:)
 */
async function extractTextFromPDF(fileData: Uint8Array): Promise<{
  text: string
  confidence: number
}> {
  try {
    console.log('📄 Processing PDF with pdf-parse...')
    
    // Import pdf-parse via Deno's npm compatibility
    // @ts-ignore - Deno npm imports
    const pdfParse = (await import('npm:pdf-parse@1.1.1')).default
    
    // Convert Uint8Array to Buffer for pdf-parse
    const buffer = fileData.buffer.slice(
      fileData.byteOffset,
      fileData.byteOffset + fileData.byteLength
    )
    
    console.log('🔍 Parsing PDF...')
    
    // Parse the PDF
    const data = await pdfParse(buffer)
    
    console.log(`✅ PDF parsed: ${data.numpages} pages, ${data.text.length} characters`)
    
    return {
      text: data.text,
      confidence: 0.95 // High confidence for direct PDF text extraction
    }
  } catch (error) {
    console.error('❌ PDF text extraction failed:', error)
    throw new Error(`PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Extract text from image using OCR.space API (free tier)
 */
async function extractTextFromImage(fileData: Uint8Array): Promise<{
  text: string
  confidence: number
}> {
  try {
    // Convert Uint8Array to base64
    const base64 = btoa(String.fromCharCode(...fileData))
    
    // Use OCR.space free API (no key required for limited requests)
    const formData = new FormData()
    formData.append('base64Image', `data:image/jpeg;base64,${base64}`)
    formData.append('language', 'eng')
    formData.append('isOverlayRequired', 'false')
    
    console.log('🔍 Calling OCR.space API...')
    
    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: formData,
    })
    
    if (!response.ok) {
      throw new Error(`OCR API failed: ${response.statusText}`)
    }
    
    const result = await response.json()
    
    if (result.IsErroredOnProcessing || !result.ParsedResults?.[0]) {
      throw new Error(result.ErrorMessage || 'OCR processing failed')
    }
    
    const text = result.ParsedResults[0].ParsedText
    const confidence = result.ParsedResults[0].FileParseExitCode === 1 ? 0.8 : 0.6
    
    console.log(`✅ OCR completed: ${text.length} characters extracted`)
    
    return {
      text,
      confidence
    }
  } catch (error) {
    console.error('❌ Image OCR failed:', error)
    throw new Error(`Image OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Extract biomarkers using OpenAI Responses API with streaming reasoning (GPT-5)
 */
async function extractBiomarkersWithAI(
  text: string,
  knownBiomarkers: any[],
  documentId: string,
  userId: string
): Promise<{
  biomarkers: any[]
  documentType: string
  confidence: number
  processingNotes: string[]
}> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured')
  }
  
  console.log('🤖 Starting AI biomarker extraction with streaming...')
  await writeProcessingUpdate(documentId, 'ai_extraction', '🤖 AI is preparing to analyze your document...', {
    thoughtProcess: 'Initializing AI analysis system and preparing document for biomarker extraction...',
    textLength: text.length,
    knownBiomarkersCount: knownBiomarkers.length
  })
  
  const model = Deno.env.get('OPENAI_MODEL') || 'gpt-5-mini'
  
  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: openaiApiKey
  })
  
  const systemPrompt = `You are an expert medical data extraction specialist with deep knowledge of laboratory tests, biomarkers, and medical terminology. Your task is to extract ALL biomarkers and their values from medical documents with maximum accuracy and completeness.

CRITICAL INSTRUCTIONS:
1. Extract EVERY biomarker present in the document, not just common ones
2. Include numeric values, units, and reference ranges when available
3. Handle all naming variations (abbreviations, full names, alternative spellings)
4. Maintain high accuracy - only extract clear, unambiguous biomarker data
5. Assign confidence scores based on clarity and certainty of extraction
6. Categorize biomarkers appropriately (vitamins, hormones, lipids, etc.)

Return ONLY valid JSON with this exact structure - no additional text or explanations:`

  const userPrompt = `Extract ALL biomarkers from this medical document text. Be comprehensive and thorough.

Document Text:
"""
${text}
"""

Known biomarkers in database (for reference only - extract ALL biomarkers found, not just these):
${knownBiomarkers.map(b => `${b.name} (${b.category})`).join(', ')}

You must respond with valid JSON only, no other text. Required JSON Response Format:
{
  "biomarkers": [
    {
      "name": "Full standardized biomarker name",
      "value": numeric_value_only,
      "unit": "standardized_unit",
      "reference_range": "normal range if mentioned",
      "confidence": confidence_score_0_to_1,
      "source_text": "exact text where found",
      "category": "vitamins|hormones|lipids|metabolic|minerals|inflammatory|other",
      "aliases": ["alternative names or abbreviations"]
    }
  ],
  "document_type": "lab_report|blood_test|urine_test|imaging_report|other",
  "processing_notes": ["notes about extraction quality and any issues"],
  "total_biomarkers_found": number
}

EXTRACTION RULES:
- Only include biomarkers with clear numeric values and units
- Use full standardized names (e.g., "25-Hydroxyvitamin D" not "Vit D")
- Standardize units (e.g., "ng/mL" not "ng/ml" or "nanograms per milliliter")
- Extract reference ranges exactly as written in document
- Set confidence based on clarity: 0.9+ for clear values, 0.7-0.8 for good clarity, 0.5-0.6 for uncertain
- Include ALL biomarkers found, even rare or uncommon ones`

  try {
    console.log('📡 Calling OpenAI Responses API with streaming enabled...')
    
    // Use the Responses API with streaming (same as webapp!)
    const responseStream = await openai.responses.create({
      model,
      input: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: [
            { type: "input_text", text: userPrompt }
          ]
        }
      ],
      stream: true,
      stream_options: { include_usage: true },
      reasoning: {
        effort: "low", // Low reasoning effort for faster extraction
        summary: "auto" // Get reasoning summaries
      },
      text: {
        format: { type: "json_object" }
      }
    })
    
    console.log('✅ Stream established, processing chunks...')
    
    let fullResponse = ''
    let chunkCount = 0
    let lastUpdateTime = 0
    const updateInterval = 400 // Update database every 400ms
    let currentReasoningText = ''
    let usageData: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | null = null
    
    try {
      // Process streaming response chunks
      for await (const chunk of responseStream) {
        chunkCount++
        
        // Handle reasoning summary text streaming (this is what the user sees!)
        if (chunk.type === 'response.reasoning_summary_text.delta') {
          const delta = (chunk as any).delta
          if (delta) {
            currentReasoningText += delta
          }
        }
        // Handle complete reasoning summary
        else if (chunk.type === 'response.reasoning_summary_text.done') {
          const summaryText = (chunk as any).text
          if (summaryText && summaryText.trim()) {
            currentReasoningText = summaryText
            
            // Extract key insight (first sentence for brevity)
            const firstSentence = summaryText.split(/[.!?]/)[0]?.trim() || summaryText
            console.log(`🧠 AI reasoning: ${firstSentence}`)
            
            // Write to database - this is the actual AI's thought process
            const now = Date.now()
            if (now - lastUpdateTime >= updateInterval) {
              await writeProcessingUpdate(
                documentId,
                'ai_extraction',
                '🧠 AI is analyzing the document...',
                {
                  thoughtProcess: summaryText, // Show full reasoning from AI
                  chunksReceived: chunkCount,
                  status: 'reasoning'
                }
              )
              lastUpdateTime = now
            }
            
            currentReasoningText = '' // Reset for next summary
          }
        }
        // Handle output text deltas (the actual JSON response)
        else if (chunk.type === 'response.output_text.delta') {
          const delta = (chunk as any).delta
          if (delta) {
            fullResponse += delta
          }
        }
        // Handle complete output text
        else if (chunk.type === 'response.output_text.done') {
          const outputText = (chunk as any).output_text
          if (outputText) {
            fullResponse = outputText
          }
        }
        
        // Check for usage data in any chunk
        const extractedUsage = extractUsageFromChunk(chunk)
        if (extractedUsage) {
          usageData = extractedUsage
        }
      }
    } catch (streamError) {
      console.error('❌ Stream processing error:', streamError)
      throw streamError
    }
    
    console.log('📝 AI response complete, parsing results...')
    console.log('📝 Full response length:', fullResponse.length)
    
    // Save usage data if available
    if (usageData) {
      console.log('📊 Token usage:', usageData)
      await saveOpenAIUsage({
        user_id: userId,
        request_type: 'biomarker_extraction',
        request_id: documentId,
        model,
        prompt_tokens: usageData.prompt_tokens,
        completion_tokens: usageData.completion_tokens,
        total_tokens: usageData.total_tokens,
        metadata: { chunk_count: chunkCount, total_bytes: fullResponse.length }
      }).catch(err => {
        console.error('⚠️ Failed to save usage (non-critical):', err)
      })
    }
    
    // Write final update
    await writeProcessingUpdate(documentId, 'ai_extraction', '🔬 Parsing AI results...', {
      thoughtProcess: `AI analysis complete! Processing ${chunkCount} chunks of biomarker data. Validating and organizing extracted information...`,
      totalChunks: chunkCount,
      totalBytes: fullResponse.length,
      status: 'parsing'
    })
    
    // Parse the complete AI response
    const aiResult = JSON.parse(fullResponse)
    
    if (!aiResult.biomarkers || !Array.isArray(aiResult.biomarkers)) {
      throw new Error('Invalid AI response structure')
    }
    
    console.log(`✅ AI extracted ${aiResult.biomarkers.length} biomarkers`)
    
    // Generate detailed summary of what was found
    const avgConfidence = aiResult.biomarkers.length > 0
      ? aiResult.biomarkers.reduce((sum: number, b: any) => sum + (b.confidence || 0), 0) / aiResult.biomarkers.length
      : 0
    
    const categories = [...new Set(aiResult.biomarkers.map((b: any) => b.category).filter(Boolean))]
    const categorySummary = categories.length > 0 
      ? ` across ${categories.length} categor${categories.length > 1 ? 'ies' : 'y'} (${categories.slice(0, 3).join(', ')}${categories.length > 3 ? '...' : ''})`
      : ''
    
    const summaryText = `Successfully extracted ${aiResult.biomarkers.length} biomarker${aiResult.biomarkers.length !== 1 ? 's' : ''}${categorySummary} with ${Math.round(avgConfidence * 100)}% average confidence. All values have been validated and are ready for analysis.`
    
    await writeProcessingUpdate(documentId, 'ai_extraction', `✅ Found ${aiResult.biomarkers.length} biomarkers`, {
      biomarkersFound: aiResult.biomarkers.length,
      thoughtProcess: summaryText,
      confidence: avgConfidence,
      categories: categories
    })
    
    // Calculate overall confidence
    const overallConfidence = aiResult.biomarkers.length > 0
      ? aiResult.biomarkers.reduce((sum: number, b: any) => sum + (b.confidence || 0), 0) / aiResult.biomarkers.length
      : 0
    
    return {
      biomarkers: aiResult.biomarkers,
      documentType: aiResult.document_type || 'unknown',
      confidence: overallConfidence,
      processingNotes: aiResult.processing_notes || []
    }
  } catch (error) {
    console.error('❌ AI extraction failed:', error)
    throw new Error(`AI extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Save extracted biomarkers to database
 */
async function saveBiomarkers(
  documentId: string,
  userId: string,
  biomarkers: any[],
  knownBiomarkers: any[]
): Promise<void> {
  const supabase = createServiceClient()
  
  console.log(`💾 Saving ${biomarkers.length} biomarkers to database...`)
  
  // Match biomarkers with database and prepare for insertion
  const biomarkerReadings = biomarkers.map(biomarker => {
    // Find matching biomarker in database
    const dbBiomarker = knownBiomarkers.find(kb => 
      kb.name.toLowerCase() === biomarker.name.toLowerCase() ||
      (kb.aliases && kb.aliases.some((alias: string) => 
        alias.toLowerCase() === biomarker.name.toLowerCase()
      ))
    )
    
    return {
      user_id: userId,
      document_id: documentId,
      biomarker_id: dbBiomarker?.id || null,
      biomarker_name: biomarker.name, // Required by biomarker_identification_required constraint
      value: biomarker.value,
      unit: biomarker.unit,
      category: biomarker.category || 'other',
      reference_range: biomarker.reference_range || null,
      confidence: biomarker.confidence || null,
      source_text: biomarker.source_text || null,
      matched_from_db: !!dbBiomarker,
      extracted_at: new Date().toISOString()
    }
  })
  
  const { error } = await supabase
    .from('biomarker_readings')
    .insert(biomarkerReadings)
  
  if (error) {
    console.error('❌ Failed to save biomarkers:', error)
    throw new Error(`Failed to save biomarkers: ${error.message}`)
  }
  
  console.log(`✅ Saved ${biomarkerReadings.length} biomarker readings`)
}

/**
 * Main async processing function
 */
async function processDocumentAsync(
  documentId: string,
  userId: string,
  document: any
) {
  try {
    console.log(`🚀 Starting async processing for document ${documentId}`)
    
    // Step 1: Validation
    await writeProcessingUpdate(documentId, 'validation', 'Validating document...', {
      filename: document.filename,
      mimetype: document.mimetype
    })
    
    // Validate file type
    const supportedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/webp'
    ]
    
    if (!supportedTypes.includes(document.mimetype)) {
      throw new Error(`Unsupported file type: ${document.mimetype}`)
    }
    
    // Step 2: Download file
    await writeProcessingUpdate(documentId, 'download', 'Downloading file from storage...', {})
    
    const fileData = await downloadFileFromStorage(document.storage_path)
    
    await writeProcessingUpdate(documentId, 'download', 'File downloaded successfully', {
      fileSize: fileData.size
    })
    
    // Step 3: Extract text (OCR or PDF)
    await writeProcessingUpdate(documentId, 'ocr', 'Extracting text from document...', {})
    
    let extractedText: string
    let ocrConfidence: number
    
    if (document.mimetype === 'application/pdf') {
      console.log('📄 Processing PDF...')
      const result = await extractTextFromPDF(fileData.data)
      extractedText = result.text
      ocrConfidence = result.confidence
    } else if (document.mimetype.startsWith('image/')) {
      console.log('🖼️ Processing image...')
      const result = await extractTextFromImage(fileData.data)
      extractedText = result.text
      ocrConfidence = result.confidence
    } else {
      throw new Error('Unsupported file type for text extraction')
    }
    
    await writeProcessingUpdate(documentId, 'ocr', 'Text extracted successfully', {
      textLength: extractedText.length,
      confidence: ocrConfidence
    })
    
    // Step 4: Get known biomarkers
    const supabase = createServiceClient()
    const { data: knownBiomarkers } = await supabase
      .from('biomarkers')
      .select('id, name, aliases, unit, category')
      .eq('is_active', true)
    
    // Step 5: AI extraction
    const aiResult = await extractBiomarkersWithAI(
      extractedText,
      knownBiomarkers || [],
      documentId,
      userId
    )
    
    // Step 6: Save biomarkers
    await writeProcessingUpdate(documentId, 'saving', 'Saving extracted biomarkers...', {
      biomarkersCount: aiResult.biomarkers.length
    })
    
    await saveBiomarkers(
      documentId,
      userId,
      aiResult.biomarkers,
      knownBiomarkers || []
    )
    
    // Step 7: Update document with results
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        extracted_biomarkers: aiResult.biomarkers,
        ocr_data: {
          text: extractedText.substring(0, 1000), // Store first 1000 chars
          confidence: ocrConfidence
        },
        processing_metadata: {
          document_type: aiResult.documentType,
          biomarkers_found: aiResult.biomarkers.length,
          overall_confidence: aiResult.confidence,
          processing_notes: aiResult.processingNotes
        }
      })
      .eq('id', documentId)
    
    if (updateError) {
      console.error('❌ Failed to update document with results:', updateError)
    }
    
    // Step 8: Mark as complete
    await writeProcessingUpdate(documentId, 'complete', 'Processing complete!', {
      biomarkersFound: aiResult.biomarkers.length,
      confidence: aiResult.confidence
    })
    
    console.log(`✅ Document ${documentId} processed successfully`)
    
  } catch (error) {
    console.error(`❌ Processing failed for document ${documentId}:`, error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    console.error('Error stack:', errorStack)
    
    await writeProcessingUpdate(documentId, 'error', `Processing failed: ${errorMessage}`, {
      error: errorMessage,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      errorStack: errorStack?.substring(0, 500) // First 500 chars of stack trace
    })
    
    // Update document with error
    const supabase = createServiceClient()
    await supabase
      .from('documents')
      .update({
        status: 'failed',
        processing_errors: [errorMessage],
        processing_completed_at: new Date().toISOString()
      })
      .eq('id', documentId)
    
    // Re-throw the error so the main handler can catch it
    throw error
  }
}

/**
 * Main request handler
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPrelight()
  }

  try {
    console.log(`🚀 [EDGE FUNCTION] Received ${req.method} request`)
    
    // Only accept POST requests
    if (req.method !== 'POST') {
      return corsErrorResponse('Method not allowed', 405)
    }
    
    // Parse request body
    const body = await req.json()
    const { documentId, userId } = body
    
    // Validate request
    if (!documentId) {
      console.error('❌ Missing documentId in request')
      return corsErrorResponse('Missing documentId', 400)
    }
    
    if (!userId) {
      console.error('❌ Missing userId in request')
      return corsErrorResponse('Missing userId', 400)
    }
    
    console.log(`📄 Processing document: ${documentId} for user: ${userId}`)
    
    // Create Supabase client
    const supabase = createServiceClient()
    
    // Verify document exists and belongs to user
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single()
    
    if (docError || !document) {
      console.error('❌ Document not found or access denied:', docError)
      await writeProcessingUpdate(documentId, 'error', 'Document not found or access denied')
      return corsErrorResponse('Document not found or access denied', 404)
    }
    
    console.log(`✅ Document validated: ${document.filename}`)
    
    // Write initial processing update
    await writeProcessingUpdate(
      documentId,
      'queued',
      'Processing started',
      { filename: document.filename }
    )
    
    // Process document and WAIT for completion
    // The function stays alive and writes updates to the database as it processes
    // The client polls the database for these updates
    try {
      await processDocumentAsync(documentId, userId, document)
      
      // Return success after processing completes
      return corsResponse({
        success: true,
        message: 'Processing completed successfully',
        documentId,
        status: 'completed'
      }, 200)
    } catch (processingError) {
      console.error(`❌ Processing failed for ${documentId}:`, processingError)
      
      // Error was already logged to database in processDocumentAsync
      return corsResponse({
        success: false,
        message: 'Processing failed',
        documentId,
        status: 'failed',
        error: processingError instanceof Error ? processingError.message : 'Unknown error'
      }, 200) // Return 200 because the request itself succeeded, processing failed
    }
    
  } catch (error) {
    console.error('❌ Edge function error:', error)
    return corsErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    )
  }
})

