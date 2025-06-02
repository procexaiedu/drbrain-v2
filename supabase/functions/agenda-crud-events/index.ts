// Implementação da Edge Function para CRUD de eventos da agenda
// import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'; // REMOVER
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts'; // Ajustado
import { corsHeaders } from '../_shared/cors.ts'; // Ajustado

interface GoogleTokenRefreshResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

async function getValidGoogleToken(medico_id: string): Promise<string | null> {
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
      // Assumindo que tokenData.expires_at é uma string ISO 8601 válida do banco.
      // Se for um formato inesperado, o new Date() pode resultar em 'Invalid Date'.
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
        // isTokenCurrentlyValid permanece false, forçando o refresh
      }
    } catch (e) {
      console.error(`getValidGoogleToken: Erro ao parsear expires_at ('${tokenData.expires_at}') para ${medico_id}:`, e);
      // isTokenCurrentlyValid permanece false, forçando o refresh
    }
  } else {
    console.log(`getValidGoogleToken: expires_at não definido para ${medico_id}. Forçando refresh.`);
    // isTokenCurrentlyValid permanece false
  }

  if (isTokenCurrentlyValid && tokenData.access_token) {
    return tokenData.access_token;
  }

  // Se chegou aqui, o token não é válido ou não existe, prosseguir para refresh ou erro
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

