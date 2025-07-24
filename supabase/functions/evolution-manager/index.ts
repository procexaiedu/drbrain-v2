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

// Definindo as interfaces de resposta da EvolutionAPI de acordo com a documentação e prática
interface EvolutionInstanceResponse {
  instanceName: string;
  instanceId: string; // Exemplo: "instance@evolution"
  status: string; // Exemplo: "created"
  serverUrl?: string; // Opcional, pode não ser retornado
  // `apikey` não é retornado aqui, usamos a global EVOLUTION_API_KEY
}

interface EvolutionConnectionResponse {
  state: string; // Exemplo: "connecting", "open", "disconnected"
  // `qrcode` não é retornado aqui, vem via webhook
}

// EvolutionStatusResponse também deve esperar um 'state' string, o qrcode virá do DB
// Já está assim na interface EvolutionConnectionResponse, então podemos reusar ou simplificar.
// Para clareza, manterei `EvolutionStatusResponse` mas alinhado com a resposta do `connectionState` que é uma string simples.
interface EvolutionStatusResponse {
    state: string;
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

    console.log(`🔧 Evolution Manager - ${req.method} /${path} for medico: ${medico_id}`)

    switch (path) {
      case 'connect': {
        if (req.method !== 'POST') {
          return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 405,
          })
        }

        const instanceName = `drbrain_${medico_id.replace(/-/g, '_')}`
        // TODO: Substituir pela URL REAL do seu workflow de webhook de mensagens no n8n
        const n8nWebhookUrl = `https://your-n8n-instance.com/webhook/evolution-inbound-message`; 
        // TODO: Substituir pela URL REAL do seu workflow de webhook de status de conexão no n8n
        const n8nConnectionStatusWebhookUrl = `https://your-n8n-instance.com/webhook/evolution-connection-status`; 

