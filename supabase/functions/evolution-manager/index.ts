import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// As secrets são lidas do ambiente do Supabase
const EVOLUTION_API_URL = 'https://evolution2.procexai.tech'
const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY')
const N8N_WEBHOOK_URL = "https://webh.procexai.tech/webhook/drBrainCentral" // Sua URL mestre

// Função auxiliar para criar o cliente Supabase de serviço para operações de admin
const createAdminClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase service role configuration is missing.')
  }
  return createClient(supabaseUrl, supabaseServiceKey)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Validação inicial das secrets
  if (!EVOLUTION_API_KEY) {
    console.error('CRITICAL ERROR: EVOLUTION_API_KEY is not set in Supabase secrets.')
    return new Response(JSON.stringify({ error: 'Server configuration error: Missing API Key' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500
    })
  }

  try {
    // Cliente Supabase com autenticação do usuário para obter o medico_id
    const userSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    const { data: { user } } = await userSupabase.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401
      })
    }
    const medico_id = user.id

    // Cliente Supabase com role de serviço para operações no banco de dados
    const supabaseAdmin = createAdminClient()

    const url = new URL(req.url)
    const path = url.pathname.split('/').pop()

    switch (path) {
      case 'connect': {
        const instanceName = `drbrain_${medico_id.replace(/-/g, '_')}`

        // 1. Tenta criar a instância na EvolutionAPI. Ignoramos o erro 403 (já existe), pois o objetivo é garantir que ela exista.
        const createResponse = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
          body: JSON.stringify({ instanceName, qrcode: true })
        })

        if (!createResponse.ok && createResponse.status !== 403) {
          const errorBody = await createResponse.text();
          throw new Error(`Failed to create instance on Evolution API: ${createResponse.status} ${errorBody}`)
        }
        console.log(`Instance ${instanceName} created or already exists.`);

        // 2. Registra o Webhook (Passo Crítico que faltava)
        const webhookPayload = {
          url: N8N_WEBHOOK_URL,
          webhook_by_events: false, // O workflow mestre fará o roteamento
          events: ["QRCODE_UPDATED", "MESSAGES_UPSERT", "CONNECTION_UPDATE"]
        };
        const webhookResponse = await fetch(`${EVOLUTION_API_URL}/webhook/update/${instanceName}`, {
            method: 'PUT', // PUT é o método correto e mais seguro para essa operação
            headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
            body: JSON.stringify(webhookPayload),
        });

        if (!webhookResponse.ok) {
            const errorBody = await webhookResponse.text();
            throw new Error(`Failed to set webhook: ${webhookResponse.status} ${errorBody}`);
        }
        console.log(`Webhook successfully registered for instance ${instanceName}`);

        // 3. Conecta a instância para gerar o QR Code (que será enviado para o webhook)
        const connectResponse = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
          headers: { 'apikey': EVOLUTION_API_KEY }
        })
        const connectData = await connectResponse.json();
        const connectState = connectData.state;

        // 4. Salva os detalhes no banco de dados (Upsert)
        const { error: upsertError } = await supabaseAdmin.from('medico_oauth_tokens').upsert({
          medico_id,
          provider: 'evolution_api',
          access_token: EVOLUTION_API_KEY, // Correção: Salva a chave de API global
          instance_id: instanceName,
          instance_name: instanceName,
          connection_status: connectState || 'pairing',
          qrcode: null // QR Code será preenchido pelo n8n via webhook
        }, { onConflict: 'medico_id, provider' });

        if (upsertError) throw upsertError

        return new Response(JSON.stringify({ success: true, status: connectState }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'connection-status': {
        const { data: tokenData, error } = await supabaseAdmin
          .from('medico_oauth_tokens')
          .select('connection_status, qrcode, instance_name')
          .eq('medico_id', medico_id)
          .eq('provider', 'evolution_api')
          .single()

        if (error || !tokenData) {
          return new Response(JSON.stringify({ status: 'not_configured', qrcode: null }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        return new Response(JSON.stringify({
          status: tokenData.connection_status,
          qrcode: tokenData.qrcode,
          instanceName: tokenData.instance_name
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'disconnect': {
        const { data: tokenData } = await supabaseAdmin
          .from('medico_oauth_tokens')
          .select('instance_name')
          .eq('medico_id', medico_id)
          .eq('provider', 'evolution_api')
          .single()

        if (tokenData?.instance_name) {
          await fetch(`${EVOLUTION_API_URL}/instance/delete/${tokenData.instance_name}`, {
            method: 'DELETE',
            headers: { 'apikey': EVOLUTION_API_KEY }
          })
        }

        await supabaseAdmin
          .from('medico_oauth_tokens')
          .delete()
          .eq('medico_id', medico_id)
          .eq('provider', 'evolution_api')

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      default:
        return new Response(JSON.stringify({ error: 'Not Found' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404
        })
    }
  } catch (error) {
    console.error("Evolution Manager Error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500
    })
  }
})