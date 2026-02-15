import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateProposalRequest {
  briefing: string;
  serviceType?: string;
  clientName?: string;
  references?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const sbAuth = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authErr } = await sbAuth.auth.getUser();
    if (authErr || !user) return new Response(JSON.stringify({ error: "Token inválido" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { briefing, serviceType, clientName, references } = await req.json() as GenerateProposalRequest;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Você é um consultor de vendas premium de uma produtora audiovisual.
Sua tarefa é gerar propostas comerciais elegantes, claras e persuasivas.

REGRAS:
- Linguagem profissional mas acessível
- Tom confiante sem ser arrogante
- Foco em benefícios e resultados
- Estrutura clara e organizada
- Nunca prometa o que não pode cumprir
- Seja específico nos entregáveis

Retorne APENAS JSON válido, sem texto adicional.`;

    const userPrompt = `Gere uma proposta comercial completa baseada neste briefing:

BRIEFING:
${briefing}

${serviceType ? `TIPO DE SERVIÇO: ${serviceType}` : ''}
${clientName ? `CLIENTE: ${clientName}` : ''}
${references ? `REFERÊNCIAS: ${references}` : ''}

Gere:

1. INTRODUÇÃO (2-3 parágrafos):
- Saudação personalizada
- Demonstração de entendimento do desafio
- Preview da solução

2. CONTEXTO (2 parágrafos):
- Análise do cenário do cliente
- Oportunidade identificada

3. ESCOPO (lista detalhada):
- O que está incluído
- O que NÃO está incluído

4. ENTREGÁVEIS (lista estruturada):
- Cada item com título, descrição e quantidade
- Seja específico (ex: "1 vídeo institucional de até 90 segundos")

5. CRONOGRAMA (fases com duração):
- Fase de pré-produção
- Fase de captação
- Fase de pós-produção
- Entrega final

6. TERMOS:
- Condições de pagamento sugeridas
- Validade da proposta
- Observações importantes

7. PRÓXIMOS PASSOS:
- Call to action claro
- Como proceder para aprovar`;

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
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_proposal_content",
              description: "Generate structured proposal content",
              parameters: {
                type: "object",
                properties: {
                  intro: {
                    type: "object",
                    properties: {
                      text: { type: "string" }
                    }
                  },
                  context: {
                    type: "object",
                    properties: {
                      text: { type: "string" }
                    }
                  },
                  scope: {
                    type: "object",
                    properties: {
                      included: { type: "array", items: { type: "string" } },
                      excluded: { type: "array", items: { type: "string" } }
                    }
                  },
                  deliverables: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        quantity: { type: "number" }
                      }
                    }
                  },
                  timeline: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        phase: { type: "string" },
                        description: { type: "string" },
                        duration_days: { type: "number" }
                      }
                    }
                  },
                  terms: {
                    type: "object",
                    properties: {
                      text: { type: "string" },
                      payment_suggestion: { type: "string" },
                      validity_days: { type: "number" }
                    }
                  },
                  cta: {
                    type: "object",
                    properties: {
                      text: { type: "string" }
                    }
                  },
                  suggested_title: { type: "string" }
                },
                required: ["intro", "context", "scope", "deliverables", "timeline", "terms", "cta"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_proposal_content" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again in a few seconds." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error("No valid response from AI");
    }

    const proposalContent = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(proposalContent), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error generating proposal:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
