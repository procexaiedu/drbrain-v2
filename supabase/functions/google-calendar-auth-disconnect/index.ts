// import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  console.log(`google-calendar-disconnect: ${req.method} ${req.url}`);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('disconnect: Authorization header ausente.');
      return new Response(JSON.stringify({ error: 'Authorization header ausente.' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      console.error('disconnect: Erro de autenticação:', userError?.message);
      return new Response(JSON.stringify({ error: 'Não autorizado', details: userError?.message }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const medico_id = user.id;
    console.log('disconnect: Usuário autenticado:', medico_id);

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Método não permitido. Use POST.' }), {
        status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { error: deleteError } = await supabaseAdmin
      .from('medico_oauth_tokens')
      .delete()
      .eq('medico_id', medico_id)
      .eq('provider', 'google_calendar');

    if (deleteError) {
      console.error('disconnect: Erro ao deletar tokens:', deleteError);
      return new Response(JSON.stringify({ error: 'Erro ao remover conexão.', details: deleteError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('disconnect: Conexão removida para medico_id:', medico_id);
    return new Response(JSON.stringify({ message: 'Conexão removida com sucesso.' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Erro na função disconnect:', error);
    return new Response(JSON.stringify({ error: 'Erro interno.', details: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}); 