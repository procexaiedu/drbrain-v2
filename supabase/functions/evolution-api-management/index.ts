import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { encrypt, decrypt } from '../_shared/cryptoUtils.ts';

console.log('Function evolution-api-management loaded');

const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL');

if (!EVOLUTION_API_URL) {
  throw new Error('EVOLUTION_API_URL environment variable is not set.');
}

// Extrair a rota do URL
function extractRoute(url: string): { route: string; action?: string } {
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;
  
  console.log('Original pathname:', pathname);
  
  let cleanPath = '';
  
  if (pathname.includes('evolution-api-management')) {
    const parts = pathname.split('evolution-api-management');
    cleanPath = parts[1] || '';
  } else {
    cleanPath = pathname;
  }
  
  console.log('Clean path:', cleanPath);
  
  const parts = cleanPath.split('/').filter(p => p);
  console.log('URL parts:', parts);
  
  if (parts.length === 0) {
    return { route: 'status' }; // Default para status da instância
  }

  if (parts.length === 1) {
    if (parts[0] === 'qrcode') return { route: 'qrcode' };
    if (parts[0] === 'send-message') return { route: 'send-message' };
    if (parts[0] === 'status') return { route: 'status' };
  }

  return { route: 'unknown' };
}

Deno.serve(async (req: Request) => {
  console.log(`${req.method} ${req.url}`);
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Authorization header missing');
      return new Response(JSON.stringify({ error: 'Authorization header missing' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      console.error('Erro de autenticação:', userError);
      return new Response(JSON.stringify({ error: 'Não autorizado', details: userError?.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    console.log('User authenticated:', user.id);
    const medico_id = user.id;
    const { route, action } = extractRoute(req.url);
    console.log('Route extracted:', { route, action });

    // Obter dados da instância da EvolutionAPI para o médico
    const { data: instanceData, error: instanceError } = await supabaseAdmin
      .from('medico_evolution_api_instances')
      .select('instance_name, api_key, status')
      .eq('medico_id', medico_id)
      .single();

    if (instanceError || !instanceData) {
      // Se não houver instância, tentar criar uma nova (ou indicar que precisa ser criada)
      if (route === 'qrcode' && req.method === 'GET') {
        return await createEvolutionInstance(medico_id);
      }
      return new Response(JSON.stringify({ error: 'Instância da EvolutionAPI não configurada para este médico.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    const decryptedApiKey = await decrypt(instanceData.api_key);

    switch (route) {
      case 'qrcode':
        if (req.method === 'GET') {
          return await getQRCode(medico_id, instanceData.instance_name, decryptedApiKey);
        }
        break;
      case 'status':
        if (req.method === 'GET') {
          return await getInstanceStatus(medico_id, instanceData.instance_name, decryptedApiKey);
        }
        break;
      case 'send-message':
        if (req.method === 'POST') {
          return await sendMessage(medico_id, instanceData.instance_name, decryptedApiKey, req);
        }
        break;
    }

    return new Response(JSON.stringify({ error: 'Rota não encontrada' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 404,
    });

  } catch (error) {
    console.error('Erro na Edge Function evolution-api-management:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Erro interno do servidor' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

// Função para criar uma nova instância da EvolutionAPI (se não existir)
async function createEvolutionInstance(medico_id: string) {
  try {
    const instance_name = `instance-${medico_id}`;
    const api_key = crypto.randomUUID(); // Gerar uma nova API Key para a instância

    // Chamar a API da EvolutionAPI para criar a instância
    const createInstanceResponse = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': Deno.env.get('EVOLUTION_MASTER_API_KEY') || '', // Chave mestra da sua instalação EvolutionAPI
      },
      body: JSON.stringify({
        instanceName: instance_name,
        token: api_key, // A EvolutionAPI usa 'token' para a chave da instância
        qrcode: true,
      }),
    });

    if (!createInstanceResponse.ok) {
      const errorData = await createInstanceResponse.json().catch(() => ({ message: createInstanceResponse.statusText }));
      console.error('Erro ao criar instância na EvolutionAPI:', errorData);
      throw new Error(errorData.message || 'Erro ao criar instância na EvolutionAPI');
    }

    const instanceCreationResult = await createInstanceResponse.json();

    // Salvar dados da instância no Supabase
    const encryptedApiKey = await encrypt(api_key);
    const { error: insertError } = await supabaseAdmin
      .from('medico_evolution_api_instances')
      .insert({
        medico_id,
        instance_name,
        api_key: encryptedApiKey,
        status: 'QRCODE', // Status inicial após criação
        qr_code_base64: instanceCreationResult.qrcode, // QR Code inicial
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Erro ao salvar instância da EvolutionAPI no Supabase:', insertError);
      throw new Error('Erro ao salvar instância da EvolutionAPI no sistema.');
    }

    return new Response(JSON.stringify({
      message: 'Instância criada. Escaneie o QR Code para conectar.',
      qr_code_base64: instanceCreationResult.qrcode,
      instance_name: instance_name,
      status: 'QRCODE',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    });

  } catch (error) {
    console.error('Erro em createEvolutionInstance:', error);
    return new Response(JSON.stringify({ error: 'Erro interno ao criar instância' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

// Função para obter o QR Code da instância
async function getQRCode(medico_id: string, instance_name: string, api_key: string) {
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/qrcode?instanceName=${instance_name}`, {
      headers: {
        'apikey': api_key,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      console.error('Erro ao obter QR Code da EvolutionAPI:', errorData);
      throw new Error(errorData.message || 'Erro ao obter QR Code');
    }

    const data = await response.json();

    // Atualizar QR Code no DB, se diferente
    const { error: updateError } = await supabaseAdmin
      .from('medico_evolution_api_instances')
      .update({ qr_code_base64: data.qrcode, status: data.status, updated_at: new Date().toISOString() })
      .eq('medico_id', medico_id);

    if (updateError) {
      console.error('Erro ao atualizar QR Code no Supabase:', updateError);
    }

    return new Response(JSON.stringify({
      qr_code_base64: data.qrcode,
      status: data.status,
      message: 'QR Code obtido com sucesso.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em getQRCode:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

// Função para obter o status da instância
async function getInstanceStatus(medico_id: string, instance_name: string, api_key: string) {
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/connectionState?instanceName=${instance_name}`, {
      headers: {
        'apikey': api_key,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      console.error('Erro ao obter status da EvolutionAPI:', errorData);
      throw new Error(errorData.message || 'Erro ao obter status da instância');
    }

    const data = await response.json();

    // Atualizar status no DB
    const { error: updateError } = await supabaseAdmin
      .from('medico_evolution_api_instances')
      .update({ status: data.state, updated_at: new Date().toISOString() })
      .eq('medico_id', medico_id);

    if (updateError) {
      console.error('Erro ao atualizar status da instância no Supabase:', updateError);
    }

    return new Response(JSON.stringify({
      status: data.state,
      message: 'Status da instância obtido com sucesso.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em getInstanceStatus:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

// Função para enviar mensagem
async function sendMessage(medico_id: string, instance_name: string, api_key: string, req: Request) {
  try {
    const { number, message } = await req.json();

    if (!number || !message) {
      return new Response(JSON.stringify({ error: 'Número e mensagem são obrigatórios.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Verificar se a instância está conectada antes de enviar
    const { data: instanceStatus, error: statusError } = await supabaseAdmin
      .from('medico_evolution_api_instances')
      .select('status')
      .eq('medico_id', medico_id)
      .single();

    if (statusError || instanceStatus?.status !== 'CONNECTED') {
      return new Response(JSON.stringify({ error: 'Instância da EvolutionAPI não conectada. Por favor, conecte-a primeiro.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const response = await fetch(`${EVOLUTION_API_URL}/message/sendText?instanceName=${instance_name}`, {
      method: 'POST',
      headers: {
        'apikey': api_key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: number, // Formato: 5511999999999
        textMessage: { text: message },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      console.error('Erro ao enviar mensagem pela EvolutionAPI:', errorData);
      throw new Error(errorData.message || 'Erro ao enviar mensagem');
    }

    const data = await response.json();
    return new Response(JSON.stringify({
      success: true,
      message: 'Mensagem enviada com sucesso.',
      evolution_response: data,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em sendMessage:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}
