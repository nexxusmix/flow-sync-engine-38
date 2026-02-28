import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { project_id } = await req.json();
    if (!project_id) {
      return new Response(JSON.stringify({ error: "project_id é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const actions: { action: string; status: "ok" | "skipped" | "error"; detail?: string }[] = [];

    // --- Read project state in parallel (tasks now filtered by project_id) ---
    const [projectRes, tasksRes, contractRes, eventsRes] = await Promise.all([
      adminClient.from("projects").select("*").eq("id", project_id).single(),
      adminClient.from("tasks").select("id").eq("project_id", project_id).limit(1),
      adminClient.from("contracts").select("id, status, total_value").eq("project_id", project_id).limit(1),
      adminClient
        .from("calendar_events")
        .select("id, event_type")
        .eq("project_id", project_id)
        .gte("start_at", new Date().toISOString())
        .limit(10),
    ]);

    const project = projectRes.data;
    if (!project) {
      return new Response(JSON.stringify({ error: "Projeto não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const hasContract = (contractRes.data?.length ?? 0) > 0;
    const hasTasks = (tasksRes.data?.length ?? 0) > 0;
    const hasDeliveryEvent = (eventsRes.data ?? []).some(
      (e) => e.event_type === "delivery" || e.event_type === "entrega"
    );
    const contractValue = Number(project.contract_value) ?? 0;

    // --- Action 1: Sync finances ---
    if (contractValue > 0) {
      try {
        const forceRegenerate = !hasContract;

        const { data: existingContracts } = await adminClient
          .from("contracts")
          .select("*")
          .eq("project_id", project_id)
          .order("created_at", { ascending: false })
          .limit(1);

        let contract = existingContracts?.[0] || null;
        let contractCreated = false;

        if (!contract) {
          let paymentTerms = "50% na assinatura + 50% na entrega";
          try {
            const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: { Authorization: `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash-lite",
                messages: [{
                  role: "user",
                  content: `Retorne APENAS uma string curta com condições de pagamento para uma produtora audiovisual brasileira, tipo de projeto: ${project.template || "audiovisual"}, valor: R$ ${contractValue}. Exemplo: "50% na assinatura + 50% na entrega". Só o texto, sem explicações.`,
                }],
                max_tokens: 60,
              }),
            });
            if (aiRes.ok) {
              const aiData = await aiRes.json();
              const generated = aiData.choices?.[0]?.message?.content?.trim();
              if (generated) paymentTerms = generated;
            }
          } catch { /* fallback */ }

          const { data: newContract, error: createErr } = await adminClient
            .from("contracts")
            .insert({
              project_id,
              project_name: project.name,
              client_name: project.client_name || null,
              total_value: contractValue,
              payment_terms: paymentTerms,
              status: "active",
              start_date: project.start_date || new Date().toISOString().split("T")[0],
              end_date: project.due_date || null,
            })
            .select()
            .single();

          if (createErr || !newContract) {
            actions.push({ action: "Sincronizar financeiro", status: "error", detail: createErr?.message });
          } else {
            contract = newContract;
            contractCreated = true;
          }
        }

        if (contract) {
          const { data: existingRevenues } = await adminClient
            .from("revenues")
            .select("id")
            .eq("contract_id", contract.id);

          const hasRevenues = (existingRevenues?.length || 0) > 0;

          if (hasRevenues && !forceRegenerate) {
            actions.push({
              action: contractCreated ? "Contrato criado" : "Financeiro sincronizado",
              status: "ok",
              detail: `${existingRevenues?.length} parcela(s) existente(s)`,
            });
          } else {
            if (hasRevenues && forceRegenerate) {
              await adminClient.from("revenues").delete().eq("contract_id", contract.id);
            }

            const startDate = project.start_date || new Date().toISOString().split("T")[0];
            const terms = contract.payment_terms?.toLowerCase().trim() || "";
            const milestones: { description: string; amount: number; due_date: string }[] = [];

            const entradaMatch = terms.match(/entrada\s*\+\s*(\d+)\s*parcela/);
            if (entradaMatch) {
              const n = parseInt(entradaMatch[1]);
              const perInstallment = Math.round((contractValue / (n + 1)) * 100) / 100;
              milestones.push({ description: `Entrada (1/${n + 1})`, amount: contractValue - perInstallment * n, due_date: startDate });
              for (let i = 1; i <= n; i++) {
                const d = new Date(startDate); d.setMonth(d.getMonth() + i);
                milestones.push({ description: `Parcela ${i + 1}/${n + 1}`, amount: perInstallment, due_date: d.toISOString().split("T")[0] });
              }
            } else {
              const half = Math.round((contractValue / 2) * 100) / 100;
              const d2 = new Date(startDate); d2.setDate(d2.getDate() + 30);
              milestones.push({ description: "Entrada na assinatura (50%)", amount: half, due_date: startDate });
              milestones.push({ description: "Parcela final na entrega (50%)", amount: contractValue - half, due_date: d2.toISOString().split("T")[0] });
            }

            const revenueRows = milestones.map((m) => ({
              project_id,
              contract_id: contract!.id,
              description: `${project.name} — ${m.description}`,
              amount: m.amount,
              due_date: m.due_date,
              status: "pending",
              installment_group_id: contract!.id,
              notes: "Gerado automaticamente via Atualizar Projeto",
              created_by: userId,
            }));

            const { data: inserted, error: insertErr } = await adminClient.from("revenues").insert(revenueRows).select();
            if (insertErr) {
              actions.push({ action: "Sincronizar financeiro", status: "error", detail: insertErr.message });
            } else {
              actions.push({
                action: contractCreated ? "Contrato criado + parcelas geradas" : "Parcelas regeneradas",
                status: "ok",
                detail: `${inserted?.length} parcela(s) • ${contract.payment_terms}`,
              });
            }
          }
        }
      } catch (e: any) {
        actions.push({ action: "Sincronizar financeiro", status: "error", detail: e.message });
      }
    } else {
      actions.push({ action: "Sincronizar financeiro", status: "skipped", detail: "Valor do contrato não definido" });
    }

    // --- Action 2: Generate tasks via AI if no tasks for this project ---
    if (!hasTasks) {
      try {
        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              {
                role: "system",
                content: "Você é um assistente de gestão de projetos criativos. Gere tarefas práticas para o projeto descrito.",
              },
              {
                role: "user",
                content: `Projeto: "${project.name}", Tipo: ${project.template || "Projeto criativo"}, Etapa: ${project.stage_current || "inicial"}, Cliente: ${project.client_name || "não informado"}. Gere entre 3 e 5 tarefas essenciais. Responda SOMENTE com JSON válido.`,
              },
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
              project_id,
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
      // --- Action 3b: Suggest due_date via AI if not set ---
      try {
        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [{
              role: "user",
              content: `Projeto audiovisual: "${project.name}", tipo: ${project.template || "projeto criativo"}, início: ${project.start_date || "hoje"}, valor: R$ ${contractValue}. Sugira uma data de entrega razoável em formato YYYY-MM-DD. Responda SOMENTE com a data, nada mais.`,
            }],
            max_tokens: 20,
          }),
        });
        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const suggestedDate = aiData.choices?.[0]?.message?.content?.trim();
          if (suggestedDate && /^\d{4}-\d{2}-\d{2}$/.test(suggestedDate)) {
            const { error: updateErr } = await adminClient
              .from("projects")
              .update({ due_date: suggestedDate })
              .eq("id", project_id);
            if (!updateErr) {
              actions.push({ action: "Data de entrega sugerida pela IA", status: "ok", detail: suggestedDate });

              // Also create the delivery event
              const dueDate = new Date(suggestedDate);
              const endDate = new Date(dueDate);
              endDate.setHours(dueDate.getHours() + 2);
              await adminClient.from("calendar_events").insert({
                project_id,
                workspace_id: project.workspace_id,
                owner_user_id: userId,
                title: `Entrega: ${project.name}`,
                description: `Data sugerida pela IA para ${project.client_name || "cliente"}`,
                start_at: dueDate.toISOString(),
                end_at: endDate.toISOString(),
                event_type: "delivery",
                provider: "local",
                color: "#10b981",
              });
            } else {
              actions.push({ action: "Sugerir data de entrega", status: "error", detail: updateErr.message });
            }
          } else {
            actions.push({ action: "Sugerir data de entrega", status: "skipped", detail: "IA não retornou data válida" });
          }
        } else {
          actions.push({ action: "Sugerir data de entrega", status: "skipped", detail: "Erro na chamada IA" });
        }
      } catch (e: any) {
        actions.push({ action: "Sugerir data de entrega", status: "error", detail: e.message });
      }
    } else {
      actions.push({ action: "Agendar entrega", status: "skipped", detail: "Evento de entrega já existe" });
    }

    // --- Action 4: Refresh health_score ---
    try {
      const { data: healthData } = await adminClient.rpc("calculate_project_health_score", {
        p_project_id: project_id,
      });
      const newScore = typeof healthData === "number" ? healthData : null;
      if (newScore !== null && newScore !== project.health_score) {
        await adminClient
          .from("projects")
          .update({ health_score: newScore })
          .eq("id", project_id);
        actions.push({ action: "Saúde do projeto atualizada", status: "ok", detail: `${project.health_score ?? '?'}% → ${newScore}%` });
      } else {
        actions.push({ action: "Saúde do projeto", status: "skipped", detail: `Score atual: ${newScore ?? project.health_score ?? 0}%` });
      }
    } catch (e: any) {
      actions.push({ action: "Atualizar saúde do projeto", status: "error", detail: e.message });
    }

    const successCount = actions.filter((a) => a.status === "ok").length;
    const errorCount = actions.filter((a) => a.status === "error").length;
    const skippedCount = actions.filter((a) => a.status === "skipped").length;

    const successLabels = actions.filter((a) => a.status === "ok").map((a) => a.action).join(", ");

    const summary =
      successCount > 0
        ? `✓ ${successLabels}${errorCount > 0 ? ` • ${errorCount} erro(s)` : ""}${skippedCount > 0 ? ` • ${skippedCount} ignorada(s)` : ""}`
        : errorCount > 0
        ? `${errorCount} erro(s) encontrado(s). Verifique as configurações do projeto.`
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
