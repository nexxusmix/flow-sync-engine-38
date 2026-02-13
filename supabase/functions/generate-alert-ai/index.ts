import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { projectName, clientName, dueDate, stageCurrent, healthScore, selectedItems, userNote } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Build context string from selected items
    const contextParts: string[] = [];

    if (projectName) contextParts.push(`Projeto: ${projectName}`);
    if (clientName) contextParts.push(`Cliente: ${clientName}`);
    if (dueDate) contextParts.push(`Prazo: ${dueDate}`);
    if (stageCurrent) contextParts.push(`Etapa atual: ${stageCurrent}`);
    if (healthScore !== undefined && healthScore !== null) contextParts.push(`Saúde: ${healthScore}%`);

    if (selectedItems?.deliverables?.length) {
      contextParts.push(`\nEntregas pendentes:\n${selectedItems.deliverables.map((d: any) => `- ${d.title || d.file_name} (status: ${d.status})`).join("\n")}`);
    }
    if (selectedItems?.meetings?.length) {
      contextParts.push(`\nReuniões:\n${selectedItems.meetings.map((m: any) => `- ${m.title} em ${m.start_at}`).join("\n")}`);
    }
    if (selectedItems?.revenues?.length) {
      contextParts.push(`\nReceitas:\n${selectedItems.revenues.map((r: any) => `- R$${r.amount} vence ${r.due_date} (${r.status})`).join("\n")}`);
    }
    if (selectedItems?.revisions?.length) {
      contextParts.push(`\nRevisões pendentes:\n${selectedItems.revisions.map((r: any) => `- ${r.description || "Revisão"} (${r.status})`).join("\n")}`);
    }
    if (selectedItems?.includeScope && selectedItems?.scopeText) {
      contextParts.push(`\nEscopo/Descrição: ${selectedItems.scopeText}`);
    }
    if (userNote) {
      contextParts.push(`\nNota do usuário: ${userNote}`);
    }

    const contextText = contextParts.join("\n");

    const validTypes = [
      "deadline_due", "deadline_overdue", "delivery_due", "delivery_overdue",
      "no_client_contact", "client_waiting_reply", "internal_waiting_reply",
      "meeting_upcoming", "meeting_followup", "payment_due", "payment_overdue",
      "production_stalled", "risk_health_drop", "materials_missing",
      "review_pending", "custom_reminder"
    ];

    const systemPrompt = `Você é um assistente de gestão de projetos criativos brasileiro.
Analise o contexto do projeto e gere um aviso/alerta inteligente.

REGRAS:
- Título: emoji + frase direta (max 60 chars)
- Mensagem: 1-3 frases contextualizadas, acionáveis
- Tipo: um dos valores: ${validTypes.join(", ")}
- Severidade: "info" (informativo), "warning" (precisa atenção), "critical" (urgente/bloqueante)
- Escolha tipo e severidade baseado na urgência real dos dados
- Se há pagamento vencido > 7d, use "critical"
- Se há prazo vencendo em < 3d, use "warning" ou "critical"
- Se saúde < 50%, use "critical"

Retorne APENAS um JSON válido:
{"title":"...","message":"...","type":"...","severity":"..."}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: contextText },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_alert",
              description: "Generate a structured project alert",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Emoji + short title" },
                  message: { type: "string", description: "Contextual description" },
                  type: { type: "string", enum: validTypes },
                  severity: { type: "string", enum: ["info", "warning", "critical"] },
                },
                required: ["title", "message", "type", "severity"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_alert" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-alert-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
