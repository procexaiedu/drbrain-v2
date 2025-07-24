import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const EVOLUTION_API_URL = 'https://evolution2.procexai.tech'
const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY')
const N8N_WEBHOOK_URL = "https://webh.procexai.tech/webhook/drBrainCentral"

// Função auxiliar para criar o cliente Supabase de serviço
const createAdminClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase service role configuration is missing.')
  }
  return createClient(supabaseUrl, supabaseServiceKey)
}

// Função principal que lida com a requisição
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!EVOLUTION_API_KEY) {
      throw new Error('Server configuration error: Missing EVOLUTION_API_KEY')
    }

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
    const supabaseAdmin = createAdminClient()
    const url = new URL(req.url)
    const path = url.pathname.split('/').pop()

    switch (path) {
      case 'connect': {
        const instanceName = `drbrain_${medico_id.replace(/-/g, '_')}`
        
        console.log(`[1/3] Attempting to create instance '${instanceName}'...`);
        
        // Payload exato que funcionou no seu teste do Postman
        const createPayload = {
          instanceName,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS"
        };
        
        let createResponse = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
          body: JSON.stringify(createPayload)
        });

        // Se a instância já existir (erro 403), deleta e tenta criar de novo para garantir um estado limpo.
        if (createResponse.status === 403) {
           console.warn(`Instance '${instanceName}' already exists. Recreating for a clean state...`);
           await fetch(`${EVOLUTION_API_URL}/instance/delete/${instanceName}`, {
              method: 'DELETE',
              headers: { 'apikey': EVOLUTION_API_KEY }
           });
           createResponse = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
              body: JSON.stringify(createPayload)
           });
        }
        
        if (!createResponse.ok) {
            const errorBody = await createResponse.text();
            throw new Error(`Failed to create instance: ${createResponse.status} ${errorBody}`);
        }
        
        const createData = await createResponse.json();
        console.log(`[1/3] OK: Instance created. Received QR Code and Hash.`);

        // ETAPA 2: Salvar os dados corretos no banco de dados
        console.log(`[2/3] Saving data to Supabase...`);
        const { error: upsertError } = await supabaseAdmin.from('medico_oauth_tokens').upsert({
          medico_id,
          provider: 'evolution_api',
          access_token: createData.hash, // O hash é o token da instância
          instance_id: instanceName,
          instance_name: instanceName,
          connection_status: createData.instance.status || 'pairing',
          qrcode: createData.qrcode.base64 // Salva o QR Code imediatamente
        }, { onConflict: 'medico_id, provider' });

        if (upsertError) throw upsertError;
        console.log(`[2/3] OK: Supabase updated successfully.`);
        
        // ETAPA 3: Registrar o Webhook para futuras mensagens e atualizações de status
        console.log(`[3/3] Registering webhook for '${instanceName}'...`);
        const webhookPayload = {
          url: N8N_WEBHOOK_URL,
          webhook_by_events: false,
          events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE"]
        };
        await fetch(`${EVOLUTION_API_URL}/webhook/update/${instanceName}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
            body: JSON.stringify(webhookPayload),
        });
        console.log(`[3/3] OK: Webhook registered.`);

        // Retorna o sucesso e o QR Code diretamente para o frontend
        return new Response(JSON.stringify({
            success: true,
            status: createData.instance.status,
            qrcode: createData.qrcode.base64
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      
      // Os outros cases (connection-status, disconnect) podem permanecer os mesmos da versão anterior.
      case 'connection-status': {
        const { data, error } = await supabaseAdmin.from('medico_oauth_tokens')
          .select('connection_status, qrcode, instance_name')
          .eq('medico_id', medico_id).eq('provider', 'evolution_api').single();
        if (error || !data) return new Response(JSON.stringify({ status: 'not_configured' }), { headers: corsHeaders });
        return new Response(JSON.stringify(data), { headers: corsHeaders });
      }

      case 'disconnect': {
        const { data } = await supabaseAdmin.from('medico_oauth_tokens')
          .select('instance_name').eq('medico_id', medico_id).eq('provider', 'evolution_api').single();
        if (data?.instance_name) {
          await fetch(`${EVOLUTION_API_URL}/instance/delete/${data.instance_name}`, {
            method: 'DELETE', headers: { 'apikey': EVOLUTION_API_KEY }
          });
        }
        await supabaseAdmin.from('medico_oauth_tokens').delete().eq('medico_id', medico_id).eq('provider', 'evolution_api');
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      default:
        return new Response(JSON.stringify({ error: 'Not Found' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 });
    }
  } catch (error) {
    console.error("Evolution Manager Final Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500
    });
  }
});
