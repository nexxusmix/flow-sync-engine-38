import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BrandKit {
  name?: string;
  tone_of_voice?: string;
  do_list?: string;
  dont_list?: string;
  colors?: { hex: string; name: string }[];
}

interface GenerateRequest {
  briefId: string;
  inputText: string;
  brandKit?: BrandKit;
  packageType: 'full' | 'storyboard' | 'campaign' | 'weekly' | 'images_only';
  format?: string;
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

    const { briefId, inputText, brandKit, packageType, format } = await req.json() as GenerateRequest;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const brandContext = brandKit ? `
BRAND KIT DO CLIENTE: ${brandKit.name || 'Cliente'}
- Tom de voz: ${brandKit.tone_of_voice || 'Profissional e inspirador'}
- PODE: ${brandKit.do_list || 'Ser criativo, usar storytelling visual'}
- NÃO PODE: ${brandKit.dont_list || 'Ser genérico, usar clichês, texto na imagem'}
${brandKit.colors?.length ? `- Cores: ${brandKit.colors.map(c => c.name + ' ' + c.hex).join(', ')}` : ''}
` : '';

    const systemPrompt = `Você é um diretor criativo de uma produtora premium de vídeo.
Sua tarefa é transformar briefings em entregáveis de pré-produção completos e profissionais.

${brandContext}

REGRAS CRÍTICAS:
- Todo output deve ser narrativo, conceitual e orientado a storytelling
- Storyboards devem ser visuais e filmáveis
- Roteiros devem ter hooks fortes
- Moodboards devem ser coerentes com a identidade visual do cliente
- Prompts de imagem NUNCA devem conter texto
- Sempre adapte ao tom e restrições do brand kit

Retorne APENAS o JSON válido, sem texto adicional.`;

    const userPrompt = `Analise este briefing e gere um pacote criativo completo:

BRIEFING:
${inputText}

TIPO DE PACOTE: ${packageType}
${format ? `FORMATO: ${format}` : ''}

Gere:

1. CONCEITO NARRATIVO:
- premissa (uma frase que define a essência)
- promessa (o que o cliente ganha)
- tom (como deve soar)
- tema (assunto central)
- metafora_central (imagem ou conceito que guia tudo)
- big_idea (a grande ideia criativa)
- headline (título principal)
- subheadline (subtítulo)
- argumento_comercial (por que comprar, sem ser panfletário)

2. ROTEIRO (adapte ao formato):
- hook (abertura irresistível)
- desenvolvimento (corpo do conteúdo)
- cta (chamada para ação)
- duracao_estimada

3. STORYBOARD (5-10 cenas):
Para cada cena:
- scene_number
- title
- description (o que acontece visualmente)
- emotion (intenção emocional)
- camera (movimento de câmera)
- duration_sec
- audio (fala/música/efeito)
- image_prompt (prompt para gerar frame visual, SEM TEXTO NA IMAGEM)

4. SHOTLIST:
Lista de planos com:
- plano
- descricao
- lente_sugerida
- ambiente (interno/externo)
- luz (soft/hard/natural)
- prioridade (must-have/nice-to-have)

5. MOODBOARD:
- direção_de_arte
- paleta (cores derivadas do brand kit)
- referencias (tipos de imagem)
- materiais_texturas
- figurino
- props
- arquitetura_clima
- do_visual (o que fazer)
- dont_visual (o que evitar)
- mood_prompts (3-5 prompts para tiles do moodboard, SEM TEXTO)`;

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
              name: "generate_creative_package",
              description: "Generate a complete creative package from a brief",
              parameters: {
                type: "object",
                properties: {
                  concept: {
                    type: "object",
                    properties: {
                      premissa: { type: "string" },
                      promessa: { type: "string" },
                      tom: { type: "string" },
                      tema: { type: "string" },
                      metafora_central: { type: "string" },
                      big_idea: { type: "string" },
                      headline: { type: "string" },
                      subheadline: { type: "string" },
                      argumento_comercial: { type: "string" }
                    }
                  },
                  script: {
                    type: "object",
                    properties: {
                      hook: { type: "string" },
                      desenvolvimento: { type: "string" },
                      cta: { type: "string" },
                      duracao_estimada: { type: "string" }
                    }
                  },
                  storyboard: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        scene_number: { type: "number" },
                        title: { type: "string" },
                        description: { type: "string" },
                        emotion: { type: "string" },
                        camera: { type: "string" },
                        duration_sec: { type: "number" },
                        audio: { type: "string" },
                        image_prompt: { type: "string" }
                      }
                    }
                  },
                  shotlist: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        plano: { type: "string" },
                        descricao: { type: "string" },
                        lente_sugerida: { type: "string" },
                        ambiente: { type: "string" },
                        luz: { type: "string" },
                        prioridade: { type: "string" }
                      }
                    }
                  },
                  moodboard: {
                    type: "object",
                    properties: {
                      direcao_de_arte: { type: "string" },
                      paleta: { type: "array", items: { type: "string" } },
                      referencias: { type: "array", items: { type: "string" } },
                      materiais_texturas: { type: "string" },
                      figurino: { type: "string" },
                      props: { type: "string" },
                      arquitetura_clima: { type: "string" },
                      do_visual: { type: "array", items: { type: "string" } },
                      dont_visual: { type: "array", items: { type: "string" } },
                      mood_prompts: { type: "array", items: { type: "string" } }
                    }
                  }
                },
                required: ["concept", "script", "storyboard", "shotlist", "moodboard"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_creative_package" } }
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

    const creativePackage = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({
      briefId,
      ...creativePackage
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in creative studio:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