Deno.serve(async (req: Request) => {
  console.log(`agenda-crud-events: ${req.method} ${req.url}`);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header ausente' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado', details: userError?.message }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const medico_id = user.id;
    console.log('agenda-crud-events: Usuário autenticado:', medico_id);

    const googleAccessToken = await getValidGoogleToken(medico_id);
    if (!googleAccessToken) {
      return new Response(JSON.stringify({ 
        error: 'Token de acesso inválido para Google Calendar. Reconecte sua conta.' 
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    console.log('agenda-crud-events: Google Access Token obtido.');

    let responseBody = '';
    let responseStatus = 200;

    const url = new URL(req.url);
    const urlParts = url.pathname.split('/');
    const eventIdGcal = urlParts[urlParts.indexOf('agenda-crud-events') + 1]; 

    switch (req.method) {
      case 'GET':
        const timeMin = url.searchParams.get('start_date');
        const timeMax = url.searchParams.get('end_date');

        if (!timeMin || !timeMax) {
          responseStatus = 400;
          responseBody = JSON.stringify({ error: 'start_date e end_date são obrigatórios.' });
          break;
        }

        const listParams = new URLSearchParams({
          timeMin: timeMin,
          timeMax: timeMax,
          singleEvents: 'true',
          orderBy: 'startTime',
          maxResults: '250'
        });

        const listApiUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?${listParams.toString()}`;
        console.log(`agenda-crud-events: GET ${listApiUrl}`);

        const listApiResponse = await fetch(listApiUrl, {
          headers: {
            'Authorization': `Bearer ${googleAccessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!listApiResponse.ok) {
          const errorData = await listApiResponse.json().catch(() => ({ summary: listApiResponse.statusText }));
          console.error('agenda-crud-events: Erro ao listar eventos:', errorData);
          responseStatus = listApiResponse.status;
          responseBody = JSON.stringify({ 
            error: 'Falha ao buscar eventos.', 
            details: errorData.error?.message || errorData.summary || 'Erro Google API'
          });
          break;
        }
        const googleEvents = await listApiResponse.json();
        responseBody = JSON.stringify(googleEvents.items || []); 
        console.log(`agenda-crud-events: ${googleEvents.items?.length || 0} eventos listados.`);
        break;

      case 'POST':
        try {
          const eventData = await req.json();
          if (!eventData.summary || !eventData.start || !eventData.end) {
            responseStatus = 400;
            responseBody = JSON.stringify({ error: 'Dados incompletos: summary, start, end obrigatórios.' });
            break;
          }

          const createApiUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events`;
          console.log(`agenda-crud-events: POST ${createApiUrl}`);

          const createApiResponse = await fetch(createApiUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${googleAccessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventData)
          });

          if (!createApiResponse.ok) {
            const errorData = await createApiResponse.json().catch(() => ({ summary: createApiResponse.statusText }));
            console.error('agenda-crud-events: Erro ao criar evento:', errorData);
            responseStatus = createApiResponse.status;
            responseBody = JSON.stringify({ 
              error: 'Falha ao criar evento.', 
              details: errorData.error?.message || errorData.summary || 'Erro Google API'
            });
            break;
          }
          const createdEvent = await createApiResponse.json();
          responseBody = JSON.stringify(createdEvent);
          console.log('agenda-crud-events: Evento criado:', createdEvent.id);
        } catch (e) {
          console.error('agenda-crud-events: Erro no POST (parsing JSON?):', e);
          responseStatus = 400;
          responseBody = JSON.stringify({ error: 'Requisição inválida.', details: e.message });
        }
        break;

      case 'PUT':
        if (!eventIdGcal) {
          responseStatus = 400;
          responseBody = JSON.stringify({ error: 'ID do evento não fornecido na URL para PUT.' });
          break;
        }
        try {
          const eventDataToUpdate = await req.json();
          // Validação básica (o Google API fará uma validação mais completa)
          if (Object.keys(eventDataToUpdate).length === 0) {
              responseStatus = 400;
              responseBody = JSON.stringify({ error: 'Corpo da requisição para PUT vazio.' });
              break;
          }

          const updateApiUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventIdGcal}`;
          console.log(`agenda-crud-events: PUT ${updateApiUrl}`);

          const updateApiResponse = await fetch(updateApiUrl, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${googleAccessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventDataToUpdate)
          });

          if (!updateApiResponse.ok) {
            const errorData = await updateApiResponse.json().catch(() => ({ summary: updateApiResponse.statusText }));
            console.error('agenda-crud-events: Erro ao atualizar evento:', eventIdGcal, errorData);
            responseStatus = updateApiResponse.status;
            responseBody = JSON.stringify({ 
              error: 'Falha ao atualizar evento.', 
              details: errorData.error?.message || errorData.summary || 'Erro Google API'
            });
            break;
          }
          const updatedEvent = await updateApiResponse.json();
          responseBody = JSON.stringify(updatedEvent);
          console.log('agenda-crud-events: Evento atualizado:', updatedEvent.id);
        } catch (e) {
          console.error('agenda-crud-events: Erro no PUT (parsing JSON?):', e);
          responseStatus = 400;
          responseBody = JSON.stringify({ error: 'Requisição inválida.', details: e.message });
        }
        break;

      case 'DELETE':
        if (!eventIdGcal) {
          responseStatus = 400;
          responseBody = JSON.stringify({ error: 'ID do evento não fornecido na URL para DELETE.' });
          break;
        }

        const deleteApiUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventIdGcal}`;
        console.log(`agenda-crud-events: DELETE ${deleteApiUrl}`);

        const deleteApiResponse = await fetch(deleteApiUrl, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${googleAccessToken}` }
        });

        if (!deleteApiResponse.ok && deleteApiResponse.status !== 204) { // 204 é sucesso para DELETE sem conteúdo
          const errorData = await deleteApiResponse.json().catch(() => ({ summary: deleteApiResponse.statusText }));
          console.error('agenda-crud-events: Erro ao deletar evento:', eventIdGcal, errorData);
          responseStatus = deleteApiResponse.status;
          responseBody = JSON.stringify({ 
            error: 'Falha ao deletar evento.', 
            details: errorData.error?.message || errorData.summary || 'Erro Google API'
          });
          break;
        }
        responseBody = JSON.stringify({ message: `Evento ${eventIdGcal} deletado com sucesso.` });
        responseStatus = 200; // ou 204 se não houver corpo de resposta
        console.log('agenda-crud-events: Evento deletado:', eventIdGcal);
        break;

      default:
        responseStatus = 405;
        responseBody = JSON.stringify({ error: 'Método não permitido.' });
    }

    return new Response(responseBody, {
      status: responseStatus,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Erro na função agenda-crud-events:', error);
    return new Response(JSON.stringify({ error: 'Erro interno do servidor.', details: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}); 