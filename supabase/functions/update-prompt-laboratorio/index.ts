import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsHeaders } from '../_shared/cors.ts';

console.log('Function update-prompt-laboratorio loaded');

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

    const body = await req.json();
    const { prompt_texto } = body;

    if (!prompt_texto && prompt_texto !== '') {
      return new Response(JSON.stringify({ error: 'prompt_texto é obrigatório' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Atualizar o prompt de laboratório
    const { error: updateError } = await supabaseAdmin
      .from('medico_secretaria_ia_prompts')
      .update({
        prompt_texto_laboratorio: prompt_texto,
        updated_at_laboratorio: new Date().toISOString()
      })
      .eq('medico_id', user.id);

    if (updateError) {
      console.error('Error updating lab prompt:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update lab prompt', details: updateError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log('Lab prompt updated successfully for user:', user.id);

    return new Response(JSON.stringify({ message: 'Prompt de laboratório atualizado com sucesso' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Unhandled error in update-prompt-laboratorio:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 