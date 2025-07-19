// Implementação da Edge Function para CRUD de eventos da agenda
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getValidGoogleToken } from '../_shared/googleTokenManager.ts';

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
