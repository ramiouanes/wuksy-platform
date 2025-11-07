/**
 * CORS Helper for Supabase Edge Functions
 * Handles CORS headers and OPTIONS preflight requests
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

/**
 * Handle CORS preflight OPTIONS request
 */
export function handleCorsPrelight(): Response {
  return new Response('ok', { 
    status: 200,
    headers: corsHeaders 
  })
}

/**
 * Create a response with CORS headers
 */
export function corsResponse(body: any, status: number = 200): Response {
  return new Response(
    JSON.stringify(body),
    { 
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      }
    }
  )
}

/**
 * Create an error response with CORS headers
 */
export function corsErrorResponse(message: string, status: number = 500): Response {
  return corsResponse({ error: message }, status)
}

