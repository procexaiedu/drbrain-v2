import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsHeaders } from '../_shared/cors.ts';

console.log('Function publicar-prompt-laboratorio loaded');

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

    // Buscar o prompt de laboratório atual na tabela correta
    const { data: currentData, error: fetchError } = await supabaseAdmin
      .from('medico_secretaria_ia_prompts')
      .select('prompt_texto_laboratorio')
      .eq('medico_id', user.id)
      .single();

    if (fetchError) {
      console.error('Error fetching current lab prompt:', fetchError);
      if (fetchError.code === 'PGRST116') {
        return new Response(JSON.stringify({ error: 'Nenhum prompt de laboratório encontrado para publicar' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        });
      }
      return new Response(JSON.stringify({ error: 'Failed to fetch current lab prompt', details: fetchError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Copiar do laboratório para produção na mesma tabela
    const { error: updateError } = await supabaseAdmin
      .from('medico_secretaria_ia_prompts')
      .update({
        prompt_texto_producao: currentData.prompt_texto_laboratorio,
        updated_at_producao: new Date().toISOString()
      })
      .eq('medico_id', user.id);

    if (updateError) {
      console.error('Error publishing prompt to production:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to publish prompt', details: updateError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log('Prompt published successfully for user:', user.id);

    return new Response(JSON.stringify({ message: 'Prompt publicado com sucesso' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Unhandled error in publicar-prompt-laboratorio:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 