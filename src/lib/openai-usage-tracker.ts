/**
 * OpenAI Usage Tracker
 * 
 * Shared utility for tracking OpenAI API usage and costs
 * Saves usage data to openai_usage_logs table
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create service client for server-side usage tracking
const supabase = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

export interface UsageData {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

export interface UsageLogParams {
  user_id: string
  request_type: string // 'biomarker_extraction', 'analysis', 'core_analysis', etc.
  request_id?: string // document_id, analysis_id, etc.
  model: string
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  metadata?: Record<string, any> // Additional context
}

/**
 * Get model pricing per 1K tokens (update these based on current OpenAI pricing)
 */
function getModelPricing(model: string): number {
  // Update these prices based on current OpenAI pricing
  // Prices are per 1K tokens
  const pricing: Record<string, number> = {
    'gpt-5-mini': 0.15, // Example: $0.15 per 1K tokens
    'gpt-4': 30.00, // Example: $30 per 1K tokens
    'gpt-4-turbo': 10.00, // Example: $10 per 1K tokens
    'gpt-3.5-turbo': 0.50, // Example: $0.50 per 1K tokens
  }
  
  // Default to a reasonable estimate if model not found
  return pricing[model] || 1.00
}

/**
 * Calculate estimated cost based on token count and model
 */
function calculateCost(totalTokens: number, model: string): number {
  const pricePer1k = getModelPricing(model)
  return (totalTokens / 1000) * pricePer1k
}

/**
 * Save OpenAI usage data to database
 * 
 * This function saves usage data to the openai_usage_logs table.
 * It's designed to be non-blocking - errors are logged but don't throw.
 */
export async function saveOpenAIUsage(params: UsageLogParams): Promise<void> {
  if (!supabase) {
    console.warn('⚠️ Supabase service key not configured - skipping usage tracking')
    return
  }
  
  try {
    const costPer1k = getModelPricing(params.model)
    const estimatedCost = calculateCost(params.total_tokens, params.model)
    
    const { error } = await supabase
      .from('openai_usage_logs')
      .insert({
        user_id: params.user_id,
        request_type: params.request_type,
        request_id: params.request_id || null,
        model: params.model,
        prompt_tokens: params.prompt_tokens,
        completion_tokens: params.completion_tokens,
        total_tokens: params.total_tokens,
        cost_per_1k_tokens: costPer1k,
        estimated_cost: estimatedCost,
        metadata: params.metadata || {}
      })
    
    if (error) {
      console.error('❌ Failed to save OpenAI usage:', error)
      // Don't throw - usage tracking is non-critical
    } else {
      console.log(`✅ Saved usage: ${params.total_tokens} tokens ($${estimatedCost.toFixed(4)}) for ${params.request_type}`)
    }
  } catch (error) {
    console.error('❌ Error saving OpenAI usage:', error)
    // Don't throw - usage tracking should not break the main flow
  }
}

/**
 * Extract usage data from OpenAI Responses API streaming chunk
 * 
 * Usage data appears in the 'response.completed' event (final chunk)
 * According to: https://blog.robino.dev/posts/openai-responses-api#streaming
 * 
 * The Responses API uses input_tokens/output_tokens (not prompt_tokens/completion_tokens)
 */
export function extractUsageFromChunk(chunk: any): UsageData | null {
  // Check for response.completed event (final chunk in Responses API)
  if (chunk.type === 'response.completed') {
    const completedChunk = chunk as any
    // Usage is in chunk.response.usage
    if (completedChunk.response?.usage) {
      const usage = completedChunk.response.usage
      // Responses API uses input_tokens/output_tokens, map to prompt/completion
      return {
        prompt_tokens: usage.input_tokens || usage.prompt_tokens || 0,
        completion_tokens: usage.output_tokens || usage.completion_tokens || 0,
        total_tokens: usage.total_tokens || 0
      }
    }
  }
  
  // Fallback: Check if chunk has usage directly (for non-streaming responses)
  if (chunk.usage && typeof chunk.usage === 'object') {
    const usage = chunk.usage
    if (usage.total_tokens) {
      return {
        prompt_tokens: usage.input_tokens || usage.prompt_tokens || 0,
        completion_tokens: usage.output_tokens || usage.completion_tokens || 0,
        total_tokens: usage.total_tokens
      }
    }
  }
  
  // Legacy check for response.done (if still used by some APIs)
  if (chunk.type === 'response.done') {
    const doneChunk = chunk as any
    if (doneChunk.usage && doneChunk.usage.total_tokens) {
      return {
        prompt_tokens: doneChunk.usage.input_tokens || doneChunk.usage.prompt_tokens || 0,
        completion_tokens: doneChunk.usage.output_tokens || doneChunk.usage.completion_tokens || 0,
        total_tokens: doneChunk.usage.total_tokens
      }
    }
  }
  
  return null
}

