import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// As secrets são lidas do ambiente do Supabase
const EVOLUTION_API_URL = 'https://evolution2.procexai.tech'
const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY')

// Função auxiliar para criar o cliente Supabase de serviço para operações de admin
const createAdminClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase service role configuration is missing.')
  }
  return createClient(supabaseUrl, supabaseServiceKey)
}

interface SendMessageRequest {
  number: string;
  message: string;
  conversationId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Cliente Supabase com autenticação do usuário para obter o medico_id e fazer queries RLS
    const userSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    const { data: { user }, error: userError } = await userSupabase.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401
      })
    }
    const medico_id = user.id

    // Cliente Supabase com role de serviço para operações que precisam de privilégios elevados
    const supabaseAdmin = createAdminClient()

    const url = new URL(req.url)
    const path = url.pathname.split('/').pop() || ''

    console.log(`💬 WhatsApp Chat - ${req.method} /${path} for medico: ${medico_id}`)

    switch (path) {
      case 'conversations': {
        // Para buscar conversas, usamos o cliente do usuário, pois a função RPC e a RLS cuidarão da segurança.
        const { data: conversations, error } = await userSupabase
          .rpc('get_conversations_with_last_message', { p_medico_id: medico_id })

        if (error) throw error

        return new Response(JSON.stringify({ success: true, conversations: conversations || [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'messages': {
        const conversationId = url.searchParams.get('conversation_id')
        if (!conversationId) {
          return new Response(JSON.stringify({ error: 'conversation_id is required' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400
          })
        }

        // Para buscar mensagens, também usamos o cliente do usuário. A RLS na tabela `whatsapp_messages` garante a segurança.
        const { data: messages, error } = await userSupabase
          .from('whatsapp_messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('sent_at', { ascending: true })

        if (error) throw error

        return new Response(JSON.stringify({ success: true, messages: messages || [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'send': {
        const { number, message, conversationId }: SendMessageRequest = await req.json()
        if (!number || !message) {
          return new Response(JSON.stringify({ error: 'number and message are required' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400
          })
        }

        // Para buscar o token de conexão, usamos o cliente admin, pois o médico não deve ter acesso direto a essa tabela.
        const { data: tokenData, error: tokenError } = await supabaseAdmin
          .from('medico_oauth_tokens')
          .select('instance_id, connection_status')
          .eq('medico_id', medico_id)
          .eq('provider', 'evolution_api')
          .single()

        if (tokenError || !tokenData || tokenData.connection_status !== 'open') {
          throw new Error('WhatsApp not connected or connection info not found.')
        }

        const instanceName = tokenData.instance_id

        // Envia a mensagem pela Evolution API
        const evolutionResponse = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY! },
          body: JSON.stringify({ number, textMessage: { text: message } })
        })

        if (!evolutionResponse.ok) {
          const errorText = await evolutionResponse.text()
          throw new Error(`Failed to send message via Evolution API: ${errorText}`)
        }
        const evolutionData = await evolutionResponse.json()

        // Garante que a conversa exista e obtém o ID
        const { data: conversation } = await supabaseAdmin.rpc('find_or_create_conversation', {
          p_medico_id: medico_id,
          p_contact_jid: `${number}@s.whatsapp.net`,
          p_contact_name: number // O nome será atualizado pelo n8n quando o contato responder
        });
        
        if (!conversation) {
            throw new Error('Could not find or create a conversation record.');
        }

        // Salva a mensagem enviada pelo médico no banco de dados
        const { data: savedMessage, error: messageError } = await supabaseAdmin
          .from('whatsapp_messages')
          .insert({
            conversation_id: conversation.id,
            medico_id,
            message_content: message,
            sent_by: 'medico',
            sent_at: new Date(evolutionData.messageTimestamp * 1000).toISOString(),
            evolution_message_id: evolutionData.key.id,
          })
          .select()
          .single()

        if (messageError) throw messageError

        return new Response(JSON.stringify({ success: true, message: savedMessage }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      default:
        return new Response(JSON.stringify({ error: 'Not Found' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404
        })
    }
  } catch (error) {
    console.error("WhatsApp Chat Error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500
    })
  }
})
