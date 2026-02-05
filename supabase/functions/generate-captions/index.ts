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
    const { contentItem } = await req.json();
    
    if (!contentItem) {
      throw new Error("contentItem is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Você é um copywriter especializado em conteúdo para redes sociais de produtoras audiovisuais premium.

ESTILO DA MARCA:
- Tom: Sofisticado, editorial, cinematográfico
- Evite: Linguagem genérica, clichês de marketing digital, emojis excessivos
- Use: Linguagem visual, metáforas cinematográficas, storytelling

REGRAS:
1. Hook deve prender atenção em 3 segundos
2. Caption curta: 1-2 linhas diretas
3. Caption longa: Storytelling com CTA no final
4. CTA deve ser natural, não agressivo
5. Hashtags relevantes e não genéricas (máximo 10)
6. Se for vídeo, inclua roteiro com marcações de tempo

FORMATOS DE ROTEIRO:
- [00:00] Abertura/Hook
- [00:03] Desenvolvimento
- [00:15] Clímax/Revelação
- [00:25] CTA

Retorne APENAS JSON válido.`;

    const userPrompt = `Gere copy e roteiro para o seguinte conteúdo:

BRIEFING:
- Título: ${contentItem.title}
- Canal: ${contentItem.channel || 'instagram'}
- Formato: ${contentItem.format || 'reel'}
- Pilar: ${contentItem.pillar || 'autoridade'}
${contentItem.hook ? `- Hook existente: ${contentItem.hook}` : ''}
${contentItem.notes ? `- Notas: ${contentItem.notes}` : ''}

Retorne um JSON com a estrutura:
{
  "hook": "Frase de abertura impactante",
  "caption_short": "Caption curta de 1-2 linhas",
  "caption_long": "Caption longa com storytelling (3-5 parágrafos)",
  "cta": "Call to action natural",
  "hashtags": "#hashtag1 #hashtag2 ...",
  "script": "Roteiro com marcações de tempo (se aplicável)",
  "variations": [
    { "hook": "Variação 1 do hook", "caption_short": "Variação 1 da caption" },
    { "hook": "Variação 2 do hook", "caption_short": "Variação 2 da caption" },
    { "hook": "Variação 3 do hook", "caption_short": "Variação 3 da caption" }
  ]
}`;

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
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_caption_pack",
              description: "Generate captions, scripts and variations for content",
              parameters: {
                type: "object",
                properties: {
                  hook: { type: "string" },
                  caption_short: { type: "string" },
                  caption_long: { type: "string" },
                  cta: { type: "string" },
                  hashtags: { type: "string" },
                  script: { type: "string" },
                  variations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        hook: { type: "string" },
                        caption_short: { type: "string" }
                      },
                      required: ["hook", "caption_short"]
                    }
                  }
                },
                required: ["hook", "caption_short", "caption_long", "cta", "hashtags"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_caption_pack" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI Response:", JSON.stringify(data, null, 2));

    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const captions = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(captions), {
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
    console.error("generate-captions error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
