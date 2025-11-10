import OpenAI from "openai";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import { saveOpenAIUsage, extractUsageFromChunk } from './openai-usage-tracker';

export interface ExtractedBiomarker {
  biomarker_id?: string | null;
  name: string;
  value: number;
  unit: string;
  reference_range?: string | null;
  confidence: number;
  matched_from_db?: boolean;
  source_text?: string;
  category?: "vitamins" | "hormones" | "lipids" | "metabolic" | "minerals" | "inflammatory" | "other";
  aliases?: string[] | null;
}

export interface BiomarkerExtractionResult {
  biomarkers: ExtractedBiomarker[];
  document_type?: "lab_report" | "blood_test" | "urine_test" | "imaging_report" | "other" | "unknown";
  processing_notes: string[];
  overall_confidence: number;
}

type KnownBiomarker = {
  id: string;
  name: string;
  category?: string;
  aliases?: string[];
};


// --- Zod schema used for Structured Outputs ---
const BiomarkerZ = z.object({
  name: z.string().describe("Full standardized biomarker name"),
  value: z.number().describe("Numeric value only"),
  unit: z.string().describe("Standardized unit (e.g., ng/mL, mg/dL)"),
  reference_range: z.string().nullable(), // was optional → now nullable
  confidence: z.number().min(0).max(1).describe("Confidence 0–1"),
  source_text: z.string().describe("Exact text where found"),
  category: z.enum(["vitamins", "hormones", "lipids", "metabolic", "minerals", "inflammatory", "other"]),
  aliases: z.array(z.string()).nullable() // was optional → now nullable
});


const ExtractionZ = z.object({
  biomarkers: z.array(BiomarkerZ),
  document_type: z.enum(["lab_report", "blood_test", "urine_test", "imaging_report", "other"]).nullable(), // was optional → now nullable
  processing_notes: z.array(z.string()), // required
  total_biomarkers_found: z.number().int().min(0) // required
});

type ExtractionT = z.infer<typeof ExtractionZ>;

