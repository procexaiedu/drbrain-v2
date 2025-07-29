/// <reference lib="deno.ns" />
/// <reference types="https://deno.land/std@0.178.0/http/server.ts" />
/// <reference types="https://esm.sh/@supabase/supabase-js@2.42.0" />

import { serve } from "https://deno.land/std@0.178.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";
import { corsHeaders } from "../_shared/cors.ts";

interface WebhookConfigPayload {
  enabled: boolean;
  url: string;
  webhook_by_events: boolean;
  webhook_base64: boolean;
  events: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { "x-my-custom-header": "evolution-manager" } } }
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

    const instanceName = `drbrain_${medico_id}`;

    if (req.url.endsWith("/connect")) {
      // 1. Chamar POST /instance/create na Evolution API
      const createInstanceRes = await fetch(
        `${EVOLUTION_API_URL}/instance/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": EVOLUTION_API_KEY,
          },
          body: JSON.stringify({
            instanceName: instanceName,
            qrcode: true,
          }),
        }
      );

      if (!createInstanceRes.ok) {
        const errorData = await createInstanceRes.json();
        console.error("Error creating instance:", errorData);
        return new Response(
          JSON.stringify({ error: "Failed to create instance", details: errorData }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: createInstanceRes.status }
        );
      }
      const createInstanceData = await createInstanceRes.json();

      // 2. Armazenar instanceName e connection_status no Supabase
      const { data, error } = await supabaseClient
        .from("medico_oauth_tokens")
        .upsert(
          {
            medico_id: medico_id,
            provider: "evolution_api",
            instance_name: instanceName,
            connection_status: "connecting",
            access_token: "", // Evolution API doesn't use standard OAuth tokens here, so leaving empty
          },
          { onConflict: "medico_id,provider" }
        )
        .select();

      if (error) {
        console.error("Error saving token data to Supabase:", error);
        return new Response(
          JSON.stringify({ error: "Failed to save connection data" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      // 3. Chamar POST /settings/set/{instanceName} para configurar o webhook
      const webhookConfigPayload: WebhookConfigPayload = {
        enabled: true,
        url: "https://webh.procexai.tech/webhook/drBrainCentral",
        webhook_by_events: false,
        webhook_base64: false,
        events: [
          "QRCODE_UPDATED",
          "CONNECTION_UPDATE",
          "MESSAGES_UPSERT",
        ],
      };

      const setWebhookRes = await fetch(
        `${EVOLUTION_API_URL}/settings/set/${instanceName}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": EVOLUTION_API_KEY,
          },
          body: JSON.stringify(webhookConfigPayload),
        }
      );

      if (!setWebhookRes.ok) {
        const errorData = await setWebhookRes.json();
        console.error("Error setting webhook:", errorData);
        // Even if webhook setting fails, we return success for instance creation and data saving
        // as webhook can be configured manually or reattempted later.
        return new Response(
            JSON.stringify({ message: "Instance created and data saved, but webhook configuration failed.", webhook_error: errorData }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
          );
      }

      return new Response(
        JSON.stringify({ message: "WhatsApp connection initiated successfully.", data: createInstanceData }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    if (req.url.endsWith("/connection-status")) {
      const { data: tokenData, error: tokenError } = await supabaseClient
        .from("medico_oauth_tokens")
        .select("instance_name")
        .eq("medico_id", medico_id)
        .eq("provider", "evolution_api")
        .single();

      if (tokenError || !tokenData?.instance_name) {
        console.error("Error fetching instance name:", tokenError);
        return new Response(
          JSON.stringify({ status: "disconnected", message: "No active Evolution API instance found." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      const connectionStateRes = await fetch(
        `${EVOLUTION_API_URL}/instance/connectionState/${tokenData.instance_name}`,
        {
          headers: {
            "apikey": EVOLUTION_API_KEY,
          },
        }
      );

      if (!connectionStateRes.ok) {
        const errorData = await connectionStateRes.json();
        console.error("Error fetching connection state:", errorData);
        return new Response(
          JSON.stringify({ error: "Failed to fetch connection status", details: errorData }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: connectionStateRes.status }
        );
      }

      const connectionStateData = await connectionStateRes.json();
      return new Response(
        JSON.stringify({ status: connectionStateData.state || "unknown", message: connectionStateData.message || "" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    if (req.url.endsWith("/disconnect")) {
        const { data: tokenData, error: tokenError } = await supabaseClient
            .from("medico_oauth_tokens")
            .select("instance_name")
            .eq("medico_id", medico_id)
            .eq("provider", "evolution_api")
            .single();
    
        if (tokenError || !tokenData?.instance_name) {
            console.error("Error fetching instance name for disconnect:", tokenError);
            return new Response(
              JSON.stringify({ message: "No active Evolution API instance found for this user." }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
            );
        }
    
        const instanceToDisconnect = tokenData.instance_name;
    
        // Attempt to logout (recommended by Evolution API for graceful disconnection)
        const logoutRes = await fetch(
            `${EVOLUTION_API_URL}/instance/logout/${instanceToDisconnect}`,
            {
                method: "DELETE",
                headers: {
                    "apikey": EVOLUTION_API_KEY,
                },
            }
        );
    
        if (!logoutRes.ok && logoutRes.status !== 404) { // 404 might mean already logged out/deleted
            console.warn(`Warning: Logout for instance ${instanceToDisconnect} failed or returned unexpected status ${logoutRes.status}. Attempting delete.`);
            // Optionally, log errorData here if needed
        } else if (logoutRes.ok) {
            console.log(`Successfully logged out instance: ${instanceToDisconnect}`);
        }
    
        // Attempt to delete instance (ensures clean slate)
        const deleteRes = await fetch(
            `${EVOLUTION_API_URL}/instance/delete/${instanceToDisconnect}`,
            {
                method: "DELETE",
                headers: {
                    "apikey": EVOLUTION_API_KEY,
                },
            }
        );
    
        if (!deleteRes.ok && deleteRes.status !== 404) {
            const errorData = await deleteRes.json();
            console.error("Error deleting instance:", errorData);
            return new Response(
                JSON.stringify({ error: "Failed to fully disconnect Evolution API instance", details: errorData }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: deleteRes.status }
            );
        }
    
        // Update Supabase to reflect disconnected status
        const { error: updateError } = await supabaseClient
            .from("medico_oauth_tokens")
            .update({ connection_status: "disconnected", instance_name: null }) // Clear instance_name as well
            .eq("medico_id", medico_id)
            .eq("provider", "evolution_api");
    
        if (updateError) {
            console.error("Error updating Supabase connection status:", updateError);
            return new Response(
                JSON.stringify({ error: "Failed to update Supabase connection status" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
            );
        }
    
        return new Response(
            JSON.stringify({ message: "Disconnected from WhatsApp successfully." }),
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