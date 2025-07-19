import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsHeaders } from '../_shared/cors.ts';

const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL');
const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY');
const N8N_WEBHOOK_URL = Deno.env.get('N8N_SECRETARIA_IA_WEBHOOK_URL');

async function handleConnect(medico_id: string) {
    const instanceName = `dr_${medico_id.replace(/-/g, '')}`;
    const { data: existingInstance } = await supabaseAdmin
        .from('whatsapp_instances')
        .select('*')
        .eq('medico_id', medico_id)
        .single();

    if (existingInstance) {
        return new Response(JSON.stringify({ message: 'Instance already exists.', instance: existingInstance }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }

    const response = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': EVOLUTION_API_KEY,
        },
        body: JSON.stringify({
            instanceName: instanceName,
            qrcode: true,
            integration: "WHATSAPP-BAILEYS",
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        return new Response(JSON.stringify({ error: 'Failed to create instance', details: data }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: response.status,
        });
    }

    const { data: newInstance, error } = await supabaseAdmin
        .from('whatsapp_instances')
        .insert({
            medico_id,
            instance_name: data.instance.instanceName,
            instance_token: data.token,
            status: 'connecting',
        })
        .select()
        .single();

    if (error) {
        return new Response(JSON.stringify({ error: 'Failed to save instance', details: error }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }

    return new Response(JSON.stringify(newInstance), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
    });
}

async function handleStatus(medico_id: string) {
    const { data: instance, error } = await supabaseAdmin
        .from('whatsapp_instances')
        .select('instance_name, status')
        .eq('medico_id', medico_id)
        .single();

    if (error || !instance) {
        return new Response(JSON.stringify({ error: 'Instance not found' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404,
        });
    }

    return new Response(JSON.stringify({ status: instance.status }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
    });
}

async function handleSendMessage(medico_id: string, req: Request) {
    const { recipient_jid, message_body } = await req.json();

    const { data: instance, error } = await supabaseAdmin
        .from('whatsapp_instances')
        .select('instance_name')
        .eq('medico_id', medico_id)
        .single();

    if (error || !instance) {
        return new Response(JSON.stringify({ error: 'Instance not found' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404,
        });
    }

    const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instance.instance_name}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': EVOLUTION_API_KEY,
            },
            body: JSON.stringify({
                number: recipient_jid,
                options: { delay: 1200 },
                textMessage: { text: message_body },
            }),
        }
    );

    const data = await response.json();

    if (!response.ok) {
        return new Response(JSON.stringify({ error: 'Failed to send message', details: data }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: response.status,
        });
    }

    return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
    });
}

async function handleWebhook(req: Request, eventName: string) {
    const payload = await req.json();
    const { instance, data } = payload;

    const { data: instanceData, error: instanceError } = await supabaseAdmin
        .from('whatsapp_instances')
        .select('id')
        .eq('instance_name', instance)
        .single();

    if (instanceError || !instanceData) {
        console.error('Webhook Error: Instance not found', instance);
        return new Response(JSON.stringify({ error: 'Instance not found' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404,
        });
    }

    if (eventName === 'messages.upsert') {
        const message = data;
        await supabaseAdmin.from('whatsapp_messages').insert({
            instance_id: instanceData.id,
            message_id_from_api: message.key.id,
            sender_jid: message.key.remoteJid,
            recipient_jid: message.owner,
            content: message.message,
            status: 'received',
            message_timestamp: new Date(message.messageTimestamp * 1000),
            is_from_me: message.key.fromMe,
        });
    } else if (eventName === 'connection.update') {
        await supabaseAdmin
            .from('whatsapp_instances')
            .update({ status: data.state, last_connection_at: new Date() })
            .eq('instance_name', instance);
    } else if (eventName === 'qrcode.updated') {
        await supabaseAdmin
            .from('whatsapp_instances')
            .update({ qrcode_base64: data.qrcode, status: 'qrcode' })
            .eq('instance_name', instance);
    }

    if (N8N_WEBHOOK_URL) {
        fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        }).catch(err => console.error('Error forwarding webhook to n8n:', err));
    }

    return new Response('ok', { headers: corsHeaders });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const action = pathParts.pop() || '';

    const webhookEvents = ['messages.upsert', 'connection.update', 'qrcode.updated'];
    if (webhookEvents.includes(action)) {
      return await handleWebhook(req, action);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header missing' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized', details: userError?.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    const medico_id = user.id;

    switch (action) {
      case 'connect':
        return await handleConnect(medico_id);
      case 'status':
        return await handleStatus(medico_id);
      case 'send-message':
        return await handleSendMessage(medico_id, req);
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
    }
  } catch (error) {
    console.error("Error in whatsapp-manager:", error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});