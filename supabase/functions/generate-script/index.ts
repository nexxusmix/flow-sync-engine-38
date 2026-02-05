import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { idea, brandKit, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Você é um roteirista de conteúdo profissional para redes sociais de uma produtora premium de vídeo.
Sua tarefa é criar roteiros completos, shotlists, variações de legenda e hashtags.

${brandKit ? `BRAND KIT DO CLIENTE:
- Tom de voz: ${brandKit.tone_of_voice || 'Profissional e inspirador'}
- PODE: ${brandKit.do_list || 'Ser criativo, usar storytelling'}
- NÃO PODE: ${brandKit.dont_list || 'Ser genérico, usar clichês'}
` : ''}

REGRAS CRÍTICAS:
- Roteiros devem ser visuais, pensados para vídeo
- Shotlist deve ter cenas curtas e dinâmicas (3-7 segundos cada)
- Legendas devem ter hook forte na primeira linha
- Hashtags devem ser relevantes e não genéricas
- CTA deve ser claro e natural

Retorne APENAS o JSON válido, sem texto adicional.`;

    const userPrompt = `Crie um roteiro completo para este conteúdo:

IDEIA: ${idea.title}
${idea.hook ? `HOOK: ${idea.hook}` : ''}
${idea.angle ? `ÂNGULO: ${idea.angle}` : ''}
FORMATO: ${idea.format || 'reel'}
CANAL: ${idea.channel || 'instagram'}
PILAR: ${idea.pillar || 'bastidores'}
${context ? `CONTEXTO ADICIONAL: ${context}` : ''}

Gere:
1. Roteiro completo com falas e ações
2. Shotlist detalhada (cena por cena)
3. 3 variações de legenda (curta, média, longa)
4. 10-15 hashtags relevantes
5. CTA persuasivo`;

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
              name: "generate_script",
              description: "Generate a complete content script with shotlist and captions",
              parameters: {
                type: "object",
                properties: {
                  script: {
                    type: "string",
                    description: "The complete script with dialogue and actions"
                  },
                  shotlist: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        order: { type: "number" },
                        scene: { type: "string" },
                        duration: { type: "string" },
                        notes: { type: "string" }
                      },
                      required: ["order", "scene"]
                    }
                  },
                  caption_variations: {
                    type: "array",
                    items: { type: "string" },
                    description: "3 caption variations (short, medium, long)"
                  },
                  hashtags: {
                    type: "array",
                    items: { type: "string" },
                    description: "10-15 relevant hashtags"
                  },
                  cta: {
                    type: "string",
                    description: "Call to action"
                  }
                },
                required: ["script", "shotlist", "caption_variations", "hashtags", "cta"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_script" } }
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

    const generatedScript = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(generatedScript), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error generating script:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
