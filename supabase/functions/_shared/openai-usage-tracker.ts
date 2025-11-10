/**
 * OpenAI Usage Tracker
 * 
 * Shared utility for tracking OpenAI API usage and costs
 * Saves usage data to openai_usage_logs table
 */

import { createServiceClient } from './supabase-client.ts'

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
  try {
    const supabase = createServiceClient()
    
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
 * Extract usage data from OpenAI streaming response chunk
 * 
 * Usage data typically appears in the final chunk with type 'response.done'
 */
export function extractUsageFromChunk(chunk: any): UsageData | null {
  // Check if chunk has usage directly
  if (chunk.usage && typeof chunk.usage === 'object') {
    const usage = chunk.usage
    if (usage.total_tokens && usage.prompt_tokens !== undefined && usage.completion_tokens !== undefined) {
      return {
        prompt_tokens: usage.prompt_tokens,
        completion_tokens: usage.completion_tokens,
        total_tokens: usage.total_tokens
      }
    }
  }
  
  // Check for usage in response.done chunk
  if (chunk.type === 'response.done') {
    const doneChunk = chunk as any
    if (doneChunk.usage && doneChunk.usage.total_tokens) {
      return {
        prompt_tokens: doneChunk.usage.prompt_tokens || 0,
        completion_tokens: doneChunk.usage.completion_tokens || 0,
        total_tokens: doneChunk.usage.total_tokens
      }
    }
  }
  
  return null
}

