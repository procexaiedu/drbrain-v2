import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsHeaders } from '../_shared/cors.ts';

console.log('Function storage-trigger-to-n8n-prontuarios loaded');

interface StorageEventPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: {
    name: string;
    bucket_id: string;
    owner: string;
    // outros campos...
  };
  schema: string;
  old_record?: any;
}

// Função para extrair IDs do path do storage
function parseStoragePath(storagePath: string): { medico_id: string; prontuario_id: string; filename: string } | null {
  try {
    // Formato esperado: {medico_id}/{prontuario_id}_{filename}
    const parts = storagePath.split('/');
    if (parts.length !== 2) {
      console.error('Storage path format inválido:', storagePath);
      return null;
    }

    const medico_id = parts[0];
    const filenamePart = parts[1];
    
    // Separar prontuario_id do filename original
    const underscoreIndex = filenamePart.indexOf('_');
    if (underscoreIndex === -1) {
      console.error('Formato de filename inválido:', filenamePart);
      return null;
    }

    const prontuario_id = filenamePart.substring(0, underscoreIndex);
    const filename = filenamePart.substring(underscoreIndex + 1);

    // Validar UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(medico_id) || !uuidRegex.test(prontuario_id)) {
      console.error('IDs não são UUIDs válidos:', { medico_id, prontuario_id });
      return null;
    }

    return { medico_id, prontuario_id, filename };
  } catch (error) {
    console.error('Erro ao parsear storage path:', error);
    return null;
  }
}

Deno.serve(async (req: Request) => {
  console.log('=== FUNÇÃO EXECUTADA ===');
  console.log('Método:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));

  if (req.method === 'OPTIONS') {
    console.log('Retornando CORS...');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Esta função é chamada pelo Storage Trigger do Supabase
    console.log('Tentando ler payload...');
    const payload: StorageEventPayload = await req.json();
    
    console.log('=== PAYLOAD RECEBIDO ===');
    console.log('Storage trigger payload:', JSON.stringify(payload, null, 2));

    // Verificar se é um evento de INSERT no bucket correto
    if (payload.type !== 'INSERT' || payload.record.bucket_id !== 'consultas-audio') {
      console.log('Evento ignorado: não é INSERT ou bucket incorreto');
      return new Response('Event ignored', { 
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        status: 200 
      });
    }

    const storagePath = payload.record.name;
    const parsedData = parseStoragePath(storagePath);
    
    if (!parsedData) {
      console.error('Falha ao parsear storage path:', storagePath);
      return new Response('Invalid storage path format', { 
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        status: 400 
      });
    }

    const { medico_id, prontuario_id, filename } = parsedData;

    // Verificar se o prontuário existe e pertence ao médico
    const { data: prontuario, error: prontuarioError } = await supabaseAdmin
      .from('prontuarios')
      .select('id, medico_id, status_prontuario')
      .eq('id', prontuario_id)
      .eq('medico_id', medico_id)
      .single();

    if (prontuarioError || !prontuario) {
      console.error('Prontuário não encontrado:', { prontuario_id, medico_id, error: prontuarioError });
      return new Response('Prontuario not found', { 
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        status: 404 
      });
    }

    // Gerar URL assinada para o arquivo
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from('consultas-audio')
      .createSignedUrl(storagePath, 3600); // 1 hora de validade

    if (signedUrlError || !signedUrlData.signedUrl) {
      console.error('Erro ao gerar URL assinada:', signedUrlError);
      return new Response('Failed to generate signed URL', { 
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        status: 500 
      });
    }

    // Atualizar status do prontuário para PROCESSANDO_N8N
    await supabaseAdmin
      .from('prontuarios')
      .update({
        status_prontuario: 'PROCESSANDO_N8N',
        data_ultima_modificacao: new Date().toISOString()
      })
      .eq('id', prontuario_id);

    // Construir payload para o N8N
    const n8nPayload = {
      prontuario_id,
      medico_id,
      audio_url_assinada: signedUrlData.signedUrl,
      storage_path_do_audio: storagePath,
      audio_original_filename: filename
    };

    // Obter URL do webhook N8N
    const n8nWebhookUrl = Deno.env.get('N8N_PRONTUARIOS_WEBHOOK_URL');
    if (!n8nWebhookUrl) {
      console.error('N8N_PRONTUARIOS_WEBHOOK_URL não configurada');
      return new Response('N8N webhook URL not configured', { 
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        status: 500 
      });
    }

    // Chamar o webhook do N8N
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(n8nPayload)
    });

    if (!n8nResponse.ok) {
      console.error('Erro ao chamar N8N:', n8nResponse.status, await n8nResponse.text());
      
      // Marcar prontuário como erro
      await supabaseAdmin
        .from('prontuarios')
        .update({
          status_prontuario: 'ERRO_PROCESSAMENTO',
          erro_processamento_msg: `Erro ao chamar N8N: ${n8nResponse.status}`,
          data_ultima_modificacao: new Date().toISOString()
        })
        .eq('id', prontuario_id);

      return new Response('Failed to call N8N', { 
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        status: 500 
      });
    }

    console.log('N8N chamado com sucesso para prontuário:', prontuario_id);
    const n8nResponseData = await n8nResponse.text();
    console.log('Resposta do N8N:', n8nResponseData);

    return new Response('Success', { 
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      status: 200 
    });

  } catch (error) {
    console.error('Erro na Edge Function storage-trigger-to-n8n-prontuarios:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Erro interno do servidor' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 