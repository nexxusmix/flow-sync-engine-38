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
    // Auth validation
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

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    // Parse body
    const { scout_output_id } = await req.json();
    if (!scout_output_id) {
      return new Response(JSON.stringify({ error: "scout_output_id é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch scout output
    const { data: output, error: fetchError } = await supabase
      .from("agent_scout_outputs")
      .select("*")
      .eq("id", scout_output_id)
      .eq("user_id", userId)
      .single();

    if (fetchError || !output) {
      return new Response(JSON.stringify({ error: "Output do Scout não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Idempotency: already sent
    if (output.status === "sent") {
      return new Response(JSON.stringify({ success: true, already_sent: true, status: "sent" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate required fields
    if (!output.recipient_phone) {
      await supabase
        .from("agent_scout_outputs")
        .update({ status: "failed", last_error: "Telefone do destinatário ausente" })
        .eq("id", scout_output_id);

      return new Response(
        JSON.stringify({ error: "Telefone do destinatário ausente. Adicione o telefone antes de enviar." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize phone to E.164 if needed
    let phone = output.recipient_phone.replace(/[^+\d]/g, "");
    if (!phone.startsWith("+")) {
      // Assume Brazil if no country code
      phone = "+55" + phone;
    }

    // Mark as approved
    await supabase
      .from("agent_scout_outputs")
      .update({ status: "approved", approved_at: new Date().toISOString() })
      .eq("id", scout_output_id);

    // Send to n8n
    const n8nWebhookUrl = Deno.env.get("N8N_WHATSAPP_WEBHOOK_URL");
    if (!n8nWebhookUrl) {
      await supabase
        .from("agent_scout_outputs")
        .update({ status: "failed", last_error: "Webhook do n8n não configurado" })
        .eq("id", scout_output_id);

      return new Response(
        JSON.stringify({ error: "Webhook do n8n não configurado. Adicione N8N_WHATSAPP_WEBHOOK_URL nos secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = {
      workspace_id: output.workspace_id,
      user_id: userId,
      conversation_id: output.conversation_id,
      recipient_name: output.recipient_name,
      recipient_phone: phone,
      audio_url: output.audio_url,
      message_text: output.message_text,
      source: "agent_scout",
      idempotency_key: output.idempotency_key,
    };

    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      await supabase
        .from("agent_scout_outputs")
        .update({
          status: "failed",
          last_error: `n8n retornou ${n8nResponse.status}: ${errorText.substring(0, 200)}`,
        })
        .eq("id", scout_output_id);

      return new Response(
        JSON.stringify({ error: `Falha ao enviar para n8n (${n8nResponse.status})` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse n8n response for execution ID
    let n8nExecutionId = null;
    try {
      const n8nBody = await n8nResponse.json();
      n8nExecutionId = n8nBody?.executionId || n8nBody?.execution_id || null;
    } catch {
      // n8n may not return JSON
    }

    // Mark as sent
    await supabase
      .from("agent_scout_outputs")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        n8n_execution_id: n8nExecutionId,
        last_error: null,
      })
      .eq("id", scout_output_id);

    return new Response(
      JSON.stringify({ success: true, status: "sent", n8n_execution_id: n8nExecutionId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("agent-approve-whatsapp-send error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno ao processar aprovação" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
