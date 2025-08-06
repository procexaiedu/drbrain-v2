import { supabaseAdmin } from './supabaseAdmin.ts';

interface GoogleTokenRefreshResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export async function getValidGoogleToken(medico_id: string): Promise<string | null> {
  console.log(`getValidGoogleToken: Buscando token para medico_id: ${medico_id}`);
  const { data: tokenData, error: fetchError } = await supabaseAdmin
    .from('medico_oauth_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('medico_id', medico_id)
    .eq('provider', 'google_calendar')
    .single();

  if (fetchError || !tokenData) {
    console.error(`getValidGoogleToken: Token não encontrado para ${medico_id}:`, fetchError);
    return null;
  }

  const currentTimeInSeconds = Math.floor(Date.now() / 1000);
  let isTokenCurrentlyValid = false;

  if (tokenData.expires_at) {
    try {
      const tokenExpiresAtDate = new Date(tokenData.expires_at);
      if (!isNaN(tokenExpiresAtDate.getTime())) {
        const tokenExpiresAtInSeconds = Math.floor(tokenExpiresAtDate.getTime() / 1000);
        if (tokenExpiresAtInSeconds > currentTimeInSeconds + 300) { // 300s = 5min buffer
          console.log(`getValidGoogleToken: Token válido para ${medico_id}. Expira em: ${tokenExpiresAtDate.toISOString()}`);
          isTokenCurrentlyValid = true;
        } else {
          console.log(`getValidGoogleToken: Token para ${medico_id} expirado ou prestes a expirar. Expira em: ${tokenExpiresAtDate.toISOString()}, Agora: ${new Date(currentTimeInSeconds * 1000).toISOString()}`);
        }
      } else {
        console.warn(`getValidGoogleToken: Formato de expires_at inválido do DB para ${medico_id}: ${tokenData.expires_at}. Forçando refresh.`);
      }
    } catch (e) {
      console.error(`getValidGoogleToken: Erro ao parsear expires_at ('${tokenData.expires_at}') para ${medico_id}:`, e);
    }
  } else {
    console.log(`getValidGoogleToken: expires_at não definido para ${medico_id}. Forçando refresh.`);
  }

  if (isTokenCurrentlyValid && tokenData.access_token) {
    return tokenData.access_token;
  }

  if (!tokenData.refresh_token) {
    console.error(`getValidGoogleToken: Token expirado, sem refresh_token para ${medico_id}`);
    return null;
  }

  console.log(`getValidGoogleToken: Token expirado. Refresh para ${medico_id}`);
  const clientId = Deno.env.get('GOOGLE_CALENDAR_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CALENDAR_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    console.error('getValidGoogleToken: Client ID/Secret não configurados.');
    return null;
  }

  try {
    const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: tokenData.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    if (!refreshResponse.ok) {
      const errorBody = await refreshResponse.text();
      console.error(`getValidGoogleToken: Falha no refresh para ${medico_id}:`, refreshResponse.status, errorBody);
      return null;
    }

    const newTokens = await refreshResponse.json() as GoogleTokenRefreshResponse;
    console.log(`getValidGoogleToken: Token refrescado para ${medico_id}`);

    const new_expires_at_unix = Math.floor(Date.now() / 1000) + newTokens.expires_in;
    const new_expires_at_iso = new Date(new_expires_at_unix * 1000).toISOString();
    const { error: updateError } = await supabaseAdmin
      .from('medico_oauth_tokens')
      .update({
        access_token: newTokens.access_token,
        expires_at: new_expires_at_iso,
        updated_at: new Date().toISOString(),
      })
      .eq('medico_id', medico_id)
      .eq('provider', 'google_calendar');

    if (updateError) {
      console.error(`getValidGoogleToken: Falha ao atualizar token no DB para ${medico_id}:`, updateError);
    }
    
    console.log(`getValidGoogleToken: Token refrescado e salvo no DB para ${medico_id}`);
    return newTokens.access_token;

  } catch (e) {
    console.error(`getValidGoogleToken: Exceção no refresh para ${medico_id}:`, e);
    return null;
  }
} 