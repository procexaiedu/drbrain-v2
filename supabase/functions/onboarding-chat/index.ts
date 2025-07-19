import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

// ENTRADA ESPERADA NO PAYLOAD:
// {
//   medico_id: string, (ID do usuário médico autenticado)
//   agente_destino: string, (Ex: 'onboarding_medico_v1', para o N8N saber qual fluxo seguir)
//   message_type: 'text' | 'audio',
//   content: string (texto da mensagem ou áudio em Base64)
// }
// 
// SAÍDA ESPERADA DO N8N (E DESTA FUNCTION):
// {
//   id: string, (ID da mensagem de resposta)
//   text: string, (Conteúdo da resposta do agente)
//   timestamp: string, (ISO string)
//   onboarding_status?: 'in_progress' | 'completed' (Opcional, para o frontend saber quando redirecionar)
//   // Outros campos que o ChatMessage possa esperar, como avatar, userName, etc., podem ser adicionados pelo frontend.
// }

serve(async (req: Request) => {
  // Tratamento de preflight request para CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const n8nWebhookUrl = Deno.env.get('N8N_ONBOARDING_WEBHOOK_URL');
    if (!n8nWebhookUrl) {
      console.error('N8N_ONBOARDING_WEBHOOK_URL não está configurada.');
      return new Response(JSON.stringify({ message: 'Configuração do servidor incompleta.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const payload = await req.json();
    console.log('Payload recebido no BFF onboarding-chat:', payload);

    // TODO: Adicionar validação do payload (medico_id, content, etc.)
    // Poderia verificar se o medico_id no payload corresponde ao usuário autenticado (req.headers.get('Authorization'))
    // Mas para o MVP, vamos manter simples e assumir que o frontend envia o medico_id correto.

    // Encaminhar o payload para o Webhook N8N
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Se o N8N Webhook exigir alguma chave de API, adicionar aqui nos headers
        // 'X-N8N-Api-Key': Deno.env.get('N8N_WEBHOOK_API_KEY') 
      },
      body: JSON.stringify(payload),
    });

    if (!n8nResponse.ok) {
      const errorBody = await n8nResponse.text(); // Tenta pegar o corpo do erro como texto
      console.error(`Erro ao chamar N8N (${n8nResponse.status}):`, errorBody);
      return new Response(JSON.stringify({ 
        message: `Erro na comunicação com o agente de onboarding: ${n8nResponse.statusText}`,
        details: errorBody
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: n8nResponse.status,
      });
    }

    const n8nData = await n8nResponse.json();
    console.log('Resposta recebida do N8N:', n8nData);

    // A resposta do N8N já deve estar no formato esperado pelo frontend (ChatMessage)
    // ou precisaria ser transformada aqui.
    // Assumindo que o N8N retorna um objeto compatível.
    return new Response(JSON.stringify(n8nData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro interno na Edge Function onboarding-chat:', error.message);
    return new Response(JSON.stringify({ message: error.message || 'Erro interno do servidor' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 