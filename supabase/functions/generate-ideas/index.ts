import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { chatCompletion } from "../_shared/ai-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    const { niche, objective, channel, pillar, format, frequency, tone } = await req.json();
    
    // LOVABLE_API_KEY handled in ai-client.ts

    const systemPrompt = `Você é um estrategista de conteúdo especializado em produção audiovisual premium para redes sociais.

CONTEXTO DA MARCA:
- Produtora audiovisual focada em filmes publicitários e vídeos institucionais de alta qualidade
- Tom: ${tone || 'premium, sofisticado, editorial, cinematográfico'}
- Público: empresas que valorizam storytelling visual de excelência

REGRAS:
1. Gere exatamente 10 ideias únicas e acionáveis
2. Cada ideia deve ter um hook matador (frase de abertura que prende atenção)
3. Foque em conteúdo que posicione a marca como autoridade
4. Considere a frequência de ${frequency || 3} posts por semana
5. Retorne APENAS JSON válido no formato especificado

PILARES DE CONTEÚDO:
- autoridade: Expertise, dicas técnicas, bastidores de equipamentos
- bastidores: Making of, processos criativos, dia a dia da produção
- cases: Resultados de projetos, depoimentos, antes/depois
- oferta: Serviços, promoções, CTAs diretos
- prova_social: Depoimentos, resultados, números
- educacional: Tutoriais, explicações, valor gratuito`;

    const userPrompt = `Gere 10 ideias de conteúdo com base nos seguintes parâmetros:
${niche ? `- Nicho/Segmento: ${niche}` : ''}
${objective ? `- Objetivo: ${objective}` : ''}
${channel ? `- Canal: ${channel}` : '- Canal: instagram'}
${pillar ? `- Pilar principal: ${pillar}` : ''}
${format ? `- Formato preferido: ${format}` : ''}

Retorne um JSON com a estrutura:
{
  "ideas": [
    {
      "title": "Título curto e impactante",
      "hook": "Frase de abertura que prende atenção nos primeiros 3 segundos",
      "pillar": "autoridade|bastidores|cases|oferta|prova_social|educacional",
      "channel": "instagram|tiktok|youtube|linkedin",
      "format": "reel|post|carousel|story|youtube",
      "target": "Público-alvo específico desta ideia",
      "score": 1-10 (relevância/potencial de engajamento)
    }
  ]
}`;

    const data = await chatCompletion({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "generate_content_ideas",
            description: "Generate structured content ideas for social media",
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
                      pillar: { type: "string", enum: ["autoridade", "bastidores", "cases", "oferta", "prova_social", "educacional"] },
                      channel: { type: "string", enum: ["instagram", "tiktok", "youtube", "linkedin", "email", "site"] },
                      format: { type: "string", enum: ["reel", "post", "carousel", "story", "short", "long", "ad", "youtube", "email"] },
                      target: { type: "string" },
                      score: { type: "number" }
                    },
                    required: ["title", "hook", "pillar", "channel", "format", "score"]
                  }
                }
              },
              required: ["ideas"]
            }
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "generate_content_ideas" } },
    });
    console.log("AI Response:", JSON.stringify(data, null, 2));

    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const ideas = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(ideas), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: try to parse content directly
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return new Response(jsonMatch[0], {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    throw new Error("Could not parse AI response");

  } catch (error) {
    console.error("generate-ideas error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
