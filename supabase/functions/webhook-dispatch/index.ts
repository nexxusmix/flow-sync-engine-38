import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { event, payload } = await req.json();

    if (!event || !payload) {
      return new Response(JSON.stringify({ error: "Missing event or payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get active webhooks that subscribe to this event
    const { data: webhooks, error: whError } = await supabase
      .from("webhooks")
      .select("*")
      .eq("is_active", true)
      .contains("events", [event]);

    if (whError) throw whError;
    if (!webhooks || webhooks.length === 0) {
      return new Response(JSON.stringify({ delivered: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = await Promise.allSettled(
      webhooks.map(async (wh: any) => {
        const body = JSON.stringify({
          event,
          timestamp: new Date().toISOString(),
          data: payload,
        });

        // HMAC signature
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          "raw",
          encoder.encode(wh.secret || ""),
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"]
        );
        const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
        const hexSig = Array.from(new Uint8Array(signature))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        try {
          const resp = await fetch(wh.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Webhook-Signature": `sha256=${hexSig}`,
              "X-Webhook-Event": event,
            },
            body,
          });

          const respBody = await resp.text().catch(() => "");
          
          await supabase.from("webhook_deliveries").insert({
            webhook_id: wh.id,
            event,
            payload: { event, data: payload },
            response_status: resp.status,
            response_body: respBody.slice(0, 1000),
            success: resp.ok,
          });

          return { id: wh.id, success: resp.ok, status: resp.status };
        } catch (fetchErr: any) {
          await supabase.from("webhook_deliveries").insert({
            webhook_id: wh.id,
            event,
            payload: { event, data: payload },
            response_status: 0,
            response_body: fetchErr.message,
            success: false,
          });
          return { id: wh.id, success: false, error: fetchErr.message };
        }
      })
    );

    return new Response(
      JSON.stringify({ delivered: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Webhook dispatch error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