export class AIBiomarkerService {
  private openai: OpenAI | null = null
  private static instance: AIBiomarkerService

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY
    console.log('AIBiomarkerService constructor - API key available:', !!apiKey)
    
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey: apiKey,
      })
      console.log('OpenAI client initialized successfully')
    } else {
      console.warn('OpenAI API key not found. AI-enhanced extraction will be unavailable.')
    }
  }

  static getInstance(): AIBiomarkerService {
    if (!AIBiomarkerService.instance) {
      AIBiomarkerService.instance = new AIBiomarkerService()
    }
    return AIBiomarkerService.instance
  }

  /**
   * Extract biomarkers using AI-first approach with enhanced capabilities
   */
  async extractBiomarkers(
    extractedText: string,
    knownBiomarkers: any[],
    useAI: boolean = true
  ): Promise<BiomarkerExtractionResult> {
    const processingNotes: string[] = []

    try {
      // Prioritize AI-enhanced extraction for comprehensive results
      if (useAI && this.openai) {
        console.log('Starting AI extraction with text length:', extractedText.length)
        try {
          const aiResult = await this.comprehensiveAIExtraction(extractedText, knownBiomarkers)
          processingNotes.push('Used comprehensive AI extraction')
          console.log('AI extraction successful, found biomarkers:', aiResult.biomarkers.length)
          return aiResult
        } catch (aiError) {
          console.error('AI extraction failed:', aiError)
          processingNotes.push('AI extraction failed, using legacy pattern matching fallback')
        }
      } else {
        console.log('No OpenAI API key found, skipping AI extraction')
        processingNotes.push('Using legacy pattern matching extraction (no OpenAI API key)')
      }

      // Fallback to legacy pattern matching (only for emergency cases)
      // const patternResult = await this.legacyPatternBasedExtraction(extractedText, knownBiomarkers)
      // patternResult.processing_notes = [...patternResult.processing_notes, ...processingNotes]
      // return patternResult

      return {
        biomarkers: [],
        processing_notes: [...processingNotes, `Extraction failed: No legacy system implemented'}`],
        overall_confidence: 0
      }

    } catch (error) {
      console.error('Biomarker extraction failed:', error)
      return {
        biomarkers: [],
        processing_notes: [...processingNotes, `Extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        overall_confidence: 0
      }
    }
  }

  /**
   * Extract biomarkers with streaming progress updates
   */
  async extractBiomarkersWithStreaming(
    extractedText: string,
    knownBiomarkers: any[],
    useAI: boolean = true,
    onProgress?: (status: string, details?: any) => void
  ): Promise<BiomarkerExtractionResult> {
    const processingNotes: string[] = []

    try {
      const textLength = extractedText.length;
      const model = process.env.OPENAI_MODEL || 'gpt-5-mini';
      
      // Send progress updates
      onProgress?.('🚀 Starting comprehensive biomarker extraction...', { 
        phase: 'initialization', 
        textLength, 
        knownBiomarkersCount: knownBiomarkers.length 
      })
      
      onProgress?.('🤖 Preparing advanced AI extraction system...', { 
        phase: 'ai_preparation', 
        textLength, 
        model 
      })
      
      onProgress?.('🤖 Initializing AI reasoning system...', { 
        phase: 'initialization', 
        documentLength: textLength 
      })

      // Prioritize AI-enhanced extraction for comprehensive results
      if (useAI && this.openai) {
        console.log('Starting AI extraction with text length:', extractedText.length)
        onProgress?.('🤖 Preparing advanced AI extraction system...', { 
          phase: 'ai_preparation', 
          textLength: extractedText.length,
          model: process.env.OPENAI_MODEL || 'gpt-5-mini'
        })
        
        try {
          const aiResult = await this.comprehensiveAIExtractionWithStreaming(
            extractedText, 
            knownBiomarkers, 
            onProgress
          )
          processingNotes.push('Used comprehensive AI extraction')
          console.log('AI extraction successful, found biomarkers:', aiResult.biomarkers.length)
          return aiResult
        } catch (aiError) {
          console.error('AI extraction failed:', aiError)
          onProgress?.('⚠️ AI extraction failed, falling back...', { 
            phase: 'error', 
            error: aiError instanceof Error ? aiError.message : 'Unknown error' 
          })
          processingNotes.push('AI extraction failed, using legacy pattern matching fallback')
        }
      } else {
        console.log('No OpenAI API key found, skipping AI extraction')
        onProgress?.('❌ No AI capabilities available', { phase: 'no_ai' })
        processingNotes.push('Using legacy pattern matching extraction (no OpenAI API key)')
      }

      onProgress?.('❌ Extraction failed - no fallback available', { phase: 'failed' })
      return {
        biomarkers: [],
        processing_notes: [...processingNotes, `Extraction failed: No legacy system implemented'}`],
        overall_confidence: 0
      }

    } catch (error) {
      console.error('Biomarker extraction failed:', error)
      onProgress?.('💥 Critical error during extraction', { 
        phase: 'critical_error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      return {
        biomarkers: [],
        processing_notes: [...processingNotes, `Extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        overall_confidence: 0
      }
    }
  }

  /**
   * Comprehensive AI-enhanced biomarker extraction using latest OpenAI models
   * This method extracts ALL biomarkers found in the document, not just known ones
   */
  private async comprehensiveAIExtraction(
    text: string,
    knownBiomarkers: any[]
  ): Promise<BiomarkerExtractionResult> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized')
    }

    // Get the model from environment or default to gpt-5
    const model = process.env.OPENAI_MODEL || 'gpt-5-mini'
    
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
      const response = await this.openai.responses.create({
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
        //max_output_tokens: 4000,
        text: {
          format: zodTextFormat(ExtractionZ, "biomarker_extraction")
        }  
      });

      const aiResult = JSON.parse(response.output_text) as ExtractionT;
  
      if (!aiResult || !Array.isArray(aiResult.biomarkers)) {
        console.error('Invalid AI response structure:', aiResult)
        throw new Error("Invalid AI response structure");
      }
      
      console.log('AI parsing successful, biomarkers array length:', aiResult.biomarkers.length)  


      // Match with known biomarkers and enhance data
      const enhancedBiomarkers = aiResult.biomarkers.map((biomarker: any) => {
        const dbBiomarker = this.findMatchingBiomarker(biomarker.name, knownBiomarkers)
        return {
          ...biomarker,
          biomarker_id: dbBiomarker?.id || null,
          matched_from_db: !!dbBiomarker,
          // Ensure all required fields are present
          category: biomarker.category || 'other',
          aliases: biomarker.aliases || [],
          reference_range: biomarker.reference_range || 'Not specified'
        }
      })

      const overallConfidence = enhancedBiomarkers.length > 0 
        ? enhancedBiomarkers.reduce((sum: number, b: ExtractedBiomarker) => sum + b.confidence, 0) / enhancedBiomarkers.length
        : 0

      const processingNotes = [
        `AI extracted ${enhancedBiomarkers.length} biomarkers using ${model}`,
        ...(aiResult.processing_notes || []),
        `Database matches: ${enhancedBiomarkers.filter((b: ExtractedBiomarker) => b.matched_from_db).length}/${enhancedBiomarkers.length}`
      ]

      return {
        biomarkers: enhancedBiomarkers,
        document_type: (aiResult.document_type as BiomarkerExtractionResult["document_type"]) ?? "unknown",
        processing_notes: processingNotes,
        overall_confidence: overallConfidence
      };

    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('AI returned invalid JSON format')
      }
      throw error
    }
  }

  /**
   * Comprehensive AI-enhanced biomarker extraction with streaming progress updates
   */
  private async comprehensiveAIExtractionWithStreaming(
    text: string,
    knownBiomarkers: any[],
    onProgress?: (status: string, details?: any) => void
  ): Promise<BiomarkerExtractionResult> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized')
    }

    onProgress?.('🤖 Initializing AI reasoning system...', { 
      phase: 'initialization',
      documentLength: text.length
    })

    // Get the model from environment or default to gpt-5
    const model = process.env.OPENAI_MODEL || 'gpt-5-mini'
    
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
      console.log('Starting OpenAI responses API call with reasoning...')
      console.log('Model:', model)
      console.log('Input text length:', text.length)
      onProgress?.('🧠 Starting AI reasoning process...', { 
        phase: 'reasoning',
        step: 'api_call_start',
        thoughtProcess: 'Sending request to OpenAI with reasoning enabled'
      })

      let response
      try {
        response = await this.openai.responses.create({
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
        stream: true, // Enable streaming
        stream_options: { include_usage: true } as any, // Type assertion needed - feature exists at runtime but types not updated yet
        reasoning: {
          effort: "medium", // Let GPT-5 use medium reasoning effort
          summary: "auto" // Get detailed reasoning summaries
        },
        text: {
          format: zodTextFormat(ExtractionZ, "biomarker_extraction")
        }  
      })
      } catch (openaiError) {
        console.error('❌ OPENAI API REQUEST FAILED')
        console.error('OpenAI error type:', openaiError instanceof Error ? openaiError.constructor.name : typeof openaiError)
        console.error('OpenAI error message:', openaiError instanceof Error ? openaiError.message : String(openaiError))
        
        // Log API-specific error details
        if (openaiError && typeof openaiError === 'object' && 'status' in openaiError) {
          console.error('OpenAI status code:', (openaiError as any).status)
        }
        if (openaiError && typeof openaiError === 'object' && 'error' in openaiError) {
          console.error('OpenAI error details:', JSON.stringify((openaiError as any).error, null, 2))
        }
        
        throw new Error(`OpenAI API request failed: ${openaiError instanceof Error ? openaiError.message : String(openaiError)}`)
      }

      console.log('OpenAI API call successful, processing streaming response...')
      let fullResponse = '';
      let chunkCount = 0;
      let generatedTokens = 0;
      let reasoningTokens = 0;
      let usageData: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | null = null;
      
      console.log('Processing streaming response...')
      
             // Process the streaming response - only show meaningful AI reasoning summaries
       let currentSummaryText = '';
       let currentSummaryIndex = -1;
       
       for await (const chunk of response) {
         chunkCount++;
         
         // Handle reasoning summary text streaming
         if (chunk.type === 'response.reasoning_summary_text.delta') {
           const delta = (chunk as any).delta;
           const summaryIndex = (chunk as any).summary_index;
           
           // If this is a new summary, send the previous one if we had one
           if (summaryIndex !== currentSummaryIndex && currentSummaryText.trim()) {
             const summaryText = currentSummaryText.trim();
             reasoningTokens += summaryText.split(' ').length;
             
             // Extract just the main insight (first sentence or key point)
             const shortSummary = this.extractKeyInsight(summaryText);
             console.log(`🧠 AI: ${shortSummary}`)
             
             onProgress?.(summaryText, { 
               phase: 'reasoning',
               step: 'thinking',
               thoughtProcess: summaryText,
               chunksReceived: chunkCount,
               hasSummaryText: true
             })
             
             currentSummaryText = '';
           }
           
           currentSummaryIndex = summaryIndex;
           if (delta) {
             currentSummaryText += delta;
           }
         }
         // Handle complete reasoning summary
         else if (chunk.type === 'response.reasoning_summary_text.done') {
           const summaryText = (chunk as any).text;
           if (summaryText && summaryText.trim()) {
             reasoningTokens += summaryText.split(' ').length;
             
             // Extract just the main insight (first sentence or key point)
             const shortSummary = this.extractKeyInsight(summaryText);
             // console.log(`🧠 AI: ${shortSummary}`)
             
             onProgress?.(summaryText, { 
               phase: 'reasoning',
               step: 'thinking',
               thoughtProcess: summaryText,
               chunksReceived: chunkCount,
               hasSummaryText: true
             })
           }
         }
         // Silently handle other chunk types to keep streaming alive (no logging)
         else if (chunk.type === 'response.output_text.delta') {
           const delta = (chunk as any).delta;
           if (delta) {
             fullResponse += delta;
             generatedTokens += delta.split(' ').length;
           }
         }
        else if (chunk.type === 'response.output_text.done') {
          const outputText = (chunk as any).output_text;
          if (outputText) {
            fullResponse = outputText;
          }
        }
        
        // Check for usage data in any chunk
        const extractedUsage = extractUsageFromChunk(chunk);
        if (extractedUsage) {
          usageData = extractedUsage;
        }
      }
      
      // Save usage data if available (note: user_id would need to be passed to this method)
      if (usageData) {
        console.log('📊 Token usage:', usageData);
        // Note: saveOpenAIUsage would need user_id - this service doesn't have access to it
        // The usage will be tracked in the backend process-document function instead
      }
      
      // Send any remaining summary text
       if (currentSummaryText.trim()) {
         const summaryText = currentSummaryText.trim();
         reasoningTokens += summaryText.split(' ').length;
         // console.log(`🧠 AI: ${this.extractKeyInsight(summaryText)}`)
         
         onProgress?.(summaryText, { 
           phase: 'reasoning',
           step: 'thinking',
           thoughtProcess: summaryText,
           chunksReceived: chunkCount,
           hasSummaryText: true
         })
       }

      console.log('Streaming complete, parsing response...')
      console.log('Full response length:', fullResponse.length)
      console.log('Response preview (first 500 chars):', fullResponse.substring(0, 500))
      
      onProgress?.('🔬 Parsing and validating AI extraction results...', { 
        phase: 'validation',
        step: 'parsing',
        thoughtProcess: 'Validating JSON structure and biomarker data quality'
      })

      let aiResult
      try {
        aiResult = JSON.parse(fullResponse) as ExtractionT
      } catch (jsonParseError) {
        console.error('❌ JSON PARSING FAILED')
        console.error('Parse error:', jsonParseError)
        console.error('Attempted to parse:', fullResponse.substring(0, 1000))
        throw new Error(`Failed to parse OpenAI response as JSON: ${jsonParseError instanceof Error ? jsonParseError.message : String(jsonParseError)}`)
      }
  
      if (!aiResult || !Array.isArray(aiResult.biomarkers)) {
        console.error('Invalid AI response structure:', aiResult)
        throw new Error("Invalid AI response structure");
      }
      
      console.log('AI parsing successful, biomarkers found:', aiResult.biomarkers.length)
      onProgress?.('🎯 Enhancing biomarkers with database matching...', { 
        phase: 'enhancement',
        step: 'database_matching',
        biomarkersFound: aiResult.biomarkers.length,
        thoughtProcess: `Cross-referencing ${aiResult.biomarkers.length} extracted biomarkers with database`
      })

      // Match with known biomarkers and enhance data
      const enhancedBiomarkers = aiResult.biomarkers.map((biomarker: any) => {
        const dbBiomarker = this.findMatchingBiomarker(biomarker.name, knownBiomarkers)
        return {
          ...biomarker,
          biomarker_id: dbBiomarker?.id || null,
          matched_from_db: !!dbBiomarker,
          // Ensure all required fields are present
          category: biomarker.category || 'other',
          aliases: biomarker.aliases || [],
          reference_range: biomarker.reference_range || 'Not specified'
        }
      })

      const overallConfidence = enhancedBiomarkers.length > 0 
        ? enhancedBiomarkers.reduce((sum: number, b: ExtractedBiomarker) => sum + b.confidence, 0) / enhancedBiomarkers.length
        : 0

      const processingNotes = [
        `AI extracted ${enhancedBiomarkers.length} biomarkers using ${model}`,
        ...(aiResult.processing_notes || []),
        `Database matches: ${enhancedBiomarkers.filter((b: ExtractedBiomarker) => b.matched_from_db).length}/${enhancedBiomarkers.length}`,
        `Reasoning tokens used: ${reasoningTokens}, Generated tokens: ${generatedTokens}`
      ]

      const dbMatches = enhancedBiomarkers.filter((b: ExtractedBiomarker) => b.matched_from_db).length

      onProgress?.('✅ Biomarker extraction completed successfully!', { 
        phase: 'complete',
        step: 'finalization',
        biomarkersFound: enhancedBiomarkers.length,
        databaseMatches: dbMatches,
        confidence: overallConfidence,
        thoughtProcess: `Successfully extracted ${enhancedBiomarkers.length} biomarkers with ${dbMatches} database matches`
      })

      return {
        biomarkers: enhancedBiomarkers,
        document_type: (aiResult.document_type as BiomarkerExtractionResult["document_type"]) ?? "unknown",
        processing_notes: processingNotes,
        overall_confidence: overallConfidence
      };

    } catch (error) {
      console.error('❌ AI EXTRACTION ERROR - CRITICAL ❌')
      console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error)
      console.error('Error message:', error instanceof Error ? error.message : String(error))
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      
      // Check for specific OpenAI errors
      if (error && typeof error === 'object' && 'error' in error) {
        console.error('OpenAI API error details:', JSON.stringify((error as any).error, null, 2))
      }
      
      // Log full error for debugging
      console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
      
      if (error instanceof SyntaxError) {
        throw new Error(`AI returned invalid JSON format: ${error.message}`)
      }
      throw error
    }
  }

  /**
   * Find matching biomarker in database with enhanced matching logic
   */
  private findMatchingBiomarker(extractedName: string, knownBiomarkers: any[]) {
    if (!knownBiomarkers) return null
    
    const normalizedExtracted = extractedName.toLowerCase().trim()
    
    return knownBiomarkers.find(biomarker => {
      // Direct name match
      if (biomarker.name.toLowerCase() === normalizedExtracted) {
        return true
      }
      
      // Check aliases if they exist
      if (biomarker.aliases && Array.isArray(biomarker.aliases)) {
        const aliasMatch = biomarker.aliases.some((alias: string) => 
          alias.toLowerCase().trim() === normalizedExtracted
        )
        if (aliasMatch) return true
      }
      
      // Enhanced partial matching for common medical variations
      const biomarkerName = biomarker.name.toLowerCase()
      
      // Special medical term mappings
      const medicalMappings = [
        { extracted: ['vitamin d', '25-oh-d', '25(oh)d'], database: ['25-hydroxyvitamin'] },
        { extracted: ['b12', 'cobalamin', 'cyanocobalamin'], database: ['vitamin b12', 'cobalamin'] },
        { extracted: ['tsh', 'thyroid stimulating'], database: ['tsh', 'thyroid stimulating'] },
        { extracted: ['free t4', 'ft4'], database: ['free t4', 'thyroxine'] },
        { extracted: ['free t3', 'ft3'], database: ['free t3', 'triiodothyronine'] },
        { extracted: ['hba1c', 'a1c', 'glycated hemoglobin'], database: ['hemoglobin a1c'] },
        { extracted: ['crp', 'c-reactive protein'], database: ['c-reactive protein'] }
      ]
      
      for (const mapping of medicalMappings) {
        const extractedMatches = mapping.extracted.some(term => normalizedExtracted.includes(term))
        const databaseMatches = mapping.database.some(term => biomarkerName.includes(term))
        if (extractedMatches && databaseMatches) {
          return true
        }
      }
      
      return false
    })
  }

  /**
   * Extracts the key insight (first sentence or main point) from a longer text.
   * This helps in reducing the verbosity of the AI reasoning summaries.
   */
  private extractKeyInsight(text: string): string {
    const sentences = text.split(/[.!?]/);
    if (sentences.length > 0) {
      const firstSentence = sentences[0].trim();
      if (firstSentence.length > 0) {
        return firstSentence;
      }
    }
    return text.trim(); // Fallback to the full text if no clear insight
  }
}

export const aiBiomarkerService = AIBiomarkerService.getInstance() 