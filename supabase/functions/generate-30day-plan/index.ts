import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const { brandKit, objective, postsPerWeek = 4, existingIdeas = [] } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const totalPosts = postsPerWeek * 4; // 4 weeks

    const systemPrompt = `Você é um estrategista de conteúdo para redes sociais de uma produtora premium de vídeo.
Sua tarefa é criar um plano completo de ${totalPosts} ideias de conteúdo para 30 dias.

${brandKit ? `BRAND KIT:
- Tom de voz: ${brandKit.tone_of_voice || 'Profissional e inspirador'}
- PODE: ${brandKit.do_list || 'Ser criativo, usar storytelling'}
- NÃO PODE: ${brandKit.dont_list || 'Ser genérico, usar clichês'}
` : ''}

REGRAS CRÍTICAS:
- Distribuir uniformemente entre os pilares (autoridade, bastidores, cases, oferta, prova_social, educacional)
- Variar formatos (reel 60%, carousel 25%, post 15%)
- Hooks devem ser irresistíveis (gerar curiosidade)
- Cada ideia deve ser única e específica
- Scores de 1-10 baseados no potencial de engajamento

${existingIdeas.length > 0 ? `IDEIAS JÁ EXISTENTES (evitar repetição):
${existingIdeas.map((i: any) => i.title).join('\n')}` : ''}

Retorne APENAS o JSON válido.`;

    const userPrompt = `Crie ${totalPosts} ideias de conteúdo para os próximos 30 dias.

${objective ? `OBJETIVO: ${objective}` : 'OBJETIVO: Aumentar engajamento e mostrar autoridade'}

Para cada ideia, defina:
- title: Título criativo e específico
- hook: Frase de abertura irresistível
- angle: Ângulo único do conteúdo
- pillar: Pilar de conteúdo
- format: Formato ideal
- channel: Canal principal
- score: Potencial de engajamento (1-10)

Distribua os pilares de forma equilibrada ao longo do mês.`;

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
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_content_plan",
              description: "Generate a 30-day content plan with multiple ideas",
              parameters: {
                type: "object",
                properties: {
                  ideas: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        hook: { type: "string" },
                        angle: { type: "string" },
                        pillar: { 
                          type: "string",
                          enum: ["autoridade", "bastidores", "cases", "oferta", "prova_social", "educacional"]
                        },
                        format: {
                          type: "string",
                          enum: ["reel", "carousel", "post", "story", "youtube", "short"]
                        },
                        channel: {
                          type: "string",
                          enum: ["instagram", "tiktok", "youtube", "linkedin"]
                        },
                        score: { type: "number", minimum: 1, maximum: 10 }
                      },
                      required: ["title", "hook", "pillar", "format", "channel", "score"]
                    }
                  }
                },
                required: ["ideas"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_content_plan" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
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

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error generating plan:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
