import "https://deno.land/std@0.168.0/dotenv/load.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { chatCompletion } from "../_shared/ai-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { project, tasks, revenues, stages } = await req.json();

    const systemPrompt = `Você é um analista de projetos audiovisuais especialista em gestão preditiva. Analise os dados do projeto e forneça insights acionáveis.

REGRAS:
- Seja direto e específico, sem generalidades
- Base suas análises em DADOS CONCRETOS fornecidos
- Probabilidades devem ser calculadas matematicamente
- Ações devem ser priorizadas por impacto financeiro e prazo
- Formato monetário: R$ X.XXX,XX`;

    const prompt = `Analise este projeto e retorne insights preditivos:

PROJETO: ${JSON.stringify(project)}

TAREFAS (${tasks?.length || 0} total):
${JSON.stringify(tasks?.slice(0, 50) || [])}

RECEITAS: ${JSON.stringify(revenues || [])}

ETAPAS: ${JSON.stringify(stages || [])}

Use a ferramenta save_project_insights para retornar sua análise estruturada.`;

    const result = await chatCompletion({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      model: "google/gemini-2.5-flash",
      temperature: 0.3,
      tools: [
        {
          type: "function",
          function: {
            name: "save_project_insights",
            description: "Salva a análise preditiva do projeto",
            parameters: {
              type: "object",
              properties: {
                executive_summary: {
                  type: "string",
                  description: "Resumo executivo de 2-3 frases sobre o estado do projeto",
                },
                risk_assessment: {
                  type: "object",
                  properties: {
                    delay_probability: { type: "number", description: "Probabilidade de atraso 0-100%" },
                    delay_severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
                    financial_risk: { type: "string", enum: ["low", "medium", "high", "critical"] },
                    client_health: { type: "string", enum: ["healthy", "attention", "at_risk", "critical"] },
                    risks: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          type: { type: "string" },
                          severity: { type: "string", enum: ["red", "yellow", "green"] },
                          title: { type: "string" },
                          description: { type: "string" },
                        },
                        required: ["type", "severity", "title", "description"],
                      },
                    },
                  },
                  required: ["delay_probability", "delay_severity", "financial_risk", "client_health", "risks"],
                },
                completion_forecast: {
                  type: "object",
                  properties: {
                    predicted_date: { type: "string", description: "Data prevista ISO" },
                    confidence: { type: "string", enum: ["low", "medium", "high"] },
                    days_delta: { type: "number", description: "Dias de diferença vs prazo (positivo = atraso)" },
                  },
                  required: ["predicted_date", "confidence", "days_delta"],
                },
                action_items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      priority: { type: "number" },
                      title: { type: "string" },
                      reason: { type: "string" },
                      impact_area: { type: "string" },
                    },
                    required: ["priority", "title", "reason", "impact_area"],
                  },
                },
                bottlenecks: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      stage: { type: "string" },
                      issue: { type: "string" },
                      avg_days_stuck: { type: "number" },
                    },
                    required: ["stage", "issue"],
                  },
                },
              },
              required: ["executive_summary", "risk_assessment", "completion_forecast", "action_items", "bottlenecks"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "save_project_insights" } },
    });

    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No structured response from AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const insights = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-project-insights error:", error);

    if (error.message?.includes("429") || error.message?.includes("rate")) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Tente novamente em alguns segundos." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (error.message?.includes("402")) {
      return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: error.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
