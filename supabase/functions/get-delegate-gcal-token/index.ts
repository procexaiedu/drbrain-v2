// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { corsHeaders } from '../_shared/cors.ts'
import { getValidGoogleToken } from '../_shared/googleTokenManager.ts'

// Função para verificar se o IP está na lista de IPs permitidos (opcional)
function isAllowedIP(clientIP: string): boolean {
  // Liste aqui os IPs dos seus servidores N8N
  const allowedIPs = [
    '127.0.0.1',
    '::1',
    // Adicione aqui os IPs reais do seu N8N em produção
  ]
  
  // Em desenvolvimento, permita localhost
  if (clientIP.includes('127.0.0.1') || clientIP.includes('::1') || clientIP.includes('localhost')) {
    return true
  }
  
  return allowedIPs.includes(clientIP)
}

// Função para validar a estrutura do request
function validateRequestStructure(body: any): { isValid: boolean; error?: string } {
  if (!body || typeof body !== 'object') {
    return { isValid: false, error: 'Invalid request body structure' }
  }
  
  if (!body.medico_id || typeof body.medico_id !== 'string') {
    return { isValid: false, error: 'medico_id must be a valid string' }
  }
  
  // Validar formato UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(body.medico_id)) {
    return { isValid: false, error: 'medico_id must be a valid UUID' }
  }
  
  return { isValid: true }
}

Deno.serve(async (req) => {
  const startTime = Date.now()
  const requestId = crypto.randomUUID().substring(0, 8)
  
  console.log(`[${requestId}] Request started: ${req.method} ${req.url}`)
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    console.log(`[${requestId}] Method not allowed: ${req.method}`)
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // 1. Verificação do Secret (Principal camada de segurança)
  const internalSecret = req.headers.get('X-Internal-Secret')
  const n8nInternalSecret = Deno.env.get('N8N_INTERNAL_SECRET')

  if (!n8nInternalSecret) {
    console.error(`[${requestId}] N8N_INTERNAL_SECRET not configured`)
    return new Response(JSON.stringify({ error: 'Internal server configuration error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!internalSecret) {
    console.log(`[${requestId}] Missing X-Internal-Secret header`)
    return new Response(JSON.stringify({ error: 'Unauthorized: Missing authentication header' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (internalSecret !== n8nInternalSecret) {
    console.log(`[${requestId}] Invalid X-Internal-Secret provided`)
    return new Response(JSON.stringify({ error: 'Forbidden: Invalid credentials' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // 2. Verificação de Rate Limiting simples (opcional)
  const userAgent = req.headers.get('User-Agent') || 'unknown'
  console.log(`[${requestId}] User-Agent: ${userAgent}`)

  // 3. Verificação IP (opcional, descomente se necessário)
  // const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  // if (!isAllowedIP(clientIP)) {
  //   console.log(`[${requestId}] IP not allowed: ${clientIP}`)
  //   return new Response(JSON.stringify({ error: 'Forbidden: Access denied from this IP' }), {
  //     status: 403,
  //     headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  //   })
  // }

  try {
    // 4. Validação da estrutura do body
    const body = await req.json()
    const validation = validateRequestStructure(body)
    
    if (!validation.isValid) {
      console.log(`[${requestId}] Invalid request structure: ${validation.error}`)
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { medico_id } = body
    console.log(`[${requestId}] Processing request for medico_id: ${medico_id}`)

    // 5. Verificar se medico_id existe e obter token
    const accessToken = await getValidGoogleToken(medico_id)

    if (!accessToken) {
      console.log(`[${requestId}] No valid token found for medico_id: ${medico_id}`)
      return new Response(JSON.stringify({ 
        error: 'Could not retrieve a valid token for the given medico_id. The user may not have connected their account.',
        requestId: requestId
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const processingTime = Date.now() - startTime
    console.log(`[${requestId}] Token retrieved successfully in ${processingTime}ms`)

    return new Response(JSON.stringify({ 
      access_token: accessToken,
      requestId: requestId
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error(`[${requestId}] Error after ${processingTime}ms:`, error)
    
    // Não vazar detalhes internos em produção
    const isProduction = Deno.env.get('SUPABASE_ENV') === 'PRODUCTION'
    const errorDetails = isProduction ? 'Internal processing error' : error.message
    
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error', 
      details: errorDetails,
      requestId: requestId
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
