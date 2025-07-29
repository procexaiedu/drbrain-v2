/// <reference lib="deno.ns" />
/// <reference types="https://deno.land/std@0.178.0/http/server.ts" />
/// <reference types="https://esm.sh/@supabase/supabase-js@2.42.0" />

import { serve } from "https://deno.land/std@0.178.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { "x-my-custom-header": "whatsapp-chat" } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const medico_id = user.id;
    const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");
    const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");

    if (!EVOLUTION_API_KEY || !EVOLUTION_API_URL) {
        return new Response(
          JSON.stringify({ error: "Evolution API keys not configured" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

    // GET /conversations
    if (req.url.includes("/conversations")) {
      const { data: conversations, error } = await supabaseClient
        .from("whatsapp_conversations")
        .select("*", { count: "exact" })
        .eq("medico_id", medico_id);

      if (error) {
        console.error("Error fetching conversations:", error);
        return new Response(JSON.stringify({ error: "Failed to fetch conversations" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }

      return new Response(JSON.stringify(conversations), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // GET /messages?conversation_id=...
    if (req.url.includes("/messages")) {
      const url = new URL(req.url);
      const conversationId = url.searchParams.get("conversation_id");

      if (!conversationId) {
        return new Response(JSON.stringify({ error: "conversation_id is required" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      const { data: messages, error } = await supabaseClient
        .from("whatsapp_messages")
        .select("*, whatsapp_conversations(contact_name)") // Fetch contact_name from related conversation
        .eq("conversation_id", conversationId)
        .eq("medico_id", medico_id) // Ensure RLS is respected implicitly
        .order("sent_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        return new Response(JSON.stringify({ error: "Failed to fetch messages" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }

      return new Response(JSON.stringify(messages), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // POST /send-message
    if (req.url.includes("/send-message") && req.method === "POST") {
      const { conversation_id, message_content, contact_jid } = await req.json();

      if (!conversation_id || !message_content || !contact_jid) {
        return new Response(
          JSON.stringify({ error: "conversation_id, message_content, and contact_jid are required" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      // Get instanceName from medico_oauth_tokens
      const { data: tokenData, error: tokenError } = await supabaseClient
        .from("medico_oauth_tokens")
        .select("instance_name")
        .eq("medico_id", medico_id)
        .eq("provider", "evolution_api")
        .single();

      if (tokenError || !tokenData?.instance_name) {
        console.error("Error fetching instance name for sending message:", tokenError);
        return new Response(
          JSON.stringify({ error: "No active Evolution API instance found for this user." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
        );
      }

      const instanceToSendFrom = tokenData.instance_name;

      // Send message via Evolution API
      const sendMessageRes = await fetch(
        `${EVOLUTION_API_URL}/message/sendText/${instanceToSendFrom}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": EVOLUTION_API_KEY,
          },
          body: JSON.stringify({
            number: contact_jid,
            options: { delay: 1200 }, // Optional delay
            textMessage: { text: message_content },
          }),
        }
      );

      if (!sendMessageRes.ok) {
        const errorData = await sendMessageRes.json();
        console.error("Error sending message via Evolution API:", errorData);
        return new Response(
          JSON.stringify({ error: "Failed to send message via Evolution API", details: errorData }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: sendMessageRes.status }
        );
      }

      // Persist sent message to Supabase
      const { error: insertError } = await supabaseClient.from("whatsapp_messages").insert({
        conversation_id,
        medico_id,
        message_content,
        message_type: "text",
        sent_by: "medico",
        sent_at: new Date().toISOString(),
        // message_api_id can be added if Evolution API returns one consistently
      });

      if (insertError) {
        console.error("Error saving sent message to Supabase:", insertError);
        return new Response(
          JSON.stringify({ error: "Message sent but failed to save to history." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      return new Response(
        JSON.stringify({ message: "Message sent successfully." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    return new Response(JSON.stringify({ error: "Not Found" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 404,
    });
  } catch (error) {
    console.error("Unhandled error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
}); 