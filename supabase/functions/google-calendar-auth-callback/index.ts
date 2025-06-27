// import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsHeaders } from '../_shared/cors.ts';

// Log para verificar carregamento de variáveis de ambiente críticas
console.log('callback: GOOGLE_CALENDAR_CLIENT_ID:', Deno.env.get('GOOGLE_CALENDAR_CLIENT_ID'));
console.log('callback: GOOGLE_CALENDAR_CLIENT_SECRET:', Deno.env.get('GOOGLE_CALENDAR_CLIENT_SECRET'));
console.log('callback: GCAL_CALLBACK_URI_DEV:', Deno.env.get('GCAL_CALLBACK_URI_DEV'));
console.log('callback: GCAL_CALLBACK_URI_PROD:', Deno.env.get('GCAL_CALLBACK_URI_PROD'));
console.log('callback: FRONTEND_URL:', Deno.env.get('FRONTEND_URL'));

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
}

function getFrontendUrl(): string {
  const frontendUrls = Deno.env.get('FRONTEND_URL') || 'http://localhost:3000';
  const isProduction = Deno.env.get('SUPABASE_ENV') === 'PRODUCTION';
  
  console.log('getFrontendUrl: frontendUrls:', frontendUrls);
  console.log('getFrontendUrl: isProduction:', isProduction);
  
  // Se há múltiplas URLs separadas por vírgula, escolha baseada no ambiente
  if (frontendUrls.includes(',')) {
    const urls = frontendUrls.split(',').map(url => url.trim());
    console.log('getFrontendUrl: múltiplas URLs encontradas:', urls);
    
    // Em produção, use a URL que não seja localhost
    if (isProduction) {
      const prodUrl = urls.find(url => !url.includes('localhost')) || urls[0];
      console.log('getFrontendUrl: URL de produção selecionada:', prodUrl);
      return prodUrl;
    } else {
      // Em desenvolvimento, use localhost se disponível
      const devUrl = urls.find(url => url.includes('localhost')) || urls[0];
      console.log('getFrontendUrl: URL de desenvolvimento selecionada:', devUrl);
      return devUrl;
    }
  }
  
  console.log('getFrontendUrl: URL única retornada:', frontendUrls);
  return frontendUrls;
}

Deno.serve(async (req: Request) => {
  console.log(`google-calendar-auth-callback: ${req.method} ${req.url}`);
  const frontendUrl = getFrontendUrl();

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const stateReceived = url.searchParams.get('state');

    if (!code) {
      console.error('callback: Parâmetro "code" ausente.');
      return Response.redirect(`${frontendUrl}/settings/connections?error=google_auth_failed&reason=code_missing`, 302);
    }
    if (!stateReceived) {
      console.error('callback: Parâmetro "state" ausente.');
      return Response.redirect(`${frontendUrl}/settings/connections?error=google_auth_failed&reason=state_missing`, 302);
    }
    console.log('callback: Código recebido:', code, 'Estado:', stateReceived);

    const { data: pendingState, error: stateFetchError } = await supabaseAdmin
      .from('medico_oauth_pending_states')
      .select('medico_id, expires_at')
      .eq('state_value', stateReceived)
      .single();

    if (stateFetchError || !pendingState) {
      console.error('callback: Estado OAuth inválido:', stateReceived, stateFetchError);
      return Response.redirect(`${frontendUrl}/settings/connections?error=google_auth_failed&reason=invalid_state`, 302);
    }

    const { error: stateDeleteError } = await supabaseAdmin
        .from('medico_oauth_pending_states')
        .delete()
        .eq('state_value', stateReceived);
    if (stateDeleteError) {
        console.warn('callback: Falha ao deletar estado OAuth:', stateDeleteError.message);
    }

    if (new Date() > new Date(pendingState.expires_at)) {
      console.error('callback: Estado OAuth expirado:', stateReceived);
      return Response.redirect(`${frontendUrl}/settings/connections?error=google_auth_failed&reason=expired_state`, 302);
    }

    const medico_id = pendingState.medico_id;
    console.log(`callback: Estado validado. medico_id: ${medico_id}`);

    const clientId = Deno.env.get('GOOGLE_CALENDAR_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CALENDAR_CLIENT_SECRET');
    const redirectUri = Deno.env.get('SUPABASE_ENV') === 'PRODUCTION' 
                        ? Deno.env.get('GCAL_CALLBACK_URI_PROD') 
                        : Deno.env.get('GCAL_CALLBACK_URI_DEV');

    if (!clientId || !clientSecret || !redirectUri) {
      console.error('callback: Variáveis OAuth ausentes.');
      return Response.redirect(`${frontendUrl}/settings/connections?error=google_config_error`, 302);
    }

    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const tokenParams = new URLSearchParams({
      code: code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString(),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      console.error('callback: Erro ao trocar código por token:', tokenResponse.status, errorBody);
      return Response.redirect(`${frontendUrl}/settings/connections?error=google_token_exchange_failed&reason=${encodeURIComponent(errorBody)}`, 302);
    }

    const googleTokens = await tokenResponse.json() as GoogleTokenResponse;
    console.log('callback: Tokens recebidos.');

    const token_expires_at_unix = Math.floor(Date.now() / 1000) + googleTokens.expires_in;
    const token_expires_at_iso = new Date(token_expires_at_unix * 1000).toISOString();
    
    const scopesArray = googleTokens.scope ? googleTokens.scope.split(' ') : [];

    const { error: dbError } = await supabaseAdmin
      .from('medico_oauth_tokens')
      .upsert({
        medico_id: medico_id,
        provider: 'google_calendar',
        access_token: googleTokens.access_token,
        refresh_token: googleTokens.refresh_token,
        expires_at: token_expires_at_iso,
        scopes: scopesArray,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'medico_id, provider' });

    if (dbError) {
      console.error('callback: Erro ao salvar tokens:', dbError);
      return Response.redirect(`${frontendUrl}/settings/connections?error=db_save_failed&reason=${encodeURIComponent(dbError.message)}`, 302);
    }
    console.log('callback: Tokens salvos para medico_id:', medico_id);

    return Response.redirect(`${frontendUrl}/settings/connections?status=google_calendar_connected`, 302);

  } catch (error) {
    console.error('Erro na função callback:', error);
    return Response.redirect(`${frontendUrl}/settings/connections?error=google_internal_error&reason=${encodeURIComponent(error.message)}`, 302);
  }
}); 