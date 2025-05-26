import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsHeaders } from '../_shared/cors.ts';

console.log('Function n8n-callback-registrar-feedback loaded - VERSÃO SIMPLIFICADA');

interface N8NFeedbackCallbackPayload {
  medico_id: string;
  feedback_texto: string;
  avaliacao_estrelas?: number | null;
}

Deno.serve(async (req: Request) => {
  console.log('=== CALLBACK SIMPLIFICADO RECEBIDO ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);

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
    console.log('✅ Processando callback sem validação de secret (padrão simplificado)');

    // Parse do payload do N8N
    const payload: N8NFeedbackCallbackPayload = await req.json();
    const { medico_id, feedback_texto, avaliacao_estrelas } = payload;

    console.log('Dados recebidos:', { medico_id, feedback_texto, avaliacao_estrelas });

    // Validar dados obrigatórios
    if (!medico_id || !feedback_texto) {
      return new Response(JSON.stringify({ 
        error: 'Dados obrigatórios ausentes',
        details: 'medico_id e feedback_texto são obrigatórios'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Verificar se o médico existe
    const { data: medico, error: medicoError } = await supabaseAdmin
      .from('medicos')
      .select('id')
      .eq('id', medico_id)
      .single();

    if (medicoError || !medico) {
      console.error('Médico não encontrado:', { medico_id, error: medicoError });
      return new Response(JSON.stringify({ error: 'Médico não encontrado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    // Inserir feedback na tabela feedbacks_sistema
    const { data: feedback, error: feedbackError } = await supabaseAdmin
      .from('feedbacks_sistema')
      .insert({
        medico_id: medico_id,
        feedback_texto: feedback_texto,
        avaliacao_estrelas: avaliacao_estrelas || null,
        status: 'em_analise',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (feedbackError) {
      console.error('Erro ao inserir feedback:', feedbackError);
      return new Response(JSON.stringify({ 
        error: 'Erro ao salvar feedback', 
        details: feedbackError.message 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log('✅ Feedback salvo com sucesso:', feedback.id);

    return new Response(JSON.stringify({ 
      success: true, 
      feedback_id: feedback.id,
      message: 'Feedback registrado com sucesso'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro na Edge Function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Erro interno do servidor' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 