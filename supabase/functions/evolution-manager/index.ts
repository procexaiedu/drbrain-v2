import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const createAdminClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase service role configuration is missing.')
  }
  return createClient(supabaseUrl, supabaseServiceKey)
}

const handleRequest = async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL')!
    const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY')!
    const N8N_WEBHOOK_URL = Deno.env.get('N8N_WEBHOOK_URL')!

    // Autenticação do usuário
    const userSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    const { data: { user } } = await userSupabase.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const medico_id = user.id
    const supabaseAdmin = createAdminClient()
    const url = new URL(req.url)
    const path = url.pathname.split('/').pop()

    // Rota: POST /evolution-manager/connect
    if (path === 'connect' && req.method === 'POST') {
      const instanceName = `drbrain_${medico_id.replace(/-/g, '_')}`
      console.log(`[1/3] POST /connect: Creating instance '${instanceName}' with webhook configuration...`);
      
      // Limpa qualquer instância antiga para garantir um estado inicial limpo
      await fetch(`${EVOLUTION_API_URL}/instance/delete/${instanceName}`, { method: 'DELETE', headers: { 'apikey': EVOLUTION_API_KEY } });

      // **A SOLUÇÃO: Construir o payload de criação com o webhook já incluído**
      const createPayload = {
        instanceName,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
        webhook: {
          url: N8N_WEBHOOK_URL,
          webhook_by_events: false,
          events: [
            "MESSAGES_UPSERT",
            "CONNECTION_UPDATE",
            "QRCODE_UPDATED"
          ]
        }
      };

      console.log("Sending payload to Evolution API:", JSON.stringify(createPayload, null, 2));

      const createResponse = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
          body: JSON.stringify(createPayload)
      });

      if (!createResponse.ok) {
        const errorBody = await createResponse.text();
        console.error(`Error creating instance: ${createResponse.status} - ${errorBody}`);
        throw new Error(`Failed to create instance: ${createResponse.status} ${errorBody}`);
      }
      
      const createData = await createResponse.json();
      console.log(`[1/3] OK: Instance created and configured successfully.`);

      // Etapas 2 e 3 agora são apenas para salvar os dados no seu banco
      console.log(`[2/3] Saving instance data to Supabase...`);
      await supabaseAdmin.from('medico_oauth_tokens').upsert({
        medico_id, provider: 'evolution_api', access_token: createData.hash.apikey, // O hash retornado contém a apikey da instância
        instance_id: instanceName, instance_name: instanceName,
        connection_status: 'connecting', qrcode: createData.qrcode.base64
      }, { onConflict: 'medico_id, provider' });
      console.log(`[2/3] OK: Supabase updated.`);
      
      console.log(`[3/3] Process finished. Returning QR Code to frontend.`);
      
      return new Response(JSON.stringify({
          success: true, status: 'pairing', qrcode: createData.qrcode.base64
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Rota: GET /evolution-manager/connection-status
    if (path === 'connection-status' && req.method === 'GET') {
      // (Este bloco permanece o mesmo)
      const { data, error } = await supabaseAdmin.from('medico_oauth_tokens')
        .select('connection_status, qrcode, instance_name')
        .eq('medico_id', medico_id).eq('provider', 'evolution_api').single();
      if (error || !data) return new Response(JSON.stringify({ status: 'not_configured' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Se nenhuma rota corresponder
    return new Response(JSON.stringify({ error: `Route not found for ${req.method} ${url.pathname}` }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error("Evolution Manager Final Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}

serve(handleRequest);