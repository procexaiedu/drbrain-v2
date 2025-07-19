import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsHeaders } from '../_shared/cors.ts';

console.log('google-calendar-auth-status function booting up');

Deno.serve(async (req: Request) => {
  console.log(`google-calendar-auth-status: ${req.method} ${req.url}`);

  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request received');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Autenticação e obtenção do medico_id
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.warn('Missing Authorization Header');
      return new Response(JSON.stringify({ error: 'Missing Authorization Header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      console.warn('Invalid or expired token:', userError?.message);
      return new Response(JSON.stringify({ error: 'Invalid or expired token', details: userError?.message }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const medico_id = user.id;
    console.log('User authenticated:', medico_id);

    // 2. Consultar a tabela medico_oauth_tokens
    const { data: tokenData, error: dbError } = await supabaseAdmin
      .from('medico_oauth_tokens')
      .select('access_token, refresh_token, expires_at') // Selecionar campos para possível validação futura
      .eq('medico_id', medico_id)
      .eq('provider', 'google_calendar')
      .maybeSingle(); // Usar maybeSingle para não dar erro se não encontrar, apenas retornar null

    if (dbError) {
      console.error('Database error querying tokens:', dbError);
      return new Response(JSON.stringify({ error: 'Database error', details: dbError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Verificar se a conexão existe
    // Por enquanto, a simples existência do registro é suficiente.
    // Validações futuras: `tokenData.access_token`, `tokenData.refresh_token`, `new Date(tokenData.expires_at) > new Date()`
    const isConnected = !!tokenData; 
    console.log('Connection status for medico_id', medico_id, ':', isConnected);

    return new Response(JSON.stringify({ isConnected }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Unhandled error in google-calendar-auth-status:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 