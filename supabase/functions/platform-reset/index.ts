import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      console.error("[platform-reset] Auth error:", claimsError?.message);
      return new Response(JSON.stringify({ error: "Usuário não autenticado" }), { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const userId = claimsData.claims.sub;
    const userEmail = claimsData.claims.email;

    // Verificar se usuário tem role admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_role_assignments')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      console.log(`[platform-reset] Acesso negado para: ${userEmail} - não é admin`);
      return new Response(JSON.stringify({ error: "Apenas administradores podem executar esta ação" }), { 
        status: 403, 
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

    console.log(`[platform-reset] Iniciando reset por ADMIN: ${userEmail}`);

    // Lista completa de tabelas operacionais para limpeza
    // Ordem importante: tabelas filhas antes das tabelas pai
    const tables = [
      // Projetos (filhas primeiro)
      "project_stages",
      "projects",
      
      // Prospecção (filhas primeiro)
      "prospect_activities",
      "prospect_opportunities",
      "prospect_lists",
      
      // Marketing (filhas primeiro)
      "content_checklist",
      "content_comments", 
      "content_scripts",
      "instagram_references",
      "content_items",
      "content_ideas",
      "campaign_creatives",
      "campaigns",
      "instagram_snapshots",
      "creative_outputs",
      "creative_briefs",
      "generated_images",
      "marketing_assets",
      
      // Prospecção (base)
      "cadence_steps",
      "cadences",
      "do_not_contact",
      "prospects",
      
      // Financeiro
      "revenues",
      "expenses",
      "cashflow_snapshots",
      
      // Contratos (filhas primeiro)
      "contract_signatures",
      "contract_addendums",
      "contract_alerts",
      "contract_links",
      "contract_versions",
      "contracts",
      
      // Propostas
      "proposals",
      
      // Calendário e Deadlines
      "meeting_notes",
      "calendar_events",
      "deadlines",
      
      // Storyboards
      "storyboard_scenes",
      "storyboards",
      
      // Inbox
      "inbox_messages",
      "inbox_threads",
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

    console.log(`[platform-reset] Concluído com sucesso`);

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
