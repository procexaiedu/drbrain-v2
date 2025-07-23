import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders } from '../_shared/cors.ts'
import { getValidGoogleToken } from '../_shared/googleTokenManager.ts'

Deno.serve(async (req) => {
  console.log(`get-delegate-gcal-token: ${req.method} ${req.url}`)
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Log headers para debug
  console.log('Headers recebidos:')
  req.headers.forEach((value, key) => {
    console.log(`  ${key}: ${value}`)
  })

  // Verificação SIMPLES do secret
  const internalSecret = req.headers.get('X-Internal-Secret')
  const n8nInternalSecret = Deno.env.get('N8N_INTERNAL_SECRET')
  
  console.log('Secret recebido:', internalSecret ? 'PRESENTE' : 'AUSENTE')
  console.log('Secret esperado:', n8nInternalSecret ? 'CONFIGURADO' : 'NÃO CONFIGURADO')

  // Se não tem secret configurado, PULA verificação (modo desenvolvimento)
  if (n8nInternalSecret && internalSecret !== n8nInternalSecret) {
    console.log('Secret não confere!')
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { medico_id } = await req.json()
    
    if (!medico_id) {
      console.log('medico_id não fornecido')
      return new Response(JSON.stringify({ error: 'medico_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Processando request para medico_id:', medico_id)

    const accessToken = await getValidGoogleToken(medico_id)

    if (!accessToken) {
      console.log('Token não encontrado para medico_id:', medico_id)
      return new Response(JSON.stringify({ 
        error: 'Could not retrieve a valid token for the given medico_id. The user may not have connected their account.'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Token obtido com sucesso!')
    return new Response(JSON.stringify({ access_token: accessToken }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Erro na função:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error', 
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
