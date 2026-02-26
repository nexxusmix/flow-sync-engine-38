import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { deal } = await req.json();
    if (!deal) {
      return new Response(JSON.stringify({ error: "deal is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `Analise este deal de CRM e retorne um lead score de 0 a 100 com justificativas.

Deal:
- Título: ${deal.title}
- Valor: R$ ${deal.value || 0}
- Estágio: ${deal.stage}
- Temperatura: ${deal.temperature || "não definida"}
- Fonte: ${deal.source || "não definida"}
- Dias sem atividade: ${deal.stale_days || 0}
- Empresa: ${deal.company || "não informada"}
- Próxima ação: ${deal.next_action || "nenhuma"}

Critérios de scoring:
- Valor alto (>10k) = +20pts
- Temperatura hot = +15pts, warm = +5pts, cold = -10pts
- Estágio avançado (proposta/negociação) = +20pts
- Tem próxima ação definida = +10pts
- Dias sem atividade > 7 = -15pts, > 14 = -25pts
- Fonte orgânica/indicação = +10pts`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "Você é um analista de CRM. Responda apenas com a tool call solicitada." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "score_lead",
              description: "Return lead score with reasons",
              parameters: {
                type: "object",
                properties: {
                  score: { type: "integer", description: "Score de 0 a 100" },
                  reasons: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        factor: { type: "string" },
                        impact: { type: "integer", description: "Pontos positivos ou negativos" },
                        detail: { type: "string" },
                      },
                      required: ["factor", "impact", "detail"],
                      additionalProperties: false,
                    },
                  },
                  suggestion: { type: "string", description: "Sugestão de próximo passo" },
                },
                required: ["score", "reasons", "suggestion"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "score_lead" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit excedido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error("No tool call response from AI");
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Lead scoring error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
