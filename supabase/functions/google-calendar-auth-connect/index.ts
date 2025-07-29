// Implementação da Edge Function google-calendar-auth-connect
// import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'; // Esta linha deve ser removida
import { corsHeaders } from '../_shared/cors.ts'; // Caminho ajustado
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts'; // Caminho ajustado

// Adicionando um log para verificar se as variáveis de ambiente estão sendo carregadas
console.log('google-calendar-auth-connect: GOOGLE_CALENDAR_CLIENT_ID:', Deno.env.get('GOOGLE_CALENDAR_CLIENT_ID'));
console.log('google-calendar-auth-connect: GCAL_CALLBACK_URI_DEV:', Deno.env.get('GCAL_CALLBACK_URI_DEV'));
console.log('google-calendar-auth-connect: GCAL_CALLBACK_URI_PROD:', Deno.env.get('GCAL_CALLBACK_URI_PROD'));

Deno.serve(async (req: Request) => {
  console.log(`google-calendar-auth-connect: ${req.method} ${req.url}`);

  // Tratar requisições OPTIONS para CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Autenticar o usuário Dr.Brain para obter o medico_id
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('google-calendar-auth-connect: Authorization header ausente.');
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado. Authorization header ausente.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      console.error('google-calendar-auth-connect: Erro ao autenticar usuário Dr.Brain:', userError?.message);
      return new Response(
        JSON.stringify({ error: 'Falha na autenticação do usuário Dr.Brain.', details: userError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const medico_id = user.id;
    console.log(`google-calendar-auth-connect: Usuário Dr.Brain autenticado: ${medico_id}`);

    const clientId = Deno.env.get('GOOGLE_CALENDAR_CLIENT_ID');
    const redirectUri = Deno.env.get('SUPABASE_ENV') === 'PRODUCTION' 
                        ? Deno.env.get('GCAL_CALLBACK_URI_PROD') 
                        : Deno.env.get('GCAL_CALLBACK_URI_DEV');

    if (!clientId || !redirectUri) {
      console.error('google-calendar-auth-connect: Configuração de OAuth (Client ID ou Redirect URI) incompleta.');
      return new Response(
        JSON.stringify({ error: 'Configuração de OAuth incompleta no servidor.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const scopes = [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    const state = crypto.randomUUID();
    const stateExpirationMinutes = 10;
    const expires_at = new Date(Date.now() + stateExpirationMinutes * 60 * 1000).toISOString();

    const { error: stateStoreError } = await supabaseAdmin
      .from('medico_oauth_pending_states')
      .insert({
        state_value: state,
        medico_id: medico_id,
        provider: 'google_calendar',
        expires_at: expires_at
      });

    if (stateStoreError) {
      console.error('google-calendar-auth-connect: Erro ao salvar o estado OAuth pendente:', stateStoreError);
      return new Response(
        JSON.stringify({ error: 'Erro interno ao preparar autorização OAuth.', details: stateStoreError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log(`google-calendar-auth-connect: Estado OAuth pendente salvo para medico_id: ${medico_id}, state: ${state}`);

    const authUrlParams = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state: state,
    });

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${authUrlParams.toString()}`;

    console.log('google-calendar-auth-connect: Retornando URL de autorização:', googleAuthUrl);

    // Em vez de redirecionar, retorna a URL para o cliente lidar com o redirecionamento
    return new Response(JSON.stringify({ googleAuthUrl }), {
      status: 200, // Sucesso, pois estamos retornando a URL
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
    });

  } catch (error) {
    console.error('Erro na função google-calendar-auth-connect:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno ao iniciar conexão com Google Calendar.', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
