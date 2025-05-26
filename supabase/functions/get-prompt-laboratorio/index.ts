// supabase/functions/get-prompt-laboratorio/index.ts
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts'; // Assume que supabaseAdmin está corretamente inicializado aqui
import { corsHeaders } from '../_shared/cors.ts';

console.log('[get-prompt-laboratorio]: Function loaded'); // Log inicial para sabermos que a função foi carregada

Deno.serve(async (req: Request) => {
  console.log(`[get-prompt-laboratorio]: Received request: ${req.method} ${req.url}`);

  if (req.method === 'OPTIONS') {
    console.log('[get-prompt-laboratorio]: Handling OPTIONS request');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Verificar autenticação e obter o usuário
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[get-prompt-laboratorio]: Authorization header missing or malformed');
      return new Response(JSON.stringify({ error: 'Authorization header missing or malformed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError) {
      console.error('[get-prompt-laboratorio]: Error fetching user with token:', userError.message);
      return new Response(JSON.stringify({ error: 'Failed to authenticate user', details: userError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    if (!user) {
      console.error('[get-prompt-laboratorio]: No user found for the provided token');
      return new Response(JSON.stringify({ error: 'Unauthorized - no user session' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    console.log(`[get-prompt-laboratorio]: User authenticated: ${user.id}`);

    // 2. Buscar o prompt de laboratório na tabela correta usando medico_id (que é user.id)
    console.log(`[get-prompt-laboratorio]: Fetching prompt for medico_id: ${user.id}`);
    const { data: promptData, error: promptError } = await supabaseAdmin
      .from('medico_secretaria_ia_prompts')
      .select('prompt_texto_laboratorio, updated_at_laboratorio') // CORRIGIDO: Nome da coluna para 'updated_at_laboratorio'
      .eq('medico_id', user.id)
      .single(); // .single() vai retornar erro se não encontrar (PGRST116) ou se encontrar mais de um

    if (promptError) {
      // Se o erro for "PGRST116" (No rows found), significa que o médico ainda não tem um prompt.
      // Nesse caso, retornamos um prompt de laboratório vazio e timestamp nulo.
      if (promptError.code === 'PGRST116') {
        console.log(`[get-prompt-laboratorio]: No prompt found for medico_id: ${user.id}. Returning empty prompt.`);
        return new Response(JSON.stringify({
          prompt_texto_laboratorio: '',
          updated_at_laboratorio: null // CORRIGIDO: Nome do campo no JSON de resposta
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200, // É um resultado válido (sem prompt ainda)
        });
      }
      // Para outros erros do banco de dados
      console.error('[get-prompt-laboratorio]: Error fetching prompt_texto_laboratorio:', promptError.message, 'Code:', promptError.code);
      return new Response(JSON.stringify({ error: 'Failed to fetch prompt laboratorio', details: promptError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Se promptData for null mas não houve erro (improvável com .single() a menos que PGRST116), tratar como não encontrado
    if (!promptData) {
        console.log(`[get-prompt-laboratorio]: Prompt data is null for medico_id: ${user.id} (unexpected with .single() if no error). Returning empty prompt.`);
        return new Response(JSON.stringify({
          prompt_texto_laboratorio: '',
          updated_at_laboratorio: null
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200, 
        });
    }
    
    console.log(`[get-prompt-laboratorio]: Prompt fetched successfully for medico_id: ${user.id}`);
    return new Response(JSON.stringify({
      prompt_texto_laboratorio: promptData.prompt_texto_laboratorio || '', // Garante que seja string vazia se null/undefined
      updated_at_laboratorio: promptData.updated_at_laboratorio // CORRIGIDO: Nome do campo no JSON de resposta
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    // Erro genérico não tratado nos blocos try/catch anteriores
    console.error('[get-prompt-laboratorio]: Unhandled error in Deno.serve:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message || String(error) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});