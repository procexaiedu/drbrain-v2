import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const EVOLUTION_API_URL = 'https://evolution2.procexai.tech'
const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY')
const N8N_WEBHOOK_URL = "https://webh.procexai.tech/webhook/drBrainCentral"

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

  if (!EVOLUTION_API_KEY) {
    console.error('CRITICAL ERROR: EVOLUTION_API_KEY is not set in Supabase secrets.')
    return new Response(JSON.stringify({ error: 'Server configuration error: Missing API Key' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500
    })
  }

  try {
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

        // --- ETAPA 1: Criar a instância com o payload validado pelo Postman ---
        console.log(`[Step 1/4] Creating instance '${instanceName}' with correct payload...`);
        const createPayload = {
          instanceName,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS" // Payload validado pelo Postman
        };
        const createResponse = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
          body: JSON.stringify(createPayload)
        })

        if (!createResponse.ok) {
          // Se a instância já existir, vamos deletá-la e tentar criar novamente para garantir um estado limpo.
          if (createResponse.status === 403) {
             console.warn(`Instance '${instanceName}' already exists. Recreating for a clean state...`);
             await fetch(`${EVOLUTION_API_URL}/instance/delete/${instanceName}`, {
                method: 'DELETE',
                headers: { 'apikey': EVOLUTION_API_KEY }
             });
             const retryResponse = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
                body: JSON.stringify(createPayload)
             });
             if (!retryResponse.ok) {
                const errorBody = await retryResponse.text();
                throw new Error(`Failed to recreate instance: ${retryResponse.status} ${errorBody}`);
             }
             const createData = await retryResponse.json();
             console.log(`[Step 1/4] OK: Instance '${instanceName}' recreated successfully.`);
             await handleSuccessfulCreation(supabaseAdmin, medico_id, createData);
             return new Response(JSON.stringify({
                success: true,
                status: createData.instance.status,
                qrcode: createData.qrcode.base64
             }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          } else {
            const errorBody = await createResponse.text();
            throw new Error(`Failed to create instance on Evolution API: ${createResponse.status} ${errorBody}`);
          }
        }
        
        const createData = await createResponse.json();
        console.log(`[Step 1/4] OK: Instance '${instanceName}' created successfully.`);
        await handleSuccessfulCreation(supabaseAdmin, medico_id, createData);
        return new Response(JSON.stringify({
            success: true,
            status: createData.instance.status,
            qrcode: createData.qrcode.base64
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      
      // ... (os outros cases 'connection-status' e 'disconnect' permanecem os mesmos) ...

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

        // Adicional: verificar o status real na API para sincronia
        if (tokenData.instance_name) {
            try {
                const statusResponse = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${tokenData.instance_name}`, {
                    headers: { 'apikey': EVOLUTION_API_KEY! }
                });
                if (statusResponse.ok) {
                    const realStatus = (await statusResponse.json()).state;
                    if (realStatus !== tokenData.connection_status) {
                        await supabaseAdmin.from('medico_oauth_tokens').update({ connection_status: realStatus }).eq('instance_name', tokenData.instance_name);
                        tokenData.connection_status = realStatus;
                    }
                }
            } catch (e) {
                console.error("Could not sync status with API, returning local status.", e.message);
            }
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
            headers: { 'apikey': EVOLUTION_API_KEY! }
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
    }
  } catch (error) {
    console.error("Evolution Manager Final Error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500
    })
  }
})

// Função auxiliar para evitar repetição de código
async function handleSuccessfulCreation(supabaseAdmin: SupabaseClient, medico_id: string, createData: any) {
    const instanceName = createData.instance.instanceName;

    // --- ETAPA 2: Registrar o Webhook ---
    console.log(`[Step 2/4] Registering webhook for '${instanceName}'...`);
    const webhookPayload = {
      url: N8N_WEBHOOK_URL,
      webhook_by_events: false,
      events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE"] // QR code não é mais necessário aqui
    };
    const webhookResponse = await fetch(`${EVOLUTION_API_URL}/webhook/update/${instanceName}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY! },
        body: JSON.stringify(webhookPayload),
    });
    if (!webhookResponse.ok) {
        const errorBody = await webhookResponse.text();
        // Não lançar erro aqui, apenas avisar, pois a conexão principal pode funcionar.
        console.error(`Failed to set webhook, but continuing: ${webhookResponse.status} ${errorBody}`);
    } else {
        console.log(`[Step 2/4] OK: Webhook successfully registered for instance '${instanceName}'.`);
    }

    // --- ETAPA 3 e 4: Salvar no DB ---
    console.log(`[Step 3&4/4] Saving connection state to local database...`);
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
    console.log(`[Step 3&4/4] OK: Database updated successfully.`);
}