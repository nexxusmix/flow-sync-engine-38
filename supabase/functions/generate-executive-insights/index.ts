import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { metrics, projects, tasks, revenues, deals } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `Você é um analista executivo de negócios para uma produtora audiovisual (SQUAD).
Analise os dados operacionais, financeiros e de projetos fornecidos e retorne uma análise estruturada usando a ferramenta save_executive_insights.

Regras:
- Seja direto, pragmático e focado em ação
- Identifique riscos REAIS baseados nos números (não invente problemas)
- Priorize ações pelo impacto financeiro e urgência
- Severity: "red" = crítico/imediato, "yellow" = atenção/monitorar, "green" = ok
- Categories de risco: prazo, financeiro, sobrecarga, pipeline, gargalo
- impact_area: financeiro, operacional, comercial, capacidade
- Escreva tudo em português brasileiro
- O executive_summary deve ter no máximo 3 frases
- Gere entre 2-6 riscos e 2-4 ações`;

    const userPrompt = `Dados da empresa SQUAD:

MÉTRICAS:
- Score de Produtividade: ${metrics.productivityScore}/100
- Velocity: ${metrics.velocityPerDay?.toFixed(1)}/dia
- Tarefas Pendentes: ${metrics.tasksPending}
- Tarefas Concluídas (mês): ${metrics.tasksCompletedThisMonth}
- Projetos Ativos: ${metrics.projectsActive}
- Projetos em Risco: ${metrics.projectsAtRisk}
- Projetos Bloqueados: ${metrics.projectsBlocked}
- Receita do Mês: R$ ${metrics.revenueCurrentMonth?.toFixed(2)}
- Despesas do Mês: R$ ${metrics.expenseCurrentMonth?.toFixed(2)}
- Saldo Atual: R$ ${metrics.balanceCurrent?.toFixed(2)}
- A Receber (pendente): R$ ${metrics.pendingRevenue?.toFixed(2)}
- Vencido: R$ ${metrics.overdueRevenue?.toFixed(2)}
- Pipeline CRM: R$ ${metrics.pipelineValue?.toFixed(2)}
- Forecast CRM: R$ ${metrics.forecast?.toFixed(2)}
- Deals Ativos: ${metrics.dealsActive}
- Taxa de Conversão: ${metrics.conversionRate?.toFixed(1)}%
- Health Score Médio: ${metrics.avgHealthScore}%
- Backlog Clear Date: ${metrics.backlogClearDate || 'N/A'}
- Cash Runway: ${metrics.cashRunwayMonths?.toFixed(1) || 'N/A'} meses
- Burn Rate Mensal: R$ ${metrics.burnRateMonthly?.toFixed(2) || '0'}

PROJETOS ATIVOS (resumo):
${(projects || []).slice(0, 10).map((p: any) => `- ${p.name} | Cliente: ${p.client_name} | Health: ${p.health_score} | Stage: ${p.stage_current}`).join('\n')}

TAREFAS PENDENTES (resumo): ${(tasks || []).filter((t: any) => t.status !== 'done').length} pendentes de ${(tasks || []).length} total

DEALS ATIVOS (resumo):
${(deals || []).filter((d: any) => d.stage_key !== 'lost').slice(0, 8).map((d: any) => `- ${d.title || 'Deal'} | Stage: ${d.stage_key} | Valor: R$ ${(d.value || 0).toFixed(2)}`).join('\n')}

Analise e retorne insights executivos.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "save_executive_insights",
              description: "Salvar análise executiva estruturada",
              parameters: {
                type: "object",
                properties: {
                  executive_summary: { type: "string", description: "Resumo executivo em 2-3 frases" },
                  risk_radar: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", enum: ["prazo", "financeiro", "sobrecarga", "pipeline", "gargalo"] },
                        severity: { type: "string", enum: ["red", "yellow", "green"] },
                        title: { type: "string" },
                        description: { type: "string" },
                        metric: { type: "string" },
                      },
                      required: ["type", "severity", "title", "description"],
                      additionalProperties: false,
                    },
                  },
                  action_items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        priority: { type: "number", description: "1=highest" },
                        title: { type: "string" },
                        reason: { type: "string" },
                        impact_area: { type: "string", enum: ["financeiro", "operacional", "comercial", "capacidade"] },
                      },
                      required: ["priority", "title", "reason", "impact_area"],
                      additionalProperties: false,
                    },
                  },
                  bottlenecks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        area: { type: "string" },
                        description: { type: "string" },
                        avg_days_stuck: { type: "number" },
                      },
                      required: ["area", "description"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["executive_summary", "risk_radar", "action_items"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "save_executive_insights" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const text = await response.text();
      console.error("AI gateway error:", status, text);
      
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No tool call in response");
    }

    const insights = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-executive-insights error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
