import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsHeaders } from '../_shared/cors.ts';

console.log('Function descartar-prompt-laboratorio loaded');

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    });
  }

  try {
    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header missing' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));

    if (userError || !user) {
      console.error('Error getting user or no user:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized', details: userError?.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    console.log('User authenticated:', user.id);

    // Buscar o prompt de produção atual na tabela correta
    const { data: currentData, error: fetchError } = await supabaseAdmin
      .from('medico_secretaria_ia_prompts')
      .select('prompt_texto_producao')
      .eq('medico_id', user.id)
      .single();

    if (fetchError) {
      console.error('Error fetching production prompt:', fetchError);
      if (fetchError.code === 'PGRST116') {
        // Se não encontrar registro, limpar o prompt de laboratório
        const { error: updateError } = await supabaseAdmin
          .from('medico_secretaria_ia_prompts')
          .update({
            prompt_texto_laboratorio: '',
            updated_at_laboratorio: new Date().toISOString()
          })
          .eq('medico_id', user.id);

        if (updateError) {
          return new Response(JSON.stringify({ error: 'Failed to clear lab prompt', details: updateError.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          });
        }

        return new Response(JSON.stringify({ message: 'Prompt de laboratório limpo (nenhum prompt de produção encontrado)' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
      return new Response(JSON.stringify({ error: 'Failed to fetch production prompt', details: fetchError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Copiar da produção para o laboratório (reverter)
    const { error: updateError } = await supabaseAdmin
      .from('medico_secretaria_ia_prompts')
      .update({
        prompt_texto_laboratorio: currentData.prompt_texto_producao || '',
        updated_at_laboratorio: new Date().toISOString()
      })
      .eq('medico_id', user.id);

    if (updateError) {
      console.error('Error reverting lab prompt:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to revert lab prompt', details: updateError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log('Lab prompt reverted successfully for user:', user.id);

    return new Response(JSON.stringify({ message: 'Prompt de laboratório descartado e revertido com sucesso' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Unhandled error in descartar-prompt-laboratorio:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 