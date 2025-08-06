import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Função auxiliar para delays
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

serve(async (req: Request) => {
  try {
    // Lida com a requisição pre-flight de CORS
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    // --- Validação das Variáveis de Ambiente ---
    const envVars = {
      SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
      SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      EVOLUTION_API_URL: Deno.env.get('EVOLUTION_API_URL'),
      EVOLUTION_API_KEY: Deno.env.get('EVOLUTION_API_KEY'),
      N8N_WEBHOOK_URL: Deno.env.get('N8N_WEBHOOK_URL')
    };
    for (const [key, value] of Object.entries(envVars)) {
      if (!value) {
        throw new Error(`Erro de configuração do servidor: A variável de ambiente '${key}' é obrigatória.`);
      }
    }
    
    // --- Clientes e Autenticação ---
    const supabaseAdmin = createClient(envVars.SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Autorização faltando' }), { status: 401, headers: corsHeaders });
    }
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Usuário não autenticado' }), { status: 401, headers: corsHeaders });
    }
    const medico_id = user.id;

    // --- Roteamento da Função ---
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    switch(path) {
      case 'create-instance': {
        if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Método não permitido' }), { status: 405 });
        
        console.log(`[Evolution Manager] Requisição para o médico_id: ${medico_id}`);
        const instanceName = `drbrain_${medico_id}`;

        // --- ETAPA 1: LIMPAR INSTÂNCIA ANTERIOR (SE EXISTIR) ---
        console.log(`[1/4] Limpando instância anterior '${instanceName}'...`);
        try {
          await fetch(`${envVars.EVOLUTION_API_URL}/instance/logout/${instanceName}`, {
            method: 'DELETE',
            headers: { 'apikey': envVars.EVOLUTION_API_KEY }
          });
          console.log('Comando de logout enviado.');
          await fetch(`${envVars.EVOLUTION_API_URL}/instance/delete/${instanceName}`, {
            method: 'DELETE',
            headers: { 'apikey': envVars.EVOLUTION_API_KEY }
          });
          console.log('Comando de delete enviado.');
        } catch (cleanupError) {
          console.warn("Não foi possível limpar a instância anterior (pode não existir, o que é normal):", cleanupError.message);
        }

        await delay(2000); // Delay para garantir que a API processe a exclusão

        // --- ETAPA 2: CRIAR NOVA INSTÂNCIA ---
        const payload = {
          instanceName: instanceName,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS",
          webhook: {
            url: envVars.N8N_WEBHOOK_URL,
            webhook_by_events: false, 
            events: [
              "CONNECTION_UPDATE",
              "MESSAGES_UPSERT",
              "QRCODE_UPDATED"
            ]
          }
        };

        console.log(`[2/4] Criando nova instância com o payload:`, JSON.stringify(payload));
        const createResponse = await fetch(`${envVars.EVOLUTION_API_URL}/instance/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': envVars.EVOLUTION_API_KEY
          },
          body: JSON.stringify(payload)
        });

        if (!createResponse.ok) {
          const errorBody = await createResponse.text();
          throw new Error(`Falha ao criar instância na Evolution API: ${errorBody}`);
        }
        const createData = await createResponse.json();
        
        // --- ETAPA 3: SALVAR DADOS NO SUPABASE ---
        console.log('[3/4] Salvando dados da instância no Supabase...');
        const { error: dbError } = await supabaseAdmin.from('medico_oauth_tokens').upsert({
          medico_id: medico_id,
          provider: 'evolution_api',
          connection_status: 'qrcode_generated',
          instance_name: createData.instance.instanceName,
          // CORREÇÃO FINAL APLICADA AQUI:
          // O objeto JSON completo da API é salvo na coluna 'provider_metadata'.
          provider_metadata: createData,
          qrcode: createData.qrcode?.base64 || null
        }, { onConflict: 'medico_id, provider' });
        
        if (dbError) {
            console.error("Erro detalhado do Supabase:", dbError);
            throw new Error(`Erro ao salvar no banco de dados: ${dbError.message}`);
        }

        // --- ETAPA 4: RETORNAR PARA O FRONTEND ---
        console.log(`[4/4] Processo finalizado. Retornando dados para o frontend.`);
        return new Response(JSON.stringify({
          status: createData.qrcode ? 'qrcode_generated' : 'connected',
          qrcode: createData.qrcode?.base64 || null,
          instanceName: createData.instance.instanceName,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
      }

      case 'connection-status': {
        if (req.method !== 'GET') return new Response(JSON.stringify({ error: 'Método não permitido' }), { status: 405 });
        const { data, error } = await supabaseAdmin.from('medico_oauth_tokens').select('connection_status, qrcode, instance_name').eq('medico_id', medico_id).eq('provider', 'evolution_api').single();
        if (error || !data) {
          return new Response(JSON.stringify({ status: 'not_configured' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({ success: true, ...data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
      }

      default:
        return new Response(JSON.stringify({ error: `Rota '${path}' não encontrada` }), { status: 404, headers: corsHeaders });
    }

  } catch (error) {
    console.error("Erro final no Evolution Manager:", error.message);
    return new Response(JSON.stringify({ error: 'Erro interno do servidor', details: error.message }), { status: 500, headers: corsHeaders });
  }
});
