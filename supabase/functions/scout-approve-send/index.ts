import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    const { opportunity_id, message_id, audio_asset_id, client_request_id } = await req.json();
    if (!opportunity_id || !client_request_id) {
      return new Response(JSON.stringify({ error: "opportunity_id e client_request_id obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch opportunity
    const { data: opp, error: oppErr } = await supabase
      .from("scout_opportunities")
      .select("*")
      .eq("id", opportunity_id)
      .single();

    if (oppErr || !opp) {
      return new Response(JSON.stringify({ error: "Oportunidade não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate phone
    if (!opp.contact_phone_e164) {
      return new Response(JSON.stringify({ error: "Telefone do contato não informado" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let phone = opp.contact_phone_e164.replace(/[^+\\d]/g, "");
    if (!phone.startsWith("+")) phone = "+55" + phone;

    // Check idempotency
    const { data: existing } = await supabase
      .from("whatsapp_outbox")
      .select("id, status")
      .eq("client_request_id", client_request_id)
      .eq("workspace_id", opp.workspace_id)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ 
        success: true, 
        already_queued: true, 
        outbox_id: existing.id,
        status: existing.status 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get active message
    const { data: msg } = await supabase
      .from("scout_messages")
      .select("*")
      .eq("id", message_id || "")
      .maybeSingle();

    // Get audio asset URL if available
    let audioUrl: string | null = null;
    if (audio_asset_id) {
      const { data: audioAsset } = await supabase
        .from("scout_audio_assets")
        .select("storage_path")
        .eq("id", audio_asset_id)
        .single();

      if (audioAsset) {
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const adminClient = createClient(supabaseUrl, serviceKey);
        const { data: signedData } = await adminClient.storage
          .from("scout-audio")
          .createSignedUrl(audioAsset.storage_path, 3600); // 1h expiry
        audioUrl = signedData?.signedUrl || null;
      }
    }

    // Build payload
    const payload = {
      recipient_name: opp.contact_name || opp.company_name,
      recipient_phone: phone,
      message_text: msg?.text_message || "",
      audio_url: audioUrl,
      company_name: opp.company_name,
      source: "agent_scout",
    };

    // Insert into outbox
    const { data: outboxItem, error: outboxErr } = await supabase
      .from("whatsapp_outbox")
      .insert({
        workspace_id: opp.workspace_id,
        user_id: userId,
        opportunity_id,
        message_id: message_id || null,
        audio_asset_id: audio_asset_id || null,
        to_phone_e164: phone,
        payload,
        client_request_id,
        status: "QUEUED",
      })
      .select()
      .single();

    if (outboxErr) {
      console.error("Outbox insert error:", outboxErr);
      return new Response(JSON.stringify({ error: "Erro ao enfileirar envio" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update opportunity status
    await supabase
      .from("scout_opportunities")
      .update({ status: "SENDING" })
      .eq("id", opportunity_id);

    // Try to send via n8n immediately
    const n8nWebhookUrl = Deno.env.get("N8N_WHATSAPP_WEBHOOK_URL");
    if (n8nWebhookUrl) {
      try {
        const n8nResponse = await fetch(n8nWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            outbox_id: outboxItem.id,
            idempotency_key: client_request_id,
          }),
        });

        if (n8nResponse.ok) {
          let n8nExecutionId = null;
          try {
            const n8nBody = await n8nResponse.json();
            n8nExecutionId = n8nBody?.executionId || n8nBody?.execution_id || null;
          } catch { /* n8n may not return JSON */ }

          await supabase
            .from("whatsapp_outbox")
            .update({
              status: "SENT",
              sent_at: new Date().toISOString(),
              provider_message_id: n8nExecutionId,
              attempts: 1,
            })
            .eq("id", outboxItem.id);

          await supabase
            .from("scout_opportunities")
            .update({ status: "SENT" })
            .eq("id", opportunity_id);

          return new Response(JSON.stringify({ 
            success: true, 
            status: "SENT",
            outbox_id: outboxItem.id 
          }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          const errText = await n8nResponse.text();
          await supabase
            .from("whatsapp_outbox")
            .update({
              status: "FAILED",
              error_message: `n8n ${n8nResponse.status}: ${errText.substring(0, 200)}`,
              attempts: 1,
              next_retry_at: new Date(Date.now() + 60000).toISOString(),
            })
            .eq("id", outboxItem.id);

          await supabase
            .from("scout_opportunities")
            .update({ status: "FAILED" })
            .eq("id", opportunity_id);

          return new Response(JSON.stringify({ 
            success: false, 
            status: "FAILED",
            error: `Falha no envio (${n8nResponse.status})`,
            outbox_id: outboxItem.id 
          }), {
            status: 200, // Return 200 since the outbox was created
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch (sendErr) {
        console.error("Send error:", sendErr);
        await supabase
          .from("whatsapp_outbox")
          .update({
            status: "FAILED",
            error_message: sendErr instanceof Error ? sendErr.message : "Erro desconhecido",
            attempts: 1,
          })
          .eq("id", outboxItem.id);
      }
    } else {
      // No n8n webhook configured - keep as QUEUED
      console.warn("N8N_WHATSAPP_WEBHOOK_URL not configured, message queued but not sent");
    }

    return new Response(JSON.stringify({ 
      success: true, 
      status: outboxItem.status,
      outbox_id: outboxItem.id 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("scout-approve-send error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
