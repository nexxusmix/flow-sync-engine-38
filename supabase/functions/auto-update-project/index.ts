import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    // Validate user
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claimsData.claims.sub;

    // Service client for writes
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { project_id } = await req.json();
    if (!project_id) {
      return new Response(JSON.stringify({ error: "project_id é obrigatório" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const actions: { action: string; status: "ok" | "skipped" | "error"; detail?: string }[] = [];

    // --- Read project state in parallel ---
    const [projectRes, tasksRes, contractRes, revenuesRes, eventsRes] = await Promise.all([
      adminClient.from("projects").select("*").eq("id", project_id).single(),
      adminClient.from("tasks").select("id, title, status").eq("user_id", userId).limit(5),
      adminClient.from("contracts").select("id, status").eq("project_id", project_id).limit(1),
      adminClient.from("revenues").select("id, status, amount, due_date").eq("project_id", project_id).limit(20),
      adminClient.from("calendar_events").select("id, title, event_type, start_at").eq("project_id", project_id)
        .gte("start_at", new Date().toISOString()).limit(10),
    ]);

    const project = projectRes.data;
    if (!project) {
      return new Response(JSON.stringify({ error: "Projeto não encontrado" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const hasContract = (contractRes.data?.length ?? 0) > 0;
    const hasTasks = (tasksRes.data?.length ?? 0) > 0;
    const hasDeliveryEvent = (eventsRes.data ?? []).some(
      (e) => e.event_type === "delivery" || e.event_type === "entrega"
    );
    const contractValue = project.contract_value ?? 0;

    // --- Action 1: Sync finances if contract_value > 0 ---
    if (contractValue > 0) {
      try {
        const syncRes = await fetch(`${supabaseUrl}/functions/v1/sync-project-finances`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            "Content-Type": "application/json",
            apikey: anonKey,
          },
          body: JSON.stringify({ project_id, force_regenerate: !hasContract }),
        });
        const syncData = await syncRes.json();
        if (!syncRes.ok && syncData?.error) {
          actions.push({ action: "Sincronizar financeiro", status: "error", detail: syncData.error });
        } else {
          actions.push({ action: "Financeiro sincronizado", status: "ok", detail: syncData?.message });
        }
      } catch (e: any) {
        actions.push({ action: "Sincronizar financeiro", status: "error", detail: e.message });
      }
    } else {
      actions.push({ action: "Sincronizar financeiro", status: "skipped", detail: "Valor do contrato não definido" });
    }

    // --- Action 2: Generate tasks via AI if no tasks exist ---
    if (!hasTasks) {
      try {
        const systemPrompt = `Você é um assistente de gestão de projetos criativos. Gere tarefas práticas e objetivas para o projeto descrito.`;
        const userPrompt = `Projeto: "${project.name}"
Tipo: ${project.template || "Projeto criativo"}
Etapa atual: ${project.stage_current || "inicial"}
Cliente: ${project.client_name || "não informado"}
Descrição: ${project.description || "sem descrição"}

Gere entre 3 e 5 tarefas essenciais para avançar este projeto. Responda SOMENTE com JSON válido.`;

        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "create_tasks",
                  description: "Cria tarefas para o projeto",
                  parameters: {
                    type: "object",
                    properties: {
                      tasks: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            title: { type: "string" },
                            description: { type: "string" },
                            category: { type: "string", enum: ["pessoal", "operacao", "projeto"] },
                            status: { type: "string", enum: ["backlog", "week", "today"] },
                          },
                          required: ["title", "category", "status"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["tasks"],
                    additionalProperties: false,
                  },
                },
              },
            ],
            tool_choice: { type: "function", function: { name: "create_tasks" } },
          }),
        });

        const aiData = await aiRes.json();
        const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall) {
          const parsed = JSON.parse(toolCall.function.arguments);
          const generatedTasks = parsed?.tasks ?? [];

          if (generatedTasks.length > 0) {
            const taskRows = generatedTasks.map((t: any) => ({
              user_id: userId,
              title: t.title,
              description: t.description || null,
              category: t.category || "projeto",
              status: t.status || "backlog",
              tags: [],
              position: 0,
            }));

            const { error: insertError } = await adminClient.from("tasks").insert(taskRows);
            if (insertError) {
              actions.push({ action: "Gerar tarefas com IA", status: "error", detail: insertError.message });
            } else {
              actions.push({ action: `${generatedTasks.length} tarefas geradas`, status: "ok" });
            }
          } else {
            actions.push({ action: "Gerar tarefas com IA", status: "skipped", detail: "Nenhuma tarefa gerada" });
          }
        } else {
          actions.push({ action: "Gerar tarefas com IA", status: "error", detail: "Resposta da IA inválida" });
        }
      } catch (e: any) {
        actions.push({ action: "Gerar tarefas com IA", status: "error", detail: e.message });
      }
    } else {
      actions.push({ action: "Gerar tarefas com IA", status: "skipped", detail: "Projeto já possui tarefas" });
    }

    // --- Action 3: Create delivery calendar event if due_date exists and no delivery event ---
    if (project.due_date && !hasDeliveryEvent) {
      try {
        const dueDate = new Date(project.due_date);
        const endDate = new Date(dueDate);
        endDate.setHours(dueDate.getHours() + 2);

        const { error: eventError } = await adminClient.from("calendar_events").insert({
          project_id,
          workspace_id: project.workspace_id,
          owner_user_id: userId,
          title: `Entrega: ${project.name}`,
          description: `Data de entrega do projeto ${project.name} para ${project.client_name || "cliente"}`,
          start_at: dueDate.toISOString(),
          end_at: endDate.toISOString(),
          event_type: "delivery",
          provider: "local",
          color: "#10b981",
        });

        if (eventError) {
          actions.push({ action: "Agendar entrega no calendário", status: "error", detail: eventError.message });
        } else {
          actions.push({ action: "Entrega agendada no calendário", status: "ok" });
        }
      } catch (e: any) {
        actions.push({ action: "Agendar entrega no calendário", status: "error", detail: e.message });
      }
    } else if (!project.due_date) {
      actions.push({ action: "Agendar entrega no calendário", status: "skipped", detail: "Data de entrega não definida" });
    } else {
      actions.push({ action: "Agendar entrega no calendário", status: "skipped", detail: "Evento de entrega já existe" });
    }

    const successCount = actions.filter((a) => a.status === "ok").length;
    const errorCount = actions.filter((a) => a.status === "error").length;
    const skippedCount = actions.filter((a) => a.status === "skipped").length;

    const summary =
      successCount > 0
        ? `✓ ${successCount} ação${successCount > 1 ? "ões" : ""} executada${successCount > 1 ? "s" : ""}${errorCount > 0 ? `, ${errorCount} com erro` : ""}${skippedCount > 0 ? `, ${skippedCount} ignorada${skippedCount > 1 ? "s" : ""}` : ""}`
        : errorCount > 0
        ? `${errorCount} erro${errorCount > 1 ? "s" : ""} encontrado${errorCount > 1 ? "s" : ""}`
        : "Projeto já está atualizado — nenhuma ação necessária";

    return new Response(
      JSON.stringify({ success: true, summary, actions }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("auto-update-project error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
