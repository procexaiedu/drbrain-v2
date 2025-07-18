import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsHeaders } from '../_shared/cors.ts';

console.log('Function financeiro-webhook-handler loaded');

Deno.serve(async (req: Request) => {
  console.log(`${req.method} ${req.url}`);
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // O Asaas pode enviar um token de autenticação no header para validação
    // const asaasAuthToken = req.headers.get('asaas-access-token');
    // if (asaasAuthToken !== Deno.env.get('ASAAS_WEBHOOK_TOKEN')) {
    //   return new Response(JSON.stringify({ error: 'Token de webhook inválido' }), {
    //     headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    //     status: 401,
    //   });
    // }

    const eventData = await req.json();
    console.log('Webhook Asaas recebido:', eventData.event, eventData.payment?.id || eventData.subscription?.id);

    const eventType = eventData.event;
    const paymentId = eventData.payment?.id; // ID da cobrança no Asaas
    const subscriptionId = eventData.subscription?.id; // ID da assinatura no Asaas
    const externalReference = eventData.payment?.externalReference || eventData.subscription?.externalReference; // Nosso ID interno

    if (!externalReference) {
      console.warn('Webhook Asaas sem externalReference. Ignorando.');
      return new Response(JSON.stringify({ message: 'Webhook processado (sem externalReference)' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    let newStatus = '';
    let updatePayload: any = { updated_at: new Date().toISOString() };

    switch (eventType) {
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_CONFIRMED_BY_BANK':
        newStatus = 'PAGO';
        updatePayload.data_pagamento = new Date(eventData.payment.clientPaymentDate || eventData.payment.dateCreated).toISOString();
        break;
      case 'PAYMENT_OVERDUE':
        newStatus = 'VENCIDO';
        break;
      case 'PAYMENT_CANCELED':
      case 'PAYMENT_REFUNDED':
        newStatus = 'CANCELADO'; // Ou ESTORNADO, dependendo da granularidade
        break;
      // Adicionar outros eventos conforme necessário
      default:
        console.log(`Evento Asaas ${eventType} não tratado. Ignorando.`);
        return new Response(JSON.stringify({ message: `Evento ${eventType} não tratado.` }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
    }

    if (newStatus) {
      updatePayload.status_cobranca = newStatus;

      const { data, error } = await supabaseAdmin
        .from('cobrancas')
        .update(updatePayload)
        .eq('id', externalReference) // Usar nosso ID interno
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar status da cobrança no Supabase:', error);
        return new Response(JSON.stringify({ error: 'Erro interno ao processar webhook' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }

      if (!data) {
        console.warn(`Cobrança com externalReference ${externalReference} não encontrada no Supabase.`);
        return new Response(JSON.stringify({ message: 'Cobrança não encontrada no sistema' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        });
      }

      console.log(`Status da cobrança ${externalReference} atualizado para ${newStatus}.`);
      return new Response(JSON.stringify({ success: true, message: 'Webhook processado com sucesso' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ message: 'Nenhuma ação necessária para este webhook' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro na Edge Function financeiro-webhook-handler:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Erro interno do servidor' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
