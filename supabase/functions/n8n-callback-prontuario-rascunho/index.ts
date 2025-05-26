import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsHeaders } from '../_shared/cors.ts';

console.log('Function n8n-callback-prontuario-rascunho loaded');

interface N8NCallbackPayload {
  prontuario_id: string;
  medico_id: string;
  texto_rascunho?: string;
  texto_transcricao_bruta?: string;
  erro_msg?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    });
  }

  try {
    // Verificar secret do N8N
    const callbackSecret = req.headers.get('X-N8N-Callback-Secret');
    const expectedSecret = Deno.env.get('N8N_CALLBACK_SECRET');
    
    if (!expectedSecret) {
      console.error('N8N_CALLBACK_SECRET não configurado');
      return new Response(JSON.stringify({ error: 'Configuração de segurança ausente' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (!callbackSecret || callbackSecret !== expectedSecret) {
      console.error('Secret inválido ou ausente');
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Parse do payload do N8N
    const payload: N8NCallbackPayload = await req.json();
    const { prontuario_id, medico_id, texto_rascunho, texto_transcricao_bruta, erro_msg } = payload;

    // Validar dados obrigatórios
    if (!prontuario_id || !medico_id) {
      return new Response(JSON.stringify({ 
        error: 'Dados obrigatórios ausentes',
        details: 'prontuario_id e medico_id são obrigatórios'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Verificação de segurança: confirmar que o prontuário pertence ao médico
    const { data: prontuario, error: prontuarioError } = await supabaseAdmin
      .from('prontuarios')
      .select('id, medico_id, status_prontuario')
      .eq('id', prontuario_id)
      .eq('medico_id', medico_id)
      .single();

    if (prontuarioError || !prontuario) {
      console.error('Prontuário não encontrado ou não pertence ao médico:', { prontuario_id, medico_id, error: prontuarioError });
      return new Response(JSON.stringify({ error: 'Prontuário não encontrado ou não autorizado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    // Verificar se o prontuário está em um status válido para receber callback
    const validStatuses = ['PROCESSANDO_N8N', 'AGUARDANDO_PROCESSAMENTO_N8N'];
    if (!validStatuses.includes(prontuario.status_prontuario)) {
      console.warn('Prontuário não está em status válido para callback:', { prontuario_id, status: prontuario.status_prontuario });
      return new Response(JSON.stringify({ 
        error: 'Status do prontuário inválido para callback',
        current_status: prontuario.status_prontuario
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Atualizar prontuário baseado no resultado do processamento
    let updateData: any = {
      data_ultima_modificacao: new Date().toISOString()
    };

    if (erro_msg) {
      // Caso de erro no processamento
      updateData.status_prontuario = 'ERRO_PROCESSAMENTO';
      updateData.erro_processamento_msg = erro_msg;
      console.error('N8N reportou erro no processamento:', { prontuario_id, erro_msg });
    } else {
      // Caso de sucesso
      updateData.status_prontuario = 'RASCUNHO_DISPONIVEL';
      if (texto_rascunho) {
        updateData.conteudo_rascunho = texto_rascunho;
      }
      if (texto_transcricao_bruta) {
        updateData.conteudo_transcricao_bruta = texto_transcricao_bruta;
      }
      console.log('N8N completou processamento com sucesso:', { prontuario_id });
    }

    // Atualizar o prontuário no banco
    const { error: updateError } = await supabaseAdmin
      .from('prontuarios')
      .update(updateData)
      .eq('id', prontuario_id);

    if (updateError) {
      console.error('Erro ao atualizar prontuário:', updateError);
      return new Response(JSON.stringify({ 
        error: 'Erro ao atualizar prontuário', 
        details: updateError.message 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log('Prontuário atualizado com sucesso:', { prontuario_id, status: updateData.status_prontuario });

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Callback processado com sucesso',
      prontuario_id,
      status: updateData.status_prontuario
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro na Edge Function n8n-callback-prontuario-rascunho:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Erro interno do servidor' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 