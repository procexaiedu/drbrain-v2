import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// 🔐 SEGURANÇA: API Key agora vem de secret do Supabase
const EVOLUTION_API_URL = 'https://evolution2.procexai.tech'
const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY')

// Verificar se a API key está configurada
if (!EVOLUTION_API_KEY) {
  console.error('🚨 CRITICAL: EVOLUTION_API_KEY not configured in Supabase secrets')
  throw new Error('Evolution API key not configured. Please set EVOLUTION_API_KEY in Project Settings > Secrets')
}

interface WhatsAppConversation {
  id: string;
  medico_id: string;
  contact_jid: string;
  contact_name: string;
  last_message_at: string;
  unread_messages: number;
  created_at: string;
  updated_at: string;
  last_message_content?: string;
  last_message_sent_by?: string;
}

interface WhatsAppMessage {
  id: string;
  conversation_id: string;
  medico_id: string;
  message_content: string;
  message_type: string;
  sent_by: string;
  sent_at: string;
  media_url?: string;
  evolution_message_id?: string;
  created_at: string;
}

interface SendMessageRequest {
  number: string;
  message: string;
  conversationId?: string;
}

interface EvolutionSendResponse {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message: any;
  messageTimestamp: number;
  status: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user from JWT token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header missing' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt)

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token', details: userError?.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const medico_id = user.id
    const url = new URL(req.url)
    const path = url.pathname.split('/').pop() || ''

    console.log(`💬 WhatsApp Chat - ${req.method} /${path} for medico: ${medico_id}`)

    switch (path) {
      case 'conversations': {
        if (req.method !== 'GET') {
          return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 405,
          })
        }

        try {
          console.log(`📋 Fetching conversations for medico: ${medico_id}`)

          // Use the optimized function to get conversations with last message
          const { data: conversations, error: conversationsError } = await supabase
            .rpc('get_conversations_with_last_message', { p_medico_id: medico_id })

          if (conversationsError) {
            console.error('❌ Failed to fetch conversations:', conversationsError)
            throw new Error(`Database error: ${conversationsError.message}`)
          }

          console.log(`✅ Found ${conversations?.length || 0} conversations`)

          return new Response(JSON.stringify({
            success: true,
            conversations: conversations || [],
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          })

        } catch (error) {
          console.error('💥 Failed to fetch conversations:', error)
          return new Response(JSON.stringify({ 
            error: 'Failed to fetch conversations',
            details: error.message 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          })
        }
      }

      case 'messages': {
        if (req.method !== 'GET') {
          return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 405,
          })
        }