        try {
          // 1. Check if instance already exists in our database with a non-disconnected status
          const { data: existingToken } = await supabase
            .from('medico_oauth_tokens')
            .select('instance_id, connection_status')
            .eq('medico_id', medico_id)
            .eq('provider', 'evolution_api')
            .neq('connection_status', 'disconnected') // Check for any active/pending status
            .single()

          if (existingToken) {
            if (existingToken.connection_status === 'open' || existingToken.connection_status === 'pending') {
              console.warn(`⚠️ Instance ${existingToken.instance_id} already exists and is ${existingToken.connection_status}. Aborting new connection attempt.`)
              return new Response(JSON.stringify({
                success: false,
                error: 'Connection already exists',
                details: `Uma conexão WhatsApp já está ${existingToken.connection_status}. Desconecte antes de tentar conectar novamente.`,
                status: existingToken.connection_status,
              }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 409, // Conflict
              })
            }
          }

          let createData: EvolutionInstanceResponse;
          let currentConnectState: string; // Para capturar o estado inicial de conexão


          try {
            // Attempt to create instance in EvolutionAPI
            console.log(`📱 Attempting to create instance: ${instanceName}`)
            const createResponse = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': EVOLUTION_API_KEY, // Usa a API key global para esta operação
              },
              body: JSON.stringify({
                instanceName,
                qrcode: true,
                integration: 'WHATSAPP-BAILEYS'
              }),
            })

            if (!createResponse.ok) {
              const errorBody = await createResponse.json()
              console.error('❌ EvolutionAPI create failed:', createResponse.status, errorBody)

              // Handle "name already in use" specifically
              if (createResponse.status === 403 && errorBody.response?.message?.includes('This name \'' + instanceName + '\' is already in use.')) {
                console.warn(`⚠️ Instance name ${instanceName} already in use on EvolutionAPI. Attempting to delete old instance...`)
                const deleteResponse = await fetch(`${EVOLUTION_API_URL}/instance/delete/${instanceName}`, {
                  method: 'DELETE',
                  headers: {
                    'apikey': EVOLUTION_API_KEY,
                  },
                })

                if (!deleteResponse.ok) {
                  const deleteErrorText = await deleteResponse.text()
                  console.error('❌ Failed to delete old instance:', deleteResponse.status, deleteErrorText)
                  throw new Error(`Failed to create instance: Name in use and failed to delete old instance (Status: ${deleteResponse.status})`)
                }
                console.log(`✅ Old instance ${instanceName} deleted successfully. Retrying create...`)
                // Retry create after deletion
                const retryCreateResponse = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'apikey': EVOLUTION_API_KEY,
                  },
                  body: JSON.stringify({
                    instanceName,
                    qrcode: true,
                    integration: 'WHATSAPP-BAILEYS'
                  }),
                })

                if (!retryCreateResponse.ok) {
                  const retryErrorText = await retryCreateResponse.text()
                  console.error('❌ EvolutionAPI retry create failed:', retryCreateResponse.status, retryErrorText)
                  throw new Error(`Failed to create instance after deleting old one (Status: ${retryCreateResponse.status})`)
                }
                createData = await retryCreateResponse.json() // Obter os dados da instância criada no retry
                console.log('✅ Instance re-created successfully:', createData.instanceName)

              } else {
                // Other create errors
                throw new Error(`Failed to create instance: ${createResponse.status} - ${JSON.stringify(errorBody)}`)
              }
            } else {
              createData = await createResponse.json() // Obter os dados da instância criada na primeira tentativa
              console.log('✅ Instance created:', createData.instanceName)
            }
          } catch (createOrDeleteError) {
            console.error('💥 Error during instance creation or deletion attempt:', createOrDeleteError)
            throw new Error(`Falha ao criar/gerenciar instância WhatsApp: ${createOrDeleteError.message}`)
          }


          // 2. Connect instance to get initial state
          console.log(`🔗 Connecting instance: ${instanceName}`)
          const connectResponse = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
            method: 'GET',
            headers: {
              'apikey': EVOLUTION_API_KEY,
            },
          })

          if (!connectResponse.ok) {
            const errorText = await connectResponse.text()
            console.error('❌ EvolutionAPI connect failed:', connectResponse.status, errorText)
            throw new Error(`Failed to connect instance: ${connectResponse.status} - ${errorText}`)
          }

          // A EvolutionAPI retorna apenas uma string para connectionState, não um objeto
          currentConnectState = await connectResponse.text(); // Captura o estado como texto
          console.log('📲 Connection initiated, status:', currentConnectState)


          // 3. Register webhooks for the instance (CRUCIAL FOR QR CODE & MESSAGES)
          console.log(`🕸️ Registering webhooks for instance: ${instanceName}`)
          const webhookPayload = {
            url: n8nWebhookUrl, // Webhook para o n8n para mensagens
            webhook_by_events: true, // Se o n8n espera URL por evento
            webhook_base64: false, // Não encode base64
            events: [
              "QRCODE_UPDATED",
              "MESSAGES_UPSERT",
              "CONNECTION_UPDATE",
              "SEND_MESSAGE" // Para rastrear mensagens enviadas pela API
            ]
          };

          const registerWebhookResponse = await fetch(`${EVOLUTION_API_URL}/webhook/update/${instanceName}`, {
            method: 'PUT', // PUT para atualizar/criar webhooks
            headers: {
              'Content-Type': 'application/json',
              'apikey': EVOLUTION_API_KEY,
            },
            body: JSON.stringify(webhookPayload),
          });

          if (!registerWebhookResponse.ok) {
            const webhookErrorText = await registerWebhookResponse.text();
            console.error('❌ Failed to register webhooks:', registerWebhookResponse.status, webhookErrorText);
            // Decide se falhar aqui impede a conexão ou apenas loga o erro
            // Por enquanto, vamos logar e continuar, pois a instância pode estar funcional sem webhooks
            // Mas o QR code não aparecerá e as mensagens não chegarão na UI.
            throw new Error(`Failed to register webhooks: ${registerWebhookResponse.status} - ${webhookErrorText}`);
          }
          console.log('✅ Webhooks registered successfully.')


          // 4. Store/update instance info in database
          const { error: upsertError } = await supabase
            .from('medico_oauth_tokens')
            .upsert({
              medico_id,
              provider: 'evolution_api',
              instance_id: instanceName, // Usamos o instanceName como ID da instância
              access_token: EVOLUTION_API_KEY, // Usar a API key global para a coluna `access_token`
              connection_status: currentConnectState, // Estado inicial
              qrcode: null, // QR code virá via webhook, então definimos como null inicialmente
              created_at: new Date().toISOString(), // Only set on first insert
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'medico_id,provider'
            })

          if (upsertError) {
            console.error('❌ Database upsert failed:', upsertError)
            throw new Error(`Database error: ${upsertError.message}`)
          }

          console.log('💾 Instance info saved to database')

          return new Response(JSON.stringify({
            success: true,
            instanceName: createData.instanceName, // Usar o nome da instância da API
            status: currentConnectState,
            qrcode: null, // QR code não vem daqui, ele virá via webhook
            details: 'Conexão iniciada. QR Code será exibido em breve (verifique webhooks n8n).' // Mensagem para o frontend
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          })

        } catch (error) {
          console.error('💥 Connect operation failed:', error)
          return new Response(JSON.stringify({ 
            error: 'Failed to create WhatsApp connection',
            details: error.message 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          })
        }
      }

      case 'connection-status': {
        if (req.method !== 'GET') {
          return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 405,
          })
        }

        try {
          // Get instance info from database (prioritize local DB)
          const { data: tokenData, error: selectError } = await supabase
            .from('medico_oauth_tokens')
            .select('instance_id, connection_status')
            .eq('medico_id', medico_id)
            .eq('provider', 'evolution_api')
            .single()

          if (selectError || !tokenData || tokenData.connection_status === 'disconnected') {
            console.log('📭 No active/configured instance found for medico or it\'s disconnected. Returning default status.', medico_id)
            return new Response(JSON.stringify({
              success: true,
              status: tokenData?.connection_status || 'not_configured',
              instanceName: tokenData?.instance_id || null
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            })
          }

          const instanceName = tokenData.instance_id

          // Check current status with EvolutionAPI (only if instance is known and not disconnected)
          console.log(`🔍 Checking status for instance: ${instanceName}`)
          const statusResponse = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
            method: 'GET',
            headers: {
              'apikey': EVOLUTION_API_KEY,
            },
          })

          if (!statusResponse.ok) {
            console.error('❌ EvolutionAPI status check failed:', statusResponse.status)
            // If EvolutionAPI fails, assume disconnected and update DB
            const { error: updateError } = await supabase
            .from('medico_oauth_tokens')
            .update({
              connection_status: 'disconnected',
              updated_at: new Date().toISOString(),
            })
            .eq('medico_id', medico_id)
            .eq('provider', 'evolution_api')

            if (updateError) {
              console.error('❌ Failed to update status to disconnected in database after API failure:', updateError)
            }
            
            return new Response(JSON.stringify({
              success: true,
              status: 'disconnected',
              instanceName,
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            })
          }

          const statusData: EvolutionStatusResponse = await statusResponse.json()
          console.log('📊 Current status:', statusData.state)

          // Update status in database
          const { error: updateError } = await supabase
            .from('medico_oauth_tokens')
            .update({
              connection_status: statusData.state,
              updated_at: new Date().toISOString(),
            })
            .eq('medico_id', medico_id)
            .eq('provider', 'evolution_api')

          if (updateError) {
            console.error('❌ Failed to update status in database:', updateError)
          }

          return new Response(JSON.stringify({
            success: true,
            status: statusData.state,
            instanceName,
            qrcode: statusData.qrcode,
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          })

        } catch (error) {
          console.error('💥 Status check failed:', error)
          return new Response(JSON.stringify({ 
            error: 'Failed to check connection status',
            details: error.message 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          })
        }
      }

      case 'disconnect': {
        if (req.method !== 'DELETE') {
          return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 405,
          })
        }

        try {
          // Get instance info from database
          const { data: tokenData, error: selectError } = await supabase
            .from('medico_oauth_tokens')
            .select('instance_id')
            .eq('medico_id', medico_id)
            .eq('provider', 'evolution_api')
            .single()

          if (selectError || !tokenData) {
            return new Response(JSON.stringify({
              success: true,
              message: 'No instance found to disconnect',
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            })
          }

          const instanceName = tokenData.instance_id

          // Delete instance from EvolutionAPI
          console.log(`🗑️ Deleting instance: ${instanceName}`)
          const deleteResponse = await fetch(`${EVOLUTION_API_URL}/instance/delete/${instanceName}`, {
            method: 'DELETE',
            headers: {
              'apikey': EVOLUTION_API_KEY,
            },
          })

          // Continue even if EvolutionAPI delete fails (instance might already be deleted)
          if (!deleteResponse.ok) {
            console.warn('⚠️ EvolutionAPI delete failed (continuing):', deleteResponse.status)
          } else {
            console.log('✅ Instance deleted from EvolutionAPI')
          }

          // Remove from database
          const { error: deleteError } = await supabase
            .from('medico_oauth_tokens')
            .delete()
            .eq('medico_id', medico_id)
            .eq('provider', 'evolution_api')

          if (deleteError) {
            console.error('❌ Failed to delete from database:', deleteError)
            throw new Error(`Database delete failed: ${deleteError.message}`)
          }

          console.log('💾 Instance info removed from database')

          return new Response(JSON.stringify({
            success: true,
            message: 'WhatsApp connection disconnected successfully',
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          })

        } catch (error) {
          console.error('💥 Disconnect operation failed:', error)
          return new Response(JSON.stringify({ 
            error: 'Failed to disconnect WhatsApp',
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
    console.error('💥 Unexpected error:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}) 