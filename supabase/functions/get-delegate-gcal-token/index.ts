// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { corsHeaders } from '../_shared/cors.ts'
import { getValidGoogleToken } from '../_shared/googleTokenManager.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const internalSecret = req.headers.get('X-Internal-Secret')
  const n8nInternalSecret = Deno.env.get('N8N_INTERNAL_SECRET')

  if (!internalSecret || internalSecret !== n8nInternalSecret) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { medico_id } = await req.json()
    if (!medico_id) {
      return new Response(JSON.stringify({ error: 'medico_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const accessToken = await getValidGoogleToken(medico_id)

    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'Could not retrieve a valid token for the given medico_id. The user may not have connected their account.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ access_token: accessToken }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in get-delegate-gcal-token:', error)
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
