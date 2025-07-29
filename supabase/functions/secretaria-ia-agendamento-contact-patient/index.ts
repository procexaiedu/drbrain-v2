// Implementação da Edge Function para iniciar contato de agendamento via Secretária IA
// import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'; // REMOVER
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts'; // Ajustado
import { corsHeaders } from '../_shared/cors.ts'; // Ajustado

interface ContactRequestPayload {
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  reason: string;
  medico_id: string;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[0-9\s\(\)-]{7,}$/;
  return phoneRegex.test(phone);
}

Deno.serve(async (req: Request) => {
  const functionName = 'secretaria-ia-agendamento-contact-patient';
  console.log(`${functionName}: ${req.method} ${req.url}`);

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
    console.log(`${functionName}: Usuário autenticado: ${medico_id}`);

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Método não permitido. Use POST.' }), {
        status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let rawBody;
    try {
      rawBody = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Corpo da requisição inválido. Esperado JSON.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { patientName, patientPhone, patientEmail, reason } = rawBody as Omit<ContactRequestPayload, 'medico_id'>;

    if (!patientName || typeof patientName !== 'string' || patientName.trim() === '') {
      return new Response(JSON.stringify({ error: 'patientName é obrigatório.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    if (!patientPhone || typeof patientPhone !== 'string' || !isValidPhone(patientPhone.trim())) {
      return new Response(JSON.stringify({ error: 'patientPhone é obrigatório e deve ser válido.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    if (patientEmail && (typeof patientEmail !== 'string' || !isValidEmail(patientEmail.trim()))) {
      return new Response(JSON.stringify({ error: 'patientEmail deve ser válido.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    if (!reason || typeof reason !== 'string' || reason.trim() === '') {
      return new Response(JSON.stringify({ error: 'reason é obrigatório.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const n8nWebhookUrl = Deno.env.get('N8N_SECRETARIA_IA_AGENDAMENTO_WEBHOOK_URL');
    if (!n8nWebhookUrl) {
      console.error(`${functionName}: N8N_SECRETARIA_IA_AGENDAMENTO_WEBHOOK_URL não configurada.`);
      return new Response(JSON.stringify({ error: 'Erro de configuração: Webhook N8N não definido.' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const payloadToN8N: ContactRequestPayload = {
      medico_id: medico_id,
      patientName: patientName.trim(),
      patientPhone: patientPhone.trim(),
      patientEmail: patientEmail ? patientEmail.trim() : undefined,
      reason: reason.trim()
    };

    console.log(`${functionName}: Enviando para N8N:`, payloadToN8N);

    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadToN8N)
    });

    if (!n8nResponse.ok) {
      const n8nErrorText = await n8nResponse.text();
      console.error(`${functionName}: Erro ao chamar webhook N8N:`, n8nResponse.status, n8nErrorText);
      return new Response(JSON.stringify({
        error: 'Falha ao encaminhar para Secretária IA.',
        details: `N8N Error ${n8nResponse.status}: ${n8nErrorText}`
      }), {
        status: 502, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let n8nResponseBody = { message: "Solicitação recebida pelo N8N." };
    try {
      const n8nJson = await n8nResponse.json();
      n8nResponseBody = { ...n8nResponseBody, ...n8nJson };
    } catch (e) {
      console.warn(`${functionName}: N8N não retornou JSON, usando resposta padrão.`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Solicitação de contato enviada para Secretária IA.',
      n8n_response: n8nResponseBody
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`Erro em ${functionName}:`, error);
    return new Response(JSON.stringify({ error: 'Erro interno do servidor.', details: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}); 