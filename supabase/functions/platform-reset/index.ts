import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, { 
      global: { headers: { Authorization: authHeader } } 
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Usuário não autenticado" }), { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const { confirmation } = await req.json();
    if (confirmation !== "ZERAR") {
      return new Response(JSON.stringify({ error: "Confirmação inválida" }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    console.log(`[platform-reset] Iniciando reset por: ${user.email}`);

    const tables = [
      "content_checklist", "content_comments", "content_scripts", "instagram_references",
      "content_items", "content_ideas", "campaign_creatives", "campaigns",
      "instagram_snapshots", "creative_outputs", "creative_briefs", "generated_images",
      "marketing_assets", "cadence_steps", "cadences", "do_not_contact", "prospects",
      "revenues", "expenses", "cashflow_snapshots", "contract_signatures",
      "contract_addendums", "contract_alerts", "contract_links", "contract_versions",
      "contracts", "proposals", "meeting_notes", "calendar_events", "deadlines",
      "storyboard_scenes", "storyboards"
    ];

    const results: Record<string, string> = {};

    for (const table of tables) {
      try {
        const { error } = await supabaseAdmin.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
        results[table] = error ? `erro: ${error.message}` : "ok";
      } catch {
        results[table] = "ignorado";
      }
    }

    await supabaseAdmin.from("event_logs").insert({
      entity_type: "platform",
      action: "platform_reset",
      actor_id: user.id,
      actor_name: user.email,
      payload: { tables_cleared: results },
    });

    console.log(`[platform-reset] Concluído`);

    return new Response(JSON.stringify({ success: true, message: "Plataforma zerada", results }), { 
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (error) {
    console.error("[platform-reset] Erro:", error);
    return new Response(JSON.stringify({ error: "Erro interno" }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});