        try {
          const conversationId = url.searchParams.get('conversation_id')
          
          if (!conversationId) {
            return new Response(JSON.stringify({ error: 'conversation_id parameter required' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            })
          }

          console.log(`📨 Fetching messages for conversation: ${conversationId}`)

          // Fetch messages for the conversation (RLS automatically filters by medico_id)
          const { data: messages, error: messagesError } = await supabase
            .from('whatsapp_messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .eq('medico_id', medico_id) // Extra security check
            .order('sent_at', { ascending: true })

          if (messagesError) {
            console.error('❌ Failed to fetch messages:', messagesError)
            throw new Error(`Database error: ${messagesError.message}`)
          }

          console.log(`✅ Found ${messages?.length || 0} messages`)

          return new Response(JSON.stringify({
            success: true,
            messages: messages || [],
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          })

        } catch (error) {
          console.error('💥 Failed to fetch messages:', error)
          return new Response(JSON.stringify({ 
            error: 'Failed to fetch messages',
            details: error.message 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          })
        }
      }

      case 'send': {
        if (req.method !== 'POST') {
          return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 405,
          })
        }

        try {
          const requestBody: SendMessageRequest = await req.json()
          const { number, message, conversationId } = requestBody

          if (!number || !message) {
            return new Response(JSON.stringify({ error: 'number and message are required' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            })
          }

          console.log(`📤 Sending message to ${number}: ${message.substring(0, 50)}...`)

          // Get instance name for this medico
          const { data: tokenData, error: tokenError } = await supabase
            .from('medico_oauth_tokens')
            .select('instance_id, connection_status')
            .eq('medico_id', medico_id)
            .eq('provider', 'evolution_api')
            .single()

          if (tokenError || !tokenData) {
            return new Response(JSON.stringify({ error: 'WhatsApp not connected' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            })
          }

          if (tokenData.connection_status !== 'open') {
            return new Response(JSON.stringify({ error: 'WhatsApp not connected', status: tokenData.connection_status }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            })
          }

          const instanceName = tokenData.instance_id
          const remoteJid = `${number}@s.whatsapp.net`

          // Send message via EvolutionAPI
          const evolutionResponse = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': EVOLUTION_API_KEY,
            },
            body: JSON.stringify({
              number: number,
              text: message,
            }),
          })

          if (!evolutionResponse.ok) {
            const errorText = await evolutionResponse.text()
            console.error('❌ EvolutionAPI send failed:', evolutionResponse.status, errorText)
            throw new Error(`Failed to send message via WhatsApp: ${evolutionResponse.status}`)
          }

          const evolutionData: EvolutionSendResponse = await evolutionResponse.json()
          console.log('✅ Message sent via EvolutionAPI:', evolutionData.key.id)

          // Find or create conversation
          let conversationRecord = null
          
          if (conversationId) {
            // Try to get existing conversation
            const { data: existingConv } = await supabase
              .from('whatsapp_conversations')
              .select('*')
              .eq('id', conversationId)
              .eq('medico_id', medico_id)
              .single()
            
            conversationRecord = existingConv
          }

          if (!conversationRecord) {
            // Create or update conversation
            const { data: upsertedConv, error: convError } = await supabase
              .from('whatsapp_conversations')
              .upsert({
                medico_id,
                contact_jid: remoteJid,
                contact_name: number, // We only have the number for now
                last_message_at: new Date().toISOString(),
                unread_messages: 0, // Doctor sent message, so no unread
                updated_at: new Date().toISOString(),
              }, {
                onConflict: 'medico_id,contact_jid',
                ignoreDuplicates: false
              })
              .select()
              .single()

            if (convError) {
              console.error('❌ Failed to upsert conversation:', convError)
              throw new Error(`Failed to create conversation: ${convError.message}`)
            }

            conversationRecord = upsertedConv
          }

                     // Ensure we have a conversation record
           if (!conversationRecord) {
             throw new Error('Failed to create or find conversation')
           }

           // Save message to database
           const { data: savedMessage, error: messageError } = await supabase
             .from('whatsapp_messages')
             .insert({
               conversation_id: conversationRecord.id,
               medico_id,
               message_content: message,
               message_type: 'text',
               sent_by: 'medico',
               sent_at: new Date(evolutionData.messageTimestamp * 1000).toISOString(),
               evolution_message_id: evolutionData.key.id,
             })
             .select()
             .single()

          if (messageError) {
            console.error('❌ Failed to save message:', messageError)
            // Don't fail the request, message was sent successfully
            console.warn('⚠️ Message sent but not saved to database')
          }

          console.log('💾 Message saved to database')

          return new Response(JSON.stringify({
            success: true,
            message: savedMessage,
            evolutionResponse: evolutionData,
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          })

        } catch (error) {
          console.error('💥 Failed to send message:', error)
          return new Response(JSON.stringify({ 
            error: 'Failed to send message',
            details: error.message 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          })
        }
      }

      case 'webhook': {
        if (req.method !== 'POST') {
          return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 405,
          })
        }

        try {
          // This endpoint can be used by n8n or other services to push updates
          const webhookData = await req.json()
          console.log('🔗 Webhook received:', JSON.stringify(webhookData, null, 2))

          // Process webhook data here if needed
          // For now, just acknowledge receipt
          
          return new Response(JSON.stringify({
            success: true,
            message: 'Webhook received',
            timestamp: new Date().toISOString(),
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          })

        } catch (error) {
          console.error('💥 Webhook processing failed:', error)
          return new Response(JSON.stringify({ 
            error: 'Webhook processing failed',
            details: error.message 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          })
        }
      }

      default:
        return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        })
    }

  } catch (error) {
    console.error('💥 Unexpected error in whatsapp-chat:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}) 